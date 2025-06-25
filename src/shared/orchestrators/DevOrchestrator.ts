/**
 * 0x1 Framework - Development Orchestrator
 * Unified development server using shared core utilities
 * Replaces monolithic dev-server.ts with clean, maintainable architecture
 */

import { serve, ServerWebSocket, type Server } from 'bun';
import { existsSync, readdirSync, readFileSync, statSync, watch } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

// Import shared core utilities
import { getConfigurationManager } from '../core/ConfigurationManager';
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
import { injectPWAIntoHTML, PWAConfig, PWAHandler } from '../core/PWAHandler';

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
    parentLayouts: Array<{ path: string; componentPath: string }> = [],
    groupInfo?: { routeGroup: string; isRouteGroup: boolean }
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
          
          // CRITICAL FIX: Determine actual file system path relative to dirPath
          const relativePath = relative(join(this.options.projectPath, 'app'), dirPath);
          const layoutComponentPath = relativePath 
            ? `/app/${relativePath}/${actualLayoutFile.replace(/\.(tsx|ts)$/, ".js")}`
            : `/app/${actualLayoutFile.replace(/\.(tsx|ts)$/, ".js")}`;
          
          // CRITICAL FIX: Route group layouts should REPLACE parent layouts, not add to them
          // This prevents duplicate layout nesting (root + chat layout)
          const isRouteGroupLayout = relativePath.includes('(') && relativePath.includes(')');
          
          if (isRouteGroupLayout) {
            // Route group layouts replace the root layout for their specific routes
            currentLayouts.length = 0; // Clear parent layouts
            currentLayouts.push({ 
              path: routePath || "/", 
              componentPath: layoutComponentPath 
            });
            
            if (this.options.debug) {
              logger.debug(`Route group layout replaces root layout: ${routePath || "/"} -> ${layoutComponentPath}`);
            }
          } else {
            // Regular layouts check for duplicates and add to hierarchy
            const isDuplicate = currentLayouts.some(layout => 
              layout.componentPath === layoutComponentPath
            );
            
            if (!isDuplicate) {
              currentLayouts.push({ 
                path: routePath || "/", 
                componentPath: layoutComponentPath 
              });
              
              if (this.options.debug) {
                logger.debug(`Found layout: ${routePath || "/"} -> ${layoutComponentPath} (relative: ${relativePath})`);
              }
            } else {
              if (this.options.debug) {
                logger.debug(`Skipping duplicate layout: ${layoutComponentPath}`);
              }
            }
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
          
                  // ENHANCED: Handle route groups (directories wrapped in parentheses)
        const isRouteGroup = subdir.startsWith('(') && subdir.endsWith(')');
        
        if (isRouteGroup) {
          // Route groups don't affect the URL path, but their layouts are included
          const groupName = subdir.slice(1, -1); // Extract group name without parentheses
          
          if (this.options.debug) {
            logger.debug(`Processing route group: ${subdir} (group: ${groupName}, path remains: ${routePath})`);
          }
          
          // CRITICAL FIX: Pass route group information for better debugging and conflict resolution
          scanDirectory(subdirPath, routePath, currentLayouts, { routeGroup: groupName, isRouteGroup: true });
        } else {
          // Regular directories add to the route path
          const subroutePath = routePath + "/" + subdir;
          
          if (this.options.debug) {
            logger.debug(`Processing regular directory: ${subdir} (new path: ${subroutePath})`);
          }
          
          scanDirectory(subdirPath, subroutePath, currentLayouts);
        }
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
        return await this.handleFrameworkRequest(reqPath, req);
      }

      // 4. Node modules polyfill system (CRITICAL - RESTORED)
      if (reqPath.startsWith('/node_modules/')) {
        return await this.handleNodeModulesRequest(reqPath);
      }

      // 4.5. External scoped packages (CRITICAL - MISSING FROM DEV)
      if (this.isExternalScopedPackageRequest(reqPath)) {
        return await this.handleExternalScopedPackageRequest(reqPath);
      }

      // 4.6. CRITICAL: Handle CSS style requests from scoped packages like @0x1js/highlighter/styles
      if (reqPath.includes('/styles') && (reqPath.startsWith('/@') || reqPath.includes('node_modules/@'))) {
        return await this.handleScopedPackageStylesRequest(reqPath);
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
  private async handleFrameworkRequest(reqPath: string, req?: Request): Promise<Response> {
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
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/server-actions["']/g, 
                'import { $1 } from "/0x1/server-actions.js"')
              .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
                'import { $1 } from "/node_modules/0x1/index.js"');
            
            return new Response(content, {
              headers: {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
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
            
            // CRITICAL FIX: Override router's minimal hooks setup with full system
            content += `
if (typeof window !== 'undefined') {
  // CRITICAL: Override any existing minimal hook systems (like router's) with full system
  // This ensures the router uses the real hooks instead of its own minimal version
  
  // Store references to the real hooks functions
  const realHookSystem = {
    enterComponentContext,
    exitComponentContext,
    setComponentContext,
    clearComponentContext,
    triggerComponentUpdate
  };
  
  // Make hooks available globally
  Object.assign(window, {
    useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
    useClickOutside, useFetch, useForm, useLocalStorage, useGlobalState, useTheme
  });
  
  // Initialize React compatibility  
  window.React = window.React || {};
  Object.assign(window.React, {
    useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
    useClickOutside, useFetch, useForm, useLocalStorage, useGlobalState, useTheme
  });
  
  // CRITICAL: Override router's hook context functions with real implementations
  window.__0x1_enterComponentContext = realHookSystem.enterComponentContext;
  window.__0x1_exitComponentContext = realHookSystem.exitComponentContext;
  window.__0x1_triggerUpdate = realHookSystem.triggerComponentUpdate;
  
  // Full hooks registry (override any minimal version)
  window.__0x1_hooks = {
    useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
    useClickOutside, useFetch, useForm, useLocalStorage, useGlobalState, useTheme,
    isInitialized: true,
    contextReady: true,
    // Keep router compatibility fields but delegate to real system
    currentComponent: null,
    stateIndex: 0,
    states: new Map(),
    isRenderingComponent: false,
    componentStack: [],
    // Add real system access
    componentRegistry,
    updateQueue,
    componentContextStack,
    currentComponentId,
    currentHookIndex,
    // Global state system access
    setGlobalState,
    getGlobalState,
    subscribeToGlobalState,
    unsubscribeFromGlobalState
  };
  
  console.log('[0x1 Hooks] FULL hooks system initialized - router integration ready');
  
  // Component context ready flag
  window.__0x1_component_context_ready = true;
  
  // CRITICAL: Initialize browser compatibility immediately
  initializeBrowserCompat();
}
`;
            
            return new Response(content, {
              headers: { 
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0'
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
export const useGlobalState = createHookGetter('useGlobalState');
export const useTheme = createHookGetter('useTheme');

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
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
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
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
      
      return this.createErrorResponse('Router not built - run "bun run build:framework" first');
    }

    // Handle error boundary requests (both paths for compatibility)
    if (reqPath === '/error-boundary.js' || reqPath === '/0x1-error-boundary.js' || reqPath.startsWith('/0x1-error-boundary.js?')) {
      try {
        const errorBoundaryPath = join(frameworkPath, 'src', 'browser', 'error', 'error-boundary.js');
        if (existsSync(errorBoundaryPath)) {
          let content = readFileSync(errorBoundaryPath, 'utf-8');
          
          // Add development mode enhancements
          content += `\n\n// Development mode enhancements
console.log('[0x1 Error Boundary] Loaded in development mode with enhanced debugging');

// Auto-capture console errors immediately
if (typeof window !== 'undefined' && window.__0x1_errorBoundary) {
  // FIXED: Completely disable automatic SVG error detection - too many false positives
  // SVG errors will only be caught if they actually appear in console.error with specific messages
  setTimeout(() => {
    // Only trigger if there's an actual browser SVG parsing error in the console
    // This prevents false positives from the word "path" appearing in normal code
    // REMOVED: SVG error detection - too many false positives
    // Only actual SVG parsing errors will be shown by the browser console
  }, 100);
}
`;
          
          return new Response(content, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Error-Boundary': 'development'
            }
          });
        }
      } catch (error) {
        logger.error(`Error boundary error: ${error}`);
      }
      
      return this.createErrorResponse('Error boundary not available');
    }

    // Handle server actions endpoint
    if (reqPath === '/__0x1_server_action') {
      if (!req) {
        return this.createErrorResponse('Request object required for server actions', 400);
      }
      
      try {
        const { handleServerAction } = await import('../../core/directives.js');
        // Pass the original request directly to the handler
        return await handleServerAction(req);
      } catch (error) {
        logger.error(`Server action handler error: ${error}`);
        return this.createErrorResponse('Server action handler not available', 500);
      }
    }

    // Handle server actions client wrapper
    if (reqPath === '/0x1/server-actions.js' || reqPath === '/0x1/server-actions') {
      try {
        const serverActionsPath = join(frameworkPath, 'src', 'core', 'server-actions-client.ts');
        if (existsSync(serverActionsPath)) {
          const transpiled = await Bun.build({
            entrypoints: [serverActionsPath],
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'none',
            external: []
          });
          
          if (transpiled.success && transpiled.outputs.length > 0) {
            let content = '';
            for (const output of transpiled.outputs) {
              content += await output.text();
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
        logger.error(`Server actions client error: ${error}`);
      }
      
      return this.createErrorResponse('Server actions client not available');
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
   * Preprocess source code for browser compatibility
   */
  private preprocessSourceForBrowser(sourceContent: string): string {
    let processed = sourceContent;
    
    // Remove 'use client' directives (Next.js specific)
    processed = processed.replace(/['"]use client['"];\s*/g, '');
    
    // Replace React types with generic types
    processed = processed.replace(/React\.ReactNode/g, 'any');
    processed = processed.replace(/React\.FC</g, '(props: ');
    processed = processed.replace(/React\.Component</g, 'Component<');
    
    // Fix JSX return statements without parentheses
    processed = processed.replace(/return\s+(<[^>]*[\s\S]*?)$/gm, 'return ($1');
    
    // Add missing closing parentheses for JSX returns
    const lines = processed.split('\n');
    let inJsxReturn = false;
    let braceCount = 0;
    let parenCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/return\s*\(/)) {
        inJsxReturn = true;
        parenCount = 1;
        braceCount = 0;
      } else if (inJsxReturn) {
        // Count braces and parentheses to find the end of JSX
        for (const char of line) {
          if (char === '(') parenCount++;
          if (char === ')') parenCount--;
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        // If we've closed all parens and we're at a function boundary, end JSX
        if (parenCount === 0 && braceCount <= 0 && (line.includes('}') || line.includes(';'))) {
          inJsxReturn = false;
          if (!line.includes(')')) {
            lines[i] = line + ')';
          }
        }
      }
    }
    
    processed = lines.join('\n');
    
    return processed;
  }

  /**
   * Create browser polyfills for Node.js built-in modules
   */
  private createNodeBuiltinPolyfill(moduleName: string): Response {
    let polyfillCode = '';

    switch (moduleName) {
      case 'stream/web':
        polyfillCode = `
// Browser polyfill for stream/web
export class ReadableStream {
  constructor(underlyingSource = {}, strategy = {}) {
    if (typeof window !== 'undefined' && window.ReadableStream) {
      return new window.ReadableStream(underlyingSource, strategy);
    }
    
    // Minimal fallback implementation
    this._source = underlyingSource;
    this._strategy = strategy;
    this._reader = null;
  }
  
  getReader() {
    if (typeof window !== 'undefined' && window.ReadableStream) {
      return new window.ReadableStream(this._source, this._strategy).getReader();
    }
    
    return {
      read: () => Promise.resolve({ done: true, value: undefined }),
      releaseLock: () => {},
      cancel: () => Promise.resolve()
    };
  }
}

export class WritableStream {
  constructor(underlyingSink = {}, strategy = {}) {
    if (typeof window !== 'undefined' && window.WritableStream) {
      return new window.WritableStream(underlyingSink, strategy);
    }
    
    this._sink = underlyingSink;
    this._strategy = strategy;
  }
  
  getWriter() {
    if (typeof window !== 'undefined' && window.WritableStream) {
      return new window.WritableStream(this._sink, this._strategy).getWriter();
    }
    
    return {
      write: () => Promise.resolve(),
      close: () => Promise.resolve(),
      abort: () => Promise.resolve(),
      releaseLock: () => {}
    };
  }
}

export class TransformStream {
  constructor(transformer = {}, readableStrategy = {}, writableStrategy = {}) {
    if (typeof window !== 'undefined' && window.TransformStream) {
      return new window.TransformStream(transformer, readableStrategy, writableStrategy);
    }
    
    this.readable = new ReadableStream();
    this.writable = new WritableStream();
  }
}

// Make available globally
if (typeof globalThis !== 'undefined') {
  globalThis.ReadableStream = globalThis.ReadableStream || ReadableStream;
  globalThis.WritableStream = globalThis.WritableStream || WritableStream;
  globalThis.TransformStream = globalThis.TransformStream || TransformStream;
}

console.log('[0x1] stream/web polyfill loaded');
`;
        break;

      case 'stream':
        polyfillCode = `
// Browser polyfill for Node.js stream module
export class Readable {
  constructor(options = {}) {
    this._readableState = { flowing: false, ended: false };
    this._options = options;
  }
  
  pipe(destination) {
    return destination;
  }
  
  read() {
    return null;
  }
  
  on(event, listener) {
    return this;
  }
  
  emit(event, ...args) {
    return false;
  }
}

export class Writable {
  constructor(options = {}) {
    this._writableState = { ended: false };
    this._options = options;
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }
    if (callback) callback();
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = null;
    }
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }
    if (callback) callback();
  }
}

export class Transform extends Readable {
  constructor(options = {}) {
    super(options);
  }
  
  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
}

console.log('[0x1] stream polyfill loaded');
`;
        break;

      case 'buffer':
        polyfillCode = `
// Browser polyfill for Node.js buffer module
export const Buffer = (function() {
  if (typeof window !== 'undefined' && window.Buffer) {
    return window.Buffer;
  }
  
  // Minimal Buffer implementation
  function Buffer(data, encoding = 'utf8') {
    if (typeof data === 'string') {
      return new TextEncoder().encode(data);
    }
    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }
    if (typeof data === 'number') {
      return new Uint8Array(data);
    }
    return new Uint8Array(data || 0);
  }
  
  Buffer.from = function(data, encoding) {
    return new Buffer(data, encoding);
  };
  
  Buffer.alloc = function(size, fill = 0) {
    const buf = new Uint8Array(size);
    buf.fill(fill);
    return buf;
  };
  
  Buffer.isBuffer = function(obj) {
    return obj instanceof Uint8Array;
  };
  
  return Buffer;
})();

export default Buffer;
console.log('[0x1] buffer polyfill loaded');
`;
        break;

      default:
        polyfillCode = `
// Generic Node.js built-in polyfill for ${moduleName}
console.warn('[0x1] Using generic polyfill for Node.js built-in: ${moduleName}');

const polyfill = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'string') {
      return function(...args) {
        console.warn('[0x1] Called polyfilled function: ' + '${moduleName}' + '.' + prop);
        return {};
      };
    }
    return undefined;
  }
});

export default polyfill;
export const ${moduleName.replace(/[^a-zA-Z0-9]/g, '_')} = polyfill;
`;
        break;
    }

    return new Response(polyfillCode, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Polyfill': moduleName
      }
    });
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
      packageName = packagePath.split('/')[0];
      filePath = packagePath.substring(packageName.length + 1);
    }

    // ENHANCED: Handle Node.js built-in modules with browser polyfills
    const nodeBuiltins = [
      'stream', 'stream/web', 'stream/consumers', 'stream/promises',
      'fs', 'fs/promises', 'path', 'crypto', 'http', 'https', 'url', 'util',
      'events', 'buffer', 'os', 'child_process', 'cluster', 'dgram', 'dns',
      'net', 'tls', 'readline', 'repl', 'string_decoder', 'tty', 'vm',
      'worker_threads', 'zlib', 'assert', 'async_hooks', 'console',
      'constants', 'domain', 'module', 'perf_hooks', 'process', 'punycode',
      'querystring', 'sys', 'timers', 'trace_events', 'v8'
    ];

    if (nodeBuiltins.includes(packageName)) {
      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Providing browser polyfill for Node.js built-in: ${packageName}`);
      }
      return this.createNodeBuiltinPolyfill(packageName);
    }

    // Check if package exists first
    const packageDir = join(this.options.projectPath, 'node_modules', packageName);
    if (existsSync(packageDir)) {
      try {
        // Try to serve the exact requested file
        const requestedFilePath = join(packageDir, filePath);
        
        // CRITICAL FIX: Check if the requested path is a directory first
        if (existsSync(requestedFilePath)) {
          const stats = statSync(requestedFilePath);
          
          if (stats.isDirectory()) {
            // If it's a directory, try to resolve to index.js or package.json main
            const packageJsonPath = join(requestedFilePath, 'package.json');
            let entryFile = 'index.js';
            
            if (existsSync(packageJsonPath)) {
              try {
                const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
                entryFile = packageJson.module || packageJson.main || 'index.js';
              } catch (e) {
                // Fallback to index.js if package.json is malformed
              }
            }
            
            const resolvedPath = join(requestedFilePath, entryFile);
            if (existsSync(resolvedPath) && stats.isFile()) {
              const content = readFileSync(resolvedPath, 'utf-8');
              
              if (!this.options.silent) {
                logger.debug(`[DevOrchestrator] Resolved directory to entry: ${packageName}/${filePath} -> ${entryFile}`);
              }
              
              return new Response(content, {
                headers: {
                  'Content-Type': 'application/javascript; charset=utf-8',
                  'Cache-Control': 'no-cache'
                }
              });
            }
          } else if (stats.isFile()) {
            // It's a file, read it normally
            let content = readFileSync(requestedFilePath, 'utf-8');
            
            // CRITICAL: Handle CSS files specially
            if (requestedFilePath.endsWith('.css')) {
              // Rewrite relative CSS imports to absolute URLs
              content = content.replace(
                /@import\s+['"]\.\/([^'"]+)['"];?/g,
                (match, filename) => {
                  const absoluteUrl = `/node_modules/${packageName}/dist/${filename}`;
                  return `@import '${absoluteUrl}';`;
                }
              );
              
              if (!this.options.silent) {
                logger.debug(`[DevOrchestrator] Serving CSS: ${packageName}/${filePath} (${content.length} bytes)`);
              }
              
              return new Response(content, {
                headers: {
                  'Content-Type': 'text/css; charset=utf-8',
                  'Cache-Control': 'no-cache'
                }
              });
            }
            
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
        }
        
        // If exact file doesn't exist, try fallbacks
        const packageJsonPath = join(packageDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          const mainFile = packageJson.module || packageJson.main || 'index.js';
          const mainPath = join(packageDir, mainFile);
          
          if (existsSync(mainPath)) {
            let content = readFileSync(mainPath, 'utf-8');
            
            // CRITICAL: Handle CSS files specially
            if (mainPath.endsWith('.css')) {
              // Rewrite relative CSS imports to absolute URLs
              content = content.replace(
                /@import\s+['"]\.\/([^'"]+)['"];?/g,
                (match, filename) => {
                  const absoluteUrl = `/node_modules/${packageName}/dist/${filename}`;
                  return `@import '${absoluteUrl}';`;
                }
              );
              
              if (!this.options.silent) {
                logger.debug(`[DevOrchestrator] Serving main CSS for: ${packageName} -> ${mainFile}`);
              }
              
              return new Response(content, {
                headers: {
                  'Content-Type': 'text/css; charset=utf-8',
                  'Cache-Control': 'no-cache'
                }
              });
            }
            
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
} else if (typeof global !== 'undefined') {
  global['${packageName}'] = intelligentNamespace;
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

      // CRITICAL FIX: Skip cache for components that previously failed export detection
      const cached = this.state.components.get(sourcePath);
      const shouldSkipCache = cached && (
        cached.content.includes('Component has no default export') ||
        !cached.content.includes('export default') ||
        cached.content.includes('undefined')
      );
      
      // Clear problematic cache entries
      if (shouldSkipCache) {
        if (this.options.debug) {
          logger.debug(`[DevOrchestrator] Clearing problematic cache for: ${sourcePath}`);
        }
        this.state.components.delete(sourcePath);
      }
      
      if (cached && !shouldSkipCache && await this.isFileUnchanged(sourcePath, cached.mtime)) {
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
      let sourceContent = readFileSync(sourcePath, 'utf-8');
      
      // CRITICAL FIX: Handle client directives and React types
      sourceContent = this.preprocessSourceForBrowser(sourceContent);
      
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

      // ENHANCED ES MODULE TRANSFORMATION - BULLETPROOF FOR ALL CASES
      const hasExportDefault = content.includes('export default');
      if (hasExportDefault) {
        if (this.options.debug) {
          logger.debug(`[DevOrchestrator] Enhanced transformation for: ${sourcePath}`);
          logger.debug(`[DevOrchestrator] BEFORE:\n${content.substring(0, 300)}`);
        }
        
        // STEP 1: Smart component name extraction with fallbacks
        let componentName = '';
        
        // Try multiple patterns for component detection
        const patterns = [
          // Function declarations: function ComponentName() {}
          /function\s+([A-Z]\w*)\s*\([^)]*\)\s*\{/,
          // Arrow functions: const ComponentName = () => {}
          /(?:const|let|var)\s+([A-Z]\w*)\s*=\s*\([^)]*\)\s*=>/,
          // Arrow functions with props: const ComponentName = (props) => {}
          /(?:const|let|var)\s+([A-Z]\w*)\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>/,
          // Function expressions: const ComponentName = function() {}
          /(?:const|let|var)\s+([A-Z]\w*)\s*=\s*function/,
          // Export default function: export default function ComponentName() {}
          /export\s+default\s+function\s+([A-Z]\w*)\s*\(/,
          // Default export with name: export default ComponentName
          /export\s+default\s+([A-Z]\w+)(?:\s|;|$)/
        ];
        
        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            componentName = match[1];
            break;
          }
        }
        
        // Fallback to filename-based component name
        if (!componentName) {
          componentName = basename(reqPath, extname(reqPath))
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[a-z]/, c => c.toUpperCase());
          
          // Ensure it's a valid component name
          if (!componentName || componentName.length === 0) {
            componentName = 'DefaultComponent';
          } else if (!/^[A-Z]/.test(componentName)) {
            componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
          }
          
          if (!componentName.endsWith('Component') && componentName.length < 8) {
            componentName += 'Component';
          }
        }
        
        // STEP 2: ENHANCED EXPORT REPLACEMENT - Handle all edge cases
        try {
          // Pattern 1: export default function ComponentName() {}
          if (content.includes('export default function')) {
            content = content.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
          }
          
          // Pattern 2: export default ComponentName (at end of file)
          else if (content.match(/export\s+default\s+\w+\s*;?\s*$/)) {
            content = content.replace(/export\s+default\s+(\w+)\s*;?\s*$/, '');
          }
          
          // Pattern 3: const ComponentName = () => {}; export default ComponentName;
          else if (content.includes('export default ' + componentName)) {
            content = content.replace(new RegExp(`export\\s+default\\s+${componentName}\\s*;?`, 'g'), '');
          }
          
          // Pattern 4: Generic export default removal (fallback)
          else {
            content = content.replace(/export\s+default\s+/g, '');
          }
          
          // STEP 3: Add ES module compatible assignment
          content += `

// 0x1 Framework: ES Module Compatible Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${componentName};
  module.exports.default = ${componentName};
  module.exports.__esModule = true;
}

// Browser global assignment
if (typeof window !== 'undefined') {
  window.default = ${componentName};
  window['${componentName}'] = ${componentName};
}

// Node.js global assignment
if (typeof global !== 'undefined') {
  global.default = ${componentName};
  global['${componentName}'] = ${componentName};
}

// Dynamic import compatibility
export default ${componentName};
`;
          
          if (this.options.debug) {
            logger.debug(`[DevOrchestrator] Enhanced transformation completed`);
            logger.debug(`[DevOrchestrator] Component name: ${componentName}`);
          }
          
        } catch (transformError) {
          logger.error(`[DevOrchestrator] Transform error for ${sourcePath}: ${transformError}`);
          
          // Emergency fallback - just remove export default
          content = content.replace(/export\s+default\s+/g, '');
          content += `\n\n// Emergency fallback export\nif (typeof module !== 'undefined' && module.exports) { module.exports = ${componentName}; }\n`;
        }
      }
      
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
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/server-actions["']/g, 
          'import { $1 } from "/0x1/server-actions.js"')
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
          'import { $1 } from "/node_modules/0x1/index.js"');
        
        // CRITICAL: Transform server actions first (before import transformation)
        const { transformServerActions } = await import('../../core/server-actions-transformer.js');
        content = transformServerActions(content, sourcePath, this.options.projectPath, 'development');

        // CRITICAL: Use unified ImportTransformer for robust import handling (SINGLE SOURCE OF TRUTH)
        content = ImportTransformer.transformImports(content, {
          sourceFilePath: sourcePath,
          projectPath: this.options.projectPath,
          mode: 'development',
          debug: this.options.debug || false // Only enable when explicitly debugging
        });

        // Error boundary is loaded via script tag in HTML template - no need for dynamic injection

        // Cache the transformed content
        this.state.components.set(sourcePath, {
          content,
          mtime: statSync(sourcePath).mtime.getTime()
        });

        if (this.options.debug) {
          logger.debug(`[DevOrchestrator] Component transformation completed: ${sourcePath}`);
        }

        return new Response(content, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
        });

    } catch (error) {
      logger.error(`[DevOrchestrator] Component request failed: ${error}`);
      return this.createErrorResponse(`Component transformation failed: ${error}`, 500);
    }
  }

  /**
   * Generate possible source file paths - ENHANCED FOR ROUTE GROUPS
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

      // CRITICAL: Handle Next.js route groups
      // For /app/chat/page.js, also check /app/(chat)/chat/page.tsx
      const pathSegments = appRelativePath.split('/');
      if (pathSegments.length >= 2) {
        const [firstSegment, ...restSegments] = pathSegments;
        
        // Try route group variations: wrap the first segment in parentheses and duplicate it
        const routeGroupVariations = [
          `(${firstSegment})/${firstSegment}/${restSegments.join('/')}`,
          `(${firstSegment})/${restSegments.join('/')}`
        ];
        
        for (const variation of routeGroupVariations) {
          const routeGroupPath = join(this.options.projectPath, 'app', variation);
          for (const ext of extensions) {
            paths.push(`${routeGroupPath}${ext}`);
          }
        }
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
   * Generate comprehensive Tailwind fallback CSS for Entity Zero app
   */
  private generateTailwindFallback(originalCss: string): string {
    // CRITICAL: Replace the Tailwind import with actual utility classes, preserving Entity Zero styles
    const processedCss = originalCss.replace(
      /@import\s+["']tailwindcss["'];?\s*/g, 
      `/* Tailwind CSS utilities - generated fallback for Entity Zero */

/* Tailwind Base Reset */
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: var(--border); }

/* Essential Tailwind Utilities */
.container { width: 100%; margin-left: auto; margin-right: auto; padding-left: 1rem; padding-right: 1rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.pt-20 { padding-top: 5rem; }
.pb-32 { padding-bottom: 8rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-12 { margin-bottom: 3rem; }
.mb-16 { margin-bottom: 4rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-auto { margin-top: auto; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-grow { flex-grow: 1; }
.grid { display: grid; }
.gap-3 { gap: 0.75rem; }
.w-full { width: 100%; }
.w-5 { width: 1.25rem; }
.h-full { height: 100%; }
.h-5 { height: 1.25rem; }
.min-h-screen { min-height: 100vh; }
.max-w-4xl { max-width: 56rem; }
.max-w-2xl { max-width: 42rem; }
.relative { position: relative; }
.absolute { position: absolute; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.bg-background { background-color: var(--background); }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
.from-background { --tw-gradient-from: var(--background); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.via-background\\/90 { --tw-gradient-stops: var(--tw-gradient-from), rgba(255, 255, 255, 0.9), var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.to-background\\/80 { --tw-gradient-to: rgba(255, 255, 255, 0.8); }
.from-primary { --tw-gradient-from: var(--primary); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.to-accent { --tw-gradient-to: var(--accent); }
.dark\\:from-background:is(.dark *) { --tw-gradient-from: var(--background); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.dark\\:via-\\[\\#0f0f18\\]:is(.dark *) { --tw-gradient-stops: var(--tw-gradient-from), #0f0f18, var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.dark\\:to-\\[\\#121220\\]:is(.dark *) { --tw-gradient-to: #121220; }
.text-foreground { color: var(--foreground); }
.text-muted-foreground { color: var(--muted-foreground); }
.text-white { color: #ffffff; }
.text-center { text-align: center; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-7xl { font-size: 4.5rem; line-height: 1; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.leading-tight { line-height: 1.25; }
.leading-relaxed { line-height: 1.625; }
.border { border-width: 1px; }
.border-t { border-top-width: 1px; }
.border-border { border-color: var(--border); }
.rounded-xl { border-radius: 0.75rem; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-300 { transition-duration: 300ms; }
.hover\\:-translate-y-1:hover { transform: translateY(-0.25rem); }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
.overflow-hidden { overflow: hidden; }
.inline-flex { display: inline-flex; }
.space-x-1 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.25rem; }
.space-x-2 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.5rem; }
.space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
@media (min-width: 640px) {
  .sm\\:flex-row { flex-direction: row; }
  .sm\\:space-y-0 > :not([hidden]) ~ :not([hidden]) { margin-top: 0; }
  .sm\\:space-x-4 > :not([hidden]) ~ :not([hidden]) { margin-left: 1rem; }
}
@media (min-width: 768px) {
  .md\\:text-7xl { font-size: 4.5rem; line-height: 1; }
  .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
}

`
    );

    // Also remove any other Tailwind imports
    return processedCss
      .replace(/@import\s+["']@tailwindcss\/base["'];?\s*/g, '')
      .replace(/@import\s+["']@tailwindcss\/components["'];?\s*/g, '')
      .replace(/@import\s+["']@tailwindcss\/utilities["'];?\s*/g, '');
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
              join(packageDir, 'lib', 'style.css'),
              join(packageDir, 'style.css'),
              join(packageDir, 'styles.css'),
              join(packageDir, 'index.css')
            ];

            // Enhanced CSS file search with glob pattern support
            let foundCssPath: string | null = null;
            for (const pattern of possibleCssPaths) {
              if (pattern.includes('*')) {
                // Handle glob patterns
                try {
                  const glob = await import('glob');
                  const matches = glob.sync(pattern);
                  if (matches.length > 0) {
                    // Prefer hashed files (typically contain actual CSS content)
                    const hashedFile = matches.find((m: string) => /-([\da-f]{8}|[\da-f]{6})\.css$/.test(m));
                    foundCssPath = hashedFile || matches[0];
                    break;
                  }
                } catch {
                  // Fallback if glob is not available
                  const dir = dirname(pattern);
                  const fileName = basename(pattern).replace('*', '');
                  if (existsSync(dir)) {
                    try {
                      const files = readdirSync(dir);
                      const match = files.find(f => f.includes(fileName.replace('.css', '')) && f.endsWith('.css'));
                      if (match) {
                        foundCssPath = join(dir, match);
                        break;
                      }
                    } catch {
                      // Continue to next pattern
                    }
                  }
                }
              } else if (existsSync(pattern)) {
                foundCssPath = pattern;
                break;
              }
            }

            if (foundCssPath) {
              try {
                const cssContent = readFileSync(foundCssPath, 'utf-8');
                
                if (!this.options.silent) {
                  logger.debug(`[DevOrchestrator] Serving external package CSS: ${packageName} -> ${foundCssPath}`);
                }
                
                return new Response(cssContent, {
                  headers: {
                    'Content-Type': 'text/css; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'X-Framework': '0x1',
                    'X-CSS-Engine': '0x1-Enhanced',
                    'X-Processing-Time': `${Date.now()}ms`,
                    'X-Cache-Hit': 'false'
                  }
                });
              } catch (error) {
                if (!this.options.silent) {
                  logger.warn(`Failed to read CSS file ${foundCssPath}: ${error}`);
                }
              }
            }
          }
        }
      }

      // ENHANCED: Handle standard CSS files and Tailwind v4 integration
      const cleanPath = reqPath.split('?')[0];
      const possibleCssPaths = [
        join(this.options.projectPath, 'app', cleanPath.substring(1)),
        join(this.options.projectPath, 'src', cleanPath.substring(1)),
        join(this.options.projectPath, cleanPath.substring(1)),
        join(this.options.projectPath, 'app', 'globals.css'),
        join(this.options.projectPath, 'src', 'globals.css'),
        join(this.options.projectPath, 'globals.css')
      ];

      // Find existing CSS file
      let cssPath: string | null = null;
      for (const path of possibleCssPaths) {
        if (existsSync(path)) {
          cssPath = path;
          break;
        }
      }

      if (cssPath) {
        try {
          let cssContent = readFileSync(cssPath, 'utf-8');
          
          // ENHANCED: Apply Tailwind v4 processing with intelligent fallback
          const isTailwindFile = cssContent.includes('@tailwind') || cssContent.includes('tailwindcss');
          
          if (isTailwindFile) {
            // Check if this is a Tailwind v4 CSS file
            const isTailwindCSS = cssContent.includes('@import "tailwindcss"') || 
                                cssContent.includes("@import 'tailwindcss'");
            
            if (isTailwindCSS) {
              // Process with PostCSS and Tailwind v4
              try {
                // Dynamic import of PostCSS and Tailwind v4 PostCSS plugin
                const [postcss, tailwindPlugin] = await Promise.all([
                  import('postcss'),
                  import('@tailwindcss/postcss').catch(() => null)
                ]);
                
                if (postcss && tailwindPlugin) {
                  const processor = postcss.default([
                    tailwindPlugin.default({})
                  ]);
                  
                  const result = await processor.process(cssContent, {
                    from: cssPath,
                    to: cssPath
                  });
                  
                  cssContent = result.css;
                  
                  if (!this.options.silent) {
                    logger.debug(`[DevOrchestrator] ✅ Processed Tailwind v4 CSS with PostCSS: ${cssPath}`);
                  }
                } else {
                  if (!this.options.silent) {
                    logger.warn(`[DevOrchestrator] ⚠️ Tailwind v4 PostCSS plugin not available, serving raw CSS`);
                  }
                  // Don't fallback - just serve the raw CSS and let browser handle it
                }
              } catch (tailwindError: any) {
                if (!this.options.silent) {
                  logger.warn(`[DevOrchestrator] ⚠️ Tailwind v4 PostCSS processing failed, serving raw CSS: ${tailwindError?.message || tailwindError}`);
                }
                // Don't fallback - just serve the raw CSS
              }
            }
          }

          if (!this.options.silent) {
            logger.debug(`[DevOrchestrator] Serving CSS: ${cssPath} (${cssContent.length} bytes)`);
          }

          return new Response(cssContent, {
            headers: {
              'Content-Type': 'text/css; charset=utf-8',
              'Cache-Control': 'no-cache',
              'X-Framework': '0x1'
            }
          });
        } catch (error) {
          if (!this.options.silent) {
            logger.warn(`Failed to read CSS file ${cssPath}: ${error}`);
          }
        }
      }

      // Enhanced fallback CSS generation with better styling
      const fallbackCss = `
  /* 0x1 Framework - Enhanced Fallback CSS */
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f8fafc;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Enhanced component styling */
  .component {
    background: white;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  /* Enhanced typography */
  h1, h2, h3, h4, h5, h6 {
    margin: 0 0 16px 0;
    font-weight: 600;
    line-height: 1.25;
  }

  h1 { font-size: 2.25rem; color: #1a202c; }
  h2 { font-size: 1.875rem; color: #2d3748; }
  h3 { font-size: 1.5rem; color: #4a5568; }

  p {
    margin: 0 0 16px 0;
    color: #4a5568;
  }

  /* Enhanced button styles */
  button, .btn {
    display: inline-flex;
    align-items: center;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: #3182ce;
    color: white;
  }

  button:hover, .btn:hover {
    background: #2c5aa0;
    transform: translateY(-1px);
  }

  /* Enhanced form styling */
  input, textarea, select {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }

  /* Enhanced layout utilities */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .gap-4 { gap: 1rem; }
  .gap-8 { gap: 2rem; }

  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }

  .mt-4 { margin-top: 1rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }

  .p-4 { padding: 1rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .py-4 { padding-top: 1rem; padding-bottom: 1rem; }

  /* Enhanced responsive design */
  @media (max-width: 768px) {
    body { padding: 10px; }
    .container { padding: 0 10px; }
    h1 { font-size: 1.875rem; }
    h2 { font-size: 1.5rem; }
  }

  /* Enhanced loading and error states */
  .loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3182ce;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    background: #fed7d7;
    color: #9b2c2c;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #feb2b2;
  }

  .success {
    background: #c6f6d5;
    color: #276749;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #9ae6b4;
  }
  `;

      if (!this.options.silent) {
        logger.debug(`[DevOrchestrator] Serving enhanced fallback CSS for: ${reqPath}`);
      }

      return new Response(fallbackCss, {
        headers: {
          'Content-Type': 'text/css; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Framework': '0x1',
          'X-CSS-Source': 'fallback-enhanced'
        }
      });

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
   * Handle app.js bundle request - RESTORED FULL LAYOUT SYSTEM
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

      // Generate complete app.js with full layout system and client-side metadata updates
      const appScript = `
// 0x1 Framework App Bundle - Development Ready with Full Layout System
console.log('[0x1] Starting development app...');

// Server-discovered routes with layout information
const serverRoutes = ${routesJson};

// ===== CLIENT-SIDE METADATA SYSTEM (SAME AS PRODUCTION) =====
async function updatePageMetadata(route) {
  if (!route) return;
  
  try {
    // Try to extract metadata from the route component
    const componentModule = await import(route.componentPath);
    
    // Check if component has metadata export (Next.js 15 style)
    if (componentModule.metadata) {
      const metadata = componentModule.metadata;
      
      // Update document title
      if (metadata.title) {
        const resolvedTitle = typeof metadata.title === 'string' 
          ? metadata.title 
          : metadata.title.default || metadata.title.template || 'Page';
        document.title = resolvedTitle + ' - Development';
      }
      
      // Update meta description
      if (metadata.description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', metadata.description);
      }
      
      // Update Open Graph tags
      if (metadata.openGraph) {
        const og = metadata.openGraph;
        
        // OG Title
        if (og.title) {
          let ogTitle = document.querySelector('meta[property="og:title"]');
          if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
          }
          ogTitle.setAttribute('content', og.title);
        }
        
        // OG Description
        if (og.description) {
          let ogDesc = document.querySelector('meta[property="og:description"]');
          if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
          }
          ogDesc.setAttribute('content', og.description);
        }
        
        // OG URL
        if (og.url) {
          let ogUrl = document.querySelector('meta[property="og:url"]');
          if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
          }
          ogUrl.setAttribute('content', og.url);
        }
      }
      
      // Update Twitter tags
      if (metadata.twitter) {
        const twitter = metadata.twitter;
        
        if (twitter.title) {
          let twitterTitle = document.querySelector('meta[name="twitter:title"]');
          if (!twitterTitle) {
            twitterTitle = document.createElement('meta');
            twitterTitle.setAttribute('name', 'twitter:title');
            document.head.appendChild(twitterTitle);
          }
          twitterTitle.setAttribute('content', twitter.title);
        }
        
        if (twitter.description) {
          let twitterDesc = document.querySelector('meta[name="twitter:description"]');
          if (!twitterDesc) {
            twitterDesc = document.createElement('meta');
            twitterDesc.setAttribute('name', 'twitter:description');
            document.head.appendChild(twitterDesc);
          }
          twitterDesc.setAttribute('content', twitter.description);
        }
      }
      
      console.log('[0x1 Dev] Updated page metadata for:', route.path);
    }
  } catch (error) {
    console.warn('[0x1 Dev] Failed to update metadata for route:', route.path, error);
  }
}

// ===== CACHED LAYOUT SYSTEM (PREVENTS DUPLICATION) =====
const layoutCache = new Map();
const hierarchyCache = new Map(); // CRITICAL: Add global hierarchy cache

async function loadLayoutOnce(layoutPath) {
  if (layoutCache.has(layoutPath)) {
    return layoutCache.get(layoutPath);
  }
  
  try {
    console.log('[0x1 App] 📄 Loading layout:', layoutPath);
    
    // Add cache-busting to ensure fresh module loading
    const url = layoutPath + '?t=' + Date.now();
    const layoutModule = await import(url);
    
    // ENHANCED: Try multiple export patterns for better compatibility
    let layoutComponent = null;
    
    if (layoutModule && layoutModule.default) {
      layoutComponent = layoutModule.default;
      console.log('[0x1 App] ✅ Layout loaded (default export):', layoutPath);
    } else if (layoutModule && typeof layoutModule === 'function') {
      layoutComponent = layoutModule;
      console.log('[0x1 App] ✅ Layout loaded (direct function):', layoutPath);
    } else if (layoutModule && layoutModule.Layout) {
      layoutComponent = layoutModule.Layout;
      console.log('[0x1 App] ✅ Layout loaded (named Layout export):', layoutPath);
    } else if (layoutModule && Object.keys(layoutModule).length > 0) {
      // Try the first exported function
      const firstExport = Object.values(layoutModule).find(exp => typeof exp === 'function');
      if (firstExport) {
        layoutComponent = firstExport;
        console.log('[0x1 App] ✅ Layout loaded (first function export):', layoutPath);
      }
    }
    
    if (layoutComponent) {
      layoutCache.set(layoutPath, layoutComponent);
      return layoutComponent;
    } else {
      console.warn('[0x1 App] ⚠️ Layout has no compatible export, using passthrough fallback:', layoutPath);
      const fallbackLayout = ({ children }) => {
        console.warn('[0x1 App] Using passthrough layout for:', layoutPath);
        return children;
      };
      layoutCache.set(layoutPath, fallbackLayout);
      return fallbackLayout;
    }
  } catch (error) {
    console.error('[0x1 App] ❌ Failed to load layout:', layoutPath, error);
    const fallbackLayout = ({ children }) => {
      console.warn('[0x1 App] Using error fallback layout for:', layoutPath);
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
  
  // CRITICAL FIX: Create a named function instead of anonymous function
  // This prevents "AnonymousComponent" issues in the JSX runtime
  const ComposedComponent = function ComposedComponent(props) {
    // CRITICAL FIX: Create shared update callback that preserves header elements
    const sharedUpdateCallback = () => {
      // CRITICAL FIX: Set preservation flags to prevent header disappearance
      if (typeof window !== 'undefined') {
        window.__0x1_preserveHeaderElements = true;
        window.__0x1_layoutUpdateInProgress = true;
      }
      
      // Use a more targeted update approach
      if (window.router && typeof window.router.reRender === 'function') {
        window.router.reRender();
      } else if (window.router && typeof window.router.navigate === 'function') {
        // Trigger navigation to same path to force re-render
        window.router.navigate(window.location.pathname, false);
      } else {
        console.warn('[0x1] Router not available for nested component update');
      }
      
      // Clear preservation flags after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.__0x1_preserveHeaderElements = false;
          window.__0x1_layoutUpdateInProgress = false;
        }
      }, 100);
    };
    
    // CRITICAL FIX: Set a single composed component context that all nested components will use
    // CRITICAL FIX: Use stable component ID based on route path to preserve state across re-renders
    const routePath = (typeof window !== 'undefined' ? window.location.pathname : '/').replace(/[^a-zA-Z0-9]/g, '_') || 'root';
    const composedComponentId = 'ComposedComponent_' + routePath;
    
    // CRITICAL FIX: Track component contexts to clear them at the end
    const componentContexts = [];
    
    // CRITICAL FIX: Set the composed component context once for all nested components
    if (typeof window.__0x1_enterComponentContext === 'function') {
      window.__0x1_enterComponentContext(composedComponentId, sharedUpdateCallback);
      componentContexts.push(composedComponentId);
      
      console.log('[0x1 App] Setting composed component context:', composedComponentId);
      console.log('[0x1 App] Page and all layouts will use this context:', pageComponent.name || 'Page');
    }
    
    // CRITICAL FIX: Use JSX runtime to call page component for proper re-rendering
    let wrappedComponent;
    
    try {
      // DON'T set separate page context - use the composed context
      
      // CRITICAL FIX: Call page component through JSX runtime for proper integration
      const jsxRuntime = window.jsx || window.jsxDEV || window.React?.createElement;
      if (jsxRuntime && typeof pageComponent === 'function') {
        // Use JSX runtime to call the component - this enables proper re-rendering
        wrappedComponent = jsxRuntime(pageComponent, props);
      } else {
        // Fallback: direct call
        wrappedComponent = pageComponent(props);
      }
      
      // DON'T clear component context yet - keep it active for re-rendering
    } catch (error) {
      console.error('[0x1] Page component error:', error);
      wrappedComponent = {
        type: 'div',
        props: { children: ['Page component error: ' + error.message] }
      };
    }
    
    // Apply layouts in reverse order (innermost to outermost)
    for (let i = layouts.length - 1; i >= 0; i--) {
      const currentLayout = layouts[i];
      const children = wrappedComponent;
      const layoutId = composedComponentId + '_layout_' + i;
      
      try {
        // CRITICAL FIX: Don't set separate context for layouts - they should use the composed component context
        // This ensures layout components update the ComposedComponent rather than looking for their own DOM elements
        console.log('[0x1 App] Layout will use composed component context for re-rendering:', currentLayout.name || 'Layout');
        
        // SIMPLE FIX: Just call the layout directly like ChatPage - no complex wrappers
        const jsxRuntime = window.jsx || window.jsxDEV || window.React?.createElement;
        if (jsxRuntime && typeof currentLayout === 'function') {
          console.log('[0x1 App] Calling layout directly like ChatPage:', currentLayout.name || 'Layout');
          
          // Use JSX runtime to call the layout directly - same as ChatPage
          wrappedComponent = jsxRuntime(currentLayout, { 
            children: children,
            ...props 
          });
          
          // CRITICAL DEBUG: Log what the ChatLayout JSX runtime call returns
          if (currentLayout.name === 'ChatLayout') {
            console.log('[0x1 App] DEBUG: ChatLayout JSX runtime call returned:', {
              wrappedComponentType: typeof wrappedComponent,
              hasProps: !!(wrappedComponent && typeof wrappedComponent === 'object' && 'props' in wrappedComponent),
              componentId: wrappedComponent && typeof wrappedComponent === 'object' && 'props' in wrappedComponent ? wrappedComponent.props['data-component-id'] : 'NONE',
              nodeType: wrappedComponent && typeof wrappedComponent === 'object' && 'type' in wrappedComponent ? wrappedComponent.type : 'UNKNOWN',
              propsKeys: wrappedComponent && typeof wrappedComponent === 'object' && 'props' in wrappedComponent ? Object.keys(wrappedComponent.props || {}) : []
            });
          }
          
          // The JSX runtime's callComponentWithContext function already:
          // 1. Generates the component ID using the stable ID system
          // 2. Sets up the component context with update callback
          // 3. Applies metadata via ensureComponentMetadata
          // 4. All we need to do is trust that system
          
        } else {
          // Fallback: direct call
          wrappedComponent = currentLayout({ 
            children: children,
            ...props 
          });
        }
        
        // DON'T clear component context yet - keep it active for re-rendering
      } catch (error) {
        console.error('[0x1] Layout composition error at level', i, ':', error);
        wrappedComponent = children;
      }
    }
    
    // CRITICAL FIX: Add cleanup function that clears contexts when component unmounts
    // but only if this is the initial render, not a re-render
    if (typeof window !== 'undefined' && !window.__0x1_layoutContextsActive) {
      window.__0x1_layoutContextsActive = true;
      
      // Set up cleanup on page navigation or app unmount
      const cleanup = () => {
        componentContexts.forEach(contextId => {
          if (typeof window.__0x1_exitComponentContext === 'function') {
            try {
              window.__0x1_exitComponentContext();
            } catch (error) {
              console.debug('[0x1] Context cleanup error:', error);
            }
          }
        });
        window.__0x1_layoutContextsActive = false;
      };
      
      // Cleanup on navigation
      if (window.router) {
        const originalNavigate = window.router.navigate;
        window.router.navigate = function(...args) {
          cleanup();
          return originalNavigate.apply(this, args);
        };
      }
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', cleanup);
    }
    
    return wrappedComponent;
  };
  
  return ComposedComponent;
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
            
            // CRITICAL: Update metadata when route loads (same as production)
            await updatePageMetadata(route);
            
            if (componentModule && componentModule.default) {
              // CRITICAL FIX: Set up component context with UPDATE CALLBACK
              const componentId = 'route_' + route.path.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now();
              
              // Ensure component context functions are available
              if (typeof window.__0x1_enterComponentContext !== 'function') {
                console.error('[0x1] Component context functions not available');
                throw new Error('Component context system not initialized');
              }
              
              // CRITICAL FIX: Create a proper update callback that triggers router re-render
              const routeUpdateCallback = () => {
                if (window.router && typeof window.router.reRender === 'function') {
                  console.log('[0x1] Triggering route re-render via router.reRender()');
                  window.router.reRender();
                } else if (window.router && typeof window.router.navigate === 'function') {
                  console.log('[0x1] Triggering route re-render via router.navigate()');
                  window.router.navigate(window.location.pathname, false);
                } else {
                  console.warn('[0x1] Router not available for route update callback');
                }
              };
              
              // CRITICAL FIX: Use JSX runtime's callComponentWithContext for proper integration
              // This ensures the page component gets proper re-render capabilities
              try {
                // Set route-level component context
                window.__0x1_enterComponentContext(componentId, routeUpdateCallback);
                
                // Compose the page component with all its layouts FIRST
                const composedComponent = composeNestedLayouts(componentModule.default, loadedLayouts);
                
                // CRITICAL FIX: Call the composed component through JSX runtime for proper integration
                // This gives it the same treatment as Header component
                const jsxRuntime = window.jsx || window.jsxDEV || window.React?.createElement;
                if (jsxRuntime && typeof composedComponent === 'function') {
                  // Use JSX runtime to call the component - this enables proper re-rendering
                  const result = jsxRuntime(composedComponent, props);
                  
                  // Clear context after successful render
                  window.__0x1_exitComponentContext();
                  return result;
                } else {
                  // Fallback: direct call (but this won't have proper re-rendering)
                  const result = composedComponent(props);
                  window.__0x1_exitComponentContext();
                  return result;
                }
              } catch (error) {
                console.error('[0x1] Component execution error:', error);
                // Clear context on error
                if (typeof window.__0x1_exitComponentContext === 'function') {
                  window.__0x1_exitComponentContext();
                }
                throw error;
              }
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
   * Handle route requests with dynamic metadata extraction
   */
  private async handleRouteRequest(reqPath: string): Promise<Response> {
    const matchingRoute = this.state.routes.find(route => 
      route.path === reqPath || (reqPath === '/' && route.path === '/')
    );

    // Default to homepage if no specific route found
    const routeToUse = matchingRoute || this.state.routes.find(route => route.path === '/');

    if (routeToUse || reqPath === '/' || reqPath === '/index.html') {
      // CRITICAL: Generate HTML with metadata specific to this route
      return new Response(await this.generateIndexHtmlForRoute(routeToUse, reqPath), {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'cache-control': 'no-cache, no-store, must-revalidate, max-age=0',
          'pragma': 'no-cache',
          'expires': '0'
        }
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

    let faviconLink = "";
    for (const dir of faviconSearchDirs) {
      const faviconSvg = join(dir, 'favicon.svg');
      const faviconIco = join(dir, 'favicon.ico');
      const faviconPng = join(dir, 'favicon.png');

      if (existsSync(faviconSvg)) {
        faviconLink =
          '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">';
        break;
      } else if (existsSync(faviconIco)) {
        faviconLink =
          '  <link rel="icon" href="/favicon.ico" type="image/x-icon">';
        break;
      } else if (existsSync(faviconPng)) {
        faviconLink =
          '  <link rel="icon" href="/favicon.png" type="image/png">';
        break;
      }
    }

    // Try to serve existing favicon files first
    for (const dir of faviconSearchDirs) {
      const faviconSvg = join(dir, 'favicon.svg');
      const faviconIco = join(dir, 'favicon.ico');
      const faviconPng = join(dir, 'favicon.png');

      if (existsSync(faviconSvg)) {
        const content = readFileSync(faviconSvg, 'utf-8');
        return new Response(content, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      } else if (existsSync(faviconIco)) {
        const content = readFileSync(faviconIco);
        return new Response(content, {
          headers: {
            'Content-Type': 'image/x-icon',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      } else if (existsSync(faviconPng)) {
        const content = readFileSync(faviconPng);
        return new Response(content, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
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
   * Generate HTML with metadata specific to a route
   */
  private async generateIndexHtmlForRoute(route: Route | undefined, reqPath: string): Promise<string> {
    // SINGLE SOURCE OF TRUTH: Use ConfigurationManager for PWA metadata
    const configManager = getConfigurationManager(this.options.projectPath);
    let pwaConfig: PWAConfig | null = null;
    let projectConfig: any = {};

    try {
      projectConfig = await configManager.loadProjectConfig();

      // Extract PWA config from project config if available
      // CRITICAL FIX: Handle both nested (app.pwa) and flattened (pwa) structures
      if (projectConfig?.pwa) {
        pwaConfig = projectConfig.pwa;
      } else if (projectConfig?.app?.pwa) {
        pwaConfig = projectConfig.app.pwa;
      }
    } catch (error) {
      if (this.options.debug) {
        logger.debug(`PWA configuration loading failed: ${error}`);
      }
      projectConfig = {
        name: "My 0x1 App",
        description: "0x1 Framework development environment",
      };
    }

    // SINGLE SOURCE OF TRUTH: Use shared PWA handler
    const pwaHandler = PWAHandler.create({
      mode: "development",
      projectPath: this.options.projectPath,
      silent: this.options.silent,
      debug: this.options.debug,
    });

    const pwaResources = await pwaHandler.generatePWAResources(pwaConfig);

    // Log PWA status using shared handler
    const hasIcons = await this.iconsExist(pwaConfig?.iconsPath || "/icons");
    pwaHandler.logPWAStatus(pwaConfig, hasIcons);

    // CRITICAL: Extract metadata from the SPECIFIC route's component (not just homepage)
    // FIXED: Use client-side metadata updates (same as production) instead of server-side extraction
    const pageMetadata = null; // Client-side metadata updates handle this
    if (route && this.options.debug) {
      logger.debug(
        `Route ${route.path} will use client-side metadata updates (same as production)`
      );
    }

    // CRITICAL: Dynamically discover external packages and their CSS - RESTORED FROM WORKING VERSION
    const externalCssLinks: string[] = [];
    const externalImports: Record<string, string> = {};

    // ENHANCED: Scan for CSS imports in source files first (most reliable)
    const sourceFiles = await this.findSourceFiles();
    const cssImportPatterns = new Set<string>();

    for (const filePath of sourceFiles) {
      try {
        const content = readFileSync(filePath, "utf-8");

        // Find CSS imports like: import '@0x1js/highlighter/styles'
        const cssImportMatches = content.match(
          /import\s+['"]([^'"]+\/styles?)['"];?/g
        );
        if (cssImportMatches) {
          for (const match of cssImportMatches) {
            const pathMatch = match.match(
              /import\s+['"]([^'"]+\/styles?)['"];?/
            );
            if (pathMatch) {
              cssImportPatterns.add(pathMatch[1]);
            }
          }
        }

        // Also find direct CSS file imports
        const directCssMatches = content.match(
          /import\s+['"]([^'"]+\.css)['"];?/g
        );
        if (directCssMatches) {
          for (const match of directCssMatches) {
            const pathMatch = match.match(/import\s+['"]([^'"]+\.css)['"];?/);
            if (pathMatch) {
              cssImportPatterns.add(pathMatch[1]);
            }
          }
        }
      } catch (error) {
        // Silent fail for individual files
      }
    }

    // Process discovered CSS imports
    for (const cssImport of cssImportPatterns) {
      if (cssImport.startsWith("@")) {
        // Scoped package CSS import like @0x1js/highlighter/styles
        const parts = cssImport.split("/");
        if (parts.length >= 2) {
          const packageName = `${parts[0]}/${parts[1]}`; // @0x1js/highlighter
          const subPath = parts.slice(2).join("/"); // styles

          // Check if this package exists in node_modules
          const packagePath = join(
            this.options.projectPath,
            "node_modules",
            packageName
          );
          if (existsSync(packagePath)) {
            // Look for CSS files in the package
            const possibleCssPaths = [
              join(packagePath, "dist", "styles.css"),
              join(packagePath, "dist", `${subPath}.css`),
              join(packagePath, `${subPath}.css`),
              join(packagePath, "styles.css"),
              join(packagePath, "dist", "index.css"),
              join(packagePath, "index.css"),
            ];

            for (const cssPath of possibleCssPaths) {
              if (existsSync(cssPath)) {
                const cssUrl = `/node_modules/${packageName}/dist/${cssPath.split("/").pop()}`;
                externalCssLinks.push(
                  `  <link rel="stylesheet" href="${cssUrl}">`
                );

                if (this.options.debug) {
                  logger.debug(`Found CSS for ${cssImport}: ${cssUrl}`);
                }
                break;
              }
            }
          }
        }
      } else if (cssImport.includes("/")) {
        // Regular package CSS import
        const cssUrl = `/node_modules/${cssImport}`;
        externalCssLinks.push(`  <link rel="stylesheet" href="${cssUrl}">`);
      }
    }

    // FALLBACK: Scan node_modules for any scoped packages that have CSS files
    const nodeModulesPath = join(this.options.projectPath, "node_modules");
    if (existsSync(nodeModulesPath)) {
      try {
        const items = readdirSync(nodeModulesPath, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory() && item.name.startsWith("@")) {
            // This is a scope directory like @0x1js
            const scopePath = join(nodeModulesPath, item.name);
            try {
              const scopeItems = readdirSync(scopePath, {
                withFileTypes: true,
              });

              for (const scopeItem of scopeItems) {
                if (scopeItem.isDirectory()) {
                  const packageName = `${item.name}/${scopeItem.name}`;
                  const packagePath = join(scopePath, scopeItem.name);

                  // Add to import map
                  externalImports[packageName] =
                    `/node_modules/${packageName}/index.js`;

                  // Check for CSS files (only if not already added above)
                  const alreadyAdded = externalCssLinks.some((link) =>
                    link.includes(packageName)
                  );
                  if (!alreadyAdded) {
                    const distPath = join(packagePath, "dist");
                    if (existsSync(distPath)) {
                      try {
                        const distFiles = readdirSync(distPath);
                        for (const file of distFiles) {
                          if (file.endsWith(".css")) {
                            const cssUrl = `/node_modules/${packageName}/dist/${file}`;
                            externalCssLinks.push(
                              `  <link rel="stylesheet" href="${cssUrl}">`
                            );
                          }
                        }
                      } catch (e) {
                        // Silent fail
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Silent fail for individual scope directories
            }
          }
        }
      } catch (e) {
        // Silent fail if node_modules doesn't exist or isn't readable
      }
    }

    // Build complete import map with external packages
    const importMap = {
      "0x1": "/node_modules/0x1/index.js",
      "0x1/index": "/node_modules/0x1/index.js",
      "0x1/index.js": "/node_modules/0x1/index.js",
      "0x1/jsx-runtime": "/0x1/jsx-runtime.js",
      "0x1/jsx-runtime.js": "/0x1/jsx-runtime.js",
      "0x1/jsx-dev-runtime": "/0x1/jsx-runtime.js",
      "0x1/jsx-dev-runtime.js": "/0x1/jsx-runtime.js",
      "0x1/router": "/0x1/router.js",
      "0x1/router.js": "/0x1/router.js",
      "0x1/link": "/0x1/router.js",
      "0x1/link.js": "/0x1/router.js",
      "0x1/hooks": "/0x1/hooks.js",
      "0x1/hooks.js": "/0x1/hooks.js",
      ...externalImports,
    };

    // Generate favicon link (consistent with existing logic)
    let faviconLink = "";
    const faviconSearchDirs = [
      join(this.options.projectPath, "public"),
      join(this.options.projectPath, "app"),
      join(this.options.projectPath, "src"),
    ];

    for (const dir of faviconSearchDirs) {
      const faviconSvg = join(dir, "favicon.svg");
      const faviconIco = join(dir, "favicon.ico");
      const faviconPng = join(dir, "favicon.png");

      if (existsSync(faviconSvg)) {
        faviconLink =
          '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">';
        break;
      } else if (existsSync(faviconIco)) {
        faviconLink =
          '  <link rel="icon" href="/favicon.ico" type="image/x-icon">';
        break;
      } else if (existsSync(faviconPng)) {
        faviconLink =
          '  <link rel="icon" href="/favicon.png" type="image/png">';
        break;
      }
    }

    // Use project config for server-side HTML (client-side metadata will override)
    // SINGLE SOURCE OF TRUTH: Same as production - client handles page-specific metadata
    const pageTitle = `${projectConfig.name || "My 0x1 App"} - Development`;
    const pageDescription =
      projectConfig.description || "0x1 Framework development environment";
    const additionalMetaTags = ""; // Client-side metadata will handle this

    // Cache-busting timestamp
    const cacheBust = Date.now();

    const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
${additionalMetaTags}${faviconLink ? faviconLink + "\n" : ""}  <link rel="stylesheet" href="/styles.css?v=${cacheBust}">
${externalCssLinks.length > 0 ? externalCssLinks.join("\n") + "\n" : ""}  <script type="importmap">
  ${JSON.stringify({ imports: importMap }, null, 2)}
  </script>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <script>
    window.process={env:{NODE_ENV:'development'}};
    (function(){
      try{
        const t=localStorage.getItem('0x1-dark-mode');
        const isDark = t !== 'light';
        document.documentElement.classList.toggle('dark', isDark);
        document.body.className = isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900';
        
        // Initialize global theme state for 0x1 framework
        window.__0x1_initialTheme = isDark;
      }catch{
        document.documentElement.classList.add('dark');
        document.body.className = 'bg-slate-900 text-white';
        window.__0x1_initialTheme = true;
      }
    })();
  </script>
  <script>
    // LIVE RELOAD for development
    let lastCompileTime = null;
    
    // Auto-detect the server URL base on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
    
    function connectWebSocket() {
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'reload' || message.type === 'file-changed') {
          console.log('[0x1 Dev] Reloading due to file change:', message.filename || 'unknown');
          window.location.reload();
        }
      };
      
      ws.onopen = () => {
        console.log('[0x1 Dev] Live reload connected');
      };
      
      ws.onclose = () => {
        console.log('[0x1 Dev] Live reload disconnected, reconnecting in 1s...');
        setTimeout(connectWebSocket, 1000);
      };
      
      ws.onerror = () => {
        console.warn('[0x1 Dev] Live reload connection error');
      };
    }
    
    // Start live reload connection
    connectWebSocket();
  </script>
  <script src="/0x1-error-boundary.js?v=${cacheBust}&enhanced=true"></script>
  <script>
    // CRITICAL: Force error detection immediately after error boundary loads
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        // Check for SVG path errors that are currently visible
        const errorLogs = [];
        
        // REMOVED: SVG error detection - too many false positives
        // Only actual SVG parsing errors will be shown by the browser console
      }, 100);
    });
  </script>
  <script src="/app.js?v=${cacheBust}" type="module"></script>
</body>
</html>`;

    // SINGLE SOURCE OF TRUTH: Use shared PWA handler for HTML injection
    return injectPWAIntoHTML(
      html,
      {
        mode: "development",
        projectPath: this.options.projectPath,
        silent: this.options.silent,
        debug: this.options.debug,
      },
      pwaResources
    );
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
           path === '/node_modules/0x1/core/hooks.js' ||
           path === '/error-boundary.js' ||
           path === '/0x1-error-boundary.js' ||
           path.startsWith('/0x1-error-boundary.js?') ||
           path === '/__0x1_server_action';
  }

  private isComponentRequest(path: string): boolean {
    // Basic path checks
    const isJSFile = path.endsWith('.js') && (
      path.includes('/app/') || 
      path.includes('/components/') || 
      path.includes('/lib/') || 
      path.includes('/src/')
    );
    
    const isSpecialFile = path.startsWith('/components/') || path.startsWith('/lib/') ||
      (path.includes('/layout.js') || path.includes('/page.js'));

    if (!isJSFile && !isSpecialFile) {
      return false;
    }

    // CRITICAL: Exclude server actions files
    // Check if this is a potential server actions file by looking for common patterns
    if (path.includes('actions.js') || path.includes('api/')) {
      // Need to check if the source file contains "use server"
      const possiblePaths = this.generatePossiblePaths(
        path.startsWith('/') ? path.slice(1) : path.replace('.js', '')
      );
      
      for (const sourcePath of possiblePaths) {
        if (existsSync(sourcePath)) {
          try {
            const content = readFileSync(sourcePath, 'utf-8');
            // Check for "use server" directive at the top of the file
            if (content.trim().startsWith('"use server"') || content.trim().startsWith("'use server'")) {
              if (this.options.debug) {
                logger.debug(`[DevOrchestrator] Excluding server actions file: ${path} -> ${sourcePath}`);
              }
              return false;
            }
          } catch (error) {
            // If we can't read the file, assume it's not a server action
            if (this.options.debug) {
              logger.debug(`[DevOrchestrator] Could not read potential server actions file: ${sourcePath}`);
            }
          }
          break; // Found the source file, no need to check others
        }
      }
    }

    return isJSFile || isSpecialFile;
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
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'reload' || message.type === 'file-changed') {
      console.log('[0x1] Reloading due to file change:', message.filename || 'unknown');
      window.location.reload();
    }
  };
  
  ws.onopen = () => {
    console.log('[0x1] Live reload ready');
    reconnectAttempts = 0;
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

  /**
   * Check if request is for an external scoped package
   */
  private isExternalScopedPackageRequest(path: string): boolean {
    // Check for imports like /@0x1js/highlighter/... pattern
    return path.match(/^\/@[^/]+\/[^/]+/) !== null;
  }

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

        // Enhanced fallback logic
        let foundPath: string | null = null;
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
        let content = readFileSync(foundPath, 'utf-8');
        
        // CRITICAL: Handle CSS files specially
        if (foundPath.endsWith('.css')) {
          // Rewrite relative CSS imports to absolute URLs
          content = content.replace(
            /@import\s+['"]\.\/([^'"]+)['"];?/g,
            (match, filename) => {
              // Generate the absolute URL for the imported CSS file
              const absoluteUrl = `/node_modules/${packageName}/dist/${filename}`;
              return `@import '${absoluteUrl}';`;
            }
          );
          
          return new Response(content, {
            headers: {
              'Content-Type': 'text/css; charset=utf-8',
              'Cache-Control': 'no-cache'
            }
          });
        }
        
        return new Response(content, {
          headers: {
            'Content-Type': foundPath.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain',
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Serve the requested file
      let content = readFileSync(requestedFilePath, 'utf-8');
      
      // CRITICAL: Handle CSS files specially
      if (requestedFilePath.endsWith('.css')) {
        // Rewrite relative CSS imports to absolute URLs
        content = content.replace(
          /@import\s+['"]\.\/([^'"]+)['"];?/g,
          (match, filename) => {
            // Generate the absolute URL for the imported CSS file
            const absoluteUrl = `/node_modules/${packageName}/dist/${filename}`;
            return `@import '${absoluteUrl}';`;
          }
        );
        
        return new Response(content, {
          headers: {
            'Content-Type': 'text/css; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
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

  /**
   * Handle CSS style requests from scoped packages like @0x1js/highlighter/styles
   */
  private async handleScopedPackageStylesRequest(reqPath: string): Promise<Response> {
    try {
      // Handle different path patterns:
      // /@0x1js/highlighter/styles -> /node_modules/@0x1js/highlighter/dist/styles.css
      // /node_modules/@0x1js/highlighter/dist/styles.css -> direct file
      
      let packageName: string;
      let actualFilePath: string;
      
      if (reqPath.startsWith('/@')) {
        // Direct scoped package request like /@0x1js/highlighter/styles
        const packageMatch = reqPath.match(/^\/(@[^/]+\/[^/]+)\/styles$/);
        if (!packageMatch) {
          return this.createNotFoundResponse('Invalid scoped package styles path');
        }
        
        packageName = packageMatch[1];
        const packagePath = join(this.options.projectPath, 'node_modules', packageName);
        
        // Try multiple possible locations for the CSS file
        const possibleCssPaths = [
          join(packagePath, 'dist', 'styles.css'),
          join(packagePath, 'styles.css'),
          join(packagePath, 'dist', 'index.css'),
          join(packagePath, 'index.css')
        ];

        actualFilePath = possibleCssPaths.find(path => existsSync(path)) || '';
        
      } else if (reqPath.includes('node_modules/@')) {
        // Direct file request like /node_modules/@0x1js/highlighter/dist/styles.css
        actualFilePath = join(this.options.projectPath, reqPath.substring(1)); // Remove leading /
        
        // Extract package name for logging
        const packageMatch = reqPath.match(/node_modules\/(@[^/]+\/[^/]+)/);
        packageName = packageMatch ? packageMatch[1] : 'unknown';
      } else {
        return this.createNotFoundResponse('Unsupported styles path pattern');
      }
      
      if (!actualFilePath || !existsSync(actualFilePath)) {
        if (this.options.debug) {
          logger.warn(`Scoped package styles not found: ${reqPath} (tried: ${actualFilePath})`);
        }
        return this.createNotFoundResponse(`Scoped package styles not found: ${reqPath}`);
      }
      
      const content = readFileSync(actualFilePath, 'utf-8');
      
      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] Serving scoped package styles: ${packageName} -> ${actualFilePath}`);
      }
      
      return new Response(content, {
        headers: {
          'Content-Type': 'text/css; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Framework': '0x1',
          'X-CSS-Source': packageName
        }
      });
    } catch (error) {
      if (this.options.debug) {
        logger.error(`[DevOrchestrator] Error serving scoped package styles: ${error}`);
      }
      return this.createErrorResponse(error);
    }
  }

  /**
   * Generate the main HTML page with live reload (fallback method)
   */
  private async generateIndexHtml(): Promise<string> {
    // Use the route-specific method with homepage route
    const homeRoute = this.state.routes.find(route => route.path === '/');
    return await this.generateIndexHtmlForRoute(homeRoute, '/');
  }

  /**
   * Check if PWA icons exist (shared logic with BuildOrchestrator)
   */
  private async iconsExist(iconsPath: string): Promise<boolean> {
    if (!iconsPath) return false;

    const filesystemPath = iconsPath.startsWith('/') 
      ? join(this.options.projectPath, 'public', iconsPath.substring(1))
      : join(this.options.projectPath, iconsPath);

    const essentialIcons = ['icon-192x192.png', 'icon-512x512.png'];
    return essentialIcons.some(icon => existsSync(join(filesystemPath, icon)));
  }

  /**
   * Handle server-sent events for live reload
   */
  private handleSSE(): Response {
    return new Response('SSE not implemented', { status: 501 });
  }

  /**
   * Get the framework path for serving 0x1 framework files
   */
  private getFrameworkPath(): string {
    return process.cwd().includes('00-Dev/0x1') 
      ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
      : join(process.cwd(), '../0x1');
  }

  /**
   * Create error response for request failures
   */
  private createErrorResponse(error: any, status = 500): Response {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(`Error: ${message}`, {
      status,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  /**
   * Create not found response for missing resources
   */
  private createNotFoundResponse(message: string): Response {
    return new Response(message, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}