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
 * (e.g. missing "type", missing text, wrong file type).
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
 * PayloadTooLargeError
 * Thrown when an uploaded file or text body exceeds the configured limit.
 * Maps to HTTP 413 Payload Too Large.
 */
export class PayloadTooLargeError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'PayloadTooLargeError';
    this.status = 413;
    this.details = details;
  }
}

/**
 * NotSupportedError
 * Thrown for input shapes the API recognises but does not support yet
 * (currently: video advertisements).
 * Maps to HTTP 501 Not Implemented — accurate, rather than pretending to
 * analyse something we cannot.
 */
export class NotSupportedError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'NotSupportedError';
    this.status = 501;
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
 * Thrown when a requested resource/route doesn't exist.
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
// THIRD-PARTY ERROR NORMALISATION
// ----------------------------------------------------------------------------

/**
 * Translate errors raised by libraries (currently Multer) into our own error
 * classes so the client always receives the same JSON shape.
 *
 * @param {Error & {code?: string}} err
 * @returns {Error} a MindLens error, or the original error if unrecognised
 */
const normaliseError = (err) => {
  // Multer rejects oversized files with code LIMIT_FILE_SIZE.
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new PayloadTooLargeError(
        'The uploaded file is too large.',
        { field: err.field, code: err.code }
      );
    }
    return new ValidationError(`Upload rejected: ${err.message}`, {
      field: err.field,
      code: err.code,
    });
  }

  // express.json()/urlencoded() reject bodies over the configured limit.
  if (err.type === 'entity.too.large') {
    return new PayloadTooLargeError('The request body is too large.');
  }

  // Malformed JSON from the client.
  if (err.type === 'entity.parse.failed') {
    return new ValidationError('The request body is not valid JSON.');
  }

  return err;
};

// ----------------------------------------------------------------------------
// GLOBAL ERROR HANDLER MIDDLEWARE
// ----------------------------------------------------------------------------

/**
 * globalErrorHandler
 * Express error-handling middleware (must have 4 args so Express
 * recognises it as such). Produces a consistent JSON error shape:
 *
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
  const normalised = normaliseError(err);
  const status = normalised.status || 500;

  console.error(`❌ [${normalised.name || 'Error'}] ${normalised.message}`);

  // Stack traces are a development aid only — never leak internals in production.
  if (status >= 500 && process.env.NODE_ENV === 'development' && normalised.stack) {
    console.error(normalised.stack);
  }

  res.status(status).json({
    status: 'error',
    error: normalised.name || 'Error',
    message: normalised.message || 'Internal Server Error',
    details: normalised.details || null,
    ...(process.env.NODE_ENV === 'development' && { stack: normalised.stack }),
  });
};

/**
 * asyncHandler
 * Wrapper that forwards rejected promises to next(), so async controllers
 * don't each need their own try/catch.
 *
 * Usage: router.post('/x', asyncHandler(async (req, res) => {...}))
 *
 * @param {Function} fn - async route handler
 * @returns {Function} wrapped Express handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
