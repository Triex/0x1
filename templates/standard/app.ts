/**
 * 0x1 Standard App - Entry Point
 * A clean TypeScript application with component system and routing
 * Follows a Next.js-inspired modular approach for better maintainability
 */

// Import components and pages
import { Router } from './lib/router';
import { About } from './pages/about';
import { Home } from './pages/home';
import { NotFound } from './pages/not-found';

// Theme management constants
const STORAGE_KEY = '0x1-dark-mode';

/**
 * DOM ready function - Runs callback when DOM is fully loaded
 */
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

/**
 * Initialize theme based on saved preference or system setting
 * Handles dark mode toggling and system preference detection
 */
function initializeTheme(): void {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false;
    
    // Apply theme based on saved preference or system preference
    if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
    
    // Listen for system preference changes
    window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener('change', (e) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  } catch (error) {
    console.error('Theme initialization error:', error);
  }
}

/**
 * Initialize the app with proper error handling and logging
 */
ready(() => {
  try {
    console.log('🚀 Initializing 0x1 Standard App');
    
    // Initialize theme
    initializeTheme();
    
    // Set up theme toggle functionality
    setupThemeToggle();
    
    // Initialize router
    initializeRouter();
    
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
});

/**
 * Set up theme toggle button functionality
 */
function setupThemeToggle(): void {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) {
    console.warn('Theme toggle button not found');
    return;
  }
  
  themeToggle.addEventListener('click', () => {
    // Toggle dark mode
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
    }
  });
}

/**
 * Initialize router with all application routes
 */
function initializeRouter(): void {
  // Find main content area for router
  const main = document.getElementById('main-content');
  if (!main) {
    throw new Error('Main content element not found');
  }
  
  // Create router with main content area as the root
  const router = new Router(main);
  
  // Define routes
  router.addRoute('/', Home);
  router.addRoute('/about', About);
  router.setNotFound(NotFound);
  
  // Initialize router
  router.init();
}
