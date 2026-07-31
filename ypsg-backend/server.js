// =========================================================
// YPSG Tech Portal — Backend entry point
// =========================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const { verifyMailer } = require('./config/mailer');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

/* ---------- Security & parsing middleware ---------- */
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin / server-to-server requests with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Global rate limit; auth/admin-login routes layer a tighter limit on top.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

/* ---------- Health check ---------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ---------- Routes ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);

/* ---------- 404 + error handling ---------- */
app.use(notFound);
app.use(errorHandler);

/* ---------- Startup ---------- */
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await testConnection();
    console.log('MySQL connection OK.');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    console.error('Check your DB_* variables in .env, and that you ran `npm run migrate`.');
  }

  try {
    await verifyMailer();
    console.log('SMTP connection OK.');
  } catch (err) {
    console.error('Could not verify SMTP connection:', err.message);
    console.error('Certificate emails will fail until SMTP_* variables in .env are correct.');
  }

  app.listen(PORT, () => {
    console.log(`YPSG Tech Portal API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start();

module.exports = app;
