'use strict';
const express = require('express');
const { body } = require('express-validator');
const { login, me } = require('../controllers/authController');
const { verifyJWT } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);

router.get('/me', verifyJWT, me);

module.exports = router;
