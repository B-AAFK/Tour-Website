// =============================================================================
// Cape Private Tours — Guest Reviews Repository Service (Phase-2 API Ready)
// =============================================================================

import { storageGet, storageSet } from '../core/errorHandler.js';
import { validateReviewPayload } from '../utils/validator.js';

export const REVIEWS_STORAGE_KEY = 'cape_private_tours_guest_stories';
export const MAX_STORED_REVIEWS = 25;
export const REVIEW_MIN_INTERACTION_MS = 2000;
export const REVIEW_COOLDOWN_MS = 30000;

let lastSubmittedAt = 0;

export const SEED_REVIEWS = [
  {
    id: 'story-1',
    name: 'Eleanor & Mark Davies',
    location: 'Edinburgh, Scotland',
    rating: 5,
    quote: 'Lance read the morning wind and clouds with uncanny precision. Instead of battling fog at Table Mountain, we spent early morning watching penguins along the quiet granite rocks of Simons Town, then crested the mountain in golden late-afternoon light.'
  },
  {
    id: 'story-2',
    name: 'Marcus & Chloe Vance',
    location: 'Melbourne, Australia',
    rating: 5,
    quote: 'No coach-bus crowds, no loudspeakers, and no rush. Traveling with Lance felt like exploring the Cape with an old friend who knows every private pull-off along Chapmans Peak and every family-run cellar in the valley.'
  },
  {
    id: 'story-3',
    name: 'Dr. Claire Dupont',
    location: 'Geneva, Switzerland',
    rating: 5,
    quote: 'The botanical depth and wildlife insight were world-class. From rare fynbos proteas at Kirstenbosch to wild baboon troops along the coastal cliffs of Cape Point, Lance adapted every turn around our spontaneous curiosities.'
  }
];

//------------------------------------------------------------------------------------//
/**
 * Sanitizes and schema-checks an individual stored review object.
 * @param {unknown} item - Raw parsed entry from storage.
 * @returns {Object|null} Validated review record or null if malformed.
 */
function sanitizeStoredReview(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.name === 'string' && item.name.toLowerCase().includes('julia vance')) {
    return null;
  }
  const check = validateReviewPayload({
    name: item.name,
    location: item.location || item.country,
    rating: item.rating,
    quote: item.quote
  });
  if (!check.valid) return null;

  const id = typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 64
    ? item.id
    : `story-${Date.now()}`;
  return { id, ...check.data };
}

//------------------------------------------------------------------------------------//
/**
 * Fetches stored guest stories with schema validation and corrupted-storage fallback.
 * @returns {Promise<Array<Object>>} Validated list of guest story records.
 */
export async function fetchReviews() {
  const stored = storageGet(REVIEWS_STORAGE_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) {
    const validRecords = stored
      .map(sanitizeStoredReview)
      .filter(Boolean)
      .slice(0, MAX_STORED_REVIEWS);

    if (validRecords.length > 0) {
      return validRecords;
    }
  }
  return [...SEED_REVIEWS];
}

//------------------------------------------------------------------------------------//
/**
 * Resets the in-memory review submission cooldown (intended for automated unit tests).
 * @returns {void}
 */
export function resetReviewServiceState() {
  lastSubmittedAt = 0;
}

//------------------------------------------------------------------------------------//
/**
 * Validates, anti-bot checks, and persists a newly submitted guest story.
 * @param {Object} payload - Raw form fields ({ name, location, rating, quote }).
 * @param {Object} [meta={}] - Anti-bot metadata ({ honeypot, formOpenedAt, now }).
 * @returns {Promise<{ ok: boolean, botIgnored?: boolean, review?: Object, errors?: Object, message?: string }>} Submission result.
 */
export async function createReview(payload, meta = {}) {
  const now = typeof meta.now === 'number' ? meta.now : Date.now();
  const honeypot = typeof meta.honeypot === 'string' ? meta.honeypot.trim() : '';

  if (honeypot.length > 0) {
    return { ok: true, botIgnored: true };
  }

  if (typeof meta.formOpenedAt === 'number' && now - meta.formOpenedAt < REVIEW_MIN_INTERACTION_MS) {
    return {
      ok: false,
      errors: {},
      message: 'Please take a moment to review your story before submitting.'
    };
  }

  if (lastSubmittedAt > 0 && now - lastSubmittedAt < REVIEW_COOLDOWN_MS) {
    const waitSec = Math.ceil((REVIEW_COOLDOWN_MS - (now - lastSubmittedAt)) / 1000);
    return {
      ok: false,
      errors: {},
      message: `Please wait ${waitSec} seconds before submitting another review.`
    };
  }

  const validation = validateReviewPayload(payload);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors,
      message: validation.message
    };
  }

  const newEntry = {
    id: `story-${now}`,
    ...validation.data
  };

  const existing = await fetchReviews();
  const nextList = [newEntry, ...existing].slice(0, MAX_STORED_REVIEWS);
  storageSet(REVIEWS_STORAGE_KEY, nextList);
  lastSubmittedAt = now;

  return { ok: true, review: newEntry };
}

//------------------------------End of file---------------------------------------------------//
