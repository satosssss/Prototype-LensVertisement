// ============================================================================
// Environment Configuration
// Single source of truth for every environment variable the backend reads.
// Every other module imports from here instead of touching process.env,
// so defaults live in exactly one place.
// ============================================================================

import dotenv from 'dotenv';

// Load backend/.env into process.env as early as possible.
// (ES module imports are hoisted, so this runs before any dependent module body.)
dotenv.config();

/**
 * Parse an integer environment variable, falling back when unset/invalid.
 * @param {string|undefined} value
 * @param {number} fallback
 * @returns {number}
 */
const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = process.env.NODE_ENV || 'development';

// FRONTEND_URL may hold a comma-separated list so local + deployed origins
// can both be allowed without code changes.
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',

  port: toInt(process.env.PORT, 5000),

  frontendUrls,

  // Uploads are parsed into memory, so this also caps RAM per request.
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_MB, 5) * 1024 * 1024,

  // Text advertisements are plain strings, so they get a much smaller cap.
  maxTextChars: 20_000,

  // Gemini — free tier only. `gemini-3.8-flash` is the current stable Flash
  // model and is the one model in the line-up whose input AND output are
  // listed as "free of charge" on the pricing page. Do not switch this to
  // `gemini-4-argon` (paid) without confirming the billing implications.
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',

  // Hard deadline for one Gemini call. Measured live on gemini-3.8-flash:
  // a text analysis took 87 s, so a 60 s deadline aborted half the requests.
  // This must stay above the slowest realistic call, but it must exist:
  // without it a stalled request would hold the user's browser open forever.
  geminiTimeoutMs: toInt(process.env.GEMINI_TIMEOUT_MS, 120_000),

  // Optional thinking budget. Empty by default: some models reject levels
  // they do not support, and failing a demo to save a second of latency is a
  // bad trade. Set to minimal / low / medium / high to experiment.
  //
  // The API accepts LOWERCASE only — `MINIMAL` is rejected with HTTP 400
  // ("The value 'MINIMAL' is not supported for 'generation_config.thinking_level'"),
  // so this must never be upper-cased.
  geminiThinkingLevel: (process.env.GEMINI_THINKING_LEVEL || '').trim().toLowerCase(),

  // Free output tokens are still rate-limited by TPM, and a truncated JSON
  // response is unusable, so this is a ceiling rather than a target.
  geminiMaxOutputTokens: toInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 4096),
};

export default env;
