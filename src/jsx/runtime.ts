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
    console.debug(`[0x1 Hooks] Component ${componentId} state changed, triggering re-render`);
    
    // CRITICAL FIX: Use requestAnimationFrame to run after DOM updates complete
    // This ensures the DOM is fully updated before we try to find elements
    requestAnimationFrame(() => {
      console.debug(`[0x1 JSX] RAF running - searching for component ${componentId}`);
      
      // Debug: Check if document and DOM are available
      if (typeof document === 'undefined') {
        console.error(`[0x1 JSX] Document is undefined in RAF for ${componentId}`);
        return;
      }
      
      // SMART APPROACH: Check if element exists, if not, queue for retry
      const elements = document.querySelectorAll(`[data-component-id="${componentId}"]`);
      
      if (elements.length === 0) {
        // Element doesn't exist yet - QUEUE FOR RETRY instead of skipping
        console.debug(`[0x1 JSX] Component ${componentId} not in DOM yet - queueing retry`);
        
        // Retry after a short delay to allow DOM to be ready
        requestAnimationFrame(() => {
          const retryElements = document.querySelectorAll(`[data-component-id="${componentId}"]`);
          if (retryElements.length === 0) {
            console.debug(`[0x1 JSX] Component ${componentId} still not in DOM after retry - final skip`);
            return;
          }
          
          // Execute the re-render now that element exists
          executeReRender(componentId, componentName, type, props, retryElements);
        });
        return;
      }
      
      // Element exists, proceed with re-render
      executeReRender(componentId, componentName, type, props, elements);
    });
  };
  
  // EXTRACTED: Re-render execution logic
  function executeReRender(componentId: string, componentName: string, type: ComponentFunction, props: any, elements: NodeListOf<Element>) {
    console.debug(`[0x1 JSX] Found ${elements.length} elements for ${componentId}, proceeding with re-render`);
    
    // Re-execute the component function to get fresh result
    setContext(componentId, updateCallback);
    try {
      const newResult = type(props);
      
      // DEBUGGING: Log what the re-rendered component is generating
      if (componentId.includes('CryptoHeader') || componentId.includes('ThemeToggle') || componentId.includes('WalletConnect')) {
        console.log(`[0x1 JSX] Re-render generated new result for ${componentId}:`, newResult);
      }
      
      const newElements = renderToDOM(newResult);
      
      // DEBUGGING: Log the actual DOM elements being created
      if (componentId.includes('CryptoHeader') || componentId.includes('ThemeToggle') || componentId.includes('WalletConnect')) {
        console.log(`[0x1 JSX] renderToDOM created elements for ${componentId}:`, newElements);
        if (newElements instanceof Element) {
          console.log(`[0x1 JSX] New element HTML for ${componentId}:`, newElements.outerHTML.substring(0, 200) + '...');
        }
      }
      
      // Replace each found element
      elements.forEach((element, index) => {
        if (element.parentNode && newElements) {
          
          // DEBUGGING: Log what we're about to replace
          if (componentId.includes('CryptoHeader') || componentId.includes('ThemeToggle') || componentId.includes('WalletConnect')) {
            console.log(`[0x1 JSX] About to replace element ${index} for ${componentId}:`);
            console.log(`[0x1 JSX] Old element HTML:`, element.outerHTML.substring(0, 200) + '...');
          }
          
          // For single element results, replace directly
          if (newElements instanceof DocumentFragment) {
            // Handle fragment results
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-component-id', componentId);
            wrapper.setAttribute('data-component-name', componentName);
            wrapper.style.display = 'contents'; // Make wrapper invisible
            wrapper.appendChild(newElements);
            element.parentNode.replaceChild(wrapper, element);
            
            // DEBUGGING: Log replacement result
            if (componentId.includes('CryptoHeader') || componentId.includes('ThemeToggle') || componentId.includes('WalletConnect')) {
              console.log(`[0x1 JSX] Replaced with fragment wrapper for ${componentId}`);
            }
          } else if (newElements instanceof Element) {
            // Ensure metadata is preserved
            newElements.setAttribute('data-component-id', componentId);
            newElements.setAttribute('data-component-name', componentName);
            element.parentNode.replaceChild(newElements, element);
            
            // DEBUGGING: Log replacement result
            if (componentId.includes('CryptoHeader') || componentId.includes('ThemeToggle') || componentId.includes('WalletConnect')) {
              console.log(`[0x1 JSX] Replaced with new element for ${componentId}:`, newElements.outerHTML.substring(0, 200) + '...');
            }
          }
        }
      });
      
      console.debug(`[0x1 JSX] Successfully re-rendered component ${componentId}`);
    } catch (error) {
      console.error(`[0x1 JSX] Error re-rendering component ${componentId}:`, error);
    } finally {
      clearContext();
    }
  }
  
  // CRITICAL FIX: Set context for this component and DO NOT clear it immediately
  // This allows nested components to inherit the context
  setContext(componentId, updateCallback);
  
  try {
    const result = type(props);
    
    // CRITICAL: Ensure component metadata is applied to the result
    const enhancedResult = ensureComponentMetadata(result, componentId, componentName);
    
    return enhancedResult;
    
  } catch (error: any) {
    console.error('[0x1 JSX] Component error:', error);
    
    // Return error boundary fallback
    return {
      type: 'div',
      props: { 
        className: 'error-boundary',
        style: { color: 'red', padding: '10px', border: '1px solid red' },
        'data-component-id': componentId,
        'data-component-name': componentName
      },
      children: [`Error in ${componentName}: ${error.message}`],
      key: null
    };
  }
  // REMOVED: Don't clear context here - let the hooks system manage context lifecycle
  // This allows nested components to access the parent's context
}

/**
 * Ensure component metadata is applied to JSX result for re-render tracking
 */
function ensureComponentMetadata(result: JSXNode, componentId: string, componentName: string): JSXNode {
  if (!result || typeof result !== 'object') {
    return result;
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
  
  // Handle arrays (fragments)
  if (Array.isArray(result)) {
    // Wrap array in a container with metadata
    return {
      type: 'div',
      props: {
        'data-component-id': componentId,
        'data-component-name': componentName,
        'data-component-wrapper': 'true',
        style: { display: 'contents' }
      },
      children: result,
      key: componentId
    };
  }
  
  // Handle other objects by wrapping them
  return {
    type: 'div',
    props: {
      'data-component-id': componentId,
      'data-component-name': componentName,
      'data-component-wrapper': 'true',
      style: { display: 'contents' }
    },
    children: [result],
    key: componentId
  };
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