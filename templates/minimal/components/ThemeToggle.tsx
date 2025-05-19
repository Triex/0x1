/**
 * Theme Toggle Component
 * Toggles between light and dark mode
 */

import { createElement, Fragment } from '0x1';

export function ThemeToggle() {
  // This will be processed by the framework at runtime
  // using a client-side hydration approach similar to React
  
  // Toggle theme function - will be attached to onClick
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newMode = isDark ? 'light' : 'dark';
    
    // Toggle dark class on html element
    document.documentElement.classList.toggle('dark', newMode === 'dark');
    
    // Save user preference
    localStorage.setItem('0x1-dark-mode', newMode);
  }
  
  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="px-3 py-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-md transition-colors"
      aria-label="Toggle dark mode"
    >
      Toggle Theme
    </button>
  );
}
