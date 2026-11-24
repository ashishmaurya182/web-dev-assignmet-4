const nodemailer = require('nodemailer');

let transporter;

const createSmtpError = (category, statusCode, message, code) => {
  const error = new Error(message);
  error.category = category;
  error.code = code;
  error.isOperational = true;
  error.statusCode = statusCode;
  return error;
};

const getSmtpConfig = () => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw createSmtpError(
      'configuration',
      503,
      `Email delivery is not configured. Set ${missing.join(', ')} in the backend environment.`,
      'SMTP_NOT_CONFIGURED'
    );
  }

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw createSmtpError(
      'configuration',
      503,
      'Email delivery is not configured. SMTP_PORT must be a valid port number.',
      'SMTP_INVALID_CONFIGURATION'
    );
  }

  const from = process.env.SMTP_FROM.trim();
  const fromAddress = from.match(/<([^<>]+)>/)?.[1] || from;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    throw createSmtpError(
      'configuration',
      503,
      'Email delivery is not configured. SMTP_FROM must contain a valid sender email address.',
      'SMTP_INVALID_CONFIGURATION'
    );
  }

  return {
    host: process.env.SMTP_HOST.trim(),
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from,
  };
};

const getTransporter = () => {
  const config = getSmtpConfig();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return { mailer: transporter, from: config.from };
};

const classifySmtpError = (error) => {
  if (error.category) {
    return error;
  }

  if (error.code === 'EAUTH') {
    return createSmtpError(
      'authentication',
      503,
      'SMTP authentication failed. Check the backend SMTP username, password, and provider settings.',
      'SMTP_AUTH_FAILED'
    );
  }

  if ([
    'ECONNECTION',
    'ETIMEDOUT',
    'ESOCKET',
    'EDNS',
    'ETLS',
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'EAI_AGAIN',
  ].includes(error.code)) {
    return createSmtpError(
      'connection',
      503,
      'Could not connect to the SMTP server. Check the backend SMTP host, port, and TLS settings.',
      'SMTP_CONNECTION_FAILED'
    );
  }

  if (error.code === 'EENVELOPE' || error.command === 'RCPT TO') {
    return createSmtpError(
      'recipient',
      400,
      'The recipient email address was rejected by the mail server. Check the address and try again.',
      'SMTP_RECIPIENT_REJECTED'
    );
  }

  return createSmtpError(
    'delivery',
    503,
    'The verification email could not be sent. Check the SMTP provider settings and try again.',
    'SMTP_DELIVERY_FAILED'
  );
};

const logSmtpFailure = (operation, error) => {
  const safeError = classifySmtpError(error);
  console.error(`[EventEase email] SMTP ${operation} failed.`, {
    category: safeError.category,
    code: safeError.code,
  });
  return safeError;
};

const verifySmtpConnection = async () => {
  try {
    const { mailer } = getTransporter();
    await mailer.verify();
    console.info('[EventEase email] SMTP configured and connection verified.');
    return true;
  } catch (error) {
    logSmtpFailure('startup verification', error);
    return false;
  }
};

const assertEmailDeliveryConfigured = () => {
  getTransporter();
};

const sendOtpEmail = async ({ to, code, purpose }) => {
  const isPasswordReset = purpose === 'password-reset';
  const action = isPasswordReset ? 'reset your password' : 'sign in';
  const subject = isPasswordReset ? 'Reset your EventEase password' : 'Your EventEase sign-in code';

  try {
    const { mailer, from } = getTransporter();
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: `Use ${code} to ${action}. This code expires in 10 minutes. If you did not request it, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;color:#211719;max-width:520px;margin:auto;padding:28px"><p style="color:#9f1239;font-weight:700;letter-spacing:.12em;text-transform:uppercase">EventEase</p><h1 style="font-size:24px">Use this code to ${action}</h1><p style="color:#62575a">Enter this one-time code in EventEase. It expires in 10 minutes.</p><div style="display:inline-block;background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:14px 22px;font-size:30px;font-weight:700;letter-spacing:.28em;color:#9f1239">${code}</div><p style="color:#807477;font-size:13px;margin-top:24px">If you did not request this code, you can ignore this email.</p></div>`,
    });

    if (!info.accepted?.length) {
      throw Object.assign(new Error('SMTP did not accept the recipient.'), {
        code: 'EENVELOPE',
        command: 'RCPT TO',
      });
    }

    console.info('[EventEase email] OTP email sent successfully.', {
      messageId: info.messageId,
    });
    return info;
  } catch (error) {
    throw logSmtpFailure('delivery', error);
  }
};

module.exports = { assertEmailDeliveryConfigured, sendOtpEmail, verifySmtpConnection };
