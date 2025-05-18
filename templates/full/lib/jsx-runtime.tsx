/**
 * 0x1 JSX Runtime
 * 
 * This module provides JSX support for the 0x1 framework
 * It enables using TSX files with proper type definitions
 */

// Define types for JSX support
export type JSXAttributes = {
  [key: string]: any;
  children?: JSXChildren;
  dangerouslySetInnerHTML?: { __html: string };
  className?: string;
  id?: string;
  style?: Record<string, string | number>;
};

export type JSXChildren = JSXNode | string | number | boolean | null | undefined | Array<JSXChildren>;

export type JSXNode = {
  type: string | ComponentFunction;
  props: JSXAttributes;
  children: Array<JSXNode | string | number | boolean | null | undefined>;
};

export type ComponentFunction = (props: JSXAttributes) => JSXNode | string | HTMLElement;

/**
 * Creates a JSX element from a type, props, and children
 */
export function createElement(
  type: string | ComponentFunction,
  props: JSXAttributes | null,
  ...children: JSXChildren[]
): JSXNode {
  props = props || {};
  const flatChildren = flattenChildren(children);
  
  return {
    type,
    props: props,
    children: flatChildren
  };
}

/**
 * Fragment component for grouping children without an extra DOM node
 */
export const Fragment = (props: { children?: JSXChildren }): JSXNode => {
  return { 
    type: 'fragment',
    props: {},
    // Explicitly cast the children to avoid type errors
    children: Array.isArray(props.children) 
      ? (props.children as Array<JSXNode | string | number>)
      : props.children 
        ? ([props.children] as Array<JSXNode | string | number>) 
        : []
  };
};

/**
 * Flattens nested arrays of children
 */
function flattenChildren(children: Array<JSXChildren | JSXChildren[]>): Array<JSXNode | string | number> {
  // Use a non-recursive flattening approach to avoid infinite type instantiation
  // Convert to an explicit array type with concrete members
  return (children.flat(1) as Array<JSXNode | string | number | boolean | null | undefined>).filter(child => 
    child !== false && 
    child !== true && 
    child !== undefined && 
    child !== null
  ) as Array<JSXNode | string | number>;
}

/**
 * Converts a JSX node to HTML string
 */
export function renderToString(node: JSXNode | string | number | boolean | null | undefined): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  
  if (typeof node === 'number') {
    return node.toString();
  }
  
  if (typeof node === 'string') {
    return escapeHtml(node);
  }
  
  // Handle fragments
  if (node.type === 'fragment') {
    return node.children.map(child => renderToString(child)).join('');
  }
  
  // Handle functional components
  if (typeof node.type === 'function') {
    const result = node.type({ ...node.props, children: node.children });
    
    if (typeof result === 'string') {
      return result;
    } else if (result instanceof HTMLElement) {
      return result.outerHTML;
    } else {
      return renderToString(result);
    }
  }
  
  // Handle regular HTML tags
  const { dangerouslySetInnerHTML, ...props } = node.props || {};
  
  let html = `<${node.type}`;
  
  // Add attributes
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || value === null || value === undefined || value === false) {
      continue;
    }
    
    if (value === true) {
      html += ` ${key}`;
    } else {
      html += ` ${key}="${escapeHtml(value.toString())}"`;
    }
  }
  
  // Self-closing tags
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);
  
  if (voidElements.has(node.type as string) && !dangerouslySetInnerHTML && (!node.children || node.children.length === 0)) {
    return `${html} />`;
  }
  
  html += '>';
  
  // Add innerHTML if provided
  if (dangerouslySetInnerHTML && dangerouslySetInnerHTML.__html) {
    html += dangerouslySetInnerHTML.__html;
  } else {
    // Add children
    html += node.children.map(child => renderToString(child)).join('');
  }
  
  // Close tag
  html += `</${node.type}>`;
  
  return html;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// JSX interfaces for TypeScript
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JSX {
  export interface Element extends JSXNode {}
  
  export interface IntrinsicElements {
    [elemName: string]: any;
  }
}
