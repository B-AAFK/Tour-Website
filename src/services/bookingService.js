// =============================================================================
// Cape Private Tours — Tour Inquiry Service (Phase-2 API Ready)
// =============================================================================

import { storageGet, storageSet } from '../core/errorHandler.js';
import { validateInquiryPayload } from '../utils/validator.js';

export const INQUIRIES_STORAGE_KEY = 'cape_private_tours_inquiries';
export const MAX_STORED_INQUIRIES = 20;
export const INQUIRY_MIN_INTERACTION_MS = 2000;
export const INQUIRY_COOLDOWN_MS = 30000;

let lastSubmittedAt = 0;

//------------------------------------------------------------------------------------//
/**
 * Resets the in-memory inquiry submission cooldown (intended for automated unit tests).
 * @returns {void}
 */
export function resetBookingServiceState() {
  lastSubmittedAt = 0;
}

//------------------------------------------------------------------------------------//
/**
 * Validates, applies anti-bot & cooldown guards, and persists a tour inquiry.
 * @param {Object} payload - Raw concierge inquiry fields.
 * @param {Object} [meta={}] - Anti-bot metadata ({ honeypot, formOpenedAt, now }).
 * @returns {Promise<{ ok: boolean, botIgnored?: boolean, inquiry?: Object, errors?: Object, message?: string }>} Submission result.
 */
export async function submitTourInquiry(payload, meta = {}) {
  const now = typeof meta.now === 'number' ? meta.now : Date.now();
  const honeypot = typeof meta.honeypot === 'string' ? meta.honeypot.trim() : '';

  if (honeypot.length > 0) {
    return { ok: true, botIgnored: true, inquiry: { name: 'Traveler', ...payload } };
  }

  if (typeof meta.formOpenedAt === 'number' && now - meta.formOpenedAt < INQUIRY_MIN_INTERACTION_MS) {
    return {
      ok: false,
      errors: {},
      message: 'Please take a moment to check your contact details before sending.'
    };
  }

  if (lastSubmittedAt > 0 && now - lastSubmittedAt < INQUIRY_COOLDOWN_MS) {
    const waitSec = Math.ceil((INQUIRY_COOLDOWN_MS - (now - lastSubmittedAt)) / 1000);
    return {
      ok: false,
      errors: {},
      message: `Your inquiry was just sent. Please wait ${waitSec} seconds before sending another.`
    };
  }

  const validation = validateInquiryPayload(payload);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors,
      message: validation.message
    };
  }

  const record = {
    ...validation.data,
    timestamp: new Date(now).toISOString()
  };

  const existing = storageGet(INQUIRIES_STORAGE_KEY, []);
  const safeList = Array.isArray(existing) ? existing : [];
  safeList.push(record);
  storageSet(INQUIRIES_STORAGE_KEY, safeList.slice(-MAX_STORED_INQUIRIES));
  lastSubmittedAt = now;

  return { ok: true, inquiry: record };
}

//------------------------------End of file---------------------------------------------------//
