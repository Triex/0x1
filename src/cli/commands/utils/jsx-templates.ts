/**
 * JSX Runtime Templates and Utilities
 * This module provides JSX runtime implementations for the 0x1 framework
 */

import { logger } from "../../utils/logger";

/**
 * Generates the JSX runtime compatibility layer for browser use
 */
export function generateJsxRuntime(isDevRuntime = false): string {
  const baseScript = `
(function(global) {
  'use strict';
  
  // Define Fragment symbol
  const Fragment = Symbol.for('react.fragment');
  
  // AGGRESSIVE FRAGMENT RESOLUTION - Must run first!
  (function() {
    // Set up global Fragment immediately
    global.Fragment = Fragment;
    global.React = global.React || {};
    global.React.Fragment = Fragment;
    
    // Pre-populate common mangled Fragment names that we've seen in errors
    const commonFragmentNames = [
      'Fragment_8vg9x3sq', 'Fragment_7x81h0kn', 'Fragment_1a2b3c4d', 
      'Fragment_x1y2z3a4', 'Fragment_abc123', 'Fragment_def456', 
      'Fragment_ghi789', 'Fragment_9z8y7x6w', 'Fragment_m5n6o7p8'
    ];
    
    commonFragmentNames.forEach(name => {
      if (!global[name]) {
        global[name] = Fragment;
      }
    });
    
    // Set up global error handler for undefined Fragment variables
    global.onerror = function(message, source, lineno, colno, error) {
      if (message && message.includes('is not defined') && message.includes('Fragment')) {
        const match = message.match(/(Fragment_[a-zA-Z0-9]+) is not defined/);
        if (match) {
          global[match[1]] = Fragment;
          console.log('[0x1 JSX] Auto-resolved Fragment variable:', match[1]);
          return true; // Prevent error from propagating
        }
      }
      return false;
    };
    
    // Set up error event listener as backup
    if (typeof global.addEventListener === 'function') {
      global.addEventListener('error', function(event) {
        if (event.message && event.message.includes('is not defined') && event.message.includes('Fragment')) {
          const match = event.message.match(/(Fragment_[a-zA-Z0-9]+) is not defined/);
          if (match) {
            global[match[1]] = Fragment;
            console.log('[0x1 JSX] Auto-resolved Fragment variable via event:', match[1]);
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
        }
      });
    }
    
    // Skip the Proxy approach since it's causing issues with Window prototype
    console.log('[0x1 JSX] Fragment pre-resolution complete');
  })();

  // Create a flexible element factory that handles all JSX scenarios
  function createElementFromJSX(type, props, key, source, self) {
    console.log('[0x1 JSX] Creating element:', { type, props, key });
    
    try {
      // Handle Fragment
      if (type === Fragment || (typeof type === 'symbol' && type.toString().includes('Fragment'))) {
        console.log('[0x1 JSX] Rendering Fragment');
        const fragment = document.createDocumentFragment();
        if (props && props.children) {
          const children = Array.isArray(props.children) ? props.children : [props.children];
          children.forEach(child => {
            if (child != null) {
              if (typeof child === 'string' || typeof child === 'number') {
                fragment.appendChild(document.createTextNode(String(child)));
              } else if (child.nodeType) {
                fragment.appendChild(child);
              } else {
                const childElement = createElementFromJSX(child.type, child.props);
                if (childElement) fragment.appendChild(childElement);
              }
            }
          });
        }
        return fragment;
      }
      
      // Handle HTML elements
      if (typeof type === 'string') {
        console.log('[0x1 JSX] Rendering HTML element:', type);
        const element = document.createElement(type);
        
        // Apply props with enhanced event handling
        if (props) {
          Object.entries(props).forEach(([key, value]) => {
            if (key === 'children') return;
            
            if (key === 'className') {
              element.className = String(value);
              return;
            }
            
            if (key === 'style' && typeof value === 'object') {
              Object.entries(value).forEach(([cssKey, cssValue]) => {
                element.style[cssKey] = cssValue;
              });
              return;
            }
            
            // Enhanced event handler attachment with debugging
            if (key.startsWith('on') && typeof value === 'function') {
              const eventName = key.slice(2).toLowerCase();
              console.log('[0x1 JSX] Attaching event handler:', eventName, 'to', type);
              
              element.addEventListener(eventName, (event) => {
                console.log('[0x1 JSX] Event triggered:', eventName, 'on', type);
                try {
                  value(event);
                } catch (error) {
                  console.error('[0x1 JSX] Error in event handler:', error);
                }
              });
              return;
            }
            
            if (value !== undefined && value !== null) {
              element.setAttribute(key, String(value));
            }
          });
          
          // Handle children
          if (props.children) {
            const children = Array.isArray(props.children) ? props.children : [props.children];
            children.forEach(child => {
              if (child != null) {
                if (typeof child === 'string' || typeof child === 'number') {
                  element.appendChild(document.createTextNode(String(child)));
                } else if (child.nodeType) {
                  element.appendChild(child);
                } else {
                  const childElement = createElementFromJSX(child.type, child.props);
                  if (childElement) element.appendChild(childElement);
                }
              }
            });
          }
        }
        
        return element;
      }
      
      // Handle function components with enhanced tracking
      if (typeof type === 'function') {
        console.log('[0x1 JSX] Rendering function component:', type.name || 'Anonymous');
        
        try {
          // Set up component tracking
          const hooks = global.__0x1_hooks;
          const componentName = type.name || 'Anonymous';
          const componentId = \`\${componentName}-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
          
          if (hooks) {
            hooks.currentComponent = componentId;
            hooks.stateIndex = 0;
            hooks.effectIndex = 0;
            hooks.memoIndex = 0;
            hooks.refIndex = 0;
            console.log('[0x1 JSX] Set component context:', componentId);
          }

          // Render the component
          const result = type({
            ...props,
            children: props?.children
          });
          
          console.log('[0x1 JSX] Component result:', result);

          // Convert result to DOM element
          const domElement = result?.nodeType ? result : createElementFromJSX(result?.type || result, result?.props || {});
          
          // Set up re-rendering for this component if we have hooks
          if (hooks && domElement && hooks.registerComponent) {
            let currentDomElement = domElement;
            
            hooks.registerComponent(componentId, () => {
              console.log('[0x1 JSX] Re-rendering component:', componentName);
              
              // Reset hook indices for re-render
              hooks.currentComponent = componentId;
              hooks.stateIndex = 0;
              hooks.effectIndex = 0;
              hooks.memoIndex = 0;
              hooks.refIndex = 0;
              
              try {
                const newResult = type({
                  ...props,
                  children: props?.children
                });
                const newDomElement = newResult?.nodeType ? newResult : createElementFromJSX(newResult?.type || newResult, newResult?.props || {});
                
                if (newDomElement && currentDomElement && currentDomElement.parentNode) {
                  console.log('[0x1 JSX] Replacing DOM element for component:', componentName);
                  currentDomElement.parentNode.replaceChild(newDomElement, currentDomElement);
                  currentDomElement = newDomElement; // Update reference
                  
                  // Re-register with the new DOM element
                  hooks.registerComponent(componentId, arguments.callee);
                } else {
                  console.error('[0x1 JSX] Failed to replace DOM element - missing parent or element');
                }
              } catch (error) {
                console.error('[0x1 JSX] Error during component re-render:', error);
              } finally {
                // Clear component context
                hooks.currentComponent = null;
              }
            });
          }
          
          return domElement;
        } catch (error) {
          console.error('[0x1 JSX] Error rendering component:', error);
          return document.createComment(\`JSX Error: \${error.message}\`);
        }
      }
      
      console.log('[0x1 JSX] Unknown type, returning null:', type);
      return null;
    } catch (error) {
      console.error('[0x1 JSX] Error in createElementFromJSX:', error);
      return document.createComment(\`JSX Error: \${error.message}\`);
    }
  }
  
  // Expose the JSX runtime functions to window
  global.Fragment = Fragment;
  global.jsx = createElementFromJSX;
  global.jsxs = createElementFromJSX; // Same impl for both
  global.jsxDEV = createElementFromJSX; // For React 17+ dev runtime

  // For compatibility with jsx-runtime
  global.jsx_runtime = {
    jsx: createElementFromJSX,
    jsxs: createElementFromJSX,
    jsxDEV: createElementFromJSX,
    Fragment
  };
  
  // For ES module imports
  const jsx = createElementFromJSX;
  const jsxs = createElementFromJSX;
  
  // Export for module bundlers
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { jsx, jsxs, Fragment };
  }

  ${isDevRuntime ? `
  // Development-only helpers
  global._0x1_JSX_DEV = {
    refresh: function() {
      console.log('[0x1 JSX] Refreshing components...');
      // Implementation for dev refresh
      const event = new CustomEvent('0x1-refresh');
      document.dispatchEvent(event);
    },
    version: '0.1.0'
  };
  ` : ''}
  
  console.log('[0x1 JSX] Runtime initialized with Fragment resolution');
})(typeof window !== 'undefined' ? window : globalThis);

// For ES modules
export const jsx = typeof window !== 'undefined' ? window.jsx : null;
export const jsxs = typeof window !== 'undefined' ? window.jsxs : null;
export const jsxDEV = typeof window !== 'undefined' ? window.jsxDEV : null;
export const Fragment = typeof window !== 'undefined' ? window.Fragment : Symbol.for('react.fragment');
`;

  return baseScript;
}

/**
 * Generates a React compatibility shim for legacy React components
 */
export function generateReactShim(): string {
  return `
/**
 * 0x1 Framework React Compatibility Shim
 * This provides React compatibility for components that expect React
 */
(function(window) {
  // Make sure our JSX runtime is loaded
  if (!window.jsx || !window.jsxs || !window.Fragment) {
    console.error('0x1 JSX runtime not found. The React shim requires the JSX runtime to be loaded first.');
    return;
  }

  // Create a minimal React-like API using our JSX runtime
  const React = {
    createElement: window.jsx,
    Fragment: window.Fragment,
    createContext: function(defaultValue) {
      let currentValue = defaultValue;
      const consumers = [];
      
      return {
        Provider: function({ value, children }) {
          currentValue = value;
          consumers.forEach(callback => callback(value));
          return children;
        },
        Consumer: function({ children }) {
          if (typeof children === 'function') {
            const result = children(currentValue);
            return result;
          }
          return children;
        },
        _currentValue: currentValue
      };
    },
    // Minimal useState implementation
    useState: function(initialState) {
      const state = typeof initialState === 'function' ? initialState() : initialState;
      const setState = function(newState) {
        // This is a minimal implementation that just logs
        // In a real implementation, this would trigger re-rendering
        console.warn('useState setState called but 0x1 shim does not support real state updates');
      };
      return [state, setState];
    }
  };

  // Expose to window for global access
  window.React = React;
})(typeof window !== 'undefined' ? window : globalThis);
  `;
}

/**
 * Interface for a Server-Sent Events client
 */
export interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  lastActive: number;
}

/**
 * Handle SSE connection
 */
export function handleSSEConnection(req: Request, sseClients: Map<string, SSEClient>): Response {
  const id = `sse-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  logger.debug(`[0x1] SSE client connecting (${id})`);
  
  // Create a new stream
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller and client info
      sseClients.set(id, {
        id,
        controller,
        lastActive: Date.now()
      });
      
      // Send initial connection message
      const connectMessage = `event: connect\ndata: ${id}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectMessage));
      
      logger.debug(`[0x1] SSE client connected (${id})`);
    },
    cancel() {
      // Remove the client when the connection is closed
      sseClients.delete(id);
      logger.debug(`[0x1] SSE client disconnected (${id})`);
    }
  });
  
  // Return the SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

/**
 * Broadcast a message to all connected SSE clients
 */
export function broadcastToSSE(
  sseClients: Map<string, SSEClient>, 
  type: 'reload' | 'css', 
  path?: string
): void {
  if (sseClients.size === 0) {
    return; // No clients connected
  }
  
  const message = `event: ${type}\ndata: ${path ? JSON.stringify({ path }) : '{}'}\n\n`;
  const data = new TextEncoder().encode(message);
  
  // Send the message to all connected clients
  for (const client of sseClients.values()) {
    try {
      client.controller.enqueue(data);
      client.lastActive = Date.now();
      logger.debug(`[0x1] Sent ${type} event to client ${client.id}`);
    } catch (err) {
      logger.error(`[0x1] Error sending to SSE client ${client.id}: ${err}`);
      sseClients.delete(client.id);
    }
  }
}

/**
 * Clean up inactive SSE clients
 */
export function cleanupSSE(sseClients: Map<string, SSEClient>): number {
  if (sseClients.size === 0) {
    return 0;
  }
  
  const now = Date.now();
  const timeout = 60000; // 1 minute timeout
  let cleaned = 0;
  
  // Remove clients that haven't been active for more than the timeout
  for (const [id, client] of sseClients.entries()) {
    if (now - client.lastActive > timeout) {
      try {
        client.controller.close();
      } catch (err) {
        // Ignore errors on close
      }
      sseClients.delete(id);
      cleaned++;
      logger.debug(`[0x1] Cleaned up inactive SSE client ${id}`);
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`[0x1] Cleaned up ${cleaned} inactive SSE clients`);
  }
  
  return cleaned;
}

/**
 * Create an endpoint handler for the JSX runtime script
 * @param isDevRuntime Whether to include development-specific JSX functionality
 */
export function createJsxRuntimeEndpoint(isDevRuntime = false): (req: Request) => Response | undefined {
  // Generate the JSX runtime script once
  const jsxRuntimeScript = generateJsxRuntime(isDevRuntime);
  
  // Return a handler function
  return (req: Request): Response | undefined => {
    const url = new URL(req.url);
    
    // Check if this is a request for the JSX runtime
    if (url.pathname === "/0x1/jsx-runtime.js") {
      logger.debug("Serving JSX runtime");
      
      // Always serve as JavaScript module regardless of query params
      return new Response(jsxRuntimeScript, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }
    
    // Not a JSX runtime request
    return undefined;
  };
}

/**
 * Injects the JSX runtime script tag into the HTML template
 */
export function injectJsxRuntime(htmlTemplate: string): string {
  // Insert our JSX runtime script before the closing </head> tag
  return htmlTemplate.replace(
    '</head>',
    '<script type="module" src="/0x1/jsx-runtime.js"></script>\n</head>'
  );
}

/**
 * Generate a client-side router module from the framework's router
 */
export function generateRouterModule(): string {
  try {
    logger.info("[0x1] Generating browser-compatible router module");
    
    // Instead of trying to transform TypeScript, we'll use a simplified router implementation
    const routerScript = `
/**
 * 0x1 Framework Client-side Router
 * This is an automatically generated browser-compatible version
 */

(function(window) {
  // Define the Router class for browser use
  class Router {
    constructor(options) {
      this.rootElement = options.rootElement;
      this.routes = [];
      this.mode = options.mode || "hash";
      this.transitionDuration = options.transitionDuration || 0;
      this.rootLayout = options.rootLayout;
      this.hydrate = options.hydrate || false;
      this.suspense = options.suspense || false;
      this.currentPath = "";
      this.notFoundComponent = options.notFoundComponent || function(props) {
        // Default 404 component
        const container = document.createElement("div");
        container.className = "flex flex-col items-center justify-center min-h-screen text-center px-4";
        
        const errorCode = document.createElement("h1");
        errorCode.className = "text-5xl font-bold text-gray-800 dark:text-gray-200 mb-4";
        errorCode.textContent = "404";
        container.appendChild(errorCode);
        
        const title = document.createElement("h2");
        title.className = "text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6";
        title.textContent = "Page Not Found";
        container.appendChild(title);
        
        const text = document.createElement("p");
        text.className = "text-gray-600 dark:text-gray-400 mb-8";
        text.textContent = "The page you are looking for doesn't exist or has been moved.";
        container.appendChild(text);
        
        const link = document.createElement("a");
        link.href = "/";
        link.className = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors";
        link.textContent = "Back to Home";
        container.appendChild(link);
        
        return container;
      };
      
      if (options.appComponents && Object.keys(options.appComponents).length > 0) {
        this.initAppDirectoryRoutes(options.appComponents);
      } else if (options.autoDiscovery) {
        const dummyRoot = () => {
          const element = document.createElement("div");
          element.id = "0x1-auto-discovery-root";
          return element;
        };
        this.addRoute("/", dummyRoot, true);
        console.log("🔍 Using automatic component discovery");
      }
    }
    
    // Add a route to the router
    addRoute(path, component, exactOrOptions = true, layouts) {
      // Handle different argument patterns
      let exact = true;
      let layoutsList = null;
      
      // If third argument is an object, it contains options
      if (typeof exactOrOptions === 'object') {
        // New-style API: addRoute(path, component, {layout, exact})
        const options = exactOrOptions;
        exact = options.exact !== undefined ? options.exact : true;
        
        // Handle both layout and layouts properties
        if (options.layout) {
          layoutsList = [options.layout];
        } else if (options.layouts && Array.isArray(options.layouts)) {
          layoutsList = options.layouts;
        }
      } else {
        // Old-style API: addRoute(path, component, exact, layouts)
        exact = exactOrOptions === undefined ? true : !!exactOrOptions;
        layoutsList = layouts;
      }
      
      // Add the route
      this.routes.push({
        path,
        component,
        exact: exact,
        layouts: layoutsList
      });
    }
    
    // Add a route with children
    addRouteWithChildren(route) {
      this.routes.push(route);
    }
    
    // Navigate to a specific path
    navigate(path) {
      if (this.mode === "hash") {
        window.location.hash = path;
      } else {
        window.history.pushState(null, null, path);
        this.handleRouteChange();
      }
    }
    
    // Replace current history state with new path
    replaceState(path) {
      if (this.mode === "hash") {
        const currentHash = window.location.hash;
        if (currentHash.slice(1) !== path) {
          window.location.replace('#' + path);
        }
      } else {
        window.history.replaceState(null, null, path);
        this.handleRouteChange();
      }
    }
    
    // Initialize the router
    init() {
      // Set up event listeners
      if (this.mode === "hash") {
        window.addEventListener("hashchange", () => this.handleRouteChange());
      } else {
        window.addEventListener("popstate", () => this.handleRouteChange());
        // Intercept link clicks for history mode
        document.addEventListener("click", (e) => {
          // Only handle links with href attribute that should be handled by the router
          if (e.target && e.target.tagName === "A" && e.target.href && !e.target.hasAttribute("target") && 
              !e.target.hasAttribute("download") && e.target.hostname === window.location.hostname) {
            e.preventDefault();
            const href = e.target.getAttribute("href");
            this.navigate(href);
          }
        });
      }
      // Initial route handling
      this.handleRouteChange();
    }
    
    // Handle route changes
    async handleRouteChange() {
      const path = this.getPath();
      if (path === this.currentPath) {
        return; // Avoid re-rendering the same path
      }
      this.currentPath = path;
      
      // Find the matching route
      const route = this.findMatchingRoute(path);
      
      if (route) {
        try {
          // Extract route parameters
          const params = this.extractParams(route, path);
          
          // Get component function (applying layouts if necessary)
          let component = route.component;
          if (route.layouts && route.layouts.length > 0) {
            component = this.applyLayouts(component, route.layouts, params);
          } else if (this.rootLayout) {
            component = this.applyLayouts(component, [this.rootLayout], params);
          }
          
          // Render the component with params
          const result = component({ params });
          this.renderResult(result);
        } catch (error) {
          console.error("[0x1] Error rendering route:", error);
          this.handleNotFound();
        }
      } else {
        // No matching route found
        this.handleNotFound();
      }
    }
    
    // Handle 404 - Not Found
    handleNotFound() {
      try {
        const result = this.notFoundComponent({});
        this.renderResult(result);
      } catch (error) {
        console.error("[0x1] Error rendering not found component:", error);
        // Fallback error message
        this.renderErrorMessage("Page Not Found (404)");
      }
    }
    
    // Render an element to the DOM
    renderElement(jsxElement) {
      try {
        // Filter boolean values first if the global function exists
        let element = jsxElement;
        if (typeof window !== 'undefined' && window.__0x1_filterBooleanValues) {
          element = window.__0x1_filterBooleanValues(jsxElement);
        }
        
        // Handle primitive values
        if (typeof element === "string" || typeof element === "number") {
          return document.createTextNode(String(element));
        }
        
        // Handle boolean values (should be filtered already but just in case)
        if (typeof element === "boolean" || element == null) {
          return null;
        }
        
        // If it's already a DOM node, return it
        if (element instanceof Node) {
          return element;
        }
        
        // Check if this is a full HTML structure that should be preserved
        if (typeof window !== 'undefined' && window.__0x1_hasHtmlStructure && window.__0x1_hasHtmlStructure(element)) {
          console.log("[0x1] Detected full HTML structure in component");
          
          // If we have HTML structure in browser context, extract body content
          if (typeof window.__0x1_extractBodyContent === 'function') {
            const bodyContent = window.__0x1_extractBodyContent(element);
            if (bodyContent) {
              element = bodyContent;
            }
          }
        }
        
        // Handle arrays (fragments)
        if (Array.isArray(element)) {
          const fragment = document.createDocumentFragment();
          element.forEach(child => {
            const renderedChild = this.renderElement(child);
            if (renderedChild) {
              fragment.appendChild(renderedChild);
            }
          });
          return fragment;
        }
        
        // Handle React 19 compatible elements with $$typeof
        if (element && typeof element === "object" && element.$$typeof) {
          // Handle Fragment
          if (element.type === Symbol.for('react.fragment')) {
            const fragment = document.createDocumentFragment();
            const children = element.props.children;
            if (children) {
              const childArray = Array.isArray(children) ? children : [children];
              childArray.forEach(child => {
                const renderedChild = this.renderElement(child);
                if (renderedChild) {
                  fragment.appendChild(renderedChild);
                }
              });
            }
            return fragment;
          }
          
          // Handle function components
          if (typeof element.type === "function") {
            try {
              const result = element.type(element.props);
              return this.renderElement(result);
            } catch (err) {
              console.error("[0x1] Error rendering React component:", err);
              const errorElement = document.createElement('div');
              errorElement.className = 'component-error';
              errorElement.textContent = 'Error: ' + (err.message || String(err));
              return errorElement;
            }
          }
          
          // Handle DOM elements
          if (typeof element.type === "string") {
            const domElement = document.createElement(element.type);
            const props = element.props || {};
            
            // Add attributes
            Object.entries(props).forEach(([key, value]) => {
              if (key === "children") {
                // Handled separately
              } else if (key === "className") {
                domElement.className = value;
              } else if (key === "style" && typeof value === "object") {
                Object.assign(domElement.style, value);
              } else if (key === "dangerouslySetInnerHTML" && value && value.__html) {
                domElement.innerHTML = value.__html;
                return; // Skip children processing
              } else if (key.startsWith("on") && typeof value === "function") {
                const eventName = key.substring(2).toLowerCase();
                domElement.addEventListener(eventName, value);
              } else if (value !== undefined && value !== null && typeof value !== "function") {
                domElement.setAttribute(key, String(value));
              }
            });
            
            // Add children
            if (props.children) {
              const children = Array.isArray(props.children) ? props.children : [props.children];
              children.forEach(child => {
                if (child !== undefined && child !== null) {
                  const renderedChild = this.renderElement(child);
                  if (renderedChild) {
                    domElement.appendChild(renderedChild);
                  }
                }
              });
            }
            
            return domElement;
          }
        }
        // Handle legacy JSX elements (fallback)
        else if (element && typeof element === "object" && "type" in element) {
          const { type, props = {} } = element;
          
          // Handle functional components
          if (typeof type === "function") {
            try {
              const result = type(props);
              return this.renderElement(result);
            } catch (err) {
              console.error("[0x1] Error rendering legacy component:", err);
              const errorElement = document.createElement('div');
              errorElement.className = 'component-error';
              errorElement.textContent = 'Error: ' + (err.message || String(err));
              return errorElement;
            }
          }
          
          // Handle HTML elements
          if (typeof type === "string") {
            const domElement = document.createElement(type);
            
            // Add attributes
            Object.entries(props).forEach(([key, value]) => {
              if (key === "children") {
                // Handled separately
              } else if (key === "className") {
                domElement.className = value;
              } else if (key === "style" && typeof value === "object") {
                Object.assign(domElement.style, value);
              } else if (key.startsWith("on") && typeof value === "function") {
                const eventName = key.substring(2).toLowerCase();
                domElement.addEventListener(eventName, value);
              } else if (value !== undefined && value !== null) {
                domElement.setAttribute(key, String(value));
              }
            });
            
            // Add children
            if (props.children) {
              const children = Array.isArray(props.children) ? props.children : [props.children];
              children.forEach(child => {
                if (child !== undefined && child !== null) {
                  const renderedChild = this.renderElement(child);
                  if (renderedChild) {
                    domElement.appendChild(renderedChild);
                  }
                }
              });
            }
            
            return domElement;
          }
        }
        
        // Fallback for unknown types
        console.warn("[0x1] Unknown element type:", element);
        return document.createTextNode(String(element));
      } catch (err) {
        console.error("[0x1] Error rendering element:", err);
        const errorNode = document.createElement('div');
        errorNode.className = 'render-error';
        errorNode.textContent = 'Render Error: ' + (err.message || String(err));
        return errorNode;
      }
    }
    
    // Get the current path from either hash or location
    getPath() {
      if (this.mode === "hash") {
        return window.location.hash.slice(1) || "/";
      }
      return window.location.pathname || "/";
    }
    
    // Find a route that matches the given path
    findMatchingRoute(path) {
      console.log("[0x1] Finding matching route for: " + path);
      
      // Try exact match first
      for (let i = 0; i < this.routes.length; i++) {
        const route = this.routes[i];
        
        if (route.exact && route.path === path) {
          console.log("[0x1] Found exact route match: " + route.path);
          return {
            handler: route.component,
            params: {},
            layouts: route.layouts || null
          };
        }
      }
      
      // Try pattern matching for dynamic routes
      for (let i = 0; i < this.routes.length; i++) {
        const route = this.routes[i];
        
        if (route.path.includes(':') || route.path.includes('*')) {
          const params = this.extractParamsFromPath(route.path, path);
          if (params) {
            console.log("[0x1] Found dynamic route match: " + route.path);
            return {
              handler: route.component,
              params: params,
              layouts: route.layouts || null
            };
          }
        }
      }
      
      // No match found
      console.warn("[0x1] No route match found for path: " + path);
      return null;
    }
    
    // Extract parameters from a path based on a route pattern
    extractParamsFromPath(routePath, currentPath) {
      // Create pattern segments for matching
      const routeSegments = routePath.split('/');
      const pathSegments = currentPath.split('/');
      
      // Different segment count means no match
      // Unless the route has a wildcard at the end
      const hasWildcard = routePath.includes('*');
      if (!hasWildcard && routeSegments.length !== pathSegments.length) {
        return null;
      }
      
      const params = {};
      
      // Check each segment for match or parameter
      for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];
        
        // Handle parameter segment
        if (routeSegment.startsWith(':')) {
          const paramName = routeSegment.substring(1);
          params[paramName] = pathSegments[i];
          continue;
        }
        
        // Handle wildcard segment
        if (routeSegment === '*' || routeSegment.includes('*')) {
          const remainingPath = pathSegments.slice(i).join('/');
          params.wildcard = remainingPath;
          break;
        }
        
        // Handle exact match segment
        if (routeSegment !== pathSegments[i]) {
          // This segment doesn't match, so the whole route doesn't match
          return null;
        }
      }
      
      return params;
    }
    
    // Convert a path pattern to a regular expression
    // Simplified version for compatibility
    pathToRegex(path) {
      // We use a simpler implementation to avoid complex escaping issues
      if (path === '/') {
        // Handle root path specially (match '/' or empty string)
        return new RegExp("^/|^$");
      }
      return new RegExp("^" + path + "$");
    }
    
    // Render the result of a component
    renderResult(result) {
      // First check if result has a full HTML structure (React 19 compatible or legacy)
      const hasFullHtmlStructure = (result && typeof result === 'object' && 
                                   result.$$typeof && result.type === 'html') ||
                                  (result && typeof result === 'object' && 
                                   result.type === 'html' && result.props) ||
                                  (typeof window.__0x1_hasHtmlStructure === 'function' && 
                                   window.__0x1_hasHtmlStructure(result));
      
      if (hasFullHtmlStructure) {
        // For a full HTML structure, we want to extract the <body> content 
        // and replace the document's elements rather than nesting
        console.log("[0x1] Detected full HTML structure in layout");
        
        try {
          // Handle React 19 compatible elements with $$typeof
          if (result && result.$$typeof && result.type === 'html') {
            console.log("[0x1] Processing React 19 compatible HTML structure");
            const children = result.props.children;
            if (children) {
              const childArray = Array.isArray(children) ? children : [children];
              
              // Extract head and body elements
              const headElement = childArray.find(child => 
                child && child.type === 'head'
              );
              const bodyElement = childArray.find(child => 
                child && child.type === 'body'
              );
              
              // Update document head if present
              if (headElement && headElement.props && headElement.props.children) {
                const headChildren = Array.isArray(headElement.props.children) ?
                  headElement.props.children : [headElement.props.children];
                
                const titleElement = headChildren.find(child => 
                  child && child.type === 'title'
                );
                
                if (titleElement && titleElement.props && titleElement.props.children) {
                  document.title = titleElement.props.children;
                }
              }
              
              // Extract and render body content
              if (bodyElement && bodyElement.props) {
                // Clear the root element
                while (this.rootElement.firstChild) {
                  this.rootElement.removeChild(this.rootElement.firstChild);
                }
                
                // Add the body children using the modern renderElement
                const bodyChildren = bodyElement.props.children;
                if (bodyChildren) {
                  const renderedContent = this.renderElement(bodyChildren);
                  if (renderedContent) {
                    this.rootElement.appendChild(renderedContent);
                  }
                }
                
                // Add body className if present
                if (bodyElement.props.className) {
                  document.body.className = bodyElement.props.className;
                }
                
                return;
              }
            }
          }
          // Handle legacy JSX structure (fallback)
          else if (result && typeof result === 'object') {
            // For string HTML
            if (typeof result === 'string') {
              document.documentElement.innerHTML = result;
              return;
            }
            
            // For JSX object structure with html/head/body elements
            if (result.type === 'html') {
              console.log("[0x1] Processing legacy HTML structure");
              
              // Get children from either props.children or direct children property
              const children = result.props?.children || result.children;
              if (children) {
                const childArray = Array.isArray(children) ? children : [children];
                
                // Extract important parts from head (title, meta, links)
                const headElement = childArray.find(child => 
                  child && child.type === 'head'
                );
                
                if (headElement && headElement.props && headElement.props.children) {
                  // Update title if present
                  const headChildren = Array.isArray(headElement.props.children) ?
                    headElement.props.children : [headElement.props.children];
                  
                  const titleElement = headChildren.find(child => 
                    child && child.type === 'title'
                  );
                  
                  if (titleElement && titleElement.props && titleElement.props.children) {
                    document.title = titleElement.props.children;
                  }
                }
                
                // Extract body content
                const bodyElement = childArray.find(child => 
                  child && child.type === 'body'
                );
                
                if (bodyElement) {
                  // Clear the root element
                  while (this.rootElement.firstChild) {
                    this.rootElement.removeChild(this.rootElement.firstChild);
                  }
                  
                  // Add the body children
                  const bodyChildren = bodyElement.props?.children || bodyElement.children;
                  if (bodyChildren) {
                    const renderedContent = this.renderElement(bodyChildren);
                    if (renderedContent) {
                      this.rootElement.appendChild(renderedContent);
                    }
                  }
                  
                  // Add body className if present
                  if (bodyElement.props?.className) {
                    document.body.className = bodyElement.props.className;
                  }
                  
                  return;
                }
              }
            }
          }
        } catch (err) {
          console.error("[0x1] Error processing HTML structure:", err);
        }
      }
      
      // Standard rendering for non-HTML structure results
      // Clear the root element
      while (this.rootElement.firstChild) {
        this.rootElement.removeChild(this.rootElement.firstChild);
      }
      
      // Handle different types of results
      if (result instanceof Node) {
        this.rootElement.appendChild(result);
      } else if (typeof result === "string") {
        this.rootElement.innerHTML = result;
      } else {
        const renderedElement = this.renderElement(result);
        if (renderedElement) {
          this.rootElement.appendChild(renderedElement);
        }
      }
    }
    
    // Utility method to render error message
    renderErrorMessage(message) {
      const errorElement = document.createElement("div");
      errorElement.className = "error-container";
      errorElement.innerHTML = \`<h1>Error</h1><p>\${message}</p>\`;
      this.renderResult(errorElement);
    }
    
    // Apply layouts to a component
    applyLayouts(component, layouts = [], params = {}) {
      if (!layouts || layouts.length === 0) {
        return component;
      }
      
      let wrappedComponent = component;
      
      // Apply layouts from innermost to outermost
      for (let i = layouts.length - 1; i >= 0; i--) {
        const currentLayout = layouts[i];
        const prevComponent = wrappedComponent;
        
        wrappedComponent = (props) => {
          props = props || {};
          
          try {
            // Only call the component if it's a function
            const innerContent = typeof prevComponent === 'function' ? prevComponent(props) : prevComponent;
            
            // Create layout props with children properly set
            const layoutProps = { 
              ...props, 
              children: innerContent, 
              params: params || {}
            };
            
            // Call the layout with proper props
            const layoutResult = currentLayout(layoutProps);
            
            // Return the layout result or fallback to fragment
            return layoutResult || document.createDocumentFragment();
          } catch (error) {
            console.error("[0x1] Layout error:", error);
            return prevComponent(props);
          }
        };
      }
      
      return wrappedComponent;
    }
    
    // Handle navigation to a specific path
    navigate(path, pushState = true) {
      // Normalize the path
      path = path || '/';
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      console.log("[0x1] Router navigating to: " + path);
      
      // Find a matching route or use fallback
      const match = this.findMatchingRoute(path);
      if (!match) {
        console.warn("[0x1] No route found for path: " + path);
        // Try default route if available
        if (this.defaultRoute && this.defaultRoute !== path) {
          return this.navigate(this.defaultRoute, false);
        }
        return this.renderErrorMessage("No route found for: " + path);
      }
      
      // Execute the navigation
      try {
        // Call the onNavigate callback if provided
        if (this.onNavigate) {
          this.onNavigate(path, match.params);
        }
        
        // Get the component and apply layouts
        let component = match.handler;
        
        // Use layouts from the route match, fallback to root layout if no route layouts
        if (match.layouts && match.layouts.length > 0) {
          // Use layouts from the route
          component = this.applyLayouts(component, match.layouts, match.params);
        } else if (this.rootLayout) {
          // Fallback to root layout
          component = this.applyLayouts(component, [this.rootLayout], match.params);
        }
        
        // Check if component is a function
        if (typeof component !== 'function') {
          console.error("[0x1] Router error: component is not a function for path: " + path);
          console.error("[0x1] Component type: " + typeof component);
          return this.renderErrorMessage("Component error: handler is not a function");
        }
        
        // Call the component with params
        const result = component({ params: match.params });
        
        // Process the result using the global utility if available
        let processedResult = result;
        if (typeof window !== 'undefined' && window.__0x1_filterBooleanValues) {
          processedResult = window.__0x1_filterBooleanValues(result);
        }
        
        // Render the processed result
        this.renderResult(processedResult);
        
        // Update the browser history if pushState is true and not triggered by a popstate event
        if (pushState && !this._handlingPopState && path !== window.location.pathname) {
          window.history.pushState(null, '', path);
        }
        
        return true;
      } catch (error) {
        console.error("[0x1] Navigation error for " + path + ":", error);
        this.renderErrorMessage("Error navigating to " + path + ": " + (error.message || String(error)));
        return false;
      }
    }
    
    // Initialize the router
    init() {
      console.log("[0x1] Router initializing...");
      
      // Set up event listeners
      if (this.mode === "hash") {
        window.addEventListener("hashchange", () => this.handleRouteChange());
      } else {
        window.addEventListener("popstate", () => {
          this._handlingPopState = true;
          this.handleRouteChange();
          this._handlingPopState = false;
        });
        
        // Intercept link clicks for history mode
        document.addEventListener("click", (e) => {
          // Only handle links with href attribute that should be handled by the router
          if (e.target && e.target.tagName === "A" && e.target.href && !e.target.hasAttribute("target") && 
              !e.target.hasAttribute("download") && e.target.hostname === window.location.hostname) {
            e.preventDefault();
            const href = e.target.getAttribute("href");
            this.navigate(href);
          }
        });
      }
      
      // Initial route handling
      this.handleRouteChange();
      
      return this; // Return this for chaining
    }
    
    // Initialize routes from app directory components
    initAppDirectoryRoutes(components) {
      // This is a simplified version
      for (const [path, component] of Object.entries(components)) {
        if (component && component.default) {
          this.addRoute(path, component.default);
        }
      }
    }
  }
  
  // Factory function to create a router instance
  function createRouter(options) {
    return new Router(options);
  }
  
  // Create a utility function for filtering boolean values in JSX
  window.__0x1_filterBooleanValues = function(element) {
    // Handle null/undefined
    if (element == null) return element;
    
    // Handle primitive values
    if (typeof element !== 'object') return element;
    
    // Handle arrays (fragments)
    if (Array.isArray(element)) {
      return element.filter(item => item !== true && item !== false && item != null);
    }
    
    // Handle JSX elements
    if (element && typeof element === 'object' && 'type' in element && element.props) {
      // Filter children if they exist
      if (element.props.children) {
        if (Array.isArray(element.props.children)) {
          element.props.children = element.props.children.filter(
            child => child !== true && child !== false && child != null
          );
        } else if (element.props.children === true || element.props.children === false) {
          element.props.children = null;
        }
      }
    }
    
    return element;
  };
  
  // Expose to global scope
  window.Router = Router;
  window.createRouter = createRouter;
  
  console.log('[0x1] Router module loaded successfully');
})(typeof window !== 'undefined' ? window : globalThis);

// ES module exports
export const Router = (typeof window !== 'undefined' ? window.Router : null);
export const createRouter = (typeof window !== 'undefined' ? window.createRouter : null);
`;

    return routerScript;
  } catch (err) {
    logger.error("[0x1] Error generating router module: " + (err instanceof Error ? err.message : String(err)));
    return "console.error('[0x1] Router module could not be loaded. Please report this issue.');";
  }
}

/**
 * Creates an endpoint handler for the router.js module
 * @returns A function that handles requests to /0x1/router.js
 */
export function createRouterEndpoint(): (req: Request) => Response | undefined {
  // Generate the router module script once
  const routerScript = generateRouterModule();
  
  // Return a handler function
  return (req: Request): Response | undefined => {
    const url = new URL(req.url);
    
    // Check if this is a request for the router module
    // Only check pathname without query parameters
    if (url.pathname === "/0x1/router.js") {
      logger.debug("[0x1] Serving 0x1 Router module");
      
      // Always serve as JavaScript module regardless of query params
      return new Response(routerScript, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });
    }
    
    // Not a router request
    return undefined;
  };
}
