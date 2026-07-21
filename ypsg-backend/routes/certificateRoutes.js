// =========================================================
// /api/certificates routes
// =========================================================
const express = require('express');
const { body } = require('express-validator');

const certificateController = require('../controllers/certificateController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.use(requireAuth);

router.post(
  '/generate',
  [
    body('certificateName')
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage('Please enter the full name to print on your certificate.')
  ],
  validate,
  asyncHandler(certificateController.generate)
);

router.get('/status', asyncHandler(certificateController.status));
router.get('/download', asyncHandler(certificateController.download));

module.exports = router;
