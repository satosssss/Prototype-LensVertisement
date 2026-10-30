# MindLens

**An AI-powered media literacy analyzer.** MindLens explains how advertisements attempt to persuade — naming the techniques they use, the psychology those techniques draw on, and the questions worth asking before acting on them.

Built for the **UNESCO Youth Hackathon 2026** (theme: Media Literacy).

---

## What MindLens is — and is not

MindLens analyses **advertisements**, not people.

| It does | It does not |
|---|---|
| Identify persuasive techniques visible in an ad | Measure brain activity |
| Explain the psychological concept behind each technique | Read anyone's mind or feelings |
| Suggest effects that *may* be encouraged | Predict how a specific person will react |
| Give questions to help you judge the ad yourself | Diagnose any psychological condition |
| Label estimated indicators as estimates | Prove that an ad manipulated someone |

Every result separates four things: **what the advertisement visibly contains**, **what the AI identified**, **what established psychology suggests may follow**, and **what cannot be concluded from the ad alone**. Cognitive-impact visualisations are documented educational estimates, never measurements.

---

## Project status

| Milestone | Scope | Status |
|---|---|---|
| **1 — Foundation & upload** | Express API, validation, error handling, multipart upload, React app, routing, real API wiring | ✅ Complete |
| **2 — Gemini integration** | Secure API key handling, multimodal analysis, structured JSON output, server-side response validation, OCR | ✅ Complete |
| **3 — Psychology engine** | Technique→concept mapping, cognitive-impact rubric, media literacy insights, reflection questions | ⬜ Next |
| **4 — Dashboard & report** | Analysis dashboard, visualisations, full report, critical-thinking section | ⬜ Not started |
| **5 — Integration & testing** | End-to-end testing, edge cases, accessibility pass | ⬜ Not started |
| **6 — Deployment** | Vercel + Render + MongoDB Atlas, demo assets, documentation | ⬜ Not started |

> **Milestone 2 note:** the analysis is real. Every technique, observation and question in a result comes from Gemini, and `analysisStatus: "analyzed"` is only set after the response passes server-side validation. Anything the model returns without evidence from the ad is discarded, never displayed. There are no mock analyses anywhere in the app.

> **Cost:** MindLens runs entirely on the **Gemini free tier** — operating it costs nothing. Two consequences are documented rather than hidden: requests are rate-limited per project, and Google states that content submitted on the free tier may be used to improve its products. See [AI integration](#ai-integration).

---

## Architecture

```
User
 ↓
React frontend (Vite, React Router)
 ↓  multipart/form-data
Express backend  →  upload middleware (Multer, memory only)
 ↓                  validation middleware
 ↓                  analysis controller
 ↓                  Gemini service → structured JSON (schema-constrained)
 ↓                  response validation (the trust boundary)
 ↓                  [Milestone 3] Psychology & Media Literacy Engine
 ↓
Structured JSON response
 ↓
React results page (Milestone 4 expands to a dashboard)
```

The frontend **never** calls Gemini directly and never holds an API key. All AI requests go through the backend.

---

## Tech stack

| Layer | Choice | Version |
|---|---|---|
| Frontend | React | 19.3 |
| Build tool | Vite | 8.3 |
| Routing | React Router | 7.18 |
| Styling | Tailwind CSS | 3.4 |
| Icons | lucide-react | 1.65 |
| Backend | Node.js + Express | 24 / 4.19 |
| Upload | Multer (memory storage) | 2.5 |
| AI | Google Gemini (`@google/genai`) | 2.32 — free tier |
| Database | MongoDB + Mongoose | planned — only where persistence adds value |

---

## Repository structure

```
backend/
  src/
    config/env.js            # single source of truth for env vars
    controllers/             # HTTP orchestration only
    middleware/              # upload parsing, request validation
    routes/                  # endpoint definitions
    services/geminiService.js # the only file that talks to Google
    schemas/analysisSchema.js # structured-output contract given to Gemini
    prompts/analysisPrompt.js # the ethics contract, in prompt form
    utils/validateAIResponse.js # the trust boundary: model output is re-checked
    utils/errorHandler.js    # typed error classes + global handler
    server.js                # app assembly + listen
  tests/                     # node:test suites — no network, no API key needed
  .env.example
frontend/
  src/
    api/client.js            # the only file that talks to the backend
    context/                 # analysis state shared across screens
    components/              # layout, dropzone, technique card, disclaimer
    pages/                   # landing, upload, processing, results, about
    constants.js             # limits mirrored from the backend contract
  .env.example
```

### Conventions

- **`src/` by responsibility.** `config/` holds the only code that reads `process.env`; `controllers/` orchestrate HTTP and nothing else; `middleware/` parses and validates; `services/` talks to the outside world; `schemas/` and `prompts/` hold the AI contract; `utils/` holds pure helpers.
- **`tests/` mirrors the modules it covers**, and runs without a network connection or API key.
- **Config lives at each package root** (`package.json`, `vite.config.js`, `tailwind.config.js`, `.env.example`). Secrets live only in `.env`, which is gitignored, and are documented in `.env.example`.
- **No vendored third-party code.** Dependencies are declared in each package's `package.json` and installed to `node_modules/`, which git ignores. There are no copied libraries or assets to keep in sync by hand.

---

## Getting started (Windows / PowerShell)

### Prerequisites

Node.js is managed with **nvm-windows**. Confirm which version is active before installing anything:

```powershell
nvm list          # shows installed versions; the * marks the active one
node --version
npm --version
```

Node **20.19+** or **22.12+** is required by Vite 8. This project was developed on **24.18.0**.

### 1. Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Then open `backend/.env` and paste a Gemini API key from <https://aistudio.google.com/apikey>:

```
GEMINI_API_KEY=your-key-here
```

The server starts without a key — health checks and validation still work — but every analysis request returns `502` with `"reason": "missing_api_key"` until one is set.

```powershell
npm run dev
```

Expected output:

```
🚀 MindLens API Server is running!
🌐 URL:            http://localhost:5000
❤️  Health check:   http://localhost:5000/health
```

Verify:

```powershell
curl.exe http://localhost:5000/health
```

### 2. Frontend

In a **second terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The Vite dev server proxies `/api` to `localhost:5000`, so the browser makes same-origin requests and CORS never applies during development.

---

## API reference

### `GET /health`

Liveness probe.

### `GET /api/analysis`

Capability discovery — lists supported and deferred input types.

### `POST /api/analysis/analyze`

**Image** — `multipart/form-data`

| Field | Value |
|---|---|
| `type` | `image` |
| `advertisement` | file — JPEG, PNG or WebP, max 5 MB |

**Text** — `application/json` or `multipart/form-data`

| Field | Value |
|---|---|
| `type` | `text` |
| `text` | string, 1–20,000 characters |

**Success (200)**

```json
{
  "status": "success",
  "type": "image",
  "result": {
    "analysisType": "image",
    "analysisStatus": "analyzed",
    "input": { "originalName": "ad.png", "mimeType": "image/png", "sizeBytes": 70400, "sizeKb": 68.8 },

    "adSummary": "A poster advertising a stationery sale that ends on Friday.",
    "language": "en",
    "extractedText": "MEGA SALE — 50% OFF — ENDS FRIDAY",
    "visualObservations": [
      { "element": "Main subject", "description": "A red price tag on a white background." }
    ],
    "techniques": [
      {
        "id": "technique-1",
        "name": "Scarcity",
        "evidence": "ENDS FRIDAY",
        "explanation": "A deadline gives the reader a reason to decide sooner rather than later.",
        "psychologyConcept": "Scarcity heuristic",
        "possibleEffect": "May encourage a sense of urgency.",
        "confidence": "high",
        "reflectionQuestion": "What happens to the price after Friday?"
      }
    ],
    "noTechniquesDetected": false,
    "targetAudienceIndicators": [],
    "criticalThinkingQuestions": ["Who benefits if you buy today?"],
    "limitations": [
      "This describes features of the advertisement, not the reaction of any person to it. …",
      "MindLens has no access to the campaign's targeting data, audience measurements, or commercial results …"
    ],
    "ai": { "provider": "Google Gemini", "model": "gemini-3.8-flash", "latencyMs": 4120, "tier": "free" },
    "cognitiveImpact": null
  },
  "meta": { "requestId": "…", "durationMs": 4302, "processedAt": "…" }
}
```

`techniques` may legitimately be empty — that means no technique could be evidenced, not that the analysis failed. `cognitiveImpact` stays `null` until Milestone 3.

**Errors**

| Status | Meaning |
|---|---|
| `400` | Validation failed (missing field, wrong type, bad JSON) |
| `403` | Origin not allowed by CORS |
| `404` | Route not found |
| `413` | File or body exceeds the size limit |
| `429` | Free-tier Gemini quota reached — wait and retry |
| `501` | Recognised but unimplemented input (video) |
| `502` | Upstream AI failure (bad key, model unavailable, malformed reply) |
| `504` | Gemini did not answer within `GEMINI_TIMEOUT_MS` |

All errors share one shape:

```json
{ "status": "error", "error": "ValidationError", "message": "…", "details": { "field": "type" } }
```

---

## Environment variables

**backend/.env**

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin(s), comma-separated |
| `MAX_UPLOAD_MB` | `5` | Max advertisement image size |
| `GEMINI_API_KEY` | *(empty)* | Gemini API key — never commit |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Must be a **free-tier** model |
| `GEMINI_TIMEOUT_MS` | `60000` | Hard deadline for one AI call |
| `GEMINI_THINKING_LEVEL` | *(empty)* | Optional: `MINIMAL`, `LOW`, `MEDIUM`, `HIGH` |
| `GEMINI_MAX_OUTPUT_TOKENS` | `4096` | Ceiling on a single response |

**frontend/.env**

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty)* | Backend base URL. Empty = same-origin (dev proxy) |

> Only `VITE_*` variables reach the browser bundle. **Never put a secret in the frontend.**

---

## AI integration

### Free tier, by design

MindLens uses **`gemini-3.8-flash`**, the current stable Flash model whose input *and* output are listed as "free of charge" on the [Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing). Nothing in this project requires billing to be enabled.

Three properties of the free tier are handled in code rather than assumed away:

| Property | How MindLens handles it |
|---|---|
| Per-project rate limits (RPM / RPD, reset midnight Pacific) | A `429` from Google becomes a `429` from our API with a plain-language message. The SDK's own retry loop is disabled per request, so one quota error means one request — not five |
| No cost guarantee for paid-only models | `GEMINI_MODEL` defaults to the free model; switching to a paid model (`gemini-4-argon`) is a deliberate config change, not an accident |
| Free-tier content may be used to improve Google's products | Documented in `.env.example` and on the About page; the UI asks users not to upload personal data. `store: false` is sent so Google does not retain the interaction for retrieval |

### The trust boundary

The model is treated as an untrusted remote peer.

1. **Schema first.** `src/schemas/analysisSchema.js` is passed as `response_format`, so the reply is JSON with a fixed shape instead of prose.
2. **Re-check on our side.** `src/utils/validateAIResponse.js` parses, clamps, and drops anything unusable. A technique with no evidence from the ad is removed — it never reaches the UI. An unrecognised `confidence` value is omitted rather than guessed.
3. **Guaranteed limitations.** The two non-negotiable limitations (this describes the ad, not any person; no access to campaign data) are appended when the model's wording does not already cover them.
4. **Honest absence.** An empty technique list is a valid result and the UI says so, instead of padding the page.

### Tests

```powershell
cd backend
npm test
```

`node:test` only — no framework, no network, no API key. The suite covers the validation rules, and a local mock server verifies the real SDK wire format (request shape, base64 image encoding, `output_text` extraction, `429` mapping).

---

## Security notes

- Uploaded files are held in memory only and never written to disk.
- File types are validated against a MIME allowlist, not the filename extension.
- Request body limits: 1 MB for JSON, 5 MB per uploaded file.
- CORS allows only explicitly configured origins.
- `.env` files are gitignored; `.env.example` documents the required keys.
- Stack traces are returned only when `NODE_ENV=development`.
- The Gemini key is read only by the backend; the frontend bundle never contains it.
- Uploaded advertisements are sent to Gemini inline and are not written to disk or a database.

---

## Development workflow

Feature branches off `main`, one reviewer merges:

```
main
 ├── feature/upload
 ├── feature/gemini-integration
 ├── feature/psychology-engine
 ├── feature/dashboard
 └── feature/report
```

Never commit `.env`, API keys, `node_modules`, or uploaded files.

---

## Roadmap

1. **Milestone 3** — Psychology & Media Literacy Engine: technique→concept mapping, documented cognitive-impact rubric, insight and question generation.
2. **Milestone 4** — Dashboard, cognitive-impact visualisation, full report, critical-thinking module.
3. **Milestone 5** — End-to-end tests, edge cases, accessibility audit.
4. **Milestone 6** — Deploy (Vercel + Render + Atlas), demo advertisements, presentation.

---

## License

MIT
