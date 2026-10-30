// ============================================================================
// MindLens API Server
// AI-powered Media Literacy Analyzer — UNESCO Youth Hackathon 2026
//
// Responsibility: assemble the Express app (middleware + routes + error
// handling) and start listening. Business logic lives in controllers/services.
// ============================================================================

import express from 'express';
import cors from 'cors';

import { env } from './config/env.js';
import analysisRoutes from './routes/analysisRoutes.js';
import { globalErrorHandler } from './utils/errorHandler.js';

const app = express();

// ----------------------------------------------------------------------------
// APP-LEVEL SETTINGS
// ----------------------------------------------------------------------------

// Don't advertise the framework in response headers.
app.disable('x-powered-by');

// Render/Vercel sit behind a proxy; trust its X-Forwarded-* headers so
// req.ip and req.protocol are accurate in production.
app.set('trust proxy', 1);

// ----------------------------------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------------------------------

/**
 * CORS
 * Only the configured frontend origin(s) may call this API from a browser.
 * Requests with no Origin header (curl, Postman, server-to-server, health
 * checks) are allowed — CORS is a browser mechanism, not authentication.
 *
 * credentials: false — this API uses no cookies or sessions. Enabling it
 * without a need only widens the attack surface.
 */
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendUrls.includes(origin)) {
        return callback(null, true);
      }

      const err = new Error(
        `Origin "${origin}" is not allowed. Allowed: ${env.frontendUrls.join(', ')}`
      );
      err.name = 'CorsError';
      err.status = 403;
      return callback(err);
    },
    credentials: false,
  })
);

/**
 * Body Parsers
 * - express.json(): JSON text advertisements. 1mb is generous for text.
 * - express.urlencoded(): traditional form posts.
 *
 * Multipart file uploads are NOT handled here — multer parses those in the
 * analysis route, where the size limit is enforced per-file.
 */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ----------------------------------------------------------------------------
// ROUTES
// ----------------------------------------------------------------------------

/**
 * GET /
 * API metadata + endpoint map. Quick sanity check that the server is live.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'MindLens API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      analysisInfo: 'GET /api/analysis',
      analyze: 'POST /api/analysis/analyze',
    },
  });
});

/**
 * GET /health
 * Liveness probe for uptime monitors and deployment platforms (Render).
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(3)),
    environment: env.nodeEnv,
  });
});

/**
 * Analysis Routes — /api/analysis/*
 */
app.use('/api/analysis', analysisRoutes);

// ----------------------------------------------------------------------------
// ERROR HANDLING
// ----------------------------------------------------------------------------

/**
 * 404 Handler — catches anything that matched no route above.
 * Must be registered AFTER all valid routes.
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: 'NotFoundError',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    details: null,
  });
});

/**
 * Global Error Handler — must be LAST, and must have exactly 4 arguments
 * so Express recognises it as error-handling middleware.
 */
app.use(globalErrorHandler);

// ----------------------------------------------------------------------------
// START SERVER
// ----------------------------------------------------------------------------

app.listen(env.port, () => {
  console.log('🚀 MindLens API Server is running!');
  console.log(`🌐 URL:            http://localhost:${env.port}`);
  console.log(`❤️  Health check:   http://localhost:${env.port}/health`);
  console.log(`⚙️  Environment:    ${env.nodeEnv}`);
  console.log(`🔗 Allowed origins: ${env.frontendUrls.join(', ')}`);
  console.log(`📦 Max upload:      ${(env.maxUploadBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(
    `🤖 Gemini:          ${
      env.geminiApiKey
        ? `${env.geminiModel} (free tier)`
        : 'NOT CONFIGURED — add GEMINI_API_KEY to backend/.env'
    }`
  );
});

// Export app for testing (e.g. supertest + jest)
export default app;
