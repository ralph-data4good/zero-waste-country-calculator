// step0-logic.js
// Complete Step 0 implementation (Q1-Q7 + Unsure, with confidence scoring)

import { ACTIVITY_OPTIONS, SCENARIO_LABELS } from './config.js';
import { ACTIVITY_WEIGHTS, GEO_WEIGHTS, STEP0_NUDGES } from './step0-weights.js';

//============ Step 0: Friendly Scenario Mapper (Q1-Q7 + Unsure) ============

// Helper: apply nudges (Q5-Q7 biases → scenario bumps)
function applyNudges(country, step0, scores) {
  const bump = (k, v) => scores.set(k, (scores.get(k) || 1) + v);

  const pop = STEP0_NUDGES.population[step0.population] || {};
  const part = STEP0_NUDGES.participation[step0.participation] || {};
  const coll = STEP0_NUDGES.collection[step0.collection] || {};
  const space = STEP0_NUDGES.space[step0.space] || {};

  // PH mappings
  if (country === "PH") {
    if (part.org_only_bias) bump("ph_rural_lgu_o", part.org_only_bias);
    if (part.org_recy_bias) bump("ph_urban_lgu_or", part.org_recy_bias);

    if (coll.hh_bias) bump("ph_rural_lgu_o", coll.hh_bias);
    if (coll.central_bias) bump("ph_urban_lgu_or", coll.central_bias);

    if (space.cluster_bias) bump("ph_rural_lgu_o", space.cluster_bias);
    if (space.barangay_bias) bump("ph_rural_lgu_o", space.barangay_bias);
    if (space.central_bias) bump("ph_urban_lgu_or", space.central_bias);

    Object.entries(pop).forEach(([k, v]) => bump(k, v));
  }

  // ID mappings
  if (country === "ID") {
    if (part.org_only_bias) bump("id_rural_lgu_o", part.org_only_bias);
    if (part.org_recy_bias) bump("id_urban_lgu_or", part.org_recy_bias);

    if (coll.hh_bias) bump("id_rural_lgu_o", coll.hh_bias);
    if (coll.central_bias) bump("id_urban_lgu_or", coll.central_bias);

    if (space.cluster_bias) bump("id_rural_lgu_o", space.cluster_bias);
    if (space.barangay_bias) bump("id_rural_lgu_o", space.barangay_bias);
    if (space.central_bias) bump("id_urban_lgu_or", space.central_bias);

    Object.entries(pop).forEach(([k, v]) => bump(k, v));
  }
}

// Main suggester algorithm with confidence scoring
export function suggestScenarioFromStep0({ country, candidates, step0 }) {
  if (!country || !Array.isArray(candidates) || candidates.length === 0) {
    return { bestKey: null, ranked: [], confidence: "low", rationale: "No candidates available." };
  }

  const scores = new Map(candidates.map(s => [s.key, 1.0]));

  // Q2: Activities (max 2). Ignore "Unsure".
  (step0.activities || [])
    .filter(a => a.name && a.name !== "Unsure")
    .forEach(({ name, pct = 100 }) => {
      const p = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
      candidates.forEach(s => {
        const delta = (ACTIVITY_WEIGHTS?.[country]?.[name]?.[s.key] || 0) * p;
        scores.set(s.key, (scores.get(s.key) || 1) + delta);
      });
    });

  // Q1, Q3, Q4: Geography — area, relief, island (Unsure = neutral)
  const areaMap = GEO_WEIGHTS?.[country]?.area?.[step0.area] || {};
  const reliefMap = GEO_WEIGHTS?.[country]?.relief?.[step0.relief] || {};
  const islandKey = (step0.island === true || step0.island === "true") ? "true" :
                    (step0.island === false || step0.island === "false") ? "false" : "unsure";
  const islandMap = GEO_WEIGHTS?.[country]?.island?.[islandKey] || {};

  [areaMap, reliefMap, islandMap].forEach(map => {
    Object.entries(map).forEach(([k, v]) => scores.set(k, (scores.get(k) || 1) + v));
  });

  // Q5-Q7: Nudges
  applyNudges(country, step0, scores);

  // Tie-breaker to first candidate
  const first = candidates[0]?.key;
  if (first) scores.set(first, (scores.get(first) || 1) + 0.05);

  const ranked = [...scores.entries()]
    .map(([key, score]) => ({ key, score }))
    .sort((a, b) => b.score - a.score);
  const bestKey = ranked[0]?.key || null;

  // Confidence: count "knowns" (non-Unsure answers)
  const knowns = [
    step0.area !== "Unsure",
    (step0.activities || []).some(a => a.name && a.name !== "Unsure"),
    step0.relief !== "Unsure",
    step0.island !== "unsure",
    step0.population !== "unsure",
    step0.participation !== "unsure",
    step0.collection !== "unsure"
    // step0.space excluded (optional)
  ].filter(Boolean).length;

  const confidence = knowns >= 6 ? "high" : knowns >= 4 ? "medium" : "low";

  // Build rationale
  const acts = (step0.activities || [])
    .filter(a => a.name !== "Unsure")
    .map(a => `${a.name}${a.pct ? `: ${a.pct}%` : ""}`)
    .join(", ") || "n/a";

  const rationale = `Country=${step0.country}, Area=${step0.area}, Activities=[${acts}], Terrain=${step0.relief}, Coastal island=${step0.island}, Pop=${step0.population}, Participation=${step0.participation}, Collection=${step0.collection}.`;

  return { bestKey, ranked, confidence, rationale };
}

// UI State for multi-select
// ========== Step 0 UI State ==========
const step0UIState = {
  selectedActivities: [], // [{name: string, pct: number}]
  dropdownOpen: false
};

// Helper: get element
const el = (sel) => document.querySelector(sel);

// Announce to screen reader
function announce(msg) {
  const live = document.getElementById('live');
  if (live) {
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 100);
  }
}

// ========== Multi-Select Activity Picker ==========

export function renderActivityDropdown() {
  const dropdown = el('#s0ActivityDropdown');
  if (!dropdown) return;
  dropdown.innerHTML = '';

  const hasUnsure = step0UIState.selectedActivities.some(a => a.name === "Unsure");

  ACTIVITY_OPTIONS.forEach(activity => {
    const isSelected = step0UIState.selectedActivities.some(a => a.name === activity);
    const isDisabled = (activity !== "Unsure" && hasUnsure) ||
                       (activity === "Unsure" && step0UIState.selectedActivities.length > 0) ||
                       (!isSelected && step0UIState.selectedActivities.length >= 2 && activity !== "Unsure");

    const option = document.createElement('div');
    option.className = 'multi-select__option' + (isDisabled ? ' multi-select__option--disabled' : '');
    option.setAttribute('role', 'option');
    option.setAttribute('tabindex', isDisabled ? '-1' : '0');
    option.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isSelected;
    checkbox.disabled = isDisabled;
    checkbox.id = `s0Activity_${activity.replace(/\s+/g, '_')}`;

    const label = document.createElement('label');
    label.setAttribute('for', checkbox.id);
    label.textContent = activity;
    label.style.cursor = isDisabled ? 'not-allowed' : 'pointer';

    option.appendChild(checkbox);
    option.appendChild(label);

    option.addEventListener('click', (e) => {
      if (isDisabled) {
        e.preventDefault();
        showActivityError(activity === "Unsure" ? 
          'Clear other activities before selecting Unsure' : 
          'Maximum 2 activities allowed (or choose Unsure only)');
        shakeDropdown();
        return;
      }

      if (isSelected) {
        removeActivity(activity);
      } else {
        addActivity(activity);
      }

      renderActivityDropdown();
      renderActivityChips();

      // Auto-close after 2nd selection (unless Unsure)
      if (step0UIState.selectedActivities.length === 2 && !step0UIState.selectedActivities.some(a => a.name === "Unsure")) {
        setTimeout(() => closeActivityDropdown(), 200);
      }
      // Auto-close if Unsure selected
      if (step0UIState.selectedActivities.some(a => a.name === "Unsure")) {
        setTimeout(() => closeActivityDropdown(), 200);
      }
    });

    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        option.click();
      }
    });

    dropdown.appendChild(option);
  });
}

export function renderActivityChips() {
  const chipsContainer = el('#s0ActivityChips');
  if (!chipsContainer) return;
  chipsContainer.innerHTML = '';

  step0UIState.selectedActivities.forEach(activity => {
    const chip = document.createElement('div');
    chip.className = 'chip';

    const label = document.createElement('span');
    label.className = 'chip__label';
    label.textContent = activity.name;

    // No % input for "Unsure"
    if (activity.name !== "Unsure") {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'chip__input';
      input.min = '0';
      input.max = '100';
      input.step = '1';
      input.value = activity.pct || '';
      input.placeholder = '%';
      input.setAttribute('aria-label', `Percentage for ${activity.name}`);

      input.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        activity.pct = val;

        if (val < 0 || val > 100) {
          input.classList.add('is-error');
        } else {
          input.classList.remove('is-error');
        }
      });

      input.addEventListener('blur', () => {
        const val = Number(input.value);
        if (val < 0) input.value = 0;
        if (val > 100) input.value = 100;
        activity.pct = Number(input.value);
      });

      chip.appendChild(label);
      chip.appendChild(input);
    } else {
      chip.appendChild(label);
    }

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'chip__remove';
    removeBtn.setAttribute('aria-label', `Remove ${activity.name}`);
    removeBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="4" x2="4" y2="12"></line><line x1="4" y1="4" x2="12" y2="12"></line></svg>';

    removeBtn.addEventListener('click', () => {
      removeActivity(activity.name);
      renderActivityDropdown();
      renderActivityChips();
      announce(`Removed activity ${activity.name}`);
    });

    removeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        removeBtn.click();
      }
    });

    chip.appendChild(removeBtn);
    chipsContainer.appendChild(chip);
  });
}

function addActivity(activityName) {
  if (activityName === "Unsure") {
    step0UIState.selectedActivities = [{ name: "Unsure" }];
  } else {
    if (step0UIState.selectedActivities.length >= 2) {
      showActivityError('Maximum 2 activities allowed');
      return;
    }
    step0UIState.selectedActivities.push({ name: activityName, pct: 0 });
  }
  announce(`Added activity ${activityName}`);
  clearActivityError();
}

function removeActivity(activityName) {
  step0UIState.selectedActivities = step0UIState.selectedActivities.filter(a => a.name !== activityName);
  clearActivityError();
}

function showActivityError(message) {
  const errorEl = el('#s0ActivityError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearActivityError() {
  const errorEl = el('#s0ActivityError');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

function shakeDropdown() {
  const trigger = el('#s0ActivitySelectBtn');
  if (trigger) {
    trigger.classList.add('chip--shake');
    setTimeout(() => trigger.classList.remove('chip--shake'), 300);
  }
}

function openActivityDropdown() {
  step0UIState.dropdownOpen = true;
  const dropdown = el('#s0ActivityDropdown');
  const trigger = el('#s0ActivitySelectBtn');
  if (!dropdown || !trigger) return;

  dropdown.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  renderActivityDropdown();

  // Focus first option
  const firstOption = dropdown.querySelector('.multi-select__option:not(.multi-select__option--disabled)');
  if (firstOption) firstOption.focus();
}

function closeActivityDropdown() {
  step0UIState.dropdownOpen = false;
  const dropdown = el('#s0ActivityDropdown');
  const trigger = el('#s0ActivitySelectBtn');
  if (!dropdown || !trigger) return;

  dropdown.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.focus();
}

// ========== Step 0 Initialization & Event Handlers ==========

export function initStep0(setState, getState, SCENARIO_PRESETS) {
  // Dropdown toggle
  const triggerBtn = el('#s0ActivitySelectBtn');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      if (step0UIState.dropdownOpen) {
        closeActivityDropdown();
      } else {
        openActivityDropdown();
      }
    });

    triggerBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && step0UIState.dropdownOpen) {
        closeActivityDropdown();
      }
      if (e.key === 'ArrowDown' && !step0UIState.dropdownOpen) {
        e.preventDefault();
        openActivityDropdown();
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (step0UIState.dropdownOpen) {
      const multiSelect = document.querySelector('.multi-select');
      if (multiSelect && !multiSelect.contains(e.target)) {
        closeActivityDropdown();
      }
    }
  });

  // "Suggest scenario" button
  const suggestBtn = el('#s0SuggestBtn');
  if (suggestBtn) {
    suggestBtn.addEventListener('click', () => {
      // Prevent double-submit
      if (suggestBtn.disabled) return;
      suggestBtn.disabled = true;
      const originalText = suggestBtn.textContent;
      suggestBtn.textContent = 'Suggesting...';
      
      const country = el('#s0Country').value;
      const area = el('#s0Area').value;
      const activities = step0UIState.selectedActivities.filter(a => a.pct > 0 || a.name === "Unsure");
      const reliefEl = document.querySelector('input[name="s0Relief"]:checked');
      const relief = reliefEl ? reliefEl.value : 'Unsure';
      const island = el('#s0Island').value; // "true" | "false" | "unsure"
      const population = el('#s0Population').value;
      const participation = el('#s0Participation').value;
      const collection = el('#s0Collection').value;
      const locality = el('#s0Locality').value;

      const step0Data = {
        country,
        area,
        activities,
        relief,
        island,
        population,
        participation,
        collection,
        space: 'unsure' // Not exposed in UI yet
      };

      const candidates = SCENARIO_PRESETS.filter(s => s.country === country);
      const { bestKey, ranked, confidence, rationale } = suggestScenarioFromStep0({
        country,
        candidates,
        step0: step0Data
      });

      // Update global state
      setState({
        country,
        locality,
        scenarioKey: bestKey,
        step: 1,
        step0: step0Data
      });

      // Show suggestion result
      renderSuggestion(bestKey, confidence, rationale);

      // Highlight card in Step 1
      highlightScenarioCard(bestKey);

      announce(`Suggested ${SCENARIO_LABELS[bestKey] || bestKey} scenario. Confidence: ${confidence}.`);

      // Scroll to Step 1
      el('#step1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Re-enable button after processing
      setTimeout(() => {
        suggestBtn.disabled = false;
        suggestBtn.textContent = originalText;
      }, 500);
    });
  }

  // "Skip for now" button
  const skipBtn = el('#s0SkipBtn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      setState({ step: 1 });
      el('#step1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Restore from state if present
  const state = getState();
  if (state.step0 && state.step0.activities && state.step0.activities.length > 0) {
    step0UIState.selectedActivities = state.step0.activities;

    // Restore form fields
    if (el('#s0Country')) el('#s0Country').value = state.step0.country || 'PH';
    if (el('#s0Area')) el('#s0Area').value = state.step0.area || 'Unsure';
    if (el('#s0Island')) el('#s0Island').value = state.step0.island || 'unsure';
    if (el('#s0Population')) el('#s0Population').value = state.step0.population || 'unsure';
    if (el('#s0Participation')) el('#s0Participation').value = state.step0.participation || 'unsure';
    if (el('#s0Collection')) el('#s0Collection').value = state.step0.collection || 'unsure';
    if (el('#s0Locality')) el('#s0Locality').value = state.locality || '';

    // Restore terrain radio
    if (state.step0.relief) {
      const reliefRadio = document.querySelector(`input[name="s0Relief"][value="${state.step0.relief}"]`);
      if (reliefRadio) reliefRadio.checked = true;
    }
  }

  renderActivityChips();
}

// ========== Helper: Render Suggestion Result ==========

function renderSuggestion(bestKey, confidence, rationale) {
  const suggestionEl = el('#s0Suggestion');
  const confidenceBadge = el('#s0Confidence');
  if (!suggestionEl) return;

  suggestionEl.hidden = false;
  suggestionEl.innerHTML = `
    <h4>✨ Suggested Scenario: ${SCENARIO_LABELS[bestKey] || bestKey}</h4>
    <p>${rationale}</p>
  `;

  if (confidenceBadge) {
    confidenceBadge.textContent = `Confidence: ${confidence}`;
    confidenceBadge.className = `confidence-badge ${confidence}`;
  }
}

// ========== Helper: Highlight Step 1 Card ==========

function highlightScenarioCard(scenarioKey) {
  // This will be called in app.js after Step 1 renders
  // For now, store the key globally
  window._step0SuggestedKey = scenarioKey;
}

