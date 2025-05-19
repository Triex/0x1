/**
 * 0x1 Standard App - Entry Point
 * Using automatic app directory structure
 */
import { Router } from '0x1/core/router';

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme manager
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

// Initialize navigation events for client-side routing
function initializeNavigation(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Check if the click was on a link
    if (target.tagName === 'A' || target.closest('a')) {
      const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a') as HTMLAnchorElement;
      const href = link.getAttribute('href');
      
      // Only handle internal links
      if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#')) {
        e.preventDefault();
        window.history.pushState(null, '', href);
        // Trigger route change
        window.dispatchEvent(new Event('popstate'));
      }
    }
  });
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
  
  // Initialize navigation events
  initializeNavigation();
  
  // Initialize the router with automatic app directory discovery
  const router = new Router({
    rootElement: appContainer,
    mode: 'history',
    transitionDuration: 150,
    // Let 0x1 automatically discover components
    autoDiscovery: true
  });
  
  router.init();
  
  console.log('0x1 Standard App started with app directory structure!');
});
