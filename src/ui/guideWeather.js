// =============================================================================
// Cape Private Tours — Interactive "How I Read the Day" Weather Pivot Widget
// =============================================================================

import { createIconElement } from './icons.js';

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
 * Uses pure DOM construction without innerHTML.
 * @returns {void}
 */
export function initGuideWeather() {
  const widgetEl = document.getElementById('guide-weather-widget');
  if (!widgetEl) return;

  const header = document.createElement('div');
  header.className = 'weather-widget-header';
  const title = document.createElement('h3');
  title.className = 'weather-widget-title';
  title.textContent = 'How I Read the Day';
  header.appendChild(title);

  const tabList = document.createElement('div');
  tabList.className = 'weather-tabs-list';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Cape Town Weather Scenarios');

  const tabButtons = WEATHER_SCENARIOS.map((item, idx) => {
    const isActive = idx === 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = `weather-tab-${item.id}`;
    btn.className = isActive ? 'weather-tab-btn is-active' : 'weather-tab-btn';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.setAttribute('aria-controls', 'guide-weather-panel');
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
    btn.dataset.scenario = item.id;
    btn.style.setProperty('--weather-accent', item.accentToken);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = item.label;
    btn.append(createIconElement(item.icon, 'icon-sm'), labelSpan);
    tabList.appendChild(btn);
    return btn;
  });

  const panel = document.createElement('div');
  panel.id = 'guide-weather-panel';
  panel.className = 'weather-tab-panel';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `weather-tab-${WEATHER_SCENARIOS[0].id}`);
  panel.style.setProperty('--weather-accent', WEATHER_SCENARIOS[0].accentToken);
  panel.textContent = WEATHER_SCENARIOS[0].summary;

  widgetEl.replaceChildren(header, tabList, panel);

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
