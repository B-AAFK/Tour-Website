// =============================================================================
// Cape Town Tour Guide — Frame-Synced Location Overlay Manager
// =============================================================================

import { STOPS } from '../config/tourConfig.js';

let stopCards = [];
let progressBarEl = null;
let activeStopId = null;

// -----------------------------------------------------------------------------

/**
 * Resolves which tour stop is active for a given frame index, or null if in a transition dead-zone.
 * @param {number} frameIndex - Current rendered frame index (0-449).
 * @returns {Object|null} Matching stop object or null if in transition dead-zone.
 */
export function getActiveStop(frameIndex) {
  for (const stop of STOPS) {
    if (frameIndex >= stop.startFrame && frameIndex <= stop.endFrame) {
      return stop;
    }
  }
  return null;
}

// -----------------------------------------------------------------------------

/**
 * Updates location overlay visibility strictly according to configured frame bounds,
 * and advances the fixed 1px top progress line.
 * @param {number} currentFrame - Active frame index (0-449).
 * @param {number} progress - Normalized scroll progress (0.0 - 1.0).
 * @returns {void}
 */
export function updateOverlays(currentFrame, progress) {
  const matchingStop = getActiveStop(currentFrame);
  const newActiveId = matchingStop ? matchingStop.id : null;

  if (newActiveId !== activeStopId) {
    activeStopId = newActiveId;

    stopCards.forEach((card) => {
      const cardStopId = parseInt(card.dataset.stopId, 10);
      if (cardStopId === activeStopId) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });
  }

  if (progressBarEl) {
    progressBarEl.style.width = `${(progress * 100).toFixed(2)}%`;
  }
}

// -----------------------------------------------------------------------------

/**
 * Initializes the overlay manager DOM bindings and caches stop card elements.
 * @returns {void}
 */
export function initOverlayManager() {
  stopCards = Array.from(document.querySelectorAll('.stop-card'));
  progressBarEl = document.getElementById('scroll-progress-bar');
  activeStopId = null;

  // Initial state check for frame 0
  updateOverlays(0, 0);
}

// -----------------------------------------------------------------------------
