/**
 * 0x1 Framework - Consolidated Development Server
 * 
 * This server provides enhanced features including:
 * - Proper MIME type handling
 * - Live reload via WebSocket and EventSource
 * - Component transpilation with error handling
 * - Static file serving with caching
 * - Enhanced error messages in development
 */

import { serve, type Server, type ServerWebSocket } from 'bun';
import { existsSync, mkdirSync, readFileSync, watch } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { tailwindV4Handler } from '../commands/utils/server/tailwind-v4';
import { logger } from '../utils/logger';
import { processTailwindCss, stopTailwindProcess } from './handlers/tailwind-handler';

// Import handlers and middleware
import { handleComponentRequest } from './handlers/component-handler';
import { generateCssModuleScript, isCssModuleJsRequest, processCssFile } from './handlers/css-handler';
import { notFoundHandler } from './middleware/error-boundary';
import { getMimeType, serveStaticFile } from './middleware/static-files';

// Import template functions for proper app initialization
import { injectJsxRuntime } from '../commands/utils/jsx-templates';
import { composeHtmlTemplate, generateLandingPage } from '../commands/utils/server/templates';

// Path resolution helpers
const currentFilePath = fileURLToPath(import.meta.url);

// Calculate the absolute path to the framework root
// src/cli/server/ -> go up 3 levels to reach framework root
const frameworkPath = process.cwd().includes('00-Dev/0x1') 
  ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
  : resolve(dirname(currentFilePath), '../../../');

const frameworkDistPath = resolve(frameworkPath, "dist");
const frameworkCorePath = join(frameworkDistPath, "core");

/**
 * Interface for development server options
 */
interface DevServerOptions {
  port: number;
  host: string;
  projectPath: string;
  debug?: boolean;
  ignorePatterns?: string[];
  liveReload?: boolean;
  open?: boolean;
}

// WebSocket type for live reload
interface LiveReloadSocket extends ServerWebSocket<any> {
  data: {
    connectionId: string;
    clientType?: string;
  };
}

/**
 * Helper function to locate a file across multiple possible locations
 */
function locateFile(filename: string): string | null {
  // Define standard locations to check in priority order with absolute paths
  const possibleLocations = [
    join(dirname(currentFilePath), filename),                  // Current directory
    join(frameworkPath, 'src', 'cli', 'server', filename),     // Server directory
    join(frameworkPath, 'src', 'cli', 'commands', 'utils', filename), // Source tree utils
    join(frameworkPath, 'dist', filename),                     // Dist root
    join(frameworkPath, 'dist', 'browser', filename)           // Browser dist
  ];
  
  // Try each location
  for (const path of possibleLocations) {
    if (existsSync(path)) {
      logger.debug(`Found file at: ${path}`);
      return path;
    }
  }
  
  // Not found anywhere
  logger.debug(`File not found: ${filename}`);
  return null;
}

/**
 * Detect favicon in multiple locations and formats
 */
function detectFavicon(projectPath: string): { path: string; format: string; location: string } | null {
  // Define formats and locations to check
  const formats = [".ico", ".svg", ".png"];
  const locations = ["public", "app"];
  
  // Track all found favicons
  const foundFavicons: Array<{ path: string; format: string; location: string }> = [];
  
  // Check all combinations
  for (const location of locations) {
    for (const format of formats) {
      const faviconName = format === ".ico" ? "favicon.ico" : `favicon${format}`;
      const faviconPath = join(projectPath, location, faviconName);
      
      if (existsSync(faviconPath)) {
        foundFavicons.push({ 
          path: faviconPath, 
          format: format.substring(1),  // Remove the dot
          location 
        });
      }
    }
  }
  
  // Also check for src/public which is used by the framework itself
  const frameworkFaviconPath = join(frameworkPath, "src", "public", "favicon.ico");
  if (existsSync(frameworkFaviconPath)) {
    foundFavicons.push({ 
      path: frameworkFaviconPath, 
      format: "ico",
      location: "framework" 
    });
  }
  
  if (foundFavicons.length === 0) {
    return null;
  }
  
  // If multiple favicons found, log a warning
  if (foundFavicons.length > 1) {
    logger.warn(`Multiple favicons detected: ${foundFavicons.map(f => `${f.location}/${f.format}`).join(', ')}. Using ${foundFavicons[0].location}/favicon.${foundFavicons[0].format}`);
  } else {
    logger.info(`Using favicon from ${foundFavicons[0].location}/favicon.${foundFavicons[0].format}`);
  }
  
  // Return the first one found (priority is defined by the order in locations and formats arrays)
  return foundFavicons[0];
}

/**
 * Broadcast reload message to connected WebSocket clients
 */
function broadcastReload(
  clients: Set<ServerWebSocket<unknown>>, 
  type: string = 'reload', 
  filename?: string
): void {
  const message = JSON.stringify({ type, filename });
  
  for (const client of clients) {
    try {
      client.send(message);
    } catch (error) {
      logger.error(`Failed to send reload message: ${error}`);
    }
  }
}

/**
 * Generate HTML template for index page with proper app initialization
 */
function generateIndexHtml(projectPath: string): string {
  // Check if we have an app/page.tsx or similar
  const possibleAppDirPaths = [
    join(projectPath, "app/page.tsx"),
    join(projectPath, "app/page.jsx"),
    join(projectPath, "app/page.js"),
    join(projectPath, "app/page.ts")
  ];
  
  const hasAppDirPage = possibleAppDirPaths.some(path => existsSync(path));
  
  if (hasAppDirPage) {
    // Serve the full app with router and proper initialization
    return injectJsxRuntime(composeHtmlTemplate({
      title: '0x1 App',
      includeImportMap: true,
      includeAppScript: true
    }));
  } else {
    // Show landing page if no app/page component exists
    return generateLandingPage();
  }
}

/**
 * Generate live reload script
 */
function generateLiveReloadScript(host: string): string {
  return `
// 0x1 Framework Live Reload Client
(function() {
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = '${host || "location.host"}';
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  
  function connect() {
    try {
      ws = new WebSocket(\`\${wsProtocol}//\${host}/ws\`);
      
      ws.onopen = () => {
        console.log('[0x1] Live reload connected');
        reconnectAttempts = 0;
        // Send ping to keep connection alive
        setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[0x1] Live reload:', data);
          
          if (data.type === 'reload') {
            window.location.reload();
          } else if (data.type === 'css-update') {
            updateStyles(data.filename);
          }
        } catch (error) {
          console.warn('[0x1] Failed to parse live reload message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('[0x1] Live reload disconnected');
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimer = setTimeout(connect, 1000 * reconnectAttempts);
        }
      };
      
      ws.onerror = (error) => {
        console.warn('[0x1] Live reload error:', error);
      };
    } catch (error) {
      console.error('[0x1] Failed to connect to live reload:', error);
    }
  }
  
  function updateStyles(filename) {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    if (!links.length) {
      window.location.reload();
      return;
    }
    
    let found = false;
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes(filename) || filename.includes(href))) {
        const newHref = href.split('?')[0] + '?t=' + Date.now();
        link.setAttribute('href', newHref);
        console.log('[0x1] Updated stylesheet:', newHref);
        found = true;
      }
    });
    
    if (!found) {
      window.location.reload();
    }
  }
  
  // Start connection
  connect();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (ws) {
      ws.close();
    }
  });
})();
`;
}

/**
 * Create JSX runtime script
 */
function generateJsxRuntime(isDevRuntime: boolean = false): string {
  const runtime = isDevRuntime ? 'development' : 'production';
  
  return `
// 0x1 Framework JSX Runtime (${runtime} mode)
// This is a simplified implementation of the JSX runtime

export function jsx(type, props, key) {
  return createVNode(type, props, key);
}

export function jsxs(type, props, key) {
  return createVNode(type, props, key);
}

export const Fragment = Symbol.for('jsx.fragment');

function createVNode(type, props, key) {
  const vnode = {
    type,
    props: props || {},
    key: key != null ? String(key) : null,
    children: null,
    __isVNode: true
  };
  
  // Move children to a separate property for easier handling
  if (props && props.children != null) {
    vnode.children = props.children;
    // Avoid having children in two places
    if (typeof vnode.props.children === 'function' || typeof vnode.props.children === 'object') {
      try {
        delete vnode.props.children;
      } catch (e) {}
    }
  }
  
  return vnode;
}
`;
}

/**
 * Handle component requests
 */
function handleJsxComponent(reqPath: string, projectPath: string): Response | null {
  // Handle JSX runtime requests
  if (reqPath === "/__0x1_jsx_runtime.js" || reqPath === "/__0x1_jsx_dev_runtime.js" ||
      reqPath === "/0x1/jsx-runtime.js" || reqPath === "/0x1/jsx-dev-runtime.js") {
    const isDevRuntime = reqPath.includes('dev');
    logger.info(`✅ 200 OK: Serving JSX ${isDevRuntime ? 'dev ' : ''}runtime`);
    
    return new Response(generateJsxRuntime(isDevRuntime), {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }
  
  return null;
}

/**
 * Create a development server
 */
export function createDevServer(options: DevServerOptions): Server {
  const { port, host, projectPath, debug = false, ignorePatterns = [], liveReload = true } = options;
  
  // Socket clients for live reload
  const clients = new Set<ServerWebSocket<unknown>>();
  
  // Detect favicon
  const detectedFavicon = detectFavicon(projectPath);
  if (!detectedFavicon) {
    logger.warn("No favicon detected in app/ or public/ directories. Using framework default.");
  }
  
  // Create directories if they don't exist
  const publicDir = join(projectPath, 'public');
  const distDir = join(projectPath, 'dist');
  const tempDir = join(projectPath, '.0x1-temp');
  
  for (const dir of [publicDir, distDir, tempDir]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
  
  // Watch files for changes
  const isLightRefresh = (filename: string): boolean => {
    if (filename.endsWith('.css')) return true;
    return false;
  };
  
  // Create a watcher
  const watcher = watch(projectPath, { recursive: true }, (event, filename) => {
    if (!filename) return;
    
    // Convert filename to string if it's a Buffer
    // Using type assertion to avoid TS2358 error with instanceof check
    const filenameStr = typeof filename === 'object' && filename !== null && 'toString' in filename
      ? (filename as Buffer).toString()
      : filename as string;
    
    // Ignore node_modules, .git, dist, and other specified patterns
    const defaultIgnorePatterns = ['node_modules', '.git', 'dist', '.DS_Store', '.0x1-temp'];
    const allIgnorePatterns = [...defaultIgnorePatterns, ...ignorePatterns];
    
    if (allIgnorePatterns.some(pattern => filenameStr.includes(pattern))) {
      return;
    }
    
    // Log the file change if debug is enabled
    if (debug) {
      logger.debug(`File changed: ${filenameStr}`);
    }
    
    // Determine if we need a full refresh or just a CSS refresh
    if (isLightRefresh(filenameStr)) {
      logger.info(`CSS file changed: ${filenameStr} (sending lightweight refresh)`);
      broadcastReload(clients, 'css-update', filenameStr);
    } else {
      logger.info(`File changed: ${filenameStr} (sending full refresh)`);
      broadcastReload(clients, 'reload', filenameStr);
    }
  });
  
  // Start Tailwind processing early in the server startup
  const startTailwind = async () => {
    try {
      // Check if Tailwind v4 is available first
      const isV4Available = await tailwindV4Handler.isAvailable(projectPath);
      
      if (isV4Available) {
        const version = await tailwindV4Handler.getVersion(projectPath);
        logger.info(`🌈 Detected Tailwind CSS v4 (${version})`);
        logger.info('🌟 Using modern Tailwind CSS v4 integration with Bun');
        
        // Find or create input file
        let inputFile = tailwindV4Handler.findInputFile(projectPath);
        if (!inputFile) {
          inputFile = tailwindV4Handler.createDefaultInput(projectPath);
        }
        
        if (inputFile) {
          logger.info(`💠 Found Tailwind v4 input file: ${inputFile}`);
          
          const outputFile = join(projectPath, '.0x1/public/styles.css');
          
          try {
            const tailwindProcess = await tailwindV4Handler.startProcess(projectPath, inputFile, outputFile);
            logger.success("✅ ✅ ✅ ✅ Tailwind CSS v4 watcher started");
            
            // Handle process output for better logging
            if (tailwindProcess.process && tailwindProcess.process.stderr) {
              const reader = tailwindProcess.process.stderr.getReader();
              const decoder = new TextDecoder();
              
              const readError = async () => {
                try {
                  let reading = true;
                  while (reading) {
                    const { done, value } = await reader.read();
                    if (done) {
                      reading = false;
                      break;
                    }
                    
                    const output = decoder.decode(value);
                    if (output.trim()) {
                      // Filter out noise and only show important messages
                      if (output.includes('Done in')) {
                        logger.success("✅ Tailwind CSS ready for development");
                      } else if (!output.includes('Resolving dependencies') && !output.includes('Resolved, downloaded')) {
                        logger.warn(`💠 Tailwind stderr: ${output.trim()}`);
                      }
                    }
                  }
                } catch (error) {
                  logger.debug(`Tailwind stderr reader error: ${error}`);
                }
              };
              readError();
            }
          } catch (error) {
            logger.warn(`⚠️ Could not start Tailwind v4 watcher: ${error}`);
            // Fall back to basic CSS processing
            const success = await processTailwindCss(projectPath);
            if (success) {
              logger.success("✅ Tailwind CSS ready for development (fallback)");
            }
          }
        }
      } else {
        // Fall back to the existing handler for v3 or other setups
      const success = await processTailwindCss(projectPath);
      if (success) {
        logger.success("✅ Tailwind CSS ready for development");
      } else {
        logger.warn("⚠️ Tailwind CSS not available - continuing without it");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Tailwind processing error: ${errorMessage}`);
      logger.warn("⚠️ Tailwind CSS not available - continuing without it");
    }
  };

  // Start Tailwind in the background
  startTailwind();

  // Create the server
  const server = serve({
    port,
    hostname: host,
    development: true,
    
    // WebSocket handling
    websocket: {
      message: (ws: LiveReloadSocket, message: string | Uint8Array) => {
        try {
          // Parse the message
          const data = typeof message === 'string' 
            ? JSON.parse(message) 
            : JSON.parse(new TextDecoder().decode(message));
          
          // Handle ping messages silently
          if (data.type === 'ping') {
            // Send pong response
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now()
            }));
            return;
          }
          
          // Log other messages
          if (debug) {
            logger.debug(`[0x1] Received message from ${ws.data.connectionId}: ${JSON.stringify(data)}`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error(`[0x1] Error handling message: ${errorMessage}`);
        }
      },
      open: (ws: ServerWebSocket<any>) => {
        // Generate a unique connection ID
        ws.data = {
          connectionId: `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        };
        
        clients.add(ws);
        logger.info(`[0x1] WebSocket client connected (${(ws.data as any).connectionId})`);
      },
      close: (ws: ServerWebSocket<any>) => {
        // Remove from clients set
        clients.delete(ws);
        logger.info(`[0x1] WebSocket client disconnected (${(ws.data as any).connectionId || 'unknown'})`);
      }
    },
    
    // Main request handler
    fetch: async (req: Request, server: Server): Promise<Response> => {
      const url = new URL(req.url);
      const reqPath = url.pathname;
      
      // Log request status with color-coded output
      const logRequestStatus = (status: number, path: string, extraInfo?: string) => {
        const statusText = status >= 200 && status < 300 
          ? "OK" 
          : status >= 300 && status < 400 
            ? "Redirect" 
            : "Error";
            
        const emoji = status >= 200 && status < 300 
          ? "✅" 
          : status >= 300 && status < 400 
            ? "↪️" 
            : "❌";
        
        const message = `${emoji} ${status} ${statusText}: ${path}${extraInfo ? ` (${extraInfo})` : ''}`;
        
        if (status >= 200 && status < 300) {
          logger.info(message);
        } else if (status >= 300 && status < 400) {
          logger.warn(message);
        } else {
          logger.error(message);
        }
      };
      
      // Debug logging for requests
      if (debug) {
        logger.debug(`Request for: ${reqPath} (${req.method})`);
      }
      
      // Upgrade WebSocket connections
      if (reqPath === '/ws' || reqPath === '/__0x1_ws' || reqPath === '/__0x1_ws_live_reload') {
        if (server.upgrade(req)) {
          return new Response(null, { status: 101 });
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      
      // Handle EventSource connections for live reload
      if (reqPath === '/__0x1_sse_live_reload') {
        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        
        // Create a readable stream that will be sent to the client
        const stream = new ReadableStream({
          start(controller) {
            // Send initial connection message
            controller.enqueue(': connected\n\n');
            
            // Function to send events to this client
            const sendEvent = (event: string, data: any) => {
              controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };
            
            // Send initial connection event
            sendEvent('connected', { timestamp: Date.now() });
            
            // Set up an interval to send keep-alive messages
            const keepAliveInterval = setInterval(() => {
              sendEvent('ping', { timestamp: Date.now() });
            }, 30000);
            
            // Handle stream closure
            req.signal.addEventListener('abort', () => {
              clearInterval(keepAliveInterval);
            });
          }
        });
        
        return new Response(stream, { headers });
      }
      
      // Handle live reload script request
      if (reqPath === '/__0x1_live_reload.js') {
        logRequestStatus(200, reqPath, 'Serving live reload script');
        const script = generateLiveReloadScript(req.headers.get('host') || `${host}:${port}`);
        
        return new Response(script, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }
      
      // Handle JSX runtime requests
      const jsxResponse = handleJsxComponent(reqPath, projectPath);
      if (jsxResponse) {
        return jsxResponse;
      }
      
      // Handle 0x1 core hooks module requests
      if (reqPath === '/node_modules/0x1/core/hooks.js' || reqPath === '/0x1/hooks.js') {
        try {
          // Try to serve the hooks module from the framework dist
          const hooksPath = join(frameworkCorePath, 'hooks.js');
          if (existsSync(hooksPath)) {
            logRequestStatus(200, reqPath, 'Serving 0x1 Hooks module');
            const hooksContent = readFileSync(hooksPath, 'utf-8');
            return new Response(hooksContent, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          logger.error(`Error serving hooks module: ${error}`);
        }
        
        // Fallback: Generate a basic hooks module that delegates to browser hooks
        logRequestStatus(200, reqPath, 'Serving generated hooks module');
        const hooksModule = `
// 0x1 Framework - Browser Hooks Module
console.log('[0x1] Hooks module loaded');

// Delegate to browser hook system
export function useState(initialValue) {
  if (typeof window !== 'undefined' && window.__0x1_useState) {
    return window.__0x1_useState(initialValue);
  }
  
  console.warn('[0x1] useState called without proper hook context');
  let state = initialValue;
  const setState = () => console.warn('[0x1] setState called without hook context');
  return [state, setState];
}

export function setComponentContext(componentId, updateCallback) {
  if (typeof window !== 'undefined' && window.__0x1_enterComponentContext) {
    return window.__0x1_enterComponentContext(componentId, updateCallback);
  }
}

export function clearComponentContext() {
  if (typeof window !== 'undefined' && window.__0x1_exitComponentContext) {
    return window.__0x1_exitComponentContext();
  }
}

// Export version
export const version = '0.1.0';

// Default export
export default {
  useState,
  setComponentContext,
  clearComponentContext,
  version
};
`;
        
        return new Response(hooksModule, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Handle 0x1 framework module requests
      if (reqPath === '/node_modules/0x1/index.js' || reqPath === '/node_modules/0x1' || reqPath === '/0x1/index.js') {
        try {
          // Try to serve the main framework module from dist
          const frameworkIndexPath = join(frameworkDistPath, 'index.js');
          if (existsSync(frameworkIndexPath)) {
            logRequestStatus(200, reqPath, 'Serving 0x1 framework module');
            const frameworkContent = readFileSync(frameworkIndexPath, 'utf-8');
            return new Response(frameworkContent, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          logger.error(`Error serving framework module: ${error}`);
        }
        
        // Fallback: Generate a basic framework module
        logRequestStatus(200, reqPath, 'Serving generated framework module');
        const frameworkModule = `
// 0x1 Framework - Browser Compatible Module
console.log('[0x1] Framework module loaded');

// JSX Runtime exports
export function jsx(type, props, key) {
  return { type, props: props || {}, key, children: props?.children || [] };
}

export function jsxs(type, props, key) {
  return { type, props: props || {}, key, children: props?.children || [] };
}

export const Fragment = Symbol.for('react.fragment');

export function createElement(type, props, ...children) {
  props = props || {};
  return { type, props, children: children.filter(c => c != null) };
}

// Hook system integration - use browser hook system
export function useState(initialValue) {
  // Delegate to browser hook system if available
  if (typeof window !== 'undefined' && window.__0x1_useState) {
    return window.__0x1_useState(initialValue);
  }
  
  // Fallback for server-side or when hook system not loaded
  let state = initialValue;
  const setState = (newValue) => {
    state = typeof newValue === 'function' ? newValue(state) : newValue;
    console.warn('[0x1] useState called without proper hook context');
  };
  return [state, setState];
}

// Hook context management - delegate to browser system
export function setComponentContext(componentId, updateCallback) {
  if (typeof window !== 'undefined' && window.__0x1_enterComponentContext) {
    return window.__0x1_enterComponentContext(componentId, updateCallback);
  }
}

export function clearComponentContext() {
  if (typeof window !== 'undefined' && window.__0x1_exitComponentContext) {
    return window.__0x1_exitComponentContext();
  }
}

// Export version
export const version = '0.1.0';

// Default export
export default {
  jsx,
  jsxs,
  Fragment,
  createElement,
  useState,
  setComponentContext,
  clearComponentContext,
  version
};
`;
        
        return new Response(frameworkModule, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Handle router module requests
      if (reqPath === "/0x1/router.js" || reqPath === "/node_modules/0x1/router.js") {
        try {
          // Try to serve the router from the framework dist
          const routerPath = join(frameworkCorePath, 'router.js');
          if (existsSync(routerPath)) {
            logRequestStatus(200, reqPath, 'Serving 0x1 Router module');
            const routerContent = readFileSync(routerPath, 'utf-8');
            return new Response(routerContent, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          logger.error(`Error serving router: ${error}`);
        }
        
        // Fallback: Generate router dynamically
        logRequestStatus(200, reqPath, 'Serving generated router module');
        const { generateRouterModule } = await import('../commands/utils/jsx-templates');
        const routerContent = generateRouterModule();
        
        return new Response(routerContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Handle error boundary requests
      if (reqPath === '/0x1-error-boundary.js' || reqPath === '/error-boundary-client.js') {
        try {
          // Try multiple possible locations for the error boundary
          const possiblePaths = [
            join(frameworkPath, 'src', 'browser', 'error', 'error-boundary.js'),
            join(frameworkPath, 'dist', 'browser', 'error-boundary.js'),
            join(frameworkPath, 'dist', 'error-boundary-client.js')
          ];
          
          let errorBoundaryContent = null;
          let foundPath = null;
          
          for (const path of possiblePaths) {
            if (existsSync(path)) {
              errorBoundaryContent = readFileSync(path, 'utf-8');
              foundPath = path;
              break;
            }
          }
          
          if (errorBoundaryContent) {
            logRequestStatus(200, reqPath, `Serving error boundary from ${foundPath?.replace(frameworkPath, '') || 'source'}`);
            return new Response(errorBoundaryContent, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          logger.error(`Error serving error boundary: ${error}`);
        }
        
        // Fallback error boundary - browser compatible
        logRequestStatus(200, reqPath, 'Serving error boundary fallback');
        return new Response(`
// 0x1 Error Boundary Fallback - Browser Compatible
console.log('[0x1] Error boundary loaded (fallback)');

// Initialize error boundary on window
window.__0x1_errorBoundary = window.__0x1_errorBoundary || {
  errors: [],
  addError(error, componentName) {
    console.error('[0x1] Error in component:', componentName || 'Unknown', error);
    this.errors.push({
      id: Date.now(),
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      componentName: componentName || 'Unknown Component',
      timestamp: new Date()
    });
    this.showErrorNotification(error, componentName);
    return this.errors.length - 1;
  },
  
  showErrorNotification(error, componentName) {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      max-width: 400px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    \`;
    
    notification.innerHTML = \`
      <div style="font-weight: bold; margin-bottom: 4px;">
        Error in \${componentName || 'Component'}
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        \${error.message || 'Unknown error occurred'}
      </div>
    \`;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  },
  
  clearErrors() {
    this.errors = [];
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  window.__0x1_errorBoundary.addError(event.error || new Error(event.message), 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
  window.__0x1_errorBoundary.addError(event.reason || new Error('Unhandled Promise Rejection'), 'Promise');
});

// Export for module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.__0x1_errorBoundary;
}
`, {
          status: 200,
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Handle favicon requests
      if (reqPath === '/favicon.ico' || reqPath.startsWith('/favicon.')) {
        // Use the detected favicon or fall back to the framework default
        const favicon = detectedFavicon || { 
          path: join(frameworkPath, 'src', 'public', 'favicon.ico'),
          format: 'ico',
          location: 'framework'
        };
        
        if (existsSync(favicon.path)) {
          logRequestStatus(200, reqPath, `Serving favicon from ${favicon.location}`);          
          const content = readFileSync(favicon.path);
          const mimeType = getMimeType(favicon.path);
          
          return new Response(content, {
            status: 200,
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=86400'
            }
          });
        }
      }
      
      // Handle CSS module requests
      if (isCssModuleJsRequest(reqPath)) {
        try {
          const cssFilePath = join(projectPath, reqPath.replace('.js', ''));
          
          if (existsSync(cssFilePath)) {
            logRequestStatus(200, reqPath, 'Serving CSS module');
            const result = generateCssModuleScript(reqPath);
            
            return new Response(result || '', {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          logger.error(`Error serving CSS module: ${error}`);
        }
      }
      
      // Handle CSS file requests
      if (reqPath.endsWith('.css')) {
        try {
          const cssFilePath = join(projectPath, reqPath);
          
          if (existsSync(cssFilePath)) {
            logRequestStatus(200, reqPath, 'Serving CSS file');
            const processedCss = await processCssFile(cssFilePath);
            
            return new Response(processedCss?.content || '', {
              status: 200,
              headers: {
                'Content-Type': processedCss?.contentType || 'text/css; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Error serving CSS file: ${errorMessage}`);
          return new Response('/* Tailwind CSS not available */', {
            headers: { 'Content-Type': 'text/css' }
          });
        }
      }
      
      // Handle app.js bundle request (main app entry point)
      if (reqPath === '/app.js') {
        try {
          // Generate a dynamic app.js that loads and renders the app components
          const appScript = `
// 0x1 Framework App Bundle - Generated at ${new Date().toISOString()}
console.log('0x1 App Started - Build: ${Date.now()}');

// Import the router and components
import { createRouter } from '/0x1/router.js';

// Component loader function with enhanced debugging
async function loadComponent(path) {
  try {
    console.log(\`[0x1] 🔍 Attempting to load component: \${path}\`);
    const module = await import(path);
    console.log(\`[0x1] ✅ Successfully loaded component: \${path}\`, Object.keys(module));
    return module;
  } catch (error) {
    console.log(\`[0x1] ❌ Failed to load component: \${path}\`, error.message);
    return null;
  }
}

// Discover all available routes in the app directory dynamically
async function discoverRoutes() {
  const routes = [];
  
  // Function to check if a route exists by making a HEAD request
  async function routeExists(path) {
    try {
      console.log(\`[0x1] 🔍 Checking if route exists: \${path}\`);
      const response = await fetch(path, { method: 'HEAD' });
      const exists = response.ok;
      console.log(\`[0x1] \${exists ? '✅' : '❌'} Route \${path}: \${response.status} \${response.statusText}\`);
      return exists;
    } catch (error) {
      console.log(\`[0x1] ❌ Route check failed for \${path}:\`, error.message);
      return false;
    }
  }
  
  // Define possible route patterns to discover
  const routePatterns = [
    // Root route
    { path: '/', component: '/app/page.js' },
    
    // Direct app directory routes (Next.js 13+ app router style)
    { path: '/features', component: '/app/features/page.js' },
    { path: '/about', component: '/app/about/page.js' },
    { path: '/contact', component: '/app/contact/page.js' },
    { path: '/dashboard', component: '/app/dashboard/page.js' },
    { path: '/blog', component: '/app/blog/page.js' },
    { path: '/docs', component: '/app/docs/page.js' },
    { path: '/pricing', component: '/app/pricing/page.js' },
    { path: '/login', component: '/app/login/page.js' },
    { path: '/signup', component: '/app/signup/page.js' },
    
    // Pages directory routes (traditional structure)
    { path: '/features', component: '/app/pages/features/page.js' },
    { path: '/about', component: '/app/pages/about/page.js' },
    { path: '/contact', component: '/app/pages/contact/page.js' },
    { path: '/dashboard', component: '/app/pages/dashboard/page.js' },
    { path: '/blog', component: '/app/pages/blog/page.js' },
    { path: '/docs', component: '/app/pages/docs/page.js' },
    { path: '/pricing', component: '/app/pages/pricing/page.js' },
    { path: '/login', component: '/app/pages/login/page.js' },
    { path: '/signup', component: '/app/pages/signup/page.js' }
  ];
  
  // Track discovered routes to avoid duplicates
  const discoveredPaths = new Set();
  
  console.log(\`[0x1] 🚀 Starting route discovery with \${routePatterns.length} patterns to check\`);
  console.log(\`[0x1] 📋 Route patterns to check:\`, routePatterns.map(r => \`\${r.path} -> \${r.component}\`));
  
  for (const route of routePatterns) {
    // Skip if we already found this path
    if (discoveredPaths.has(route.path)) {
      console.log(\`[0x1] ⏭️ Skipping duplicate path: \${route.path}\`);
      continue;
    }
    
    try {
      console.log(\`[0x1] Checking route: \${route.path} -> \${route.component}\`);
      const module = await loadComponent(route.component);
      if (module && (module.default || module[Object.keys(module)[0]])) {
        routes.push({
          path: route.path,
          component: module.default || module[Object.keys(module)[0]],
          componentPath: route.component
        });
        discoveredPaths.add(route.path);
        console.log(\`[0x1] ✅ Discovered route: \${route.path} -> \${route.component}\`);
      } else {
        console.log(\`[0x1] ❌ No component found at: \${route.component}\`);
      }
    } catch (error) {
      console.log(\`[0x1] ❌ Failed to load: \${route.component} - \${error.message}\`);
    }
  }
  
  console.log(\`[0x1] 🏁 Route discovery loop completed. Checked \${routePatterns.length} patterns.\`);
  
  console.log(\`[0x1] 🎯 Route discovery complete. Found \${routes.length} routes:\`);
  routes.forEach(r => console.log(\`  ✅ \${r.path} -> \${r.componentPath}\`));
  
  if (routes.length === 0) {
    console.log(\`[0x1] ⚠️ No routes discovered! This might indicate a problem with component loading.\`);
  }
  
  return routes;
}

// Initialize the app
async function initApp() {
  try {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found');
      return;
    }

    // Load layout component
    const layoutModule = await loadComponent('/app/layout.js');
    console.log('[0x1] Layout component loaded:', !!layoutModule);

    // Discover all available routes with error handling
    console.log('[0x1] 🔍 Starting route discovery process...');
    let routes = [];
    try {
      routes = await discoverRoutes();
      console.log(\`[0x1] ✅ Discovered \${routes.length} routes:\`, routes.map(r => r.path));
    } catch (error) {
      console.error('[0x1] ❌ Route discovery failed:', error);
      console.log('[0x1] 🔄 Falling back to manual route registration...');
      // Fallback to manual route registration
      routes = [{ path: '/', component: '/app/page.js' }];
    }

    if (routes.length > 0) {
      // Create router with debug enabled
      const router = createRouter({
        rootElement: appContainer,
        mode: 'history',
        debug: true
      });

      console.log('[0x1] Router created:', router);

      // Register all discovered routes
      const layoutComponent = layoutModule?.default;
      
      for (const route of routes) {
        if (layoutComponent) {
          router.addRoute(route.path, route.component, { layout: layoutComponent, exact: true });
        } else {
          router.addRoute(route.path, route.component, { exact: true });
        }
        console.log(\`[0x1] ✅ Registered route: \${route.path} (exact: true)\`);
      }
      
      // Debug: Log all registered routes after registration
      console.log(\`[0x1] Total routes registered: \${routes.length}\`);
      console.log(\`[0x1] Router routes array length: \${router.getRoutes ? router.getRoutes().length : 'getRoutes not available'}\`);

      // Initialize router
      router.init();
      
      // Debug: Show all registered routes
      if (router.getRoutes) {
        const registeredRoutes = router.getRoutes();
        console.log('[0x1] All registered routes:', registeredRoutes.map(r => \`\${r.path} (exact: \${r.exact})\`));
      } else {
        console.log('[0x1] Router getRoutes method not available');
      }
      
      // Handle initial navigation
      if (typeof router.navigate === 'function') {
        router.navigate(window.location.pathname, false);
        console.log('[0x1] Router navigated to:', window.location.pathname);
      } else {
        console.warn('[0x1] Router navigate method not found');
      }
      
      console.log('[0x1] App initialized successfully with', routes.length, 'routes');
    } else {
      // Fallback content
      appContainer.innerHTML = '<div class="p-8 text-center"><h1 class="text-2xl font-bold mb-4">0x1 App</h1><p>No page components found. Create app/page.tsx to get started.</p></div>';
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = '<div class="p-8 text-center text-red-600"><h1 class="text-2xl font-bold mb-4">App Error</h1><p>' + error.message + '</p></div>';
    }
  }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`;
          
          logRequestStatus(200, reqPath, 'Serving app bundle');
          return new Response(appScript, {
            status: 200,
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'ETag': `"${Date.now()}"` // Force cache busting
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Error generating app bundle: ${errorMessage}`);
          return new Response(`console.error('Failed to load app bundle: ${errorMessage}');`, {
            status: 500,
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
      }

      // Handle component requests (including app directory components and bare component names)
      if ((reqPath.endsWith('.js') && (reqPath.includes('/app/') || reqPath.includes('/components/'))) ||
          (reqPath.startsWith('/components/') && !reqPath.includes('.')) ||
          (reqPath.startsWith('/app/') && reqPath.endsWith('.js'))) {
        try {
          // Handle bare component names (e.g., /components/Counter)
          const basePath = reqPath.endsWith('.js') ? reqPath.replace('.js', '') : reqPath;
          
          // Convert .js request to source file (.tsx, .jsx, .ts, .js)
          const possibleSourcePaths = [
            join(projectPath, `${basePath}.tsx`),
            join(projectPath, `${basePath}.jsx`),
            join(projectPath, `${basePath}.ts`),
            join(projectPath, `${basePath}.js`)
          ];
          
          // Find the actual source file
          const sourcePath = possibleSourcePaths.find(path => existsSync(path));
          
          if (sourcePath) {
            logRequestStatus(200, reqPath, `Transpiling component from ${sourcePath.replace(projectPath, '')}`);
            
            // Use the component handler to transpile and serve
            const componentBasePath = basePath.replace(/^\//, ''); // Remove leading slash
            const result = handleComponentRequest(reqPath, projectPath, componentBasePath);
            
            if (result) {
              return result;
            }
          } else {
            // Component source not found - return a helpful fallback
            logRequestStatus(200, reqPath, 'Component not found, serving fallback');
            return new Response(`// Component fallback: ${reqPath}
console.warn('[0x1] Component not found: ${basePath}');

export default function NotFoundComponent(props) {
  const container = document.createElement('div');
  container.className = 'component-not-found p-4 border border-yellow-400 bg-yellow-50 rounded';
  container.innerHTML = \`
    <div class="text-yellow-800">
      <h3 class="font-bold">Component Not Found</h3>
      <p>Could not find component: <code>${basePath}</code></p>
      <p class="text-sm mt-2">Expected one of:</p>
      <ul class="text-xs mt-1 ml-4">
        <li>${basePath}.tsx</li>
        <li>${basePath}.jsx</li>
        <li>${basePath}.ts</li>
        <li>${basePath}.js</li>
      </ul>
    </div>
  \`;
  return container;
}
`, {
              status: 200,
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Error serving component: ${errorMessage}`);
          return new Response(`// Component error: ${errorMessage}\nconsole.error('Component error: ${errorMessage}');`, {
            status: 500,
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
      
      // Handle index.html requests
      if (reqPath === '/' || reqPath === '/index.html') {
        logRequestStatus(200, reqPath, 'Serving index.html');
        const html = generateIndexHtml(projectPath);
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Handle app directory page routes (e.g., /about, /features, /contact)
      // This prevents the "MacOS does not support sending non-regular files" error
      // when trying to serve directories as files
      if (!reqPath.includes('.') && reqPath !== '/' && !reqPath.startsWith('/node_modules') && !reqPath.startsWith('/0x1') && !reqPath.startsWith('/__0x1')) {
        // Check if this is an app directory route
        const possiblePagePaths = [
          join(projectPath, 'app', reqPath.slice(1), 'page.tsx'),
          join(projectPath, 'app', reqPath.slice(1), 'page.jsx'),
          join(projectPath, 'app', reqPath.slice(1), 'page.ts'),
          join(projectPath, 'app', reqPath.slice(1), 'page.js'),
          join(projectPath, 'app', 'pages', reqPath.slice(1), 'page.tsx'),
          join(projectPath, 'app', 'pages', reqPath.slice(1), 'page.jsx'),
          join(projectPath, 'app', 'pages', reqPath.slice(1), 'page.ts'),
          join(projectPath, 'app', 'pages', reqPath.slice(1), 'page.js')
        ];
        
        const pageExists = possiblePagePaths.some(path => existsSync(path));
        
        if (pageExists) {
          // This is a valid page route - serve the main app HTML
          // The client-side router will handle the actual page rendering
          logRequestStatus(200, reqPath, 'Serving app page route');
          const html = generateIndexHtml(projectPath);
          
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
      
      // Try to serve static files from project directories
      for (const dir of ['public', 'app', 'src', 'dist']) {
        const staticFileResponse = await serveStaticFile(req, join(projectPath, dir));
        
        if (staticFileResponse) {
          logRequestStatus(200, reqPath, `Serving from ${dir}`);
          return staticFileResponse;
        }
      }
      
      // Try to serve static files from framework
      const frameworkStaticResponse = await serveStaticFile(req, join(frameworkPath, 'dist'));
      
      if (frameworkStaticResponse) {
        logRequestStatus(200, reqPath, 'Serving from framework');
        return frameworkStaticResponse;
      }
      
      // Handle Tailwind CSS requests early - comprehensive v4 support
      if (reqPath === '/styles.css' || reqPath === '/tailwind-runtime.js' || 
          reqPath === '/processed-tailwind.css' || reqPath === '/tailwindcss' || 
          reqPath === '/app/tailwindcss') {
        try {
          // First try the v4 handler
          const isV4Available = await tailwindV4Handler.isAvailable(projectPath);
          
          if (isV4Available) {
            // Handle v4 CSS requests
            if (reqPath.endsWith('.css') || reqPath === '/processed-tailwind.css') {
              // Try multiple possible CSS file locations for v4
              const possibleCssPaths = [
                join(projectPath, '.0x1/public/styles.css'),
                join(projectPath, 'public/styles.css'),
                join(projectPath, 'dist/styles.css'),
                join(projectPath, 'app/globals.css') // Fallback to source
              ];
              
              for (const cssPath of possibleCssPaths) {
                if (existsSync(cssPath)) {
                  const css = readFileSync(cssPath, 'utf-8');
                  logRequestStatus(200, reqPath, `Serving Tailwind CSS v4 from ${cssPath.replace(projectPath, '')}`);
                  return new Response(css, {
                    headers: {
                      'Content-Type': 'text/css; charset=utf-8',
                      'Cache-Control': 'no-cache'
                    }
                  });
                }
              }
              
              // If no processed CSS found, serve the source CSS with v4 imports
              const sourceGlobals = join(projectPath, 'app/globals.css');
              if (existsSync(sourceGlobals)) {
                const css = readFileSync(sourceGlobals, 'utf-8');
                logRequestStatus(200, reqPath, 'Serving Tailwind CSS v4 source (unprocessed)');
                return new Response(css, {
                  headers: {
                    'Content-Type': 'text/css; charset=utf-8',
                    'Cache-Control': 'no-cache'
                  }
                });
              }
            }
            
            // Handle v4 runtime requests
            if (reqPath === '/tailwindcss' || reqPath === '/app/tailwindcss') {
              logRequestStatus(200, reqPath, 'Serving Tailwind CSS v4 runtime');
              return new Response(`// 0x1 Framework - Tailwind CSS v4 Runtime
(function() {
  'use strict';
  
  // Dark mode toggle functionality for v4
  function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
  
  // Initialize theme on page load
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }
  
  // Expose to global scope
  window.toggleDarkMode = toggleDarkMode;
  window.initTheme = initTheme;
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
  
  console.log('[0x1] Tailwind CSS v4 runtime loaded');
})();`, {
                headers: { 
                  'Content-Type': 'application/javascript; charset=utf-8',
                  'Cache-Control': 'no-cache'
                }
              });
            }
          }
          
          // Fallback to v3 handler
          const { handleTailwindRequest } = await import('./handlers/tailwind-handler');
          const tailwindResponse = await handleTailwindRequest(req, projectPath);
          if (tailwindResponse) {
            logRequestStatus(200, reqPath, 'Serving Tailwind CSS v3');
            return tailwindResponse;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Tailwind request error: ${errorMessage}`);
        }
        
        // Enhanced fallback for missing Tailwind files
        if (reqPath.endsWith('.css')) {
          logRequestStatus(200, reqPath, 'Serving Tailwind CSS fallback');
          return new Response(`/* 0x1 Framework - Tailwind CSS v4 Fallback */
/* This is a fallback when Tailwind CSS is not properly configured */

/* Reset and base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Essential utility classes */
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.text-center { text-align: center; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.text-red-600 { color: #dc2626; }
.text-red-800 { color: #991b1b; }
.text-yellow-800 { color: #92400e; }
.text-green-800 { color: #166534; }
.bg-red-50 { background-color: #fef2f2; }
.bg-yellow-50 { background-color: #fffbeb; }
.bg-green-50 { background-color: #f0fdf4; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-white { background-color: #ffffff; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.border { border-width: 1px; }
.border-red-400 { border-color: #f87171; }
.border-yellow-400 { border-color: #fbbf24; }
.border-gray-300 { border-color: #d1d5db; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.max-w-6xl { max-width: 72rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .dark\\:bg-gray-800 { background-color: #1f2937; }
  .dark\\:text-white { color: #ffffff; }
}

/* Component error styles */
.component-error {
  padding: 1rem;
  border: 1px solid #f87171;
  background-color: #fef2f2;
  border-radius: 0.5rem;
  color: #991b1b;
}

.component-not-found {
  padding: 1rem;
  border: 1px solid #fbbf24;
  background-color: #fffbeb;
  border-radius: 0.5rem;
  color: #92400e;
}
`, {
            headers: { 
              'Content-Type': 'text/css; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        } else {
          logRequestStatus(200, reqPath, 'Serving Tailwind runtime fallback');
          return new Response(`// 0x1 Framework - Tailwind Runtime Fallback
console.log('[0x1] Tailwind runtime loaded (fallback)');
window.toggleDarkMode = function() {
  document.documentElement.classList.toggle('dark');
  console.log('[0x1] Dark mode toggled');
};
window.initTheme = function() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
};
// Auto-initialize theme
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initTheme);
} else {
  window.initTheme();
}
`, {
            headers: { 
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
      }
      
      // Not found
      logRequestStatus(404, reqPath);
      return notFoundHandler(req);
    }
  });
  
  // Add cleanup for Tailwind process
  const cleanup = async () => {
    await stopTailwindProcess();
  };

  return server;
}
