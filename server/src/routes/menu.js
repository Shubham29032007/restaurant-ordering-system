'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const { listPublic, listAll, create, update, remove } = require('../controllers/menuController');
const { verifyJWT, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const itemValidators = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('category').trim().notEmpty().withMessage('Category required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('basePrice must be a non-negative number'),
];

// Public
router.get('/', listPublic);

// Admin-only
router.get('/all', verifyJWT, requireRole('ADMIN'), listAll);

router.post(
  '/',
  verifyJWT, requireRole('ADMIN'),
  itemValidators, validate,
  create
);

router.patch(
  '/:id',
  verifyJWT, requireRole('ADMIN'),
  [param('id').isMongoId()], validate,
  update
);

router.delete(
  '/:id',
  verifyJWT, requireRole('ADMIN'),
  [param('id').isMongoId()], validate,
  remove
);

module.exports = router;
