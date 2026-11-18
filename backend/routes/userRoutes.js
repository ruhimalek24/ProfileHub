const express = require('express');
const { body } = require('express-validator');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const handleProfilePictureUpload = require('../middleware/upload');
const {
  getMe,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  getProfilePicture,
} = require('../controllers/userController');

const router = express.Router();

// Same name and email rules as signup (see authRoutes.js).
const updateProfileRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').bail()
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or less.'),
  body('email').trim().notEmpty().withMessage('Email is required.').bail()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  // Only needed when the email changes. The controller decides.
  body('currentPassword').optional().isString().withMessage('Current password is required.'),
];

const changePasswordRules = [
  body('currentPassword').isString().withMessage('Current password is required.').bail()
    .notEmpty().withMessage('Current password is required.'),
  // Same length rules as signup. bcrypt only uses the first 72 bytes.
  body('newPassword').isString().withMessage('New password is required.').bail()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .isLength({ max: 72 }).withMessage('Password must be 72 characters or less.'),
  body('confirmNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Passwords do not match.');
    return true;
  }),
];

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateProfileRules, validate, updateProfile);
router.put('/me/password', requireAuth, changePasswordRules, validate, changePassword);
// requireAuth runs first, so the upload is not even read without a valid login.
router.put('/me/profile-picture', requireAuth, handleProfilePictureUpload, uploadProfilePicture);
router.get('/me/profile-picture', requireAuth, getProfilePicture);

module.exports = router;
