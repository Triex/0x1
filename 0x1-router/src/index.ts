/**
 * 0x1 Router - Complete routing solution for 0x1 Framework
 */

/// <reference lib="dom" />

// Import JSX utilities
declare function jsx(type: string | ComponentFunction, props: any, key?: string): any;

// Component function type - more specific than Function
type ComponentFunction = (props: any) => any;

// Core types
interface Route {
  path: string;
  component: () => any;
  exact?: boolean;
  middleware?: Middleware[];
  meta?: Record<string, any>;
}

interface LinkProps {
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

// Router class - handles both client and server-side routing
class Router {
  private routes: Route[] = [];
  public currentPath: string = '/'; // Made public to fix access error
  private listeners: (() => void)[] = [];
  private middleware: Middleware[] = [];
  private isServer: boolean = typeof window === 'undefined';

  constructor() {
    if (!this.isServer) {
      // Client-side setup
      window.addEventListener('popstate', () => {
        this.navigate(window.location.pathname, false);
      });
      
      // Make router globally available
      (window as any).__0x1_router = this;
      
      // Handle initial route
      this.currentPath = window.location.pathname;
    }
  }

  // Add route with optional middleware
  addRoute(route: Route) {
    this.routes.push(route);
  }

  // Add global middleware
  use(middleware: Middleware) {
    this.middleware.push(middleware);
  }

  // Navigate to path (client-side only)
  navigate(path: string, pushState: boolean = true) {
    if (this.isServer) return;
    
    this.currentPath = path;
    
    if (pushState) {
      window.history.pushState(null, '', path);
    }
    
    this.executeMiddleware(path);
    this.listeners.forEach(listener => listener());
    
    // Trigger re-render
    if ((window as any).__0x1_triggerUpdate) {
      (window as any).__0x1_triggerUpdate();
    }
  }

  // Execute middleware chain
  private executeMiddleware(path: string) {
    const match = this.matchRoute(path);
    if (!match) return;

    const context: RouteContext = {
      path,
      params: match.params,
      query: new URLSearchParams(window?.location.search || ''),
      meta: match.route.meta || {}
    };

    const allMiddleware = [...this.middleware, ...(match.route.middleware || [])];
    
    let index = 0;
    const next = () => {
      if (index < allMiddleware.length) {
        allMiddleware[index++](context, next);
      }
    };
    
    next();
  }

  // Match route with params extraction
  matchRoute(path: string): RouteMatch | null {
    for (const route of this.routes) {
      const match = this.pathToRegExp(route.path, route.exact);
      const result = path.match(match.regex);
      
      if (result) {
        const params: Record<string, string> = {};
        match.keys.forEach((key, index) => {
          params[key] = result[index + 1] || '';
        });
        
        return { route, params };
      }
    }
    return null;
  }

  // Convert path pattern to regex with param extraction
  private pathToRegExp(path: string, exact?: boolean) {
    const keys: string[] = [];
    let regexStr = path
      .replace(/\//g, '/')
      .replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      });
    
    if (exact) {
      regexStr = `^${regexStr}$`;
    } else {
      regexStr = `^${regexStr}`;
    }
    
    return {
      regex: new RegExp(regexStr),
      keys
    };
  }

  getCurrentRoute(): RouteMatch | null {
    return this.matchRoute(this.currentPath);
  }

  onRouteChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Server-side route resolution
  resolveRoute(path: string): RouteMatch | null {
    return this.matchRoute(path);
  }

  // Generate static routes for SSG
  generateStaticRoutes(): string[] {
    return this.routes
      .filter(route => !route.path.includes(':'))
      .map(route => route.path);
  }
}

// Global router instance
const router = new Router();

// JSX-compatible Link component
export function Link({ href, className, children, prefetch }: LinkProps): any {
  const handleClick = (e: Event) => {
    // For external links, let default behavior happen
    if (href.startsWith('http') || href.startsWith('//')) {
      return;
    }
    
    // For internal links, use router navigation
    e.preventDefault();
    router.navigate(href);
  };

  // Return JSX element structure that's compatible with 0x1's JSX system
  return {
    type: 'a',
    props: {
      href,
      className,
      onClick: handleClick,
    },
    children: Array.isArray(children) ? children : [children]
  };
}

// Route component for rendering current route - renamed to avoid conflict
function RouteRenderer(): any {
  const currentRoute = router.getCurrentRoute();
  
  if (currentRoute) {
    return currentRoute.route.component();
  }
  
  return null;
}

// Router outlet for nested routing
export function RouterOutlet(): any {
  return RouteRenderer();
}

// Hook for using router in components
export function useRouter() {
  return {
    navigate: (path: string) => router.navigate(path),
    currentPath: router.currentPath,
    addRoute: (route: Route) => router.addRoute(route),
    getCurrentRoute: () => router.getCurrentRoute(),
    use: (middleware: Middleware) => router.use(middleware)
  };
}

// Hook for route params
export function useParams(): Record<string, string> {
  const match = router.getCurrentRoute();
  return match?.params || {};
}

// Hook for query params
export function useSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

// Server-side utilities
export const serverRouter = {
  handleRequest: (path: string) => router.resolveRoute(path),
  generateRoutes: () => router.generateStaticRoutes(),
  addServerRoute: (route: Route) => router.addRoute(route)
};

// Route guards/middleware helpers
export const createAuthGuard = (redirectTo: string = '/login') => {
  return (context: RouteContext, next: () => void) => {
    // Implement auth check logic
    const isAuthenticated = checkAuth();
    if (isAuthenticated) {
      next();
    } else {
      router.navigate(redirectTo);
    }
  };
};

// Utility to check auth (placeholder)
function checkAuth(): boolean {
  // Implement your authentication check
  return true;
}

// Export router instance and types
export { router, RouteRenderer };
export type { ComponentFunction, LinkProps, Middleware, Route, RouteContext, RouteMatch };

