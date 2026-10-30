// ============================================================================
// AI Response Validation — the trust boundary
//
// A schema-constrained response is *shaped* like our JSON Schema, but it is not
// verified by anything we control: the model can return empty strings,
// over-long text, invented enum values, or a technique with no evidence.
// Everything below assumes the model is an untrusted remote peer whose output
// must be re-checked before it reaches a student.
//
// Two jobs:
//   1. Structural: parse, coerce, clamp, drop anything unusable.
//   2. Ethical: guarantee the mandatory limitations are present, and refuse to
//      pass through a technique that has no evidence. A technique card without
//      evidence would invite the reader to take a claim on faith, which is the
//      exact habit MindLens exists to challenge.
// ============================================================================

import { MAX_TECHNIQUES } from '../schemas/analysisSchema.js';
import { AIServiceError } from './errorHandler.js';

/** Per-field length ceilings. The schema cannot enforce these (see schema file). */
const LIMITS = {
  summary: 600,
  language: 40,
  extractedText: 4_000,
  techniqueName: 80,
  evidence: 500,
  explanation: 700,
  concept: 120,
  effect: 400,
  question: 300,
  observation: 300,
  indicator: 200,
};

const MAX_QUESTIONS = 6;
const MAX_OBSERVATIONS = 8;
const MAX_INDICATORS = 5;
const MAX_LIMITATIONS = 5;

/**
 * The project's own non-negotiable limitations. Appended when the model's list
 * does not already cover them, so the guarantee does not depend on the model
 * remembering rule 12 of the prompt.
 */
export const CANONICAL_LIMITATIONS = [
  'This describes features of the advertisement, not the reaction of any person to it. MindLens cannot tell you how you or anyone else felt, thought, or decided.',
  'MindLens has no access to the campaign\'s targeting data, audience measurements, or commercial results, so it cannot confirm why the ad was made or whether it worked.',
];

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Clean a model-authored string: coerce, strip control characters, collapse
 * whitespace, trim, and truncate on a word boundary.
 *
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string} empty string when the value is unusable
 */
function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';

  const normalised = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalised.length <= maxLength) return normalised;

  const cut = normalised.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** A cleaned string, or `undefined` — used for optional fields. */
const optional = (value, maxLength) => cleanText(value, maxLength) || undefined;

/** Clean a list of strings, dropping empties and duplicates. */
function cleanStringList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const out = [];

  for (const item of value) {
    const text = cleanText(item, maxLength);
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(text);

    if (out.length >= maxItems) break;
  }

  return out;
}

/** Keep only recognised confidence values. Unknown → omitted, never invented. */
function cleanConfidence(value) {
  const normalised = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return ['high', 'medium', 'low'].includes(normalised) ? normalised : undefined;
}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Extract a JSON object from the model's text output.
 *
 * Structured output normally makes this a plain JSON.parse, but defensive
 * slicing costs nothing and turns a hard failure into a recoverable one if the
 * model wraps the object in prose or a code fence.
 *
 * @param {string} raw
 * @returns {object}
 * @throws {AIServiceError}
 */
export function parseModelJson(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new AIServiceError('Gemini returned an empty analysis.', {
      reason: 'empty_response',
    });
  }

  let candidate = raw.trim();

  // ```json ... ``` fences
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();

  // Prose before/after the object
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first > 0 || last < candidate.length - 1) {
    if (first !== -1 && last > first) candidate = candidate.slice(first, last + 1);
  }

  try {
    const parsed = JSON.parse(candidate);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed;
  } catch {
    throw new AIServiceError(
      'Gemini returned a response that was not valid JSON. Please try again.',
      { reason: 'invalid_json' }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Normalise one technique, or return null if it is not usable.
 * Evidence is mandatory: no evidence, no card.
 */
function normaliseTechnique(item, index) {
  if (!item || typeof item !== 'object') return null;

  const name = cleanText(item.name, LIMITS.techniqueName);
  const evidence = cleanText(item.evidence, LIMITS.evidence);

  // The ethical gate. Two independent failures are possible here: the model
  // omitted evidence, or it returned something too short to point at.
  if (!name || evidence.length < 3) return null;

  return {
    id: `technique-${index + 1}`,
    name,
    evidence,
    explanation: optional(item.explanation, LIMITS.explanation),
    psychologyConcept: optional(item.psychologyConcept, LIMITS.concept),
    possibleEffect: optional(item.possibleEffect, LIMITS.effect),
    confidence: cleanConfidence(item.confidence),
    reflectionQuestion: optional(item.reflectionQuestion, LIMITS.question),
  };
}

/** Normalise the `visualObservations` array (image input only). */
function normaliseObservations(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_OBSERVATIONS)
    .map((item) => ({
      element: cleanText(item?.element, 60),
      description: cleanText(item?.description, LIMITS.observation),
    }))
    .filter((item) => item.element && item.description);
}

/** Normalise the `targetAudienceIndicators` array. */
function normaliseIndicators(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_INDICATORS)
    .map((item) => ({
      indicator: cleanText(item?.indicator, LIMITS.indicator),
      evidence: cleanText(item?.evidence, LIMITS.evidence),
    }))
    .filter((item) => item.indicator && item.evidence);
}

/**
 * Does the model's limitation list already cover the required ideas?
 * Cheap keyword test — deliberately permissive, because a false "yes" leaves
 * the reader with the model's own wording, while a false "no" only duplicates
 * a sentence.
 */
function coversPersonClaim(text) {
  return /(not|never|no)\b[^.]{0,80}(reaction|response|feel|felt|think|thought|decide|decision|individual|viewer|person)/i.test(
    text
  );
}

function coversCampaignData(text) {
  return /(no access|does not have|without|cannot (confirm|know)|lack)[^.]{0,80}(target|audience|campaign|commercial|sales|measurement)/i.test(
    text
  );
}

/**
 * Guarantee the mandatory limitations, keeping the model's wording where it
 * already satisfies the contract.
 */
function normaliseLimitations(value) {
  const fromModel = cleanStringList(value, MAX_LIMITATIONS, LIMITS.question);
  const joined = fromModel.join(' ');

  const required = [];
  if (!coversPersonClaim(joined)) required.push(CANONICAL_LIMITATIONS[0]);
  if (!coversCampaignData(joined)) required.push(CANONICAL_LIMITATIONS[1]);

  return [...required, ...fromModel].slice(0, MAX_LIMITATIONS + 2);
}

/**
 * Turn raw model text into the response object the API returns.
 *
 * @param {string} rawText - `interaction.output_text`
 * @param {object} context
 * @param {'text'|'image'} context.kind
 * @param {string} context.model
 * @returns {object} normalised analysis
 * @throws {AIServiceError} when the response cannot be salvaged
 */
export function validateAIResponse(rawText, { kind, model }) {
  const parsed = parseModelJson(rawText);

  if (!Array.isArray(parsed.techniques)) {
    throw new AIServiceError(
      'Gemini returned an analysis with no technique list, which means the response was incomplete. Please try again.',
      { reason: 'missing_techniques' }
    );
  }

  const techniques = parsed.techniques
    .slice(0, MAX_TECHNIQUES)
    .map(normaliseTechnique)
    .filter(Boolean)
    // A model can repeat itself; one card per technique name is enough.
    .filter(
      (technique, index, all) =>
        all.findIndex(
          (other) => other.name.toLowerCase() === technique.name.toLowerCase()
        ) === index
    );

  const summary = cleanText(parsed.adSummary, LIMITS.summary);

  return {
    model,
    adSummary:
      summary ||
      'The analysis did not return a summary for this advertisement. The details below are still what the AI reported.',
    language: cleanText(parsed.language, LIMITS.language).toLowerCase() || 'unknown',
    extractedText:
      kind === 'image' ? cleanText(parsed.extractedText, LIMITS.extractedText) : '',
    visualObservations: kind === 'image' ? normaliseObservations(parsed.visualObservations) : [],
    techniques,
    // Explicit, so the UI never has to infer "none found" from an empty array
    // it might have produced by dropping malformed cards.
    noTechniquesDetected: techniques.length === 0,
    targetAudienceIndicators: normaliseIndicators(parsed.targetAudienceIndicators),
    criticalThinkingQuestions: cleanStringList(
      parsed.criticalThinkingQuestions,
      MAX_QUESTIONS,
      LIMITS.question
    ),
    limitations: normaliseLimitations(parsed.limitations),
  };
}

export default validateAIResponse;
