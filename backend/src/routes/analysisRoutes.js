// ============================================================================
// Analysis Routes
// Defines the /api/analysis/* endpoints and wires up validation middleware
// + the AnalysisController. Mounted in server.js under /api/analysis.
// ============================================================================

import { Router } from 'express';
import analysisController from '../controllers/analysisController.js';
import { validateAnalysisRequest } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/analysis/analyze
 * Main analysis endpoint. Accepts { type, text?, content? } in the body.
 * - Runs validateAnalysisRequest first (400 on bad input)
 * - Delegates to AnalysisController.analyze on success
 */
router.post('/analyze', validateAnalysisRequest, (req, res, next) =>
  analysisController.analyze(req, res, next)
);

/**
 * GET /api/analysis
 * Lightweight info endpoint describing what this route group supports.
 * Handy for quick manual testing / Postman collections.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MindLens Analysis API',
    supportedTypes: ['image', 'text', 'video'],
    endpoints: {
      analyze: 'POST /api/analysis/analyze',
    },
  });
});

export default router;
