/**
 * HTML templates and constants for the standalone server
 */

// Add proper type declarations for window properties
declare global {
  interface Window {
    __0x1_loadComponentStyles: (path: string) => Promise<void>;
    __0x1_hasHtmlStructure: (content: any) => boolean;
    process: { env: { NODE_ENV: string } };
    jsx: (type: any, props: any, key: any) => any;
    jsxs: (type: any, props: any, key: any) => any;
    jsxDEV: (type: any, props: any, key: any, isStatic: any, source: any, self: any) => any;
    jsxDEV_7x81h0kn: (type: any, props: any, key: any, isStatic: any, source: any, self: any) => any;
  }
}

// Define all HTML templates as properly escaped string literals to avoid TypeScript parsing issues
export const HTML_START = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" href="/favicon.png">`;

export const CSS_MODULE_HANDLER = `
  <!-- CSS Module Handling -->
  <script>
    window.__0x1_loadComponentStyles = async (path) => {
      try {
        // Check for .module.css alongside the component
        const cssPath = path.replace(/\\.js$/, ".module.css");
        const response = await fetch(cssPath);
        
        if (response.ok) {
          const cssContent = await response.text();
          const styleId = "style-" + path.replace(/[\\/\\.]/g, "-");
          
          // Create or update style element
          let styleEl = document.getElementById(styleId);
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
          }
          
          styleEl.textContent = cssContent;
          console.log("[0x1] Loaded CSS for " + path);
        }
      } catch (err) {
        // Silently fail if no CSS found
      }
    };
  </script>`;

export const PROCESS_POLYFILL = `
  <!-- Process polyfill for browser environment -->
  <script>
    window.process = window.process || {
      env: { NODE_ENV: 'development' }
    };
    console.log('[0x1] Running in development mode', window.location.hostname);
    
    // Apply dark mode based on user preference
    const darkModePreference = localStorage.getItem('0x1-dark-mode') || localStorage.getItem('darkMode');
    if (darkModePreference === 'dark' || darkModePreference === 'enabled' || 
        (!darkModePreference && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  </script>`;

export const STYLES = `
  <!-- Include global stylesheets -->
  <link rel="stylesheet" href="/app/globals.css">
  <!-- Processed Tailwind CSS -->
  <link rel="stylesheet" href="/processed-tailwind.css">
  <!-- Tailwind CSS v4 runtime script (for dark mode) -->
  <script src="/tailwindcss"></script>`;

export function getImportMap(): string {
  return `
  <!-- Import map for module resolution -->
  <script type="importmap">
  {
    "imports": {
      "0x1": "/node_modules/0x1/index.js?v=${Date.now()}",
      "0x1/router": "/0x1/router.js",
      "0x1/": "/0x1/",
      "components/": "/components/",
      "app/": "/app/",
      "src/": "/src/",
      "react": "/__0x1_react_shim.js",
      "react/jsx-runtime": "/0x1/jsx-runtime.js",
      "react/jsx-dev-runtime": "/__0x1_jsx_dev_runtime.js"
    }
  }
  </script>`;
}

export const BODY_START = `</head>
<body>
  <div id="app"></div>

  <!-- JSX runtime fix for boolean values and hashed functions -->
  <script>
    // Create special filter for boolean values in DOM content
    (function() {
      // Remove any "true" or "false" text nodes that represent boolean values
      function cleanBooleanTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          // Check if text node only contains "true" or "false"
          if (node.textContent === "true" || node.textContent === "false") {
            node.textContent = "";
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Process all child nodes recursively
          for (let i = 0; i < node.childNodes.length; i++) {
            cleanBooleanTextNodes(node.childNodes[i]);
          }
        }
      }

      // Apply to the entire body once DOM is ready
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              cleanBooleanTextNodes(node);
            });
          }
        });
      });

      // Start observing when ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      } else {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    })();
    
    // Handle Next.js 15-style layouts with full HTML structure
    (function() {
      // Function to check if a node has a full HTML structure
      window.__0x1_hasHtmlStructure = function(content) {
        if (typeof content === 'string') {
          return content.includes('<html') || 
                 content.includes('</html>') || 
                 (content.includes('<head') && content.includes('<body'));
        }
        
        // Check for React/JSX component structure
        if (content && typeof content === 'object') {
          // Check if type is html
          if (content.type === 'html') return true;
          
          // Check for children that might be head/body
          if (content.props && Array.isArray(content.props.children)) {
            return content.props.children.some(
              child => child && (child.type === 'head' || child.type === 'body')
            );
          }
        }
        
        return false;
      };
      
      // Removed global extractBodyContent function to prevent browser extension interference
      // Body content extraction will be handled inline in the app.js generation instead
    })();
    
    // Handle proxying of JSX functions with hash suffixes
    window = new Proxy(window, {
      get: function(target, prop) {
        // Check if this is a JSX function request (with hash)
        if (typeof prop === "string") {
          // Handle jsxDEV with hash
          if (prop.startsWith("jsxDEV_")) {
            return function(type, props, key, isStatic, source, self) {
              // Filter boolean values from children
              if (props && props.children) {
                if (Array.isArray(props.children)) {
                  props.children = props.children.filter(child => {
                    if (child === true || child === false) {
                      return false;
                    }
                    return true;
                  });
                  
                  // If array is empty after filtering, set to null
                  if (props.children.length === 0) {
                    props.children = null;
                  }
                } else if (props.children === true || props.children === false) {
                  props.children = null;
                }
              }
              return window.jsxDEV ? window.jsxDEV(type, props, key, isStatic, source, self) : 
                {type, props, key, __source: source, __self: self};
            };
          }
          // Handle jsx with hash
          else if (prop.startsWith("jsx_")) {
            return function(type, props, key) {
              // Filter boolean values from children
              if (props && props.children) {
                if (Array.isArray(props.children)) {
                  props.children = props.children.filter(child => 
                    !(child === true || child === false)
                  );
                  
                  // If array is empty after filtering, set to null
                  if (props.children.length === 0) {
                    props.children = null;
                  }
                } else if (props.children === true || props.children === false) {
                  props.children = null;
                }
              }
              return window.jsx ? window.jsx(type, props, key) : 
                {type, props, key};
            };
          }
          // Handle jsxs with hash
          else if (prop.startsWith("jsxs_")) {
            return function(type, props, key) {
              // Filter boolean values from children
              if (props && props.children) {
                if (Array.isArray(props.children)) {
                  props.children = props.children.filter(child => 
                    !(child === true || child === false)
                  );
                  
                  // If array is empty after filtering, set to null
                  if (props.children.length === 0) {
                    props.children = null;
                  }
                } else if (props.children === true || props.children === false) {
                  props.children = null;
                }
              }
              return window.jsxs ? window.jsxs(type, props, key) : 
                {type, props, key};
            };
          }
        }
        // Return the actual property for non-JSX properties
        return target[prop];
      }
    });

    // Also provide direct implementations for known hash values for backwards compatibility
    window.jsxDEV_7x81h0kn = function(type, props, key, isStatic, source, self) {
      // Filter boolean values from children
      if (props && props.children) {
        if (Array.isArray(props.children)) {
          props.children = props.children.filter(child => !(child === true || child === false));
          // If array is empty after filtering, set to null
          if (props.children.length === 0) {
            props.children = null;
          }
        } else if (props.children === true || props.children === false) {
          props.children = null;
        }
      }
      return window.jsxDEV ? window.jsxDEV(type, props, key, isStatic, source, self) : 
        {type, props, key, __source: source, __self: self};
    };
  </script>

  <!-- Live reload script - using standardized path to avoid duplication -->
  <script src="/__0x1_live_reload.js"></script>

  <!-- Error boundary script for elegant error handling -->
  <script src="/0x1-error-boundary.js"></script>`;

export const ERROR_BOUNDARY_SCRIPT = `
  <!-- Error boundary script for elegant error handling -->
  <script src="/0x1-error-boundary.js"></script>
`;

export const APP_SCRIPT = `
  <!-- App initialization script -->
  <script type="module">
    // Debug mode detection
    const debugMode = new URLSearchParams(window.location.search).has('debug');
    if (debugMode) {
      console.log('[0x1 DEBUG] Framework initializing');
      console.log('[0x1 DEBUG] Auto-discovery enabled, loading components from app directory');
    }
    
    // Initialize the framework's hook system directly in the browser
    // This ensures we use a consolidated hook system
    
    // Setup enhanced global hook tracking - integrate with framework
    window.__0x1_hooks = window.__0x1_hooks || {
      // Core hook state tracking - use framework structure
      componentRegistry: new Map(),
      updateQueue: new Set(),
      componentContextStack: [],
      currentComponentId: null,
      currentHookIndex: 0,
      isRenderingComponent: false,
      componentUpdateCallbacks: new Map(),
      
      // Initialization flag
      isInitialized: true
    };
    
    // Create a useState implementation that integrates with the framework hook system
    window.__0x1_useState = function(initialValue) {
      const hooks = window.__0x1_hooks;
      if (!hooks.currentComponentId) {
        throw new Error('[0x1 Hooks] Hook called outside of component context');
      }
      
      // Get current component data
      if (!hooks.componentRegistry.has(hooks.currentComponentId)) {
        hooks.componentRegistry.set(hooks.currentComponentId, {
          states: [],
          effects: [],
          memos: [],
          callbacks: [],
          refs: [],
          hookIndex: 0,
          isMounted: false
        });
      }
      const componentData = hooks.componentRegistry.get(hooks.currentComponentId);
      const hookIndex = hooks.currentHookIndex++;
      
      // Initialize state if needed
      if (componentData.states.length <= hookIndex) {
        const value = typeof initialValue === 'function' ? initialValue() : initialValue;
        componentData.states[hookIndex] = value;
      }
      
      const state = componentData.states[hookIndex];
      
      const setState = (newValue) => {
        const currentValue = componentData.states[hookIndex];
        const nextValue = typeof newValue === 'function' ? newValue(currentValue) : newValue;
        
        // Only update if value actually changed
        if (!Object.is(currentValue, nextValue)) {
          componentData.states[hookIndex] = nextValue;
          
          // Trigger component update using framework approach
          const updateCallback = hooks.componentUpdateCallbacks.get(hooks.currentComponentId);
          if (updateCallback) {
            updateCallback();
          } else {
            console.warn('[0x1 Hooks] No update callback found for component:', hooks.currentComponentId);
          }
        }
      };
      
      return [state, setState];
    };
    
    // Framework-compatible hook context management with better error handling
    window.__0x1_enterComponentContext = function(componentId, updateCallback) {
      const hooks = window.__0x1_hooks;
      
      // Validate componentId
      if (!componentId) {
        console.warn('[0x1 Hooks] Attempting to enter context with invalid componentId:', componentId);
        return;
      }
      
      // Save previous context to stack if exists
      if (hooks.currentComponentId) {
        hooks.componentContextStack.push({
          id: hooks.currentComponentId,
          hookIndex: hooks.currentHookIndex
        });
      }
      
      // Set new context
      hooks.currentComponentId = componentId;
      hooks.currentHookIndex = 0;
      hooks.isRenderingComponent = true;
      
      // Initialize component data if it doesn't exist
      if (!hooks.componentRegistry.has(componentId)) {
        hooks.componentRegistry.set(componentId, {
          states: [],
          effects: [],
          memos: [],
          callbacks: [],
          refs: [],
          hookIndex: 0,
          isMounted: false
        });
      }
      
      // Store update callback for this component
      if (updateCallback && typeof updateCallback === 'function') {
        hooks.componentUpdateCallbacks.set(componentId, updateCallback);
      } else if (componentId !== 'global' && componentId !== 'null' && componentId !== 'undefined') {
        // Only warn for real component IDs, not system calls
        console.warn('[0x1 Hooks] No update callback provided for component:', componentId);
      }
      
      const componentData = hooks.componentRegistry.get(componentId);
      componentData.isMounted = true;
      componentData.hookIndex = 0;
    };
    
    window.__0x1_exitComponentContext = function() {
      const hooks = window.__0x1_hooks;
      
      // Pop previous context from stack if available
      const previousContext = hooks.componentContextStack.pop();
      if (previousContext) {
        hooks.currentComponentId = previousContext.id;
        hooks.currentHookIndex = previousContext.hookIndex;
        hooks.isRenderingComponent = hooks.componentContextStack.length > 0;
      } else {
        // No previous context, clear everything
        hooks.currentComponentId = null;
        hooks.currentHookIndex = 0;
        hooks.isRenderingComponent = false;
      }
    };
    
    // Make sure React hooks are properly bound to our hook system
    window.React = window.React || {};
    window.React.useState = window.__0x1_useState;
    
    // Simplified update system that matches the framework
    window.__0x1_triggerUpdate = (componentId) => {
      // Global update - refresh the page
      if (componentId === 'global') {
        if (window.location && window.location.reload) {
          window.location.reload();
          return true;
        }
        return false;
      }
      
      // Get update callback from hook system
      const hooks = window.__0x1_hooks;
      if (componentId && hooks.componentUpdateCallbacks.has(componentId)) {
        try {
          const updateFn = hooks.componentUpdateCallbacks.get(componentId);
          updateFn();
          return true;
        } catch (error) {
          console.error('[0x1] Error updating component ' + componentId + ':', error);
          return false;
        }
      }
      
      // Fall back to router update if available
      if (window.__0x1_router && typeof window.__0x1_router.renderCurrentRoute === 'function') {
        try {
          window.__0x1_router.renderCurrentRoute();
          return true;
        } catch (e) {
          console.error('[0x1] Error updating via router:', e);
        }
      }
      
      // Log the issue but don't crash
      console.warn('[0x1] State update requested for component ' + componentId + ' but no update callback found');
      return false;
    };
    
    // Function to load a component with proper error handling
    async function loadComponent(path) {
      if (debugMode) {
        console.log('[0x1 DEBUG] Loading component:', path);
      }
      
      try {
        // Dynamic import with proper error handling
        const module = await import(path);
        return module;
      } catch (error) {
        console.error('[0x1 ERROR] Failed to load component:', path, error.message);
        
        // Add to error boundary if available
        if (window.__0x1_errorBoundary) {
          window.__0x1_errorBoundary.addError(error, path);
        }
        
        return { 
          default: () => {
            return { 
              type: 'div', 
              props: { className: 'error-container' },
              children: [
                { type: 'h2', props: { className: 'error-title' }, children: ['Error loading component'] },
                { type: 'p', props: { className: 'error-message' }, children: [error.message] }
              ]
            };
          }
        };
      }
    }
    
    // Import the router and required components
    // Use dynamic import for better compatibility
    let Router, createRouter;
    try {
      const routerModule = await import('/0x1/router.js');
      console.log('[0x1] Router module imports:', Object.keys(routerModule));
      
      // Check if the global Router is available (from window.Router)
      if (window.Router) {
        Router = window.Router;
        console.log('[0x1] Using globally defined Router');
      } else {
        // Get the Router class from the module
        Router = routerModule.Router;
      }
      
      // Get or create the router function
      createRouter = routerModule.createRouter || function(options) {
        console.log('[0x1] Using fallback router creation');
        // Ensure Router is actually a constructor
        if (typeof Router === 'function') {
          return new Router(options);
        } else {
          console.error('[0x1] Router is not a constructor:', Router);
          throw new Error('Router is not properly defined');
        }
      };
    } catch (e) {
      console.error('[0x1] Error importing router:', e);
      // Don't use emergency fallback - show the actual error
      throw new Error('Failed to load router module: ' + e.message);
    }
    
    console.log("[0x1 DEBUG] Router module loaded successfully");

    // Fixed implementation to patch the router's path-to-regexp handling
    // This prevents the "Invalid path provided to pathToRegExp: undefined" error
    function patchRouter(router) {
      if (!router) return router;
      
      // Add missing methods if not present
      if (!router.pathToRegExp && typeof router.addRoute === 'function') {
        router.pathToRegExp = function(path) {
          if (path === undefined || path === null) {
            console.warn('[0x1 Router] Path is undefined, using "/" as fallback');
            path = '/'; // Default to root route
          }
          // Simple regexp conversion for string paths
          let pattern = path;
          
          // Replace :param patterns with capture groups
          const paramRegex = new RegExp('/:([a-zA-Z0-9_]+)', 'g');
          pattern = pattern.replace(paramRegex, '/([^/]+)');
          
          // Replace * with wildcard
          pattern = pattern.replace(/\\*/g, '.*');

          return new RegExp('^' + pattern + '$');
        };

        // Patch the original addRoute method to handle undefined paths
        const originalAddRoute = router.addRoute;
        router.addRoute = function(path, component, options = {}) {
          if (path === undefined || path === null) {
            console.warn('[0x1 Router] Path is undefined, using "/" as fallback');
            path = '/'; // Default to root route
          }
          
          // Call original method with validated path
          return originalAddRoute.call(this, path, component, options);
        };
      }
      
      // Ensure navigate method can handle any path
      if (typeof router.navigate === 'function') {
        const originalNavigate = router.navigate;
        router.navigate = function(path, pushState = true) {
          if (path === undefined || path === null) {
            console.warn('[0x1 Router] Navigate path is undefined, using "/" as fallback');
            path = '/'; // Default to root route
          }
          return originalNavigate.call(this, path, pushState);
        };
      }
      
      return router;
    }

    // Helper function to load a component module with error handling
    async function loadComponent(path) {
      console.log('[0x1 DEBUG] Loading component:', path);
      
      // Normalize path for dynamic import
      const normalizedPath = path.startsWith('/') ? path : '/' + path;
      
      try {
        // Try to preload the error boundary for use in case of failures
        let ErrorBoundaryManager = null;
        try {
          ErrorBoundaryManager = await import('/0x1/error-boundary.js')
            .then(m => m.default || m.ErrorManager)
            .catch(() => null);
          
          if (ErrorBoundaryManager) {
            console.log('[0x1] Error boundary module loaded and ready');
          }
        } catch (e) {
          console.warn('[0x1] Error loading error boundary (non-critical):', e);
        }
        
        // Check if the component exists with a HEAD request first
        const exists = await fetch(normalizedPath, { method: 'HEAD' })
          .then(res => res.ok)
          .catch(() => false);
        
        if (!exists) {
          throw new Error("Component not found at path: " + normalizedPath);
        }
        
        // Dynamically import the component module
        const module = await import(normalizedPath);
        
        // Load any associated CSS if present
        if (window.__0x1_loadComponentStyles) {
          window.__0x1_loadComponentStyles(normalizedPath);
        }
        
        return module;
      } catch (error) {
        console.error("[0x1 ERROR] Failed to load component " + path + ": " + error.message);
        
        // Try to use the error boundary if available
        try {
          // Try to load the error boundary dynamically if not already loaded
          const ErrorBoundaryManager = await import('/0x1/error-boundary.js')
            .then(m => m.default || m.ErrorManager)
            .catch(() => null);
          
          if (ErrorBoundaryManager && typeof ErrorBoundaryManager.getInstance === 'function') {
            const manager = ErrorBoundaryManager.getInstance();
            
            if (typeof manager.createBoundary === 'function') {
              console.log('[0x1] Using error boundary to display component error');
              return {
                default: () => {
                  // Use the error boundary to render the error
                  const BoundaryComponent = manager.createBoundary({
                    error: error,
                    componentPath: path
                  });
                  
                  if (BoundaryComponent) {
                    return BoundaryComponent;
                  }
                  
                  // Fallback if boundary component creation failed
                  throw error;
                }
              };
            }
          }
        } catch (e) {
          console.warn('[0x1] Error using error boundary:', e);
        }
        
        // Clear and direct error display using Tailwind CSS v4 styling
        return { 
          default: () => ({
            type: 'div',
            props: {
              className: 'error-container p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-600 rounded-lg mt-4 mx-auto max-w-3xl shadow-md',
              children: [
                {
                  type: 'h2',
                  props: {
                    className: 'text-xl font-bold text-red-700 dark:text-red-400 mb-2',
                    children: '0x1 Component Error'
                  }
                },
                {
                  type: 'div',
                  props: {
                    className: 'mb-3 flex items-center',
                    children: [
                      {
                        type: 'span',
                        props: {
                          className: 'inline-block mr-2 bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-300 px-2 py-1 text-xs font-mono rounded',
                          children: '404'
                        }
                      },
                      {
                        type: 'span',
                        props: {
                          className: 'font-mono text-gray-700 dark:text-gray-300',
                          children: path
                        }
                      }
                    ]
                  }
                },
                {
                  type: 'pre',
                  props: {
                    className: 'p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-auto border border-gray-200 dark:border-gray-700',
                    children: error.message || 'Unknown error'
                  }
                },
                {
                  type: 'div',
                  props: {
                    className: 'mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400',
                    children: [
                      {
                        type: 'p',
                        props: {
                          className: 'text-sm font-medium text-yellow-800 dark:text-yellow-300',
                          children: 'Required Action:'
                        }
                      },
                      {
                        type: 'p',
                        props: {
                          className: 'text-sm text-gray-700 dark:text-gray-300 mt-1',
                          children: 'Create the missing component file at the specified path.'
                        }
                      }
                    ]
                  }
                }
              ]
            }
          })
        };
      }
    }
    
    // Helper to check if an element is a Next.js 15-style layout
    function isNextJsLayout(component) {
      // Check if it's a function that returns a full HTML structure
      if (typeof component !== 'function') return false;
      
      try {
        // Try calling with empty props to see the result structure
        const result = component({});
        
        // Use the global HTML structure checker if available
        if (window.__0x1_hasHtmlStructure) {
          return window.__0x1_hasHtmlStructure(result);
        }
        
        // Fallback check
        if (result && typeof result === 'object') {
          return result.type === 'html' || 
                 (result.props && Array.isArray(result.props.children) && 
                  result.props.children.some(child => 
                    child && (child.type === 'head' || child.type === 'body')
                  ));
        }
      } catch (e) {
        console.warn("[0x1] Error checking component structure:", e);
      }
      
      return false;
    }

    // Main initialization function
    async function initializeApp() {
      try {
        // Check if we're looking at a static landing page
        // If the document has no #app element, we're on the static landing page
        // and should avoid router initialization
        const appContainer = document.getElementById('app');
        if (!appContainer) {
          console.log('[0x1] Static landing page detected, skipping router initialization');
          return;
        }
        
        console.log('[0x1] Initializing app with Router:', typeof Router);
        console.log('[0x1] createRouter function available:', typeof createRouter);
        
        if (typeof Router !== 'function') {
          console.error('[0x1] Router is not a constructor');
          throw new Error('Router module failed to load properly - Router is not a function');
        }
        
        // Try to load root components - but provide fallbacks if they don't exist
        let pageModule, layoutModule;
        let componentsExist = false;
        
        try {
          pageModule = await loadComponent("/app/page.js");
          layoutModule = await loadComponent("/app/layout.js");
          
          // Check if any of the actual component modules were loaded
          if (pageModule?.default && typeof pageModule.default === 'function') {
            componentsExist = true;
            console.log('[0x1] Page component loaded successfully:', typeof pageModule.default);
          }
          
          if (layoutModule?.default && typeof layoutModule.default === 'function') {
            console.log('[0x1] Layout component loaded successfully:', typeof layoutModule.default);
          }
        } catch (e) {
          console.warn('[0x1] Could not load app components:', e);
        }
        
        // If there are no components and we're on the landing page, don't initialize the router
        if (!componentsExist && document.title === '0x1 Dev Server') {
          console.log('[0x1] No components found and landing page detected, skipping router initialization');
          return;
        }
        
        // Create router instance with enhanced options
        const router = createRouter({
          rootElement: appContainer,
          mode: 'history',
          debug: debugMode
        });
        
        // Apply patches to router to fix path handling
        const patchedRouter = patchRouter(router);
        
        // Add home route - use fallback if needed
        if (componentsExist) {
          console.log('[0x1] Using app components for rendering');
          
          // First check if we have a working component
          const PageComponent = pageModule?.default;
          const LayoutComponent = layoutModule?.default;
          
          // Add the route with proper error handling
          try {
            patchedRouter.addRoute('/', PageComponent, { 
              layout: LayoutComponent,
              name: 'home'
            });
            console.log('[0x1] Home route added successfully');
          } catch (routeError) {
            console.error('[0x1] Error adding home route:', routeError);
            // Add a fallback route
            patchedRouter.addRoute('/', () => ({
              type: 'div',
              props: {
                className: 'p-4',
                children: 'Page component failed to load properly'
              }
            }));
          }
        } else {
          console.log('[0x1] Using placeholder component');
          // Just add a minimal placeholder component since real routing isn't needed
          patchedRouter.addRoute('/', () => ({ 
            type: 'div',
            props: {
              className: 'p-4 m-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800',
              children: [
                {
                  type: 'h2',
                  props: {
                    className: 'text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2',
                    children: 'Missing Components'
                  }
                },
                {
                  type: 'p',
                  props: {
                    className: 'text-yellow-700 dark:text-yellow-300',
                    children: 'Create app/page.tsx and app/layout.tsx to get started.'
                  }
                }
              ]
            }
          }));
        }
        
        // Initialize the router first
        if (typeof patchedRouter.init === 'function') {
          patchedRouter.init();
          console.log('[0x1] Router initialized successfully');
        } else {
          console.warn('[0x1] Router init method not available');
        }
        
        // Handle initial navigation
        if (typeof patchedRouter.navigate === 'function') {
          patchedRouter.navigate(window.location.pathname || '/', false);
          console.log('[0x1] Router navigated to:', window.location.pathname || '/');
        } else {
          console.warn('[0x1] Router navigate method not available');
        }
        
        // Make router globally available for debugging
        window.__0x1_router = patchedRouter;
        
        console.log("[0x1 DEBUG] App initialization complete");
      } catch (error) {
        console.error("[0x1 ERROR] App initialization failed:", error);
        const errorMsg = error.message || 'Unknown error';
        const errorStack = error.stack || '';
        
        // Create a useful error display
        if (document.getElementById("app")) {
          document.getElementById("app").innerHTML = 
            '<div class="error-container p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-lg mt-4 mx-auto max-w-3xl shadow-md">' +
            '<h1 class="text-xl font-bold text-red-700 mb-2">Initialization Error</h1>' +
            '<p class="mb-2">' + errorMsg + '</p>' +
            '<pre class="p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm overflow-auto border border-gray-400">' + errorStack + '</pre>' +
            '</div>';
        }
      }
    }
    
    // Start the app
    initializeApp();
  </script>`;

export const BODY_END = `
</body>
</html>`;

/**
 * Generate the live reload script
 * @param host Optional host for WebSocket connection
 */
export function generateLiveReloadScript(host?: string): string {
  return `/**
 * 0x1 Framework Live Reload
 * This script enables automatic page reloading during development
 */
(function() {
  console.log('[0x1] Live reload script loaded');
  
  let socket = null;
  let reconnectTimer = null;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use provided host if available, otherwise fallback to window.location.host
  const hostName = ${host ? `'${host}'` : 'window.location.host'}; 
  const wsUrl = wsProtocol + '//' + hostName + '/__0x1_ws';
  
  // Connect to WebSocket server
  function connect() {
    try {
      console.log('[0x1] Connecting to WebSocket server at:', wsUrl);
      
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('[0x1] Live reload connected');
        clearReconnectTimer();
      };
      
      socket.onclose = () => {
        console.log('[0x1] Live reload disconnected');
        socket = null;
        scheduleReconnect();
      };
      
      socket.onerror = (err) => {
        console.error('[0x1] Live reload error:', err);
        socket = null;
        scheduleReconnect();
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[0x1] Received message:', data);
          
          if (data.type === 'reload') {
            console.log('[0x1] Reloading page...');
            window.location.reload();
          } 
          else if (data.type === 'css') {
            console.log('[0x1] Updating CSS without reload');
            updateCSS();
          }
          else if (data.type === 'pong') {
            // Silently acknowledge pong to keep connection alive
          }
        } catch (err) {
          console.error('[0x1] Error parsing message:', err);
        }
      };
    } catch (err) {
      console.error('[0x1] Error establishing WebSocket connection:', err);
      scheduleReconnect();
    }
  }
  
  // Update CSS without full page reload
  function updateCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    
    if (links.length > 0) {
      links.forEach(link => {
        // Add cache busting parameter
        const href = link.href.replace(/[?&]_reload=\\d+/, '');
        link.href = href + (href.includes('?') ? '&' : '?') + '_reload=' + Date.now();
      });
      console.log('[0x1] Updated', links.length, 'CSS stylesheets');
    } else {
      // If no stylesheet links found, just reload the page
      console.log('[0x1] No CSS links found, performing full reload');
      window.location.reload();
    }
  }
  
  // Schedule reconnection
  function scheduleReconnect() {
    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
      console.log('[0x1] Attempting to reconnect...');
      connect();
    }, 2000);
  }
  
  // Clear reconnection timer
  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }
  
  // Start connection
  connect();
  
  // Ping the server periodically to keep the connection alive
  setInterval(() => {
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, 30000);
})();`;
}

// Landing page implementation moved to standalone-server.ts

/**
 * Compose a complete HTML template from sections
 */
export function composeHtmlTemplate(options: {
  title?: string;
  includeImportMap?: boolean;
  includeAppScript?: boolean;
  bodyContent?: string;
} = {}): string {
  const {
    title = '0x1 App',
    includeImportMap = true,
    includeAppScript = true,
    bodyContent = ''
  } = options;
  
  // Compose the HTML template
  let template = HTML_START.replace('0x1 App', title);
  template += CSS_MODULE_HANDLER;
  template += PROCESS_POLYFILL;
  template += STYLES;
  
  if (includeImportMap) {
    template += getImportMap();
  }
  
  template += BODY_START;
  
  if (bodyContent) {
    template += bodyContent;
  }
  
  if (includeAppScript) {
    // Use external app.js instead of inline script for better caching and debugging
    template += `<script src="/app.js?t=${Date.now()}&r=${Math.random()}" type="module"></script>`;
  }
  
  template += BODY_END;
  
  return template;
}

/**
 * Function to load component from given path
 * Used by the client-side APP_SCRIPT
 */
export function loadComponent(path: string): Promise<any> {
  // This is just a type definition for the client-side function
  // The actual implementation is in the APP_SCRIPT
  return Promise.resolve({});
}

/**
 * Generate a page with clear error message when app components are missing
 */
export function generateLandingPage(): string {
  return composeHtmlTemplate({
    title: '0x1 Framework - Missing App Components',
    includeImportMap: false,
    includeAppScript: false,
    bodyContent: `
      <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div class="w-full max-w-3xl p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-red-500">
          <h1 class="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Missing App Components</h1>
          <p class="text-gray-700 dark:text-gray-300 mb-6">0x1 couldn't find the required app components.</p>
          
          <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <p class="font-mono text-sm mb-2">To get started, create the following files:</p>
            <ul class="list-disc list-inside font-mono text-sm space-y-2 text-gray-800 dark:text-gray-200">
              <li>app/layout.js or app/layout.tsx</li>
              <li>app/page.js or app/page.tsx</li>
            </ul>
          </div>
          
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p>Once you've created these files, the server will automatically detect and use them.</p>
          </div>
        </div>
      </div>
    `
  });
}

export const JSX_RUNTIME_SCRIPT = `
// 0x1 Framework JSX Runtime
(function() {
  'use strict';
  
  function jsx(type, props, key) {
    if (typeof type === 'string') {
      const element = document.createElement(type);
      
      if (props) {
        Object.keys(props).forEach(prop => {
          if (prop === 'children') {
            const children = Array.isArray(props.children) ? props.children : [props.children];
            children.forEach(child => {
              if (child != null) {
                if (typeof child === 'string' || typeof child === 'number') {
                  element.appendChild(document.createTextNode(String(child)));
                } else if (child instanceof Node) {
                  element.appendChild(child);
                }
              }
            });
          } else if (prop.startsWith('on') && typeof props[prop] === 'function') {
            const eventName = prop.slice(2).toLowerCase();
            element.addEventListener(eventName, props[prop]);
          } else if (prop === 'className') {
            element.className = props[prop];
          } else if (prop === 'style' && typeof props[prop] === 'object') {
            Object.assign(element.style, props[prop]);
          } else if (prop !== 'key') {
            element.setAttribute(prop, props[prop]);
          }
        });
      }
      
      return element;
    }
    
    if (typeof type === 'function') {
      return type(props || {});
    }
    
    return null;
  }
  
  // Export to global scope
  window.jsx = jsx;
  window.jsxs = jsx;
  window.Fragment = 'fragment';
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { jsx, jsxs: jsx, Fragment: 'fragment' };
  }
})();
`;
