/**
 * 0x1 CLI - Development Server Command
 * Runs the development server with hot reloading
 * Automatically detects and processes Tailwind CSS in parallel
 */

import { serve, type Server, type Subprocess } from "bun";
import { Dirent, existsSync, mkdirSync, readdirSync } from "fs";
import { watch } from "fs/promises";
import os from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";
import { build } from "./build.js";

// Get the path to the framework files
const currentFilePath = fileURLToPath(import.meta.url);
const cliDir = dirname(currentFilePath);
const frameworkPath = resolve(cliDir, "../../..");

/**
 * Transform code content to handle 0x1 bare imports
 * This converts imports like: import { Router } from '0x1' or import { Router } from '0x1/router'
 * to browser-compatible: import { Router } from '/node_modules/0x1' or import { Router } from '/node_modules/0x1/router'
 */
function transformBareImports(content: string): string {
  // First replace exact '0x1' imports
  let transformed = content.replace(
    /from\s+['"]0x1['"]|import\s+['"]0x1['"]|import\(['"]0x1['"]\)/g,
    (match) => {
      return match.replace(/['"]0x1['"]/, '"/node_modules/0x1/index.js"');
    }
  );

  // Then handle subpath imports like '0x1/router'
  transformed = transformed.replace(
    /from\s+['"]0x1\/[\w-]+['"]|import\s+['"]0x1\/[\w-]+['"]|import\(['"]0x1\/[\w-]+['"]\)/g,
    (match, subpath1, subpath2, subpath3) => {
      const subpath = subpath1 || subpath2 || subpath3;
      return match.replace(
        /['"](0x1)\/[\w-]+['"]/,
        `"/node_modules/0x1${subpath}.js"`
      );
    }
  );

  return transformed;
}

/**
 * Open browser at the given URL
 */
async function openBrowser(url: string): Promise<void> {
  // Use Bun's native capabilities instead of external dependencies
  const openUrl = (url: string) => {
    return Bun.spawn(["open", url], {
      stdout: "inherit",
      stderr: "inherit",
    });
  };
  await openUrl(url);
}

/**
 * Get the local IP address for network access
 */
function getLocalIP(): string {
  try {
    const nets = os.networkInterfaces();

    for (const name of Object.keys(nets)) {
      const interfaces = nets[name];
      if (!interfaces) continue;

      for (const net of interfaces) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
    return "localhost"; // Fallback
  } catch (err) {
    return "localhost";
  }
}

/**
 * Get the current Bun version
 * Currently unused but kept for potential future diagnostics
 */
function _getBunVersion(): string {
  return `v${Bun.version}`;
}

export interface DevOptions {
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
  config?: string;
  ignore?: string[];
  skipTailwind?: boolean; // Option to skip Tailwind processing
  debug?: boolean; // Enable debug mode for verbose logging
}

/**
 * Handle exit signals with robust process termination
 * */
function shutdownServer(
  watcher: { close: () => void },
  tailwindProcess: Subprocess | null,
  devServer: Server,
  port: number
) {
  let isShuttingDown = false;

  async function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info("💠 Shutting down development server...");

    // First close file watcher to prevent new events
    if (watcher && typeof watcher.close === "function") {
      try {
        watcher.close();
        logger.info("File watcher closed");
      } catch (error) {
        logger.error(`Error closing file watcher: ${error}`);
      }
    }

    // Kill tailwind process if it exists
    if (tailwindProcess && typeof tailwindProcess.kill === "function") {
      try {
        tailwindProcess.kill(9); // Use SIGKILL for immediate termination
        logger.info("Tailwind process terminated");
      } catch (error) {
        logger.error(`Error killing Tailwind process: ${error}`);
      }
    }

    // Close the server if it exists
    if (devServer) {
      try {
        devServer.stop(); // Stop the server
        logger.info("Server stopped");
      } catch (error) {
        logger.error(`Error stopping server: ${error}`);
      }
    }

    // Force kill any process using our port
    try {
      // Make sure we have a valid port number before trying to kill processes
      if (port && typeof port === "number" && port > 0) {
        const killPort = Bun.spawn([
          "sh",
          "-c",
          `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
        ]);
        await killPort.exited;
      } else {
        logger.debug("No valid port specified for cleanup");
      }
    } catch (e) {
      // Ignore errors
    }

    logger.success("Server shutdown complete");

    // Force exit after a short timeout to ensure cleanup is complete
    setTimeout(() => process.exit(0), 100);
  }

  cleanup();
}

/**
 * Start the development server
 */
export async function startDevServer(options: DevOptions = {}): Promise<void> {
  // Load configuration
  const configPath = options.config
    ? resolve(process.cwd(), options.config)
    : findConfigFile();

  const config = configPath ? await loadConfig(configPath) : {};

  // Set default options
  // Start with the specified port or default to 3000
  let port = options.port || config.server?.port || 3000;

  // Function to check if a port is available
  const isPortAvailable = async (port: number): Promise<boolean> => {
    try {
      const server = Bun.serve({
        port,
        fetch: () => new Response("Port check"),
      });

      // If we can bind to the port, it's available
      server.stop();
      return true;
    } catch (e) {
      // If we get an error, the port is likely in use
      return false;
    }
  };

  // Try to find an available port, incrementing up to 10 times
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await isPortAvailable(port)) {
      break;
    }
    logger.warn(`Port ${port} is already in use, trying ${port + 1}...`);
    port++;
  }

  const host = options.host || config.server?.host || "localhost";
  const _open = options.open ?? false;
  const ignorePatterns = options.ignore ||
    config?.build?.ignore || ["node_modules", ".git", "dist"];

  // We'll track the actual port used in case the requested port is unavailable
  let actualPort = port;

  logger.section("DEVELOPMENT SERVER");
  logger.spacer();

  // Run initial build to make sure everything is ready
  const initialBuild = logger.spinner("Running initial build", "build");
  try {
    await build({ watch: false, silent: true, ignore: ignorePatterns });
    initialBuild.stop("success", "Initial build: completed successfully");
  } catch (error) {
    initialBuild.stop("error", "Initial build failed");
    logger.error(`Build error: ${error}`);
    return;
  }

  // Check for Tailwind CSS configuration and start processing if needed
  let _tailwindProcess: Subprocess | null = null;
  if (!options.skipTailwind) {
    const tailwindConfigPath = resolve(process.cwd(), "tailwind.config.js");
    if (existsSync(tailwindConfigPath)) {
      const tailwindSpin = logger.spinner(
        "Starting Tailwind CSS watcher",
        "css"
      );
      _tailwindProcess = await startTailwindProcessing();
      tailwindSpin.stop("success", "Tailwind CSS: watching for changes");
    } else {
      logger.info(
        "Tailwind CSS configuration not found, skipping CSS processing"
      );
    }
  }

  // Start the development server with beautiful styling
  // Use a single spinner for better UX
  const serverSpin = logger.spinner("Starting 0x1 development server");

  try {
    try {
      // Define protocol for server URL
      const protocol = options.https ? "https" : "http";

      // Try to create the server with automatic port increment
      const maxRetries = 10;
      let serverCreated = false;
      let error: unknown;
      let _devServer: Server;
      let _watcher: { close: () => void };

      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          // Create server URL for current port attempt
          const serverUrl = `${protocol}://${host}:${actualPort}`;

          // Attempt to create the server with current port
          const result = await createDevServer({
            port: actualPort,
            host,
            ignorePatterns,
            debug: options.debug || false,
          });

          // Store server and watcher from the result
          _devServer = result.server;
          _watcher = result.watcher;

          // Server created successfully
          serverCreated = true;

          // Stop server spinner and show success message
          serverSpin.stop(
            "success",
            `Server started at ${logger.highlight(serverUrl)}`
            // FIXME: Spaces still not being removed - commmented
            // `Server started at ${logger.highlight(serverUrl.replace(/\s+/g, ""))}`
          );
          // If port changed due to conflict, show a helpful message
          if (actualPort !== port) {
            logger.info(
              `Port ${port} was already in use, using port ${actualPort} instead`
            );
          }

          // Break out of the retry loop since we succeeded
          break;
        } catch (err: unknown) {
          error = err;
          // Check if the error is due to the port being in use (type guard for error)
          if (
            err instanceof Error &&
            err.message &&
            err.message.includes("already in use")
          ) {
            logger.debug(
              `Port ${actualPort} is already in use, trying port ${actualPort + 1}`
            );
            actualPort++;
          } else {
            // This is not a port conflict error, so exit the retry loop
            break;
          }
        }
      }

      // If we couldn't create a server after all retries, throw the error
      if (!serverCreated) {
        throw (
          error || new Error("Failed to start server after multiple retries")
        );
      }

      // Add file watcher info
      logger.info(
        `Watching for file changes in ${logger.highlight(process.cwd())}`
      );

      // Create server URL for browser opening and display
      const finalServerUrl = `${protocol}://${host}:${actualPort}`;

      // Add link to open browser
      if (!_open) {
        logger.info(`Open ${logger.highlight(finalServerUrl)} in your browser`);
      } else {
        await openBrowser(finalServerUrl).catch((err) => {
          logger.warn(`Failed to open browser: ${err.message}`);
          logger.info(
            `Open ${logger.highlight(finalServerUrl)} in your browser`
          );
        });
      }
      // Show a beautiful interface info box
      logger.spacer();
      logger.box(
        `🚀 0x1 Dev Server Running

` +
          `Local:            ${logger.highlight(finalServerUrl)}
` +
          `Network:          ${logger.highlight(`${protocol}://${getLocalIP()}:${actualPort}`)}

` +
          `Powered by Bun   v${Bun.version}`
      );

      // Register the shutdown handler for various signals
      process.on("SIGINT", shutdownServer);
      process.on("SIGTERM", shutdownServer);
      process.on("SIGHUP", shutdownServer);

      // Display a success message on server start
      logger.info("Ready for development. Press Ctrl+C to stop.");
    } catch (error) {
      serverSpin.stop("error", "Failed to start development server");
      logger.error(`Failed to start development server: ${error}`);

      // Check if the port is already in use
      if ((error as Error).message?.includes("EADDRINUSE")) {
        logger.info(
          `Port ${port} is already in use. Try using a different port with --port option.`
        );
      }

      process.exit(1);
    }

    // These handlers are now registered inside the try block
  } catch (error) {
    serverSpin.stop("error", "Failed to start development server");
    logger.error(`${error}`);

    // Check if the port is already in use
    if ((error as Error).message?.includes("EADDRINUSE")) {
      logger.info(
        `Port ${port} is already in use. Try using a different port with --port option.`
      );
    }

    process.exit(1);
  }
}

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
  } = options;

  // Determine source and public directories based on project structure
  const projectPath = process.cwd();
  const customStructureFile = resolve(projectPath, "structure.js");
  const hasCustomStructure = existsSync(customStructureFile);

  let srcDir: string;
  let publicDir: string;
  let distDir: string;
  let appDir: string | null = null;
  let isAppDirStructure = false;

  // Check for app directory (modern app router structure)
  const appDirectory = resolve(projectPath, "app");
  // Also check if app is in src directory
  const srcAppDirectory = resolve(projectPath, "src/app");

  if (existsSync(appDirectory)) {
    // App directory in project root
    isAppDirStructure = true;
    appDir = appDirectory;
    srcDir = projectPath;
    publicDir = resolve(projectPath, "public");
    distDir = resolve(projectPath, "dist");
    logger.info("Detected app router structure at project root");
  } else if (existsSync(srcAppDirectory)) {
    // App directory in src folder
    isAppDirStructure = true;
    appDir = srcAppDirectory;
    srcDir = resolve(projectPath, "src");
    publicDir = resolve(projectPath, "public");
    distDir = resolve(projectPath, "dist");
    logger.info("Detected app router structure in src folder");
  } else if (hasCustomStructure) {
    try {
      // Load custom structure configuration
      const structureConfigModule = await import(customStructureFile);
      const structureConfig =
        structureConfigModule.default || structureConfigModule;
      if (structureConfig.sourceDirs) {
        // Use the root directory as source
        srcDir = projectPath;
        // Use custom paths if specified
        publicDir = resolve(
          projectPath,
          structureConfig.sourceDirs.public || "public"
        );
        distDir = resolve(
          projectPath,
          structureConfig.buildPaths?.output || "dist"
        );

        // Check for app directory in custom structure
        if (structureConfig.sourceDirs.app) {
          appDir = resolve(projectPath, structureConfig.sourceDirs.app);
          isAppDirStructure = existsSync(appDir);
          if (isAppDirStructure) {
            logger.info(
              "Using custom app directory structure from configuration"
            );
          }
        }

        logger.info("Using custom project structure for development server");
      } else {
        // Fall back to standard directories
        srcDir = resolve(projectPath, "src");
        publicDir = resolve(projectPath, "public");
        distDir = resolve(projectPath, "dist");
      }
    } catch (error) {
      logger.warn(
        `Failed to load custom structure from ${customStructureFile}. Using default directories.`
      );
      srcDir = resolve(projectPath, "src");
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
    }
  } else {
    // Check if src directory exists, if not use project root
    const standardSrcDir = resolve(projectPath, "src");

    if (existsSync(standardSrcDir)) {
      srcDir = standardSrcDir;
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
    } else {
      // Use project root if no src directory
      srcDir = projectPath;
      publicDir = resolve(projectPath, "public");
      distDir = resolve(projectPath, "dist");
    }
  }

  // Ensure the public directory exists
  if (!existsSync(publicDir)) {
    try {
      mkdirSync(publicDir, { recursive: true });
      logger.debug(`Created missing public directory: ${publicDir}`);
    } catch (error) {
      logger.warn(`Failed to create public directory: ${error}`);
    }
  }

  let liveReloadScript = "";

  try {
    // Try multiple possible paths for the live-reload script with better prioritization
    // We'll search in various locations to ensure we can find the script
    const possiblePaths = [
      // First prioritize our framework src/browser location
      resolve(frameworkPath, "src", "browser", "live-reload.js"),

      // Then check framework dist directory which is available in installed projects
      resolve(frameworkPath, "dist", "browser", "live-reload.js"),

      // Also try installed package locations (for projects using the framework)
      resolve(projectPath, "node_modules", "0x1", "browser", "live-reload.js"),
      resolve(projectPath, "node_modules", "0x1", "dist", "browser", "live-reload.js"),

      // Check for linked package paths
      join(process.cwd(), "src/browser/live-reload.js"),
      resolve(process.cwd(), "dist", "browser", "live-reload.js"),

      // Check relative to current module directory
      resolve(__dirname, "..", "..", "browser", "live-reload.js"),
      resolve(__dirname, "..", "..", "..", "browser", "live-reload.js"),
      resolve(__dirname, "..", "..", "..", "src", "browser", "live-reload.js"),

      // Include common alternative paths
      resolve(projectPath, "browser", "live-reload.js"),
      resolve(projectPath, "src", "browser", "live-reload.js"),
    ];

    logger.debug(`Looking for live-reload.js in:\n${possiblePaths.join("\n")}`);

    // Try each path until we find the script
    let scriptFound = false;
    for (const path of possiblePaths) {
      try {
        // Check if file exists with more reliable method
        if (existsSync(path)) {
          liveReloadScript = await Bun.file(path).text();
          logger.debug(`Found live-reload.js at: ${path}`);
          scriptFound = true;
          break;
        }
      } catch (err) {
        // Ignore errors and try next path
      }
    }

    if (!scriptFound) {
      // Fallback for live reload script
      logger.warn(
        "Could not find live-reload.js - using fallback implementation"
      );

      // Define a better fallback implementation
      liveReloadScript = `
      (function() {
        console.log('[0x1] Live reload (fallback) enabled for ' + window.location.hostname);

        function connect() {
          const eventSource = new EventSource(location.protocol + '//' + location.host + '/__0x1_live_reload');

          eventSource.onopen = function() {
            console.log('[0x1] Live reload connected');
          };

          eventSource.onmessage = function(event) {
            if (event.data === 'reload' || event.data === 'update') {
              console.log('[0x1] Reloading page due to file changes...');
              window.location.reload();
            }
          };

          eventSource.addEventListener('update', function() {
            console.log('[0x1] Reloading page due to file changes...');
            window.location.reload();
          });

          eventSource.onerror = function() {
            console.log('[0x1] Live reload connection error, reconnecting in 2s...');
            eventSource.close();
            setTimeout(connect, 2000);
          };
        }

        // Start connection with a slight delay
        setTimeout(connect, 500);
      })();
      `;
    }
  } catch (error) {
    logger.warn(
      "Failed to load live reload script, hot reloading will be disabled"
    );
    liveReloadScript = "// Live reload not available";
  }

  // Create connected clients set for live reload
  const connectedClients = new Set<WritableStreamDefaultWriter<Uint8Array>>();

  // Setup server with automatic port retry logic
  let server: Server | null = null;
  let currentPort = port;
  const maxPortRetries = 10; // Try up to 10 ports to avoid endless loops

  // Try ports starting from the configured one until we find one that works
  for (let retryCount = 0; retryCount < maxPortRetries; retryCount++) {
    try {
      logger.debug(`Attempting to start server on port ${currentPort}`);
      server = serve({
        port: currentPort,
        hostname: host,
        async fetch(req) {
          const url = new URL(req.url);
          const path = url.pathname;

          // Handle SSE connection for live reload
          if (
            path === "/__0x1_live_reload" ||
            path === "/events" ||
            req.url === "/events"
          ) {
            // Add client to connected clients
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();

            // Store the client
            connectedClients.add(writer);

            // Set up auto-cleanup when response is closed
            return new Response(readable, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          // Handle live reload script
          if (path === "/__0x1_live_reload.js") {
            return new Response(liveReloadScript, {
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache",
              },
            });
          }

          // Handle 0x1 bare module imports (e.g., import { createElement } from '0x1')
          if (path === "/node_modules/0x1/index.js") {
            // Create a browser-compatible version with required exports
            const moduleContent = `
// 0x1 Framework - Browser Compatible Version

// JSX Runtime for createElement and Fragment
export function createElement(type, props, ...children) {
  if (!props) props = {};

  // Handle children
  if (children.length > 0) {
    props.children = children.length === 1 ? children[0] : children;
  }

  // Handle component functions
  if (typeof type === 'function') {
    return type(props);
  }

  // Create DOM element
  const element = document.createElement(type);

  // Apply props
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    // Handle events
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
      continue;
    }

    // Handle className
    if (key === 'className') {
      element.className = value;
      continue;
    }

    // Handle style
    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
      continue;
    }

    // Set attributes
    element.setAttribute(key, value);
  }

  // Append children
  if (props.children) {
    const appendChildren = (children) => {
      if (Array.isArray(children)) {
        children.forEach(appendChildren);
      } else if (children !== null && children !== undefined) {
        // Convert primitive values to text nodes
        element.append(
          children instanceof Node ? children : document.createTextNode(String(children))
        );
      }
    };

    appendChildren(props.children);
  }

  return element;
}

// Fragment for JSX fragments
export const Fragment = (props) => {
  const fragment = document.createDocumentFragment();

  if (props && props.children) {
    const appendChildren = (children) => {
      if (Array.isArray(children)) {
        children.forEach(appendChildren);
      } else if (children !== null && children !== undefined) {
        fragment.append(
          children instanceof Node ? children : document.createTextNode(String(children))
        );
      }
    };

    appendChildren(props.children);
  }

  return fragment;
};

// State management - basic implementation
export function useState(initialValue) {
  let state = initialValue;
  const setState = (newValue) => {
    state = typeof newValue === 'function' ? newValue(state) : newValue;
    return state;
  };
  return [state, setState];
}

// REMOVED: Direct Router exports which were causing naming conflicts
// These exports should come only from the router module, not from here

// Export version
export const version = '0.1.0';

// Default export
export default {
  createElement,
  Fragment,
  useState,
  // Router-related exports removed to avoid naming conflicts
  version
};
`;

            options.debug &&
              logger.debug(`Serving browser-compatible 0x1 framework module`);
            return new Response(moduleContent, {
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache",
              },
            });
          }

          // Handle 0x1 submodule imports (e.g., import { Router } from '0x1/router')
          if (
            path.startsWith("/node_modules/0x1/") &&
            path !== "/node_modules/0x1/index.js"
          ) {
            const submodulePath = path.replace("/node_modules/0x1/", "");
            const submoduleName = submodulePath.replace(/\.js$/, "");

            // Get 0x1 framework submodule path
            const frameworkRoot = dirname(
              dirname(fileURLToPath(import.meta.url))
            );
            const submoduleFile = resolve(
              frameworkRoot,
              "..",
              "src",
              submoduleName + ".js"
            );

            if (existsSync(submoduleFile)) {
              const moduleContent = await Bun.file(submoduleFile).text();
              options.debug &&
                logger.debug(`Serving 0x1 submodule from ${submoduleFile}`);

              return new Response(moduleContent, {
                headers: {
                  "Content-Type": "application/javascript",
                  "Cache-Control": "no-cache",
                },
              });
            }
          }

          // // Serve static content from 'public' directory
          // const staticFilePath = join(options.projectPath, 'public', path);
          // if (existsSync(staticFilePath) && !isDirectory(staticFilePath)) {
          //   // Handle static file from public directory
          //   const fileContent = await Bun.file(staticFilePath).arrayBuffer();
          //   const contentType = getContentType(staticFilePath);

          //   options.debug && logger.debug(`Serving static file: ${staticFilePath}`);

          //   return new Response(fileContent, {
          //     headers: {
          //       'Content-Type': contentType,
          //       'Cache-Control': 'no-cache'

          // Handle framework core files
          if (path === "/core/navigation.js") {
            // Load the actual navigation module instead of using a hardcoded implementation
            const navigationFilePath = resolve(
              frameworkPath,
              'dist/core/navigation.js'
            );
            
            options.debug && logger.debug(`Serving navigation module from: ${navigationFilePath}`);
            
            // Check if the file exists
            if (await Bun.file(navigationFilePath).exists()) {
              const navigationContent = await Bun.file(navigationFilePath).text();
              return new Response(navigationContent, {
                headers: {
                  "Content-Type": "application/javascript",
                  "Cache-Control": "no-cache",
                }
              });
            }
            
            // Return a clear error instead of a fallback
            return new Response(
              `console.error("[0x1] Navigation module not found at ${navigationFilePath}. This is a critical error.");`,
              {
                status: 500,
                headers: { "Content-Type": "application/javascript" }
              }
            );
          }

          // Special handling for 0x1 framework imports (both as direct path and as import)
          // This allows clean imports to work even though they're not natively supported in browsers
          // We've moved to a direct script injection approach in index.html, but this handler remains
          // for backward compatibility with existing projects that might still use import statements
          if (
            path.startsWith("/0x1/") ||
            path.includes("/node_modules/0x1/") ||
            path === "/router.js" ||
            path === "/router" ||
            path.includes("/node_modules/0x1/dist/router.js")
          ) {
            // Extract the module path - handle different import patterns
            let modulePath = "";

            // Handle all possible import patterns for the router
            if (path.startsWith("/0x1/")) {
              modulePath = path.replace("/0x1/", "");
            } else if (path.includes("/node_modules/0x1/")) {
              // Extract 'router' from any path containing '/node_modules/0x1/'
              if (path.includes("router")) {
                modulePath = "router";
              } else {
                modulePath = path
                  .substring(path.lastIndexOf("/") + 1)
                  .replace(".js", "");
              }
            } else if (path === "/router.js" || path === "/router") {
              modulePath = "router";
            }
            let moduleContent = "";
            
            // Serve the router module - ensure proper handling of regex patterns and routing
            if (modulePath === "router" || modulePath === "router.js") {
              // Print more verbose debug logging
              options.debug && logger.debug(`Loading router module for client-side rendering`);
              
              // Explicitly check for the router in all possible locations
              const possiblePaths = [
                // Look in the standard framework paths
                resolve(frameworkPath, 'dist/core/router.js'),
                resolve(frameworkPath, 'dist/0x1/router.js'),
                resolve(frameworkPath, 'src/core/router.ts'),
                // Check in global node_modules (for when installing from npm)
                resolve(process.env.BUN_INSTALL || '/usr/local', 'lib/node_modules/0x1/dist/core/router.js'),
                resolve(process.env.BUN_INSTALL || '/usr/local', 'lib/node_modules/0x1/dist/0x1/router.js'),
                // Look in local node_modules as well
                resolve(process.cwd(), 'node_modules/0x1/dist/core/router.js'),
                resolve(process.cwd(), 'node_modules/0x1/dist/0x1/router.js')
              ];
              
              // Debug the search paths
              options.debug && logger.debug(`Searching for router in multiple locations:`);
              options.debug && possiblePaths.forEach(path => logger.debug(` - ${path}`));
              
              let routerPath = null;
              let navigationPath = null;
              
              // Find the first path that exists
              for (const path of possiblePaths) {
                if (await Bun.file(path).exists()) {
                  routerPath = path;
                  // Set navigation path based on the router location
                  navigationPath = path.replace('router.js', 'navigation.js');
                  if (path.endsWith('.ts')) {
                    navigationPath = path.replace('router.ts', 'navigation.ts');
                  }
                  options.debug && logger.debug(`Found router at: ${routerPath}`);
                  options.debug && logger.debug(`Associated navigation at: ${navigationPath}`);
                  break;
                }
              }
              
              if (!routerPath || !navigationPath) {
                throw new Error(`Cannot find router module in any expected location`);
              }
              
              try {
                // Use Bun to load both files in parallel for better performance
                const [routerSource, navigationSource] = await Promise.all([
                  Bun.file(routerPath).text(),
                  Bun.file(navigationPath).text()
                ]);
                
                // Process source files for browser compatibility
                // We need a completely fresh approach to avoid any circular dependencies
                // or duplicate declarations
                
                // First process the router module - we'll only keep the Router class implementation
                let cleanRouterSource = routerSource
                  // Remove all imports
                  .replace(/import[^;]+;/g, '// Import removed')
                  // Remove all interfaces and types
                  .replace(/export\s+(interface|type)\s+[^{]+\{[^}]+\};?/g, '// Interface removed')
                  // Remove export keyword from Router class
                  .replace(/export\s+class\s+Router/, 'class Router');
                  
                // Then process navigation components separately - we only want the function implementations
                let cleanNavigationSource = navigationSource
                  // Remove all imports
                  .replace(/import[^;]+;/g, '// Import removed')
                  // Remove all interfaces and types
                  .replace(/export\s+(interface|type)\s+[^{]+\{[^}]+\};?/g, '// Interface removed')
                  // Remove export keyword from function definitions
                  .replace(/export\s+function\s+Link/g, 'function Link');
                  
                // Rename NavLink to BrowserNavLink to avoid duplicate exports
                cleanNavigationSource = cleanNavigationSource
                  .replace(/export\s+function\s+NavLink/g, 'function BrowserNavLink');
                  
                // Rename Redirect to avoid conflicts
                cleanNavigationSource = cleanNavigationSource
                  .replace(/export\s+function\s+Redirect/g, 'function BrowserRedirect');
                
                // Provide a proper ESM module with the router implementation
                moduleContent = `
// 0x1 Router - Modern ESM Implementation
// Directly from core source files

// First the Router implementation
${cleanRouterSource}

// Navigation components implementation
${cleanNavigationSource}

// Factory function to create router with default options
export function createRouter(options = {}) {
  const defaultOptions = {
    root: document.getElementById('app') || document.body,
    mode: 'history',
    transitionDuration: 200,
    notFoundComponent: () => {
      const div = document.createElement('div');
      div.textContent = '404 - Page Not Found';
      return div;
    }
  };
  
  // Merge options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create and return a router instance
  return new Router(mergedOptions);
}

// Export components with consistent naming to avoid conflicts
const LinkExport = Link;
// Use our renamed functions for exports
const NavLinkExport = BrowserNavLink;
const RedirectExport = BrowserRedirect;

// Use explicit naming pattern to avoid duplicate exports
export { 
  Router,
  LinkExport as Link, 
  NavLinkExport as RouterNavLink, // Export as RouterNavLink to avoid duplicate NavLink export
  RedirectExport as RouterRedirect 
};

// Default export
export default Router;
`;
                
              } catch (error) {
                options.debug && logger.error(`Error loading router: ${error}`);
                // Return an error instead of a fallback
                moduleContent = `
                // 0x1 Router - Error
                console.error('[0x1] Failed to load router module. This is a critical error that prevents the application from functioning properly.');
                throw new Error('Router module failed to load');
                `;
              }
            } else if (modulePath === "jsx-runtime") {
              moduleContent = await Bun.file(
                join(frameworkPath, "dist/0x1/jsx-runtime.js")
              ).text();
            } else if (
              path === "/node_modules/0x1/jsx-dev-runtime.js" ||
              path === "/node_modules/0x1/jsx-dev-runtime/index.js"
            ) {
              // Provide JSX dev runtime for bundling
              moduleContent = await Bun.file(
                join(frameworkPath, "dist/0x1/jsx-dev-runtime.js")
              ).text();
            } else if (
              modulePath === "" ||
              modulePath === "index.js" ||
              path === "/node_modules/0x1/index.js"
            ) {
              // Provide the main 0x1 module - simplified to avoid duplicate exports
              moduleContent = `
            // 0x1 Framework - Browser Compatible Version
            // Import with consistent naming from router
            import { createRouter, Link, RouterNavLink, RouterRedirect } from '/0x1/router';
            import { jsx, jsxs, Fragment, createElement } from '/0x1/jsx-runtime';

            // Export everything through a single export statement to avoid duplication
            // IMPORTANT: Using consistent export pattern to prevent duplicate exports
            export { 
              createRouter, 
              Link, 
              // Use the imported RouterNavLink as NavLink (not re-exporting NavLink directly)
              RouterNavLink as NavLink, 
              RouterRedirect as Redirect,
              jsx, 
              jsxs, 
              Fragment, 
              createElement 
            };
            
            // Default export for convenience
            export default { 
              createRouter, 
              Link, 
              NavLink: RouterNavLink, 
              Redirect: RouterRedirect,
              jsx, 
              jsxs, 
              Fragment, 
              createElement 
            };
          `;
            }

            if (moduleContent) {
              return new Response(moduleContent, {
                headers: {
                  "Content-Type": "application/javascript",
                  "Cache-Control": "no-cache",
                },
              });
            }
          }

          // Handle root path requests using modern app directory structure
          if (path === "/") {
            logger.debug(`Serving modern app directory structure root HTML`);

            // Create a dynamic HTML that imports the router and loads app/page
            const dynamicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <link rel="icon" href="/favicon.ico">

  <!-- Process polyfill for browser environment to fix 'process is not defined' errors -->
  <script>
    // Simple process.env polyfill that works in all browsers
    window.process = window.process || {
      env: {
        NODE_ENV: 'development'
      }
    };
    console.log('[0x1] Running in development mode', window.location.hostname);
  </script>

  <script type="importmap">
  {
    "imports": {
      "0x1": "/node_modules/0x1/index.js",
      "0x1/": "/node_modules/0x1/"
    }
  }
  </script>
</head>
<body>
  <!-- App Container -->
  <div id="app"></div>

  <!-- App entry point -->
  <script type="module">
    // Import the router factory and components
    import { createRouter } from '0x1/router';

    // Create router instance with default options
    const router = createRouter({
      root: document.getElementById('app')
    });

    // Load components
    try {
      const components = await fetch('/_components_list').then(res => res.json());
      for (const comp of components) {
        await import('/components/' + comp);
      }
    } catch (e) {
      console.log('No component manifest found');
    }

    // Start routing
    router.init();
  </script>
</body>
</html>`;

            return new Response(dynamicHtml, {
              headers: {
                "Content-Type": "text/html",
                "Cache-Control": "no-cache",
              },
            });
          }

          // Special handling for index.js which is the entry point
          if (path === "/index.js") {
            // Check if we already have a bundled version in dist
            const distIndexPath = join(distDir, "index.js");
            if (existsSync(distIndexPath)) {
              try {
                const content = await Bun.file(distIndexPath).text();
                return new Response(content, {
                  headers: {
                    "Content-Type": "application/javascript",
                    "Cache-Control": "no-cache",
                  },
                });
              } catch (error) {
                logger.warn(`Error reading cached index.js: ${error}`);
                // Continue to try transpiling below
              }
            }

            // If no cached version or read failed, try to transpile index.tsx
            const indexTsxPath = join(projectPath, "index.tsx");
            if (existsSync(indexTsxPath)) {
              try {
                // Use the JSX transpiler to directly process and bundle the file
                const { transpileJSX } = await import("./jsx-transpiler.js");
                const output = await transpileJSX(
                  indexTsxPath,
                  distDir,
                  true,
                  projectPath
                );

                if (output) {
                  const outputPath = join(distDir, "index.js");
                  if (existsSync(outputPath)) {
                    const content = await Bun.file(outputPath).text();
                    logger.info(
                      `✅ Successfully served index.js from transpiled source`
                    );
                    return new Response(content, {
                      headers: {
                        "Content-Type": "application/javascript",
                        "Cache-Control": "no-cache",
                      },
                    });
                  }
                }
              } catch (err) {
                const error = err as Error;
                logger.error(
                  `❌ ❌ Error transpiling ${indexTsxPath}: ${error.message || "Bundle failed"}`
                );
                return new Response(
                  `console.error('Failed to load application: ${error.message?.replace(/'/g, "\\'") || "Bundle failed"}');`,
                  {
                    status: 500,
                    headers: {
                      "Content-Type": "application/javascript",
                      "Cache-Control": "no-cache",
                    },
                  }
                );
              }
            }
          }

          // Handle requests for JS files that might exist as TS/TSX files
          if (path.endsWith(".js") && !path.includes("node_modules")) {
            // Check if there's a corresponding .ts or .tsx file
            const basePath = path.replace(/\.js$/, "");
            const tsPath = `${basePath}.ts`;
            const tsxPath = `${basePath}.tsx`;

            let foundTsFile = false;
            let tsFilePath = "";

            // Check for TS/TSX files in project root
            if (existsSync(join(projectPath, tsxPath.substring(1)))) {
              tsFilePath = join(projectPath, tsxPath.substring(1));
              foundTsFile = true;
            } else if (existsSync(join(projectPath, tsPath.substring(1)))) {
              tsFilePath = join(projectPath, tsPath.substring(1));
              foundTsFile = true;
            }

            // If found, compile it on-the-fly
            if (foundTsFile) {
              try {
                logger.debug(`Compiling TypeScript file: ${tsFilePath}`);
                const _tsContent = await Bun.file(tsFilePath).text();

                // Use Bun to transpile TypeScript
                const result = await Bun.build({
                  entrypoints: [tsFilePath],
                  target: "browser",
                  format: "esm",
                  minify: false,
                  sourcemap: "inline",
                  loader: { ".tsx": "tsx", ".ts": "ts" },
                });

                if (!result.success) {
                  logger.error(`Failed to transpile ${tsFilePath}`);
                  return new Response(
                    `// Failed to compile ${path}\nconsole.error('Compilation failed');`,
                    {
                      headers: {
                        "Content-Type": "application/javascript",
                        "Cache-Control": "no-cache",
                      },
                      status: 500,
                    }
                  );
                }

                // Get the output
                const output = await result.outputs[0].text();

                // Transform any remaining bare imports
                const transformedOutput = transformBareImports(output);

                // Write the transformed output to the dist directory to ensure it's available for future requests
                try {
                  const distFilePath = join(distDir, path);
                  const distFileDir = dirname(distFilePath);
                  if (!existsSync(distFileDir)) {
                    mkdirSync(distFileDir, { recursive: true });
                  }
                  await Bun.write(distFilePath, transformedOutput);
                  logger.debug(
                    `Successfully wrote transpiled file to ${distFilePath}`
                  );
                } catch (error) {
                  const writeError = error as Error;
                  logger.warn(
                    `Warning: Unable to cache transpiled file: ${writeError.message || String(writeError)}`
                  );
                }

                logger.debug(`Successfully transpiled ${path}`);
                return new Response(transformedOutput, {
                  headers: {
                    "Content-Type": "application/javascript",
                    "Cache-Control": "no-cache",
                  },
                });
              } catch (error) {
                const err = error as Error;
                logger.error(
                  `❌ Error transpiling ${tsFilePath}: ${err.message || "Unknown error"}`
                );

                // Log detailed error information with proper typing
                if (err.stack) logger.debug(`Stack trace: ${err.stack}`);
                if ("cause" in err)
                  logger.debug(`Caused by: ${(err as any).cause}`);
                if ("errors" in err)
                  logger.debug(
                    `Errors: ${JSON.stringify((err as any).errors, null, 2)}`
                  );

                // When in debug mode, show full error details
                if (options.debug) {
                  console.error("Full error object:", err);
                }
                // Already handled detailed error information above

                return new Response(
                  `// Error transpiling ${path}\nconsole.error('Transpilation error: ${error}');\n// Check terminal for detailed error output`,
                  {
                    headers: {
                      "Content-Type": "application/javascript",
                      "Cache-Control": "no-cache",
                    },
                    status: 500,
                  }
                );
              }
            }
          }

          // Determine file path
          let filePath: string;
          let fileExists = false;

          // Log directory paths we're checking
          logger.debug(`Looking for ${path} in the following directories:`);
          logger.debug(`- Dist: ${distDir}`);
          logger.debug(`- Public: ${publicDir}`);
          logger.debug(`- Source: ${srcDir}`);

          // Check if the file exists in the dist directory first (for processed files)
          filePath = join(distDir, path);
          fileExists = existsSync(filePath);
          if (fileExists) {
            logger.debug(`Found in dist directory: ${filePath}`);
          }

          // If not in dist, check public directory
          if (!fileExists) {
            filePath = join(publicDir, path);
            fileExists = existsSync(filePath);
            if (fileExists) {
              logger.debug(`Found in public directory: ${filePath}`);
            }
          }
          
          // Special handling for favicon.ico and other common static assets - check app directory
          if (!fileExists && isAppDirStructure && appDir && 
              (path === "/favicon.ico" || path === "/favicon.svg" || path === "/icon.svg" || path === "/apple-touch-icon.png")) {
            const appStaticPath = join(appDir, path.substring(1)); // Remove leading slash
            const publicStaticPath = join(publicDir, path.substring(1));
            
            // Check if we have the same static asset in both directories
            const inAppDir = existsSync(appStaticPath);
            const inPublicDir = existsSync(publicStaticPath);
            
            if (inAppDir && inPublicDir) {
              // We found duplicates, warn the developer
              logger.warn(`⚠️ Duplicate ${path.substring(1)} found in both app/ and public/ directories.`);
              logger.warn(`   Using version from ${fileExists ? 'dist/' : 'public/'} directory. Consider removing one to avoid confusion.`);
            }
            
            if (inAppDir) {
              filePath = appStaticPath;
              fileExists = true;
              logger.debug(`Found static asset in app directory: ${filePath}`);
            }
          }

          // If app directory exists, check for app router-style components
          if (!fileExists && isAppDirStructure && appDir) {
            // Check for app router routing paths
            // For example, /posts becomes /app/posts/page.tsx

            // Remove leading slash if present
            const routePath = path.startsWith("/") ? path.substring(1) : path;

            // Create potential app directory file patterns to check
            const possibleAppPaths = [
              // Direct page component match
              join(appDir, routePath, "page.tsx"),
              join(appDir, routePath, "page.jsx"),
              join(appDir, routePath, "page.ts"),
              join(appDir, routePath, "page.js"),

              // For route segments
              join(appDir, routePath + ".tsx"),
              join(appDir, routePath + ".jsx"),
              join(appDir, routePath + ".ts"),
              join(appDir, routePath + ".js"),

              // Index pages
              join(appDir, routePath, "index.tsx"),
              join(appDir, routePath, "index.jsx"),
              join(appDir, routePath, "index.ts"),
              join(appDir, routePath, "index.js"),
            ];

            // Try each possible path in the app directory
            for (const possiblePath of possibleAppPaths) {
              if (existsSync(possiblePath)) {
                filePath = possiblePath;
                fileExists = true;
                logger.debug(`Found in app directory: ${filePath}`);
                break;
              }
            }
          }

          // If not in app dir, check src directory
          if (!fileExists) {
            filePath = join(srcDir, path);
            fileExists = existsSync(filePath);
            if (fileExists) {
              logger.debug(`Found in src directory: ${filePath}`);
            }
          }

          // If not found, check the project root as a last resort
          if (!fileExists && path.endsWith(".html")) {
            filePath = join(projectPath, path.substring(1)); // Remove leading slash
            fileExists = existsSync(filePath);
            if (fileExists) {
              logger.debug(`Found in project root: ${filePath}`);
            }
          }

          // If file doesn't exist, try adding .html extension for clean URLs
          if (!fileExists && !path.endsWith(".html")) {
            const htmlPath = `${path}.html`;

            filePath = join(distDir, htmlPath);
            fileExists = existsSync(filePath);

            if (!fileExists) {
              filePath = join(srcDir, htmlPath);
              fileExists = existsSync(filePath);
            }
          }

          // Check for component files without extension (e.g., import from './components/Counter')
          if (!fileExists && !path.includes(".")) {
            // Check common component extensions
            const componentExtensions = [".tsx", ".ts", ".jsx", ".js"];
            let componentFound = false;

            for (const ext of componentExtensions) {
              // Try src directory first
              let componentPath = join(srcDir, `${path}${ext}`);
              if (existsSync(componentPath)) {
                filePath = componentPath;
                fileExists = true;
                componentFound = true;
                logger.debug(`Found component at ${filePath}`);
                break;
              }

              // Also try with direct components path
              if (path.startsWith("/components/")) {
                componentPath = join(srcDir, `${path}${ext}`);
                if (existsSync(componentPath)) {
                  filePath = componentPath;
                  fileExists = true;
                  componentFound = true;
                  logger.debug(
                    `Found component with explicit path: ${filePath}`
                  );
                  break;
                }
              }
            }

            // If it's not a component, see if it's an SPA route and serve index.html
            if (!componentFound) {
              filePath = join(srcDir, "index.html");
              fileExists = existsSync(filePath);

              if (!fileExists) {
                filePath = join(distDir, "index.html");
                fileExists = existsSync(filePath);
              }
            }
          }

          // If file exists, serve it
          if (fileExists) {
            const file = Bun.file(filePath);
            // Determine the proper content type
            let type = file.type;

            // Special handling for component requests without extensions
            if (path.includes("/components/") && !path.includes(".")) {
              // Check if it's a TypeScript component (tsx/ts)
              if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
                try {
                  // Read and transpile the component
                  const fileContent = await file.text();

                  // Transform bare imports first
                  const transformedContent = transformBareImports(fileContent);

                  // Create transpiler
                  const transpiler = new Bun.Transpiler({
                    loader: filePath.endsWith(".tsx") ? "tsx" : "ts",
                    define: {
                      "process.env.NODE_ENV": '"development"',
                    },
                    macro: {
                      jsxFactory: { jsx: "createElement" },
                      jsxFragment: { jsx: "Fragment" },
                    },
                  });

                  // Transpile to JS
                  const transpiled =
                    transpiler.transformSync(transformedContent);

                  logger.info(`200 OK (Transpiled Component): ${path}`);

                  // Return as JavaScript module
                  return new Response(transpiled, {
                    headers: {
                      "Content-Type": "application/javascript",
                      "Cache-Control": "no-cache",
                    },
                  });
                } catch (error) {
                  logger.error(
                    `Error transpiling component ${filePath}: ${error}`
                  );
                }
              } else {
                // For JS/JSX components, just set the correct MIME type
                type = "application/javascript";
                logger.debug(
                  `Component request detected, setting content type to application/javascript for: ${path}`
                );
              }
            }

            // For HTML files, inject the live reload script
            if (path.endsWith(".html")) {
              try {
                // Inject live reload script into HTML files
                let content = await file.text();

                if (!content.includes("__0x1_live_reload.js")) {
                  content = content.replace(
                    "</head>",
                    '<script src="/__0x1_live_reload.js"></script></head>'
                  );
                }

                // Log successful HTML connection
                logger.info(`200 OK: ${path}`);

                return new Response(content, {
                  headers: {
                    "Content-Type": "text/html",
                    "Cache-Control": "no-cache",
                  },
                });
              } catch (error) {
                logger.error(
                  `Error processing HTML file ${filePath}: ${error}`
                );
                return new Response(`Error processing HTML: ${error}`, {
                  status: 500,
                });
              }
            }

            // For TypeScript files, transpile them on the fly using Bun.Transpiler
            if (path.endsWith(".ts") || path.endsWith(".tsx")) {
              try {
                // Transform source for better browser compatibility
                let fileContent = await file.text();

                // First transform bare imports (0x1/router) to browser-compatible paths
                fileContent = transformBareImports(fileContent);

                // Create transpiler with better browser compatibility
                const transpiler = new Bun.Transpiler({
                  loader: path.endsWith(".tsx") ? "tsx" : "ts",
                  // Bun transpiler uses these options
                  define: {
                    "process.env.NODE_ENV": '"development"',
                  },
                  // Handle jsx/tsx content
                  macro: {
                    // Convert JSX to createElement calls
                    // Using Record<string, string> format for type compatibility
                    jsxFactory: { jsx: "createElement" },
                    jsxFragment: { jsx: "Fragment" },
                  },
                });

                // Transpile the TypeScript code with improved error handling
                let transpiled;
                try {
                  transpiled = transpiler.transformSync(fileContent);
                  // Log successful transpilation
                  logger.debug(`Successfully transpiled ${path}`);
                } catch (transpileError) {
                  // Log detailed error and provide fallback
                  logger.error(`Error transpiling ${path}: ${transpileError}`);
                  return new Response(
                    `/* Error transpiling ${path}: ${transpileError} */`,
                    {
                      status: 500,
                      headers: {
                        "Content-Type": "application/javascript",
                        "Cache-Control": "no-cache",
                      },
                    }
                  );
                }

                // Post-process the result to ensure browser compatibility
                transpiled = transpiled
                  // Remove import statements for browser compatibility
                  .replace(
                    /import .+ from ["'](react\/jsx-(?:dev-)?runtime)["'];?/g,
                    "// JSX runtime imports handled by transpiler"
                  )
                  // Remove export statements
                  .replace(/export\s+/g, "")
                  // Add a comment explaining what happened
                  .replace(
                    /\/\*(.*)\*\//s,
                    "/* $1\n * Note: Transpiled with Bun.Transpiler for optimal performance */\n"
                  );

                logger.info(`200 OK (Transpiled TS → Browser JS): ${path}`);

                // Return transpiled JavaScript with proper MIME type
                return new Response(transpiled, {
                  headers: {
                    "Content-Type": "application/javascript",
                    "Cache-Control": "no-cache",
                  },
                });
              } catch (error) {
                logger.error(`Error transpiling ${filePath}: ${error}`);
                return new Response(
                  `console.error('Failed to load ${path}: ${error}');`,
                  {
                    headers: {
                      "Content-Type": "application/javascript",
                      "Cache-Control": "no-cache",
                    },
                    status: 500,
                  }
                );
              }
            }

            // For JavaScript files, transform bare imports
            if (path.endsWith(".js") || path.endsWith(".jsx")) {
              try {
                // Read the file content
                let fileContent = await file.text();

                // Transform bare imports for browser compatibility
                fileContent = transformBareImports(fileContent);

                logger.info(`200 OK (Transformed JS): ${path}`);

                // Return transformed JavaScript
                return new Response(fileContent, {
                  headers: {
                    "Content-Type": "application/javascript",
                    "Cache-Control": "no-cache",
                  },
                });
              } catch (error) {
                logger.error(`Error transforming ${filePath}: ${error}`);
                return new Response(
                  `console.error('Failed to transform ${path}: ${error}');`,
                  {
                    headers: {
                      "Content-Type": "application/javascript",
                      "Cache-Control": "no-cache",
                    },
                    status: 500,
                  }
                );
              }
            }

            // For all other file types, serve directly
            // Log successful connection
            logger.info(`200 OK: ${path}`);

            return new Response(file, {
              headers: {
                "Content-Type": type,
                "Cache-Control": path.includes("hash.")
                  ? "max-age=31536000"
                  : "no-cache",
              },
            });
          }

          // If file doesn't exist, return 404
          logger.debug(`404 Not Found: ${path}`);
          return new Response("Not Found", { status: 404 });
        },
        error(error) {
          logger.error(`Server error: ${error}`);
          return new Response("Server Error", { status: 500 });
        },
      });

      // Server started successfully, exit the retry loop
      break;
    } catch (error) {
      // Check if the error is related to the port being in use
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes("already in use")
      ) {
        logger.debug(
          `Port ${currentPort} is already in use, trying port ${currentPort + 1}`
        );
        currentPort++;
      } else {
        // Not a port conflict error, rethrow
        throw error;
      }
    }
  }

  // If we tried all ports and couldn't start the server
  if (!server) {
    throw new Error(
      `Could not find an available port after trying ${maxPortRetries} ports starting from ${port}`
    );
  }

  /**
   * Notify all clients of changes
   */
  function notifyClients() {
    // Create message
    const message = new TextEncoder().encode("data: update\n\n");

    // Send reload message to all clients
    for (const client of connectedClients) {
      try {
        // Write the message but don't release the lock - we need it for future messages
        client.write(message);
      } catch (error) {
        // If sending fails, remove the client from the set
        try {
          client.releaseLock();
        } catch (e) {
          // Ignore errors when releasing lock
        }
        connectedClients.delete(client);
      }
    }
  }

  /**
   * Set up file watcher for live reload
   */
  function setupFileWatcher(_server: Server) {
    // Use the already determined srcDir and publicDir from parent scope
    // which support both src-based and root-based project structures

    // Setup debounced reload
    let reloadTimeout: NodeJS.Timeout | null = null;

    const debounceReload = () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }

      reloadTimeout = setTimeout(() => {
        notifyClients();
        reloadTimeout = null;
      }, 100);
    };

    // Helper function to check if a path should be ignored
    function shouldIgnore(path: string): boolean {
      if (!path) return false;

      return ignorePatterns.some((pattern) => {
        // Convert pattern to regex if it has wildcards
        if (pattern.includes("*")) {
          const regexPattern = pattern
            .replace(/\./g, "\\.")
            .replace(/\*/g, ".*");
          const regex = new RegExp(`^${regexPattern}$`);
          return regex.test(path);
        }
        return path.includes(pattern);
      });
    }

    // Watch src and public directories
    const srcWatcher = watch(srcDir, { recursive: true });
    const publicWatcher = existsSync(publicDir)
      ? watch(publicDir, { recursive: true })
      : null;

    // Process file change events
    (async () => {
      try {
        for await (const event of srcWatcher) {
          // Skip ignored patterns
          if (shouldIgnore(event.filename || "")) {
            continue;
          }

          logger.debug(`File changed: ${event.filename}`);
          debounceReload();
        }
      } catch (error) {
        logger.error(`File watcher error: ${error}`);
      }
    })();

    if (publicWatcher) {
      (async () => {
        try {
          for await (const event of publicWatcher) {
            // Skip ignored patterns
            if (shouldIgnore(event.filename || "")) {
              continue;
            }

            logger.debug(`Public file changed: ${event.filename}`);
            debounceReload();
          }
        } catch (error) {
          logger.error(`Public file watcher error: ${error}`);
        }
      })();
    }

    // Create a watcher with a close method that works with AsyncIterables
    return {
      close: () => {
        // Use AbortController to abort the async iterator loops
        const controller = new AbortController();
        const _signal = controller.signal; // Will be used when implementing AbortController functionality
        controller.abort();

        // Actual AbortController usage would be implemented in the watch function
        // This is a placeholder until we can refactor the file watching logic
        logger.debug("Closing file watchers");
      },
    };
  }

  // Set up the file watcher
  const watcher = setupFileWatcher(server);

  // Return both the server and watcher
  return { server, watcher };
}

/**
 * Find configuration file in project directory
 */
function findConfigFile(): string | null {
  const possibleConfigs = ["0x1.config.ts", "0x1.config.js", "0x1.config.mjs"];

  for (const config of possibleConfigs) {
    const configPath = resolve(process.cwd(), config);
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Load configuration from file
 */
// Make async to use Bun.file().text()
async function loadConfig(configPath: string): Promise<any> {
  try {
    if (!existsSync(configPath)) {
      logger.warn(`Configuration file not found: ${configPath}`);
      return {};
    }

    // For now, we'll just parse the file to extract configuration values
    // In a real implementation, we would properly import the module
    // Use Bun's native file API for better performance
    const content = await Bun.file(configPath).text();

    // Very basic parsing - in a real implementation, we would use proper module loading
    const config: any = {};

    // Extract port from server config
    const portMatch = content.match(/port:\s*(\d+)/);
    if (portMatch) {
      config.server = config.server || {};
      config.server.port = parseInt(portMatch[1], 10);
    }

    // Extract host from server config
    const hostMatch = content.match(/host:\s*['"](.*?)['"]/);
    if (hostMatch) {
      config.server = config.server || {};
      config.server.host = hostMatch[1];
    }

    return config;
  } catch (error) {
    logger.warn(`Failed to load configuration from ${configPath}: ${error}`);
    return {};
  }
}

/**
 * Find the input CSS file for Tailwind processing
 * Searches in common locations and checks the tailwind.config.js for hints
 */
// Make async to use Bun.file().text()
/**
 * Start Tailwind CSS processing in the background
 * This function detects Tailwind configuration and runs the CSS processing
 * in parallel with the development server
 */
async function startTailwindProcessing(): Promise<Subprocess | null> {
  try {
    // Check if tailwindcss is installed - with Bun support
    const projectPath = process.cwd();

    // Check for tailwindcss in package.json
    const packageJsonPath = join(projectPath, "package.json");
    let hasTailwind = false;

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(
        await Bun.file(packageJsonPath).text()
      );
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      hasTailwind = Boolean(dependencies.tailwindcss);
    }

    // Also check for tailwind.config.js/ts
    const tailwindConfigPath = [
      join(projectPath, "tailwind.config.js"),
      join(projectPath, "tailwind.config.ts"),
      join(projectPath, "tailwind.config.mjs"),
      join(projectPath, "tailwind.config.cjs")
    ].find(path => existsSync(path));

    const hasTailwindConfig = Boolean(tailwindConfigPath);

    if (!hasTailwind && !hasTailwindConfig) {
      logger.info("No Tailwind CSS configuration detected");
      return null;
    }

    // Find the input CSS file
    const inputCssPath = await findTailwindInputCss(projectPath);
    if (!inputCssPath) {
      logger.info("No Tailwind CSS input file found");
      return null;
    }

    // Ensure the public/styles directory exists
    const outputDir = join(projectPath, "public", "styles");
    const outputCssPath = join(outputDir, "tailwind.css");

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Create an empty output file if it doesn't exist to prevent errors
    if (!existsSync(outputCssPath)) {
      await Bun.write(outputCssPath, '/* Generated by 0x1 Tailwind CSS processor */');
    }

    // Construct the tailwind CLI command using bun (per user rules)
    const tailwindCommand = ["bun", "x", "tailwindcss"];

    // Add the command options and use the correct content paths
    tailwindCommand.push(
      "-i", inputCssPath,
      "-o", outputCssPath,
      "--watch",
      // Fix for @tailwind directives
      "--postcss"
    );

    // Create a spinner for Tailwind CSS processing
    const tailwindSpin = logger.spinner(
      "Starting Tailwind CSS watcher",
      "css"
    );

    // Start tailwind with detailed output logging
    logger.info(`\x1b[1m\x1b[36m💠 Detected Tailwind CSS configuration\x1b[0m`);
    logger.info(`\x1b[1m\x1b[36m💠 Input: ${inputCssPath}\x1b[0m`);
    logger.info(`\x1b[1m\x1b[36m💠 Output: ${outputCssPath}\x1b[0m`);

    logger.debug(`Running command: ${tailwindCommand.join(" ")}`);

    // Spawn the Tailwind CLI process
    const tailwindProcess = Bun.spawn(tailwindCommand, {
      cwd: projectPath,
      env: {
        // Ensure environment variables are inherited
        ...process.env,
        NODE_ENV: "development",
        // Disable color output by default in CI environments
        NO_COLOR: process.env.CI ? "1" : "0",
        // Tailwind CSS directives variables to fix processing issues
        TAILWIND_MODE: "watch",
        TAILWIND_DISABLE_TOUCH: "1",
      },
      stdin: "inherit", // Inherit stdin so that the process can receive signals
      stdout: "pipe", // Pipe stdout so we can parse it
      stderr: "pipe", // Pipe stderr so we can parse it
    });

    let didShowSuccess = false;

    // Set up stdout stream reader
    (async () => {
      const reader = tailwindProcess.stdout.getReader();
      try {
        const continueReading = true;

        while (continueReading) {
          const { done, value } = await reader.read();
          if (done) break;

          const output = new TextDecoder().decode(value);

          if (
            output.includes("Done in") ||
            output.includes("Rebuilding") ||
            output.includes("Completed")
          ) {
            if (!didShowSuccess) {
              tailwindSpin.stop("success", "Tailwind CSS watching for changes");
              didShowSuccess = true;
            } else {
              logger.info("🔄 Tailwind CSS hot reloaded");
            }
          }
        }
      } catch (error) {
        logger.error(`Error reading from Tailwind stdout: ${error}`);
      } finally {
        reader.releaseLock();
      }
    })();

    // Set up error stream reader
    (async () => {
      const reader = tailwindProcess.stderr.getReader();
      try {
        const continueReading = true;
        while (continueReading) {
          const { done, value } = await reader.read();
          if (done) break;

          const output = new TextDecoder().decode(value);

          if (output.includes("Error")) {
            tailwindSpin.stop("error", "Tailwind CSS processing failed");
            logger.error(output);
          } else if (output.includes("warn")) {
            // Just print warnings without stopping the spinner
            logger.warn(output.trim());
          }
        }
      } catch (error) {
        logger.error(`Error reading from Tailwind stderr: ${error}`);
      } finally {
        reader.releaseLock();
      }
    })();

    // Consider process successful after a reasonable timeout
    setTimeout(() => {
      if (!didShowSuccess) {
        tailwindSpin.stop("success", "Tailwind CSS ready");
        didShowSuccess = true;
      }
    }, 5000);

    return tailwindProcess;
  } catch (error) {
    logger.error(`Failed to start Tailwind CSS processing: ${error}`);
    return null;
  }
}

/**
 * Find the input CSS file for Tailwind processing
 * Searches in common locations and checks the tailwind.config.js for hints
 */
async function findTailwindInputCss(
  projectPath: string
): Promise<string | null> {
  // Prioritize app/globals.css (Next.js convention) which is our preferred structure
  const appGlobalsCss = join(projectPath, "app", "globals.css");
  if (existsSync(appGlobalsCss)) {
    logger.info(`💠 Found Tailwind CSS input at ${appGlobalsCss}`);
    return appGlobalsCss;
  }

  // Fall back to common locations if app/globals.css doesn't exist
  const commonLocations = [
    // Next.js convention alternatives
    join(projectPath, "app", "global.css"),
    join(projectPath, "app", "tailwind.css"),
    // Legacy/alternative locations
    join(projectPath, "styles", "main.css"),
    join(projectPath, "src", "styles", "main.css"),
    join(projectPath, "styles", "globals.css"),
    join(projectPath, "styles", "global.css"),
    join(projectPath, "src", "styles", "globals.css"),
    join(projectPath, "css", "main.css"),
    join(projectPath, "assets", "css", "main.css"),
  ];

  // Check common locations
  for (const location of commonLocations) {
    if (existsSync(location)) {
      logger.info(`💠 Found Tailwind CSS input at ${location}`);
      return location;
    }
  }

  // If not found in common locations, try to parse the tailwind.config.js
  // to look for hints about the input file
  const tailwindConfigPath = join(projectPath, "tailwind.config.js");
  if (existsSync(tailwindConfigPath)) {
    try {
      // Use Bun's native file API for better performance
      const configContent = await Bun.file(tailwindConfigPath).text();
      // Look for comments that might indicate the input file
      const inputFileComment = configContent.match(/input\s*:\s*['"](.*?)['"]/);
      if (inputFileComment && inputFileComment[1]) {
        const inputPath = join(projectPath, inputFileComment[1]);
        if (existsSync(inputPath)) {
          return inputPath;
        }
      }
    } catch (error) {
      // Silently continue if we can't parse the config
    }
  }

  // If still not found, look for any CSS file in the project root
  try {
    // Use Node.js API to be compatible with Bun
    // Now using imports from the top of the file

    const dirEntries = readdirSync(projectPath, { withFileTypes: true });
    const cssFiles = dirEntries
      .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith(".css"))
      .map((entry: Dirent) => join(projectPath, entry.name));

    if (cssFiles.length > 0) {
      return cssFiles[0]; // Return the first CSS file found
    }
  } catch (error) {
    // Silently continue if we can't read the directory
  }

  return null;
}
