// =============================================================================
// Cape Private Tours — 2-Step Split-Screen Visual Concierge Controller
// =============================================================================

import { ASSET_BASE_URL, STOPS } from '../config/tourConfig.js';
import { getIconMarkup } from './icons.js';

let currentStep = 1;
const conciergeState = {
  destinations: [],
  suggestRoute: false,
  duration: 'Full Day (8 hrs)',
  groupSize: '1–2 Guests',
  dates: '',
  notes: '',
  name: '',
  email: '',
  phone: '',
  country: ''
};

//------------------------------------------------------------------------------------//
/**
 * Formats the selected route summary string for live readouts and recap banners.
 * @returns {string} Human-readable summary of selected places or route suggestion.
 */
function formatPlacesSummary() {
  if (conciergeState.suggestRoute) {
    return 'Route suggested by Lance';
  }
  if (conciergeState.destinations.length > 0) {
    return conciergeState.destinations.join(', ');
  }
  return 'Flexible Cape Town route';
}

//------------------------------------------------------------------------------------//
/**
 * Updates the Step 1 bottom readout and Step 2 recap strip from current state.
 * @returns {void}
 */
function syncSummaryDisplays() {
  const readoutEl = document.getElementById('step1-live-readout');
  if (readoutEl) {
    let placePart = '0 places selected';
    if (conciergeState.suggestRoute) {
      placePart = 'Route suggested by Lance';
    } else if (conciergeState.destinations.length === 1) {
      placePart = '1 place selected';
    } else if (conciergeState.destinations.length > 1) {
      placePart = `${conciergeState.destinations.length} places selected`;
    }
    readoutEl.textContent = `${placePart} · ${conciergeState.duration}`;
  }

  const recapEl = document.getElementById('step2-recap-text');
  if (recapEl) {
    recapEl.textContent = `${conciergeState.duration} · ${conciergeState.groupSize} · ${formatPlacesSummary()}`;
  }
}

//------------------------------------------------------------------------------------//
/**
 * Transitions the right-hand workspace between Step 1 and Step 2.
 * @param {number} stepNumber - Target step (1 or 2).
 * @returns {void}
 */
export function goToStep(stepNumber) {
  if (stepNumber !== 1 && stepNumber !== 2) return;
  currentStep = stepNumber;

  const stepStatusEl = document.getElementById('concierge-step-status');
  if (stepStatusEl) {
    stepStatusEl.textContent = currentStep === 1
      ? 'Step 1 of 2 — Shape Your Day'
      : 'Step 2 of 2 — Where to Send Your Quote';
  }

  document.querySelectorAll('.concierge-step-panel').forEach((panel) => {
    const panelStep = parseInt(panel.dataset.step, 10);
    panel.classList.toggle('is-active', panelStep === currentStep);
  });

  if (currentStep === 2) {
    syncSummaryDisplays();
  }

  const workspaceEl = document.querySelector('.concierge-workspace');
  if (workspaceEl) {
    const top = workspaceEl.getBoundingClientRect().top + window.scrollY;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.innerWidth < 960) {
      window.scrollTo({ top: Math.max(0, top - 12), behavior: prefersReduced ? 'auto' : 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }
}

//------------------------------------------------------------------------------------//
/**
 * Renders the 9 visual 16:10 destination tiles from STOPS with zero pre-selected.
 * @returns {void}
 */
function renderDestinationTiles() {
  const gridEl = document.getElementById('dest-tiles-grid');
  if (!gridEl) return;

  gridEl.innerHTML = STOPS.map((stop) => {
    const imgSrc = encodeURI(`${ASSET_BASE_URL}${stop.thumbnailFrame}`);
    return `
      <button
        type="button"
        class="dest-tile"
        data-name="${stop.name}"
        aria-pressed="false"
      >
        <img src="${imgSrc}" alt="${stop.name}" class="dest-tile-img" loading="lazy">
        <span class="dest-tile-scrim" aria-hidden="true"></span>
        <span class="dest-tile-check" aria-hidden="true">
          ${getIconMarkup('check-circle', 'icon-sm')}
        </span>
        <span class="dest-tile-name">${stop.name}</span>
      </button>
    `;
  }).join('');

  const tiles = Array.from(gridEl.querySelectorAll('.dest-tile'));
  const suggestBtn = document.getElementById('route-suggest-toggle');

  tiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const nextPressed = tile.getAttribute('aria-pressed') !== 'true';
      tile.setAttribute('aria-pressed', String(nextPressed));
      tile.classList.toggle('is-selected', nextPressed);

      if (nextPressed && suggestBtn && conciergeState.suggestRoute) {
        conciergeState.suggestRoute = false;
        suggestBtn.setAttribute('aria-pressed', 'false');
        suggestBtn.classList.remove('is-selected');
      }

      conciergeState.destinations = tiles
        .filter((btn) => btn.getAttribute('aria-pressed') === 'true')
        .map((btn) => btn.dataset.name);

      syncSummaryDisplays();
    });
  });

  if (suggestBtn) {
    suggestBtn.addEventListener('click', () => {
      const nextPressed = suggestBtn.getAttribute('aria-pressed') !== 'true';
      conciergeState.suggestRoute = nextPressed;
      suggestBtn.setAttribute('aria-pressed', String(nextPressed));
      suggestBtn.classList.toggle('is-selected', nextPressed);

      if (nextPressed) {
        tiles.forEach((tile) => {
          tile.setAttribute('aria-pressed', 'false');
          tile.classList.remove('is-selected');
        });
        conciergeState.destinations = [];
      }

      syncSummaryDisplays();
    });
  }
}

//------------------------------------------------------------------------------------//
/**
 * Binds accessible radiogroup behavior (click + arrow keys) to flat typographic toggles.
 * @param {string} groupName - Data-group attribute ('duration' or 'group-size').
 * @param {Function} onChange - Callback invoked with the newly selected value.
 * @returns {void}
 */
function bindOptionGroup(groupName, onChange) {
  const buttons = Array.from(document.querySelectorAll(`.concierge-option-btn[data-group="${groupName}"]`));
  if (!buttons.length) return;

  function activateButton(targetBtn) {
    buttons.forEach((btn) => {
      const isSelected = btn === targetBtn;
      btn.classList.toggle('is-active', isSelected);
      btn.setAttribute('aria-checked', String(isSelected));
      btn.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    const val = targetBtn.dataset.val || targetBtn.textContent.trim();
    onChange(val);
    syncSummaryDisplays();
  }

  buttons.forEach((btn, idx) => {
    btn.addEventListener('click', () => activateButton(btn));
    btn.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIdx = (idx + 1) % buttons.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIdx = (idx - 1 + buttons.length) % buttons.length;
      }
      if (nextIdx !== null) {
        e.preventDefault();
        activateButton(buttons[nextIdx]);
        buttons[nextIdx].focus();
      }
    });
  });
}

//------------------------------------------------------------------------------------//
/**
 * Validates Step 2 required traveler fields (Full Name and Email Address).
 * @param {HTMLInputElement|null} nameInput - Full name input element.
 * @param {HTMLInputElement|null} emailInput - Email address input element.
 * @returns {{ valid: boolean, message: string, firstInvalid: HTMLElement|null }} Validation state.
 */
function validateContactFields(nameInput, emailInput) {
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const nameValid = name.length > 0;
  const emailValid = email.length > 0 && emailPattern.test(email);

  if (nameInput) {
    nameInput.classList.toggle('is-invalid', !nameValid);
    nameInput.setAttribute('aria-invalid', String(!nameValid));
  }
  if (emailInput) {
    emailInput.classList.toggle('is-invalid', !emailValid);
    emailInput.setAttribute('aria-invalid', String(!emailValid));
  }

  if (!nameValid && !emailValid) {
    return {
      valid: false,
      message: 'Please enter your name and a valid email address so I can reply with your route and quote.',
      firstInvalid: nameInput
    };
  }
  if (!nameValid) {
    return {
      valid: false,
      message: 'Please enter your name so I know how to address your reply.',
      firstInvalid: nameInput
    };
  }
  if (!emailValid) {
    return {
      valid: false,
      message: 'Please enter a valid email address (for example, name@example.com).',
      firstInvalid: emailInput
    };
  }

  return { valid: true, message: '', firstInvalid: null };
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the 2-step Split-Screen Visual Concierge workflow and form submission.
 * @returns {void}
 */
export function initBookingWizard() {
  renderDestinationTiles();
  syncSummaryDisplays();

  bindOptionGroup('duration', (val) => {
    conciergeState.duration = val;
  });

  bindOptionGroup('group-size', (val) => {
    conciergeState.groupSize = val;
  });

  const nextBtn = document.getElementById('btn-next-step-2');
  if (nextBtn) nextBtn.addEventListener('click', () => goToStep(2));

  const backBtn = document.getElementById('btn-back-step-1');
  if (backBtn) backBtn.addEventListener('click', () => goToStep(1));

  const changeBtn = document.getElementById('btn-change-step-1');
  if (changeBtn) changeBtn.addEventListener('click', () => goToStep(1));

  const datesInput = document.getElementById('inquiry-dates');
  if (datesInput) {
    datesInput.addEventListener('input', () => {
      conciergeState.dates = datesInput.value.trim();
    });
  }

  const notesInput = document.getElementById('inquiry-notes');
  if (notesInput) {
    notesInput.addEventListener('input', () => {
      conciergeState.notes = notesInput.value.trim();
    });
  }

  const inquiryForm = document.getElementById('booking-inquiry-form');
  const statusEl = document.getElementById('booking-form-status');
  const stepStatusEl = document.getElementById('concierge-step-status');
  const confirmationCard = document.getElementById('booking-confirmation');
  const confirmationName = document.getElementById('confirmation-traveler-name');
  const confirmationSummary = document.getElementById('confirmation-summary-details');

  if (inquiryForm) {
    const nameInput = document.getElementById('inquiry-name');
    const emailInput = document.getElementById('inquiry-email');

    [nameInput, emailInput].forEach((field) => {
      if (!field) return;
      field.addEventListener('input', () => {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
      });
    });

    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById('inquiry-phone');
      const countryInput = document.getElementById('inquiry-country');

      const validation = validateContactFields(nameInput, emailInput);
      if (!validation.valid) {
        if (statusEl) {
          statusEl.textContent = validation.message;
          statusEl.className = 'form-status is-error';
        }
        if (validation.firstInvalid) {
          validation.firstInvalid.focus();
        }
        return;
      }

      conciergeState.name = nameInput ? nameInput.value.trim() : '';
      conciergeState.email = emailInput ? emailInput.value.trim() : '';
      conciergeState.phone = phoneInput ? phoneInput.value.trim() : '';
      conciergeState.country = countryInput ? countryInput.value.trim() : '';

      try {
        const storedInquiries = JSON.parse(localStorage.getItem('cape_private_tours_inquiries') || '[]');
        storedInquiries.push({
          ...conciergeState,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('cape_private_tours_inquiries', JSON.stringify(storedInquiries));
      } catch (err) {
        console.warn('[Concierge] Could not persist inquiry:', err);
      }

      if (confirmationName) {
        confirmationName.textContent = conciergeState.name;
      }

      if (confirmationSummary) {
        const dateSegment = conciergeState.dates ? ` · ${conciergeState.dates}` : '';
        confirmationSummary.textContent = `${conciergeState.duration} · ${conciergeState.groupSize}${dateSegment} · ${formatPlacesSummary()}`;
      }

      document.querySelectorAll('.concierge-step-panel').forEach((panel) => {
        panel.classList.remove('is-active');
      });
      if (stepStatusEl) {
        stepStatusEl.textContent = 'Inquiry Received';
      }
      if (confirmationCard) {
        confirmationCard.classList.remove('is-hidden');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

//------------------------------End of file---------------------------------------------------//
