/**
 * 0x1 Store - Complete state management solution
 * 
 * Provides both simple and advanced store APIs:
 * - Simple: Easy setState/getState pattern for quick prototyping
 * - Advanced: Redux-like with reducers, actions, middleware for complex apps
 */

// Export simple store API (default for most use cases)
export * from './simple.js';

// Export advanced store API
export * from './advanced.js';

// Re-export types
export type { Action, AdvancedStore } from './advanced.js';
export type { SimpleStore } from './simple.js';

// Convenience aliases for backward compatibility
export { createAdvancedStore as createReduxStore } from './advanced.js';
export { createSimpleStore } from './simple.js';

// Export the advanced store as the main createStore for compatibility with existing code
export { createAdvancedStore as createStore } from './advanced.js';

