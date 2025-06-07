/**
 * 0x1 Framework - Development Orchestrator
 * Unified development server using shared core utilities
 * Replaces monolithic dev-server.ts with clean, maintainable architecture
 */

import { serve, ServerWebSocket, type Server } from 'bun';
import { existsSync, readdirSync, readFileSync, statSync, watch } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

// Import shared core utilities
import { importEngine } from '../core/ImportEngine';
import { ImportTransformer } from '../core/ImportTransformer';
import { transpilationEngine } from '../core/TranspilationEngine';

import { logger } from '../../cli/utils/logger';

// Import network utilities for beautiful UX
import { getLocalIP, isPortAvailable, openBrowser } from '../../cli/commands/utils/server/network';

// Import essential handlers (keep only what's needed)
import { notFoundHandler } from '../../cli/server/middleware/error-boundary';
import { serveStaticFile } from '../../cli/server/middleware/static-files';

// CRITICAL FIX: Import Tailwind v4 handler from working implementation
import { tailwindV4Handler } from '../../cli/commands/utils/server/tailwind-v4';

// WORKING: Import actual working handlers from dev-server.bak.ts

// Route interface definition
export interface Route {
  path: string;
  componentPath: string;
  layouts?: Array<{ path: string; componentPath: string }>;
  isDynamic?: boolean;
  dynamicSegments?: Array<{ name: string; type: 'dynamic' | 'catchAll' | 'optionalCatchAll' }>;
}

export interface DevOrchestratorOptions {
  port: number;
  host: string;
  projectPath: string;
  debug?: boolean;
  ignorePatterns?: string[];
  liveReload?: boolean;
  open?: boolean;
  silent?: boolean;
  https?: boolean;
  cert?: string;
  key?: string;
}

export interface DevServerState {
  routes: Route[];
  components: Map<string, any>;
  assets: Map<string, any>;
  clientConnections: Set<ServerWebSocket<unknown>>;
  isReady: boolean;
  serverInfo: {
    port: number;
    host: string;
    localIP: string;
    serverUrl: string;
    networkUrl: string;
  };
}

export class DevOrchestrator {
  private state: DevServerState;
  private options: DevOrchestratorOptions;
  private server: Server | null = null;
  private fileWatcher: any = null;

  constructor(options: DevOrchestratorOptions) {
    this.options = options;
    
    // Initialize state with enhanced server info
    const localIP = getLocalIP();
    const serverInfo = {
      port: options.port,
      host: options.host,
      localIP,
      serverUrl: `http://${options.host}:${options.port}`,
      networkUrl: `http://${localIP}:${options.port}`
    };

    this.state = {
      routes: [],
      components: new Map(),
      assets: new Map(),
      clientConnections: new Set(),
      isReady: false,
      serverInfo
    };

    // Configure shared engines for development
    transpilationEngine.configure('development');
  }

  /**
   * Start the development server with unified orchestration and beautiful UX
   */
  async start(): Promise<Server> {
    try {
      // Beautiful startup sequence
      if (!this.options.silent) {
        logger.info(`💠 💠 Starting development orchestrator on ${this.state.serverInfo.serverUrl}`);
      }

      // Phase 0: Ensure port is available with fallback
      const finalPort = await this.ensurePortAvailable();
      this.updateServerInfo(finalPort);

      // Use spinner for startup sequence
      const startupSpin = this.options.silent ? null : logger.spinner("Initializing development server");

      // Phase 1: Parallel discovery using shared core (optimized for <50ms)
      const startTime = Date.now();
      const [routes, dependencies] = await Promise.all([
        this.discoverRoutes(),
        this.discoverDependencies()
      ]);
      const discoveryTime = Date.now() - startTime;

      this.state.routes = routes;
      this.state.isReady = true;

      if (startupSpin) {
        startupSpin.stop("success", `Discovery completed in ${discoveryTime}ms`);
      }

      // Phase 2: Create and configure server
      this.server = this.createServer();

      // Phase 3: Start file watching for live reload
      if (this.options.liveReload !== false) {
        this.startFileWatching();
      }

      // Phase 4: Display beautiful server info and open browser
      await this.displayServerInfo();

      if (this.options.open) {
        await this.openBrowserSafely();
      }

      return this.server;

    } catch (error) {
      logger.error(`❌ Development orchestrator failed: ${error}`);
      throw error;
    }
  }

  /**
   * Ensure port is available with intelligent fallback
   */
  private async ensurePortAvailable(): Promise<number> {
    let port = this.options.port;
    let attempts = 0;
    const maxAttempts = 10;

    while (!(await isPortAvailable(port)) && attempts < maxAttempts) {
      if (attempts === 0 && !this.options.silent) {
        logger.warn(`💠 Port ${this.options.port} is in use, finding alternative...`);
      }
      port++;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Unable to find available port after ${maxAttempts} attempts starting from ${this.options.port}`);
    }

    if (port !== this.options.port && !this.options.silent) {
      logger.info(`💠 Using port ${port} instead of ${this.options.port}`);
    }

    return port;
  }

  /**
   * Update server info with new port
   */
  private updateServerInfo(port: number): void {
    this.state.serverInfo = {
      ...this.state.serverInfo,
      port,
      serverUrl: `http://${this.options.host}:${port}`,
      networkUrl: `http://${this.state.serverInfo.localIP}:${port}`
    };
    this.options.port = port;
  }

  /**
   * Display beautiful server information with box formatting
   */
  private async displayServerInfo(): Promise<void> {
    if (this.options.silent) return;

    const { serverUrl, networkUrl, localIP } = this.state.serverInfo;
    const routeCount = this.state.routes.length;

    logger.success(`✅ Development server ready with ${routeCount} routes`);
    
    // Beautiful server info box (like Next.js)
    logger.spacer();
    logger.box(
      `🚀 0x1 Development Server

Local:            ${logger.highlight(serverUrl)}
Network:          ${logger.highlight(networkUrl)}

Ready in development mode
Routes discovered:  ${routeCount}
Watching for changes...

Powered by Bun    v${Bun.version}`
    );
    logger.spacer();

    if (this.options.open) {
      logger.info(`🌐 Opening ${logger.highlight(serverUrl)} in your browser`);
    } else {
      logger.info(`🌐 Open ${logger.highlight(serverUrl)} in your browser`);
    }

    logger.info("💠 Ready for development. Press Ctrl+C to stop.");
  }

  /**
   * Safely open browser with error handling
   */
  private async openBrowserSafely(): Promise<void> {
    try {
      await openBrowser(this.state.serverInfo.serverUrl);
    } catch (error) {
      if (!this.options.silent) {
        logger.warn(`Failed to open browser automatically: ${error}`);
        logger.info(`🌐 Please open ${this.state.serverInfo.serverUrl} manually`);
      }
    }
  }

  /**
   * Optimized route discovery - RESTORED FROM WORKING VERSION
   */
  private async discoverRoutes(): Promise<Route[]> {
    return this.discoverRoutesFromFileSystem(this.options.projectPath);
  }

  /**
   * Server-side route discovery - RESTORED WORKING VERSION
   */
  private discoverRoutesFromFileSystem(projectPath: string): Route[] {
    const routes: Route[] = [];
    
    const scanDirectory = (
      dirPath: string, 
      routePath: string = "", 
      parentLayouts: Array<{ path: string; componentPath: string }> = []
    ) => {
      try {
        if (!existsSync(dirPath)) return;

        const items = readdirSync(dirPath);

        // Check for layout file in current directory
        const layoutFiles = items.filter((item: string) =>
          item.match(/^layout\.(tsx|jsx|ts|js)$/)
        );

        // Build current layout hierarchy
        const currentLayouts = [...parentLayouts];
        if (layoutFiles.length > 0) {
          const actualLayoutFile = layoutFiles[0];
          const layoutComponentPath = `/app${routePath}/${actualLayoutFile.replace(/\.(tsx|ts)$/, ".js")}`;
          currentLayouts.push({ 
            path: routePath || "/", 
            componentPath: layoutComponentPath 
          });
          
          if (this.options.debug) {
            logger.debug(`Found layout: ${routePath || "/"} -> ${layoutComponentPath}`);
          }
        }

        // Check for page files in current directory
        const pageFiles = items.filter((item: string) =>
          item.match(/^page\.(tsx|jsx|ts|js)$/)
        );

        if (pageFiles.length > 0) {
          const actualFile = pageFiles[0];
          const componentPath = `/app${routePath}/${actualFile.replace(/\.(tsx|ts)$/, ".js")}`;
          
          routes.push({ 
            path: routePath || "/", 
            componentPath: componentPath,
            layouts: currentLayouts,
            isDynamic: false,
            dynamicSegments: []
          });
          
          if (this.options.debug) {
            logger.debug(`Found route: ${routePath || "/"} -> ${componentPath}`);
          }
        }

        // Recursively scan subdirectories
        const subdirs = items.filter((item: string) => {
          const itemPath = join(dirPath, item);
          try {
            return (
              statSync(itemPath).isDirectory() &&
              !item.startsWith(".") &&
              !item.startsWith("_") &&
              item !== "node_modules"
            );
          } catch {
            return false;
          }
        });

        for (const subdir of subdirs) {
          const subdirPath = join(dirPath, subdir);
          const subroutePath = routePath + "/" + subdir;
          scanDirectory(subdirPath, subroutePath, currentLayouts);
        }
      } catch (error) {
        if (this.options.debug) {
          logger.debug(`Error scanning directory ${dirPath}: ${error}`);
        }
      }
    };

    // Scan app directory
    const appDir = join(projectPath, "app");
    scanDirectory(appDir, "", []);

    // Sort routes by specificity
    routes.sort((a, b) => {
      if (a.path === "/" && b.path !== "/") return 1;
      if (b.path === "/" && a.path !== "/") return -1;
      const aSegments = a.path.split('/').filter(s => s).length;
      const bSegments = b.path.split('/').filter(s => s).length;
      return bSegments - aSegments;
    });

    if (!this.options.silent) {
      logger.info(`Discovered ${routes.length} routes: ${routes.map(r => r.path).join(", ")}`);
    }

    return routes;
  }

  /**
   * Optimized dependency discovery (targeting <20ms)
   */
  private async discoverDependencies(): Promise<any> {
    // Find all source files (optimized scanning)
    const sourceFiles = await this.findSourceFiles();
    
    // Use shared import engine for dependency discovery
    return await importEngine.discoverDependencies(this.options.projectPath, sourceFiles);
  }

  /**
   * Ultra-optimized source file discovery (targeting <15ms)
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    // Use synchronous scanning for better performance
    const scanDirectorySync = (dir: string, maxDepth: number = 3, currentDepth: number = 0) => {
      if (!existsSync(dir) || currentDepth > maxDepth) return;
      
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          // Skip early for better performance
          if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'dist') continue;
          
          const fullPath = join(dir, item.name);
          
          if (item.isDirectory()) {
            scanDirectorySync(fullPath, maxDepth, currentDepth + 1);
          } else if (extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Silent fail for individual directories
      }
    };

    // Scan only essential directories for faster discovery
    const essentialDirs = ['app', 'src', 'components', 'lib'];
    for (const dir of essentialDirs) {
      const fullDir = join(this.options.projectPath, dir);
      scanDirectorySync(fullDir, 2); // Limit depth for performance
    }

    return files;
  }

  /**
   * Create the Bun server with unified request handling
   */
  private createServer(): Server {
    return serve({
      port: this.options.port,
      hostname: this.options.host,
      development: true,
      idleTimeout: 120,

      // WebSocket handling for live reload
      websocket: {
        message: this.handleWebSocketMessage.bind(this),
        open: this.handleWebSocketOpen.bind(this),
        close: this.handleWebSocketClose.bind(this)
      },

      // Main request handler
      fetch: this.handleRequest.bind(this)
    });
  }

  /**
   * Unified request handling using shared core
   */
  private async handleRequest(req: Request, server: Server): Promise<Response> {
    const url = new URL(req.url);
    const reqPath = url.pathname;

    // Log requests in debug mode
    if (this.options.debug) {
      logger.debug(`[DevOrchestrator] ${req.method} ${reqPath}`);
    }

    try {
      // 1. WebSocket upgrades
      if (this.isWebSocketUpgrade(reqPath)) {
        return this.handleWebSocketUpgrade(req, server);
      }

      // 2. Live reload endpoints
      if (this.isLiveReloadEndpoint(reqPath)) {
        return this.handleLiveReloadEndpoint(reqPath, req);
      }

      // 3. Framework core files (CRITICAL - RESTORED FROM WORKING VERSION)
      if (this.isFrameworkRequest(reqPath)) {
        return await this.handleFrameworkRequest(reqPath);
      }

      // 4. Node modules polyfill system (CRITICAL - RESTORED)
      if (reqPath.startsWith('/node_modules/')) {
        return await this.handleNodeModulesRequest(reqPath);
      }

      // 4.5. External scoped packages (CRITICAL - MISSING FROM DEV)
      if (this.isExternalScopedPackageRequest(reqPath)) {
        return await this.handleExternalScopedPackageRequest(reqPath);
      }

      // 5. CSS requests
      if (this.isCssRequest(reqPath)) {
        return await this.handleCssRequest(reqPath);
      }

      // 6. App bundle
      if (reqPath === '/app.js') {
        return await this.handleAppBundleRequest();
      }

      // 7. Component requests (CRITICAL - RESTORED PROPER TRANSPILATION)
      if (this.isComponentRequest(reqPath)) {
        return await this.handleComponentRequest(reqPath);
      }

      // 8. Route requests (serve main app HTML)
      if (this.isRouteRequest(reqPath)) {
        return await this.handleRouteRequest(reqPath);
      }

      // 9. Static files
      return await this.handleStaticFileRequest(req);

    } catch (error) {
      logger.error(`[DevOrchestrator] Request error for ${reqPath}: ${error}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Handle framework core requests - RESTORED FROM WORKING VERSION
   */
  private async handleFrameworkRequest(reqPath: string): Promise<Response> {
    const frameworkPath = this.getFrameworkPath();

    // Handle JSX runtime requests
    if (reqPath === '/0x1/jsx-runtime.js' || reqPath === '/0x1/jsx-dev-runtime.js') {
      try {
        const isDevRuntime = reqPath.includes('dev');
        const runtimePath = isDevRuntime 
          ? join(frameworkPath, 'src', 'jsx-dev-runtime.ts')
          : join(frameworkPath, 'src', 'jsx-runtime.ts');
        
        if (existsSync(runtimePath)) {
          const transpiled = await Bun.build({
            entrypoints: [runtimePath],
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'none',
            define: {
              'process.env.NODE_ENV': JSON.stringify('development')
            },
            external: []
          });
          
          if (transpiled.success && transpiled.outputs.length > 0) {
            let content = '';
            for (const output of transpiled.outputs) {
              content += await output.text();
            }
            
            // Add browser globals
            content += `
if (typeof window !== 'undefined') {
  Object.assign(window, { jsx, jsxs, jsxDEV, createElement, Fragment, renderToDOM });
  window.React = Object.assign(window.React || {}, {
    createElement, Fragment, jsx, jsxs, version: '19.0.0-0x1-compat'
  });
}
`;
            
            // CRITICAL: Rewrite import paths to browser-resolvable URLs
            content = content
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\.\/components\/([^"']+)["']/g, 
                'import { $1 } from "/components/$2.js"')
              .replace(/import\s*["']\.\/globals\.css["']/g, '// CSS import externalized')
              .replace(/import\s*["']\.\.\/globals\.css["']/g, '// CSS import externalized')
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-dev-runtime["']/g, 
                'import { $1 } from "/0x1/jsx-runtime.js"')
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-runtime["']/g, 
                'import { $1 } from "/0x1/jsx-runtime.js"')
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/link["']/g, 
                'import { $1 } from "/0x1/router.js"')
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
                'import { $1 } from "/node_modules/0x1/index.js"');
            
            return new Response(content, {
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        }
      } catch (error) {
        logger.error(`JSX runtime error: ${error}`);
      }
      
      return this.createErrorResponse('JSX runtime not available');
    }

    // Handle hooks requests
    if (reqPath === '/0x1/hooks.js' || reqPath.includes('hooks-') || reqPath === '/node_modules/0x1/core/hooks.js') {
      try {
        const hooksPath = join(frameworkPath, 'src', 'core', 'hooks.ts');
        if (existsSync(hooksPath)) {
          const transpiled = await Bun.build({
            entrypoints: [hooksPath],
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'none',
            define: {
              'process.env.NODE_ENV': JSON.stringify('development')
            },
            external: []
          });
          
          if (transpiled.success && transpiled.outputs.length > 0) {
            let content = '';
            for (const output of transpiled.outputs) {
              content += await output.text();
            }
            
            // Add essential browser compatibility
            content += `
if (typeof window !== 'undefined') {
  // Initialize React-compatible global context
  window.React = window.React || {};
  
  // Make hooks available globally (no complex context checking)
  Object.assign(window, {
    useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
    useClickOutside, useFetch, useForm, useLocalStorage
  });
  
  // Also make available in React namespace for compatibility
  Object.assign(window.React, {
    useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
    useClickOutside, useFetch, useForm, useLocalStorage
  });
  
  // Global hooks registry
  window.__0x1_hooks = {
    useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
    useClickOutside, useFetch, useForm, useLocalStorage,
    isInitialized: true,
    contextReady: true
  };
  
  console.log('[0x1 Hooks] IMMEDIATE browser compatibility initialized (no timing delays)');
  
  // Component context ready flag
  window.__0x1_component_context_ready = true;
}
`;
            
            return new Response(content, {
              headers: { 
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        }
      } catch (error) {
        logger.error(`Hooks error: ${error}`);
      }
      
      return this.createErrorResponse('Hooks system not available');
    }

    // Handle 0x1 framework index
    if (reqPath === '/node_modules/0x1/index.js' || reqPath === '/0x1/index.js') {
      const frameworkModule = `
// 0x1 Framework - Dynamic Runtime Hook Resolution
console.log('[0x1] Framework module loaded');

// Dynamic hook getters that resolve at runtime
const createHookGetter = (hookName) => (...args) => {
  if (typeof window !== 'undefined' && window.React && typeof window.React[hookName] === 'function') {
    return window.React[hookName](...args);
  }
  if (typeof window !== 'undefined' && typeof window[hookName] === 'function') {
    return window[hookName](...args);
  }
  throw new Error('[0x1] ' + hookName + ' not available - hooks may not be loaded yet');
};

export const useState = createHookGetter('useState');
export const useEffect = createHookGetter('useEffect');
export const useCallback = createHookGetter('useCallback');
export const useMemo = createHookGetter('useMemo');
export const useRef = createHookGetter('useRef');
export const useClickOutside = createHookGetter('useClickOutside');
export const useFetch = createHookGetter('useFetch');
export const useForm = createHookGetter('useForm');
export const useLocalStorage = createHookGetter('useLocalStorage');

// JSX runtime delegation
export function jsx(type, props, key) {
  if (typeof window !== 'undefined' && window.jsx) {
    return window.jsx(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export function jsxs(type, props, key) {
  if (typeof window !== 'undefined' && window.jsxs) {
    return window.jsxs(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  if (typeof window !== 'undefined' && window.jsxDEV) {
    return window.jsxDEV(type, props, key, isStaticChildren, source, self);
  }
  throw new Error('[0x1] JSX dev runtime not loaded');
}

// CRITICAL: Link component wrapper to fix class constructor error
export function Link(props) {
  // Get the actual Link function from the router
  const RouterLink = (typeof window !== 'undefined' && window.__0x1_RouterLink) || null;
  
  if (!RouterLink) {
    // Fallback if router not loaded yet
    return jsx('a', {
      href: props.href,
      className: props.className,
      onClick: (e) => {
        e.preventDefault();
        if (props.href.startsWith('/')) {
          window.history.pushState(null, '', props.href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.location.href = props.href;
        }
      },
      children: props.children
    });
  }
  
  // Call the router Link and convert plain object to JSX
  const linkResult = RouterLink(props);
  
  // If it returns a plain object, convert it to JSX
  if (linkResult && typeof linkResult === 'object' && linkResult.type && linkResult.props) {
    const jsx = (typeof window !== 'undefined' && (window.jsx || window.jsxDEV)) || ((type, props) => ({type, props}));
    return jsx(linkResult.type, linkResult.props);
  }
  
  return linkResult;
}
`;

      return new Response(frameworkModule, {
        headers: { 
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Handle router requests
    if (reqPath === '/0x1/router.js' || reqPath === '/node_modules/0x1/router.js') {
      const routerPath = join(frameworkPath, '0x1-router', 'dist', 'index.js');
      if (existsSync(routerPath)) {
        let content = readFileSync(routerPath, 'utf-8');
        
        // CRITICAL: Fix Link component to use JSX runtime instead of returning plain objects
        // This fixes the "Class constructor K cannot be invoked without 'new'" error
        content = content.replace(
          /return\{type:"a",props:\{href:q,className:z,onClick:\(V\)=>\{[^}]+\},children:Q\}\}/,
          `// Use JSX runtime to create element instead of plain object
const jsx = (typeof window !== 'undefined' && (window.jsx || window.jsxDEV)) || ((type, props) => ({type, props}));
return jsx("a", {
  href: q,
  className: z,
  onClick: (V) => {
    if(V.preventDefault(),V.stopPropagation(),q.startsWith("/")){
      let Z=$();if(Z)Z.navigate(q,!0,Y);else if(typeof window!=="undefined")window.history.pushState(null,"",q),window.dispatchEvent(new PopStateEvent("popstate"))
    }else window.location.href=q
  },
  children: Q
})`
        );
        
        // BACKUP: If the regex didn't work, replace the entire Link function
        if (!content.includes('Use JSX runtime')) {
          content = content.replace(
            /function F\(\{href:q,className:z,children:Q,prefetch:G,scrollBehavior:U,scrollToTop:J\}\)\{[^}]+return\{type:"a"[^}]+\}\}/,
            `function F({href:q,className:z,children:Q,prefetch:G,scrollBehavior:U,scrollToTop:J}){
  let X=$();if(G&&X)X.prefetch(q);let Y=J?"top":U;
  // CRITICAL: Use JSX runtime instead of plain object to fix class constructor error
  const jsx = (typeof window !== 'undefined' && (window.jsx || window.jsxDEV)) || ((type, props) => ({type, props}));
  return jsx("a", {
    href: q,
    className: z,
    onClick: (V) => {
      if(V.preventDefault(),V.stopPropagation(),q.startsWith("/")){
        let Z=$();if(Z)Z.navigate(q,!0,Y);else if(typeof window!=="undefined")window.history.pushState(null,"",q),window.dispatchEvent(new PopStateEvent("popstate"))
      }else window.location.href=q
    },
    children: Q
  })
}`
          );
        }
        
        // CRITICAL: Expose the original Link function for the wrapper
        content += `
// Expose original Link function for wrapper
if (typeof window !== 'undefined') {
  window.__0x1_RouterLink = F;
}
`;
        
        return new Response(content, {
          headers: { 
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      return this.createErrorResponse('Router not built - run "bun run build:framework" first');
    }

    // Handle dedicated Link component - Clean implementation
    if (reqPath === '/0x1/link' || reqPath === '/0x1/link.js') {
      const linkComponent = `
// 0x1 Link Component - Clean default export implementation
import { jsx, jsxDEV } from "0x1/jsx-dev-runtime";

export default function Link({ href, className, children, target, rel, onClick, ...props }) {
  const handleClick = (e) => {
    // Custom click handler takes precedence
    if (onClick) {
      onClick(e);
      return;
    }
    
    // External links or target="_blank" - let browser handle
    if (target === '_blank' || !href?.startsWith('/')) {
      return;
    }
    
    e.preventDefault();
    
    // Internal navigation using router
    if (typeof window !== 'undefined') {
      const router = window.__0x1_ROUTER__ || window.__0x1_router || window.router;
      if (router && typeof router.navigate === 'function') {
        router.navigate(href);
      } else {
        // Fallback to manual navigation
        window.history.pushState(null, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  // Use JSX runtime to create proper component
  const jsx = (typeof window !== 'undefined' && (window.jsx || window.jsxDEV)) || 
              ((type, props) => ({ type, props }));
              
  return jsx('a', {
    href,
    className,
    target,
    rel,
    onClick: handleClick,
    children,
    ...props
  });
}
`;

      return new Response(linkComponent, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    return this.createNotFoundResponse(`Framework file not found: ${reqPath}`);
  }

  /**
   * Handle node_modules requests with intelligent polyfills - RESTORED
   */
  private async handleNodeModulesRequest(reqPath: string): Promise<Response> {
    // Extract the full package path from the request
    // Example: /node_modules/@0x1js/highlighter/dist/index.js
    const nodeModulesPrefix = '/node_modules/';
    if (!reqPath.startsWith(nodeModulesPrefix)) {
      return this.createNotFoundResponse('Invalid node_modules path');
    }
    
    const packagePath = reqPath.substring(nodeModulesPrefix.length); // @0x1js/highlighter/dist/index.js
    
    // Handle scoped packages (@scope/package/...)
    let packageName: string;
    let filePath: string;
    
    if (packagePath.startsWith('@')) {
      // Scoped package: @scope/package/file/path
      const parts = packagePath.split('/');
      if (parts.length < 2) {
        return this.createNotFoundResponse('Invalid scoped package path');
      }
      packageName = `${parts[0]}/${parts[1]}`; // @scope/package
      filePath = parts.slice(2).join('/'); // dist/index.js
    } else {
      // Regular package: package/file/path
      const parts = packagePath.split('/');
      packageName = parts[0];
      filePath = parts.slice(1).join('/');
    }

    // Check if package exists first
    const packageDir = join(this.options.projectPath, 'node_modules', packageName);
    if (existsSync(packageDir)) {
      try {
        // Try to serve the exact requested file
        const requestedFilePath = join(packageDir, filePath);
        
        if (existsSync(requestedFilePath)) {
          const content = readFileSync(requestedFilePath, 'utf-8');
          
          if (!this.options.silent) {
            logger.debug(`[DevOrchestrator] Serving: ${packageName}/${filePath}`);
          }
          
          return new Response(content, {
            headers: {
              'Content-Type': requestedFilePath.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain',
              'Cache-Control': 'no-cache'
            }
          });
        }
        
        // If exact file doesn't exist, try fallbacks
        const packageJsonPath = join(packageDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          const mainFile = packageJson.module || packageJson.main || 'index.js';
          const mainPath = join(packageDir, mainFile);
          
          if (existsSync(mainPath)) {
            const content = readFileSync(mainPath, 'utf-8');
            
            if (!this.options.silent) {
              logger.debug(`[DevOrchestrator] Serving main file for: ${packageName} -> ${mainFile}`);
            }
            
            return new Response(content, {
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache'
              }
            });
          }
        }
      } catch (error) {
        if (!this.options.silent) {
          logger.error(`[DevOrchestrator] Error serving ${packageName}: ${error}`);
        }
      }
    }

    // CRITICAL: Try to detect actual exports from the package dynamically
    let detectedExports: string[] = [];
    
    // Try to read package.json to discover exports
    try {
      const packageJsonPath = join(this.options.projectPath, 'node_modules', packageName, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        
        // Extract exports from package.json exports field
        if (packageJson.exports) {
          if (typeof packageJson.exports === 'object') {
            detectedExports = Object.keys(packageJson.exports)
              .filter(key => key !== '.' && !key.startsWith('./'))
              .map(key => key.replace('./', ''));
          }
        }
        
        // Also try to detect from main/module files
        const mainFiles = [packageJson.main, packageJson.module, packageJson.browser]
          .filter(Boolean)
          .map(file => join(this.options.projectPath, 'node_modules', packageName, file))
          .filter(existsSync);
          
        for (const mainFile of mainFiles) {
          try {
            const content = readFileSync(mainFile, 'utf-8');
            // Extract export statements dynamically
            const exportMatches = content.match(/export\s+(?:const|function|class|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g);
            if (exportMatches) {
              const extractedNames = exportMatches.map(match => 
                match.replace(/export\s+(?:const|function|class|let|var)\s+/, '')
              );
              detectedExports.push(...extractedNames);
            }
          } catch (error) {
            // Silent fail for individual files
          }
        }
      }
    } catch (error) {
      // Silent fail if package.json doesn't exist or can't be read
    }
    
    // Remove duplicates and ensure we have some fallback exports
    detectedExports = [...new Set(detectedExports)];
    if (detectedExports.length === 0) {
      // Fallback: common export patterns for any package
      detectedExports = ['default'];
    }

    // Generate intelligent polyfill for missing packages
    const polyfillCode = `
// 0x1 Intelligent Polyfill for ${packageName}
console.log('[0x1] Auto-generating polyfill for:', '${packageName}');

const intelligentNamespace = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol') {
      if (prop === Symbol.toStringTag) return 'Module';
      return undefined;
    }
    
    if (prop === '__esModule') return true;
    
    if (!target[prop]) {
      // Create intelligent export based on name patterns
      const propName = String(prop);
      
      // React hooks pattern
      if (/^use[A-Z]/.test(propName)) {
        target[prop] = function(...args) {
          console.log('[0x1 Hook]', propName, 'from', '${packageName}', args);
          return { data: undefined, isLoading: false, isError: false, error: null };
        };
      }
      // React components pattern
      else if (/^[A-Z]/.test(propName)) {
        target[prop] = function(props = {}) {
          console.log('[0x1 Component]', propName, 'from', '${packageName}', props);
          return {
            type: 'div',
            props: {
              className: propName.toLowerCase() + ' polyfill-component',
              'data-component': propName,
              'data-package': '${packageName}'
            },
            children: [propName + ' (polyfill)'],
            key: null
          };
        };
      }
      // Utility functions
      else {
        target[prop] = function(...args) {
          console.log('[0x1 Utility]', propName, 'from', '${packageName}', args);
          return args[0] || {};
        };
      }
    }
    
    return target[prop];
  }
});

// DYNAMIC: Export everything from the namespace using Proxy magic
export default intelligentNamespace;

// FULLY DYNAMIC: Create named exports based on detected package structure
${detectedExports.map(exportName => 
  `export const ${exportName} = intelligentNamespace.${exportName};`
).join('\n')}

// DYNAMIC: Use Object.defineProperty for additional exports that might be imported
const commonExportPatterns = [
  // Add common patterns that might not be detected
  'version', 'default'
];

commonExportPatterns.forEach(exportName => {
  try {
    if (typeof module !== 'undefined' && module.exports) {
      Object.defineProperty(module.exports, exportName, {
        get: () => intelligentNamespace[exportName],
        enumerable: true,
        configurable: true
      });
    }
  } catch (e) {
    // Fallback for environments that don't support defineProperty
  }
});

// Make available globally
if (typeof window !== 'undefined') {
  window['${packageName}'] = intelligentNamespace;
}
if (typeof globalThis !== 'undefined') {
  globalThis['${packageName}'] = intelligentNamespace;
}
`;

    return new Response(polyfillCode, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }

  /**
   * Handle component requests using proper Bun transpilation - RESTORED
   */
  private async handleComponentRequest(reqPath: string): Promise<Response> {
    try {
      const cleanPath = reqPath.split('?')[0];
      const basePath = cleanPath.endsWith('.js') ? cleanPath.replace('.js', '') : cleanPath;
      const relativePath = basePath.startsWith('/') ? basePath.slice(1) : basePath;

      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Component request: ${reqPath} -> ${relativePath}`);
      }

      // Find the source file
      const possiblePaths = this.generatePossiblePaths(relativePath);
      
      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Searching paths: ${possiblePaths.join(', ')}`);
      }
      
      const sourcePath = possiblePaths.find(path => existsSync(path));

      if (!sourcePath) {
        if (this.options.debug) {
          logger.debug(`[DevOrchestrator] No source file found for: ${basePath}`);
        }
        return this.createNotFoundResponse(`Component not found: ${basePath}`);
      }

      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Found source file: ${sourcePath}`);
      }

      // Check cache first
      const cached = this.state.components.get(sourcePath);
      if (cached && await this.isFileUnchanged(sourcePath, cached.mtime)) {
        if (this.options.debug) {
          logger.debug(`[DevOrchestrator] Serving cached component: ${sourcePath}`);
        }
        return new Response(cached.content, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
        });
      }

      // FIXED: Use Bun.Transpiler with explicit JSX configuration for function components
      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Transpiling: ${sourcePath}`);
      }
      
      // Read source file
      const sourceContent = readFileSync(sourcePath, 'utf-8');
      
      // Create Bun transpiler with explicit JSX configuration
      const transpiler = new Bun.Transpiler({
        loader: sourcePath.endsWith('.tsx') ? 'tsx' : 
                sourcePath.endsWith('.jsx') ? 'jsx' :
                sourcePath.endsWith('.ts') ? 'ts' : 'js',
        target: 'browser',
        define: {
          'process.env.NODE_ENV': JSON.stringify('development')
        },
        // CRITICAL: Explicit JSX configuration to ensure function components
        tsconfig: JSON.stringify({
          compilerOptions: {
            jsx: 'react-jsx',
            jsxImportSource: '0x1'
          }
        })
      });

      // Use transformSync for synchronous transpilation
      let content = transpiler.transformSync(sourceContent);

      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Raw transpilation output length: ${content.length}`);
        // Check first few lines to verify JSX runtime
        const firstLines = content.split('\n').slice(0, 5).join('\n');
        logger.debug(`[DevOrchestrator] First lines:\n${firstLines}`);
      }

      // CRITICAL: Fix JSX runtime imports and function names
      // Check if JSX is used but import is missing
      const hasJSX = content.includes('jsxDEV') || content.includes('jsx(');
      const hasJSXImport = content.includes('from "0x1/jsx-dev-runtime"') || content.includes('from "0x1/jsx-runtime"');
      
      if (hasJSX && !hasJSXImport) {
        // Add JSX runtime import at the top
        const lines = content.split('\n');
        const importIndex = lines.findIndex(line => line.startsWith('import ')) + 1 || 0;
        lines.splice(importIndex, 0, 'import { jsxDEV } from "0x1/jsx-dev-runtime";');
        content = lines.join('\n');
      }

      // CRITICAL: Replace mangled JSX function names with proper ones
      content = content
        .replace(/jsxDEV_[a-zA-Z0-9]+/g, 'jsxDEV')
        .replace(/jsx_[a-zA-Z0-9]+/g, 'jsx')
        .replace(/jsxs_[a-zA-Z0-9]+/g, 'jsxs')
        .replace(/Fragment_[a-zA-Z0-9]+/g, 'Fragment');



      // CRITICAL: Rewrite import paths to browser-resolvable URLs
      content = content
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\.\/components\/([^"']+)["']/g, 
          'import { $1 } from "/components/$2.js"')
        .replace(/import\s*["']\.\/globals\.css["']/g, '// CSS import externalized')
        .replace(/import\s*["']\.\.\/globals\.css["']/g, '// CSS import externalized');

      // CRITICAL: Use unified ImportTransformer for robust import handling (SINGLE SOURCE OF TRUTH)
      content = ImportTransformer.transformImports(content, {
        sourceFilePath: sourcePath,
        projectPath: this.options.projectPath,
        mode: 'development',
        debug: this.options.debug
      });

      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Transpilation successful: ${sourcePath} (${content.length} bytes)`);
      }

      // Cache the result
      const stats = statSync(sourcePath);
      this.state.components.set(sourcePath, {
        content,
        mtime: stats.mtimeMs
      });

      return new Response(content, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });

    } catch (error) {
      logger.error(`[DevOrchestrator] Component transpilation failed: ${error}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Generate possible source file paths - ENHANCED FOR LAYOUT FILES
   */
  private generatePossiblePaths(relativePath: string): string[] {
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    const basePath = join(this.options.projectPath, relativePath);
    
    // For layout and page files, we need to be extra careful about path resolution
    const paths: string[] = [];
    
    // Standard extensions for the exact path
    for (const ext of extensions) {
      paths.push(`${basePath}${ext}`);
    }
    
    // Special handling for app directory structure
    if (relativePath.startsWith('app/')) {
      const appRelativePath = relativePath.substring(4); // Remove 'app/' prefix
      const appBasePath = join(this.options.projectPath, 'app', appRelativePath);
      
      for (const ext of extensions) {
        paths.push(`${appBasePath}${ext}`);
      }
    }
    
    return paths;
  }

  /**
   * Check if file is unchanged since last cache
   */
  private async isFileUnchanged(filePath: string, cachedMtime: number): Promise<boolean> {
    try {
      const stats = statSync(filePath);
      return stats.mtimeMs === cachedMtime;
    } catch {
      return false;
    }
  }

  /**
   * Handle CSS requests with proper Tailwind v4 support - RESTORED FROM WORKING VERSION
   */
  private async handleCssRequest(reqPath: string): Promise<Response> {
    try {
      // CRITICAL: Handle external package CSS requests dynamically
      if (reqPath.includes('-styles.css')) {
        // Extract package name from CSS filename pattern: @scope-package-styles.css
        const cssFileName = reqPath.substring(1); // Remove leading /
        const packageName = this.extractPackageNameFromCssFile(cssFileName);
        
        if (packageName) {
          // Look for CSS files in the package
          const packageDir = join(this.options.projectPath, 'node_modules', packageName);
          if (existsSync(packageDir)) {
            // CRITICAL: Prioritize actual CSS files over wrapper files
            const possibleCssPaths = [
              // Try exact filename first (e.g., styles-7a9baf8b.css)
              join(packageDir, 'dist', cssFileName.replace(`${packageName.replace('@', '').replace(/\//g, '-')}-`, '')),
              // Try standard locations with prioritized actual content files
              join(packageDir, 'dist', 'styles-*.css'), // Hashed files (actual content)
              join(packageDir, 'dist', 'style-*.css'),
              join(packageDir, 'lib', 'styles-*.css'),
              join(packageDir, 'dist', 'styles.css'), // Wrapper files (lower priority)
              join(packageDir, 'dist', 'style.css'),
              join(packageDir, 'lib', 'styles.css'),
              join(packageDir, 'styles.css'),
              join(packageDir, 'style.css')
            ];
            
            // Find the best CSS file (prioritize by size - actual content over wrappers)
            let bestCssPath = null;
            let bestSize = 0;
            
            for (const cssPattern of possibleCssPaths) {
              if (cssPattern.includes('*')) {
                // Handle glob patterns
                const dir = dirname(cssPattern);
                const pattern = basename(cssPattern);
                if (existsSync(dir)) {
                  const files = readdirSync(dir).filter(f => 
                    pattern.replace('*', '').split('').every(char => f.includes(char))
                  );
                  for (const file of files) {
                    const fullPath = join(dir, file);
                    if (existsSync(fullPath)) {
                      const size = statSync(fullPath).size;
                      if (size > bestSize) {
                        bestCssPath = fullPath;
                        bestSize = size;
                      }
                    }
                  }
                }
              } else if (existsSync(cssPattern)) {
                const size = statSync(cssPattern).size;
                if (size > bestSize) {
                  bestCssPath = cssPattern;
                  bestSize = size;
                }
              }
            }
            
            if (bestCssPath) {
              const cssContent = readFileSync(bestCssPath, 'utf-8');
              
              if (!this.options.silent) {
                logger.success(`✅ Serving CSS from ${packageName} (${(cssContent.length / 1024).toFixed(1)}KB)`);
              }

              // CRITICAL: Rewrite relative CSS imports to absolute URLs for dev server
              const rewrittenCss = this.rewriteCssImports(cssContent, packageName);

              return new Response(rewrittenCss, {
                headers: {
                  'Content-Type': 'text/css; charset=utf-8',
                  'Cache-Control': 'no-cache',
                  'X-Framework': '0x1',
                  'X-CSS-Source': packageName
                }
              });
            }
          }
        }
        
        return this.createNotFoundResponse('External package CSS not found');
      }
      
      // CRITICAL FIX: Restore working Tailwind v4 processing from dev-server.bak.ts
      if (reqPath === '/styles.css' || reqPath === '/dist/styles.css' || reqPath === '/globals.css') {
        // Check if Tailwind v4 is available first (same logic as working dev-server.bak.ts)
        const isV4Available = await tailwindV4Handler.isAvailable(this.options.projectPath);
        
        if (isV4Available) {
          if (!this.options.silent) {
            logger.info(`🌈 Processing Tailwind CSS v4 from ${reqPath}`);
          }

          // Use working Tailwind v4 processing
          let inputFile = tailwindV4Handler.findInputFile(this.options.projectPath);
          if (!inputFile) {
            inputFile = tailwindV4Handler.createDefaultInput(this.options.projectPath);
          }

          // Only proceed if we have a valid input file
          if (inputFile) {
            // Start Tailwind v4 process (minimal logging)
            try {
              const tailwindProcess = await tailwindV4Handler.startProcess(
                this.options.projectPath,
                inputFile,
                join(this.options.projectPath, 'dist', 'styles.css')
              );

              if (tailwindProcess && tailwindProcess.success) {
                const cssPath = join(this.options.projectPath, 'dist', 'styles.css');
                if (existsSync(cssPath)) {
                  const cssContent = readFileSync(cssPath, 'utf-8');
                  
                  if (!this.options.silent) {
                    logger.success(`✅ Serving Tailwind CSS v4 from ${cssPath.replace(this.options.projectPath, '')} (${(cssContent.length / 1024).toFixed(1)}KB)`);
                  }

                  return new Response(cssContent, {
                    headers: {
                      'Content-Type': 'text/css; charset=utf-8',
                      'Cache-Control': 'no-cache',
                      'X-Framework': '0x1',
                      'X-CSS-Engine': 'Tailwind-v4'
                    }
                  });
                }
              }
            } catch (tailwindError) {
              if (this.options.debug) {
                logger.debug(`[DevOrchestrator] Tailwind v4 process failed: ${tailwindError}`);
              }
            }
          }
        }
      }

      // Enhanced fallback CSS handling
      const cssDirectories = [
        join(this.options.projectPath, 'dist'),
        join(this.options.projectPath, 'public'),
        join(this.options.projectPath, 'app'),
        join(this.options.projectPath, 'src')
      ];

      for (const dir of cssDirectories) {
        const possiblePaths = [
          join(dir, 'styles.css'),
          join(dir, 'globals.css'),
          join(dir, 'global.css'),
          join(dir, 'app.css'),
          join(dir, 'main.css')
        ];

        for (const cssPath of possiblePaths) {
          if (existsSync(cssPath)) {
            const cssContent = readFileSync(cssPath, 'utf-8');
            
            if (!this.options.silent) {
              logger.success(`✅ Serving CSS from ${cssPath.replace(this.options.projectPath, '')} (${(cssContent.length / 1024).toFixed(1)}KB)`);
            }

            return new Response(cssContent, {
              headers: {
                'Content-Type': 'text/css; charset=utf-8',
                'Cache-Control': 'no-cache',
                'X-Framework': '0x1'
              }
            });
          }
        }
      }

      return this.createNotFoundResponse('CSS file not found');

    } catch (error) {
      logger.error(`[DevOrchestrator] CSS request failed: ${error}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Extract package name from CSS filename pattern
   * HANDLES CURRENT WRONG PATTERN: -scope-package-styles.css -> @scope/package
   */
  private extractPackageNameFromCssFile(cssFileName: string): string | null {
    // Handle current pattern with extra dash: -scope-package-styles.css -> @scope/package
    if (cssFileName.endsWith('-styles.css')) {
      let withoutExtension = cssFileName.replace('-styles.css', '');
      
      // Remove leading dash if present (current bug in both orchestrators)
      if (withoutExtension.startsWith('-')) {
        withoutExtension = withoutExtension.substring(1);
      }
      
      const parts = withoutExtension.split('-');
      if (parts.length >= 2) {
        const scope = `@${parts[0]}`; // Re-add @ prefix
        const packageName = parts.slice(1).join('-'); // handle packages with hyphens
        return `${scope}/${packageName}`;
      }
    }
    return null;
  }

  /**
   * Handle app.js bundle request - REDUCED LOGGING FOR CLEAN DEVELOPMENT
   */
  private async handleAppBundleRequest(): Promise<Response> {
    try {
      // Generate routes JSON safely with layout information
      const sanitizedRoutes = this.state.routes.map(route => ({
        path: route.path,
        componentPath: route.componentPath,
        layouts: route.layouts || []
      }));

      const routesJson = JSON.stringify(sanitizedRoutes, null, 2);

      // Generate clean app.js with minimal, essential logging only
      const appScript = `
// 0x1 Framework App Bundle - Development Ready
console.log('[0x1] Starting development app...');

// Server-discovered routes with layout information
const serverRoutes = ${routesJson};

// ===== CACHED LAYOUT SYSTEM (PREVENTS DUPLICATION) =====
const layoutCache = new Map();
const hierarchyCache = new Map(); // CRITICAL: Add global hierarchy cache

async function loadLayoutOnce(layoutPath) {
  if (layoutCache.has(layoutPath)) {
    return layoutCache.get(layoutPath);
  }
  
  try {
    console.log('[0x1 App] 📄 Loading layout:', layoutPath);
    const layoutModule = await import(layoutPath);
    
    if (layoutModule && layoutModule.default) {
      console.log('[0x1 App] ✅ Layout loaded successfully:', layoutPath);
      layoutCache.set(layoutPath, layoutModule.default);
      return layoutModule.default;
    } else {
      console.warn('[0x1 App] ⚠️ Layout has no default export:', layoutPath);
      const fallbackLayout = ({ children }) => {
        console.warn('[0x1 App] Using fallback layout for:', layoutPath);
        return children;
      };
      layoutCache.set(layoutPath, fallbackLayout);
      return fallbackLayout;
    }
  } catch (error) {
    console.error('[0x1 App] ❌ Failed to load layout:', layoutPath, error);
    const fallbackLayout = ({ children }) => {
      console.warn('[0x1 App] Using fallback layout for:', layoutPath);
      return children;
    };
    layoutCache.set(layoutPath, fallbackLayout);
    return fallbackLayout;
  }
}

async function loadLayoutHierarchy(layouts) {
  // CRITICAL: Create cache key from layout paths to avoid duplicate loading
  const cacheKey = layouts.map(l => l.componentPath).join('|');
  
  if (hierarchyCache.has(cacheKey)) {
    console.log('[0x1 App] ✅ Using cached layout hierarchy:', layouts.length, 'layouts');
    return hierarchyCache.get(cacheKey);
  }
  
  console.log('[0x1 App] 📁 Loading layout hierarchy...', layouts.length, 'layouts');
  
  // Ensure hook context is available before loading any layouts
      if (typeof window.useState !== 'function') {
        console.warn('[0x1 App] ⚠️ Hook context not available, waiting...');
        
        // Wait for hooks to be available
        await new Promise((resolve) => {
          const checkHooks = () => {
            if (typeof window.useState === 'function') {
              resolve();
            } else {
              setTimeout(checkHooks, 10);
            }
          };
          checkHooks();
        });
      }
      
  const loadedLayouts = [];
  for (const layout of layouts) {
    const loadedLayout = await loadLayoutOnce(layout.componentPath);
    loadedLayouts.push(loadedLayout);
  }
  
  // CRITICAL: Cache the loaded hierarchy
  hierarchyCache.set(cacheKey, loadedLayouts);
  
  console.log('[0x1 App] ✅ Layout hierarchy loaded:', loadedLayouts.length, 'layouts');
  return loadedLayouts;
}

// ===== NESTED LAYOUT COMPOSITION =====
function composeNestedLayouts(pageComponent, layouts) {
  if (layouts.length === 0) {
    return pageComponent;
  }
  
  return (props) => {
    let wrappedComponent = pageComponent(props);
    
    // Apply layouts in reverse order (innermost to outermost)
    for (let i = layouts.length - 1; i >= 0; i--) {
      const currentLayout = layouts[i];
      const children = wrappedComponent;
      
      try {
        wrappedComponent = currentLayout({ 
          children: children,
          ...props 
        });
      } catch (error) {
        console.error('[0x1] Layout composition error at level', i, ':', error);
        wrappedComponent = children;
      }
    }
    
    return wrappedComponent;
  };
}

// ===== DEVELOPMENT APP INITIALIZATION =====
async function initApp() {
  try {
    console.log('[0x1 App] 🚀 Starting development initialization...');
    
    // Step 1: Load and initialize essential dependencies FIRST
    console.log('[0x1 App] 🎯 Loading essential dependencies...');
    
    // Load hooks and ensure they're fully initialized
    await new Promise((resolve, reject) => {
      const hooksScript = document.createElement('script');
      hooksScript.type = 'module';
      hooksScript.src = '/0x1/hooks.js';
      hooksScript.onload = () => {
        console.log('[0x1 App] ✅ Hooks system loaded');
        
        // Wait a tick to ensure hooks are fully initialized
        setTimeout(() => {
          // Verify hooks are available
          if (typeof window.useState === 'function') {
            console.log('[0x1 App] ✅ Hook context verified');
            resolve();
          } else {
            reject(new Error('Hook system not properly initialized'));
          }
        }, 50); // Small delay to ensure initialization
      };
      hooksScript.onerror = reject;
      document.head.appendChild(hooksScript);
    });
    
    // Step 2: Initialize component context globals BEFORE loading any components
    console.log('[0x1 App] 🔧 Setting up component context...');
    
    // Ensure React-compatible globals are available
    if (!window.React) {
      window.React = {};
    }
    
    // Copy hooks to React namespace for compatibility
    ['useState', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef'].forEach(hookName => {
      if (typeof window[hookName] === 'function') {
        window.React[hookName] = window[hookName];
      }
    });
    
    console.log('[0x1 App] ✅ Component context ready');
    
    // Step 3: Create router
    console.log('[0x1 App] 🧭 Loading router...');
    const routerModule = await import('/0x1/router.js');
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    // Create 404 component
    const notFoundComponent = () => ({
      type: 'div',
      props: { 
        className: 'flex flex-col items-center justify-center min-h-[60vh] text-center px-4'
      },
      children: [
        {
          type: 'h1',
          props: { className: 'text-9xl font-bold text-violet-600 dark:text-violet-400 mb-4' },
          children: ['404'],
          key: null
        },
        {
          type: 'h2',
          props: { className: 'text-3xl font-bold text-gray-800 dark:text-white mb-4' },
          children: ['Page Not Found'],
          key: null
        },
        {
          type: 'p',
          props: { className: 'text-lg text-gray-600 dark:text-gray-300 mb-8' },
          children: ['The page you are looking for does not exist.'],
          key: null
        },
        {
          type: 'a',
          props: {
            href: '/',
            className: 'inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium',
            onClick: (e) => {
              e.preventDefault();
              if (window.router && typeof window.router.navigate === 'function') {
                window.router.navigate('/');
              } else {
                window.location.href = '/';
              }
            }
          },
          children: ['🏠 Back to Home'],
          key: null
        }
      ],
      key: null
    });
    
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/',
      notFoundComponent: notFoundComponent
    });
    
    window.__0x1_ROUTER__ = router;
    window.__0x1_router = router;
    window.router = router;
    
    // Step 4: Register routes with nested layout support (minimal logging)
    for (const route of serverRoutes) {
      try {
        // Load all layouts for this route
        const layouts = route.layouts || [];
        const loadedLayouts = await loadLayoutHierarchy(layouts);
        
        const routeComponent = async (props) => {
          try {
            const componentModule = await import(route.componentPath);
            
            if (componentModule && componentModule.default) {
              // Compose the page component with all its layouts
              const composedComponent = composeNestedLayouts(componentModule.default, loadedLayouts);
              return composedComponent(props);
            } else {
              console.warn('[0x1] Component has no default export:', route.path);
              return {
                type: 'div',
                props: { 
                  className: 'p-8 text-center',
                  style: 'color: #f59e0b;' 
                },
                children: ['Component loaded but has no default export: ' + route.path]
              };
            }
          } catch (error) {
            console.error('[0x1] Route component error:', route.path, error);
            return {
              type: 'div',
              props: { 
                className: 'p-8 text-center',
                style: 'color: #ef4444;' 
              },
              children: ['❌ Failed to load component: ' + route.path]
            };
          }
        };
        
        router.addRoute(route.path, routeComponent, { 
          componentPath: route.componentPath,
          layouts: layouts
        });
        
      } catch (error) {
        console.error('[0x1] Failed to register route:', route.path, error);
      }
    }
    
    // Step 5: Start router
    router.init();
    router.navigate(window.location.pathname, false);
    
    console.log('[0x1] ✅ App initialized successfully');
    
  } catch (error) {
    console.error('[0x1] ❌ Initialization failed:', error);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444; margin-bottom: 16px;">Application Error</h2><p style="color: #6b7280; margin-bottom: 20px;">' + error.message + '</p><details style="text-align: left; background: #f9fafb; padding: 16px; border-radius: 8px;"><summary style="cursor: pointer; font-weight: bold;">Error Details</summary><pre style="font-size: 12px; overflow-x: auto;">' + (error.stack || 'No stack trace') + '</pre></details><button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button></div>';
    }
  }
}

// ===== START IMMEDIATELY =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`;

      return new Response(appScript, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });

    } catch (error) {
      logger.error(`[DevOrchestrator] App bundle generation failed: ${error}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Handle route requests (serve main app HTML)
   */
  private async handleRouteRequest(reqPath: string): Promise<Response> {
    const matchingRoute = this.state.routes.find(route => 
      route.path === reqPath || route.path === '/'
    );

    if (matchingRoute || reqPath === '/' || reqPath === '/index.html') {
      return new Response(this.generateIndexHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return notFoundHandler(new Request(`http://localhost${reqPath}`));
  }

  /**
   * Handle static file requests
   */
  private async handleStaticFileRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const reqPath = url.pathname;
    
    // CRITICAL: Handle favicon requests specifically
    if (reqPath === '/favicon.ico' || reqPath === '/favicon.svg' || reqPath === '/favicon.png') {
      return await this.handleFaviconRequest(reqPath);
    }
    
    const staticDirs = ['public', 'dist', 'app'];
    
    for (const dir of staticDirs) {
      const response = await serveStaticFile(req, join(this.options.projectPath, dir));
      if (response) {
        return response;
      }
    }

    return this.createNotFoundResponse('Static file not found');
  }

  /**
   * Handle favicon requests with intelligent discovery
   */
  private async handleFaviconRequest(reqPath: string): Promise<Response> {
    const faviconSearchDirs = [
      join(this.options.projectPath, 'public'),
      join(this.options.projectPath, 'app'),
      join(this.options.projectPath, 'src')
    ];
    
    const faviconExtensions = ['.svg', '.ico', '.png', '.jpg', '.jpeg'];
    const foundFavicons: Array<{ path: string; name: string; priority: number }> = [];
    
    // Search for favicons with priority system
    for (const dir of faviconSearchDirs) {
      if (!existsSync(dir)) continue;
      
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          const lowerFile = file.toLowerCase();
          
          // Check if it's a favicon file
          if (lowerFile.startsWith('favicon')) {
            const ext = faviconExtensions.find(e => lowerFile.endsWith(e));
            if (ext) {
              // Priority: .svg > .ico > .png > .jpg/.jpeg
              const priority = ext === '.svg' ? 1 : 
                             ext === '.ico' ? 2 : 
                             ext === '.png' ? 3 : 4;
              
              foundFavicons.push({
                path: join(dir, file),
                name: file,
                priority
              });
            }
          }
        }
      } catch (error) {
        // Silent fail for individual directories
      }
    }
    
    // Sort by priority (lower number = higher priority)
    foundFavicons.sort((a, b) => a.priority - b.priority);
    
    if (foundFavicons.length > 0) {
      const selectedFavicon = foundFavicons[0];
      
      try {
        const faviconContent = readFileSync(selectedFavicon.path);
        const ext = selectedFavicon.name.substring(selectedFavicon.name.lastIndexOf('.'));
        
        const contentType = ext === '.svg' ? 'image/svg+xml' :
                           ext === '.ico' ? 'image/x-icon' :
                           ext === '.png' ? 'image/png' :
                           'image/jpeg';
        
        if (!this.options.silent) {
          logger.debug(`[DevOrchestrator] Serving favicon: ${selectedFavicon.name}`);
        }
        
        return new Response(faviconContent, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      } catch (error) {
        if (!this.options.silent) {
          logger.warn(`Failed to serve favicon: ${error}`);
        }
      }
    }
    
    // Generate minimal favicon.ico as fallback
    const faviconData = new Uint8Array([
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x68, 0x05,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00
    ]);
    
    return new Response(faviconData, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  }

  /**
   * Generate the main HTML page with live reload
   */
  private generateIndexHtml(): string {
    // CRITICAL: Dynamically discover external packages and their CSS - ZERO HARDCODING
    const externalCssLinks: string[] = [];
    const externalImports: Record<string, string> = {};
    
    // Scan node_modules for any scoped packages that have CSS files
    const nodeModulesPath = join(this.options.projectPath, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      try {
        const items = readdirSync(nodeModulesPath, { withFileTypes: true });
        
        for (const item of items) {
          if (item.isDirectory() && item.name.startsWith('@')) {
            // This is a scope directory like @0x1js
            const scopePath = join(nodeModulesPath, item.name);
            try {
              const scopeItems = readdirSync(scopePath, { withFileTypes: true });
              
              for (const scopeItem of scopeItems) {
                if (scopeItem.isDirectory()) {
                  const packageName = `${item.name}/${scopeItem.name}`;
                  const packageDistPath = join(scopePath, scopeItem.name, 'dist');
                  
                  // Add to import map for browser resolution
                  externalImports[packageName] = `/${packageName}/dist/index.js`;
                  
                  // Check for CSS files in the package
                  if (existsSync(packageDistPath)) {
                    try {
                      const distFiles = readdirSync(packageDistPath);
                      const cssFiles = distFiles.filter(file => file.endsWith('.css'));
                      
                      for (const cssFile of cssFiles) {
                        // FIXED: Remove @ and replace / with - (not replace both with -)
                        const cssFileName = `${packageName.replace('@', '').replace(/\//g, '-')}-${cssFile}`;
                        externalCssLinks.push(`  <link rel="stylesheet" href="/${cssFileName}">`);
                        
                        if (!this.options.silent) {
                          logger.debug(`[DevOrchestrator] Generated CSS link: ${cssFileName} from package: ${packageName}`);
                        }
                      }
                    } catch (error) {
                      // Silent fail for individual packages
                    }
                  }
                }
              }
            } catch (error) {
              // Silent fail for individual scope directories
            }
          }
        }
      } catch (error) {
        // Silent fail if node_modules doesn't exist or can't be read
      }
    }
    
    const externalCssHtml = externalCssLinks.length > 0 ? '\n' + externalCssLinks.join('\n') : '';
    
    // Build complete import map with external packages
    const importMap = {
      "0x1": "/node_modules/0x1/index.js",
      "0x1/index.js": "/node_modules/0x1/index.js",
      "0x1/jsx-runtime": "/0x1/jsx-runtime.js",
      "0x1/jsx-runtime.js": "/0x1/jsx-runtime.js",
      "0x1/jsx-dev-runtime": "/0x1/jsx-runtime.js",
      "0x1/jsx-dev-runtime.js": "/0x1/jsx-runtime.js",
      "0x1/router": "/0x1/router.js",
      "0x1/router.js": "/0x1/router.js",
      "0x1/link": "/0x1/router.js",
      "0x1/link.js": "/0x1/router.js",
      ...externalImports
    };
    
    // CRITICAL: Generate favicon link based on what's available
    let faviconLink = '';
    const faviconSearchDirs = [
      join(this.options.projectPath, 'public'),
      join(this.options.projectPath, 'app'),
      join(this.options.projectPath, 'src')
    ];
    
    for (const dir of faviconSearchDirs) {
      const faviconSvg = join(dir, 'favicon.svg');
      const faviconIco = join(dir, 'favicon.ico');
      const faviconPng = join(dir, 'favicon.png');
      
      if (existsSync(faviconSvg)) {
        faviconLink = '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">';
        break;
      } else if (existsSync(faviconIco)) {
        faviconLink = '  <link rel="icon" href="/favicon.ico" type="image/x-icon">';
        break;
      } else if (existsSync(faviconPng)) {
        faviconLink = '  <link rel="icon" href="/favicon.png" type="image/png">';
        break;
      }
    }
    
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
${faviconLink ? faviconLink + '\n' : ''}  <link rel="stylesheet" href="/styles.css">${externalCssHtml}
  <script type="importmap">{"imports":${JSON.stringify(importMap)}}</script>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <script>
    window.process={env:{NODE_ENV:'development'}};
    (function(){try{const t=localStorage.getItem('0x1-dark-mode');t==='light'?(document.documentElement.classList.remove('dark'),document.body.className='bg-white text-gray-900'):(document.documentElement.classList.add('dark'),document.body.className='bg-slate-900 text-white')}catch{document.documentElement.classList.add('dark')}})();
  </script>
  <script src="/app.js" type="module"></script>
  <script src="/__0x1_live_reload.js"></script>
</body>
</html>`;
  }

  /**
   * Start file watching for live reload
   */
  private startFileWatching(): void {
    if (this.fileWatcher) return;

    let reloadTimeout: Timer | null = null;

    this.fileWatcher = watch(this.options.projectPath, { recursive: true }, (event, filename) => {
      if (!filename) return;

      const filenameStr = filename as string;
      
      const ignorePatterns = ['node_modules', '.git', 'dist', '.DS_Store', '.0x1-temp', '.0x1'];
      if (ignorePatterns.some(pattern => filenameStr.includes(pattern))) {
        return;
      }

      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        if (this.options.debug) {
          logger.debug(`[DevOrchestrator] File changed: ${filenameStr}`);
        }

        this.invalidateCache(filenameStr);
        this.broadcastReload(filenameStr);
      }, 100);
    });
  }

  private invalidateCache(changedFile: string): void {
    const fullPath = resolve(this.options.projectPath, changedFile);
    this.state.components.delete(fullPath);
    transpilationEngine.clearCache();
  }

  private broadcastReload(filename?: string): void {
    const message = JSON.stringify({ 
      type: 'reload', 
      filename,
      timestamp: Date.now()
    });

    for (const client of this.state.clientConnections) {
      try {
        client.send(message);
      } catch (error) {
        // Client disconnected
      }
    }

    if (!this.options.silent && filename) {
      logger.info(`💠 Reloading due to: ${filename}`);
    }
  }

  private isWebSocketUpgrade(path: string): boolean {
    return path === '/ws' || path === '/__0x1_ws' || path === '/__0x1_ws_live_reload';
  }

  private isLiveReloadEndpoint(path: string): boolean {
    return path === '/__0x1_live_reload.js' || path === '/__0x1_sse_live_reload';
  }

  private isCssRequest(path: string): boolean {
    return path.endsWith('.css') || 
           path === '/styles.css' || 
           path === '/globals.css' ||
           // FIXED: Detect scoped package CSS patterns: /scope-package-styles.css (matches BuildOrchestrator)
           path.includes('-styles.css');
  }

  private isFrameworkRequest(path: string): boolean {
    return path.startsWith('/0x1/') || 
           path.startsWith('/node_modules/0x1/') || 
           path.includes('hooks-') ||
           path === '/node_modules/0x1/core/hooks.js';
  }

  private isComponentRequest(path: string): boolean {
    return (path.endsWith('.js') && (
      path.includes('/app/') || 
      path.includes('/components/') || 
      path.includes('/lib/') || 
      path.includes('/src/')
    )) || path.startsWith('/components/') || path.startsWith('/lib/') ||
    (path.includes('/layout.js') || path.includes('/page.js'));
  }

  private isRouteRequest(path: string): boolean {
    return !path.includes('.') && 
           !path.startsWith('/node_modules') && 
           !path.startsWith('/0x1') && 
           !path.startsWith('/__0x1');
  }

  private handleWebSocketMessage(ws: ServerWebSocket<any>, message: string | Uint8Array): void {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : JSON.parse(new TextDecoder().decode(message));
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (error) {
      if (this.options.debug) {
        logger.error(`[DevOrchestrator] WebSocket message error: ${error}`);
      }
    }
  }

  private handleWebSocketOpen(ws: ServerWebSocket<any>): void {
    ws.data = { connectionId: `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}` };
    this.state.clientConnections.add(ws);
    
    if (this.options.debug) {
      logger.debug(`[DevOrchestrator] WebSocket client connected: ${ws.data.connectionId}`);
    }
  }

  private handleWebSocketClose(ws: ServerWebSocket<any>): void {
    this.state.clientConnections.delete(ws);
    
    if (this.options.debug && ws.data) {
      logger.debug(`[DevOrchestrator] WebSocket client disconnected: ${ws.data.connectionId}`);
    }
  }

  private handleWebSocketUpgrade(req: Request, server: Server): Response {
    if (server.upgrade(req)) {
      return new Response(null, { status: 101 });
    }
    return new Response('WebSocket upgrade failed', { status: 400 });
  }

  private handleLiveReloadEndpoint(path: string, req: Request): Response {
    if (path === '/__0x1_live_reload.js') {
      const liveReloadScript = `
console.log('[0x1] Live reload connected');

let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  ws = new WebSocket('ws://localhost:${this.options.port}/__0x1_ws');
  
  ws.onopen = () => {
    console.log('[0x1] Live reload ready');
    reconnectAttempts = 0;
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      console.log('[0x1] Reloading...', data.filename || '');
      window.location.reload();
    }
  };
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log('[0x1] Reconnecting live reload...', reconnectAttempts);
      setTimeout(connect, 1000 * reconnectAttempts);
    }
  };
  
  ws.onerror = () => {
    console.warn('[0x1] Live reload connection error');
  };
}

connect();
`;
      return new Response(liveReloadScript, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }

    return new Response('SSE not implemented', { status: 501 });
  }

  private getFrameworkPath(): string {
    return process.cwd().includes('00-Dev/0x1') 
      ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
      : join(process.cwd(), '../0x1');
  }

  private createErrorResponse(error: any): Response {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  private createNotFoundResponse(message: string): Response {
    return new Response(message, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  /**
   * Check if request is for an external scoped package
   */
  private isExternalScopedPackageRequest(path: string): boolean {
    // Check for imports like /@0x1js/highlighter/... pattern
    return path.match(/^\/@[^/]+\/[^/]+/) !== null;
  }

  /**
   * Handle external scoped package requests
   */
  private async handleExternalScopedPackageRequest(reqPath: string): Promise<Response> {
    try {
      // Extract package name from path like /@0x1js/highlighter/dist/index.js
      const packageMatch = reqPath.match(/^\/(@[^/]+\/[^/]+)/);
      if (!packageMatch) {
        return this.createNotFoundResponse('Invalid scoped package path');
      }
      
      const packageName = packageMatch[1];
      const packagePath = reqPath.substring(packageName.length + 1); // Remove /@scope/package
      
      // Find the actual file in node_modules
      const fullPackagePath = join(this.options.projectPath, 'node_modules', packageName);
      const requestedFilePath = join(fullPackagePath, packagePath);
      
      if (!existsSync(requestedFilePath)) {
        // Try common fallbacks
        const fallbacks = [
          join(fullPackagePath, 'dist', 'index.js'),
          join(fullPackagePath, 'lib', 'index.js'),
          join(fullPackagePath, 'index.js'),
          join(fullPackagePath, 'dist', packagePath),
          join(fullPackagePath, 'lib', packagePath)
        ];
        
        let foundPath = null;
        for (const fallback of fallbacks) {
          if (existsSync(fallback)) {
            foundPath = fallback;
            break;
          }
        }
        
        if (!foundPath) {
          if (!this.options.silent) {
            logger.warn(`External package file not found: ${reqPath}`);
          }
          return this.createNotFoundResponse(`External package file not found: ${reqPath}`);
        }
        
        // Serve the fallback file
        const content = readFileSync(foundPath, 'utf-8');
        return new Response(content, {
          headers: {
            'Content-Type': foundPath.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Serve the requested file
      const content = readFileSync(requestedFilePath, 'utf-8');
      
      if (!this.options.silent) {
        logger.debug(`[DevOrchestrator] Serving external package: ${packageName}${packagePath}`);
      }
      
      return new Response(content, {
        headers: {
          'Content-Type': requestedFilePath.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain',
          'Cache-Control': 'no-cache'
        }
      });
      
    } catch (error) {
      if (!this.options.silent) {
        logger.error(`[DevOrchestrator] External package error: ${error}`);
      }
      return this.createErrorResponse(error);
    }
  }

  async cleanup(): Promise<void> {
    if (!this.options.silent) {
      logger.info('🧹 Shutting down development server...');
    }

    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }

    for (const client of this.state.clientConnections) {
      try {
        client.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    if (this.server) {
      this.server.stop();
      this.server = null;
    }

    this.state.clientConnections.clear();
    this.state.components.clear();
    
    if (!this.options.silent) {
      logger.success('✅ Development server shutdown complete');
    }
  }

  /**
   * Rewrite relative CSS imports to absolute URLs for dev server
   */
  private rewriteCssImports(cssContent: string, packageName: string): string {
    // Convert relative imports like @import './styles-7a9baf8b.css' to absolute URLs
    return cssContent.replace(
      /@import\s+['"]\.\/([^'"]+)['"];?/g,
      (match, filename) => {
        // Generate the absolute URL for the imported CSS file
        const absoluteUrl = `/${packageName.replace('@', '').replace(/\//g, '-')}-${filename}`;
        return `@import '${absoluteUrl}';`;
      }
    );
  }
}