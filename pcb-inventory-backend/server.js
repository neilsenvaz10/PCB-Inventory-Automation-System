// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const excelRoutes = require('./routes/excelRoutes');
const authRoutes = require('./routes/authRoutes');
const componentRoutes = require('./routes/componentRoutes');
const pcbRoutes = require('./routes/pcbRoutes');
const productionRoutes = require('./routes/productionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/excel', excelRoutes);
app.use('/components', componentRoutes);
app.use('/pcbs', pcbRoutes);
app.use('/production', productionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/health', healthRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ status: 'PCB Inventory Backend is running' });
});

// Global error handler (must be AFTER all routes)
app.use(errorHandler);

// ── Startup: Auto-initialize schema if tables don't exist ──
async function initDatabase() {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'components'
       ) AS "exists"`
    );

    if (result.rows[0].exists) {
      console.log('✅ Database schema already initialized — "components" table found.');
    } else {
      console.log('⚠️  "components" table not found. Running schema.sql...');
      const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(schema);
      console.log('✅ Schema initialized successfully from sql/schema.sql');
    }
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
}

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

module.exports = app;