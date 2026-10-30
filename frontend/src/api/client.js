// ============================================================================
// API Client
// The single place that knows how to talk to the backend. Components never
// call fetch directly, so the endpoint, error shape and base URL live in
// exactly one file.
// ============================================================================

/**
 * Base URL of the backend.
 * Empty string in development means "same origin", which Vite proxies to
 * localhost:5000 (see vite.config.js). In production, set VITE_API_BASE_URL.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * ApiError
 * Carries the HTTP status and the backend's `details` payload so the UI can
 * show a useful message instead of "Something went wrong".
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status - HTTP status, or 0 for a network failure
   * @param {object|null} details
   */
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Submit an advertisement for analysis.
 *
 * Sends multipart/form-data for both input types so the client has one code
 * path and the backend one parser. Images are sent as a real file upload
 * (never base64-in-JSON), which the server can size-limit before buffering.
 *
 * @param {object} input
 * @param {'image'|'text'} input.type
 * @param {File}   [input.file] - required when type === 'image'
 * @param {string} [input.text] - required when type === 'text'
 * @returns {Promise<object>} the backend's success payload
 * @throws {ApiError}
 */
export async function analyzeAdvertisement({ type, file, text }) {
  const formData = new FormData();
  formData.append('type', type);

  if (type === 'image') {
    formData.append('advertisement', file);
  } else {
    formData.append('text', text);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    // fetch only rejects on network-level failure (server down, DNS, CORS).
    throw new ApiError(
      'Could not reach the MindLens server. Check that the backend is running, then try again.',
      0
    );
  }

  // A non-JSON body means something upstream broke (proxy error page, 502).
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || payload.status === 'error') {
    throw new ApiError(
      payload?.message || `The server responded with an error (${response.status}).`,
      response.status,
      payload?.details ?? null
    );
  }

  return payload;
}

export default { analyzeAdvertisement, ApiError };
