// ============================================================================
// Integration test for the Gemini transport layer — NO network, NO API key.
//
//   npm test
//
// A local HTTP server stands in for Google. The real @google/genai SDK client
// talks to it, so this test verifies things a unit test cannot:
//
//   • the request really is a POST to .../interactions
//   • the model, system instruction, JSON schema and generation config are
//     serialised onto the wire (a typo in a field name would show up here)
//   • image bytes are base64-encoded and tagged with the right MIME type
//   • `output_text` is read back out of the SDK's response shape
//   • HTTP 429 becomes our AIRateLimitError, not a generic 502
//
// It does not test the model's judgement — nothing local can.
// ============================================================================

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';

import { setDefaultBaseUrls } from '@google/genai';

/** A valid model answer, matching analysisSchema. */
const MODEL_ANSWER = JSON.stringify({
  adSummary: 'A coffee brand advertisement promising a limited-time discount.',
  language: 'en',
  extractedText: 'ONLY 3 LEFT — ORDER NOW',
  visualObservations: [
    { element: 'Main subject', description: 'A stack of coffee bags on a dark table.' },
  ],
  techniques: [
    {
      name: 'Scarcity',
      evidence: 'ONLY 3 LEFT',
      explanation: 'A low stock count implies the offer may disappear.',
      psychologyConcept: 'Scarcity heuristic',
      possibleEffect: 'May encourage a faster decision.',
      confidence: 'high',
      reflectionQuestion: 'Is the stock count verifiable anywhere?',
    },
  ],
  targetAudienceIndicators: [],
  criticalThinkingQuestions: ['Who benefits from you deciding right now?'],
  limitations: [
    'This describes the advertisement, not how any person reacts to it.',
    'It has no access to the campaign targeting data or commercial results.',
  ],
});

/** Populated by the mock server for each request it receives. */
const received = [];

let server;
let analyze;
let AIRateLimitError;

/**
 * The next response the mock server should send.
 * @type {{ status: number, body: object }}
 */
let nextResponse = { status: 200, body: {} };

before(async () => {
  server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      received.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });

      res.writeHead(nextResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(nextResponse.body));
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  // Env must be set before the service module is imported: config/env.js reads
  // process.env once, at import time.
  process.env.GEMINI_API_KEY = 'test-key-not-real';
  process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  process.env.GEMINI_TIMEOUT_MS = '5000';

  // Point the real SDK at our server instead of Google.
  setDefaultBaseUrls({ geminiUrl: `http://127.0.0.1:${port}` });

  ({ analyze } = await import('../src/services/geminiService.js'));
  ({ AIRateLimitError } = await import('../src/utils/errorHandler.js'));
});

after(() => {
  server?.close();
});

/** Build the response shape the SDK turns into `output_text`. */
const okBody = () => ({
  id: 'interaction-test',
  model: 'gemini-3.8-flash',
  steps: [
    {
      type: 'model_output',
      content: [{ type: 'text', text: MODEL_ANSWER }],
    },
  ],
});

test('a text analysis sends a schema-constrained interactions request', async () => {
  received.length = 0;
  nextResponse = { status: 200, body: okBody() };

  const result = await analyze({ kind: 'text', text: 'ONLY 3 LEFT — ORDER NOW' });

  assert.equal(result.text, MODEL_ANSWER);
  assert.equal(result.model, 'gemini-3.8-flash');

  assert.equal(received.length, 1);
  const [request] = received;

  assert.equal(request.method, 'POST');
  assert.match(request.url, /\/interactions(\?|$)/);

  const body = JSON.parse(request.body);

  assert.equal(body.model, 'gemini-3.8-flash');
  assert.ok(body.system_instruction.includes('Analyse the ADVERTISEMENT'));
  assert.equal(body.response_format.mime_type, 'application/json');
  assert.equal(body.response_format.schema.type, 'object');
  assert.ok(body.response_format.schema.properties.techniques);
  assert.equal(body.generation_config.max_output_tokens, 4096);
  assert.equal(body.store, false);

  // The ad text must survive inside the prompt markers.
  assert.ok(JSON.stringify(body.input).includes('ONLY 3 LEFT'));
  assert.ok(JSON.stringify(body.input).includes('BEGIN ADVERTISEMENT TEXT'));
});

test('an image analysis is sent as base64 with its MIME type', async () => {
  received.length = 0;
  nextResponse = { status: 200, body: okBody() };

  const bytes = Buffer.from('fake-png-bytes');
  await analyze({ kind: 'image', fileBuffer: bytes, mimeType: 'image/png' });

  const body = JSON.parse(received[0].body);
  const parts = body.input;

  assert.ok(Array.isArray(parts));
  assert.equal(parts[0].type, 'text');

  const image = parts.find((part) => part.type === 'image');
  assert.equal(image.mime_type, 'image/png');
  assert.equal(image.data, bytes.toString('base64'));
});

test('a 429 becomes AIRateLimitError, not a generic upstream failure', async () => {
  received.length = 0;
  nextResponse = {
    status: 429,
    body: { error: { code: 429, message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' } },
  };

  await assert.rejects(
    () => analyze({ kind: 'text', text: 'test' }),
    (err) => {
      assert.ok(err instanceof AIRateLimitError);
      assert.equal(err.status, 429);
      assert.match(err.message, /free Gemini quota/i);
      return true;
    }
  );

  // Crucially: exactly one attempt. Retrying a quota error only burns more quota.
  assert.equal(received.length, 1);
});
