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
| **2 — Gemini integration** | Secure API key handling, multimodal analysis, structured JSON output, OCR | ⬜ Next |
| **3 — Psychology engine** | Technique→concept mapping, cognitive-impact rubric, media literacy insights, reflection questions | ⬜ Not started |
| **4 — Dashboard & report** | Analysis dashboard, visualisations, full report, critical-thinking section | ⬜ Not started |
| **5 — Integration & testing** | End-to-end testing, edge cases, accessibility pass | ⬜ Not started |
| **6 — Deployment** | Vercel + Render + MongoDB Atlas, demo assets, documentation | ⬜ Not started |

> **Milestone 1 note:** the upload → validation → response pipeline is real and tested. The AI analysis step does not exist yet, so the API returns `analysisStatus: "not_analyzed"` and the UI says so explicitly. No mock results are presented as real analysis anywhere in the app.

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
 ↓                  [Milestone 2] Gemini service → multimodal analysis
 ↓                  [Milestone 3] Psychology & Media Literacy Engine
 ↓
Structured JSON response
 ↓
React dashboard (Milestone 4)
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
| AI | Google Gemini (`@google/genai`) | planned — Milestone 2 |
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
    utils/errorHandler.js    # typed error classes + global handler
    server.js                # app assembly + listen
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
    "analysisStatus": "not_analyzed",
    "notice": "Upload received and validated. …",
    "input": { "originalName": "ad.png", "mimeType": "image/png", "sizeBytes": 70400, "sizeKb": 68.8 },
    "techniques": [],
    "cognitiveImpact": null,
    "mediaLiteracy": null,
    "criticalThinkingQuestions": []
  },
  "meta": { "requestId": "…", "durationMs": 2, "processedAt": "…" }
}
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Validation failed (missing field, wrong type, bad JSON) |
| `403` | Origin not allowed by CORS |
| `404` | Route not found |
| `413` | File or body exceeds the size limit |
| `501` | Recognised but unimplemented input (video) |
| `502` | Upstream AI failure (Milestone 2) |

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
| `GEMINI_API_KEY` | *(empty)* | Milestone 2 — never commit |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Milestone 2 |

**frontend/.env**

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | *(empty)* | Backend base URL. Empty = same-origin (dev proxy) |

> Only `VITE_*` variables reach the browser bundle. **Never put a secret in the frontend.**

---

## Security notes

- Uploaded files are held in memory only and never written to disk.
- File types are validated against a MIME allowlist, not the filename extension.
- Request body limits: 1 MB for JSON, 5 MB per uploaded file.
- CORS allows only explicitly configured origins.
- `.env` files are gitignored; `.env.example` documents the required keys.
- Stack traces are returned only when `NODE_ENV=development`.

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

1. **Milestone 2** — Gemini service (`@google/genai`), structured JSON schema, response validation, text extraction from images.
2. **Milestone 3** — Psychology & Media Literacy Engine: technique→concept mapping, documented cognitive-impact rubric, insight and question generation.
3. **Milestone 4** — Dashboard, cognitive-impact visualisation, full report, critical-thinking module.
4. **Milestone 5** — End-to-end tests, edge cases, accessibility audit.
5. **Milestone 6** — Deploy (Vercel + Render + Atlas), demo advertisements, presentation.

---

## License

MIT
