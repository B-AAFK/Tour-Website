// =============================================================================
// Cape Private Tours — Centralized Error Handler & Safe Storage Wrappers
// =============================================================================

let handlersRegistered = false;

//------------------------------------------------------------------------------------//
/**
 * Logs structured diagnostics in development without exposing technical stacks in the UI.
 * @param {string} context - Subsystem label where the error occurred.
 * @param {unknown} error - Caught error or rejection value.
 * @returns {void}
 */
export function reportDevError(context, error) {
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  if (isDev) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[CapePrivateTours:${context}]`, message);
  }
}

//------------------------------------------------------------------------------------//
/**
 * Registers global window error and unhandledrejection listeners once per page lifecycle.
 * @returns {void}
 */
export function initGlobalErrorHandlers() {
  if (handlersRegistered || typeof window === 'undefined') return;
  handlersRegistered = true;

  window.addEventListener('error', (event) => {
    reportDevError('WindowError', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportDevError('UnhandledRejection', event.reason);
  });
}

//------------------------------------------------------------------------------------//
/**
 * Safely reads and parses JSON from localStorage, returning fallback on any failure.
 * @template T
 * @param {string} key - Storage key.
 * @param {T} fallback - Default value when unavailable or corrupted.
 * @returns {T} Parsed value or fallback.
 */
export function storageGet(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch (err) {
    reportDevError('StorageGet', err);
    return fallback;
  }
}

//------------------------------------------------------------------------------------//
/**
 * Safely serializes and writes JSON to localStorage, surviving quota or privacy blocks.
 * @param {string} key - Storage key.
 * @param {unknown} value - JSON-serializable value to persist.
 * @returns {boolean} True if persisted cleanly, false otherwise.
 */
export function storageSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    reportDevError('StorageSet', err);
    return false;
  }
}

//------------------------------End of file---------------------------------------------------//
