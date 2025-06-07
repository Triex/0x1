/**
 * 0x1 Framework Build Script - OPTIMIZED WITH UNIFIED ORCHESTRATION
 * Builds the 0x1 framework using the unified build system
 * Aligned with build.ts for consistency and performance
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../src/cli/utils/logger.js';

// Import the unified build orchestrator
import { BuildOrchestrator, type BuildOrchestratorOptions } from '../src/shared/orchestrators/BuildOrchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frameworkRoot = join(__dirname, '..');

async function buildFramework() {
  const startTime = Date.now();
  
  logger.section("0X1 FRAMEWORK BUILD");
  logger.spacer();
  logger.info('🚀 Building 0x1 framework with unified orchestration...');

  try {
    // Create orchestrator options for framework build
    const orchestratorOptions: BuildOrchestratorOptions = {
      projectPath: frameworkRoot,
      outDir: 'dist',
      minify: true,
      watch: false,
      silent: false,
      ignore: ['scripts/', 'test/', '*.test.*', '*.spec.*']
    };

    const orchestrator = new BuildOrchestrator(orchestratorOptions);
    
    // Execute the framework build
    const result = await orchestrator.build();

    if (result.success) {
      const totalTime = Date.now() - startTime;
      
      logger.spacer();
      logger.success(`✅ 0x1 Framework built successfully!`);
      logger.info(`⚡ Build time: ${totalTime}ms`);
      logger.info(`📁 Output: ${result.outputPath}`);
      logger.info(`📊 Framework stats: ${result.routes} routes, ${result.components} components`);
      
      // Additional framework-specific logging
      logger.spacer();
      logger.box(
        `🎯 0x1 Framework Build Complete
        
Build Time:       ${totalTime}ms
Output Directory: ${result.outputPath}
Components:       ${result.components}
Framework Ready:  ✅

Next: npm publish or use locally`
      );
      logger.spacer();
      
    } else {
      logger.error(`❌ Framework build failed: ${result.errors.join(', ')}`);
      
      if (result.warnings.length > 0) {
        logger.warn(`⚠️  Warnings: ${result.warnings.join(', ')}`);
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ Framework build failed after ${totalTime}ms: ${error}`);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  buildFramework();
}

export { buildFramework };
