// =========================================================
// Admin model — raw SQL via mysql2/promise
// =========================================================
const { pool } = require('../config/db');

async function findAdminByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findAdminById(id) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

module.exports = { findAdminByEmail, findAdminById };
