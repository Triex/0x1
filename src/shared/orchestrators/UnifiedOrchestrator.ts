/**
 * 0x1 Framework - Unified Orchestrator Architecture
 * Demonstrates proper integration of shared engines to eliminate code duplication
 * SINGLE SOURCE OF TRUTH implementation
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Import shared engines - SINGLE SOURCE OF TRUTH
import { getConfigurationManager } from '../core/ConfigurationManager';
import { ImportTransformer } from '../core/ImportTransformer';
import { transpilationEngine, type TranspileInput } from '../core/TranspilationEngine';
import { PluginSystem, type PluginContext, type UnifiedPlugin } from '../plugins/PluginSystem';

import { logger } from '../../cli/utils/logger';

export interface UnifiedOrchestratorOptions {
  mode: 'development' | 'production';
  projectPath: string;
  debug?: boolean;
  plugins?: UnifiedPlugin[];
}

/**
 * Example of how to properly integrate shared engines
 * This eliminates the code duplication in DevOrchestrator and BuildOrchestrator
 */
export class UnifiedOrchestrator {
  private pluginSystem: PluginSystem;
  private options: UnifiedOrchestratorOptions;
  private componentCache = new Map<string, { content: string; mtime: number }>();

  constructor(options: UnifiedOrchestratorOptions) {
    this.options = options;
    
    // SINGLE SOURCE OF TRUTH: Initialize shared engines
    transpilationEngine.configure(options.mode);
    
    this.pluginSystem = new PluginSystem({
      mode: options.mode,
      projectPath: options.projectPath,
      debug: options.debug || false
    });

    // Register any provided plugins
    if (options.plugins) {
      for (const plugin of options.plugins) {
        this.pluginSystem.register(plugin);
      }
    }
  }

  /**
   * UNIFIED: Handle component transpilation for both dev and build
   * This is what DevOrchestrator.handleComponentRequest should look like
   */
  async handleComponentTranspilation(sourcePath: string, reqPath?: string): Promise<string> {
    // Plugin hook: beforeTranspile - move context outside try block for catch access
    const pluginContext: PluginContext = {
      mode: this.options.mode,
      projectPath: this.options.projectPath,
      file: sourcePath,
      metadata: { requestPath: reqPath }
    };

    try {
      await this.pluginSystem.executeHook('beforeTranspile', pluginContext);

      // Check cache first (same logic for both dev and build)
      const cached = this.componentCache.get(sourcePath);
      if (cached && await this.isFileUnchanged(sourcePath, cached.mtime)) {
        if (this.options.debug) {
          logger.debug(`[UnifiedOrchestrator] Cache hit: ${sourcePath}`);
        }
        return cached.content;
      }

      // Read source file
      const sourceContent = readFileSync(sourcePath, 'utf-8');

      // SINGLE SOURCE OF TRUTH: Use shared TranspilationEngine
      const transpileInput: TranspileInput = {
        sourceCode: sourceContent,
        sourcePath,
        options: {
          mode: this.options.mode,
          sourcePath,
          projectPath: this.options.projectPath,
          debug: this.options.debug || false,
          sourceMaps: this.options.mode === 'development' ? 'inline' : false,
          target: 'browser',
          jsxRuntime: 'automatic'
        }
      };

      const transpileResult = await transpilationEngine.transpile(transpileInput);

      if (transpileResult.errors.length > 0) {
        const errorMessage = transpileResult.errors.map(e => e.message).join(', ');
        logger.error(`[UnifiedOrchestrator] Transpilation errors: ${errorMessage}`);
        
        // Plugin hook: onError - fix pluginContext scope
        for (const error of transpileResult.errors) {
          await this.pluginSystem.executeHook('onError', pluginContext);
        }
        
        throw new Error(errorMessage);
      }

      // Plugin hook: afterTranspile
      const afterTranspileResult = await this.pluginSystem.executeHook('afterTranspile', pluginContext, {
        content: transpileResult.code,
        metadata: transpileResult.metadata
      });

      const finalContent = afterTranspileResult.content || transpileResult.code;

      // Cache the result
      const stats = statSync(sourcePath);
      this.componentCache.set(sourcePath, {
        content: finalContent,
        mtime: stats.mtimeMs
      });

      if (this.options.debug) {
        logger.debug(`[UnifiedOrchestrator] Transpilation successful: ${sourcePath} (${finalContent.length} bytes, ${transpileResult.metadata.processingTime.toFixed(1)}ms)`);
      }

      return finalContent;

    } catch (error) {
      logger.error(`[UnifiedOrchestrator] Component transpilation failed: ${error}`);
      
      // Plugin hook: onError
      await this.pluginSystem.executeHook('onError', pluginContext);
      
      throw error;
    }
  }

  /**
   * UNIFIED: Bundle discovery with plugin hooks
   * This replaces duplicate discovery logic in both orchestrators
   */
  async discoverComponents(): Promise<string[]> {
    const pluginContext: PluginContext = {
      mode: this.options.mode,
      projectPath: this.options.projectPath
    };

    // Plugin hook: beforeDiscovery
    await this.pluginSystem.executeHook('beforeDiscovery', pluginContext);

    // Use shared logic for component discovery
    const components = await this.findSourceFiles();

    // Plugin hook: afterDiscovery (custom hook)
    const discoveryResult = await this.pluginSystem.executeHook('beforeBundle', pluginContext, {
      dependencies: components,
      metadata: { discoveredComponents: components.length }
    });

    return discoveryResult.dependencies || components;
  }

  /**
   * UNIFIED: Source file discovery
   * Eliminates duplication between DevOrchestrator.findSourceFiles and BuildOrchestrator
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    const scanDirectorySync = (dir: string, maxDepth: number = 3, currentDepth: number = 0) => {
      if (!existsSync(dir) || currentDepth > maxDepth) return;
      
      try {
        const items = readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'dist') continue;
          
          const fullPath = join(dir, item.name);
          
          if (item.isDirectory()) {
            scanDirectorySync(fullPath, maxDepth, currentDepth + 1);
          } else if (extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Silent fail for individual directories
      }
    };

    // Scan essential directories
    const essentialDirs = ['app', 'src', 'components', 'lib'];
    for (const dir of essentialDirs) {
      const fullDir = join(this.options.projectPath, dir);
      scanDirectorySync(fullDir, 2);
    }

    return files;
  }

  /**
   * UNIFIED: File change detection
   * Shared between dev cache and build cache
   */
  private async isFileUnchanged(filePath: string, cachedMtime: number): Promise<boolean> {
    try {
      const stats = statSync(filePath);
      return stats.mtimeMs === cachedMtime;
    } catch {
      return false;
    }
  }

  /**
   * UNIFIED: Error component generation
   * Consistent error handling for both dev and build
   */
  generateErrorComponent(filePath: string, errorMessage: string): string {
    const safePath = filePath.replace(/'/g, "\\'");
    const safeError = errorMessage.replace(/'/g, "\\'");
    
    return `
// Unified error component for failed transpilation: ${safePath}
export default function ErrorComponent(props) {
  return {
    type: 'div',
    props: {
      className: 'p-6 bg-red-50 border border-red-200 rounded-lg m-4',
      style: 'color: #dc2626;'
    },
    children: [
      {
        type: 'h3',
        props: { className: 'font-bold mb-2' },
        children: ['Transpilation Error (${this.options.mode})'],
        key: null
      },
      {
        type: 'p',
        props: { className: 'mb-2' },
        children: ['File: ${safePath}'],
        key: null
      },
      {
        type: 'p',
        props: { className: 'text-sm' },
        children: ['Error: ${safeError}'],
        key: null
      }
    ],
    key: null
  };
}
`;
  }

  /**
   * UNIFIED: Import transformation
   * Uses shared ImportTransformer consistently
   */
  async transformImports(content: string, sourcePath: string): Promise<string> {
    // SINGLE SOURCE OF TRUTH: Use shared ImportTransformer
    return ImportTransformer.transformImports(content, {
      sourceFilePath: sourcePath,
      projectPath: this.options.projectPath,
      mode: this.options.mode,
      debug: this.options.debug || false
    });
  }

  /**
   * UNIFIED: CSS processing
   * Eliminates duplication between dev and build CSS handling
   */
  async processCss(): Promise<string> {
    const configManager = getConfigurationManager(this.options.projectPath);
    const cssConfig = await configManager.getCSSConfig();
    
    if (!this.options.debug) {
      logger.info(`🎨 CSS Processor: ${cssConfig.processor} (${this.options.mode} mode)`);
    }

    // Plugin hook: beforeBundle (for CSS processing)
    const pluginContext: PluginContext = {
      mode: this.options.mode,
      projectPath: this.options.projectPath,
      metadata: { cssProcessor: cssConfig.processor }
    };

    const beforeResult = await this.pluginSystem.executeHook('beforeBundle', pluginContext);

    // Shared CSS processing logic would go here
    // This eliminates duplication between DevOrchestrator.handleCssRequest and BuildOrchestrator.processCssUsingWorkingPattern

    return "/* Unified CSS processing */";
  }

  /**
   * UNIFIED: Cleanup
   * Consistent cleanup for both dev and build
   */
  async cleanup(): Promise<void> {
    const pluginContext: PluginContext = {
      mode: this.options.mode,
      projectPath: this.options.projectPath
    };

    // Plugin hook: afterComplete
    await this.pluginSystem.executeHook('afterComplete', pluginContext);

    // Dispose plugin system
    await this.pluginSystem.dispose();

    // Clear caches
    this.componentCache.clear();
    transpilationEngine.clearCache();

    if (this.options.debug) {
      logger.success('[UnifiedOrchestrator] Cleanup completed');
    }
  }

  /**
   * Get plugin system stats for debugging
   */
  getStats(): { 
    pluginCount: number; 
    cacheSize: number; 
    pluginStats: Record<string, any>;
    transpilationStats: Record<string, any>;
  } {
    return {
      pluginCount: this.pluginSystem.getPluginCount(),
      cacheSize: this.componentCache.size,
      pluginStats: this.pluginSystem.getStats(),
      transpilationStats: transpilationEngine.getCacheStats()
    };
  }
}

/**
 * Example plugin that demonstrates the unified architecture
 */
export const ExampleTailwindPlugin: UnifiedPlugin = {
  name: 'tailwind-integration',
  version: '1.0.0',
  supportedModes: ['development', 'production'],
  priority: 10,

  async beforeTranspile(context: PluginContext) {
    if (context.file?.endsWith('.css')) {
      return {
        metadata: { processedBy: 'tailwind-integration' }
      };
    }
  },

  async afterTranspile(result, context) {
    if (context.mode === 'production' && result.content) {
      // Add production optimizations
      result.content = result.content.replace(/console\.log\([^)]*\);?\s*/g, '');
    }
    return result;
  },

  async onError(error, context) {
    logger.warn(`[TailwindPlugin] Error in ${context.file}: ${error.message}`);
  }
};

/**
 * Example usage showing how DevOrchestrator and BuildOrchestrator should be refactored
 */
export async function exampleUsage() {
  const orchestrator = new UnifiedOrchestrator({
    mode: 'development',
    projectPath: process.cwd(),
    debug: true,
    plugins: [ExampleTailwindPlugin]
  });

  // This replaces DevOrchestrator.handleComponentRequest
  const componentCode = await orchestrator.handleComponentTranspilation(
    '/path/to/component.tsx',
    '/components/MyComponent.js'
  );

  // This replaces duplicate discovery logic
  const components = await orchestrator.discoverComponents();

  // Show unified stats
  const stats = orchestrator.getStats();
  logger.info(`Unified stats: ${stats.pluginCount} plugins, ${stats.cacheSize} cached components`);

  // Cleanup
  await orchestrator.cleanup();
} 