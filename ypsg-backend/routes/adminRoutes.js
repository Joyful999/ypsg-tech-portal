// =========================================================
// /api/admin routes
// =========================================================
const express = require('express');
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const adminController = require('../controllers/adminController');
const { requireAdminAuth } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' }
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  asyncHandler(adminController.login)
);

// Everything below requires a valid admin token.
router.use(requireAdminAuth);

router.get('/stats', asyncHandler(adminController.stats));
router.get('/participants', asyncHandler(adminController.listUsers));
router.get('/participants/export', asyncHandler(adminController.exportCsv));

router.delete(
  '/participants/:id',
  [param('id').isInt().withMessage('Invalid participant id.')],
  validate,
  asyncHandler(adminController.deleteUser)
);

router.post(
  '/participants/:id/resend-certificate',
  [param('id').isInt().withMessage('Invalid participant id.')],
  validate,
  asyncHandler(adminController.resendCertificate)
);

router.post(
  '/participants/:id/allow-regeneration',
  [param('id').isInt().withMessage('Invalid participant id.')],
  validate,
  asyncHandler(adminController.allowRegeneration)
);

module.exports = router;
