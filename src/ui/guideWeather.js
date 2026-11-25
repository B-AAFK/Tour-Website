// =============================================================================
// Cape Private Tours — Interactive "How I Read the Day" Weather Pivot Widget
// =============================================================================

import { getIconMarkup } from './icons.js';

const WEATHER_SCENARIOS = [
  {
    id: 'southeaster',
    label: 'Southeaster Wind',
    icon: 'wind',
    accentToken: 'var(--region-atlantic)',
    summary:
      'Placeholder description — Lance Bowes will provide details on how he adjusts Cape Peninsula and Atlantic routes when the Southeaster wind picks up.'
  },
  {
    id: 'tablecloth',
    label: 'Tablecloth Cloud',
    icon: 'cloud-sun',
    accentToken: 'var(--region-peninsula)',
    summary:
      'Placeholder description — Lance Bowes will provide details on how he sequences Table Mountain and coastal stops when cloud sits over the summit.'
  },
  {
    id: 'calm',
    label: 'Sunny & Calm',
    icon: 'sun',
    accentToken: 'var(--accent-sun)',
    summary:
      'Placeholder description — Lance Bowes will provide details on his ideal route order for clear, calm mornings across Cape Town and the Winelands.'
  }
];

//------------------------------------------------------------------------------------//
/**
 * Activates the selected weather scenario tab and updates the panel text.
 * @param {HTMLElement} widgetEl - Root weather widget element.
 * @param {string} scenarioId - Target scenario identifier.
 * @returns {void}
 */
function selectWeatherScenario(widgetEl, scenarioId) {
  const scenario = WEATHER_SCENARIOS.find((item) => item.id === scenarioId) || WEATHER_SCENARIOS[0];
  const tabButtons = widgetEl.querySelectorAll('[role="tab"]');
  const panelEl = widgetEl.querySelector('[role="tabpanel"]');

  tabButtons.forEach((btn) => {
    const isSelected = btn.dataset.scenario === scenario.id;
    btn.classList.toggle('is-active', isSelected);
    btn.setAttribute('aria-selected', String(isSelected));
    btn.setAttribute('tabindex', isSelected ? '0' : '-1');
  });

  if (panelEl) {
    panelEl.textContent = scenario.summary;
    panelEl.setAttribute('aria-labelledby', `weather-tab-${scenario.id}`);
    panelEl.style.setProperty('--weather-accent', scenario.accentToken);
  }
}

//------------------------------------------------------------------------------------//
/**
 * Initializes the interactive 3-tab "How I Read the Day" weather widget in #guide.
 * @returns {void}
 */
export function initGuideWeather() {
  const widgetEl = document.getElementById('guide-weather-widget');
  if (!widgetEl) return;

  const tabsHtml = WEATHER_SCENARIOS.map((item, idx) => {
    const isActive = idx === 0;
    return `
      <button
        type="button"
        id="weather-tab-${item.id}"
        class="weather-tab-btn${isActive ? ' is-active' : ''}"
        role="tab"
        aria-selected="${isActive}"
        aria-controls="guide-weather-panel"
        tabindex="${isActive ? '0' : '-1'}"
        data-scenario="${item.id}"
        style="--weather-accent: ${item.accentToken}"
      >
        ${getIconMarkup(item.icon, 'icon-sm')}
        <span>${item.label}</span>
      </button>
    `;
  }).join('');

  widgetEl.innerHTML = `
    <div class="weather-widget-header">
      <h3 class="weather-widget-title">How I Read the Day</h3>
    </div>
    <div class="weather-tabs-list" role="tablist" aria-label="Cape Town Weather Scenarios">
      ${tabsHtml}
    </div>
    <div
      id="guide-weather-panel"
      class="weather-tab-panel"
      role="tabpanel"
      aria-labelledby="weather-tab-${WEATHER_SCENARIOS[0].id}"
      style="--weather-accent: ${WEATHER_SCENARIOS[0].accentToken}"
    >${WEATHER_SCENARIOS[0].summary}</div>
  `;

  const tabButtons = Array.from(widgetEl.querySelectorAll('[role="tab"]'));
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      selectWeatherScenario(widgetEl, btn.dataset.scenario);
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabButtons.length;
      if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
      if (e.key === 'Home') nextIdx = 0;
      if (e.key === 'End') nextIdx = tabButtons.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        const targetBtn = tabButtons[nextIdx];
        selectWeatherScenario(widgetEl, targetBtn.dataset.scenario);
        targetBtn.focus();
      }
    });
  });
}

//------------------------------End of file---------------------------------------------------//
