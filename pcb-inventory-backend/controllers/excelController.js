// controllers/excelController.js
const ExcelJS = require('exceljs');
const pool = require('../config/db');
const fs = require('fs');

// ── Fuzzy header matching keywords ──
const PART_NUMBER_KEYWORDS = ['part', 'spare', 'part no', 'part_number', 'partno', 'part number', 'spare part code', 'spare part', 'component code'];
const QUANTITY_KEYWORDS = ['count', 'qty', 'quantity', 'quantity_required', 'quantity required', 'required', 'units', 'amount'];
const PCB_NAME_KEYWORDS = ['pcb', 'pcb name', 'pcb_name', 'board', 'model', 'product'];
const NAME_KEYWORDS = ['name', 'component', 'component name', 'description', 'item'];

/**
 * Fuzzy-match a header cell against a list of keywords.
 * Returns true if the normalized header contains any keyword.
 */
function matchesKeywords(headerText, keywords) {
  const normalized = String(headerText || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  return keywords.some((kw) => normalized === kw || normalized.includes(kw));
}

/**
 * Find column index by fuzzy-matching header row against keyword lists.
 */
function findColumn(headerRow, keywords) {
  let found = null;
  headerRow.eachCell((cell, colNumber) => {
    if (!found && matchesKeywords(cell.value, keywords)) {
      found = colNumber;
    }
  });
  return found;
}

/**
 * POST /excel/import-components
 * Accepts .xlsx file, parses rows, upserts into components table.
 * Returns { inserted, updated }
 */
const importComponents = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'No worksheet found in Excel file' });
    }

    await client.query('BEGIN');

    let inserted = 0;
    let updated = 0;

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      const componentName = row.getCell(1).value;
      const partNumber = row.getCell(2).value;
      const currentStock = row.getCell(3).value;
      const monthlyRequired = row.getCell(4).value;

      // Skip empty rows
      if (!componentName && !partNumber && !currentStock && !monthlyRequired) {
        continue;
      }

      // Part number is required
      if (!partNumber) {
        continue;
      }

      const partNumberStr = String(partNumber).trim();

      // Check if component already exists
      const checkResult = await client.query(
        'SELECT id FROM components WHERE part_number = $1',
        [partNumberStr]
      );

      if (checkResult.rows.length > 0) {
        // Update existing component
        await client.query(
          `UPDATE components 
           SET name = $1, current_stock = $2, monthly_required_quantity = $3 
           WHERE part_number = $4`,
          [
            componentName ? String(componentName).trim() : '',
            parseInt(currentStock, 10) || 0,
            parseInt(monthlyRequired, 10) || 0,
            partNumberStr
          ]
        );
        updated++;
      } else {
        // Insert new component
        await client.query(
          `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity) 
           VALUES ($1, $2, $3, $4)`,
          [
            componentName ? String(componentName).trim() : '',
            partNumberStr,
            parseInt(currentStock, 10) || 0,
            parseInt(monthlyRequired, 10) || 0
          ]
        );
        inserted++;
      }
    }

    await client.query('COMMIT');

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

    res.status(200).json({
      message: 'Components imported successfully',
      inserted,
      updated,
      total: inserted + updated
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing components:', error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ error: 'Failed to import components', details: error.message });
  } finally {
    client.release();
  }
};

/**
 * POST /excel/import-bom
 * Accepts .xlsx file, auto-detects columns via fuzzy header matching.
 * Auto-creates missing components with safe defaults.
 * Returns detailed summary: { rowsRead, createdComponents, mappingsInserted, skippedRows }
 */
const importBOM = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    // Load the first worksheet automatically
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'No worksheet found in Excel file.' });
    }

    // ── Fuzzy-match header columns ──
    const headerRow = worksheet.getRow(1);

    const partNumberCol = findColumn(headerRow, PART_NUMBER_KEYWORDS);
    const quantityCol = findColumn(headerRow, QUANTITY_KEYWORDS);
    const pcbNameCol = findColumn(headerRow, PCB_NAME_KEYWORDS);
    const nameCol = findColumn(headerRow, NAME_KEYWORDS);

    if (!partNumberCol) {
      return res.status(400).json({
        error: 'Could not detect a "Part Number" column. Expected headers containing: ' + PART_NUMBER_KEYWORDS.join(', ')
      });
    }
    if (!quantityCol) {
      return res.status(400).json({
        error: 'Could not detect a "Quantity" column. Expected headers containing: ' + QUANTITY_KEYWORDS.join(', ')
      });
    }

    // Log detected columns for debugging
    console.log(`BOM Import — Detected columns: partNumber=${partNumberCol}, quantity=${quantityCol}, pcbName=${pcbNameCol || 'N/A'}, name=${nameCol || 'N/A'}`);

    await client.query('BEGIN');

    // ── Counters for summary ──
    let rowsRead = 0;
    let createdComponents = 0;
    let mappingsInserted = 0;
    let skippedRows = 0;

    // ── PCB cache: pcbName → pcbId ──
    const pcbCache = {};

    async function getOrCreatePCB(name) {
      const pcbName = String(name || 'Imported PCB').trim();
      if (pcbCache[pcbName]) return pcbCache[pcbName];

      const result = await client.query('SELECT id FROM pcbs WHERE pcb_name = $1', [pcbName]);
      if (result.rows.length > 0) {
        pcbCache[pcbName] = result.rows[0].id;
      } else {
        const insert = await client.query('INSERT INTO pcbs (pcb_name) VALUES ($1) RETURNING id', [pcbName]);
        pcbCache[pcbName] = insert.rows[0].id;
      }
      return pcbCache[pcbName];
    }

    // ── Process each data row ──
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      rowsRead++;

      const partNumber = row.getCell(partNumberCol).value;
      const quantityRaw = row.getCell(quantityCol).value;

      // Skip rows where part number is missing
      if (!partNumber) {
        skippedRows++;
        continue;
      }

      // Parse quantity — skip if invalid or zero
      const qty = parseInt(quantityRaw, 10);
      if (!qty || qty <= 0) {
        skippedRows++;
        continue;
      }

      const partNumberStr = String(partNumber).trim();

      // Skip obviously invalid rows (e.g. "Grand Total", summary rows)
      if (/^(grand total|total|sum|subtotal)$/i.test(partNumberStr)) {
        skippedRows++;
        continue;
      }

      // ── Resolve PCB ──
      const pcbNameValue = pcbNameCol ? row.getCell(pcbNameCol).value : null;
      const pcbId = await getOrCreatePCB(pcbNameValue || 'Imported PCB');

      // ── Resolve component (find or auto-create) ──
      const componentResult = await client.query(
        'SELECT id FROM components WHERE part_number = $1',
        [partNumberStr]
      );

      let componentId;
      if (componentResult.rows.length === 0) {
        // Auto-create component with safe defaults
        const compName = nameCol ? String(row.getCell(nameCol).value || partNumberStr).trim() : partNumberStr;
        const insertComp = await client.query(
          `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [compName, partNumberStr, 0, 0]
        );
        componentId = insertComp.rows[0].id;
        createdComponents++;
      } else {
        componentId = componentResult.rows[0].id;
      }

      // ── Insert BOM mapping (skip duplicates) ──
      const duplicateCheck = await client.query(
        'SELECT id FROM pcb_components WHERE pcb_id = $1 AND component_id = $2',
        [pcbId, componentId]
      );

      if (duplicateCheck.rows.length === 0) {
        await client.query(
          'INSERT INTO pcb_components (pcb_id, component_id, quantity_required) VALUES ($1, $2, $3)',
          [pcbId, componentId, qty]
        );
        mappingsInserted++;
      } else {
        // Update existing mapping quantity
        await client.query(
          'UPDATE pcb_components SET quantity_required = $1 WHERE pcb_id = $2 AND component_id = $3',
          [qty, pcbId, componentId]
        );
      }
    }

    await client.query('COMMIT');

    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

    res.status(200).json({
      message: 'BOM imported successfully',
      rowsRead,
      createdComponents,
      mappingsInserted,
      skippedRows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing BOM:', error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ error: 'Failed to import BOM', details: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  importComponents,
  importBOM
};