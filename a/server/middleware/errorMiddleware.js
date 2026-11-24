const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error('[EventEase] Request failed.', {
      path: req.path,
      statusCode,
      code: err.code || err.name || 'INTERNAL_ERROR',
    });
  }

  const message = err.isOperational || statusCode < 500
    ? err.message
    : 'Internal server error.';
  res.status(statusCode).json({
    success: false,
    message: message || 'Internal server error.',
  });
};

module.exports = { errorMiddleware };
