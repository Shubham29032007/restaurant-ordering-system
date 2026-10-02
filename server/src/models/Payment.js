'use strict';
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    billId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    mode:        { type: String, enum: ['ONLINE', 'CASH'], required: true },
    status:      { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    txnRef:      { type: String, default: '' },
    paidAt:      { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
