// ============================================================================
// Analysis Routes
// Defines the /api/analysis/* endpoints. Mounted in server.js.
//
// Middleware order matters and is deliberate:
//   1. uploadAdvertisement  — parses multipart/form-data (images), no-op for JSON
//   2. validateAnalysisRequest — checks type + type-specific requirements
//   3. controller           — orchestrates the response
// ============================================================================

import { Router } from 'express';
import analysisController from '../controllers/analysisController.js';
import { uploadAdvertisement } from '../middleware/upload.js';
import { validateAnalysisRequest } from '../middleware/validation.js';
import { asyncHandler } from '../utils/errorHandler.js';

const router = Router();

/**
 * POST /api/analysis/analyze
 * Accepts either multipart/form-data (image) or JSON (text).
 */
router.post(
  '/analyze',
  uploadAdvertisement,
  validateAnalysisRequest,
  asyncHandler((req, res, next) => analysisController.analyze(req, res, next))
);

/**
 * GET /api/analysis
 * Capability discovery — tells a client what this route group accepts.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MindLens Analysis API',
    supportedTypes: ['image', 'text'],
    deferredTypes: ['video'],
    endpoints: {
      analyze: {
        method: 'POST',
        path: '/api/analysis/analyze',
        image: 'multipart/form-data — field "type"=image, file field "advertisement"',
        text: 'application/json or multipart/form-data — "type"=text, "text"="..."',
      },
    },
  });
});

export default router;
