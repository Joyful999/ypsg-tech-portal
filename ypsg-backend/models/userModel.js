// =========================================================
// User model — raw SQL via mysql2/promise (no ORM)
// =========================================================
const { pool } = require('../config/db');

async function createUser({ fullName, email, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
    [fullName, email, passwordHash]
  );
  return findUserById(result.insertId);
}

async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function deleteUserById(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * List users with their certificate status joined in, plus optional
 * search (name/email) and status filtering — powers the admin table.
 */
async function listUsersWithCertificateStatus({ search, status }) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status === 'generated') {
    conditions.push("c.status IN ('generated', 'email_sent', 'email_pending', 'email_failed')");
  } else if (status === 'not_generated') {
    conditions.push('c.id IS NULL');
  } else if (status === 'pending') {
    conditions.push("c.status = 'email_pending'");
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT
       u.id, u.full_name, u.email, u.created_at AS registered_at,
       c.certificate_name, c.status AS certificate_status,
       c.generated_at, c.emailed_at, c.regeneration_allowed
     FROM users u
     LEFT JOIN certificates c ON c.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC`,
    params
  );

  return rows;
}

async function getDashboardStats() {
  const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
  const [[{ generated }]] = await pool.query(
    "SELECT COUNT(*) AS generated FROM certificates WHERE status IN ('generated','email_sent','email_pending','email_failed')"
  );
  const [[{ sent }]] = await pool.query("SELECT COUNT(*) AS sent FROM certificates WHERE status = 'email_sent'");
  const [[{ pending }]] = await pool.query("SELECT COUNT(*) AS pending FROM certificates WHERE status = 'email_pending'");

  return { totalUsers, generated, sent, pending };
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  deleteUserById,
  listUsersWithCertificateStatus,
  getDashboardStats
};
