// app.js — Zero-build single-page app (ES modules)
// All editor-friendly values are in config.js

import { BRAND, COPY, SCENARIO_PRESETS, RESOURCES_LINKS, SCENARIO_LABELS, ACTIVITY_OPTIONS, AREA_TYPES, POPULATION_BANDS, PARTICIPATION_LEVELS, COLLECTION_FREQ, SPACE_BANDS, RESOURCES } from './config.js';
import { ACTIVITY_WEIGHTS, GEO_WEIGHTS, STEP0_NUDGES } from './step0-weights.js';

// Apply brand tokens to CSS variables on load (progressive enhancement)
const brandToCSS = () => {
  const r = document.documentElement;
  r.style.setProperty('--zw-primary', BRAND.primary);
  r.style.setProperty('--zw-primary-contrast', BRAND.primaryContrast);
  r.style.setProperty('--zw-accent', BRAND.accent);
  r.style.setProperty('--zw-neutral-900', BRAND.neutral900);
  r.style.setProperty('--zw-neutral-700', BRAND.neutral700);
  r.style.setProperty('--zw-neutral-200', BRAND.neutral200);
  r.style.setProperty('--zw-success', BRAND.success);
  r.style.setProperty('--zw-danger', BRAND.danger);
};

brandToCSS();

// ---------------- State & Storage ----------------
const initialState = {
  step: 0,
  country: 'PH',
  locality: '',
  scenarioKey: '',
  showDefaults: false, // Show Defaults toggle state
  // Step 0 state (Q1-Q7 + Unsure)
  step0: {
    country: 'PH',
    area: 'Unsure', // Q1
    activities: [], // Q2: [{name, pct}] max 2
    relief: 'Unsure', // Q3
    island: 'unsure', // Q4: true | false | 'unsure'
    population: 'unsure', // Q5
    participation: 'unsure', // Q6
    collection: 'unsure', // Q7
    space: 'unsure', // Optional (for future)
  },
  // editable inputs
  inputs: {
    population: 50000,
    households: 12000,
    hh_size: 4,
    participation: 0.4,
    org_div: 0.5,
    yield: 0.20,
    compost_price: 3000,
  },
  // view controls
  period: 'D',
  includeRecyclingIncome: false,
  comparePHTracks: false,
};

const lsKey = 'zwa_calc_state_v1';

// Simple pub/sub store
const listeners = new Set();
let state = loadStateFromURL() || JSON.parse(localStorage.getItem(lsKey) || 'null') || initialState;

function setState(patch) {
  state = { ...state, ...patch };
  localStorage.setItem(lsKey, JSON.stringify(state));
  updateURLFromState();
  
  // Show/hide steps based on current step
  if ('step' in patch) {
    // Ensure stepEls is populated, or populate it now
    if (stepEls.length === 0) {
      stepEls = [ '#step0','#step1','#step2','#step3','#step4','#step5' ].map(sel => document.querySelector(sel));
    }
    stepEls.forEach((el, idx) => {
      if (el) el.hidden = (idx !== state.step);
    });
  }
  
  for (const fn of listeners) fn(state);
}
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// -------------- URL serialization ---------------
function updateURLFromState() {
  const s = {
    c: state.country,
    l: state.locality,
    sk: state.scenarioKey,
    i: state.inputs,
    p: state.period,
    r: state.includeRecyclingIncome ? 1 : 0,
    ct: state.comparePHTracks ? 1 : 0,
    s0: state.step0, // Step 0 data
  };
  const newHash = '#' + encodeURIComponent(JSON.stringify(s));
  if (location.hash !== newHash) history.replaceState(null, '', newHash);
}
function loadStateFromURL() {
  try {
    if (!location.hash) return null;
    const s = JSON.parse(decodeURIComponent(location.hash.slice(1)));
    return {
      ...initialState,
      country: s.c || 'PH',
      locality: s.l || '',
      scenarioKey: s.sk || '',
      inputs: { ...initialState.inputs, ...(s.i || {}) },
      period: s.p || 'D',
      includeRecyclingIncome: !!s.r,
      comparePHTracks: !!s.ct,
      step0: { ...initialState.step0, ...(s.s0 || {}) },
    };
  } catch (e) { return null; }
}

// ----------------- Utilities --------------------
const byKey = new Map(SCENARIO_PRESETS.map(s => [s.key, s]));
function scenariosForCountry(c) { return SCENARIO_PRESETS.filter(s => s.country === c); }
function activeScenario() { return byKey.get(state.scenarioKey) || scenariosForCountry(state.country)[0]; }
function currencyFmt(code, symbol) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 0, currencyDisplay: 'symbol' }); }

// Validation helpers
const validators = {
  pcw: (v) => v >= 0.1 && v <= 2.5,
  hh_size: (v) => v >= 1 && v <= 10,
  org_div: (v) => v >= 0 && v <= 1,
  yield: (v) => [0.10,0.15,0.20,0.25].includes(Number(v)),
  compost_price: (v) => v >= 0,
  participation: (v) => v >= 0 && v <= 1,
};

// --------------- Calculator functions ----------------
/** PH (LGU)
 WG_t_day = (pcw × P) / 1000
 BIO_t_day = WG_t_day × comp.bio
 ORG_div_t_day = BIO_t_day × OrgDiv
 Compost_t_year = ORG_div_t_day × 365 × Yield
 CompostRevenue_year = Compost_t_year × compost_price
 H = user_HH || round(P/HHsize)
 H_part = H × participation
 Income_week = H_part × factor_rate_value; month = ×4
 */
function calcPH(preset, inputs) {
  const P = Number(inputs.population) || 0;
  const H_user = Number(inputs.households) || 0;
  const pcw = preset.waste.pcw;
  const comp = preset.waste.composition;
  const WG_t_day = (pcw * P) / 1000;
  const BIO_t_day = WG_t_day * comp.bio;
  const ORG_div_t_day = BIO_t_day * inputs.org_div;
  const Compost_t_year = ORG_div_t_day * 365 * inputs.yield;
  const CompostRevenue_year = Compost_t_year * inputs.compost_price;
  const Hguess = Math.round(P / preset.waste.avg_household_size);
  const H = H_user || Hguess;
  const H_part = H * (preset.defaults.income_model_default === 'org+recy' ? (inputs.participation ?? (preset.recycling.participation_default || 0)) : (inputs.participation ?? 0));
  const Income_week = H_part * (preset.recycling?.factor_rate_value || 0);
  const Income_month = Income_week * 4;
  return { WG_t_day, BIO_t_day, ORG_div_t_day, Compost_t_year, CompostRevenue_year, H, H_part, Income_week, Income_month };
}

/** ID (HH/Ind)
 WG_kg_period = pcw × (HHsize or 1) × periodFactor
 BIO_period = WG_kg_period × comp.bio
 ORG_div_period = BIO_period × OrgDiv
 Compost_period = ORG_div_period × Yield; annualized = × 365/periodFactor
 Income_week = factor_rate_value; month = ×4
 */
const periodFactor = { D: 1, W: 7, M: 30, Y: 365 };
function calcID(preset, inputs, period) {
  const pf = periodFactor[period] || 1;
  const HHsize = preset.unit === 'household' ? (Number(inputs.hh_size) || preset.waste.avg_household_size) : 1;
  const WG_kg_period = preset.waste.pcw * HHsize * pf;
  const BIO_period = WG_kg_period * preset.waste.composition.bio;
  const ORG_div_period = BIO_period * inputs.org_div;
  const Compost_period = ORG_div_period * inputs.yield;
  const Compost_annualized = Compost_period * (365 / pf);
  const Income_week = preset.recycling?.factor_rate_value || 0;
  const Income_month = Income_week * 4;
  return { WG_kg_period, BIO_period, ORG_div_period, Compost_period, Compost_annualized, Income_week, Income_month };
}

// --------------- DOM Rendering -----------------
const el = (sel) => document.querySelector(sel);
// Get step elements (will be populated when DOM is ready)
let stepEls = [];

// Titles
const appTitle = el('#appTitle');
if (appTitle) appTitle.textContent = COPY.appTitle;
const step0Title = el('#step0Title');
if (step0Title) step0Title.textContent = COPY.step0Title;
const step1Title = el('#step1Title');
if (step1Title) step1Title.textContent = COPY.step1Title;
const step2Title = el('#step2Title');
if (step2Title) step2Title.textContent = COPY.step2Title;
const step3Title = el('#step3Title');
if (step3Title) step3Title.textContent = COPY.out1Title;
const step4Title = el('#step4Title');
if (step4Title) step4Title.textContent = COPY.out2Title;
const step5Title = el('#step5Title');
if (step5Title) step5Title.textContent = COPY.out3Title;
const resourcesHeader = el('#resourcesHeader');
if (resourcesHeader) resourcesHeader.textContent = COPY.footerHeader;

// Share / Print
const shareBtn = el('#shareBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    updateURLFromState();
    const url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        announce('Share link copied to clipboard');
      } catch (e) { console.warn(e); alert(`Copy this link:\n${url}`); }
    } else {
      prompt('Copy this link:', url);
    }
  });
}

const printBtn = el('#printBtn');
if (printBtn) {
  printBtn.addEventListener('click', () => window.print());
}

// Copy to Clipboard (for output values)
document.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('.copy-btn');
  if (copyBtn && !copyBtn.classList.contains('copied')) {
    const targetId = copyBtn.dataset.copy;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      const label = targetEl.closest('.output-row')?.querySelector('.output-label')?.textContent || 
                    targetEl.closest('tr')?.querySelector('td:first-child')?.textContent || '';
      const value = targetEl.textContent;
      const text = label ? `${label} ${value}` : value;
      
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        announce(`Copied: ${text}`);
        
        setTimeout(() => {
          copyBtn.classList.remove('copied');
        }, 1200);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    }
  }
});

// ============ Step 0: Import complete logic from step0-logic.js ============
import { initStep0, renderActivityChips, renderActivityDropdown } from './step0-logic.js';

// Initialize Step 0 (imports complete logic from step0-logic.js)
initStep0(setState, () => state, SCENARIO_PRESETS);

// Step 1 controls
const countrySelect = el('#country');
if (countrySelect) {
  countrySelect.addEventListener('change', (e) => {
    const country = e.target.value;
    const first = scenariosForCountry(country)[0]?.key || '';
    setState({ country, scenarioKey: first });
  });
}

const localityInput = el('#locality');
if (localityInput) {
  localityInput.addEventListener('input', (e) => setState({ locality: e.target.value }));
}

// Scenario grid renderer with microanimations
function renderScenarioGrid() {
  const list = el('#scenarioGrid');
  if (!list) return;
  list.innerHTML = '';
  const suggestedKey = window._step0SuggestedKey; // Set by step0-logic.js on suggestion
  
  for (const sc of scenariosForCountry(state.country)) {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.scenarioKey = sc.key;
    
    // Use SCENARIO_LABELS for user-friendly names
    const displayLabel = SCENARIO_LABELS[sc.key] || sc.label;
    
    // Highlight if active OR if suggested by Step 0
    const isActive = sc.key === activeScenario().key;
    const isSuggested = sc.key === suggestedKey;
    
    card.className = 'scenario-card chip-select fade-in' +
                     (isActive ? ' active' : '') +
                     (isSuggested && !isActive ? ' suggested' : '');
    card.setAttribute('role', 'listitem');
    
    // Simplified UI: only show friendly label
    card.innerHTML = `<strong>${displayLabel}</strong>
      <span class="chip">${sc.unit}</span>`;
    
    // Add "Suggested" badge if from Step 0
    if (isSuggested && !isActive) {
      card.innerHTML += `<span class="chip chip-success">✨ Suggested</span>`;
    }
    
    card.addEventListener('click', () => { 
      // Add microanimation on click
      card.classList.add('pulse-once');
      setTimeout(() => card.classList.remove('pulse-once'), 250);
      setState({ scenarioKey: sc.key }); 
      announce(`Scenario ${displayLabel} selected`); 
    });
    list.appendChild(card);
  }
  
  const activeLabel = SCENARIO_LABELS[activeScenario().key] || activeScenario()?.label || 'None';
  el('#selectedScenario').textContent = activeLabel;
  el('#country').value = state.country;
  el('#locality').value = state.locality || '';
}

// Step 2 — Presets + edits
function renderPresetsAndEdits() {
  const sc = activeScenario();
  if (!sc) return;
  const preset = sc;
  const panel = el('#presetPanel');
  if (!panel) return;
  panel.innerHTML = `
    <table class="kpi-table">
      <tr><th>PCW (per capita waste)</th><td>${preset.waste.pcw} kg/person/day</td><td class="text-muted">Source: ${preset.display.source}</td></tr>
      <tr><th>Composition</th><td>Biodegradable ${(preset.waste.composition.bio*100).toFixed(0)}%, Recyclable ${(preset.waste.composition.recy*100).toFixed(0)}%</td><td class="text-muted">Source: ${preset.display.source}</td></tr>
      <tr><th>Avg household size</th><td>${preset.waste.avg_household_size} persons</td><td class="text-muted">Source: ${preset.display.source}</td></tr>
      <tr><th>LIB/HIB rate</th><td>${preset.recycling?.factor_rate_type || '—'} ${preset.recycling?.factor_rate_value ? `(${preset.display.currency_symbol}${preset.recycling.factor_rate_value}/week)` : ''}</td><td class="text-muted">Weekly rate per HH</td></tr>
    </table>`;

  const f = el('#editForm');
  if (!f) return;
  f.innerHTML = '';
  
  // Add Show Defaults toggle at the top
  const toggleDiv = document.createElement('div');
  toggleDiv.className = 'defaults-toggle';
  toggleDiv.innerHTML = `
    <input type="checkbox" id="showDefaults" ${state.showDefaults ? 'checked' : ''}>
    <label for="showDefaults">Show default values</label>
  `;
  f.appendChild(toggleDiv);
  
  // Handle toggle
  el('#showDefaults').addEventListener('change', (e) => {
    setState({ showDefaults: e.target.checked });
    const defaultValues = document.querySelectorAll('.default-value');
    defaultValues.forEach(dv => {
      dv.classList.toggle('visible', e.target.checked);
    });
  });
  
  const addInput = (key, label, type='number', attrs={}) => {
    const wrap = document.createElement('div');
    wrap.className = 'control';
    const id = 'in_' + key;
    const hint = attrs.hint || '';
    const defaultValue = preset.defaults[key + '_default'] || preset.defaults[key];
    
    // Add editable badge to label
    wrap.innerHTML = `<label for="${id}">${label} <span class="editable-badge">Editable</span> ${hint?`<button type="button" class="pill" data-popover="${hint}">ⓘ</button>`:''}</label>`;
    
    const input = document.createElement('input');
    input.id = id; 
    input.type = type; 
    input.value = state.inputs[key] ?? preset.defaults[key + '_default'] ?? preset.defaults[key] ?? '';
    if (attrs.step) input.step = attrs.step;
    if (attrs.min != null) input.min = attrs.min;
    if (attrs.max != null) input.max = attrs.max;
    
    input.addEventListener('blur', () => {
      const v = type === 'number' ? Number(input.value) : input.value;
      const valid = validators[key] ? validators[key](v) : true;
      
      // Inline validation with visual feedback
      if (valid) {
        input.classList.remove('is-error');
        input.classList.add('pulse-once');
        setTimeout(() => input.classList.remove('pulse-once'), 250);
      } else {
        input.classList.add('is-error');
      }
      
      const errorEl = wrap.querySelector('.error');
      if (valid) {
        errorEl.textContent = '';
      } else {
        errorEl.textContent = `Invalid ${label.toLowerCase()}. Please check the value.`;
        errorEl.className = 'error-text';
      }
      
      if (valid) setState({ inputs: { ...state.inputs, [key]: v } });
      updateNextDisabled();
    });
    
    wrap.appendChild(input);
    
    // Add default value display with reset button
    if (defaultValue != null) {
      const defaultDiv = document.createElement('div');
      defaultDiv.className = 'default-value' + (state.showDefaults ? ' visible' : '');
      defaultDiv.innerHTML = `
        <span>Default: ${defaultValue}</span>
        <button type="button" class="default-value__reset" data-reset="${key}" aria-label="Reset ${label} to default">
          ↺ Reset
        </button>
      `;
      wrap.appendChild(defaultDiv);
    }
    
    const err = document.createElement('div'); 
    err.className = 'error'; 
    err.id = id+'_err'; 
    wrap.appendChild(err);
    f.appendChild(wrap);
  };

  // Editable by scenario rules
  const e = sc.editable;
  if (e.population) addInput('population','Population','number',{ hint:'Total people in locality' });
  if (e.households) addInput('households','Households','number',{ hint:'Number of households' });
  if (e.hh_size) addInput('hh_size','Household size','number',{ step:'0.1', min:1, max:10, hint:'Average persons per household' });
  if (e.participation) addInput('participation','Participation rate','number',{ step:'0.01', min:0, max:1, hint:'0–1 (fraction participating)' });
  if (e.org_div) addInput('org_div','Organics diversion','number',{ step:'0.01', min:0, max:1, hint:'0–1 (fraction diverted)' });
  if (e.yield) addInput('yield','Compost yield','number',{ step:'0.05', min:0.1, max:0.25, hint:'0.10–0.25 (fraction of input)' });
  if (e.compost_price) addInput('compost_price','Compost price','number',{ step:'0.01', min:0, hint: sc.country==='PH' ? `${sc.display.currency_code}/ton` : `${sc.display.currency_code}/kg` });

  // Reset to default handlers
  document.querySelectorAll('.default-value__reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.reset;
      const defaultValue = preset.defaults[key + '_default'] || preset.defaults[key];
      if (defaultValue != null) {
        setState({ inputs: { ...state.inputs, [key]: defaultValue } });
        const input = el('#in_' + key);
        if (input) {
          input.value = defaultValue;
          input.classList.add('pulse-once');
          setTimeout(() => input.classList.remove('pulse-once'), 250);
        }
        announce(`${key} reset to default: ${defaultValue}`);
        updateNextDisabled();
      }
    });
  });

  el('#resetDefaults').onclick = (ev) => { 
    ev.preventDefault(); 
    setState({ inputs: {
      population: 50000, 
      households: 12000,
      hh_size: preset.waste.avg_household_size,
      participation: preset.recycling?.participation_default ?? 0,
      org_div: preset.defaults.org_div_default,
      yield: preset.defaults.yield_default,
      compost_price: preset.defaults.compost_price_default,
    }});
    renderPresetsAndEdits(); // Re-render to update input values
    announce('All fields reset to defaults');
  };
  updateNextDisabled();
}

function updateNextDisabled() {
  const next = el('#toStep3');
  const sc = activeScenario();
  const i = state.inputs;
  const ok = validators.org_div(i.org_div) && validators.yield(i.yield) && validators.compost_price(i.compost_price) && (!sc.editable.hh_size || validators.hh_size(i.hh_size)) && (!sc.editable.participation || validators.participation(i.participation));
  next.disabled = !ok;
}

el('#toStep3').addEventListener('click', (e) => { e.preventDefault(); setState({ step: 3 }); renderOutputs(); });

// Accessibility: announce helper
function announce(msg){ const live=el('#live'); if(!live) return; live.textContent=''; setTimeout(()=>{ live.textContent=msg; }, 10); }

// Step 3–5 outputs
let ChartLib; // lazy
const charts = {};
async function ensureCharts() {
  if (!ChartLib) {
    try {
      // Import Chart.js with auto-registration (chart.js/auto includes all components)
      const mod = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/auto/+esm');
      ChartLib = mod.Chart || mod.default;
      
      // Configure Schibsted Grotesk font globally for all charts
      if (ChartLib && ChartLib.defaults && ChartLib.defaults.font) {
        Object.assign(ChartLib.defaults.font, {
          family: '"Schibsted Grotesk", ui-sans-serif, system-ui',
          size: 12
        });
      }
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
    }
  }
}

function renderOutput1() {
  const sc = activeScenario(); 
  if (!sc) return;
  const preset = sc;
  
  const canvas = el('#chartWaste');
  if (!canvas) {
    console.warn('Canvas #chartWaste not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const comp = preset.waste.composition;
  const labels = ['Biodegradable','Recyclable','Residual','Hazardous','Special'];
  const dataComp = [comp.bio, comp.recy, comp.res, comp.haz, comp.spec];
  
  // All scenarios are now LGU (PH style calculation)
  const res = calcPH(preset, state.inputs);
  const unit = 't/day';
  const values = [res.BIO_t_day, res.WG_t_day*comp.recy, res.WG_t_day*comp.res, res.WG_t_day*comp.haz, res.WG_t_day*comp.spec];
  const total = values.reduce((a,b) => a+b, 0);
  
  // Hide period tabs since all are LGU
  el('#periodTabs').hidden = true;
  
  // Enhanced table with percentages and copy buttons
  const t = document.createElement('table'); 
  t.className='kpi-table';
  t.innerHTML = `<tr><th>Stream</th><th>Amount (${unit})</th><th>%</th><th></th></tr>` + 
    labels.map((l,i)=>{
      const pct = ((values[i] / total) * 100).toFixed(1);
      return `<tr>
        <td>${l}</td>
        <td id="waste_${i}">${values[i].toFixed(2)}</td>
        <td>${pct}%</td>
        <td>
          <button type="button" class="copy-btn" data-copy="waste_${i}" aria-label="Copy ${l} value">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </td>
      </tr>`;
    }).join('');
  el('#tableWaste').innerHTML=''; el('#tableWaste').appendChild(t);
  
  // Enhanced pie chart with % in legend and better tooltips
  if (charts.waste) charts.waste.destroy();
  charts.waste = new ChartLib(ctx, { 
    type:'pie', 
    data:{ 
      labels: labels,
      datasets:[{ 
        data: values, 
        backgroundColor:['#6EE7B7','#93C5FD','#FCD34D','#FCA5A5','#D1D5DB'] 
      }] 
    }, 
    options:{ 
      responsive: true,
      maintainAspectRatio: false,
      plugins:{ 
        legend:{ 
          position:'bottom',
          labels: {
            font: { size: 12 },
            generateLabels: (chart) => {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const pct = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${pct}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toFixed(2)} ${unit} (${pct}%)`;
            }
          }
        }
      },
      animation: {
        duration: 200 // Fast update for live changes
      }
    } 
  });
}

function renderOutput2() {
  const sc = activeScenario(); 
  if (!sc) return;
  const preset = sc;
  
  const canvas = el('#chartDiversion');
  if (!canvas) {
    console.warn('Canvas #chartDiversion not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  
  // All scenarios are now LGU
  const r = calcPH(preset, state.inputs);
  const labels = ['Organics diverted','Compost produced','Compost revenue'];
  const unit = ['t/day','t/year',preset.display.currency_code+'/year'];
  const currency = currencyFmt(preset.display.currency_code, preset.display.currency_symbol);
  const vals = [r.ORG_div_t_day, r.Compost_t_year, r.CompostRevenue_year];
  
  // Enhanced table with copy buttons
  const t = document.createElement('table'); 
  t.className='kpi-table';
  t.innerHTML = `<tr><th>Metric</th><th>Value</th><th>Unit</th><th></th></tr>` + 
    labels.map((l,i)=>{
      const formattedVal = (unit[i]&&unit[i].includes('PHP')||unit[i]&&unit[i].includes('IDR')) ? 
        new Intl.NumberFormat().format(Math.round(vals[i])) : 
        vals[i].toFixed(2);
      return `<tr>
        <td>${l}</td>
        <td id="div_${i}">${formattedVal}</td>
        <td>${unit[i]||''}</td>
        <td>
          <button type="button" class="copy-btn" data-copy="div_${i}" aria-label="Copy ${l} value">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </td>
      </tr>`;
    }).join('');
  el('#tableDiversion').innerHTML=''; el('#tableDiversion').appendChild(t);
  
  // Enhanced bar chart with formatted numbers
  if (charts.diversion) charts.diversion.destroy();
  charts.diversion = new ChartLib(ctx, { 
    type:'bar', 
    data:{ 
      labels: labels,
      datasets:[{ 
        label:'Values', 
        data: vals, 
        backgroundColor:['#6EE7B7','#93C5FD','#FCD34D'] 
      }] 
    }, 
    options:{ 
      responsive: true,
      maintainAspectRatio: false,
      plugins:{ 
        legend:{ display:false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              const unitStr = unit[context.dataIndex] || '';
              const formatted = unitStr.includes('PHP') || unitStr.includes('IDR') ? 
                new Intl.NumberFormat().format(Math.round(value)) : 
                value.toFixed(2);
              return `${context.label}: ${formatted} ${unitStr}`;
            }
          }
        }
      }, 
      scales:{ 
        y:{ 
          beginAtZero:true,
          ticks: {
            font: { size: 12 },
            callback: function(value) {
              return new Intl.NumberFormat().format(value);
            }
          }
        },
        x: {
          ticks: {
            font: { size: 12 }
          }
        }
      },
      animation: {
        duration: 180 // Fast update for slider changes
      }
    } 
  });
}

function renderOutput3() {
  const sc = activeScenario(); 
  if (!sc) return;
  const preset = sc;
  
  const canvas = el('#chartIncome');
  if (!canvas) {
    console.warn('Canvas #chartIncome not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  
  // All scenarios are now LGU
    const r = calcPH(preset, state.inputs);
  const incomeOrg = r.Income_week;
    const incomeMonth = r.Income_month;
  const labels = [preset.display.currency_code+'/week', preset.display.currency_code+'/month'];
  const vals = [incomeOrg, incomeMonth];
  let notes = '';
  if (preset.defaults.income_model_default==='org+recy') {
    notes = COPY.phIncomeExplain.replace('{participation%}', `${(state.inputs.participation*100||0).toFixed(0)}%`).replace('{LIB/HIB}', preset.recycling?.factor_rate_type||'');
  }
  
  const t = document.createElement('table'); t.className='kpi-table';
  t.innerHTML = `<tr><th>Metric</th><th>Value</th></tr>` + labels.map((l,i)=>`<tr><td>${l}</td><td>${vals[i].toFixed(0)}</td></tr>`).join('') + (notes?`<tr><td colspan="2" class="text-muted">${notes}</td></tr>`:'');
  el('#tableIncome').innerHTML=''; el('#tableIncome').appendChild(t);
  if (charts.income) charts.income.destroy();
  charts.income = new ChartLib(ctx, { 
    type:'bar', 
    data:{ 
      labels: labels.map(l => l.length > 12 ? l.substring(0, 12) + '...' : l), // Truncate long labels
      datasets:[{ 
        label:'Income', 
        data: vals, 
        backgroundColor:'#FCD34D' 
      }] 
    }, 
    options:{ 
      responsive: true,
      maintainAspectRatio: false,
      plugins:{ 
        legend:{ display:false } 
      }, 
      scales:{ 
        y:{ 
          beginAtZero:true,
          ticks: {
            font: {
              size: 12 // Minimum readable font size
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 12 // Minimum readable font size
            }
          }
        }
      },
      animation: {
        duration: 800 // Within animation budget
      }
    } 
  });
}

async function renderOutputs() {
  await ensureCharts();
  // Make sure ChartLib is loaded before rendering
  if (!ChartLib) {
    console.warn('ChartLib not loaded yet');
    return;
  }
  renderOutput1();
  renderOutput2();
  renderOutput3();
}

// Period tabs (ID only)
document.getElementById('periodTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button.tab'); if (!btn) return;
  for (const b of e.currentTarget.querySelectorAll('.tab')) b.classList.remove('active');
  btn.classList.add('active');
  setState({ period: btn.dataset.period });
  renderOutputs();
  announce('Showing '+btn.textContent+' period');
});

// Income controls
function renderIncomeControls() {
  const wrap = el('#incomeControls');
  wrap.innerHTML = '';
  const sc = activeScenario();
  
  // All scenarios are LGU now
  const info = document.createElement('div'); 
  info.className='text-muted';
    info.textContent = `Default track = ${sc.defaults.income_model_default}.`;
    wrap.appendChild(info);
}

// Diversion controls
function renderDiversionControls() {
  const sc = activeScenario();
  const wrap = el('#diversionControls');
  if (!wrap) return;
  wrap.innerHTML='';
  const add = (label, elNode) => { const g=document.createElement('div'); g.className='control'; const L=document.createElement('label'); L.textContent=label; g.appendChild(L); g.appendChild(elNode); wrap.appendChild(g); };
  const slider = document.createElement('input'); slider.type='range'; slider.min='0'; slider.max='1'; slider.step='0.01'; slider.value=state.inputs.org_div; slider.addEventListener('input',()=>{ setState({ inputs:{...state.inputs, org_div:Number(slider.value)} }); renderOutputs(); }); add('Organics diversion', slider);
  const select = document.createElement('select'); [0.10,0.15,0.20,0.25].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; if (v===state.inputs.yield) o.selected=true; select.appendChild(o); }); select.addEventListener('change',()=>{ setState({ inputs:{...state.inputs, yield:Number(select.value)} }); renderOutputs(); }); add('Yield', select);
  const price = document.createElement('input'); price.type='number'; price.min='0'; price.step='0.01'; price.value=state.inputs.compost_price; price.addEventListener('input',()=>{ setState({ inputs:{...state.inputs, compost_price:Number(price.value)} }); renderOutputs(); }); add('Compost price', price);
}

// Resources footer
function renderResources() {
  const container = el('#resources');
  if (!container) return;
  
  container.innerHTML = '';
  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'resource-cards';
  
  // Use new RESOURCES array with banner images
  RESOURCES.forEach(resource => {
    const card = document.createElement('a');
    card.className = 'resource-card';
    card.href = resource.url;
    card.target = '_blank';
    card.rel = 'noopener';
    card.setAttribute('aria-label', resource.title);
    
    card.innerHTML = `
      <div class="resource-card__banner">
        <img src="${resource.img}" alt="${resource.title}" loading="lazy">
      </div>
      <div class="resource-card__content">
        <h4 class="resource-card__title">${resource.title}</h4>
        <p class="resource-card__blurb">${resource.blurb}</p>
        <div class="resource-card__tags">
          <span class="resource-card__tag">${resource.country}</span>
          <span class="resource-card__tag">${resource.audience}</span>
        </div>
      </div>
    `;
    
    cardsGrid.appendChild(card);
  });
  
  container.appendChild(cardsGrid);
}

// Initial render & subscriptions
subscribe(() => { renderScenarioGrid(); renderPresetsAndEdits(); renderDiversionControls(); renderIncomeControls(); renderResources(); });
renderScenarioGrid(); renderPresetsAndEdits(); renderDiversionControls(); renderIncomeControls(); renderResources();

// Populate step elements array and show initial step
stepEls = [ '#step0','#step1','#step2','#step3','#step4','#step5' ].map(sel => document.querySelector(sel));
stepEls.forEach((el, idx) => {
  if (el) el.hidden = (idx !== state.step);
});

// If URL had no scenario set, pick the first for the country
if (!state.scenarioKey) setState({ scenarioKey: scenariosForCountry(state.country)[0]?.key || '' });

// Bottom sheet wiring (mobile scenario chooser) with swipe-to-close
const sheet = document.getElementById('sheet');
const openSheetBtn = document.getElementById('openScenarioSheet');
const closeSheetBtn = document.getElementById('closeSheet');
const sheetBody = document.getElementById('sheetBody');

if (openSheetBtn) {
  openSheetBtn.addEventListener('click', () => {
    sheet.classList.add('open');
    sheetBody.innerHTML = '';
    sheetBody.appendChild(document.getElementById('scenarioGrid').cloneNode(true));
    announce('Scenario chooser opened');
  });
}

if (closeSheetBtn) {
  closeSheetBtn.addEventListener('click', () => {
    sheet.classList.remove('open');
    announce('Scenario chooser closed');
  });
}

// Close on outside click
sheet?.addEventListener('click', (e) => {
  if (e.target === sheet) {
    sheet.classList.remove('open');
    announce('Scenario chooser closed');
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheet.classList.contains('open')) {
    sheet.classList.remove('open');
    announce('Scenario chooser closed');
  }
});

// Swipe-to-close functionality
let startY = 0;
let currentY = 0;
let isDragging = false;

if (sheet) {
  const panel = sheet.querySelector('.panel');
  
  panel.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
  });
  
  panel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    // Only allow downward swipe
    if (diff > 0) {
      panel.style.transform = `translateY(${diff}px)`;
    }
  });
  
  panel.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    
    const diff = currentY - startY;
    
    // Close if swiped down more than 100px
    if (diff > 100) {
      sheet.classList.remove('open');
      announce('Scenario chooser closed');
    }
    
    // Reset transform
    panel.style.transform = '';
  });
}


// 1) Ensure fields are not disabled by default unless truly read-only
document.querySelectorAll('input,select,textarea').forEach(el => {
  if (el.hasAttribute('data-readonly')) {
    el.setAttribute('readonly', 'readonly'); // keeps contrast vs disabled
  } else {
    el.removeAttribute('disabled');
  }
});

// 2) Improve placeholder/label visibility when restoring state
function setValue(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = (val ?? "");
  el.dispatchEvent(new Event('change', { bubbles:true }));
}

// 3) Buttons
document.getElementById('printBtn')?.addEventListener('click', () => window.print());
document.getElementById('shareBtn')?.addEventListener('click', async () => {
  const url = new URL(location.href);
  // your state -> url hash here …
  await navigator.clipboard.writeText(url.toString());
  const btn = document.getElementById('shareBtn');
  btn.textContent = 'Copied!';
  setTimeout(()=> btn.textContent = 'Copy share link', 1200);
});

// 4) When "Suggest scenario" clicked, auto-scroll to Step 1
document.getElementById('suggestBtn')?.addEventListener('click', () => {
  // ... your logic to pick a scenario
  document.getElementById('step1')?.scrollIntoView({ behavior:'smooth', block:'start' });
});

// === Initialize Modern Calculator UI ===
// Import and initialize modern calculator features
import('./app-modern.js').then(module => {
  module.initModernCalculator();
}).catch(err => {
  console.warn('Modern calculator UI not loaded:', err);
});
