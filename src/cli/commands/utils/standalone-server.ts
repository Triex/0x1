/**
 * Standalone development server implementation
 * This provides a simplified implementation that correctly handles MIME types
 */

import { serve, type Server, type ServerWebSocket } from "bun";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from "url";
import { logger } from "../../utils/logger.js";
import { generateCssModuleScript, isCssModuleJsRequest, processCssFile } from "./css-handler.js";

// Extend Window interface to add our custom properties
declare global {
  interface Window {
    __0x1_debug?: boolean;
    __0x1_loadComponentStyles?: (path: string) => Promise<void>;
    process?: any;
  }
}

// Path resolution helpers
const currentFilePath = fileURLToPath(import.meta.url);
const frameworkPath = resolve(dirname(currentFilePath), '../../../../');
const frameworkDistPath = resolve(frameworkPath, "dist");
const frameworkCorePath = join(frameworkDistPath, "core");

/**
 * Map file extensions to MIME types
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".cjs": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".ts": "application/javascript; charset=utf-8",
  ".tsx": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

/**
 * Get MIME type for a file based on its extension
 */
function getMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Default HTML template for the development server
 */
// Define the HTML template parts to avoid TypeScript parsing issues with template literals
const HEAD_SECTION = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>0x1 Framework</title>\n  <meta name="description" content="0x1 Framework Development Server">\n  <link rel="icon" href="/favicon.ico">\n  <!-- CSS Module Handling -->\n  <script>\n    window.__0x1_loadComponentStyles = async (path) => {\n      try {\n        // Check for .module.css alongside the component\n        const cssPath = path.replace(/\\.js$/, ".module.css");\n        const response = await fetch(cssPath);\n        \n        if (response.ok) {\n          const cssContent = await response.text();\n          const styleId = "style-" + path.replace(/[\\/\\.]/g, "-");\n          \n          // Create or update style element\n          let styleEl = document.getElementById(styleId);\n          if (!styleEl) {\n            styleEl = document.createElement("style");\n            styleEl.id = styleId;\n            document.head.appendChild(styleEl);\n          }\n          \n          styleEl.textContent = cssContent;\n          console.log("[0x1] Loaded CSS for " + path);\n        }\n      } catch (err) {\n        // Silently fail if no CSS found\n      }\n    };\n    \n    // Auto load global CSS\n    fetch("/app/globals.css").then(response => {\n      if (response.ok) {\n        return response.text().then(css => {\n          const globalStyle = document.createElement("style");\n          globalStyle.id = "globals-css";\n          globalStyle.textContent = css;\n          document.head.appendChild(globalStyle);\n          console.log("[0x1] Loaded global CSS");\n        });\n      }\n    }).catch(() => {});\n  </script>\n\n  <!-- Process polyfill for browser environment -->\n  <script>\n    window.process = window.process || {\n      env: { NODE_ENV: \'development\' }\n    };\n    console.log(\'[0x1] Running in development mode\', window.location.hostname);\n    \n    // Apply dark mode based on user preference\n    const darkModePreference = localStorage.getItem(\'0x1-dark-mode\') || localStorage.getItem(\'darkMode\');\n    if (darkModePreference === \'dark\' || darkModePreference === \'enabled\' || \n        (!darkModePreference && window.matchMedia(\'(prefers-color-scheme: dark)\').matches)) {\n      document.documentElement.classList.add(\'dark\');\n    }\n  </script>\n\n  <!-- Add base styling for Tailwind classes -->\n  <style>\n    /* Base Tailwind utility classes */\n    .p-8 { padding: 2rem; }\n    .max-w-4xl { max-width: 56rem; }\n    .mx-auto { margin-left: auto; margin-right: auto; }\n    .text-center { text-align: center; }\n    .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }\n    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }\n    .font-bold { font-weight: 700; }\n    .mb-6 { margin-bottom: 1.5rem; }\n    .mb-8 { margin-bottom: 2rem; }\n    .text-indigo-600 { color: #4f46e5; }\n    .dark .dark\:text-indigo-400 { color: #818cf8; }\n    .text-gray-800 { color: #1f2937; }\n    .dark .dark\:text-gray-200 { color: #e5e7eb; }\n    .bg-white { background-color: #ffffff; }\n    .dark .dark\:bg-gray-800 { background-color: #1f2937; }\n    .rounded-lg { border-radius: 0.5rem; }\n    .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }\n    .text-2xl { font-size: 1.5rem; line-height: 2rem; }\n    .font-semibold { font-weight: 600; }\n    .mb-4 { margin-bottom: 1rem; }\n    .text-gray-900 { color: #111827; }\n    .dark .dark\:text-white { color: #ffffff; }\n    .flex { display: flex; }\n    .justify-center { justify-content: center; }\n    .items-center { align-items: center; }\n    .gap-4 { gap: 1rem; }\n    .px-4 { padding-left: 1rem; padding-right: 1rem; }\n    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }\n    .bg-red-500 { background-color: #ef4444; }\n    .text-white { color: #ffffff; }\n    .rounded { border-radius: 0.25rem; }\n    .hover\:bg-red-600:hover { background-color: #dc2626; }\n    .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }\n    .min-w-\[3rem\] { min-width: 3rem; }\n    .text-center { text-align: center; }\n    .bg-green-500 { background-color: #22c55e; }\n    .hover\:bg-green-600:hover { background-color: #16a34a; }\n    .bg-purple-500 { background-color: #a855f7; }\n    .hover\:bg-purple-600:hover { background-color: #9333ea; }\n    /* Dark mode base styles */\n    .dark { color-scheme: dark; }\n    .dark body { background-color: #111827; color: #f3f4f6; }\n  </style>';



const IMPORT_MAP = '\n\n  <script type="importmap">\n  {\n    "imports": {\n      "0x1": "/node_modules/0x1/index.js",\n      "0x1/router": "/0x1/router.js?type=module",\n      "0x1/": "/0x1/",\n      "components/": "/components/",\n      "app/": "/app/",\n      "src/": "/src/"\n    }\n  }\n  </script>';

const STYLES = '\n\n  <!-- Include any stylesheets -->\n  <link rel="stylesheet" href="/styles.css">\n  <link rel="stylesheet" href="/public/styles.css">\n  <link rel="stylesheet" href="/public/styles/tailwind.css">';

const BODY_START = '\n</head>\n<body>\n  <div id="app"></div>\n\n  <!-- Live reload script - using standardized path to avoid duplication -->\n  <script src="/__0x1_live_reload.js"></script>';

const APP_SCRIPT = `

  <!-- App initialization script -->
  <script type="module">
    console.log("[0x1 DEBUG] Framework initializing");
    console.log("[0x1 DEBUG] Auto-discovery enabled, loading components from app directory");

    // Import the router and required components
    import { createRouter } from "0x1/router";
    
    console.log("[0x1 DEBUG] Router module loaded successfully");

    // Function to get app components with enhanced import resolution
    async function fetchComponentModule(path) {
      try {
        console.log(\`[0x1 DEBUG] Loading component: \${path}\`);
        const response = await fetch(path);
        if (!response.ok) throw new Error(\`Failed to load component: \${path}\`);
        const text = await response.text();
        
        // Pre-process text to fix imports if needed
        let processedText = text;
        
        // Handle relative imports in component files
        const importRegex = /import\\s+[^"']*["']([^"']*)["'];?/g;
        const imports = [...text.matchAll(importRegex)];
        
        for (const importMatch of imports) {
          const importPath = importMatch[1];
          // Log the import being processed
          console.log(\`[0x1 DEBUG] Processing import: \${importPath} in \${path}\`);
          
          // Ensure component imports are properly loaded
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            // This is a relative import - we'll need to resolve it
            const basePath = path.substring(0, path.lastIndexOf('/'));
            const resolvedPath = new URL(importPath, new URL(basePath, window.location.href)).pathname;
            console.log(\`[0x1 DEBUG] Resolved relative import \${importPath} to \${resolvedPath}\`);
            
            // Pre-fetch this component to ensure it's available
            fetch(resolvedPath).catch(e => console.warn(\`[0x1 WARN] Failed to pre-fetch: \${resolvedPath}\`, e));
          }
        }
        
        // Create a blob with the processed module content
        const blob = new Blob([processedText], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        
        // Load CSS for this component if available
        if (window.__0x1_loadComponentStyles) {
          await window.__0x1_loadComponentStyles(path);
        }
        
        // Import the module dynamically
        return await import(url);
      } catch (err) {
        console.error(\`[0x1 ERROR] Failed to load component \${path}:\`, err);
        return null;
      }
    }

    // Function to initialize app
    async function initApp() {
      // Get the app element
      const appElement = document.getElementById("app");
      
      if (!appElement) {
        console.error("[0x1 ERROR] Could not find app element with id 'app'. Router initialization failed.");
        return;
      }
      
      try {
        // Try to load layout and page components
        console.log("[0x1 DEBUG] Loading app directory components...");
        
        // Load the layout component
        const layoutModule = await fetchComponentModule("/app/layout.js");
        const RootLayout = layoutModule?.default;
        
        if (RootLayout) {
          console.log("[0x1 DEBUG] Successfully loaded layout component");
        } else {
          console.warn("[0x1 WARN] No layout component found, will use default layout");
        }
        
        // Load the page component
        const pageModule = await fetchComponentModule("/app/page.js");
        const Page = pageModule?.default;
        
        if (Page) {
          console.log("[0x1 DEBUG] Successfully loaded page component");
        } else {
          console.warn("[0x1 WARN] No page component found, will use default page");
        }

        // Don't try to load the not-found component directly - let the router handle it
        // The router has a built-in not-found component that will be used as fallback
        const NotFound = null; // We'll let the router's built-in handler take care of this

        // Define default fallback components if needed
        const DefaultLayout = (props) => {
          const div = document.createElement("div");
          div.id = "default-layout";
          // appendChild will be called with the children content
          return div;
        };
        
        const DefaultPage = (props) => {
          const div = document.createElement("div");
          div.className = "p-8 max-w-4xl mx-auto";
          div.innerHTML = \`
            <div class="text-center">
              <h1 class="text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
                Welcome to 0x1
              </h1>
              <p class="text-xl mb-8 text-gray-800 dark:text-gray-200">
                The lightning-fast web framework powered by Bun
              </p>

              <!-- Counter Component Placeholder -->
              <div class="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Counter Component</h2>
                <div class="flex justify-center items-center gap-4">
                  <button id="decrement" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
                    -
                  </button>
                  <span id="count" class="text-2xl font-bold min-w-[3rem] text-center">0</span>
                  <button id="increment" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
                    +
                  </button>
                </div>
              </div>

              <!-- Theme Toggle Component -->
              <div class="mb-6">
                <button id="theme-toggle" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition">
                  Toggle Dark Mode
                </button>
              </div>
            </div>
          \`;
          
          // Add some interactivity to our components
          setTimeout(() => {
            const count = div.querySelector("#count");
            const increment = div.querySelector("#increment");
            const decrement = div.querySelector("#decrement");
            const themeToggle = div.querySelector("#theme-toggle");
            
            let counter = 0;
            
            if (count && increment && decrement) {
              increment.addEventListener("click", () => {
                counter++;
                count.textContent = counter.toString();
              });
              
              decrement.addEventListener("click", () => {
                counter--;
                count.textContent = counter.toString();
              });
            }
            
            if (themeToggle) {
              themeToggle.addEventListener("click", () => {
                document.documentElement.classList.toggle("dark");
                
                // Save preference
                const isDark = document.documentElement.classList.contains("dark");
                localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
              });
              
              // Apply saved theme preference
              if (localStorage.getItem("darkMode") === "enabled" ||
                  (localStorage.getItem("darkMode") === null && 
                   window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                document.documentElement.classList.add("dark");
              }
            }
          }, 100);
          
          return div;
        };

        // Create the router with available components or fallbacks
        const router = createRouter({ 
          rootElement: appElement,
          mode: "history",
          debug: true,
          rootLayout: RootLayout || DefaultLayout,
          notFoundComponent: NotFound || null
        });

        // Register the home route with proper component
        router.addRoute("/", Page || DefaultPage);

        console.log("[0x1 DEBUG] Router created, starting initialization");
        
        // Initialize the router
        router.init();
        console.log("[0x1] Router initialized successfully");
        
        // Apply initial styles for dark mode
        const style = document.createElement("style");
        style.textContent = \`
          .dark { color-scheme: dark; }
          .dark body { background-color: #1a1a1a; color: #ffffff; }
        \`;
        document.head.appendChild(style);
        
        // Add navigation event handlers for client-side routing
        document.addEventListener("click", (e) => {
          const target = e.target.closest("a");
          if (target && target.href && target.href.startsWith(window.location.origin) && !target.getAttribute("download") && !target.getAttribute("target")) {
            e.preventDefault();
            const url = new URL(target.href);
            const path = url.pathname;
            // Only use client-side navigation for internal routes
            if (path && !path.includes(".")) {
              history.pushState({}, "", path);
              router.navigate(path);
            } else {
              window.location.href = target.href;
            }
          }
        });
        
        // Handle browser back/forward navigation
        window.addEventListener("popstate", () => {
          router.navigate(window.location.pathname);
        });
      } catch (err) {
        console.error("[0x1 ERROR] Router initialization failed:", err);
        appElement.innerHTML = \`<div class="p-8 text-center"><h1 class="text-2xl font-bold text-red-600 mb-4">Page Not Found</h1><p class="mb-6">The requested page could not be found.</p><a href="/" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Go Home</a></div>\`;
      }
    }

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initApp);
    } else {
      initApp();
    }
  </script>`;

const BODY_END = '\n</body>\n</html>';

// CSS handling for global styles and component-level CSS is now included in the HEAD_SECTION

// Combine all the template parts to create the full HTML
const INDEX_HTML_TEMPLATE = HEAD_SECTION + IMPORT_MAP + STYLES + BODY_START + APP_SCRIPT + BODY_END;

/**
 * Path to the live reload script file
 * Use the distribution version to ensure we get the compiled script
 */
const liveReloadScriptPath = join(frameworkDistPath, 'browser', 'live-reload.js');

/**
 * Fallback to source path if dist version doesn't exist
 */
const liveReloadSourcePath = join(frameworkPath, 'src', 'browser', 'live-reload.js');

/**
 * Fallback live reload script content in case the file can't be loaded
 */
const FALLBACK_LIVE_RELOAD_SCRIPT = `
// 0x1 Live Reload Client (Fallback Version)
(function() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  let socket;
  let reconnectAttempts = 0;
  
  function connect() {
    // Always use the specific WebSocket endpoint for live reload
    const wsUrl = wsProtocol + '//' + wsHost + '/__0x1_ws_live_reload';
    console.log('[0x1] Connecting to live reload server at', wsUrl);
    
    try {
      socket = new WebSocket(wsUrl);
      
      socket.addEventListener('open', () => {
        console.log('[0x1] Live reload connected');
        reconnectAttempts = 0;
        
        // Send initial hello message
        socket.send(JSON.stringify({
          type: 'hello',
          timestamp: Date.now()
        }));
      });
      
      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'reload') {
            console.log('[0x1] Changes detected, reloading page...');
            window.location.reload();
          } else if (message.type === 'css-update') {
            console.log('[0x1] CSS changes detected, refreshing styles without reload');
            refreshCSS();
          }
        } catch (e) {
          console.log('[0x1] Live reload message received:', event.data);
        }
      });
      
      socket.addEventListener('error', (event) => {
        console.log('[0x1] Live reload connection error');
      });
      
      socket.addEventListener('close', () => {
        console.log('[0x1] Live reload disconnected');
        
        // Use exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
        reconnectAttempts++;
        
        setTimeout(connect, delay);
      });
    } catch (err) {
      console.error('[0x1] Error establishing WebSocket connection:', err);
      setTimeout(connect, 2000);
    }
  }
  
  // Simple CSS refresh function
  function refreshCSS() {
    const links = document.getElementsByTagName('link');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.rel === 'stylesheet') {
        const href = link.href.split('?')[0];
        link.href = href + (href.includes('?') ? '&' : '?') + '_0x1_reload=' + Date.now();
      }
    }
  }

  // Try SSE first, if available
  if ('EventSource' in window) {
    try {
      const eventSource = new EventSource('/__0x1_live_reload');
      
      eventSource.addEventListener('open', () => {
        console.log('[0x1] Live reload connected via SSE');
      });
      
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            console.log('[0x1] Changes detected, reloading page...');
            window.location.reload();
          }
        } catch (e) {
          console.log('[0x1] Error parsing SSE message:', e);
        }
      });
      
      eventSource.addEventListener('error', () => {
        console.log('[0x1] SSE connection error, falling back to WebSocket');
        eventSource.close();
        connect(); // Fall back to WebSocket
      });
    } catch (err) {
      console.log('[0x1] SSE not supported, using WebSocket');
      connect();
    }
  } else {
    console.log('[0x1] SSE not supported, using WebSocket');
    connect();
  }
})();
`;

/**
 * Interface for a Server-Sent Events client
 */
interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  lastActive: number;
}

/**
 * Create a standalone server for development
 */
/**
 * Loads the default HTML template page from the file system
 */
function loadDefaultHtmlTemplate(cssImports: string[] = []): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templatePath = join(__dirname, "default-page.html");
  
  try {
    let template = readFileSync(templatePath, "utf-8");
    
    // Replace CSS_IMPORTS placeholder with actual CSS imports
    if (cssImports.length > 0) {
      const cssImportTags = cssImports.map(css => 
        `<link rel="stylesheet" href="${css}">`
      ).join('\n    ');
      template = template.replace("<!-- CSS_IMPORTS -->", cssImportTags);
    }
    
    return template;
  } catch (error) {
    logger.error(`Error loading default HTML template: ${error}`);
    return `<!DOCTYPE html>
<html>
<head><title>0x1 Framework</title></head>
<body><h1>Error loading template</h1></body>
</html>`;
  }
}

/**
 * Prepares HTML content with injected app component
 */
function prepareHtml(htmlTemplate: string, appContent: string): string {
  // Replace APP_PLACEHOLDER with the actual app content
  return htmlTemplate.replace("<!-- APP_PLACEHOLDER -->", appContent);
}

export function createStandaloneServer({
  port,
  host,
  projectPath,
}: {
  port: number;
  host: string;
  projectPath: string;
}): Server {
  // Hold a set of connected WebSocket clients
  const sockets = new Set<ServerWebSocket<{ connectionId: string }>>();
  
  // Hold a map of connected SSE clients
  const sseClients = new Map<string, SSEClient>();
  
  // WebSocket type for live reload
  type LiveReloadSocket = ServerWebSocket<{ connectionId: string }>;
  
  /**
   * Broadcast a message to all connected clients
   */
  function broadcast(type: 'reload' | 'css', path?: string) {
    logger.debug(`Broadcasting ${type} to ${sockets.size} WebSocket clients and ${sseClients.size} SSE clients`);
    
    // Message for WebSocket clients
    const wsMessage = JSON.stringify({
      type,
      path,
      timestamp: Date.now()
    });
    
    // Message type for SSE clients (use simpler naming)
    const sseMessage = type;

    // Broadcast to WebSocket clients
    for (const socket of sockets) {
      try {
        socket.send(wsMessage);
      } catch (err) {
        logger.error(`Failed to send message to WebSocket ${socket.data.connectionId}: ${err}`);
        // Socket might be in a bad state, try to close it
        try {
          socket.close();
        } catch (closeErr) {
          // Just log and continue
          logger.error(`Failed to close problematic WebSocket: ${closeErr}`);
        }
        sockets.delete(socket);
      }
    }

    // Broadcast to SSE clients
    for (const [id, client] of sseClients.entries()) {
      try {
        const encoder = new TextEncoder();
        const eventType = type === 'css' ? 'css-update' : 'update';
        const eventData = JSON.stringify({ type: sseMessage, path, timestamp: Date.now() });
        const data = `event: ${eventType}\ndata: ${eventData}\n\n`;
        client.controller.enqueue(encoder.encode(data));
        client.lastActive = Date.now();
      } catch (err) {
        logger.error(`Failed to send message to SSE client ${id}: ${err}`);
        // Client might be disconnected, remove it from the map
        sseClients.delete(id);
      }
    }
  }

  // Define WebSocket message handler
  function message(ws: LiveReloadSocket, message: string | Uint8Array) {
    try {
      if (typeof message === 'string') {
        logger.debug(`WebSocket message received: ${message}`);
        const data = JSON.parse(message);

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          logger.debug('Sent pong response');
        } else if (data.type === 'hello') {
          // Send welcome message with connection information
          ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Connected to 0x1 dev server',
            timestamp: Date.now(),
            connectionId: ws.data.connectionId
          }));
          logger.debug(`Sent welcome message to client ${ws.data.connectionId}`);
        }
      }
    } catch (err) {
      logger.error(`Error handling WebSocket message: ${err}`);
      // Try to send error message to client
      try {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Server encountered an error processing your message',
          timestamp: Date.now()
        }));
      } catch (sendErr) {
        logger.error(`Failed to send error response: ${sendErr}`);
      }
    }
  }

  // Define WebSocket close handler
  function close(ws: LiveReloadSocket) {
    logger.info(`[0x1] WebSocket client disconnected (${ws.data.connectionId})`);
    sockets.delete(ws);
  }

  // Define WebSocket open handler
  function open(ws: LiveReloadSocket) {
    // Generate a unique connection ID
    ws.data.connectionId = `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    logger.info(`[0x1] WebSocket client connected (${ws.data.connectionId})`);
    sockets.add(ws);

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: Date.now(),
      connectionId: ws.data.connectionId
    }));
  }

  // Create and return the server
  return serve({
    // WebSocket handling for the live reload endpoint
    websocket: {
      message,
      open,
      close
    },
    port,
    hostname: host,
    // Set the maximum allowed idle timeout (in seconds)
    idleTimeout: 255,
    development: true,

    // Main request handler
    async fetch(req: Request) {
      const url = new URL(req.url);
      const reqPath = url.pathname;
      
      // Log request status with color-coded output
      const logRequestStatus = (status: number, path: string, extraInfo?: string) => {
        const statusText = status >= 200 && status < 300 ? "OK" : status >= 300 && status < 400 ? "Redirect" : "Error";
        const emoji = status >= 200 && status < 300 ? "✅" : status >= 300 && status < 400 ? "↪️" : "❌";
        const message = `${emoji} ${status} ${statusText}: ${path}${extraInfo ? ` (${extraInfo})` : ''}`;
        if (status >= 200 && status < 300) {
          logger.info(message);
        } else if (status >= 300 && status < 400) {
          logger.warn(message);
        } else {
          logger.error(message);
        }
      };
      
      // More detailed debug logging for all requests
      if (process.env.DEBUG) {
        logger.debug(`Request for: ${reqPath} (${req.method})`);
      }
      
      // Handle WebSocket upgrade requests specifically for our endpoint
      if (reqPath === "/__0x1_ws_live_reload" && req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
        logger.info("🔄 WebSocket upgrade request for live reload endpoint");
        // Let Bun's websocket handler process this request
        // We return undefined to allow Bun's internal upgrade handling to take over
        return undefined;
      }
      
      // Handle app component requests (layout.js, page.js, etc.)
      if (reqPath.endsWith('.js') && (
        reqPath.includes('/app/layout.js') ||
        reqPath.includes('/app/page.js') ||
        reqPath.includes('/app/not-found.js') ||
        reqPath.includes('/app/error.js')
      )) {
        // Extract the component name from the path for logging
        const componentNameFromPath = reqPath.split('/').pop()?.split('.')[0] || 'unknown';
        
        // Create component type name with proper capitalization
        const componentType = componentNameFromPath.charAt(0).toUpperCase() + componentNameFromPath.slice(1);
        
        // Generate a clean, minimal component implementation
        let jsxComponent = `
// 0x1 ${componentNameFromPath} component

export default function ${componentType}(props) {
`;
        
        // Add appropriate implementation based on component type
        if (componentNameFromPath === 'layout') {
          jsxComponent += `  // Create a direct DOM element instead of JSX
  const element = document.createElement('div');
  element.id = 'root-layout';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.minHeight = '100vh';
  element.style.backgroundColor = '#f5f5f5';
  element.style.padding = '20px';

  // Create header
  const header = document.createElement('header');
  header.style.backgroundColor = '#ffffff';
  header.style.padding = '15px';
  header.style.marginBottom = '20px';
  header.style.borderRadius = '8px';
  header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  const headerTitle = document.createElement('h1');
  headerTitle.textContent = '0x1 Framework';
  headerTitle.style.margin = '0';
  headerTitle.style.fontSize = '24px';
  headerTitle.style.fontWeight = 'bold';
  headerTitle.style.color = '#4f46e5';
  
  header.appendChild(headerTitle);
  element.appendChild(header);

  // Main content container
  const main = document.createElement('main');
  main.style.flex = '1';
  main.style.backgroundColor = '#ffffff';
  main.style.padding = '20px';
  main.style.borderRadius = '8px';
  main.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  // Add a placeholder if no children
  const mainContent = document.createElement('div');
  mainContent.id = 'children-container';
  
  main.appendChild(mainContent);
  element.appendChild(main);

  // Footer
  const footer = document.createElement('footer');
  footer.style.backgroundColor = '#ffffff';
  footer.style.padding = '15px';
  footer.style.marginTop = '20px';
  footer.style.borderRadius = '8px';
  footer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  footer.style.textAlign = 'center';
  footer.innerHTML = '<p style="margin: 0; color: #6b7280; font-size: 14px;">&copy; ' + new Date().getFullYear() + ' 0x1 Framework</p>';
  
  element.appendChild(footer);

  // Handle children if they exist
  setTimeout(() => {
    try {
      const childrenContainer = document.getElementById('children-container');
      if (childrenContainer && props.children) {
        // Clear placeholder content
        childrenContainer.innerHTML = '';
        
        if (typeof props.children === 'string') {
          childrenContainer.innerHTML = props.children;
        } else if (props.children instanceof Node) {
          childrenContainer.appendChild(props.children);
        }
      }
    } catch (err) {
      console.error('Error rendering children in layout:', err);
    }
  }, 0);
  
  return element;
`;
        } else if (componentNameFromPath === 'page') {
          jsxComponent += `  // Create page component
  const container = document.createElement('div');
  container.className = 'p-8 max-w-4xl mx-auto';
  
  // Add title
  const title = document.createElement('h1');
  title.className = 'text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400';
  title.textContent = 'Welcome to 0x1';
  container.appendChild(title);
  
  // Add subtitle
  const subtitle = document.createElement('p');
  subtitle.className = 'text-xl mb-8 text-gray-800 dark:text-gray-200';
  subtitle.textContent = 'The lightning-fast web framework powered by Bun';
  container.appendChild(subtitle);
  
  // Add counter demo
  const card = document.createElement('div');
  card.className = 'mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md';
  
  const cardTitle = document.createElement('h2');
  cardTitle.className = 'text-2xl font-semibold mb-4';
  cardTitle.textContent = 'Getting Started';
  card.appendChild(cardTitle);
  
  const cardText = document.createElement('p');
  cardText.className = 'mb-4';
  cardText.textContent = 'Edit app/page.tsx to customize this page';
  card.appendChild(cardText);
  
  // Counter component
  const counter = document.createElement('div');
  counter.className = 'flex justify-center items-center gap-4 mt-4';
  
  const decrementBtn = document.createElement('button');
  decrementBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition';
  decrementBtn.textContent = '-';
  
  const countDisplay = document.createElement('span');
  countDisplay.className = 'text-2xl font-bold min-w-[3rem] text-center';
  countDisplay.textContent = '0';
  
  const incrementBtn = document.createElement('button');
  incrementBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition';
  incrementBtn.textContent = '+';
  
  counter.append(decrementBtn, countDisplay, incrementBtn);
  
  // Add counter functionality
  let count = 0;
  decrementBtn.addEventListener('click', () => {
    count--;
    countDisplay.textContent = count.toString();
  });
  
  incrementBtn.addEventListener('click', () => {
    count++;
    countDisplay.textContent = count.toString();
  });
  
  card.appendChild(counter);
  container.appendChild(card);
  
  return container;
`;
        } else if (componentNameFromPath === 'not-found') {
          jsxComponent += `  // Create a simple not-found component that will definitely parse correctly
  const container = document.createElement('div');
  container.style.padding = '2rem';
  container.style.textAlign = 'center';
  container.style.maxWidth = '600px';
  container.style.margin = '0 auto';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.minHeight = '70vh';
  
  const errorCode = document.createElement('h1');
  errorCode.style.fontSize = '4rem';
  errorCode.style.fontWeight = 'bold';
  errorCode.style.marginBottom = '1rem';
  errorCode.style.color = '#4b5563';
  errorCode.textContent = '404';
  container.appendChild(errorCode);
  
  const title = document.createElement('h2');
  title.style.fontSize = '1.5rem';
  title.style.fontWeight = '600';
  title.style.marginBottom = '1.5rem';
  title.style.color = '#374151';
  title.textContent = 'Page Not Found';
  container.appendChild(title);
  
  const text = document.createElement('p');
  text.style.marginBottom = '2rem';
  text.style.color = '#6b7280';
  text.textContent = 'The page you are looking for does not exist or has been moved.';
  container.appendChild(text);
  
  const link = document.createElement('a');
  link.href = '/';
  link.style.backgroundColor = '#3b82f6';
  link.style.color = 'white';
  link.style.padding = '0.5rem 1rem';
  link.style.borderRadius = '0.25rem';
  link.style.textDecoration = 'none';
  link.textContent = 'Back to Home';
  container.appendChild(link);
  
  return container;
`;
        } else if (componentNameFromPath === 'error') {
          jsxComponent += `  // Create error component
  const container = document.createElement('div');
  container.className = 'p-8 max-w-4xl mx-auto bg-red-50 rounded-lg';
  
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold text-red-600 mb-4 text-center';
  title.textContent = 'Something went wrong';
  container.appendChild(title);
  
  // Add error message
  const message = document.createElement('p');
  message.className = 'text-gray-700 mb-4';
  message.textContent = props.error || 'An unexpected error occurred';
  container.appendChild(message);
  
  // Add back button
  const backButton = document.createElement('a');
  backButton.href = '/';
  backButton.className = 'inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
  backButton.textContent = 'Back to Home';
  container.appendChild(backButton);
  
  return container;
`;
        }
        
        // Check if there's a corresponding component file in the app directory
        const possibleComponentPaths = [
          join(projectPath, reqPath.replace('.js', '.tsx')),
          join(projectPath, reqPath.replace('.js', '.jsx')),
          join(projectPath, reqPath.replace('.js', '.ts')),
          join(projectPath, reqPath.replace('.js', '.js'))
        ];
        
        // Check if any of the possible component paths exist
        const componentPath = possibleComponentPaths.find(path => existsSync(path)) || null;
        
        // Complete the component definition
        jsxComponent += '}';
        
        // Log component being served with pretty formatting
        let sourcePath = ' (generated stub)';
        if (componentPath !== null && typeof componentPath === 'string') {
          sourcePath = ` from ${componentPath.replace(projectPath, '')}`;
        }
        logRequestStatus(200, reqPath, `${componentType} component${sourcePath}`);
        
        // Return the complete component code
        return new Response(jsxComponent, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Handle live reload script
      if (reqPath === "/__0x1_live_reload.js") {
        logger.debug("Serving live reload script");
        
        // Try to read the script from the distribution directory first
        try {
          // Check if distribution version exists
          if (existsSync(liveReloadScriptPath)) {
            const scriptContent = readFileSync(liveReloadScriptPath, 'utf-8');
            logger.debug(`Found live reload script at ${liveReloadScriptPath}, serving with JavaScript MIME type`);
            
            // Always serve with JavaScript MIME type
            return new Response(scriptContent, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8"
              }
            });
          } else {
            // Fallback to source path if distribution version doesn't exist
            logger.debug(`Distribution version not found, checking source path: ${liveReloadSourcePath}`);
            
            if (existsSync(liveReloadSourcePath)) {
              const scriptContent = readFileSync(liveReloadSourcePath, 'utf-8');
              logger.debug(`Found live reload script at ${liveReloadSourcePath}, serving with JavaScript MIME type`);
              
              // Always serve with JavaScript MIME type
              return new Response(scriptContent, {
                status: 200,
                headers: {
                  "Content-Type": "application/javascript; charset=utf-8"
                }
              });
            }
          }
        } catch (err) {
          logger.warn(`Error reading live reload script: ${err}, using fallback`);
        }
        
        // Fallback to the inline version
        return new Response(FALLBACK_LIVE_RELOAD_SCRIPT, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8"
          }
        });
      }
      
      // Handle Server-Sent Events endpoint for live reload
      if (reqPath === "/__0x1_live_reload") {
        logger.debug(`SSE connection request received`);
        
        // Create a unique ID for this client
        const clientId = `sse-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        logger.info(`[0x1] SSE client connecting (${clientId})`);
        
        // Create a new stream for this SSE connection
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Keep track of this client's controller
            sseClients.set(clientId, {
              id: clientId,
              controller,
              lastActive: Date.now()
            });
            
            // Send initial connection event immediately
            controller.enqueue(encoder.encode(`:ok\n\n`)); // Initial comment to establish connection
            controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ 
              timestamp: Date.now(),
              connectionId: clientId,
              message: 'Connected to 0x1 dev server via SSE'
            })}\n\n`));
            
            // Set up more frequent keep-alive to prevent timeouts
            const keepAliveInterval = setInterval(() => {
              try {
                // Send ping every 15s to keep the connection alive (better for mobile/proxy environments)
                controller.enqueue(encoder.encode(`:ping\n\n`)); // Comment ping for low overhead
                controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify({ 
                  timestamp: Date.now(),
                  connectionId: clientId 
                })}\n\n`));
                
                // Update last active time
                const client = sseClients.get(clientId);
                if (client) {
                  client.lastActive = Date.now();
                }
              } catch (err) {
                logger.debug(`Error sending ping to SSE client ${clientId}: ${err}`);
                clearInterval(keepAliveInterval);
                sseClients.delete(clientId);
              }
            }, 15000);
            
            // Clean up on close
            req.signal.addEventListener('abort', () => {
              logger.debug(`SSE connection closed for client ${clientId}`);
              clearInterval(keepAliveInterval);
              sseClients.delete(clientId);
            });
          }
        });
        
        return new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
            'Keep-Alive': 'timeout=120' // Explicitly set keep-alive timeout
          }
        });
      }
      
      // Handle ping requests from client heartbeats
      if (reqPath === "/__0x1_ping") {
        // Log every 20th ping to avoid excessive logging
        const pingCounter = Math.floor(Math.random() * 20);
        if (pingCounter === 0) {
          logger.debug(`🏓 Ping from client`);
        }
        
        return new Response(null, {
          status: 204, // No Content
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Handle router module requests
      if (reqPath === "/0x1/router.js" || reqPath.startsWith("/0x1/router.js?")) {
        logger.debug("Serving router module");
        
        // Prioritized list of possible router paths
        const routerPaths = [
          // Framework dist paths (primary)
          join(frameworkDistPath, "core", "router.js"),
          join(frameworkDistPath, "0x1", "router.js"),
          join(frameworkDistPath, "router.js"),
          // Project paths (if locally linked)
          join(projectPath, "node_modules", "0x1", "dist", "core", "router.js"),
          join(projectPath, "node_modules", "0x1", "dist", "0x1", "router.js"),
          join(projectPath, "node_modules", "0x1", "dist", "router.js"),
        ];
        
        logger.debug("Checking for router module in the following paths:");
        for (const path of routerPaths) {
          const exists = existsSync(path);
          logger.debug(`- ${path} (${exists ? 'exists' : 'not found'})`);
          
          if (exists) {
            try {
              const content = readFileSync(path, "utf-8");
              logRequestStatus(200, reqPath, `Router from ${path}`);
              
              // Always serve with JavaScript MIME type
              return new Response(content, {
                status: 200,
                headers: {
                  "Content-Type": "application/javascript; charset=utf-8",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "X-Content-Type-Options": "nosniff"
                }
              });
            } catch (err) {
              logger.error(`Error reading router from ${path}: ${err}`);
            }
          }
        }
        
        // If router not found, return a meaningful error that works with error-boundary
        logRequestStatus(404, reqPath, "Router module not found");
        return new Response(`
          console.error('[0x1] CRITICAL ERROR: Router module not found');
          console.error('[0x1] Check your installation or rebuild the framework');
          
          // This will be caught by the error boundary in the app
          export function createRouter(config) {
            throw new Error('[0x1] Router module not found - Please rebuild the framework with \'bun run build\'');
          }
        `, {
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Content-Type-Options": "nosniff"
          }
        });
      }
      
      // Serve other 0x1 framework modules
      if (reqPath.startsWith("/0x1/") || reqPath.startsWith("/node_modules/0x1/")) {
        const moduleName = reqPath.replace(/^\/(?:0x1|node_modules\/0x1)\//, "").split('?')[0]; // Remove prefix and query params
        logger.debug(`Framework module requested: ${moduleName}`);
        
        const modulePaths = [
          // Framework dist paths
          join(frameworkDistPath, "core", moduleName),
          join(frameworkDistPath, "0x1", moduleName),
          join(frameworkDistPath, moduleName),
          // Project paths
          join(projectPath, "node_modules", "0x1", "dist", "core", moduleName),
          join(projectPath, "node_modules", "0x1", "dist", "0x1", moduleName),
          join(projectPath, "node_modules", "0x1", "dist", moduleName),
        ];
        
        for (const path of modulePaths) {
          if (existsSync(path)) {
            const content = readFileSync(path, "utf-8");
            const mimeType = getMimeType(path);
            
            logRequestStatus(200, reqPath, `Module from ${path}`);
            
            return new Response(content, {
              status: 200,
              headers: {
                "Content-Type": mimeType,
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
        }
        
        return new Response(`console.error('[0x1] Module not found: ${moduleName}');`, {
          status: 404,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8"
          }
        });
      }
      
      // Serve root path
      if (reqPath === "/") {
        logger.debug("Serving root HTML");
        
        return new Response(INDEX_HTML_TEMPLATE, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Handle CSS module JS mapping requests (for importing CSS modules in components)
      if (isCssModuleJsRequest(reqPath)) {
        const cssModuleScriptResult = generateCssModuleScript(reqPath, projectPath);
        if (cssModuleScriptResult) {
          logger.info(`200 ${reqPath} (CSS Module JS Mapping)`);
          return new Response(cssModuleScriptResult.content, {
            status: 200,
            headers: {
              "Content-Type": cssModuleScriptResult.contentType,
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }
      
      // Special handling for CSS files
      if (reqPath === "/styles.css" || reqPath.endsWith(".css")) {
        // For module.css files, process them with scoped classnames
        if (reqPath.includes(".module.css")) {
          const cssResult = processCssFile(reqPath.slice(1), projectPath); // Remove leading /
          if (cssResult) {
            logger.info(`200 ${reqPath} (CSS Module)`);
            return new Response(cssResult.content, {
              status: 200,
              headers: {
                "Content-Type": cssResult.contentType,
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
        }
        
        // Prioritized list of possible CSS paths
        let possibleCSSPaths = [];
        
        if (reqPath === "/styles.css") {
          possibleCSSPaths = [
            join(projectPath, "public", "styles.css"),
            join(projectPath, "styles.css"),
            join(projectPath, "public", "styles", "tailwind.css"),
            join(projectPath, "styles", "tailwind.css")
          ];
        } else if (reqPath === "/public/styles.css") {
          possibleCSSPaths = [
            join(projectPath, "public", "styles.css"),
            join(projectPath, "styles.css")
          ];
        } else if (reqPath === "/public/styles/tailwind.css") {
          possibleCSSPaths = [
            join(projectPath, "public", "styles", "tailwind.css"),
            join(projectPath, "styles", "tailwind.css"),
            join(projectPath, "public", "styles.css"),
            join(projectPath, "styles.css")
          ];
        } else {
          // Handle any other CSS file
          const relativePath = reqPath.startsWith("/") ? reqPath.slice(1) : reqPath;
          possibleCSSPaths = [
            join(projectPath, relativePath),
            join(projectPath, "public", relativePath)
          ];
        }
        
        logger.debug(`Looking for CSS file: ${reqPath}`);
        logger.debug(`Checking paths: ${possibleCSSPaths.join(", ")}`);
        
        for (const cssPath of possibleCSSPaths) {
          if (existsSync(cssPath)) {
            logRequestStatus(200, reqPath, `Serving from ${cssPath}`);
            const content = readFileSync(cssPath);
            return new Response(content, {
              status: 200,
              headers: {
                "Content-Type": "text/css; charset=utf-8",
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
        }
        
        // If no CSS file found, return an empty CSS file
        logRequestStatus(204, reqPath, "Empty CSS served");
        return new Response("/* Empty CSS file */", {
          status: 200,
          headers: {
            "Content-Type": "text/css; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Handle favicon
      if (reqPath === "/favicon.ico") {
        const possibleFaviconPaths = [
          join(projectPath, "public", "favicon.ico"),
          join(projectPath, "favicon.ico")
        ];
        
        for (const faviconPath of possibleFaviconPaths) {
          if (existsSync(faviconPath)) {
            logger.debug(`Serving favicon from: ${faviconPath}`);
            const content = readFileSync(faviconPath);
            return new Response(content, {
              status: 200,
              headers: {
                "Content-Type": "image/x-icon",
                "Cache-Control": "public, max-age=86400"
              }
            });
          }
        }
        
        // If no favicon found, return a 204 (no content) response
        return new Response(null, { status: 204 });
      }
      
      // Serve static files from the project directory
      const filePath = join(projectPath, reqPath === "/" ? "index.html" : reqPath);
      
      if (existsSync(filePath)) {
        if (filePath.endsWith(".html")) {
          logger.debug(`Serving HTML file: ${filePath}`);
          
          // For HTML files, inject the live reload script
          const content = readFileSync(filePath, "utf-8");
          
          // Inject right before </body> if it exists, otherwise just append
          let modifiedContent = content;
          if (content.includes("</body>")) {
            modifiedContent = content.replace("</body>", `<script src="/__0x1_live_reload.js"></script>\n</body>`);
          } else {
            modifiedContent = content + `\n<script src="/__0x1_live_reload.js"></script>`;
          }
          
          return new Response(modifiedContent, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        } else {
          logRequestStatus(200, reqPath, filePath);
          // For non-HTML files, serve as-is
          const content = readFileSync(filePath);
          const mimeType = getMimeType(filePath);
          
          return new Response(content, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }
      
      // Check if this is a route in the app directory structure
      if (reqPath.startsWith("/") && !reqPath.includes(".")) {
        // Check if there's a corresponding app directory path
        const possibleAppDirPaths = [
          join(projectPath, "app", reqPath === "/" ? "page.tsx" : `${reqPath.slice(1)}/page.tsx`),
          join(projectPath, "app", reqPath === "/" ? "page.jsx" : `${reqPath.slice(1)}/page.jsx`),
          join(projectPath, "app", reqPath === "/" ? "page.js" : `${reqPath.slice(1)}/page.js`),
          join(projectPath, "app", reqPath === "/" ? "page.ts" : `${reqPath.slice(1)}/page.ts`),
          join(projectPath, "pages", reqPath === "/" ? "index.tsx" : `${reqPath.slice(1)}.tsx`),
          join(projectPath, "pages", reqPath === "/" ? "index.jsx" : `${reqPath.slice(1)}.jsx`),
          join(projectPath, "pages", reqPath === "/" ? "index.js" : `${reqPath.slice(1)}.js`),
          join(projectPath, "pages", reqPath === "/" ? "index.ts" : `${reqPath.slice(1)}.ts`)
        ];
        
        const routeExists = possibleAppDirPaths.some(path => existsSync(path));
        if (routeExists) {
          // Show which file we're using for the route
          const foundPath = possibleAppDirPaths.find(path => existsSync(path));
          logRequestStatus(200, reqPath, `Route: ${foundPath ? foundPath.replace(projectPath, '') : 'app directory route'}`);
        } else {
          // Still log the route even if we don't find a specific file
          logRequestStatus(200, reqPath, `Route: using default handler`);
        }
        
        return new Response(INDEX_HTML_TEMPLATE, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // File not found
      logRequestStatus(404, reqPath, `File not found: ${filePath}`);
      
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }
  });
}
