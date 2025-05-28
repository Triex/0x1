/**
 * 0x1 Framework dev command
 * Starts the development server with hot reload and beautiful logging
 */

import type { Server, Subprocess } from 'bun';
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Server imports
import {
  getLocalIP,
  isPortAvailable
} from "./utils/server/network";

// Builder imports
import {
  buildAppBundle,
  buildComponents
} from "../utils/builder";

// Utility imports
import { createDevServer } from '../server/dev-server';
import { logger } from "../utils/logger";

/**
 * Options for the dev command
 */
export interface DevOptions {
  port?: number;
  host?: string;
  open?: boolean;
  tailwind?: boolean;
  debug?: boolean;
  skipTailwind?: boolean;
  ignore?: string[];
  verbose?: boolean;
}

/**
 * Development server state
 */
interface DevServerState {
  server: Server | null;
  tailwindProcess: Subprocess | null;
  port: number;
  host: string;
  projectPath: string;
}

/**
 * Open browser at the given URL (cross-platform)
 */
async function openBrowser(url: string): Promise<void> {
  try {
    const { spawn } = await import("child_process");
    
    // Determine the command based on platform
    let command: string;
    let args: string[];
    
    switch (process.platform) {
      case 'darwin': // macOS
        command = 'open';
        args = [url];
        break;
      case 'win32': // Windows
        command = 'start';
        args = ['', url]; // Empty string is required for start command
        break;
      default: // Linux and others
        command = 'xdg-open';
        args = [url];
        break;
    }
    
    spawn(command, args, { 
      detached: true, 
      stdio: 'ignore' 
    }).unref();
    
    logger.info(`🌐 Opened ${logger.highlight(url)} in your browser`);
  } catch (error) {
    logger.warn(`Failed to open browser: ${error instanceof Error ? error.message : String(error)}`);
    logger.info(`🌐 Open ${logger.highlight(url)} in your browser`);
  }
}

/**
 * Get available port starting from the preferred port
 */
async function getAvailablePort(preferredPort: number): Promise<number> {
  let port = preferredPort;
  let portRetries = 0;
  const maxPortRetries = 10;

  while (!(await isPortAvailable(port)) && portRetries < maxPortRetries) {
    port++;
    portRetries++;
    if (portRetries <= 3) {
      logger.warn(`💠 Port ${preferredPort} is in use, trying ${port}...`);
    }
  }

  if (portRetries >= maxPortRetries) {
    logger.error(
      `💠 Unable to find an available port after ${maxPortRetries} attempts, starting from port ${preferredPort}`
    );
    process.exit(1);
  }

  if (port !== preferredPort) {
    logger.info(
      `💠 Using port ${port} instead of requested port ${preferredPort}`
    );
  }

  return port;
}

/**
 * Initialize dev server state
 */
async function initializeState(options: DevOptions): Promise<DevServerState> {
  const projectPath = process.cwd();
  const port = await getAvailablePort(options.port || 3000);
  const host = options.host || getLocalIP() || "localhost";

  return {
    server: null,
    tailwindProcess: null,
    port,
    host,
    projectPath,
  };
}

/**
 * Detect Tailwind version and configuration
 * Enhanced for Tailwind CSS v4 support
 */
function detectTailwindConfig(projectPath: string): {
  version: string | null;
  isV4: boolean;
  hasPostcssPlugin: boolean;
} {
  try {
    // Check package.json for tailwindcss dependency
    const packageJsonPath = join(projectPath, 'package.json');
    let tailwindVersion: string | null = null;
    let isV4 = false;
    let hasPostcssPlugin = false;

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for tailwindcss version
      if (dependencies.tailwindcss) {
        tailwindVersion = dependencies.tailwindcss;
        // Check if it's v4 based on semver
        isV4 = typeof tailwindVersion === 'string' && (
               tailwindVersion.includes('4.') || 
               tailwindVersion === 'latest' || 
               tailwindVersion.includes('^4') || 
               tailwindVersion.includes('~4'));
      }

      // Check for v4-specific dependencies
      if (dependencies['@tailwindcss/postcss']) {
        hasPostcssPlugin = true;
        // If we have the postcss plugin, it's very likely v4
        if (!tailwindVersion) {
          tailwindVersion = 'latest';
          isV4 = true;
        }
      }
    }
    
    // Check for tailwind.config.js/ts
    if (!tailwindVersion) {
      const configFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'];
      for (const configFile of configFiles) {
        if (existsSync(join(projectPath, configFile))) {
          tailwindVersion = 'unknown';
          break;
        }
      }
    }

    // Check for CSS files with @import "tailwindcss" (v4 style)
    if (!tailwindVersion || !isV4) {
      const cssFiles = [
        join(projectPath, 'src', 'input.css'),
        join(projectPath, 'src', 'globals.css'),
        join(projectPath, 'app', 'globals.css')
      ];
      
      for (const cssFile of cssFiles) {
        if (existsSync(cssFile)) {
          const content = readFileSync(cssFile, 'utf-8');
          if (content.includes('@import "tailwindcss"')) {
            // This is definitely v4
            isV4 = true;
            if (!tailwindVersion) tailwindVersion = 'latest';
            break;
          }
        }
      }
    }
    
    // Log the detection result
    if (tailwindVersion) {
      logger.info(`🌈 Detected Tailwind CSS ${isV4 ? 'v4' : 'v3'} ${tailwindVersion !== 'unknown' ? `(${tailwindVersion})` : ''}`);
      if (isV4) {
        logger.info('🌟 Using modern Tailwind CSS v4 integration with Bun');
      }
    }

    return { 
      version: tailwindVersion, 
      isV4, 
      hasPostcssPlugin 
    };
  } catch (e) {
    logger.debug(`💠 Error checking Tailwind version: ${e}`);
    return { version: null, isV4: false, hasPostcssPlugin: false };
  }
}

/**
 * Start tailwind process with beautiful logging
 */
async function startTailwind(
  state: DevServerState,
  options: DevOptions
): Promise<Subprocess | null> {
  // Skip if already running (dev-server will handle it)
  if (options.skipTailwind) {
    return null;
  }

  try {
    // Detect Tailwind CSS configuration
    const tailwindConfig = detectTailwindConfig(state.projectPath);
    
    if (!tailwindConfig.version) {
      logger.info('💠 No Tailwind CSS detected, skipping...');
      return null;
    }
    
    // Let the dev-server handle Tailwind processing
    logger.info('💠 Tailwind CSS will be handled by development server');
    return null;

  } catch (error) {
    logger.error(
      `💠 Failed to check Tailwind: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

/**
 * Set up directory structure with logging
 */
async function setupDirectories(projectPath: string): Promise<void> {
  // Ensure output directories exist
  const outDir = join(projectPath, ".0x1", "public");
  const tempDir = join(projectPath, ".0x1", "temp");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    logger.debug("💠 Created output directory: " + outDir);
  }

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
    logger.debug("💠 Created temp directory: " + tempDir);
  }
}

/**
 * Start the development server with enhanced logging
 */
async function startServer(
  state: DevServerState,
  options: DevOptions
): Promise<Server> {
  try {
    logger.info(
      `💠 Starting development server on http://${state.host}:${state.port}`
    );

    // Create the server with proper options
    const server = await createDevServer({
      port: state.port,
      host: state.host,
      projectPath: state.projectPath,
      debug: options.debug || false,
      liveReload: true,
      open: options.open
    });

    return server;
  } catch (error: unknown) {
    logger.error(
      `💠 Failed to start server: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Display beautiful server info
 */
function displayServerInfo(state: DevServerState): void {
  const localIP = getLocalIP();

  // Log server information with emojis
  logger.info(`💠 Server running at:`);
  logger.info(`  > Local:   http://${state.host}:${state.port}`);

  if (localIP && localIP !== "localhost") {
    logger.info(`  > Network: http://${localIP}:${state.port}`);
  }

  // Beautiful box display for server information
  logger.spacer();
  logger.box(
    `🚀 0x1 Dev Server Running

` +
      `Local:            http://${state.host === "0.0.0.0" ? "localhost" : state.host}:${state.port}
` +
      `Network:          http://${localIP}:${state.port}

` +
      `Powered by Bun   v${Bun.version}`
  );
  logger.spacer();
  logger.info("💠 Ready for development. Press Ctrl+C to stop.");
}

/**
 * Clean up resources when shutting down
 */
async function cleanup(state: DevServerState): Promise<void> {
  logger.info("💠 Shutting down development server...");

  // Kill tailwind process if it exists
  if (state.tailwindProcess) {
    state.tailwindProcess.kill();
    logger.debug("💠 Tailwind process terminated");
  }

  // Close server if it exists
  if (state.server) {
    state.server.stop();
    logger.debug("💠 Development server stopped");
  }

  logger.info("💠 ✅ Development server shutdown complete");
}

/**
 * Build components and show appropriate status
 */
async function buildComponentsWithStatus(projectPath: string): Promise<void> {
  logger.info('💠 Building components...');
  const componentsBuilt = await buildComponents(projectPath);
  if (!componentsBuilt) {
    logger.warn('⚠️ No component files found - this is okay for simple projects');
  } else {
    logger.success('✅ Components built successfully');
  }
}

/**
 * Build app bundle and show status
 */
async function buildAppBundleWithStatus(projectPath: string): Promise<void> {
  logger.info('💠 Building app bundle from page.tsx');
  const bundleBuilt = await buildAppBundle(projectPath);
  if (!bundleBuilt) {
    logger.error('❌ Failed to build application bundle');
    throw new Error('App bundle build failed');
  }
  logger.success('✅ App bundle created at ' + join(projectPath, '.0x1', 'public', 'app-bundle.js'));
}

/**
 * Main dev server function with beautiful output
 */
export async function dev(options: DevOptions = {}): Promise<Server> {
  try {
    const projectPath = process.cwd();
    
    // Beautiful section header
    logger.section("DEVELOPMENT SERVER");
    logger.spacer();
    
    // Validate project structure
    const appPath = join(projectPath, "app");
    if (!existsSync(appPath)) {
      logger.error("❌ No 'app' directory found. This doesn't appear to be a 0x1 project.");
      logger.info("💡 Run 'npx 0x1 new my-app' to create a new project.");
      process.exit(1);
    }

    // Check for main page file
    const pageFiles = ["page.tsx", "page.jsx", "index.tsx", "index.jsx"];
    const hasPageFile = pageFiles.some(file => existsSync(join(appPath, file)));
    
    if (!hasPageFile) {
      logger.error(`❌ No main page file found in app/. Expected one of: ${pageFiles.join(", ")}`);
      process.exit(1);
    }

    // Find available port
    const port = await getAvailablePort(options.port || 3000);
    const host = options.host || "localhost";
    const localIP = getLocalIP();

    // Use spinner for server startup
    const serverSpin = logger.spinner("Starting 0x1 development server");

    try {
      // Create and start dev server
      const server = await createDevServer({
        port,
        host,
        projectPath,
        open: options.open,
        liveReload: true,
        debug: options.debug
      });

      // Stop spinner with success
      const serverUrl = `http://${host}:${port}`;
      serverSpin.stop("success", `Server started at ${logger.highlight(serverUrl)}`);

      // Add file watcher info
      logger.info(`Watching for file changes in ${logger.highlight(projectPath)}`);

      // Handle browser opening
      if (options.open) {
        await openBrowser(serverUrl);
      } else {
        logger.info(`🌐 Open ${logger.highlight(serverUrl)} in your browser`);
      }

      // Show beautiful server info box
      logger.spacer();
      logger.box(
        `🚀 0x1 Dev Server Running

` +
        `Local:            ${logger.highlight(serverUrl)}
` +
        `Network:          ${logger.highlight(`http://${localIP}:${port}`)}

` +
        `Powered by Bun   v${Bun.version}`
      );
      logger.spacer();

      // Final ready message
      logger.info("💠 Ready for development. Press Ctrl+C to stop.");

      // Handle shutdown gracefully with comprehensive cleanup
      let isShuttingDown = false;
      
      const cleanup = async () => {
        if (isShuttingDown) return; // Prevent multiple cleanup calls
        isShuttingDown = true;
        
        logger.info("\n🛑 Shutting down dev server...");
        
        try {
          // Stop the server first
          if (server) {
            server.stop(true); // Force stop
            logger.debug("💠 Development server stopped");
          }
          
          // Kill any remaining processes on the port
          try {
            await Bun.spawn(['pkill', '-f', `bun.*${port}`], { 
              stdout: 'pipe', 
              stderr: 'pipe' 
            }).exited;
            logger.debug("💠 Killed remaining Bun processes");
          } catch (e) {
            // Ignore errors - process might not exist
          }
          
          // Additional cleanup for any lingering processes
          try {
            const lsofProcess = Bun.spawn(['lsof', '-ti', `:${port}`], { 
              stdout: 'pipe', 
              stderr: 'pipe' 
            });
            
            await lsofProcess.exited;
            
            if (lsofProcess.stdout) {
              const output = await new Response(lsofProcess.stdout).text();
              const pids = output.trim().split('\n').filter(pid => pid);
              
              for (const pid of pids) {
                try {
                  await Bun.spawn(['kill', '-9', pid], { 
                    stdout: 'pipe', 
                    stderr: 'pipe' 
                  }).exited;
                  logger.debug(`💠 Killed process ${pid}`);
                } catch (e) {
                  // Ignore errors
                }
              }
            }
          } catch (e) {
            // Ignore errors - lsof might not be available or no processes found
          }
          
          logger.success("✅ Development server shutdown complete");
        } catch (error) {
          logger.error(`Error during cleanup: ${error}`);
        } finally {
          process.exit(0);
        }
      };

      // Handle multiple signal types for comprehensive shutdown
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      process.on('SIGQUIT', cleanup);
      process.on('exit', cleanup);
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error(`Uncaught exception: ${error}`);
        cleanup();
      });
      
      process.on('unhandledRejection', (reason) => {
        logger.error(`Unhandled rejection: ${reason}`);
        cleanup();
      });

      return server;

    } catch (error: any) {
      serverSpin.stop("error", "Failed to start development server");
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to start dev server: ${errorMessage}`);
      
      if (error.code === 'EADDRINUSE') {
        logger.info(`💡 Port ${port} is already in use. Try a different port with --port flag.`);
      }
      
      process.exit(1);
    }

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to start dev server: ${errorMessage}`);
    if (error.code === 'EADDRINUSE') {
      logger.info(`💡 Port ${options.port || 3000} is already in use. Try a different port with --port flag.`);
    }
    process.exit(1);
  }
}

// Add the expected export name
export const runDevServer = dev;
