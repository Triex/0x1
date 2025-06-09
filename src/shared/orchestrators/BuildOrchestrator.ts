/**
 * 0x1 Framework - Build Orchestrator
 * SINGLE SOURCE OF TRUTH following BuildOptimisation.md
 * Uses working patterns with shared core utilities
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from '../../cli/utils/logger';

// Import shared core utilities for SINGLE SOURCE OF TRUTH
import { getConfigurationManager } from '../core/ConfigurationManager';
import { ImportTransformer } from '../core/ImportTransformer';
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

    // Step 2.5: Copy external packages that are being imported
    await this.copyExternalPackages(outputPath);

    // Step 3: Generate app.js using working pattern from builder.bak.ts
    await this.generateAppBundleUsingWorkingPattern(outputPath);

    // Step 4: Process CSS using working pattern
    await this.processCssUsingWorkingPattern(outputPath);

    // Step 5: Copy static assets (MOVED BEFORE HTML so favicon exists)
    await this.copyStaticAssets(outputPath);

    // Step 6: Generate HTML (NOW favicon link will be included)
    await this.generateHtmlFile(outputPath);
  }

  private async generateComponentsUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('🧩 Generating components using DevOrchestrator exact logic...');
    }

    // CRITICAL FIX: Follow DevOrchestrator pattern exactly - generate ONLY standalone components
    // No layout composition at build time - let runtime handle it like DevOrchestrator

    // 1. Generate ALL route page components as standalone files (NO EMBEDDING)
    for (const route of this.state.routes) {
      try {
        await this.generateComponentUsingDevOrchestratorLogic(route.componentPath, outputPath);
        
        if (!this.options.silent) {
          logger.debug(`Generated route: ${route.componentPath}`);
        }
      } catch (error) {
        logger.warn(`Failed to generate route ${route.componentPath}: ${error}`);
      }
    }

    // 2. Generate ALL layout components as standalone files
    const layoutPaths = new Set<string>();
    for (const route of this.state.routes) {
      if (route.layouts && route.layouts.length > 0) {
        for (const layout of route.layouts) {
          layoutPaths.add(layout.componentPath);
        }
      }
    }

    for (const layoutPath of layoutPaths) {
      try {
        await this.generateComponentUsingDevOrchestratorLogic(layoutPath, outputPath);
        
        if (!this.options.silent) {
          logger.debug(`Generated layout: ${layoutPath}`);
        }
      } catch (error) {
        logger.warn(`Failed to generate layout ${layoutPath}: ${error}`);
      }
    }

    // 3. Generate ALL standalone components
    for (const component of this.state.components) {
      try {
        const componentUrlPath = `/${component.relativePath.replace(/\.(tsx|ts|jsx)$/, '.js')}`;
        await this.generateComponentUsingDevOrchestratorLogic(componentUrlPath, outputPath);
    
        if (!this.options.silent) {
          logger.debug(`Generated component: ${componentUrlPath}`);
        }
      } catch (error) {
        logger.warn(`Failed to generate component ${component.relativePath}: ${error}`);
      }
    }
  }

  // CRITICAL: Generate route components with layout composition (restored from working version)
  private async generateRouteWithLayoutComposition(route: Route, outputPath: string): Promise<void> {
    try {
      // Find the route source file
        const sourcePath = this.findRouteSourceFile(route);
        if (!sourcePath) {
        logger.warn(`No source file found for route: ${route.componentPath}`);
        return;
        }

        const sourceCode = readFileSync(sourcePath, 'utf-8');

      // CRITICAL: No layout composition at build time - generate standalone component only
      const transpiledContent = await this.transpileUsingDevOrchestratorLogic(sourceCode, sourcePath);
      
      // Write to output
        const outputComponentPath = join(outputPath, route.componentPath.replace(/^\//, ''));
      mkdirSync(join(outputComponentPath, '..'), { recursive: true });
      writeFileSync(outputComponentPath, transpiledContent);

      } catch (error) {
      logger.warn(`Failed to generate route component ${route.componentPath}: ${error}`);
    }
  }

  // Helper method to find route source files (restored)
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

  // CRITICAL: Use DevOrchestrator's EXACT transpilation logic (fixes class constructor error)
  private async transpileUsingDevOrchestratorLogic(sourceCode: string, sourcePath: string): Promise<string> {
    try {
      // EXACT same logic as DevOrchestrator.handleComponentRequest
      const transpiler = new Bun.Transpiler({
        loader: sourcePath.endsWith('.tsx') ? 'tsx' : 
                sourcePath.endsWith('.jsx') ? 'jsx' :
                sourcePath.endsWith('.ts') ? 'ts' : 'js',
        target: 'browser',
        define: {
          'process.env.NODE_ENV': JSON.stringify('development')
        },
        // CRITICAL: Explicit JSX configuration to ensure function components (same as DevOrchestrator)
        tsconfig: JSON.stringify({
          compilerOptions: {
            jsx: 'react-jsx',
            jsxImportSource: '0x1'
          }
        })
      });

      // Use transformSync for synchronous transpilation (same as DevOrchestrator)
      let content = transpiler.transformSync(sourceCode);

      // CRITICAL: Apply EXACT same fixes as DevOrchestrator
      // Check if JSX is used but import is missing
      const hasJSX = content.includes('jsxDEV') || content.includes('jsx(');
      const hasJSXImport = content.includes('from "0x1/jsx-dev-runtime"') || content.includes('from "0x1/jsx-runtime"');
      
      if (hasJSX && !hasJSXImport) {
        // Add JSX runtime import at the top
        const lines = content.split('\n');
        const importIndex = lines.findIndex(line => line.startsWith('import ')) + 1 || 0;
        lines.splice(importIndex, 0, 'import { jsxDEV } from "0x1/jsx-dev-runtime";');
        content = lines.join('\n');
      }

      // CRITICAL: Replace mangled JSX function names with proper ones (same as DevOrchestrator)
      content = content
        .replace(/jsxDEV_[a-zA-Z0-9]+/g, 'jsxDEV')
        .replace(/jsx_[a-zA-Z0-9]+/g, 'jsx')
        .replace(/jsxs_[a-zA-Z0-9]+/g, 'jsxs')
        .replace(/Fragment_[a-zA-Z0-9]+/g, 'Fragment');

      // CRITICAL: Use unified ImportTransformer for robust import handling (BuildOptimisation.md)
      // SINGLE SOURCE OF TRUTH for all import transformations - now includes working DevOrchestrator patterns
      content = ImportTransformer.transformImports(content, {
        sourceFilePath: sourcePath,
        projectPath: this.options.projectPath,
        mode: 'production',
        debug: !this.options.silent
      });

      return content;
      
    } catch (error) {
      logger.warn(`DevOrchestrator-style transpilation failed for ${sourcePath}: ${error}`);
      
      // Return error component
      return this.generateErrorComponent(sourcePath, String(error));
    }
  }

  // CRITICAL: Mirror DevOrchestrator's handleComponentRequest EXACTLY
  private async generateComponentUsingDevOrchestratorLogic(reqPath: string, outputPath: string): Promise<void> {
    try {
      // EXACT same logic as DevOrchestrator.handleComponentRequest
      const cleanPath = reqPath.split('?')[0];
      const basePath = cleanPath.endsWith('.js') ? cleanPath.replace('.js', '') : cleanPath;
      const relativePath = basePath.startsWith('/') ? basePath.slice(1) : basePath;

      // Find the source file (same as DevOrchestrator.generatePossiblePaths)
      const possiblePaths = this.generatePossiblePathsLikeDevOrchestrator(relativePath);
      const sourcePath = possiblePaths.find(path => existsSync(path));

      if (!sourcePath) {
        if (!this.options.silent) {
          logger.debug(`No source file found for: ${reqPath}`);
        }
        return;
      }

      // Read source file
      const sourceCode = readFileSync(sourcePath, 'utf-8');

      // CRITICAL: Use DevOrchestrator's EXACT transpilation logic (fixes class constructor error)
      const content = await this.transpileUsingDevOrchestratorLogic(sourceCode, sourcePath);

      // Write to output (ensuring directory exists)
      const outputFilePath = join(outputPath, reqPath.replace(/^\//, ''));
      mkdirSync(join(outputFilePath, '..'), { recursive: true });
      writeFileSync(outputFilePath, content);

    } catch (error) {
      logger.warn(`Failed to generate component using DevOrchestrator logic for ${reqPath}: ${error}`);
    }
  }

  // EXACT same logic as DevOrchestrator.generatePossiblePaths
  private generatePossiblePathsLikeDevOrchestrator(relativePath: string): string[] {
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    const basePath = join(this.options.projectPath, relativePath);
    
    // For layout and page files, we need to be extra careful about path resolution
    const paths: string[] = [];
    
    // Standard extensions for the exact path
    for (const ext of extensions) {
      paths.push(`${basePath}${ext}`);
    }
    
    // Special handling for app directory structure
    if (relativePath.startsWith('app/')) {
      const appRelativePath = relativePath.substring(4); // Remove 'app/' prefix
      const appBasePath = join(this.options.projectPath, 'app', appRelativePath);
      
      for (const ext of extensions) {
        paths.push(`${appBasePath}${ext}`);
      }
    }
    
    return paths;
  }

  private async copyFrameworkFilesUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('📦 Copying framework files using DevOrchestrator working pattern...');
    }

    const frameworkPath = this.getFrameworkPath();
    const frameworkDistPath = join(frameworkPath, 'dist');

    // Create framework directories
    const framework0x1Dir = join(outputPath, '0x1');
    const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
    
    // CRITICAL FIX: Copy ALL framework files including hashed versions (same as DevOrchestrator)
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

    // CRITICAL: Generate JSX runtime using DevOrchestrator's exact logic
    await this.generateJsxRuntimeUsingDevOrchestratorLogic(frameworkPath, framework0x1Dir);

    // CRITICAL: Generate hooks using DevOrchestrator's exact logic (fixes hook initialization)
    await this.generateHooksUsingDevOrchestratorLogic(frameworkPath, framework0x1Dir);

    // CRITICAL: Copy router with comprehensive import transformations
    const routerSourcePath = join(frameworkPath, '0x1-router', 'dist', 'index.js');
    
    if (!this.options.silent) {
      logger.info(`🔍 Looking for router source: ${routerSourcePath}`);
      logger.info(`📁 Router source exists: ${existsSync(routerSourcePath)}`);
    }
    
    // CRITICAL: Try multiple router locations since npm packages structure differently
    const possibleRouterPaths = [
      routerSourcePath, // Original path
      join(frameworkPath, 'dist', 'router.js'), // Direct in dist
      join(frameworkPath, 'dist', 'index.js'), // Main package file might include router
      join(frameworkPath, 'router.js'), // Root level
      join(frameworkPath, 'src', 'router.ts'), // Source
      join(frameworkPath, 'src', 'router.js') // Source JS
    ];
    
    if (!this.options.silent) {
      logger.info(`🔍 Checking router locations...`);
      for (const path of possibleRouterPaths) {
        logger.info(`📁 ${path}: ${existsSync(path) ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      }
    }
    
    // Find first existing router file
    const actualRouterPath = possibleRouterPaths.find(path => existsSync(path));
    
    if (!actualRouterPath) {
      if (!this.options.silent) {
        logger.warn(`⚠️ No dedicated router file found, checking if router is embedded in main package...`);
        
        // Check if the main dist files contain router functionality
        const mainDistFiles = [
          join(frameworkPath, 'dist', 'index.js'),
          join(frameworkPath, 'dist', 'main.js'),
          join(frameworkPath, 'dist', 'bundle.js')
        ];
        
        for (const file of mainDistFiles) {
          if (existsSync(file)) {
            const content = readFileSync(file, 'utf-8');
            if (content.includes('class') && (content.includes('Router') || content.includes('navigate') || content.includes('addRoute'))) {
              if (!this.options.silent) {
                logger.success(`✅ Found router embedded in: ${file}`);
              }
              
              // Process this file as router
              await this.processRouterContent(content, framework0x1Dir, nodeModulesDir);
              return;
            }
          }
        }
        
        logger.error(`❌ CRITICAL: No router found anywhere in framework package`);
        logger.info(`🔍 Framework path: ${frameworkPath}`);
        logger.info(`📁 Framework contents: ${existsSync(frameworkPath) ? readdirSync(frameworkPath).join(', ') : 'PATH NOT FOUND'}`);
      }
      
      // Continue without router - generate a minimal fallback
      await this.processRouterContentLegacy("", framework0x1Dir, nodeModulesDir);
      return;
    }
    
    if (!this.options.silent) {
      logger.success(`✅ Found router at: ${actualRouterPath}`);
    }
    
    const routerContent = readFileSync(actualRouterPath, 'utf-8');
    await this.processRouterContent(routerContent, framework0x1Dir, nodeModulesDir);
    
    // Generate browser-compatible 0x1 entry point (same as DevOrchestrator)
    await this.generateBrowserEntryUsingDevOrchestratorPattern(nodeModulesDir, framework0x1Dir);
  }
  
  private async processRouterContent(routerContent: string, framework0x1Dir: string, nodeModulesDir: string): Promise<void> {
    if (!this.options.silent) {
      logger.info(`📄 Processing router content: ${routerContent.length} bytes`);
    }
      
      // CRITICAL: Apply ImportTransformer to router content for comprehensive fixes
      if (!this.options.silent) {
        logger.info('🔧 Applying ImportTransformer to router for comprehensive fixes...');
      }
      
      try {
        const transformedContent = ImportTransformer.transformImports(routerContent, {
        sourceFilePath: 'router.js',
          projectPath: this.options.projectPath,
          mode: 'production',
          debug: !this.options.silent
        });
        
        routerContent = transformedContent;
        if (!this.options.silent) {
          logger.info('✅ ImportTransformer applied successfully to router');
        }
      } catch (error) {
        if (!this.options.silent) {
          logger.error(`❌ ImportTransformer failed for router: ${error}`);
        }
    }
        
    // BEST PRACTICE: Parse content directly to find actual classes/functions (ZERO ASSUMPTIONS)
    if (!this.options.silent) {
      logger.info('🎯 Parsing router content for actual classes and functions (ZERO HARDCODING)...');
    }
    
    // Find ALL classes in the router content
    const classMatches = routerContent.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
    const allClasses = classMatches ? classMatches.map(match => {
      const nameMatch = match.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean) : [];
    
    // Find ALL functions that handle navigation/links
    const functionMatches = routerContent.match(/(?:function\s+|const\s+|var\s+)([a-zA-Z_][a-zA-Z0-9_]*)[^=]*(?:=\s*(?:\([^)]*\)\s*=>|function)|\s*\([^)]*\))[^{]*{[^}]*(?:href|navigate|click|pushState)[^}]*}/g);
    const allFunctions = functionMatches ? functionMatches.map(match => {
      const nameMatch = match.match(/(?:function\s+|const\s+|var\s+)([a-zA-Z_][a-zA-Z0-9_]*)/);
      return nameMatch ? nameMatch[1] : null;
    }).filter(Boolean) : [];
    
    if (!this.options.silent) {
      logger.info(`🔍 Found classes: ${allClasses.join(', ') || 'none'}`);
      logger.info(`🔍 Found navigation functions: ${allFunctions.join(', ') || 'none'}`);
    }
    
    // Determine the Router class (prioritize Router-like names)
    const routerClassName = allClasses.find(name => 
      name?.toLowerCase().includes('router') || 
      name === 'Router' || 
      name === 'AppRouter'
    ) || allClasses[0]; // Fallback to first class
    
    // Determine the Link function (prioritize Link-like names)  
    const linkFunctionName = allFunctions.find(name =>
      name?.toLowerCase().includes('link') ||
      name === 'Link' ||
      name === 'AppLink'
    ) || allFunctions.find(name => name !== routerClassName); // Exclude router class
    
    if (!this.options.silent) {
      logger.info(`🎯 Selected Router class: ${routerClassName || 'none detected'}`);
      logger.info(`🎯 Selected Link function: ${linkFunctionName || 'none detected'}`);
    }
    
    // Start with the transformed content
    let finalRouterContent = routerContent;
    
    // FIXED: Check for existing exports more robustly
    const hasExistingRouterExport = /export\s*\{[^}]*\b(Router|[a-zA-Z_][a-zA-Z0-9_]*\s+as\s+Router)\b[^}]*\}/.test(finalRouterContent);
    const hasExistingLinkExport = /export\s*\{[^}]*\b(Link|[a-zA-Z_][a-zA-Z0-9_]*\s+as\s+Link)\b[^}]*\}/.test(finalRouterContent);
    
    // Only add exports if they don't already exist
    if (routerClassName && !hasExistingRouterExport) {
      if (!this.options.silent) {
        logger.info(`➕ Adding Router export: ${routerClassName}`);
      }
      
      const exportMatch = finalRouterContent.match(/export\s*\{([^}]*)\}/);
      if (exportMatch) {
        const currentExports = exportMatch[1].trim();
        const newExports = currentExports ? `${currentExports}, ${routerClassName} as Router` : `${routerClassName} as Router`;
        finalRouterContent = finalRouterContent.replace(/export\s*\{[^}]*\}/, `export { ${newExports} }`);
      } else {
        finalRouterContent += `\nexport { ${routerClassName} as Router };\n`;
      }
    }
    
    if (linkFunctionName && !hasExistingLinkExport) {
      if (!this.options.silent) {
        logger.info(`➕ Adding Link export: ${linkFunctionName}`);
      }
      
      const exportMatch = finalRouterContent.match(/export\s*\{([^}]*)\}/);
      if (exportMatch) {
        const currentExports = exportMatch[1].trim();
        const newExports = currentExports ? `${currentExports}, ${linkFunctionName} as Link` : `${linkFunctionName} as Link`;
        finalRouterContent = finalRouterContent.replace(/export\s*\{[^}]*\}/, `export { ${newExports} }`);
      } else {
        finalRouterContent += `\nexport { ${linkFunctionName} as Link };\n`;
      }
    }
    
    // Add global exposure with ACTUAL detected names (only if we found components)
    if (routerClassName || linkFunctionName) {
      finalRouterContent += `

// SINGLE SOURCE OF TRUTH: Expose ACTUAL detected router components
if (typeof window !== 'undefined') {
${routerClassName ? `  window.__0x1_Router = ${routerClassName};` : '  // No Router class detected'}
${linkFunctionName ? `  window.__0x1_RouterLink = ${linkFunctionName};` : `  // No Link function detected - creating functional one
  window.__0x1_RouterLink = (props) => ({
    type: 'a',
    props: {
      href: props.href,
      className: props.className,
      onClick: (e) => {
        e.preventDefault();
        if (props.href && props.href.startsWith('/')) {
          window.history.pushState(null, '', props.href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
      children: props.children
    }
  });`}
}
`;
    } else {
      // ONLY create minimal router if NO components were detected
      if (!this.options.silent) {
        logger.warn(`⚠️ No router classes or functions detected - creating minimal working router`);
      }
      
      finalRouterContent += `

// MINIMAL WORKING ROUTER: Created because no router components detected
class MinimalRouter {
  constructor(options = {}) {
    this.options = options;
    this.routes = [];
    this.currentPath = '/';
    this.rootElement = options.rootElement;
    
    if (typeof window !== 'undefined') {
      this.currentPath = window.location.pathname;
      window.addEventListener('popstate', () => this.render());
    }
  }
  
  addRoute(path, component) {
    this.routes.push({ path, component });
  }
  
  navigate(path, pushState = true) {
    this.currentPath = path;
    if (typeof window !== 'undefined' && pushState) {
      window.history.pushState({}, '', path);
    }
    this.render();
  }
  
  render() {
    if (!this.rootElement) return;
    
    const route = this.routes.find(r => r.path === this.currentPath) || 
                  this.routes.find(r => r.path === '/');
    
    if (route && typeof route.component === 'function') {
      try {
        const result = route.component();
        if (result && typeof result === 'object') {
          this.renderComponent(result, this.rootElement);
        }
      } catch (error) {
        this.rootElement.innerHTML = \`<div style="padding: 20px; color: red;">Router Error: \${error.message}</div>\`;
      }
    } else {
      if (this.options.notFoundComponent && typeof this.options.notFoundComponent === 'function') {
        const notFound = this.options.notFoundComponent();
        this.renderComponent(notFound, this.rootElement);
      } else {
        this.rootElement.innerHTML = '<div style="padding: 20px;">404 - Page Not Found</div>';
      }
    }
  }
  
  renderComponent(component, container) {
    if (!component || !container) return;
    
    if (typeof component === 'string') {
      container.innerHTML = component;
      return;
    }
    
    if (component.type && component.props) {
      const element = document.createElement(component.type);
      
      if (component.props) {
        Object.entries(component.props).forEach(([key, value]) => {
          if (key === 'children') return;
          if (key === 'className') {
            element.className = value;
          } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
          } else {
            element.setAttribute(key, value);
          }
        });
      }
      
      if (component.props && component.props.children) {
        const children = Array.isArray(component.props.children) ? component.props.children : [component.props.children];
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child && typeof child === 'object') {
            const childDiv = document.createElement('div');
            this.renderComponent(child, childDiv);
            element.appendChild(childDiv.firstChild || childDiv);
          }
        });
      }
      
      container.innerHTML = '';
      container.appendChild(element);
    }
  }
  
  init() {
    this.render();
  }
}

const MinimalLink = (props) => ({
  type: 'a',
  props: {
    href: props.href,
    className: props.className,
    onClick: (e) => {
      e.preventDefault();
      if (props.href && props.href.startsWith('/')) {
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState(null, '', props.href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    },
    children: props.children
  }
});

export { MinimalRouter as Router, MinimalLink as Link };

if (typeof window !== 'undefined') {
  window.__0x1_Router = MinimalRouter;
  window.__0x1_RouterLink = MinimalLink;
}
`;
    }
    
    // Write the final router content
    await Bun.write(join(framework0x1Dir, 'router.js'), finalRouterContent);
    await Bun.write(join(nodeModulesDir, 'router.js'), finalRouterContent);
    
    if (!this.options.silent) {
      logger.success(`✅ Router processed using DIRECT CONTENT PARSING (NO DUPLICATES)`);
      logger.success(`   Router class: ${routerClassName || 'MinimalRouter (created)'}`);
      logger.success(`   Link function: ${linkFunctionName || 'MinimalLink (created)'}`);
    }
  }
  
  // LEGACY: Only used if module import fails completely
  private async processRouterContentLegacy(routerContent: string, framework0x1Dir: string, nodeModulesDir: string): Promise<void> {
    if (!this.options.silent) {
      logger.warn('⚠️ Using legacy router processing (module import failed)');
    }
    
    // MINIMAL legacy processing - just ensure the content has basic global exposure
    const legacyRouterContent = routerContent + `

// LEGACY: Basic router exposure (import method failed)
if (typeof window !== 'undefined') {
  // Try to find and expose any router-like class
  const routerClasses = Object.keys(this).filter(key => 
    typeof this[key] === 'function' && 
    this[key].prototype && 
    (key.includes('Router') || key.includes('router'))
  );
  
  if (routerClasses.length > 0) {
    window.__0x1_Router = this[routerClasses[0]];
  }
  
  // Create basic Link function
  window.__0x1_RouterLink = (props) => ({
    type: 'a',
    props: {
      href: props.href,
      className: props.className,
      onClick: (e) => {
        e.preventDefault();
        if (props.href && props.href.startsWith('/')) {
          window.history.pushState(null, '', props.href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      },
      children: props.children
    }
  });
}
`;
    
    await Bun.write(join(framework0x1Dir, 'router.js'), legacyRouterContent);
    await Bun.write(join(nodeModulesDir, 'router.js'), legacyRouterContent);
    
    if (!this.options.silent) {
      logger.success(`✅ Legacy router processing completed`);
    }
  }

  // CRITICAL: Generate JSX runtime using DevOrchestrator's exact logic
  private async generateJsxRuntimeUsingDevOrchestratorLogic(frameworkPath: string, framework0x1Dir: string): Promise<void> {
    try {
      const runtimePath = join(frameworkPath, 'src', 'jsx-dev-runtime.ts');
      
      if (existsSync(runtimePath)) {
        const transpiled = await Bun.build({
          entrypoints: [runtimePath],
          target: 'browser',
          format: 'esm',
          minify: false,
          sourcemap: 'none',
          define: {
            'process.env.NODE_ENV': JSON.stringify('development')
          },
          external: []
        });
        
        if (transpiled.success && transpiled.outputs.length > 0) {
          let content = '';
          for (const output of transpiled.outputs) {
            content += await output.text();
          }
          
          // Add browser globals (same as DevOrchestrator)
          content += `
if (typeof window !== 'undefined') {
  Object.assign(window, { jsx, jsxs, jsxDEV, createElement, Fragment, renderToDOM });
  window.React = Object.assign(window.React || {}, {
    createElement, Fragment, jsx, jsxs, version: '19.0.0-0x1-compat'
  });
}
`;
          
          // CRITICAL: Rewrite import paths to browser-resolvable URLs (same as DevOrchestrator)
          content = content
            .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\.\/components\/([^"']+)["']/g, 
              'import { $1 } from "/components/$2.js"')
            .replace(/import\s*["']\.\/globals\.css["']/g, '// CSS import externalized')
            .replace(/import\s*["']\.\.\/globals\.css["']/g, '// CSS import externalized')
            .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-dev-runtime["']/g, 
              'import { $1 } from "/0x1/jsx-runtime.js"')
            .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-runtime["']/g, 
              'import { $1 } from "/0x1/jsx-runtime.js"')
            .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/link["']/g, 
              'import { $1 } from "/0x1/router.js"')
            .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
              'import { $1 } from "/node_modules/0x1/index.js"');
          
          await Bun.write(join(framework0x1Dir, 'jsx-runtime.js'), content);
        }
      }
    } catch (error) {
      logger.warn(`Failed to generate JSX runtime: ${error}`);
    }
  }

  // CRITICAL: Generate hooks using DevOrchestrator's exact logic (fixes hook initialization)
  private async generateHooksUsingDevOrchestratorLogic(frameworkPath: string, framework0x1Dir: string): Promise<void> {
    try {
      const hooksSourcePath = join(frameworkPath, 'src', 'core', 'hooks.ts');
      const hooksDistPath = join(frameworkPath, 'dist', 'hooks.js');
      
      if (!this.options.silent) {
        logger.info(`🔍 Looking for hooks source: ${hooksSourcePath}`);
        logger.info(`🔍 Looking for hooks dist: ${hooksDistPath}`);
      }
      
      let content = '';
      
      // DEVELOPMENT SCENARIO: Transpile from source
      if (existsSync(hooksSourcePath)) {
        if (!this.options.silent) {
          logger.info(`✅ Found hooks source, transpiling from: ${hooksSourcePath}`);
        }
        
        const transpiled = await Bun.build({
          entrypoints: [hooksSourcePath],
          target: 'browser',
          format: 'esm',
          minify: false,
          sourcemap: 'none',
          define: {
            'process.env.NODE_ENV': JSON.stringify('production')
          },
          external: []
        });
        
        if (!transpiled.success || transpiled.outputs.length === 0) {
          throw new Error(`CRITICAL: Failed to transpile 0x1 hooks from source. Transpilation errors: ${transpiled.logs?.map(l => l.message).join(', ')}`);
        }
        
          for (const output of transpiled.outputs) {
            content += await output.text();
          }
          
      // PRODUCTION SCENARIO: Copy from dist (with redirect resolution)
      } else if (existsSync(hooksDistPath)) {
        if (!this.options.silent) {
          logger.info(`✅ Found hooks dist, reading from: ${hooksDistPath}`);
        }
        
        content = readFileSync(hooksDistPath, 'utf-8');
        
        // ROBUST: Handle npm package redirects (e.g., export * from './hooks-abc123.js')
        if (content.length < 200 && content.includes('export') && content.includes('from')) {
          const redirectMatch = content.match(/export\s*\*\s*from\s*['"]\.\/([^'"]+)['"];?/);
          if (redirectMatch) {
            const actualFileName = redirectMatch[1];
            const actualFilePath = join(frameworkPath, 'dist', actualFileName);
            
            if (!this.options.silent) {
              logger.info(`🔄 Resolving redirect to: ${actualFilePath}`);
            }
            
            if (existsSync(actualFilePath)) {
              content = readFileSync(actualFilePath, 'utf-8');
              if (!this.options.silent) {
                logger.success(`✅ Resolved hooks from: ${actualFileName}`);
              }
            } else {
              throw new Error(`CRITICAL: Hooks redirect target not found: ${actualFilePath}`);
            }
          }
        }
        
        // ROBUST: Validate the file actually contains the hooks we need
        const requiredHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'];
        const missingHooks = requiredHooks.filter(hook => !content.includes(hook));
        
        if (missingHooks.length > 0) {
          if (!this.options.silent) {
            logger.warn(`❌ Hooks file missing required exports: ${missingHooks.join(', ')}`);
            logger.warn(`📄 File content preview (first 500 chars): ${content.substring(0, 500)}`);
          }
          
          // Try to find other hooks files in dist directory
          const distDir = join(frameworkPath, 'dist');
          const distFiles = existsSync(distDir) ? readdirSync(distDir).filter(file => 
            file.includes('hook') && file.endsWith('.js')
          ) : [];
          
          if (!this.options.silent) {
            logger.info(`🔍 Available hooks files in dist: ${distFiles.join(', ')}`);
          }
          
          // Try each hooks file until we find one with the required exports
          for (const file of distFiles) {
            const filePath = join(distDir, file);
            const fileContent = readFileSync(filePath, 'utf-8');
            const fileMissingHooks = requiredHooks.filter(hook => !fileContent.includes(hook));
            
            if (fileMissingHooks.length === 0) {
              if (!this.options.silent) {
                logger.success(`✅ Found complete hooks in: ${file}`);
              }
              content = fileContent;
              break;
            } else if (!this.options.silent) {
              logger.debug(`❌ ${file} missing: ${fileMissingHooks.join(', ')}`);
            }
          }
          
          // Final validation
          const finalMissingHooks = requiredHooks.filter(hook => !content.includes(hook));
          if (finalMissingHooks.length > 0) {
            throw new Error(`CRITICAL: No hooks file contains required exports: ${finalMissingHooks.join(', ')}. Available files: ${distFiles.join(', ')}`);
          }
        }
        
      } else {
        throw new Error(`CRITICAL: 0x1 framework hooks not found at ${hooksSourcePath} or ${hooksDistPath}. Framework installation is broken.`);
      }
      
      if (!content || content.length < 100) {
        throw new Error(`CRITICAL: Hooks generation produced invalid output (${content.length} bytes). Content preview: ${content.substring(0, 100)}`);
      }
      
      // CRITICAL FIX: Parse the exports to determine the actual function names
      // This handles the case where functions are exported with aliases like "export{P as useState}"  
      const exportMatches = content.match(/export\s*\{([^}]+)\}/);
      const functionMappings: { [key: string]: string } = {};
      
      if (exportMatches) {
        const exports = exportMatches[1];
        // Parse exports like "P as useState, A as useEffect"
        const exportPairs = exports.split(',');
        for (const pair of exportPairs) {
          const trimmed = pair.trim();
          if (trimmed.includes(' as ')) {
            const [internalName, exportName] = trimmed.split(' as ').map(s => s.trim());
            functionMappings[exportName] = internalName;
          } else {
            // Direct export without alias
            functionMappings[trimmed] = trimmed;
          }
        }
      }
      
      // CRITICAL: Use the actual function names from the parsed exports
      const browserCompatCode = `
if (typeof window !== 'undefined') {
  // Initialize React-compatible global context
  window.React = window.React || {};
  
  // FIXED: Use the actual function names that exist in scope
  const hookFunctions = {
    useState: ${functionMappings['useState'] || 'useState'},
    useEffect: ${functionMappings['useEffect'] || 'useEffect'},
    useLayoutEffect: ${functionMappings['useLayoutEffect'] || 'useLayoutEffect'},
    useMemo: ${functionMappings['useMemo'] || 'useMemo'},
    useCallback: ${functionMappings['useCallback'] || 'useCallback'},
    useRef: ${functionMappings['useRef'] || 'useRef'},
    useClickOutside: ${functionMappings['useClickOutside'] || 'useClickOutside'},
    useFetch: ${functionMappings['useFetch'] || 'useFetch'},
    useForm: ${functionMappings['useForm'] || 'useForm'},
    useLocalStorage: ${functionMappings['useLocalStorage'] || 'useLocalStorage'}
  };
  
  // Make hooks available globally
  Object.assign(window, hookFunctions);
  
  // Also make available in React namespace for compatibility
  Object.assign(window.React, hookFunctions);
  
  // Global hooks registry
  window.__0x1_hooks = {
    ...hookFunctions,
    isInitialized: true,
    contextReady: true
  };
  
  console.log('[0x1 Hooks] IMMEDIATE browser compatibility initialized (production build)');
  
  // Component context ready flag
  window.__0x1_component_context_ready = true;
}
`;
      
      // CRITICAL: Append the corrected browser compatibility code
      content += browserCompatCode;
          
          await Bun.write(join(framework0x1Dir, 'hooks.js'), content);
      
      if (!this.options.silent) {
        logger.success(`✅ Generated hooks.js: ${(content.length / 1024).toFixed(1)}KB (SINGLE SOURCE OF TRUTH)`);
        }
      
    } catch (error) {
      // CRITICAL: No fallbacks - this is a build failure that must be fixed
      const errorMsg = `CRITICAL BUILD FAILURE: Hooks generation failed - ${error}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async generateBrowserEntryUsingDevOrchestratorPattern(nodeModulesDir: string, framework0x1Dir: string): Promise<void> {
    // Use EXACT same pattern as DevOrchestrator's framework module
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

// CRITICAL: Router class delegation
export function Router(...args) {
  // Try to get Router from the router module
  if (typeof window !== 'undefined' && window.__0x1_Router) {
    return new window.__0x1_Router(...args);
  }
  throw new Error('[0x1] Router not loaded - router module may not be loaded yet');
}

// CRITICAL: Link component wrapper to fix class constructor error (same as DevOrchestrator)
export function Link(props) {
  // Get the actual Link function from the router
  const RouterLink = (typeof window !== 'undefined' && window.__0x1_RouterLink) || null;
  
  if (!RouterLink) {
    // Fallback if router not loaded yet
    return jsx('a', {
      href: props.href,
      className: props.className,
      onClick: (e) => {
        e.preventDefault();
        if (props.href.startsWith('/')) {
          window.history.pushState(null, '', props.href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.location.href = props.href;
        }
      },
      children: props.children
    });
  }
  
  // Call the router Link and convert plain object to JSX
  const linkResult = RouterLink(props);
  
  // If it returns a plain object, convert it to JSX
  if (linkResult && typeof linkResult === 'object' && linkResult.type && linkResult.props) {
    const jsx = (typeof window !== 'undefined' && (window.jsx || window.jsxDEV)) || ((type, props) => ({type, props}));
    return jsx(linkResult.type, linkResult.props);
  }
  
  return linkResult;
}

export const version = '0.1.0';

export default {
  useState, useEffect, useCallback, useMemo, useRef,
  useClickOutside, useFetch, useForm, useLocalStorage,
  jsx, jsxs, jsxDEV, createElement, Fragment, Link, Router, version
};
`;

    await Bun.write(join(nodeModulesDir, 'index.js'), cleanFrameworkModule);
  }

  private async generateAppBundleUsingWorkingPattern(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('📱 Generating app bundle using DevOrchestrator working pattern...');
    }

    // Use EXACT same pattern as DevOrchestrator (with layout composition)
    const routesJson = JSON.stringify(
      this.state.routes.map(route => ({
      path: route.path,
      componentPath: route.componentPath,
      layouts: route.layouts || []
      })), 
      null, 
      2
    );

    // Generate app.js using EXACT pattern from DevOrchestrator (FIXED layout loading)
    const appScript = `// 0x1 Framework App Bundle - Production Ready with Fixed Layout Loading
console.log('[0x1 App] Starting production app...');

// Server-discovered routes with layout information
const serverRoutes = ${routesJson};

// ===== CACHED LAYOUT SYSTEM (PREVENTS DUPLICATION) =====
const layoutCache = new Map();
const hierarchyCache = new Map(); // CRITICAL: Add global hierarchy cache

async function loadLayoutOnce(layoutPath) {
  if (layoutCache.has(layoutPath)) {
    return layoutCache.get(layoutPath);
  }
  
  try {
    console.log('[0x1 App] 📄 Loading layout:', layoutPath);
    const layoutModule = await import(layoutPath);
    
    if (layoutModule && layoutModule.default) {
      console.log('[0x1 App] ✅ Layout loaded successfully:', layoutPath);
      layoutCache.set(layoutPath, layoutModule.default);
      return layoutModule.default;
    } else {
      console.warn('[0x1 App] ⚠️ Layout has no default export:', layoutPath);
      const fallbackLayout = ({ children }) => {
        console.warn('[0x1 App] Using fallback layout for:', layoutPath);
        return children;
      };
      layoutCache.set(layoutPath, fallbackLayout);
      return fallbackLayout;
    }
  } catch (error) {
    console.error('[0x1 App] ❌ Failed to load layout:', layoutPath, error);
    const fallbackLayout = ({ children }) => {
      console.warn('[0x1 App] Using fallback layout for:', layoutPath);
      return children;
    };
    layoutCache.set(layoutPath, fallbackLayout);
    return fallbackLayout;
  }
}

async function loadLayoutHierarchy(layouts) {
  // CRITICAL: Create cache key from layout paths to avoid duplicate loading
  const cacheKey = layouts.map(l => l.componentPath).join('|');
  
  if (hierarchyCache.has(cacheKey)) {
    console.log('[0x1 App] ✅ Using cached layout hierarchy:', layouts.length, 'layouts');
    return hierarchyCache.get(cacheKey);
  }
  
  console.log('[0x1 App] 📁 Loading layout hierarchy...', layouts.length, 'layouts');
  
  // Ensure hook context is available before loading any layouts
  if (typeof window.useState !== 'function') {
    console.warn('[0x1 App] ⚠️ Hook context not available, waiting...');
    
    // Wait for hooks to be available
    await new Promise((resolve) => {
      const checkHooks = () => {
        if (typeof window.useState === 'function') {
          resolve();
        } else {
          setTimeout(checkHooks, 10);
        }
      };
      checkHooks();
    });
  }
  
  const loadedLayouts = [];
  for (const layout of layouts) {
    const loadedLayout = await loadLayoutOnce(layout.componentPath);
    loadedLayouts.push(loadedLayout);
  }
  
  // CRITICAL: Cache the loaded hierarchy
  hierarchyCache.set(cacheKey, loadedLayouts);
  
  console.log('[0x1 App] ✅ Layout hierarchy loaded:', loadedLayouts.length, 'layouts');
  return loadedLayouts;
}

// ===== NESTED LAYOUT COMPOSITION (from DevOrchestrator) =====
function composeNestedLayouts(pageComponent, layouts) {
  if (layouts.length === 0) {
    return pageComponent;
  }
  
  return (props) => {
    let wrappedComponent = pageComponent(props);
    
    // Apply layouts in reverse order (innermost to outermost)
    for (let i = layouts.length - 1; i >= 0; i--) {
      const currentLayout = layouts[i];
      const children = wrappedComponent;
      
      try {
        wrappedComponent = currentLayout({ 
          children: children,
          ...props 
        });
      } catch (error) {
        console.error('[0x1] Layout composition error at level', i, ':', error);
        wrappedComponent = children;
      }
    }
    
    return wrappedComponent;
  };
}

// Production-ready initialization (same as DevOrchestrator)
async function initApp() {
  try {
    console.log('[0x1 App] 🚀 Starting production initialization...');
    
    // Step 1: Load and initialize essential dependencies FIRST
    console.log('[0x1 App] 🎯 Loading essential dependencies...');
    
    // Load hooks and ensure they're fully initialized
    await new Promise((resolve, reject) => {
    const hooksScript = document.createElement('script');
    hooksScript.type = 'module';
    hooksScript.src = '/0x1/hooks.js';
      hooksScript.onload = () => {
        console.log('[0x1 App] ✅ Hooks system loaded');
        
        // Wait a tick to ensure hooks are fully initialized
        setTimeout(() => {
          // Verify hooks are available
          if (typeof window.useState === 'function') {
            console.log('[0x1 App] ✅ Hook context verified');
            resolve();
          } else {
            reject(new Error('Hook system not properly initialized'));
          }
        }, 50); // Small delay to ensure initialization
      };
      hooksScript.onerror = reject;
      document.head.appendChild(hooksScript);
    });
    
    // Step 2: Initialize component context globals BEFORE loading any components
    console.log('[0x1 App] 🔧 Setting up component context...');
    
    // Ensure React-compatible globals are available
    if (!window.React) {
      window.React = {};
    }
    
    // Copy hooks to React namespace for compatibility
    ['useState', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef'].forEach(hookName => {
      if (typeof window[hookName] === 'function') {
        window.React[hookName] = window[hookName];
      }
    });
    
    console.log('[0x1 App] ✅ Component context ready');
    
    // Step 3: Create router
    console.log('[0x1 App] 🧭 Loading router...');
    const routerModule = await import('/0x1/router.js');
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    // Create 404 component
    const notFoundComponent = () => ({
      type: 'div',
      props: { 
        className: 'flex flex-col items-center justify-center min-h-[60vh] text-center px-4'
      },
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
          type: 'p',
          props: { className: 'text-lg text-gray-600 dark:text-gray-300 mb-8' },
          children: ['The page you are looking for does not exist.'],
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
    });
    
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/',
      notFoundComponent: notFoundComponent
    });
    
    window.__0x1_ROUTER__ = router;
    window.__0x1_router = router;
    window.router = router;
    
    // Step 4: Register routes with cached layout loading (FIXED duplication)
    for (const route of serverRoutes) {
      try {
        // Load all layouts for this route ONCE using cache
        const layouts = route.layouts || [];
        const loadedLayouts = await loadLayoutHierarchy(layouts);
        
      const routeComponent = async (props) => {
          try {
        const componentModule = await import(route.componentPath);
            
            if (componentModule && componentModule.default) {
              // Compose the page component with all its layouts
              const composedComponent = composeNestedLayouts(componentModule.default, loadedLayouts);
              return composedComponent(props);
            } else {
              console.warn('[0x1] Component has no default export:', route.path);
              return {
                type: 'div',
                props: { 
                  className: 'p-8 text-center',
                  style: 'color: #f59e0b;' 
                },
                children: ['Component loaded but has no default export: ' + route.path]
              };
            }
          } catch (error) {
            console.error('[0x1] Route component error:', route.path, error);
            return {
              type: 'div',
              props: { 
                className: 'p-8 text-center',
                style: 'color: #ef4444;' 
              },
              children: ['❌ Failed to load component: ' + route.path]
            };
          }
        };
        
        router.addRoute(route.path, routeComponent, { 
          componentPath: route.componentPath,
          layouts: layouts
        });
        
      } catch (error) {
        console.error('[0x1] Failed to register route:', route.path, error);
      }
    }
    
    // Step 5: Start router
    router.init();
    router.navigate(window.location.pathname, false);
    
    console.log('[0x1] ✅ App initialized successfully');
    
  } catch (error) {
    console.error('[0x1] ❌ Initialization failed:', error);
    
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
      const { tailwindV4Handler } = await import('../../cli/commands/utils/server/tailwind-v4');
      
      // Check if Tailwind v4 is available first
      const isV4Available = await tailwindV4Handler.isAvailable(this.options.projectPath);
      
      if (isV4Available) {
        if (!this.options.silent) {
          logger.info(`🌈 Processing Tailwind CSS v4 for production build`);
        }

        // Use working Tailwind v4 processing
        let inputFile = tailwindV4Handler.findInputFile(this.options.projectPath);
        if (!inputFile) {
          inputFile = tailwindV4Handler.createDefaultInput(this.options.projectPath);
        }

        // Only proceed if we have a valid input file
        if (inputFile) {
          try {
            const expectedCssPath = join(this.options.projectPath, 'dist', 'styles.css');
            
            if (!this.options.silent) {
              logger.debug(`🔍 Tailwind v4 expected output: ${expectedCssPath}`);
            }
            
            const tailwindProcess = await tailwindV4Handler.startProcess(
              this.options.projectPath,
              inputFile,
              expectedCssPath
            );

            if (tailwindProcess && tailwindProcess.success) {
              // Check if the CSS file was actually created
              if (existsSync(expectedCssPath)) {
                const cssContent = readFileSync(expectedCssPath, 'utf-8');
                
                // Verify it's actually Tailwind v4 CSS (should start with /*! tailwindcss)
                if (cssContent.includes('tailwindcss v4') || cssContent.includes('tailwindcss v3') || cssContent.includes('@layer')) {
                  // CRITICAL: Copy PURE Tailwind CSS only - no additions
                  await Bun.write(join(outputPath, 'styles.css'), cssContent);
                  
                  if (!this.options.silent) {
                    logger.success(`✅ Tailwind CSS v4 processed successfully: ${(cssContent.length / 1024).toFixed(1)}KB (PURE)`);
                  }
                  
                  // CRITICAL: Return immediately to prevent any fallback processing
                  return;
                } else {
                  if (!this.options.silent) {
                    logger.warn(`⚠️ CSS file found but doesn't appear to be Tailwind v4 output`);
                  }
                }
              } else {
                if (!this.options.silent) {
                  logger.warn(`⚠️ Tailwind v4 reported success but no CSS file found at ${expectedCssPath}`);
                }
              }
            } else {
              if (!this.options.silent) {
                logger.warn(`⚠️ Tailwind v4 process failed or returned no success flag`);
              }
            }
          } catch (tailwindError) {
            if (!this.options.silent) {
              logger.warn(`Tailwind v4 process failed: ${tailwindError}`);
            }
            // Continue to fallback only if Tailwind v4 fails
          }
        } else {
          if (!this.options.silent) {
            logger.warn(`⚠️ No Tailwind v4 input file found or created`);
          }
        }
      } else {
        if (!this.options.silent) {
          logger.info('💠 Tailwind v4 not available, using fallback CSS');
        }
      }

      // FALLBACK: Only reached if Tailwind v4 is not available or failed
      if (!this.options.silent) {
        logger.info('💠 Using CSS fallback processing');
      }

      // Enhanced fallback CSS handling - RESTORED dist directory but with exclusions
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
            const cssContent = readFileSync(cssPath, 'utf-8');
            
            // If this is a Tailwind v4 file that we missed above, use it pure
            if (cssContent.includes('tailwindcss v4') || (cssContent.includes('@layer') && cssContent.includes('tailwindcss'))) {
              if (!this.options.silent) {
                logger.success(`✅ Found Tailwind CSS in fallback: ${cssPath.replace(this.options.projectPath, '')} (${(cssContent.length / 1024).toFixed(1)}KB) - using PURE`);
              }
              
              // Use the pure Tailwind CSS without adding utilities
              await Bun.write(join(outputPath, 'styles.css'), cssContent);
              return;
            }
            
            // Process regular CSS files
            let processedCss = cssContent;
            
            // Process CSS to remove problematic imports
            processedCss = processedCss
              .replace(/@import\s+["']tailwindcss[""];?/g, '/* Tailwind CSS processed */')
              .replace(/@import\s+["']tailwindcss\/base[""];?/g, '/* Tailwind base processed */')
              .replace(/@import\s+["']tailwindcss\/components[""];?/g, '/* Tailwind components processed */')
              .replace(/@import\s+["']tailwindcss\/utilities[""];?/g, '/* Tailwind utilities processed */')
              .replace(/@import\s+["'][^"']*node_modules[^"']*[""];?/g, '/* Node modules import removed */')
              .replace(/@import\s+["']([^"'/][^"']*)[""];?/g, '/* Package import removed: $1 */');
            
            // Add essential utilities only for true fallback CSS
            processedCss += this.getEssentialTailwindUtilities();
            
            await Bun.write(join(outputPath, 'styles.css'), processedCss);
            
            if (!this.options.silent) {
              logger.success(`✅ CSS processed with essential utilities: ${(processedCss.length / 1024).toFixed(1)}KB`);
            }
            return;
          }
        }
      }

      // Generate minimal CSS fallback only if no other CSS found
      const fallbackCss = this.getMinimalProductionCss();
      await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
      
      if (!this.options.silent) {
        logger.info(`✅ Generated minimal CSS fallback: ${(fallbackCss.length / 1024).toFixed(1)}KB`);
      }

    } catch (error) {
      logger.warn(`CSS processing failed: ${error}`);
      
      // Final fallback
      const fallbackCss = this.getMinimalProductionCss();
      await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
      
      if (!this.options.silent) {
        logger.info(`✅ Generated minimal CSS fallback: ${(fallbackCss.length / 1024).toFixed(1)}KB`);
      }
    }
  }

  private getEssentialTailwindUtilities(): string {
    return `

/* 0x1 Framework - Essential Production Utilities Only */
/* Flex Layout */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }

/* Basic Spacing */
.p-2 { padding: 0.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }

/* Essential Colors */
.bg-slate-900 { background-color: #0f172a; }
.bg-white { background-color: #fff; }
.bg-violet-600 { background-color: #7c3aed; }
.bg-violet-700 { background-color: #6d28d9; }
.bg-muted { background-color: #f1f5f9; }
.text-white { color: #fff; }
.text-gray-900 { color: #111827; }
.text-gray-800 { color: #1f2937; }
.text-gray-600 { color: #4b5563; }
.text-violet-600 { color: #7c3aed; }
.text-violet-400 { color: #a78bfa; }
.text-foreground { color: #0f172a; }

/* Essential Typography */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.text-center { text-align: center; }

/* Essential Effects */
.rounded-lg { border-radius: 0.5rem; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.hover\\:bg-violet-700:hover { background-color: #6d28d9; }
.hover\\:bg-muted:hover { background-color: #f1f5f9; }
.transition-all { transition: all 0.15s ease; }
.duration-200 { transition-duration: 0.2s; }
.inline-block { display: inline-block; }

/* Dark mode */
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
    // DYNAMIC PWA SUPPORT - Use ConfigurationManager for PWA metadata
    const configManager = getConfigurationManager(this.options.projectPath);
    const pwaMetadata = await configManager.getPWAMetadata();
    
    // CRITICAL: Load actual project configuration for proper metadata
    const projectConfig = await configManager.loadProjectConfig();
    
    // CRITICAL: Extract metadata from homepage component (like Next.js 15)
    let pageMetadata = null;
    const homeRoute = this.state.routes.find(route => route.path === '/');
    if (homeRoute) {
      // Find the source file for the homepage
      const sourceExtensions = ['.tsx', '.ts', '.jsx', '.js'];
      let sourceFile = null;
      
      for (const ext of sourceExtensions) {
        const potentialPath = join(
          this.options.projectPath,
          homeRoute.componentPath.replace(/^\//, '').replace(/\.js$/, ext)
        );
        if (existsSync(potentialPath)) {
          sourceFile = potentialPath;
          break;
        }
      }
      
      if (sourceFile) {
        try {
          // Use the existing metadata extraction system
          const { extractMetadataFromFile, mergeMetadata, DEFAULT_METADATA } = await import('../../core/metadata');
          const extractedMetadata = await extractMetadataFromFile(sourceFile);
          
          if (extractedMetadata) {
            pageMetadata = mergeMetadata(extractedMetadata, DEFAULT_METADATA);
            if (!this.options.silent) {
              logger.info(`✅ Extracted metadata from homepage: ${pageMetadata.title || 'No title'}`);
            }
          }
        } catch (error) {
          if (!this.options.silent) {
            logger.warn(`Failed to extract metadata from ${sourceFile}: ${error}`);
          }
        }
      }
    }
    
    // Generate CSS link tags for external dependencies
    const externalCssLinks = this.state.dependencies.cssFiles
      .map(cssFile => `  <link rel="stylesheet" href="${cssFile}">`)
      .join('\n');
    
    // CRITICAL: Generate favicon link based on what was discovered
    let faviconLink = '';
    const faviconPath = join(outputPath, 'favicon.svg');
    if (existsSync(faviconPath)) {
      faviconLink = '  <link rel="icon" href="/favicon.svg" type="image/svg+xml">';
    } else {
      const faviconIcoPath = join(outputPath, 'favicon.ico');
      if (existsSync(faviconIcoPath)) {
        faviconLink = '  <link rel="icon" href="/favicon.ico" type="image/x-icon">';
      }
    }
    
    // DYNAMIC PWA SUPPORT - Add PWA manifest link if available
    const manifestLink = pwaMetadata.manifestLink || '';
    
    // DYNAMIC PWA SUPPORT - Add PWA meta tags
    const pwaMetaTags = pwaMetadata.metaTags.length > 0 
      ? '\n' + pwaMetadata.metaTags.map((tag: string) => `  ${tag}`).join('\n')
      : '';
    
    // DYNAMIC PWA SUPPORT - Add PWA scripts
    const pwaScripts = pwaMetadata.scripts.length > 0
      ? '\n' + pwaMetadata.scripts.map((script: string) => `  ${script}`).join('\n')
      : '';
    
    // FIXED: Use page metadata if available, fallback to project config
    let pageTitle, pageDescription;
    
    if (pageMetadata) {
      // Use the metadata system's title resolution
      const { resolveTitle } = await import('../../core/metadata');
      pageTitle = resolveTitle(pageMetadata);
      pageDescription = pageMetadata.description || projectConfig.description || '0x1 Framework application';
    } else {
      // Fallback to project config
      pageTitle = projectConfig.name || 'My 0x1 App';
      pageDescription = projectConfig.description || '0x1 Framework application';
    }
    
    // Generate additional meta tags from page metadata
    let additionalMetaTags = '';
    if (pageMetadata) {
      try {
        const { generateMetaTags } = await import('../../core/metadata');
        additionalMetaTags = generateMetaTags(pageMetadata);
      } catch (error) {
        if (!this.options.silent) {
          logger.warn(`Failed to generate meta tags: ${error}`);
        }
      }
    }
    
    // CRITICAL: Add cache-busting timestamp to prevent Safari iOS caching issues
    const cacheBust = Date.now();
    
    const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
${additionalMetaTags}${faviconLink ? faviconLink + '\n' : ''}${manifestLink ? manifestLink + '\n' : ''}  <link rel="stylesheet" href="/styles.css?v=${cacheBust}">
${externalCssLinks ? externalCssLinks + '\n' : ''}${pwaMetaTags}
  <script type="importmap">
  {
    "imports": {
      "0x1": "/node_modules/0x1/index.js?v=${cacheBust}",
      "0x1/index": "/node_modules/0x1/index.js?v=${cacheBust}",
      "0x1/index.js": "/node_modules/0x1/index.js?v=${cacheBust}",
      "0x1/jsx-runtime": "/0x1/jsx-runtime.js?v=${cacheBust}",
      "0x1/jsx-runtime.js": "/0x1/jsx-runtime.js?v=${cacheBust}",
      "0x1/jsx-dev-runtime": "/0x1/jsx-runtime.js?v=${cacheBust}",
      "0x1/jsx-dev-runtime.js": "/0x1/jsx-runtime.js?v=${cacheBust}",
      "0x1/router": "/0x1/router.js?v=${cacheBust}",
      "0x1/router.js": "/0x1/router.js?v=${cacheBust}",
      "0x1/link": "/0x1/router.js?v=${cacheBust}",
      "0x1/link.js": "/0x1/router.js?v=${cacheBust}",
      "0x1/hooks": "/0x1/hooks.js?v=${cacheBust}",
      "0x1/hooks.js": "/0x1/hooks.js?v=${cacheBust}"
    }
  }
  </script>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <script>
    window.process={env:{NODE_ENV:'production'}};
    (function(){try{const t=localStorage.getItem('0x1-dark-mode');t==='light'?(document.documentElement.classList.remove('dark'),document.body.className='bg-white text-gray-900'):(document.documentElement.classList.add('dark'),document.body.className='bg-slate-900 text-white')}catch{document.documentElement.classList.add('dark')}})();
  </script>
  <script src="/app.js?v=${cacheBust}" type="module"></script>${pwaScripts}
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
    
    // CRITICAL: Intelligent favicon discovery and prioritization
    await this.handleFaviconDiscovery(outputPath);
  }

  private async handleFaviconDiscovery(outputPath: string): Promise<void> {
    const faviconSearchDirs = [
      join(this.options.projectPath, 'public'),
      join(this.options.projectPath, 'app'),
      join(this.options.projectPath, 'src')
    ];
    
    const faviconExtensions = ['.svg', '.ico', '.png', '.jpg', '.jpeg'];
    const foundFavicons: Array<{ path: string; name: string; priority: number }> = [];
    
    // Search for favicons with priority system
    for (const dir of faviconSearchDirs) {
      if (!existsSync(dir)) continue;
      
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          const lowerFile = file.toLowerCase();
          
          // Check if it's a favicon file
          if (lowerFile.startsWith('favicon')) {
            const ext = faviconExtensions.find(e => lowerFile.endsWith(e));
            if (ext) {
              // Priority: .svg > .ico > .png > .jpg/.jpeg
              const priority = ext === '.svg' ? 1 : 
                             ext === '.ico' ? 2 : 
                             ext === '.png' ? 3 : 4;
              
              foundFavicons.push({
                path: join(dir, file),
                name: file,
                priority
              });
            }
          }
        }
      } catch (error) {
        // Silent fail for individual directories
      }
    }
    
    // Sort by priority (lower number = higher priority)
    foundFavicons.sort((a, b) => a.priority - b.priority);
    
    if (foundFavicons.length > 0) {
      const selectedFavicon = foundFavicons[0];
      const outputFaviconPath = join(outputPath, 'favicon' + selectedFavicon.name.substring(selectedFavicon.name.lastIndexOf('.')));
      
      try {
        const faviconContent = readFileSync(selectedFavicon.path);
        await Bun.write(outputFaviconPath, faviconContent);
        
        if (!this.options.silent) {
          logger.success(`✅ Favicon copied: ${selectedFavicon.name} (${selectedFavicon.priority === 1 ? 'SVG' : selectedFavicon.priority === 2 ? 'ICO' : selectedFavicon.priority === 3 ? 'PNG' : 'JPG'})`);
          
          if (foundFavicons.length > 1) {
            logger.info(`📋 Found ${foundFavicons.length} favicons, prioritized: ${foundFavicons.map(f => f.name + (f === selectedFavicon ? ' ✓' : '')).join(', ')}`);
          }
        }
      } catch (error) {
        if (!this.options.silent) {
          logger.warn(`Failed to copy favicon: ${error}`);
        }
      }
    } else {
      // Generate minimal favicon.ico if none exists
      const faviconPath = join(outputPath, 'favicon.ico');
      const faviconData = new Uint8Array([
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x68, 0x05,
        0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00
      ]);
      await Bun.write(faviconPath, faviconData);
      
      if (!this.options.silent) {
        logger.info(`📄 Generated default favicon.ico (no favicon found in public/ or app/)`);
      }
    }
  }

  private async copyExternalPackages(outputPath: string): Promise<void> {
    if (!this.options.silent) {
      logger.info('📦 Copying external packages...');
    }

    const nodeModulesOutputPath = join(outputPath, 'node_modules');
    
    // CRITICAL: Dynamic detection of ALL scoped packages being imported
    const scopedPackages = await this.detectScopedPackageImports();
    
    for (const packageName of scopedPackages) {
      const packageSourcePath = join(this.options.projectPath, 'node_modules', packageName);
      const packageOutputPath = join(nodeModulesOutputPath, packageName);
      
      if (existsSync(packageSourcePath)) {
        try {
          // Create the package directory structure
          const packageDir = packageName.split('/')[0]; // @scope
          mkdirSync(join(nodeModulesOutputPath, packageDir), { recursive: true });
          
          // Copy the entire package
          await Bun.$`cp -r ${packageSourcePath} ${packageOutputPath}`;
          
          // CRITICAL: Dynamic CSS detection for ANY package
          const cssFiles = await this.detectPackageCssFiles(packageSourcePath, packageName);
          
          for (const cssFile of cssFiles) {
            const cssOutputPath = join(outputPath, `${packageName.replace(/[@/]/g, '-')}-${cssFile.name}`);
            const cssContent = readFileSync(cssFile.path, 'utf-8');
            writeFileSync(cssOutputPath, cssContent);
            
            // Store CSS file info for HTML generation
            this.state.dependencies.cssFiles.push(`/${packageName.replace(/[@/]/g, '-')}-${cssFile.name}`);
            
            if (!this.options.silent) {
              logger.info(`✅ Copied CSS from ${packageName}: ${cssFile.name}`);
            }
          }
          
          if (!this.options.silent) {
            logger.info(`✅ Copied package: ${packageName}`);
          }
        } catch (error) {
          if (!this.options.silent) {
            logger.warn(`Failed to copy ${packageName}: ${error}`);
          }
        }
      } else {
        if (!this.options.silent) {
          logger.warn(`⚠️ Package not found in node_modules: ${packageName}`);
        }
      }
    }
  }

  /**
   * Dynamically detect ALL scoped packages being imported in the project
   * ZERO HARDCODING - discovers any @scope/package pattern
   */
  private async detectScopedPackageImports(): Promise<string[]> {
    const scopedPackages = new Set<string>();
    
    // Scan all source files for scoped imports
    const sourceFiles = await this.findAllSourceFiles();
    
    for (const filePath of sourceFiles) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        
        // Match all scoped package imports: @scope/package
        const scopedImportMatches = content.match(/from\s+["'](@[^/]+\/[^/"']+)/g);
        if (scopedImportMatches) {
          for (const match of scopedImportMatches) {
            const packageMatch = match.match(/from\s+["'](@[^/]+\/[^/"']+)/);
            if (packageMatch) {
              scopedPackages.add(packageMatch[1]);
            }
          }
        }
        
        // Also match direct imports: import "@scope/package"
        const directImportMatches = content.match(/import\s+["'](@[^/]+\/[^/"']+)/g);
        if (directImportMatches) {
          for (const match of directImportMatches) {
            const packageMatch = match.match(/import\s+["'](@[^/]+\/[^/"']+)/);
            if (packageMatch) {
              scopedPackages.add(packageMatch[1]);
            }
          }
        }
      } catch (error) {
        // Silent fail for individual files
      }
    }
    
    return Array.from(scopedPackages);
  }

  /**
   * Dynamically detect CSS files in ANY package
   * ZERO HARDCODING - finds all .css files in package
   */
  private async detectPackageCssFiles(packagePath: string, packageName: string): Promise<Array<{name: string, path: string}>> {
    const cssFiles: Array<{name: string, path: string}> = [];
    
    // Common CSS locations in packages
    const possibleCssDirs = [
      join(packagePath, 'dist'),
      join(packagePath, 'lib'),
      join(packagePath, 'build'),
      join(packagePath, 'styles'),
      packagePath // root
    ];
    
    for (const dir of possibleCssDirs) {
      if (!existsSync(dir)) continue;
      
      try {
        const files = readdirSync(dir);
        for (const file of files) {
          if (file.endsWith('.css')) {
            const fullPath = join(dir, file);
            if (existsSync(fullPath)) {
              cssFiles.push({
                name: file,
                path: fullPath
              });
            }
          }
        }
      } catch (error) {
        // Silent fail for individual directories
      }
    }
    
    return cssFiles;
  }

  /**
   * Find all source files in the project for import scanning
   * INTELLIGENT scanning without hardcoding directories
   */
  private async findAllSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    // Dynamic directory discovery
    const scanDirs = ['app', 'src', 'components', 'lib', 'pages'];
    
    for (const dir of scanDirs) {
      const fullDir = join(this.options.projectPath, dir);
      if (!existsSync(fullDir)) continue;
      
      const scanRecursive = (dirPath: string, depth: number = 0) => {
        if (depth > 5) return; // Prevent infinite recursion
        
        try {
          const items = readdirSync(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            if (item.name.startsWith('.') || item.name === 'node_modules') continue;
            
            const itemPath = join(dirPath, item.name);
            
            if (item.isDirectory()) {
              scanRecursive(itemPath, depth + 1);
            } else if (extensions.some(ext => item.name.endsWith(ext))) {
              files.push(itemPath);
            }
          }
        } catch (error) {
          // Silent fail for individual directories
        }
      };
      
      scanRecursive(fullDir);
    }
    
    return files;
  }

  private getFrameworkPath(): string {
    // BULLETPROOF: Find the REAL 0x1 framework directory with comprehensive validation
    
    // Strategy 1: Check if we're inside the framework itself (development)
    if (this.isValid0x1Framework(process.cwd())) {
      if (!this.options.silent) {
        logger.info(`✅ Found 0x1 framework at current directory: ${process.cwd()}`);
      }
      return process.cwd();
    }
    
    // Strategy 2: Check npm package installation (production/CI)
    const nodeModulesFramework = join(this.options.projectPath, 'node_modules', '0x1');
    
    if (this.isValid0x1Framework(nodeModulesFramework)) {
      if (!this.options.silent) {
        logger.info(`✅ Found 0x1 framework as npm package: ${nodeModulesFramework}`);
      }
      return nodeModulesFramework;
    }
    
    // Strategy 3: Development environment detection
    const devPaths = [
      process.cwd().includes('00-Dev/0x1') 
      ? process.cwd().split('00-Dev/0x1')[0] + '00-Dev/0x1'
        : null,
      process.cwd().includes('0x1') 
        ? process.cwd().split('0x1')[0] + '0x1'
        : null
    ].filter(Boolean) as string[];
    
    for (const path of devPaths) {
      if (this.isValid0x1Framework(path)) {
        if (!this.options.silent) {
          logger.info(`✅ Found 0x1 framework at dev path: ${path}`);
        }
        return path;
      }
    }
    
    // Strategy 4: Relative navigation from project
    const relativePaths = [
      join(this.options.projectPath, '../'),
      join(this.options.projectPath, '../../'),
      join(process.cwd(), '../'),
      join(process.cwd(), '../../')
    ];
    
    for (const basePath of relativePaths) {
      const frameworkPath = join(basePath, '0x1');
      if (this.isValid0x1Framework(frameworkPath)) {
        if (!this.options.silent) {
          logger.info(`✅ Found 0x1 framework at relative path: ${frameworkPath}`);
        }
        return frameworkPath;
      }
    }
    
    // Strategy 5: Search parent directories recursively
    let currentDir = this.options.projectPath;
    const recursivePaths: string[] = [];
    for (let i = 0; i < 5; i++) { // Max 5 levels up
      currentDir = join(currentDir, '..');
      const frameworkPath = join(currentDir, '0x1');
      recursivePaths.push(frameworkPath);
      if (this.isValid0x1Framework(frameworkPath)) {
        if (!this.options.silent) {
          logger.info(`✅ Found 0x1 framework via recursive search: ${frameworkPath}`);
        }
        return frameworkPath;
      }
    }
    
    // CRITICAL: If we can't find the framework, this is a build failure
    const searchedPaths = [
      process.cwd(),
      nodeModulesFramework,
      ...devPaths,
      ...relativePaths.map(p => join(p, '0x1')),
      ...recursivePaths
    ];
    
    const errorMsg = `CRITICAL BUILD FAILURE: 0x1 framework not found in any expected location. Searched paths: ${searchedPaths.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  // BULLETPROOF: Validate that a directory is actually the 0x1 framework
  private isValid0x1Framework(path: string): boolean {
    if (!existsSync(path)) {
      if (!this.options.silent) {
        logger.debug(`❌ [DEBUG] ${path} - does not exist`);
      }
      return false;
    }
    
    if (!this.options.silent) {
      logger.debug(`🔍 [DEBUG] Validating framework at: ${path}`);
    }
    
    // Check package.json first to verify it's actually 0x1
    const packageJsonPath = join(path, 'package.json');
    let isFrameworkPackage = false;
    
    if (!this.options.silent) {
      logger.debug(`🔍 [DEBUG] Checking package.json: ${packageJsonPath}`);
      logger.debug(`🔍 [DEBUG] Package.json exists: ${existsSync(packageJsonPath)}`);
    }
    
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (!this.options.silent) {
          logger.debug(`🔍 [DEBUG] Package name: ${packageJson.name}`);
        }
        
        // FIXED: Only check if this package is actually the 0x1 framework
        // Don't exclude based on project name - that makes no sense!
        isFrameworkPackage = packageJson.name === '0x1' || 
                           packageJson.name === '@0x1/framework' ||
                           (packageJson.name && packageJson.name.startsWith('0x1-'));
        
        if (!this.options.silent) {
          logger.debug(`🔍 [DEBUG] Is framework package: ${isFrameworkPackage}`);
        }
      } catch (error) {
        if (!this.options.silent) {
          logger.debug(`❌ [DEBUG] Invalid package.json: ${error}`);
        }
        isFrameworkPackage = false;
      }
    }
    
    // Development scenario: Check for source files
    const sourceFiles = [
      join(path, 'src', 'core', 'hooks.ts'),
      join(path, 'src', 'jsx-dev-runtime.ts')
    ];
    
    const sourceDirs = [
      join(path, 'src'),
      join(path, 'src', 'core')
    ];
    
    const hasSourceFiles = sourceFiles.every(file => existsSync(file));
    const hasSourceDirs = sourceDirs.every(dir => existsSync(dir));
    const isDevelopmentFramework = hasSourceFiles && hasSourceDirs;
    
    if (!this.options.silent) {
      logger.debug(`🔍 [DEBUG] Source files check: ${sourceFiles.map(f => `${f.split('/').pop()}: ${existsSync(f)}`).join(', ')}`);
      logger.debug(`🔍 [DEBUG] Is development framework: ${isDevelopmentFramework}`);
    }
    
    // Production scenario: Check for dist files
    const distFiles = [
      join(path, 'dist', 'hooks.js'),
      join(path, 'dist', 'jsx-runtime.js')
    ];
    
    const distDirs = [
      join(path, 'dist')
    ];
    
    const hasDistFiles = distFiles.some(file => existsSync(file)); // At least one dist file
    const hasDistDirs = distDirs.every(dir => existsSync(dir));
    const isProductionFramework = hasDistFiles && hasDistDirs;
    
    if (!this.options.silent) {
      logger.debug(`🔍 [DEBUG] Dist files check: ${distFiles.map(f => `${f.split('/').pop()}: ${existsSync(f)}`).join(', ')}`);
      logger.debug(`🔍 [DEBUG] Is production framework: ${isProductionFramework}`);
    }
    
    // Valid if it's either development OR production framework AND has correct package.json
    const isValid = (isDevelopmentFramework || isProductionFramework) && isFrameworkPackage;
    
    if (!this.options.silent) {
      logger.debug(`🎯 [DEBUG] Final validation: dev=${isDevelopmentFramework}, prod=${isProductionFramework}, package=${isFrameworkPackage}, valid=${isValid}`);
    }
    
    return isValid;
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

  // Complete the copyFrameworkFilesUsingWorkingPattern method
  private async completeCopyFrameworkFiles(nodeModulesDir: string, framework0x1Dir: string): Promise<void> {
    // Generate browser-compatible 0x1 entry point (same as DevOrchestrator)
    await this.generateBrowserEntryUsingDevOrchestratorPattern(nodeModulesDir, framework0x1Dir);
  }
} 



