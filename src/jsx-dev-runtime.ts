/**
 * JSX Dev Runtime for 0x1 Framework
 * This file provides the necessary exports for Bun's automatic JSX transform in development mode
 * with enhanced error boundaries and debugging support.
 */

// Import the core functions and types from the main 0x1 modules
import { jsx, jsxs, Fragment, createElement } from '0x1/jsx-runtime';
import type { JSXAttributes, JSXNode, JSXChildren } from '0x1';

// Re-export the core functions and types
export { Fragment, createElement };
export type { JSXAttributes, JSXNode, JSXChildren };

// Dev-only utility to track component rendering for better error reporting
const componentStack: string[] = [];

// Error boundary utilities
interface ErrorInfo {
  componentStack: string;
  jsxSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
}

/**
 * jsxDEV function for development mode
 * This matches the React JSX-dev-runtime signature with source info
 * This enhanced version includes error boundary and source tracking
 */
export function jsxDEV(
  type: string | ((props: JSXAttributes & { children?: JSXChildren }) => string | JSXNode),
  props: JSXAttributes | null,
  key?: string | null,
  _isStaticChildren?: boolean,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  _self?: any
): JSXNode {
  // Skip error boundaries for string-based elements (HTML tags)
  if (typeof type === 'string') {
    return jsx(type, props || {}, key || undefined);
  }

  // For component functions, add error boundaries in development mode
  const typeName = type.name || 'AnonymousComponent';
  componentStack.push(typeName);

  try {
    // Regular jsx rendering with the component function
    const result = jsx(type, props || {}, key || undefined);
    componentStack.pop(); // Remove from stack after successful render
    return result;
  } catch (error) {
    // Handle error with source information
    const componentStackTrace = [...componentStack].reverse().join(' > ');
    componentStack.pop(); // Clean up stack even on error
    
    console.error(`Error rendering component: ${typeName}`);
    console.error(`Component stack: ${componentStackTrace}`);
    
    if (source) {
      console.error(`Source: ${source.fileName}:${source.lineNumber}:${source.columnNumber}`);
    }
    
    if (error instanceof Error) {
      console.error(`${error.name}: ${error.message}`);
      console.error(error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    
    // Return an error boundary element instead of crashing
    return createElement('div', { 
      className: '0x1-error-boundary',
      style: 'color: red; background: #ffeeee; padding: 10px; border: 1px solid red; border-radius: 4px;'
    }, 
      createElement('h3', null, `Error in component: ${typeName}`),
      createElement('pre', { style: 'overflow: auto; max-height: 200px;' }, 
        error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      ),
      createElement('details', null, 
        createElement('summary', null, 'Component Stack'),
        createElement('pre', null, componentStackTrace)
      )
    );
  }
}

// Also export the regular jsx/jsxs functions
export { jsx, jsxs };

// Export error boundary utilities for advanced use cases
export function createErrorBoundary(fallback: (error: Error, errorInfo: ErrorInfo) => JSXNode) {
  return function ErrorBoundary(props: { children?: any }) {
    try {
      // Directly use createElement with the children as-is to avoid type issues
      if (!props.children) return createElement('div', null);
      // Use a simple div as a wrapper instead of Fragment to avoid type issues
      // Cast children to any to avoid type checking issues during compile time
      // We're handling this at runtime anyway with the try/catch
      return createElement('div', { className: '0x1-boundary-container' }, props.children as any);
    } catch (error) {
      if (error instanceof Error) {
        return fallback(error, { componentStack: componentStack.join(' > ') });
      }
      return fallback(new Error(String(error)), { componentStack: componentStack.join(' > ') });
    }
  };
}
