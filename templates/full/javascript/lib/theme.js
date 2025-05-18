/**
 * Theme management with simple store implementation
 * Demonstrates state management capabilities in 0x1
 */

// Simple store implementation for theme management
function createStore(initialState, options = {}) {
  let state = { ...initialState };
  const listeners = [];
  
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
    setState: (newState) => {
      state = { ...state, ...newState };
      
      // Save to localStorage if persist is enabled
      if (options?.persist && options?.storageKey && typeof window !== 'undefined') {
        localStorage.setItem(options.storageKey, JSON.stringify(state));
      }
      
      // Notify listeners
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener) => {
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

// Create a theme store with persistence
const themeStore = createStore({ 
  current: 'light' 
}, {
  persist: true,
  storageKey: '0x1-theme-preference'
});

// Initialize theme from system or saved preference
const initializeTheme = () => {
  // Check if we have a saved theme preference
  const savedTheme = localStorage.getItem('0x1-theme-preference');
  
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      if (parsed.current === 'dark' || parsed.current === 'light') {
        themeStore.setState({ current: parsed.current });
      }
    } catch (e) {
      console.error('Error parsing saved theme:', e);
    }
  } else {
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    themeStore.setState({ current: prefersDark ? 'dark' : 'light' });
  }
  
  // Apply theme to HTML element
  applyTheme(themeStore.getState().current);
};

// Apply theme to document
const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Toggle theme
const toggleTheme = () => {
  const currentTheme = themeStore.getState().current;
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  themeStore.setState({ current: newTheme });
  applyTheme(newTheme);
};

// Hook for using theme in components
export function useTheme() {
  const theme = themeStore.getState().current;
  
  // Initialize on first load
  if (typeof window !== 'undefined' && !themeStore.getState().current) {
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
