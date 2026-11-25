// =============================================================================
// Cape Private Tours — Guest Stories & Interactive Review Manager
// =============================================================================

import { getIconMarkup } from './icons.js';

const STORAGE_KEY = 'cape_private_tours_guest_stories';

const SEED_REVIEWS = [
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
 * Loads stored guest stories from localStorage, falling back to clean seed stories.
 * Filters out automated test submissions and invalid entries.
 * @returns {Array<Object>} List of valid guest story records.
 */
function getStoredReviews() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((item) => item && item.name && !item.name.toLowerCase().includes('julia vance'));
      }
    }
  } catch (err) {
    console.warn('[ReviewManager] Failed to read localStorage:', err);
  }
  return [...SEED_REVIEWS];
}

//------------------------------------------------------------------------------------//
/**
 * Persists guest stories array to localStorage.
 * @param {Array<Object>} reviews - List of reviews to serialize.
 * @returns {void}
 */
function persistReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn('[ReviewManager] Failed to persist reviews:', err);
  }
}

//------------------------------------------------------------------------------------//
/**
 * Renders an accessible local Icons8 star rating row using token-driven colors.
 * @param {number} rating - Number of stars (1 to 5).
 * @returns {string} Star rating HTML markup.
 */
function renderStarIconsMarkup(rating) {
  const clamped = Math.max(1, Math.min(5, rating || 5));
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= clamped;
    const iconName = isFilled ? 'star-filled' : 'star-outline';
    const cls = isFilled ? 'icon-sm star-icon is-filled' : 'icon-sm star-icon is-empty';
    starsHtml += getIconMarkup(iconName, cls);
  }
  return `<div class="story-rating-stars" role="img" aria-label="${clamped} out of 5 stars">${starsHtml}</div>`;
}

//------------------------------------------------------------------------------------//
/**
 * Escapes HTML special characters in user-submitted review text.
 * @param {string} value - Raw user input string.
 * @returns {string} Escaped string safe for HTML interpolation.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

//------------------------------------------------------------------------------------//
/**
 * Creates asymmetric editorial HTML markup for a guest story card.
 * The lead story renders horizontally with a gold accent bar and quote icon.
 * @param {Object} review - The review entry object.
 * @param {number} index - Position index in the rendered story list.
 * @returns {string} Story card HTML.
 */
function createReviewCardHtml(review, index) {
  const isFeatured = index === 0;
  const starsHtml = renderStarIconsMarkup(review.rating);
  const quoteIcon = isFeatured ? `<span class="story-quote-mark">${getIconMarkup('quote', 'icon-lg')}</span>` : '';

  return `
    <article class="guest-story-card${isFeatured ? ' is-featured' : ''}" id="${escapeHtml(review.id)}">
      <div class="story-card-top">
        ${starsHtml}
        ${quoteIcon}
      </div>
      <blockquote class="story-quote">
        <p>&ldquo;${escapeHtml(review.quote)}&rdquo;</p>
      </blockquote>
      <div class="story-author-meta">
        <span class="story-author-name">${escapeHtml(review.name)}</span>
        <span class="story-author-location">${escapeHtml(review.location || review.country || 'International Traveler')}</span>
      </div>
    </article>
  `;
}

//------------------------------------------------------------------------------------//
/**
 * Renders all reviews into the asymmetric guest stories grid container.
 * @returns {void}
 */
export function renderReviews() {
  const gridContainer = document.getElementById('reviews-grid');
  if (!gridContainer) return;

  const reviews = getStoredReviews();
  gridContainer.innerHTML = reviews.map((review, idx) => createReviewCardHtml(review, idx)).join('');
}

//------------------------------------------------------------------------------------//
/**
 * Appends a newly submitted review to localStorage and prepends it to the grid.
 * @param {Object} newReview - The review object to append.
 * @returns {void}
 */
export function addReview(newReview) {
  const reviews = getStoredReviews();
  reviews.unshift(newReview);
  persistReviews(reviews);
  renderReviews();
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the interactive Icons8 clickable 1-5 star picker inside the review drawer.
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

  function renderPicker(val) {
    selectedValue = Math.max(1, Math.min(5, val));
    hiddenInput.value = String(selectedValue);
    if (labelEl) {
      labelEl.textContent = RATING_TEXT[selectedValue];
    }

    const buttons = pickerEl.querySelectorAll('.star-picker-btn');
    buttons.forEach((btn) => {
      const btnVal = parseInt(btn.dataset.rating, 10);
      const isActive = btnVal <= selectedValue;
      const isChecked = btnVal === selectedValue;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-checked', String(isChecked));
      btn.setAttribute('tabindex', isChecked ? '0' : '-1');
      btn.innerHTML = getIconMarkup(isActive ? 'star-filled' : 'star-outline', 'icon-md');
    });
  }

  let buttonsHtml = '';
  for (let r = 1; r <= 5; r++) {
    buttonsHtml += `
      <button
        type="button"
        class="star-picker-btn"
        role="radio"
        aria-checked="${r === 5}"
        aria-label="${r} ${r === 1 ? 'Star' : 'Stars'}"
        data-rating="${r}"
        tabindex="${r === 5 ? '0' : '-1'}"
      ></button>
    `;
  }
  pickerEl.innerHTML = buttonsHtml;
  renderPicker(5);

  const buttons = Array.from(pickerEl.querySelectorAll('.star-picker-btn'));
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
 * Binds toggle behavior for the inline review drawer, star picker, and submission validation.
 * @returns {void}
 */
export function initReviewManager() {
  renderReviews();
  const starPicker = initStarRatingPicker();

  const toggleBtn = document.getElementById('btn-toggle-review-form');
  const formWrap = document.getElementById('review-form-wrap');
  const reviewForm = document.getElementById('guest-review-form');
  const statusEl = document.getElementById('review-form-status');

  function setDrawerOpen(open) {
    if (!toggleBtn || !formWrap) return;
    toggleBtn.setAttribute('aria-expanded', String(open));
    formWrap.classList.toggle('is-open', open);
    const labelSpan = toggleBtn.querySelector('.btn-label');
    if (labelSpan) {
      labelSpan.textContent = open ? 'Close Review Form' : 'Leave a Review';
    }
    if (open) {
      const firstInput = formWrap.querySelector('input');
      if (firstInput) firstInput.focus();
    }
  }

  if (toggleBtn && formWrap) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      setDrawerOpen(!isExpanded);
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('review-name');
      const countryInput = document.getElementById('review-country');
      const textInput = document.getElementById('review-text');

      const name = nameInput ? nameInput.value.trim() : '';
      const location = countryInput ? countryInput.value.trim() : '';
      const rating = starPicker.getValue();
      const quote = textInput ? textInput.value.trim() : '';

      if (nameInput) nameInput.setAttribute('aria-invalid', String(!name));
      if (countryInput) countryInput.setAttribute('aria-invalid', String(!location));
      if (textInput) textInput.setAttribute('aria-invalid', String(!quote));

      if (!name || !location || !quote) {
        if (statusEl) {
          statusEl.textContent = 'Please complete your name, city/country, and story before submitting.';
          statusEl.className = 'form-status is-error';
        }
        return;
      }

      const newEntry = {
        id: `story-${Date.now()}`,
        name,
        location,
        rating,
        quote
      };

      addReview(newEntry);
      reviewForm.reset();
      starPicker.reset();

      if (statusEl) {
        statusEl.textContent = 'Thank you! Your story has been added.';
        statusEl.className = 'form-status is-success';
      }

      setTimeout(() => {
        setDrawerOpen(false);
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.className = 'form-status';
        }
      }, 1800);
    });
  }
}

//------------------------------End of file---------------------------------------------------//
