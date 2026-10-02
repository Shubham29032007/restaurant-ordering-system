'use strict';
const { validationResult } = require('express-validator');

/**
 * Run after express-validator chains.
 * Returns 422 with all errors if validation fails, otherwise calls next().
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
}

module.exports = validate;
