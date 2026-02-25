// controllers/componentController.js
const pool = require('../config/db');

const getAllComponents = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM components ORDER BY id ASC'
    );
    res.status(200).json({
      message: 'Components fetched successfully',
      count: result.rows.length,
      components: result.rows
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ error: 'Failed to fetch components', details: error.message });
  }
};

const addComponent = async (req, res) => {
  try {
    const { name, part_number, current_stock, monthly_required_quantity } = req.body;

    if (!name || !part_number) {
      return res.status(400).json({ error: 'Name and part_number are required.' });
    }

    const result = await pool.query(
      `INSERT INTO components (name, part_number, current_stock, monthly_required_quantity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        String(name).trim(),
        String(part_number).trim(),
        parseInt(current_stock, 10) || 0,
        parseInt(monthly_required_quantity, 10) || 0
      ]
    );

    res.status(201).json({
      message: 'Component added successfully',
      component: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Component with this part number already exists.' });
    }
    console.error('Error adding component:', error);
    res.status(500).json({ error: 'Failed to add component', details: error.message });
  }
};

const updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, part_number, current_stock, monthly_required_quantity } = req.body;

    const existing = await pool.query('SELECT * FROM components WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found.' });
    }

    const result = await pool.query(
      `UPDATE components 
       SET name = COALESCE($1, name),
           part_number = COALESCE($2, part_number),
           current_stock = COALESCE($3, current_stock),
           monthly_required_quantity = COALESCE($4, monthly_required_quantity)
       WHERE id = $5 RETURNING *`,
      [
        name ? String(name).trim() : null,
        part_number ? String(part_number).trim() : null,
        current_stock !== undefined ? parseInt(current_stock, 10) : null,
        monthly_required_quantity !== undefined ? parseInt(monthly_required_quantity, 10) : null,
        id
      ]
    );

    res.status(200).json({
      message: 'Component updated successfully',
      component: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Part number already exists.' });
    }
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component', details: error.message });
  }
};

const deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM components WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Component not found.' });
    }

    // Delete related pcb_components entries first
    await pool.query('DELETE FROM pcb_components WHERE component_id = $1', [id]);
    await pool.query('DELETE FROM components WHERE id = $1', [id]);

    res.status(200).json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component', details: error.message });
  }
};

module.exports = {
  getAllComponents,
  addComponent,
  updateComponent,
  deleteComponent
};
