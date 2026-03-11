const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { verifyPrimaryTransport } = require('./config/mailer');
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Finds local IPv4 so mobile devices on same Wi-Fi can hit the API directly.
const getLanIp = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes are public; lead routes require a valid JWT.
app.use('/api/auth', authRoutes);
app.use('/api/leads', authMiddleware, leadsRoutes);

// Simple health endpoint for quick server checks.
app.get('/health', (_, res) => res.json({ status: 'OK', time: new Date() }));

app.use('*', (_, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server only after DB connection test so startup issues are visible early.
testConnection().then(() => {
  app.listen(PORT, HOST, () => {
    const lanIp = getLanIp();
    console.log(`Server -> http://localhost:${PORT}`);
    if (lanIp) console.log(`Server -> http://${lanIp}:${PORT}`);
    verifyPrimaryTransport();
  });
});
