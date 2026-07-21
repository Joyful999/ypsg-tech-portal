// =========================================================
// Certificate model — raw SQL via mysql2/promise
// =========================================================
const { pool } = require('../config/db');

async function findByUserId(userId) {
  const [rows] = await pool.query('SELECT * FROM certificates WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM certificates WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function create({ userId, certificateName, filePath }) {
  const [result] = await pool.query(
    `INSERT INTO certificates (user_id, certificate_name, file_path, status)
     VALUES (?, ?, ?, 'email_pending')`,
    [userId, certificateName, filePath]
  );
  return findById(result.insertId);
}

async function markEmailed(id) {
  await pool.query(
    "UPDATE certificates SET status = 'email_sent', emailed_at = NOW() WHERE id = ?",
    [id]
  );
}

async function markEmailFailed(id) {
  await pool.query("UPDATE certificates SET status = 'email_failed' WHERE id = ?", [id]);
}

/** Admin override: unlock a user's certificate so they can generate again. */
async function allowRegeneration(userId) {
  const [result] = await pool.query(
    'UPDATE certificates SET regeneration_allowed = TRUE WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows > 0;
}

/** Consumes the regeneration allowance and removes the old certificate row. */
async function deleteForRegeneration(userId) {
  await pool.query('DELETE FROM certificates WHERE user_id = ?', [userId]);
}

module.exports = {
  findByUserId,
  findById,
  create,
  markEmailed,
  markEmailFailed,
  allowRegeneration,
  deleteForRegeneration
};
