// middleware/errorHandler.js

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes in server.js.
 * Express recognises it as an error handler because it has 4 parameters.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
