/**
 * Simple but powerful router implementation for 0x1
 */

export class Router {
  constructor(rootElement) {
    this.routes = {};
    this.root = rootElement;
    this.notFoundHandler = null;
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
  }
  
  addRoute(path, handler) {
    this.routes[path] = handler;
  }
  
  setNotFound(handler) {
    this.notFoundHandler = handler;
  }
  
  handleRouteChange() {
    const path = window.location.pathname;
    this.renderRoute(path);
  }
  
  renderRoute(path) {
    // Clear current content
    while (this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
    
    // Find matching route or use not found handler
    let content = null;
    
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
      this.root.appendChild(content);
    }
  }
  
  matchDynamicRoute(path) {
    for (const route of Object.keys(this.routes)) {
      if (!route.includes(':')) continue;
      
      const routeParts = route.split('/');
      const pathParts = path.split('/');
      
      if (routeParts.length !== pathParts.length) continue;
      
      const params = {};
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
  
  navigateTo(path) {
    window.history.pushState(null, '', path);
    this.renderRoute(path);
  }
  
  init() {
    this.handleRouteChange();
  }
}
