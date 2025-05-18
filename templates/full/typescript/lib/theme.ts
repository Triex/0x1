/**
 * Theme management with simple store implementation
 * Demonstrates state management capabilities in 0x1
 */

// Simple store implementation for theme management
function createStore<T>(initialState: T, options?: { persist?: boolean; storageKey?: string }) {
  let state = { ...initialState };
  const listeners: ((state: T) => void)[] = [];
  
  // Load from localStorage if persist is enabled
  if (options?.persist && options?.storageKey && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(options.storageKey);
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load persisted state:', e);
    }
  }
  
  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState };
      
      // Save to localStorage if persist is enabled
      if (options?.persist && options?.storageKey && typeof window !== 'undefined') {
        localStorage.setItem(options.storageKey, JSON.stringify(state));
      }
      
      // Notify listeners
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener: (state: T) => void) => {
      listeners.push(listener);
      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };
}

type Theme = 'light' | 'dark';

// Create a theme store with persistence
const themeStore = createStore<{ current: Theme }>({ 
  current: 'light' 
}, {
  persist: true,
  storageKey: '0x1-dark-mode'
});

// Initialize theme from system or saved preference
const initializeTheme = (): void => {
  // Direct approach - check for saved preference or system preference
  const savedTheme = localStorage.getItem('0x1-dark-mode');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  console.log(`Initializing theme - saved: ${savedTheme}, system prefers dark: ${prefersDark}`);
  
  // Set initial dark mode based on saved preference or system preference
  // Skip parsing JSON and just check for the direct string value - simpler approach
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    // Set dark mode
    console.log('Setting initial theme to dark');
    document.documentElement.classList.add('dark');
    themeStore.setState({ current: 'dark' });
  } else if (savedTheme === 'light' || (savedTheme === null && !prefersDark)) {
    // Set light mode
    console.log('Setting initial theme to light');
    document.documentElement.classList.remove('dark');
    themeStore.setState({ current: 'light' });
  }
  
  // Note: We've already updated the store and applied the theme in the conditions above
  // Just update the theme toggle button based on current theme
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  updateThemeToggleButton(currentTheme as Theme);
  
  // Setup listener for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    // Only update if user hasn't set a preference
    if (!localStorage.getItem('0x1-dark-mode')) {
      const newTheme: Theme = e.matches ? 'dark' : 'light';
      themeStore.setState({ current: newTheme });
      applyTheme(newTheme);
      updateThemeToggleButton(newTheme);
    }
  });
};

// Apply theme to document
const applyTheme = (theme: Theme): void => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Update theme toggle button
const updateThemeToggleButton = (theme: Theme): void => {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Text content can be set if you want a text button instead of icon
    // themeToggle.textContent = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    
    // For accessibility
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }
};

// Toggle theme
const toggleTheme = (): void => {
  // Instead of relying on the store, directly check the DOM
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme: Theme = isDark ? 'light' : 'dark';
  
  // Log for debugging
  console.log(`Toggling theme from ${isDark ? 'dark' : 'light'} to ${newTheme}`);
  
  // Toggle dark class on the HTML element directly
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Save to localStorage directly
  localStorage.setItem('0x1-dark-mode', newTheme);
  
  // Update the store
  themeStore.setState({ current: newTheme });
  
  // Update the toggle button
  updateThemeToggleButton(newTheme);
  
  // Dispatch theme change event that other components can listen for
  window.dispatchEvent(new CustomEvent('0x1-theme-changed', { detail: { theme: newTheme } }));
};

// Hook for using theme in components
export function useTheme() {
  // Initialize on first load
  if (typeof window !== 'undefined') {
    initializeTheme();
  }
  
  // Listen for theme toggle events
  if (typeof window !== 'undefined') {
    window.addEventListener('theme-toggle', toggleTheme);
    
    // Clean up event listener
    const cleanup = () => {
      window.removeEventListener('theme-toggle', toggleTheme);
    };
    
    // Return cleanup function (conceptual, since 0x1 isn't React)
    // Define custom interface to allow indexing window with our custom property
    interface Window {
      __0x1_cleanup?: Array<() => void>;
    }
    
    // Now use the interface for proper typing
    const win = window as Window;
    if (!win.__0x1_cleanup) {
      win.__0x1_cleanup = [];
    }
    win.__0x1_cleanup.push(cleanup);
  }
  
  return { 
    theme: themeStore.getState().current,
    toggleTheme 
  };
}
