/**
 * 0x1 Framework JSX Runtime (Browser)
 * Production-ready JSX runtime for browser environments
 */

// Re-export everything from the main JSX runtime
export * from '../../jsx/runtime';

// Ensure browser-specific initialization
if (typeof window !== 'undefined') {
  // Set up global JSX functions for browser compatibility
  const { jsx, jsxs, jsxDEV, createElement, Fragment } = await import('../../jsx/runtime');
  
  // Make JSX functions globally available
  (window as any).jsx = jsx;
  (window as any).jsxs = jsxs;
  (window as any).jsxDEV = jsxDEV;
  (window as any).createElement = createElement;
  (window as any).Fragment = Fragment;
  
  // React compatibility
  (window as any).React = {
    createElement,
    Fragment,
    jsx,
    jsxs
  };
} 