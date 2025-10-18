// lib/presets.js — Favorites / Presets management

const PRESETS_KEY = 'zwa_calc_presets_v1';

class PresetsManager {
  constructor() {
    this.listeners = new Set();
  }

  // Save current state as named preset
  save(name, state) {
    const presets = this.list();
    const id = Date.now().toString();
    
    presets.push({
      id,
      name: name || `Preset ${presets.length + 1}`,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state))
    });
    
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    this.notify();
    return id;
  }

  // Get all saved presets
  list() {
    try {
      return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  // Get preset by ID
  get(id) {
    return this.list().find(p => p.id === id);
  }

  // Apply preset (returns state)
  apply(id) {
    const preset = this.get(id);
    return preset ? JSON.parse(JSON.stringify(preset.state)) : null;
  }

  // Remove preset
  remove(id) {
    const presets = this.list().filter(p => p.id !== id);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    this.notify();
  }

  // Rename preset
  rename(id, newName) {
    const presets = this.list();
    const preset = presets.find(p => p.id === id);
    if (preset) {
      preset.name = newName;
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
      this.notify();
    }
  }

  // Subscribe to changes
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      fn(this.list());
    }
  }

  // Clear all presets
  clear() {
    localStorage.removeItem(PRESETS_KEY);
    this.notify();
  }
}

export const presets = new PresetsManager();

