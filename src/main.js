// =============================================================================
// Cape Town Tour Guide — Scroll-Driven Canvas Sequence MVP
// Tech Stack: Vanilla ES6 + Local GSAP & ScrollTrigger (Zero External CDNs)
// =============================================================================

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// Grouped Configuration Constants
// =============================================================================

export const PARTS = [
  { id: 'part-1', folder: '/frames/com-part-1', frameCount: 300 },
  { id: 'part-2', folder: '/frames/com-part-2', frameCount: 300 },
  { id: 'part-3', folder: '/frames/com-part-3', frameCount: 300 }
];

export const FRAME_STEP = 2;              // Loads every 2nd frame: 1, 3, 5... (450 frames total)
export const SCROLL_DISTANCE = 12000;      // Virtual scroll distance in pixels
export const INITIAL_LOAD_TARGET = 40;     // Initial frames before unlocking scrub runtime
export const BACKGROUND_CONCURRENCY = 8;  // Concurrent background frame requests

export const STOPS = [
  { index: 0, title: 'Bo-Kaap' },
  { index: 1, title: "Lion's Head" },
  { index: 2, title: 'Table Mountain' },
  { index: 3, title: 'Boulders Beach' },
  { index: 4, title: 'Cape of Good Hope' },
  { index: 5, title: 'Cape Point Nature Reserve' },
  { index: 6, title: 'Kirstenbosch Gardens' },
  { index: 7, title: 'Groot Constantia' },
  { index: 8, title: 'Franschhoek Winelands' }
];

// -----------------------------------------------------------------------------
// Runtime State
// -----------------------------------------------------------------------------

const frameRegistry = [];
let initialLoadedCount = 0;
let totalLoadedCount = 0;
let initialTargetReached = false;
let currentFrameIndex = 0;
let lastRenderedFrameIndex = -1;
let masterTimeline = null;

// DOM Elements
let canvas = null;
let ctx = null;
let loaderOverlayEl = null;
let loaderPercentageEl = null;
let loaderBarEl = null;
let loaderStatusTextEl = null;
let scrollProgressBarEl = null;

// -----------------------------------------------------------------------------

/**
 * Builds the flat indexed sequence array across all defined multi-part folders.
 * Uses FRAME_STEP to stride through available frames.
 * @returns {Array<Object>} List of indexed frame metadata records.
 */
function buildFrameRegistry() {
  const records = [];
  let sequentialIndex = 0;

  for (const part of PARTS) {
    for (let frameNum = 1; frameNum <= part.frameCount; frameNum += FRAME_STEP) {
      const paddedNum = String(frameNum).padStart(3, '0');
      const url = `${part.folder}/ezgif-frame-${paddedNum}.webp`;

      records.push({
        index: sequentialIndex,
        partId: part.id,
        frameNum,
        url,
        img: null,
        loaded: false,
        error: false
      });

      sequentialIndex++;
    }
  }

  return records;
}

// -----------------------------------------------------------------------------

/**
 * Updates the canvas pixel dimensions according to window size and DPR,
 * and configures high-quality image smoothing.
 * @returns {void}
 */
function updateCanvasDimensions() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

// -----------------------------------------------------------------------------

/**
 * Draws an image onto the canvas using object-fit: cover scaling math,
 * ensuring the viewport is completely covered with no stretching or letterboxing.
 * @param {HTMLImageElement} img - The loaded image element to draw.
 * @returns {void}
 */
function drawCover(img) {
  if (!canvas || !ctx || !img) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const hRatio = cw / iw;
  const vRatio = ch / ih;
  const coverRatio = Math.max(hRatio, vRatio);

  const renderW = Math.round(iw * coverRatio);
  const renderH = Math.round(ih * coverRatio);
  const offsetX = Math.round((cw - renderW) / 2);
  const offsetY = Math.round((ch - renderH) / 2);

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
}

// -----------------------------------------------------------------------------

/**
 * Locates the nearest loaded frame record if the requested target index is still pending.
 * Searches backwards first toward frame 0, then forwards toward the end.
 * @param {number} targetIndex - Desired frame sequence index.
 * @returns {Object|null} The nearest loaded frame record or null.
 */
function getNearestLoadedFrame(targetIndex) {
  if (!frameRegistry.length) return null;

  const boundedIndex = Math.max(0, Math.min(frameRegistry.length - 1, targetIndex));

  // Direct hit if already loaded
  if (frameRegistry[boundedIndex] && frameRegistry[boundedIndex].loaded) {
    return frameRegistry[boundedIndex];
  }

  // Search backwards
  for (let i = boundedIndex - 1; i >= 0; i--) {
    if (frameRegistry[i] && frameRegistry[i].loaded) {
      return frameRegistry[i];
    }
  }

  // Search forwards
  for (let i = boundedIndex + 1; i < frameRegistry.length; i++) {
    if (frameRegistry[i] && frameRegistry[i].loaded) {
      return frameRegistry[i];
    }
  }

  return null;
}

// -----------------------------------------------------------------------------

/**
 * Renders the frame at the specified target index. Avoids redundant canvas draws
 * if the rendered frame index has not changed since the last paint.
 * @param {number} targetIndex - Requested frame index.
 * @param {boolean} [force=false] - Whether to bypass the deduplication check (e.g. on resize).
 * @returns {void}
 */
function renderFrame(targetIndex, force = false) {
  const frameRecord = getNearestLoadedFrame(targetIndex);
  if (!frameRecord || !frameRecord.img) return;

  if (!force && frameRecord.index === lastRenderedFrameIndex) {
    return;
  }

  lastRenderedFrameIndex = frameRecord.index;
  currentFrameIndex = targetIndex;
  drawCover(frameRecord.img);
}

// -----------------------------------------------------------------------------

/**
 * Asynchronously loads a single image frame, handling success and error callbacks safely.
 * @param {Object} frameRecord - The metadata record for the frame.
 * @param {Function} [onComplete] - Callback invoked when the image loads or fails.
 * @returns {void}
 */
function loadSingleFrame(frameRecord, onComplete) {
  const img = new Image();
  img.decoding = 'async';

  img.onload = () => {
    frameRecord.img = img;
    frameRecord.loaded = true;
    frameRecord.error = false;
    if (onComplete) onComplete(true, frameRecord);
  };

  img.onerror = () => {
    frameRecord.img = null;
    frameRecord.loaded = false;
    frameRecord.error = true;
    console.warn(`[Asset Pipeline] Missing or unreadable frame: ${frameRecord.url}`);
    if (onComplete) onComplete(false, frameRecord);
  };

  img.src = frameRecord.url;
}

// -----------------------------------------------------------------------------

/**
 * Updates the visual preloader UI with the current percentage and frame count.
 * @param {number} percentage - Integer percentage (0-100).
 * @param {number} loaded - Number of initial frames loaded.
 * @param {number} target - Target number of initial frames required.
 * @returns {void}
 */
function updateLoaderUI(percentage, loaded, target) {
  if (loaderPercentageEl) {
    loaderPercentageEl.textContent = `${percentage}%`;
  }
  if (loaderBarEl) {
    loaderBarEl.style.width = `${percentage}%`;
  }
  if (loaderStatusTextEl) {
    loaderStatusTextEl.textContent = `BUFFERING INITIAL ASSETS (${loaded} / ${target})`;
  }
}


// -----------------------------------------------------------------------------

/**
 * Coordinates background asset loading using a concurrent request pool
 * once the initial target frames have cleared.
 * @returns {void}
 */
function startBackgroundAssetStream() {
  let cursor = INITIAL_LOAD_TARGET;
  let activePool = 0;

  function pump() {
    while (activePool < BACKGROUND_CONCURRENCY && cursor < frameRegistry.length) {
      const record = frameRegistry[cursor];
      cursor++;
      activePool++;

      loadSingleFrame(record, () => {
        activePool--;
        totalLoadedCount++;
        pump();
      });
    }
  }

  pump();
}

// -----------------------------------------------------------------------------

/**
 * Dismisses the preloader overlay with a clean flat opacity transition.
 * @returns {void}
 */
function hideLoaderOverlay() {
  if (!loaderOverlayEl) return;
  loaderOverlayEl.classList.add('is-hidden');
  setTimeout(() => {
    loaderOverlayEl.style.display = 'none';
  }, 450);
}

// -----------------------------------------------------------------------------

/**
 * Initiates the multi-phase progressive frame loading pipeline.
 * First buffers INITIAL_LOAD_TARGET frames, then unlocks the scrub timeline.
 * @returns {void}
 */
function startProgressiveLoader() {
  const initialBatchLimit = Math.min(INITIAL_LOAD_TARGET, frameRegistry.length);

  for (let i = 0; i < initialBatchLimit; i++) {
    const record = frameRegistry[i];
    loadSingleFrame(record, () => {
      initialLoadedCount++;
      totalLoadedCount++;

      const pct = Math.min(100, Math.floor((initialLoadedCount / initialBatchLimit) * 100));
      updateLoaderUI(pct, initialLoadedCount, initialBatchLimit);

      if (initialLoadedCount >= initialBatchLimit && !initialTargetReached) {
        initialTargetReached = true;
        onInitialBufferReady();
      }
    });
  }
}

// -----------------------------------------------------------------------------

/**
 * Executed once INITIAL_LOAD_TARGET frames are confirmed ready.
 * Hides loader, renders frame 0, initializes ScrollTrigger, and starts background streaming.
 * @returns {void}
 */
function onInitialBufferReady() {
  hideLoaderOverlay();
  renderFrame(0, true);
  initScrollSequence();
  startBackgroundAssetStream();
}

// -----------------------------------------------------------------------------

/**
 * Constructs the master GSAP ScrollTrigger timeline to scrub through frames
 * and cleanly synchronize in-frame location area titles.
 * @returns {void}
 */
function initScrollSequence() {
  if (masterTimeline) {
    masterTimeline.kill();
  }

  const totalFrames = frameRegistry.length;
  if (totalFrames <= 0) return;

  const playhead = { frame: 0 };

  // Set initial stop card visibilities
  gsap.set('#stop-0', { autoAlpha: 1, y: 0 });
  gsap.set('.stop-card:not(#stop-0)', { autoAlpha: 0, y: 12 });

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

        // Update 1px scrub progress line
        if (scrollProgressBarEl) {
          scrollProgressBarEl.style.width = `${(progress * 100).toFixed(2)}%`;
        }
      }
    }
  });

  // 1. Scrub Frame Sequence (0 to totalFrames - 1)
  masterTimeline.to(
    playhead,
    {
      frame: totalFrames - 1,
      ease: 'none',
      duration: 1.0,
      onUpdate: () => {
        renderFrame(Math.round(playhead.frame));
      }
    },
    0
  );

  // 2. Synchronize In-Frame Location Area Titles
  // Stop 0 (Bo-Kaap): visible at scroll 0, holds, then cleanly fades out
  masterTimeline.to(
    '#stop-0',
    {
      autoAlpha: 0,
      y: -8,
      duration: 0.02,
      ease: 'power1.out'
    },
    0.05
  );

  // Stops 1 through 7: evenly spaced across scroll progress (i / 8)
  for (let i = 1; i < STOPS.length - 1; i++) {
    const center = i / 8;
    const enterStart = center - 0.05;
    const leaveStart = center + 0.03;

    masterTimeline.fromTo(
      `#stop-${i}`,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.02, ease: 'power1.out' },
      enterStart
    );

    masterTimeline.to(
      `#stop-${i}`,
      { autoAlpha: 0, y: -8, duration: 0.02, ease: 'power1.out' },
      leaveStart
    );
  }

  // Stop 8 (Franschhoek Winelands - Final Area): fades in and remains pinned
  masterTimeline.fromTo(
    '#stop-8',
    { autoAlpha: 0, y: 12 },
    { autoAlpha: 1, y: 0, duration: 0.03, ease: 'power1.out' },
    0.91
  );
}

// -----------------------------------------------------------------------------

/**
 * Handles window resize events: resizes canvas buffer, forces a frame redraw,
 * and refreshes ScrollTrigger calculations.
 * @returns {void}
 */
function handleResize() {
  updateCanvasDimensions();
  renderFrame(currentFrameIndex, true);
  ScrollTrigger.refresh();
}

// -----------------------------------------------------------------------------

/**
 * Main application bootstrap function. Queries DOM nodes, builds the frame sequence,
 * binds resize events, and triggers progressive asset loading.
 * @returns {void}
 */
function initApp() {
  canvas = document.getElementById('sequence-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d', { alpha: false });
  }

  loaderOverlayEl = document.getElementById('loader-overlay');
  loaderPercentageEl = document.getElementById('loader-percentage');
  loaderBarEl = document.getElementById('loader-bar');
  loaderStatusTextEl = document.getElementById('loader-status-text');
  scrollProgressBarEl = document.getElementById('scroll-progress-bar');

  // Build indexed frame array
  const indexed = buildFrameRegistry();
  frameRegistry.push(...indexed);

  // Initialize canvas buffer
  updateCanvasDimensions();

  // Attach window event listeners
  window.addEventListener('resize', handleResize);

  // Launch progressive preloader
  startProgressiveLoader();
}

// -----------------------------------------------------------------------------

// Boot on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// -----------------------------------------------------------------------------
