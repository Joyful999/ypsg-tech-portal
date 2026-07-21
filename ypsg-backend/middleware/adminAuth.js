// =========================================================
// Admin auth middleware — verifies an admin JWT (signed with a
// separate secret from participant tokens) and attaches
// { id, email } to req.admin
// =========================================================
const jwt = require('jsonwebtoken');

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Not an admin token');
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired admin session.' });
  }
}

module.exports = { requireAdminAuth };
