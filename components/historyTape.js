// components/historyTape.js — History Tape with Undo/Redo UI

import { history } from '../lib/history.js';
import { a11y } from '../lib/a11y.js';

class HistoryTape {
  constructor() {
    this.panel = null;
    this.init();
  }

  init() {
    // Create history panel
    this.panel = document.createElement('div');
    this.panel.id = 'historyTape';
    this.panel.className = 'history-tape history-tape--hidden';
    this.panel.setAttribute('role', 'complementary');
    this.panel.setAttribute('aria-label', 'History tape');

    this.panel.innerHTML = `
      <div class="history-tape__header">
        <h3 class="history-tape__title">History</h3>
        <div class="history-tape__controls">
          <button type="button" class="history-tape__btn btn-icon" id="historyUndo" title="Undo" aria-label="Undo last action" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 5L3 10L8 15M3 10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button type="button" class="history-tape__btn btn-icon" id="historyRedo" title="Redo" aria-label="Redo action" disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 5L17 10L12 15M17 10H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button type="button" class="history-tape__btn btn-icon" id="historyClose" title="Close" aria-label="Close history">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="history-tape__content">
        <div class="history-tape__list" id="historyList">
          <div class="history-tape__empty">No history yet</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);

    // Event listeners
    this.panel.querySelector('#historyUndo').addEventListener('click', () => this.handleUndo());
    this.panel.querySelector('#historyRedo').addEventListener('click', () => this.handleRedo());
    this.panel.querySelector('#historyClose').addEventListener('click', () => this.hide());

    // Subscribe to history changes
    history.subscribe((state) => this.updateButtons(state));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.handleRedo();
      }
    });
  }

  show() {
    this.panel.classList.remove('history-tape--hidden');
    setTimeout(() => this.panel.classList.add('history-tape--visible'), 10);
    this.renderEntries();
    a11y.announce('History panel opened');
  }

  hide() {
    this.panel.classList.remove('history-tape--visible');
    setTimeout(() => this.panel.classList.add('history-tape--hidden'), 280);
    a11y.announce('History panel closed');
  }

  toggle() {
    if (this.panel.classList.contains('history-tape--visible')) {
      this.hide();
    } else {
      this.show();
    }
  }

  handleUndo() {
    const state = history.undo();
    if (state && window.setState) {
      window.setState(state);
      this.renderEntries();
      a11y.announce('Undone');
    }
  }

  handleRedo() {
    const state = history.redo();
    if (state && window.setState) {
      window.setState(state);
      this.renderEntries();
      a11y.announce('Redone');
    }
  }

  updateButtons(state) {
    const undoBtn = this.panel.querySelector('#historyUndo');
    const redoBtn = this.panel.querySelector('#historyRedo');

    undoBtn.disabled = !state.canUndo;
    redoBtn.disabled = !state.canRedo;
  }

  renderEntries() {
    const list = this.panel.querySelector('#historyList');
    const entries = history.getEntries();

    if (entries.length === 0) {
      list.innerHTML = '<div class="history-tape__empty">No history yet</div>';
      return;
    }

    list.innerHTML = entries.reverse().map((entry, idx) => {
      const isActive = entry.isCurrent;
      const time = new Date(entry.timestamp).toLocaleTimeString();
      
      return `
        <div class="history-tape__entry ${isActive ? 'history-tape__entry--active' : ''}">
          <div class="history-tape__entry-time">${time}</div>
          <div class="history-tape__entry-desc">${this.getDescription(entry.state)}</div>
        </div>
      `;
    }).join('');
  }

  getDescription(state) {
    if (!state) return 'Initial state';
    
    const preset = window.activeScenario ? window.activeScenario() : null;
    if (!preset) return 'State change';

    const parts = [];
    
    if (state.scenarioKey) {
      parts.push(`Scenario: ${preset.label.substring(0, 20)}...`);
    }
    
    if (state.inputs) {
      if (state.inputs.population) parts.push(`Pop: ${state.inputs.population.toLocaleString()}`);
      if (state.inputs.org_div) parts.push(`OrgDiv: ${(state.inputs.org_div * 100).toFixed(0)}%`);
    }

    return parts.join(', ') || 'State change';
  }

  addToHistory(state) {
    history.push(state);
    if (this.panel.classList.contains('history-tape--visible')) {
      this.renderEntries();
    }
  }
}

export const historyTape = new HistoryTape();

