// =============================================================================
// Cape Town Tour Guide — Sequence Debug HUD ('D' Key Toggle)
// =============================================================================

import { getStopByFrame } from '../config/tourConfig.js';
import { getLoadingStats } from '../core/frameLoader.js';
import { getCurrentScrollMode, getScrollProgress } from '../core/scrollController.js';
import { getCurrentFrameIndex } from '../core/canvasRenderer.js';

let hudElement = null;
let isHudVisible = false;

//------------------------------------------------------------------------------------//
/**
 * Renders or updates the text contents of the debug overlay panel.
 * @returns {void}
 */
export function updateDebugHud() {
  if (!hudElement || !isHudVisible) return;

  const currentFrame = getCurrentFrameIndex();
  const currentStop = getStopByFrame(currentFrame);
  const mode = getCurrentScrollMode();
  const progress = getScrollProgress();
  const stats = getLoadingStats();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvasEl = document.getElementById('sequence-canvas');
  const cw = canvasEl ? canvasEl.width : 0;
  const ch = canvasEl ? canvasEl.height : 0;

  const stopText = currentStop
    ? `[${currentStop.region}] ${currentStop.name} (f:${currentStop.startFrame}-${currentStop.endFrame})`
    : '[TRANSITION DEAD-ZONE]';

  const modeLabel = mode === 'option-a' ? 'Option A (Split-Screen)' : 'Option B (Travelogue Pinned)';
  const pctLoaded = stats.total > 0 ? Math.floor((stats.loaded / stats.total) * 100) : 0;

  hudElement.innerHTML = `
    <div class="hud-header">
      <span class="hud-title">CAPE TOWN SEQUENCE DEBUG HUD</span>
      <span class="hud-key-tag">KEY: [D]</span>
    </div>
    <div class="hud-grid">
      <div class="hud-row"><span class="hud-label">FRAME INDEX:</span><span class="hud-value">${String(currentFrame).padStart(3, '0')} / 449</span></div>
      <div class="hud-row"><span class="hud-label">ACTIVE STOP:</span><span class="hud-value hud-accent">${stopText}</span></div>
      <div class="hud-row"><span class="hud-label">LAYOUT MODE:</span><span class="hud-value">${modeLabel}</span></div>
      <div class="hud-row"><span class="hud-label">SCROLL PROGRESS:</span><span class="hud-value">${(progress * 100).toFixed(1)}%</span></div>
      <div class="hud-row"><span class="hud-label">ASSET BUFFER:</span><span class="hud-value">${stats.loaded} / ${stats.total} (${pctLoaded}%)</span></div>
      <div class="hud-row"><span class="hud-label">CANVAS BUFFER:</span><span class="hud-value">${cw}x${ch} (DPR: ${dpr})</span></div>
    </div>
  `;
}

//------------------------------------------------------------------------------------//
/**
 * Toggles the visibility of the Debug HUD overlay.
 * @returns {void}
 */
export function toggleDebugHud() {
  isHudVisible = !isHudVisible;
  if (!hudElement) return;

  if (isHudVisible) {
    hudElement.classList.add('is-active');
    updateDebugHud();
  } else {
    hudElement.classList.remove('is-active');
  }
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the debug HUD overlay element and binds the 'D' key toggle event.
 * @returns {void}
 */
export function initDebugHud() {
  hudElement = document.getElementById('debug-hud');

  window.addEventListener('keydown', (e) => {
    // Avoid triggering when user is typing in form inputs or textareas
    const activeTagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTagName === 'input' || activeTagName === 'textarea' || activeTagName === 'select') {
      return;
    }

    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      toggleDebugHud();
    }
  });
}

//------------------------------End of file---------------------------------------------------//
