/**
 * 0x1 Minimal App - Entry Point
 * Using automatic app directory structure
 */
// Import createElement and Fragment for JSX support
import { createElement, Fragment } from '0x1';

// Router is available as a global from the script included in index.html
declare const Router: any;
declare const Link: any;
declare const NavLink: any;
declare const Redirect: any;

// Import proper components
import { Counter } from './components/Counter';

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme manager - enhanced implementation with better user preference handling
function initializeTheme(): void {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storageKey = '0x1-dark-mode';
  
  // Setup theme toggle functionality
  function setTheme(mode: 'dark' | 'light' | 'system'): void {
    if (mode === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      // Don't save to storage - we're using system preference
      localStorage.removeItem(storageKey);
    } else {
      // Explicitly set theme based on mode
      document.documentElement.classList.toggle('dark', mode === 'dark');
      localStorage.setItem(storageKey, mode);
    }
    
    // Update any theme toggle visual indicator if exists
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
    }
  }
  
  // Check for saved preference
  const savedTheme = localStorage.getItem(storageKey) as 'dark' | 'light' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Initialize theme based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.classList.add('dark'); 
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  }
  
  // Set up theme toggle button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      // Check current state to determine what to switch to
      const isDark = document.documentElement.classList.contains('dark');
      // Toggle to opposite theme
      setTheme(isDark ? 'light' : 'dark');
    });
    
    // Set initial button state
    const isDark = document.documentElement.classList.contains('dark');
    themeToggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only apply system preference if user hasn't explicitly set a preference
    if (!localStorage.getItem(storageKey)) {
      document.documentElement.classList.toggle('dark', e.matches);
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
  
  // Initialize the router
  const router = new Router({
    root: appContainer,
    mode: 'history',
    transitionDuration: 150
  });
  
  // Create home page component using proper component architecture
  
  // Create a home page component using proper component architecture and JSX
  const HomePage = {
    render: () => {
      // Using JSX syntax with the createElement and Fragment imported from 0x1
      const jsxElement = (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
              Welcome to 0x1
            </h1>
            
            <p className="text-xl mb-8 text-gray-800 dark:text-gray-200">
              The lightning-fast web framework powered by Bun
            </p>
            
            <Counter 
              initialValue={0}
              minValue={-10}
              maxValue={10}
              label="Try out this interactive counter component!"
            />
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Edit <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-800 dark:text-gray-200">
                index.tsx
              </code> to customize this page
            </p>
            
            <div className="flex justify-center gap-4">
              <a 
                href="https://github.com/Triex/0x1" 
                target="_blank" 
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                GitHub
              </a>
              <a 
                href="https://bun.sh" 
                target="_blank" 
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Bun Docs
              </a>
            </div>
          </div>
        </div>
      );
      
      return jsxElement;
    }
  };
  
  // Add routes
  router.addRoute('/', HomePage);
  
  // Trigger initial route
  router.navigate(window.location.pathname);
  
  console.log('0x1 Minimal App started!');
});
