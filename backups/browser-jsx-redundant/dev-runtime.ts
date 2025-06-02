/**
 * 0x1 Framework JSX Development Runtime (Browser)
 * Development JSX runtime with enhanced debugging and hot reload support
 */

// Re-export everything from the main JSX runtime
export * from '../../jsx/runtime';

// Development-specific enhancements
if (typeof window !== 'undefined') {
  // Set up global JSX functions for browser compatibility
  const { jsx, jsxs, jsxDEV, createElement, Fragment } = await import('../../jsx/runtime');
  
  // Enhanced development logging
  console.log('[0x1 JSX Dev] Development runtime loaded');
  
  // Make JSX functions globally available with dev logging
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
  
  // Development utilities
  (window as any).__0x1_dev = {
    version: '0.1.0',
    runtime: 'jsx-dev',
    refresh: () => {
      console.log('[0x1 JSX Dev] Refreshing components...');
      window.location.reload();
    }
  };
} 