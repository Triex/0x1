/**
 * 0x1 Framework - Development Orchestrator
 * Unified development server using shared core utilities
 * Replaces monolithic dev-server.ts with clean, maintainable architecture
 */

import { serve, ServerWebSocket, type Server } from 'bun';
import { existsSync, readdirSync, readFileSync, statSync, watch } from 'node:fs';
import { join, resolve } from 'node:path';

// Import shared core utilities
import { importEngine } from '../core/ImportEngine';
import { routeDiscovery, type Route } from '../core/RouteDiscovery';
import { transpilationEngine } from '../core/TranspilationEngine';

import { logger } from '../../cli/utils/logger';

// Import essential handlers (keep only what's needed)
import { notFoundHandler } from '../../cli/server/middleware/error-boundary';
import { serveStaticFile } from '../../cli/server/middleware/static-files';

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
}

export class DevOrchestrator {
  private state: DevServerState;
  private options: DevOrchestratorOptions;
  private server: Server | null = null;
  private fileWatcher: any = null;

  constructor(options: DevOrchestratorOptions) {
    this.options = options;
    this.state = {
      routes: [],
      components: new Map(),
      assets: new Map(),
      clientConnections: new Set(),
      isReady: false
    };

    // Configure shared engines for development
    transpilationEngine.configure('development');
  }

  /**
   * Start the development server with unified orchestration
   */
  async start(): Promise<Server> {
    try {
      logger.info(`🚀 Starting development orchestrator on ${this.options.host}:${this.options.port}`);

      // Phase 1: Parallel discovery using shared core
      const [routes, dependencies] = await Promise.all([
        this.discoverRoutes(),
        this.discoverDependencies()
      ]);

      this.state.routes = routes;
      this.state.isReady = true;

      // Phase 2: Create and configure server
      this.server = this.createServer();

      // Phase 3: Start file watching for live reload
      if (this.options.liveReload) {
        this.startFileWatching();
      }

      logger.success(`✅ Development server ready with ${routes.length} routes`);
      return this.server;

    } catch (error) {
      logger.error(`❌ Development orchestrator failed: ${error}`);
      throw error;
    }
  }

  /**
   * Discover routes using shared RouteDiscovery
   */
  private async discoverRoutes(): Promise<Route[]> {
    return await routeDiscovery.discover(this.options.projectPath, {
      mode: 'development',
      debug: this.options.debug || false
    });
  }

  /**
   * Discover dependencies using shared ImportEngine
   */
  private async discoverDependencies(): Promise<any> {
    // Find all source files
    const sourceFiles = await this.findSourceFiles();
    
    // Use shared import engine for dependency discovery
    return await importEngine.discoverDependencies(this.options.projectPath, sourceFiles);
  }

  /**
   * Find all source files for dependency analysis
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    const scanDirectory = (dir: string) => {
      if (!existsSync(dir)) return;
      
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = join(dir, item.name);
          
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Silent fail for individual directories
      }
    };

    // Scan key directories
    ['app', 'src', 'components', 'lib'].forEach(dir => {
      scanDirectory(join(this.options.projectPath, dir));
    });

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
      // Handle WebSocket upgrades
      if (this.isWebSocketUpgrade(reqPath)) {
        return this.handleWebSocketUpgrade(req, server);
      }

      // Handle live reload endpoints
      if (this.isLiveReloadEndpoint(reqPath)) {
        return this.handleLiveReloadEndpoint(reqPath, req);
      }

      // Handle framework core files
      if (this.isFrameworkRequest(reqPath)) {
        return await this.handleFrameworkRequest(reqPath);
      }

      // Handle component requests using shared TranspilationEngine
      if (this.isComponentRequest(reqPath)) {
        return await this.handleComponentRequest(reqPath);
      }

      // Handle route requests
      if (this.isRouteRequest(reqPath)) {
        return await this.handleRouteRequest(reqPath);
      }

      // Handle static files
      return await this.handleStaticFileRequest(req);

    } catch (error) {
      logger.error(`[DevOrchestrator] Request error for ${reqPath}: ${error}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Handle component requests using shared TranspilationEngine
   */
  private async handleComponentRequest(reqPath: string): Promise<Response> {
    try {
      const cleanPath = reqPath.split('?')[0];
      const basePath = cleanPath.endsWith('.js') ? cleanPath.replace('.js', '') : cleanPath;
      const relativePath = basePath.startsWith('/') ? basePath.slice(1) : basePath;

      // Find the source file
      const possiblePaths = this.generatePossiblePaths(relativePath);
      const sourcePath = possiblePaths.find(path => existsSync(path));

      if (!sourcePath) {
        return this.createNotFoundResponse(`Component not found: ${basePath}`);
      }

      // Check cache first
      const cached = this.state.components.get(sourcePath);
      if (cached && await this.isFileUnchanged(sourcePath, cached.mtime)) {
        return new Response(cached.content, {
          headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
        });
      }

      // Use shared TranspilationEngine
      const sourceCode = readFileSync(sourcePath, 'utf-8');
      const result = await transpilationEngine.transpile({
        sourceCode,
        sourcePath,
        options: {
          mode: 'development',
          sourcePath,
          projectPath: this.options.projectPath,
          debug: this.options.debug
        }
      });

      if (result.errors.length > 0) {
        logger.warn(`[DevOrchestrator] Transpilation warnings for ${sourcePath}: ${JSON.stringify(result.errors)}`);
      }

      // Cache the result
      const stats = statSync(sourcePath);
      this.state.components.set(sourcePath, {
        content: result.code,
        mtime: stats.mtimeMs
      });

      return new Response(result.code, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });

    } catch (error) {
      logger.error(`[DevOrchestrator] Component transpilation failed: ${error}`);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Generate possible source file paths
   */
  private generatePossiblePaths(relativePath: string): string[] {
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    const basePath = join(this.options.projectPath, relativePath);

    return extensions.map(ext => `${basePath}${ext}`);
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
   * Handle framework core requests (jsx-runtime, hooks, etc.)
   */
  private async handleFrameworkRequest(reqPath: string): Promise<Response> {
    const frameworkPath = this.getFrameworkPath();
    
    // Map framework requests to actual files
    const fileMap: Record<string, string> = {
      '/0x1/jsx-runtime.js': join(frameworkPath, 'dist/jsx-runtime.js'),
      '/0x1/jsx-dev-runtime.js': join(frameworkPath, 'dist/jsx-dev-runtime.js'),
      '/0x1/hooks.js': join(frameworkPath, 'dist/hooks.js'),
      '/0x1/router.js': join(frameworkPath, '0x1-router/dist/index.js'),
      '/0x1/link.js': join(frameworkPath, 'dist/link.js'),
      '/node_modules/0x1/index.js': join(frameworkPath, 'dist/index.js')
    };

    const filePath = fileMap[reqPath];
    if (filePath && existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      return new Response(content, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }

    return this.createNotFoundResponse(`Framework file not found: ${reqPath}`);
  }

  /**
   * Handle route requests (serve main app HTML)
   */
  private async handleRouteRequest(reqPath: string): Promise<Response> {
    // Check if this is a valid route
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
   * Generate the main HTML page
   */
  private generateIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <link rel="stylesheet" href="/styles.css">
  <script type="importmap">{"imports":{"0x1":"/node_modules/0x1/index.js","0x1/jsx-runtime":"/0x1/jsx-runtime.js","0x1/router":"/0x1/router.js"}}</script>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
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

    this.fileWatcher = watch(this.options.projectPath, { recursive: true }, (event, filename) => {
      if (!filename) return;

      const filenameStr = filename as string;
      
      // Ignore certain files/directories
      const ignorePatterns = ['node_modules', '.git', 'dist', '.DS_Store', '.0x1-temp'];
      if (ignorePatterns.some(pattern => filenameStr.includes(pattern))) {
        return;
      }

      if (this.options.debug) {
        logger.debug(`[DevOrchestrator] File changed: ${filenameStr}`);
      }

      // Clear component cache for changed files
      this.invalidateCache(filenameStr);

      // Broadcast reload to connected clients
      this.broadcastReload(filenameStr);
    });
  }

  /**
   * Invalidate cached components when files change
   */
  private invalidateCache(changedFile: string): void {
    const fullPath = resolve(this.options.projectPath, changedFile);
    
    // Remove from component cache
    this.state.components.delete(fullPath);
    
    // Clear transpilation engine cache
    transpilationEngine.clearCache();
  }

  /**
   * Broadcast reload message to connected clients
   */
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
        // Client disconnected, will be cleaned up in close handler
      }
    }
  }

  /**
   * Request type detection methods
   */
  private isWebSocketUpgrade(path: string): boolean {
    return path === '/ws' || path === '/__0x1_ws' || path === '/__0x1_ws_live_reload';
  }

  private isLiveReloadEndpoint(path: string): boolean {
    return path === '/__0x1_live_reload.js' || path === '/__0x1_sse_live_reload';
  }

  private isFrameworkRequest(path: string): boolean {
    return path.startsWith('/0x1/') || path.startsWith('/node_modules/0x1/');
  }

  private isComponentRequest(path: string): boolean {
    return (path.endsWith('.js') && (
      path.includes('/app/') || 
      path.includes('/components/') || 
      path.includes('/lib/') || 
      path.includes('/src/')
    )) || path.startsWith('/components/') || path.startsWith('/lib/');
  }

  private isRouteRequest(path: string): boolean {
    return !path.includes('.') && !path.startsWith('/node_modules') && 
           !path.startsWith('/0x1') && !path.startsWith('/__0x1');
  }

  /**
   * WebSocket handlers
   */
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

  /**
   * Handle WebSocket upgrades
   */
  private handleWebSocketUpgrade(req: Request, server: Server): Response {
    if (server.upgrade(req)) {
      return new Response(null, { status: 101 });
    }
    return new Response('WebSocket upgrade failed', { status: 400 });
  }

  /**
   * Handle live reload endpoints
   */
  private handleLiveReloadEndpoint(path: string, req: Request): Response {
    if (path === '/__0x1_live_reload.js') {
      const liveReloadScript = this.generateLiveReloadScript();
      return new Response(liveReloadScript, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
      });
    }

    // SSE endpoint for live reload
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const message = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(message));

        const heartbeat = setInterval(() => {
          try {
            const ping = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
            controller.enqueue(encoder.encode(ping));
          } catch (error) {
            clearInterval(heartbeat);
            controller.close();
          }
        }, 30000);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }

  /**
   * Generate live reload script
   */
  private generateLiveReloadScript(): string {
    return `
console.log('[0x1] Live reload connected');
const ws = new WebSocket('ws://localhost:${this.options.port}/__0x1_ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'reload') {
    console.log('[0x1] Reloading...', data.filename);
    window.location.reload();
  }
};
`;
  }

  /**
   * Get framework path
   */
  private getFrameworkPath(): string {
    return process.cwd().includes('00-Dev/0x1') 
      ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
      : join(process.cwd(), '../0x1');
  }

  /**
   * Error response helpers
   */
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
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }

    if (this.server) {
      this.server.stop();
      this.server = null;
    }

    this.state.clientConnections.clear();
    this.state.components.clear();
    
    logger.info('🧹 Development orchestrator cleaned up');
  }
} 