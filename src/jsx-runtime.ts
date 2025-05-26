/**
 * JSX Runtime for 0x1 Framework
 * Provides JSX/TSX support with createElement and Fragment
 */

// Import types instead of using triple slash references
import type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode } from '../types/jsx.js';

// Fragment symbol for React-like fragments
export const Fragment = Symbol.for('0x1.fragment');

// Core JSX types - re-export for convenience
export type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode };

/**
 * JSX Factory function - called for every JSX element
 */
export function jsx(type: string | ComponentFunction, props: any, key?: string): JSXNode {
  const { children, ...otherProps } = props || {};
  
  if (typeof type === 'function') {
    // Call component function with props
    return type({ children, ...otherProps });
  }
  
  return {
    type,
    props: otherProps,
    children: Array.isArray(children) ? children : (children !== undefined ? [children] : []),
    key: key || null
  };
}

/**
 * JSX Factory function for multiple children
 */
export function jsxs(type: string | ComponentFunction, props: any, key?: string): JSXNode {
  return jsx(type, props, key);
}

/**
 * Legacy createElement function for compatibility
 */
export function createElement(
  type: string | ComponentFunction | typeof Fragment,
  props?: any,
  ...children: any[]
): JSXNode {
  if (type === Fragment) {
    return {
      type: Fragment,
      props: {},
      children: children.flat(),
      key: null
    };
  }
  
  const childArray = children.flat().filter((child: any) => child != null);
  return jsx(type as string | ComponentFunction, { ...props, children: childArray });
}

/**
 * Convert JSX element to HTML string (server-side rendering)
 */
export function renderToString(node: JSXNode): string {
  if (!node) return '';
  
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  
  if (Array.isArray(node)) {
    return node.map((child: JSXNode) => renderToString(child)).join('');
  }
  
  if (node.type === Fragment) {
    return node.children.map((child: JSXNode) => renderToString(child)).join('');
  }
  
  if (typeof node.type === 'function') {
    // Component - render with props
    const result = node.type(node.props);
    return renderToString(result);
  }
  
  // HTML element
  const tag = node.type as string;
  const attrs = Object.entries(node.props || {})
    .filter(([key, value]) => value != null && key !== 'children')
    .map(([key, value]) => {
      // Handle boolean attributes
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      // Handle className -> class
      const attrName = key === 'className' ? 'class' : key;
      return `${attrName}="${String(value).replace(/"/g, '&quot;')}"`;
    })
    .filter(attr => attr)
    .join(' ');
  
  const children = node.children?.map((child: JSXNode) => renderToString(child)).join('') || '';
  
  // Self-closing tags
  const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  if (selfClosing.includes(tag)) {
    return `<${tag}${attrs ? ' ' + attrs : ''} />`;
  }
  
  return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
}

/**
 * Convert JSX element to DOM element (client-side rendering)
 */
export function renderToDOM(node: JSXNode): Node | null {
  if (!node) return null;
  
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(String(node));
  }
  
  if (Array.isArray(node)) {
    const fragment = document.createDocumentFragment();
    node.forEach((child: JSXNode) => {
      const childNode = renderToDOM(child);
      if (childNode) fragment.appendChild(childNode);
    });
    return fragment;
  }
  
  if (node.type === Fragment) {
    const fragment = document.createDocumentFragment();
    node.children.forEach((child: JSXNode) => {
      const childNode = renderToDOM(child);
      if (childNode) fragment.appendChild(childNode);
    });
    return fragment;
  }
  
  if (typeof node.type === 'function') {
    // Component - render with props
    const result = node.type(node.props);
    return renderToDOM(result);
  }
  
  // HTML element
  const element = document.createElement(node.type as string);
  
  // Set attributes
  Object.entries(node.props || {}).forEach(([key, value]) => {
    if (key === 'children') return;
    
    if (key.startsWith('on') && typeof value === 'function') {
      // Event listener
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value as EventListener);
    } else if (key === 'className') {
      element.className = String(value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (value != null) {
      element.setAttribute(key, String(value));
    }
  });
  
  // Add children
  node.children?.forEach((child: JSXNode) => {
    const childNode = renderToDOM(child);
    if (childNode) element.appendChild(childNode);
  });
  
  return element;
}
