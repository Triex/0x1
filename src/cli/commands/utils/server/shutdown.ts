/**
 * Graceful shutdown utilities for development server
 */
import { logger } from "../../../utils/logger";


/**
 * Set up graceful shutdown handlers
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
        logger.error(`Error during shutdown: ${error}`);
        process.exit(1);
      }
    });
  }
}
