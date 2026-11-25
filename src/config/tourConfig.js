// =============================================================================
// Cape Private Tours — Tour Configuration & Destination Stops
// =============================================================================

export const ASSET_BASE_URL = '';

export const PARTS = [
  { id: 'part-1', folder: '/frames/com-part-1', frameCount: 300 },
  { id: 'part-2', folder: '/frames/com-part-2', frameCount: 300 },
  { id: 'part-3', folder: '/frames/com-part-3', frameCount: 300 }
];

export const FRAME_STEP = 2;                 // Active odd-frame stride (450 frames total: 0-449)
export const TOTAL_FRAMES = 450;             // Total frame count in sequence
export const SCROLL_DISTANCE = 12000;        // Full virtual track reference distance
export const OPTION_B_SCROLL_DISTANCE = 3800; // Pinned Cinema Frame scroll distance in pixels
export const INITIAL_LOAD_TARGET = 40;       // Initial buffer count before unlocking scrub timeline
export const BACKGROUND_CONCURRENCY = 6;     // Bounded concurrent frame download workers

export const DURATION_OPTIONS = ['Half Day (4–5 hrs)', 'Full Day (8 hrs)', 'Multi-Day'];
export const GROUP_SIZE_OPTIONS = ['1–2 Guests', '3–4 Guests', '5–6 Guests', '7+ Guests'];

export const STOPS = [
  {
    id: 1,
    region: 'City Bowl',
    regionKey: 'city',
    regionColorToken: 'var(--region-city)',
    name: 'Bo-Kaap',
    startFrame: 0,
    endFrame: 22,
    thumbnailFrame: '/images/Bo-Kaap.webp',
    description: 'Cobbled lanes and pastel Cape Malay houses, visited in the quiet morning for fresh koesisters and local spice kitchens.'
  },
  {
    id: 2,
    region: 'Atlantic Seaboard',
    regionKey: 'atlantic',
    regionColorToken: 'var(--region-atlantic)',
    name: "Lion's Head",
    startFrame: 34,
    endFrame: 71,
    thumbnailFrame: '/images/Lions head.webp',
    description: 'Panoramic coastal ridge between the city bowl and the Atlantic ocean swell, offering golden-hour lookouts across the bay.'
  },
  {
    id: 3,
    region: 'City Bowl',
    regionKey: 'city',
    regionColorToken: 'var(--region-city)',
    name: 'Table Mountain',
    startFrame: 90,
    endFrame: 126,
    thumbnailFrame: '/images/Table Mountain.webp',
    description: 'Ancient sandstone plateau towering over the ocean. We follow the wind and clouds to summit when visibility is at its clearest.'
  },
  {
    id: 4,
    region: 'False Bay',
    regionKey: 'atlantic',
    regionColorToken: 'var(--region-atlantic)',
    name: 'Boulders Beach',
    startFrame: 156,
    endFrame: 198,
    thumbnailFrame: '/images/Boulders Beach.webp',
    description: 'Sheltered granite cove in Simons Town home to free-roaming African penguins along quiet coastal crevices.'
  },
  {
    id: 5,
    region: 'Cape Peninsula',
    regionKey: 'peninsula',
    regionColorToken: 'var(--region-peninsula)',
    name: 'Cape of Good Hope',
    startFrame: 218,
    endFrame: 263,
    thumbnailFrame: '/images/Cape of Good Hope.webp',
    description: 'Dramatic promontory where wild ocean swells crash into sheer sea-cliffs at the southwestern tip of the continent.'
  },
  {
    id: 6,
    region: 'Cape Peninsula',
    regionKey: 'peninsula',
    regionColorToken: 'var(--region-peninsula)',
    name: 'Cape Point Nature Reserve',
    startFrame: 272,
    endFrame: 308,
    thumbnailFrame: '/images/Cape Point.webp',
    description: 'Pristine coastal wilderness with old lighthouse paths high above Diaz Beach, native bontebok, and windswept fynbos trails.'
  },
  {
    id: 7,
    region: 'Southern Suburbs',
    regionKey: 'flora',
    regionColorToken: 'var(--region-flora)',
    name: 'Kirstenbosch Gardens',
    startFrame: 318,
    endFrame: 363,
    thumbnailFrame: '/images/Kirstenbosch.webp',
    description: 'World-renowned botanical gardens nestled along Table Mountains eastern slopes, celebrating indigenous Cape flora.'
  },
  {
    id: 8,
    region: 'Constantia Valley',
    regionKey: 'winelands',
    regionColorToken: 'var(--region-winelands)',
    name: 'Groot Constantia',
    startFrame: 378,
    endFrame: 422,
    thumbnailFrame: '/images/Groot Constantia.webp',
    description: 'South Africas oldest wine estate dating to 1685, showcasing Cape Dutch manor architecture and cellar tastings under heritage oaks.'
  },
  {
    id: 9,
    region: 'Cape Winelands',
    regionKey: 'winelands',
    regionColorToken: 'var(--region-winelands)',
    name: 'Franschhoek Winelands',
    startFrame: 434,
    endFrame: 449,
    thumbnailFrame: '/images/Franschhoek.webp',
    description: 'Huguenot mountain valley bordered by granite peaks, famed for family-run wine cellars, farm lunches, and quiet vineyard roads.'
  }
];

//------------------------------------------------------------------------------------//
/**
 * Resolves the active destination stop for a given frame index, or returns null if in transition.
 * @param {number} frameIndex - Current rendered frame index (0-449).
 * @returns {Object|null} Matching destination stop or null in dead-zone.
 */
export function getStopByFrame(frameIndex) {
  for (const stop of STOPS) {
    if (frameIndex >= stop.startFrame && frameIndex <= stop.endFrame) {
      return stop;
    }
  }
  return null;
}

//------------------------------End of file---------------------------------------------------//
