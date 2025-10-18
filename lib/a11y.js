// lib/a11y.js — Accessibility helpers and ARIA announcements

class A11yManager {
  constructor() {
    this.liveRegion = null;
    this.init();
  }

  init() {
    // Create or get live region
    this.liveRegion = document.getElementById('live');
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = 'live';
      this.liveRegion.className = 'sr-only';
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.liveRegion);
    }
  }

  // Announce message to screen readers
  announce(message, priority = 'polite') {
    if (!this.liveRegion) this.init();
    
    // Clear first to ensure announcement
    this.liveRegion.textContent = '';
    
    // Set priority
    this.liveRegion.setAttribute('aria-live', priority);
    
    // Announce after small delay
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);
  }

  // Announce with assertive priority (interrupts)
  announceAssertive(message) {
    this.announce(message, 'assertive');
  }

  // Show toast notification (visual + announced)
  toast(message, duration = 3000) {
    this.announce(message);
    
    // Create visual toast
    const toast = document.createElement('div');
    toast.className = 'toast fade-in';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Focus trap for modals
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handler);
    firstFocusable?.focus();

    return () => element.removeEventListener('keydown', handler);
  }

  // Escape key handler
  onEscape(callback) {
    const handler = (e) => {
      if (e.key === 'Escape') callback(e);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }
}

export const a11y = new A11yManager();

