/**
 * 0x1 Navigation System
 * Provides routing and page navigation capabilities
 */

import { resetHookContext, setCurrentComponent } from './hooks.js';

export interface RouteParams {
  [key: string]: string;
}

export interface NavigationOptions {
  mode?: 'history' | 'hash';
  basePath?: string;
  notFoundComponent?: Page<any> | Component;
  transitionDuration?: number;
}

export interface RouterState {
  currentPath: string;
  previousPath: string | null;
  params: RouteParams;
  query: Record<string, string>;
}

export interface Component {
  render: (props?: any) => HTMLElement;
  onMount?: () => void;
  onUnmount?: () => void;
}

export interface Page<P = any> extends Component {
  title?: string;
  meta?: {
    description?: string;
    [key: string]: string | undefined;
  };
  render: (props?: P) => HTMLElement;
  onMount?: () => void;
  onUnmount?: () => void;
}

interface Route {
  path: string;
  pattern: RegExp;
  paramNames: string[];
  component: Page<any> | Component;
}

/**
 * Router class for SPA navigation
 */
export class Router {
  private routes: Route[] = [];
  private rootElement: HTMLElement;
  private mode: 'history' | 'hash';
  private basePath: string;
  private notFoundComponent: Page<any> | Component | null = null;
  private currentComponent: Component | null = null;
  private currentElement: HTMLElement | null = null;
  private transitionDuration: number;
  private state: RouterState;

  /**
   * Create a router instance
   */
  constructor(options: {
    root: HTMLElement;
    mode?: 'history' | 'hash';
    basePath?: string;
    notFoundComponent?: Page<any> | Component;
    transitionDuration?: number;
  }) {
    this.rootElement = options.root;
    this.mode = options.mode || 'history';
    this.basePath = options.basePath || '';
    this.notFoundComponent = options.notFoundComponent || null;
    this.transitionDuration = options.transitionDuration || 200;
    
    this.state = {
      currentPath: this.getCurrentPath(),
      previousPath: null,
      params: {},
      query: {},
    };
  }

  /**
   * Add a route
   */
  addRoute(path: string, component: Page<any> | Component): void {
    // Convert path pattern to regex (e.g., '/users/:id' -> /^/users/([^/]+)$/)
    const paramNames: string[] = [];
    
    try {
      // Special case for root path
      if (path === "/") {
        this.routes.push({
          path,
          pattern: new RegExp("^\\/$"),
          paramNames,
          component,
        });
        return;
      }
      
      // Step 1: Escape all regex special characters first
      let pattern = path
        .replace(/[\^\$\(\)\[\]\{\}\+\?\.]/g, "\\$&");
      
      // Step 2: Handle path-specific escaping
      // Escape forward slashes (path separators)
      pattern = pattern.replace(/\//g, "\\/");
      
      // Step 3: Replace path pattern tokens with regex patterns
      // Convert :param to capture groups (after escaping the colon)
      pattern = pattern.replace(/\\:([a-zA-Z0-9_]+)/g, (match, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      });
      
      // Handle wildcard routes (* was already escaped earlier)
      pattern = pattern.replace(/\\\*/g, "(.*)");
      
      // Step 4: Build the final regex with start/end anchors
      // Allow optional trailing slash with /?$
      const finalPattern = new RegExp(`^${pattern}\/?$`);
      
      this.routes.push({
        path,
        pattern: finalPattern,
        paramNames,
        component,
      });
    } catch (error) {
      console.error(`Error creating route pattern for path '${path}':`, error);
      // Always provide a fallback in case of regex failures
      this.routes.push({
        path,
        pattern: new RegExp("^\\/.*$"), // Match any path as fallback
        paramNames,
        component,
      });
    }
  }

  /**
   * Initialize the router
   */
  init(): void {
    // Handle initial route
    this.handleRoute(this.getCurrentPath());
    
    // Add event listeners
    window.addEventListener('popstate', this.handlePopState);
    
    // For hash mode
    if (this.mode === 'hash') {
      window.addEventListener('hashchange', this.handleHashChange);
    }
    
    // Intercept clicks on links
    document.addEventListener('click', this.handleLinkClick);
  }

  /**
   * Navigate to a new path
   */
  navigate(path: string): void {
    if (path === this.state.currentPath) return;
    
    if (this.mode === 'history') {
      history.pushState(null, '', this.basePath + path);
      this.handleRoute(path);
    } else {
      window.location.hash = path;
    }
  }

  /**
   * Handle popstate event (for history API)
   */
  private handlePopState = () => {
    this.handleRoute(this.getCurrentPath());
  };

  /**
   * Handle hashchange event (for hash routing)
   */
  private handleHashChange = () => {
    this.handleRoute(this.getCurrentPath());
  };

  /**
   * Intercept link clicks for SPA navigation
   */
  private handleLinkClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    
    if (
      link &&
      link.href &&
      link.origin === window.location.origin &&
      !link.hasAttribute('data-external') &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      
      const path = 
        this.mode === 'hash'
          ? link.hash.slice(1) || '/'
          : link.pathname.replace(this.basePath, '');
      
      this.navigate(path);
    }
  };

  /**
   * Get current path based on routing mode
   */
  private getCurrentPath(): string {
    if (this.mode === 'hash') {
      return (window.location.hash.slice(1) || '/').replace(this.basePath, '');
    } else {
      return window.location.pathname.replace(this.basePath, '') || '/';
    }
  }

  /**
   * Match a path against routes
   */
  private matchRoute(path: string): { route: Route; params: RouteParams } | null {
    for (const route of this.routes) {
      const match = path.match(route.pattern);
      
      if (match) {
        const params: RouteParams = {};
        
        // Extract route params
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1] || '';
        });
        
        return { route, params };
      }
    }
    
    return null;
  }

  /**
   * Extract query parameters from URL
   */
  private extractQueryParams(): Record<string, string> {
    const query: Record<string, string> = {};
    const search = window.location.search.substring(1);
    
    if (search) {
      const params = new URLSearchParams(search);
      params.forEach((value, key) => {
        query[key] = value;
      });
    }
    
    return query;
  }

  /**
   * Handle route change
   */
  private handleRoute(path: string): void {
    // Update state
    this.state = {
      previousPath: this.state.currentPath,
      currentPath: path,
      params: {},
      query: this.extractQueryParams(),
    };
    
    // Find matching route
    const match = this.matchRoute(path);
    
    if (match) {
      const { route, params } = match;
      this.state.params = params;
      this.renderComponent(route.component, { params, query: this.state.query });
      
      // Update document title if component is a Page with title
      const component = route.component as Page;
      if (component.title) {
        document.title = component.title;
      }
      
      // Update meta tags if component is a Page with meta
      if (component.meta) {
        this.updateMetaTags(component.meta);
      }
    } else if (this.notFoundComponent) {
      this.renderComponent(this.notFoundComponent);
    } else {
      console.error(`No route found for ${path}`);
    }
  }

  /**
   * Update meta tags based on page metadata
   */
  private updateMetaTags(meta: Page['meta']): void {
    if (!meta) return;
    
    // Update or create description meta tag
    if (meta.description) {
      let descTag = document.querySelector('meta[name="description"]');
      
      if (!descTag) {
        descTag = document.createElement('meta');
        descTag.setAttribute('name', 'description');
        document.head.appendChild(descTag);
      }
      
      descTag.setAttribute('content', meta.description);
    }
    
    // Handle other meta tags
    Object.entries(meta).forEach(([key, value]) => {
      if (key !== 'description' && value) {
        let metaTag = document.querySelector(`meta[name="${key}"]`);
        
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('name', key);
          document.head.appendChild(metaTag);
        }
        
        metaTag.setAttribute('content', value);
      }
    });
  }

  /**
   * Render a component
   */
  private renderComponent(component: Component, props: any = {}): void {
    // If there's a current component, call its onUnmount lifecycle method
    if (this.currentComponent && this.currentComponent.onUnmount) {
      this.currentComponent.onUnmount();
    }
    
    // Set new component as current
    this.currentComponent = component;
    
    // Render the component
    try {
      // Set component context for hooks
      setCurrentComponent(component);
      
      // Render the component
      const newElement = component.render(props);
      
      // Reset hooks context
      resetHookContext();
      
      // Transition between views
      this.transitionElements(newElement);
      
      // Call onMount lifecycle method if it exists
      if (component.onMount) {
        queueMicrotask(() => {
          component.onMount?.();
        });
      }
    } catch (error) {
      console.error('Error rendering component:', error);
    }
  }

  /**
   * Handle transition between views
   */
  private transitionElements(newElement: HTMLElement): void {
    // If no transition duration, just swap elements
    if (this.transitionDuration <= 0) {
      this.rootElement.innerHTML = '';
      this.rootElement.appendChild(newElement);
      this.currentElement = newElement;
      return;
    }
    
    // Add transition classes
    newElement.style.opacity = '0';
    if (this.currentElement) {
      this.currentElement.style.position = 'absolute';
      this.currentElement.style.width = '100%';
      this.currentElement.style.transition = `opacity ${this.transitionDuration}ms ease`;
      this.currentElement.style.opacity = '0';
    }
    
    // Add the new element
    newElement.style.transition = `opacity ${this.transitionDuration}ms ease`;
    this.rootElement.appendChild(newElement);
    
    // Trigger reflow
    void newElement.offsetHeight;
    
    // Fade in new element
    newElement.style.opacity = '1';
    
    // Remove old element after transition
    setTimeout(() => {
      if (this.currentElement && this.currentElement !== newElement && this.currentElement.parentNode) {
        this.currentElement.parentNode.removeChild(this.currentElement);
      }
      this.currentElement = newElement;
    }, this.transitionDuration);
  }

  /**
   * Destroy router and clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('popstate', this.handlePopState);
    
    if (this.mode === 'hash') {
      window.removeEventListener('hashchange', this.handleHashChange);
    }
    
    document.removeEventListener('click', this.handleLinkClick);
    
    if (this.currentComponent && this.currentComponent.onUnmount) {
      this.currentComponent.onUnmount();
    }
  }

  /**
   * Get current router state
   */
  getState(): RouterState {
    return { ...this.state };
  }
}

/**
 * Link component for navigation
 */
export function Link(props: {
  to: string;
  children: Array<HTMLElement | string>;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  [key: string]: any;
}): HTMLElement {
  const { to, children, className = '', activeClassName = 'active', exact = false, ...rest } = props;
  
  // Create anchor element
  const a = document.createElement('a');
  a.href = to;
  
  // Set class name
  a.className = className;
  
  // Check if link should be active (matches current path)
  const currentPath = window.location.pathname;
  const isActive = exact
    ? currentPath === to
    : currentPath.startsWith(to) && (to !== '/' || currentPath === '/');
  
  if (isActive && activeClassName) {
    a.className = a.className
      ? `${a.className} ${activeClassName}`
      : activeClassName;
  }
  
  // Set other attributes
  Object.entries(rest).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      // Handle event listeners
      const eventName = key.substring(2).toLowerCase();
      a.addEventListener(eventName, value as EventListener);
    } else if (key === 'style' && typeof value === 'object') {
      // Handle style object
      Object.entries(value).forEach(([cssKey, cssValue]) => {
        (a.style as any)[cssKey] = cssValue;
      });
    } else if (value !== undefined && value !== null) {
      // Set attribute for everything else
      a.setAttribute(key, String(value));
    }
  });
  
  // Append children
  children.forEach(child => {
    if (typeof child === 'string') {
      a.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      a.appendChild(child);
    }
  });
  
  return a;
}

/**
 * NavLink component - Link that can automatically highlight when active
 */
export function NavLink(props: {
  to: string;
  children: Array<HTMLElement | string>;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  [key: string]: any;
}): HTMLElement {
  return Link({
    ...props,
    activeClassName: props.activeClassName || 'active',
  });
}

/**
 * Create a redirect component
 */
export function Redirect(props: { to: string }): Component {
  return {
    render: () => {
      setTimeout(() => {
        // Get the current router if available
        const currentRouter = (window as any).__0x1_ROUTER__;
        
        if (currentRouter && typeof currentRouter.navigate === 'function') {
          currentRouter.navigate(props.to);
        } else {
          // Fallback to regular navigation
          if (props.to.startsWith('http') || props.to.startsWith('//')) {
            window.location.href = props.to;
          } else {
            window.location.pathname = props.to;
          }
        }
      }, 0);
      
      return document.createElement('div');
    }
  };
}
