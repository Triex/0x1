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
  // Check if we have a saved theme preference
  const savedTheme = localStorage.getItem('0x1-dark-mode');
  let initialTheme: Theme;
  
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      if (parsed.current === 'dark' || parsed.current === 'light') {
        initialTheme = parsed.current;
      } else {
        // If saved theme is invalid, use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
      }
    } catch (e) {
      console.error('Error parsing saved theme:', e);
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      initialTheme = prefersDark ? 'dark' : 'light';
    }
  } else {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    initialTheme = prefersDark ? 'dark' : 'light';
  }
  
  // Update store
  themeStore.setState({ current: initialTheme });
  
  // Apply theme to HTML element
  applyTheme(initialTheme);
  
  // Update theme toggle button
  updateThemeToggleButton(initialTheme);
  
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
  const currentTheme = themeStore.getState().current;
  const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
  
  // Log for debugging
  console.log(`Toggling theme from ${currentTheme} to ${newTheme}`);
  
  themeStore.setState({ current: newTheme });
  applyTheme(newTheme);
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
    if (typeof window['__0x1_cleanup'] === 'undefined') {
      window['__0x1_cleanup'] = [];
    }
    window['__0x1_cleanup'].push(cleanup);
  }
  
  return { 
    theme: themeStore.getState().current,
    toggleTheme 
  };
}
