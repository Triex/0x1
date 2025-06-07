/**
 * 0x1 CLI - Build Command - OPTIMIZED WITH UNIFIED ORCHESTRATION
 * Ultra-fast builds using shared core utilities and intelligent orchestration
 * Target: <50ms build times with zero code duplication
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '../utils/logger';

// Import the new unified orchestrator
import { BuildOrchestrator, type BuildOrchestratorOptions, type BuildResult } from '../../shared/orchestrators/BuildOrchestrator';

export interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  watch?: boolean;
  silent?: boolean;
  config?: string;
  ignore?: string[];
}

/**
 * Build the application for production using unified orchestration
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  const startTime = Date.now();
  const projectPath = process.cwd();

  if (!options.silent) {
    logger.section("BUILD OPTIMIZATION");
    logger.spacer();
    logger.info('🚀 Starting optimized build with unified orchestration...');
  }

  // Validate project structure
  const appPath = join(projectPath, "app");
  if (!existsSync(appPath)) {
    logger.error("❌ No 'app' directory found. This doesn't appear to be a 0x1 project.");
    logger.info("💡 Run 'npx 0x1 new my-app' to create a new project.");
    process.exit(1);
  }

  try {
    // Create and configure the build orchestrator
    const orchestratorOptions: BuildOrchestratorOptions = {
      projectPath,
      outDir: options.outDir || 'dist',
      minify: options.minify ?? true,
      watch: options.watch ?? false,
      silent: options.silent ?? false,
      config: options.config,
      ignore: options.ignore || []
    };

    const orchestrator = new BuildOrchestrator(orchestratorOptions);
    
    // Execute the optimized build
    const result: BuildResult = await orchestrator.build();

    if (result.success) {
      const totalTime = Date.now() - startTime;
      
      if (!options.silent) {
        logger.spacer();
        logger.success(`✅ Build completed successfully!`);
        logger.info(`⚡ Total time: ${totalTime}ms (Target: <50ms)`);
        logger.info(`📁 Output: ${result.outputPath}`);
        logger.info(`📊 Stats: ${result.routes} routes, ${result.components} components, ${result.assets} assets`);
        
        // Performance analysis
        if (totalTime < 50) {
          logger.success(`🎯 PERFORMANCE TARGET MET! (${totalTime}ms < 50ms)`);
        } else if (totalTime < 100) {
          logger.warn(`⚠️  Close to target: ${totalTime}ms (target: <50ms)`);
        } else {
          logger.warn(`⚠️  Performance opportunity: ${totalTime}ms (target: <50ms)`);
        }
        
        logger.spacer();
      }
    } else {
      logger.error(`❌ Build failed: ${result.errors.join(', ')}`);
      
      if (result.warnings.length > 0) {
        logger.warn(`⚠️  Warnings: ${result.warnings.join(', ')}`);
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ Build failed after ${totalTime}ms: ${error}`);
    process.exit(1);
  }
}

// Legacy export compatibility
export default build;

// CLI compatibility - export the build function as buildProject
export const buildProject = build; 