// ============================================================================
// Validation Middleware
// Validates incoming requests to the /api/analysis routes before they
// reach the controller.
// ============================================================================

import { ValidationError } from '../utils/errorHandler.js';

// The only analysis types MindLens currently supports
const SUPPORTED_TYPES = ['image', 'text', 'video'];

/**
 * validateAnalysisRequest
 * Express middleware that checks the body of a POST /api/analysis/analyze
 * request before it's allowed to reach the controller.
 *
 * Expected body shape:
 * {
 *   type: "image" | "text" | "video",
 *   text: string       (required when type === "text")
 *   content: string    (required when type === "image" or "video" —
 *                        e.g. a base64 string or file reference)
 * }
 *
 * On failure, forwards a ValidationError (HTTP 400) to the global
 * error handler via next(err). On success, calls next() with no args.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const validateAnalysisRequest = (req, res, next) => {
  try {
    const { type, text, content } = req.body || {};

    // 1. "type" must be present
    if (!type) {
      throw new ValidationError('Missing required field: "type"', {
        field: 'type',
        expected: SUPPORTED_TYPES,
      });
    }

    // 2. "type" must be one of the supported analysis types
    if (!SUPPORTED_TYPES.includes(type)) {
      throw new ValidationError(
        `Unsupported analysis type: "${type}"`,
        { field: 'type', received: type, expected: SUPPORTED_TYPES }
      );
    }

    // 3. Type-specific content checks
    if (type === 'text') {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new ValidationError(
          'Missing required field: "text" must be a non-empty string for type "text"',
          { field: 'text' }
        );
      }
    }

    if (type === 'image' || type === 'video') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new ValidationError(
          `Missing required field: "content" must be provided for type "${type}"`,
          { field: 'content' }
        );
      }
    }

    console.log(`✅ Validation passed for analysis type: "${type}"`);
    next();
  } catch (err) {
    // Forward to the global error handler (registered in server.js)
    next(err);
  }
};
