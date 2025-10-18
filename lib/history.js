// lib/history.js — Undo/Redo state management (max 20 steps)

class HistoryManager {
  constructor(maxSteps = 20) {
    this.maxSteps = maxSteps;
    this.stack = [];
    this.pointer = -1;
    this.listeners = new Set();
  }

  // Push new state (serialize diff only for performance)
  push(state) {
    // Remove any future states if we're not at the end
    this.stack = this.stack.slice(0, this.pointer + 1);
    
    // Add new state
    this.stack.push(JSON.parse(JSON.stringify(state)));
    
    // Limit stack size
    if (this.stack.length > this.maxSteps) {
      this.stack.shift();
    } else {
      this.pointer++;
    }
    
    this.notify();
  }

  // Undo to previous state
  undo() {
    if (!this.canUndo()) return null;
    this.pointer--;
    this.notify();
    return JSON.parse(JSON.stringify(this.stack[this.pointer]));
  }

  // Redo to next state
  redo() {
    if (!this.canRedo()) return null;
    this.pointer++;
    this.notify();
    return JSON.parse(JSON.stringify(this.stack[this.pointer]));
  }

  canUndo() {
    return this.pointer > 0;
  }

  canRedo() {
    return this.pointer < this.stack.length - 1;
  }

  // Get current state
  current() {
    return this.pointer >= 0 ? JSON.parse(JSON.stringify(this.stack[this.pointer])) : null;
  }

  // Get history entries with timestamps
  getEntries() {
    return this.stack.map((state, idx) => ({
      id: idx,
      timestamp: Date.now() - (this.stack.length - idx - 1) * 1000,
      state,
      isCurrent: idx === this.pointer
    }));
  }

  // Subscribe to changes
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      fn({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    }
  }

  // Clear history
  clear() {
    this.stack = [];
    this.pointer = -1;
    this.notify();
  }
}

export const history = new HistoryManager();

