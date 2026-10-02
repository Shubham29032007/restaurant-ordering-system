'use strict';
const express = require('express');
const { body, param } = require('express-validator');
const { list, create, update } = require('../controllers/userController');
const { verifyJWT, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All user management routes require ADMIN role
router.use(verifyJWT, requireRole('ADMIN'));

router.get('/', list);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['ADMIN', 'STAFF', 'CHEF']).withMessage('Role must be ADMIN, STAFF, or CHEF'),
    body('active').optional().isBoolean(),
  ],
  validate,
  create
);

router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['ADMIN', 'STAFF', 'CHEF']).withMessage('Role must be ADMIN, STAFF, or CHEF'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  update
);

module.exports = router;
