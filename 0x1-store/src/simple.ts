/**
 * Simple Store API - Easy setState/getState pattern
 */

export interface SimpleStore<T> {
  getState(): T;
  setState(updater: Partial<T> | ((state: T) => Partial<T>)): void;
  subscribe(callback: (state: T) => void): () => void;
  reset(): void;
}

export function createSimpleStore<T extends Record<string, any>>(
  initialState: T,
  options: {
    persist?: boolean;
    key?: string;
  } = {}
): SimpleStore<T> {
  const { persist = false, key = 'store' } = options;
  
  // Load persisted state if enabled
  let state: T = initialState;
  if (persist && typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        state = { ...initialState, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load persisted state:', e);
    }
  }
  
  const listeners = new Set<(state: T) => void>();
  
  const saveState = () => {
    if (persist && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to persist state:', e);
      }
    }
  };
  
  return {
    getState: () => state,
    
    setState: (updater) => {
      const newState = typeof updater === 'function' 
        ? { ...state, ...updater(state) }
        : { ...state, ...updater };
        
      state = newState;
      saveState();
      listeners.forEach(callback => callback(state));
    },
    
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    
    reset: () => {
      state = initialState;
      saveState();
      listeners.forEach(callback => callback(state));
    }
  };
} 