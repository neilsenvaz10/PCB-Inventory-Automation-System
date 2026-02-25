// routes/analyticsRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getLowStock, getTopConsumed } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/low-stock', authMiddleware, getLowStock);
router.get('/top-consumed', authMiddleware, getTopConsumed);

module.exports = router;
