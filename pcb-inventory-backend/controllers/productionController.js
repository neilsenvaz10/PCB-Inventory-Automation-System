// controllers/productionController.js
const pool = require('../config/db');

const addProduction = async (req, res) => {
  const client = await pool.connect();

  try {
    const { pcb_id, quantity_produced } = req.body;

    // ── Validation ──
    if (!pcb_id || !quantity_produced) {
      return res.status(400).json({ error: 'pcb_id and quantity_produced are required.' });
    }
    if (quantity_produced <= 0) {
      return res.status(400).json({ error: 'quantity_produced must be greater than 0.' });
    }

    // Verify PCB exists (outside transaction — read-only)
    const pcbCheck = await client.query('SELECT id, pcb_name FROM pcbs WHERE id = $1', [pcb_id]);
    if (pcbCheck.rows.length === 0) {
      return res.status(404).json({ error: 'PCB not found.' });
    }

    // ── BEGIN TRANSACTION ──
    await client.query('BEGIN');

    // Step 1: Fetch BOM for this PCB
    const bomResult = await client.query(
      `SELECT pc.component_id, pc.quantity_required
       FROM pcb_components pc
       WHERE pc.pcb_id = $1`,
      [pcb_id]
    );

    if (bomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No BOM found for this PCB. Import BOM first.' });
    }

    // Step 2: Lock each component row with FOR UPDATE and check stock
    const insufficientComponents = [];
    const consumptionPlan = [];

    for (const bom of bomResult.rows) {
      const required = bom.quantity_required * quantity_produced;

      // Row-level lock — prevents concurrent modifications
      const lockResult = await client.query(
        `SELECT id, name, part_number, current_stock, monthly_required_quantity
         FROM components WHERE id = $1 FOR UPDATE`,
        [bom.component_id]
      );

      if (lockResult.rows.length === 0) {
        insufficientComponents.push({
          component_id: bom.component_id,
          component: 'Unknown (deleted)',
          available: 0,
          required,
          shortage: required
        });
        continue;
      }

      const comp = lockResult.rows[0];

      if (comp.current_stock < required) {
        insufficientComponents.push({
          component: comp.name,
          part_number: comp.part_number,
          available: comp.current_stock,
          required,
          shortage: required - comp.current_stock
        });
      }

      consumptionPlan.push({
        component_id: comp.id,
        name: comp.name,
        required,
        current_stock: comp.current_stock,
        monthly_required_quantity: comp.monthly_required_quantity
      });
    }

    // ── If ANY component has insufficient stock → ROLLBACK ──
    if (insufficientComponents.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Insufficient stock for production.',
        insufficientComponents
      });
    }

    // Step 3: Deduct stock from each component
    for (const item of consumptionPlan) {
      await client.query(
        'UPDATE components SET current_stock = current_stock - $1 WHERE id = $2',
        [item.required, item.component_id]
      );
    }

    // Step 4: Insert production entry
    const prodResult = await client.query(
      'INSERT INTO production_entries (pcb_id, quantity_produced) VALUES ($1, $2) RETURNING id',
      [pcb_id, quantity_produced]
    );

    // Step 5: Insert consumption history for each component
    for (const item of consumptionPlan) {
      await client.query(
        'INSERT INTO consumption_history (component_id, pcb_id, quantity_used) VALUES ($1, $2, $3)',
        [item.component_id, pcb_id, item.required]
      );
    }

    // Step 6: Check procurement triggers
    for (const item of consumptionPlan) {
      const newStock = item.current_stock - item.required;
      const threshold = 0.2 * item.monthly_required_quantity;

      if (newStock < threshold) {
        const triggerCheck = await client.query(
          "SELECT id FROM procurement_triggers WHERE component_id = $1 AND status = 'OPEN'",
          [item.component_id]
        );

        if (triggerCheck.rows.length === 0) {
          await client.query(
            'INSERT INTO procurement_triggers (component_id) VALUES ($1)',
            [item.component_id]
          );
        }
      }
    }

    // ── COMMIT ──
    await client.query('COMMIT');

    res.status(200).json({
      message: 'Production recorded successfully',
      production_id: prodResult.rows[0].id,
      pcb: pcbCheck.rows[0].pcb_name,
      quantity_produced,
      components_consumed: consumptionPlan.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording production:', error);
    res.status(500).json({ error: 'Failed to record production', details: error.message });
  } finally {
    client.release();
  }
};

const getProductionHistory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pe.*, p.pcb_name
      FROM production_entries pe
      LEFT JOIN pcbs p ON pe.pcb_id = p.id
      ORDER BY pe.production_date DESC
    `);
    res.status(200).json({
      message: 'Production history fetched successfully',
      count: result.rows.length,
      entries: result.rows
    });
  } catch (error) {
    console.error('Error fetching production history:', error);
    res.status(500).json({ error: 'Failed to fetch production history', details: error.message });
  }
};

module.exports = { addProduction, getProductionHistory };
