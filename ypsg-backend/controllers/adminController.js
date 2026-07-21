// =========================================================
// Admin controller — admin login, dashboard stats, participant
// management (search/filter, delete, resend, allow-regeneration,
// export CSV)
// =========================================================
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminModel = require('../models/adminModel');
const userModel = require('../models/userModel');
const certificateModel = require('../models/certificateModel');
const { transporter } = require('../config/mailer');
const { certificateEmailHtml } = require('../utils/emailTemplates');
const { toCsv } = require('../utils/csv');

function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, role: 'admin' },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1d' }
  );
}

async function login(req, res) {
  const { email, password } = req.body;

  const admin = await adminModel.findAdminByEmail(email.toLowerCase().trim());
  if (!admin) return res.status(401).json({ message: 'Invalid email or password.' });

  const matches = await bcrypt.compare(password, admin.password_hash);
  if (!matches) return res.status(401).json({ message: 'Invalid email or password.' });

  const token = signAdminToken(admin);
  return res.json({
    admin: { id: admin.id, fullName: admin.full_name, email: admin.email },
    token
  });
}

async function stats(req, res) {
  const data = await userModel.getDashboardStats();
  return res.json(data);
}

async function listUsers(req, res) {
  const { search = '', status = 'all' } = req.query;
  const rows = await userModel.listUsersWithCertificateStatus({ search, status });

  const participants = rows.map(row => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    registeredAt: row.registered_at,
    certificateName: row.certificate_name,
    certificateStatus: row.certificate_status || 'not_generated',
    regenerationAllowed: Boolean(row.regeneration_allowed)
  }));

  return res.json({ participants });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await userModel.findUserById(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  // Best-effort cleanup of any certificate file on disk (DB row cascades via FK).
  const certificate = await certificateModel.findByUserId(id);
  if (certificate) {
    const absolutePath = path.join(__dirname, '..', certificate.file_path);
    fs.unlink(absolutePath, () => {});
  }

  await userModel.deleteUserById(id);
  return res.json({ message: `${user.full_name} was removed.` });
}

async function resendCertificate(req, res) {
  const { id } = req.params;
  const user = await userModel.findUserById(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const certificate = await certificateModel.findByUserId(id);
  if (!certificate) {
    return res.status(404).json({ message: 'This user has not generated a certificate yet.' });
  }

  const absolutePath = path.join(__dirname, '..', certificate.file_path);
  if (!fs.existsSync(absolutePath)) {
    return res.status(410).json({ message: 'Certificate file is missing on disk and cannot be resent.' });
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: 'YPSG Youth Tech Empowerment Seminar Certificate',
      html: certificateEmailHtml({ fullName: certificate.certificate_name }),
      attachments: [{ filename: 'YPSG-Certificate.pdf', path: absolutePath }]
    });
    await certificateModel.markEmailed(certificate.id);
  } catch (err) {
    await certificateModel.markEmailFailed(certificate.id);
    return res.status(502).json({ message: 'Failed to resend the certificate email. Please try again.' });
  }

  return res.json({ message: `Certificate resent to ${user.email}.` });
}

/** Unlocks certificate generation again for a user who already has one. */
async function allowRegeneration(req, res) {
  const { id } = req.params;
  const user = await userModel.findUserById(id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const updated = await certificateModel.allowRegeneration(id);
  if (!updated) {
    return res.status(404).json({ message: 'This user has no certificate to regenerate.' });
  }

  return res.json({ message: `${user.full_name} can now regenerate their certificate.` });
}

async function exportCsv(req, res) {
  const { search = '', status = 'all' } = req.query;
  const rows = await userModel.listUsersWithCertificateStatus({ search, status });

  const csv = toCsv(
    ['Name', 'Email', 'Registered', 'Certificate Status'],
    rows.map(r => [
      r.full_name,
      r.email,
      new Date(r.registered_at).toISOString().slice(0, 10),
      r.certificate_status || 'not_generated'
    ])
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ypsg-participants-${Date.now()}.csv"`);
  return res.send(csv);
}

module.exports = {
  login,
  stats,
  listUsers,
  deleteUser,
  resendCertificate,
  allowRegeneration,
  exportCsv
};
