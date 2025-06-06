/**
 * 0x1 Router - Complete routing solution for 0x1 Framework
 */

/// <reference lib="dom" />

// Import JSX utilities
declare function _jsx(
  type: string | ComponentFunction,
  props: any,
  _key?: string
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
  scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth';
  scrollToTop?: boolean; // For backwards compatibility
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
  scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth'; // Override router's default scroll behavior
  scrollToTop?: boolean; // Backwards compatibility - equivalent to scrollBehavior: 'top'
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

// Route parameters type - needed by the main framework
export type RouteParams = Record<string, string>;

// Router class - handles both client and server-side routing
class Router {
  private routes: Route[] = [];
  public currentPath: string = "/";
  private listeners: (() => void)[] = [];
  private middleware: Middleware[] = [];
  private isServer: boolean = typeof window === "undefined";
  public options: RouterOptions;
  private scrollPositions: Map<string, { x: number; y: number }> = new Map();
  private isBackForward: boolean = false;

  // Cache for layout DOM to prevent re-rendering
  private layoutCache: {
    element?: HTMLElement;
    layoutComponent?: any;
    contentSlot?: HTMLElement;
  } = {};

  constructor(options: RouterOptions = {}) {
    // Initialize options with defaults
    this.options = {
      mode: "history",
      debug: false,
      base: "",
      scrollBehavior: "auto", // Smart default behavior
      scrollToTop: true, // Backwards compatibility
      ...options,
    };

    if (!this.isServer) {
      // Initialize hook system integration
      this.initializeHookSystem();

      // Client-side setup
      window.addEventListener("popstate", (e) => {
        // Save current scroll position before navigating
        this.saveScrollPosition(this.currentPath);
        
        // Mark this as back/forward navigation
        this.isBackForward = true;
        
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
      this.navigate(href, true);
    });

    // Initialize popstate handler for browser back/forward
    window.addEventListener('popstate', () => {
      const _searchParams = new URLSearchParams(location.search);
    });
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
  public async navigate(
    path: string, 
    pushState: boolean = true, 
    scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth'
  ): Promise<void> {
    if (this.isServer) return;

    // Save current scroll position before navigating (for back/forward support)
    if (pushState) {
      this.saveScrollPosition(this.currentPath);
    }

    // Update URL immediately if needed
    if (pushState && path !== this.currentPath) {
      window.history.pushState({}, '', path);
    }

    const previousPath = this.currentPath;
    
    // Update current path
    this.currentPath = path;

    // Execute middleware
    await this.executeMiddleware(path);

    // Render immediately - no delays
    await this.renderCurrentRoute();

    // Handle scroll behavior after render (use provided behavior or default)
    this.handleScrollBehavior(path, previousPath, scrollBehavior);

    // Reset back/forward flag
    this.isBackForward = false;

    // Notify listeners immediately
    this.listeners.forEach(async listener => {
      try {
        await listener();
      } catch (error) {
        console.error('[0x1 Router] Error in route change listener:', error);
      }
    });
  }

  // Save current scroll position for a path
  private saveScrollPosition(path: string): void {
    if (this.isServer) return;
    
    this.scrollPositions.set(path, {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset
    });
  }

  // Handle scroll behavior after navigation
  private handleScrollBehavior(currentPath: string, previousPath: string, scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth'): void {
    if (this.isServer) return;

    // Parse hash fragment from current path
    const [pathname, hash] = currentPath.split('#');
    
    // Determine scroll behavior
    const behavior = scrollBehavior || this.options.scrollBehavior || 'auto';
    
    // Handle different scroll behaviors
    if (behavior === 'preserve') {
      // Never scroll, preserve current position
      return;
    }
    
    if (behavior === 'auto') {
      // Smart default behavior
      if (hash) {
        // Hash fragment present - scroll to element
        this.scrollToHash(hash);
      } else if (this.isBackForward) {
        // Browser back/forward - restore previous position
        this.restoreScrollPosition(currentPath);
      } else {
        // Normal navigation - scroll to top
        this.scrollToTop();
      }
    } else if (behavior === 'top') {
      // Always scroll to top
      this.scrollToTop();
    } else if (behavior === 'smooth') {
      // Smooth scroll to top
      this.scrollToTop('smooth');
    }
  }

  // Scroll to top of page
  private scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    if (this.isServer) return;
    
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: behavior
      });
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }

  // Scroll to hash fragment element
  private scrollToHash(hash: string): void {
    if (this.isServer) return;
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        const element = document.getElementById(hash) || 
                       document.querySelector(`[name="${hash}"]`) ||
                       document.querySelector(`a[name="${hash}"]`);
        
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          
          // Also update URL to include hash if not already there
          if (!window.location.hash.includes(hash)) {
            window.history.replaceState({}, '', `${window.location.pathname}#${hash}`);
          }
        } else {
          // Element not found, scroll to top as fallback
          console.warn(`[0x1 Router] Hash target not found: #${hash}`);
          this.scrollToTop();
        }
      } catch (error) {
        console.error('[0x1 Router] Error scrolling to hash:', error);
        this.scrollToTop();
      }
    }, 50); // Small delay for DOM updates
  }

  // Restore saved scroll position
  private restoreScrollPosition(path: string): void {
    if (this.isServer) return;
    
    const savedPosition = this.scrollPositions.get(path);
    
    if (savedPosition) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        try {
          window.scrollTo({
            left: savedPosition.x,
            top: savedPosition.y,
            behavior: 'auto' // Instant for back/forward
          });
        } catch (error) {
          // Fallback for older browsers
          window.scrollTo(savedPosition.x, savedPosition.y);
        }
      }, 10);
    } else {
      // No saved position, scroll to top
      this.scrollToTop();
    }
  }

  // Execute middleware chain
  private async executeMiddleware(path: string): Promise<void> {
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
    const next = async () => {
      if (index < allMiddleware.length) {
        await allMiddleware[index++](context, next);
      }
    };

    await next();
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
  private async renderCurrentRoute() {
    if (this.isServer) return;

    // CRITICAL FIX: Prevent multiple simultaneous renders with timeout safety
    if ((this as any)._isRendering) {
      return;
    }
    (this as any)._isRendering = true;

    // CRITICAL FIX: Cancel any pending Promise JSX operations from previous routes
    if ((this as any)._currentRouteId) {
      // Mark previous route as cancelled
      (this as any)[`_cancelled_${(this as any)._currentRouteId}`] = true;
    }
    
    // Generate new route ID for this render
    const currentRouteId = Math.random().toString(36).slice(2, 8);
    (this as any)._currentRouteId = currentRouteId;

    // SAFETY: Auto-reset rendering flag after 5 seconds to prevent permanent locks
    const renderTimeout = setTimeout(() => {
      if ((this as any)._isRendering) {
        console.warn('[0x1 Router] Rendering took too long, forcing reset');
        (this as any)._isRendering = false;
      }
    }, 5000);

    const rootElement = this.options?.rootElement;
    
    if (!rootElement) {
      console.warn("[0x1 Router] No root element specified for rendering");
      clearTimeout(renderTimeout);
      (this as any)._isRendering = false;
      return;
    }

    const match = this.matchRoute(this.currentPath);
    
    if (match) {
      try {
        // Get the component
        const component = match.route.component;

        // Check if we have a layout
        const layoutComponent = match.route.meta?.layout;
        
        if (layoutComponent) {
          // LAYOUT PERSISTENCE: Only rebuild layout if it actually changed
          const layoutChanged = this.layoutCache.layoutComponent !== layoutComponent;
          
          if (layoutChanged || !this.layoutCache.element || !this.layoutCache.contentSlot) {
            // Clear old layout cache
            this.layoutCache = {};
            
            // Render new layout with error handling
            let layoutElement: HTMLElement | null = null;
            try {
              layoutElement = this.jsxToDom(layoutComponent({ children: null }), currentRouteId);
            } catch (layoutError) {
              console.error("[0x1 Router] Layout rendering failed:", layoutError);
              // Fall back to direct component rendering
              const element = this.jsxToDom(component(match.params), currentRouteId);
              if (element) {
                rootElement.innerHTML = '';
                rootElement.appendChild(element);
              }
              clearTimeout(renderTimeout);
              (this as any)._isRendering = false;
              return;
            }
            
            if (!layoutElement) {
              console.error("[0x1 Router] Failed to render layout component");
              clearTimeout(renderTimeout);
              (this as any)._isRendering = false;
              return;
            }
            
            // Find the content slot (where children go)
            const contentSlot = layoutElement.querySelector('[data-slot="children"]') || 
                              layoutElement.querySelector('main') ||
                              layoutElement; // Fallback to layout element itself
            
            // Cache the layout
            this.layoutCache = {
              element: layoutElement,
              layoutComponent: layoutComponent,
              contentSlot: contentSlot as HTMLElement
            };
            
            // Replace entire root content with new layout
            rootElement.innerHTML = '';
            rootElement.appendChild(layoutElement);
          }

          // FAST PATH: Only update content inside the persistent layout
          if (!this.layoutCache.contentSlot) {
            console.error("[0x1 Router] Content slot not found in cached layout");
            clearTimeout(renderTimeout);
            (this as any)._isRendering = false;
            return;
          }
          
          let pageElement: HTMLElement | null = null;
          try {
            const componentResult = component(match.params);
            
            // CRITICAL FIX: Handle Promise JSX components properly
            if (componentResult && typeof componentResult === 'object' && typeof componentResult.then === 'function') {
              // Show corner loading indicator
              const loadingIndicator = document.getElementById('app-loading');
              if (loadingIndicator) {
                loadingIndicator.classList.remove('loaded');
              }
              
              // Wait for Promise to resolve before continuing
              try {
                const resolvedResult = await componentResult;
                pageElement = this.jsxToDom(resolvedResult, currentRouteId);
                
                // Hide corner loading indicator
                if (loadingIndicator) {
                  loadingIndicator.classList.add('loaded');
                }
              } catch (promiseError) {
                console.error('[0x1 Router] Promise component failed:', promiseError);
                
                // Hide corner loading indicator on error
                if (loadingIndicator) {
                  loadingIndicator.classList.add('loaded');
                }
                
                // Show error in content slot
                this.layoutCache.contentSlot.innerHTML = `
                  <div style="padding: 20px; text-align: center; color: #ef4444;">
                    <div>❌ Error loading page</div>
                    <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">${promiseError instanceof Error ? promiseError.message : 'Promise component error'}</div>
                  </div>
                `;
                clearTimeout(renderTimeout);
                (this as any)._isRendering = false;
                return;
              }
            } else {
              // Regular synchronous component
              pageElement = this.jsxToDom(componentResult, currentRouteId);
            }
          } catch (componentError) {
            console.error("[0x1 Router] Component rendering failed:", componentError);
            // Show error in content slot
            this.layoutCache.contentSlot.innerHTML = `
              <div style="padding: 20px; text-align: center; color: #ef4444;">
                <div>❌ Error loading page</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">${componentError instanceof Error ? componentError.message : 'Component error'}</div>
              </div>
            `;
            clearTimeout(renderTimeout);
            (this as any)._isRendering = false;
            return;
          }
          
          if (!pageElement) {
            console.error("[0x1 Router] Failed to render page component");
            clearTimeout(renderTimeout);
            (this as any)._isRendering = false;
            return;
          }
          
          // CRITICAL: Replace content without touching the layout
          this.layoutCache.contentSlot.innerHTML = '';
          this.layoutCache.contentSlot.appendChild(pageElement);
          
        } else {
          // No layout - direct rendering (clear any cached layout)
          this.layoutCache = {};
          
          let element: HTMLElement | null = null;
          try {
            const componentResult = component(match.params);
            
            // CRITICAL FIX: Handle Promise JSX components properly
            if (componentResult && typeof componentResult === 'object' && typeof componentResult.then === 'function') {
              // Show corner loading indicator
              const loadingIndicator = document.getElementById('app-loading');
              if (loadingIndicator) {
                loadingIndicator.classList.remove('loaded');
              }
              
              // Wait for Promise to resolve before continuing
              try {
                const resolvedResult = await componentResult;
                element = this.jsxToDom(resolvedResult, currentRouteId);
                
                // Hide corner loading indicator
                if (loadingIndicator) {
                  loadingIndicator.classList.add('loaded');
                }
              } catch (promiseError) {
                console.error('[0x1 Router] Promise component failed:', promiseError);
                
                // Hide corner loading indicator on error
                if (loadingIndicator) {
                  loadingIndicator.classList.add('loaded');
                }
                
                // Show error directly in root
                rootElement.innerHTML = `
                  <div style="padding: 40px; text-align: center; color: #ef4444;">
                    <div>❌ Error loading page</div>
                    <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">${promiseError instanceof Error ? promiseError.message : 'Promise component error'}</div>
                  </div>
                `;
                clearTimeout(renderTimeout);
                (this as any)._isRendering = false;
                return;
              }
            } else {
              // Regular synchronous component
              element = this.jsxToDom(componentResult, currentRouteId);
            }
          } catch (componentError) {
            console.error("[0x1 Router] Component rendering failed:", componentError);
            // Show error directly in root
            rootElement.innerHTML = `
              <div style="padding: 40px; text-align: center; color: #ef4444;">
                <div>❌ Error loading page</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">${componentError instanceof Error ? componentError.message : 'Component error'}</div>
              </div>
            `;
            clearTimeout(renderTimeout);
            (this as any)._isRendering = false;
            return;
          }
          
          if (!element) {
            console.error("[0x1 Router] Failed to render component");
            clearTimeout(renderTimeout);
            (this as any)._isRendering = false;
            return;
          }
          
          // Use view transitions if available for smoother updates
          if ('startViewTransition' in document) {
            (document as any).startViewTransition(() => {
              rootElement.innerHTML = '';
              rootElement.appendChild(element);
            });
          } else {
            rootElement.innerHTML = '';
            rootElement.appendChild(element);
          }
        }
        
      } catch (error) {
        console.error("[0x1 Router] Error rendering route:", error);
      }
    } else {
      // No match found - render 404 component
      console.warn(`[0x1 Router] No route found for: ${this.currentPath}`);
      
      // Always render 404 in content slot if layout exists, otherwise replace everything
      if (this.layoutCache.element && this.layoutCache.contentSlot) {
        this.layoutCache.contentSlot.innerHTML = `
          <div style="padding: 40px; text-align: center; font-family: system-ui, sans-serif;">
            <div style="font-size: 4rem; font-weight: bold; color: #8b5cf6; margin-bottom: 16px;">404</div>
            <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 8px;">Page Not Found</div>
            <div style="color: #6b7280; margin-bottom: 24px;">The page you're looking for doesn't exist.</div>
            <a href="/" style="display: inline-block; padding: 8px 16px; background: #8b5cf6; color: white; border-radius: 6px; text-decoration: none;">← Back to Home</a>
          </div>
        `;
      } else {
        // No layout - replace entire content
        this.layoutCache = {};
        rootElement.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; padding: 16px; font-family: system-ui, sans-serif;">
            <div style="font-size: 6rem; font-weight: bold; color: #8b5cf6; margin-bottom: 16px;">404</div>
            <div style="font-size: 1.875rem; font-weight: bold; margin-bottom: 16px;">Page Not Found</div>
            <div style="color: #6b7280; margin-bottom: 32px;">The page you're looking for doesn't exist or has been moved.</div>
            <a href="/" onclick="event.preventDefault(); window.router?.navigate('/') || (window.location.href = '/')" style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; border-radius: 8px; text-decoration: none; font-weight: 500;">🏠 Back to Home</a>
          </div>
        `;
      }
    }
    
    // CRITICAL: Always reset rendering flag and clear timeout
    clearTimeout(renderTimeout);
    (this as any)._isRendering = false;
  }

  // Render fallback 404 page when no custom notFoundComponent is provided
  private renderFallback404(rootElement: HTMLElement): void {
    console.log('[0x1 Router] 🏠 Rendering fallback 404 page');
    rootElement.innerHTML = '';
    rootElement.appendChild(this.createFallback404Element());
  }

  // Create fallback 404 element for rendering inside layouts
  private createFallback404Element(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    container.innerHTML = `
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 6rem; font-weight: bold; color: #8b5cf6; margin-bottom: 16px; line-height: 1;">404</h1>
      </div>
      <div style="max-width: 28rem; margin: 0 auto;">
        <h2 style="font-size: 1.875rem; font-weight: bold; color: #1f2937; margin-bottom: 16px;">Page Not Found</h2>
        <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 32px;">The page you're looking for doesn't exist or has been moved.</p>
        <div style="display: flex; flex-direction: column; gap: 16px; align-items: center;">
          <a href="/" onclick="event.preventDefault(); window.router?.navigate('/') || (window.location.href = '/')" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.2s; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); cursor: pointer;">
            🏠 Back to Home
          </a>
        </div>
      </div>
    `;
    
    return container;
  }

  // Convert JSX object to DOM element
  private jsxToDom(jsx: any, routeId: string): HTMLElement | null {
    try {
      if (!jsx) return null;

      // NOTE: Promise JSX is now handled at the route level, so this shouldn't receive Promises
      if (jsx && typeof jsx === 'object' && typeof jsx.then === 'function') {
        // Return a simple placeholder
        const placeholder = document.createElement('div');
        placeholder.innerHTML = '<span style="color: #f59e0b;">⚠️ Promise JSX not resolved</span>';
        return placeholder;
      }

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
          const childElement = this.jsxToDom(child, routeId);
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
            const childElement = this.jsxToDom(child, routeId);
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
              const childElement = this.jsxToDom(child, routeId);
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
            }
            if (componentName) {
              element.setAttribute("data-component-name", componentName);
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
            const domElement = this.jsxToDom(result, routeId);
            
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

  // Efficient component rendering inspired by React 19/Next15
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
      for (const [existingId, _data] of registry.entries()) {
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
              const newDomElement = this.jsxToDom(newResult, componentId);

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

// JSX-compatible Link component with instant navigation and scroll behavior
export function Link({ href, className, children, prefetch, scrollBehavior, scrollToTop }: LinkProps): any {
  // Check if prefetch is needed
  const router = getCurrentRouter();
  if (prefetch && router) {
    router.prefetch(href);
  }

  // Determine final scroll behavior
  const finalScrollBehavior = scrollToTop ? 'top' : scrollBehavior;

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
            // Use router for instant client-side navigation with scroll behavior
            router.navigate(href, true, finalScrollBehavior);
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
      navigate: (path: string, pushState = true, scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth') => {
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
    navigate: (path: string, pushState = true, scrollBehavior?: 'auto' | 'top' | 'preserve' | 'smooth') =>
      router.navigate(path, pushState, scrollBehavior),
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

// Default export for Router class - CRITICAL FOR 0x1 FRAMEWORK
export default Router;
