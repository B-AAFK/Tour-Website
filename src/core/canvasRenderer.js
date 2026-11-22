// =============================================================================
// Cape Town Tour Guide — DPR-Aware Canvas Renderer (Cover Math)
// =============================================================================

let canvas = null;
let ctx = null;
let getFrameRecord = null;
let lastRenderedIndex = -1;
let currentFrameIndex = 0;
let onResizeCallback = null;

// -----------------------------------------------------------------------------

/**
 * Updates canvas buffer dimensions according to viewport and DPR (capped at 2),
 * and restores high-quality image smoothing.
 * @returns {void}
 */
export function updateCanvasDimensions() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

// -----------------------------------------------------------------------------

/**
 * Draws an image element onto the canvas using cover-scaling geometry.
 * The image is centered and scaled without stretching or letterboxing.
 * @param {HTMLImageElement} img - The image element to render.
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
 * Renders the frame at the specified target index.
 * Deduplicates calls if the resolved frame index has not changed since last paint.
 * @param {number} targetIndex - Desired frame sequence index.
 * @param {boolean} [force=false] - Force redraw regardless of index match (e.g. on resize).
 * @returns {void}
 */
export function renderFrame(targetIndex, force = false) {
  if (!getFrameRecord) return;
  const frameRecord = getFrameRecord(targetIndex);
  if (!frameRecord || !frameRecord.img) return;

  if (!force && frameRecord.index === lastRenderedIndex) {
    return;
  }

  lastRenderedIndex = frameRecord.index;
  currentFrameIndex = targetIndex;
  drawCover(frameRecord.img);
}

// -----------------------------------------------------------------------------

/**
 * Handles window resize events: resizes canvas buffer, forces a frame redraw,
 * and notifies the orchestrator (e.g. to refresh ScrollTrigger).
 * @returns {void}
 */
function handleResize() {
  updateCanvasDimensions();
  renderFrame(currentFrameIndex, true);
  if (onResizeCallback) {
    onResizeCallback();
  }
}

// -----------------------------------------------------------------------------

/**
 * Initializes the canvas renderer with target element, frame resolver, and resize hook.
 * @param {HTMLCanvasElement} canvasElement - The canvas DOM element.
 * @param {Function} frameResolverFn - Function mapping frame index to frame record.
 * @param {Function} [resizeHook] - Optional callback invoked after canvas resize.
 * @returns {void}
 */
export function initCanvasRenderer(canvasElement, frameResolverFn, resizeHook) {
  canvas = canvasElement;
  if (canvas) {
    ctx = canvas.getContext('2d', { alpha: false });
  }
  getFrameRecord = frameResolverFn;
  onResizeCallback = resizeHook;

  updateCanvasDimensions();
  window.addEventListener('resize', handleResize);
}

// -----------------------------------------------------------------------------
