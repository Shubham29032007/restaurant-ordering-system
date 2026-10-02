'use strict';
const jwt = require('jsonwebtoken');
const Table = require('../models/Table');

async function create(req, res, next) {
  try {
    const { number, capacity } = req.body;
    const table = new Table({ number, capacity, qrToken: 'placeholder' });
    await table.save();
    const qrToken = jwt.sign(
      { tableId: table._id.toString(), number: table.number },
      process.env.QR_JWT_SECRET
    );
    table.qrToken = qrToken;
    await table.save();
    res.status(201).json({ success: true, table });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json({ success: true, tables });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const allowed = ['capacity', 'status'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const table = await Table.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
    res.json({ success: true, table });
  } catch (err) { next(err); }
}

async function verifyQR(req, res, next) {
  try {
    let payload;
    try {
      payload = jwt.verify(req.params.qrToken, process.env.QR_JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid or tampered QR code' });
    }
    const table = await Table.findById(payload.tableId);
    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
    res.json({
      success: true,
      table: {
        _id: table._id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        currentSessionId: table.currentSessionId,
      },
    });
  } catch (err) { next(err); }
}

async function regenerateQR(req, res, next) {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
    const qrToken = jwt.sign(
      { tableId: table._id.toString(), number: table.number },
      process.env.QR_JWT_SECRET
    );
    table.qrToken = qrToken;
    await table.save();
    res.json({ success: true, table });
  } catch (err) { next(err); }
}

module.exports = { create, list, update, verifyQR, regenerateQR };