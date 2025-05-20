/**
 * JSX Runtime for 0x1 Framework
 * Provides JSX factory functions for creating elements and server-side rendering
 */

// Types for the JSX elements
export type JSXAttributes = Record<string, any>;
export type JSXChildren = (string | JSXNode | null | undefined | boolean | number)[];

// JSX Node representation
export interface JSXNode {
  type: string | ComponentFunction;
  props: JSXAttributes;
  children: JSXChildren;
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
export const Fragment = (props: { children?: JSXChildren }): JSXNode => {
  return {
    type: 'fragment',
    props: {},
    children: props.children || []
  };
};

/**
 * jsx function for the automatic JSX transform
 */
export function jsx(type: string | ComponentFunction, props: JSXAttributes, _key?: string): JSXNode {
  // Handle children from props to match React's JSX transform
  const { children, ...restProps } = props || {};
  
  return {
    type,
    props: restProps,
    children: children ? (Array.isArray(children) ? children : [children]) : []
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
 */
export function jsxDEV(type: string | ComponentFunction, props: JSXAttributes, _key?: string): JSXNode {
  // For our implementation, jsxDEV is the same as jsx
  return jsx(type, props, _key);
}

/**
 * Render JSX to HTML string
 */
export function renderToString(node: JSXNode | string | number | boolean | null | undefined): string {
  if (node === undefined || node === null || node === false) {
    return '';
  }
  
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
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

// Type definitions for JSX
// Use ESLint disable to allow namespace syntax which is required for JSX compatibility
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface ElementChildrenAttribute {
      children: Record<string, unknown>;
    }
  }
}
