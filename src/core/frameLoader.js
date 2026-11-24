// =============================================================================
// Cape Town Tour Guide — Frame Asset Loader & Non-Blocking Preloader
// =============================================================================

import {
  PARTS,
  FRAME_STEP,
  INITIAL_LOAD_TARGET,
  BACKGROUND_CONCURRENCY
} from '../config/tourConfig.js';

const frameRegistry = [];
let initialLoadedCount = 0;
let totalLoadedCount = 0;
let initialTargetReached = false;
let onFrameLoadedListener = null;

//------------------------------------------------------------------------------------//
/**
 * Builds the flat sequence array of frame metadata across all configured parts.
 * Uses FRAME_STEP to stride through available odd-numbered WebP frames.
 * @returns {Array<Object>} List of indexed frame records.
 */
export function buildFrameRegistry() {
  frameRegistry.length = 0;
  let sequentialIndex = 0;

  for (const part of PARTS) {
    for (let frameNum = 1; frameNum <= part.frameCount; frameNum += FRAME_STEP) {
      const paddedNum = String(frameNum).padStart(3, '0');
      const url = `${part.folder}/ezgif-frame-${paddedNum}.webp`;

      frameRegistry.push({
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

  return frameRegistry;
}

//------------------------------------------------------------------------------------//
/**
 * Locates the nearest loaded frame record when the requested target index is pending.
 * Searches backwards toward frame 0 first, then forwards toward the end.
 * @param {number} targetIndex - Requested sequence frame index.
 * @returns {Object|null} The nearest loaded frame record or null.
 */
export function getNearestLoadedFrame(targetIndex) {
  if (!frameRegistry.length) return null;

  const boundedIndex = Math.max(0, Math.min(frameRegistry.length - 1, targetIndex));

  // Direct hit if already cached
  if (frameRegistry[boundedIndex] && frameRegistry[boundedIndex].loaded) {
    return frameRegistry[boundedIndex];
  }

  // Search backward toward start
  for (let i = boundedIndex - 1; i >= 0; i--) {
    if (frameRegistry[i] && frameRegistry[i].loaded) {
      return frameRegistry[i];
    }
  }

  // Search forward toward end
  for (let i = boundedIndex + 1; i < frameRegistry.length; i++) {
    if (frameRegistry[i] && frameRegistry[i].loaded) {
      return frameRegistry[i];
    }
  }

  return null;
}

//------------------------------------------------------------------------------------//
/**
 * Asynchronously loads an individual image frame with error resilience.
 * @param {Object} frameRecord - Metadata record for the target frame.
 * @param {Function} [onComplete] - Callback receiving (success, frameRecord).
 * @returns {void}
 */
export function loadSingleFrame(frameRecord, onComplete) {
  const img = new Image();
  img.decoding = 'async';

  img.onload = () => {
    frameRecord.img = img;
    frameRecord.loaded = true;
    frameRecord.error = false;
    if (onFrameLoadedListener) {
      onFrameLoadedListener(frameRecord);
    }
    if (onComplete) onComplete(true, frameRecord);
  };

  img.onerror = () => {
    frameRecord.img = null;
    frameRecord.loaded = false;
    frameRecord.error = true;
    console.warn(`[FrameLoader] Frame unavailable: ${frameRecord.url}`);
    if (onComplete) onComplete(false, frameRecord);
  };

  img.src = frameRecord.url;
}

//------------------------------------------------------------------------------------//
/**
 * Runs a concurrent worker pool to stream the remaining frames in the background.
 * @param {Function} [onProgress] - Optional callback per loaded background frame.
 * @returns {void}
 */
function startBackgroundStream(onProgress) {
  let cursor = INITIAL_LOAD_TARGET;
  let activeWorkers = 0;

  function pump() {
    while (activeWorkers < BACKGROUND_CONCURRENCY && cursor < frameRegistry.length) {
      const record = frameRegistry[cursor];
      cursor++;
      activeWorkers++;

      loadSingleFrame(record, () => {
        activeWorkers--;
        totalLoadedCount++;
        if (onProgress) onProgress(totalLoadedCount, frameRegistry.length);
        pump();
      });
    }
  }

  pump();
}

//------------------------------------------------------------------------------------//
/**
 * Initiates the non-blocking progressive loading sequence in the background.
 * Buffers INITIAL_LOAD_TARGET frames before calling onInitialReady.
 * @param {Function} onInitialReady - Called when the initial buffer is ready.
 * @param {Function} onInitialProgress - Called on each initial frame load (pct, count, target).
 * @returns {void}
 */
export function startProgressiveLoader(onInitialReady, onInitialProgress) {
  const initialBatchLimit = Math.min(INITIAL_LOAD_TARGET, frameRegistry.length);
  initialLoadedCount = 0;
  totalLoadedCount = 0;
  initialTargetReached = false;

  for (let i = 0; i < initialBatchLimit; i++) {
    const record = frameRegistry[i];
    loadSingleFrame(record, () => {
      initialLoadedCount++;
      totalLoadedCount++;

      const pct = Math.min(100, Math.floor((initialLoadedCount / initialBatchLimit) * 100));
      if (onInitialProgress) {
        onInitialProgress(pct, initialLoadedCount, initialBatchLimit);
      }

      if (initialLoadedCount >= initialBatchLimit && !initialTargetReached) {
        initialTargetReached = true;
        if (onInitialReady) onInitialReady();
        startBackgroundStream();
      }
    });
  }
}

//------------------------------------------------------------------------------------//
/**
 * Returns current loading statistics for the HUD and status monitors.
 * @returns {{ loaded: number, total: number, initialReady: boolean }} Loading statistics.
 */
export function getLoadingStats() {
  return {
    loaded: totalLoadedCount,
    total: frameRegistry.length,
    initialReady: initialTargetReached
  };
}

//------------------------------------------------------------------------------------//
/**
 * Sets a listener that gets notified whenever any frame finishes loading.
 * @param {Function} listener - Callback function receiving the loaded frameRecord.
 * @returns {void}
 */
export function setOnFrameLoadedListener(listener) {
  onFrameLoadedListener = listener;
}

//------------------------------End of file---------------------------------------------------//
