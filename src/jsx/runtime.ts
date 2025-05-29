/**
 * 0x1 Framework JSX Runtime
 * Production-ready JSX runtime implementation
 */

// Core types
export type JSXNode = string | number | boolean | null | undefined | JSXElement | JSXNode[];
export type JSXChildren = JSXNode | JSXNode[];
export type JSXAttributes = Record<string, any>;
export type ComponentFunction<P = any> = (props: P) => JSXNode;

export interface JSXElement {
  type: string | ComponentFunction | symbol;
  props: JSXAttributes;
  children: JSXNode[];
  key?: string | number | null;
}

// Standardized symbols - use React 19 compatible symbols
export const Fragment = Symbol.for('react.fragment');
export const REACT_ELEMENT = Symbol.for('react.element');
export const REACT_FRAGMENT = Symbol.for('react.fragment');

// Standardized hooks context global variable names
const HOOKS_CONTEXT_ENTER = '__0x1_enterComponentContext';
const HOOKS_CONTEXT_EXIT = '__0x1_exitComponentContext';

/**
 * Call component with proper hooks context - Enhanced for better component nesting
 */
function callComponentWithContext(type: ComponentFunction, props: any): JSXNode {
  // Check if hooks context functions are available using standardized names
  const setContext = (globalThis as any)[HOOKS_CONTEXT_ENTER];
  const clearContext = (globalThis as any)[HOOKS_CONTEXT_EXIT];
  
  if (!setContext || !clearContext) {
    // Fallback: call component directly without hooks context
    console.warn('[0x1 JSX] Hooks context not available, component will run without hooks');
    try {
      return type(props);
    } catch (error: any) {
      console.error('[0x1 JSX] Component error (no hooks context):', error);
      // Return error boundary fallback
      return {
        type: 'div',
        props: { 
          className: 'error-boundary',
          style: { color: 'red', padding: '10px', border: '1px solid red' }
        },
        children: [`Error in component: ${error.message}`],
        key: null
      };
    }
  }
  
  // Generate stable component ID
  const componentName = type.name || 'Anonymous';
  const propsString = JSON.stringify(props || {});
  let hash = 0;
  for (let i = 0; i < propsString.length; i++) {
    const char = propsString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const componentId = `${componentName}_${Math.abs(hash).toString(36)}`;
  
  // Create update callback for state changes
  const updateCallback = () => {
    console.debug(`[0x1 Hooks] Component ${componentId} state changed`);
    // Trigger re-render logic here if needed
  };
  
  setContext(componentId, updateCallback);
  
  try {
    const result = type(props);
    
    // Ensure result is properly formatted
    if (result === null || result === undefined) {
      return null;
    }
    
    // Handle string/number results
    if (typeof result === 'string' || typeof result === 'number') {
      return result;
    }
    
    // Handle array results (fragments)
    if (Array.isArray(result)) {
      return result;
    }
    
    // Handle JSX element results
    if (typeof result === 'object' && result && 'type' in result) {
      return result;
    }
    
    // Fallback for unexpected result types
    console.warn('[0x1 JSX] Unexpected component result type:', typeof result, result);
    return String(result);
    
  } catch (error: any) {
    console.error('[0x1 JSX] Component error:', error);
    
    // Return error boundary fallback
    return {
      type: 'div',
      props: { 
        className: 'error-boundary',
        style: { color: 'red', padding: '10px', border: '1px solid red' }
      },
      children: [`Error in ${componentName}: ${error.message}`],
      key: null
    };
  } finally {
    clearContext();
  }
}

/**
 * JSX Factory function - called for every JSX element
 */
export function jsx(type: string | ComponentFunction | symbol, props: any, key?: string): JSXNode {
  const { children, ...otherProps } = props || {};
  
  // Handle Fragment using standardized symbol
  if (type === Fragment || type === REACT_FRAGMENT) {
    return {
      type: Fragment,
      props: {},
      children: Array.isArray(children) ? children.flat().filter(c => c != null) : (children != null ? [children] : []),
      key: null
    };
  }
  
  // Handle function components
  if (typeof type === 'function') {
    const componentProps = { ...otherProps };
    if (children !== undefined) {
      componentProps.children = children;
    }
    return callComponentWithContext(type, componentProps);
  }
  
  // Handle DOM elements
  return {
    type: type as string,
    props: otherProps,
    children: Array.isArray(children) ? children : (children !== undefined ? [children] : []),
    key: key || null
  };
}

/**
 * JSX Factory function for multiple children
 */
export function jsxs(type: string | ComponentFunction | symbol, props: any, key?: string): JSXNode {
  return jsx(type, props, key);
}

/**
 * Development JSX function with additional debugging
 */
export function jsxDEV(
  type: string | ComponentFunction | symbol, 
  props: any, 
  key?: string,
  isStaticChildren?: boolean,
  source?: any,
  self?: any
): JSXNode {
  // Add source information in development
  if (source && props && typeof props === 'object') {
    props.__source = source;
  }
  
  if (self !== undefined && props && typeof props === 'object') {
    props.__self = self;
  }
  
  return jsx(type, props, key);
}

/**
 * createElement function (React compatibility)
 */
export function createElement(type: string | ComponentFunction | symbol, props: any, ...children: any[]): JSXNode {
  const childArray = children.flat().filter(child => child != null);
  
  if (typeof type === 'function') {
    const componentProps = { ...props };
    if (childArray.length > 0) {
      componentProps.children = childArray.length === 1 ? childArray[0] : childArray;
    }
    return callComponentWithContext(type, componentProps);
  }
  
  return jsx(type, { ...props, children: childArray });
}

/**
 * Render JSX to DOM (browser-only)
 */
export function renderToDOM(node: JSXNode): Node | null {
  if (typeof window === 'undefined') {
    throw new Error('[0x1 JSX] renderToDOM can only be used in browser environment');
  }
  
  if (!node) return null;
  
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(String(node));
  }
  
  if (Array.isArray(node)) {
    const fragment = document.createDocumentFragment();
    node.forEach(child => {
      const childNode = renderToDOM(child);
      if (childNode) fragment.appendChild(childNode);
    });
    return fragment;
  }
  
  if (typeof node === 'object' && node && 'type' in node) {
    // Handle Fragment using standardized symbol
    if (node.type === Fragment) {
      const fragment = document.createDocumentFragment();
      node.children.forEach(child => {
        const childNode = renderToDOM(child);
        if (childNode) fragment.appendChild(childNode);
      });
      return fragment;
    }
    
    // Handle function components
    if (typeof node.type === 'function') {
      const result = callComponentWithContext(node.type, node.props);
      return renderToDOM(result);
    }
    
    // Handle DOM elements - Fixed SVG handling
    const tagName = node.type as string;
    let element: Element;
    
    // SVG elements need special namespace handling
    const svgElements = new Set([
      'svg', 'path', 'circle', 'rect', 'line', 'ellipse', 'polygon', 'polyline',
      'g', 'defs', 'use', 'symbol', 'marker', 'clipPath', 'mask', 'pattern',
      'linearGradient', 'radialGradient', 'stop', 'text', 'tspan', 'textPath',
      'foreignObject', 'switch', 'animate', 'animateTransform', 'animateMotion'
    ]);
    
    if (svgElements.has(tagName)) {
      element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    } else {
      element = document.createElement(tagName);
    }
    
    // Set attributes and properties
    Object.entries(node.props || {}).forEach(([key, value]) => {
      if (key === 'children') return;
      
      if (key === 'className') {
        // SVG elements need class attribute, not className property
        if (svgElements.has(tagName)) {
          element.setAttribute('class', String(value));
        } else {
          (element as HTMLElement).className = String(value);
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        
        // CRITICAL FIX: Don't interfere with anchor tag click events - let the router handle navigation
        if (tagName === 'a' && eventName === 'click') {
          // For anchor tags, don't add click handlers - let the router's global click handler manage navigation
          // This prevents conflicts with client-side routing
          return;
        }
        
        element.addEventListener(eventName, value as EventListener);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign((element as HTMLElement).style, value as CSSStyleDeclaration);
      } else if (typeof value === 'boolean') {
        if (value) element.setAttribute(key, '');
      } else if (value != null) {
        // For SVG elements, use setAttribute for all attributes
        element.setAttribute(key, String(value));
      }
    });
    
    // Add children
    node.children?.forEach(child => {
      const childNode = renderToDOM(child);
      if (childNode) element.appendChild(childNode);
    });
    
    return element;
  }
  
  return null;
}

/**
 * Render JSX to string (server-side rendering)
 */
export function renderToString(node: JSXNode): string {
  if (!node) return '';
  
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  
  if (Array.isArray(node)) {
    return node.map(child => renderToString(child)).join('');
  }
  
  if (typeof node === 'object' && node && 'type' in node) {
    // Handle Fragment using standardized symbol
    if (node.type === Fragment) {
      return node.children.map(child => renderToString(child)).join('');
    }
    
    // Handle function components
    if (typeof node.type === 'function') {
      const result = callComponentWithContext(node.type, node.props);
      return renderToString(result);
    }
    
    // Handle DOM elements
    const tag = node.type as string;
    const attrs = Object.entries(node.props || {})
      .filter(([key, value]) => value != null && key !== 'children')
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? key : '';
        }
        const attrName = key === 'className' ? 'class' : key;
        return `${attrName}="${String(value).replace(/"/g, '&quot;')}"`;
      })
      .filter(attr => attr)
      .join(' ');
    
    const children = node.children?.map(child => renderToString(child)).join('') || '';
    
    // Self-closing tags
    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    if (selfClosing.includes(tag)) {
      return `<${tag}${attrs ? ' ' + attrs : ''} />`;
    }
    
    return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
  }
  
  return '';
} 