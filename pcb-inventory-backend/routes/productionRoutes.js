// routes/productionRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { addProduction, getProductionHistory } = require('../controllers/productionController');

const router = express.Router();

router.get('/', authMiddleware, getProductionHistory);

router.post(
  '/add',
  authMiddleware,
  [
    body('pcb_id')
      .notEmpty().withMessage('pcb_id is required.')
      .isInt({ min: 1 }).withMessage('pcb_id must be a positive integer.'),
    body('quantity_produced')
      .notEmpty().withMessage('quantity_produced is required.')
      .isInt({ min: 1 }).withMessage('quantity_produced must be a positive integer.')
  ],
  validate,
  addProduction
);

module.exports = router;
