/**
 * 0x1 Framework dev command - OPTIMIZED WITH UNIFIED ORCHESTRATION
 * Starts the development server with hot reload and beautiful logging
 * Uses unified orchestration for consistency with build system
 */

import type { Server } from 'bun';
import { existsSync } from "node:fs";
import { join } from "node:path";

// Import shared orchestrator
import { DevOrchestrator, type DevOrchestratorOptions } from '../../shared/orchestrators/DevOrchestrator';

// Utility imports
import { logger } from "../utils/logger";

/**
 * Options for the dev command
 */
export interface DevOptions {
  port?: number;
  host?: string;
  open?: boolean;
  silent?: boolean;
  https?: boolean;
  cert?: string;
  key?: string;
}

/**
 * Main dev server function with unified orchestration
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

    // Create and configure the dev orchestrator
    const orchestratorOptions: DevOrchestratorOptions = {
      projectPath,
      port: options.port || 3000,
      host: options.host || 'localhost',
      open: options.open ?? true,
      silent: options.silent ?? false,
      https: options.https ?? false,
      cert: options.cert,
      key: options.key
    };

    const orchestrator = new DevOrchestrator(orchestratorOptions);
    
    // Start the optimized development server
    const server = await orchestrator.start();

    if (!options.silent) {
      logger.spacer();
      logger.success("🚀 Development server started successfully!");
      logger.spacer();
    }

    return server;
    
  } catch (error) {
    logger.error(`❌ Failed to start development server: ${error}`);
    process.exit(1);
  }
}

// Legacy export compatibility
export default dev;
