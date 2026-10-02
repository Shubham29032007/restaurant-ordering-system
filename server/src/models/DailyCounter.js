'use strict';
const mongoose = require('mongoose');

/**
 * Atomic daily counter for takeaway token numbers — Rule 5.
 * One document per date string (YYYY-MM-DD).
 * Use findOneAndUpdate with  to atomically get-and-increment.
 * NEVER read-max-then-increment.
 */
const dailyCounterSchema = new mongoose.Schema({
  date:    { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  counter: { type: Number, default: 0 },
});

module.exports = mongoose.model('DailyCounter', dailyCounterSchema);
