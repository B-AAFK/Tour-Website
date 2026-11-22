// =============================================================================
// Cape Town Tour Guide — Centralized Tour Configuration
// =============================================================================

export const PARTS = [
  { id: 'part-1', folder: '/frames/com-part-1', frameCount: 300 },
  { id: 'part-2', folder: '/frames/com-part-2', frameCount: 300 },
  { id: 'part-3', folder: '/frames/com-part-3', frameCount: 300 }
];

export const FRAME_STEP = 2;              // Active odd-frame stride (450 frames total: 0-449)
export const SCROLL_DISTANCE = 12000;      // Virtual scroll distance in pixels
export const INITIAL_LOAD_TARGET = 40;     // Initial buffer count before unlocking scrub timeline
export const BACKGROUND_CONCURRENCY = 8;  // Concurrent background frame download workers

export const STOPS = [
  { id: 1, name: 'Bo-Kaap', startFrame: 0, endFrame: 22 },
  { id: 2, name: "Lion's Head", startFrame: 34, endFrame: 71 },
  { id: 3, name: 'Table Mountain', startFrame: 90, endFrame: 126 },
  { id: 4, name: 'Boulders Beach', startFrame: 156, endFrame: 198 },
  { id: 5, name: 'Cape of Good Hope', startFrame: 218, endFrame: 263 },
  { id: 6, name: 'Cape Point Nature Reserve', startFrame: 272, endFrame: 308 },
  { id: 7, name: 'Kirstenbosch Gardens', startFrame: 318, endFrame: 363 },
  { id: 8, name: 'Groot Constantia', startFrame: 378, endFrame: 422 },
  { id: 9, name: 'Franschhoek Winelands', startFrame: 434, endFrame: 449 }
];

// -----------------------------------------------------------------------------
