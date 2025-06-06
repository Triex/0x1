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
  <title>0x1 App</title>`;
  
// Favicon links will be added dynamically

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

export function getImportMap(projectPath: string): string {
  const dynamicImportMap = generateDynamicImportMap(projectPath);

  return `
  <!-- Import map for module resolution -->
  <script type="importmap">
  {
    "imports": ${JSON.stringify(dynamicImportMap, null, 2)}
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
    
    // Handle Next15-style layouts with full HTML structure
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

  <!-- Error boundary script for elegant error handling -->
  <script src="/0x1-error-boundary.js?v=${Date.now()}&enhanced=true"></script>`;

export const ERROR_BOUNDARY_SCRIPT = `
  <!-- Error boundary script for elegant error handling -->
  <script src="/0x1-error-boundary.js?v=${Date.now()}&enhanced=true"></script>
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
    
    // CRITICAL FIX: Delegate all hook management to the main hooks.ts system
    // This prevents conflicts and ensures single source of truth
    console.log('[0x1 App] Delegating to main hooks.ts - no duplicate initialization');
    
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

/**
 * Compose a complete HTML template from sections
 */
export function composeHtmlTemplate(options: {
  title?: string;
  includeImportMap?: boolean;
  includeAppScript?: boolean;
  bodyContent?: string;
  importMap?: Record<string, string>;
  projectPath?: string;
  detectedFavicon?: { path: string; format: string; location: string } | null;
} = {}): string {
  const {
    title = "0x1 App",
    includeImportMap = true,
    includeAppScript = true,
    bodyContent = "",
    importMap = {},
    projectPath = process.cwd(),
    detectedFavicon = null,
  } = options;

  let template = HTML_START.replace("<title>0x1 App</title>", `<title>${title}</title>`);

  // Add favicon links dynamically based on detection
  if (detectedFavicon) {
    const { format } = detectedFavicon;
    
    // Add the detected favicon
    if (format === 'ico') {
      template += `\n  <link rel="icon" href="/favicon.ico">`;
    } else if (format === 'svg') {
      template += `\n  <link rel="icon" type="image/svg+xml" href="/favicon.svg">`;
    } else if (format === 'png') {
      template += `\n  <link rel="icon" type="image/png" href="/favicon.png">`;
    } else if (format === 'jpg' || format === 'jpeg') {
      template += `\n  <link rel="icon" type="image/jpeg" href="/favicon.${format}">`;
    } else if (format === 'gif') {
      template += `\n  <link rel="icon" type="image/gif" href="/favicon.gif">`;
    }
    
    // Also add a generic fallback for .ico if the detected format isn't .ico
    if (format !== 'ico') {
      template += `\n  <link rel="icon" href="/favicon.ico">`;
    }
  } else {
    // No favicon detected - add fallback links that may work
    template += `\n  <link rel="icon" href="/favicon.ico">`;
    template += `\n  <link rel="icon" type="image/svg+xml" href="/favicon.svg">`;
    template += `\n  <link rel="icon" type="image/png" href="/favicon.png">`;
  }

  // Add CSS module handler
  template += CSS_MODULE_HANDLER;

  // Add process polyfill
  template += PROCESS_POLYFILL;

  // Add global styles
  template += STYLES;

  // Add import map with npm module support
  if (includeImportMap) {
    // Generate dynamic import map based on actual node_modules
    const dynamicImportMap = generateDynamicImportMap(projectPath);

    // Merge with provided import map (allowing overrides)
    const mergedImportMap = { ...dynamicImportMap, ...importMap };

    template += `
  <!-- Import map for module resolution with npm packages -->
  <script type="importmap">
  {
    "imports": ${JSON.stringify(mergedImportMap, null, 2)}
  }
  </script>`;
  }

  // Add body start
  template += BODY_START;

  // Add error boundary script first (important for early error handling)
  template += `
  <script src="/0x1-error-boundary.js?v=${Date.now()}&enhanced=true"></script>`;

  // JSX Runtime is now injected by injectJsxRuntime() function - DO NOT DUPLICATE HERE

  // Add main app script
  if (includeAppScript) {
    template += `
  <!-- App script -->
  <script type="module" src="/app.js?t=${Date.now()}&r=${Math.random()}"></script>`;
  }

  // Add live reload script for development
  template += `
  <!-- Development live reload -->
  <script src="/__0x1_live_reload.js"></script>`;

  // Add body content if provided
  if (bodyContent) {
    template += bodyContent;
  }

  // Close body and html
  template += `
</body>
</html>`;

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
export function generateLandingPage(projectPath: string = process.cwd()): string {
  return composeHtmlTemplate({
    title: '0x1 Framework - Missing App Components',
    includeImportMap: false,
    includeAppScript: false,
    projectPath: projectPath,
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

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Cache for dynamic import maps
const importMapCache = new Map<string, { map: Record<string, string>, timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Dynamically generate import map by scanning node_modules (with caching)
 */
function generateDynamicImportMap(projectPath: string): Record<string, string> {
  const nodeModulesPath = join(projectPath, 'node_modules');
  const cacheKey = projectPath;
  const now = Date.now();
  
  // Check cache first
  const cached = importMapCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.map;
  }
  
  const importMap: Record<string, string> = {
    // Framework essentials (always needed)
    "0x1": `/node_modules/0x1/index.js?v=${Date.now()}`,
    "0x1/router": "/0x1/router.js",
    "0x1/link": "/0x1/link",
    "0x1/": "/0x1/",
    
    // Project structure mappings (Next.js style)
    "components/": "/components/",
    "app/": "/app/",
    "lib/": "/lib/",
    "src/": "/src/",
    "utils/": "/utils/",
    "styles/": "/styles/",
    "@/": "/", // Common Next.js alias pointing to root
    "@/components/": "/components/",
    "@/lib/": "/lib/",
    "@/utils/": "/utils/",
    "@/app/": "/app/",
    
    // Node.js polyfills for browser environment
    "process/browser.js": "/node_modules/process/browser.js",
    "process": "/node_modules/process/browser.js",
    "buffer": "/node_modules/buffer/index.js",
    "browser.js": "/node_modules/process/browser.js",
    "browser": "/node_modules/process/browser.js",
    "/browser.js": "/node_modules/process/browser.js",
    "node_modules/process/browser.js": "/node_modules/process/browser.js",
    "util": "/node_modules/util/util.js",
    "stream": "/node_modules/stream-browserify/index.js",
    "events": "/node_modules/events/events.js",
    "path": "/node_modules/path-browserify/index.js",
    "crypto": "/node_modules/crypto-browserify/index.js",
    "fs": "/node_modules/browserify-fs/index.js",
    "os": "/node_modules/os-browserify/browser.js",
    "assert": "/node_modules/assert/assert.js",
    "constants": "/node_modules/constants-browserify/constants.json",
    "domain": "/node_modules/domain-browser/index.js",
    "http": "/node_modules/stream-http/index.js",
    "https": "/node_modules/https-browserify/index.js",
    "net": "/node_modules/net-browserify/index.js",
    "punycode": "/node_modules/punycode/punycode.js",
    "querystring": "/node_modules/querystring-es3/index.js",
    "string_decoder": "/node_modules/string_decoder/lib/string_decoder.js",
    "sys": "/node_modules/util/util.js",
    "timers": "/node_modules/timers-browserify/main.js",
    "tty": "/node_modules/tty-browserify/index.js",
    "url": "/node_modules/url/url.js",
    "vm": "/node_modules/vm-browserify/index.js",
    "zlib": "/node_modules/browserify-zlib/lib/index.js",
  };

  if (!existsSync(nodeModulesPath)) {
    console.warn('[0x1] No node_modules found, using minimal import map');
    // Cache the minimal map too
    importMapCache.set(cacheKey, { map: importMap, timestamp: now });
    return importMap;
  }

  try {
    // Scan for packages and auto-generate mappings
    const packages = readdirSync(nodeModulesPath);
    
    for (const packageName of packages) {
      if (packageName.startsWith('.')) continue;
      
      const packagePath = join(nodeModulesPath, packageName);
      if (!statSync(packagePath).isDirectory()) continue;
      
      // Handle scoped packages (e.g., @react-spring/core)
      if (packageName.startsWith('@')) {
        const scopedPackages = readdirSync(packagePath);
        for (const scopedName of scopedPackages) {
          const fullName = `${packageName}/${scopedName}`;
          const fullPath = join(packagePath, scopedName);
          addPackageToImportMap(importMap, fullName, fullPath);
        }
      } else {
        addPackageToImportMap(importMap, packageName, packagePath);
      }
    }
    
    // Cache the result
    importMapCache.set(cacheKey, { map: importMap, timestamp: now });
    
    console.log(`[0x1] Generated dynamic import map with ${Object.keys(importMap).length} entries`);
    return importMap;
    
  } catch (error) {
    console.error('[0x1] Error generating dynamic import map:', error);
    // Cache the minimal map on error
    importMapCache.set(cacheKey, { map: importMap, timestamp: now });
    return importMap;
  }
}

/**
 * Add a package to the import map by analyzing its structure
 */
function addPackageToImportMap(importMap: Record<string, string>, packageName: string, packagePath: string) {
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      // No package.json, skip this package
      return;
    }
    
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // Determine the best entry point based on package.json
    const entryPoint = findBestEntryPoint(packageJson, packagePath);
    
    if (entryPoint) {
      // Main package export
      importMap[packageName] = `/node_modules/${packageName}/${entryPoint}`;
      
      // Add directory mapping for deep imports
      importMap[`${packageName}/`] = `/node_modules/${packageName}/`;
      
      // Add common sub-exports based on package structure
      addCommonSubExports(importMap, packageName, packagePath, packageJson);
    }
    
  } catch (error) {
    // If we can't parse the package, skip it silently
    console.debug(`[0x1] Could not process package ${packageName}:`, error);
  }
}

/**
 * Find the best entry point for a package
 */
function findBestEntryPoint(packageJson: any, packagePath: string): string | null {
  // Priority order for entry points
  const candidates = [
    // Modern ES modules
    packageJson.module,
    packageJson.exports?.['.']?.import,
    packageJson.exports?.['.']?.module,
    packageJson.exports?.['.']?.default,
    
    // Legacy formats
    packageJson.main,
    packageJson.browser,
    
    // Common defaults
    'index.js',
    'dist/index.js',
    'lib/index.js',
    'build/index.js',
    '_esm/index.js',
    'dist/esm/index.js',
    'esm/index.js'
  ];
  
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    
    try {
      const candidatePath = join(packagePath, candidate);
      if (existsSync(candidatePath)) {
        return candidate;
      }
    } catch (error) {
      // Skip invalid paths
      continue;
    }
  }
  
  return null;
}

/**
 * Add common sub-exports for a package based on its structure
 */
function addCommonSubExports(importMap: Record<string, string>, packageName: string, packagePath: string, packageJson: any) {
  // Handle package.json exports field
  if (packageJson.exports && typeof packageJson.exports === 'object') {
    for (const [exportPath, exportValue] of Object.entries(packageJson.exports)) {
      if (exportPath === '.') continue; // Already handled
      if (typeof exportPath !== 'string') continue; // Safety check
      
      let resolvedPath = null;
      if (typeof exportValue === 'string') {
        resolvedPath = exportValue;
      } else if (typeof exportValue === 'object' && exportValue !== null) {
        // Try import, module, default in that order
        const exportObj = exportValue as any;
        resolvedPath = exportObj.import || exportObj.module || exportObj.default;
        
        // Ensure resolvedPath is a string
        if (typeof resolvedPath !== 'string') {
          resolvedPath = null;
        }
      }
      
      if (resolvedPath && typeof resolvedPath === 'string' && existsSync(join(packagePath, resolvedPath))) {
        const exportKey = exportPath.startsWith('./') ? 
          `${packageName}/${exportPath.slice(2)}` : 
          `${packageName}${exportPath}`;
        importMap[exportKey] = `/node_modules/${packageName}/${resolvedPath}`;
      }
    }
  }
  
  // Dynamically scan all subdirectories and files to find exportable modules
  scanPackageForExports(importMap, packageName, packagePath);
}

/**
 * Dynamically scan a package directory to find all possible exports
 */
function scanPackageForExports(importMap: Record<string, string>, packageName: string, packagePath: string, currentPath: string = '', depth: number = 0) {
  // Prevent infinite recursion and skip too deep structures
  if (depth > 4) return;
  
  let fullPath: string;
  try {
    fullPath = currentPath ? join(packagePath, currentPath) : packagePath;
  } catch (error) {
    // Skip invalid paths
    return;
  }
  
  if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) {
    return;
  }
  
  try {
    const items = readdirSync(fullPath);
    
    for (const item of items) {
      // Skip common non-export directories and files
      if (shouldSkipPath(item)) continue;
      
      try {
        const itemPath = join(fullPath, item);
        const relativePath = currentPath ? join(currentPath, item) : item;
        
        if (statSync(itemPath).isDirectory()) {
          // Check for index file in this directory
          const indexFiles = ['index.js', 'index.mjs', 'index.cjs'];
          for (const indexFile of indexFiles) {
            try {
              const indexPath = join(itemPath, indexFile);
              if (existsSync(indexPath)) {
                const importKey = `${packageName}/${relativePath}`;
                const importValue = `/node_modules/${packageName}/${relativePath}/${indexFile}`;
                importMap[importKey] = importValue;
                break; // Use first found index file
              }
            } catch (error) {
              // Skip invalid index paths
              continue;
            }
          }
          
          // Recursively scan subdirectory
          scanPackageForExports(importMap, packageName, packagePath, relativePath, depth + 1);
          
        } else if (item.endsWith('.js') || item.endsWith('.mjs') || item.endsWith('.cjs')) {
          // This is a potential export file
          const importKey = `${packageName}/${relativePath.replace(/\.(js|mjs|cjs)$/, '')}`;
          const importValue = `/node_modules/${packageName}/${relativePath}`;
          
          // Only add if it's likely to be a real module (has some heuristics)
          if (isLikelyModuleFile(itemPath)) {
            importMap[importKey] = importValue;
          }
        }
      } catch (error) {
        // Skip items that cause path errors
        continue;
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.debug(`[0x1] Could not scan ${fullPath}:`, error);
  }
}

/**
 * Check if a path should be skipped during package scanning
 */
function shouldSkipPath(path: string): boolean {
  const skipPatterns = [
    // Development and build artifacts
    'node_modules', '.git', '.svn', '.hg',
    'test', 'tests', '__tests__', 'spec', '__spec__',
    'coverage', '.nyc_output', '.coverage',
    
    // Build and development files
    'webpack.config.js', 'rollup.config.js', 'vite.config.js',
    'babel.config.js', '.babelrc', 'tsconfig.json',
    'jest.config.js', '.eslintrc', 'prettier.config.js',
    
    // Documentation and meta files
    'README.md', 'CHANGELOG.md', 'LICENSE', 'LICENSE.md',
    '.npmignore', '.gitignore', 'package-lock.json',
    'yarn.lock', 'pnpm-lock.yaml',
    
    // Hidden files
    '.',
  ];
  
  // Skip if path starts with any skip pattern
  if (skipPatterns.some(pattern => path.startsWith(pattern))) {
    return true;
  }
  
  // Skip hidden files and directories
  if (path.startsWith('.')) {
    return true;
  }
  
  // Skip files with common non-module extensions
  const skipExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.xml', '.map'];
  if (skipExtensions.some(ext => path.endsWith(ext))) {
    return true;
  }
  
  return false;
}

/**
 * Heuristic to determine if a file is likely to be a usable module
 */
function isLikelyModuleFile(filePath: string): boolean {
  try {
    // Read first 1KB of the file to check if it looks like a module
    const buffer = readFileSync(filePath);
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    
    // Check for common module patterns
    const modulePatterns = [
      /export\s+/, // Has exports
      /module\.exports\s*=/, // CommonJS exports
      /exports\.\w+\s*=/, // CommonJS named exports
      /import\s+.+\s+from/, // Has imports
      /require\s*\(/,  // Has requires
    ];
    
    // Must have at least one module pattern
    const hasModulePattern = modulePatterns.some(pattern => pattern.test(content));
    
    // Should not be a minified file (heuristic: very long lines)
    const lines = content.split('\n');
    const hasVeryLongLine = lines.some(line => line.length > 500);
    const looksMinified = hasVeryLongLine && lines.length < 10;
    
    return hasModulePattern && !looksMinified;
    
  } catch (error) {
    // If we can't read the file, assume it's not a module
    return false;
  }
}
