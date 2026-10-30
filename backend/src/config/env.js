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

  // Gemini — unused until Milestone 2, but validated here so the AI service
  // can fail fast with a clear message instead of a confusing SDK error.
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
};

export default env;
