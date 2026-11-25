// =============================================================================
// Cape Private Tours — Guest Stories & Safe DOM Review Manager
// =============================================================================

import { createIconElement } from './icons.js';
import { fetchReviews, createReview } from '../services/reviewService.js';

let closeTimerId = null;

//------------------------------------------------------------------------------------//
/**
 * Builds an accessible star rating row using safe DOM nodes and local icons.
 * @param {number} rating - Number of stars (1 to 5).
 * @returns {HTMLDivElement} Star rating container element.
 */
function buildStarIconsElement(rating) {
  const clamped = Math.max(1, Math.min(5, Number(rating) || 5));
  const row = document.createElement('div');
  row.className = 'story-rating-stars';
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', `${clamped} out of 5 stars`);

  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= clamped;
    const iconName = isFilled ? 'star-filled' : 'star-outline';
    const cls = isFilled ? 'icon-sm star-icon is-filled' : 'icon-sm star-icon is-empty';
    row.appendChild(createIconElement(iconName, cls));
  }
  return row;
}

//------------------------------------------------------------------------------------//
/**
 * Creates a guest story card DOM node using textContent so XSS is structurally impossible.
 * @param {Object} review - Validated review entry object.
 * @param {number} index - Position index in the rendered story list.
 * @returns {HTMLElement} Constructed article element.
 */
function createReviewCardElement(review, index) {
  const isFeatured = index === 0;
  const article = document.createElement('article');
  article.className = isFeatured ? 'guest-story-card is-featured' : 'guest-story-card';
  if (review.id) {
    article.id = review.id;
  }

  const topRow = document.createElement('div');
  topRow.className = 'story-card-top';
  topRow.appendChild(buildStarIconsElement(review.rating));

  if (isFeatured) {
    const quoteWrap = document.createElement('span');
    quoteWrap.className = 'story-quote-mark';
    quoteWrap.appendChild(createIconElement('quote', 'icon-lg'));
    topRow.appendChild(quoteWrap);
  }

  const blockquote = document.createElement('blockquote');
  blockquote.className = 'story-quote';
  const quoteP = document.createElement('p');
  quoteP.textContent = `\u201C${review.quote}\u201D`;
  blockquote.appendChild(quoteP);

  const meta = document.createElement('div');
  meta.className = 'story-author-meta';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'story-author-name';
  nameSpan.textContent = review.name;

  const locationSpan = document.createElement('span');
  locationSpan.className = 'story-author-location';
  locationSpan.textContent = review.location || 'International Traveler';

  meta.append(nameSpan, locationSpan);
  article.append(topRow, blockquote, meta);
  return article;
}

//------------------------------------------------------------------------------------//
/**
 * Fetches validated guest stories and renders them into #reviews-grid via a DocumentFragment.
 * @returns {Promise<void>}
 */
export async function renderReviews() {
  const gridContainer = document.getElementById('reviews-grid');
  if (!gridContainer) return;

  const reviews = await fetchReviews();
  const fragment = document.createDocumentFragment();
  reviews.forEach((review, idx) => {
    fragment.appendChild(createReviewCardElement(review, idx));
  });
  gridContainer.replaceChildren(fragment);
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the interactive clickable 1-5 star picker using safe DOM nodes.
 * @returns {{ getValue: Function, reset: Function }} Star picker controller.
 */
function initStarRatingPicker() {
  const pickerEl = document.getElementById('review-star-picker');
  const hiddenInput = document.getElementById('review-rating');
  const labelEl = document.getElementById('review-rating-label');
  if (!pickerEl || !hiddenInput) {
    return { getValue: () => 5, reset: () => {} };
  }

  let selectedValue = parseInt(hiddenInput.value, 10) || 5;
  const RATING_TEXT = {
    1: '1 Star - Fair',
    2: '2 Stars - Good',
    3: '3 Stars - Very Good',
    4: '4 Stars - Great',
    5: '5 Stars - Exceptional'
  };

  const buttons = [];
  const fragment = document.createDocumentFragment();

  for (let r = 1; r <= 5; r++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'star-picker-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', `${r} ${r === 1 ? 'Star' : 'Stars'}`);
    btn.dataset.rating = String(r);
    buttons.push(btn);
    fragment.appendChild(btn);
  }
  pickerEl.replaceChildren(fragment);

  function renderPicker(val) {
    selectedValue = Math.max(1, Math.min(5, val));
    hiddenInput.value = String(selectedValue);
    if (labelEl) {
      labelEl.textContent = RATING_TEXT[selectedValue];
    }

    buttons.forEach((btn) => {
      const btnVal = parseInt(btn.dataset.rating, 10);
      const isActive = btnVal <= selectedValue;
      const isChecked = btnVal === selectedValue;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-checked', String(isChecked));
      btn.setAttribute('tabindex', isChecked ? '0' : '-1');
      btn.replaceChildren(createIconElement(isActive ? 'star-filled' : 'star-outline', 'icon-md'));
    });
  }

  renderPicker(5);

  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      renderPicker(parseInt(btn.dataset.rating, 10));
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        nextIdx = Math.min(4, idx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        nextIdx = Math.max(0, idx - 1);
      }
      if (nextIdx !== null) {
        e.preventDefault();
        renderPicker(nextIdx + 1);
        buttons[nextIdx].focus();
      }
    });
  });

  return {
    getValue: () => selectedValue,
    reset: () => renderPicker(5)
  };
}

//------------------------------------------------------------------------------------//
/**
 * Binds drawer toggle, validation, anti-bot guards, and review submission.
 * @returns {Promise<void>}
 */
export async function initReviewManager() {
  await renderReviews();
  const starPicker = initStarRatingPicker();

  const toggleBtn = document.getElementById('btn-toggle-review-form');
  const formWrap = document.getElementById('review-form-wrap');
  const reviewForm = document.getElementById('guest-review-form');
  const statusEl = document.getElementById('review-form-status');
  let formOpenedAt = Date.now();

  function setDrawerOpen(open) {
    if (closeTimerId !== null) {
      clearTimeout(closeTimerId);
      closeTimerId = null;
    }
    if (!toggleBtn || !formWrap) return;
    toggleBtn.setAttribute('aria-expanded', String(open));
    formWrap.classList.toggle('is-open', open);
    const labelSpan = toggleBtn.querySelector('.btn-label');
    if (labelSpan) {
      labelSpan.textContent = open ? 'Close Review Form' : 'Leave a Review';
    }
    if (open) {
      formOpenedAt = Date.now();
      const firstInput = formWrap.querySelector('input:not([type="hidden"]):not(.hp-field)');
      if (firstInput) firstInput.focus();
    }
  }

  if (toggleBtn && formWrap) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      setDrawerOpen(!isExpanded);
    });
  }

  if (!reviewForm) return;

  const nameInput = document.getElementById('review-name');
  const countryInput = document.getElementById('review-country');
  const textInput = document.getElementById('review-text');
  const honeypotInput = reviewForm.querySelector('input[name="website"]');

  [nameInput, countryInput, textInput].forEach((field) => {
    if (!field) return;
    field.addEventListener('input', () => {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    });
  });

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const result = await createReview(
      {
        name: nameInput ? nameInput.value : '',
        location: countryInput ? countryInput.value : '',
        rating: starPicker.getValue(),
        quote: textInput ? textInput.value : ''
      },
      {
        honeypot: honeypotInput ? honeypotInput.value : '',
        formOpenedAt
      }
    );

    if (!result.ok) {
      const errs = result.errors || {};
      if (nameInput) nameInput.setAttribute('aria-invalid', String(Boolean(errs.name)));
      if (countryInput) countryInput.setAttribute('aria-invalid', String(Boolean(errs.location)));
      if (textInput) textInput.setAttribute('aria-invalid', String(Boolean(errs.quote)));
      if (statusEl) {
        statusEl.textContent = result.message || 'Please check your review details.';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    if (!result.botIgnored) {
      await renderReviews();
    }

    reviewForm.reset();
    starPicker.reset();

    if (statusEl) {
      statusEl.textContent = 'Thank you! Your story has been added.';
      statusEl.className = 'form-status is-success';
    }

    closeTimerId = setTimeout(() => {
      setDrawerOpen(false);
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }
    }, 1800);
  });
}

//------------------------------End of file---------------------------------------------------//
