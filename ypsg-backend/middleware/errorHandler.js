// =========================================================
// Centralized error handler — keep controllers throwing plain
// Errors (optionally with a .statusCode) and let this format
// the response consistently.
// =========================================================

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again later.'
    : err.message || 'Unexpected error.';

  res.status(statusCode).json({ message });
}

/** Wrap async route handlers so thrown errors reach errorHandler without try/catch boilerplate. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFound, errorHandler, asyncHandler };
