// ============================================================================
// MindLens API Server
// AI-powered Media Literacy Analyzer — UNESCO Youth Hackathon 2026
// ============================================================================

// ----------------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------------
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

// Load environment variables from .env into process.env
dotenv.config();

// Server port — falls back to 5000 if not defined in the environment
const PORT = process.env.PORT || 5000;

// Current environment (development | production | test)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allowed origin for CORS — the frontend URL (React app)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create the Express application instance
const app = express();

// ----------------------------------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------------------------------

/**
 * CORS Middleware
 * Restricts cross-origin requests to the configured frontend URL only.
 * This prevents unauthorized domains from calling the API directly
 * from a browser context.
 */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

/**
 * Body Parsers
 * - express.json(): parses incoming JSON payloads (e.g. article text,
 *   analysis requests). Limit raised to 50mb to comfortably support
 *   large text blobs, base64 images, or transcripts submitted for analysis.
 * - express.urlencoded(): parses URL-encoded form submissions.
 *   extended: true allows rich objects/arrays to be encoded.
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------------------------------
// ROUTES
// ----------------------------------------------------------------------------

/**
 * GET /
 * Root endpoint — basic API metadata and a map of available endpoints.
 * Useful as a quick sanity check that the server is deployed and reachable.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'MindLens API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      analyze: 'POST /api/analysis/analyze (coming soon)',
    },
  });
});

/**
 * GET /health
 * Health check endpoint used by uptime monitors, load balancers, and
 * deployment platforms (e.g. Render) to verify the service is alive.
 *
 * @returns {object} status, ISO timestamp, and process uptime in seconds
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ----------------------------------------------------------------------------
// ERROR HANDLING
// ----------------------------------------------------------------------------

/**
 * 404 Handler
 * Catches any request that didn't match a defined route above.
 * Must be registered AFTER all valid routes.
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Global Error Handler
 * Catches errors thrown/passed via next(err) anywhere in the app.
 * Must be registered LAST, and must have exactly 4 arguments so
 * Express recognizes it as an error-handling middleware.
 */
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack || err);

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ----------------------------------------------------------------------------
// START SERVER
// ----------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log('🚀 MindLens API Server is running!');
  console.log(`🌐 URL:          http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`⚙️  Environment:  ${NODE_ENV}`);
  console.log(`🔗 Allowed CORS origin: ${FRONTEND_URL}`);
});

// Export app for testing (e.g. with supertest + jest)
export default app;
