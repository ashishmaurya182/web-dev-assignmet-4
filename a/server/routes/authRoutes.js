const express = require('express');
const { check } = require('express-validator');
const {
  registerUser,
  loginUser,
  requestLoginOtp,
  loginWithOtp,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required.').notEmpty(),
    check('email', 'A valid email is required.').isEmail(),
    check('password', 'Password must be at least 6 characters.').isLength({ min: 6 }),
    check('studentId', 'Student ID must be 80 characters or fewer.').optional({ checkFalsy: true }).isLength({ max: 80 }),
  ],
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Email is required.').notEmpty(),
    check('password', 'Password is required.').notEmpty(),
  ],
  loginUser
);

router.post('/otp/login/request', [check('email', 'A valid email is required.').isEmail()], requestLoginOtp);
router.post(
  '/otp/login/verify',
  [
    check('email', 'A valid email is required.').isEmail(),
    check('otp', 'Enter the 6-digit code.').matches(/^\d{6}$/),
  ],
  loginWithOtp
);
router.post('/password/forgot', [check('email', 'A valid email is required.').isEmail()], requestPasswordReset);
router.post(
  '/password/reset',
  [
    check('email', 'A valid email is required.').isEmail(),
    check('otp', 'Enter the 6-digit code.').matches(/^\d{6}$/),
    check('password', 'Password must be at least 6 characters.').isLength({ min: 6 }),
  ],
  resetPassword
);

module.exports = router;
