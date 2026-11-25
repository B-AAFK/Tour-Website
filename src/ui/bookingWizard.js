// =============================================================================
// Cape Private Tours — 2-Step Split-Screen Visual Concierge Controller
// =============================================================================

import { ASSET_BASE_URL, STOPS } from '../config/tourConfig.js';
import { createIconElement } from './icons.js';
import { submitTourInquiry } from '../services/bookingService.js';

let currentStep = 1;
let step2OpenedAt = Date.now();

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
    step2OpenedAt = Date.now();
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
 * Builds a single visual destination tile element safely without innerHTML.
 * @param {Object} stop - Destination stop record from STOPS.
 * @returns {HTMLButtonElement} Interactive tile button.
 */
function createDestinationTileElement(stop) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dest-tile';
  btn.dataset.name = stop.name;
  btn.setAttribute('aria-pressed', 'false');

  const img = document.createElement('img');
  img.src = encodeURI(`${ASSET_BASE_URL}${stop.thumbnailFrame}`);
  img.alt = stop.name;
  img.className = 'dest-tile-img';
  img.loading = 'lazy';
  img.decoding = 'async';

  const scrim = document.createElement('span');
  scrim.className = 'dest-tile-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  const checkWrap = document.createElement('span');
  checkWrap.className = 'dest-tile-check';
  checkWrap.setAttribute('aria-hidden', 'true');
  checkWrap.appendChild(createIconElement('check-circle', 'icon-sm'));

  const nameSpan = document.createElement('span');
  nameSpan.className = 'dest-tile-name';
  nameSpan.textContent = stop.name;

  btn.append(img, scrim, checkWrap, nameSpan);
  return btn;
}

//------------------------------------------------------------------------------------//
/**
 * Renders the 9 visual 16:10 destination tiles from STOPS with zero pre-selected.
 * @returns {void}
 */
function renderDestinationTiles() {
  const gridEl = document.getElementById('dest-tiles-grid');
  if (!gridEl) return;

  const fragment = document.createDocumentFragment();
  const tiles = STOPS.map((stop) => {
    const tile = createDestinationTileElement(stop);
    fragment.appendChild(tile);
    return tile;
  });
  gridEl.replaceChildren(fragment);

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
 * Applies field-level validation flags and focuses the first invalid control.
 * @param {Object} errors - Field-keyed error dictionary.
 * @param {Object} fieldMap - Map of field keys to DOM inputs.
 * @returns {void}
 */
function applyFieldErrors(errors, fieldMap) {
  let firstInvalid = null;
  Object.entries(fieldMap).forEach(([key, input]) => {
    if (!input) return;
    const hasErr = Boolean(errors && errors[key]);
    input.classList.toggle('is-invalid', hasErr);
    input.setAttribute('aria-invalid', String(hasErr));
    if (hasErr && !firstInvalid) {
      firstInvalid = input;
    }
  });
  if (firstInvalid) {
    firstInvalid.focus();
  }
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

  if (!inquiryForm) return;

  const nameInput = document.getElementById('inquiry-name');
  const emailInput = document.getElementById('inquiry-email');
  const phoneInput = document.getElementById('inquiry-phone');
  const countryInput = document.getElementById('inquiry-country');
  const honeypotInput = inquiryForm.querySelector('input[name="website"]');

  [nameInput, emailInput, phoneInput].forEach((field) => {
    if (!field) return;
    field.addEventListener('input', () => {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    });
  });

  inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const result = await submitTourInquiry(
      {
        destinations: conciergeState.destinations,
        suggestRoute: conciergeState.suggestRoute,
        duration: conciergeState.duration,
        groupSize: conciergeState.groupSize,
        dates: datesInput ? datesInput.value : '',
        notes: notesInput ? notesInput.value : '',
        name: nameInput ? nameInput.value : '',
        email: emailInput ? emailInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        country: countryInput ? countryInput.value : ''
      },
      {
        honeypot: honeypotInput ? honeypotInput.value : '',
        formOpenedAt: step2OpenedAt
      }
    );

    if (!result.ok) {
      applyFieldErrors(result.errors, { name: nameInput, email: emailInput, phone: phoneInput });
      if (statusEl) {
        statusEl.textContent = result.message || 'Please check your contact details.';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    const displayInquiry = result.inquiry || conciergeState;
    if (confirmationName) {
      confirmationName.textContent = displayInquiry.name || 'Traveler';
    }

    if (confirmationSummary) {
      const dateSegment = displayInquiry.dates ? ` · ${displayInquiry.dates}` : '';
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

//------------------------------End of file---------------------------------------------------//
