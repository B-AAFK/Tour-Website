// =============================================================================
// Cape Private Tours — Frame Asset Loader & Concurrency-Limited Preloader
// =============================================================================

import {
  ASSET_BASE_URL,
  PARTS,
  FRAME_STEP,
  INITIAL_LOAD_TARGET,
  BACKGROUND_CONCURRENCY
} from '../config/tourConfig.js';
import { reportDevError } from './errorHandler.js';

const MAX_FRAME_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

const frameRegistry = [];
let initialLoadedCount = 0;
let initialTargetReached = false;
let onFrameLoadedListener = null;

//------------------------------------------------------------------------------------//
/**
 * Schedules a non-urgent callback during browser idle time with a setTimeout fallback.
 * @param {Function} callback - Function to invoke when the main thread is idle.
 * @returns {void}
 */
function scheduleIdle(callback) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(callback, { timeout: 250 });
  } else {
    setTimeout(callback, 50);
  }
}

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
      const url = `${ASSET_BASE_URL}${part.folder}/ezgif-frame-${paddedNum}.webp`;

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

  if (frameRegistry[boundedIndex] && frameRegistry[boundedIndex].loaded) {
    return frameRegistry[boundedIndex];
  }

  for (let i = boundedIndex - 1; i >= 0; i--) {
    if (frameRegistry[i] && frameRegistry[i].loaded) {
      return frameRegistry[i];
    }
  }

  for (let i = boundedIndex + 1; i < frameRegistry.length; i++) {
    if (frameRegistry[i] && frameRegistry[i].loaded) {
      return frameRegistry[i];
    }
  }

  return null;
}

//------------------------------------------------------------------------------------//
/**
 * Asynchronously loads an individual image frame with bounded retry logic.
 * Clears event handlers on settlement to avoid retaining stale closures.
 * @param {Object} frameRecord - Metadata record for the target frame.
 * @param {Function} [onComplete] - Callback receiving (success, frameRecord).
 * @param {number} [attempt=0] - Current retry attempt count.
 * @returns {void}
 */
export function loadSingleFrame(frameRecord, onComplete, attempt = 0) {
  const img = new Image();
  img.decoding = 'async';

  function cleanup() {
    img.onload = null;
    img.onerror = null;
  }

  img.onload = () => {
    cleanup();
    frameRecord.img = img;
    frameRecord.loaded = true;
    frameRecord.error = false;
    if (onFrameLoadedListener) {
      onFrameLoadedListener(frameRecord);
    }
    if (onComplete) onComplete(true, frameRecord);
  };

  img.onerror = () => {
    cleanup();
    if (attempt < MAX_FRAME_RETRIES) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(3, attempt);
      setTimeout(() => loadSingleFrame(frameRecord, onComplete, attempt + 1), delay);
      return;
    }

    frameRecord.img = null;
    frameRecord.loaded = false;
    frameRecord.error = true;
    reportDevError('FrameLoader', `Frame unavailable after retries: ${frameRecord.url}`);
    if (onComplete) onComplete(false, frameRecord);
  };

  img.src = frameRecord.url;
}

//------------------------------------------------------------------------------------//
/**
 * Streams a contiguous range of frame records through a bounded-concurrency queue.
 * @param {number} startIdx - Inclusive starting registry index.
 * @param {number} endIdx - Exclusive ending registry index.
 * @param {Function} onEach - Callback invoked after each frame settles.
 * @param {Function} [onBatchDone] - Optional callback invoked once the entire range finishes.
 * @returns {void}
 */
function streamRangeBounded(startIdx, endIdx, onEach, onBatchDone) {
  let cursor = startIdx;
  let activeWorkers = 0;
  let completed = false;

  function pump() {
    if (cursor >= endIdx && activeWorkers === 0 && !completed) {
      completed = true;
      if (onBatchDone) onBatchDone();
      return;
    }

    while (activeWorkers < BACKGROUND_CONCURRENCY && cursor < endIdx) {
      const record = frameRegistry[cursor];
      cursor++;
      activeWorkers++;

      loadSingleFrame(record, (success, settledRecord) => {
        activeWorkers--;
        if (onEach) onEach(success, settledRecord);
        pump();
      });
    }
  }

  pump();
}

//------------------------------------------------------------------------------------//
/**
 * Initiates concurrency-limited progressive loading: buffers INITIAL_LOAD_TARGET
 * frames first, then streams the remaining sequence during browser idle windows.
 * @param {Function} onInitialReady - Called when the initial buffer is ready.
 * @param {Function} onInitialProgress - Called on each initial frame load (pct, count, target).
 * @returns {void}
 */
export function startProgressiveLoader(onInitialReady, onInitialProgress) {
  const initialBatchLimit = Math.min(INITIAL_LOAD_TARGET, frameRegistry.length);
  initialLoadedCount = 0;
  initialTargetReached = false;

  streamRangeBounded(
    0,
    initialBatchLimit,
    () => {
      initialLoadedCount++;

      const pct = Math.min(100, Math.floor((initialLoadedCount / initialBatchLimit) * 100));
      if (onInitialProgress) {
        onInitialProgress(pct, initialLoadedCount, initialBatchLimit);
      }
    },
    () => {
      if (!initialTargetReached) {
        initialTargetReached = true;
        if (onInitialReady) onInitialReady();
        scheduleIdle(() => {
          streamRangeBounded(initialBatchLimit, frameRegistry.length);
        });
      }
    }
  );
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
