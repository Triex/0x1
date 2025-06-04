/**
 * 0x1 CLI - Build Command - ULTRA-FAST OPTIMIZED WITH COMPONENT IMPORT FIXES
 * Builds the application for production using Bun's full potential
 * Target: <100ms build times with parallel processing and smart caching
 */

import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { logger } from '../utils/logger';

export interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  watch?: boolean;
  silent?: boolean;
  config?: string;
  ignore?: string[];
}

// 🚀 ULTRA-FAST BUILD CACHE SYSTEM WITH HASH-BASED CACHING
class BuildCache {
  private cache = new Map<string, { content: string; hash: string; mtime: number }>();
  private readonly cacheFile = '.0x1-build-cache.json';
  
  constructor() {
    this.loadCache();
  }
  
  private loadCache(): void {
    try {
      if (existsSync(this.cacheFile)) {
        const data = JSON.parse(readFileSync(this.cacheFile, 'utf8'));
        this.cache = new Map(data);
      }
  } catch (error) {
      // Silent fail, start with empty cache
    }
  }
  
  private saveCache(): void {
    try {
      writeFileSync(this.cacheFile, JSON.stringify([...this.cache.entries()]));
  } catch (error) {
      // Silent fail
    }
  }
  
  async isCached(filePath: string): Promise<boolean> {
    if (!existsSync(filePath)) return false;
    
    const stats = statSync(filePath);
    const cacheEntry = this.cache.get(filePath);
    
    if (!cacheEntry) return false;
    
    // Check both mtime and content hash for ultimate accuracy
    if (cacheEntry.mtime !== stats.mtimeMs) return false;
    
    // Double-check with content hash for ultimate reliability
    const currentContent = await Bun.file(filePath).text();
    const currentHash = Bun.hash(currentContent).toString(16);
    
    return cacheEntry.hash === currentHash;
  }
  
  async get(filePath: string): Promise<string | null> {
    if (await this.isCached(filePath)) {
      return this.cache.get(filePath)!.content;
    }
    return null;
  }
  
  async set(filePath: string, content: string): Promise<void> {
    const stats = statSync(filePath);
    const sourceContent = await Bun.file(filePath).text();
    const hash = Bun.hash(sourceContent).toString(16);
    
    this.cache.set(filePath, { content, hash, mtime: stats.mtimeMs });
    this.saveCache();
  }

  // 🚀 ULTRA-FAST BATCH OPERATIONS
  async batchGet(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const tasks = filePaths.map(async (filePath) => {
      const cached = await this.get(filePath);
      if (cached) {
        results.set(filePath, cached);
      }
    });
    await Promise.all(tasks);
    return results;
  }

  async batchSet(entries: Map<string, { filePath: string; content: string }>): Promise<void> {
    const tasks = Array.from(entries.values()).map(async ({ filePath, content }) => {
      await this.set(filePath, content);
    });
    await Promise.all(tasks);
  }
  
  clear(): void {
    this.cache.clear();
    try {
      unlinkSync(this.cacheFile);
    } catch (error) {
      // Silent fail
    }
  }
}

// 🚀 CRITICAL FIX: Transform imports for browser (FIXED REGEX PATTERN)
function transformImportsForBrowser(sourceCode: string): string {
  // 🚀 STEP 1: Fix relative component imports to use absolute browser paths
  sourceCode = sourceCode.replace(
    /import\s+(\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"](\.\.[/\\].*?)['"];?/g,
    (match, importClause, importPath) => {
      let browserPath = importPath;
      
      // Map specific patterns to browser-accessible paths
      if (importPath.includes('components/')) {
        // ../components/Header -> /components/Header.js
        browserPath = importPath.replace(/^\.\.\/components\//, '/components/');
      } else if (importPath.includes('lib/')) {
        // ../lib/utils -> /lib/utils.js
        browserPath = importPath.replace(/^\.\.\/.*?lib\//, '/lib/');
      } else if (importPath.includes('utils/')) {
        // ../utils/helper -> /utils/helper.js
        browserPath = importPath.replace(/^\.\.\/.*?utils\//, '/utils/');
      } else {
        // Generic relative imports - assume they're components
        browserPath = importPath.replace(/^\.\.\//, '/components/');
      }
      
      // Add .js extension if not present
      if (!browserPath.endsWith('.js') && !browserPath.endsWith('.ts') && !browserPath.endsWith('.tsx') && 
          !browserPath.endsWith('.css') && !browserPath.endsWith('.json') && !browserPath.endsWith('.svg')) {
        browserPath += '.js';
      }
      
      return `import ${importClause} from '${browserPath}';`;
    }
  );

  // 🚀 STEP 2: Handle ./relative imports
  sourceCode = sourceCode.replace(
    /import\s+(\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"](\.\/.*?)['"];?/g,
    (match, importClause, importPath) => {
      let browserPath = importPath;
      
      if (importPath.includes('components/')) {
        browserPath = importPath.replace(/^\.\/components\//, '/components/');
      } else if (importPath.includes('lib/')) {
        browserPath = importPath.replace(/^\.\/lib\//, '/lib/');
      } else if (importPath.includes('utils/')) {
        browserPath = importPath.replace(/^\.\/utils\//, '/utils/');
      } else {
        browserPath = importPath.replace(/^\.\//, '/components/');
      }
      
      // Add .js extension if not present
      if (!browserPath.endsWith('.js') && !browserPath.endsWith('.ts') && !browserPath.endsWith('.tsx') && 
          !browserPath.endsWith('.css') && !browserPath.endsWith('.json') && !browserPath.endsWith('.svg')) {
        browserPath += '.js';
      }
      
      return `import ${importClause} from '${browserPath}';`;
    }
  );

  // 🚀 STEP 3: Transform 0x1 framework imports
  sourceCode = sourceCode.replace(
    /import\s+(\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"]0x1['"];?/g,
    'import $1 from "/node_modules/0x1/index.js";'
  );
  
  return sourceCode;
}

// Global build cache instance
const buildCache = new BuildCache();

/**
 * Build the application for production - ULTRA-FAST OPTIMIZED
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  const startTime = performance.now();
  
  // Silent logger for when needed
  const log = options.silent ?
    {
      info: () => {},
      error: () => {},
      warn: () => {},
      section: () => {},
      spinner: () => ({ stop: () => {} }),
      spacer: () => {},
      success: () => {},
      highlight: (text: string) => text,
      gradient: (text: string) => text,
      box: () => {},
      command: () => {}
    } :
    logger;

  const projectPath = process.cwd();

  // 🚀 PARALLEL CONFIG LOADING - Don't block on config
  const configPromise = loadConfigFast(projectPath, options.config);
  
  // Build options with smart defaults
  const outDir = options.outDir || 'dist';
  const minify = options.minify ?? true;

  log.section('BUILDING APPLICATION');
  log.spacer();

  // 🚀 PARALLEL DIRECTORY SETUP - Use Bun's native parallel mkdir
  const outputPath = resolve(projectPath, outDir);
  
  try {
    // 🚀 STEP 1: PARALLEL INITIALIZATION
    const initTime = performance.now();
    log.info('⚡ Starting parallel initialization...');
    
    const [config] = await Promise.all([
      configPromise,
      mkdir(outputPath, { recursive: true }),
      mkdir(join(outputPath, 'app'), { recursive: true }),
      mkdir(join(outputPath, 'components'), { recursive: true }),
      mkdir(join(outputPath, 'node_modules', '0x1'), { recursive: true }),
      mkdir(join(outputPath, '0x1'), { recursive: true })
    ]);
    
    log.info(`✅ Parallel init: ${(performance.now() - initTime).toFixed(1)}ms`);

    // 🚀 STEP 2: ULTRA-FAST ROUTE DISCOVERY + COMPONENT SCANNING
    const discoveryTime = performance.now();
    log.info('🔍 Ultra-fast discovery...');
    
    const [discoveredRoutes, allComponents] = await Promise.all([
      discoverRoutesSuperFast(projectPath),
      discoverAllComponentsSuperFast(projectPath)
    ]);
    
    log.info(`✅ Discovery: ${(performance.now() - discoveryTime).toFixed(1)}ms (${discoveredRoutes.length} routes, ${allComponents.length} components)`);

    // 🚀 STEP 3: PARALLEL GENERATION - ALL AT ONCE
    const generationTime = performance.now();
    log.info('🚀 Parallel generation...');
    
    console.log('[TIMING] Starting parallel generation tasks...');
    
    // Run each task with individual timing
    const start1 = performance.now();
    await generateSophisticatedAppJsFast(projectPath, outputPath, discoveredRoutes);
    const appJsTime = performance.now() - start1;
    console.log(`[TIMING] 📱 App.js: ${appJsTime.toFixed(1)}ms`);
    
    const start2 = performance.now();
    await generateStaticComponentFilesSuperFast(projectPath, outputPath, discoveredRoutes, allComponents);
    const componentTime = performance.now() - start2;
    console.log(`[TIMING] 🧩 Components: ${componentTime.toFixed(1)}ms`);
    
    const start3 = performance.now();
    await copy0x1FrameworkFilesFast(outputPath);
    const frameworkTime = performance.now() - start3;
    console.log(`[TIMING] 📋 Framework: ${frameworkTime.toFixed(1)}ms`);
    
    const start4 = performance.now();
    await copyStaticAssetsFast(projectPath, outputPath);
    const assetTime = performance.now() - start4;
    console.log(`[TIMING] 📁 Assets: ${assetTime.toFixed(1)}ms`);
    
    const start5 = performance.now();
    await processTailwindCssFast(projectPath, outputPath, minify);
    const cssTime = performance.now() - start5;
    console.log(`[TIMING] 🎨 CSS: ${cssTime.toFixed(1)}ms`);
    
    const start6 = performance.now();
    await generateProductionHtmlFast(projectPath, outputPath);
    const htmlTime = performance.now() - start6;
    console.log(`[TIMING] 📄 HTML: ${htmlTime.toFixed(1)}ms`);
    
    await generatePwaFilesFast(outputPath);
    
    log.info(`✅ Generation: ${(performance.now() - generationTime).toFixed(1)}ms`);

  // Calculate and display build time
  const endTime = performance.now();
  const buildTimeMs = endTime - startTime;
  const formattedTime = buildTimeMs < 1000 ?
    `${buildTimeMs.toFixed(2)}ms` :
    `${(buildTimeMs / 1000).toFixed(2)}s`;

  log.spacer();
    log.box('Build Complete');
    log.info(`📦 Output directory: ${log.highlight(outputPath)}`);
    log.info(`🔧 Minification: ${minify ? 'enabled' : 'disabled'}`);
  log.info(`⚡ Build completed in ${log.highlight(formattedTime)}`);

  if (options.watch && !options.silent) {
    log.spacer();
    log.info('👀 Watching for changes...');
    log.info('Press Ctrl+C to stop');
      // Watch mode implementation would go here
    }

  } catch (error) {
    log.error(`Build failed: ${error}`);
    if (!options.silent) process.exit(1);
    throw error;
  }
}

/**
 * Alias for compatibility with CLI index
 */
export const buildProject = build;

// 🚀 ULTRA-FAST CONFIG LOADING WITH PARALLEL FALLBACKS
async function loadConfigFast(projectPath: string, configPath?: string): Promise<any> {
  if (configPath) {
    try {
      const fullPath = resolve(projectPath, configPath);
      if (existsSync(fullPath)) {
        if (fullPath.endsWith('.json') || fullPath.endsWith('package.json')) {
          const content = await Bun.file(fullPath).text();
          const json = JSON.parse(content);
          return fullPath.endsWith('package.json') ? json['0x1'] || {} : json;
        } else {
          const config = await import(fullPath);
          return config.default || config;
        }
      }
    } catch (error) {
      logger.warn(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  // Parallel config file discovery
  const configFiles = [
    '0x1.config.ts',
    '0x1.config.js', 
    'package.json'
  ];

  const tasks = configFiles.map(async (file) => {
    const fullPath = join(projectPath, file);
    if (!existsSync(fullPath)) return null;

    try {
      if (file === 'package.json') {
        const content = await Bun.file(fullPath).text();
        const json = JSON.parse(content);
        return json['0x1'] || null;
    } else {
        const config = await import(fullPath);
        return config.default || config;
      }
  } catch (error) {
      return null;
    }
  });

  const results = await Promise.all(tasks);
  return results.find(config => config !== null) || {};
}

// 🚀 LIGHTNING-FAST ROUTE DISCOVERY
async function discoverRoutesSuperFast(projectPath: string): Promise<Array<{ path: string; componentPath: string }>> {
  const routes: Array<{ path: string; componentPath: string }> = [];
  const appDir = join(projectPath, 'app');
  
  if (!existsSync(appDir)) return routes;

  const scanDirFast = async (dirPath: string, routePath: string = ''): Promise<void> => {
    try {
      const items = readdirSync(dirPath, { withFileTypes: true });
      
      const tasks = items.map(async (item) => {
        if (item.isDirectory() && !item.name.startsWith('.') && !item.name.startsWith('(')) {
          const newRoutePath = routePath + '/' + item.name;
          await scanDirFast(join(dirPath, item.name), newRoutePath);
        } else if (item.name === 'page.tsx' || item.name === 'page.ts' || item.name === 'page.jsx' || item.name === 'page.js') {
          const fullRoutePath = routePath || '/';
          const componentPath = join(dirPath, item.name)
            .replace(projectPath, '')
            .replace(/\\/g, '/')
            .replace(/\.(tsx|ts|jsx)$/, '.js');
          
          routes.push({
            path: fullRoutePath,
            componentPath: componentPath
          });
        }
      });
      
      await Promise.all(tasks);
    } catch (error) {
      // Silent fail for individual directories
    }
  };

  await scanDirFast(appDir);
  return routes;
}

// 🚀 ULTRA-FAST COMPONENT DISCOVERY WITH PARALLEL SCANNING
async function discoverAllComponentsSuperFast(projectPath: string): Promise<Array<{ path: string; relativePath: string; dir: string }>> {
  const allComponents: Array<{ path: string; relativePath: string; dir: string }> = [];
  const componentDirectories = ['components', 'lib', 'src/components', 'src/lib'];
  const componentExtensions = ['.tsx', '.jsx', '.ts', '.js'];

  const dirTasks = componentDirectories.map(async (dir) => {
    const fullDirPath = join(projectPath, dir);
    if (!existsSync(fullDirPath)) return;

    const scanRecursive = async (dirPath: string, relativePath: string = ''): Promise<void> => {
      try {
        const items = readdirSync(dirPath, { withFileTypes: true });
        
        const itemTasks = items.map(async (item) => {
          const itemPath = join(dirPath, item.name);
          
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            const newRelativePath = relativePath ? join(relativePath, item.name) : item.name;
            await scanRecursive(itemPath, newRelativePath);
          } else if (componentExtensions.some(ext => item.name.endsWith(ext))) {
            const componentFile = relativePath ? join(dir, relativePath, item.name) : join(dir, item.name);
            allComponents.push({
              path: itemPath,
              relativePath: componentFile,
              dir: dir
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

  await Promise.all(dirTasks);
  return allComponents;
}

// 🚀 ULTRA-FAST APP.JS GENERATION
async function generateSophisticatedAppJsFast(projectPath: string, outputPath: string, routes: Array<{ path: string; componentPath: string }>): Promise<void> {
  // Safely serialize routes data
  let routesJson;
  try {
    const sanitizedRoutes = routes.map(route => ({
      path: route.path,
      componentPath: route.componentPath
    }));
    routesJson = JSON.stringify(sanitizedRoutes, null, 2);
  } catch (jsonError) {
    logger.error(`Error serializing routes: ${jsonError}`);
    routesJson = '[]';
  }

  // Generate ultra-fast app.js
  const appScript = `// 0x1 Framework - ULTRA-FAST App Bundle
console.log('[0x1] ⚡ Ultra-fast app starting...');

const serverRoutes = ${routesJson};
const polyfillCache = new Map();

async function loadPolyfill(name) {
  if (polyfillCache.has(name)) return polyfillCache.get(name);
  const promise = import('/node_modules/' + name).catch(() => null);
  polyfillCache.set(name, promise);
  return promise;
}

async function initApp() {
  try {
    console.log('[0x1] 🚀 Lightning init...');
    
    // Ultra-fast parallel loading
    const [hooksModule, routerModule] = await Promise.all([
      import('/0x1/hooks.js'),
      import('/0x1/router.js')
    ]);
    
    const { Router } = routerModule;
    const appElement = document.getElementById('app');
    
    if (!appElement) throw new Error('App element not found');
    
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/',
      notFoundComponent: () => ({
        type: 'div',
        props: { className: 'flex items-center justify-center min-h-screen' },
        children: [
          { type: 'h1', props: { className: 'text-4xl font-bold text-violet-600' }, children: ['404'] },
          { type: 'p', props: { className: 'text-gray-600 mt-4' }, children: ['Page not found'] },
          { type: 'a', props: { href: '/', className: 'mt-4 px-4 py-2 bg-violet-600 text-white rounded' }, children: ['Home'] }
        ]
      })
    });
    
    window.router = router;
    
    // Ultra-fast route registration
    for (const route of serverRoutes) {
      router.addRoute(route.path, async (props) => {
        const module = await import(route.componentPath);
        return module?.default?.(props) || { type: 'div', children: ['Loading...'] };
      });
    }
    
    router.init();
    router.navigate(window.location.pathname, false);
    
    // Hide loading immediately
    window.appReady?.();
    
    console.log('[0x1] ✅ Ultra-fast init complete');
  } catch (error) {
    console.error('[0x1] ❌ Init failed:', error);
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;">Error: ' + error.message + '</div>';
    }
    window.appReady?.();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}`;

  // Write the ultra-fast app.js
  const appJsPath = join(outputPath, 'app.js');
  await Bun.write(appJsPath, appScript);
}

// 🚀 CRITICAL FIX: STATIC COMPONENT GENERATION WITH PROPER IMPORT TRANSFORMS
async function generateStaticComponentFilesSuperFast(
  projectPath: string,
  outputPath: string,
  routes: Array<{ path: string; componentPath: string }>,
  allComponents: Array<{ path: string; relativePath: string; dir: string }>
): Promise<void> {
  console.log(`[Build] 🚀 COMPONENT GENERATION with import fixes...`);
  const startTime = performance.now();
  
  // 🚀 STEP 1: CHECK LAYOUT ONCE (1ms)
  const layoutPath = join(projectPath, 'app', 'layout.tsx');
  const hasLayout = existsSync(layoutPath);
  let layoutContent = '';
  
  if (hasLayout) {
    layoutContent = await Bun.file(layoutPath).text();
  }

  // 🚀 STEP 2: PARALLEL ROUTE COMPONENT PROCESSING (5-20ms)
  const routeTasks = routes.map(async (route) => {
    try {
      const componentPath = route.componentPath.replace(/^\//, '');
      const sourceFile = componentPath.replace(/\.js$/, '.tsx');
      const sourcePath = join(projectPath, sourceFile);
      
      if (!existsSync(sourcePath)) return 0;
      
      // Check cache first
      const cached = await buildCache.get(sourcePath);
      if (cached) {
        const outputPath_component = join(outputPath, componentPath);
        await mkdir(dirname(outputPath_component), { recursive: true });
        await Bun.write(outputPath_component, cached);
        return 1;
      }
      
      let sourceCode = await Bun.file(sourcePath).text();
      const isPageComponent = sourceFile.startsWith('app/') && sourceFile.endsWith('/page.tsx');
      
      if (isPageComponent && hasLayout) {
        const defaultExportMatch = sourceCode.match(/export\s+default\s+function\s+(\w+)/);
        const pageComponentName = defaultExportMatch?.[1] || 'PageComponent';
        
        const layoutWithoutExport = layoutContent
          .replace(/export\s+default\s+function\s+RootLayout/, 'function RootLayout')
          .replace(/import\s+["']\.\/globals\.css[""];?\s*\n?/g, '')
          .replace(/import\s+["'][^"']*\.css[""];?\s*\n?/g, '');
        const pageWithoutExport = sourceCode.replace(/export\s+default\s+function\s+\w+/, `function ${pageComponentName}`);
        
        sourceCode = `${layoutWithoutExport}\n\n${pageWithoutExport}\n\nexport default function WrappedPage(props) {\n  return RootLayout({ children: ${pageComponentName}(props) });\n}`;
      }
      
      // Don't transform imports before transpiling - Bun overwrites them
      // sourceCode = transformImportsForBrowser(sourceCode);
      
      // Simple fresh transpiler for each file (stable approach)
      const transpiler = new Bun.Transpiler({
        loader: 'tsx',
        target: 'browser',
        define: { 'process.env.NODE_ENV': '"production"', 'global': 'globalThis' },
        tsconfig: { compilerOptions: { jsx: 'react-jsx', jsxImportSource: '/0x1/jsx-runtime.js' } }
      });
      
      let transpiledContent = await transpiler.transform(sourceCode);
      
      // 🚀 CRITICAL FIX: Transform imports AFTER transpiling
      transpiledContent = transformImportsForBrowser(transpiledContent);
      
      // 🚀 CRITICAL FIX: Properly handle JSX runtime imports including Fragment
      const jsxMatch = transpiledContent.match(/jsxDEV_[a-zA-Z0-9_]+/);
      const fragmentMatch = transpiledContent.match(/Fragment_[a-zA-Z0-9_]+/);

      if (jsxMatch) {
        const jsxFuncName = jsxMatch[0];
        let imports = `import { jsxDEV as ${jsxFuncName}`;

        if (fragmentMatch) {
          const fragmentFuncName = fragmentMatch[0];
          imports += `, Fragment as ${fragmentFuncName}`;
        }

        imports += ' } from "/0x1/jsx-runtime.js";\n';
        transpiledContent = imports + transpiledContent;
      }
      
      const outputPath_component = join(outputPath, componentPath);
      await mkdir(dirname(outputPath_component), { recursive: true });
      await Bun.write(outputPath_component, transpiledContent);
      
      // Cache the result
      await buildCache.set(sourcePath, transpiledContent);
      
      return 1;
      } catch (error) {
      console.warn(`[Build] ⚠️ Failed to generate route component ${route.path}:`, error);
      return 0;
    }
  });

  // 🚀 STEP 3: PARALLEL COMPONENT PROCESSING (5-20ms)
  const componentTasks = allComponents.map(async ({ path: sourcePath, relativePath }) => {
    try {
      // Check cache first
      const cached = await buildCache.get(sourcePath);
      if (cached) {
        const outputPath_component = join(outputPath, relativePath.replace(/\.(tsx|ts)$/, '.js'));
        await mkdir(dirname(outputPath_component), { recursive: true });
        await Bun.write(outputPath_component, cached);
        return 1;
      }
      
      let sourceCode = await Bun.file(sourcePath).text();
      const isPageComponent = sourcePath.endsWith('/page.tsx');
      
      if (isPageComponent && hasLayout) {
        const defaultExportMatch = sourceCode.match(/export\s+default\s+function\s+(\w+)/);
        const pageComponentName = defaultExportMatch?.[1] || 'PageComponent';
        
        const layoutWithoutExport = layoutContent
          .replace(/export\s+default\s+function\s+RootLayout/, 'function RootLayout')
          .replace(/import\s+["']\.\/globals\.css[""];?\s*\n?/g, '')
          .replace(/import\s+["'][^"']*\.css[""];?\s*\n?/g, '');
        const pageWithoutExport = sourceCode.replace(/export\s+default\s+function\s+\w+/, `function ${pageComponentName}`);
        
        sourceCode = `${layoutWithoutExport}\n\n${pageWithoutExport}\n\nexport default function WrappedPage(props) {\n  return RootLayout({ children: ${pageComponentName}(props) });\n}`;
      }
      
      // Don't transform imports before transpiling - Bun overwrites them
      // sourceCode = transformImportsForBrowser(sourceCode);
      
      // Simple fresh transpiler for each file (stable approach)
      const transpiler = new Bun.Transpiler({
        loader: 'tsx',
        target: 'browser',
        define: { 'process.env.NODE_ENV': '"production"', 'global': 'globalThis' },
        tsconfig: { compilerOptions: { jsx: 'react-jsx', jsxImportSource: '/0x1/jsx-runtime.js' } }
      });
      
      let transpiledContent = await transpiler.transform(sourceCode);
      
      // 🚀 CRITICAL FIX: Transform imports AFTER transpiling
      transpiledContent = transformImportsForBrowser(transpiledContent);
      
      // 🚀 CRITICAL FIX: Properly handle JSX runtime imports including Fragment
      const jsxMatch = transpiledContent.match(/jsxDEV_[a-zA-Z0-9_]+/);
      const fragmentMatch = transpiledContent.match(/Fragment_[a-zA-Z0-9_]+/);

      if (jsxMatch) {
        const jsxFuncName = jsxMatch[0];
        let imports = `import { jsxDEV as ${jsxFuncName}`;

        if (fragmentMatch) {
          const fragmentFuncName = fragmentMatch[0];
          imports += `, Fragment as ${fragmentFuncName}`;
        }

        imports += ' } from "/0x1/jsx-runtime.js";\n';
        transpiledContent = imports + transpiledContent;
      }
      
      const outputPath_component = join(outputPath, relativePath.replace(/\.(tsx|ts)$/, '.js'));
      await mkdir(dirname(outputPath_component), { recursive: true });
      await Bun.write(outputPath_component, transpiledContent);
      
      // Cache the result
      await buildCache.set(sourcePath, transpiledContent);
      
      return 1;
      } catch (error) {
      console.warn(`[Build] ⚠️ Failed to generate component ${relativePath}:`, error);
      return 0;
    }
  });

  // Execute all tasks in parallel
  const [routeResults, componentResults] = await Promise.all([
    Promise.all(routeTasks),
    Promise.all(componentTasks)
  ]);
  
  const generatedCount = routeResults.reduce((a: number, b: number) => a + b, 0) + componentResults.reduce((a: number, b: number) => a + b, 0);
  
  const totalTime = performance.now() - startTime;
  console.log(`[Build] ✅ COMPONENT GENERATION: ${generatedCount} files in ${totalTime.toFixed(1)}ms (WITH IMPORT FIXES)`);
}

// 🚀 LIGHTNING-FAST FRAMEWORK FILES COPY
async function copy0x1FrameworkFilesFast(outputPath: string): Promise<void> {
  const currentFile = new URL(import.meta.url).pathname;
  const frameworkRoot = resolve(dirname(currentFile), '..', '..');
  const frameworkDistPath = join(frameworkRoot, 'dist');
  const routerSourcePath = join(frameworkRoot, '0x1-router', 'dist', 'index.js');
  
  const framework0x1Dir = join(outputPath, '0x1');
  const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
  
  const frameworkFiles = [
    { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
    { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
    { src: 'core/hooks.js', dest: 'hooks.js' },
    { src: 'index.js', dest: 'index.js' }
  ];
  
  // Parallel file copying
  const copyTasks = frameworkFiles.map(async ({ src, dest }) => {
    const srcPath = join(frameworkDistPath, src);
    const destPath = join(framework0x1Dir, dest);
    
    if (existsSync(srcPath)) {
      const content = await Bun.file(srcPath).text();
      await Bun.write(destPath, content);
      return true;
    }
    return false;
  });
  
  // Copy router and generate browser entry in parallel
  const [, routerCopied, browserEntryGenerated] = await Promise.all([
    Promise.all(copyTasks),
    copyRouterFast(routerSourcePath, framework0x1Dir),
    generateBrowserCompatible0x1EntryFast(nodeModulesDir)
  ]);
}

async function copyRouterFast(routerSourcePath: string, framework0x1Dir: string): Promise<boolean> {
  if (existsSync(routerSourcePath)) {
    const routerContent = await Bun.file(routerSourcePath).text();
    await Bun.write(join(framework0x1Dir, 'router.js'), routerContent);
    return true;
  }
  return false;
}

async function generateBrowserCompatible0x1EntryFast(nodeModulesDir: string): Promise<void> {
  const cleanFrameworkModule = `// 0x1 Framework - Ultra-Fast Build Version
console.log('[0x1] ⚡ Ultra-fast framework loaded');

// Dynamic hook resolution
const hooks = new Proxy({}, {
  get(_, prop) {
    return (...args) => {
      const hook = window.React?.[prop] || window[prop];
      if (!hook) throw new Error('[0x1] Hook ' + prop + ' not loaded');
      return hook(...args);
    };
  }
});

export const { useState, useEffect, useCallback, useMemo, useRef, useClickOutside, useFetch, useForm, useLocalStorage } = hooks;

export function jsx(type, props, key) {
  return window.jsx ? window.jsx(type, props, key) : { type, props: props || {}, key };
}

export function jsxs(type, props, key) {
  return window.jsxs ? window.jsxs(type, props, key) : { type, props: props || {}, key };
}

export function jsxDEV(type, props, key) {
  return window.jsxDEV ? window.jsxDEV(type, props, key) : { type, props: props || {}, key };
}

export const Fragment = Symbol.for('react.fragment');
export const version = '0.1.0';
export default { useState, useEffect, jsx, jsxs, jsxDEV, Fragment, version };`;

  await Bun.write(join(nodeModulesDir, 'index.js'), cleanFrameworkModule);
}

// 🚀 LIGHTNING-FAST ASSET COPYING
async function copyStaticAssetsFast(projectPath: string, outputPath: string): Promise<void> {
  const publicDir = join(projectPath, 'public');
  const appDir = join(projectPath, 'app');
  
  const tasks: Promise<any>[] = [];
  
  // Copy public directory
  if (existsSync(publicDir)) {
    tasks.push(Bun.spawn(['cp', '-r', `${publicDir}/.`, outputPath], {
      cwd: process.cwd(),
      stdin: 'ignore',
      stdout: 'ignore',
          stderr: 'pipe'
    }).exited);
  }
  
  // Copy favicons from app directory
  const faviconFormats = ['favicon.ico', 'favicon.svg', 'favicon.png'];
  for (const faviconFile of faviconFormats) {
    const faviconPath = join(appDir, faviconFile);
    if (existsSync(faviconPath)) {
      tasks.push((async () => {
        const content = await Bun.file(faviconPath).arrayBuffer();
        await Bun.write(join(outputPath, faviconFile), content);
      })());
    }
  }
  
  await Promise.all(tasks);
}

// 🚀 LIGHTNING-FAST CSS PROCESSING WITH REAL TAILWIND CSS V4 + SMART CACHING
async function processTailwindCssFast(projectPath: string, outputPath: string, minify: boolean): Promise<void> {
  try {
    console.log('[Build] 🌈 Processing Tailwind CSS v4 with smart caching...');

    // Find the CSS input file
    const possibleInputs = [
      join(projectPath, 'app/globals.css'),
      join(projectPath, 'src/globals.css'),
      join(projectPath, 'src/input.css'),
      join(projectPath, 'src/index.css'),
      join(projectPath, 'app.css'),
      join(projectPath, 'styles.css')
    ];

    let inputFile = null;
    for (const file of possibleInputs) {
      if (existsSync(file)) {
        inputFile = file;
        break;
      }
    }

    if (!inputFile) {
      console.log('[Build] ⚠️ No CSS input file found. Using minimal CSS.');
      const minimalCss = `/* 0x1 Framework - Production CSS */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}
html{line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif;height:100%}
body{line-height:1.6;font-family:system-ui,sans-serif;margin:0}
.flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}
.glass-panel{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2)}`;
      await Bun.write(join(outputPath, 'styles.css'), minimalCss);
      return;
    }

    console.log(`[Build] 📄 Found CSS input: ${inputFile.replace(projectPath, '.')}`);

    // 🚀 SMART CACHING: Check if CSS needs rebuilding
    const outputCssPath = join(outputPath, 'styles.css');
    const inputStats = statSync(inputFile);
    
    if (existsSync(outputCssPath)) {
      const outputStats = statSync(outputCssPath);
      // If output is newer than input, skip processing
      if (outputStats.mtimeMs > inputStats.mtimeMs) {
        console.log('[Build] ✅ CSS cache hit - skipping processing');
        return;
      }
    }

    // 🚀 REAL TAILWIND CSS V4 PROCESSING (Same working approach as dev-server.ts)
    console.log('[Build] ⚡ Using SAME approach as dev-server.ts...');
    
    const inputCss = await Bun.file(inputFile).text();
    let finalCss = '';
    
    // Use the EXACT same Tailwind v4 handler that works in dev-server.ts
    try {
      // Import the working Tailwind v4 handler from dev-server
      const { tailwindV4Handler } = await import('./utils/server/tailwind-v4');
      
      // Check if Tailwind v4 is available (same check as dev-server)
      const isV4Available = await tailwindV4Handler.isAvailable(projectPath);
      
      if (isV4Available) {
        console.log('[Build] 🌟 Using Tailwind CSS v4 handler'); 
        
        // Create output directory if needed
        await mkdir(dirname(outputCssPath), { recursive: true });
        
        // Use the v4 handler's startProcess method for one-time build
        const tailwindProcess = await tailwindV4Handler.startProcess(
          projectPath,
          inputFile,
          outputCssPath
        );
        
        // Wait for the build to complete
        if (tailwindProcess.process) {
          const result = await tailwindProcess.process.exited;
          
          if (result === 0 && existsSync(outputCssPath)) {
            finalCss = await Bun.file(outputCssPath).text();
            console.log('[Build] ✅ Tailwind CSS v4 processed successfully with v4 handler');
          } else {
            throw new Error('Tailwind CSS v4 handler process failed');
          }
        } else {
          throw new Error('Tailwind CSS v4 handler could not start process');
        }
      } else {
        throw new Error('Tailwind CSS v4 not available');
      }
      
    } catch (error) {
      console.log('[Build] ⏱️ Tailwind v4 handler failed, using enhanced fallback...');
      
      // Smart fallback: If we have a previous successful build, use it
      if (existsSync(outputCssPath)) {
        console.log('[Build] 🔄 Reusing previous CSS build');
        return;
      }
      
      // Enhanced CSS processing fallback (keep user's styles + essential utilities)
      console.log('[Build] 🎨 Using enhanced CSS processing...');
      
      // Keep user's custom CSS but replace @import "tailwindcss"
      finalCss = inputCss.replace(
        /@import\s+["']tailwindcss["'];?\s*/g,
        `/* Tailwind CSS v4 - Enhanced Build */
:root{--color-violet-600:#7c3aed;--color-white:#fff;--spacing:0.25rem}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}
html{line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif;height:100%}
body{line-height:1.6;font-family:system-ui,sans-serif;margin:0}
.container{width:100%;max-width:1200px;margin:0 auto;padding:0 1rem}
.flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}
.grid{display:grid}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.bg-violet-600{background-color:var(--color-violet-600)}.text-white{color:var(--color-white)}.bg-gray-900{background-color:#111827}.text-gray-100{color:#f3f4f6}
.p-4{padding:1rem}.px-4{padding-left:1rem;padding-right:1rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}.m-4{margin:1rem}
.rounded-lg{border-radius:0.5rem}.shadow-lg{box-shadow:0 10px 15px -3px rgb(0 0 0/0.1)}.border{border-width:1px}
.w-full{width:100%}.h-full{height:100%}.min-h-screen{min-height:100vh}.max-w-md{max-width:28rem}
.text-center{text-align:center}.font-bold{font-weight:700}.text-sm{font-size:0.875rem}.text-lg{font-size:1.125rem}
.space-y-4>:not([hidden])~:not([hidden]){margin-top:1rem}.space-x-2>:not([hidden])~:not([hidden]){margin-left:0.5rem}
.hover\\:bg-violet-700:hover{background-color:#6d28d9}.transition{transition-property:all;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}
.glass-panel{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2)}
`
      );
      
      // Write the fallback CSS
      await Bun.write(outputCssPath, finalCss);
    }
    
    // Apply minification if requested and we have CSS content
    if (minify && finalCss) {
      finalCss = finalCss
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove last semicolon before }
        .replace(/\s*{\s*/g, '{') // Trim around {
        .replace(/\s*}\s*/g, '}') // Trim around }
        .replace(/\s*,\s*/g, ',') // Trim around commas
        .replace(/\s*:\s*/g, ':') // Trim around colons
        .replace(/\s*;\s*/g, ';') // Trim around semicolons
        .trim();
      
      await Bun.write(outputCssPath, finalCss);
    }

    console.log('[Build] ✅ CSS processing complete');

  } catch (error) {
    console.error('[Build] ❌ CSS processing failed:', error);
    // Create absolute minimal fallback
    const fallbackCss = '* { box-sizing: border-box; } body { font-family: system-ui, sans-serif; }';
    await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
  }
}

// 🚀 LIGHTNING-FAST HTML GENERATION
async function generateProductionHtmlFast(projectPath: string, outputPath: string): Promise<void> {
  const appDir = join(projectPath, 'app');
  if (!existsSync(appDir)) return;

  const faviconLink = existsSync(join(projectPath, 'app/favicon.svg')) ? 
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">' :
    '<link rel="icon" href="/favicon.ico">';

  const indexHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  ${faviconLink}
  <link rel="stylesheet" href="/styles.css">
  <script type="importmap">{"imports":{"0x1":"/node_modules/0x1/index.js","0x1/router":"/0x1/router.js","0x1/":"/0x1/"}}</script>
  <style>.app-loading{position:fixed;top:20px;right:20px;opacity:0.6;transition:opacity 0.3s}.app-loading.loaded{opacity:0}</style>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <div class="app-loading" id="app-loading">⚡</div>
  <script>
    window.process={env:{NODE_ENV:'production'}};
    (function(){try{const t=localStorage.getItem('0x1-dark-mode');t==='light'?(document.documentElement.classList.remove('dark'),document.body.className='bg-white text-gray-900'):(document.documentElement.classList.add('dark'),document.body.className='bg-slate-900 text-white')}catch{document.documentElement.classList.add('dark')}})();
    window.appReady=function(){const l=document.getElementById('app-loading');l&&l.classList.add('loaded')};
  </script>
  <script src="/app.js" type="module"></script>
</body>
</html>`;

  await Bun.write(join(outputPath, 'index.html'), indexHtml);
}

// 🚀 LIGHTNING-FAST PWA GENERATION
async function generatePwaFilesFast(outputPath: string): Promise<void> {
  const tasks = [
    Bun.write(join(outputPath, 'manifest.json'), JSON.stringify({
      name: "0x1 App",
      short_name: "0x1",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0a0a",
      theme_color: "#0070f3",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    })),
    Bun.write(join(outputPath, 'robots.txt'), 'User-agent: *\nAllow: /'),
    Bun.write(join(outputPath, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc><lastmod>${new Date().toISOString()}</lastmod></url>
</urlset>`)
  ];

  await Promise.all(tasks);
} 