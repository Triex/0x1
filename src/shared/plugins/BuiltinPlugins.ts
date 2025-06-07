/**
 * 0x1 Framework - Built-in Plugins
 * Essential plugins that work in both dev and build modes
 * Following modern bundler patterns with intelligent processing
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '../../cli/utils/logger';
import { type PluginContext, type PluginHookResult, type UnifiedPlugin } from './PluginSystem';

/**
 * TypeScript Plugin - Handles .ts and .tsx files
 */
export const TypeScriptPlugin: UnifiedPlugin = {
  name: 'typescript',
  version: '1.0.0',
  supportedModes: ['development', 'production'],
  supportedExtensions: ['.ts', '.tsx'],
  priority: 100, // High priority

  async beforeTranspile(context: PluginContext): Promise<PluginHookResult> {
    if (!context.content) return {};

    try {
      // Use Bun's built-in TypeScript transpiler
      const transpiler = new Bun.Transpiler({
        loader: context.file?.endsWith('.tsx') ? 'tsx' : 'ts'
      });

      const transpiledCode = await transpiler.transform(context.content);

      return {
        content: transpiledCode,
        metadata: {
          typescript: true,
          originalExtension: context.file?.split('.').pop()
        }
      };

    } catch (error) {
      return {
        errors: [`TypeScript plugin error: ${error}`],
        shouldContinue: false
      };
    }
  }
};

/**
 * Tailwind CSS Plugin - Processes CSS with Tailwind directives
 */
export const TailwindPlugin: UnifiedPlugin = {
  name: 'tailwind-css',
  version: '1.0.0',
  supportedModes: ['development', 'production'],
  supportedExtensions: ['.css'],
  priority: 90,

  async beforeTranspile(context: PluginContext): Promise<PluginHookResult> {
    if (!context.content || !context.file?.endsWith('.css')) {
      return {};
    }

    // Check if this CSS file contains Tailwind directives
    const hasTailwindDirectives = /(@tailwind|@apply|@layer)/.test(context.content);
    if (!hasTailwindDirectives) {
      return {}; // Not a Tailwind file, skip processing
    }

    try {
      // Check for Tailwind config
      const configFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs'];
      const configPath = configFiles
        .map(file => join(context.projectPath, file))
        .find(path => existsSync(path));

      if (!configPath) {
        return {
          warnings: ['Tailwind directives found but no config file detected'],
          content: context.content
        };
      }

      // For now, return the CSS as-is with a marker
      // In a real implementation, you'd use PostCSS with Tailwind
      const processedCss = `/* Processed by 0x1 Tailwind Plugin */\n${context.content}`;

      return {
        content: processedCss,
        dependencies: [configPath],
        metadata: {
          tailwind: true,
          configPath
        }
      };

    } catch (error) {
      return {
        errors: [`Tailwind plugin error: ${error}`],
        content: context.content
      };
    }
  }
};

/**
 * JSX Plugin - Handles JSX transformation for .jsx files
 */
export const JSXPlugin: UnifiedPlugin = {
  name: 'jsx',
  version: '1.0.0',
  supportedModes: ['development', 'production'],
  supportedExtensions: ['.jsx'],
  priority: 95,

  async beforeTranspile(context: PluginContext): Promise<PluginHookResult> {
    if (!context.content) return {};

    try {
      // Use Bun's built-in JSX transpiler
      const transpiler = new Bun.Transpiler({
        loader: 'jsx'
      });

      const transpiledCode = await transpiler.transform(context.content);

      return {
        content: transpiledCode,
        dependencies: ['0x1/jsx-runtime'],
        metadata: {
          jsx: true,
          runtime: 'automatic'
        }
      };

    } catch (error) {
      return {
        errors: [`JSX plugin error: ${error}`],
        shouldContinue: false
      };
    }
  }
};

/**
 * Import Resolver Plugin - Resolves bare imports and framework imports
 */
export const ImportResolverPlugin: UnifiedPlugin = {
  name: 'import-resolver',
  version: '1.0.0',
  supportedModes: ['development', 'production'],
  supportedExtensions: ['.js', '.jsx', '.ts', '.tsx'],
  priority: 50, // Lower priority, runs after transpilation

  async afterTranspile(result: PluginHookResult, context: PluginContext): Promise<PluginHookResult> {
    if (!result.content) return result;

    try {
      let processedContent = result.content;
      const resolvedDependencies: string[] = [...(result.dependencies || [])];

      // Transform bare imports to relative imports for browser compatibility
      processedContent = processedContent.replace(
        /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g,
        (match, importPath) => {
          // Handle framework imports
          if (importPath === '0x1' || importPath.startsWith('0x1/')) {
            if (context.mode === 'development') {
              return match.replace(importPath, `/node_modules/${importPath}`);
            } else {
              return match.replace('0x1/', '/0x1/');
            }
          }

          // Handle relative imports (leave as-is)
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            return match;
          }

          // Handle absolute imports
          if (importPath.startsWith('/')) {
            return match;
          }

          // Handle node_modules imports
          if (!importPath.includes('/')) {
            resolvedDependencies.push(importPath);
            if (context.mode === 'development') {
              return match.replace(importPath, `/node_modules/${importPath}`);
            }
          }

          return match;
        }
      );

      return {
        ...result,
        content: processedContent,
        dependencies: resolvedDependencies,
        metadata: {
          ...result.metadata,
          importsResolved: true
        }
      };

    } catch (error) {
      return {
        ...result,
        errors: [...(result.errors || []), `Import resolver error: ${error}`]
      };
    }
  }
};

/**
 * Asset Resolver Plugin - Handles asset imports and references
 */
export const AssetResolverPlugin: UnifiedPlugin = {
  name: 'asset-resolver',
  version: '1.0.0',
  supportedModes: ['development', 'production'],
  supportedExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
  priority: 40,

  async afterTranspile(result: PluginHookResult, context: PluginContext): Promise<PluginHookResult> {
    if (!result.content) return result;

    try {
      let processedContent = result.content;
      const assetDependencies: string[] = [];

      // Find asset imports (images, fonts, etc.)
      const assetPattern = /(['"`])([^'"`]+\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico))\1/g;
      
      processedContent = processedContent.replace(assetPattern, (match, quote, assetPath) => {
        assetDependencies.push(assetPath);
        
        // In development, serve from public directory
        if (context.mode === 'development') {
          if (!assetPath.startsWith('/')) {
            return `${quote}/${assetPath}${quote}`;
          }
        }
        
        return match;
      });

      return {
        ...result,
        content: processedContent,
        dependencies: [...(result.dependencies || []), ...assetDependencies],
        metadata: {
          ...result.metadata,
          assetsResolved: true,
          assetCount: assetDependencies.length
        }
      };

    } catch (error) {
      return {
        ...result,
        errors: [...(result.errors || []), `Asset resolver error: ${error}`]
      };
    }
  }
};

/**
 * Minification Plugin - Basic minification for production
 */
export const MinificationPlugin: UnifiedPlugin = {
  name: 'minification',
  version: '1.0.0',
  supportedModes: ['production'], // Only run in production
  supportedExtensions: ['.js', '.jsx', '.ts', '.tsx'],
  priority: 10, // Very low priority, runs last

  async afterTranspile(result: PluginHookResult, context: PluginContext): Promise<PluginHookResult> {
    if (!result.content || context.mode !== 'production') return result;

    try {
      // Basic minification (remove comments and extra whitespace)
      const minifiedCode = result.content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
        .trim();

      return {
        ...result,
        content: minifiedCode,
        metadata: {
          ...result.metadata,
          minified: true,
          originalSize: result.content.length,
          minifiedSize: minifiedCode.length,
          compressionRatio: ((result.content.length - minifiedCode.length) / result.content.length * 100).toFixed(1)
        }
      };

    } catch (error) {
      return {
        ...result,
        warnings: [...(result.warnings || []), `Minification failed: ${error}`]
      };
    }
  }
};

/**
 * Development HMR Plugin - Adds hot module reload capabilities
 */
export const HMRPlugin: UnifiedPlugin = {
  name: 'hmr',
  version: '1.0.0',
  supportedModes: ['development'], // Only run in development
  supportedExtensions: ['.js', '.jsx', '.ts', '.tsx'],
  priority: 5, // Very low priority

  async afterTranspile(result: PluginHookResult, context: PluginContext): Promise<PluginHookResult> {
    if (!result.content || context.mode !== 'development') return result;

    // Add HMR runtime code for development
    const hmrCode = `
// 0x1 HMR Runtime
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;

    return {
      ...result,
      content: result.content + hmrCode,
      metadata: {
        ...result.metadata,
        hmr: true
      }
    };
  }
};

/**
 * Get all built-in plugins
 */
export function getBuiltinPlugins(): UnifiedPlugin[] {
  return [
    TypeScriptPlugin,
    JSXPlugin,
    TailwindPlugin,
    ImportResolverPlugin,
    AssetResolverPlugin,
    MinificationPlugin,
    HMRPlugin
  ];
}

/**
 * Register all built-in plugins with a plugin system
 */
export function registerBuiltinPlugins(pluginSystem: any): void {
  const plugins = getBuiltinPlugins();
  
  for (const plugin of plugins) {
    pluginSystem.register(plugin);
  }
  
  logger.info(`[BuiltinPlugins] Registered ${plugins.length} built-in plugins`);
} 