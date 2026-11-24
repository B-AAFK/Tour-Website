// =============================================================================
// Cape Private Tours — Destination Overlay & Travelogue Caption Manager
// =============================================================================

import { getStopByFrame } from '../config/tourConfig.js';

let captionBarEl = null;
let captionNameEl = null;
let captionRegionEl = null;
let captionProgressFillEl = null;
let activeStopId = null;

//------------------------------------------------------------------------------------//
/**
 * Resolves which tour stop is active for a given frame index, or null if in a dead-zone.
 * @param {number} frameIndex - Current rendered frame index (0-449).
 * @returns {Object|null} Matching stop object or null if in transition dead-zone.
 */
export function getActiveStop(frameIndex) {
  return getStopByFrame(frameIndex);
}

//------------------------------------------------------------------------------------//
/**
 * Updates caption state and progress bar in the pinned Cinema Frame showcase.
 * @param {number} currentFrame - Active frame index (0-449).
 * @param {number} progress - Normalized scroll progress (0.0 - 1.0).
 * @param {boolean} [force=false] - Force update of elements regardless of cached active ID.
 * @returns {void}
 */
export function updateOverlays(currentFrame, progress, force = false) {
  const matchingStop = getActiveStop(currentFrame);
  const newActiveId = matchingStop ? matchingStop.id : null;

  if (force || newActiveId !== activeStopId) {
    activeStopId = newActiveId;

    if (captionBarEl && captionNameEl) {
      if (matchingStop) {
        captionNameEl.textContent = matchingStop.name;
        if (captionRegionEl) {
          captionRegionEl.textContent = matchingStop.region;
        }
        captionBarEl.classList.add('is-visible');
      } else {
        captionBarEl.classList.remove('is-visible');
      }
    }
  }

  // Update thin terracotta progress bar
  if (captionProgressFillEl) {
    captionProgressFillEl.style.width = `${(progress * 100).toFixed(2)}%`;
  }
}

//------------------------------------------------------------------------------------//
/**
 * Initializes destination caption bindings and caches DOM nodes.
 * @returns {void}
 */
export function initOverlayManager() {
  captionBarEl = document.getElementById('travelogue-caption-bar');
  captionNameEl = document.getElementById('caption-name');
  captionRegionEl = document.getElementById('caption-region');
  captionProgressFillEl = document.getElementById('caption-progress-fill');

  activeStopId = null;
  updateOverlays(0, 0, true);
}

//------------------------------End of file---------------------------------------------------//