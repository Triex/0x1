/**
 * 0x1 Router
 * A zero-dependency router for single page applications
 */

import type { Component } from './component.js';

export interface RouteParams {
  [key: string]: string;
}

export interface Route {
  path: string;
  component: Component;
  exact?: boolean;
}

export interface RouterOptions {
  rootElement: HTMLElement;
  mode?: 'hash' | 'history';
  notFoundComponent?: Component;
  transitionDuration?: number;
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
  
  constructor(options: RouterOptions) {
    this.rootElement = options.rootElement;
    this.mode = options.mode || 'hash';
    this.transitionDuration = options.transitionDuration || 0;
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
  }
  
  /**
   * Add a route to the router
   */
  addRoute(path: string, component: Component, exact: boolean = true): void {
    this.routes.push({ path, component, exact });
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
    
    // Fade out if transitions enabled
    if (this.transitionDuration > 0) {
      this.rootElement.style.opacity = '0';
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
    }
    
    // Clear the root element
    this.rootElement.innerHTML = '';
    
    try {
      // Render the component
      if (route) {
        const params = this.extractParams(route, path);
        const component = route.component({ params });
        this.rootElement.appendChild(component);
      } else {
        const notFoundComponent = this.notFoundComponent({});
        this.rootElement.appendChild(notFoundComponent);
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
}
