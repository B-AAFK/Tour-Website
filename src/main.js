// =============================================================================
// Cape Private Tours — Application Bootstrap & Orchestrator
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { initGlobalErrorHandlers } from './core/errorHandler.js';
import { buildFrameRegistry, getNearestLoadedFrame, startProgressiveLoader, setOnFrameLoadedListener } from './core/frameLoader.js';
import { initCanvasRenderer, renderFrame } from './core/canvasRenderer.js';
import { initScrollController, refreshScroll, scrollToFrame } from './core/scrollController.js';
import { initOverlayManager, updateOverlays } from './ui/overlayManager.js';
import { initGuideWeather } from './ui/guideWeather.js';
import { initReviewManager } from './ui/reviewManager.js';
import { initNavigation } from './ui/navManager.js';
import { mountStaticIcons } from './ui/icons.js';

//------------------------------------------------------------------------------------//
/**
 * Handles unified scrub ticks from the scroll controller, synchronizing canvas and overlays.
 * @param {number} currentFrame - Active frame index (0-449).
 * @param {number} progress - Normalized scroll progress (0.0-1.0).
 * @returns {void}
 */
function handleFrameTick(currentFrame, progress) {
  renderFrame(currentFrame);
  updateOverlays(currentFrame, progress);
}

//------------------------------------------------------------------------------------//
/**
 * Bootstraps the landing page: installs error handlers, mounts icons, and starts frame streaming.
 * @returns {void}
 */
function initApp() {
  initGlobalErrorHandlers();
  const canvasEl = document.getElementById('sequence-canvas');
  const canvasLoaderEl = document.getElementById('canvas-loader');
  const canvasLoaderText = document.getElementById('canvas-loader-text');
  const frames = buildFrameRegistry();

  mountStaticIcons();
  initNavigation(false);
  initCanvasRenderer(canvasEl, getNearestLoadedFrame, refreshScroll);
  initOverlayManager(scrollToFrame);
  initGuideWeather();
  initReviewManager();
  initScrollController(frames.length, handleFrameTick);

  setOnFrameLoadedListener((loadedRecord) => {
    if (loadedRecord && loadedRecord.index === 0) renderFrame(0, true);
  });

  startProgressiveLoader(
    () => {
      if (canvasLoaderEl) {
        canvasLoaderEl.classList.add('is-loaded', 'is-hidden');
      }
      renderFrame(0, true);
      refreshScroll();
    },
    (_pct, loaded, target) => {
      if (canvasLoaderText) canvasLoaderText.textContent = `Buffering sequence (${loaded} / ${target})`;
    }
  );
}

//------------------------------------------------------------------------------------//
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

//------------------------------End of file---------------------------------------------------//
