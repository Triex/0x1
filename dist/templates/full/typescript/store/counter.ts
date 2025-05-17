/**
 * Counter store example using a simple store implementation
 * Demonstrates simple state management in 0x1
 */

// Simple store implementation
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

// Initialize counter store
export const counterStore = createStore({
  count: 0
}, {
  persist: true,
  storageKey: '0x1-counter-demo'
});

// Increment counter
export function incrementCounter() {
  const { count } = counterStore.getState();
  counterStore.setState({ count: count + 1 });
}

// Decrement counter
export function decrementCounter() {
  const { count } = counterStore.getState();
  counterStore.setState({ count: count - 1 });
}

// Reset counter
export function resetCounter() {
  counterStore.setState({ count: 0 });
}

// Initialize event listeners
if (typeof window !== 'undefined') {
  // Event listeners for counter actions
  window.addEventListener('counter-increment', incrementCounter);
  window.addEventListener('counter-decrement', decrementCounter);
  window.addEventListener('counter-reset', resetCounter);
  
  // Clean up function
  const cleanup = () => {
    window.removeEventListener('counter-increment', incrementCounter);
    window.removeEventListener('counter-decrement', decrementCounter);
    window.removeEventListener('counter-reset', resetCounter);
  };
  
  // Add cleanup to global registry
  if (typeof window['__0x1_cleanup'] === 'undefined') {
    window['__0x1_cleanup'] = [];
  }
  window['__0x1_cleanup'].push(cleanup);
}
