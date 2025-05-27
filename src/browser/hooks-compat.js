/**
 * Browser hooks compatibility layer
 * Ensures hooks work in browser context with proper module resolution
 */

// This will be replaced with actual hooks import during build
let hooksModule = null;

// Try to load hooks dynamically
async function loadHooks() {
  if (hooksModule) return hooksModule;
  
  try {
    // Try different import paths based on context
    const possiblePaths = [
      './core/hooks.js',
      '/0x1/core/hooks.js',
      '../core/hooks.js'
    ];
    
    for (const path of possiblePaths) {
      try {
        hooksModule = await import(path);
        console.log(`[0x1] Hooks loaded from: ${path}`);
        return hooksModule;
      } catch (e) {
        // Continue to next path
      }
    }
    
    throw new Error('Could not load hooks from any path');
  } catch (error) {
    console.error('[0x1] Failed to load hooks:', error);
    return null;
  }
}

// Initialize hooks on module load
loadHooks();

// Export proxy functions that delegate to loaded hooks
export const useState = (...args) => {
  if (!hooksModule) throw new Error('[0x1] Hooks not loaded');
  return hooksModule.useState(...args);
};

export const useEffect = (...args) => {
  if (!hooksModule) throw new Error('[0x1] Hooks not loaded');
  return hooksModule.useEffect(...args);
};

// ... export other hooks similarly ...

export default {
  useState,
  useEffect,
  // ... other hooks
}; 