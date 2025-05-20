/**
 * JSX Dev Runtime for 0x1 Framework
 * This file provides the necessary exports for Bun's automatic JSX transform in development mode
 */

// Import the core functions from our main JSX runtime
import { jsx, jsxs, Fragment, createElement } from './jsx-runtime';
import type { JSXAttributes, JSXNode, JSXChildren } from './jsx-runtime';

// Re-export the core functions and types
export { Fragment, createElement };
export type { JSXAttributes, JSXNode, JSXChildren };

/**
 * jsxDEV function for development mode
 * This matches the React JSX-dev-runtime signature with source info
 */
export function jsxDEV(
  type: string | ((props: JSXAttributes & { children?: JSXChildren }) => string | JSXNode),
  props: JSXAttributes | null,
  key?: string | null,
  _isStaticChildren?: boolean,
  _source?: { fileName: string; lineNumber: number; columnNumber: number },
  _self?: any
): JSXNode {
  // Just use our regular jsx function since we don't need source maps or special dev behavior
  return jsx(type, props || {}, key || undefined);
}

// Also export the regular jsx/jsxs functions
export { jsx, jsxs };
