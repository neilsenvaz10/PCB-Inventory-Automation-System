// routes/healthRoutes.js
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    uptime: process.uptime()
  });
});

module.exports = router;
