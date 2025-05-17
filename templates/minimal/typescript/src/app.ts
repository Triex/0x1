/**
 * 0x1 Minimal App
 * A lightweight starting point for your project
 */

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme manager
class ThemeManager {
  private storageKey = '0x1-dark-mode';
  private themeToggleBtn: HTMLElement | null;
  
  constructor() {
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.initialize();
  }
  
  private initialize(): void {
    // Check for saved preference
    const savedTheme = localStorage.getItem(this.storageKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial dark mode state based on saved preference or system preference
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
    
    // Set up toggle button if it exists
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem(this.storageKey)) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }
  
  private toggleTheme(): void {
    // Toggle dark class on html element
    const isDark = document.documentElement.classList.toggle('dark');
    
    // Save user preference
    localStorage.setItem(this.storageKey, isDark ? 'dark' : 'light');
  }
}

// Counter component
class Counter {
  private value: number = 0;
  private valueElement: HTMLElement | null;
  private incrementBtn: HTMLElement | null;
  private decrementBtn: HTMLElement | null;
  
  constructor() {
    this.valueElement = document.getElementById('counter-value');
    this.incrementBtn = document.getElementById('increment-btn');
    this.decrementBtn = document.getElementById('decrement-btn');
    
    this.initialize();
  }
  
  private initialize(): void {
    if (this.valueElement) {
      this.valueElement.textContent = this.value.toString();
    }
    
    if (this.incrementBtn) {
      this.incrementBtn.addEventListener('click', () => this.increment());
    }
    
    if (this.decrementBtn) {
      this.decrementBtn.addEventListener('click', () => this.decrement());
    }
  }
  
  private increment(): void {
    this.value++;
    this.updateDisplay();
  }
  
  private decrement(): void {
    this.value--;
    this.updateDisplay();
  }
  
  private updateDisplay(): void {
    if (this.valueElement) {
      this.valueElement.textContent = this.value.toString();
    }
  }
}

// Initialize the application
ready(() => {
  // Initialize theme manager
  new ThemeManager();
  
  // Initialize counter
  new Counter();
  
  console.log('0x1 Minimal App started!');
});
