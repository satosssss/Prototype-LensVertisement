// ============================================================================
// Validation Middleware
// Validates incoming requests to the /api/analysis routes before they
// reach the controller.
//
// Runs AFTER the upload middleware, so `req.file` (multipart uploads) and
// `req.body` (either multipart fields or a JSON body) are both populated.
// ============================================================================

import { env } from '../config/env.js';
import { NotSupportedError, ValidationError } from '../utils/errorHandler.js';

/** Analysis types this build fully supports. */
export const ACTIVE_TYPES = ['image', 'text'];

/**
 * Types we recognise but have not implemented.
 * Rejected with 501 rather than 400 — the request is well-formed, the
 * capability simply doesn't exist yet.
 */
export const DEFERRED_TYPES = ['video'];

/**
 * validateAnalysisRequest
 * Express middleware that checks a POST /api/analysis/analyze request.
 *
 * Accepted shapes:
 *
 *   Image — multipart/form-data
 *     type=image
 *     advertisement=<file>   (JPEG / PNG / WebP, size-capped)
 *
 *   Text — application/json OR multipart/form-data
 *     type=text
 *     text="..."             (non-empty, <= maxTextChars)
 *
 * On failure, forwards a typed error (400 / 501 / 413) to the global
 * error handler via next(err). On success, calls next().
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const validateAnalysisRequest = (req, res, next) => {
  try {
    const { type, text } = req.body || {};

    // 1. "type" must be present
    if (!type) {
      throw new ValidationError('Missing required field: "type"', {
        field: 'type',
        expected: ACTIVE_TYPES,
      });
    }

    // 2. Recognised but unimplemented
    if (DEFERRED_TYPES.includes(type)) {
      throw new NotSupportedError(
        `Analysis type "${type}" is not supported in this build. Use "image" or "text".`,
        { field: 'type', received: type, supported: ACTIVE_TYPES }
      );
    }

    // 3. Must be a supported type
    if (!ACTIVE_TYPES.includes(type)) {
      throw new ValidationError(`Unsupported analysis type: "${type}"`, {
        field: 'type',
        received: type,
        expected: ACTIVE_TYPES,
      });
    }

    // 4. Type-specific requirements
    if (type === 'text') {
      // A file makes no sense here and probably signals a client bug.
      if (req.file) {
        throw new ValidationError(
          'Do not attach a file when "type" is "text". Send "text" only.',
          { field: 'advertisement' }
        );
      }

      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new ValidationError(
          'Missing required field: "text" must be a non-empty string for type "text"',
          { field: 'text' }
        );
      }

      if (text.length > env.maxTextChars) {
        throw new ValidationError(
          `"text" is too long (${text.length} characters). Maximum is ${env.maxTextChars}.`,
          { field: 'text', maxChars: env.maxTextChars }
        );
      }
    }

    if (type === 'image' && !req.file) {
      throw new ValidationError(
        'Missing file: attach the advertisement image as multipart field "advertisement".',
        { field: 'advertisement', accepts: 'multipart/form-data' }
      );
    }

    next();
  } catch (err) {
    // Forward to the global error handler (registered in server.js)
    next(err);
  }
};

export default validateAnalysisRequest;
