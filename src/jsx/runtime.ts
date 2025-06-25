/**
 * 0x1 Framework JSX Runtime
 * Production-ready JSX runtime implementation
 */

// Core types
export type JSXNode = string | number | boolean | null | undefined | JSXElement | JSXNode[];
export type JSXChildren = JSXNode | JSXNode[];
export type JSXAttributes = Record<string, any>;
export type ComponentFunction<P = any> = (props: P) => JSXNode;

// Extend Window interface for 0x1 direct DOM manipulation flags
declare global {
  interface Window {
    __0x1_directDOMActive?: boolean;
    __0x1_lastDirectDOMTime?: number;
    __0x1_pendingDirectUpdates?: number;
  }
}

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
 * Call component with proper hooks context - 0x1 PHILOSOPHY: COMPONENTS RUN ONCE
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
  
  // CRITICAL FIX: Stable component ID system to prevent header elements disappearing
  let componentId: string;
  
  // Generate stable key based on component name and route
  const routePath = (typeof window !== 'undefined' ? window.location.pathname : '/').replace(/[^a-zA-Z0-9]/g, '_') || 'root';
  const stableIdKey = `${componentName}_${routePath}`;
  
  if (typeof window !== 'undefined') {
    // Initialize stable ID registry if not exists
    if (!(window as any).__0x1_stableComponentIds) {
      (window as any).__0x1_stableComponentIds = new Map();
    }
    
    const stableIds = (window as any).__0x1_stableComponentIds;
    
    if (stableIds.has(stableIdKey)) {
      // Use existing stable ID
      componentId = stableIds.get(stableIdKey);
      console.log(`[0x1 JSX] Using stable component ID: ${componentId}`);
    } else {
      // Generate new stable ID and store it
      componentId = `${componentName}_${routePath}_${Math.random().toString(36).slice(2, 3)}`;
      stableIds.set(stableIdKey, componentId);
      console.log(`[0x1 JSX] Generated stable component ID: ${componentId}`);
    }
  } else {
    // Fallback for non-browser environments
    componentId = `${componentName}_${Math.random().toString(36).slice(2, 5)}`;
    console.log(`[0x1 JSX] Generated fallback component ID: ${componentId}`);
  }
  
  // 🎯 0X1 PHILOSOPHY: COMPONENTS RUN ONCE - PURE DIRECT DOM MANIPULATION
  console.log(`[0x1 JSX] Component ${componentId} will run ONCE - no re-renders`);
  
  // Set context for this component
  setContext(componentId);
  
  try {
    const result = type(props);
    
    // CRITICAL: Ensure component metadata is applied to the result
    const enhancedResult = ensureComponentMetadata(result, componentId, componentName);
    
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
  } finally {
    clearContext();
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
    
    // CRITICAL: For layout components, ensure metadata is ALWAYS applied
    if (componentName.includes('Layout') || componentName.includes('layout')) {
      console.log(`[0x1 JSX] LAYOUT METADATA: Applied to ${componentName} with ID ${componentId}`);
      
      // CRITICAL FIX: Apply PRIMARY metadata to first child (where the actual DOM element is)
      if (Array.isArray(jsxElement.children) && jsxElement.children.length > 0) {
        const firstChild = jsxElement.children[0];
        if (firstChild && typeof firstChild === 'object' && 'type' in firstChild && 'props' in firstChild) {
          const childType = firstChild.type as string;
          if (['div', 'main', 'section', 'article', 'aside', 'header', 'footer'].includes(childType)) {
            if (!firstChild.props) {
              firstChild.props = {};
            }
            // Apply PRIMARY metadata (not backup) - hooks system needs data-component-id
            firstChild.props['data-component-id'] = componentId;
            firstChild.props['data-component-name'] = componentName;
            console.log(`[0x1 JSX] LAYOUT PRIMARY: Applied PRIMARY metadata to first child ${childType}`);
          }
        }
      }
    }
    
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
        
        // CRITICAL: For layout components, ensure the FIRST element gets primary metadata
        if ((componentName.includes('Layout') || componentName.includes('layout')) && index === 0) {
          console.log(`[0x1 JSX] LAYOUT FRAGMENT: Applied primary metadata to first element of ${componentName}`);
          
          // CRITICAL FIX: First element of layout fragment gets the PRIMARY component ID
          // This ensures hooks system can find layout components
          enhancedChild.props['data-component-id'] = componentId;
          enhancedChild.props['data-component-name'] = componentName;
        }
        
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
 * Enhanced renderToDOM with direct DOM manipulation support
 * 0x1 PHILOSOPHY: Components render once, state changes use direct DOM manipulation
 */
export function renderToDOM(node: any, parentElement?: HTMLElement): HTMLElement | Text | DocumentFragment | null {
  try {
    if (node === null || node === undefined) return null;
    
    if (typeof node === 'string' || typeof node === 'number') {
      return document.createTextNode(String(node));
    }
    
    if (Array.isArray(node)) {
      const fragment = document.createDocumentFragment();
      node.forEach((child: any) => {
        const childElement = renderToDOM(child, parentElement);
        if (childElement) fragment.appendChild(childElement);
      });
      return fragment;
    }
    
    if (typeof node === 'object' && node.type) {
      // Handle Fragment using standardized symbol
      if (node.type === Fragment) {
        const fragment = document.createDocumentFragment();
        if (node.children) {
          const children = Array.isArray(node.children) ? node.children : [node.children];
          children.forEach((child: any) => {
            const childElement = renderToDOM(child, parentElement);
            if (childElement) fragment.appendChild(childElement);
          });
        }
        return fragment;
      }
      
      // Handle function components
      if (typeof node.type === 'function') {
        const result = callComponentWithContext(node.type, node.props);
        
        // CRITICAL FIX: Transfer component metadata from node.props to the result
        // This ensures layout components get their data-component-id in the DOM
        if (result && typeof result === 'object' && 'props' in result && node.props) {
          const componentId = node.props['data-component-id'];
          const componentName = node.props['data-component-name'];
          
          if (componentId && !result.props['data-component-id']) {
            if (!result.props) result.props = {};
            result.props['data-component-id'] = componentId;
            console.log(`[0x1 JSX] TRANSFER: Applied component ID ${componentId} to function component result`);
          }
          
          if (componentName && !result.props['data-component-name']) {
            if (!result.props) result.props = {};
            result.props['data-component-name'] = componentName;
            console.log(`[0x1 JSX] TRANSFER: Applied component name ${componentName} to function component result`);
          }
        }
        
        return renderToDOM(result, parentElement);
      }
      
      // Handle DOM elements - Fixed SVG handling
      const tagName = node.type as string;
      let element: HTMLElement | SVGElement;
      
      // SVG elements need special namespace handling
      const svgElements = new Set([
        'svg', 'path', 'circle', 'rect', 'line', 'ellipse', 'polygon', 'polyline',
        'g', 'defs', 'use', 'symbol', 'marker', 'clipPath', 'mask', 'pattern',
        'linearGradient', 'radialGradient', 'stop', 'text', 'tspan', 'textPath',
        'foreignObject', 'switch', 'animate', 'animateTransform', 'animateMotion'
      ]);
      
      if (svgElements.has(tagName)) {
        element = document.createElementNS('http://www.w3.org/2000/svg', tagName) as SVGElement;
      } else {
        element = document.createElement(tagName) as HTMLElement;
      }

      // Set attributes and properties
      Object.entries(node.props || {}).forEach(([key, value]) => {
        if (key === 'children') return;
        
        // 🚨 CRITICAL DEBUG: Log component ID attributes being set
        if (key === 'data-component-id') {
          console.log(`[0x1 JSX] 🎯 SETTING data-component-id="${value}" on ${tagName} element`);
        }
        
        if (key === 'className') {
          // SVG elements need class attribute, not className property
          if (svgElements.has(tagName)) {
            element.setAttribute('class', String(value));
          } else {
            (element as HTMLElement).className = String(value);
          }
        } else if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.slice(2).toLowerCase();
          
          // 🎯 0X1 DIRECT DOM MANIPULATION: Store event handlers for state change access
          (element as any)[`__0x1_${eventName}_handler`] = value;
          
          // Attach event listener normally
            element.addEventListener(eventName, value as EventListener);
          
          // 🎯 0X1 PHILOSOPHY: Set up direct DOM state change listener
          // This allows components to respond to state changes via direct DOM manipulation
          if (eventName === 'click' || eventName === 'change') {
            element.addEventListener('0x1-state-change', (event: Event) => {
              const customEvent = event as CustomEvent;
              const { componentId, hookIndex, newValue, oldValue } = customEvent.detail;
              
              console.log(`[0x1 Direct DOM] ${tagName} element responding to state change in ${componentId}:`, oldValue, '->', newValue);
              
              // 🚨 CRITICAL FIX: ACTUAL VISUAL UPDATES BASED ON STATE CHANGES
              // Update the visual state of the element based on the new value
              
              if (tagName === 'button') {
                // Handle button state changes (active/inactive, pressed, etc.)
                if (typeof newValue === 'boolean') {
                  if (newValue) {
                    element.classList.add('active', 'pressed');
                    element.setAttribute('aria-pressed', 'true');
                  } else {
                    element.classList.remove('active', 'pressed');
                    element.setAttribute('aria-pressed', 'false');
                  }
                }
              }
              
              // Handle dropdown visibility
              if (element.classList.contains('dropdown-toggle') || element.getAttribute('data-dropdown')) {
                const dropdownId = element.getAttribute('data-dropdown');
                if (dropdownId && typeof newValue === 'boolean') {
                  const dropdown = document.getElementById(dropdownId) || 
                                 document.querySelector(`[data-dropdown-content="${dropdownId}"]`);
                  if (dropdown) {
                    if (newValue) {
                      dropdown.classList.remove('hidden');
                      dropdown.classList.add('block');
                    } else {
                      dropdown.classList.add('hidden');
                      dropdown.classList.remove('block');
                    }
                  }
                }
              }
              
              // Handle toggle states (web search, etc.)
              if (element.getAttribute('data-toggle') || element.classList.contains('toggle')) {
                if (typeof newValue === 'boolean') {
                  element.setAttribute('data-state', newValue ? 'on' : 'off');
                  
                  // Update text content if it contains state indicators
                  const textContent = element.textContent || '';
                  if (textContent.includes('ON') || textContent.includes('OFF')) {
                    element.textContent = textContent.replace(/ON|OFF/g, newValue ? 'ON' : 'OFF');
                  }
                  
                  // Update toggle classes
                  if (newValue) {
                    element.classList.add('toggle-on', 'active');
                    element.classList.remove('toggle-off');
                  } else {
                    element.classList.add('toggle-off');
                    element.classList.remove('toggle-on', 'active');
                  }
                }
              }
              
              // Store state for access by other elements
              (element as any).__0x1_state = (element as any).__0x1_state || {};
              (element as any).__0x1_state[hookIndex] = newValue;
            });
          }
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign((element as HTMLElement).style, value as CSSStyleDeclaration);
        } else if (typeof value === 'boolean') {
          if (value) element.setAttribute(key, '');
        } else if (value != null) {
          // For SVG elements, use setAttribute for all attributes
          element.setAttribute(key, String(value));
          
          // 🚨 CRITICAL DEBUG: Verify component ID was actually set
          if (key === 'data-component-id') {
            const actualValue = element.getAttribute('data-component-id');
            console.log(`[0x1 JSX] ✅ VERIFIED: data-component-id="${actualValue}" was set on ${tagName}`);
            
            // 🚨 CRITICAL FIX: Add component-wide state change listener for ALL elements
            // This ensures ANY element in a component can respond to state changes
            console.log(`[0x1 JSX] 🎯 ADDING state change listener to ${tagName} with ID ${actualValue}`);
            
            try {
              // 🎯 0X1 PHILOSOPHY: PURE DIRECT DOM MANIPULATION ONLY
              element.addEventListener('0x1-state-change', (event: Event) => {
                try {
                  const customEvent = event as CustomEvent;
                  const { hookIndex, newValue, oldValue, componentId: eventComponentId } = customEvent.detail || {};
                  
                  // Only respond to state changes for this component
                  if (eventComponentId === actualValue) {
                    // Store the state value on the element for other code to access
                    (element as any).__0x1_state = (element as any).__0x1_state || {};
                    (element as any).__0x1_state[hookIndex] = newValue;
                  }
                } catch (err) {
                  console.error(`[0x1 JSX] ❌ Error in state-change listener for ${tagName}:`, err);
                }
              });
              
              console.log(`[0x1 JSX] ✅ State listener attached to ${tagName} with ID ${actualValue}`);
            } catch (err) {
              console.error(`[0x1 JSX] ❌ Failed to attach event listener to ${tagName}:`, err);
            }
          }
        }
      });
      
      // Add children
      if (node.children) {
        const children = Array.isArray(node.children) ? node.children : [node.children];
        children.forEach((child: any) => {
          const childElement = renderToDOM(child, element as HTMLElement);
          if (childElement) element.appendChild(childElement);
        });
      }
      
      return element as HTMLElement;
    }
    
    return null;
  } catch (error) {
    console.error('[0x1 JSX] renderToDOM error:', error);
    return document.createTextNode(`[Render Error: ${(error as Error).message}]`);
  }
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
// 0X1 DIRECT DOM MANIPULATION HELPERS
// ============================================================================

/**
 * Helper function to create state-responsive elements
 * 0x1 PHILOSOPHY: Elements update themselves based on state changes
 */
export function createStateResponsiveElement(
  tagName: string, 
  props: any = {}, 
  stateHandler?: (element: HTMLElement, stateDetail: any) => void
): HTMLElement {
  const element = document.createElement(tagName);
  
  // Set initial properties
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = String(value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value as EventListener);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (typeof value === 'boolean') {
      if (value) element.setAttribute(key, '');
    } else if (value != null) {
      element.setAttribute(key, String(value));
    }
  });
  
  // Set up state change listener if handler provided
  if (stateHandler) {
    element.addEventListener('0x1-state-change', (event: Event) => {
      const customEvent = event as CustomEvent;
      stateHandler(element, customEvent.detail);
    });
  }
  
  return element;
}

/**
 * Helper to create toggle buttons that respond to state changes
 * EXAMPLE: For dropdown toggles, web search toggles, etc.
 */
export function createToggleButton(
  text: string,
  stateHookIndex: number,
  onClick: () => void,
  className?: string
): HTMLElement {
  return createStateResponsiveElement('button', {
    className: className || 'toggle-button',
    onClick
  }, (element, stateDetail) => {
    // Only respond to changes in our specific state hook
    if (stateDetail.hookIndex === stateHookIndex) {
      const isActive = stateDetail.newValue;
      
      // Update button appearance based on state
      if (isActive) {
        element.classList.add('active');
        element.setAttribute('aria-pressed', 'true');
      } else {
        element.classList.remove('active');
        element.setAttribute('aria-pressed', 'false');
      }
      
      console.log(`[0x1 Toggle] Button "${text}" state changed to:`, isActive);
    }
  });
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
    
    // 🎯 0X1 DIRECT DOM MANIPULATION: Make helpers globally available
    (window as any).createStateResponsiveElement = createStateResponsiveElement;
    (window as any).createToggleButton = createToggleButton;
    
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
    
    console.log('[0x1 JSX] ✅ Pure direct DOM manipulation runtime loaded - NO RE-RENDERS');
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure this runs after all module code is parsed
  setTimeout(initializeGlobalJSXRuntime, 0);
} 