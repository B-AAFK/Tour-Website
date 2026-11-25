// =============================================================================
// Cape Private Tours — Application Bootstrap & Orchestrator
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { buildFrameRegistry, getNearestLoadedFrame, startProgressiveLoader, setOnFrameLoadedListener } from './core/frameLoader.js';
import { initCanvasRenderer, renderFrame } from './core/canvasRenderer.js';
import { initScrollController, refreshScroll, scrollToFrame } from './core/scrollController.js';
import { initOverlayManager, updateOverlays } from './ui/overlayManager.js';
import { initGuideWeather } from './ui/guideWeather.js';
import { initReviewManager } from './ui/reviewManager.js';
import { initDebugHud, updateDebugHud } from './ui/debugHud.js';
import { initNavigation } from './ui/navManager.js';
import { mountStaticIcons } from './ui/icons.js';

//------------------------------------------------------------------------------------//
/**
 * Handles unified scrub ticks from the scroll controller, synchronizing canvas, overlays, and HUD.
 * @param {number} currentFrame - Active frame index (0-449).
 * @param {number} progress - Normalized scroll progress (0.0-1.0).
 * @returns {void}
 */
function handleFrameTick(currentFrame, progress) {
  renderFrame(currentFrame);
  updateOverlays(currentFrame, progress);
  updateDebugHud();
}

//------------------------------------------------------------------------------------//
/**
 * Bootstraps the landing page: mounts local icons, builds frame registry, and starts loader.
 * @returns {void}
 */
function initApp() {
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
  initDebugHud();
  initScrollController(frames.length, handleFrameTick);

  setOnFrameLoadedListener((loadedRecord) => {
    if (loadedRecord && loadedRecord.index === 0) renderFrame(0, true);
    updateDebugHud();
  });

  startProgressiveLoader(
    () => {
      if (canvasLoaderEl) {
        canvasLoaderEl.classList.add('is-loaded', 'is-hidden');
        canvasLoaderEl.style.display = 'none';
      }
      renderFrame(0, true);
      refreshScroll();
      updateDebugHud();
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
