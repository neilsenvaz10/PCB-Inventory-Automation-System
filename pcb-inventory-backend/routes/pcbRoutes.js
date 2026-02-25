// routes/pcbRoutes.js
const express = require('express');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const { getAllPCBs, createPCB, deletePCB, addBOMRow, removeBOMRow, updateBOMRow } = require('../controllers/pcbController');

const router = express.Router();

router.get('/', authMiddleware, getAllPCBs);
router.post('/', authMiddleware, adminOnly, createPCB);
router.delete('/:id', authMiddleware, adminOnly, deletePCB);

// BOM row management
router.post('/:id/bom', authMiddleware, adminOnly, addBOMRow);
router.put('/:id/bom/:rowId', authMiddleware, adminOnly, updateBOMRow);
router.delete('/:id/bom/:rowId', authMiddleware, adminOnly, removeBOMRow);

module.exports = router;
