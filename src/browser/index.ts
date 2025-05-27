/**
 * 0x1 Framework Browser Utilities
 * 
 * Centralized entry point for browser-side utilities
 */

// Error boundary is loaded directly in the browser via script tag
// and exposes a global createErrorBoundary function

// Re-export hooks compatibility layer
export { default as HooksCompat } from './hooks-compat';

// Export React compatibility layer (dynamically loaded)
export const loadReactCompat = async () => {
  try {
    return await import('./compat/react-shim');
  } catch (error) {
    console.warn('[0x1] Could not load React compatibility layer:', error);
    return null;
  }
};

// Export browser-specific utilities
export const isBrowser = typeof window !== 'undefined';
export const isServer = !isBrowser;

// Document utilities
export const ready = (callback: () => void): void => {
  if (typeof document === 'undefined') return;
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(callback, 1);
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
};

// Export convenience method to load the runtime once DOM is ready
export const initBrowserRuntime = (): void => {
  ready(() => {
    console.log('[0x1] Initializing browser runtime...');
    // Register global error handlers - no need to import as it's loaded via script tag
    console.log('[0x1] Error boundary registered');
    // Initialize React compatibility if needed
    if (typeof window !== 'undefined' && 'React' in window) {
      loadReactCompat().then(() => {
        console.log('[0x1] React compatibility layer initialized');
      });
    }
  });
};
