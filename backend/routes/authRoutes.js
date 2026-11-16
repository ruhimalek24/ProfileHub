const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { signup, login, logout } = require('../controllers/authController');

const router = express.Router();

const signupRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').bail()
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or less.'),
  body('email').trim().notEmpty().withMessage('Email is required.').bail()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  // bcrypt only uses the first 72 bytes, so cap it there.
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .isLength({ max: 72 }).withMessage('Password must be 72 characters or less.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required.').bail()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/signup', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);

module.exports = router;
