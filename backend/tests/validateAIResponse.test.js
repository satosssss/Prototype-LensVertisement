// ============================================================================
// Tests for the AI trust boundary — no network, no API key needed.
//
//   npm test
//
// Uses Node's built-in test runner (node:test), so there is no test framework
// dependency. These are the checks that must hold regardless of what the model
// says: no evidence, no card; no invented confidence; limitations always
// present; text input never invents a transcript.
// ============================================================================

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MAX_TECHNIQUES } from '../src/schemas/analysisSchema.js';
import { AIServiceError } from '../src/utils/errorHandler.js';
import {
  CANONICAL_LIMITATIONS,
  parseModelJson,
  validateAIResponse,
} from '../src/utils/validateAIResponse.js';

/** A complete, well-formed model response used as the baseline. */
const validResponse = {
  adSummary: 'A poster advertising a stationery sale that ends on Friday.',
  language: 'EN',
  extractedText: 'MEGA SALE — 50% OFF — ENDS FRIDAY',
  visualObservations: [
    { element: 'Main subject', description: 'A red price tag on a white background.' },
  ],
  techniques: [
    {
      name: 'Scarcity',
      evidence: 'ENDS FRIDAY',
      explanation:
        'A deadline gives the reader a reason to decide sooner rather than later.',
      psychologyConcept: 'Scarcity heuristic',
      possibleEffect: 'May encourage a sense of urgency.',
      confidence: 'high',
      reflectionQuestion: 'What happens to the price after Friday?',
    },
  ],
  targetAudienceIndicators: [
    { indicator: 'Student pricing', evidence: '"student" appears under the price' },
  ],
  criticalThinkingQuestions: ['Who benefits if you buy today?'],
  limitations: [
    'This describes the advertisement, not how any person reacts to it.',
    'It has no access to the campaign targeting data or commercial results.',
  ],
};

const asJson = (value) => JSON.stringify(value);

test('a well-formed response passes through intact', () => {
  const result = validateAIResponse(asJson(validResponse), { kind: 'image', model: 'test-model' });

  assert.equal(result.model, 'test-model');
  assert.equal(result.language, 'en');
  assert.equal(result.techniques.length, 1);
  assert.equal(result.techniques[0].name, 'Scarcity');
  assert.equal(result.techniques[0].confidence, 'high');
  assert.equal(result.noTechniquesDetected, false);
  assert.equal(result.visualObservations.length, 1);
});

test('a technique with no evidence is dropped, not shown', () => {
  const payload = {
    ...validResponse,
    techniques: [
      { ...validResponse.techniques[0], name: 'Bandwagon', evidence: '' },
      validResponse.techniques[0],
    ],
  };

  const result = validateAIResponse(asJson(payload), { kind: 'image', model: 'm' });

  assert.deepEqual(
    result.techniques.map((t) => t.name),
    ['Scarcity']
  );
});

test('an unrecognised confidence is omitted rather than guessed', () => {
  const payload = {
    ...validResponse,
    techniques: [{ ...validResponse.techniques[0], confidence: 'very high' }],
  };

  const result = validateAIResponse(asJson(payload), { kind: 'image', model: 'm' });

  assert.equal(result.techniques[0].confidence, undefined);
});

test('duplicate technique names produce one card', () => {
  const payload = {
    ...validResponse,
    techniques: [
      validResponse.techniques[0],
      { ...validResponse.techniques[0], name: 'scarcity' },
    ],
  };

  const result = validateAIResponse(asJson(payload), { kind: 'image', model: 'm' });

  assert.equal(result.techniques.length, 1);
});

test('the technique list is capped and ids stay unique', () => {
  const payload = {
    ...validResponse,
    techniques: Array.from({ length: MAX_TECHNIQUES + 4 }, (_, i) => ({
      ...validResponse.techniques[0],
      name: `Technique ${i}`,
    })),
  };

  const result = validateAIResponse(asJson(payload), { kind: 'image', model: 'm' });

  assert.equal(result.techniques.length, MAX_TECHNIQUES);
  assert.equal(new Set(result.techniques.map((t) => t.id)).size, MAX_TECHNIQUES);
});

test('no techniques is a valid answer', () => {
  const result = validateAIResponse(
    asJson({ ...validResponse, techniques: [] }),
    { kind: 'text', model: 'm' }
  );

  assert.equal(result.techniques.length, 0);
  assert.equal(result.noTechniquesDetected, true);
});

test('text input never invents a transcript or visual observations', () => {
  const result = validateAIResponse(asJson(validResponse), { kind: 'text', model: 'm' });

  assert.equal(result.extractedText, '');
  assert.deepEqual(result.visualObservations, []);
});

test('the mandatory limitations are restored when the model omits them', () => {
  const result = validateAIResponse(
    asJson({ ...validResponse, limitations: ['The image is low resolution.'] }),
    { kind: 'image', model: 'm' }
  );

  for (const required of CANONICAL_LIMITATIONS) {
    assert.ok(result.limitations.includes(required), `missing: ${required}`);
  }
  assert.ok(result.limitations.includes('The image is low resolution.'));
});

test('the mandatory limitations are not duplicated when already covered', () => {
  const result = validateAIResponse(asJson(validResponse), { kind: 'image', model: 'm' });

  assert.deepEqual(result.limitations, validResponse.limitations);
});

test('over-long fields are truncated', () => {
  const result = validateAIResponse(
    asJson({ ...validResponse, adSummary: 'word '.repeat(400) }),
    { kind: 'image', model: 'm' }
  );

  assert.ok(result.adSummary.length <= 601, `got ${result.adSummary.length}`);
});

test('a missing technique list is treated as an incomplete response', () => {
  assert.throws(
    () =>
      validateAIResponse(asJson({ ...validResponse, techniques: undefined }), {
        kind: 'image',
        model: 'm',
      }),
    (err) => err instanceof AIServiceError && err.details.reason === 'missing_techniques'
  );
});

test('invalid JSON fails loudly instead of returning partial data', () => {
  assert.throws(
    () => validateAIResponse('I cannot help with that.', { kind: 'text', model: 'm' }),
    (err) => err instanceof AIServiceError && err.details.reason === 'invalid_json'
  );
});

test('fenced and prose-wrapped JSON is still parsed', () => {
  const fenced = `Here is the analysis:\n\`\`\`json\n${asJson(validResponse)}\n\`\`\`\nDone.`;
  const parsed = parseModelJson(fenced);

  assert.equal(parsed.adSummary, validResponse.adSummary);
});
