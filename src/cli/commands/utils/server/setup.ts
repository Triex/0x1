/**
 * Development Server Setup
 * Handles server setup and shutdown
 */

import { type Server, type Subprocess } from "bun";
import { existsSync } from "fs";
import { join } from "path";
import { logger } from "../../../utils/logger";

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
 * Start Tailwind process with better error handling
 */
export async function startTailwindProcess(
  projectPath: string, 
  inputPath: string, 
  outputDir: string
): Promise<Subprocess | null> {
  const outputPath = join(outputDir, 'styles.css');
  
  logger.info(`💠 Starting Tailwind CSS compiler...`);
  logger.info(`💠 Input: ${inputPath}`);
  logger.info(`💠 Output: ${outputPath}`);
  
  try {
    // Try local tailwind first
    const localTailwind = join(projectPath, 'node_modules', '.bin', 'tailwindcss');
    
    if (existsSync(localTailwind)) {
      logger.success('✅ Using local Tailwind CSS installation');
      
      const process = Bun.spawn([
        localTailwind,
        '-i', inputPath,
        '-o', outputPath,
        '--watch'
      ], {
        cwd: projectPath,
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      return process;
    } else {
      // Try global installation
      logger.info('💠 Tailwind CSS not found locally, trying global installation...');
      
      try {
        const process = Bun.spawn([
          'tailwindcss',
          '-i', inputPath,
          '-o', outputPath,
          '--watch'
        ], {
          cwd: projectPath,
          stdout: 'pipe',
          stderr: 'pipe'
        });
        
        logger.success('✅ Using global Tailwind CSS installation');
        return process;
      } catch (globalError) {
        logger.warn('⚠️ Tailwind CSS not found globally either');
        logger.info('💠 You can install it with: npm install -D tailwindcss');
        return null;
      }
    }
  } catch (error) {
    logger.error(`❌ Failed to start Tailwind CSS: ${error instanceof Error ? error.message : String(error)}`);
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
