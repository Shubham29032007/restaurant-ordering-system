'use strict';
const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    sessionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', default: null },
    orderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    subtotal:      { type: Number, required: true },
    cgst:          { type: Number, required: true },   // 2.5% of subtotal — Rule 9
    sgst:          { type: Number, required: true },   // 2.5% of subtotal — Rule 9
    serviceCharge: { type: Number, default: 0 },
    discount:      { type: Number, default: 0 },
    total:         { type: Number, required: true },
    status:        { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
