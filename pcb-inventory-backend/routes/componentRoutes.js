// routes/componentRoutes.js
const express = require('express');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllComponents,
  addComponent,
  updateComponent,
  deleteComponent
} = require('../controllers/componentController');

const router = express.Router();

router.get('/', authMiddleware, getAllComponents);
router.post('/', authMiddleware, adminOnly, addComponent);
router.put('/:id', authMiddleware, adminOnly, updateComponent);
router.delete('/:id', authMiddleware, adminOnly, deleteComponent);

module.exports = router;
