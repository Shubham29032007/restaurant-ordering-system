'use strict';
const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    number:           { type: Number, required: true, unique: true },
    capacity:         { type: Number, required: true },
    status:           { type: String, enum: ['FREE', 'OCCUPIED', 'BILLED', 'CLEANING'], default: 'FREE' },
    qrToken:          { type: String, required: true, unique: true },
    currentSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
