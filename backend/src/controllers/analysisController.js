// ============================================================================
// Analysis Controller
// Handles POST /api/analysis/analyze.
//
// Pipeline: middleware validates the request → this file builds the input →
// geminiService talks to Google → validateAIResponse re-checks the answer →
// a single JSON response is assembled here.
//
// The controller is still only an orchestrator: it validates nothing (middleware
// does) and trusts nothing (the AI response is normalised before it is used).
//
// Milestone 2 status: the persuasion analysis is REAL. Every field under
// `techniques`, `visualObservations`, `targetAudienceIndicators` and
// `criticalThinkingQuestions` comes from Gemini; nothing is mocked, and
// `analysisStatus: "analyzed"` is only ever set after validation succeeds.
//
// Milestone 3 will add the Psychology Engine (`cognitiveImpact`), which maps
// techniques onto educational cognitive indicators. Until then that field is
// explicitly null rather than absent, so the frontend has one stable shape.
// ============================================================================

import { randomUUID } from 'node:crypto';

import { env } from '../config/env.js';
import { analyze as analyzeWithGemini } from '../services/geminiService.js';
import { validateAIResponse } from '../utils/validateAIResponse.js';

class AnalysisController {
  /**
   * analyze
   * Entry point for POST /api/analysis/analyze.
   * Validation middleware has already guaranteed `type` is 'image' or 'text',
   * and that the corresponding payload exists.
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
          ? await this.handleImageAnalysis(req.file)
          : await this.handleTextAnalysis(req.body.text);

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

      console.log(
        `✅ Analysis complete in ${Date.now() - startedAt}ms — ` +
          `${result.techniques.length} technique(s)`
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * handleImageAnalysis
   * Sends the uploaded bytes to Gemini as an inline image, then validates the
   * structured answer.
   *
   * @param {Express.Multer.File} file - in-memory upload from multer
   * @returns {Promise<object>} structured result
   */
  async handleImageAnalysis(file) {
    console.log(
      `🖼️  Image received — ${file.originalname} (${file.mimetype}, ${file.size} bytes)`
    );

    const ai = await analyzeWithGemini({
      kind: 'image',
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
    });

    const analysis = validateAIResponse(ai.text, {
      kind: 'image',
      model: ai.model,
    });

    return {
      analysisType: 'image',
      analysisStatus: 'analyzed',

      // What the request visibly contained — facts about the upload, not
      // about the ad's content.
      input: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sizeKb: Number((file.size / 1024).toFixed(1)),
      },

      ...this.buildAnalysisFields(analysis, ai),

      cognitiveImpact: null, // Milestone 3
    };
  }

  /**
   * handleTextAnalysis
   * Sends the submitted advertisement text to Gemini, then validates the
   * structured answer.
   *
   * @param {string} text - validated advertisement text
   * @returns {Promise<object>} structured result
   */
  async handleTextAnalysis(text) {
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;

    console.log(`📝 Text received — ${text.length} chars, ${words} words`);

    const ai = await analyzeWithGemini({ kind: 'text', text: trimmed });

    const analysis = validateAIResponse(ai.text, {
      kind: 'text',
      model: ai.model,
    });

    return {
      analysisType: 'text',
      analysisStatus: 'analyzed',

      input: {
        characters: text.length,
        words,
        // Short preview so the user can confirm we analysed the right text.
        preview: trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed,
      },

      ...this.buildAnalysisFields(analysis, ai),

      cognitiveImpact: null, // Milestone 3
    };
  }

  /**
   * buildAnalysisFields
   * The AI-derived half of the response, identical for both input types.
   * Kept in one place so the two handlers cannot drift apart.
   *
   * @param {object} analysis - output of validateAIResponse
   * @param {{ model: string, durationMs: number }} ai
   * @returns {object}
   */
  buildAnalysisFields(analysis, ai) {
    return {
      adSummary: analysis.adSummary,
      language: analysis.language,
      extractedText: analysis.extractedText,
      visualObservations: analysis.visualObservations,
      techniques: analysis.techniques,
      noTechniquesDetected: analysis.noTechniquesDetected,
      targetAudienceIndicators: analysis.targetAudienceIndicators,
      criticalThinkingQuestions: analysis.criticalThinkingQuestions,
      limitations: analysis.limitations,

      // Provenance. If someone asks "which model said this?", the answer is in
      // the payload rather than buried in a log file.
      ai: {
        provider: 'Google Gemini',
        model: ai.model,
        configuredModel: env.geminiModel,
        latencyMs: ai.durationMs,
        tier: 'free',
      },
    };
  }
}

// Controllers are stateless, so a single shared instance is enough.
export default new AnalysisController();
