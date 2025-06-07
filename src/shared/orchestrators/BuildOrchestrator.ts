/**
 * 0x1 Framework - Build Orchestrator
 * SINGLE SOURCE OF TRUTH following BuildOptimisation.md
 * Uses working patterns with shared core utilities
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '../../cli/utils/logger';

// Import shared core utilities for SINGLE SOURCE OF TRUTH
import { transpilationEngine } from '../core/TranspilationEngine';

// CRITICAL FIX: Import working Tailwind v4 handler from DevOrchestrator (SINGLE SOURCE OF TRUTH)

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

export interface Route {
  path: string;
  componentPath: string;
  layouts?: Array<{ path: string; componentPath: string }>;
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

  async build(): Promise<BuildResult> {
    try {
      this.startTime = Date.now();
      const outputPath = join(this.options.projectPath, this.options.outDir!);
    
      if (!this.options.silent) {
        logger.info('🚀 Building 0x1 application using working backup patterns...');
      }

      // Phase 1: Clean and prepare
      await this.prepareOutputDirectory();

      // Phase 2: Discover everything (using working route discovery)
      await this.discoverEverything();

      // Phase 3: Build everything (EXACT pattern from build.bak.ts)
      await this.buildUsingWorkingPattern();

      const buildTime = Date.now() - this.startTime;

      if (!this.options.silent) {
        logger.success(`✅ Build completed successfully in ${buildTime}ms`);
        logger.info(`📁 Output: ${outputPath}`);
        logger.info(`🛣️ Routes: ${this.state.routes.length}`);
        logger.info(`🧩 Components: ${this.state.components.length}`);
      }

      return this.createSuccessResult(buildTime);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Build failed: ${errorMessage}`);
      return this.createErrorResult(error);
    }
  }

  private async prepareOutputDirectory(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);

    // Clean output directory
    if (existsSync(outputPath)) {
      await Bun.$`rm -rf ${outputPath}`;
    }
    mkdirSync(outputPath, { recursive: true });

    // Create required subdirectories
    const requiredDirs = ['0x1', 'node_modules/0x1', 'app', 'components'];
    for (const dir of requiredDirs) {
      mkdirSync(join(outputPath, dir), { recursive: true });
    }
  }

  private async discoverEverything(): Promise<void> {
    if (!this.options.silent) {
      logger.info('🔍 Discovering routes and components...');
    }

    // Use working route discovery
    this.state.routes = await this.discoverRoutesUsingWorkingPattern();
    this.state.components = await this.discoverComponents();

    if (!this.options.silent) {
      logger.info(`Found ${this.state.routes.length} routes and ${this.state.components.length} components`);
    }
  }

  private async discoverRoutesUsingWorkingPattern(): Promise<Route[]> {
    // EXACT same pattern as working version
    const routes: Route[] = [];
    
    const scanDirectory = (
      dirPath: string, 
      routePath: string = "", 
      parentLayouts: Array<{ path: string; componentPath: string }> = []
    ) => {
      try {
        if (!existsSync(dirPath)) return;

        const items = readdirSync(dirPath);

        // Check for layout file in current directory
        const layoutFiles = items.filter((item: string) =>
          item.match(/^layout\.(tsx|jsx|ts|js)$/)
        );

        // Build current layout hierarchy
        const currentLayouts = [...parentLayouts];
        if (layoutFiles.length > 0) {
          const actualLayoutFile = layoutFiles[0];
          const layoutComponentPath = `/app${routePath}/${actualLayoutFile.replace(/\.(tsx|ts)$/, ".js")}`;
          currentLayouts.push({ 
            path: routePath || "/", 
            componentPath: layoutComponentPath 
          });
        }

        // Check for page files in current directory
        const pageFiles = items.filter((item: string) =>
          item.match(/^page\.(tsx|jsx|ts|js)$/)
        );

        if (pageFiles.length > 0) {
          const actualFile = pageFiles[0];
          const componentPath = `/app${routePath}/${actualFile.replace(/\.(tsx|ts)$/, ".js")}`;
          
          routes.push({ 
            path: routePath || "/", 
            componentPath: componentPath,
            layouts: currentLayouts
          });
        }

        // Recursively scan subdirectories
        const subdirs = items.filter((item: string) => {
          const itemPath = join(dirPath, item);
          try {
            return (
              statSync(itemPath).isDirectory() &&
              !item.startsWith(".") &&
              !item.startsWith("_") &&
              item !== "node_modules"
            );
          } catch {
            return false;
          }
        });

        for (const subdir of subdirs) {
          const subdirPath = join(dirPath, subdir);
          const subroutePath = routePath + "/" + subdir;
          scanDirectory(subdirPath, subroutePath, currentLayouts);
        }
      } catch (error) {
        // Silent fail for directories
      }
    };

    // Scan app directory
    const appDir = join(this.options.projectPath, "app");
    scanDirectory(appDir, "", []);

    // Sort routes by specificity
    routes.sort((a, b) => {
      if (a.path === "/" && b.path !== "/") return 1;
      if (b.path === "/" && a.path !== "/") return -1;
      const aSegments = a.path.split('/').filter(s => s).length;
      const bSegments = b.path.split('/').filter(s => s).length;
      return bSegments - aSegments;
    });

    return routes;
  }

  private async discoverComponents(): Promise<Array<{ path: string; relativePath: string }>> {
    const components: Array<{ path: string; relativePath: string }> = [];
    const componentDirectories = ['components', 'lib', 'src/components', 'src/lib'];
    const componentExtensions = ['.tsx', '.jsx', '.ts', '.js'];

    for (const dir of componentDirectories) {
      const fullDirPath = join(this.options.projectPath, dir);
      if (!existsSync(fullDirPath)) continue;

      const scanRecursive = (dirPath: string, relativePath: string = ''): void => {
        try {
          const items = readdirSync(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            const itemPath = join(dirPath, item.name);
            
            if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
              const newRelativePath = relativePath ? join(relativePath, item.name) : item.name;
              scanRecursive(itemPath, newRelativePath);
            } else if (componentExtensions.some(ext => item.name.endsWith(ext))) {
              const componentFile = relativePath ? join(dir, relativePath, item.name) : join(dir, item.name);
              components.push({
                path: itemPath,
                relativePath: componentFile
              });
            }
          }
        } catch (error) {
          // Silent fail for individual directories
        }
      };

      scanRecursive(fullDirPath);
    }

    return components;
  }

  private async buildUsingWorkingPattern(): Promise<void> {
    const outputPath = join(this.options.projectPath, this.options.outDir!);

    // Step 1: Generate components using working transpilation pattern
    await this.generateComponentsUsingWorkingPattern(outputPath);

    // Step 2: Copy framework files using EXACT pattern from build.bak.ts
    await this.copyFrameworkFilesUsingWorkingPattern(outputPath);

    // Step 3: Generate app.js using working pattern from builder.bak.ts
    await this.generateAppBundleUsingWorkingPattern(outputPath);

    // Step 4: Process CSS using working pattern
    await this.processCssUsingWorkingPattern(outputPath);

    // Step 5: Generate HTML
    await this.generateHtmlFile(outputPath);

    // Step 6: Copy static assets
    await this.copyStaticAssets(outputPath);
  }

  private async generateComponentsUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('🧩 Generating components using working transpilation pattern...');
    }

    // Process routes
    for (const route of this.state.routes) {
      try {
        const sourcePath = this.findRouteSourceFile(route);
        if (!sourcePath) continue;

        let sourceCode = readFileSync(sourcePath, 'utf-8');
        
        // Compose layouts if they exist
        if (route.layouts && route.layouts.length > 0) {
          sourceCode = await this.composeLayoutsUsingWorkingPattern(sourceCode, route, sourcePath);
        }

        // Transpile using working pattern (same as build.bak.ts)
        const transpiledContent = await this.transpileComponentSafely(sourceCode, sourcePath);
        
        const outputComponentPath = join(outputPath, route.componentPath.replace(/^\//, ''));
        await Bun.write(outputComponentPath, transpiledContent);
        
      } catch (error) {
        logger.warn(`Failed to process route ${route.path}: ${error}`);
      }
    }

    // CRITICAL FIX: Generate standalone layout files that are referenced but not embedded
    const layoutPaths = new Set<string>();
    for (const route of this.state.routes) {
      if (route.layouts && route.layouts.length > 0) {
        for (const layout of route.layouts) {
          layoutPaths.add(layout.componentPath);
        }
      }
    }

    // Generate standalone layout files
    for (const layoutPath of layoutPaths) {
      try {
        const layoutSourcePath = this.findLayoutSourceFile(layoutPath);
        if (!layoutSourcePath) continue;

        const sourceCode = readFileSync(layoutSourcePath, 'utf-8');
        const transpiledContent = await this.transpileComponentSafely(sourceCode, layoutSourcePath);
        
        const outputLayoutPath = join(outputPath, layoutPath.replace(/^\//, ''));
        await Bun.write(outputLayoutPath, transpiledContent);
        
        if (!this.options.silent) {
          logger.debug(`Generated standalone layout: ${layoutPath}`);
        }
      } catch (error) {
        logger.warn(`Failed to process standalone layout ${layoutPath}: ${error}`);
      }
    }

    // Process regular components
    for (const component of this.state.components) {
      try {
        const sourceCode = readFileSync(component.path, 'utf-8');
        const transpiledContent = await this.transpileComponentSafely(sourceCode, component.path);
        
        const outputComponentPath = join(outputPath, component.relativePath.replace(/\.(tsx|ts|jsx)$/, '.js'));
        await Bun.write(outputComponentPath, transpiledContent);

      } catch (error) {
        logger.warn(`Failed to process component ${component.relativePath}: ${error}`);
      }
    }
  }

  private findRouteSourceFile(route: Route): string | null {
    const basePath = join(this.options.projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, ''));
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    for (const ext of extensions) {
      const sourcePath = basePath + ext;
      if (existsSync(sourcePath)) {
        return sourcePath;
      }
    }
    
    return null;
  }

  private findLayoutSourceFile(layoutPath: string): string | null {
    const basePath = join(this.options.projectPath, layoutPath.replace(/^\//, '').replace(/\.js$/, ''));
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    for (const ext of extensions) {
      const sourcePath = basePath + ext;
      if (existsSync(sourcePath)) {
        return sourcePath;
      }
    }
    
    return null;
  }

  private async copyFrameworkFilesUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('📦 Copying framework files using working pattern...');
    }

    const frameworkPath = this.getFrameworkPath();
    const frameworkDistPath = join(frameworkPath, 'dist');

    // Create framework directories
    const framework0x1Dir = join(outputPath, '0x1');
    const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
    
    // CRITICAL FIX: Copy ALL framework files including hashed versions
    // This ensures both redirect files (hooks.js) and actual files (hooks-d2be986e.js) are copied
    if (existsSync(frameworkDistPath)) {
      const allFrameworkFiles = readdirSync(frameworkDistPath).filter(file => 
        file.endsWith('.js') || file.endsWith('.css')
      );
      
      if (!this.options.silent) {
        logger.info(`Found ${allFrameworkFiles.length} framework files to copy`);
      }
      
      for (const file of allFrameworkFiles) {
        const srcPath = join(frameworkDistPath, file);
        if (existsSync(srcPath)) {
          const content = readFileSync(srcPath, 'utf-8');
          
          // Write to both locations to ensure compatibility
          await Bun.write(join(framework0x1Dir, file), content);
          await Bun.write(join(nodeModulesDir, file), content);
          
          if (!this.options.silent) {
            logger.debug(`Copied framework file: ${file}`);
          }
        }
      }
    }

    // Copy router from 0x1-router package
    const routerSourcePath = join(frameworkPath, '0x1-router', 'dist', 'index.js');
    if (existsSync(routerSourcePath)) {
      const routerContent = readFileSync(routerSourcePath, 'utf-8');
      await Bun.write(join(framework0x1Dir, 'router.js'), routerContent);
      await Bun.write(join(nodeModulesDir, 'router.js'), routerContent);
    }

    // Generate browser-compatible 0x1 entry point
    await this.generateBrowserEntry(nodeModulesDir);
  }

  private async generateBrowserEntry(nodeModulesDir: string): Promise<void> {
    // Use EXACT same pattern as build.bak.ts
    const cleanFrameworkModule = `// 0x1 Framework - Dynamic Runtime Hook Resolution (Build Version)
console.log('[0x1] Framework module loaded - dynamic runtime version');

// Create dynamic getters that resolve hooks at import time
const createHookGetter = (hookName) => (...args) => {
  if (typeof window !== 'undefined' && window.React && typeof window.React[hookName] === 'function') {
    return window.React[hookName](...args);
  }
  if (typeof window !== 'undefined' && typeof window[hookName] === 'function') {
    return window[hookName](...args);
  }
  throw new Error('[0x1] ' + hookName + ' not available - hooks may not be loaded yet');
};

export const useState = createHookGetter('useState');
export const useEffect = createHookGetter('useEffect');
export const useCallback = createHookGetter('useCallback');
export const useMemo = createHookGetter('useMemo');
export const useRef = createHookGetter('useRef');
export const useClickOutside = createHookGetter('useClickOutside');
export const useFetch = createHookGetter('useFetch');
export const useForm = createHookGetter('useForm');
export const useLocalStorage = createHookGetter('useLocalStorage');

// JSX runtime delegation
export function jsx(type, props, key) {
  if (typeof window !== 'undefined' && window.jsx) {
    return window.jsx(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export function jsxs(type, props, key) {
  if (typeof window !== 'undefined' && window.jsxs) {
    return window.jsxs(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  if (typeof window !== 'undefined' && window.jsxDEV) {
    return window.jsxDEV(type, props, key, isStaticChildren, source, self);
  }
  throw new Error('[0x1] JSX dev runtime not loaded');
}

export function createElement(type, props, ...children) {
  if (typeof window !== 'undefined' && window.createElement) {
    return window.createElement(type, props, ...children);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export const Fragment = (() => {
  if (typeof window !== 'undefined' && window.Fragment) {
    return window.Fragment;
  }
  return Symbol.for('react.fragment');
})();

export const version = '0.1.0';

export default {
  useState, useEffect, useCallback, useMemo, useRef,
  useClickOutside, useFetch, useForm, useLocalStorage,
  jsx, jsxs, jsxDEV, createElement, Fragment, version
};
`;

    await Bun.write(join(nodeModulesDir, 'index.js'), cleanFrameworkModule);
  }

  private async generateAppBundleUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('📱 Generating app bundle using working pattern...');
    }

    // Use EXACT same pattern as builder.bak.ts
    const routesJson = JSON.stringify(
      this.state.routes.map(route => ({
        path: route.path,
        componentPath: route.componentPath,
        layouts: route.layouts || []
      })), 
      null, 
      2
    );

    // Generate app.js using EXACT pattern from builder.bak.ts
    const appScript = `// 0x1 Framework App Bundle - Production Ready
console.log('[0x1 App] Starting production app...');

// Server-discovered routes
const serverRoutes = ${routesJson};

// Production-ready initialization
async function initApp() {
  try {
    console.log('[0x1 App] Loading framework...');
    
    // Load hooks
    const hooksScript = document.createElement('script');
    hooksScript.type = 'module';
    hooksScript.src = '/0x1/hooks.js';
    
    await new Promise((resolve, reject) => {
      hooksScript.onload = () => {
        console.log('[0x1 App] Hooks loaded');
        resolve();
      };
      hooksScript.onerror = reject;
      document.head.appendChild(hooksScript);
    });
    
    // Load router
    const routerModule = await import('/0x1/router.js');
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/',
      notFoundComponent: () => ({
        type: 'div',
        props: { className: 'flex flex-col items-center justify-center min-h-[60vh] text-center px-4' },
        children: [
          {
            type: 'h1',
            props: { className: 'text-9xl font-bold text-violet-600 dark:text-violet-400 mb-4' },
            children: ['404'],
            key: null
          },
          {
            type: 'h2', 
            props: { className: 'text-3xl font-bold text-gray-800 dark:text-white mb-4' },
            children: ['Page Not Found'],
            key: null
          },
          {
            type: 'a',
            props: {
              href: '/',
              className: 'inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium',
              onClick: (e) => {
                e.preventDefault();
                if (window.router && typeof window.router.navigate === 'function') {
                  window.router.navigate('/');
                } else {
                  window.location.href = '/';
                }
              }
            },
            children: ['🏠 Back to Home'],
            key: null
          }
        ],
        key: null
      })
    });
    
    window.__0x1_ROUTER__ = router;
    window.__0x1_router = router;
    window.router = router;
    
    console.log('[0x1 App] Router ready');
    
    // Register routes
    for (const route of serverRoutes) {
      try {
        const routeComponent = async (props) => {
          try {
            const componentModule = await import(route.componentPath);
            
            if (componentModule && componentModule.default) {
              return componentModule.default(props);
            } else {
              return {
                type: 'div',
                props: { className: 'p-8 text-center', style: 'color: #f59e0b;' },
                children: ['Component loaded but has no default export: ' + route.path]
              };
            }
          } catch (error) {
            console.error('[0x1 App] Route component error:', route.path, error);
            return {
              type: 'div',
              props: { className: 'p-8 text-center', style: 'color: #ef4444;' },
              children: ['Failed to load component: ' + route.path]
            };
          }
        };
        
        router.addRoute(route.path, routeComponent, { 
          componentPath: route.componentPath 
        });
        
      } catch (error) {
        console.error('[0x1 App] Failed to register route:', route.path, error);
      }
    }
    
    // Start router
    router.init();
    router.navigate(window.location.pathname, false);
    
    console.log('[0x1 App] App initialized successfully');
    
  } catch (error) {
    console.error('[0x1 App] ❌ Initialization failed:', error);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444; margin-bottom: 16px;">Application Error</h2><p style="color: #6b7280; margin-bottom: 20px;">' + error.message + '</p><button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button></div>';
    }
  }
}

// Start immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`;

    await Bun.write(join(outputPath, 'app.js'), appScript);
  }

  private async processCssUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('🎨 Processing CSS using working pattern...');
    }

    try {
      // CRITICAL FIX: Use EXACT same Tailwind v4 processing as DevOrchestrator (SINGLE SOURCE OF TRUTH)
      // Dynamic import like in build.bak.ts
      const { tailwindV4Handler } = await import('../../cli/commands/utils/server/tailwind-v4');
      
      // Check if Tailwind v4 is available first (same logic as working dev-server.bak.ts)
      const isV4Available = await tailwindV4Handler.isAvailable(this.options.projectPath);
      
      if (isV4Available) {
        if (!this.options.silent) {
          logger.info(`🌈 Processing Tailwind CSS v4 for production build`);
        }

        // Use working Tailwind v4 processing (EXACT same logic as DevOrchestrator)
        let inputFile = tailwindV4Handler.findInputFile(this.options.projectPath);
        if (!inputFile) {
          inputFile = tailwindV4Handler.createDefaultInput(this.options.projectPath);
        }

        // Only proceed if we have a valid input file
        if (inputFile) {
          // Start Tailwind v4 process (same as DevOrchestrator)
          try {
            const tailwindProcess = await tailwindV4Handler.startProcess(
              this.options.projectPath,
              inputFile,
              join(this.options.projectPath, 'dist', 'styles.css')
            );

            if (tailwindProcess && tailwindProcess.success) {
              const cssPath = join(this.options.projectPath, 'dist', 'styles.css');
              if (existsSync(cssPath)) {
                const cssContent = readFileSync(cssPath, 'utf-8');
                
                // Copy the generated CSS to build output
                await Bun.write(join(outputPath, 'styles.css'), cssContent);
                
                if (!this.options.silent) {
                  logger.success(`✅ Tailwind CSS v4 processed successfully: ${(cssContent.length / 1024).toFixed(1)}KB`);
                }
                return;
              }
            }
          } catch (tailwindError) {
            if (!this.options.silent) {
              logger.warn(`Tailwind v4 process failed: ${tailwindError}`);
            }
          }
        }
      }

      // Enhanced fallback CSS handling (same as DevOrchestrator)
      const cssDirectories = [
        join(this.options.projectPath, 'dist'),
        join(this.options.projectPath, 'public'),
        join(this.options.projectPath, 'app'),
        join(this.options.projectPath, 'src')
      ];

      for (const dir of cssDirectories) {
        const possiblePaths = [
          join(dir, 'styles.css'),
          join(dir, 'globals.css'),
          join(dir, 'global.css'),
          join(dir, 'app.css'),
          join(dir, 'main.css')
        ];

        for (const cssPath of possiblePaths) {
          if (existsSync(cssPath)) {
            let cssContent = readFileSync(cssPath, 'utf-8');
            
            // Process CSS to remove problematic imports that cause 404s in production
            cssContent = cssContent
              .replace(/@import\s+["']tailwindcss[""];?/g, '/* Tailwind CSS processed */')
              .replace(/@import\s+["']tailwindcss\/base[""];?/g, '/* Tailwind base processed */')
              .replace(/@import\s+["']tailwindcss\/components[""];?/g, '/* Tailwind components processed */')
              .replace(/@import\s+["']tailwindcss\/utilities[""];?/g, '/* Tailwind utilities processed */')
              .replace(/@import\s+["'][^"']*node_modules[^"']*[""];?/g, '/* Node modules import removed */')
              .replace(/@import\s+["']([^"'/][^"']*)[""];?/g, '/* Package import removed: $1 */');
            
            // Add comprehensive Tailwind utilities for production
            cssContent += this.getComprehensiveTailwindUtilities();
            
            await Bun.write(join(outputPath, 'styles.css'), cssContent);
            
            if (!this.options.silent) {
              logger.success(`✅ CSS processed with Tailwind utilities: ${(cssContent.length / 1024).toFixed(1)}KB`);
            }
            return;
          }
        }
      }

      // Generate comprehensive CSS fallback if no input found
      const fallbackCss = this.getMinimalProductionCss() + this.getComprehensiveTailwindUtilities();
      await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
      
      if (!this.options.silent) {
        logger.info(`✅ Generated comprehensive CSS with Tailwind utilities`);
      }

    } catch (error) {
      logger.warn(`CSS processing failed: ${error}`);
      
      // Fallback to minimal CSS
      const fallbackCss = this.getMinimalProductionCss() + this.getComprehensiveTailwindUtilities();
      await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
      
      if (!this.options.silent) {
        logger.info(`✅ Generated fallback CSS with Tailwind utilities`);
      }
    }
  }

  private async composeLayoutsUsingWorkingPattern(sourceCode: string, route: Route, sourcePath: string): Promise<string> {
    if (!route.layouts || route.layouts.length === 0) {
      return sourceCode;
    }

    // Load all layout contents (same pattern as build.bak.ts)
    const layoutContents: string[] = [];
    const layoutNames: string[] = [];
    
    for (let i = 0; i < route.layouts.length; i++) {
      const layout = route.layouts[i];
      const layoutSourcePath = join(this.options.projectPath, layout.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
      
      let actualLayoutPath = layoutSourcePath;
      if (!existsSync(layoutSourcePath)) {
        const alternatives = [
          layoutSourcePath.replace('.tsx', '.ts'),
          layoutSourcePath.replace('.tsx', '.jsx'),
          layoutSourcePath.replace('.tsx', '.js')
        ];
        
        for (const alt of alternatives) {
          if (existsSync(alt)) {
            actualLayoutPath = alt;
            break;
          }
        }
      }
      
      if (existsSync(actualLayoutPath)) {
        const layoutContent = readFileSync(actualLayoutPath, 'utf-8');
        const layoutFunctionName = `Layout${i}`;
        
        // Process layout content
        let processedLayoutContent = layoutContent;
        
        // Remove CSS imports
        processedLayoutContent = processedLayoutContent.replace(/import\s+["']\.\/globals\.css[""];?\s*\n?/g, '');
        processedLayoutContent = processedLayoutContent.replace(/import\s+["'][^"']*\.css[""];?\s*\n?/g, '');
        
        // Replace function name
        const exportMatch = processedLayoutContent.match(/export\s+default\s+function\s+(\w+)/);
        if (exportMatch) {
          const originalName = exportMatch[1];
          processedLayoutContent = processedLayoutContent.replace(
            new RegExp(`export\\s+default\\s+function\\s+${originalName}`, 'g'),
            `function ${layoutFunctionName}`
          );
        }
        
        layoutContents.push(processedLayoutContent);
        layoutNames.push(layoutFunctionName);
      }
    }
    
    // Extract page component
    const pageExportMatch = sourceCode.match(/export\s+default\s+function\s+(\w+)/);
    const pageComponentName = pageExportMatch?.[1] || 'PageComponent';
    
    let pageWithoutExport = sourceCode;
    if (pageExportMatch) {
      const originalPageName = pageExportMatch[1];
      pageWithoutExport = sourceCode.replace(
        new RegExp(`export\\s+default\\s+function\\s+${originalPageName}`, 'g'),
        `function ${pageComponentName}`
      );
    }
    
    // Compose all layouts with the page component
    let wrappedComponentCode = `${pageComponentName}(props)`;
    
    // Apply layouts from innermost to outermost (reverse order)
    for (let i = layoutNames.length - 1; i >= 0; i--) {
      const layoutName = layoutNames[i];
      wrappedComponentCode = `${layoutName}({ children: ${wrappedComponentCode}, ...props })`;
    }
    
    // Build final composed content
    const layoutSection = layoutContents.join('\n\n');
    const pageSection = pageWithoutExport;
    const wrapperSection = `\nexport default function WrappedPage(props) {\n  return ${wrappedComponentCode};\n}`;
    
    return `${layoutSection}\n\n${pageSection}${wrapperSection}`;
  }

  private async transpileComponentSafely(sourceCode: string, sourcePath: string): Promise<string> {
    try {
      // Use same transpilation pattern as build.bak.ts
      const isTsxOrJsx = sourcePath.endsWith('.tsx') || sourcePath.endsWith('.jsx');
      
      if (!isTsxOrJsx) {
        // Just transform imports for non-JSX files
        let processedCode = sourceCode;
        
        // Transform imports for browser compatibility
        processedCode = this.transformImportsForBrowser(processedCode);
        
        // Add JSX runtime preamble in case needed
        processedCode = this.insertJsxRuntimePreamble(processedCode);
        
        return processedCode;
      }

      // For JSX files, use Bun transpiler
      const transpiler = new Bun.Transpiler({
        loader: 'tsx',
        target: 'browser',
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
          'global': 'globalThis'
        }
      });

      let transpiledContent = await transpiler.transform(sourceCode);
      
      // Fix JSX function calls
      transpiledContent = this.normalizeJsxFunctionCalls(transpiledContent);
      
      // Transform imports
      transpiledContent = this.transformImportsForBrowser(transpiledContent);
      
      // Add JSX runtime preamble
      transpiledContent = this.insertJsxRuntimePreamble(transpiledContent);
      
      return transpiledContent;
      
    } catch (error) {
      logger.warn(`Transpilation failed for ${sourcePath}: ${error}`);
      
      // Return error component
      return this.generateErrorComponent(sourcePath, String(error));
    }
  }

  private transformImportsForBrowser(content: string): string {
    const lines = content.split('\n');
    
    return lines.map(line => {
      const trimmed = line.trim();
      
      // Skip non-import lines
      if (!trimmed.startsWith('import ') || !trimmed.includes(' from ')) {
        return line;
      }
      
      // Remove CSS imports
      if (/import\s+['"'][^'"]*\.(css|scss|sass|less)['"];?/.test(line)) {
        return '// CSS import removed for browser compatibility';
      }
      
      // Transform 0x1 framework imports
      if (line.includes('from "0x1"') || line.includes("from '0x1'")) {
        return line.replace(/["']0x1["']/, '"/node_modules/0x1/index.js"');
      }
      
      // Transform 0x1 submodule imports
      const submoduleMatch = line.match(/from\s+["']0x1\/([\w-]+)["']/);
      if (submoduleMatch) {
        const module = submoduleMatch[1];
        const moduleMap: Record<string, string> = {
          'jsx-runtime': '/0x1/jsx-runtime.js',
          'jsx-dev-runtime': '/0x1/jsx-runtime.js',
          'hooks': '/0x1/hooks.js',
          'router': '/0x1/router.js'
        };
        
        if (moduleMap[module]) {
          return line.replace(/["']0x1\/[\w-]+["']/, `"${moduleMap[module]}"`);
        }
      }
      
      // Transform relative imports
      if (line.includes('from "./') || line.includes('from "../')) {
        return line.replace(
          /from\s+["'](\.\.?\/[^"']+)["']/,
          (match, path) => {
            let normalizedPath = path;
            if (path.startsWith('./')) {
              normalizedPath = path.replace('./', '/components/');
            } else if (path.startsWith('../')) {
              normalizedPath = path.replace(/^\.\.\//, '/');
            }
            
            if (!normalizedPath.match(/\.(js|ts|tsx|jsx|json|css)$/)) {
              normalizedPath += '.js';
            } else if (normalizedPath.match(/\.(ts|tsx|jsx)$/)) {
              normalizedPath = normalizedPath.replace(/\.(ts|tsx|jsx)$/, '.js');
            }
            
            return `from "${normalizedPath}"`;
          }
        );
      }
      
      return line;
    }).join('\n');
  }

  private normalizeJsxFunctionCalls(content: string): string {
    // Fix hashed JSX function names
    content = content.replace(/jsxDEV_[a-zA-Z0-9_]+/g, 'jsxDEV');
    content = content.replace(/jsx_[a-zA-Z0-9_]+/g, 'jsx');
    content = content.replace(/jsxs_[a-zA-Z0-9_]+/g, 'jsxs');
    content = content.replace(/Fragment_[a-zA-Z0-9_]+/g, 'Fragment');
    
    return content;
  }

  private insertJsxRuntimePreamble(code: string): string {
    const lines = code.split('\n');
    let insertIndex = 0;
    
    // Find end of imports
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || (line.startsWith('export ') && line.includes('from '))) {
        insertIndex = i + 1;
      } else if (line.startsWith('//') || line === '') {
        // Skip comments and empty lines
      } else if (line) {
        break;
      }
    }
    
    const preamble = `// 0x1 Framework - JSX Runtime Access\nimport { jsx, jsxs, jsxDEV, Fragment, createElement } from '/0x1/jsx-runtime.js';`;
    
    lines.splice(insertIndex, 0, preamble);
    return lines.join('\n');
  }

  private generateErrorComponent(filePath: string, errorMessage: string): string {
    const safePath = filePath.replace(/'/g, "\\'");
    const safeError = errorMessage.replace(/'/g, "\\'");
    
    return `
// Error component for failed transpilation: ${safePath}
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
        children: ['Transpilation Error'],
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

  private getComprehensiveTailwindUtilities(): string {
    return `

/* 0x1 Framework - Essential Tailwind v4 Utilities */
/* Reset & Base */
*, ::before, ::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }

/* Layout Essentials */
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.grid { display: grid; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }

/* Spacing */
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.m-4 { margin: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }

/* Colors */
.bg-slate-900 { background-color: #0f172a; }
.bg-white { background-color: #fff; }
.bg-violet-600 { background-color: #7c3aed; }
.bg-violet-700 { background-color: #6d28d9; }
.bg-red-50 { background-color: #fef2f2; }
.bg-muted { background-color: #f1f5f9; }
.text-white { color: #fff; }
.text-gray-900 { color: #111827; }
.text-gray-800 { color: #1f2937; }
.text-gray-600 { color: #4b5563; }
.text-gray-300 { color: #d1d5db; }
.text-violet-600 { color: #7c3aed; }
.text-violet-400 { color: #a78bfa; }
.text-foreground { color: #0f172a; }

/* Typography */
.text-9xl { font-size: 8rem; line-height: 1; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.text-center { text-align: center; }

/* Borders & Effects */
.border { border-width: 1px; }
.border-red-200 { border-color: #fecaca; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }

/* Interactions */
.hover\\:bg-violet-700:hover { background-color: #6d28d9; }
.hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.hover\\:text-foreground:hover { color: #0f172a; }
.hover\\:bg-muted:hover { background-color: #f1f5f9; }
.transition-all { transition: all 0.15s ease; }
.transition-colors { transition: color 0.15s ease, background-color 0.15s ease; }
.duration-200 { transition-duration: 0.2s; }

/* Layout Controls */
.inline-block { display: inline-block; }
.min-h-\\[60vh\\] { min-height: 60vh; }
.focus\\:outline-none:focus { outline: none; }
.focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }
.focus\\:ring-offset-2:focus { box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(59, 130, 246, 0.5); }

/* Dark mode support */
.dark .dark\\:text-white { color: #fff; }
.dark .dark\\:text-violet-400 { color: #a78bfa; }
.dark .dark\\:text-gray-300 { color: #d1d5db; }
.dark .dark\\:bg-gray-800 { background-color: #1f2937; }
.dark .dark\\:hover\\:bg-secondary:hover { background-color: #374151; }
`;
  }

  private getMinimalProductionCss(): string {
    return `/* 0x1 Framework - Production CSS with Tailwind Utilities */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}
html{line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif;height:100%}
body{line-height:1.6;font-family:system-ui,sans-serif;margin:0}

/* Essential Layout */
.container{width:100%;max-width:1200px;margin:0 auto;padding:0 1rem}
.flex{display:flex}.flex-col{flex-direction:column}
.items-center{align-items:center}.justify-center{justify-content:center}
.justify-between{justify-content:space-between}
.grid{display:grid}.gap-4{gap:1rem}.gap-6{gap:1.5rem}

/* Essential Colors */
.bg-slate-900{background-color:#0f172a}.bg-white{background-color:#fff}
.bg-violet-600{background-color:#7c3aed}.bg-violet-700{background-color:#6d28d9}
.text-white{color:#fff}.text-gray-900{color:#111827}
.text-gray-800{color:#1f2937}.text-violet-600{color:#7c3aed}

/* Essential Spacing */
.p-2{padding:0.5rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-8{padding:2rem}
.px-4{padding-left:1rem;padding-right:1rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}
.mb-2{margin-bottom:0.5rem}.mb-4{margin-bottom:1rem}.mb-8{margin-bottom:2rem}

/* Essential Typography */
.text-9xl{font-size:8rem;line-height:1}.text-3xl{font-size:1.875rem;line-height:2.25rem}
.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:0.875rem;line-height:1.25rem}
.font-bold{font-weight:700}.font-medium{font-weight:500}.text-center{text-align:center}

/* Essential Effects */
.rounded-lg{border-radius:0.5rem}.shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)}
.transition-all{transition:all 0.15s ease}.hover\\:bg-violet-700:hover{background-color:#6d28d9}
.inline-block{display:inline-block}.min-h-\\[60vh\\]{min-height:60vh}

/* Dark mode */
.dark .dark\\:text-white{color:#fff}.dark .dark\\:text-violet-400{color:#a78bfa}
.dark .dark\\:text-gray-300{color:#d1d5db}
`;
  }

  private async generateHtmlFile(outputPath: string): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <meta name="description" content="0x1 Framework application">
  <link rel="stylesheet" href="/styles.css">
  <script type="importmap">{"imports":{"0x1":"/node_modules/0x1/index.js","0x1/jsx-runtime":"/0x1/jsx-runtime.js","0x1/router":"/0x1/router.js","0x1/link":"/0x1/router.js"}}</script>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <script>
    window.process={env:{NODE_ENV:'production'}};
    (function(){try{const t=localStorage.getItem('0x1-dark-mode');t==='light'?(document.documentElement.classList.remove('dark'),document.body.className='bg-white text-gray-900'):(document.documentElement.classList.add('dark'),document.body.className='bg-slate-900 text-white')}catch{document.documentElement.classList.add('dark')}})();
  </script>
  <script src="/app.js" type="module"></script>
</body>
</html>`;

    await Bun.write(join(outputPath, 'index.html'), html);
  }

  private async copyStaticAssets(outputPath: string): Promise<void> {
    const publicDir = join(this.options.projectPath, 'public');
    if (existsSync(publicDir)) {
      try {
        await Bun.$`cp -r ${publicDir}/* ${outputPath}/`;
      } catch (error) {
        // Silent fail if no assets to copy
      }
    }
    
    // Generate minimal favicon.ico if none exists
    const faviconPath = join(outputPath, 'favicon.ico');
    if (!existsSync(faviconPath)) {
      const faviconData = new Uint8Array([
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x68, 0x05,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00
      ]);
      await Bun.write(faviconPath, faviconData);
    }
  }

  private getFrameworkPath(): string {
    return process.cwd().includes('00-Dev/0x1') 
      ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
      : join(process.cwd(), '../0x1');
  }

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

  private createErrorResult(error: any): BuildResult {
    return {
      success: false,
      outputPath: join(this.options.projectPath, this.options.outDir!),
      buildTime: Date.now() - this.startTime,
      routes: 0,
      components: 0,
      assets: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: []
    };
  }
} 

