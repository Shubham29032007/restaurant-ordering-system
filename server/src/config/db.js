'use strict';
const mongoose = require('mongoose');
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in environment');
  await mongoose.connect(uri);
  console.log('[DB] MongoDB connected:', mongoose.connection.host);
}
module.exports = connectDB;