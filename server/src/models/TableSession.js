'use strict';
const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema(
  {
    tableId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    startedAt:    { type: Date, default: Date.now },
    closedAt:     { type: Date, default: null },
    runningTotal: { type: Number, default: 0 },
    status:       { type: String, enum: ['OPEN', 'BILL_REQUESTED', 'PAID', 'CLOSED'], default: 'OPEN' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TableSession', tableSessionSchema);
