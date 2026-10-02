'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Table = require('./models/Table');
const MenuItem = require('./models/MenuItem');
const DailyCounter = require('./models/DailyCounter');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

// ── Menu data: 25 items across 5 categories ──────────────────────
const menuItems = [
  // STARTERS (5)
  {
    name: 'Paneer Tikka', category: 'Starters', description: 'Marinated cottage cheese grilled to perfection.',
    basePrice: 220, isVeg: true, avgPrepMinutes: 12,
    variants: [{ name: 'Half', priceDelta: -80 }, { name: 'Full', priceDelta: 0 }],
    addOns: [{ name: 'Extra Mint Chutney', price: 20 }, { name: 'Onion Rings', price: 30 }],
  },
  {
    name: 'Chicken Tikka', category: 'Starters', description: 'Tender chicken pieces in spiced yoghurt marinade.',
    basePrice: 280, isVeg: false, avgPrepMinutes: 15,
    variants: [{ name: 'Half', priceDelta: -100 }, { name: 'Full', priceDelta: 0 }],
    addOns: [{ name: 'Extra Sauce', price: 25 }],
  },
  {
    name: 'Veg Spring Rolls', category: 'Starters', description: 'Crispy rolls stuffed with seasoned vegetables.',
    basePrice: 160, isVeg: true, avgPrepMinutes: 10,
    variants: [],
    addOns: [{ name: 'Sweet Chilli Dip', price: 20 }],
  },
  {
    name: 'Seekh Kebab', category: 'Starters', description: 'Minced lamb skewers with fresh herbs.',
    basePrice: 320, isVeg: false, avgPrepMinutes: 18,
    variants: [{ name: '4 Pieces', priceDelta: 0 }, { name: '8 Pieces', priceDelta: 260 }],
    addOns: [{ name: 'Raita', price: 40 }],
  },
  {
    name: 'Samosa (2 pcs)', category: 'Starters', description: 'Classic potato-filled crispy pastry.',
    basePrice: 60, isVeg: true, avgPrepMinutes: 5,
    variants: [],
    addOns: [{ name: 'Tamarind Chutney', price: 10 }],
  },
  // MAINS (8)
  {
    name: 'Butter Chicken', category: 'Mains', description: 'Rich tomato-cream gravy with tender chicken.',
    basePrice: 320, isVeg: false, avgPrepMinutes: 20,
    variants: [{ name: 'Mild', priceDelta: 0 }, { name: 'Medium', priceDelta: 0 }, { name: 'Hot', priceDelta: 0 }],
    addOns: [{ name: 'Extra Gravy', price: 50 }],
  },
  {
    name: 'Paneer Butter Masala', category: 'Mains', description: 'Cottage cheese in velvety tomato-cashew gravy.',
    basePrice: 280, isVeg: true, avgPrepMinutes: 18,
    variants: [{ name: 'Mild', priceDelta: 0 }, { name: 'Spicy', priceDelta: 0 }],
    addOns: [{ name: 'Extra Paneer', price: 60 }],
  },
  {
    name: 'Dal Makhani', category: 'Mains', description: 'Slow-cooked black lentils in butter and cream.',
    basePrice: 200, isVeg: true, avgPrepMinutes: 15,
    variants: [],
    addOns: [{ name: 'Dollop of Butter', price: 20 }],
  },
  {
    name: 'Chicken Biryani', category: 'Mains', description: 'Fragrant basmati rice layered with spiced chicken.',
    basePrice: 380, isVeg: false, avgPrepMinutes: 25,
    variants: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 120 }],
    addOns: [{ name: 'Raita', price: 40 }, { name: 'Salan', price: 30 }],
  },
  {
    name: 'Veg Biryani', category: 'Mains', description: 'Aromatic basmati with mixed vegetables and whole spices.',
    basePrice: 280, isVeg: true, avgPrepMinutes: 22,
    variants: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 100 }],
    addOns: [{ name: 'Raita', price: 40 }],
  },
  {
    name: 'Fish Curry', category: 'Mains', description: 'Coastal-style fish in tangy coconut-tomato gravy.',
    basePrice: 360, isVeg: false, avgPrepMinutes: 20,
    variants: [],
    addOns: [{ name: 'Steamed Rice', price: 60 }],
  },
  {
    name: 'Palak Paneer', category: 'Mains', description: 'Creamy spinach gravy with paneer cubes.',
    basePrice: 260, isVeg: true, avgPrepMinutes: 15,
    variants: [],
    addOns: [{ name: 'Extra Paneer', price: 60 }],
  },
  {
    name: 'Mutton Rogan Josh', category: 'Mains', description: 'Kashmiri-style slow-braised mutton.',
    basePrice: 420, isVeg: false, avgPrepMinutes: 30,
    variants: [],
    addOns: [{ name: 'Steamed Rice', price: 60 }, { name: 'Naan', price: 40 }],
  },
  // BREADS (5)
  {
    name: 'Butter Naan', category: 'Breads', description: 'Soft leavened bread baked in tandoor, brushed with butter.',
    basePrice: 50, isVeg: true, avgPrepMinutes: 5,
    variants: [],
    addOns: [{ name: 'Garlic', price: 10 }, { name: 'Cheese', price: 30 }],
  },
  {
    name: 'Laccha Paratha', category: 'Breads', description: 'Flaky layered whole-wheat bread.',
    basePrice: 60, isVeg: true, avgPrepMinutes: 5,
    variants: [],
    addOns: [],
  },
  {
    name: 'Missi Roti', category: 'Breads', description: 'Spiced chickpea-flour flatbread.',
    basePrice: 45, isVeg: true, avgPrepMinutes: 5,
    variants: [],
    addOns: [],
  },
  {
    name: 'Puri (4 pcs)', category: 'Breads', description: 'Deep-fried puffed wheat bread.',
    basePrice: 60, isVeg: true, avgPrepMinutes: 6,
    variants: [],
    addOns: [],
  },
  {
    name: 'Tandoori Roti', category: 'Breads', description: 'Whole-wheat bread baked in tandoor.',
    basePrice: 35, isVeg: true, avgPrepMinutes: 4,
    variants: [],
    addOns: [],
  },
  // DRINKS (4)
  {
    name: 'Masala Chai', category: 'Drinks', description: 'Spiced Indian milk tea.',
    basePrice: 40, isVeg: true, avgPrepMinutes: 3,
    variants: [{ name: 'Regular', priceDelta: 0 }, { name: 'Cutting', priceDelta: -15 }],
    addOns: [],
  },
  {
    name: 'Mango Lassi', category: 'Drinks', description: 'Chilled yoghurt blended with Alphonso mango.',
    basePrice: 90, isVeg: true, avgPrepMinutes: 3,
    variants: [],
    addOns: [{ name: 'Dry Fruits', price: 25 }],
  },
  {
    name: 'Fresh Lime Soda', category: 'Drinks', description: 'Sweet or salted lime with soda.',
    basePrice: 60, isVeg: true, avgPrepMinutes: 2,
    variants: [{ name: 'Sweet', priceDelta: 0 }, { name: 'Salted', priceDelta: 0 }, { name: 'Mixed', priceDelta: 0 }],
    addOns: [],
  },
  {
    name: 'Cold Coffee', category: 'Drinks', description: 'Blended cold coffee with ice cream.',
    basePrice: 120, isVeg: true, avgPrepMinutes: 4,
    variants: [],
    addOns: [{ name: 'Extra Scoop', price: 40 }],
  },
  // DESSERTS (3)
  {
    name: 'Gulab Jamun (2 pcs)', category: 'Desserts', description: 'Soft milk-solids dumplings in rose-sugar syrup.',
    basePrice: 80, isVeg: true, avgPrepMinutes: 5,
    variants: [],
    addOns: [{ name: 'Vanilla Ice Cream', price: 60 }],
  },
  {
    name: 'Kulfi Falooda', category: 'Desserts', description: 'Traditional ice cream with vermicelli and rose syrup.',
    basePrice: 140, isVeg: true, avgPrepMinutes: 5,
    variants: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 50 }],
    addOns: [],
  },
  {
    name: 'Chocolate Brownie', category: 'Desserts', description: 'Warm dark-chocolate brownie.',
    basePrice: 160, isVeg: true, avgPrepMinutes: 8,
    variants: [],
    addOns: [{ name: 'Vanilla Ice Cream', price: 60 }, { name: 'Hot Fudge', price: 30 }],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('[Seed] Connected to MongoDB');

  // ── Wipe existing seed data ────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Table.deleteMany({}),
    MenuItem.deleteMany({}),
    DailyCounter.deleteMany({}),
  ]);
  console.log('[Seed] Cleared existing documents');

  // ── Users ──────────────────────────────────────────────────────
  const SALT = 12;
  const adminPwd  = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
  const chefPwd   = process.env.SEED_CHEF_PASSWORD  || 'Chef@1234';
  const staffPwd  = process.env.SEED_STAFF_PASSWORD || 'Staff@1234';

  const users = await User.insertMany([
    { name: 'Admin User',  email: 'admin@restaurant.local',  passwordHash: await bcrypt.hash(adminPwd, SALT),  role: 'ADMIN'  },
    { name: 'Chef Arjun',  email: 'chef1@restaurant.local',  passwordHash: await bcrypt.hash(chefPwd, SALT),   role: 'CHEF'   },
    { name: 'Chef Meena',  email: 'chef2@restaurant.local',  passwordHash: await bcrypt.hash(chefPwd, SALT),   role: 'CHEF'   },
    { name: 'Staff Rahul', email: 'staff1@restaurant.local', passwordHash: await bcrypt.hash(staffPwd, SALT),  role: 'STAFF'  },
    { name: 'Staff Priya', email: 'staff2@restaurant.local', passwordHash: await bcrypt.hash(staffPwd, SALT),  role: 'STAFF'  },
  ]);
  console.log('[Seed] ' + users.length + ' users created');

  // ── Tables (T1–T12) + signed QR JWTs (Rule 2) ─────────────────
  const tableData = [];
  for (let n = 1; n <= 12; n++) {
    // Save first to get _id, then sign
    const table = new Table({ number: n, capacity: 4, qrToken: 'placeholder' });
    await table.save();
    table.qrToken = jwt.sign(
      { tableId: table._id.toString(), number: n },
      process.env.QR_JWT_SECRET || 'qr_dev_secret_replace_me'
    );
    await table.save();
    tableData.push(table);
  }
  console.log('[Seed] ' + tableData.length + ' tables created with signed QR tokens (Rule 2)');

  // ── Menu items ─────────────────────────────────────────────────
  const items = await MenuItem.insertMany(menuItems);
  console.log('[Seed] ' + items.length + ' menu items created across ' + [...new Set(items.map((i) => i.category))].join(', '));

  // ── Print login summary ────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('Seed complete — logins (email / env var for password):');
  console.log('  ADMIN : admin@restaurant.local  / SEED_ADMIN_PASSWORD');
  console.log('  CHEF  : chef1@restaurant.local  / SEED_CHEF_PASSWORD');
  console.log('  CHEF  : chef2@restaurant.local  / SEED_CHEF_PASSWORD');
  console.log('  STAFF : staff1@restaurant.local / SEED_STAFF_PASSWORD');
  console.log('  STAFF : staff2@restaurant.local / SEED_STAFF_PASSWORD');
  console.log('══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('[Seed] Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
