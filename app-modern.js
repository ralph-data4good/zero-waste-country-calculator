// app-modern.js — Modern Calculator UI Integration
// This extends the existing app.js with new calculator UX features

import { resultDock } from './components/resultDock.js';
import { summaryBar } from './components/summaryBar.js';
import { keypad, isMobile } from './components/keypad.js';
import { historyTape } from './components/historyTape.js';
import { presetsPanel } from './components/presetsPanel.js';
import { history } from './lib/history.js';
import { presets } from './lib/presets.js';
import { a11y } from './lib/a11y.js';

// Make components available globally for integration
window.resultDock = resultDock;
window.summaryBar = summaryBar;
window.keypad = keypad;
window.historyTape = historyTape;
window.presetsPanel = presetsPanel;
// Don't override window.history (browser API)
window.calcHistory = history;
window.presets = presets;
window.a11y = a11y;

// Initialize modern calculator features
export function initModernCalculator() {
  console.log('Initializing modern calculator UI...');

  // Add toolbar buttons to header
  addToolbarButtons();

  // Setup numeric input enhancements
  enhanceNumericInputs();

  // Setup slider enhancements
  enhanceSliders();

  // Subscribe to state changes
  if (window.subscribe) {
    window.subscribe((state) => {
      // Update all components with new state
      summaryBar.update(state);
      resultDock.update(state);
      
      // Add to history (debounced)
      debouncedHistoryPush(state);
    });
  }

  // Initial state
  if (window.state) {
    summaryBar.update(window.state);
    resultDock.update(window.state);
    history.push(window.state);
  }

  console.log('Modern calculator UI initialized ✓');
}

// Add toolbar with Undo/Redo/History/Presets buttons
function addToolbarButtons() {
  const header = document.querySelector('.app-header .header-actions');
  if (!header) return;

  // Create toolbar container
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <button type="button" class="toolbar__btn btn-icon" id="toolbarUndo" title="Undo (Ctrl+Z)" aria-label="Undo">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M8 5L3 10L8 15M3 10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button type="button" class="toolbar__btn btn-icon" id="toolbarRedo" title="Redo (Ctrl+Y)" aria-label="Redo">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 5L17 10L12 15M17 10H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button type="button" class="toolbar__btn btn-icon" id="toolbarHistory" title="History" aria-label="Show history">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M10 6V10L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <button type="button" class="toolbar__btn btn-icon" id="toolbarPresets" title="Presets" aria-label="Show saved presets">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
    </button>
    <button type="button" class="toolbar__btn btn-icon" id="toolbarSave" title="Save preset" aria-label="Save current configuration as preset">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor"/>
      </svg>
    </button>
    <button type="button" class="toolbar__btn btn-icon" id="toolbarResults" title="Toggle results" aria-label="Toggle results dock">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M3 8H17M8 3V17" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>
  `;

  header.prepend(toolbar);

  // Event listeners
  document.getElementById('toolbarUndo').addEventListener('click', () => {
    const state = history.undo();
    if (state && window.setState) {
      window.setState(state);
    }
  });

  document.getElementById('toolbarRedo').addEventListener('click', () => {
    const state = history.redo();
    if (state && window.setState) {
      window.setState(state);
    }
  });

  document.getElementById('toolbarHistory').addEventListener('click', () => {
    historyTape.toggle();
  });

  document.getElementById('toolbarPresets').addEventListener('click', () => {
    presetsPanel.toggle();
  });

  document.getElementById('toolbarSave').addEventListener('click', () => {
    if (window.state) {
      presetsPanel.saveCurrentState(window.state);
    }
  });

  document.getElementById('toolbarResults').addEventListener('click', () => {
    resultDock.toggle();
  });

  // Update button states
  history.subscribe((state) => {
    document.getElementById('toolbarUndo').disabled = !state.canUndo;
    document.getElementById('toolbarRedo').disabled = !state.canRedo;
  });
}

// Enhance numeric inputs with keypad on mobile
function enhanceNumericInputs() {
  document.addEventListener('focusin', (e) => {
    const input = e.target;
    
    if (input.tagName === 'INPUT' && (input.type === 'number' || input.type === 'text')) {
      // Only show keypad on mobile
      if (isMobile()) {
        const options = {
          step: parseFloat(input.step) || 1,
          min: parseFloat(input.min) ?? -Infinity,
          max: parseFloat(input.max) ?? Infinity,
          toPercent: input.dataset.percent === 'true'
        };
        
        // Small delay to allow focus to settle
        setTimeout(() => {
          keypad.openForInput(input, options);
        }, 100);
      }
    }
  });
}

// Enhance sliders with step buttons and two-way binding
function enhanceSliders() {
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    // Create wrapper if not exists
    if (slider.parentElement.classList.contains('slider-enhanced')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'slider-enhanced';
    slider.parentNode.insertBefore(wrapper, slider);
    wrapper.appendChild(slider);

    // Create numeric input
    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'slider-enhanced__input';
    numInput.value = slider.value;
    numInput.min = slider.min;
    numInput.max = slider.max;
    numInput.step = slider.step;

    // Create step buttons
    const controls = document.createElement('div');
    controls.className = 'slider-enhanced__controls';
    controls.innerHTML = `
      <button type="button" class="slider-enhanced__step slider-enhanced__step--minus" aria-label="Decrease">−</button>
      <button type="button" class="slider-enhanced__step slider-enhanced__step--plus" aria-label="Increase">+</button>
    `;

    wrapper.appendChild(controls);
    wrapper.appendChild(numInput);

    // Two-way binding
    slider.addEventListener('input', () => {
      numInput.value = slider.value;
    });

    numInput.addEventListener('input', () => {
      slider.value = numInput.value;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Step buttons
    const minusBtn = controls.querySelector('.slider-enhanced__step--minus');
    const plusBtn = controls.querySelector('.slider-enhanced__step--plus');

    let stepInterval;
    let stepTimeout;

    const startStep = (direction) => {
      const step = parseFloat(slider.step) || 1;
      const doStep = () => {
        const current = parseFloat(slider.value);
        const newValue = current + (direction * step);
        const min = parseFloat(slider.min) ?? -Infinity;
        const max = parseFloat(slider.max) ?? Infinity;
        
        slider.value = Math.max(min, Math.min(max, newValue));
        numInput.value = slider.value;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      };

      // Immediate step
      doStep();

      // Long-press acceleration
      stepTimeout = setTimeout(() => {
        stepInterval = setInterval(doStep, 100);
      }, 500);
    };

    const stopStep = () => {
      clearTimeout(stepTimeout);
      clearInterval(stepInterval);
    };

    minusBtn.addEventListener('mousedown', () => startStep(-1));
    minusBtn.addEventListener('mouseup', stopStep);
    minusBtn.addEventListener('mouseleave', stopStep);
    minusBtn.addEventListener('touchstart', () => startStep(-1));
    minusBtn.addEventListener('touchend', stopStep);

    plusBtn.addEventListener('mousedown', () => startStep(1));
    plusBtn.addEventListener('mouseup', stopStep);
    plusBtn.addEventListener('mouseleave', stopStep);
    plusBtn.addEventListener('touchstart', () => startStep(1));
    plusBtn.addEventListener('touchend', stopStep);
  });
}

// Debounced history push (avoid adding every keystroke)
let historyDebounceTimer;
function debouncedHistoryPush(state) {
  clearTimeout(historyDebounceTimer);
  historyDebounceTimer = setTimeout(() => {
    historyTape.addToHistory(state);
  }, 1000);
}

// Export for use in main app
export { resultDock, summaryBar, keypad, historyTape, presetsPanel, history, presets, a11y };

