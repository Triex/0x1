/**
 * 0x1 Framework React Compatibility Shim
 * 
 * This file provides compatibility with React imports in the browser
 * It allows components to import from 'react' and have it work correctly.
 * Implements a minimal subset of React APIs to enable basic component functionality.
 * 
 * IMPORTANT: This module serves as both:
 * 1. A React compatibility layer for components importing from 'react'
 * 2. The main 0x1 module for components importing from '0x1'
 */

// Initialize runtime hooks if running in browser
if (typeof window !== 'undefined') {
  window.__0x1_hooks = window.__0x1_hooks || {
    // Simple state tracking for useState hook
    states: new Map(),
    stateIndex: 0,
    currentComponent: null,
    
    // Effect tracking for useEffect hook
    effects: new Map(),
    effectIndex: 0,
    
    // Cleanup function for component unmount
    cleanupFunctions: new Map()
  };
}

// React Hooks implementation for browser runtime
const getHooks = () => {
  if (typeof window === 'undefined') return null;
  return window.__0x1_hooks;
};

// Core React-compatible exports
export const createElement = (type, props, ...children) => {
  return { type, props: props || {}, children };
};

export const Fragment = Symbol('Fragment');

// useState implementation
export const useState = (initialState) => {
  const hooks = getHooks();
  if (!hooks) return [initialState, () => {}];
  
  const component = hooks.currentComponent;
  const index = hooks.stateIndex++;
  const key = `${component}-${index}`;
  
  if (!hooks.states.has(key)) {
    const initialValue = typeof initialState === 'function' ? initialState() : initialState;
    hooks.states.set(key, initialValue);
  }
  
  const state = hooks.states.get(key);
  
  const setState = (newState) => {
    const currentState = hooks.states.get(key);
    const nextState = typeof newState === 'function' ? newState(currentState) : newState;
    
    // Only update if state has changed
    if (nextState !== currentState) {
      hooks.states.set(key, nextState);
      // Trigger re-render if we have that capability
      if (window.__0x1_triggerUpdate) {
        window.__0x1_triggerUpdate();
      }
    }
  };
  
  return [state, setState];
};

// useEffect implementation
export const useEffect = (effect, deps) => {
  const hooks = getHooks();
  if (!hooks) {
    try { effect(); } catch (e) { console.error('Error in useEffect:', e); }
    return;
  }
  
  const component = hooks.currentComponent;
  const index = hooks.effectIndex++;
  const key = `${component}-${index}`;
  
  const prevDeps = hooks.effects.get(key)?.deps;
  
  // Check if deps have changed
  const depsChanged = !prevDeps || !deps || 
    deps.length !== prevDeps.length || 
    deps.some((dep, i) => dep !== prevDeps[i]);
  
  if (depsChanged) {
    // Run cleanup function if it exists
    if (hooks.cleanupFunctions.has(key)) {
      try {
        hooks.cleanupFunctions.get(key)();
      } catch (e) {
        console.error('Error in useEffect cleanup:', e);
      }
    }
    
    // Run effect and store cleanup
    try {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        hooks.cleanupFunctions.set(key, cleanup);
      }
    } catch (e) {
      console.error('Error in useEffect:', e);
    }
    
    // Store deps for next comparison
    hooks.effects.set(key, { deps });
  }
};

// Additional hooks for better compatibility
export const useCallback = (callback, deps) => {
  // Simple implementation just returns the callback
  return callback;
};

export const useMemo = (factory, deps) => {
  const hooks = getHooks();
  if (!hooks) return factory();
  
  const component = hooks.currentComponent;
  const index = hooks.memoIndex = (hooks.memoIndex || 0) + 1;
  const key = `memo-${component}-${index}`;
  
  const cached = hooks.memos = hooks.memos || new Map();
  const prevDeps = cached.get(key)?.deps;
  
  // Check if deps have changed
  const depsChanged = !prevDeps || !deps || 
    deps.length !== prevDeps.length || 
    deps.some((dep, i) => dep !== prevDeps[i]);
  
  if (depsChanged) {
    const value = factory();
    cached.set(key, { value, deps });
    return value;
  }
  
  return cached.get(key).value;
};

export const useRef = (initialValue) => {
  const hooks = getHooks();
  if (!hooks) return { current: initialValue };
  
  const component = hooks.currentComponent;
  const index = hooks.refIndex = (hooks.refIndex || 0) + 1;
  const key = `ref-${component}-${index}`;
  
  const refs = hooks.refs = hooks.refs || new Map();
  
  if (!refs.has(key)) {
    refs.set(key, { current: initialValue });
  }
  
  return refs.get(key);
};

// JSX runtime exports
export const jsx = (type, props, key, source, self) => {
  return { type, props: props || {}, key, source, self };
};

export const jsxs = jsx; // Same implementation for static children
export const jsxDEV = jsx; // Same implementation for development mode

// Export common components
export const Suspense = ({ children, fallback }) => {
  return { type: 'div', props: { className: '0x1-suspense' }, children: [children] };
};

export const StrictMode = ({ children }) => {
  return { type: 'div', props: { className: '0x1-strict-mode' }, children: [children] };
};

// Create and export a proper Error Boundary component
export class ErrorBoundary {
  constructor(props) {
    this.state = { hasError: false, error: null };
    this.props = props || {};
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      
      return {
        type: 'div',
        props: { 
          className: '0x1-error-boundary bg-red-50 border border-red-200 rounded p-4 text-red-800',
          style: 'position: fixed; bottom: 20px; left: 20px; z-index: 9999;'
        },
        children: [
          { type: 'h3', props: { className: 'text-lg font-semibold' }, children: ['Error:'] },
          { type: 'p', props: {}, children: [String(this.state.error)] }
        ]
      };
    }
    
    return this.props.children;
  }
}

// Default export for compatibility
export default {
  // Core
  createElement,
  Fragment,
  
  // Hooks
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  
  // JSX
  jsx,
  jsxs,
  jsxDEV,
  
  // Components
  Suspense,
  StrictMode,
  ErrorBoundary
};
