/**
 * Standalone development server implementation
 * This provides a simplified implementation that correctly handles MIME types
 */

import { serve, type Server, type ServerWebSocket } from "bun";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from "url";
import { logger } from "../../utils/logger.js";

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
const HEAD_SECTION = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>0x1 App</title>\n  <link rel="icon" href="/favicon.ico">\n\n  <!-- Process polyfill for browser environment -->\n  <script>\n    window.process = window.process || {\n      env: { NODE_ENV: \'development\' }\n    };\n    console.log(\'[0x1] Running in development mode\', window.location.hostname);\n  </script>\n\n  <!-- Add base styling for Tailwind classes -->\n  <style>\n    /* Base Tailwind utility classes */\n    .p-8 { padding: 2rem; }\n    .max-w-4xl { max-width: 56rem; }\n    .mx-auto { margin-left: auto; margin-right: auto; }\n    .text-center { text-align: center; }\n    .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }\n    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }\n    .font-bold { font-weight: 700; }\n    .mb-6 { margin-bottom: 1.5rem; }\n    .mb-8 { margin-bottom: 2rem; }\n    .text-indigo-600 { color: #4f46e5; }\n    .dark .dark\:text-indigo-400 { color: #818cf8; }\n    .text-gray-800 { color: #1f2937; }\n    .dark .dark\:text-gray-200 { color: #e5e7eb; }\n    .bg-white { background-color: #ffffff; }\n    .dark .dark\:bg-gray-800 { background-color: #1f2937; }\n    .rounded-lg { border-radius: 0.5rem; }\n    .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }\n    .text-2xl { font-size: 1.5rem; line-height: 2rem; }\n    .font-semibold { font-weight: 600; }\n    .mb-4 { margin-bottom: 1rem; }\n    .text-gray-900 { color: #111827; }\n    .dark .dark\:text-white { color: #ffffff; }\n    .flex { display: flex; }\n    .justify-center { justify-content: center; }\n    .items-center { align-items: center; }\n    .gap-4 { gap: 1rem; }\n    .px-4 { padding-left: 1rem; padding-right: 1rem; }\n    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }\n    .bg-red-500 { background-color: #ef4444; }\n    .text-white { color: #ffffff; }\n    .rounded { border-radius: 0.25rem; }\n    .hover\:bg-red-600:hover { background-color: #dc2626; }\n    .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }\n    .min-w-\[3rem\] { min-width: 3rem; }\n    .text-center { text-align: center; }\n    .bg-green-500 { background-color: #22c55e; }\n    .hover\:bg-green-600:hover { background-color: #16a34a; }\n    .bg-purple-500 { background-color: #a855f7; }\n    .hover\:bg-purple-600:hover { background-color: #9333ea; }\n    /* Dark mode base styles */\n    .dark { color-scheme: dark; }\n    .dark body { background-color: #111827; color: #f3f4f6; }\n  </style>';



const IMPORT_MAP = '\n\n  <script type="importmap">\n  {\n    "imports": {\n      "0x1": "/node_modules/0x1/index.js",\n      "0x1/router": "/0x1/router.js?type=module",\n      "0x1/": "/0x1/"\n    }\n  }\n  </script>';

const STYLES = '\n\n  <!-- Include any stylesheets -->\n  <link rel="stylesheet" href="/styles.css">\n  <link rel="stylesheet" href="/public/styles.css">\n  <link rel="stylesheet" href="/public/styles/tailwind.css">';

const BODY_START = '\n</head>\n<body>\n  <div id="app"></div>\n\n  <!-- Live reload script - using standardized path to avoid duplication -->\n  <script src="/__0x1_live_reload.js"></script>';

const APP_SCRIPT = '\n\n  <!-- App initialization script -->\n  <script type="module">\n    console.log("[0x1 DEBUG] Framework initializing");\n    console.log("[0x1 DEBUG] Auto-discovery enabled, loading components from app directory");\n    console.log("[0x1 DEBUG] About to import router module from: 0x1/router");\n\n    // Import the router and create a router instance\n    import { createRouter } from "0x1/router";\n    \n    console.log("[0x1 DEBUG] Router module loaded successfully");\n    console.log("[0x1 DEBUG] Creating router instance with auto-discovery");\n\n    // Function to initialize app\n    async function initApp() {\n      // Get the app element\n      const appElement = document.getElementById("app");\n      \n      if (!appElement) {\n        console.error("[0x1 ERROR] Could not find app element with id \'app\'. Router initialization failed.");\n        return;\n      }\n      \n      try {\n        // Define a simple page component for the root route with inline styling\n        const HomePage = (props) => {\n          const div = document.createElement("div");\n          div.className = "p-8 max-w-4xl mx-auto";\n          div.innerHTML = `\n            <div class="text-center">\n              <h1 class="text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">\n                Welcome to 0x1\n              </h1>\n              <p class="text-xl mb-8 text-gray-800 dark:text-gray-200">\n                The lightning-fast web framework powered by Bun\n              </p>\n\n              <!-- Counter Component Placeholder -->\n              <div class="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">\n                <h2 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Counter Component</h2>\n                <div class="flex justify-center items-center gap-4">\n                  <button id="decrement" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">\n                    -\n                  </button>\n                  <span id="count" class="text-2xl font-bold min-w-[3rem] text-center">0</span>\n                  <button id="increment" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">\n                    +\n                  </button>\n                </div>\n              </div>\n\n              <!-- Theme Toggle Component -->\n              <div class="mb-6">\n                <button id="theme-toggle" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition">\n                  Toggle Dark Mode\n                </button>\n              </div>\n            </div>\n          `;\n          \n          // Add some interactivity to our components\n          setTimeout(() => {\n            const count = div.querySelector("#count");\n            const increment = div.querySelector("#increment");\n            const decrement = div.querySelector("#decrement");\n            const themeToggle = div.querySelector("#theme-toggle");\n            \n            let counter = 0;\n            \n            if (count && increment && decrement) {\n              increment.addEventListener("click", () => {\n                counter++;\n                count.textContent = counter.toString();\n              });\n              \n              decrement.addEventListener("click", () => {\n                counter--;\n                count.textContent = counter.toString();\n              });\n            }\n            \n            if (themeToggle) {\n              themeToggle.addEventListener("click", () => {\n                document.documentElement.classList.toggle("dark");\n                \n                // Save preference\n                const isDark = document.documentElement.classList.contains("dark");\n                localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");\n              });\n              \n              // Apply saved theme preference\n              if (localStorage.getItem("darkMode") === "enabled" ||\n                  (localStorage.getItem("darkMode") === null && \n                   window.matchMedia("(prefers-color-scheme: dark)").matches)) {\n                document.documentElement.classList.add("dark");\n              }\n            }\n          }, 100);\n          \n          return div;\n        };\n\n        // Create a router with the home component\n        const router = createRouter({ \n          rootElement: appElement,\n          mode: "history",\n          debug: true\n        });\n\n        // Register the home route explicitly\n        router.addRoute("/", HomePage);\n\n        console.log("[0x1 DEBUG] Router created, starting initialization");\n        \n        // Initialize the router\n        router.init();\n        console.log("[0x1] Router initialized successfully");\n        \n        // Apply initial styles for dark mode\n        const style = document.createElement("style");\n        style.textContent = `\n          .dark { color-scheme: dark; }\n          .dark body { background-color: #1a1a1a; color: #ffffff; }\n        `;\n        document.head.appendChild(style);\n        \n        // Add navigation event handlers for client-side routing\n        document.addEventListener("click", (e) => {\n          const target = e.target.closest("a");\n          if (target && target.href && target.href.startsWith(window.location.origin) && !target.getAttribute("download") && !target.getAttribute("target")) {\n            e.preventDefault();\n            const url = new URL(target.href);\n            const path = url.pathname;\n            // Only use client-side navigation for internal routes\n            if (path && !path.includes(".")) {\n              history.pushState({}, "", path);\n              router.navigate(path);\n            } else {\n              window.location.href = target.href;\n            }\n          }\n        });\n        \n        // Handle browser back/forward navigation\n        window.addEventListener("popstate", () => {\n          router.navigate(window.location.pathname);\n        });\n      } catch (err) {\n        console.error("[0x1 ERROR] Router initialization failed:", err);\n        appElement.innerHTML = `<div class="p-8 text-center"><h1 class="text-2xl font-bold text-red-600 mb-4">Page Not Found</h1><p class="mb-6">The requested page could not be found.</p><a href="/" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Go Home</a></div>`;\n      }\n    }\n\n    // Initialize when DOM is ready\n    if (document.readyState === "loading") {\n      document.addEventListener("DOMContentLoaded", initApp);\n    } else {\n      initApp();\n    }\n  </script>';

const BODY_END = '\n</body>\n</html>';

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
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Special handling for CSS files
      if (reqPath === "/styles.css" || reqPath.endsWith(".css")) {
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
          logger.debug(`Found route file for path ${reqPath}, serving HTML for client-side routing`);
        } else {
          logger.debug(`No route file found for ${reqPath}, but serving HTML for client-side routing anyway`);
        }
        
        return new Response(INDEX_HTML_TEMPLATE, {
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
