/**
 * 0x1 Framework React Compatibility Shim (Generated)
 * Delegates to main hooks system for consistency
 */

// Import main hooks (will be available when this loads)
import {
  clearComponentContext,
  getAllComponentStats,
  getComponentStats,
  isComponentMounted,
  setComponentContext,
  unmountComponent,
  useCallback,
  useClickOutside,
  useEffect,
  useFetch,
  useForm,
  useLocalStorage,
  useMemo,
  useRef,
  useState
} from '../core/hooks.js';

// Fragment implementation - use standardized React 19 symbol
export const Fragment = Symbol.for('react.fragment');

// Re-export all hooks from main system
export {
  clearComponentContext, getAllComponentStats, getComponentStats, isComponentMounted, setComponentContext, unmountComponent, useCallback, useClickOutside, useEffect, useFetch,
  useForm,
  useLocalStorage, useMemo, useRef, useState
};

// Enhanced createElement that sets up hooks context
export function createElement(type, props, ...children) {
  if (typeof type === 'function') {
    // Set up hooks context for the component
    const componentId = `${type.name || 'Anonymous'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setComponentContext(componentId, () => {
      console.debug(`[0x1 Hooks] Component ${componentId} requested update`);
    });
    
    try {
      // Call the component function with hooks context set
      const result = type(props || {});
      return result;
    } finally {
      // Always clear context after component execution
      clearComponentContext();
    }
  }
  
  return {
    type,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children
    }
  };
}

// JSX runtime functions
export const jsx = createElement;
export const jsxs = createElement;
export const jsxDEV = createElement;

// Suspense placeholder
export function Suspense({ children, _fallback }) {
  return children;
}

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
  createElement,
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  jsx,
  jsxs,
  jsxDEV,
  Suspense,
  StrictMode,
  ErrorBoundary,
  setComponentContext,
  clearComponentContext
};

// Set up global Fragment handling
if (typeof window !== 'undefined') {
  window.Fragment = Fragment;
  window.React = window.React || {};
  window.React.Fragment = Fragment;
  
  // Pre-define common Fragment variable names that Bun might generate
  const commonFragmentNames = [
    'Fragment_default',
    'Fragment_1',
    'Fragment_2', 
    'Fragment_3',
    'Fragment_4',
    'Fragment_5'
  ];
  
  commonFragmentNames.forEach(name => {
    if (!window[name]) {
      window[name] = Fragment;
    }
  });
  
  console.log('[0x1] React shim initialized with main hooks system delegation');
}