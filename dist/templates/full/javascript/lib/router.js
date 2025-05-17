/**
 * Advanced router implementation for 0x1
 * Supports dynamic routes, route params, and lazy loading
 */

export class Router {
  constructor(rootElement) {
    this.routes = {};
    this.root = rootElement;
    this.notFoundHandler = null;
    this.currentPath = null;
    this.previousPath = null;
    this.isTransitioning = false;
    this.navigationListeners = [];
    
    // Setup history API listeners
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
    
    // Intercept link clicks for SPA navigation
    document.addEventListener('click', this.handleLinkClick.bind(this));
  }
  
  /**
   * Add a route handler
   * @param {string} path - The route path (can include params like /users/:id)
   * @param {Function|Promise} handler - Function that returns DOM element or Promise
   */
  addRoute(path, handler) {
    this.routes[path] = handler;
    return this;
  }
  
  /**
   * Set the not found (404) handler
   * @param {Function} handler - Function that returns DOM element
   */
  setNotFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }
  
  /**
   * Add navigation listener
   * @param {Function} listener - Called before navigation with (toPath, fromPath)
   */
  addNavigationListener(listener) {
    this.navigationListeners.push(listener);
    return this;
  }
  
  /**
   * Handle route changes (used by popstate event)
   */
  handleRouteChange() {
    const path = window.location.pathname;
    this.renderRoute(path);
  }
  
  /**
   * Handle link click for SPA navigation
   * @param {Event} e - Click event
   */
  handleLinkClick(e) {
    // Only handle links
    if (e.target.tagName !== 'A' && e.target.closest('a') === null) return;
    
    const link = e.target.tagName === 'A' ? e.target : e.target.closest('a');
    const href = link.getAttribute('href');
    
    // Ignore non-relative links, links with target, download, etc.
    if (!href || 
        href.startsWith('http') || 
        href.startsWith('//') || 
        href.startsWith('#') || 
        href.startsWith('javascript:') ||
        link.getAttribute('target') ||
        link.getAttribute('download') ||
        link.getAttribute('rel') === 'external'
    ) {
      return;
    }
    
    // Handle SPA navigation
    e.preventDefault();
    this.navigateTo(href);
  }
  
  /**
   * Programmatically navigate to a route
   * @param {string} path - Target path
   */
  navigateTo(path) {
    if (this.currentPath === path) return;
    if (this.isTransitioning) return;
    
    this.previousPath = this.currentPath;
    this.currentPath = path;
    
    // Notify navigation listeners
    this.navigationListeners.forEach(listener => {
      try {
        listener(path, this.previousPath);
      } catch (e) {
        console.error('Navigation listener error:', e);
      }
    });
    
    window.history.pushState(null, '', path);
    this.renderRoute(path);
  }
  
  /**
   * Render a route to the DOM
   * @param {string} path - Route path
   */
  async renderRoute(path) {
    this.isTransitioning = true;
    
    // Add transition class to main content for animation
    this.root.classList.add('route-transition-out');
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clear current content
    while (this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
    
    // Find matching route or use not found handler
    let content = null;
    
    // Check for exact route match
    if (this.routes[path]) {
      try {
        const handler = this.routes[path];
        content = typeof handler === 'function' ? await handler() : handler;
      } catch (error) {
        console.error(`Error rendering route ${path}:`, error);
        content = this.createErrorElement(error);
      }
    } else {
      // Check for dynamic routes with parameters
      const dynamicRouteMatch = this.matchDynamicRoute(path);
      
      if (dynamicRouteMatch) {
        const { route, params } = dynamicRouteMatch;
        try {
          const handler = this.routes[route];
          content = typeof handler === 'function' ? await handler(params) : handler;
        } catch (error) {
          console.error(`Error rendering dynamic route ${path}:`, error);
          content = this.createErrorElement(error);
        }
      } else if (this.notFoundHandler) {
        // Use not found handler
        content = await this.notFoundHandler();
      } else {
        // Create simple not found message
        content = document.createElement('div');
        content.className = 'py-16 text-center';
        content.innerHTML = '<h1 class="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">Page Not Found</h1><p class="text-lg text-gray-600 dark:text-gray-400">The requested page could not be found.</p>';
      }
    }
    
    // If content is a string, wrap in container
    if (typeof content === 'string') {
      const container = document.createElement('div');
      container.innerHTML = content;
      content = container;
    }
    
    if (content instanceof Element) {
      // Add transition classes
      content.classList.add('route-transition-in');
      this.root.appendChild(content);
      
      // Clean up transition classes
      setTimeout(() => {
        content.classList.remove('route-transition-in');
      }, 300);
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // Update document title if specified
      if (content.dataset.title) {
        document.title = content.dataset.title;
      }
      
      // Dispatch route change event
      window.dispatchEvent(new CustomEvent('routechange', { 
        detail: { path, previousPath: this.previousPath } 
      }));
    }
    
    this.root.classList.remove('route-transition-out');
    this.isTransitioning = false;
  }
  
  /**
   * Match a path against dynamic routes with parameters
   * @param {string} path - The current path to match
   * @returns {Object|null} - Match result with route and params
   */
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
  
  /**
   * Create an error element to display route rendering errors
   * @param {Error} error - The error that occurred
   * @returns {HTMLElement} - Error element
   */
  createErrorElement(error) {
    const container = document.createElement('div');
    container.className = 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 my-8';
    
    const title = document.createElement('h2');
    title.className = 'text-xl font-bold text-red-700 dark:text-red-300 mb-2';
    title.textContent = 'Error Loading Page';
    container.appendChild(title);
    
    const message = document.createElement('p');
    message.className = 'text-red-600 dark:text-red-400';
    message.textContent = error.message || 'An unknown error occurred';
    container.appendChild(message);
    
    if (error.stack && process.env.NODE_ENV === 'development') {
      const stack = document.createElement('pre');
      stack.className = 'mt-4 p-3 bg-red-100 dark:bg-red-800 rounded text-sm overflow-auto';
      stack.textContent = error.stack;
      container.appendChild(stack);
    }
    
    return container;
  }
  
  /**
   * Initialize the router
   */
  init() {
    this.handleRouteChange();
    return this;
  }
}
