/**
 * 0x1 Framework - Graceful Shutdown Utilities
 * Provides functions for handling graceful shutdown of servers and processes
 */
import type { Subprocess } from 'bun';
import { logger } from "./logger";

/**
 * Set up graceful shutdown handlers
 * @param cleanup Function to run during shutdown
 */
export async function shutdownServer(
  cleanup: () => Promise<void> | void
): Promise<void> {
  const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`\n💠 Received ${signal}, shutting down gracefully...`);

      try {
        await cleanup();
        process.exit(0);
      } catch (error) {
        logger.error(`Error during shutdown: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  }
}

/**
 * Cleanup utility to ensure all subprocesses are terminated
 * @param processes List of subprocesses to terminate
 */
export async function cleanupProcesses(processes: Array<Subprocess | null>): Promise<void> {
  for (const process of processes) {
    if (process && !process.killed) {
      try {
        process.kill();
        logger.debug(`Killed subprocess with PID ${process.pid}`);
      } catch (error) {
        logger.error(`Failed to kill subprocess: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

/**
 * Cleanup utility to ensure all temporary files are removed
 * @param directories List of directories to clean
 */
export async function cleanupTempDirectories(directories: string[]): Promise<void> {
  for (const dir of directories) {
    try {
      // Use Bun's native capabilities for efficient file operations
      await Bun.$`rm -rf ${dir}`;
      logger.debug(`Cleaned up temporary directory: ${dir}`);
    } catch (error) {
      logger.error(`Failed to clean temporary directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
