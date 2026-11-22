// =============================================================================
// Cape Town Tour Guide — GSAP & ScrollTrigger Controller
// =============================================================================

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SCROLL_DISTANCE } from '../config/tourConfig.js';

gsap.registerPlugin(ScrollTrigger);

let masterTimeline = null;

// -----------------------------------------------------------------------------

/**
 * Initializes the pinned scroll timeline scrubbing through totalFrames.
 * Calls onUpdateCallback on every inertia and scrub update with (currentFrame, progress).
 * @param {number} totalFrames - Total number of indexed frames (e.g. 450).
 * @param {Function} onUpdateCallback - Callback invoked on each scrub tick with (currentFrame, progress).
 * @returns {gsap.core.Timeline} The instantiated GSAP timeline.
 */
export function initScrollController(totalFrames, onUpdateCallback) {
  if (masterTimeline) {
    masterTimeline.kill();
  }

  const playhead = { frame: 0 };

  masterTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-track',
      start: 'top top',
      end: `+=${SCROLL_DISTANCE}`,
      pin: '#pinned-viewport',
      scrub: 0.5,
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const currentFrame = Math.round(playhead.frame);
        if (onUpdateCallback) {
          onUpdateCallback(currentFrame, progress);
        }
      }
    }
  });

  // Scrub frame playhead from 0 to totalFrames - 1
  masterTimeline.to(
    playhead,
    {
      frame: totalFrames - 1,
      ease: 'none',
      duration: 1.0,
      onUpdate: () => {
        const currentFrame = Math.round(playhead.frame);
        const progress = masterTimeline ? masterTimeline.progress() : 0;
        if (onUpdateCallback) {
          onUpdateCallback(currentFrame, progress);
        }
      }
    },
    0
  );

  return masterTimeline;
}

// -----------------------------------------------------------------------------

/**
 * Forces ScrollTrigger to recalculate viewport positions and pin spacers.
 * @returns {void}
 */
export function refreshScroll() {
  ScrollTrigger.refresh();
}

// -----------------------------------------------------------------------------
