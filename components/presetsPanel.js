// components/presetsPanel.js — Favorites / Presets UI

import { presets } from '../lib/presets.js';
import { a11y } from '../lib/a11y.js';

class PresetsPanel {
  constructor() {
    this.panel = null;
    this.init();
  }

  init() {
    // Create presets panel
    this.panel = document.createElement('div');
    this.panel.id = 'presetsPanel';
    this.panel.className = 'presets-panel presets-panel--hidden';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'Saved presets');

    this.panel.innerHTML = `
      <div class="presets-panel__overlay"></div>
      <div class="presets-panel__content">
        <div class="presets-panel__header">
          <h3 class="presets-panel__title">Saved Presets</h3>
          <button type="button" class="presets-panel__close btn-icon" title="Close" aria-label="Close presets">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="presets-panel__list" id="presetsList"></div>
        <div class="presets-panel__actions">
          <button type="button" class="btn btn-outline" id="presetsCancel">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);

    // Event listeners
    this.panel.querySelector('.presets-panel__close').addEventListener('click', () => this.hide());
    this.panel.querySelector('#presetsCancel').addEventListener('click', () => this.hide());
    this.panel.querySelector('.presets-panel__overlay').addEventListener('click', () => this.hide());

    // Subscribe to presets changes
    presets.subscribe(() => {
      if (this.panel.classList.contains('presets-panel--visible')) {
        this.render();
      }
    });

    // Escape key
    a11y.onEscape(() => {
      if (this.panel.classList.contains('presets-panel--visible')) {
        this.hide();
      }
    });
  }

  show() {
    this.panel.classList.remove('presets-panel--hidden');
    setTimeout(() => this.panel.classList.add('presets-panel--visible'), 10);
    this.render();
    a11y.announce('Presets panel opened');
  }

  hide() {
    this.panel.classList.remove('presets-panel--visible');
    setTimeout(() => this.panel.classList.add('presets-panel--hidden'), 280);
    a11y.announce('Presets panel closed');
  }

  toggle() {
    if (this.panel.classList.contains('presets-panel--visible')) {
      this.hide();
    } else {
      this.show();
    }
  }

  render() {
    const list = this.panel.querySelector('#presetsList');
    const items = presets.list();

    if (items.length === 0) {
      list.innerHTML = `
        <div class="presets-panel__empty">
          <p>No saved presets yet</p>
          <p class="text-muted">Click the star icon to save your current configuration</p>
        </div>
      `;
      return;
    }

    list.innerHTML = items.map(preset => this.renderPresetItem(preset)).join('');

    // Add event listeners
    list.querySelectorAll('.preset-item__apply').forEach(btn => {
      btn.addEventListener('click', () => this.applyPreset(btn.dataset.id));
    });

    list.querySelectorAll('.preset-item__delete').forEach(btn => {
      btn.addEventListener('click', () => this.deletePreset(btn.dataset.id));
    });

    list.querySelectorAll('.preset-item__rename').forEach(btn => {
      btn.addEventListener('click', () => this.renamePreset(btn.dataset.id));
    });
  }

  renderPresetItem(preset) {
    const date = new Date(preset.timestamp).toLocaleDateString();
    const time = new Date(preset.timestamp).toLocaleTimeString();

    return `
      <div class="preset-item" data-id="${preset.id}">
        <div class="preset-item__header">
          <div class="preset-item__name">${preset.name}</div>
          <div class="preset-item__date">${date} ${time}</div>
        </div>
        <div class="preset-item__details">
          ${this.getPresetDetails(preset.state)}
        </div>
        <div class="preset-item__actions">
          <button type="button" class="preset-item__apply btn btn-primary" data-id="${preset.id}">
            Apply
          </button>
          <button type="button" class="preset-item__rename btn-icon" data-id="${preset.id}" title="Rename" aria-label="Rename preset">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 11L11 2L14 5L5 14H2V11Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </button>
          <button type="button" class="preset-item__delete btn-icon" data-id="${preset.id}" title="Delete" aria-label="Delete preset">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4H13M5 4V3H11V4M6 7V11M10 7V11M4 4L5 13H11L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  getPresetDetails(state) {
    const parts = [];
    
    if (state.country) parts.push(`Country: ${state.country}`);
    if (state.locality) parts.push(`Locality: ${state.locality}`);
    if (state.inputs?.population) parts.push(`Population: ${state.inputs.population.toLocaleString()}`);
    if (state.inputs?.org_div) parts.push(`Org Div: ${(state.inputs.org_div * 100).toFixed(0)}%`);

    return parts.slice(0, 4).join(' • ') || 'No details';
  }

  applyPreset(id) {
    const state = presets.apply(id);
    if (state && window.setState) {
      window.setState(state);
      this.hide();
      a11y.toast('Preset applied');
    }
  }

  deletePreset(id) {
    if (confirm('Delete this preset?')) {
      presets.remove(id);
      a11y.toast('Preset deleted');
    }
  }

  renamePreset(id) {
    const preset = presets.get(id);
    if (!preset) return;

    const newName = prompt('Enter new name:', preset.name);
    if (newName && newName.trim()) {
      presets.rename(id, newName.trim());
      a11y.toast('Preset renamed');
    }
  }

  saveCurrentState(state) {
    const name = prompt('Enter preset name:', `Preset ${presets.list().length + 1}`);
    if (name && name.trim()) {
      presets.save(name.trim(), state);
      a11y.toast('Preset saved');
      return true;
    }
    return false;
  }
}

export const presetsPanel = new PresetsPanel();

