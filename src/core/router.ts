/**
 * 0x1 Router
 * A zero-dependency router for single page applications
 * Supports Next.js 15-style app directory pattern with file-based routing
 */

import type { Component } from './component.js';

export interface RouteParams {
  [key: string]: string;
}

export interface Route {
  path: string;
  component: Component;
  exact?: boolean;
  layouts?: Component[];
  children?: Route[];
}

export interface RouterOptions {
  rootElement: HTMLElement;
  mode?: 'hash' | 'history';
  transitionDuration?: number;
  notFoundComponent?: Component;
  rootLayout?: Component; // Root layout component for the entire app
  appComponents: Record<string, { default: Component }>; // App directory components (required for Next.js 15)
  hydrate?: boolean; // Enable hydration mode for server-side rendering
  suspense?: boolean; // Enable React suspense for data fetching
}

/**
 * Creates a router instance that manages navigation and renders components
 */
export class Router {
  private routes: Route[] = [];
  private rootElement: HTMLElement;
  private mode: 'hash' | 'history';
  private notFoundComponent: Component;
  private currentPath: string = '';
  private transitionDuration: number;
  private rootLayout?: Component;
  
  private hydrate: boolean = false;
  private suspense: boolean = false;
  
  constructor(options: RouterOptions) {
    this.rootElement = options.rootElement;
    this.routes = []; // No initial routes in Next.js 15 - app dir only
    this.mode = options.mode || 'hash';
    this.transitionDuration = options.transitionDuration || 0;
    this.rootLayout = options.rootLayout;
    this.hydrate = options.hydrate || false;
    this.suspense = options.suspense || false;
    this.notFoundComponent = options.notFoundComponent || (() => {
      const element = document.createElement('div');
      element.className = '0x1-not-found';
      element.innerHTML = `
        <h1>Page Not Found</h1>
        <p>The requested page could not be found.</p>
        <a href="/">Go Home</a>
      `;
      return element;
    });
    
    // Initialize app directory components (Next.js 15 app directory is now the standard)
    this.initAppDirectoryRoutes(options.appComponents);
  }
  
  /**
   * Add a route to the router
   */
  addRoute(path: string, component: Component, exact: boolean = true, layouts?: Component[]): void {
    this.routes.push({ path, component, exact, layouts });
  }

  /**
   * Add a route with children (for nested routes)
   */
  addRouteWithChildren(route: Route): void {
    this.routes.push(route);
  }
  
  /**
   * Navigate to a specific path
   */
  navigate(path: string): void {
    if (this.mode === 'hash') {
      window.location.hash = path;
    } else if (this.mode === 'history') {
      window.history.pushState(null, '', path);
      this.handleRouteChange();
    }
  }
  
  /**
   * Initialize the router
   */
  init(): void {
    // Add transition class for smooth transitions
    if (this.transitionDuration > 0) {
      this.rootElement.style.transition = `opacity ${this.transitionDuration}ms ease-in-out`;
    }
    
    if (this.mode === 'hash') {
      // Handle initial route
      window.addEventListener('hashchange', () => this.handleRouteChange());
      
      // Set default route if hash is empty
      if (!window.location.hash) {
        window.location.hash = '/';
      } else {
        this.handleRouteChange();
      }
    } else if (this.mode === 'history') {
      // Handle clicks on links
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A') {
          const href = (target as HTMLAnchorElement).getAttribute('href');
          
          // Only handle internal links
          if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#')) {
            e.preventDefault();
            this.navigate(href);
          }
        }
      });
      
      // Handle back/forward navigation
      window.addEventListener('popstate', () => this.handleRouteChange());
      
      // Handle initial route
      this.handleRouteChange();
    }
  }
  
  /**
   * Handle route changes
   */
  private async handleRouteChange(): Promise<void> {
    const path = this.getPath();
    
    // Don't re-render if the path hasn't changed
    if (path === this.currentPath) return;
    
    this.currentPath = path;
    
    // Find the matching route
    const route = this.findMatchingRoute(path);
    
    if (this.transitionDuration > 0) {
      this.rootElement.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
    }
    
    try {
      // Clear previous content
      this.rootElement.innerHTML = '';
      
      if (route) {
        // Extract params from the path
        const params = this.extractParams(route, path);
        
        // Get the component to render
        let componentFn = route.component;
        
        // Always apply layouts (app directory mode)
        componentFn = this.applyLayouts(componentFn, params, route.layouts);
        
        // Execute the component function
        const result = componentFn(params);
        
        // Handle the result
        this.renderResult(result);
      } else {
        // Not found case
        let notFoundFn = this.notFoundComponent;
        
        // Always apply layouts to not found page (app directory mode)
        notFoundFn = this.applyLayouts(notFoundFn, {});
        
        // Execute not found component
        const result = notFoundFn({});
        
        // Handle the result
        this.renderResult(result);
      }
    } catch (error) {
      console.error('Error rendering route:', error);
      this.rootElement.innerHTML = `
        <div class="0x1-error">
          <h1>Error</h1>
          <p>An error occurred while rendering this page.</p>
          <pre>${error}</pre>
        </div>
      `;
    }
    
    // Fade in if transitions enabled
    if (this.transitionDuration > 0) {
      setTimeout(() => {
        this.rootElement.style.opacity = '1';
      }, 10);
    }
    
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    // Dispatch custom event for route change
    window.dispatchEvent(new CustomEvent('routechange', {
      detail: { path, params: route ? this.extractParams(route, path) : {} }
    }));
  }
  
  /**
   * Helper method to render a component result
   */
  private renderResult(result: any): void {
    if (result instanceof HTMLElement || result instanceof DocumentFragment) {
      this.rootElement.appendChild(result);
    } else if (typeof result === 'string') {
      this.rootElement.innerHTML = result;
    } else {
      console.error('Invalid component result:', result);
      this.rootElement.innerHTML = `
        <div class="0x1-error">
          <h1>Render Error</h1>
          <p>Component returned an invalid result.</p>
        </div>
      `;
    }
  }
  
  /**
   * Get the current path from either hash or location
   */
  private getPath(): string {
    if (this.mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    } else {
      return window.location.pathname || '/';
    }
  }
  
  /**
   * Find a route that matches the current path
   */
  private findMatchingRoute(path: string): Route | undefined {
    // Try exact matches first
    for (const route of this.routes) {
      if (route.exact && route.path === path) {
        return route;
      }
    }
    
    // Then try pattern matching
    for (const route of this.routes) {
      if (!route.exact) {
        const routeRegex = this.pathToRegex(route.path);
        if (routeRegex.test(path)) {
          return route;
        }
      }
      
      // Check children if present (for nested routes)
      if (route.children) {
        const childRoute = this.findChildRoute(route.children, path);
        if (childRoute) {
          // Apply parent layouts to child route
          childRoute.layouts = childRoute.layouts || [];
          if (route.layouts) {
            childRoute.layouts = [...childRoute.layouts, ...route.layouts];
          }
          return childRoute;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Recursively find a matching child route
   */
  private findChildRoute(routes: Route[], path: string): Route | undefined {
    for (const route of routes) {
      // Try exact match
      if (route.exact && route.path === path) {
        return route;
      }
      
      // Try pattern matching
      if (!route.exact) {
        const routeRegex = this.pathToRegex(route.path);
        if (routeRegex.test(path)) {
          return route;
        }
      }
      
      // Recursively check children
      if (route.children) {
        const childRoute = this.findChildRoute(route.children, path);
        if (childRoute) {
          // Apply parent layouts to child route
          childRoute.layouts = childRoute.layouts || [];
          if (route.layouts) {
            childRoute.layouts = [...childRoute.layouts, ...route.layouts];
          }
          return childRoute;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Convert a path pattern to a regular expression
   */
  private pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\//g, '\\/') // Escape slashes
      .replace(/:\w+/g, '([^/]+)'); // Replace :param with capture groups
    
    return new RegExp(`^${pattern}$`);
  }
  
  /**
   * Extract parameters from a path based on a route pattern
   */
  private extractParams(route: Route, path: string): RouteParams {
    const params: RouteParams = {};
    
    if (!route.path.includes(':')) return params;
    
    const paramNames = route.path
      .match(/:\w+/g)
      ?.map(param => param.substring(1));
    
    if (!paramNames) return params;
    
    const pathRegex = this.pathToRegex(route.path);
    const matches = path.match(pathRegex);
    
    if (matches) {
      paramNames.forEach((name, index) => {
        params[name] = matches[index + 1];
      });
    }
    
    return params;
  }
  
  /**
   * Initialize routes from Next.js 15-style app directory components
   * This transforms file-based components into a route structure
   */
  private initAppDirectoryRoutes(components: Record<string, { default: Component }>): void {
    // If no components provided, do nothing
    if (!components || Object.keys(components).length === 0) return;
    
    // Extract root layout if it exists
    const rootLayoutComponent = components['app/layout']?.default;
    if (rootLayoutComponent && !this.rootLayout) {
      this.rootLayout = rootLayoutComponent;
    }
    
    // Extract not found component if it exists
    const notFoundComponent = components['app/not-found']?.default;
    if (notFoundComponent) {
      this.notFoundComponent = notFoundComponent;
    }
    
    // Store all layouts by path for nested layout support
    const layoutsByPath: Record<string, Component> = {};
    
    // First pass: collect all layout components
    for (const [path, component] of Object.entries(components)) {
      if (path.endsWith('/layout')) {
        const routePath = path
          .replace('app', '') // Remove app prefix
          .replace(/\/layout$/, ''); // Remove /layout suffix
        layoutsByPath[routePath] = component.default;
      }
    }
    
    // Process page components
    const routes: Route[] = [];
    
    // Second pass: process all page components with their associated layouts
    for (const [path, component] of Object.entries(components)) {
      // Skip layout and not-found components, they're handled separately
      if (path === 'app/layout' || path === 'app/not-found' || path.endsWith('/layout')) continue;
      
      // Only process page components (page.ts, page.tsx, page.js, page.jsx)
      if (!path.endsWith('/page')) continue;
      
      // Convert file path to route path
      let routePath = path
        .replace('app', '') // Remove app prefix
        .replace(/\/page$/, '') // Remove /page suffix
        .replace(/\/([\w-]+)\/?/g, '/$1') // Normalize slashes
        || '/';
      
      // Map dynamic route segments [param] to :param format
      // Support both [param] and [...param] (catch-all) formats
      routePath = routePath
        .replace(/\[(\w+)\]/g, ':$1') // [param] -> :param
        .replace(/\[\.\.\.([\w-]+)\]/g, '*$1'); // [...param] -> *param (catch-all)
      
      // Collect all layouts for this route by traversing up the path
      const layouts: Component[] = [];
      let currentPath = routePath;
      
      while (currentPath !== '') {
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        if (layoutsByPath[parentPath]) {
          layouts.unshift(layoutsByPath[parentPath]); // Add parent layouts first
        }
        currentPath = parentPath;
      }
      
      // Create the route with all its layouts
      routes.push({
        path: routePath,
        component: component.default,
        exact: true,
        layouts
      });
    }
    
    // Add all routes
    for (const route of routes) {
      this.addRoute(route.path, route.component, route.exact, route.layouts);
    }
  }
  
  /**
   * Apply layouts to page components
   * Supports nested layouts and error boundaries
   */
  private applyLayouts(component: Component, params: RouteParams = {}, layouts?: Component[]): Component {
    
    // Start with the page component
    let wrappedComponent = component;
    
    // If we have specific layouts for this route, apply them in order
    if (layouts && layouts.length > 0) {
      // Apply layouts from innermost to outermost (reverse order)
      for (let i = layouts.length - 1; i >= 0; i--) {
        const currentLayout = layouts[i];
        const prevComponent = wrappedComponent;
        
        wrappedComponent = () => {
          try {
            const pageContent = prevComponent(params);
            return currentLayout({ children: pageContent, params }) || document.createDocumentFragment();
          } catch (error) {
            console.error(`Error in layout at position ${i}:`, error);
            return document.createDocumentFragment();
          }
        };
      }
    }
    
    // Finally, apply the root layout if available
    if (this.rootLayout) {
      const finalComponent = wrappedComponent;
      const rootLayout = this.rootLayout; // Store in local variable to avoid TypeScript null check issues
      wrappedComponent = () => {
        try {
          const pageContent = finalComponent(params);
          return rootLayout({ children: pageContent, params }) || document.createDocumentFragment();
        } catch (error) {
          console.error('Error in root layout:', error);
          return document.createDocumentFragment();
        }
      };
    }
    
    return wrappedComponent;
  }
}
