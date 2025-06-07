/**
 * 0x1 Framework - Unified Plugin System
 * Extensible plugin architecture that works in both dev and build modes
 * Follows modern bundler patterns (Vite/Webpack/Next.js style)
 */

import { logger } from '../../cli/utils/logger';

export interface PluginContext {
  mode: 'development' | 'production';
  projectPath: string;
  file?: string;
  content?: string;
  outputPath?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface PluginHookResult {
  content?: string;
  dependencies?: string[];
  metadata?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
  shouldContinue?: boolean;
}

// Hook function types
export type PluginHookFunction = 
  | ((context: PluginContext) => Promise<PluginHookResult | void>)
  | ((result: PluginHookResult, context: PluginContext) => Promise<PluginHookResult>)
  | ((context: PluginContext) => Promise<void>)
  | ((error: Error, context: PluginContext) => Promise<PluginHookResult | void>);

export interface UnifiedPlugin {
  name: string;
  version: string;
  
  // Plugin capabilities
  supportedModes: Array<'development' | 'production'>;
  supportedExtensions?: string[];
  priority?: number; // Higher = runs first
  
  // Lifecycle hooks (all optional)
  beforeStart?(context: PluginContext): Promise<PluginHookResult | void>;
  beforeDiscovery?(context: PluginContext): Promise<PluginHookResult | void>;
  beforeTranspile?(context: PluginContext): Promise<PluginHookResult | void>;
  afterTranspile?(result: PluginHookResult, context: PluginContext): Promise<PluginHookResult>;
  beforeBundle?(context: PluginContext): Promise<PluginHookResult | void>;
  afterBundle?(result: PluginHookResult, context: PluginContext): Promise<PluginHookResult>;
  beforeFinalize?(context: PluginContext): Promise<PluginHookResult | void>;
  afterComplete?(context: PluginContext): Promise<void>;
  
  // Error handling
  onError?(error: Error, context: PluginContext): Promise<PluginHookResult | void>;
}

export interface PluginSystemOptions {
  mode: 'development' | 'production';
  projectPath: string;
  debug?: boolean;
  maxConcurrentPlugins?: number;
}

export class PluginSystem {
  private plugins: Map<string, UnifiedPlugin> = new Map();
  private options: PluginSystemOptions;
  private hookStats: Map<string, { executions: number; totalTime: number }> = new Map();

  constructor(options: PluginSystemOptions) {
    this.options = {
      maxConcurrentPlugins: 10,
      debug: false,
      ...options
    };
  }

  /**
   * Register a plugin
   */
  register(plugin: UnifiedPlugin): void {
    // Validate plugin
    if (!plugin.name || !plugin.version) {
      throw new Error('Plugin must have name and version');
    }

    if (!plugin.supportedModes.includes(this.options.mode)) {
      if (this.options.debug) {
        logger.info(`[PluginSystem] Skipping plugin ${plugin.name} - doesn't support ${this.options.mode} mode`);
      }
      return;
    }

    // Check for conflicts
    if (this.plugins.has(plugin.name)) {
      const existing = this.plugins.get(plugin.name)!;
      logger.warn(`[PluginSystem] Plugin ${plugin.name} already registered (existing: ${existing.version}, new: ${plugin.version})`);
    }

    this.plugins.set(plugin.name, plugin);

    if (this.options.debug) {
      logger.info(`[PluginSystem] Registered plugin: ${plugin.name}@${plugin.version}`);
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): void {
    if (this.plugins.delete(pluginName)) {
      if (this.options.debug) {
        logger.info(`[PluginSystem] Unregistered plugin: ${pluginName}`);
      }
    }
  }

  /**
   * Get all registered plugins sorted by priority
   */
  getPlugins(): UnifiedPlugin[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Execute a hook across all relevant plugins
   */
  async executeHook<T extends keyof UnifiedPlugin>(
    hookName: T,
    context: PluginContext,
    result?: PluginHookResult
  ): Promise<PluginHookResult> {
    const startTime = Date.now();
    let aggregatedResult: PluginHookResult = result || {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get plugins that support this file type and hook
    const relevantPlugins = this.getRelevantPlugins(hookName, context);

    if (relevantPlugins.length === 0) {
      return aggregatedResult;
    }

    if (this.options.debug) {
      logger.debug(`[PluginSystem] Executing ${String(hookName)} with ${relevantPlugins.length} plugins`);
    }

    // Execute plugins in priority order
    for (const plugin of relevantPlugins) {
      try {
        const hook = plugin[hookName] as PluginHookFunction;
        if (!hook) continue;

        const pluginStartTime = Date.now();
        
        // Execute the hook
        const pluginResult = await this.executePluginHook(
          plugin,
          hook,
          { ...context, content: aggregatedResult.content || context.content },
          aggregatedResult
        );

        // Merge results
        if (pluginResult) {
          aggregatedResult = this.mergeResults(aggregatedResult, pluginResult);
          
          // Collect errors and warnings
          if (pluginResult.errors) errors.push(...pluginResult.errors);
          if (pluginResult.warnings) warnings.push(...pluginResult.warnings);

          // Check if plugin wants to stop the chain
          if (pluginResult.shouldContinue === false) {
            if (this.options.debug) {
              logger.debug(`[PluginSystem] Plugin ${plugin.name} stopped execution chain`);
            }
            break;
          }
        }

        // Record timing
        const pluginTime = Date.now() - pluginStartTime;
        this.recordHookStats(`${plugin.name}.${String(hookName)}`, pluginTime);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Plugin ${plugin.name}: ${errorMessage}`);
        
        logger.error(`[PluginSystem] Plugin ${plugin.name} failed in ${String(hookName)}: ${errorMessage}`);

        // Try to handle error via plugin's onError hook
        try {
          if (plugin.onError) {
            await plugin.onError(error as Error, context);
          }
        } catch (onErrorError) {
          logger.error(`[PluginSystem] Plugin ${plugin.name} onError handler also failed: ${onErrorError}`);
        }
      }
    }

    // Add collected errors and warnings
    if (errors.length > 0) {
      aggregatedResult.errors = [...(aggregatedResult.errors || []), ...errors];
    }
    if (warnings.length > 0) {
      aggregatedResult.warnings = [...(aggregatedResult.warnings || []), ...warnings];
    }

    // Record total hook timing
    const totalTime = Date.now() - startTime;
    this.recordHookStats(String(hookName), totalTime);

    if (this.options.debug) {
      logger.debug(`[PluginSystem] Completed ${String(hookName)} in ${totalTime}ms`);
    }

    return aggregatedResult;
  }

  /**
   * Execute a single plugin hook with error handling
   */
  private async executePluginHook(
    plugin: UnifiedPlugin,
    hook: PluginHookFunction,
    context: PluginContext,
    currentResult: PluginHookResult
  ): Promise<PluginHookResult | void> {
    // Hooks that receive previous result
    const resultHooks = ['afterTranspile', 'afterBundle'];
    const hookName = hook.name;

    if (resultHooks.some(name => hookName.includes(name))) {
      return await (hook as (result: PluginHookResult, context: PluginContext) => Promise<PluginHookResult>)(currentResult, context);
    } else {
      return await (hook as (context: PluginContext) => Promise<PluginHookResult | void>)(context);
    }
  }

  /**
   * Get plugins relevant to a specific hook and context
   */
  private getRelevantPlugins<T extends keyof UnifiedPlugin>(
    hookName: T,
    context: PluginContext
  ): UnifiedPlugin[] {
    return this.getPlugins().filter(plugin => {
      // Check if plugin has this hook
      if (!plugin[hookName]) return false;

      // Check mode compatibility
      if (!plugin.supportedModes.includes(context.mode)) return false;

      // Check file extension compatibility
      if (plugin.supportedExtensions && context.file) {
        const fileExt = context.file.split('.').pop();
        if (fileExt && !plugin.supportedExtensions.includes(`.${fileExt}`)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Merge plugin results intelligently
   */
  private mergeResults(current: PluginHookResult, incoming: PluginHookResult): PluginHookResult {
    return {
      content: incoming.content || current.content,
      dependencies: [
        ...(current.dependencies || []),
        ...(incoming.dependencies || [])
      ],
      metadata: {
        ...(current.metadata || {}),
        ...(incoming.metadata || {})
      },
      errors: [
        ...(current.errors || []),
        ...(incoming.errors || [])
      ],
      warnings: [
        ...(current.warnings || []),
        ...(incoming.warnings || [])
      ],
      shouldContinue: incoming.shouldContinue ?? current.shouldContinue
    };
  }

  /**
   * Record hook execution statistics
   */
  private recordHookStats(hookName: string, executionTime: number): void {
    const existing = this.hookStats.get(hookName) || { executions: 0, totalTime: 0 };
    existing.executions++;
    existing.totalTime += executionTime;
    this.hookStats.set(hookName, existing);
  }

  /**
   * Get plugin execution statistics
   */
  getStats(): Record<string, { executions: number; totalTime: number; avgTime: number }> {
    const stats: Record<string, { executions: number; totalTime: number; avgTime: number }> = {};
    
    for (const [hookName, data] of this.hookStats) {
      stats[hookName] = {
        executions: data.executions,
        totalTime: data.totalTime,
        avgTime: data.totalTime / data.executions
      };
    }
    
    return stats;
  }

  /**
   * Clear statistics
   */
  clearStats(): void {
    this.hookStats.clear();
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): UnifiedPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin count
   */
  getPluginCount(): number {
    return this.plugins.size;
  }

  /**
   * Dispose plugin system and cleanup
   */
  async dispose(): Promise<void> {
    // Execute cleanup hooks for all plugins
    const context: PluginContext = {
      mode: this.options.mode,
      projectPath: this.options.projectPath
    };

    for (const plugin of this.plugins.values()) {
      try {
        if (plugin.afterComplete) {
          await plugin.afterComplete(context);
        }
      } catch (error) {
        if (this.options.debug) {
          logger.error(`[PluginSystem] Plugin ${plugin.name} cleanup failed: ${error}`);
        }
      }
    }

    this.plugins.clear();
    this.hookStats.clear();

    if (this.options.debug) {
      logger.info('[PluginSystem] Disposed');
    }
  }
} 