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
  
  const componentName = type.name || 'AnonymousComponent';
  const componentId = `${componentName}_${Math.random().toString(36).slice(2, 5)}`;
  
  // DEBUG: Log what components are being processed
  if (componentName === 'DocsSidebar') {
    console.log(`[0x1 JSX] INITIAL RENDER: Processing ${componentName} with ID ${componentId}`);
    console.log(`[0x1 JSX] INITIAL RENDER: Props:`, props);
  }
  
  const updateCallback = () => {
    // Triggered when component state changes and needs re-render
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        console.debug(`[0x1 Hooks] Component ${componentId} state changed, triggering re-render`);
        
        // UNIVERSAL APPROACH: Find component elements with comprehensive search
        // Works with single elements, fragments, nested layouts - ANY structure
        const elements = document.querySelectorAll(`[data-component-id="${componentId}"]`);
        
        if (elements.length === 0) {
          // SMART RETRY: Component doesn't exist yet - queue for retry
          console.debug(`[0x1 JSX] Component ${componentId} not in DOM yet - queueing retry`);
          
          // DEBUG: For DocsSidebar, let's see what's actually in the DOM
          if (componentName === 'DocsSidebar') {
            console.log(`[0x1 JSX] DOM DEBUG: All elements with data-component-id:`);
            const allComponents = document.querySelectorAll('[data-component-id]');
            allComponents.forEach((el, i) => {
              console.log(`  ${i}: ${el.tagName} id="${el.getAttribute('data-component-id')}" name="${el.getAttribute('data-component-name')}"`);
            });
            
            console.log(`[0x1 JSX] DOM DEBUG: All DocsSidebar related elements:`);
            const sidebarElements = document.querySelectorAll('aside, button[id*="docs"], [class*="sidebar"], [data-component-name="DocsSidebar"]');
            sidebarElements.forEach((el, i) => {
              console.log(`  ${i}: ${el.tagName} id="${el.id}" class="${el.className}" component-id="${el.getAttribute('data-component-id')}"`);
            });
          }
          
          // Retry after a short delay to allow DOM to update
          setTimeout(() => {
            requestAnimationFrame(() => {
              const retryElements = document.querySelectorAll(`[data-component-id="${componentId}"]`);
              if (retryElements.length > 0) {
                executeReRender(componentId, componentName, type, props, retryElements);
              } else {
                console.debug(`[0x1 JSX] Component ${componentId} still not in DOM after retry - final skip`);
              }
            });
          }, 10);
          return;
        }
        
        executeReRender(componentId, componentName, type, props, elements);
      }
    });
  };
  
  // EXTRACTED: Re-render execution logic
  function executeReRender(componentId: string, componentName: string, type: ComponentFunction, props: any, elements: NodeListOf<Element>) {
    console.debug(`[0x1 JSX] Found ${elements.length} elements for ${componentId}, proceeding with re-render`);
    
    // DYNAMIC: Check if debug mode is enabled (NO HARDCODING)
    const isDebugMode = typeof window !== 'undefined' && 
      (window as any).__0x1_debug === true || 
      (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
    
    // Re-execute the component function to get fresh result
    setContext(componentId, updateCallback);
    try {
      const newResult = type(props);
      
      // CRITICAL FIX: Reapply metadata to the fresh result since component execution creates new objects
      const enhancedNewResult = ensureComponentMetadata(newResult, componentId, componentName);
      
      // DYNAMIC: Debug logging for ANY component when debug mode is enabled
      if (isDebugMode) {
        console.log(`[0x1 JSX] Re-render generated new result for ${componentId}:`, enhancedNewResult);
      }
      
      // CRITICAL FIX: Handle fragment components (multiple elements) properly
      // Check for React Fragment objects OR plain arrays
      const isFragment = Array.isArray(enhancedNewResult) || 
                        (enhancedNewResult && typeof enhancedNewResult === 'object' && 'type' in enhancedNewResult && 
                         typeof enhancedNewResult.type === 'symbol' && 'children' in enhancedNewResult);
      
      if (isFragment) {
        // Fragment component - multiple elements need coordinated replacement
        let fragmentChildren: any[] = [];
        
        if (Array.isArray(enhancedNewResult)) {
          fragmentChildren = enhancedNewResult;
        } else if (enhancedNewResult && 'children' in enhancedNewResult && Array.isArray(enhancedNewResult.children)) {
          fragmentChildren = enhancedNewResult.children;
        }
        
        const newElements = fragmentChildren.map((item, index) => {
          return renderToDOM(item);
        }).filter(Boolean);
        
        if (isDebugMode) {
          console.log(`[0x1 JSX] Fragment component ${componentId}: ${fragmentChildren.length} result items -> ${newElements.length} DOM elements`);
        }
        
        if (newElements.length > 0 && elements.length > 0) {
          // STRATEGY: Replace the first old element with first new element, 
          // then insert remaining new elements, then remove remaining old elements
          const firstOldElement = elements[0];
          const parent = firstOldElement.parentNode;
          
          if (parent) {
            // Insert all new elements before the first old element
            newElements.forEach((newElement, index) => {
              if (newElement) {
                parent.insertBefore(newElement, firstOldElement);
                if (isDebugMode) {
                  console.log(`[0x1 JSX] Inserted new fragment element ${index} for ${componentId}`);
                }
              }
            });
            
            // Remove all old elements
            elements.forEach((oldElement, index) => {
              if (oldElement.parentNode) {
                oldElement.parentNode.removeChild(oldElement);
                if (isDebugMode) {
                  console.log(`[0x1 JSX] Removed old fragment element ${index} for ${componentId}`);
                }
              }
            });
            
            if (isDebugMode) {
              console.log(`[0x1 JSX] Successfully re-rendered fragment component ${componentId}: ${newElements.length} elements`);
            }
          }
        }
      } else {
        // Single element component - standard replacement
        const newElements = renderToDOM(enhancedNewResult);
        
        if (isDebugMode) {
          console.log(`[0x1 JSX] Single element component ${componentId}:`, newElements);
        }
        
        if (newElements) {
          elements.forEach((oldElement, index) => {
            if (oldElement.parentNode && index === 0) { // Only replace the first element for single components
              oldElement.parentNode.replaceChild(newElements, oldElement);
              
              if (isDebugMode) {
                console.log(`[0x1 JSX] Replaced single element for ${componentId}`);
              }
            } else if (index > 0) {
              // Remove extra old elements if they exist
              if (oldElement.parentNode) {
                oldElement.parentNode.removeChild(oldElement);
                if (isDebugMode) {
                  console.log(`[0x1 JSX] Removed extra old element ${index} for ${componentId}`);
                }
              }
            }
          });
          
          if (isDebugMode) {
            console.log(`[0x1 JSX] Successfully re-rendered single component ${componentId}`);
          }
        }
      }
    } catch (error) {
      console.error(`[0x1 JSX] Re-render failed for ${componentId}:`, error);
    } finally {
      clearContext();
    }
  }
  
  // CRITICAL FIX: Set context for this component and DO NOT clear it immediately
  // This allows nested components to inherit the context
  setContext(componentId, updateCallback);
  
  try {
    const result = type(props);
    
    // DEBUG: Log the result for DocsSidebar
    if (componentName === 'DocsSidebar') {
      console.log(`[0x1 JSX] INITIAL RENDER: ${componentName} returned:`, result);
      console.log(`[0x1 JSX] INITIAL RENDER: Result type:`, Array.isArray(result) ? 'Array' : typeof result);
    }
    
    // CRITICAL: Ensure component metadata is applied to the result
    const enhancedResult = ensureComponentMetadata(result, componentId, componentName);
    
    // DEBUG: Log the enhanced result for DocsSidebar
    if (componentName === 'DocsSidebar') {
      console.log(`[0x1 JSX] INITIAL RENDER: Enhanced result for ${componentName}:`, enhancedResult);
      if (Array.isArray(enhancedResult)) {
        enhancedResult.forEach((item, i) => {
          if (item && typeof item === 'object' && 'props' in item) {
            console.log(`  Fragment item ${i}:`, item.type, item.props?.['data-component-id']);
          }
        });
      } else if (enhancedResult && typeof enhancedResult === 'object' && 'children' in enhancedResult) {
        console.log(`[0x1 JSX] INITIAL RENDER: Fragment type:`, enhancedResult.type, 'children count:', enhancedResult.children?.length);
        if (Array.isArray(enhancedResult.children)) {
          enhancedResult.children.forEach((child: any, i: number) => {
            if (child && typeof child === 'object' && 'props' in child) {
              console.log(`  Fragment child ${i}:`, child.type, child.props?.['data-component-id']);
            }
          });
        }
      }
    }
    
    return enhancedResult;
  } catch (error: any) {
    console.error(`[0x1 JSX] Error in component ${componentId}:`, error);
    return {
      type: 'div',
      props: { 
        className: 'error-boundary',
        style: { color: 'red', padding: '10px', border: '1px solid red' }
      },
      children: [`Error in ${componentName}: ${error.message}`],
      key: null
    };
  }
}

/**
 * Ensure component metadata is applied to JSX result for re-render tracking
 * UNIVERSAL: Works with ANY component structure - fragments, single elements, nested layouts
 */
function ensureComponentMetadata(result: JSXNode, componentId: string, componentName: string): JSXNode {
  if (!result || typeof result !== 'object') {
    return result;
  }
  
  // Handle React Fragment (Symbol(react.fragment))
  if ('type' in result && 'children' in result && typeof result.type === 'symbol') {
    const fragment = result as JSXElement;
    
    // For fragments, apply metadata to ALL children
    if (Array.isArray(fragment.children)) {
      const enhancedChildren = fragment.children.map((child, index) => {
        if (child && typeof child === 'object' && 'type' in child && 'props' in child) {
          const enhancedChild = { ...child };
          if (!enhancedChild.props) {
            enhancedChild.props = {};
          }
          
          // Apply metadata to each child in the fragment
          enhancedChild.props['data-component-id'] = componentId;
          enhancedChild.props['data-component-name'] = componentName;
          enhancedChild.props['data-fragment-index'] = index;
          
          return enhancedChild;
        }
        return child;
      });
      
      // Return the fragment with enhanced children
      return {
        ...fragment,
        children: enhancedChildren
      };
    }
    
    return fragment;
  }
  
  // Handle JSX element
  if ('type' in result && 'props' in result) {
    const jsxElement = result as JSXElement;
    
    // Apply metadata to the root element
    if (!jsxElement.props) {
      jsxElement.props = {};
    }
    
    jsxElement.props['data-component-id'] = componentId;
    jsxElement.props['data-component-name'] = componentName;
    
    return jsxElement;
  }
  
  // Handle arrays (fragments or multiple elements)
  if (Array.isArray(result)) {
    const enhancedArray = result.map((child, index) => {
      if (child && typeof child === 'object' && 'type' in child && 'props' in child) {
        const enhancedChild = { ...child };
        if (!enhancedChild.props) {
          enhancedChild.props = {};
        }
        
        // UNIVERSAL: Apply metadata to ALL elements in fragment
        enhancedChild.props['data-component-id'] = componentId;
        enhancedChild.props['data-component-name'] = componentName;
        enhancedChild.props['data-fragment-index'] = index;
        
        return enhancedChild;
      }
      return child;
    });
    
    return enhancedArray;
  }
  
  return result;
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
  
  // CRITICAL FIX: Use callComponentWithContext for function components
  // This ensures we get the sophisticated updateCallback with proper DOM re-rendering
  if (typeof type === 'function') {
    const componentProps = { ...otherProps };
    if (children !== undefined) {
      componentProps.children = children;
    }
    
    // Use the sophisticated callComponentWithContext instead of minimal inline handling
    return callComponentWithContext(type, componentProps);
  }
  
  // Handle regular HTML elements
  return {
    type,
    props: {
      ...otherProps,
      children: Array.isArray(children) ? children.flat().filter(c => c != null) : (children != null ? [children] : [])
    },
    children: Array.isArray(children) ? children.flat().filter(c => c != null) : (children != null ? [children] : []),
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
        
        // For anchor tags, ensure onClick handlers work properly with client-side routing
        if (tagName === 'a' && eventName === 'click') {
          // Allow the onClick handler - it's needed for Link component navigation
          element.addEventListener(eventName, value as EventListener);
        } else {
          element.addEventListener(eventName, value as EventListener);
        }
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

// ============================================================================
// GLOBAL INITIALIZATION - ESTABLISH ONE SOURCE OF TRUTH
// ============================================================================

/**
 * Initialize the JSX runtime as the global standard
 */
function initializeGlobalJSXRuntime() {
  if (typeof window !== 'undefined') {
    // Make all JSX functions globally available
    (window as any).jsx = jsx;
    (window as any).jsxs = jsxs;
    (window as any).jsxDEV = jsxDEV;
    (window as any).createElement = createElement;
    (window as any).Fragment = Fragment;
    (window as any).renderToDOM = renderToDOM;
    
    // CRITICAL: Make renderToDOM available under multiple names for compatibility
    (window as any).jsxToDom = renderToDOM; // For router compatibility
    (window as any).__0x1_renderToDOM = renderToDOM;
    
    // React compatibility layer
    if (!(window as any).React) {
      (window as any).React = {};
    }
    
    (window as any).React.createElement = createElement;
    (window as any).React.Fragment = Fragment;
    (window as any).React.jsx = jsx;
    (window as any).React.jsxs = jsxs;
    
    console.log('[0x1 JSX] Production-ready runtime loaded');
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after all module code is parsed
  setTimeout(initializeGlobalJSXRuntime, 0);
} 