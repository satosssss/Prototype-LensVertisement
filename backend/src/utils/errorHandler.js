// ============================================================================
// Error Handling Utilities
// Custom error classes + a consistent global error handler for MindLens
// ============================================================================

// ----------------------------------------------------------------------------
// CUSTOM ERROR CLASSES
// ----------------------------------------------------------------------------

/**
 * ValidationError
 * Thrown when incoming request data fails validation
 * (e.g. missing "type", missing content/text, unsupported analysis type).
 * Maps to HTTP 400 Bad Request.
 */
export class ValidationError extends Error {
  /**
   * @param {string} message - human-readable explanation of what's invalid
   * @param {object} [details] - optional extra info (e.g. which field failed)
   */
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details;
  }
}

/**
 * AIServiceError
 * Thrown when something goes wrong while talking to the Gemini API
 * (timeouts, malformed responses, quota errors, etc.).
 * Maps to HTTP 502 Bad Gateway — the upstream AI service failed us.
 */
export class AIServiceError extends Error {
  /**
   * @param {string} message - human-readable explanation of the failure
   * @param {object} [details] - optional extra info (e.g. original error)
   */
  constructor(message, details = null) {
    super(message);
    this.name = 'AIServiceError';
    this.status = 502;
    this.details = details;
  }
}

/**
 * NotFoundError
 * Thrown when a requested resource/route/analysis type doesn't exist.
 * Maps to HTTP 404 Not Found.
 */
export class NotFoundError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
    this.details = details;
  }
}

// ----------------------------------------------------------------------------
// GLOBAL ERROR HANDLER MIDDLEWARE
// ----------------------------------------------------------------------------

/**
 * globalErrorHandler
 * Express error-handling middleware (must have 4 args so Express
 * recognizes it as such). Catches errors passed via next(err) or thrown
 * inside async route handlers wrapped with try/catch.
 *
 * Produces a consistent JSON error shape across the whole API:
 * {
 *   status: "error",
 *   error: "ValidationError",
 *   message: "...",
 *   details: {...} | null,
 *   ...(dev only) stack
 * }
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const globalErrorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  console.error(`❌ [${err.name || 'Error'}] ${err.message}`);
  if (NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    status: 'error',
    error: err.name || 'Error',
    message: err.message || 'Internal Server Error',
    details: err.details || null,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * asyncHandler
 * Small wrapper to avoid repetitive try/catch in async Express route
 * handlers. Catches rejected promises and forwards them to next(),
 * so they land in globalErrorHandler.
 *
 * Usage: router.post('/x', asyncHandler(async (req, res) => {...}))
 *
 * @param {Function} fn - async route handler
 * @returns {Function} wrapped Express handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
