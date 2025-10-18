// components/resultDock.js — Persistent live results with tabs

import { a11y } from '../lib/a11y.js';

class ResultDock {
  constructor() {
    this.dock = null;
    this.activeTab = 'streams';
    this.lastKPIs = {};
    this.unitMode = 'day'; // 'day' or 'year'
    this.init();
  }

  init() {
    // Create dock element
    this.dock = document.createElement('aside');
    this.dock.id = 'resultDock';
    this.dock.className = 'dock dock--hidden';
    this.dock.setAttribute('role', 'complementary');
    this.dock.setAttribute('aria-label', 'Live results');

    this.dock.innerHTML = `
      <div class="dock__handle" aria-hidden="true"></div>
      <div class="dock__header">
        <h3 class="dock__title">Live Results</h3>
        <div class="dock__controls">
          <button type="button" class="dock__toggle-unit btn-icon" title="Toggle unit" aria-label="Toggle between day and year">
            <span class="dock__unit-label">${this.unitMode === 'day' ? '/day' : '/year'}</span>
          </button>
          <button type="button" class="dock__close btn-icon" title="Close" aria-label="Close results">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="dock__tabs" role="tablist">
        <button type="button" class="dock__tab dock__tab--active" role="tab" data-tab="streams" aria-selected="true">
          Streams
        </button>
        <button type="button" class="dock__tab" role="tab" data-tab="compost" aria-selected="false">
          Compost
        </button>
        <button type="button" class="dock__tab" role="tab" data-tab="income" aria-selected="false">
          Income
        </button>
      </div>
      <div class="dock__content">
        <div class="dock__panel" id="panel-streams" role="tabpanel" aria-labelledby="tab-streams"></div>
        <div class="dock__panel dock__panel--hidden" id="panel-compost" role="tabpanel" aria-labelledby="tab-compost"></div>
        <div class="dock__panel dock__panel--hidden" id="panel-income" role="tabpanel" aria-labelledby="tab-income"></div>
      </div>
    `;

    // Insert after main content
    const main = document.querySelector('main') || document.body;
    main.parentNode.insertBefore(this.dock, main.nextSibling);

    // Event listeners
    this.dock.querySelector('.dock__close').addEventListener('click', () => this.hide());
    this.dock.querySelector('.dock__toggle-unit').addEventListener('click', () => this.toggleUnit());
    
    this.dock.querySelectorAll('.dock__tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }

  show() {
    this.dock.classList.remove('dock--hidden');
    setTimeout(() => this.dock.classList.add('dock--visible'), 10);
    a11y.announce('Results panel opened');
  }

  hide() {
    this.dock.classList.remove('dock--visible');
    setTimeout(() => this.dock.classList.add('dock--hidden'), 280);
    a11y.announce('Results panel closed');
  }

  toggle() {
    if (this.dock.classList.contains('dock--visible')) {
      this.hide();
    } else {
      this.show();
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    this.dock.querySelectorAll('.dock__tab').forEach(tab => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('dock__tab--active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    // Update panels
    this.dock.querySelectorAll('.dock__panel').forEach(panel => {
      const isActive = panel.id === `panel-${tabName}`;
      panel.classList.toggle('dock__panel--hidden', !isActive);
    });

    a11y.announce(`${tabName} tab selected`);
  }

  toggleUnit() {
    this.unitMode = this.unitMode === 'day' ? 'year' : 'day';
    this.dock.querySelector('.dock__unit-label').textContent = 
      this.unitMode === 'day' ? '/day' : '/year';
    
    // Re-render with new unit
    if (this.lastState) {
      this.update(this.lastState);
    }
    
    a11y.announce(`Switched to ${this.unitMode === 'day' ? 'per day' : 'per year'} view`);
  }

  update(state) {
    this.lastState = state;
    const kpis = this.computeKPIs(state);
    this.renderKPIs(kpis);
  }

  computeKPIs(state) {
    // Import calc functions from main app
    if (!window.calcPH) return null;

    const preset = window.activeScenario();
    if (!preset) return null;

    const result = window.calcPH(preset, state.inputs);
    const comp = preset.waste.composition;

    return {
      // Streams
      wasteTotal: result.WG_t_day,
      biodegradable: result.BIO_t_day,
      recyclable: result.WG_t_day * comp.recy,
      residual: result.WG_t_day * comp.res,
      hazardous: result.WG_t_day * comp.haz,
      special: result.WG_t_day * comp.spec,

      // Compost & Revenue
      organicsDiverted: result.ORG_div_t_day,
      compostYear: result.Compost_t_year,
      compostRevenue: result.CompostRevenue_year,

      // Income
      incomeWeek: result.Income_week,
      incomeMonth: result.Income_month,
      households: result.H,
      householdsParticipating: result.H_part,

      // Currency
      currency: preset.display.currency_code,
      currencySymbol: preset.display.currency_symbol
    };
  }

  renderKPIs(kpis) {
    if (!kpis) return;

    this.renderStreamsPanel(kpis);
    this.renderCompostPanel(kpis);
    this.renderIncomePanel(kpis);

    this.lastKPIs = kpis;
  }

  renderStreamsPanel(kpis) {
    const panel = this.dock.querySelector('#panel-streams');
    const unit = this.unitMode === 'day' ? 't/day' : 't/year';
    const multiplier = this.unitMode === 'year' ? 365 : 1;

    panel.innerHTML = `
      ${this.createKPITile('Total Waste', kpis.wasteTotal * multiplier, unit, 'wasteTotal')}
      ${this.createKPITile('Biodegradable', kpis.biodegradable * multiplier, unit, 'biodegradable')}
      ${this.createKPITile('Recyclable', kpis.recyclable * multiplier, unit, 'recyclable')}
      ${this.createKPITile('Residual', kpis.residual * multiplier, unit, 'residual')}
    `;
  }

  renderCompostPanel(kpis) {
    const panel = this.dock.querySelector('#panel-compost');
    const unit = this.unitMode === 'day' ? 't/day' : 't/year';
    const multiplier = this.unitMode === 'year' ? 365 : 1;

    panel.innerHTML = `
      ${this.createKPITile('Organics Diverted', kpis.organicsDiverted * multiplier, unit, 'organicsDiverted')}
      ${this.createKPITile('Compost Produced', kpis.compostYear, 't/year', 'compostYear')}
      ${this.createKPITile('Compost Revenue', kpis.compostRevenue, `${kpis.currency}/year`, 'compostRevenue')}
    `;
  }

  renderIncomePanel(kpis) {
    const panel = this.dock.querySelector('#panel-income');

    panel.innerHTML = `
      ${this.createKPITile('Income per Week', kpis.incomeWeek, `${kpis.currency}/week`, 'incomeWeek')}
      ${this.createKPITile('Income per Month', kpis.incomeMonth, `${kpis.currency}/month`, 'incomeMonth')}
      ${this.createKPITile('Total Households', kpis.households, 'HH', 'households')}
      ${this.createKPITile('Participating HH', Math.round(kpis.householdsParticipating), 'HH', 'householdsParticipating')}
    `;
  }

  createKPITile(label, value, unit, key) {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
    const isChanged = this.lastKPIs[key] !== undefined && this.lastKPIs[key] !== value;
    const deltaClass = isChanged ? 'kpi--changed' : '';

    return `
      <div class="kpi ${deltaClass}" data-kpi="${key}">
        <div class="kpi__value">${formattedValue} <span class="kpi__unit">${unit}</span></div>
        <div class="kpi__label">${label}</div>
        <button type="button" class="kpi__copy btn-icon" data-copy="${label}: ${formattedValue} ${unit}" title="Copy value" aria-label="Copy ${label} value">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="4" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M6 4V2H14V10H12" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
      </div>
    `;
  }
}

// Export singleton
export const resultDock = new ResultDock();

// Add copy functionality
document.addEventListener('click', (e) => {
  const copyBtn = e.target.closest('.kpi__copy');
  if (copyBtn) {
    const text = copyBtn.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      a11y.toast('Value copied to clipboard');
    });
  }
});

