// =============================================================================
// Cape Town Tour Guide — DPR-Aware Canvas Renderer (16:9 Framed Math)
// =============================================================================

let canvas = null;
let ctx = null;
let getFrameRecord = null;
let lastRenderedIndex = -1;
let currentFrameIndex = 0;
let onResizeCallback = null;

//------------------------------------------------------------------------------------//
/**
 * Updates canvas buffer dimensions according to container dimensions and DPR (capped at 2).
 * Maintains strict 16:9 aspect ratio and configures high quality image smoothing.
 * @returns {void}
 */
export function updateCanvasDimensions() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  const displayWidth = Math.round(rect.width) || canvas.clientWidth || 720;
  const displayHeight = Math.round(rect.height) || Math.round(displayWidth * (9 / 16));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

//------------------------------------------------------------------------------------//
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

//------------------------------------------------------------------------------------//
/**
 * Renders the frame at the specified target index.
 * Deduplicates paints if the frame record matches the last rendered frame unless force is true.
 * @param {number} targetIndex - Desired frame sequence index.
 * @param {boolean} [force=false] - Force redraw regardless of duplicate index.
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

//------------------------------------------------------------------------------------//
/**
 * Returns the currently active target frame index.
 * @returns {number} Active target frame index.
 */
export function getCurrentFrameIndex() {
  return currentFrameIndex;
}

//------------------------------------------------------------------------------------//
/**
 * Handles window resize events: recalibrates canvas dimensions and triggers re-render.
 * @returns {void}
 */
function handleResize() {
  updateCanvasDimensions();
  renderFrame(currentFrameIndex, true);
  if (onResizeCallback) {
    onResizeCallback();
  }
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the canvas renderer with target element, frame resolver, and resize callback.
 * @param {HTMLCanvasElement} canvasElement - Target canvas DOM node.
 * @param {Function} frameResolverFn - Function mapping frame index to frame record.
 * @param {Function} [resizeHook] - Optional callback executed after canvas dimension change.
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

//------------------------------End of file---------------------------------------------------//
