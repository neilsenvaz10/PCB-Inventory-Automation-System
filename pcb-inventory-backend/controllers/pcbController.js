// controllers/pcbController.js
const pool = require('../config/db');

const getAllPCBs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'pcb_component_id', pc.id,
              'component_id', c.id,
              'component_name', c.name,
              'part_number', c.part_number,
              'quantity_required', pc.quantity_required
            )
          ) FILTER (WHERE c.id IS NOT NULL), '[]'
        ) AS components
      FROM pcbs p
      LEFT JOIN pcb_components pc ON p.id = pc.pcb_id
      LEFT JOIN components c ON pc.component_id = c.id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    res.status(200).json({
      message: 'PCBs fetched successfully',
      count: result.rows.length,
      pcbs: result.rows
    });
  } catch (error) {
    console.error('Error fetching PCBs:', error);
    res.status(500).json({ error: 'Failed to fetch PCBs', details: error.message });
  }
};

const createPCB = async (req, res) => {
  try {
    const { pcb_name, description } = req.body;

    if (!pcb_name) {
      return res.status(400).json({ error: 'PCB name is required.' });
    }

    const result = await pool.query(
      'INSERT INTO pcbs (pcb_name, description) VALUES ($1, $2) RETURNING *',
      [String(pcb_name).trim(), description ? String(description).trim() : null]
    );

    res.status(201).json({
      message: 'PCB created successfully',
      pcb: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'PCB with this name already exists.' });
    }
    console.error('Error creating PCB:', error);
    res.status(500).json({ error: 'Failed to create PCB', details: error.message });
  }
};

const deletePCB = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM pcbs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'PCB not found.' });
    }

    // Delete related pcb_components entries first
    await pool.query('DELETE FROM pcb_components WHERE pcb_id = $1', [id]);
    await pool.query('DELETE FROM pcbs WHERE id = $1', [id]);

    res.status(200).json({ message: 'PCB deleted successfully' });
  } catch (error) {
    console.error('Error deleting PCB:', error);
    res.status(500).json({ error: 'Failed to delete PCB', details: error.message });
  }
};

const addBOMRow = async (req, res) => {
  try {
    const { id } = req.params; // pcb_id
    const { component_id, quantity_required } = req.body;
    if (!component_id || !quantity_required) {
      return res.status(400).json({ error: 'component_id and quantity_required are required.' });
    }
    const result = await pool.query(
      'INSERT INTO pcb_components (pcb_id, component_id, quantity_required) VALUES ($1, $2, $3) RETURNING *',
      [id, component_id, quantity_required]
    );
    res.status(201).json({ message: 'BOM row added', row: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'This component is already in the BOM.' });
    }
    console.error('Error adding BOM row:', error);
    res.status(500).json({ error: 'Failed to add BOM row', details: error.message });
  }
};

const removeBOMRow = async (req, res) => {
  try {
    const { id, rowId } = req.params;
    await pool.query('DELETE FROM pcb_components WHERE pcb_id = $1 AND id = $2', [id, rowId]);
    res.status(200).json({ message: 'BOM row removed' });
  } catch (error) {
    console.error('Error removing BOM row:', error);
    res.status(500).json({ error: 'Failed to remove BOM row', details: error.message });
  }
};

const updateBOMRow = async (req, res) => {
  try {
    const { id, rowId } = req.params;
    const { quantity_required } = req.body;
    if (!quantity_required || quantity_required <= 0) {
      return res.status(400).json({ error: 'Valid quantity_required is required.' });
    }
    const result = await pool.query(
      'UPDATE pcb_components SET quantity_required = $1 WHERE pcb_id = $2 AND id = $3 RETURNING *',
      [quantity_required, id, rowId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'BOM row not found.' });
    }
    res.status(200).json({ message: 'BOM row updated', row: result.rows[0] });
  } catch (error) {
    console.error('Error updating BOM row:', error);
    res.status(500).json({ error: 'Failed to update BOM row', details: error.message });
  }
};

module.exports = {
  getAllPCBs,
  createPCB,
  deletePCB,
  addBOMRow,
  removeBOMRow,
  updateBOMRow
};
