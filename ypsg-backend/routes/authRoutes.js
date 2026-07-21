// =========================================================
// /api/auth routes
// =========================================================
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// A tighter limiter on auth endpoints specifically, on top of the global one.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Please try again in a few minutes.' }
});

router.post(
  '/register',
  authLimiter,
  [
    body('fullName').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters.'),
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match.')
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  asyncHandler(authController.login)
);

router.get('/me', requireAuth, asyncHandler(authController.me));

module.exports = router;
