/**
 * Browser-specific JSX Development Runtime
 * Provides enhanced debugging capabilities for development environments
 */

// Export symbols that match React 19's JSX development runtime
export const REACT_ELEMENT = Symbol.for('react.element');
export const REACT_FRAGMENT = Symbol.for('react.fragment');
export const REACT_SERVER_COMPONENT = Symbol.for('react.server.component');

// Re-export Fragment from the runtime
import { createErrorBoundary, Fragment, renderToDOM } from './runtime';
export { createErrorBoundary, Fragment, renderToDOM };

// Component stack tracking for enhanced error reporting
const componentStack: string[] = [];

// Error boundary info interface
export interface ErrorInfo {
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
  type: any, 
  props: any, 
  key?: string,
  isStaticChildren?: boolean,
  source?: any,
  self?: any
) {
  // Enhanced development logging
  if (typeof window !== 'undefined' && window.location?.search?.includes('debug')) {
    console.debug('[JSX DEV]', { type, props, key, source });
  }

  // Add source information for better debugging
  const propsWithSource = props ? { ...props } : {};
  
  if (source && typeof window !== 'undefined') {
    propsWithSource.__source = source;
  }
  
  if (self !== undefined && typeof propsWithSource === 'object') {
    propsWithSource.__self = self;
  }
  
  // Basic JSX node structure with better type handling
  return {
    type,
    props: propsWithSource,
    children: Array.isArray(propsWithSource.children) 
      ? propsWithSource.children 
      : (propsWithSource.children !== undefined ? [propsWithSource.children] : []),
    key: key || null
  };
}

/**
 * JSX Factory function for static children
 */
export function jsxs(type: any, props: any, key?: string) {
  return jsxDEV(type, props, key, true);
}

/**
 * JSX Factory function for dynamic children
 */
export function jsx(type: any, props: any, key?: string) {
  return jsxDEV(type, props, key, false);
}

/**
 * Initialize the dev runtime
 */
export function initDevRuntime() {
  if (typeof window !== 'undefined') {
    // Set up global error handling for development mode
    window.addEventListener('error', (event) => {
      console.warn('[0x1 Dev Runtime] Caught error:', event.error);
      // Enhanced error reporting in development
      if (event.error?.stack) {
        console.groupCollapsed('[0x1] Error Stack Trace');
        console.error(event.error.stack);
        console.groupEnd();
      }
    });
    
    // Also handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.warn('[0x1 Dev Runtime] Unhandled promise rejection:', event.reason);
    });
    
    console.debug('[0x1] Development JSX runtime initialized');
  }
}


// OLD REF: 

// /**
//  * JSX Dev Runtime for 0x1 Framework
//  * 
//  * A minimal, high-performance implementation aligned with React 19 and Next.js 15.
//  * Provides enhanced debugging capabilities while maintaining compatibility.
//  */

// // Import types from jsx-runtime to maintain consistency
// import type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode } from './jsx-runtime';
// import { Fragment, createElement } from './jsx-runtime';

// // Import and re-export from browser implementation
// import * as BrowserJsxDev from './browser/jsx/dev-runtime';

// // Re-export everything from the browser implementation
// export {
//   jsx, jsxs, jsxDEV, createErrorBoundary,
//   REACT_ELEMENT, REACT_FRAGMENT, REACT_SERVER_COMPONENT
// } from './browser/jsx/dev-runtime';

// // Re-export from core jsx-runtime
// export { Fragment, createElement };

// // Export types
// export type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode };

// // Enhanced component function type with React 19 properties
// export type EnhancedComponentFunction = ComponentFunction & {
//   displayName?: string;
//   $$typeof?: symbol;
// };

// // Define React Element type for React 19 compatibility
// export type ReactElement = JSXNode & {
//   $$typeof: symbol;
//   key: string | null;
//   ref: any;
//   _owner: any;
//   [key: string]: any;
// };

// // Re-export error info type
// export type { ErrorInfo } from './browser/jsx/dev-runtime';

// // Initialize browser runtime if in browser environment
// if (typeof window !== 'undefined') {
//   BrowserJsxDev.initDevRuntime();
// }