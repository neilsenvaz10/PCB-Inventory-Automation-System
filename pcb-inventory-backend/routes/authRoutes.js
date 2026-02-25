// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { login, register } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name')
      .notEmpty().withMessage('Name is required.'),
    body('email')
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.'),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email')
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.'),
    body('password')
      .notEmpty().withMessage('Password is required.')
  ],
  validate,
  login
);

module.exports = router;
