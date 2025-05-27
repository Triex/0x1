/**
 * Browser-specific JSX runtime implementation
 * This file contains browser-specific logic for the JSX runtime
 * 
 * This file now serves as the single source of truth for JSX types and runtime
 */

// JSX Type Definitions
// These are needed by the framework and consuming applications
export type JSXNode = string | number | boolean | null | undefined | JSXElement | JSXNode[];
export type JSXChildren = JSXNode | JSXNode[];
export type JSXAttributes = Record<string, any>;
export type ComponentFunction<P = any> = (props: P) => JSXNode;

// JSX Element Types
export type JSXElement = {
  type: string | ComponentFunction | symbol;
  props: any;
  children: JSXNode[];
  key?: string | number | null;
};

// Component Props helper type
export type ComponentProps<T extends ComponentFunction> = T extends ComponentFunction<infer P> ? P : never;

// Fragment symbol for React-like fragments
export const Fragment = Symbol.for('0x1.fragment');

// React 19 and Next.js 15 symbol exports
export const REACT_ELEMENT = Symbol.for('react.element');
export const REACT_FRAGMENT = Symbol.for('react.fragment');
export const REACT_SERVER_COMPONENT = Symbol.for('react.server.component');

// DOM rendering function for client-side components
export function renderToDOM(node: any): Node | null {
  if (!node) return null;
  
  if (typeof node === 'string' || typeof node === 'number') {
    return document.createTextNode(String(node));
  }
  
  if (Array.isArray(node)) {
    const fragment = document.createDocumentFragment();
    node.forEach((child: any) => {
      const childNode = renderToDOM(child);
      if (childNode) fragment.appendChild(childNode);
    });
    return fragment;
  }
  
  if (node.type === Fragment) {
    const fragment = document.createDocumentFragment();
    node.children.forEach((child: any) => {
      const childNode = renderToDOM(child);
      if (childNode) fragment.appendChild(childNode);
    });
    return fragment;
  }
  
  if (typeof node.type === 'function') {
    // For function components, we'd normally use hooks context
    // But in this simplified version, just call it directly
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
      Object.assign(element.style, value as CSSStyleDeclaration);
    } else if (value != null) {
      element.setAttribute(key, String(value));
    }
  });
  
  // Add children
  node.children?.forEach((child: any) => {
    const childNode = renderToDOM(child);
    if (childNode) element.appendChild(childNode);
  });
  
  return element;
}

// Create a reusable error boundary component
export function createErrorBoundary(fallback: (error: Error, info: any) => any) {
  return function ErrorBoundary(props: { children?: any }) {
    try {
      if (!props.children) {
        return {
          type: 'div',
          props: {},
          children: [],
          key: null
        };
      }
      
      return {
        type: 'div',
        props: { 
          className: '0x1-boundary',
          children: props.children 
        },
        children: [],
        key: null
      };
    } catch (error) {
      return fallback(
        error instanceof Error ? error : new Error(String(error)), 
        { componentStack: [] }
      );
    }
  };
}


// OLD REF:

// /**
//  * JSX Runtime for 0x1 Framework
//  * Provides JSX/TSX support with createElement and Fragment
//  */

// // Import types
// import type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode } from '../types/jsx';

// // Import browser-specific functionality
// import { Fragment as BrowserFragment, REACT_FRAGMENT } from './browser/jsx/runtime';

// // Re-export Fragment symbol for React-like fragments
// export const Fragment = BrowserFragment;
// export { REACT_FRAGMENT };

// // Core JSX types - re-export for convenience
//   export type { ComponentFunction, JSXAttributes, JSXChildren, JSXNode };

// // Re-export browser-specific functionality
//   // export { browserRenderToDOM as renderToDOM };

// // Lazy-loaded hooks context management to avoid circular deps
// let setComponentContext: any = null;
// let clearComponentContext: any = null;
// let hooksLoaded = false;

// async function loadHooksIfNeeded() {
//   if (!hooksLoaded) {
//     try {
//       const hooks = await import('./core/hooks');
//       setComponentContext = hooks.setComponentContext;
//       clearComponentContext = hooks.clearComponentContext;
//       hooksLoaded = true;
//     } catch (e) {
//       console.warn('[0x1 JSX] Hooks not available, components will run without hooks context');
//       hooksLoaded = true; // Mark as loaded to prevent infinite retry
//     }
//   }
// }

// /**
//  * Call a component function with proper hooks context
//  */
// function callComponentWithContext(type: ComponentFunction, props: any): JSXNode {
//   // If hooks aren't loaded yet, call component directly (fallback)
//   if (!hooksLoaded || !setComponentContext || !clearComponentContext) {
//     return type(props);
//   }
  
//   // Set up hooks context for the component
//   const componentId = `${type.name || 'Anonymous'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
//   setComponentContext(componentId, () => {
//     console.debug(`[0x1 Hooks] Component ${componentId} requested update`);
//   });
  
//   try {
//     // Call the component function with hooks context set
//     return type(props);
//   } finally {
//     // Always clear context after component execution
//     clearComponentContext();
//   }
// }

// /**
//  * JSX Factory function - called for every JSX element
//  */
// export function jsx(type: string | ComponentFunction, props: any, key?: string): JSXNode {
//   const { children, ...otherProps } = props || {};
  
//   if (typeof type === 'function') {
//     // Try to load hooks first
//     if (!hooksLoaded) {
//       loadHooksIfNeeded().catch(() => {
//         // Ignore errors, will fallback to direct call
//       });
//     }
    
//     // Call component function with hooks context
//     return callComponentWithContext(type, { children, ...otherProps });
//   }
  
//   return {
//     type,
//     props: otherProps,
//     children: Array.isArray(children) ? children : (children !== undefined ? [children] : []),
//     key: key || null
//   };
// }

// /**
//  * JSX Factory function for multiple children
//  */
// export function jsxs(type: string | ComponentFunction | symbol, props: any, children: JSXChildren): JSXNode {
//   // Handle Fragment case properly - Fragment is a symbol, so use strict equality
//   if (type === Fragment || type === REACT_FRAGMENT) {
//     const childArray = Array.isArray(children) ? children.flat().filter((child: any) => child != null) : [];
//     return {
//       type: Fragment,
//       props: {},
//       children: childArray,
//       key: null
//     };
//   }
  
//   const childArray = Array.isArray(children) ? children.flat().filter((child: any) => child != null) : [];
  
//   if (typeof type === 'function') {
//     // Try to load hooks first
//     if (!hooksLoaded) {
//       loadHooksIfNeeded().catch(() => {
//         // Ignore errors, will fallback to direct call
//       });
//     }
    
//     // Call component function with hooks context
//     return callComponentWithContext(type, { ...props, children: childArray });
//   }
  
//   // At this point, type must be string (Fragment case handled above)
//   return jsx(type as string, { ...props, children: childArray });
// }

// /**
//  * createElement function (React compatibility)
//  */
// export function createElement(type: string | ComponentFunction | symbol, props: any, ...children: any[]): JSXNode {
//   // Handle Fragment properly with type checking
//   if (type === REACT_FRAGMENT || (typeof type === 'string' && type === 'Fragment')) {
//     return {
//       type: REACT_FRAGMENT,
//       props: { children: children?.flat?.() || children || [] },
//       children: children?.flat?.() || children || [],
//       key: null
//     };
//   }
  
//   const childArray = children.flat().filter((child: any) => child != null);
  
//   if (typeof type === 'function') {
//     // Try to load hooks first
//     if (!hooksLoaded) {
//       loadHooksIfNeeded().catch(() => {
//         // Ignore errors, will fallback to direct call
//       });
//     }
    
//     // Call component function with hooks context
//     return callComponentWithContext(type, { ...props, children: childArray });
//   }
  
//   // At this point, type must be string (Fragment case handled above)
//   return jsx(type as string, { ...props, children: childArray });
// }

// // Initialize hooks loading
// loadHooksIfNeeded();

// /**
//  * Convert JSX element to HTML string (server-side rendering)
//  */
// export function renderToString(node: JSXNode): string {
//   if (!node) return '';
  
//   if (typeof node === 'string' || typeof node === 'number') {
//     return String(node);
//   }
  
//   if (Array.isArray(node)) {
//     return node.map((child: JSXNode) => renderToString(child)).join('');
//   }
  
//   if (node.type === Fragment) {
//     return node.children.map((child: JSXNode) => renderToString(child)).join('');
//   }
  
//   if (typeof node.type === 'function') {
//     // Component - render with props using hooks context
//     const result = callComponentWithContext(node.type, node.props);
//     return renderToString(result);
//   }
  
//   // HTML element
//   const tag = node.type as string;
//   const attrs = Object.entries(node.props || {})
//     .filter(([key, value]) => value != null && key !== 'children')
//     .map(([key, value]) => {
//       // Handle boolean attributes
//       if (typeof value === 'boolean') {
//         return value ? key : '';
//       }
//       // Handle className -> class
//       const attrName = key === 'className' ? 'class' : key;
//       return `${attrName}="${String(value).replace(/"/g, '&quot;')}"`;
//     })
//     .filter(attr => attr)
//     .join(' ');
  
//   const children = node.children?.map((child: JSXNode) => renderToString(child)).join('') || '';
  
//   // Self-closing tags
//   const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
//   if (selfClosing.includes(tag)) {
//     return `<${tag}${attrs ? ' ' + attrs : ''} />`;
//   }
  
//   return `<${tag}${attrs ? ' ' + attrs : ''}>${children}</${tag}>`;
// }

// /**
//  * Convert JSX element to DOM element (client-side rendering)
//  */
// export function renderToDOM(element: JSXNode | string | number | null | undefined, container: Element | null): void {
//   if (!container) return;

//   // Handle null/undefined
//   if (element == null) {
//     container.innerHTML = '';
//     return;
//   }

//   // Handle primitives
//   if (typeof element === 'string' || typeof element === 'number') {
//     container.innerHTML = String(element);
//     return;
//   }

//   // Handle Fragment with better type checking
//   if (typeof element === 'object' && element && 'type' in element && (element.type === Fragment || element.type === REACT_FRAGMENT)) {
//     container.innerHTML = '';
//     const children = Array.isArray(element.children) ? element.children : [element.children];
//     children.forEach(child => {
//       if (child != null) {
//         const childElement = document.createElement('div');
//         renderToDOM(child, childElement);
//         if (childElement.firstChild) {
//           container.appendChild(childElement.firstChild);
//         }
//       }
//     });
//     return;
//   }

//   if (typeof element === 'function') {
//     // Component - render with props using hooks context
//     const result = callComponentWithContext(element, (element as any).props || {});
//     renderToDOM(result, container);
//     return;
//   }

//   // Ensure element is a JSX object at this point
//   if (typeof element !== 'object' || !element || !('type' in element)) {
//     return;
//   }

//   // HTML element
//   const tag = element.type as string;
//   const elementNode = document.createElement(tag);

//   // Set attributes
//   Object.entries(element.props || {}).forEach(([key, value]) => {
//     if (key === 'children') return;
    
//     if (key.startsWith('on') && typeof value === 'function') {
//       // Event listener
//       const eventName = key.slice(2).toLowerCase();
//       elementNode.addEventListener(eventName, value as EventListener);
//     } else if (key === 'className') {
//       elementNode.className = String(value);
//     } else if (key === 'style' && typeof value === 'object') {
//       Object.assign(elementNode.style, value);
//     } else if (value != null) {
//       elementNode.setAttribute(key, String(value));
//     }
//   });

//   // Add children
//   if (element.children) {
//     element.children.forEach((child: JSXNode) => {
//       const childNode = renderToDOM(child, elementNode);
//       // Don't test void return for truthiness
//     });
//   }

//   if (container.firstChild) {
//     container.replaceChild(elementNode, container.firstChild);
//   } else {
//     container.appendChild(elementNode);
//   }
// }
