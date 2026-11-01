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
let AITimeoutError;

/**
 * The next response the mock server should send.
 * `status: 'hang'` means "accept the request and never answer", which is how
 * the timeout path is exercised.
 * @type {{ status: number|'hang', body: object }}
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

      // Black hole: the caller must give up on its own deadline.
      if (nextResponse.status === 'hang') return;

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
  // Deliberately short so the timeout test does not stall the suite.
  process.env.GEMINI_TIMEOUT_MS = '800';
  // Deliberately UPPER CASE: the API only accepts lowercase, and config/env.js
  // is responsible for normalising it.
  process.env.GEMINI_THINKING_LEVEL = 'LOW';

  // Point the real SDK at our server instead of Google.
  setDefaultBaseUrls({ geminiUrl: `http://127.0.0.1:${port}` });

  ({ analyze } = await import('../src/services/geminiService.js'));
  ({ AIRateLimitError, AITimeoutError } = await import('../src/utils/errorHandler.js'));
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

  // GEMINI_THINKING_LEVEL=LOW must reach the wire as 'low'. Sending 'LOW'
  // is rejected by the API with HTTP 400.
  assert.equal(body.generation_config.thinking_level, 'low');

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

test('a 503 becomes a "Gemini is busy" error that does not leak internals', async () => {
  received.length = 0;
  nextResponse = {
    status: 503,
    body: {
      error: {
        code: 503,
        message: 'gemini-3.8-flash is currently experiencing high demand',
        status: 'UNAVAILABLE',
      },
    },
  };

  await assert.rejects(
    () => analyze({ kind: 'text', text: 'test' }),
    (err) => {
      assert.equal(err.status, 502);
      assert.equal(err.details.reason, 'model_overloaded');
      assert.match(err.message, /busy right now/i);
      // The upstream Google message is for our logs, not the browser.
      assert.equal(err.details.upstream, undefined);
      return true;
    }
  );
});

test('a call that overruns the deadline is a 504 timeout and is NOT retried', async () => {
  received.length = 0;
  nextResponse = { status: 'hang', body: {} };

  const startedAt = Date.now();

  await assert.rejects(
    () => analyze({ kind: 'text', text: 'test' }),
    (err) => {
      // The SDK wraps our abort in a transport error whose `name` is not
      // 'AbortError' — only its message mentions it. If that is missed, the
      // timeout surfaces as a generic 502 AND gets retried.
      assert.ok(err instanceof AITimeoutError);
      assert.equal(err.status, 504);
      assert.equal(err.details.reason, 'timeout');
      return true;
    }
  );

  // One request, one deadline. Retrying a timeout doubles the wait for the user.
  assert.equal(received.length, 1);
  assert.ok(
    Date.now() - startedAt < 3_000,
    'should give up at the configured deadline, not retry'
  );
});
