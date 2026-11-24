const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const OtpChallenge = require('../models/OtpChallenge');
const { assertEmailDeliveryConfigured, sendOtpEmail } = require('../services/emailService');

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const OTP_RESEND_DELAY_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const hashOtp = (email, purpose, code) => {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('OTP verification is not configured. Set OTP_SECRET or JWT_SECRET on the server.');
    error.category = 'configuration';
    error.code = 'OTP_SECRET_NOT_CONFIGURED';
    error.isOperational = true;
    error.statusCode = 503;
    throw error;
  }

  return crypto.createHmac('sha256', secret).update(`${email}:${purpose}:${code}`).digest('hex');
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('Authentication is not configured. Set JWT_SECRET on the server.');
    error.category = 'configuration';
    error.code = 'JWT_SECRET_NOT_CONFIGURED';
    error.isOperational = true;
    error.statusCode = 503;
    throw error;
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};

const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, studentId } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name || '').trim(),
      email: normalizedEmail,
      studentId: String(studentId || '').trim(),
      passwordHash,
      role: 'student',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const issueOtp = async (req, res, next, purpose) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    assertEmailDeliveryConfigured();
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account was found for this email. Check the address or create an account first.',
      });
    }

    const now = new Date();
    const challenge = await OtpChallenge.findOne({ email, purpose });
    if (challenge && challenge.lastSentAt.getTime() > now.getTime() - OTP_RESEND_DELAY_MS) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another verification code.',
        resendAfterSeconds: Math.ceil(
          (OTP_RESEND_DELAY_MS - (now.getTime() - challenge.lastSentAt.getTime())) / 1000
        ),
      });
    }

    const code = createOtp();
    const record = challenge || new OtpChallenge({ email, purpose });
    record.codeHash = hashOtp(email, purpose, code);
    record.attempts = 0;
    record.expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
    record.lastSentAt = now;
    await record.save();

    try {
      await sendOtpEmail({ to: email, code, purpose });
    } catch (error) {
      await OtpChallenge.deleteOne({ _id: record._id });
      throw error;
    }

    return res.status(200).json({
      success: true,
      delivered: true,
      message: 'A verification code has been sent to your email.',
      resendAfterSeconds: 60,
    });
  } catch (error) {
    return next(error);
  }
};

const checkOtp = async (email, purpose, code) => {
  const challenge = await OtpChallenge.findOne({ email, purpose });
  const now = new Date();

  if (!challenge || challenge.expiresAt <= now || challenge.attempts >= OTP_MAX_ATTEMPTS) {
    if (challenge && (challenge.expiresAt <= now || challenge.attempts >= OTP_MAX_ATTEMPTS)) {
      await OtpChallenge.deleteOne({ _id: challenge._id });
    }
    return { statusCode: 400, message: 'The code is invalid or expired. Request a new one and try again.' };
  }

  const submittedHash = hashOtp(email, purpose, code);
  const storedHash = Buffer.from(challenge.codeHash, 'hex');
  const submittedHashBytes = Buffer.from(submittedHash, 'hex');
  const matches = storedHash.length === submittedHashBytes.length
    && crypto.timingSafeEqual(storedHash, submittedHashBytes);

  if (!matches) {
    const updatedChallenge = await OtpChallenge.findOneAndUpdate(
      { _id: challenge._id, attempts: { $lt: OTP_MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { returnDocument: 'after' }
    );
    if (!updatedChallenge || updatedChallenge.attempts >= OTP_MAX_ATTEMPTS) {
      await OtpChallenge.deleteOne({ _id: challenge._id });
      return { statusCode: 429, message: 'Too many incorrect codes. Request a new code.' };
    }
    return { statusCode: 400, message: 'The code is invalid or expired. Request a new one and try again.' };
  }

  const consumedChallenge = await OtpChallenge.findOneAndDelete({
    _id: challenge._id,
    codeHash: challenge.codeHash,
    attempts: { $lt: OTP_MAX_ATTEMPTS },
    expiresAt: { $gt: now },
  });

  if (!consumedChallenge) {
    return { statusCode: 400, message: 'The code is invalid or expired. Request a new one and try again.' };
  }

  return { challenge: consumedChallenge };
};

const loginWithOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    const verification = await checkOtp(email, 'login', req.body.otp);
    if (verification.message || !user) {
      return res.status(verification.statusCode || 400).json({
        success: false,
        message: verification.message || 'The code is invalid or expired. Request a new one and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        token: generateToken(user),
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const requestLoginOtp = (req, res, next) => issueOtp(req, res, next, 'login');

const requestPasswordReset = (req, res, next) => issueOtp(req, res, next, 'password-reset');

const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const email = normalizeEmail(req.body.email);
    const verification = await checkOtp(email, 'password-reset', req.body.otp);
    if (verification.message) {
      return res.status(verification.statusCode).json({ success: false, message: verification.message });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'The code is invalid or expired. Request a new one and try again.' });
    }

    user.passwordHash = await bcrypt.hash(req.body.password, 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestLoginOtp,
  loginWithOtp,
  requestPasswordReset,
  resetPassword,
};
