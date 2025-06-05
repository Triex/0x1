/**
 * 0x1 CLI - Build Command - ULTRA-FAST OPTIMIZED WITH COMPONENT IMPORT FIXES
 * Builds the application for production using Bun's full potential
 * Target: <100ms build times with parallel processing and smart caching
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { logger } from '../utils/logger';

// Import the proper metadata system
import { extractMetadataFromFile } from '../../core/metadata';

// Import directive validation functions from component handler
import { processDirectives } from '../../core/directives.js';

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
  private readonly cacheFile = '.0x1/build-cache.json';
  
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
      // Ensure .0x1 directory exists
      const cacheDir = dirname(this.cacheFile);
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }
      
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

// 🚀 CRITICAL FIX: Transform imports for browser (PROPER WORKING VERSION FROM BUILD-OLD.TS)
function transformImportsForBrowser(sourceCode: string): string {
  // CRITICAL FIX: Preserve line breaks and string literals properly
  let transformedCode = sourceCode;
  
  // Transform "0x1" imports first - ONLY match actual import statements
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1["']/gm,
    '$1"/node_modules/0x1/index.js"'
  );
  
  // CRITICAL FIX: Transform 0x1 module imports (Link, router, etc.) - ONLY match actual import statements
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1\/link["']/gm,
    '$1"/0x1/link.js"'
  );
  
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1\/router["']/gm,
    '$1"/0x1/router.js"'
  );
  
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1\/jsx-runtime["']/gm,
    '$1"/0x1/jsx-runtime.js"'
  );
  
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1\/jsx-dev-runtime["']/gm,
    '$1"/0x1/jsx-dev-runtime.js"'
  );
  
  // Transform relative imports to absolute paths - ONLY match actual import statements
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']\.\/([^"']+)["']/gm,
    (match, importPart, path) => {
      // Add .js extension if not present and not already a .js/.ts/.tsx/.jsx file
      if (!path.match(/\.(js|ts|tsx|jsx)$/)) {
        path += '.js';
      } else if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.jsx')) {
        path = path.replace(/\.(ts|tsx|jsx)$/, '.js');
      }
      return `${importPart}"/${path}"`;
    }
  );
  
  // Transform parent directory imports - ONLY match actual import statements
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']\.\.\/([^"']+)["']/gm,
    (match, importPart, path) => {
      if (!path.match(/\.(js|ts|tsx|jsx)$/)) {
        path += '.js';
      } else if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.jsx')) {
        path = path.replace(/\.(ts|tsx|jsx)$/, '.js');
      }
      return `${importPart}"/${path}"`;
    }
  );
  
  // Transform other relative imports that start with / - ONLY match actual import statements
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']\/([^"']+)["']/gm,
    (match, importPart, path) => {
      // Don't transform if it's already a node_modules path or 0x1 path
      if (path.startsWith('node_modules/') || path.startsWith('0x1/')) {
        return match;
      }
      
      if (!path.match(/\.(js|ts|tsx|jsx)$/)) {
        path += '.js';
      } else if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.jsx')) {
        path = path.replace(/\.(ts|tsx|jsx)$/, '.js');
      }
      return `${importPart}"/${path}"`;
    }
  );
  
  // Transform named npm package imports to use polyfill system - ONLY match actual import statements
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']([^"'./][^"']*)["']/gm,
    (match, importPart, packageName) => {
      // Skip transformation for certain system packages
      const skipPackages = ['react', 'react-dom', '0x1'];
      if (skipPackages.includes(packageName) || packageName.startsWith('0x1/')) {
        return match;
      }
      
      // Transform to polyfill path
      return `${importPart}"/node_modules/${packageName}"`;
    }
  );
  
  return transformedCode;
}

// CRITICAL FIX: Add string sanitization function to prevent syntax errors
function sanitizeJavaScriptString(str: string): string {
  // Replace actual line breaks in strings with escaped line breaks
  return str
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

// Insert JSX runtime preamble function (same as dev-server)
function insertJsxRuntimePreamble(code: string): string {
  const lines = code.split('\n');
  let insertIndex = 0;
  let foundImports = false;
  
  // Find the end of imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('import ') || (line.startsWith('export ') && line.includes('from '))) {
      foundImports = true;
      insertIndex = i + 1;
    } else if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      // Skip comments and empty lines but don't update insertIndex unless after imports
      if (foundImports) {
        insertIndex = i + 1;
      }
    } else if (line && foundImports) {
      // Found first non-import, non-comment line after imports
      break;
    }
  }
  
  // Generate JSX runtime preamble
  const preamble = `// 0x1 Framework - JSX Runtime Access\nimport { jsx, jsxs, jsxDEV, Fragment, createElement } from '/0x1/jsx-runtime.js';`;
  
  // Insert the preamble
  lines.splice(insertIndex, 0, preamble);
  
  return lines.join('\n');
}

// Normalize JSX function calls (same as dev-server)
function normalizeJsxFunctionCalls(content: string): string {
  // Log original content statistics
  const originalHashedFunctions = content.match(/jsx[A-Za-z]*_[a-zA-Z0-9_]+/g) || [];
  console.log(`🔧 Starting normalization with ${originalHashedFunctions.length} hashed functions found`);
  
  // Much more aggressive and comprehensive normalization patterns
  // Handle the specific pattern we're seeing: jsxDEV_7x81h0kn
  
  // 1. Most aggressive: Replace any jsx function with underscore and hash
  content = content.replace(/jsxDEV_[a-zA-Z0-9_]+/g, 'jsxDEV');
  content = content.replace(/jsx_[a-zA-Z0-9_]+/g, 'jsx');
  content = content.replace(/jsxs_[a-zA-Z0-9_]+/g, 'jsxs');
  content = content.replace(/Fragment_[a-zA-Z0-9_]+/g, 'Fragment');
  
  // 2. Handle mixed alphanumeric patterns like the one we're seeing
  content = content.replace(/jsxDEV_[0-9a-z]+/gi, 'jsxDEV');
  content = content.replace(/jsx_[0-9a-z]+/gi, 'jsx');
  content = content.replace(/jsxs_[0-9a-z]+/gi, 'jsxs');
  content = content.replace(/Fragment_[0-9a-z]+/gi, 'Fragment');
  
  // 3. Ultra aggressive catch-all: any jsx followed by underscore and anything
  content = content.replace(/\bjsxDEV_\w+/g, 'jsxDEV');
  content = content.replace(/\bjsx_\w+/g, 'jsx');
  content = content.replace(/\bjsxs_\w+/g, 'jsxs');
  content = content.replace(/\bFragment_\w+/g, 'Fragment');
  
  // 4. Even more aggressive: handle any character combinations
  content = content.replace(/jsxDEV_[^(\s]+/g, 'jsxDEV');
  content = content.replace(/jsx_[^(\s]+/g, 'jsx');
  content = content.replace(/jsxs_[^(\s]+/g, 'jsxs');
  content = content.replace(/Fragment_[^(\s]+/g, 'Fragment');
  
  // Log final statistics
  const finalHashedFunctions = content.match(/jsx[A-Za-z]*_[a-zA-Z0-9_]+/g) || [];
  console.log(`🔧 Normalization complete: ${originalHashedFunctions.length} -> ${finalHashedFunctions.length} hashed functions`);
  
  return content;
}

// CRITICAL FIX: Add proper transpilation with safer syntax validation using Bun.Transpiler
async function transpileComponentSafely(sourceCode: string, sourcePath: string): Promise<string> {
  try {
    console.log(`[Build] Attempting to transpile: ${sourcePath}`);
    
    // Enhanced JSX detection (same as dev server)
    const hasJsxElements = /<[A-Z][A-Za-z0-9]*[\s/>]/.test(sourceCode) || // React components
                           /<[a-z][A-Za-z0-9-]*[\s/>]/.test(sourceCode) || // HTML elements
                           /<\/[A-Za-z]/.test(sourceCode) || // Closing tags
                           /<>/.test(sourceCode) || // React fragments
                           /<\/[^>]+>/.test(sourceCode); // Any closing tag
    
    const hasJsxCalls = /jsx\s*\(/.test(sourceCode) || 
                       /jsxs\s*\(/.test(sourceCode) || 
                       /jsxDEV\s*\(/.test(sourceCode) ||
                       /jsx[A-Za-z]*_[a-zA-Z0-9_]+\s*\(/.test(sourceCode); // Detect hashed jsx functions
    
    console.log(`[Build] JSX Detection for ${sourcePath}:`);
    console.log(`[Build]   Has JSX elements: ${hasJsxElements}`);
    console.log(`[Build]   Has jsx calls: ${hasJsxCalls}`);
    
    // CRITICAL FIX: Disable aggressive directive validation for documentation files
    const isDocumentationFile = sourcePath.includes('/docs/') || sourcePath.includes('/app/docs/');
    
    let processedCode = sourceCode;
    if (!isDocumentationFile) {
      // Only validate non-documentation files
      const directiveValidation = validateFileDirectives(sourcePath, sourceCode);
      if (directiveValidation.hasErrors) {
        // Filter out false positives from code examples
        const realErrors = directiveValidation.errors.filter((error: any) => {
          if (error.message.includes('server API') || error.message.includes('Async functions')) {
            return false;
          }
          return true;
        });
        
        if (realErrors.length > 0) {
          console.warn(`[Build] Directive validation errors in ${sourcePath}:`, realErrors);
          // For build, we'll continue but log the errors
        }
      }
      processedCode = directiveValidation.processedCode;
    } else {
      console.log(`[Build] Skipping directive validation for documentation file: ${sourcePath}`);
    }
    
    // Transform imports for browser compatibility
    processedCode = transformBareImports(processedCode, sourcePath);
    
    // CRITICAL FIX: Force JSX transpilation for any file with JSX elements
    if (hasJsxElements || sourcePath.endsWith('.tsx') || sourcePath.endsWith('.jsx')) {
      console.log(`[Build] FORCING JSX transpilation for: ${sourcePath}`);
      
      const transpiler = new Bun.Transpiler({
        loader: 'tsx', // Always use tsx loader for JSX files
        target: 'browser',
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
          'global': 'globalThis'
        }
      });
      
      const transpiledContent = await transpiler.transform(processedCode);
      console.log(`[Build] Transpilation complete for ${sourcePath}. Output length: ${transpiledContent.length}`);
      
      // Check if transpilation actually converted JSX (same validation as dev server)
      const hasJsxAfterTranspile = /<[A-Za-z]/.test(transpiledContent);
      const hasJsxCallsAfterTranspile = /jsx\s*\(/.test(transpiledContent) || 
                                        /jsxs\s*\(/.test(transpiledContent) || 
                                        /jsxDEV\s*\(/.test(transpiledContent) ||
                                        /jsx[A-Za-z]*_[a-zA-Z0-9_]+\s*\(/.test(transpiledContent); // Detect hashed jsx functions
      
      console.log(`[Build] Post-transpilation analysis for ${sourcePath}:`);
      console.log(`[Build]   Still has JSX elements: ${hasJsxAfterTranspile}`);
      console.log(`[Build]   Now has jsx calls: ${hasJsxCallsAfterTranspile}`);
      
      if (hasJsxAfterTranspile && !hasJsxCallsAfterTranspile) {
        throw new Error(`JSX elements still present but no jsx calls generated in ${sourcePath}`);
      }
      
      // Normalize JSX function calls and insert runtime preamble
      let finalCode = normalizeJsxFunctionCalls(transpiledContent);
      finalCode = insertJsxRuntimePreamble(finalCode);
      
      console.log(`[Build] ✅ Successfully transpiled JSX file: ${sourcePath}`);
      return finalCode;
    } else {
      // Non-JSX file - just process imports and return
      console.log(`[Build] Processing non-JSX file: ${sourcePath}`);
      let finalCode = processedCode;
      
      // Still add JSX runtime preamble in case the component needs it
      finalCode = insertJsxRuntimePreamble(finalCode);
      
      console.log(`[Build] ✅ Successfully processed non-JSX file: ${sourcePath}`);
      return finalCode;
    }
    
  } catch (error) {
    console.error(`[Build] CRITICAL ERROR transpiling ${sourcePath}:`, error);
    throw error;
  }
}

// CRITICAL FIX: Generate error component for failed transpilation
function generateErrorComponent(filePath: string, errorMessage: string): string {
  const safePath = sanitizeJavaScriptString(filePath);
  const safeError = sanitizeJavaScriptString(errorMessage);
  
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

// 🚀 LIGHTNING-FAST ROUTE DISCOVERY WITH NESTED LAYOUT SUPPORT
async function discoverRoutesSuperFast(projectPath: string): Promise<Array<{ path: string; componentPath: string; layouts: Array<{ path: string; componentPath: string }> }>> {
  const routes: Array<{ path: string; componentPath: string; layouts: Array<{ path: string; componentPath: string }> }> = [];
  const appDir = join(projectPath, 'app');
  
  if (!existsSync(appDir)) return routes;

  const scanDirFast = async (dirPath: string, routePath: string = '', parentLayouts: Array<{ path: string; componentPath: string }> = []): Promise<void> => {
    try {
      const items = readdirSync(dirPath, { withFileTypes: true });
      
      // Check for layout file in current directory
      const layoutFiles = items.filter(item => 
        !item.isDirectory() && (item.name === 'layout.tsx' || item.name === 'layout.ts' || 
                               item.name === 'layout.jsx' || item.name === 'layout.js')
      );

      // Build current layout hierarchy (parent layouts + current layout if exists)
      const currentLayouts = [...parentLayouts];
      if (layoutFiles.length > 0) {
        const actualLayoutFile = layoutFiles[0].name;
        const layoutComponentPath = join(dirPath, actualLayoutFile)
          .replace(projectPath, '')
          .replace(/\\/g, '/')
          .replace(/\.(tsx|ts|jsx)$/, '.js');
        
        currentLayouts.push({ 
          path: routePath || "/", 
          componentPath: layoutComponentPath 
        });
        
        console.log(`[Build] Found layout: ${routePath || "/"} -> ${layoutComponentPath} (source: ${actualLayoutFile})`);
      }
      
      const tasks = items.map(async (item) => {
        if (item.isDirectory() && !item.name.startsWith('.') && !item.name.startsWith('(')) {
          const newRoutePath = routePath + '/' + item.name;
          await scanDirFast(join(dirPath, item.name), newRoutePath, currentLayouts);
        } else if (item.name === 'page.tsx' || item.name === 'page.ts' || item.name === 'page.jsx' || item.name === 'page.js') {
          const fullRoutePath = routePath || '/';
          const componentPath = join(dirPath, item.name)
            .replace(projectPath, '')
            .replace(/\\/g, '/')
            .replace(/\.(tsx|ts|jsx)$/, '.js');
          
          routes.push({
            path: fullRoutePath,
            componentPath: componentPath,
            layouts: currentLayouts
          });
          
          console.log(`[Build] Found route: ${fullRoutePath} -> ${componentPath} with ${currentLayouts.length} layouts`);
        }
      });
      
      await Promise.all(tasks);
    } catch (error) {
      // Silent fail for individual directories
      console.warn(`[Build] Error scanning directory ${dirPath}:`, error);
    }
  };

  await scanDirFast(appDir);
  
  // Log layout hierarchy for debugging
  routes.forEach(route => {
    if (route.layouts.length > 0) {
      console.log(`[Build] Route ${route.path} layout hierarchy: ${route.layouts.map(l => l.path).join(' -> ')}`);
    }
  });
  
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

// 🚀 ULTRA-FAST APP.JS GENERATION - FIXED WITH BUILD-OLD.TS STABILITY
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

  // Generate the production app.js with enhanced stability (from build-old.ts)
  const appScript = `// 0x1 Framework App Bundle - PRODUCTION-READY with ENHANCED STABILITY
console.log('[0x1 App] Starting production-ready app with proper sequencing...');

// Server-discovered routes
const serverRoutes = ${routesJson};

// ===== PRODUCTION-READY POLYFILL SYSTEM =====
const polyfillCache = new Map();
const polyfillQueue = new Map();

async function loadPolyfillOnDemand(polyfillName) {
  if (polyfillCache.has(polyfillName)) {
    return polyfillCache.get(polyfillName);
  }
  
  if (polyfillQueue.has(polyfillName)) {
    return polyfillQueue.get(polyfillName);
  }
  
  console.log('[0x1 App] Loading polyfill:', polyfillName);
  
  const promise = (async () => {
    try {
      const polyfillScript = document.createElement('script');
      polyfillScript.type = 'module';
      polyfillScript.src = '/node_modules/' + polyfillName;
      
      await new Promise((resolve, reject) => {
        polyfillScript.onload = resolve;
        polyfillScript.onerror = reject;
        document.head.appendChild(polyfillScript);
      });
      
      console.log('[0x1 App] ✅ Polyfill loaded:', polyfillName);
      return true;
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to load polyfill:', polyfillName, error);
      return false;
    }
  })();
  
  polyfillQueue.set(polyfillName, promise);
  polyfillCache.set(polyfillName, promise);
  
  try {
    await promise;
    return promise;
  } finally {
    polyfillQueue.delete(polyfillName);
  }
}

// ===== MAIN INITIALIZATION WITH ENHANCED STABILITY =====
async function initApp() {
  try {
    console.log('[0x1 App] 🚀 Starting production-ready initialization...');
    
    // CRITICAL: Clear any existing router state and timers
    if (window.__0x1_ROUTER__) {
      console.log('[0x1 App] 🧹 Cleaning up existing router state...');
      try {
        window.__0x1_ROUTER__.destroy?.();
      } catch (e) {
        console.warn('[0x1 App] Router cleanup warning:', e);
      }
      delete window.__0x1_ROUTER__;
      delete window.__0x1_router;
      delete window.router;
    }
    
    // Clear any existing timers and callbacks
    if (window.__0x1_cleanup) {
      console.log('[0x1 App] 🧹 Running existing cleanup...');
      try {
        window.__0x1_cleanup();
      } catch (e) {
        console.warn('[0x1 App] Cleanup warning:', e);
      }
    }
    
    // Clear any existing app content and ensure clean state
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '';
      // Force a DOM flush
      appElement.offsetHeight;
    }
    
    // Step 1: Load essential dependencies with retry logic
    console.log('[0x1 App] 🎯 Loading essential dependencies...');
    
    let hooksLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!hooksLoaded && retryCount < maxRetries) {
      try {
        const hooksScript = document.createElement('script');
        hooksScript.type = 'module';
        hooksScript.src = '/0x1/hooks.js' + (retryCount > 0 ? '?retry=' + retryCount : '');
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Hooks loading timeout'));
          }, 5000);
          
          hooksScript.onload = () => {
            clearTimeout(timeout);
            console.log('[0x1 App] ✅ Hooks ready');
            hooksLoaded = true;
            resolve();
          };
          hooksScript.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
          document.head.appendChild(hooksScript);
        });
      } catch (error) {
        retryCount++;
        console.warn('[0x1 App] ⚠️ Hooks loading attempt ' + retryCount + ' failed:', error);
        if (retryCount >= maxRetries) {
          throw new Error('Failed to load hooks after ' + maxRetries + ' attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Step 2: Create router with enhanced error handling
    console.log('[0x1 App] Creating router...');
    
    let routerModule;
    retryCount = 0;
    
    while (!routerModule && retryCount < maxRetries) {
      try {
        routerModule = await import('/0x1/router.js' + (retryCount > 0 ? '?retry=' + retryCount : ''));
      } catch (error) {
        retryCount++;
        console.warn('[0x1 App] ⚠️ Router loading attempt ' + retryCount + ' failed:', error);
        if (retryCount >= maxRetries) {
          throw new Error('Failed to load router after ' + maxRetries + ' attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    // Create beautiful 404 component
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
    
    console.log('[0x1 App] ✅ Router ready with beautiful 404 handling');
    
    // Step 3: Register routes with enhanced error handling and DOM mounting sync
    console.log('[0x1 App] 📝 Registering routes...');
    
    for (const route of serverRoutes) {
      try {
        const routeComponent = async (props) => {
          console.log('[0x1 App] 🔍 Route component called for:', route.path);
          
          let componentModule;
          let loadRetryCount = 0;
          const maxLoadRetries = 3;
          
          while (!componentModule && loadRetryCount < maxLoadRetries) {
            try {
              // Use cache-busting query parameter for retries only
              const importPath = route.componentPath + (loadRetryCount > 0 ? '?retry=' + loadRetryCount : '');
              componentModule = await import(importPath);
              break; // Exit loop on success
              
            } catch (error) {
              loadRetryCount++;
              console.warn('[0x1 App] ⚠️ Component loading attempt ' + loadRetryCount + ' failed for ' + route.path + ':', error);
              
              if (loadRetryCount >= maxLoadRetries) {
                console.error('[0x1 App] ❌ Route component error after all retries:', route.path, error);
                return {
                  type: 'div',
                  props: { 
                    className: 'p-8 text-center',
                    style: 'color: #ef4444;' 
                  },
                  children: ['❌ Failed to load component: ' + route.path]
                };
              }
              
              // Short retry delay
              await new Promise(resolve => setTimeout(resolve, 100 * loadRetryCount));
            }
          }
          
          if (componentModule && componentModule.default) {
            console.log('[0x1 App] ✅ Route component resolved:', route.path);
            // NO EXTRA DELAYS - let router handle timing
            return componentModule.default(props);
          } else {
            console.warn('[0x1 App] ⚠️ Component has no default export:', route.path);
            return {
              type: 'div',
              props: { 
                className: 'p-8 text-center',
                style: 'color: #f59e0b;' 
              },
              children: ['⚠️ Component loaded but has no default export: ' + route.path]
            };
          }
        };
        
        router.addRoute(route.path, routeComponent, { 
          componentPath: route.componentPath 
        });
        
        console.log('[0x1 App] ✅ Route registered:', route.path);
        
      } catch (error) {
        console.error('[0x1 App] ❌ Failed to register route:', route.path, error);
      }
    }
    
    console.log('[0x1 App] 📊 All routes registered successfully');
    
    // Step 4: Start router with proper DOM synchronization
    console.log('[0x1 App] 🎯 Starting router...');
    
    // Simple DOM readiness check
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    
    router.init();
    
    // Navigate to current path immediately
    router.navigate(window.location.pathname, false);
    
    // Setup cleanup function for future use
    window.__0x1_cleanup = () => {
      if (router && router.destroy) {
        router.destroy();
      }
    };
    
    // Hide loading indicator immediately
    if (typeof window.appReady === 'function') {
      window.appReady();
    }
    
    console.log('[0x1 App] ✅ Production-ready app initialized successfully!');
    
  } catch (error) {
    console.error('[0x1 App] ❌ Initialization failed:', error);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444; margin-bottom: 16px;">Application Error</h2><p style="color: #6b7280; margin-bottom: 20px;">' + error.message + '</p><details style="text-align: left; background: #f9fafb; padding: 16px; border-radius: 8px;"><summary style="cursor: pointer; font-weight: bold;">Error Details</summary><pre style="font-size: 12px; overflow-x: auto;">' + (error.stack || 'No stack trace') + '</pre></details><button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button></div>';
    }
    
    // Hide loading indicator immediately
    if (typeof window.appReady === 'function') {
      window.appReady();
    }
  }
}

// ===== START IMMEDIATELY =====
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
  routes: Array<{ path: string; componentPath: string; layouts: Array<{ path: string; componentPath: string }> }>,
  allComponents: Array<{ path: string; relativePath: string; dir: string }>
): Promise<void> {
  console.log(`[Build] 🚀 COMPONENT GENERATION with nested layout support...`);

  const results = await Promise.all(
    routes.map(async (route) => {
      try {
        const sourcePath = join(projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
        
        // Check cache first
        const cached = await buildCache.get(sourcePath);
        if (cached) {
          const outputPath_component = join(outputPath, route.componentPath.replace(/^\//, ''));
          await mkdir(dirname(outputPath_component), { recursive: true });
          await Bun.write(outputPath_component, cached);
          return 1;
        }
        
        if (!existsSync(sourcePath)) {
          const tsxAlt = sourcePath.replace('.tsx', '.ts');
          const jsxAlt = sourcePath.replace('.tsx', '.jsx');
          const jsAlt = sourcePath.replace('.tsx', '.js');
          
          if (existsSync(tsxAlt)) {
            return await processRouteComponent(tsxAlt, route, outputPath);
          } else if (existsSync(jsxAlt)) {
            return await processRouteComponent(jsxAlt, route, outputPath);
          } else if (existsSync(jsAlt)) {
            return await processRouteComponent(jsAlt, route, outputPath);
          }
          
          console.warn(`[Build] ⚠️ Route component not found: ${sourcePath}`);
          return 0;
        }
        
        return await processRouteComponent(sourcePath, route, outputPath);
      } catch (error) {
        console.warn(`[Build] ⚠️ Failed to generate route component ${route.path}:`, error);
        return 0;
      }
    })
  );

  // Helper function to process individual route components with nested layouts
  async function processRouteComponent(sourcePath: string, route: any, outputPath: string): Promise<number> {
    try {
      let sourceCode = await Bun.file(sourcePath).text();
      const isPageComponent = sourcePath.endsWith('/page.tsx') || sourcePath.endsWith('/page.jsx') || 
                             sourcePath.endsWith('/page.ts') || sourcePath.endsWith('/page.js');
      
      // Handle nested layouts composition
      if (isPageComponent && route.layouts && route.layouts.length > 0) {
        console.log(`[Build] Composing ${route.layouts.length} layouts for route ${route.path}`);
        
        // Load all layout components
        const layoutContents: string[] = [];
        const layoutNames: string[] = [];
        
        for (let i = 0; i < route.layouts.length; i++) {
          const layout = route.layouts[i];
          const layoutSourcePath = join(projectPath, layout.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
          
          // Try different extensions for layout
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
            const layoutContent = await Bun.file(actualLayoutPath).text();
            const layoutFunctionName = `Layout${i}`;
            
            // Extract layout component and give it a unique name
            const processedLayoutContent = layoutContent
              .replace(/export\s+default\s+function\s+\w+/, `function ${layoutFunctionName}`)
              .replace(/import\s+["']\.\/globals\.css[""];?\s*\n?/g, '')
              .replace(/import\s+["'][^"']*\.css[""];?\s*\n?/g, '');
            
            layoutContents.push(processedLayoutContent);
            layoutNames.push(layoutFunctionName);
            
            console.log(`[Build] Loaded layout ${i}: ${layout.componentPath} as ${layoutFunctionName}`);
          } else {
            console.warn(`[Build] Layout not found: ${actualLayoutPath}`);
          }
        }
        
        // Extract page component
        const defaultExportMatch = sourceCode.match(/export\s+default\s+function\s+(\w+)/);
        const pageComponentName = defaultExportMatch?.[1] || 'PageComponent';
        
        const pageWithoutExport = sourceCode.replace(/export\s+default\s+function\s+\w+/, `function ${pageComponentName}`);
        
        // Compose all layouts with the page component
        let wrappedComponentCode = `${pageComponentName}(props)`;
        
        // Apply layouts from innermost to outermost (reverse order)
        for (let i = layoutNames.length - 1; i >= 0; i--) {
          const layoutName = layoutNames[i];
          wrappedComponentCode = `${layoutName}({ children: ${wrappedComponentCode}, ...props })`;
        }
        
        // Combine all layout contents + page + wrapper
        sourceCode = `${layoutContents.join('\n\n')}\n\n${pageWithoutExport}\n\nexport default function WrappedPage(props) {\n  return ${wrappedComponentCode};\n}`;
        
        console.log(`[Build] Composed nested layouts for ${route.path}: ${layoutNames.join(' -> ')} -> ${pageComponentName}`);
      }
      
      // CRITICAL FIX: Use safe transpilation
      let transpiledContent = await transpileComponentSafely(sourceCode, sourcePath);
      
      // Transform imports AFTER transpiling
      transpiledContent = transformImportsForBrowser(transpiledContent);
      
      const outputPath_component = join(outputPath, route.componentPath.replace(/^\//, ''));
      await mkdir(dirname(outputPath_component), { recursive: true });
      await Bun.write(outputPath_component, transpiledContent);
      
      // Cache the result
      await buildCache.set(sourcePath, transpiledContent);
      
      return 1;
    } catch (error) {
      console.warn(`[Build] ⚠️ Failed to process route component ${route.path}:`, error);
      return 0;
    }
  }

  const successful = results.reduce((sum, result) => sum + result, 0);
  console.log(`[Build] ✅ Generated ${successful}/${routes.length} components with nested layout support`);
}

// 🚀 LIGHTNING-FAST FRAMEWORK FILES COPY - FIXED ROUTER ISSUE  
async function copy0x1FrameworkFilesFast(outputPath: string): Promise<void> {
  const framework0x1Dir = join(outputPath, '0x1');
  const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
  
  // Get framework files from the same location as build-old.ts
  const currentFile = new URL(import.meta.url).pathname;
  const frameworkRoot = resolve(dirname(currentFile), '..', '..');
  const frameworkDistPath = join(frameworkRoot, 'dist');

  // CRITICAL FIX: Use the updated 0x1-router as single source of truth (from build-old.ts)
  const routerSourcePath = join(frameworkRoot, '0x1-router', 'dist', 'index.js');

  const frameworkFiles = [
    { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
    { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
    { src: 'core/hooks.js', dest: 'hooks.js' },
    { src: 'index.js', dest: 'index.js' },
    { src: 'link.js', dest: 'link.js' }
  ];

  let copiedCount = 0;

  // Copy standard framework files
  for (const { src, dest } of frameworkFiles) {
    const srcPath = join(frameworkDistPath, src);
    const destPath = join(framework0x1Dir, dest);

    if (existsSync(srcPath)) {
      const content = await Bun.file(srcPath).text();
      await Bun.write(destPath, content);
      copiedCount++;
    }
  }

  // CRITICAL: Copy the updated router from 0x1-router package (same as build-old.ts)
  if (existsSync(routerSourcePath)) {
    const routerContent = await Bun.file(routerSourcePath).text();
    const routerDestPath = join(framework0x1Dir, 'router.js');
    await Bun.write(routerDestPath, routerContent);
    copiedCount++;
    logger.info('✅ Using updated 0x1-router as single source of truth');
  } else {
    logger.error(`❌ Updated 0x1-router not found at: ${routerSourcePath}`);
    // Fallback to old router if new one doesn't exist
    const fallbackRouterPath = join(frameworkDistPath, 'core/router.js');
    if (existsSync(fallbackRouterPath)) {
      const content = await Bun.file(fallbackRouterPath).text();
      await Bun.write(join(framework0x1Dir, 'router.js'), content);
      copiedCount++;
      logger.warn('⚠️ Using fallback router - rebuild 0x1-router for latest fixes');
    }
  }

  // CRITICAL: Generate browser-compatible 0x1 framework entry point (same as build-old.ts)
  await generateBrowserCompatible0x1EntryFast(nodeModulesDir);

  if (copiedCount === 0) {
    logger.warn('⚠️ No 0x1 framework files found - build may not work in production');
  }
}

async function generateBrowserCompatible0x1EntryFast(nodeModulesDir: string): Promise<void> {
  // Use the EXACT same browser-compatible module as build-old.ts
  const cleanFrameworkModule = `// 0x1 Framework - Dynamic Runtime Hook Resolution (Build Version)
console.log('[0x1] Framework module loaded - dynamic runtime version');

// =====================================================
// DYNAMIC RUNTIME HOOK RESOLUTION
// =====================================================

// Create dynamic getters that resolve hooks at import time, not module load time
if (!globalThis.hasOwnProperty('__0x1_hooks_getter')) {
Object.defineProperty(globalThis, '__0x1_hooks_getter', {
  value: function(hookName) {
    // Check window.React first (set by hooks module)
    if (typeof window !== 'undefined' && window.React && typeof window.React[hookName] === 'function') {
      return window.React[hookName];
    }
    
    // Check direct window access
    if (typeof window !== 'undefined' && typeof window[hookName] === 'function') {
      return window[hookName];
    }
    
    // Check JSX runtime hooks
    if (typeof window !== 'undefined' && typeof window.__0x1_useState === 'function' && hookName === 'useState') {
      return window.__0x1_useState;
    }
    
    // Check for useEffect specifically
    if (typeof window !== 'undefined' && typeof window.__0x1_useEffect === 'function' && hookName === 'useEffect') {
      return window.__0x1_useEffect;
    }
    
    // Debug: show what's available
    const available = typeof window !== 'undefined' && window.React 
      ? Object.keys(window.React).filter(k => typeof window.React[k] === 'function')
      : 'React not available';
    
    console.error('[0x1] Hook "' + hookName + '" not found. Available: ' + available);
    throw new Error('[0x1] ' + hookName + ' not available - hooks may not be loaded yet');
  },
  writable: false,
  enumerable: false
});
}

// Create runtime hook getters - these resolve the actual hooks when first accessed
if (!globalThis.hasOwnProperty('__0x1_useState')) {
Object.defineProperty(globalThis, '__0x1_useState', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useState');
    // Replace this getter with the actual hook for performance
    Object.defineProperty(globalThis, '__0x1_useState', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useEffect')) {
Object.defineProperty(globalThis, '__0x1_useEffect', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useEffect');
    Object.defineProperty(globalThis, '__0x1_useEffect', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useCallback')) {
Object.defineProperty(globalThis, '__0x1_useCallback', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useCallback');
    Object.defineProperty(globalThis, '__0x1_useCallback', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useMemo')) {
Object.defineProperty(globalThis, '__0x1_useMemo', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useMemo');
    Object.defineProperty(globalThis, '__0x1_useMemo', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useRef')) {
Object.defineProperty(globalThis, '__0x1_useRef', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useRef');
    Object.defineProperty(globalThis, '__0x1_useRef', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

// Export the dynamic hooks - CRITICAL FIX: Add useEffect export
export const useState = (...args) => globalThis.__0x1_useState(...args);
export const useEffect = (...args) => globalThis.__0x1_useEffect(...args);
export const useCallback = (...args) => globalThis.__0x1_useCallback(...args);
export const useMemo = (...args) => globalThis.__0x1_useMemo(...args);
export const useRef = (...args) => globalThis.__0x1_useRef(...args);
export const useClickOutside = (...args) => globalThis.__0x1_hooks_getter('useClickOutside')(...args);
export const useFetch = (...args) => globalThis.__0x1_hooks_getter('useFetch')(...args);
export const useForm = (...args) => globalThis.__0x1_hooks_getter('useForm')(...args);
export const useLocalStorage = (...args) => globalThis.__0x1_hooks_getter('useLocalStorage')(...args);

// Additional exports
export const JSXNode = (...args) => {
  if (typeof window !== 'undefined' && window.JSXNode) {
    return window.JSXNode(...args);
  }
  throw new Error('[0x1] JSXNode not available - JSX runtime not loaded');
};

console.log('[0x1] Dynamic runtime hook resolution ready');

// =====================================================
// MINIMAL JSX RUNTIME DELEGATION
// =====================================================

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

// Export version
export const version = '0.1.0';

// Default export
export default {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  jsx,
  jsxs,
  jsxDEV,
  createElement,
  Fragment,
  JSXNode,
  version
};
`;

  // Write the browser-compatible entry point
  await Bun.write(join(nodeModulesDir, 'index.js'), cleanFrameworkModule);

  logger.info('✅ Generated browser-compatible 0x1 framework entry point');
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
        /@import\s+["']tailwindcss[""];?\s*/g,
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

// 🚀 LIGHTNING-FAST HTML GENERATION WITH METADATA EXTRACTION
async function generateProductionHtmlFast(projectPath: string, outputPath: string): Promise<void> {
  const appDir = join(projectPath, 'app');
  if (!existsSync(appDir)) return;

  // Get discovered routes for metadata extraction
  const discoveredRoutes = await discoverRoutesSuperFast(projectPath);
  
  const faviconLink = existsSync(join(projectPath, 'app/favicon.svg')) ? 
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">' :
    '<link rel="icon" href="/favicon.ico">';

  // Generate metadata for each route
  const routeMetadata = await Promise.all(discoveredRoutes.map(async (route) => {
    const metadata = await extractMetadataFromPage(projectPath, route);
    return { ...route, metadata };
  }));

  // Generate the main index.html (fallback for SPA)
  const baseMetadata = {
    title: "0x1 App",
    description: "The ultimate TypeScript framework powered by Bun"
  };
  
  const baseHtml = generateHtmlTemplate(baseMetadata, faviconLink, "/");
  await Bun.write(join(outputPath, 'index.html'), baseHtml);

  // Generate individual HTML files for each route with proper metadata
  for (const { path: routePath, metadata } of routeMetadata) {
    const mergedMetadata = {
      title: metadata.title || "0x1 App",
      description: metadata.description || "0x1 Framework page",
      keywords: metadata.keywords,
      author: metadata.author,
      image: metadata.image,
      openGraph: metadata.openGraph,
      twitter: metadata.twitter
    };
    
    if (routePath === '/') {
      // Update the main index.html with homepage metadata
      const homeHtml = generateHtmlTemplate(mergedMetadata, faviconLink, "/");
      await Bun.write(join(outputPath, 'index.html'), homeHtml);
      } else {
      // Generate individual HTML files for other routes
      const routeHtml = generateHtmlTemplate(mergedMetadata, faviconLink, routePath);
      
      // Create the directory structure for the route
      const routeDir = join(outputPath, routePath === '/' ? '' : routePath);
      if (routePath !== '/') {
        await mkdir(routeDir, { recursive: true });
        await Bun.write(join(routeDir, 'index.html'), routeHtml);
      }
    }
  }

  console.log(`[Build] ✅ Generated HTML files for ${routeMetadata.length} routes with metadata`);
}

// Extract metadata from page components using the proper metadata system
async function extractMetadataFromPage(projectPath: string, route: { path: string; componentPath: string }): Promise<any> {
  try {
    // Find the source file for this route
    const sourcePath = join(projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
    const possiblePaths = [
      sourcePath,
      sourcePath.replace('.tsx', '.ts'),
      sourcePath.replace('.tsx', '.jsx'),
      sourcePath.replace('.tsx', '.js')
    ];
    
    const pageFile = possiblePaths.find(path => existsSync(path));
    if (!pageFile) return {};
    
    // Use the built-in metadata extraction system
    const extractedMetadata = await extractMetadataFromFile(pageFile);
    
    if (extractedMetadata) {
      console.log(`[Build] ✅ Extracted metadata from ${pageFile}:`, extractedMetadata.title);
      return extractedMetadata;
    }
    
    // Fallback: extract from comments if no export found
    const content = await Bun.file(pageFile).text();
    const metadata: any = {};
    
    // Look for metadata comments at the top of the file
    const metadataComment = content.match(/\/\*\*[\s\S]*?\*\//);
    if (metadataComment) {
      const comment = metadataComment[0];
      
      // Extract title
      const titleMatch = comment.match(/@title\s+(.+)/);
      if (titleMatch) metadata.title = titleMatch[1].trim();
      
      // Extract description
      const descMatch = comment.match(/@description\s+(.+)/);
      if (descMatch) metadata.description = descMatch[1].trim();
      
      // Extract keywords
      const keywordsMatch = comment.match(/@keywords\s+(.+)/);
      if (keywordsMatch) metadata.keywords = keywordsMatch[1].trim();
      
      // Extract author
      const authorMatch = comment.match(/@author\s+(.+)/);
      if (authorMatch) {
        metadata.author = authorMatch[1].trim();
      }
      
      // Extract image for OpenGraph
      const imageMatch = comment.match(/@image\s+(.+)/);
      if (imageMatch) {
        metadata.image = imageMatch[1].trim();
        metadata.openGraph = {
          images: [{ url: imageMatch[1].trim(), width: 1200, height: 630, alt: metadata.title || 'Page Image' }]
        };
        metadata.twitter = {
          card: 'summary_large_image' as const,
          image: imageMatch[1].trim()
        };
      }
    }
    
    // Default metadata based on route path if nothing found
    if (!metadata.title) {
      const routeName = route.path === '/' ? 'Home' : 
                       route.path.split('/').filter(p => p).map(p => 
                         p.charAt(0).toUpperCase() + p.slice(1)
                       ).join(' ');
      metadata.title = `${routeName} | 0x1 App`;
    }
    
    if (!metadata.description) {
      const titleStr = typeof metadata.title === 'string' ? metadata.title : metadata.title?.default || 'Page';
      metadata.description = `${titleStr.replace(' | 0x1 App', '')} page for 0x1 Framework application`;
    }
    
    return metadata;
  } catch (error) {
    console.warn(`[Build] Failed to extract metadata from ${route.componentPath}:`, error);
    return {};
  }
}

// Generate HTML template with metadata using simple approach
function generateHtmlTemplate(metadata: any, faviconLink: string, currentPath: string): string {
  // Resolve title properly
  const resolvedTitle = typeof metadata.title === 'string' 
    ? metadata.title 
    : metadata.title?.absolute || metadata.title?.default || '0x1 App';
    
  const description = metadata.description || "0x1 Framework application";
  const keywords = Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords || "";
  const author = metadata.author || metadata.authors?.[0]?.name || "";
  const ogImage = metadata.image || metadata.openGraph?.images?.[0]?.url || metadata.twitter?.image || "";
  
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${resolvedTitle}</title>
  <meta name="title" content="${resolvedTitle}">
  <meta name="description" content="${description}">
  ${keywords ? `<meta name="keywords" content="${keywords}">` : ''}
  ${author ? `<meta name="author" content="${author}">` : ''}
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${currentPath}">
  <meta property="og:title" content="${resolvedTitle}">
  <meta property="og:description" content="${description}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${currentPath}">
  <meta property="twitter:title" content="${resolvedTitle}">
  <meta property="twitter:description" content="${description}">
  ${ogImage ? `<meta property="twitter:image" content="${ogImage}">` : ''}
  
  <!-- Additional Meta Tags -->
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="theme-color" content="#7c3aed">
  
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

/**
 * Transform code content to handle imports for browser compatibility
 * This converts React and 0x1 imports to browser-compatible paths
 * and removes CSS imports that would cause MIME type errors
 */
function transformBareImports(content: string, filePath?: string, projectPath?: string): string {
  // CRITICAL FIX: Preserve destructuring imports properly
  let transformedContent = content;
  
  // CRITICAL: Remove CSS imports first (they cause MIME type errors)
  transformedContent = transformedContent
    .replace(/import\s*['"'][^'"]*\.css['"];?/g, '// CSS import removed for browser compatibility')
    .replace(/import\s*['"'][^'"]*\.scss['"];?/g, '// SCSS import removed for browser compatibility')
    .replace(/import\s*['"'][^'"]*\.sass['"];?/g, '// SASS import removed for browser compatibility')
    .replace(/import\s*['"'][^'"]*\.less['"];?/g, '// LESS import removed for browser compatibility');
  
  // Transform 0x1 imports ONLY
  transformedContent = transformedContent.replace(
    /import\s+(.+?)\s+from\s+['"]0x1['"]/g,
    'import $1 from "/node_modules/0x1/index.js"'
  );
  
  // Transform relative imports to absolute paths
  transformedContent = transformedContent.replace(
    /import\s+(.+?)\s+from\s+['"](\.\.\/.+?)['"]/g,
    (match, importClause, importPath) => {
      // Don't modify the import clause structure - just fix the path
      let browserPath = importPath;
      
      // Map specific patterns to browser-accessible paths
      if (importPath.includes('components/')) {
        browserPath = importPath.replace(/^\.\.\/.*?components\//, '/components/');
      } else if (importPath.includes('lib/')) {
        browserPath = importPath.replace(/^\.\.\/.*?lib\//, '/lib/');
      } else if (importPath.includes('utils/')) {
        browserPath = importPath.replace(/^\.\.\/.*?utils\//, '/utils/');
      } else {
        browserPath = importPath.replace(/^\.\.\//, '/');
      }
      
      // Add .js extension if not present
      if (!browserPath.endsWith('.js') && !browserPath.endsWith('.ts') && !browserPath.endsWith('.tsx') && 
          !browserPath.endsWith('.css') && !browserPath.endsWith('.json') && !browserPath.endsWith('.svg')) {
        browserPath += '.js';
      }
      
      // Return the import with the same clause structure
      return `import ${importClause} from '${browserPath}'`;
    }
  );
  
  // Transform same-directory imports
  transformedContent = transformedContent.replace(
    /import\s+(.+?)\s+from\s+['"](\.\/.+?)['"]/g,
    (match, importClause, importPath) => {
      let browserPath = importPath;
      
      if (importPath.includes('components/')) {
        browserPath = importPath.replace(/^\.\/.*?components\//, '/components/');
      } else if (importPath.includes('lib/')) {
        browserPath = importPath.replace(/^\.\/.*?lib\//, '/lib/');
      } else if (importPath.includes('utils/')) {
        browserPath = importPath.replace(/^\.\/.*?utils\//, '/utils/');
      } else {
        browserPath = importPath.replace(/^\.\//, '/components/');
      }
      
      if (!browserPath.endsWith('.js') && !browserPath.endsWith('.ts') && !browserPath.endsWith('.tsx') && 
          !browserPath.endsWith('.css') && !browserPath.endsWith('.json') && !browserPath.endsWith('.svg')) {
        browserPath += '.js';
      }
      
      return `import ${importClause} from '${browserPath}'`;
    }
  );
  
  return transformedContent;
}

/**
 * Process and validate a TypeScript/JSX file for directive usage
 */
function validateFileDirectives(
  filePath: string,
  sourceCode: string
): {
  hasErrors: boolean;
  errors: Array<{ type: string; message: string; line: number; suggestion: string }>;
  inferredContext?: 'client' | 'server';
  processedCode: string;
} {
  try {
    const result = processDirectives(sourceCode, filePath);
    
    return {
      hasErrors: result.errors.length > 0,
      errors: result.errors,
      inferredContext: result.inferredContext,
      processedCode: result.code
    };
  } catch (error) {
    return {
      hasErrors: true,
      errors: [{
        type: 'processing-error',
        message: `Failed to process directives: ${error instanceof Error ? error.message : String(error)}`,
        line: 1,
        suggestion: 'Check your syntax and directive usage'
      }],
      processedCode: sourceCode
    };
  }
}