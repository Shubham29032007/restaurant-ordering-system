'use strict';
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name:       { type: String, required: true },
    variant:    { type: String, default: '' },
    addOns:     { type: [String], default: [] },
    qty:        { type: Number, required: true, min: 1 },
    unitPrice:  { type: Number, required: true },
    lineTotal:  { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderType:           { type: String, enum: ['DINE_IN', 'TAKEAWAY'], required: true },
    source:              { type: String, enum: ['QR', 'KIOSK', 'STAFF'], required: true },
    sessionId:           { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', default: null },
    tableNumber:         { type: Number, default: null },
    token:               { type: Number, default: null },
    items:               { type: [orderItemSchema], required: true },
    subtotal:            { type: Number, required: true },
    specialInstructions: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PLACED', 'CLAIMED', 'COMPLETED', 'SERVED', 'COLLECTED', 'CANCELLED'],
      default: 'PLACED',
    },
    claimedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    claimedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
    servedAt:    { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
