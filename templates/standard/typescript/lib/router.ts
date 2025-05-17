/**
 * Simple but powerful router implementation for 0x1
 */

type RouteHandler = (params?: Record<string, string>) => HTMLElement;

export class Router {
  private routes: Record<string, RouteHandler> = {};
  private root: HTMLElement;
  private notFoundHandler: RouteHandler | null = null;
  
  constructor(rootElement: HTMLElement) {
    this.root = rootElement;
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
  }
  
  addRoute(path: string, handler: RouteHandler): void {
    this.routes[path] = handler;
  }
  
  setNotFound(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }
  
  handleRouteChange(): void {
    const path = window.location.pathname;
    this.renderRoute(path);
  }
  
  renderRoute(path: string): void {
    console.log(`Rendering route: ${path}`);
    
    // ALWAYS target the main-content element
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      console.error('Main content container not found, falling back to root element');
    }
    
    // Use main content if available, otherwise fall back to root
    const targetElement = mainContent || this.root;
    console.log(`Target element for content:`, targetElement);
    
    // Clear current content
    while (targetElement.firstChild) {
      targetElement.removeChild(targetElement.firstChild);
    }
    
    // Find matching route or use not found handler
    let content: HTMLElement | null = null;
    
    // Check for exact route match
    if (this.routes[path]) {
      content = this.routes[path]();
    } else {
      // Check for dynamic routes with parameters
      const dynamicRouteMatch = this.matchDynamicRoute(path);
      if (dynamicRouteMatch) {
        const { route, params } = dynamicRouteMatch;
        content = this.routes[route](params);
      } else if (this.notFoundHandler) {
        // Use not found handler if available
        content = this.notFoundHandler();
      } else {
        // Create simple not found message if no handler is defined
        content = document.createElement('div');
        content.innerHTML = '<h1>Page Not Found</h1><p>The requested page could not be found.</p>';
      }
    }
    
    if (content) {
      // Add fade-in animation class to content
      content.classList.add('animate-fade-in');
      targetElement.appendChild(content);
      console.log('Content rendered successfully');
    } else {
      console.error('Failed to generate content for route');
    }
  }
  
  private matchDynamicRoute(path: string): { route: string; params: Record<string, string> } | null {
    for (const route of Object.keys(this.routes)) {
      if (!route.includes(':')) continue;
      
      const routeParts = route.split('/');
      const pathParts = path.split('/');
      
      if (routeParts.length !== pathParts.length) continue;
      
      const params: Record<string, string> = {};
      let matched = true;
      
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          // Parameter part
          const paramName = routeParts[i].slice(1);
          params[paramName] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          // Not a match
          matched = false;
          break;
        }
      }
      
      if (matched) {
        return { route, params };
      }
    }
    
    return null;
  }
  
  navigateTo(path: string): void {
    window.history.pushState(null, '', path);
    this.renderRoute(path);
  }
  
  init(): void {
    this.handleRouteChange();
  }
}
