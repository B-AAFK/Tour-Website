// =============================================================================
// Cape Private Tours — GSAP & ScrollTrigger Controller (Cinema Frame Mode)
// =============================================================================

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TOTAL_FRAMES, OPTION_B_SCROLL_DISTANCE } from '../config/tourConfig.js';

gsap.registerPlugin(ScrollTrigger);

let masterTimeline = null;
let currentProgress = 0;
let currentFrameIndex = 0;
let registeredFrameTick = null;

//------------------------------------------------------------------------------------//
/**
 * Tears down existing ScrollTrigger instances and kills the master timeline.
 * @returns {void}
 */
export function killScrollController() {
  if (masterTimeline) {
    if (masterTimeline.scrollTrigger) {
      masterTimeline.scrollTrigger.kill(true);
    }
    masterTimeline.kill();
    masterTimeline = null;
  }
  const existingTriggers = ScrollTrigger.getAll();
  for (const trigger of existingTriggers) {
    if (trigger.vars && trigger.vars.id === 'showcase-scroll-trigger') {
      trigger.kill(true);
    }
  }
}

//------------------------------------------------------------------------------------//
/**
 * Sets up the pinned Cinema Frame timeline and ScrollTrigger scrubbing.
 * @param {number} totalFrames - Total sequence frame count (450).
 * @param {Function} onFrameTick - Callback with (currentFrame, progress).
 * @returns {gsap.core.Timeline|null} The instantiated GSAP timeline.
 */
function setupCinemaScroll(totalFrames, onFrameTick) {
  const showcaseSection = document.getElementById('explore') || document.querySelector('.showcase-section');
  const pinnedWrapper = document.getElementById('showcase-pinned-wrapper');
  if (!showcaseSection || !pinnedWrapper) return null;

  const playhead = { frame: 0 };

  masterTimeline = gsap.timeline({
    scrollTrigger: {
      id: 'showcase-scroll-trigger',
      trigger: pinnedWrapper,
      start: 'top top',
      end: `+=${OPTION_B_SCROLL_DISTANCE}`,
      pin: pinnedWrapper,
      scrub: 0.5,
      anticipatePin: 1,
      onUpdate: (self) => {
        currentProgress = self.progress;
        currentFrameIndex = Math.round(playhead.frame);
        if (onFrameTick) {
          onFrameTick(currentFrameIndex, currentProgress);
        }
      }
    }
  });

  masterTimeline.to(
    playhead,
    {
      frame: totalFrames - 1,
      ease: 'none',
      duration: 1.0,
      onUpdate: () => {
        currentFrameIndex = Math.round(playhead.frame);
        const prog = masterTimeline ? masterTimeline.progress() : 0;
        currentProgress = prog;
        if (onFrameTick) {
          onFrameTick(currentFrameIndex, prog);
        }
      }
    },
    0
  );

  if (currentProgress > 0) {
    masterTimeline.progress(currentProgress);
  }

  return masterTimeline;
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the scroll controller for the pinned Cinema Frame showcase.
 * @param {number} [totalFrames=TOTAL_FRAMES] - Total frame count.
 * @param {Function} [onFrameTick=null] - Callback invoked on each scrub update.
 * @returns {gsap.core.Timeline|null} The initialized timeline or null.
 */
export function initScrollController(totalFrames = TOTAL_FRAMES, onFrameTick = null) {
  killScrollController();
  if (onFrameTick) {
    registeredFrameTick = onFrameTick;
  }

  setupCinemaScroll(totalFrames, registeredFrameTick);
  ScrollTrigger.refresh();
  return masterTimeline;
}

//------------------------------------------------------------------------------------//
/**
 * Triggers a manual ScrollTrigger layout refresh calculation.
 * @returns {void}
 */
export function refreshScroll() {
  ScrollTrigger.refresh();
}

//------------------------------------------------------------------------------------//
/**
 * Returns the current normalized scroll progress (0.0 - 1.0).
 * @returns {number} Current progress.
 */
export function getScrollProgress() {
  return currentProgress;
}

//------------------------------------------------------------------------------------//
/**
 * Returns the currently active layout mode identifier.
 * @returns {string} Always returns 'cinema-frame'.
 */
export function getCurrentScrollMode() {
  return 'cinema-frame';
}

//------------------------------End of file---------------------------------------------------//