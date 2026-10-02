'use strict';
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const validateEnv = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const tableRoutes = require('./routes/tables');

validateEnv();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',   authRoutes);
app.use('/api/menu',   menuRoutes);
app.use('/api/tables', tableRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('[Socket] client connected:', socket.id);

  socket.on('join:table', (tableId) => {
    socket.join('table:' + tableId);
    console.log('[Socket] ' + socket.id + ' joined table:' + tableId);
  });
  socket.on('join:kiosk', (orderId) => {
    socket.join('kiosk:' + orderId);
    console.log('[Socket] ' + socket.id + ' joined kiosk:' + orderId);
  });
  socket.on('join:role', (role) => {
    const allowed = ['kitchen', 'staff', 'board'];
    if (allowed.includes(role)) {
      socket.join('role:' + role);
      console.log('[Socket] ' + socket.id + ' joined role:' + role);
    }
  });
  socket.on('join:board', () => {
    socket.join('board');
    console.log('[Socket] ' + socket.id + ' joined board');
  });

  socket.on('disconnect', () => console.log('[Socket] client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  httpServer.listen(PORT, () => console.log('[Server] listening on http://localhost:' + PORT));
}).catch((err) => {
  console.error('[Server] Failed to connect to DB:', err.message);
  process.exit(1);
});

module.exports = { app, httpServer, io };