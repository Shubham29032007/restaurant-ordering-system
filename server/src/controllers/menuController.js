'use strict';
const MenuItem = require('../models/MenuItem');

/** GET /api/menu — public, available items only */
async function listPublic(req, res, next) {
  try {
    const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 });
    res.json({ success: true, items });
  } catch (err) { next(err); }
}

/** GET /api/menu/all — ADMIN, all items */
async function listAll(req, res, next) {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.json({ success: true, items });
  } catch (err) { next(err); }
}

/** POST /api/menu — ADMIN, create item */
async function create(req, res, next) {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err); }
}

/** PATCH /api/menu/:id — ADMIN, update / toggle availability */
async function update(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Menu item not found' });
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

/** DELETE /api/menu/:id — ADMIN, soft-delete by marking unavailable */
async function remove(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { available: false }, { new: true });
    if (!item) return res.status(404).json({ success: false, error: 'Menu item not found' });
    res.json({ success: true, message: 'Item marked unavailable', item });
  } catch (err) { next(err); }
}

module.exports = { listPublic, listAll, create, update, remove };
