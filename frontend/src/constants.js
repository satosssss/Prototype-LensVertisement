// ============================================================================
// Shared constants
// Values that must match the backend contract. Keeping them here means the
// UI and the API limits are described in one place per side.
// ============================================================================

/** Must stay in sync with backend `MAX_UPLOAD_MB` (.env) — default 5. */
export const MAX_UPLOAD_MB = 5;

/** Must stay in sync with backend ALLOWED_IMAGE_TYPES. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Must stay in sync with backend `maxTextChars`. */
export const MAX_TEXT_CHARS = 20000;

/** Human-readable version of the allowlist, for UI copy. */
export const ALLOWED_IMAGE_LABEL = 'JPEG, PNG or WebP';
