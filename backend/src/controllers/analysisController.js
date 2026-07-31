// ============================================================================
// Analysis Controller
// Handles incoming analysis requests (image, text, video) and delegates
// to the appropriate handler. Gemini integration is stubbed for now and
// will be wired up in Task 1.3 (GeminiService).
// ============================================================================

import { ValidationError } from '../utils/errorHandler.js';

// ----------------------------------------------------------------------------
// PLACEHOLDER — Task 1.3 will replace this with a real import:
// import { GeminiService } from '../services/geminiService.js';
// ----------------------------------------------------------------------------

/**
 * AnalysisController
 * Groups together all the logic for handling /api/analysis/* requests.
 * Each analysis type (image, text, video) has its own dedicated handler
 * method so the logic stays readable as Gemini integration grows.
 */
class AnalysisController {
  /**
   * analyze
   * Main entry point for POST /api/analysis/analyze.
   * Reads the validated "type" field and routes the request to the
   * correct type-specific handler.
   *
   * Validation middleware (validateAnalysisRequest) has already run by
   * the time this executes, so `type` is guaranteed to be one of
   * "image" | "text" | "video".
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async analyze(req, res, next) {
    try {
      const { type } = req.body;

      console.log(`🔍 Received analysis request — type: "${type}"`);

      let result;

      switch (type) {
        case 'image':
          result = await this.handleImageAnalysis(req.body);
          break;
        case 'text':
          result = await this.handleTextAnalysis(req.body);
          break;
        case 'video':
          result = await this.handleVideoAnalysis(req.body);
          break;
        default:
          // Should never hit this because validation middleware already
          // checked "type", but guarded here for safety.
          throw new ValidationError(`Unsupported analysis type: "${type}"`);
      }

      console.log(`✅ Analysis complete — type: "${type}"`);

      res.status(200).json({
        status: 'success',
        type,
        result,
      });
    } catch (err) {
      // Forward to the global error handler
      next(err);
    }
  }

  /**
   * handleImageAnalysis
   * Processes an image analysis request.
   * TODO (Task 1.3): send `content` (base64 image or URL) to GeminiService
   * for media-literacy analysis (manipulation detection, claims, etc.)
   *
   * @param {object} body - validated request body
   * @param {string} body.content - base64-encoded image or image URL
   * @returns {Promise<object>} structured analysis result (placeholder)
   */
  async handleImageAnalysis({ content }) {
    console.log('🖼️  Processing image analysis...');
    console.log(`   Content length: ${content?.length ?? 0} chars`);

    // PLACEHOLDER — replace with: await GeminiService.analyzeImage(content)
    return {
      analysisType: 'image',
      summary: 'Image analysis placeholder — Gemini integration pending (Task 1.3)',
      flags: [],
      confidence: null,
    };
  }

  /**
   * handleTextAnalysis
   * Processes a text advertisement analysis request.
   * TODO (Task 1.3): send `text` to GeminiService for media-literacy
   * analysis (persuasion techniques, emotional manipulation, claims, etc.)
   *
   * @param {object} body - validated request body
   * @param {string} body.text - advertisement or media text to analyze
   * @returns {Promise<object>} structured analysis result (placeholder)
   */
  async handleTextAnalysis({ text }) {
    console.log('📝 Processing text analysis...');
    console.log(`   Text length: ${text?.length ?? 0} chars`);

    // PLACEHOLDER — replace with: await GeminiService.analyzeText(text)
    return {
      analysisType: 'text',
      summary: 'Text analysis placeholder — Gemini integration pending (Task 1.3)',
      flags: [],
      confidence: null,
    };
  }

  /**
   * handleVideoAnalysis
   * Processes a video analysis request.
   * TODO (Task 1.3): send `content` (base64 video, URL, or frame set) to
   * GeminiService for media-literacy analysis.
   *
   * @param {object} body - validated request body
   * @param {string} body.content - base64-encoded video or video URL
   * @returns {Promise<object>} structured analysis result (placeholder)
   */
  async handleVideoAnalysis({ content }) {
    console.log('🎬 Processing video analysis...');
    console.log(`   Content length: ${content?.length ?? 0} chars`);

    // PLACEHOLDER — replace with: await GeminiService.analyzeVideo(content)
    return {
      analysisType: 'video',
      summary: 'Video analysis placeholder — Gemini integration pending (Task 1.3)',
      flags: [],
      confidence: null,
    };
  }
}

// Export a single shared instance (controllers are stateless here,
// so one instance is enough for the whole app)
export default new AnalysisController();
