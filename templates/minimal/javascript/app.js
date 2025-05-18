/**
 * 0x1 Minimal App
 * A lightweight starting point for your project
 */

/**
 * Theme Manager - Handles dark/light mode
 */
class ThemeManager {
  constructor() {
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.htmlEl = document.documentElement;
    this.theme = localStorage.getItem('theme') || 'dark'; // Default to dark mode
    this.init();
  }

  init() {
    // Apply saved theme from localStorage
    this.applyTheme(this.theme);
    
    // Add event listener for theme toggle button
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    } else {
      console.warn('Theme toggle button not found');
    }
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      this.htmlEl.classList.add('dark');
    } else {
      this.htmlEl.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    this.theme = theme;
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }
}

/**
 * Counter Component - Manages counter functionality
 */
class Counter {
  constructor() {
    this.counterValue = document.getElementById('counter-value');
    this.incrementBtn = document.getElementById('increment-btn');
    this.decrementBtn = document.getElementById('decrement-btn');
    this.count = 0;
    this.init();
  }

  init() {
    this.updateDisplay();
    
    if (this.incrementBtn) {
      this.incrementBtn.addEventListener('click', () => this.increment());
    }
    
    if (this.decrementBtn) {
      this.decrementBtn.addEventListener('click', () => this.decrement());
    }
  }

  increment() {
    this.count++;
    this.updateDisplay();
  }

  decrement() {
    this.count--;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.counterValue) {
      this.counterValue.textContent = this.count;
    }
  }
}

// DOM ready function
function ready(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Initialize the app
ready(() => {
  // Initialize theme manager
  new ThemeManager();
  
  // Initialize counter
  new Counter();
});
