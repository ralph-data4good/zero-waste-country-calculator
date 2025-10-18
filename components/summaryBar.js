// components/summaryBar.js — Quick Summary Bar with live KPIs

import { a11y } from '../lib/a11y.js';

class SummaryBar {
  constructor() {
    this.bar = null;
    this.init();
  }

  init() {
    // Create summary bar
    this.bar = document.createElement('div');
    this.bar.id = 'summaryBar';
    this.bar.className = 'summary fade-in';
    this.bar.setAttribute('role', 'region');
    this.bar.setAttribute('aria-label', 'Quick summary');

    this.bar.innerHTML = `
      <div class="summary__content">
        <div class="summary__info">
          <span class="summary__country" id="summaryCountry">—</span>
          <span class="summary__separator">•</span>
          <span class="summary__scenario" id="summaryScenario">—</span>
          <span class="summary__separator">•</span>
          <span class="summary__locality" id="summaryLocality">—</span>
        </div>
        <div class="summary__kpis">
          <div class="summary__kpi" id="summaryWaste">
            <span class="summary__kpi-value">—</span>
            <span class="summary__kpi-label">Total Waste</span>
          </div>
          <div class="summary__kpi" id="summaryOrganics">
            <span class="summary__kpi-value">—</span>
            <span class="summary__kpi-label">Organics Diverted</span>
          </div>
          <div class="summary__kpi" id="summaryRevenue">
            <span class="summary__kpi-value">—</span>
            <span class="summary__kpi-label">Compost Revenue</span>
          </div>
        </div>
        <button type="button" class="summary__toggle btn-icon" id="summaryToggle" title="Toggle results dock" aria-label="Toggle results panel">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 7L10 14L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;

    // Insert after header
    const header = document.querySelector('.app-header');
    if (header) {
      header.parentNode.insertBefore(this.bar, header.nextSibling);
    } else {
      document.body.insertBefore(this.bar, document.body.firstChild);
    }

    // Event listener for toggle
    this.bar.querySelector('#summaryToggle').addEventListener('click', () => {
      if (window.resultDock) {
        window.resultDock.toggle();
      }
    });
  }

  update(state) {
    if (!state) return;

    const preset = window.activeScenario ? window.activeScenario() : null;
    if (!preset) return;

    // Update info
    this.bar.querySelector('#summaryCountry').textContent = preset.country;
    this.bar.querySelector('#summaryScenario').textContent = preset.label.split('—')[0].trim();
    this.bar.querySelector('#summaryLocality').textContent = state.locality || 'No locality';

    // Compute KPIs
    if (window.calcPH) {
      const result = window.calcPH(preset, state.inputs);
      
      // Update KPIs
      this.updateKPI('summaryWaste', result.WG_t_day, 't/day');
      this.updateKPI('summaryOrganics', result.ORG_div_t_day, 't/day');
      this.updateKPI('summaryRevenue', result.CompostRevenue_year, preset.display.currency_code);
    }
  }

  updateKPI(id, value, unit) {
    const kpi = this.bar.querySelector(`#${id}`);
    if (!kpi) return;

    const valueEl = kpi.querySelector('.summary__kpi-value');
    const oldValue = valueEl.textContent;
    const newValue = typeof value === 'number' ? value.toFixed(1) : value;

    valueEl.textContent = `${newValue} ${unit}`;

    // Flash on change
    if (oldValue !== '—' && oldValue !== valueEl.textContent) {
      kpi.classList.add('summary__kpi--changed');
      setTimeout(() => kpi.classList.remove('summary__kpi--changed'), 180);
    }
  }
}

export const summaryBar = new SummaryBar();

