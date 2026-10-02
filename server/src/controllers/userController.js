'use strict';
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * GET /api/users — List all users (ADMIN only)
 * Omits passwordHash for security.
 */
async function list(req, res, next) {
  try {
    const users = await User.find({}, '-passwordHash').sort({ role: 1, name: 1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users — Create a new staff/chef/admin user (ADMIN only)
 * Input-validated & password hashed via bcrypt.
 */
async function create(req, res, next) {
  try {
    const { name, email, password, role, active } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      active: active !== undefined ? active : true,
    });

    await user.save();

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id — Update user details or active status (ADMIN only)
 */
async function update(req, res, next) {
  try {
    const { name, role, active, password } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    // Prevent self-deactivation if updating own profile
    if (req.user && req.user._id === req.params.id && active === false) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own admin account' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
      select: '-passwordHash',
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update };
