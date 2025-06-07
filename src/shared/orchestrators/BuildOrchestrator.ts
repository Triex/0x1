/**
 * 0x1 Framework - Build Orchestrator
 * Unified build system using shared core utilities
 * Replaces monolithic build.ts with clean, maintainable architecture
 * Target: <50ms build times with parallel processing
 */

import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Import shared core utilities
import { importEngine } from '../core/ImportEngine';
import { routeDiscovery, type Route } from '../core/RouteDiscovery';
import { transpilationEngine } from '../core/TranspilationEngine';

import { logger } from '../../cli/utils/logger';

export interface BuildOrchestratorOptions {
  projectPath: string;
  outDir?: string;
  minify?: boolean;
  watch?: boolean;
  silent?: boolean;
  config?: string;
  ignore?: string[];
}

export interface BuildResult {
  success: boolean;
  outputPath: string;
  buildTime: number;
  routes: number;
  components: number;
  assets: number;
  errors: string[];
  warnings: string[];
}

export interface BuildState {
  routes: Route[];
  components: Array<{ path: string; relativePath: string }>;
  assets: Map<string, string>;
  dependencies: {
    packages: string[];
    cssFiles: string[];
  };
}

export class BuildOrchestrator {
  private options: BuildOrchestratorOptions;
  private state: BuildState;
  private startTime: number = 0;

  constructor(options: BuildOrchestratorOptions) {
    this.options = {
      outDir: 'dist',
      minify: true,
      ...options
    };
    
    this.state = {
      routes: [],
      components: [],
      assets: new Map(),
      dependencies: {
        packages: [],
        cssFiles: []
      }
    };

    // Configure shared engines for production
    transpilationEngine.configure('production');
  }

  /**
   * Execute parallel build using shared core utilities
   */
  async build(): Promise<BuildResult> {
    this.startTime = Date.now();
    
    try {
      if (!this.options.silent) {
        logger.info('🚀 Starting optimized build with unified orchestration...');
      }

      // Phase 1: Preparation and cleanup
      await this.prepareOutputDirectory();

      // Phase 2: Parallel discovery using shared core
      await this.discoverEverything();

      // Phase 3: Parallel build execution
      await this.executeParallelBuild();

      // Phase 4: Finalization
      await this.finalizeBuild();

      const buildTime = Date.now() - this.startTime;
      const result = this.createSuccessResult(buildTime);

      if (!this.options.silent) {
        logger.success(`✅ Build completed in ${buildTime}ms`);
        logger.info(`📁 Output: ${result.outputPath}`);
        logger.info(`🛣️ Routes: ${result.routes}, 🧩 Components: ${result.components}, 📦 Assets: ${result.assets}`);
      }

      return result;

    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  /**
   * Prepare output directory
   */
  private async prepareOutputDirectory(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);

    // Clean output directory
    if (existsSync(outputPath)) {
      await Bun.$`rm -rf ${outputPath}`;
    }
    mkdirSync(outputPath, { recursive: true });
  }

  /**
   * Discover all resources using shared core utilities
   */
  private async discoverEverything(): Promise<void> {
    const [routes, components, sourceFiles] = await Promise.all([
      this.discoverRoutes(),
      this.discoverComponents(),
      this.findAllSourceFiles()
    ]);

    this.state.routes = routes;
    this.state.components = components;

    // Discover dependencies using shared ImportEngine
    await importEngine.discoverDependencies(this.options.projectPath, sourceFiles);
    
    this.state.dependencies = {
      packages: importEngine.getDiscoveredPackages(),
      cssFiles: importEngine.getCssDependencies()
    };

    if (!this.options.silent) {
      logger.info(`📊 Discovered: ${routes.length} routes, ${components.length} components, ${this.state.dependencies.packages.length} packages`);
    }
  }

  /**
   * Discover routes using shared RouteDiscovery
   */
  private async discoverRoutes(): Promise<Route[]> {
    return await routeDiscovery.discover(this.options.projectPath, {
      mode: 'production',
      debug: false
    });
  }

  /**
   * Discover all components for compilation
   */
  private async discoverComponents(): Promise<Array<{ path: string; relativePath: string }>> {
    const components: Array<{ path: string; relativePath: string }> = [];
    const componentDirs = ['components', 'lib', 'src/components', 'src/lib'];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];

    const tasks = componentDirs.map(async (dir) => {
      const fullDirPath = join(this.options.projectPath, dir);
      if (!existsSync(fullDirPath)) return;

      const scanRecursive = async (dirPath: string, relativePath: string = ''): Promise<void> => {
        try {
          const items = readdirSync(dirPath, { withFileTypes: true });
          
          const itemTasks = items.map(async (item) => {
            const itemPath = join(dirPath, item.name);
            
            if (item.isDirectory() && !item.name.startsWith('.')) {
              const newRelativePath = relativePath ? join(relativePath, item.name) : item.name;
              await scanRecursive(itemPath, newRelativePath);
            } else if (extensions.some(ext => item.name.endsWith(ext))) {
              const componentFile = relativePath ? join(dir, relativePath, item.name) : join(dir, item.name);
              components.push({
                path: itemPath,
                relativePath: componentFile
              });
            }
          });
          
          await Promise.all(itemTasks);
        } catch (error) {
          // Silent fail for individual directories
        }
      };

      await scanRecursive(fullDirPath);
    });

    await Promise.all(tasks);
    return components;
  }

  /**
   * Find all source files for dependency analysis
   */
  private async findAllSourceFiles(): Promise<string[]> {
    const allFiles = [
      ...this.state.routes.map(route => {
        const possiblePaths = [
          join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx')),
          join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.ts')),
          join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.jsx'))
        ];
        return possiblePaths.find(existsSync) || possiblePaths[0];
      }),
      ...this.state.components.map(comp => comp.path)
    ].filter(existsSync);

    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Execute parallel build phases
   */
  private async executeParallelBuild(): Promise<void> {
    // All build phases in parallel for maximum speed
    await Promise.all([
      this.processComponents(),
      this.processRoutes(),
      this.processAssets(),
      this.processStyles(),
      this.copyFrameworkFiles(),
      this.generateAppBundle()
    ]);
  }

  /**
   * Process all components using shared TranspilationEngine
   */
  private async processComponents(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);
    
    const tasks = this.state.components.map(async (component) => {
      try {
        const sourceCode = readFileSync(component.path, 'utf-8');
        
        // Use shared TranspilationEngine
        const result = await transpilationEngine.transpile({
          sourceCode,
          sourcePath: component.path,
          options: {
            mode: 'production',
            sourcePath: component.path,
            projectPath: this.options.projectPath,
            minify: this.options.minify
          }
        });

        if (result.errors.length > 0) {
          logger.warn(`Component compilation warnings for ${component.path}: ${JSON.stringify(result.errors)}`);
        }

        // Write transpiled component
        const outputComponentPath = join(outputPath, component.relativePath.replace(/\.(tsx|ts|jsx)$/, '.js'));
        await mkdir(dirname(outputComponentPath), { recursive: true });
        await Bun.write(outputComponentPath, result.code);

        return true;
      } catch (error) {
        logger.error(`Failed to process component ${component.path}: ${error}`);
        return false;
      }
    });

    const results = await Promise.all(tasks);
    const successful = results.filter(Boolean).length;
    
    if (!this.options.silent) {
      logger.info(`✅ Processed ${successful}/${this.state.components.length} components`);
    }
  }

  /**
   * Process route components with layout composition
   */
  private async processRoutes(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);
    
    const tasks = this.state.routes.map(async (route) => {
      try {
        const sourcePath = this.findRouteSourceFile(route);
        if (!sourcePath) {
          logger.warn(`Route source not found: ${route.componentPath}`);
          return false;
        }

        let sourceCode = readFileSync(sourcePath, 'utf-8');

        // Handle layout composition if needed
        if (route.layouts && route.layouts.length > 0) {
          sourceCode = await this.composeLayouts(sourceCode, route, sourcePath);
        }

        // Use shared TranspilationEngine
        const result = await transpilationEngine.transpile({
          sourceCode,
          sourcePath,
          options: {
            mode: 'production',
            sourcePath,
            projectPath: this.options.projectPath,
            minify: this.options.minify
          }
        });

        if (result.errors.length > 0) {
          logger.warn(`Route compilation warnings for ${route.path}: ${JSON.stringify(result.errors)}`);
        }

        // Write transpiled route component
        const outputComponentPath = join(outputPath, route.componentPath.replace(/^\//, ''));
        await mkdir(dirname(outputComponentPath), { recursive: true });
        await Bun.write(outputComponentPath, result.code);

        return true;
      } catch (error) {
        logger.error(`Failed to process route ${route.path}: ${error}`);
        return false;
      }
    });

    const results = await Promise.all(tasks);
    const successful = results.filter(Boolean).length;
    
    if (!this.options.silent) {
      logger.info(`✅ Processed ${successful}/${this.state.routes.length} routes`);
    }
  }

  /**
   * Find source file for a route
   */
  private findRouteSourceFile(route: Route): string | null {
    const possiblePaths = [
      join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx')),
      join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.ts')),
      join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.jsx')),
      join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.js'))
    ];

    return possiblePaths.find(path => existsSync(path)) || null;
  }

  /**
   * Compose layouts with route component
   */
  private async composeLayouts(sourceCode: string, route: Route, sourcePath: string): Promise<string> {
    // This is a simplified version - full implementation would be more complex
    // For now, just return the original source code
    // TODO: Implement full layout composition like in the original build.ts
    return sourceCode;
  }

  /**
   * Process and copy static assets
   */
  private async processAssets(): Promise<void> {
    const publicDir = join(this.options.projectPath, 'public');
    const outputPath = join(this.options.projectPath, this.options.outDir!);

    if (!existsSync(publicDir)) return;

    // Copy all assets from public directory
    await Bun.spawn(['cp', '-r', `${publicDir}/.`, outputPath], {
      cwd: this.options.projectPath,
      stdout: 'pipe',
      stderr: 'pipe'
    }).exited;

    if (!this.options.silent) {
      logger.info('✅ Copied static assets');
    }
  }

  /**
   * Process CSS using shared utilities
   */
  private async processStyles(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);
    
    // Find CSS input file
    const possibleInputs = [
      join(this.options.projectPath, 'app/globals.css'),
      join(this.options.projectPath, 'src/globals.css'),
      join(this.options.projectPath, 'src/input.css'),
      join(this.options.projectPath, 'styles.css')
    ];

    const inputFile = possibleInputs.find(file => existsSync(file));
    
    if (inputFile) {
      const inputCss = readFileSync(inputFile, 'utf-8');
      let outputCss = inputCss;

      // Basic CSS processing (could be enhanced with PostCSS/Tailwind)
      if (this.options.minify) {
        outputCss = outputCss
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();
      }

      await Bun.write(join(outputPath, 'styles.css'), outputCss);
      
      if (!this.options.silent) {
        logger.info('✅ Processed CSS');
      }
    } else {
      // Generate minimal CSS
      const minimalCss = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif}`;
      await Bun.write(join(outputPath, 'styles.css'), minimalCss);
    }
  }

  /**
   * Copy framework files
   */
  private async copyFrameworkFiles(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);
    const framework0x1Dir = join(outputPath, '0x1');
    const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
    
    // Create directories
    mkdirSync(framework0x1Dir, { recursive: true });
    mkdirSync(dirname(nodeModulesDir), { recursive: true });

    // Get framework path
    const frameworkPath = this.getFrameworkPath();
    const frameworkDistPath = join(frameworkPath, 'dist');

    if (existsSync(frameworkDistPath)) {
      // Copy essential framework files
      const frameworkFiles = [
        { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
        { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
        { src: 'hooks.js', dest: 'hooks.js' },
        { src: 'index.js', dest: 'index.js' },
        { src: 'link.js', dest: 'link.js' }
      ];

      const copyTasks = frameworkFiles.map(async ({ src, dest }) => {
        const srcPath = join(frameworkDistPath, src);
        const destPath = join(framework0x1Dir, dest);

        if (existsSync(srcPath)) {
          const content = readFileSync(srcPath, 'utf-8');
          await Bun.write(destPath, content);
          return true;
        }
        return false;
      });

      await Promise.all(copyTasks);

      // Copy router from 0x1-router package
      const routerSourcePath = join(frameworkPath, '0x1-router', 'dist', 'index.js');
      if (existsSync(routerSourcePath)) {
        const routerContent = readFileSync(routerSourcePath, 'utf-8');
        await Bun.write(join(framework0x1Dir, 'router.js'), routerContent);
      }

      // Generate browser-compatible 0x1 entry point
      await this.generateBrowserEntry(nodeModulesDir);

      if (!this.options.silent) {
        logger.info('✅ Copied framework files');
      }
    }
  }

  /**
   * Generate app bundle using shared route discovery
   */
  private async generateAppBundle(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);
    
    // Serialize routes safely
    const sanitizedRoutes = this.state.routes.map(route => ({
      path: route.path,
      componentPath: route.componentPath,
      layouts: route.layouts || []
    }));

    const routesJson = JSON.stringify(sanitizedRoutes, null, 2);

    // Generate production-ready app.js
    const appScript = `// 0x1 Framework App Bundle - PRODUCTION BUILD
console.log('[0x1 App] Starting production app...');

const serverRoutes = ${routesJson};

async function initApp() {
  try {
    console.log('[0x1 App] Loading framework...');
    
    // Load essential dependencies
    const hooksScript = document.createElement('script');
    hooksScript.type = 'module';
    hooksScript.src = '/0x1/hooks.js';
    
    await new Promise((resolve, reject) => {
      hooksScript.onload = resolve;
      hooksScript.onerror = reject;
      document.head.appendChild(hooksScript);
    });
    
    // Load router
    const routerModule = await import('/0x1/router.js');
    const { Router } = routerModule;
    
    // Create router
    const appElement = document.getElementById('app');
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/'
    });
    
    // Register routes
    for (const route of serverRoutes) {
      const routeComponent = async (props) => {
        const componentModule = await import(route.componentPath);
        return componentModule.default ? componentModule.default(props) : null;
      };
      
      router.addRoute(route.path, routeComponent);
    }
    
    // Start router
    router.init();
    router.navigate(window.location.pathname, false);
    
    window.router = router;
    console.log('[0x1 App] ✅ Production app ready');
    
  } catch (error) {
    console.error('[0x1 App] ❌ Initialization failed:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}`;

    await Bun.write(join(outputPath, 'app.js'), appScript);

    if (!this.options.silent) {
      logger.info('✅ Generated app bundle');
    }
  }

  /**
   * Generate browser-compatible 0x1 entry point
   */
  private async generateBrowserEntry(nodeModulesDir: string): Promise<void> {
    const browserEntryCode = `// 0x1 Framework - Browser Entry Point
export const useState = (...args) => globalThis.__0x1_useState?.(...args);
export const useEffect = (...args) => globalThis.__0x1_useEffect?.(...args);
export const useCallback = (...args) => globalThis.__0x1_useCallback?.(...args);
export const useMemo = (...args) => globalThis.__0x1_useMemo?.(...args);
export const useRef = (...args) => globalThis.__0x1_useRef?.(...args);

export function jsx(type, props, key) {
  return window.jsx ? window.jsx(type, props, key) : null;
}

export function jsxs(type, props, key) {
  return window.jsxs ? window.jsxs(type, props, key) : null;
}

export const Fragment = Symbol.for('react.fragment');
export const version = '0.1.0';

export default {
  useState, useEffect, useCallback, useMemo, useRef,
  jsx, jsxs, Fragment, version
};`;

    await Bun.write(join(nodeModulesDir, 'index.js'), browserEntryCode);
  }

  /**
   * Finalize build with HTML generation and manifests
   */
  private async finalizeBuild(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);

    // Generate index.html
    const indexHtml = this.generateIndexHtml();
    await Bun.write(join(outputPath, 'index.html'), indexHtml);

    // Generate build manifest
    const buildInfo = {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      routes: this.state.routes.length,
      components: this.state.components.length,
      buildTime: Date.now() - this.startTime,
      dependencies: this.state.dependencies
    };

    await Bun.write(join(outputPath, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

    if (!this.options.silent) {
      logger.info('✅ Build finalized');
    }
  }

  /**
   * Generate production HTML
   */
  private generateIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <meta name="description" content="0x1 Framework application">
  <link rel="stylesheet" href="/styles.css">
  <script type="importmap">{"imports":{"0x1":"/node_modules/0x1/index.js","0x1/jsx-runtime":"/0x1/jsx-runtime.js","0x1/router":"/0x1/router.js"}}</script>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <script src="/app.js" type="module"></script>
</body>
</html>`;
  }

  /**
   * Get framework path
   */
  private getFrameworkPath(): string {
    return process.cwd().includes('00-Dev/0x1') 
      ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
      : join(process.cwd(), '../0x1');
  }

  /**
   * Create successful build result
   */
  private createSuccessResult(buildTime: number): BuildResult {
    return {
      success: true,
      outputPath: join(this.options.projectPath, this.options.outDir!),
      buildTime,
      routes: this.state.routes.length,
      components: this.state.components.length,
      assets: this.state.assets.size,
      errors: [],
      warnings: []
    };
  }

  /**
   * Create error build result
   */
  private createErrorResult(error: any): BuildResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const buildTime = Date.now() - this.startTime;
    
    if (!this.options.silent) {
      logger.error(`❌ Build failed: ${errorMessage}`);
    }

    return {
      success: false,
      outputPath: join(this.options.projectPath, this.options.outDir!),
      buildTime,
      routes: 0,
      components: 0,
      assets: 0,
      errors: [errorMessage],
      warnings: []
    };
  }
} 