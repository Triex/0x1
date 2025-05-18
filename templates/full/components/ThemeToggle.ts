/**
 * Theme toggle component for switching between light and dark mode
 */

import type { Store } from '../store';

interface ThemeToggleProps {
  store: Store;
}

export function ThemeToggle({ store }: ThemeToggleProps): HTMLElement {
  const toggle = document.createElement('button');
  toggle.className = 'fixed bottom-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 shadow-lg z-50 transition-colors duration-300';
  toggle.setAttribute('aria-label', 'Toggle dark mode');
  toggle.title = 'Toggle dark mode';
  
  // Initial icon based on current theme
  updateIcon();
  
  toggle.addEventListener('click', () => {
    store.toggleTheme();
    updateIcon();
  });
  
  // Subscribe to store changes
  store.subscribe(() => {
    updateIcon();
  });
  
  function updateIcon() {
    const isDark = store.state.theme === 'dark';
    
    toggle.innerHTML = isDark 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-300"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }
  
  return toggle;
}
