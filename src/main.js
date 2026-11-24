// =============================================================================
// Cape Private Tours — Application Bootstrap & Orchestrator
// =============================================================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import {
  buildFrameRegistry,
  getNearestLoadedFrame,
  startProgressiveLoader,
  setOnFrameLoadedListener
} from './core/frameLoader.js';
import { initCanvasRenderer, renderFrame } from './core/canvasRenderer.js';
import { initScrollController, refreshScroll } from './core/scrollController.js';
import { initOverlayManager, updateOverlays } from './ui/overlayManager.js';
import { initReviewManager } from './ui/reviewManager.js';
import { initDebugHud, updateDebugHud } from './ui/debugHud.js';

//------------------------------------------------------------------------------------//
/**
 * Handles unified scrub ticks from the scroll controller, synchronizing
 * canvas painting, location caption bar, and debug HUD.
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
 * Configures the transparent navbar to transition to a solid bar once scrolled past hero.
 * @returns {void}
 */
function initNavbarScrollTransition() {
  const navEl = document.querySelector('.site-nav');
  if (!navEl) return;

  function updateNavState() {
    if (window.scrollY > 60) {
      navEl.classList.add('is-scrolled');
    } else {
      navEl.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', updateNavState, { passive: true });
  updateNavState();
}

//------------------------------------------------------------------------------------//
/**
 * Bootstraps the application: registers assets, initializes UI components,
 * prepares scroll controller, and triggers non-blocking frame loading.
 * @returns {void}
 */
function initApp() {
  const canvasEl = document.getElementById('sequence-canvas');
  const canvasLoaderEl = document.getElementById('canvas-loader');
  const canvasLoaderText = document.getElementById('canvas-loader-text');

  const frames = buildFrameRegistry();

  initNavbarScrollTransition();
  initCanvasRenderer(canvasEl, getNearestLoadedFrame, refreshScroll);
  initOverlayManager();
  initReviewManager();
  initDebugHud();

  // Initialize scroll controller for the pinned Cinema Frame showcase
  initScrollController(frames.length, handleFrameTick);

  // Hook debug HUD and immediate frame 0 render to background frame loading updates
  setOnFrameLoadedListener((loadedRecord) => {
    if (loadedRecord && loadedRecord.index === 0) {
      renderFrame(0, true);
    }
    updateDebugHud();
  });

  // Start non-blocking progressive frame loading
  startProgressiveLoader(
    () => {
      // Callback when initial buffer (40 frames) is loaded: reliably hide loader overlay
      if (canvasLoaderEl) {
        canvasLoaderEl.classList.add('is-loaded');
        canvasLoaderEl.classList.add('is-hidden');
        canvasLoaderEl.style.display = 'none';
      }
      renderFrame(0, true);
      refreshScroll();
      updateDebugHud();
    },
    (pct, loaded, target) => {
      // Progress feedback strictly inside canvas frame while buffering
      if (canvasLoaderText) {
        canvasLoaderText.textContent = `Buffering sequence (${loaded} / ${target})`;
      }
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