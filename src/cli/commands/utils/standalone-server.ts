/**
 * Standalone development server implementation
 * This provides a simplified implementation that correctly handles MIME types
 * and provides beautiful error handling in development mode
 */
import { serve, type Server } from "bun";
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from "url";
import { logger } from "../../utils/logger.js";
import { handleComponentRequest } from './component-handler.js';
import { generateCssModuleScript, isCssModuleJsRequest, processCssFile } from './css-handler.js';
import { createJsxRuntimeEndpoint, createRouterEndpoint, generateJsxRuntime, generateReactShim, injectJsxRuntime } from './jsx-templates.js';
import { createLiveReloadSystem } from './live-reload/index.js';
import { LiveReloadSocket } from "./live-reload/ws-handler.js";
import { composeHtmlTemplate, generateLandingPage, generateLiveReloadScript } from './server-templates.js';
import * as tailwindHandler from './tailwind-handler.js';

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
 * Detect favicon in multiple locations and formats
 * Searches in app/ and public/ directories and supports .ico, .svg, .png
 * Returns the path to the favicon if found, null otherwise
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
  // Create a full HTML template with all necessary parts
  const INDEX_HTML_TEMPLATE = injectJsxRuntime(composeHtmlTemplate());
  
  // Detect favicon early to log info about it
  const detectedFavicon = detectFavicon(projectPath);
  if (!detectedFavicon) {
    logger.warn("No favicon detected in app/ or public/ directories. Using framework default.");
  }
  
  // Create the server instance - declaring first, initialized below
  let serverInstance: Server;
  
  // Create the server instance
  serverInstance = serve({
    port,
    hostname: host,
    development: true,
    idleTimeout: 255,
    
    // WebSocket handling for the live reload endpoint
    websocket: {
      message: (ws: LiveReloadSocket, message: string | Uint8Array) => {
        try {
          // Parse and log the message
          const data = typeof message === 'string' ? JSON.parse(message) : JSON.parse(new TextDecoder().decode(message));
          
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
          logger.debug(`[0x1] Received message from ${ws.data.connectionId}: ${JSON.stringify(data)}`);
        } catch (err) {
          logger.error(`[0x1] Error handling message: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
      open: (ws: LiveReloadSocket) => {
        // Generate a unique connection ID
        ws.data.connectionId = `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        logger.info(`[0x1] WebSocket client connected (${ws.data.connectionId})`);
        // Add to sockets set in the handler
      },
      close: (ws: LiveReloadSocket) => {
        logger.info(`[0x1] WebSocket client disconnected (${ws.data.connectionId})`);
        // Remove from sockets set in the handler
      }
    },
    
    // Main request handler
    fetch: async (req: Request, server: Server): Promise<Response> => {
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
      
      // Debug logging for requests
      if (process.env.DEBUG) {
        logger.debug(`Request for: ${reqPath} (${req.method})`);
      }
      
      // Check for live reload system requests (WebSocket, SSE, etc.)
      const liveReloadResponse = liveReload.handleRequest(req);
      if (liveReloadResponse) {
        return liveReloadResponse;
      }
      
      // Handle live reload script requests
      if (reqPath === "/__0x1_live_reload.js") {
        logger.info("✅ 200 OK: Serving live reload script");
        const script = generateLiveReloadScript(req.headers.get("host") || 'localhost:3000');
        
        return new Response(script, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Live reload script request is already handled by liveReload.handleRequest
      
      // Handle JSX runtime requests - match both /__0x1_jsx_runtime.js and /0x1/jsx-runtime.js patterns
      if (reqPath === "/__0x1_jsx_runtime.js" || reqPath === "/__0x1_jsx_dev_runtime.js" ||
          reqPath === "/0x1/jsx-runtime.js" || reqPath === "/0x1/jsx-dev-runtime.js") {
        const isDevRuntime = reqPath.includes('dev');
        logger.info(`✅ 200 OK: Serving JSX ${isDevRuntime ? 'dev ' : ''}runtime`);
        
        // Create handler with appropriate mode (dev or prod)
        const jsxRuntimeHandler = createJsxRuntimeEndpoint(isDevRuntime);
        const jsxResponse = jsxRuntimeHandler(req);
        
        if (jsxResponse) {
          return jsxResponse;
        }
      }
      
      // Handle favicon.ico and other favicons
      if (reqPath === "/favicon.ico" || reqPath.startsWith("/favicon.")) {
        // Use the detected favicon or fall back to the framework default
        const favicon = detectedFavicon || { 
          path: join(frameworkPath, "src", "public", "favicon.ico"),
          format: "ico",
          location: "framework"
        };
        
        if (existsSync(favicon.path)) {
          logRequestStatus(200, reqPath, `Serving favicon from ${favicon.location}`);          
          const content = readFileSync(favicon.path);
          const mimeType = getMimeType(favicon.path);
          
          return new Response(content, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=86400"
            }
          });
        }
      }
      
      // Specific endpoints for framework components
      if (reqPath === "/__0x1_react_shim.js") {
        logRequestStatus(200, reqPath, "Serving React shim");
        return new Response(generateReactShim(), {
          status: 200,
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      if (reqPath === "/__0x1_jsx_runtime.js" || reqPath === "/__0x1_jsx_dev_runtime.js") {
        const isDevRuntime = reqPath === "/__0x1_jsx_dev_runtime.js";
        logRequestStatus(200, reqPath, "Serving JSX runtime");
        return new Response(generateJsxRuntime(isDevRuntime), {
          status: 200,
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Handle Router module requests
      if (reqPath === "/0x1/router.js") {
        logRequestStatus(200, reqPath, "Serving 0x1 Router module");
        const routerHandler = createRouterEndpoint();
        const routerResponse = routerHandler(req);
        if (routerResponse) {
          return routerResponse;
        }
      }
      // Handle component requests
      if ((reqPath.endsWith(".js") || (!reqPath.includes(".") && (reqPath.includes("/components/") || reqPath.includes("/app/")))) && 
          (reqPath.includes("/components/") || reqPath.includes("/app/"))) {
        // If no extension, add .js for the server processing
        const componentRequestPath = reqPath.endsWith(".js") ? reqPath : `${reqPath}.js`;
        const componentBasePath = componentRequestPath.replace(".js", "");
        
        const response = handleComponentRequest(reqPath, projectPath, componentBasePath);
        if (response) return response;
      }
      
      // Handle app component requests (layout.js, page.js, etc.)
      if (reqPath.endsWith('.js') && (
        reqPath.includes('/app/layout.js') ||
        reqPath.includes('/app/page.js') ||
        reqPath.includes('/app/not-found.js') ||
        reqPath.includes('/app/error.js')
      )) {
        const componentBasePath = reqPath.replace(".js", "");
        const response = handleComponentRequest(reqPath, projectPath, componentBasePath);
        if (response) return response;
      }
      
      // Handle CSS module JS mapping requests
      if (isCssModuleJsRequest(reqPath)) {
        // Try Tailwind handler first
        try {
          const moduleScript = await tailwindHandler.generateCssModuleScript(reqPath.substring(1), projectPath);
          if (moduleScript) {
            logRequestStatus(200, reqPath, "Tailwind CSS Module JS");
            return new Response(moduleScript.content, {
              status: 200,
              headers: {
                "Content-Type": moduleScript.contentType,
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
        } catch (err) {
          logger.debug(`Error in Tailwind CSS module handler: ${err}`);
        }
        
        // Fall back to standard handler
        const cssModuleScriptResult = generateCssModuleScript(reqPath, projectPath);
        if (cssModuleScriptResult) {
          logRequestStatus(200, reqPath, "CSS Module JS");
          return new Response(cssModuleScriptResult.content, {
            status: 200,
            headers: {
              "Content-Type": cssModuleScriptResult.contentType,
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }
      
      // Handle CSS files
      if (reqPath.endsWith(".css")) {
        // First try to resolve directly from file system
        const cssFilePaths = [
          // Check for exact path
          join(projectPath, reqPath.substring(1)),
          // Check for app directory path (handles /globals.css -> /app/globals.css)
          join(projectPath, "app", reqPath.substring(1).replace(/^\/app\//, '')),
          // Check in public directory
          join(projectPath, "public", reqPath.substring(1))
        ];

        // Find the first matching CSS file
        const cssFilePath = cssFilePaths.find(path => existsSync(path));
        
        if (cssFilePath) {
          const cssContent = readFileSync(cssFilePath, 'utf-8');
          logRequestStatus(200, reqPath, `Serving CSS file from ${cssFilePath.replace(projectPath, '')}`);
          
          return new Response(cssContent, {
            status: 200,
            headers: {
              "Content-Type": "text/css",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
        
        // For module.css files, process them with scoped classnames
        if (reqPath.includes(".module.css")) {
          let cssResult = null;
          
          // First try with Tailwind handler
          try {
            cssResult = await tailwindHandler.processCssFile(reqPath.substring(1), projectPath);
            if (cssResult) {
              logRequestStatus(200, reqPath, "Tailwind CSS Module");
            }
          } catch (err) {
            logger.debug(`Error in Tailwind CSS handler: ${err}`);
          }
          
          // Fall back to standard handler if needed
          if (!cssResult) {
            cssResult = processCssFile(reqPath.slice(1), projectPath);
            if (cssResult) {
              logRequestStatus(200, reqPath, "CSS Module");
            }
          }
          
          if (cssResult) {
            return new Response(cssResult.content, {
              status: 200,
              headers: {
                "Content-Type": cssResult.contentType,
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
        }
      }
      
      // Handle router and 0x1 framework module requests
      // Router module is now handled by the createRouterEndpoint, avoid conflicts
      // Adding a commented block to document behavior
      /* 
      if (reqPath === "/0x1/router.js" || reqPath.startsWith("/0x1/router.js?")) {
        // This code is now handled by the createRouterEndpoint function
        // which properly handles all router.js requests regardless of query params
      }
      */
      
      // Handle processed Tailwind CSS requests
      if (reqPath === "/processed-tailwind.css") {
        try {
          // Ensure Tailwind module is available
          const tailwindHandler = await import("./tailwind-handler.js");
          const success = await tailwindHandler.processTailwindCss(projectPath);
          
          // Get the processed CSS directly from the tailwind handler
          const cssResult = tailwindHandler.getProcessedTailwindCss();
          
          if (success && cssResult.content) {
            logRequestStatus(200, reqPath, `Serving processed Tailwind CSS from memory`);
            
            return new Response(cssResult.content, {
              status: 200,
              headers: {
                "Content-Type": cssResult.contentType,
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
          
          // If processing failed or no CSS is available
          logRequestStatus(404, reqPath, `Tailwind CSS processing failed`);
          return new Response(`/* 
 * 0x1 Framework - Tailwind CSS Processing Error
 * 
 * Please check the following:
 * 1. Ensure tailwind.config.js exists in your project root
 * 2. Check that tailwindcss is installed (npm/bun install tailwindcss)
 * 3. Verify that app/globals.css exists and imports tailwindcss
 */`, {
            status: 404,
            headers: {
              "Content-Type": "text/css; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        } catch (error) {
          // Handle any errors during processing
          logRequestStatus(500, reqPath, `Error processing Tailwind CSS: ${error}`);
          return new Response(`/* Error processing Tailwind CSS */`, {
            status: 500,
            headers: {
              "Content-Type": "text/css; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }
      
      // Handle Tailwind runtime script (support for both main path and app directory path)
      if (reqPath === "/tailwindcss" || reqPath === "/app/tailwindcss") {
        logRequestStatus(200, reqPath, `Serving Tailwind runtime script`);
        
        // Use in-memory runtime script from the handler if available
        if (typeof tailwindHandler.getTailwindRuntime === 'function') {
          const runtime = tailwindHandler.getTailwindRuntime();
          return new Response(runtime.content, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        } else {
          // If no runtime script found, return clear error message
          const errorScript = `/* Tailwind CSS v4 Runtime Error */
(function() {
  console.error('[0x1 ERROR] Tailwind CSS runtime not found');
  console.error('[0x1 ERROR] Please run \`bun run dev\` again or ensure tailwind.config.js exists');
  
  // Add an error notification to the DOM
  document.addEventListener('DOMContentLoaded', () => {
    const errorNotification = document.createElement('div');
    errorNotification.style.position = 'fixed';
    errorNotification.style.top = '1rem';
    errorNotification.style.right = '1rem';
    errorNotification.style.padding = '1rem';
    errorNotification.style.backgroundColor = '#f56565';
    errorNotification.style.color = 'white';
    errorNotification.style.borderRadius = '0.375rem';
    errorNotification.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    errorNotification.style.zIndex = '9999';
    errorNotification.innerHTML = '<strong>Tailwind CSS Error:</strong> Runtime not found. Check console for details.';
    document.body.appendChild(errorNotification);
  });
})();`;
          
          logger.error("Tailwind CSS runtime not found");
          logger.error("Ensure tailwind.config.js exists and run again");
          
          return new Response(errorScript, {
            status: 200, // Return 200 to avoid breaking the page
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }
      
      // Handle error boundary component
      if (reqPath === "/0x1/error-boundary.js") {
        logRequestStatus(200, reqPath, "Serving error boundary component");
        
        // Find the correct path to the error boundary component by trying multiple potential locations
        const potentialPaths = [
          // Direct path in the framework directory
          join(frameworkPath, "src/core/error-boundary.ts"),
          
          // Node modules path (when installed as a dependency)
          join(projectPath, "node_modules/0x1/src/core/error-boundary.ts"),
          
          // Relative to binary location
          join(dirname(process.argv[0]), "../src/core/error-boundary.ts"),
          
          // Absolute path based on common installation patterns
          join(process.cwd(), "../../src/core/error-boundary.ts"),
          
          // Try from the user's home directory
          join(process.env.HOME || "/", "Documents/00-Dev/0x1/src/core/error-boundary.ts")
        ];
        
        // Find the first existing path
        let errorBoundaryPath = potentialPaths[0]; // Default to first path
        const existingPath = potentialPaths.find(path => existsSync(path));
        
        if (existingPath) {
          errorBoundaryPath = existingPath;
          logger.debug(`Found error boundary at: ${errorBoundaryPath}`);
        } else {
          logger.error(`Error boundary not found in any of the expected locations - using bundled fallback implementation`);
        }
        let transformedSource;
        
        if (existsSync(errorBoundaryPath)) {
          try {
            const errorBoundarySource = await Bun.file(errorBoundaryPath).text();
            
            // Transform TypeScript to browser-compatible JavaScript
            transformedSource = `/* 0x1 Error Boundary - Browser Compatible Version */
${errorBoundarySource
  .replace(/import\s+type\s+[^;]+;/g, '') // Remove type imports
  .replace(/interface\s+[^{]+(\{[^}]*\})/g, '') // Remove interfaces
  .replace(/:\s*[A-Za-z<>\[\]|,\s]+/g, '') // Remove type annotations
}

// Export for client-side use
export default ErrorManager.getInstance();
export { ErrorManager };
`;
        
        
        // If we couldn't load the file or there was an error processing it, use a built-in fallback
        if (!transformedSource) {
          transformedSource = `/* 0x1 Error Boundary - Built-in Fallback Implementation */

class ErrorManager {
  static instance;
  errors = [];
  minimized = false;
  activeErrorIndex = 0;
  floatingButton = null;
  modalContainer = null;
  
  constructor() {}
  
  static getInstance() {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  addError(error) {
    const id = \`error-\${Date.now()}-\${this.errors.length}\`;
    const errorEntry = { id, error, timestamp: Date.now() };
    this.errors.push(errorEntry);
    this.activeErrorIndex = this.errors.length - 1;
    
    // Create or update floating button if minimized
    if (this.minimized) {
      this.updateFloatingButton();
    }
    
    return errorEntry;
  }
  
  getErrors() {
    return [...this.errors];
  }
  
  getCurrentError() {
    return this.errors.length > 0 ? this.errors[this.activeErrorIndex] : null;
  }
  
  navigateNext() {
    if (this.errors.length === 0) return null;
    this.activeErrorIndex = (this.activeErrorIndex + 1) % this.errors.length;
    return this.getCurrentError();
  }
  
  navigatePrevious() {
    if (this.errors.length === 0) return null;
    this.activeErrorIndex = (this.activeErrorIndex - 1 + this.errors.length) % this.errors.length;
    return this.getCurrentError();
  }
  
  isMinimized() {
    return this.minimized;
  }
  
  minimize() {
    this.minimized = true;
    if (this.modalContainer) {
      this.modalContainer.style.display = 'none';
    }
    this.updateFloatingButton();
  }
  
  restore() {
    this.minimized = false;
    if (this.floatingButton) {
      document.body.removeChild(this.floatingButton);
      this.floatingButton = null;
    }
    if (this.modalContainer) {
      this.modalContainer.style.display = 'flex';
    } else {
      this.renderErrorModal();
    }
  }
  
  updateFloatingButton() {
    if (!this.floatingButton) {
      this.floatingButton = document.createElement('div');
      this.floatingButton.className = '0x1-error-floating-button';
      this.floatingButton.style.position = 'fixed';
      this.floatingButton.style.bottom = '20px';
      this.floatingButton.style.left = '20px';
      this.floatingButton.style.backgroundColor = '#f43f5e';
      this.floatingButton.style.color = 'white';
      this.floatingButton.style.borderRadius = '50%';
      this.floatingButton.style.width = '40px';
      this.floatingButton.style.height = '40px';
      this.floatingButton.style.display = 'flex';
      this.floatingButton.style.alignItems = 'center';
      this.floatingButton.style.justifyContent = 'center';
      this.floatingButton.style.cursor = 'pointer';
      this.floatingButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      this.floatingButton.style.zIndex = '9999';
      this.floatingButton.style.fontSize = '18px';
      this.floatingButton.style.fontWeight = 'bold';
      
      this.floatingButton.textContent = \`\${this.errors.length}\`;
      
      this.floatingButton.addEventListener('click', () => {
        this.restore();
      });
      
      document.body.appendChild(this.floatingButton);
    } else {
      this.floatingButton.textContent = \`\${this.errors.length}\`;
    }
  }
  
  renderErrorModal() {
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.className = '0x1-error-modal';
      this.modalContainer.style.position = 'fixed';
      this.modalContainer.style.top = '0';
      this.modalContainer.style.left = '0';
      this.modalContainer.style.width = '100%';
      this.modalContainer.style.height = '100%';
      this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
      this.modalContainer.style.display = 'flex';
      this.modalContainer.style.alignItems = 'center';
      this.modalContainer.style.justifyContent = 'center';
      this.modalContainer.style.zIndex = '9998';
      
      document.body.appendChild(this.modalContainer);
    } else {
      this.modalContainer.style.display = 'flex';
      this.modalContainer.innerHTML = '';
    }
    
    const currentError = this.getCurrentError();
    if (currentError) {
      const errorUI = createDefaultErrorUI(currentError.error, this);
      this.modalContainer.appendChild(errorUI);
    }
  }
  
  clearError(id) {
    const index = this.errors.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.errors.splice(index, 1);
      
      // Update active error index if needed
      if (this.activeErrorIndex >= this.errors.length) {
        this.activeErrorIndex = Math.max(0, this.errors.length - 1);
      }
      
      // Update UI based on remaining errors
      if (this.errors.length === 0) {
        // No more errors, clean up
        if (this.modalContainer) {
          document.body.removeChild(this.modalContainer);
          this.modalContainer = null;
        }
        if (this.floatingButton) {
          document.body.removeChild(this.floatingButton);
          this.floatingButton = null;
        }
      } else if (this.minimized) {
        this.updateFloatingButton();
      } else {
        this.renderErrorModal();
      }
    }
  }
  
  clearAllErrors() {
    this.errors = [];
    this.activeErrorIndex = 0;
    
    // Clean up UI
    if (this.modalContainer) {
      document.body.removeChild(this.modalContainer);
      this.modalContainer = null;
    }
    if (this.floatingButton) {
      document.body.removeChild(this.floatingButton);
      this.floatingButton = null;
    }
  }
}

function createDefaultErrorUI(error, errorManager) {
  const container = document.createElement('div');
  container.className = '0x1-error-container';
  container.style.backgroundColor = '#fff';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
  container.style.width = '90%';
  container.style.maxWidth = '700px';
  container.style.maxHeight = '80vh';
  container.style.overflow = 'auto';
  container.style.padding = '24px';
  container.style.fontSize = '14px';
  container.style.color = '#333';
  container.style.position = 'relative';
  
  // Error header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '16px';
  
  const title = document.createElement('h2');
  title.textContent = 'Error';
  title.style.margin = '0';
  title.style.color = '#f43f5e';
  title.style.fontSize = '20px';
  title.style.fontWeight = 'bold';
  
  const actionButtons = document.createElement('div');
  
  // Minimize button
  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = 'Minimize';
  minimizeButton.style.backgroundColor = '#e5e7eb';
  minimizeButton.style.color = '#374151';
  minimizeButton.style.border = 'none';
  minimizeButton.style.borderRadius = '4px';
  minimizeButton.style.padding = '6px 12px';
  minimizeButton.style.marginRight = '8px';
  minimizeButton.style.cursor = 'pointer';
  minimizeButton.style.fontSize = '14px';
  minimizeButton.addEventListener('click', () => {
    if (errorManager) {
      errorManager.minimize();
    }
  });
  
  // Dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.textContent = 'Dismiss';
  dismissButton.style.backgroundColor = '#f43f5e';
  dismissButton.style.color = 'white';
  dismissButton.style.border = 'none';
  dismissButton.style.borderRadius = '4px';
  dismissButton.style.padding = '6px 12px';
  dismissButton.style.cursor = 'pointer';
  dismissButton.style.fontSize = '14px';
  dismissButton.addEventListener('click', () => {
    if (errorManager) {
      errorManager.clearAllErrors();
    } else if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  
  actionButtons.appendChild(minimizeButton);
  actionButtons.appendChild(dismissButton);
  
  header.appendChild(title);
  header.appendChild(actionButtons);
  
  container.appendChild(header);
  
  // Error message
  const messageContainer = document.createElement('div');
  messageContainer.style.backgroundColor = '#fef2f2';
  messageContainer.style.border = '1px solid #fecaca';
  messageContainer.style.borderRadius = '4px';
  messageContainer.style.padding = '16px';
  messageContainer.style.marginBottom = '16px';
  
  const errorName = document.createElement('div');
  errorName.textContent = error.name || 'Error';
  errorName.style.fontWeight = 'bold';
  errorName.style.marginBottom = '8px';
  errorName.style.color = '#b91c1c';
  
  const errorMessage = document.createElement('div');
  errorMessage.textContent = error.message || 'An unknown error occurred';
  errorMessage.style.wordBreak = 'break-word';
  
  messageContainer.appendChild(errorName);
  messageContainer.appendChild(errorMessage);
  
  container.appendChild(messageContainer);
  
  // Stack trace
  if (error.stack) {
    const stackContainer = document.createElement('div');
    stackContainer.style.marginBottom = '16px';
    
    const stackTitle = document.createElement('h3');
    stackTitle.textContent = 'Stack Trace';
    stackTitle.style.margin = '0 0 8px 0';
    stackTitle.style.fontSize = '16px';
    stackTitle.style.color = '#374151';
    
    const stackContent = document.createElement('pre');
    stackContent.textContent = error.stack;
    stackContent.style.backgroundColor = '#f8fafc';
    stackContent.style.border = '1px solid #e2e8f0';
    stackContent.style.borderRadius = '4px';
    stackContent.style.padding = '12px';
    stackContent.style.overflow = 'auto';
    stackContent.style.fontSize = '12px';
    stackContent.style.color = '#64748b';
    stackContent.style.maxHeight = '200px';
    
    stackContainer.appendChild(stackTitle);
    stackContainer.appendChild(stackContent);
    
    container.appendChild(stackContainer);
  }
  
  // Helpful tips
  const tipsContainer = document.createElement('div');
  tipsContainer.style.backgroundColor = '#f0fdfa';
  tipsContainer.style.border = '1px solid #ccfbf1';
  tipsContainer.style.borderRadius = '4px';
  tipsContainer.style.padding = '16px';
  
  const tipsTitle = document.createElement('h3');
  tipsTitle.textContent = 'Helpful Tips';
  tipsTitle.style.margin = '0 0 8px 0';
  tipsTitle.style.fontSize = '16px';
  tipsTitle.style.color = '#0f766e';
  
  tipsContainer.appendChild(tipsTitle);
  
  const tipsList = document.createElement('ul');
  tipsList.style.margin = '0';
  tipsList.style.paddingLeft = '20px';
  
  const createHelpItem = (text) => {
    const item = document.createElement('li');
    item.textContent = text;
    item.style.marginBottom = '4px';
    item.style.color = '#0f766e';
    return item;
  };
  
  tipsList.appendChild(createHelpItem('Check your component props and data types'));
  tipsList.appendChild(createHelpItem('Verify that all required dependencies are installed'));
  tipsList.appendChild(createHelpItem('Look for null or undefined values being accessed'));
  tipsList.appendChild(createHelpItem('Ensure async operations are properly awaited'));
  tipsList.appendChild(createHelpItem('Check the browser console for additional details'));
  
  tipsContainer.appendChild(tipsList);
  container.appendChild(tipsContainer);
  
  return container;
}

// Error boundary component implementation
function ErrorBoundary(props) {
  return props.children;
}

// Export for client-side use
const errorManager = ErrorManager.getInstance();
export default errorManager;
export { ErrorManager, ErrorBoundary };
`;}
            
            return new Response(transformedSource, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          } catch (e) {
            logger.error(`Error transforming error boundary: ${e}`);
            return new Response(`console.error('[0x1] Error transforming error boundary: ${e}');`, {
              status: 500,
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
          }
        } else {
          logger.error(`❌ Error boundary component not found at: ${errorBoundaryPath}`);
          return new Response("console.error('[0x1] Error boundary component not found');", {
            status: 404,
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }
      
      // Handle app directory routes
      if (reqPath.startsWith("/") && !reqPath.includes(".")) {
        // Check if there's a corresponding app directory path
        const possibleAppDirPaths = [
          join(projectPath, "app", reqPath === "/" ? "page.tsx" : `${reqPath.slice(1)}/page.tsx`),
          join(projectPath, "app", reqPath === "/" ? "page.jsx" : `${reqPath.slice(1)}/page.jsx`),
          join(projectPath, "app", reqPath === "/" ? "page.js" : `${reqPath.slice(1)}/page.js`),
          join(projectPath, "app", reqPath === "/" ? "page.ts" : `${reqPath.slice(1)}/page.ts`)
        ];
        
        const routeExists = possibleAppDirPaths.some(path => existsSync(path));
        if (routeExists) {
          const foundPath = possibleAppDirPaths.find(path => existsSync(path));
          logRequestStatus(200, reqPath, `Route: ${foundPath ? foundPath.replace(projectPath, '') : 'app directory route'}`);
        } else {
          logRequestStatus(200, reqPath, `Route: using default handler`);
        }
        
        return new Response(injectJsxRuntime(INDEX_HTML_TEMPLATE), {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Handle root path
      if (reqPath === "/") {
        logger.info("✅ 200 OK: Serving root index");
        
        // Check if we have an app/page.tsx or similar
        const possibleAppDirPaths = [
          join(projectPath, "app/page.tsx"),
          join(projectPath, "app/page.jsx"),
          join(projectPath, "app/page.js"),
          join(projectPath, "app/page.ts")
        ];
        
        const hasAppDirPage = possibleAppDirPaths.some(path => existsSync(path));
        
        if (hasAppDirPage) {
          // Serve the full app with router
          return new Response(injectJsxRuntime(INDEX_HTML_TEMPLATE), {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        } else {
          // Show landing page if no app/page component exists
          return new Response(generateLandingPage(), {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate"
            }
          });
        }
      }

      // Check for static file in public directory
      const publicFilePath = join(projectPath, "public", reqPath.startsWith("/") ? reqPath.substring(1) : reqPath);
      if (existsSync(publicFilePath) && !publicFilePath.endsWith("/")) {
        logRequestStatus(200, reqPath, `Serving static file: ${publicFilePath.replace(projectPath, '')}`);
        
        const content = readFileSync(publicFilePath);
        const mimeType = getMimeType(publicFilePath);
        
        return new Response(content, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Check for static file in framework public directory
      // This is especially important for framework-level assets like favicon.ico
      const frameworkPublicPath = join(frameworkPath, "src", "public", reqPath.startsWith("/") ? reqPath.substring(1) : reqPath);
      if (existsSync(frameworkPublicPath) && !frameworkPublicPath.endsWith("/")) {
        logRequestStatus(200, reqPath, `Serving framework file: ${frameworkPublicPath.replace(frameworkPath, '')}`);
        
        const content = readFileSync(frameworkPublicPath);
        const mimeType = getMimeType(frameworkPublicPath);
        
        return new Response(content, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
      
      // Check for static file in project root
      const filePath = join(projectPath, reqPath.startsWith("/") ? reqPath.substring(1) : reqPath);
      if (existsSync(filePath) && !filePath.endsWith("/")) {
        logRequestStatus(200, reqPath, `Serving file: ${filePath.replace(projectPath, '')}`);
        
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
      
      // Not found
      logRequestStatus(404, reqPath, "Not Found");
      return new Response(`Not found: ${reqPath}`, {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }
  });
  
  // Initialize the live reload system after server instance is created
  const liveReload = createLiveReloadSystem(serverInstance);
  
  // Add shutdown handler
  serverInstance.stop = async () => {
    // Clean up live reload system
    if (liveReload && typeof liveReload.cleanup === 'function') {
      liveReload.cleanup();
    }
    
    logger.info('Server shutdown complete');
    
    // Return a resolved promise
    return Promise.resolve();
  };
  
  // Return the server instance
  return serverInstance;
}