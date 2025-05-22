/**
 * 0x1 CLI - Development Server Command
 * Runs the development server with hot reloading
 * Automatically detects and processes Tailwind CSS in parallel
 */

import { serve, type Server, type ServerWebSocket, type Subprocess } from "bun";
import { existsSync, lstatSync, mkdirSync, readFileSync } from "node:fs";
import { watch, readdir, writeFile } from "fs/promises";
import { dirname, join, resolve, extname } from 'path';
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";
import { 
  serveAppDirectoryHtml, 
  serveLiveReloadScript, 
  serveFrameworkModule,
  handleWebSocketConnection, 
  broadcastReload,
  handleScriptFile
} from "./utils/server-handlers.js";
import { getLocalIP, openBrowser, transformBareImports, findTailwindCssInput } from "./utils/dev-server-utils.js";
import { shutdownServer, startTailwindProcess, setupShutdown, type DevOptions } from "./utils/server-setup.js";
import { discoverComponents, transpileFile } from "./utils/transpilation-utils.js";

/**
 * Check if a port is available for use
 */
async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const testServer = Bun.serve({
      port,
      fetch: () => new Response("Port check"),
    });
    testServer.stop();
    return true;
  } catch (e) {
    return false;
  }
}

// Get the path to the framework files
const currentFilePath = fileURLToPath(import.meta.url);
const cliDir = dirname(currentFilePath);
const frameworkPath = resolve(cliDir, "../..");
const frameworkDistPath = resolve(frameworkPath, "dist");
const frameworkCorePath = resolve(frameworkDistPath, "core");

/**
 * Create the development server
 */
async function createDevServer(options: {
  port: number;
  host: string;
  ignorePatterns?: string[];
  debug?: boolean;
}): Promise<{ server: Server; watcher: { close: () => void } }> {
  const {
    port,
    host,
    ignorePatterns = ["node_modules", ".git", "dist"],
    debug = false,
  } = options;
  
  // Set up WebSocket clients for live reload
  const connectedClients = new Set<ServerWebSocket<unknown>>();

  // Determine source and public directories based on project structure
  const projectPath = process.cwd();
  let appDir: string;
  let srcDir: string;
  let publicDir: string;
  let distDir: string;

  // Modern directory structures
  const rootAppDirectory = resolve(projectPath, "app");
  const srcAppDirectory = resolve(projectPath, "src/app");
  const hasCustomStructure = existsSync(resolve(projectPath, "0x1.config.js")) || 
                           existsSync(resolve(projectPath, "0x1.config.mjs")) ||
                           existsSync(resolve(projectPath, "0x1.config.json"));
  const customStructureFile = existsSync(resolve(projectPath, "0x1.config.js")) ? 
                             resolve(projectPath, "0x1.config.js") :
                             existsSync(resolve(projectPath, "0x1.config.mjs")) ?
                             resolve(projectPath, "0x1.config.mjs") :
                             resolve(projectPath, "0x1.config.json");
  
  // Check if using the app directory structure (root level or in src)
  const hasAppRouter = existsSync(rootAppDirectory) || existsSync(srcAppDirectory);

  if (hasAppRouter && existsSync(rootAppDirectory)) {
    appDir = rootAppDirectory;
    srcDir = projectPath;
    publicDir = resolve(projectPath, "public");
    distDir = resolve(projectPath, "dist");
    logger.info("Detected app router structure in root folder");
  } else if (hasAppRouter && existsSync(srcAppDirectory)) {
    appDir = srcAppDirectory;
    srcDir = resolve(projectPath, "src");
    publicDir = resolve(projectPath, "public");
    distDir = resolve(projectPath, "dist");
    logger.info("Detected app router structure in src folder");
  } else if (hasCustomStructure) {
    try {
      // Default structure if custom config loading fails
      srcDir = resolve(projectPath, "src");
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
      appDir = resolve(srcDir, "app");
      
      logger.info(`Using structure from ${customStructureFile}`);
    } catch (error) {
      logger.warn(
        `Failed to load custom structure from ${customStructureFile}. Using default directories.`
      );
      srcDir = resolve(projectPath, "src");
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
      appDir = resolve(srcDir, "app");
    }
  } else {
    // Check if src directory exists, if not use project root
    const standardSrcDir = resolve(projectPath, "src");

    if (existsSync(standardSrcDir)) {
      srcDir = standardSrcDir;
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
      appDir = resolve(srcDir, "app");
    } else {
      srcDir = projectPath;
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
      appDir = resolve(srcDir, "app");
    }
    
    logger.info("Using default directory structure");
  }

  // Ensure public directory exists
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  // We'll use the global isPortAvailable function defined above
  
  // Import the standalone server implementation that handles MIME types correctly
  const { createStandaloneServer } = await import('./utils/standalone-server.js');
  
  // Create the development server using our standalone implementation that correctly handles MIME types
  const server = createStandaloneServer({
    port,
    host,
    projectPath,
    // Fetch handler moved to standalone-server.ts for better MIME type handling
  });

  // We'll use the already defined projectPath variable for watching
  
  // Use the ignore patterns from the function parameters
  // (already destructured at the beginning of the function)
  
  // Create file watcher
  const watcher = await watch(projectPath, {
    recursive: true,
  });

  // Create a wrapper object with a close method for the file watcher
  const watcherWithClose = {
    close: () => {
      // Close the async iterator when needed
      try {
        // In Bun, we need to handle the cleanup of the watcher in a special way
        // This is a placeholder for the proper cleanup logic
        logger.debug('Closing file watcher');
      } catch (err) {
        const error = err as Error;
        logger.error(`Error closing watcher: ${error.message}`);
      }
    }
  };

  // Set up file watching
  (async () => {
    try {
      for await (const event of watcher) {
        const filename = event.filename || '';
        // Skip files that match ignore patterns from the function parameters
        const shouldIgnore = ignorePatterns.some((pattern: string) => 
          filename.includes(pattern)
        );

        if (shouldIgnore) continue;

        logger.debug(`File changed: ${filename}`);

        // For CSS files, broadcast CSS update for hot-reloading without full page refresh
        if (filename.endsWith(".css")) {
          broadcastReload(connectedClients, 'css-update', filename);
        } else {
          // For other files, broadcast full reload
          broadcastReload(connectedClients);
        }
      }
    } catch (error) {
      logger.error(`Watcher error: ${error}`);
    }
  })();

  // Make sure we return the server and watcher as required by function return type
  return { server, watcher: watcherWithClose };
}

/**
 * Start the development server
 */
export async function startDevServer(options: DevOptions = {}): Promise<void> {
  // Default port and host
  const port = options.port || 3000;
  const host = options.host || "localhost";
  const debug = options.debug || false;
  
  // Allow customizing the open flag (whether to open the browser)
  const open = options.open !== undefined ? options.open : true;
  
  // Ignore patterns (files/directories to ignore for live-reload)
  const ignorePatterns = options.ignore || [
    "node_modules",
    ".git",
    "dist",
    ".0x1",
    ".next",
  ];

  logger.info(`💠 Starting 0x1 development server...`);

  // Check if the port is available, if not find another one
  let currentPort = port;
  let portRetries = 0;
  const maxPortRetries = 10;
  
  while (!(await isPortAvailable(currentPort)) && portRetries < maxPortRetries) {
    currentPort++;
    portRetries++;
    logger.warn(`Port ${port} is in use, trying ${currentPort}...`);
  }
  
  if (portRetries >= maxPortRetries) {
    logger.error(`Unable to find an available port after ${maxPortRetries} attempts, starting from port ${port}`);
    process.exit(1);
  }
  
  if (currentPort !== port) {
    logger.warn(`Using port ${currentPort} instead of requested port ${port}`);
  }

  try {
    // Find the project path
    const projectPath = process.cwd();
    const publicDir = resolve(projectPath, "public");
    
    // Ensure public directory exists
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    // Find Tailwind CSS input file
    const tailwindInputPath = await findTailwindCssInput(projectPath);
    let tailwindProcess: Subprocess | null = null;
    
    // Start Tailwind CSS compiler if input file exists and skipTailwind is not set
    if (tailwindInputPath && !options.skipTailwind) {
      logger.info(`💠 Starting Tailwind CSS compiler...`);
      tailwindProcess = await startTailwindProcess(projectPath, tailwindInputPath, publicDir);
    } else if (!options.skipTailwind) {
      logger.warn("💠 No Tailwind CSS input file found. Skipping Tailwind compilation.");
    } else {
      logger.info("💠 Tailwind CSS compilation skipped as requested.");
    }

    // Create the dev server
    const { server, watcher } = await createDevServer({
      port: currentPort,
      host,
      ignorePatterns,
      debug,
    });

    // Set up clean shutdown
    shutdownServer(watcher, tailwindProcess, server, currentPort);

    // Log server information
    logger.info(`💠 Server running at:`);  
    logger.info(`  > Local:   http://${host}:${currentPort}`);  
    
    const localIP = getLocalIP();
    if (localIP !== "localhost") {
      logger.info(`  > Network: http://${localIP}:${currentPort}`);  
    }
    
    // Add a beautiful box display for server information
    logger.spacer();
    logger.box(
      `🚀 0x1 Dev Server Running

` +
      `Local:            http://${host === "0.0.0.0" ? "localhost" : host}:${currentPort}
` +
      `Network:          http://${localIP}:${currentPort}

` +
      `Powered by Bun   v${Bun.version}`
    );
    logger.spacer();
    logger.info("💠 Ready for development. Press Ctrl+C to stop.");
    
    // Open browser
    if (open) {
      logger.info(`💠 Opening browser...`);
      const url = `http://${host === "0.0.0.0" ? "localhost" : host}:${currentPort}`;
      
      // Show network URL if available
      if (localIP !== "localhost") {
        logger.info(`💠 Also available on your network at: http://${localIP}:${currentPort}`);
      }

      // Open browser after a small delay to allow server to fully start
      setTimeout(() => {
        openBrowser(url).catch((error) => {
          logger.warn(`Could not open browser automatically: ${error}`);
        });
      }, 500);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to start development server: ${errorMessage}`);
    process.exit(1);
  }
}
