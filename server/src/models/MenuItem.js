'use strict';
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  { name: { type: String, required: true }, priceDelta: { type: Number, required: true } },
  { _id: false }
);

const addOnSchema = new mongoose.Schema(
  { name: { type: String, required: true }, price: { type: Number, required: true } },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    category:       { type: String, required: true, trim: true },
    description:    { type: String, default: '' },
    basePrice:      { type: Number, required: true, min: 0 },
    variants:       { type: [variantSchema], default: [] },
    addOns:         { type: [addOnSchema], default: [] },
    imageUrl:       { type: String, default: '' },
    isVeg:          { type: Boolean, default: true },
    available:      { type: Boolean, default: true },
    avgPrepMinutes: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
