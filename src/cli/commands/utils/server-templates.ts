/**
 * HTML templates and constants for the standalone server
 */

// Add proper type declarations for window properties
declare global {
  interface Window {
    __0x1_loadComponentStyles: (path: string) => Promise<void>;
    __0x1_hasHtmlStructure: (content: any) => boolean;
    __0x1_extractBodyContent: (htmlContent: any) => any;
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
  <link rel="stylesheet" href="/globals.css">
  <!-- Processed Tailwind CSS -->
  <link rel="stylesheet" href="/processed-tailwind.css">
  <!-- Tailwind CSS v4 runtime script (for dark mode) -->
  <script src="/tailwindcss"></script>`;

export const IMPORT_MAP = `
  <!-- Import map for module resolution -->
  <script type="importmap">
  {
    "imports": {
      "0x1": "/node_modules/0x1/index.js",
      "0x1/router": "/0x1/router.js",
      "0x1/": "/0x1/",
      "components/": "/components/",
      "app/": "/app/",
      "src/": "/src/",
      "react": "/__0x1_react_shim.js",
      "react/jsx-runtime": "/__0x1_jsx_runtime.js",
      "react/jsx-dev-runtime": "/__0x1_jsx_dev_runtime.js"
    }
  }
  </script>`;

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
      
      // Function to extract body content from HTML structure
      window.__0x1_extractBodyContent = function(htmlContent) {
        if (typeof htmlContent === 'string') {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          
          const bodyElement = tempDiv.querySelector('body');
          return bodyElement ? bodyElement.innerHTML : htmlContent;
        }
        
        // Handle React/JSX component structure
        if (htmlContent && typeof htmlContent === 'object' && htmlContent.props) {
          const bodyElement = htmlContent.props.children.find(child => 
            child && child.type === 'body'
          );
          
          return bodyElement ? bodyElement.props.children : htmlContent;
        }
        
        return htmlContent;
      };
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
  <script src="/__0x1_live_reload.js"></script>`;

export const APP_SCRIPT = `
  <!-- App initialization script -->
  <script type="module">
    console.log("[0x1 DEBUG] Framework initializing");
    console.log("[0x1 DEBUG] Auto-discovery enabled, loading components from app directory");

    // Import the router and required components
    import { createRouter } from "/0x1/router.js";
    
    console.log("[0x1 DEBUG] Router module loaded successfully");

    // Function to get app components with enhanced import resolution
    async function loadComponent(path) {
      try {
        // Normalize path to ensure proper loading
        const normalizedPath = path.startsWith("/") ? path : \`/\${path}\`;
        console.log(\`[0x1 DEBUG] Loading component: \${normalizedPath}\`);
        
        // Dynamically import the component module
        const module = await import(normalizedPath);
        
        // Load any associated CSS if present
        if (window.__0x1_loadComponentStyles) {
          window.__0x1_loadComponentStyles(normalizedPath);
        }
        
        return module;
      } catch (error) {
        console.error(\`[0x1 ERROR] Failed to load component \${path}: \${error.message}\`);
        return { 
          default: () => {
            const errorEl = document.createElement("div");
            errorEl.className = "error-container";
            errorEl.innerHTML = \`<h2>Error Loading Component</h2><p>\${path}</p><pre>\${error.message}</pre>\`;
            return errorEl;
          }
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
        // Load root components first to check their structure
        const pageModule = await loadComponent("/app/page.js");
        const layoutModule = await loadComponent("/app/layout.js");
        
        // Check if the layout is a Next.js 15-style layout
        const hasFullHtmlLayout = isNextJsLayout(layoutModule.default);
        
        if (hasFullHtmlLayout) {
          console.log("[0x1] Detected Next.js 15-style layout with full HTML structure");
        }
        
        // Create router instance with appropriate options
        const router = createRouter({
          rootElement: document.getElementById("app"),
          defaultRoute: "/",
          onNavigate: (path) => {
            console.log(\`[0x1 DEBUG] Navigating to: \${path}\`);
          },
          // Add layout as rootLayout if not a full HTML structure layout
          rootLayout: hasFullHtmlLayout ? null : layoutModule.default
        });
        
        // Register base route (with layout or standalone depending on structure)
        if (hasFullHtmlLayout) {
          // For Next.js 15-style layouts, we use a special wrapped layout
          router.addRoute("/", (props) => {
            // Call the page component first
            const pageContent = pageModule.default(props);
            
            // Then call the layout with children set to page content
            return layoutModule.default({ ...props, children: pageContent });
          });
        } else {
          // Standard approach with separate layout registration
          router.addRoute("/", pageModule.default, {
            layout: layoutModule.default
          });
        }
        
        // Handle navigation
        router.handleNavigation(window.location.pathname);
        
        // Initialize click handling for navigation
        document.addEventListener("click", (event) => {
          // Find closest anchor tag
          let anchor = event.target.closest("a");
          if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
            // Get the path without the origin
            const path = anchor.href.slice(window.location.origin.length);
            
            // Only handle internal links
            if (path && !path.startsWith("http")) {
              event.preventDefault();
              router.navigate(path);
            }
          }
        });
        
        console.log("[0x1 DEBUG] App initialization complete");
      } catch (error) {
        console.error("[0x1 ERROR] App initialization failed:", error);
        document.getElementById("app").innerHTML = \`
          <div class="error-container">
            <h1>Initialization Error</h1>
            <p>\${error.message}</p>
            <pre>\${error.stack}</pre>
          </div>
        \`;
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
  const hostName = '${host || "' + window.location.host + '"}'; 
  const wsUrl = \`\${wsProtocol}//\${hostName}/__0x1_ws\`;
  
  // Connect to WebSocket server
  function connect() {
    try {
      console.log('[0x1] Connecting to WebSocket server...');
      
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('[0x1] WebSocket connection established');
        clearReconnectTimer();
      };
      
      socket.onclose = () => {
        console.log('[0x1] WebSocket connection closed');
        socket = null;
        scheduleReconnect();
      };
      
      socket.onerror = (err) => {
        console.error('[0x1] Error establishing WebSocket connection:', err);
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

/**
 * Generates a simplified landing page for the root URL
 */
export function generateLandingPage(title: string = '0x1 Dev Server'): string { 
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!-- Multiple favicon format support -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/globals.css">
  <style>
    /* Base styling for 0x1 framework */
    * { box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      margin: 0; 
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      margin: 1rem 0;
      font-size: 1.25rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>0x1 Dev Server</h1>
    <p>Your development server is running successfully!</p>
    <p>Start building your app in the <code>app</code> directory.</p>
  </div>
  <script src="/__0x1_live_reload.js"></script>
</body>
</html>`;
}

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
    template += IMPORT_MAP;
  }
  
  template += BODY_START;
  
  if (bodyContent) {
    template += bodyContent;
  }
  
  if (includeAppScript) {
    template += APP_SCRIPT;
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
