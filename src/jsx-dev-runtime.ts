/**
 * JSX Dev Runtime for 0x1 Framework
 * 
 * A minimal, high-performance implementation aligned with React 19 and Next.js 15.
 * Provides enhanced debugging capabilities while maintaining compatibility.
 */

// Import types from type definitions
/// <reference path="../types/jsx.d.ts" />
/// <reference path="../types/jsx-runtime.d.ts" />

// Import core functions and types
import type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode } from './jsx-runtime';
import { Fragment, createElement, jsx, jsxs } from './jsx-runtime';

// Re-export core functions and types
export { Fragment, createElement, jsx, jsxs };
export type { JSXAttributes, JSXChildren, JSXNode };

// React 19 and Next.js 15 symbol exports
export const REACT_ELEMENT = Symbol.for('react.element');
export const REACT_FRAGMENT = Symbol.for('react.fragment');
export const REACT_SERVER_COMPONENT = Symbol.for('react.server.component');

// Enhanced component function type with React 19 properties
type EnhancedComponentFunction = ComponentFunction & {
  displayName?: string;
  $$typeof?: symbol;
};

// Define React Element type for React 19 compatibility
type ReactElement = {
  $$typeof: symbol;
  type: string | EnhancedComponentFunction | object;
  key: string | null;
  ref: any;
  props: Record<string, any>;
  _owner: any;
  [key: string]: any;
};

// Component stack tracking for enhanced error reporting
const componentStack: string[] = [];

// Error boundary info interface
interface ErrorInfo {
  componentStack: string;
  source?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
}

/**
 * Development mode JSX transformation function
 * Matches React 19's implementation with enhanced error handling
 */
export function jsxDEV(
  type: string | EnhancedComponentFunction,
  props: JSXAttributes | null,
  key: string | null = null,
  isStaticChildren = false,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  self?: any
): ReactElement {
  // Fast path for HTML elements
  if (typeof type === 'string') {
    return {
      $$typeof: REACT_ELEMENT,
      type,
      key,
      ref: null,
      props: props || {},
      _owner: null
    };
  }

  // Type guard for server components
  const isServerComponent = 
    typeof type === 'object' && 
    type !== null && 
    '$$typeof' in type && 
    (type as any).$$typeof === REACT_SERVER_COMPONENT;
  
  // Track component for error reporting
  const typeName = typeof type === 'function' 
    ? (type.displayName || type.name || 'Component') 
    : (isServerComponent ? 'ServerComponent' : 'Unknown');
  componentStack.push(typeName);

  try {
    // Ensure key is string or undefined (not null) for jsx function
    const keyParam = key === null ? undefined : key;
    
    // Call jsx with the correct component function type
    const jsxResult = jsx(type as ComponentFunction, props || {}, keyParam);
    
    componentStack.pop();
    
    // Create a valid ReactElement to return with proper types
    const reactElement: ReactElement = {
      $$typeof: REACT_ELEMENT,
      type: typeof jsxResult === 'object' && jsxResult !== null && 'type' in jsxResult 
            ? jsxResult.type 
            : typeof type === 'string' ? type : 'div',
      key: key,
      ref: null,
      props: typeof jsxResult === 'object' && jsxResult !== null && 'props' in jsxResult 
            ? jsxResult.props 
            : props || {},
      _owner: null
    };
    
    // Add source info for debugging
    if (source) {
      Object.defineProperty(reactElement, '_source', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
    }
    
    return reactElement;
  } catch (error) {
    // Create error trace
    const componentStackTrace = [...componentStack].reverse().join(' > ');
    componentStack.pop();
    
    // Log detailed error information
    console.error(`[0x1] Error in component: ${typeName}`);
    console.error(`[0x1] Component stack: ${componentStackTrace}`);
    
    if (source) {
      console.error(`[0x1] Source: ${source.fileName}:${source.lineNumber}:${source.columnNumber}`);
    }
    
    // Return a valid ReactElement with error UI
    return {
      $$typeof: REACT_ELEMENT,
      type: 'div',
      key: null,
      ref: null,
      props: {
        className: '0x1-error-boundary',
        style: `
          color: #dc2626; 
          background: rgba(254, 226, 226, 0.9);
          padding: 0.75rem;
          border-radius: 0.375rem;
          border-left: 4px solid #dc2626;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          margin: 0.5rem 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `,
        children: [
          createElement('div', {
            style: 'font-weight: 600; font-size: 0.875rem; margin-bottom: 0.5rem;'
          }, `🚫 Error in <${typeName}>`),
          createElement('pre', {
            style: 'margin: 0.5rem 0; font-size: 0.75rem; overflow-x: auto; padding: 0.5rem; background: rgba(0,0,0,0.05); border-radius: 0.25rem;'
          }, error instanceof Error ? error.message : String(error)),
          createElement('details', {
            style: 'font-size: 0.75rem; margin-top: 0.5rem;'
          }, 
            createElement('summary', {style: 'cursor: pointer; opacity: 0.8;'}, 'Component Stack'),
            createElement('div', {style: 'padding: 0.5rem; white-space: pre-wrap;'}, componentStackTrace)
          )
        ]
      },
      _owner: null
    };
  }
}

/**
 * Create a reusable error boundary component
 */
export function createErrorBoundary(fallback: (error: Error, info: ErrorInfo) => ReactElement) {
  return function ErrorBoundary(props: { children?: any }): ReactElement {
    try {
      if (!props.children) {
        return {
          $$typeof: REACT_ELEMENT,
          type: 'div',
          key: null,
          ref: null,
          props: {},
          _owner: null
        };
      }
      
      return {
        $$typeof: REACT_ELEMENT,
        type: 'div',
        key: null,
        ref: null,
        props: { 
          className: '0x1-boundary',
          children: props.children 
        },
        _owner: null
      };
    } catch (error) {
      return fallback(
        error instanceof Error ? error : new Error(String(error)), 
        { componentStack: componentStack.join(' > ') }
      );
    }
  };
}