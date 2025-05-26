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
    cleanupFunctions: new Map(),
    effectIndex: 0,
    
    // Memo tracking for useMemo hook
    memos: new Map(),
    memoIndex: 0,
    
    // Ref tracking for useRef hook
    refs: new Map(),
    refIndex: 0,
    
    // Component re-rendering system
    componentInstances: new Map(),
    renderQueue: new Set(),
    updateTimer: null,
    
    // Force update mechanism
    forceUpdate() {
      console.log('[0x1 Hooks] Force update triggered, queue size:', this.renderQueue.size);
      // Re-render all components in the render queue
      this.renderQueue.forEach(componentId => {
        const instance = this.componentInstances.get(componentId);
        if (instance && instance.rerender) {
          try {
            console.log('[0x1 Hooks] Re-rendering component:', componentId);
            instance.rerender();
          } catch (error) {
            console.error('Error re-rendering component:', componentId, error);
          }
        }
      });
      this.renderQueue.clear();
    },
    
    // Register a component for re-rendering
    registerComponent(componentId, rerenderFn) {
      console.log('[0x1 Hooks] Registering component:', componentId);
      this.componentInstances.set(componentId, { rerender: rerenderFn });
    },
    
    // Queue a component for re-rendering
    queueUpdate(componentId) {
      console.log('[0x1 Hooks] Queueing update for component:', componentId);
      this.renderQueue.add(componentId);
      // Debounce updates
      if (!this.updateTimer) {
        this.updateTimer = setTimeout(() => {
          this.forceUpdate();
          this.updateTimer = null;
        }, 0);
      }
    }
  };
  
  // Global update trigger function
  window.__0x1_triggerUpdate = () => {
    console.log('[0x1] Trigger update called');
    if (window.__0x1_hooks.forceUpdate) {
      window.__0x1_hooks.forceUpdate();
    }
  };
}

// React Hooks implementation for browser runtime
const getHooks = () => {
  if (typeof window === 'undefined') return null;
  return window.__0x1_hooks;
};

// Fragment implementation - make it more robust
export const Fragment = Symbol.for('React.Fragment');

// Enhanced useState implementation with proper re-rendering
export const useState = (initialState) => {
  const hooks = getHooks();
  if (!hooks) {
    let state = typeof initialState === 'function' ? initialState() : initialState;
    return [state, (newState) => { state = newState; }];
  }
  
  const component = hooks.currentComponent || 'global';
  const index = hooks.stateIndex++;
  const key = `${component}-${index}`;
  
  // Initialize state if not exists
  if (!hooks.states.has(key)) {
    const initialValue = typeof initialState === 'function' ? initialState() : initialState;
    hooks.states.set(key, initialValue);
    console.log('[0x1 useState] Initialized state for key:', key, 'value:', initialValue);
  }
  
  const state = hooks.states.get(key);
  console.log('[0x1 useState] Hook called for component:', component, 'index:', index - 1, 'current state:', state);
  
  const setState = (newState) => {
    const currentState = hooks.states.get(key);
    const nextState = typeof newState === 'function' ? newState(currentState) : newState;
    
    console.log('[0x1 useState] setState called for key:', key, 'current:', currentState, 'next:', nextState);
    
    // Only update if state has changed
    if (nextState !== currentState) {
      hooks.states.set(key, nextState);
      console.log('[0x1 useState] State updated, triggering re-render');
      
      // Queue the component for re-rendering
      hooks.queueUpdate(component);
    } else {
      console.log('[0x1 useState] State unchanged, skipping update');
    }
  };
  
  return [state, setState];
};

// useEffect implementation
export const useEffect = (effect, deps) => {
  const hooks = getHooks();
  if (!hooks) return;
  
  const component = hooks.currentComponent || 'global';
  const index = hooks.effectIndex++;
  const key = `${component}-${index}`;
  
  console.log('[0x1 useEffect] Hook called for component:', component, 'index:', index);
  
  // Get previous dependencies
  const prevDeps = hooks.effects.get(key);
  
  // Check if dependencies changed
  const depsChanged = !prevDeps || 
    !deps || 
    deps.length !== prevDeps.length || 
    deps.some((dep, i) => dep !== prevDeps[i]);
  
  if (depsChanged) {
    console.log('[0x1 useEffect] Dependencies changed, running effect');
    
    // Store new dependencies
    hooks.effects.set(key, deps);
    
    // Clean up previous effect
    const cleanup = hooks.cleanupFunctions.get(key);
    if (cleanup) {
      cleanup();
    }
    
    // Run effect asynchronously
    setTimeout(() => {
      try {
        const newCleanup = effect();
        if (typeof newCleanup === 'function') {
          hooks.cleanupFunctions.set(key, newCleanup);
        }
      } catch (error) {
        console.error('[0x1 useEffect] Error in effect:', error);
      }
    }, 0);
  }
};

// useMemo implementation
export const useMemo = (factory, deps) => {
  const hooks = getHooks();
  if (!hooks) {
    return factory();
  }
  
  const component = hooks.currentComponent || 'global';
  const index = hooks.memoIndex++;
  const key = `${component}-${index}`;
  
  // Get previous memo
  const prevMemo = hooks.memos.get(key);
  
  // Check if dependencies changed
  const depsChanged = !prevMemo || 
    !deps || 
    deps.length !== prevMemo.deps.length || 
    deps.some((dep, i) => dep !== prevMemo.deps[i]);
  
  if (depsChanged) {
    const value = factory();
    hooks.memos.set(key, { value, deps });
    return value;
  }
  
  return prevMemo.value;
};

// useCallback implementation
export const useCallback = (callback, deps) => {
  return useMemo(() => callback, deps);
};

// useRef implementation
export const useRef = (initialValue) => {
  const hooks = getHooks();
  if (!hooks) {
    return { current: initialValue };
  }
  
  const component = hooks.currentComponent || 'global';
  const index = hooks.refIndex++;
  const key = `${component}-${index}`;
  
  if (!hooks.refs.has(key)) {
    hooks.refs.set(key, { current: initialValue });
  }
  
  return hooks.refs.get(key);
};

// createElement implementation for JSX
export const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children
    }
  };
};

// JSX runtime functions
export const jsx = createElement;
export const jsxs = createElement;
export const jsxDEV = createElement;

// Suspense placeholder
export const Suspense = ({ children, fallback }) => {
  return children;
};

// StrictMode placeholder
export const StrictMode = ({ children }) => {
  return children;
};

// Basic ErrorBoundary
export class ErrorBoundary {
  constructor(props) {
    this.props = props;
  }
  
  render() {
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

// Set up global Fragment handling
if (typeof window !== 'undefined') {
  window.Fragment = Fragment;
  window.React = window.React || {};
  window.React.Fragment = Fragment;
  
  // Pre-populate common mangled Fragment names
  const commonFragmentNames = [
    'Fragment_8vg9x3sq', 'Fragment_7x81h0kn', 'Fragment_1a2b3c4d', 
    'Fragment_x1y2z3a4', 'Fragment_abc123', 'Fragment_def456', 
    'Fragment_ghi789', 'Fragment_9z8y7x6w', 'Fragment_m5n6o7p8'
  ];
  
  commonFragmentNames.forEach(name => {
    if (!window[name]) {
      window[name] = Fragment;
    }
  });
  
  // Set up error handler for undefined Fragment variables
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('is not defined') && event.message.includes('Fragment')) {
      const match = event.message.match(/(Fragment_[a-zA-Z0-9]+) is not defined/);
      if (match) {
        window[match[1]] = Fragment;
        console.log('[0x1] Auto-resolved Fragment variable:', match[1]);
        event.preventDefault();
        return false;
      }
    }
  });
  
  console.log('[0x1] React shim initialized with enhanced component re-rendering');
}
