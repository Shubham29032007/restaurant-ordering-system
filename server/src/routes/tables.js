'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const { create, list, update, verifyQR, regenerateQR, qrSheet } = require('../controllers/tableController');
const { verifyJWT, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Specific routes before parameterized /:id
router.get('/qr/:qrToken', verifyQR);
router.get('/qr-sheet', verifyJWT, requireRole('ADMIN'), qrSheet);

router.get('/', verifyJWT, requireRole('ADMIN', 'STAFF'), list);

router.post(
  '/',
  verifyJWT, requireRole('ADMIN'),
  [
    body('number').isInt({ min: 1 }).withMessage('Table number must be a positive integer'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  ],
  validate,
  create
);

router.patch(
  '/:id',
  verifyJWT, requireRole('ADMIN'),
  [
    param('id').isMongoId(),
    body('status').optional().isIn(['FREE', 'OCCUPIED', 'BILLED', 'CLEANING']),
    body('capacity').optional().isInt({ min: 1 }),
  ],
  validate,
  update
);

router.post(
  '/:id/regenerate-qr',
  verifyJWT, requireRole('ADMIN'),
  [param('id').isMongoId()], validate,
  regenerateQR
);

module.exports = router;
