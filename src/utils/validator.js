// =============================================================================
// Cape Private Tours — Centralized Input Validation & Normalization
// =============================================================================

import { STOPS, DURATION_OPTIONS, GROUP_SIZE_OPTIONS } from '../config/tourConfig.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+\d\s().-]{5,30}$/;
const ALLOWED_DESTINATIONS = new Set(STOPS.map((stop) => stop.name));

//------------------------------------------------------------------------------------//
/**
 * Strips ASCII control characters from user-supplied text while preserving newlines if requested.
 * @param {unknown} value - Raw input value.
 * @param {boolean} [allowNewlines=false] - Whether to retain LF/CR characters.
 * @returns {string} Cleaned string.
 */
export function stripControlChars(value, allowNewlines = false) {
  const str = value === null || value === undefined ? '' : String(value);
  if (allowNewlines) {
    return str.replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, '');
  }
  return str.replace(/[\u0000-\u001F\u007F]/g, ' ');
}

//------------------------------------------------------------------------------------//
/**
 * Trims, normalizes control characters, and clamps string length.
 * @param {unknown} value - Raw input value.
 * @param {number} maxLength - Maximum allowed character count.
 * @param {boolean} [multiline=false] - Allow line breaks inside textareas.
 * @returns {string} Normalized string.
 */
export function normalizeText(value, maxLength, multiline = false) {
  const cleaned = stripControlChars(value, multiline).trim();
  const collapsed = multiline
    ? cleaned.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ')
    : cleaned.replace(/\s+/g, ' ');
  return collapsed.slice(0, maxLength).trim();
}

//------------------------------------------------------------------------------------//
/**
 * Validates and normalizes a guest review submission payload.
 * @param {Object} input - Raw review payload.
 * @returns {{ valid: boolean, data: Object|null, errors: Object, message: string }} Validation result.
 */
export function validateReviewPayload(input) {
  const errors = {};
  const name = normalizeText(input?.name, 80);
  const location = normalizeText(input?.location, 80);
  const quote = normalizeText(input?.quote, 800, true);
  const rawRating = Number(input?.rating);
  const rating = Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5 ? rawRating : null;

  if (name.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }
  if (location.length < 2) {
    errors.location = 'Please enter your city and country (at least 2 characters).';
  }
  if (rating === null) {
    errors.rating = 'Please select a star rating between 1 and 5.';
  }
  if (quote.length < 10) {
    errors.quote = 'Please share a brief story (at least 10 characters).';
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    data: valid ? { name, location, rating, quote } : null,
    errors,
    message: valid ? '' : Object.values(errors)[0]
  };
}

//------------------------------------------------------------------------------------//
/**
 * Validates and normalizes a tour inquiry payload against allowlisted stops and options.
 * Supports explicit destination selections as well as the "suggestRoute" option.
 * @param {Object} input - Raw tour inquiry payload.
 * @returns {{ valid: boolean, data: Object|null, errors: Object, message: string }} Validation result.
 */
export function validateInquiryPayload(input) {
  const errors = {};
  const suggestRoute = Boolean(input?.suggestRoute);
  const rawDestinations = Array.isArray(input?.destinations) ? input.destinations : [];
  const destinations = [];

  if (!suggestRoute) {
    for (const item of rawDestinations) {
      const normalized = normalizeText(item, 80);
      if (!ALLOWED_DESTINATIONS.has(normalized)) {
        errors.destinations = 'One or more selected destinations are not recognized.';
        break;
      }
      if (!destinations.includes(normalized)) {
        destinations.push(normalized);
      }
    }
  }

  const duration = normalizeText(input?.duration, 40);
  if (!DURATION_OPTIONS.includes(duration)) {
    errors.duration = 'Please select a valid tour duration.';
  }

  const groupSize = normalizeText(input?.groupSize, 30);
  if (!GROUP_SIZE_OPTIONS.includes(groupSize)) {
    errors.groupSize = 'Please select a valid group size.';
  }

  const name = normalizeText(input?.name, 80);
  if (name.length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }

  const email = normalizeText(input?.email, 120);
  if (!email || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please enter a valid email address (for example, name@example.com).';
  }

  const phone = normalizeText(input?.phone, 30);
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Please enter a valid phone or WhatsApp number.';
  }

  const country = normalizeText(input?.country, 80);
  const dates = normalizeText(input?.dates, 100);
  const notes = normalizeText(input?.notes, 1000, true);

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    data: valid
      ? { destinations, suggestRoute, duration, groupSize, name, email, phone, country, dates, notes }
      : null,
    errors,
    message: valid ? '' : Object.values(errors)[0]
  };
}

//------------------------------End of file---------------------------------------------------//
