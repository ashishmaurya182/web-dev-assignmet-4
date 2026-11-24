require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { seedDemoData } = require('./utils/seed');
const { syncLegacyRegistrationCounts } = require('./utils/syncRegistrationCounts');
const { verifySmtpConnection } = require('./services/emailService');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const OtpChallenge = require('./models/OtpChallenge');

const app = express();
const PORT = process.env.PORT || 5000;
const developmentOrigins = process.env.NODE_ENV === 'production'
  ? []
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
  ];
const allowedOrigins = new Set([
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  ...developmentOrigins,
]);
if (process.env.NODE_ENV === 'production' && allowedOrigins.size === 0) {
  console.error('[EventEase] CLIENT_URL is not configured; browser requests will fail CORS.');
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        const error = new Error('Origin not allowed by CORS.');
        error.statusCode = 403;
        error.isOperational = true;
        error.code = 'CORS_ORIGIN_REJECTED';
        callback(error);
      }
    },
    credentials: true,
  })
);
app.set('trust proxy', process.env.TRUST_PROXY === 'true');
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EventEase API is healthy.' });
});

app.use('/api/auth', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', registrationRoutes);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    await Promise.all([User.init(), Event.init(), Registration.init(), OtpChallenge.init()]);
    await syncLegacyRegistrationCounts();
    await seedDemoData();
    await verifySmtpConnection();

    app.listen(PORT, () => {
      console.log(`EventEase server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
