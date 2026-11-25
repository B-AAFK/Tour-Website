// =============================================================================
// Cape Private Tours — Destination Overlay & Chapter Scrubber Manager
// =============================================================================

import { STOPS, getStopByFrame } from '../config/tourConfig.js';
import { createIconElement } from './icons.js';

let captionBarEl = null;
let captionNameEl = null;
let captionRegionEl = null;
let captionProgressFillEl = null;
let chapterScrubberEl = null;
let activeStopId = null;
let chapterButtons = [];

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
 * Finds the nearest stop at or before the current frame for regional accent continuity.
 * @param {number} frameIndex - Current rendered frame index (0-449).
 * @returns {Object} Nearest tour stop object.
 */
function getContextualStop(frameIndex) {
  const direct = getStopByFrame(frameIndex);
  if (direct) return direct;

  let fallback = STOPS[0];
  for (const stop of STOPS) {
    if (frameIndex >= stop.startFrame) {
      fallback = stop;
    }
  }
  return fallback;
}

//------------------------------------------------------------------------------------//
/**
 * Renders the interactive 9-stop horizontal chapter scrubber using safe DOM construction.
 * @param {Function} [onSelectStop] - Callback invoked with target startFrame when clicked.
 * @returns {void}
 */
function renderChapterScrubber(onSelectStop) {
  if (!chapterScrubberEl) return;

  const fragment = document.createDocumentFragment();
  chapterButtons = STOPS.map((stop) => {
    const shortName = stop.name
      .replace(' Nature Reserve', '')
      .replace(' Gardens', '')
      .replace(' Winelands', '')
      .replace('Cape of Good Hope', 'Good Hope');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chapter-marker';
    btn.dataset.stopId = String(stop.id);
    btn.dataset.startFrame = String(stop.startFrame);
    btn.style.setProperty('--chapter-color', stop.regionColorToken);
    btn.setAttribute('aria-label', `Jump to ${stop.name} (${stop.region})`);
    btn.title = stop.name;

    const dot = document.createElement('span');
    dot.className = 'chapter-marker-dot';
    dot.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'chapter-marker-label';
    label.textContent = shortName;

    btn.append(dot, label);
    btn.addEventListener('click', () => {
      if (typeof onSelectStop === 'function') {
        onSelectStop(stop.startFrame);
      }
    });

    fragment.appendChild(btn);
    return btn;
  });

  chapterScrubberEl.replaceChildren(fragment);
}

//------------------------------------------------------------------------------------//
/**
 * Updates caption state, regional color bar, and chapter scrubber in the Cinema Frame showcase.
 * @param {number} currentFrame - Active frame index (0-449).
 * @param {number} progress - Normalized scroll progress (0.0 - 1.0).
 * @param {boolean} [force=false] - Force update of elements regardless of cached active ID.
 * @returns {void}
 */
export function updateOverlays(currentFrame, progress, force = false) {
  const matchingStop = getActiveStop(currentFrame);
  const contextualStop = matchingStop || getContextualStop(currentFrame);
  const newActiveId = matchingStop ? matchingStop.id : null;

  if (force || newActiveId !== activeStopId) {
    activeStopId = newActiveId;

    if (captionBarEl && captionNameEl) {
      if (matchingStop) {
        captionNameEl.textContent = matchingStop.name;
        if (captionRegionEl) {
          const regionLabel = document.createElement('span');
          regionLabel.textContent = matchingStop.region;
          captionRegionEl.replaceChildren(createIconElement('location', 'icon-sm'), regionLabel);
        }
        captionBarEl.style.setProperty('--active-region-color', matchingStop.regionColorToken);
        captionBarEl.classList.add('is-visible');
      } else {
        captionBarEl.classList.remove('is-visible');
      }
    }

    chapterButtons.forEach((btn) => {
      const stopId = parseInt(btn.dataset.stopId, 10);
      const isCurrent = stopId === newActiveId;
      btn.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        btn.setAttribute('aria-current', 'true');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  }

  if (captionProgressFillEl) {
    captionProgressFillEl.style.width = `${(progress * 100).toFixed(2)}%`;
    captionProgressFillEl.style.backgroundColor = contextualStop.regionColorToken;
  }
}

//------------------------------------------------------------------------------------//
/**
 * Initializes destination caption bindings, chapter scrubber, and caches DOM nodes.
 * @param {Function} [onSelectStop] - Optional callback invoked with frame index on chapter click.
 * @returns {void}
 */
export function initOverlayManager(onSelectStop) {
  captionBarEl = document.getElementById('travelogue-caption-bar');
  captionNameEl = document.getElementById('caption-name');
  captionRegionEl = document.getElementById('caption-region');
  captionProgressFillEl = document.getElementById('caption-progress-fill');
  chapterScrubberEl = document.getElementById('chapter-scrubber');

  renderChapterScrubber(onSelectStop);
  activeStopId = null;
  updateOverlays(0, 0, true);
}

//------------------------------End of file---------------------------------------------------//
