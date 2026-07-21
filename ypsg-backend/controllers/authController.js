// =========================================================
// Auth controller — participant register / login / me
// =========================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const certificateModel = require('../models/certificateModel');

function signUserToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function toPublicUser(user) {
  return { id: user.id, fullName: user.full_name, email: user.email, createdAt: user.created_at };
}

async function register(req, res) {
  const { fullName, email, password } = req.body;

  const existing = await userModel.findUserByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await userModel.createUser({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash
  });

  const token = signUserToken(user);
  return res.status(201).json({ user: toPublicUser(user), token });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findUserByEmail(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = signUserToken(user);
  return res.json({ user: toPublicUser(user), token });
}

async function me(req, res) {
  const user = await userModel.findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const certificate = await certificateModel.findByUserId(user.id);

  return res.json({
    user: toPublicUser(user),
    certificate: certificate
      ? {
          name: certificate.certificate_name,
          status: certificate.status,
          generatedAt: certificate.generated_at,
          emailedAt: certificate.emailed_at
        }
      : null
  });
}

module.exports = { register, login, me };
