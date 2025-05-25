/**
 * JSX Runtime for 0x1 Framework
 * Provides JSX factory functions for creating elements and server-side rendering
 * 
 * This is the main implementation of the JSX runtime that powers the framework's
 * client-side and server-side rendering capabilities. It follows the React 17+ JSX transform spec.
 */

// Import types from our type definitions
/// <reference path="../types/jsx.d.ts" />
/// <reference path="../types/jsx-runtime.d.ts" />

// Types for the JSX elements with better React compatibility
export type JSXAttributes = Record<string, any>;
export type JSXChildren = (string | JSXNode | null | undefined | boolean | number)[];

// JSX Node representation with enhanced capabilities
export interface JSXNode {
  type: string | ComponentFunction;
  props: JSXAttributes;
  children: JSXChildren;
  key?: string | number | null;
  // Additional metadata for debugging
  __source?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  __self?: any;
}

// Component function type
export type ComponentFunction = (props: JSXAttributes & { children?: JSXChildren }) => string | JSXNode;

/**
 * Create a JSX element
 */
export function createElement(
  type: string | ComponentFunction,
  props: JSXAttributes | null,
  ...children: JSXChildren
): JSXNode {
  return {
    type,
    props: props || {},
    children: children.flat().filter(child => 
      child !== undefined && child !== null && child !== false
    )
  };
}

/**
 * Fragment component
 */
// @ts-ignore - Intentionally ignore the redeclaration error between implementation and declaration
export const Fragment = (props: { children?: JSXChildren }): JSXNode => {
  return {
    type: 'fragment',
    props: {},
    children: props.children || []
  };
};

/**
 * jsx function for the automatic JSX transform
 * This is the primary entry point for modern JSX transformations
 */
export function jsx(type: string | ComponentFunction, props: JSXAttributes, key?: string): JSXNode {
  // Handle children from props to match React's JSX transform
  const { children, ...restProps } = props || {};
  
  // Normalize children to match React's expected format
  const normalizedChildren = children ? 
    (Array.isArray(children) ? children : [children]) : [];
  
  // Create JSX node with key for reconciliation
  return {
    type,
    props: restProps,
    children: normalizedChildren,
    key: key || null
  };
}

/**
 * jsxs function for handling static children
 */
export function jsxs(type: string | ComponentFunction, props: JSXAttributes, _key?: string): JSXNode {
  // jsxs is the same as jsx in our implementation
  return jsx(type, props, _key);
}

/**
 * jsxDEV function for development
 * Enhanced version with source mapping and debugging support
 */
export function jsxDEV(
  type: string | ComponentFunction, 
  props: JSXAttributes, 
  key?: string,
  isStaticChildren?: boolean,
  source?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  },
  self?: any
): JSXNode {
  // Create node with standard jsx function
  const node = jsx(type, props, key);
  
  // Add development-only properties for debugging
  if (source) {
    node.__source = source;
  }
  if (self) {
    node.__self = self;
  }
  
  return node;
}

/**
 * Render JSX to HTML string
 * This function is used by both server-side and client-side code to render JSX elements to HTML strings
 */
export function renderToString(node: JSXNode | string | number | boolean | null | undefined): string {
  if (node === undefined || node === null || node === false || node === true) {
    // Skip undefined, null, false, AND true values
    return '';
  }
  
  if (typeof node === 'string' || typeof node === 'number') {
    // Only render strings and numbers, not booleans
    return String(node);
  }
  
  // Handle Fragment special case
  if (node.type === 'fragment') {
    return node.children.map(child => renderToString(child)).join('');
  }
  
  // Handle functional components
  if (typeof node.type === 'function') {
    const result = node.type({
      ...node.props,
      children: node.children
    });
    
    if (typeof result === 'string') {
      return result;
    }
    
    return renderToString(result);
  }
  
  // Handle HTML elements
  let html = `<${node.type}`;
  
  // Add attributes
  for (const [key, value] of Object.entries(node.props)) {
    if (key === 'children' || value === undefined) continue;
    
    if (key === 'className') {
      html += ` class="${escapeHtml(String(value))}"`;
      continue;
    }
    
    if (key === 'htmlFor') {
      html += ` for="${escapeHtml(String(value))}"`;
      continue;
    }
    
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.toLowerCase();
      html += ` ${eventName}="${escapeHtml(String(value))}"`;
      continue;
    }
    
    if (typeof value === 'boolean') {
      if (value) {
        html += ` ${key}`;
      }
      continue;
    }
    
    html += ` ${key}="${escapeHtml(String(value))}"`;
  }
  
  // Handle self-closing tags
  const voidElements = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 
    'meta', 'param', 'source', 'track', 'wbr'
  ];
  
  if (voidElements.includes(node.type)) {
    return `${html} />`;
  }
  
  html += '>';
  
  // Add children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      html += renderToString(child);
    }
  }
  
  // Close tag
  html += `</${node.type}>`;
  
  return html;
}

/**
 * Helper function to escape HTML special characters
 */
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Re-export the Fragment for use in code
export { Fragment as JSXFragment };
