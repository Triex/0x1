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
 * Set up theme toggle button functionality with improved visual feedback
 */
function setupThemeToggle(): void {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) {
    console.warn('Theme toggle button not found');
    return;
  }
  
  // Set initial button state
  updateThemeToggleUI(themeToggle);
  
  themeToggle.addEventListener('click', () => {
    // Toggle dark mode
    const isDark = document.documentElement.classList.contains('dark');
    const newMode = isDark ? 'light' : 'dark';
    
    // Apply theme change
    document.documentElement.classList.toggle('dark', newMode === 'dark');
    
    // Save user preference
    localStorage.setItem(STORAGE_KEY, newMode);
    
    // Update button UI
    updateThemeToggleUI(themeToggle);
  });
}

/**
 * Update theme toggle button UI based on current theme
 */
function updateThemeToggleUI(themeToggle: HTMLElement): void {
  const isDark = document.documentElement.classList.contains('dark');
  
  // Update accessibility attributes
  themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  
  // If toggle has children for different icons
  const lightIcon = themeToggle.querySelector('.light-icon');
  const darkIcon = themeToggle.querySelector('.dark-icon');
  
  if (lightIcon && darkIcon) {
    lightIcon.classList.toggle('hidden', isDark);
    darkIcon.classList.toggle('hidden', !isDark);
  }
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
