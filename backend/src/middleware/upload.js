// ============================================================================
// Upload Middleware
// Accepts a single advertisement image as multipart/form-data under the field
// name "advertisement".
//
// Files are held in RAM (multer.memoryStorage) and never written to disk:
//  - the Gemini API accepts bytes directly, so disk is an unnecessary step
//  - nothing sensitive survives the request
//  - there is no orphaned-file cleanup to write or forget
// ============================================================================

import multer from 'multer';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/errorHandler.js';

/**
 * Allowed image types.
 * Deliberately an allowlist keyed by MIME type — never trust the file
 * extension, which a client controls.
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Human-readable list used in error messages. */
export const ALLOWED_IMAGE_LABEL = 'JPEG, PNG, or WebP';

const uploader = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: env.maxUploadBytes,
    files: 1, // one advertisement per request
    fields: 10, // small guard against field-flooding
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(
        new ValidationError(
          `Unsupported file type "${file.mimetype}". Allowed types: ${ALLOWED_IMAGE_LABEL}.`,
          { field: 'advertisement', allowed: ALLOWED_IMAGE_TYPES }
        )
      );
    }
    cb(null, true);
  },
});

/**
 * uploadAdvertisement
 * Express middleware for a single file in the "advertisement" field.
 *
 * Multer only acts on multipart/form-data requests — a plain JSON text
 * request passes straight through untouched, which is what we want for
 * text-only advertisements.
 */
export const uploadAdvertisement = uploader.single('advertisement');

export default uploadAdvertisement;
