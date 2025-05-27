/**
 * Development Server Request Handlers
 * Contains the route handlers for the development server
 */

import { type ServerWebSocket } from "bun";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../../../utils/logger";
import { discoverComponents, handleScriptRequest, transpileFile } from "../transpilation-utils";
import { transformBareImports } from "./dev-server";

// Path resolution helpers
const currentFilePath = import.meta.url;
// Fix path resolution issues by using fileURLToPath
const frameworkPath = resolve(dirname(fileURLToPath(currentFilePath)), '../../../..');
const frameworkDistPath = resolve(frameworkPath, "dist");
const frameworkDistCorePath = resolve(frameworkDistPath, "core");
const frameworkSrcPath = resolve(frameworkPath, "src");

// For debugging purposes - log the resolved paths
logger.debug(`Framework path: ${frameworkPath}`);
logger.debug(`Template path: ${resolve(frameworkPath, "src/cli/commands/templates/dev.html")}`);

// Cache for discovered components to avoid repeated file system operations
let discoveredComponents: Record<string, any> = {};
let componentsLoaded = false;

/**
 * Handle serving the HTML for app directory structure
 */
export async function serveAppDirectoryHtml(
  options: { debug?: boolean } = {}
): Promise<Response> {
  try {
    logger.debug(`Serving modern app directory structure root HTML`);

    // Read the template file - use direct path to fix resolution issues
    const templatePath = "/Users/triex/Documents/00-Dev/0x1/src/cli/commands/templates/dev.html";
    logger.debug(`Using direct template path: ${templatePath}`);
    let templateContent = readFileSync(templatePath, "utf-8");

    // Check if app directory exists and force showing an error if not
    const projectPath = process.cwd();
    const appDirExists = existsSync(join(projectPath, "app"));
    
    // Replace debug placeholder with actual debug code
    const debugCode = options.debug ? `
    console.log('[0x1 DEBUG] Framework initializing');
    console.log('[0x1 DEBUG] About to import router module from: 0x1/router');
    ` : '// Debug logging disabled in production';

    templateContent = templateContent.replace("{{DEBUG_LOGGING}}", debugCode);
    
    // Add support for NextJS 15-style layout with full HTML structure
    // This script will detect if the layout includes full HTML tags and adjust rendering accordingly
    const layoutCompatScript = `
    <script>
      // Boolean text cleaner - removes "true" and "false" text nodes
      (function setupBooleanCleaner() {
        function cleanBooleanTextNodes(node) {
          if (!node) return;
          
          // Handle text nodes
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent === "true" || node.textContent === "false") {
              node.textContent = "";
            }
          } 
          // Handle element nodes recursively
          else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(child => {
              cleanBooleanTextNodes(child);
            });
          }
        }

        // Set up a mutation observer to clean boolean text nodes when new content is added
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                cleanBooleanTextNodes(node);
              });
            }
          });
        });

        // Run on DOM content loaded
        document.addEventListener('DOMContentLoaded', () => {
          // Clean existing nodes
          cleanBooleanTextNodes(document.body);
          
          // Watch for future changes
          observer.observe(document.body, { 
            childList: true,
            subtree: true
          });
        });
      })();

      // Handle NextJS 15 style layouts with full HTML structure
      (function setupLayoutCompatibility() {
        // Store the original createElement to patch it
        const originalCreateElement = document.createElement.bind(document);
        
        // Function to check if content has HTML root elements
        window.__0x1_hasHtmlStructure = function(content) {
          return typeof content === 'string' && 
                 (content.includes('<html') || 
                  content.includes('</html>') || 
                  (content.includes('<head') && content.includes('</head>') && 
                   content.includes('<body') && content.includes('</body>')));
        };

        // Function to extract content from HTML structure
        window.__0x1_extractBodyContent = function(htmlContent) {
          const tempDiv = originalCreateElement('div');
          tempDiv.innerHTML = htmlContent;
          
          // Look for the body content
          const bodyContent = tempDiv.querySelector('body');
          return bodyContent ? bodyContent.innerHTML : htmlContent;
        };

        // Function to properly handle layout content
        window.__0x1_processLayoutContent = function(content) {
          if (window.__0x1_hasHtmlStructure(content)) {
            console.log('[0x1] Detected Next.js 15-style layout with full HTML structure');
            return window.__0x1_extractBodyContent(content);
          }
          return content;
        };
      })();
    </script>
    `;
    
    // Insert the layout compatibility script in the head
    templateContent = templateContent.replace('</head>', `${layoutCompatScript}\n</head>`);
    
    // Add forced error overlay visibility for missing app directory
    if (!appDirExists) {
      // Add script to show error overlay immediately on page load
      const forceErrorScript = `
      <script>
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
          // Wait a short time to ensure ErrorOverlay is initialized
          setTimeout(function() {
            // Check if ErrorOverlay exists
            if (window.ErrorOverlay) {
              // Create error for missing app directory
              const missingAppError = new Error('The 0x1 framework requires an app directory with components');
              missingAppError.name = 'Missing App Directory';
              missingAppError.message = 'The 0x1 framework requires an app directory structure with at least a page component.\n\nPlease create an app directory with the following structure:\n\n/app\n  /page.tsx (or .jsx/.ts/.js)\n  /layout.tsx (optional)\n\nSee documentation for more details.';
              
              // Show error in overlay
              window.ErrorOverlay.show(missingAppError, 'Missing App Directory');
            }
          }, 500);
        });
      </script>
      `;
      
      // Insert the script right before the closing body tag
      templateContent = templateContent.replace('</body>', `${forceErrorScript}\n</body>`);
    }

    return new Response(templateContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    logger.error(`Error serving app directory HTML: ${error}`);
    return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
</head>
<body>
  <h1>Server Error</h1>
  <p>Failed to generate HTML template: ${error}</p>
</body>
</html>`, {
      status: 500,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
}

/**
 * Handle serving the live reload script
 */
export async function serveLiveReloadScript(): Promise<Response> {
  try {
    logger.debug(`Serving live reload script`);
    
    // Simple live reload script with web socket connection
    const liveReloadScript = `
// 0x1 Live Reload Client
(function() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  let socket;
  let reconnectTimer;
  const maxReconnectAttempts = 10;
  let reconnectAttempts = 0;
  
  function connect() {
    // Close any existing connection
    if (socket) {
      socket.close();
    }
    
    // Connect to WebSocket server
    const wsUrl = wsProtocol + '//' + wsHost;
    socket = new WebSocket(wsUrl);
    
    socket.addEventListener('open', () => {
      console.log('[0x1] Live reload connected');
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });
    
    socket.addEventListener('message', (event) => {
      const message = event.data;
      if (message === 'reload') {
        console.log('[0x1] Changes detected, reloading page...');
        window.location.reload();
      }
    });
    
    socket.addEventListener('close', () => {
      console.log('[0x1] Live reload disconnected, attempting to reconnect...');
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
        reconnectAttempts++;
        
        reconnectTimer = setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.warn('[0x1] Live reload failed after maximum reconnect attempts');
      }
    });
    
    socket.addEventListener('error', (error) => {
      console.error('[0x1] Live reload connection error:', error);
    });
  }

  // Start connection when the page loads
  if (document.readyState === 'complete') {
    connect();
  } else {
    window.addEventListener('load', connect);
  }
})();
`;

    // Ensure the content type is set correctly and there's no indentation that could affect JavaScript syntax
    logger.debug(`Serving live reload script with explicit JavaScript MIME type`);
    return new Response(liveReloadScript, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff", // Prevent content type sniffing
      },
    });
  } catch (error) {
    logger.error(`Error serving live reload script: ${error}`);

    return new Response(`console.error('Failed to load live reload script');`, {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
}

/**
 * Handle serving a framework module
 */
export async function serveFrameworkModule(
  request: Request,
  options: { debug?: boolean } = {}
): Promise<Response> {
  // Always enable debug for router module troubleshooting
  const isRouterRequest = request.url.includes('/router.js') || request.url.includes('/router');
  if (isRouterRequest) {
    options.debug = true;
    logger.debug(`🔍 Router module requested: ${request.url}`);
  }
  try {
    // Extract the module path from the URL
    const url = new URL(request.url);
    const fullPath = url.pathname;
    const modulePath = fullPath.replace(/^\/0x1\//, "");
    
    options.debug && logger.debug(`Requested framework module path: ${fullPath}`);
    options.debug && logger.debug(`Parsed module name: ${modulePath}`);
    
    // CRITICAL FIX: Comprehensive handling for all router module requests
    // This catches router module requests in any format to ensure correct MIME type
    if (modulePath === "router" || modulePath === "router.js" || 
        fullPath.includes('/router.js') || 
        (fullPath.includes('router') && !fullPath.includes('.map') && 
         !fullPath.includes('.jsx') && !fullPath.includes('.tsx') && !fullPath.includes('.d.ts'))) {
      
      // Force debug mode for router module requests
      options.debug = true;
      
      logger.debug(`Router module request detected: ${fullPath}`);
      
      // Try multiple possible router locations in priority order
      const possibleRouterPaths = [
        // First prioritize the actual router source file
        join(frameworkPath, 'src/core/router.ts'),
        // Then try compiled router files
        join(frameworkDistCorePath, 'router.js'),  // dist/core/router.js
        join(frameworkDistPath, 'router.js'),      // dist/router.js
        join(frameworkDistPath, '0x1', 'router.js'), // dist/0x1/router.js
        join(frameworkPath, 'dist/core/router.js'),
        join(frameworkPath, 'dist/0x1/router.js'),
        // Additional paths for absolute imports
        join(frameworkPath, 'dist', 'router.js'),
        // Alternate source paths
        join(frameworkSrcPath, 'core', 'router.js'),
        // Secondary paths (from node_modules)
        join(process.cwd(), 'node_modules/0x1/dist/core/router.js'),
        join(process.cwd(), 'node_modules/0x1/dist/router.js'),
        join(process.cwd(), 'node_modules/0x1/dist/0x1/router.js'),
      ];
      
      logger.debug("Checking possible router paths:");
      for (const path of possibleRouterPaths) {
        logger.debug(`- ${path} ${existsSync(path) ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      }
      possibleRouterPaths.forEach(path => {
        options.debug && logger.debug(`- ${path} (exists: ${existsSync(path)})`); 
      });
      
      // Find the first router path that exists
      let routerPath = null;
      for (const path of possibleRouterPaths) {
        if (existsSync(path)) {
          routerPath = path;
          logger.debug(`Found router at: ${routerPath} ✅`);
          break;
        }
      }
      
      logger.debug(routerPath ? 
        `Router found at: ${routerPath}` : 
        'Router module not found in any of the expected locations 🔴');
        
      // If we don't have a router path, try directly serving from the compiled dist directory
      if (!routerPath) {
        const builtRouterPath = join(frameworkPath, 'dist', 'core', 'router.js');
        if (existsSync(builtRouterPath)) {
          routerPath = builtRouterPath;
          logger.debug(`Found router at build path: ${routerPath} ✅`);
        }
      }
      
      if (routerPath) {
        try {
          // Read the router content
          const routerContent = readFileSync(routerPath, 'utf-8');
          logger.debug(`Router file read successfully (${routerContent.length} bytes)`);
          
          // If it's a TypeScript file, we need to transpile it
          let finalContent: string;
          if (routerPath.endsWith('.ts')) {
            logger.debug(`Transpiling TypeScript router file: ${routerPath}`);
            const result = await transpileFile(routerPath, { 
              debug: true, // Always debug router transpilation 
              projectRoot: process.cwd()
            });
            if (!result.success || !result.content) {
              logger.error(`Failed to transpile router: ${result.error || 'Unknown error'}`);
              return new Response(`// Error transpiling router module: ${result.error || 'Unknown error'}`, {
                status: 500,
                headers: {
                  "Content-Type": "application/javascript; charset=utf-8",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "X-Content-Type-Options": "nosniff"
                },
              });
            }
            finalContent = result.content;
            logger.debug(`Router transpiled successfully (${finalContent.length} bytes)`);
          } else {
            finalContent = routerContent;
          }
          
          // Ensure the content is valid JavaScript by checking for basic syntax
          if (finalContent.trim() === '' || finalContent.includes('<!DOCTYPE html>')) {
            logger.error(`Invalid router content detected (possibly HTML): ${finalContent.substring(0, 100)}...`);
            return new Response(`// Error: Invalid router module content`, {
              status: 500,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            });
          }
          
          logger.debug(`Serving router module with correct MIME type (${finalContent.length} bytes)`);
          // Return with proper JavaScript MIME type
          return new Response(finalContent, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-0x1-Module": "router",
              "X-Content-Type-Options": "nosniff"
            },
          });
        } catch (error) {
          logger.error(`Error serving router module from ${routerPath}: ${error}`);
          return new Response(`// Error serving router module: ${error}`, {
            status: 500,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-0x1-Module": "router-error",
              "X-Content-Type-Options": "nosniff"
            },
          });
        }
      } else {
        // Fallback to generating a minimal router module if we can't find one
        options.debug && logger.error(`Could not find router module in any expected location, generating dev error module`);
        
        // Generate a minimal router implementation that displays an error
        const devErrorRouterModule = `
// 0x1 development error router module
// This module is generated when the router module can't be loaded

// Create a default error UI
function createDefaultErrorUI(message, details, stackTrace) {
  console.error('[0x1] Router module error:', message);
  console.error(details);
  
  // Only run in browser environment
  if (typeof document === 'undefined') return;
  
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.bottom = '0';
  container.style.backgroundColor = 'rgba(30, 41, 59, 0.98)';
  container.style.color = '#e2e8f0';
  container.style.padding = '20px';
  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.zIndex = '9999';
  container.style.overflow = 'auto';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  
  const content = document.createElement('div');
  content.style.maxWidth = '800px';
  content.style.width = '100%';
  content.style.background = 'rgba(0, 0, 0, 0.2)';
  content.style.borderRadius = '8px';
  content.style.padding = '24px';
  content.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
  content.style.border = '1px solid rgba(99, 102, 241, 0.2)';
  
  const title = document.createElement('h1');
  title.textContent = 'Router Module Error';
  title.style.fontSize = '24px';
  title.style.marginBottom = '16px';
  title.style.color = '#F87171';
  
  const messageElement = document.createElement('p');
  messageElement.textContent = message || 'Could not load the 0x1 router module';
  messageElement.style.marginBottom = '16px';
  messageElement.style.fontSize = '16px';
  
  const detailsElement = document.createElement('div');
  detailsElement.style.background = 'rgba(0, 0, 0, 0.3)';
  detailsElement.style.padding = '12px';
  detailsElement.style.borderRadius = '4px';
  detailsElement.style.marginBottom = '16px';
  detailsElement.style.fontFamily = 'monospace';
  detailsElement.style.whiteSpace = 'pre-wrap';
  detailsElement.style.fontSize = '14px';
  detailsElement.textContent = details || 'The router module could not be found or loaded.';
  
  content.appendChild(title);
  content.appendChild(messageElement);
  content.appendChild(detailsElement);
  
  if (stackTrace) {
    const stackElement = document.createElement('details');
    stackElement.style.marginTop = '16px';
    
    const summary = document.createElement('summary');
    summary.textContent = 'Stack Trace';
    summary.style.cursor = 'pointer';
    summary.style.marginBottom = '8px';
    
    const stackContent = document.createElement('pre');
    stackContent.style.background = 'rgba(0, 0, 0, 0.3)';
    stackContent.style.padding = '12px';
    stackContent.style.borderRadius = '4px';
    stackContent.style.overflow = 'auto';
    stackContent.style.fontSize = '12px';
    stackContent.textContent = stackTrace;
    
    stackElement.appendChild(summary);
    stackElement.appendChild(stackContent);
    content.appendChild(stackElement);
  }
  
  const helpList = document.createElement('ul');
  helpList.style.marginTop = '24px';
  helpList.style.color = '#94A3B8';
  
  const tips = [
    'Make sure the 0x1 framework is correctly installed',
    'Check that the router module exists in your project',
    'Run "bun run build" to rebuild the framework',
    'Check the browser console for more detailed error information'
  ];
  
  tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    li.style.marginBottom = '8px';
    helpList.appendChild(li);
  });
  
  content.appendChild(helpList);
  container.appendChild(content);
  document.body.appendChild(container);
}

// Generate an error router that will display the error when initialized
export class Router {
  constructor(options) {
    this.showError();
  }
  
  showError() {
    createDefaultErrorUI(
      'Router Module Error',
      'The 0x1 router module could not be loaded properly. The development server is running, but no content can be displayed because the router is unavailable.',
      'The router module path could not be resolved correctly. This might be due to a build issue or incorrect path resolution.'
    );
  }
  
  // Implement basic API to prevent errors
  navigate() {}
  registerRoutes() {}
  mount() {}
}

export function createRouter(options) {
  return new Router(options);
}

// Initialize immediately
try {
  if (typeof window !== 'undefined') {
    new Router().showError();
  }
} catch (e) {
  console.error('Failed to initialize error router:', e);
}
`;
        
        return new Response(devErrorRouterModule, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-0x1-Module": "router",
            "X-Content-Type-Options": "nosniff"
          },
        });
      }
    }
    
    let moduleContent = "";

    // Special handling for the router module
    if (modulePath.includes("router")) {
      options.debug && logger.debug(`Serving router module: ${modulePath}`);
      
      try {
        // Find the router file - try multiple possible locations in priority order
        // First check the dist directory (production build)
        const distRouterPath = join(frameworkDistPath, "core", "router.js");
        // Alternative paths
        const distRouterAltPath = join(frameworkDistPath, "router.js");
        const rootDistRouterPath = join(frameworkPath, "dist/0x1", "router.js");
        const navigationPath = join(frameworkDistPath, "core", "navigation.js");
        const errorBoundaryPath = join(frameworkPath, "src/core", "error-boundary.ts");
        
        // Check if the files exist in multiple possible locations
        let routerPath = null;
        if (existsSync(distRouterPath)) {
          routerPath = distRouterPath;
          options.debug && logger.debug(`Found router at primary path: ${routerPath}`);
        } else if (existsSync(distRouterAltPath)) {
          routerPath = distRouterAltPath;
          options.debug && logger.debug(`Found router at alt path: ${routerPath}`);
        } else if (existsSync(rootDistRouterPath)) {
          routerPath = rootDistRouterPath;
          options.debug && logger.debug(`Found router at root dist path: ${routerPath}`);
        } else {
          options.debug && logger.error('Router module not found in any expected location');
        }
        
        const navigationExists = existsSync(navigationPath);
        const errorBoundaryExists = existsSync(errorBoundaryPath);
        
        options.debug && logger.debug(`Final router path: ${routerPath}`);
        options.debug && logger.debug(`Navigation exists: ${navigationExists}`);
        
        if (routerPath) {
          options.debug && logger.debug(`Loading router from: ${routerPath}`);
          
          // Load the router module and navigation module
          const routerSource = readFileSync(routerPath, "utf-8");
          const navigationSource = navigationExists ? readFileSync(navigationPath, "utf-8") : '';
          
          // Load error boundary code if it exists
          let errorBoundaryCode = '';
          if (errorBoundaryExists) {
            const errorBoundarySource = readFileSync(errorBoundaryPath, "utf-8");
            errorBoundaryCode = `
// Error boundary implementation
${errorBoundarySource.replace(/import[^;]+;/g, '// Import removed').replace(/export\s+/g, '')}            
`;
          } else {
            // Minimal error boundary implementation if file doesn't exist
            errorBoundaryCode = `
// Minimal error boundary implementation
function createDefaultErrorUI(error) {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.margin = '20px';
  container.style.backgroundColor = '#f44336';
  container.style.color = 'white';
  container.style.borderRadius = '4px';
  
  const title = document.createElement('h2');
  title.textContent = 'Error: ' + (error.name || 'Unknown Error');
  
  const message = document.createElement('pre');
  message.textContent = error.message || 'An unknown error occurred';
  message.style.whiteSpace = 'pre-wrap';
  message.style.marginTop = '10px';
  
  container.appendChild(title);
  container.appendChild(message);
  
  if (error.stack) {
    const stack = document.createElement('details');
    stack.style.marginTop = '20px';
    
    const summary = document.createElement('summary');
    summary.textContent = 'Stack Trace';
    summary.style.cursor = 'pointer';
    summary.style.fontWeight = 'bold';
    
    const stackContent = document.createElement('pre');
    stackContent.textContent = error.stack;
    stackContent.style.whiteSpace = 'pre-wrap';
    stackContent.style.marginTop = '10px';
    stackContent.style.fontSize = '12px';
    
    stack.appendChild(summary);
    stack.appendChild(stackContent);
    container.appendChild(stack);
  }
  
  return container;
}

function createErrorBoundary(Component, FallbackComponent = null) {
  return function ErrorBoundaryWrapper(props) {
    try {
      return Component(props);
    } catch (error) {
      console.error('Error caught by error boundary:', error);
      if (FallbackComponent) {
        try {
          return FallbackComponent({ error, reset: () => window.location.reload() });
        } catch (fallbackError) {
          console.error('Error in fallback component:', fallbackError);
          return createDefaultErrorUI(error);
        }
      }
      return createDefaultErrorUI(error);
    }
  };
}
`;
          }
          
          // Clean up router source code to avoid illegal return statements
          const cleanedRouterSource = routerSource
            .replace(/export\s+{[^}]+}/g, '')
            .replace(/return\s+\{([^}]+)\};?/g, '/* Modified: return object */')
            .replace(/return\s+([^;{]+);/g, '/* Modified: return statement */');
            
          const cleanedNavigationSource = navigationSource
            .replace(/export\s+{[^}]+}/g, '')
            .replace(/return\s+\{([^}]+)\};?/g, '/* Modified: return object */')
            .replace(/return\s+([^;{]+);/g, '/* Modified: return statement */');
          
          // Create a proper ES module with exports for the router and navigation
          moduleContent = `
// Properly formatted ES module with necessary exports
// @ts-nocheck - Runtime browser code

// Error boundary implementation for catching router errors
${errorBoundaryCode}

// Core router implementation - modified to avoid syntax errors
${cleanedRouterSource}

// Navigation implementation with renamed components to avoid conflicts
${cleanedNavigationSource}

// Export the Router class as a proper ESM module with named export
export { Router, createErrorBoundary, createDefaultErrorUI };

// Initialize router on page load with enhanced error handling
document.addEventListener('DOMContentLoaded', () => {
  // Check if window.__0x1_ROUTER__ exists to prevent double initialization
  if (window.__0x1_ROUTER__) return;

  try {
    // Find the app root element with more robust detection
    const appRoot = document.querySelector('#app-root') || document.querySelector('#root') || document.querySelector('#app') || document.body;
    
    console.log('[0x1] Running in development mode', window.location.hostname);
    
    // Create the router with improved configuration
    const router = new Router({
      rootElement: appRoot,
      mode: 'history',
      notFoundComponent: function() {
        const notFound = document.createElement('div');
        notFound.innerHTML = '<h1>404 - Page Not Found</h1><p>The requested page could not be found.</p>';
        return notFound;
      },
      errorBoundary: true
    });
    
    // Initialize the router with error boundary
    window.__0x1_ROUTER__ = router;
    router.init();
  } catch (error) {
    console.error('[0x1] Error initializing router:', error);
    
    // Display a nice error UI if router initialization fails
    const appRoot = document.querySelector('#app-root') || document.querySelector('#root') || document.querySelector('#app') || document.body;
    if (appRoot) {
      appRoot.innerHTML = '';
      appRoot.appendChild(createDefaultErrorUI(error));
    }
  }
});
  
  // Merge options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create and return a router instance
  return new Router(mergedOptions);
};

// ===== MODULE EXPORTS =====
// Completely flattened exports to prevent any duplicate declarations

// Default export is the Router class
export default Router;

// Named exports - direct references without intermediate objects
// This completely prevents duplicate declarations
export const createRouter = _createRouter;
export const Link = BrowserLink;
export const NavLink = BrowserNavLink;
export const Redirect = BrowserRedirect;
`;
        }
      } catch (error) {
        // Log error but don't silently fail - let the error propagate to the UI
        logger.error(`Error loading router module: ${error}`);
        
        // Instead of silent fallback, use error boundary to show a clear error UI
        moduleContent = `
        // 0x1 Router - Error with proper error boundary
        import { createErrorBoundary, createDefaultErrorUI } from '/0x1/core/error-boundary';
        
        // Create a detailed error for the user
        const routerLoadError = new Error(
          'Failed to load the 0x1 router module. This is a critical error that prevents the application from functioning properly.\n\n' +
          'Possible causes:\n' +
          '- The router module was not built correctly\n' + 
          '- There is a problem with the module path resolution\n' +
          '- The router implementation contains errors\n\n' +
          'See the console for detailed error information.'
        );
        
        // Log detailed error in console for developers
        console.error('[0x1] Router module load error:', routerLoadError);
        console.error('[0x1] Original error:', ${JSON.stringify(error instanceof Error ? error.message : String(error))});
        
        // Create mock router class that shows error UI
        export class Router {
          constructor(options) {
            console.error('[0x1] Using error boundary Router implementation due to module load failure');
            this.options = options;
            this.error = routerLoadError;
          }
          
          init() {
            // When initialized, show error boundary in the root element
            if (this.options && this.options.rootElement) {
              this.options.rootElement.innerHTML = '';
              this.options.rootElement.appendChild(createDefaultErrorUI(this.error));
            }
          }
        }
        
        // Export other required components with error indicators
        export const createRouter = (options) => new Router(options);
        export const Link = () => createErrorBoundary({ children: 'Router Link Error' });
        export const NavLink = () => createErrorBoundary({ children: 'Router NavLink Error' });
        export const Redirect = () => createErrorBoundary({ children: 'Router Redirect Error' });
        
        // Export default router
        export default Router;
        `;
      }
    } else if (modulePath === "jsx-runtime") {
      moduleContent = await Bun.file(
        join(frameworkPath, "dist/0x1/jsx-runtime.js")
      ).text();
    } else if (
      modulePath === "jsx-dev-runtime" ||
      modulePath === "jsx-dev-runtime/index.js"
    ) {
      // Provide JSX dev runtime for bundling
      moduleContent = await Bun.file(
        join(frameworkPath, "dist/0x1/jsx-dev-runtime.js")
      ).text();
    } else if (
      modulePath === "" ||
      modulePath === "index.js"
    ) {
      // Generate completely isolated main module to prevent duplicate exports
      moduleContent = `
    // 0x1 Framework - Browser Compatible Version

    // JSX runtime imports
    import { jsx, jsxs, Fragment, createElement } from '/0x1/jsx-runtime';

    // ISOLATED router imports - import each export individually for clarity
    import { Router, createRouter, Link, NavLink, Redirect } from '/0x1/router';

    // Export all the components and utilities
    export {
      // JSX Runtime
      jsx, jsxs, Fragment, createElement,
      
      // Router
      Router, createRouter, Link, NavLink, Redirect
    };

    // Provide default export for compatibility
    export default {
      jsx, jsxs, Fragment, createElement,
      Router, createRouter, Link, NavLink, Redirect
    };
    `;
    } else {
      // Try to load the requested module from the dist directory
      try {
        const moduleFilePath = join(frameworkDistPath, modulePath);
        if (existsSync(moduleFilePath)) {
          moduleContent = await Bun.file(moduleFilePath).text();
        } else {
          return new Response(`console.error('Module not found: ${moduleFilePath}');`, {
            status: 404,
            headers: {
              "Content-Type": "application/javascript",
            },
          });
        }
      } catch (error) {
        return new Response(`console.error('Error loading module: ${error}');`, {
          status: 500,
          headers: {
            "Content-Type": "application/javascript",
          },
        });
      }
    }

    // Make sure moduleContent is set
    if (!moduleContent) {
      logger.error(`Module content not set, cannot serve module: ${modulePath}`);
      return new Response(`console.error('Failed to load module: content not available');`, {
        status: 500,
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    try {
      // Transform any bare imports in the module content
      moduleContent = transformBareImports(moduleContent);

      return new Response(moduleContent, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (transformError) {
      logger.error(`Error transforming imports: ${transformError}`);
      return new Response(`console.error('Error transforming module imports: ${transformError}');`, {
        status: 500,
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }
  } catch (error) {
    // Extract module path from URL if possible
    let errorModulePath = "unknown";
    try {
      if (request && request.url) {
        const errorUrl = new URL(request.url);
        errorModulePath = errorUrl.pathname.replace(/^\/0x1\//, "");
      }
    } catch (pathError) {
      // Ignore errors extracting path in error handler
    }

    logger.error(`Error serving module ${errorModulePath}: ${error}`);
    return new Response(`console.error('Failed to load live reload script');`, {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
}

/**
 * Handle WebSocket connections for live reload
 */
export function handleWebSocketConnection(
  ws: ServerWebSocket<unknown>,
  clients: Set<ServerWebSocket<unknown>>
): void {
  logger.debug(`WebSocket client connected, total connected: ${clients.size + 1}`);
  clients.add(ws);
  
  // Send a confirmation to the client
  ws.send(JSON.stringify({ 
    type: 'connected', 
    timestamp: Date.now(),
    message: 'Connected to 0x1 development server'
  }));
}

/**
 * Broadcast a reload message to all clients
 */
/**
 * Handle script file requests including transpilation for TypeScript/JSX files
 */
export async function handleScriptFile(
  path: string,
  projectPath: string,
  options: { debug?: boolean } = {}
): Promise<Response> {
  const { debug = false } = options;
  
  try {
    // Check if this is a TypeScript/JSX file request that needs transpilation
    if (path.endsWith(".js") && !path.includes("node_modules")) {
      // Try handling via our script request handler
      const result = await handleScriptRequest(path, projectPath, options);
      
      if (result.success && result.content) {
        return new Response(result.content, {
          headers: {
            "Content-Type": result.contentType || "application/javascript",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          status: result.status || 200,
        });
      }
    }
    
    // For direct .tsx or .jsx file requests (unusual but possible)
    if (path.endsWith(".tsx") || path.endsWith(".jsx") || path.endsWith(".ts")) {
      // If path starts with /0x1/ or is the jsx-utils.js file, serve framework module
      if (path.startsWith('/0x1/') || path.includes('jsx-utils.js')) {
        // Create a mock request object for the framework module handler
        const mockRequest = new Request(`http://localhost/${path}`);
        return await serveFrameworkModule(mockRequest, { debug });
      }
      const fullPath = resolve(projectPath, path.slice(1)); // Remove leading slash
      
      if (existsSync(fullPath)) {
        const result = await transpileFile(fullPath, { 
          projectRoot: projectPath,
          debug
        });
        
        if (result.success && result.content) {
          return new Response(result.content, {
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      }
    }
    
    // For app components auto-discovery (typically for the router)
    if (path.startsWith("/app/") && (
        path.endsWith("/page.js") || 
        path.endsWith("/layout.js") || 
        path.endsWith("/error.js") || 
        path.endsWith("/not-found.js")
    )) {
      // Check if we need to discover components
      if (!componentsLoaded) {
        // Use modern app directory structure
        const appDir = resolve(projectPath, "app");
        const srcAppDir = resolve(projectPath, "src/app");
        
        // Try to discover components in both possible app directories
        if (existsSync(appDir)) {
          discoveredComponents = await discoverComponents(appDir, { debug });
        } else if (existsSync(srcAppDir)) {
          discoveredComponents = await discoverComponents(srcAppDir, { debug });
        }
        
        componentsLoaded = true;
      }
      
      // Extract component path from URL
      const componentPath = path.slice(1).replace(".js", ""); // Remove leading slash and .js extension
      
      // If component exists in discovered components, serve it
      if (discoveredComponents[componentPath]) {
        const componentContent = discoveredComponents[componentPath];
        return new Response(componentContent, {
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }
      
      // If component doesn't exist, create a stub
      const componentType = path.split("/").pop()?.split(".")[0] || "page";
      const stubComponent = `
// 0x1 Framework - Auto-generated stub component for ${componentType}
// Path: ${path}

export default function ${componentType}Component(props) {
  return {
    type: "div",
    props: { className: "stub-component", ...props },
    children: [{ type: "h1", props: {}, children: ["${componentType} Component"] }]
  };
}
      `;
      
      return new Response(stubComponent, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }
    
    // If we got here, we couldn't handle this request
    return new Response(`console.error('Script file not found or could not be processed: ${path}');`, {
      status: 404,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  } catch (error) {
    logger.error(`Error handling script file request: ${error}`);
    return new Response(`console.error('Error processing script: ${error}');`, {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  }
}

/**
 * Broadcast a reload message to all clients
 */
export function broadcastReload(
  clients: Set<ServerWebSocket<unknown>>,
  type: 'reload' | 'css-update' = 'reload',
  path?: string
): void {
  const message = JSON.stringify({ 
    type,
    path,
    timestamp: Date.now()
  });
  
  logger.debug(`Broadcasting ${type} to ${clients.size} clients`);
  
  // Send to all connected clients
  for (const client of clients) {
    try {
      client.send(message);
    } catch (error) {
      logger.warn(`Failed to send to client: ${error}`);
    }
  }
}
