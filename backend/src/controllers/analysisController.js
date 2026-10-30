// ============================================================================
// Analysis Controller
// Handles POST /api/analysis/analyze.
//
// CURRENT STATE (Milestone 1): the upload → validation → response pipeline is
// real and complete. The AI reasoning is NOT — Gemini is wired up in
// Milestone 2. Every response therefore declares `analysisStatus:
// "not_analyzed"` so the frontend can never mistake a pipeline check for an
// actual analysis.
//
// This file only orchestrates: it validates nothing (middleware does that) and
// interprets nothing (the Psychology Engine will do that in Milestone 3).
// ============================================================================

import { randomUUID } from 'node:crypto';

/** Notice attached to every Milestone 1 response. */
const PENDING_NOTICE =
  'Upload received and validated. Persuasion analysis is not connected yet — ' +
  'the AI analysis step is implemented in Milestone 2.';

class AnalysisController {
  /**
   * analyze
   * Entry point for POST /api/analysis/analyze.
   * Dispatches to a type-specific handler. Validation middleware has already
   * guaranteed `type` is one of ACTIVE_TYPES.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async analyze(req, res, next) {
    const startedAt = Date.now();
    const { type } = req.body;

    try {
      console.log(`🔍 Analysis request — type: "${type}"`);

      const result =
        type === 'image'
          ? this.handleImageAnalysis(req.file)
          : this.handleTextAnalysis(req.body.text);

      res.status(200).json({
        status: 'success',
        type,
        result,
        meta: {
          requestId: randomUUID(),
          durationMs: Date.now() - startedAt,
          processedAt: new Date().toISOString(),
        },
      });

      console.log(`✅ Request handled in ${Date.now() - startedAt}ms`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * handleImageAnalysis
   * Describes the uploaded image without interpreting it.
   * TODO (Milestone 2): pass `file.buffer` + `file.mimetype` to GeminiService.
   *
   * @param {Express.Multer.File} file - in-memory upload from multer
   * @returns {object} structured result
   */
  handleImageAnalysis(file) {
    console.log(
      `🖼️  Image received — ${file.originalname} (${file.mimetype}, ${file.size} bytes)`
    );

    return {
      analysisType: 'image',
      analysisStatus: 'not_analyzed',
      notice: PENDING_NOTICE,

      // What the request visibly contained — facts, not interpretation.
      input: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sizeKb: Number((file.size / 1024).toFixed(1)),
      },

      // Filled in by later milestones. Kept present and empty rather than
      // omitted, so the frontend has one stable shape to render.
      techniques: [],
      cognitiveImpact: null,
      mediaLiteracy: null,
      criticalThinkingQuestions: [],
    };
  }

  /**
   * handleTextAnalysis
   * Describes the submitted text without interpreting it.
   * TODO (Milestone 2): pass the text to GeminiService.
   *
   * @param {string} text - validated advertisement text
   * @returns {object} structured result
   */
  handleTextAnalysis(text) {
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;

    console.log(`📝 Text received — ${text.length} chars, ${words} words`);

    return {
      analysisType: 'text',
      analysisStatus: 'not_analyzed',
      notice: PENDING_NOTICE,

      input: {
        characters: text.length,
        words,
        // Short preview so the user can confirm we received the right text.
        preview: trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed,
      },

      techniques: [],
      cognitiveImpact: null,
      mediaLiteracy: null,
      criticalThinkingQuestions: [],
    };
  }
}

// Controllers are stateless, so a single shared instance is enough.
export default new AnalysisController();
