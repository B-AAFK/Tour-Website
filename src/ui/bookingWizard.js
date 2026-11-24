// =============================================================================
// Cape Private Tours — 3-Step Progressive Booking Wizard Controller
// =============================================================================

let currentStep = 1;
const wizardData = {
  destinations: [],
  notes: '',
  duration: 'Full Day (8 hrs)',
  groupSize: '1–2 Guests',
  dates: '',
  name: '',
  email: '',
  phone: '',
  country: ''
};

//------------------------------------------------------------------------------------//
/**
 * Updates the visual step indicator and toggles the visible step panel.
 * @param {number} stepNumber - Step index (1, 2, or 3).
 * @returns {void}
 */
export function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > 3) return;
  currentStep = stepNumber;

  const stepPanels = document.querySelectorAll('.wizard-step-panel');
  stepPanels.forEach((panel) => {
    const panelStep = parseInt(panel.dataset.step, 10);
    if (panelStep === currentStep) {
      panel.classList.add('is-active');
    } else {
      panel.classList.remove('is-active');
    }
  });

  const stepIndicators = document.querySelectorAll('.step-indicator-item');
  stepIndicators.forEach((item) => {
    const itemStep = parseInt(item.dataset.step, 10);
    item.classList.remove('is-active', 'is-completed');
    if (itemStep === currentStep) {
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'step');
    } else if (itemStep < currentStep) {
      item.classList.add('is-completed');
      item.removeAttribute('aria-current');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  if (currentStep === 3) {
    updateSummaryStrip();
  }

  // Smooth scroll to top of wizard container on step change
  const wizardEl = document.querySelector('.booking-card');
  if (wizardEl) {
    const top = wizardEl.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
}

//------------------------------------------------------------------------------------//
/**
 * Renders the compact summary strip at the top of Step 3 echoing traveler choices.
 * @returns {void}
 */
function updateSummaryStrip() {
  const summaryEl = document.getElementById('step3-summary-text');
  if (!summaryEl) return;

  const placesList = wizardData.destinations.length > 0
    ? wizardData.destinations.join(', ')
    : 'Custom Suggested Route';

  summaryEl.textContent = `${wizardData.duration} · ${wizardData.groupSize} · ${placesList}`;
}

//------------------------------------------------------------------------------------//
/**
 * Binds destination pills, segmented buttons, step navigation, and form submission.
 * @returns {void}
 */
export function initBookingWizard() {
  const pillInputs = document.querySelectorAll('.dest-pill-input');
  pillInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const parentPill = input.closest('.dest-pill');
      if (parentPill) {
        parentPill.classList.toggle('is-active', input.checked);
      }

      // Handle "Not sure yet — suggest a route for me" mutual exclusion
      if (input.value === 'suggest-route' && input.checked) {
        pillInputs.forEach((other) => {
          if (other !== input && other.checked) {
            other.checked = false;
            const otherPill = other.closest('.dest-pill');
            if (otherPill) otherPill.classList.remove('is-active');
          }
        });
      } else if (input.checked) {
        const suggestInput = document.querySelector('.dest-pill-input[value="suggest-route"]');
        if (suggestInput && suggestInput.checked) {
          suggestInput.checked = false;
          const suggestPill = suggestInput.closest('.dest-pill');
          if (suggestPill) suggestPill.classList.remove('is-active');
        }
      }

      // Sync data
      const selected = Array.from(pillInputs)
        .filter((i) => i.checked)
        .map((i) => {
          const pill = i.closest('.dest-pill');
          return pill ? pill.dataset.name || i.value : i.value;
        });
      wizardData.destinations = selected;
    });
  });

  // Step 2 Segmented Buttons: Duration
  const durationBtns = document.querySelectorAll('.segment-btn[data-group="duration"]');
  durationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      durationBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      wizardData.duration = btn.dataset.val || btn.textContent.trim();
    });
  });

  // Step 2 Segmented Buttons: Group Size
  const groupBtns = document.querySelectorAll('.segment-btn[data-group="group-size"]');
  groupBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      groupBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      wizardData.groupSize = btn.dataset.val || btn.textContent.trim();
    });
  });

  // Dates & Notes Inputs
  const datesInput = document.getElementById('inquiry-dates');
  if (datesInput) {
    datesInput.addEventListener('input', () => {
      wizardData.dates = datesInput.value.trim();
    });
  }

  const notesInput = document.getElementById('inquiry-notes');
  if (notesInput) {
    notesInput.addEventListener('input', () => {
      wizardData.notes = notesInput.value.trim();
    });
  }

  // Next / Back Buttons
  const nextToStep2 = document.getElementById('btn-next-step-2');
  if (nextToStep2) {
    nextToStep2.addEventListener('click', () => goToStep(2));
  }

  const backToStep1 = document.getElementById('btn-back-step-1');
  if (backToStep1) {
    backToStep1.addEventListener('click', () => goToStep(1));
  }

  const nextToStep3 = document.getElementById('btn-next-step-3');
  if (nextToStep3) {
    nextToStep3.addEventListener('click', () => goToStep(3));
  }

  const backToStep2 = document.getElementById('btn-back-step-2');
  if (backToStep2) {
    backToStep2.addEventListener('click', () => goToStep(2));
  }

  const editFromStep3 = document.getElementById('btn-edit-summary');
  if (editFromStep3) {
    editFromStep3.addEventListener('click', (e) => {
      e.preventDefault();
      goToStep(1);
    });
  }

  // Clickable Header Step Indicators
  const stepIndicators = document.querySelectorAll('.step-indicator-item');
  stepIndicators.forEach((item) => {
    item.addEventListener('click', () => {
      const targetStep = parseInt(item.dataset.step, 10);
      if (targetStep < currentStep || item.classList.contains('is-completed')) {
        goToStep(targetStep);
      }
    });
  });

  // Final Submission
  const wizardForm = document.getElementById('booking-inquiry-form');
  const statusEl = document.getElementById('booking-form-status');
  const confirmationCard = document.getElementById('booking-confirmation');
  const confirmationName = document.getElementById('confirmation-traveler-name');
  const confirmationSummary = document.getElementById('confirmation-summary-details');

  if (wizardForm) {
    wizardForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('inquiry-name');
      const emailInput = document.getElementById('inquiry-email');
      const phoneInput = document.getElementById('inquiry-phone');
      const countryInput = document.getElementById('inquiry-country');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const country = countryInput ? countryInput.value.trim() : '';

      if (!name || !email) {
        if (statusEl) {
          statusEl.textContent = 'Please enter your name and email address so I can send your quote.';
          statusEl.className = 'form-status is-error';
        }
        return;
      }

      wizardData.name = name;
      wizardData.email = email;
      wizardData.phone = phone;
      wizardData.country = country;

      // Save inquiry to localStorage
      try {
        const storedInquiries = JSON.parse(localStorage.getItem('cape_private_tours_inquiries') || '[]');
        storedInquiries.push({
          ...wizardData,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('cape_private_tours_inquiries', JSON.stringify(storedInquiries));
      } catch (err) {
        console.warn('[Booking] Could not persist inquiry:', err);
      }

      if (confirmationName) {
        confirmationName.textContent = name;
      }

      if (confirmationSummary) {
        const placesText = wizardData.destinations.length > 0
          ? wizardData.destinations.join(', ')
          : 'Custom Suggested Route';
        const dateText = wizardData.dates ? ` · ${wizardData.dates}` : '';
        confirmationSummary.textContent = `${wizardData.duration} · ${wizardData.groupSize}${dateText} · ${placesText}`;
      }

      // Hide wizard card and show confirmation in place
      const wizardBody = document.getElementById('wizard-body');
      if (wizardBody) wizardBody.style.display = 'none';
      if (confirmationCard) confirmationCard.classList.remove('is-hidden');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

//------------------------------End of file---------------------------------------------------//