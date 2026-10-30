// ============================================================================
// Gemini Service
//
// The only file in the codebase that talks to Google. Controllers call
// `analyze()` and receive plain text; they never see the SDK, the model name
// handling, or the error taxonomy.
//
// Responsibilities, in order:
//   1. Refuse to run without an API key (clear error, not a confusing SDK one).
//   2. Build a structured-output request (schema-constrained JSON).
//   3. Enforce a hard deadline.
//   4. Translate upstream failures into MindLens errors the UI can act on.
//
// What it does NOT do: validate the model's answer. That is the trust boundary
// in utils/validateAIResponse.js — the service must treat the model as an
// untrusted remote peer.
//
// Free-tier note: this integration is designed for the Gemini free tier, which
// costs nothing but is rate-limited per project and may use submitted content
// to improve Google's products. See backend/.env.example.
// ============================================================================

import { GoogleGenAI } from '@google/genai';

import { env } from '../config/env.js';
import { analysisResponseSchema } from '../schemas/analysisSchema.js';
import {
  IMAGE_PROMPT,
  SYSTEM_INSTRUCTION,
  buildTextPrompt,
} from '../prompts/analysisPrompt.js';
import {
  AIRateLimitError,
  AIServiceError,
  AITimeoutError,
} from '../utils/errorHandler.js';

/** One transient retry only — enough for a blip, not enough to burn quota. */
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1_500;

/** @type {GoogleGenAI|null} Lazily created so a missing key never breaks boot. */
let client = null;

/** True when the server has everything it needs to call Gemini. */
export function isConfigured() {
  return Boolean(env.geminiApiKey);
}

function getClient() {
  if (!isConfigured()) {
    throw new AIServiceError(
      'The AI analysis service is not configured on this server. ' +
        'Add GEMINI_API_KEY to backend/.env and restart.',
      { reason: 'missing_api_key' }
    );
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: env.geminiApiKey,
      httpOptions: {
        // The SDK's own deadline. The AbortController below is the hard stop;
        // this just lets the SDK give up first with a tidier error.
        timeout: env.geminiTimeoutMs,
      },
    });
  }

  return client;
}

/** Numeric HTTP status from an SDK/network error, or 0 if there isn't one. */
const statusOf = (err) => {
  const raw =
    err?.status ?? err?.statusCode ?? err?.error?.code ?? err?.cause?.status ?? err?.code;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const messageOf = (err) => String(err?.message ?? err ?? 'Unknown error');

/**
 * True for failures worth retrying: upstream 5xx and connection-level errors.
 * A 429 is deliberately NOT retryable — free-tier quotas reset on a schedule,
 * not in 1.5 seconds, so retrying only wastes the user's remaining quota.
 */
const isTransient = (err) => {
  if (err?.name === 'AbortError') return false;
  const status = statusOf(err);
  return status === 0 || status >= 500;
};

/**
 * Map an upstream failure onto a MindLens error.
 * @param {Error} err
 * @returns {Error}
 */
function translateError(err) {
  if (err instanceof AIServiceError || err instanceof AIRateLimitError) {
    return err;
  }

  if (err?.name === 'AbortError') {
    return new AITimeoutError(
      `The AI analysis took longer than ${Math.round(env.geminiTimeoutMs / 1000)} seconds and was stopped. Please try again.`,
      { reason: 'timeout' }
    );
  }

  const status = statusOf(err);
  const upstream = messageOf(err);

  if (status === 429) {
    return new AIRateLimitError(
      'The free Gemini quota for this project has been reached. ' +
        'Wait about a minute and try again. If it keeps happening, check the ' +
        'daily limit at https://aistudio.google.com/rate-limit.',
      { reason: 'quota_exceeded', upstreamStatus: status }
    );
  }

  if (status === 401 || status === 403) {
    return new AIServiceError(
      'The Gemini API key was rejected. Check that GEMINI_API_KEY in backend/.env is valid and enabled for the Gemini API.',
      { reason: 'auth_failed', upstreamStatus: status }
    );
  }

  if (status === 404) {
    return new AIServiceError(
      `The model "${env.geminiModel}" was not found or is not available to this API key. Check GEMINI_MODEL.`,
      { reason: 'model_not_found', model: env.geminiModel }
    );
  }

  if (status === 400) {
    // Usually a request we built wrongly (unsupported schema keyword, image
    // format). Not the user's fault, so it stays a 502 — but the upstream
    // message is kept in `details` because it is the only clue we get.
    return new AIServiceError(
      'Gemini rejected the analysis request. This is a problem with the request MindLens sent, not with your advertisement.',
      { reason: 'invalid_request', upstreamStatus: status, upstream }
    );
  }

  return new AIServiceError(
    'The AI analysis service could not complete the request. Please try again.',
    { reason: 'upstream_error', upstreamStatus: status, upstream }
  );
}

/** Sleep without pulling in a dependency. */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build the interaction input for either input type.
 * @returns {string|Array<object>}
 */
function buildInput({ kind, text, fileBuffer, mimeType }) {
  if (kind === 'image') {
    if (!fileBuffer?.length) {
      throw new AIServiceError('No image data reached the AI service.', {
        reason: 'empty_image',
      });
    }

    // Gemini accepts inline base64 up to 20 MB per request; our upload limit
    // is 5 MB, so the buffer always fits. The text part comes first so the
    // model reads the instructions before the pixels.
    return [
      { type: 'text', text: IMAGE_PROMPT },
      {
        type: 'image',
        data: fileBuffer.toString('base64'),
        mime_type: mimeType,
      },
    ];
  }

  return buildTextPrompt(text);
}

/**
 * Analyze one advertisement with Gemini.
 *
 * @param {object} input
 * @param {'text'|'image'} input.kind
 * @param {string} [input.text]        - required when kind === 'text'
 * @param {Buffer} [input.fileBuffer]  - required when kind === 'image'
 * @param {string} [input.mimeType]    - required when kind === 'image'
 * @returns {Promise<{ text: string, model: string, durationMs: number }>}
 * @throws {AIServiceError|AIRateLimitError|AITimeoutError}
 */
export async function analyze({ kind, text, fileBuffer, mimeType }) {
  const ai = getClient();
  const startedAt = Date.now();

  const params = {
    model: env.geminiModel,
    input: buildInput({ kind, text, fileBuffer, mimeType }),
    system_instruction: SYSTEM_INSTRUCTION,

    // Schema-constrained JSON. `type: 'text'` is required by this API shape.
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: analysisResponseSchema,
    },

    generation_config: {
      max_output_tokens: env.geminiMaxOutputTokens,
      ...(env.geminiThinkingLevel
        ? { thinking_level: env.geminiThinkingLevel }
        : {}),
    },

    // Do not ask Google to retain the advertisement for later retrieval.
    // (Free-tier training-data usage is a separate policy — see .env.example.)
    store: false,
  };

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.geminiTimeoutMs);

    try {
      const interaction = await ai.interactions.create(params, {
        signal: controller.signal,

        // Disable the SDK's built-in retry loop. By default it retries HTTP 429
        // and 5xx up to 5 times with exponential backoff: on our 429 test that
        // meant ~7 seconds and five quota-consuming requests before the user
        // saw an error. Note the retry option must be passed PER REQUEST —
        // `httpOptions.retryOptions` on the client is silently ignored by the
        // Interactions bridge in @google/genai 2.32.0.
        maxRetries: 0,

        // Bounds the whole call, including continuation hops.
        timeout: env.geminiTimeoutMs,
      });

      const output = interaction?.output_text;

      if (typeof output !== 'string' || output.trim() === '') {
        throw new AIServiceError(
          'Gemini returned an empty response. Please try again.',
          { reason: 'empty_response' }
        );
      }

      return {
        text: output,
        model: interaction?.model || env.geminiModel,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      // Errors we raised ourselves are final — retrying them would just repeat
      // the same failure.
      if (
        err instanceof AIServiceError ||
        err instanceof AIRateLimitError ||
        err instanceof AITimeoutError
      ) {
        throw err;
      }

      lastError = translateError(err);

      // Never retry configuration/quota failures, only upstream blips.
      if (attempt >= MAX_ATTEMPTS || !isTransient(err)) {
        throw lastError;
      }

      console.warn(
        `⚠️  Gemini attempt ${attempt} failed (${messageOf(err).slice(0, 160)}). Retrying once…`
      );
      await wait(RETRY_DELAY_MS);
    } finally {
      clearTimeout(timer);
    }
  }

  // Unreachable in practice; keeps the function total.
  throw translateError(lastError ?? new Error('Gemini request failed'));
}

export default { analyze, isConfigured };
