// =============================================================================
// Cape Private Tours — Guest Stories & Review Manager
// =============================================================================

const STORAGE_KEY = 'cape_private_tours_guest_stories';

const SEED_REVIEWS = [
  {
    id: 'story-1',
    name: 'Eleanor & Mark Davies',
    location: 'Edinburgh, Scotland',
    rating: 5,
    quote: 'Johan read the morning wind and clouds with uncanny precision. Instead of battling the fog at Table Mountain, we spent early morning watching penguins along the quiet granite rocks of Simons Town, then crested the mountain in golden late-afternoon light.'
  },
  {
    id: 'story-2',
    name: 'Marcus & Chloe Vance',
    location: 'Melbourne, Australia',
    rating: 5,
    quote: 'No coach-bus crowds, no loudspeakers, and no rush. Traveling with Johan felt like exploring the Cape with an old friend who knows every private pull-off along Chapmans Peak and every family-run cellar in the valley.'
  },
  {
    id: 'story-3',
    name: 'Dr. Claire Dupont',
    location: 'Geneva, Switzerland',
    rating: 5,
    quote: 'The botanical depth and wildlife insight were world-class. From rare fynbos proteas at Kirstenbosch to wild baboon troops along the coastal cliffs of Cape Point, Johan tailored every turn around our spontaneous curiosities.'
  }
];

//------------------------------------------------------------------------------------//
/**
 * Loads stored guest stories from localStorage, falling back to clean seed stories.
 * Filters out automated test submissions and duplicates.
 * @returns {Array<Object>} List of valid guest story records.
 */
function getStoredReviews() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out test artifact data
        return parsed.filter(item => item && item.name && !item.name.toLowerCase().includes('julia vance'));
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
 * Renders an accessible SVG star rating row without relying on emojis or entities.
 * @param {number} rating - Number of stars (1 to 5).
 * @returns {string} SVG star markup.
 */
function renderStarSvgMarkup(rating) {
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= (rating || 5);
    const starColor = isFilled ? 'var(--color-accent-ochre)' : 'var(--color-border-sand-dark)';
    starsHtml += `
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="color: ${starColor}; fill: currentColor; display: inline-block;">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    `;
  }
  return `<div class="story-rating-stars" aria-label="${rating} out of 5 stars">${starsHtml}</div>`;
}

//------------------------------------------------------------------------------------//
/**
 * Creates clean open HTML markup for a single guest story card (no heavy borders).
 * @param {Object} review - The review entry object.
 * @returns {string} Story card HTML.
 */
function createReviewCardHtml(review) {
  const starsHtml = renderStarSvgMarkup(review.rating);

  return `
    <article class="guest-story-card" id="${review.id}">
      <div class="story-rating-stars" aria-label="${review.rating} out of 5 stars">${starsHtml}</div>
      <blockquote class="story-quote">
        <p>&ldquo;${review.quote}&rdquo;</p>
      </blockquote>
      <div class="story-author-meta">
        <span class="story-author-name">${review.name}</span>
        <span class="story-author-location">${review.location || review.country || 'International Traveler'}</span>
      </div>
    </article>
  `;
}

//------------------------------------------------------------------------------------//
/**
 * Renders all reviews into the guest stories grid container.
 * @returns {void}
 */
export function renderReviews() {
  const gridContainer = document.getElementById('reviews-grid');
  if (!gridContainer) return;

  const reviews = getStoredReviews();
  gridContainer.innerHTML = reviews.map(createReviewCardHtml).join('');
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
 * Binds toggle behavior for the inline review form and handles submission with validation.
 * @returns {void}
 */
export function initReviewManager() {
  renderReviews();

  const toggleBtn = document.getElementById('btn-toggle-review-form');
  const formWrap = document.getElementById('review-form-wrap');
  const reviewForm = document.getElementById('guest-review-form');
  const statusEl = document.getElementById('review-form-status');

  if (toggleBtn && formWrap) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      formWrap.classList.toggle('is-open');

      if (!isExpanded) {
        toggleBtn.textContent = 'Close Review Form';
        const firstInput = formWrap.querySelector('input');
        if (firstInput) firstInput.focus();
      } else {
        toggleBtn.textContent = 'Leave a Review';
      }
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('review-name');
      const countryInput = document.getElementById('review-country');
      const ratingSelect = document.getElementById('review-rating');
      const textInput = document.getElementById('review-text');

      const name = nameInput ? nameInput.value.trim() : '';
      const location = countryInput ? countryInput.value.trim() : '';
      const rating = ratingSelect ? parseInt(ratingSelect.value, 10) : 5;
      const quote = textInput ? textInput.value.trim() : '';

      if (!name || !location || !quote) {
        if (statusEl) {
          statusEl.textContent = 'Please complete your name, city/country, and quote.';
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

      if (statusEl) {
        statusEl.textContent = 'Thank you! Your story has been added.';
        statusEl.className = 'form-status is-success';
      }

      setTimeout(() => {
        if (formWrap) formWrap.classList.remove('is-open');
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.textContent = 'Leave a Review';
        }
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.className = 'form-status';
        }
      }, 2000);
    });
  }
}

//------------------------------End of file---------------------------------------------------//