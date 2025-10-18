// components/keypad.js — Quick-Entry Keypad for numeric fields (mobile only)

import { a11y } from '../lib/a11y.js';

class Keypad {
  constructor() {
    this.sheet = null;
    this.currentInput = null;
    this.options = {};
    this.value = '';
    this.init();
  }

  init() {
    // Create keypad sheet
    this.sheet = document.createElement('div');
    this.sheet.id = 'keypadSheet';
    this.sheet.className = 'sheet sheet--keypad sheet--hidden';
    this.sheet.setAttribute('role', 'dialog');
    this.sheet.setAttribute('aria-modal', 'true');
    this.sheet.setAttribute('aria-label', 'Numeric keypad');

    this.sheet.innerHTML = `
      <div class="sheet__panel">
        <div class="sheet__handle" aria-hidden="true"></div>
        <div class="keypad">
          <div class="keypad__display" id="keypadDisplay" aria-live="polite">0</div>
          <div class="keypad__grid">
            <button type="button" class="keypad__key" data-key="7">7</button>
            <button type="button" class="keypad__key" data-key="8">8</button>
            <button type="button" class="keypad__key" data-key="9">9</button>
            <button type="button" class="keypad__key keypad__key--fn" data-key="back">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 10L12 5V15L7 10Z" fill="currentColor"/>
                <path d="M15 5V15" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <button type="button" class="keypad__key" data-key="4">4</button>
            <button type="button" class="keypad__key" data-key="5">5</button>
            <button type="button" class="keypad__key" data-key="6">6</button>
            <button type="button" class="keypad__key keypad__key--fn" data-key="+10">+10</button>
            <button type="button" class="keypad__key" data-key="1">1</button>
            <button type="button" class="keypad__key" data-key="2">2</button>
            <button type="button" class="keypad__key" data-key="3">3</button>
            <button type="button" class="keypad__key keypad__key--fn" data-key="+1">+1</button>
            <button type="button" class="keypad__key keypad__key--wide" data-key="0">0</button>
            <button type="button" class="keypad__key" data-key=".">•</button>
            <button type="button" class="keypad__key keypad__key--fn" data-key="%">%</button>
          </div>
          <div class="keypad__actions">
            <button type="button" class="keypad__action btn btn-outline" data-key="cancel">Cancel</button>
            <button type="button" class="keypad__action btn btn-primary" data-key="done">Done</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.sheet);

    // Event listeners
    this.sheet.addEventListener('click', (e) => {
      const key = e.target.closest('[data-key]')?.dataset.key;
      if (key) this.handleKey(key);
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      
      if (e.key >= '0' && e.key <= '9') {
        this.handleKey(e.key);
        e.preventDefault();
      } else if (e.key === '.' || e.key === ',') {
        this.handleKey('.');
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        this.handleKey('back');
        e.preventDefault();
      } else if (e.key === 'Enter') {
        this.handleKey('done');
        e.preventDefault();
      } else if (e.key === 'Escape') {
        this.handleKey('cancel');
        e.preventDefault();
      }
    });

    // Swipe to close
    this.addSwipeHandler();
  }

  openForInput(input, options = {}) {
    this.currentInput = input;
    this.options = {
      step: options.step || 1,
      min: options.min ?? -Infinity,
      max: options.max ?? Infinity,
      toPercent: options.toPercent || false
    };

    // Set initial value
    this.value = input.value || '0';
    this.updateDisplay();

    // Show sheet
    this.sheet.classList.remove('sheet--hidden');
    setTimeout(() => this.sheet.classList.add('sheet--open'), 10);

    // Trap focus
    this.removeTrap = a11y.trapFocus(this.sheet);

    a11y.announce('Keypad opened');
  }

  close() {
    this.sheet.classList.remove('sheet--open');
    setTimeout(() => {
      this.sheet.classList.add('sheet--hidden');
      if (this.removeTrap) this.removeTrap();
      if (this.currentInput) this.currentInput.focus();
    }, 280);
  }

  isOpen() {
    return this.sheet.classList.contains('sheet--open');
  }

  handleKey(key) {
    switch(key) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        if (this.value === '0') {
          this.value = key;
        } else {
          this.value += key;
        }
        break;

      case '.':
        if (!this.value.includes('.')) {
          this.value += '.';
        }
        break;

      case 'back':
        this.value = this.value.slice(0, -1) || '0';
        break;

      case '+1':
        this.value = String(Math.min(parseFloat(this.value) + 1, this.options.max));
        break;

      case '+10':
        this.value = String(Math.min(parseFloat(this.value) + 10, this.options.max));
        break;

      case '%':
        if (this.options.toPercent) {
          this.value = String(parseFloat(this.value) / 100);
        }
        break;

      case 'done':
        this.applyValue();
        this.close();
        a11y.announce('Value applied');
        return;

      case 'cancel':
        this.close();
        a11y.announce('Cancelled');
        return;
    }

    this.updateDisplay();
  }

  updateDisplay() {
    const display = this.sheet.querySelector('#keypadDisplay');
    display.textContent = this.value;
  }

  applyValue() {
    if (!this.currentInput) return;

    let finalValue = parseFloat(this.value);
    
    // Apply constraints
    if (finalValue < this.options.min) finalValue = this.options.min;
    if (finalValue > this.options.max) finalValue = this.options.max;

    // Update input
    this.currentInput.value = finalValue;
    this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.currentInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  addSwipeHandler() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const panel = this.sheet.querySelector('.sheet__panel');

    panel.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    });

    panel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0) {
        panel.style.transform = `translateY(${diff}px)`;
      }
    });

    panel.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;

      const diff = currentY - startY;

      if (diff > 100) {
        this.close();
      }

      panel.style.transform = '';
    });
  }
}

// Export singleton
export const keypad = new Keypad();

// Helper to check if device is mobile
export function isMobile() {
  return window.innerWidth < 900;
}

