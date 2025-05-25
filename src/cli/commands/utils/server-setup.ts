/**
 * Development Server Setup
 * Handles server setup and shutdown
 */

import { serve, type Server, type Subprocess } from "bun";
import { logger } from "../../utils/logger.js";

/**
 * Server options interface
 */
export interface DevOptions {
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
  config?: string;
  ignore?: string[];
  skipTailwind?: boolean; // Option to skip Tailwind processing
  useTailwindCss?: boolean; // Use modern Tailwind CSS v4 integration
  debug?: boolean; // Enable debug mode for verbose logging
}

/**
 * Handle exit signals with robust process termination
 */
export function shutdownServer(
  watcher: { close: () => void },
  tailwindProcess: Subprocess | null,
  devServer: Server,
  port: number
): void {
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
    if (tailwindProcess) {
      try {
        tailwindProcess.kill();
        logger.info("Tailwind process terminated");
      } catch (error) {
        logger.error(`Error terminating Tailwind process: ${error}`);
      }
    }

    // Close the dev server
    try {
      await devServer.stop();
      logger.info(`Dev server stopped on port ${port}`);
    } catch (error) {
      logger.error(`Error stopping dev server: ${error}`);
    }

    // Force exit after a timeout to handle any hanging connections
    const forceExitTimeout = setTimeout(() => {
      logger.warn("Force exiting after timeout...");
      process.exit(0);
    }, 1000);

    // Clear the timeout if we exit cleanly
    forceExitTimeout.unref();
    process.exit(0);
  }

  // Handle all the possible exit signals
  const signals = [
    "SIGINT",
    "SIGTERM",
    "SIGHUP",
    "beforeExit",
    "exit",
    "uncaughtException",
  ];

  for (const signal of signals) {
    process.on(signal, async (e) => {
      if (signal === "uncaughtException") {
        logger.error(`Uncaught exception: ${e instanceof Error ? e.stack : e}`);
      }
      await cleanup();
    });
  }
}

/**
 * Start Tailwind CSS compiler as a subprocess
 */
export async function startTailwindProcess(
  projectPath: string, 
  tailwindInputPath: string, 
  publicDir: string
): Promise<Subprocess | null> {
  try {
    logger.info(`💠 Starting Tailwind CSS compiler...`);
    logger.info(`💠 Input: ${tailwindInputPath}`);
    logger.info(`💠 Output: ${publicDir}/styles.css`);

    // Run tailwindcss CLI with watch mode
    const proc = Bun.spawn(
      [
        "bunx",
        "tailwindcss",
        "-i",
        tailwindInputPath,
        "-o",
        `${publicDir}/styles.css`,
        "--watch",
      ],
      {
        cwd: projectPath,
        env: { ...process.env },
        stdout: "inherit",
        stderr: "inherit",
      }
    );

    return proc;
  } catch (error) {
    logger.error(`Failed to start Tailwind compiler: ${error}`);
    return null;
  }
}

/**
 * Setup server shutdown handlers
 * This is a simplified wrapper around shutdownServer for ease of use
 */
export function setupShutdown(
  server: Server,
  options: { 
    watcher?: { close: () => void };
    tailwindProcess?: Subprocess | null;
    port?: number;
  }
): void {
  const {
    watcher = { close: () => {} },
    tailwindProcess = null,
    port = 3000
  } = options;

  shutdownServer(watcher, tailwindProcess, server, port);
  
  logger.debug("Shutdown handlers set up successfully");
}
