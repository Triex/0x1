/**
 * 0x1 Minimal App - Entry Point
 * Using automatic app directory structure
 */
// Use simplified router import
import { Router } from '0x1/router';

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme manager - simple implementation
function initializeTheme(): void {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storageKey = '0x1-dark-mode';
  
  // Check for saved preference
  const savedTheme = localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial dark mode state based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  }
  
  // Set up toggle button if it exists
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      // Toggle dark class on html element
      const isDark = document.documentElement.classList.toggle('dark');
      
      // Save user preference
      localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
    });
  }
}

// Bootstrap the application when DOM is loaded
ready(() => {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('App container not found. Add a div with id="app" to your HTML.');
    return;
  }
  
  // Initialize theme handling
  initializeTheme();
  
  // Initialize the router with automatic app directory discovery
  const router = new Router({
    root: appContainer,
    mode: 'history',
    transitionDuration: 150
    // The router now automatically discovers components in the app directory
  });
  
  router.init();
  
  console.log('0x1 Minimal App started!');
});
