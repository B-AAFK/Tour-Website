// =============================================================================
// Cape Town Tour Guide — Application Bootstrap & Orchestrator
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import {
  buildFrameRegistry,
  getNearestLoadedFrame,
  startProgressiveLoader
} from './core/frameLoader.js';
import { initCanvasRenderer, renderFrame } from './core/canvasRenderer.js';
import { initScrollController, refreshScroll } from './core/scrollController.js';
import { initOverlayManager, updateOverlays } from './ui/overlayManager.js';

// -----------------------------------------------------------------------------

/**
 * Handles unified scrub ticks from the scroll controller, synchronizing
 * canvas painting and location overlays.
 * @param {number} currentFrame - Active frame index (0-449).
 * @param {number} progress - Normalized scroll progress (0.0-1.0).
 * @returns {void}
 */
function handleFrameTick(currentFrame, progress) {
  renderFrame(currentFrame);
  updateOverlays(currentFrame, progress);
}

// -----------------------------------------------------------------------------

/**
 * Bootstraps the application: registers assets, initializes UI components,
 * and launches progressive frame loading before activating ScrollTrigger.
 * @returns {void}
 */
function initApp() {
  const canvasEl = document.getElementById('sequence-canvas');
  const loaderEl = document.getElementById('loader-overlay');
  const loaderPctEl = document.getElementById('loader-percentage');
  const loaderBarEl = document.getElementById('loader-bar');
  const loaderStatusEl = document.getElementById('loader-status-text');

  const frames = buildFrameRegistry();
  initCanvasRenderer(canvasEl, getNearestLoadedFrame, refreshScroll);
  initOverlayManager();

  startProgressiveLoader(
    () => {
      if (loaderEl) {
        loaderEl.classList.add('is-hidden');
        setTimeout(() => { loaderEl.style.display = 'none'; }, 450);
      }
      renderFrame(0, true);
      initScrollController(frames.length, handleFrameTick);
    },
    (pct, loaded, target) => {
      if (loaderPctEl) loaderPctEl.textContent = `${pct}%`;
      if (loaderBarEl) loaderBarEl.style.width = `${pct}%`;
      if (loaderStatusEl) {
        loaderStatusEl.textContent = `BUFFERING INITIAL ASSETS (${loaded} / ${target})`;
      }
    }
  );
}

// -----------------------------------------------------------------------------

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// -----------------------------------------------------------------------------
