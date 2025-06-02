/**
 * 0x1 Router - Complete routing solution for 0x1 Framework
 */

/// <reference lib="dom" />

// Import JSX utilities
declare function jsx(
  type: string | ComponentFunction,
  props: any,
  key?: string
): any;

// Component function type - more specific than Function
type ComponentFunction = (props: any) => any;

// Router options interface
interface RouterOptions {
  rootElement?: HTMLElement;
  mode?: "hash" | "history";
  debug?: boolean;
  notFoundComponent?: ComponentFunction;
  errorComponent?: ComponentFunction;
  base?: string;
}

// Core types
interface Route {
  path: string;
  component: (props?: any) => any;
  exact?: boolean;
  middleware?: Middleware[];
  meta?: Record<string, any>;
  layout?: ComponentFunction;
}

export interface LinkProps {
  href: string;
  className?: string;
  children: any;
  prefetch?: boolean;
}

interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}

type Middleware = (context: RouteContext, next: () => void) => void;

interface RouteContext {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  meta: Record<string, any>;
}

// Add missing RouteParams interface
export interface RouteParams {
  [key: string]: string;
}

// Router class - handles both client and server-side routing
class Router {
  private routes: Route[] = [];
  public currentPath: string = "/";
  private listeners: (() => void)[] = [];
  private middleware: Middleware[] = [];
  private isServer: boolean = typeof window === "undefined";
  public options: RouterOptions;

  constructor(options: RouterOptions = {}) {
    // Initialize options with defaults
    this.options = {
      mode: "history",
      debug: false,
      base: "",
      ...options,
    };

    if (!this.isServer) {
      // Initialize hook system integration
      this.initializeHookSystem();

      // Client-side setup
      window.addEventListener("popstate", () => {
        this.navigate(window.location.pathname, false);
      });

      // Make router globally available
      (window as any).__0x1_router = this;

      // Handle initial route
      this.currentPath = window.location.pathname;
    }
  }

  // Initialize integration with 0x1 framework's hook system
  private initializeHookSystem(): void {
    if (typeof window === "undefined") return;

    // Only set up minimal hooks if none exist
    if (!(window as any).__0x1_hooks) {
      (window as any).__0x1_hooks = {
        currentComponent: null,
        stateIndex: 0,
        states: new Map(),
        isRenderingComponent: false,
        componentStack: [],
      };
    }

    // Set up context management functions if they don't exist
    if (typeof (window as any).__0x1_enterComponentContext !== "function") {
      (window as any).__0x1_enterComponentContext = (componentId: string) => {
        const hooks = (window as any).__0x1_hooks;
        if (hooks) {
          hooks.componentStack = hooks.componentStack || [];
          hooks.componentStack.push(hooks.currentComponent);
          hooks.currentComponent = componentId;
          hooks.stateIndex = 0;
          hooks.isRenderingComponent = true;
        }
      };
    }

    if (typeof (window as any).__0x1_exitComponentContext !== "function") {
      (window as any).__0x1_exitComponentContext = () => {
        const hooks = (window as any).__0x1_hooks;
        if (hooks) {
          hooks.componentStack = hooks.componentStack || [];
          hooks.currentComponent = hooks.componentStack.pop() || null;
          hooks.isRenderingComponent = false;
        }
      };
    }

    if (typeof (window as any).__0x1_triggerUpdate !== "function") {
      (window as any).__0x1_triggerUpdate = (componentId?: string) => {
        // Only trigger targeted component updates, not full route renders
        if (componentId) {
          // Find and update only the specific component
          const element = document.querySelector(`[data-component-id="${componentId}"]`);
          if (element && element.getAttribute('data-update-callback')) {
            // If component has an update callback, use it
            const callback = (element as any).__updateCallback;
            if (typeof callback === 'function') {
              callback();
            }
          }
        }
      };
    }
  }

  // Initialize router - required by the dev server
  init() {
    if (this.isServer) return;

    // CRITICAL FIX: Enhanced click handler for proper navigation
    document.addEventListener('click', (e: Event) => {
      // Find the closest anchor tag (handles clicks on child elements like SVG icons)
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip external links and special protocols
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Skip links with target="_blank" or similar
      if (anchor.target && anchor.target !== '_self') {
        return;
      }

      // Skip if modifier keys are pressed (allow opening in new tab)
      if ((e as MouseEvent).ctrlKey || (e as MouseEvent).metaKey || (e as MouseEvent).shiftKey) {
        return;
      }

      // Prevent default browser navigation
      e.preventDefault();
      
      // Navigate immediately - no delays
      console.log('[0x1 Router] Navigating to:', href);
      this.navigate(href, true);
    });

    // Initialize popstate handler for browser back/forward
    window.addEventListener('popstate', () => {
      const path = window.location.pathname;
      console.log('[0x1 Router] Popstate navigation to:', path);
      this.navigate(path, false);
    });

    console.log('[0x1 Router] Initialized with enhanced click handling');
  }

  // Add route with optional middleware - support both signatures
  public addRoute(
    pathOrRoute: string | Route,
    component?: (props?: any) => any,
    options?: { layout?: (props?: any) => any; exact?: boolean }
  ): void {
    if (typeof pathOrRoute === "string") {
      // New signature: addRoute(path, component, options)
      const route: Route = {
        path: pathOrRoute,
        component: component!,
        exact: options?.exact !== false, // Default to true
        meta: options?.layout ? { layout: options.layout } : {},
      };
      this.routes.push(route);
    } else {
      // Original signature: addRoute(route)
      this.routes.push(pathOrRoute);
    }
  }

  // Navigate to path (client-side only) - optimized for instant navigation
  public navigate(path: string, pushState: boolean = true): void {
    if (this.isServer) return;

    console.log('[0x1 Router] Navigating to path:', path, 'pushState:', pushState);

    // Update URL immediately if needed
    if (pushState && path !== this.currentPath) {
      window.history.pushState({}, '', path);
    }

    // Update current path
    this.currentPath = path;

    // Execute middleware
    this.executeMiddleware(path);

    // Render immediately - no delays
    this.renderCurrentRoute();

    // Notify listeners immediately
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('[0x1 Router] Error in route change listener:', error);
      }
    });

    console.log('[0x1 Router] Navigation completed to:', path);
  }

  // Execute middleware chain
  private executeMiddleware(path: string): void {
    const match = this.matchRoute(path);
    if (!match) return;

    const context: RouteContext = {
      path,
      params: match.params,
      query: new URLSearchParams(window?.location.search || ""),
      meta: match.route.meta || {},
    };

    const allMiddleware = [
      ...this.middleware,
      ...(match.route.middleware || []),
    ];

    let index = 0;
    const next = () => {
      if (index < allMiddleware.length) {
        allMiddleware[index++](context, next);
      }
    };

    next();
  }

  // Match route with params extraction
  public matchRoute(path: string): RouteMatch | null {
    for (const route of this.routes) {
      const match = this.pathToRegExp(route.path, route.exact);
      const result = path.match(match.regex);

      if (result) {
        const params: Record<string, string> = {};
        match.keys.forEach((key, index) => {
          params[key] = result[index + 1] || "";
        });

        // Debug logging removed for cleaner output

        return { route, params };
      }
    }

    // Debug logging removed for cleaner output

    return null;
  }

  // Convert path pattern to regex with param extraction
  private pathToRegExp(
    path: string,
    exact?: boolean
  ): { regex: RegExp; keys: string[] } {
    // Guard against undefined path
    if (!path || typeof path !== "string") {
      console.warn("[0x1 Router] Invalid path provided to pathToRegExp:", path);
      return {
        regex: new RegExp("^/$"),
        keys: [],
      };
    }

    // Handle wildcard routes (catch-all)
    if (path === "*") {
      return {
        regex: new RegExp(".*"), // Match any path
        keys: [],
      };
    }

    const keys: string[] = [];
    let regexStr = path.replace(/\//g, "/").replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });

    if (exact) {
      regexStr = `^${regexStr}$`;
    } else {
      regexStr = `^${regexStr}`;
    }

    return {
      regex: new RegExp(regexStr),
      keys,
    };
  }

  // Render the current route to the DOM
  private renderCurrentRoute() {
    if (this.isServer) return;

    // CRITICAL FIX: Prevent multiple simultaneous renders
    if ((this as any)._isRendering) {
      return;
    }
    (this as any)._isRendering = true;

    const rootElement = this.options?.rootElement;
    
    if (!rootElement) {
      console.warn("[0x1 Router] No root element specified for rendering");
      (this as any)._isRendering = false;
      return;
    }

    const match = this.matchRoute(this.currentPath);
    
    if (match) {
      try {
        // Get the component
        let component = match.route.component;

        // Apply layout if specified
        if (match.route.meta?.layout) {
          const layout = match.route.meta.layout;
          const originalComponent = component;
          component = (props: any) => {
            const pageContent = originalComponent(props);
            return layout({ children: pageContent, ...props });
          };
        }

        // Render the component with error handling
        const result = component({ params: match.params });

        // OPTIMIZED: Use View Transitions API with efficient fallback
        const performTransition = () => {
          try {
            // Prepare the new content first
            let newDomElement: HTMLElement | null = null;

            // Handle different result types and prepare new content
            if (
              result &&
              typeof result === "object" &&
              (result.type || result.__isVNode)
            ) {
              // JSX object - convert to DOM
              newDomElement = this.jsxToDom(result);
            } else if (result instanceof HTMLElement) {
              // Already a DOM element
              newDomElement = result;
            } else if (typeof result === "string") {
              // HTML string - create container
              const container = document.createElement("div");
              container.innerHTML = result;
              newDomElement = container;
            }

            if (newDomElement) {
              // OPTIMIZED: Use modern View Transitions API with fallback
              const updateDOM = () => {
                // Clear old content efficiently
                while (rootElement.firstChild) {
                  rootElement.removeChild(rootElement.firstChild);
                }
                
                // Add new content
                rootElement.appendChild(newDomElement!);
              };

              // Use View Transitions API if available (Chrome 111+)
              if (typeof document !== 'undefined' && 'startViewTransition' in document) {
                (document as any).startViewTransition(updateDOM);
              } else {
                // Fallback: Efficient CSS transition
                rootElement.style.transition = 'opacity 0.15s ease-out';
                rootElement.style.opacity = '0.7';
                
                // Use requestAnimationFrame for optimal timing
                requestAnimationFrame(() => {
                  updateDOM();
                  
                  requestAnimationFrame(() => {
                    rootElement.style.opacity = '1';
                    
                    // Clean up transition after completion
                    setTimeout(() => {
                      rootElement.style.transition = '';
                    }, 150);
                  });
                });
              }
              
            } else {
              // Fallback: clear and show error
              while (rootElement.firstChild) {
                rootElement.removeChild(rootElement.firstChild);
              }
              rootElement.innerHTML = `<div class="error p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-lg">
                <h3 class="text-lg font-bold text-red-700 dark:text-red-300 mb-2">Render Error</h3>
                <p class="text-red-600 dark:text-red-400 text-sm">Failed to render component result</p>
              </div>`;
            }
          } finally {
            // Always reset the rendering flag
            (this as any)._isRendering = false;
          }
        };

        // Use requestAnimationFrame for optimal rendering
        requestAnimationFrame(performTransition);
        
      } catch (error: unknown) {
        console.error("[0x1 Router] Error rendering route:", error);
        
        // OPTIMIZED: Fast error transition
        const errorHtml = `<div class="error p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-lg">
          <h3 class="text-lg font-bold text-red-700 dark:text-red-300 mb-2">Error Rendering Route</h3>
          <p class="text-red-600 dark:text-red-400 text-sm">${error instanceof Error ? error.message : String(error)}</p>
        </div>`;
        
        rootElement.innerHTML = errorHtml;
        (this as any)._isRendering = false;
      }
    } else {
      // OPTIMIZED: Fast 404 transition
      console.warn("[0x1 Router] No route found for:", this.currentPath);
      
      const notFoundHtml = `<div class="not-found p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 rounded-lg">
        <h3 class="text-lg font-bold text-yellow-700 dark:text-yellow-300 mb-2">404 - Page Not Found</h3>
        <p class="text-yellow-600 dark:text-yellow-400 text-sm">The requested route "${this.currentPath}" could not be found.</p>
      </div>`;
      
      rootElement.innerHTML = notFoundHtml;
      (this as any)._isRendering = false;
    }
  }

  // Convert JSX object to DOM element
  private jsxToDom(jsx: any): HTMLElement | null {
    try {
      if (!jsx) return null;

      // Handle primitive values
      if (typeof jsx === "string" || typeof jsx === "number") {
        const textNode = document.createTextNode(String(jsx));
        const wrapper = document.createElement("span");
        wrapper.appendChild(textNode);
        return wrapper;
      }

      // Handle boolean values (should be filtered out)
      if (typeof jsx === "boolean") {
        return null;
      }

      // Handle arrays of elements
      if (Array.isArray(jsx)) {
        const fragment = document.createDocumentFragment();
        jsx.forEach((child) => {
          const childElement = this.jsxToDom(child);
          if (childElement) {
            fragment.appendChild(childElement);
          }
        });
        const wrapper = document.createElement("div");
        wrapper.appendChild(fragment);
        return wrapper;
      }

      // Handle DOM nodes directly
      if (jsx instanceof Node) {
        return jsx as HTMLElement;
      }

      // Handle JSX objects (both regular JSX and VNode objects)
      if (typeof jsx === "object" && (jsx.type || jsx.__isVNode)) {
        // Handle React Fragment
        if (
          jsx.type === Symbol.for("react.fragment") ||
          jsx.type === Symbol.for("React.Fragment")
        ) {
          // Fragment - render children without wrapper
          const children = jsx.children || jsx.props?.children || [];
          const childArray = Array.isArray(children) ? children : [children];

          const fragment = document.createDocumentFragment();
          childArray.forEach((child: any) => {
            const childElement = this.jsxToDom(child);
            if (childElement) {
              fragment.appendChild(childElement);
            }
          });

          // Return the first child if single, or wrapper div if multiple
          if (fragment.children.length === 1) {
            return fragment.children[0] as HTMLElement;
          } else {
            const wrapper = document.createElement("div");
            wrapper.appendChild(fragment);
            return wrapper;
          }
        } else if (typeof jsx.type === "string") {
          // HTML/SVG element - create with proper namespace for SVG elements
          const svgElements = [
            "svg",
            "path",
            "circle",
            "rect",
            "line",
            "polygon",
            "polyline",
            "ellipse",
            "g",
            "defs",
            "use",
            "text",
            "tspan",
          ];
          const element = svgElements.includes(jsx.type.toLowerCase())
            ? document.createElementNS("http://www.w3.org/2000/svg", jsx.type)
            : document.createElement(jsx.type);

          // Add props first
          if (jsx.props) {
            Object.keys(jsx.props).forEach((key) => {
              try {
                if (key === "children") {
                  // Skip children here, handle them separately
                  return;
                } else if (
                  // Filter out React development props that shouldn't be DOM attributes
                  key === "__self" ||
                  key === "__source" ||
                  key === "ref" ||
                  key === "key"
                ) {
                  // Skip these React development/internal props
                  return;
                } else if (key === "className") {
                  if (jsx.props[key]) {
                    // SVG elements don't have className property, use class attribute instead
                    if (element instanceof SVGElement) {
                      element.setAttribute("class", jsx.props[key]);
                    } else {
                      (element as HTMLElement).className = jsx.props[key];
                    }
                  }
                } else if (key === "onClick" || key === "onclick") {
                  // Handle click events specially
                  const handler = jsx.props[key];
                  if (typeof handler === "function") {
                    element.addEventListener("click", (event: Event) => {
                      try {
                        handler(event);
                      } catch (error) {
                        console.error(
                          `[0x1 Router] Error in click handler:`,
                          error
                        );
                      }
                    });
                  } else if (typeof handler === "string") {
                    // Handle string onclick (legacy)
                    element.setAttribute("onclick", handler);
                  }
                } else if (
                  key.startsWith("on") &&
                  typeof jsx.props[key] === "function"
                ) {
                  // Handle other event handlers
                  const eventName = key.slice(2).toLowerCase();
                  element.addEventListener(eventName, (event: Event) => {
                    jsx.props[key](event);
                  });
                } else if (
                  key === "style" &&
                  typeof jsx.props[key] === "object"
                ) {
                  // Handle style objects
                  Object.assign(element.style, jsx.props[key]);
                } else if (key === "dangerouslySetInnerHTML") {
                  // Handle dangerouslySetInnerHTML
                  if (jsx.props[key] && jsx.props[key].__html) {
                    element.innerHTML = jsx.props[key].__html;
                  }
                } else if (
                  jsx.props[key] !== null &&
                  jsx.props[key] !== undefined &&
                  jsx.props[key] !== false &&
                  // Additional safety check: only set primitive values as attributes
                  (typeof jsx.props[key] === "string" ||
                   typeof jsx.props[key] === "number" ||
                   typeof jsx.props[key] === "boolean")
                ) {
                  // Handle SVG attributes with proper casing
                  if (
                    element instanceof SVGElement ||
                    [
                      "path",
                      "circle",
                      "rect",
                      "line",
                      "polygon",
                      "polyline",
                      "ellipse",
                      "g",
                      "defs",
                      "use",
                    ].includes(element.tagName.toLowerCase())
                  ) {
                    // SVG attributes need special handling
                    const svgAttrMap: Record<string, string> = {
                      viewbox: "viewBox",
                      strokewidth: "stroke-width",
                      strokelinecap: "stroke-linecap",
                      strokelinejoin: "stroke-linejoin",
                      strokemiterlimit: "stroke-miterlimit",
                      strokeopacity: "stroke-opacity",
                      strokedasharray: "stroke-dasharray",
                      strokedashoffset: "stroke-dashoffset",
                      stopcolor: "stop-color",
                      stopopacity: "stop-opacity",
                      fillrule: "fill-rule",
                      fillopacity: "fill-opacity",
                      clippath: "clip-path",
                      clippathunits: "clipPathUnits",
                    };
                    const attrName = svgAttrMap[key.toLowerCase()] || key;

                    // Special handling for xmlns attribute
                    if (key === "xmlns") {
                      element.setAttribute("xmlns", String(jsx.props[key]));
                    } else {
                      element.setAttributeNS(
                        null,
                        attrName,
                        String(jsx.props[key])
                      );
                    }
                  } else {
                    // Regular HTML attributes
                    element.setAttribute(key, String(jsx.props[key]));
                  }
                }
              } catch (error) {
                console.error(
                  `[0x1 Router] Error setting prop ${key} on element:`,
                  error
                );
              }
            });
          }

          // Handle children - check multiple possible locations
          const children =
            jsx.__isVNode && jsx.children !== undefined
              ? Array.isArray(jsx.children)
                ? jsx.children
                : [jsx.children]
              : jsx.children !== undefined  // NEW: Check direct jsx.children first
                ? Array.isArray(jsx.children)
                  ? jsx.children
                  : [jsx.children]
                : jsx.props?.children
                  ? Array.isArray(jsx.props.children)
                    ? jsx.props.children
                    : [jsx.props.children]
                  : [];

          children.forEach((child: any) => {
            if (
              child === null ||
              child === undefined ||
              child === false ||
              child === true
            ) {
              return; // Skip these values
            }

            if (typeof child === "string" || typeof child === "number") {
              element.appendChild(document.createTextNode(String(child)));
            } else if (child && typeof child === "object") {
              const childElement = this.jsxToDom(child);
              if (childElement) {
                element.appendChild(childElement);
              }
            }
          });

          // CRITICAL FIX: Check for component metadata in props and apply to DOM element
          if (jsx.props && element.setAttribute) {
            const componentId = jsx.props["data-component-id"];
            const componentName = jsx.props["data-component-name"];
            
            if (componentId) {
              element.setAttribute("data-component-id", componentId);
              console.log('[0x1 Router] Applied component metadata - ID:', componentId, 'to element:', jsx.type);
            }
            if (componentName) {
              element.setAttribute("data-component-name", componentName);
              console.log('[0x1 Router] Applied component metadata - Name:', componentName, 'to element:', jsx.type);
            }
          }

          return element;
        } else if (typeof jsx.type === "function") {
          // Component function - render with proper hook context
          try {
            const result = this.renderComponentWithHookContext(
              jsx.type,
              jsx.props || {}
            );
            
            // CRITICAL FIX: Ensure the result gets properly converted to DOM with metadata
            const domElement = this.jsxToDom(result);
            
            // CRITICAL FIX: Extract metadata from the result object (where renderComponentWithHookContext puts it)
            if (domElement && domElement.setAttribute) {
              // Get the component ID from the result props (added by renderComponentWithHookContext)
              const componentId = result?.props?.["data-component-id"];
              const componentName = result?.props?.["data-component-name"];
              
              if (componentId) {
                domElement.setAttribute("data-component-id", componentId);
              }
              if (componentName) {
                domElement.setAttribute("data-component-name", componentName);
              }
            }
            
            return domElement;
          } catch (componentError: any) {
            console.error(
              `[0x1 Router] Error rendering component:`,
              componentError
            );

            // Return error component
            const errorElement = document.createElement("div");
            errorElement.className =
              "component-error p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm";
            errorElement.innerHTML = `
              <h3 class="text-red-700 dark:text-red-300 font-medium mb-2">Component Error</h3>
              <p class="text-red-600 dark:text-red-400 text-sm font-mono break-words">${componentError?.message || String(componentError)}</p>
            `;

            return errorElement;
          }
        }
      }

      // Fallback for unknown types
      console.warn("[0x1 Router] Unknown JSX type:", jsx);
      return null;
    } catch (error: any) {
      console.error("[0x1 Router] Error in jsxToDom:", error);

      // Return error element
      const errorElement = document.createElement("div");
      errorElement.className =
        "jsx-error p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300";
      errorElement.textContent = `JSX Render Error: ${error?.message || String(error)}`;
      return errorElement;
    }
  }

  // Efficient component rendering inspired by React 19/Next.js 15
  public renderComponentWithHookContext(
    component: (props?: any) => any,
    props: any
  ): any {
    // Skip if we're in server environment
    if (typeof window === "undefined") return component(props);

    // Validate component function
    if (typeof component !== "function") {
      console.warn(
        "[0x1 Router] Invalid component provided to renderComponentWithHookContext"
      );
      return null;
    }

    // Create stable component ID (similar to React's fiber keys)
    const componentName =
      (component.name && component.name.trim()) || "AnonymousComponent";
      
    // CRITICAL FIX: Clean up any existing component IDs for this component name
    // This prevents the hooks system from trying to update old, stale component instances
    const cleanupHookSystem = (window as any).__0x1_hooks;
    if (cleanupHookSystem?.componentRegistry) {
      const registry = cleanupHookSystem.componentRegistry;
      const keysToDelete = [];
      
      // Find all old component IDs with the same component name
      for (const [existingId, data] of registry.entries()) {
        if (existingId.startsWith(`${componentName}_`) && existingId !== componentName) {
          // Check if this component still exists in DOM
          const element = document.querySelector(`[data-component-id="${existingId}"]`);
          if (!element) {
            keysToDelete.push(existingId);
          }
        }
      }
      
      // Remove stale component IDs
      keysToDelete.forEach(id => {
        registry.delete(id);
        // Also clean up update callbacks
        if (cleanupHookSystem?.componentUpdateCallbacks) {
          cleanupHookSystem.componentUpdateCallbacks.delete(id);
        }
      });
    }
    
    // Use a simpler, more consistent ID generation
    const componentId = `${componentName}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Validate componentId before proceeding
    if (
      !componentId ||
      componentId === "undefined" ||
      componentId === "null" ||
      componentId.includes("undefined") ||
      componentId.includes("null")
    ) {
      console.warn(
        "[0x1 Router] Generated invalid componentId, rendering without hook context:",
        componentId
      );
      return component(props);
    }

    // Enhanced hook system availability check
    const hookSystem = (window as any).__0x1_hooks;
    if (
      !hookSystem ||
      typeof (window as any).__0x1_enterComponentContext !== "function" ||
      typeof (window as any).__0x1_exitComponentContext !== "function"
    ) {
      // Render without hook context if system not available
      return component(props);
    }

    try {
      // Optimized update callback that uses requestAnimationFrame for smooth updates
      const updateCallback = () => {
        // CRITICAL FIX: Prevent cascade renders - only update if component still exists
        requestAnimationFrame(() => {
          try {
            // Find the specific DOM element for this component
            const element = document.querySelector(
              `[data-component-id="${componentId}"]`
            );
            
            if (element && element.parentNode) {
              // Re-render only this component, not the entire route
              // Enter component context again for re-rendering (no recursive callback)
              (window as any).__0x1_enterComponentContext(componentId);

              const newResult = component(props);
              const newDomElement = this.jsxToDom(newResult);

              // Exit component context after re-rendering
              (window as any).__0x1_exitComponentContext();

              if (newDomElement) {
                // Ensure the new element has the same component ID
                if (newDomElement.setAttribute) {
                  newDomElement.setAttribute("data-component-id", componentId);
                  newDomElement.setAttribute("data-component-name", componentName);
                }
                element.parentNode.replaceChild(newDomElement, element);
              }
            } else {
              console.warn(`[0x1 Router] 🐛 Component ${componentId} not found during update - may have been unmounted`);
            }
          } catch (e) {
            console.error("[0x1 Router] Error updating component:", e);
          }
        });
      };

      // Enter component context with the optimized update callback
      (window as any).__0x1_enterComponentContext(componentId, updateCallback);

      // Execute the component with props
      const result = component(props);
      
      // Add component ID as data attribute if result is a JSX object
      if (result && typeof result === "object" && result.props) {
        result.props["data-component-id"] = componentId;
        result.props["data-component-name"] = componentName;
      }

      return result;
    } catch (error) {
      // Log error but allow it to propagate for error boundaries
      console.error(`[0x1 Router] Error in component ${componentId}:`, error);
      throw error;
    } finally {
      // CRITICAL: Always clean up by exiting component context
      (window as any).__0x1_exitComponentContext();
    }
  }

  // Simple props hashing for stable component IDs
  private hashProps(props: any): string {
    if (!props || typeof props !== "object") return "no-props";

    try {
      // Create a simple hash of the props for stable component identification
      const keys = Object.keys(props).sort();
      const propsString = keys
        .map((key) => `${key}:${typeof props[key]}`)
        .join("|");

      // Simple hash function (similar to React's key generation)
      let hash = 0;
      for (let i = 0; i < propsString.length; i++) {
        const char = propsString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash).toString(36);
    } catch (error) {
      return "hash-error";
    }
  }

  // Add global middleware
  public use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  public getCurrentRoute(): RouteMatch | null {
    return this.matchRoute(this.currentPath);
  }

  public onRouteChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Server-side route resolution
  public resolveRoute(path: string): RouteMatch | null {
    return this.matchRoute(path);
  }

  // Router prefetch implementation for route content
  public prefetch(path: string): void {
    // Basic implementation - just get the route match
    const match = this.matchRoute(path);
    // Debug logging removed for cleaner output
  }

  // Generate static routes for SSG
  public generateStaticRoutes(): string[] {
    return this.routes
      .filter((route) => !route.path.includes(":"))
      .map((route) => route.path);
  }

  // Debug method to expose routes
  public getRoutes(): Route[] {
    return this.routes;
  }
}

// Factory function to create router instances
export function createRouter(options: RouterOptions): Router {
  const routerInstance = new Router(options);

  // Store options for later use
  (routerInstance as any).rootElement = options.rootElement;
  (routerInstance as any).mode = options.mode || "history";

  return routerInstance;
}

// Helper function to get the current router instance
function getCurrentRouter(): Router | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__0x1_ROUTER__ || (window as any).__0x1_router || (window as any).router || null;
}

// JSX-compatible Link component with instant navigation
export function Link({ href, className, children, prefetch }: LinkProps): any {
  // Check if prefetch is needed
  const router = getCurrentRouter();
  if (prefetch && router) {
    router.prefetch(href);
  }

  // Return JSX structure with proper event handling
  return {
    type: "a",
    props: {
      href,
      className,
      onClick: (e: MouseEvent) => {
        // Always prevent default browser navigation for internal links
        e.preventDefault();
        e.stopPropagation();

        // Only handle internal links (starting with /)
        if (href.startsWith("/")) {
          const router = getCurrentRouter();
          if (router) {
            // Use router for instant client-side navigation
            router.navigate(href);
          } else if (typeof window !== "undefined") {
            // Fallback: use history API for client-side navigation
            window.history.pushState(null, "", href);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        } else {
          // External links - allow normal navigation
          window.location.href = href;
        }
      },
      children,
    },
  };
}

// Hook for using router in components
export function useRouter() {
  const router = getCurrentRouter();
  
  if (!router) {
    // Return a placeholder when router is not available
    return {
      navigate: (path: string) => {
        if (typeof window !== "undefined") {
          window.location.href = path;
        }
      },
      currentPath: "/",
      getCurrentRoute: () => null,
      prefetch: () => {},
    };
  }

  return {
    navigate: (path: string, pushState = true) =>
      router.navigate(path, pushState),
    currentPath: router.currentPath,
    getCurrentRoute: () => router.getCurrentRoute(),
    prefetch: (path: string) => router.prefetch(path),
  };
}

// Hook for route params
export function useParams<
  T extends Record<string, string> = Record<string, string>,
>(): T {
  const router = getCurrentRouter();
  const route = router ? router.getCurrentRoute() : null;
  return (route?.params || {}) as T;
}

// Hook for query params
export function useSearchParams(): URLSearchParams {
  const router = getCurrentRouter();
  
  if (!router) {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams("");
  }

  const currentPath = router.currentPath;
  const searchStr = currentPath.includes("?") ? currentPath.split("?")[1] : "";
  return new URLSearchParams(searchStr);
}

// NavLink component with active class and instant navigation
export function NavLink(props: LinkProps & { activeClass?: string }): any {
  const { href, className, children, activeClass = "active", prefetch } = props;
  const router = getCurrentRouter();
  const isActive = router ? router.currentPath === href : false;
  const combinedClass = isActive
    ? `${className || ""} ${activeClass}`.trim()
    : className;

  // Prefetch route content when available
  if (prefetch && router) {
    router.prefetch(href);
  }

  return {
    type: "a",
    props: {
      href,
      className: combinedClass,
      onClick: (e: MouseEvent) => {
        // Always prevent default browser navigation for internal links
        e.preventDefault();
        e.stopPropagation();

        // Only handle internal links (starting with /)
        if (href.startsWith("/")) {
          const router = getCurrentRouter();
          if (router) {
            // Use router for instant client-side navigation
            router.navigate(href);
          } else if (typeof window !== "undefined") {
            // Fallback: use history API for client-side navigation
            window.history.pushState(null, "", href);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        } else {
          // External links - allow normal navigation
          window.location.href = href;
        }
      },
      children,
    },
  };
}

// Redirect component
export function Redirect({ to }: { to: string }): any {
  if (typeof window !== "undefined") {
    // Client-side redirect
    setTimeout(() => {
      const router = getCurrentRouter();
      if (router) {
        router.navigate(to);
      } else {
        window.location.href = to;
      }
    }, 0);
  }

  return null;
}

// Re-export the Router class for backward compatibility
export { Router };
