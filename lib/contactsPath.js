
/**
 * Centralize the external contacts.js file path.
 * You can override with an env var CONTACTS_FILE_PATH if needed.
 * Dual-exported for ESM and CJS compatibility across Next runtimes.
 */

const DEFAULT_WINDOWS_PATH = 'C:\\Server\\htdocs\\REST\\contacts.js';

const CONTACTS_FILE_PATH =
  process.env.CONTACTS_FILE_PATH && process.env.CONTACTS_FILE_PATH.trim().length > 0
    ? process.env.CONTACTS_FILE_PATH
    : DEFAULT_WINDOWS_PATH;

// ESM named export
export { CONTACTS_FILE_PATH };

// CJS export (best-effort, ignored in pure ESM)
try {
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { CONTACTS_FILE_PATH };
  }
} catch {
  // ignore if not available
}
