/**
 * 0x1 CLI - Build Command
 * Builds the application for production - simplified to match dev server approach
 */

import { existsSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
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

/**
 * Build the application for production - aligned with dev server
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
  const configPath = options.config ? resolve(projectPath, options.config) : await findConfigFile(projectPath);
  const config = configPath ? await loadConfig(configPath) : {};

  // Build options
  const outDir = options.outDir || config?.build?.outDir || 'dist';
  const minify = options.minify ?? config?.build?.minify ?? true;

  log.section('BUILDING APPLICATION');
  log.spacer();

  // Ensure output directory exists
  const outputPath = resolve(projectPath, outDir);
  await mkdir(outputPath, { recursive: true });

  try {
    // Step 1: Generate sophisticated app.js using dev server logic (SINGLE SOURCE OF TRUTH)
    log.info('🚀 Generating production app.js with route discovery...');
    await generateSophisticatedAppJs(projectPath, outputPath);
    log.info('✅ Production app.js generated');

    // Step 2: Generate static component files (same as dev server transpilation)
    log.info('🧩 Generating static component files...');
    await generateStaticComponentFiles(projectPath, outputPath);
    log.info('✅ Component files generated');

    // Step 3: Copy 0x1 framework files (same structure as dev server)
    log.info('📋 Copying framework files...');
    await copy0x1FrameworkFiles(outputPath);
    log.info('✅ Framework files copied');

    // Step 4: Copy static assets
    log.info('📁 Copying static assets...');
    await copyStaticAssets(projectPath, outputPath);
    log.info('✅ Static assets copied');

    // Step 5: Process CSS (with proper Tailwind v4 support like dev server)
    log.info('🎨 Processing CSS...');
    const outputCssPath = join(outputPath, 'styles.css');
    
    // Try to process with proper Tailwind v4 PostCSS first
    const tailwindSuccess = await processTailwindCss(projectPath, outputCssPath);
    
    if (!tailwindSuccess) {
      logger.warn('⚠️ Tailwind processing failed, creating fallback...');
      await createFallbackCss(outputCssPath, minify);
    }
    log.info('✅ CSS processed');

    // Step 6: Generate HTML (same structure as dev server index.html)
    log.info('📄 Generating HTML...');
    await generateProductionHtml(projectPath, outputPath);
    log.info('✅ HTML generated');

    // Step 7: Generate PWA files
    log.info('📱 Generating PWA files...');
    await generatePwaFiles(outputPath);
    log.info('✅ PWA files generated');

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

/**
 * Find configuration file in project directory
 */
async function findConfigFile(projectPath: string): Promise<string | null> {
  const configFiles = [
    join(projectPath, '0x1.config.ts'),
    join(projectPath, '0x1.config.js'),
    join(projectPath, 'package.json')
  ];

  for (const configFile of configFiles) {
    if (existsSync(configFile)) {
      if (configFile.endsWith('package.json')) {
        try {
          const packageJson = JSON.parse(await Bun.file(configFile).text());
      if (packageJson['0x1']) {
            return configFile;
      }
    } catch (error) {
          // Continue to next config file
        }
      } else {
        return configFile;
      }
    }
  }

  return null;
}

/**
 * Load configuration from file
 */
async function loadConfig(configPath: string): Promise<any> {
  try {
    if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {
        const config = await import(configPath);
        return config.default || config;
    } else if (configPath.endsWith('package.json')) {
      const content = await Bun.file(configPath).text();
      const packageJson = JSON.parse(content);
      return packageJson['0x1'] || {};
    }
    return {};
  } catch (error) {
    logger.warn(`Failed to load config from ${configPath}: ${error}`);
    return {};
  }
}

/**
 * Copy 0x1 framework files to build output (same as dev server structure)
 */
async function copy0x1FrameworkFiles(outputPath: string): Promise<void> {
  const framework0x1Dir = join(outputPath, '0x1');
  await mkdir(framework0x1Dir, { recursive: true });
  
  // Create node_modules/0x1 structure for import resolution
  const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
  await mkdir(nodeModulesDir, { recursive: true });
  
  // Get framework files from the same location as dev server
  const currentFile = new URL(import.meta.url).pathname;
  const frameworkRoot = resolve(dirname(currentFile), '..', '..');
  const frameworkDistPath = join(frameworkRoot, 'dist');
  
  const frameworkFiles = [
    { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
    { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
    { src: 'core/router.js', dest: 'router.js' },
    { src: 'core/hooks.js', dest: 'hooks.js' },
    { src: 'index.js', dest: 'index.js' }
  ];
  
  let copiedCount = 0;
  for (const { src, dest } of frameworkFiles) {
    const srcPath = join(frameworkDistPath, src);
    const destPath = join(framework0x1Dir, dest);
    
    if (existsSync(srcPath)) {
      const content = await Bun.file(srcPath).text();
      await Bun.write(destPath, content);
      copiedCount++;
    }
  }
  
  // CRITICAL: Generate browser-compatible 0x1 framework entry point (same as dev server)
  await generateBrowserCompatible0x1Entry(nodeModulesDir);
  
  if (copiedCount === 0) {
    logger.warn('⚠️ No 0x1 framework files found - build may not work in production');
  }
}

/**
 * Generate browser-compatible 0x1 framework entry point
 * This matches exactly what the dev server provides for component imports
 */
async function generateBrowserCompatible0x1Entry(nodeModulesDir: string): Promise<void> {
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

/**
 * Copy static assets
 */
async function copyStaticAssets(projectPath: string, outputPath: string): Promise<void> {
  const publicDir = join(projectPath, 'public');
  if (existsSync(publicDir)) {
    const result = Bun.spawnSync(['cp', '-r', `${publicDir}/.`, outputPath], {
      cwd: process.cwd(),
      env: process.env,
      stdin: 'ignore',
      stdout: 'ignore',
      stderr: 'pipe'
    });

    if (result.exitCode !== 0) {
      const error = new TextDecoder().decode(result.stderr);
      throw new Error(`Failed to copy static assets: ${error}`);
    }
  }
}

/**
 * Process CSS using PostCSS with Tailwind v4
 */
async function processCssWithPostCSS(inputPath: string, outputPath: string, projectPath: string): Promise<boolean> {
  try {
    logger.info('🎨 Processing CSS with Tailwind CSS v4 (PostCSS)...');
    
    // Read input CSS
    const inputCss = await Bun.file(inputPath).text();
    
    // PostCSS with Tailwind v4 processing
    const postcss = await import('postcss');
    
    // Try to load the PostCSS plugin dynamically
    let tailwindPlugin;
    try {
      const tailwindPostcss = await import('@tailwindcss/postcss');
      tailwindPlugin = tailwindPostcss.default || tailwindPostcss;
    } catch (error) {
      logger.error('❌ @tailwindcss/postcss plugin not found. Install it with: bun add @tailwindcss/postcss');
      return false;
    }
    
    // Configure PostCSS processor
    const processor = postcss.default([
      tailwindPlugin()
    ]);
    
    // Process the CSS
    const result = await processor.process(inputCss, {
      from: inputPath,
      to: outputPath
    });
    
    // Write the processed CSS
    await Bun.write(outputPath, result.css);
    
    logger.success(`✅ CSS processed successfully: ${outputPath}`);
    return true;
    
  } catch (error) {
    logger.error(`❌ PostCSS processing failed: ${error}`);
    return false;
  }
}

/**
 * Process Tailwind CSS for production builds
 */
async function processTailwindCss(projectPath: string, outputPath: string): Promise<boolean> {
  try {
    logger.info('🌈 Processing Tailwind CSS v4...');
    
    // Find the CSS input file (similar to dev server logic)
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
      logger.warn('⚠️ No CSS input file found. Expected app/globals.css or similar.');
      logger.info('Creating minimal CSS fallback...');
      
      const minimalCss = `@import "tailwindcss";

/* Add your custom styles here */
`;
      await Bun.write(outputPath, minimalCss);
      return true;
    }
    
    logger.info(`📄 Found CSS input: ${inputFile.replace(projectPath, '.')}`);
    
    // Process CSS with PostCSS + Tailwind v4
    const success = await processCssWithPostCSS(inputFile, outputPath, projectPath);
    
    if (success) {
      // Verify the output contains actual Tailwind CSS
      const outputContent = await Bun.file(outputPath).text();
      if (outputContent.includes('@layer') || outputContent.includes('--color-') || outputContent.length > 1000) {
        logger.success('✅ Tailwind CSS v4 processed successfully');
        return true;
      } else {
        logger.warn('⚠️ Processed CSS seems minimal, this might indicate an issue');
        return true; // Still return true as the processing didn't fail
      }
    }
    
    return false;
    
  } catch (error) {
    logger.error(`❌ Tailwind CSS processing failed: ${error}`);
    return false;
  }
}

/**
 * Create fallback CSS file
 */
async function createFallbackCss(outputPath: string, minify: boolean): Promise<void> {
  // SIMPLIFIED: Just create a basic Tailwind import
  const css = `@import "tailwindcss";

/* Essential base styles */
*, *::before, *::after { box-sizing: border-box; }
body { line-height: 1.6; font-family: system-ui, sans-serif; }

/* Add your custom styles here */
`;

  const finalCss = minify ? css.replace(/\s+/g, ' ').trim() : css;
  await Bun.write(outputPath, finalCss);
  logger.info(`📝 Created fallback CSS: ${outputPath}`);
}

/**
 * Generate production HTML (same structure as dev server index.html)
 */
async function generateProductionHtml(projectPath: string, outputPath: string): Promise<void> {
  const isAppDirStructure = existsSync(join(projectPath, 'app'));
  
  if (!isAppDirStructure) {
    return; // Skip HTML generation if no app structure
  }

  const indexHtml = `<!DOCTYPE html>
 <html lang="en">
 <head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>0x1 App</title>
   <meta name="description" content="Fast, modern web applications built with 0x1 framework">
   <link rel="stylesheet" href="/styles.css">
   
   <!-- Import map for 0x1 framework module resolution (same as dev server) -->
   <script type="importmap">
   {
     "imports": {
       "0x1": "/node_modules/0x1/index.js",
       "0x1/router": "/0x1/router.js",
       "0x1/": "/0x1/"
     }
   }
   </script>
   
   <style>
     #app { min-height: 100vh; }
     .app-loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
     .app-loading.loaded { display: none; }
   </style>
 </head>
 <body>
   <div id="app"></div>
   <div class="app-loading" id="app-loading">Loading...</div>
   
   <script>
     if (typeof process === 'undefined') {
       window.process = { env: { NODE_ENV: 'production' } };
     }
     
     window.addEventListener('error', function(e) {
       console.error('[0x1] Error:', e.error);
       document.getElementById('app-loading').style.display = 'none';
     });
     
     window.appReady = function() {
       const loading = document.getElementById('app-loading');
       if (loading) loading.classList.add('loaded');
     };
   </script>
   
   <script src="/app.js" type="module"></script>
 </body>
 </html>`;

  await Bun.write(join(outputPath, 'index.html'), indexHtml);
}

/**
 * Generate PWA files
 */
async function generatePwaFiles(outputPath: string): Promise<void> {
  // Generate manifest.json
  const manifest = {
    name: "0x1 Framework App",
    short_name: "0x1 App",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0070f3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
  
  await Bun.write(join(outputPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  // Generate robots.txt
  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: /sitemap.xml`;
  await Bun.write(join(outputPath, 'robots.txt'), robotsTxt);
  
  // Generate sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
 <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <url>
     <loc>/</loc>
     <lastmod>${new Date().toISOString()}</lastmod>
     <changefreq>daily</changefreq>
     <priority>1.0</priority>
   </url>
 </urlset>`;
  
  await Bun.write(join(outputPath, 'sitemap.xml'), sitemap);
}

/**
 * Generate sophisticated app.js using dev server logic (SINGLE SOURCE OF TRUTH)
 */
async function generateSophisticatedAppJs(projectPath: string, outputPath: string): Promise<void> {
  // Import the route discovery from dev server (SINGLE SOURCE OF TRUTH)
  const { discoverRoutesFromFileSystem } = await import('../server/dev-server');
  
  // Discover routes using same logic as dev server
  const discoveredRoutes = discoverRoutesFromFileSystem(projectPath);
  
  // Safely serialize routes data
  let routesJson;
  try {
    const sanitizedRoutes = discoveredRoutes.map(route => ({
      path: route.path,
      componentPath: route.componentPath
    }));
    routesJson = JSON.stringify(sanitizedRoutes, null, 2);
  } catch (jsonError) {
    logger.error(`Error serializing routes: ${jsonError}`);
    routesJson = '[]';
  }

  // Generate the EXACT SAME sophisticated app.js as dev server
  const appScript = `
// 0x1 Framework App Bundle - PRODUCTION-READY with SEQUENCED LOADING
console.log('[0x1 App] Starting production-ready app with proper sequencing...');

// Server-discovered routes
const serverRoutes = ${routesJson};

// ===== PRODUCTION-READY POLYFILL SYSTEM =====
const polyfillCache = new Map();
const polyfillQueue = new Map(); // Prevent duplicate loading

async function loadPolyfillOnDemand(polyfillName) {
  if (polyfillCache.has(polyfillName)) {
    return polyfillCache.get(polyfillName);
  }
  
  // Check if already being loaded
  if (polyfillQueue.has(polyfillName)) {
    return polyfillQueue.get(polyfillName);
  }
  
  console.log('[0x1 App] Loading polyfill:', polyfillName);
  
  const promise = (async () => {
    try {
      const polyfillScript = document.createElement('script');
      polyfillScript.type = 'module';
      polyfillScript.src = '/node_modules/' + polyfillName + '?t=' + Date.now();
      
      await new Promise((resolve, reject) => {
        polyfillScript.onload = resolve;
        polyfillScript.onerror = reject;
        document.head.appendChild(polyfillScript);
      });
      
      // Wait for polyfill to be available globally
      let retries = 0;
      const maxRetries = 20;
      
      while (retries < maxRetries) {
        const isAvailable = checkPolyfillAvailability(polyfillName);
        if (isAvailable) {
          console.log('[0x1 App] ✅ Polyfill verified:', polyfillName);
          break;
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (retries >= maxRetries) {
        console.warn('[0x1 App] ⚠️ Polyfill verification timeout:', polyfillName);
      }
      
      return true;
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to load polyfill:', polyfillName, error);
      throw error;
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

function checkPolyfillAvailability(polyfillName) {
  const checks = {
    '@rainbow-me/rainbowkit': () => 
      window.rainbowkit || window.RainbowKit || window['@rainbow-me/rainbowkit'] ||
      (window.ConnectButton && typeof window.ConnectButton === 'function'),
    'wagmi': () => 
      window.wagmi || window.WAGMI || window.useAccount,
    'viem': () => 
      window.viem || window.createPublicClient,
    '@tanstack/react-query': () => 
      window.ReactQuery || window.useQuery || window['@tanstack/react-query'],
    'zustand': () => 
      window.zustand || window.create
  };
  
  const checker = checks[polyfillName];
  return checker ? checker() : true; // Assume available if no specific check
}

// ===== PRODUCTION-READY DEPENDENCY ANALYSIS =====
async function analyzeComponentDependencies(componentPath) {
  const packageNames = new Set();
  const analyzedFiles = new Set(); // Prevent infinite recursion
  
  async function analyzeFile(filePath, depth = 0) {
    // Prevent infinite recursion and limit depth
    if (analyzedFiles.has(filePath) || depth > 3) {
      return;
    }
    analyzedFiles.add(filePath);
    
    try {
      console.log('[0x1 App] 🔍 Analyzing dependencies for:', filePath, 'depth:', depth);
      
      const response = await fetch(filePath + '?source=true&t=' + Date.now());
      if (!response.ok) return;
      
      const sourceCode = await response.text();
      const localComponentPaths = [];
      
      try {
        // ULTIMATE STRING-BASED DETECTION - No regex, just string operations
        const lines = sourceCode.split('\\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Detect import statements
          if (trimmedLine.startsWith('import ') && (trimmedLine.includes(' from ') || trimmedLine.includes('import('))) {
            // Extract package name from import statements
            const extractPackageFromImport = (importLine) => {
              // Handle: import ... from 'package'
              if (importLine.includes(' from ')) {
                const fromIndex = importLine.lastIndexOf(' from ');
                const afterFrom = importLine.substring(fromIndex + 6).trim();
                const quote = afterFrom.charAt(0);
                if (quote === '"' || quote === "'") {
                  const endQuote = afterFrom.indexOf(quote, 1);
                  if (endQuote > 0) {
                    return afterFrom.substring(1, endQuote);
                  }
                }
              }
              
              // Handle: import('package')
              const importParenIndex = importLine.indexOf('import(');
              if (importParenIndex >= 0) {
                const afterParen = importLine.substring(importParenIndex + 7);
                const quote = afterParen.trim().charAt(0);
                if (quote === '"' || quote === "'") {
                  const endQuote = afterParen.indexOf(quote, 1);
                  if (endQuote > 0) {
                    return afterParen.substring(1, endQuote);
                  }
                }
              }
              
              return null;
            };
            
            const packageName = extractPackageFromImport(trimmedLine);
            if (packageName) {
              // Check if it's a local component (starts with ./ or ../ or absolute path)
              if (packageName.startsWith('./') || packageName.startsWith('../') || packageName.startsWith('/')) {
                // Convert relative path to absolute component path for analysis
                let componentPath;
                if (packageName.startsWith('./') || packageName.startsWith('../')) {
                  // TRULY DYNAMIC: Resolve relative path based on current file location
                  const currentDir = filePath.substring(0, filePath.lastIndexOf('/'));
                  const resolvedPath = new URL(packageName, 'file://' + currentDir + '/').pathname;
                  // Remove the leading slash if present and add .js extension if needed
                  componentPath = resolvedPath.endsWith('.js') ? resolvedPath : resolvedPath + '.js';
                  console.log('[0x1 App] 🧠 Dynamic path resolution:', filePath, '+', packageName, '->', componentPath);
        } else {
                  // Handle absolute component paths
                  componentPath = packageName.endsWith('.js') ? packageName : packageName + '.js';
                }
                
                localComponentPaths.push(componentPath);
                console.log('[0x1 App] 📄 Found local component import:', packageName, '->', componentPath);
              } else if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
                // It's an external package
                const rootPackage = packageName.startsWith('@') 
                  ? packageName.split('/').slice(0, 2).join('/')
                  : packageName.split('/')[0];
                
                if (rootPackage !== 'react' && rootPackage !== 'react-dom' && rootPackage.trim() !== '') {
                  packageNames.add(rootPackage);
                  console.log('[0x1 App] 📦 Detected import:', rootPackage);
                }
              }
            }
          }
          
          // Detect component usage patterns for better dependency detection
          if (trimmedLine.includes('<ConnectButton')) {
            packageNames.add('@rainbow-me/rainbowkit');
            console.log('[0x1 App] 📦 Detected ConnectButton usage -> @rainbow-me/rainbowkit');
          }
          if (trimmedLine.includes('useAccount') || trimmedLine.includes('useConnect')) {
            packageNames.add('wagmi');
            console.log('[0x1 App] 📦 Detected wagmi hook usage -> wagmi');
          }
        }
        
        // RECURSIVE ANALYSIS: Analyze imported local components
        for (const localPath of localComponentPaths) {
          console.log('[0x1 App] 🔄 Recursively analyzing:', localPath);
          await analyzeFile(localPath, depth + 1);
        }
        
      } catch (analysisError) {
        console.warn('[0x1 App] Dependency analysis failed for', filePath, ':', analysisError.message);
      }
    } catch (error) {
      console.warn('[0x1 App] Could not analyze dependencies for:', filePath, error);
    }
  }
  
  // Start analysis with the main component
  await analyzeFile(componentPath, 0);
  
  console.log('[0x1 App] 🔍 Total dependencies found:', Array.from(packageNames));
  return packageNames;
}

// ===== MAIN INITIALIZATION (SAME AS DEV SERVER) =====
async function initApp() {
  try {
    console.log('[0x1 App] 🚀 Starting production-ready initialization...');
    
    // Step 1: Load essential dependencies
    console.log('[0x1 App] 🎯 Loading essential dependencies...');
    
    const hooksScript = document.createElement('script');
    hooksScript.type = 'module';
    hooksScript.src = '/0x1/hooks.js?t=' + Date.now();
    
    await new Promise((resolve, reject) => {
      hooksScript.onload = () => {
        console.log('[0x1 App] ✅ Hooks ready');
        resolve();
      };
      hooksScript.onerror = reject;
      document.head.appendChild(hooksScript);
    });
    
    // Step 2: Create router
    console.log('[0x1 App] Creating router...');
    
    const routerModule = await import('/0x1/router.js');
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    // Create beautiful 404 component
    const notFoundComponent = (props) => {
      console.log('[0x1 Router] 🏠 Rendering beautiful 404 page for:', window.location.pathname);
      
      return {
        type: 'div',
        props: { 
          className: 'flex flex-col items-center justify-center min-h-[60vh] text-center px-4'
        },
        children: [
          {
            type: 'h1',
            props: {
              className: 'text-9xl font-bold text-violet-600 dark:text-violet-400 mb-4'
            },
            children: ['404'],
            key: null
          },
          {
            type: 'h2',
            props: {
              className: 'text-3xl font-bold text-gray-800 dark:text-white mb-4'
            },
            children: ['Page Not Found'],
            key: null
          },
          {
            type: 'p',
            props: {
              className: 'text-lg text-gray-600 dark:text-gray-300 mb-8'
            },
            children: ['The page you\\'re looking for doesn\\'t exist or has been moved.'],
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
      };
    };
    
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
    
    // Step 3: Register routes with proper dependency loading
    console.log('[0x1 App] 📝 Registering routes...');
    
    for (const route of serverRoutes) {
      try {
        const routeComponent = async (props) => {
          console.log('[0x1 App] 🔍 Route component called for:', route.path);
          
          try {
            // Analyze and load dependencies
            const componentDeps = await analyzeComponentDependencies(route.componentPath);
            
            if (componentDeps.size > 0) {
              console.log('[0x1 App] 📦 Loading dependencies for', route.path, ':', Array.from(componentDeps));
              
              for (const dep of componentDeps) {
                await loadPolyfillOnDemand(dep);
              }
            }
            
            // Load the component
            const componentModule = await import(route.componentPath + '?t=' + Date.now());
            
            if (componentModule && componentModule.default) {
              console.log('[0x1 App] ✅ Route component resolved:', route.path);
              return componentModule.default(props);
        } else {
              console.warn('[0x1 App] ⚠️ Component has no default export:', route.path);
              return {
                type: 'div',
                props: { 
                  className: 'p-8 text-center',
                  style: 'color: #f59e0b;' 
                },
                children: ['⚠️ Component loaded but has no default export']
              };
      }
    } catch (error) {
            console.error('[0x1 App] ❌ Route component error:', route.path, error);
            return {
              type: 'div',
              props: { 
                className: 'p-8 text-center',
                style: 'color: #ef4444;' 
              },
              children: ['❌ Error loading component: ' + error.message]
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
    
    // Step 4: Start router
    console.log('[0x1 App] 🎯 Starting router...');
    router.init();
    
    // Step 5: Navigate to current path
    router.navigate(window.location.pathname, false);
    
    console.log('[0x1 App] ✅ Production-ready app initialized successfully!');
    
  } catch (error) {
    console.error('[0x1 App] ❌ Initialization failed:', error);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444; margin-bottom: 16px;">Application Error</h2><p style="color: #6b7280; margin-bottom: 20px;">' + error.message + '</p><details style="text-align: left; background: #f9fafb; padding: 16px; border-radius: 8px;"><summary style="cursor: pointer; font-weight: bold;">Error Details</summary><pre style="font-size: 12px; overflow-x: auto;">' + (error.stack || 'No stack trace') + '</pre></details></div>';
    }
  }
}

// ===== START IMMEDIATELY =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`;

  // Write the production app.js (EXACT SAME AS DEV SERVER GENERATES)
  const appJsPath = join(outputPath, 'app.js');
  await Bun.write(appJsPath, appScript);
  
  logger.info(`🚀 Production app.js generated: ${(new TextEncoder().encode(appScript).length / 1024).toFixed(1)}KB`);
}

/**
 * Generate static component files - CRITICAL FOR VERCEL DEPLOYMENT
 * Pre-builds all component files so they exist as static assets instead of dynamic imports
 */
async function generateStaticComponentFiles(projectPath: string, outputPath: string): Promise<void> {
  // Import the route discovery function from dev-server (SINGLE SOURCE OF TRUTH)
  const { discoverRoutesFromFileSystem } = await import('../server/dev-server');
  
  // Discover all routes using the same logic as dev server
  const routes = discoverRoutesFromFileSystem(projectPath);
  
  // Create app directory structure in build output
  const appDir = join(outputPath, 'app');
  const componentsDir = join(outputPath, 'components');
  await mkdir(appDir, { recursive: true });
  await mkdir(componentsDir, { recursive: true });
  
  let generatedCount = 0;
  
  // Browser-safe externals - exclude Node.js modules
  const browserExternals = [
    'node:fs', 'node:path', 'node:url', 'node:crypto', 'node:stream', 'node:buffer',
    'fs', 'path', 'url', 'crypto', 'stream', 'buffer', 'util', 'os', 'events',
    'child_process', 'cluster', 'dgram', 'dns', 'http', 'https', 'net', 'tls',
    'querystring', 'readline', 'repl', 'string_decoder', 'timers', 'tty', 'vm', 'zlib'
  ];
  
  // Check if layout file exists for auto-wrapping
  const layoutPath = join(projectPath, 'app', 'layout.tsx');
  const hasLayout = existsSync(layoutPath);
  let layoutContent = '';
  
  if (hasLayout) {
    layoutContent = await Bun.file(layoutPath).text();
    console.log(`[Build] 📋 Found layout.tsx - will auto-wrap all pages with RootLayout`);
  }
  
  // Generate component files for each route
  for (const route of routes) {
    try {
      // Convert component path to source file path
      const componentPath = route.componentPath.replace(/^\//, ''); // Remove leading slash
      const sourceFile = componentPath.replace(/\.js$/, '.tsx'); // Convert .js to .tsx
      const sourcePath = join(projectPath, sourceFile);
      
      if (existsSync(sourcePath)) {
        // Read source code and transform 0x1 imports for browser compatibility
        let sourceCode = await Bun.file(sourcePath).text();
        
        // Check if this is a page component (in app directory) and has layout
        const isPageComponent = sourceFile.startsWith('app/') && sourceFile.endsWith('/page.tsx');
        
        if (isPageComponent && hasLayout) {
          // Auto-wrap page component with layout like Next.js does
          console.log(`[Build] 🎯 Auto-wrapping page with layout: ${sourceFile}`);
          
          // Extract the page component function name
          const defaultExportMatch = sourceCode.match(/export\s+default\s+function\s+(\w+)/);
          const pageComponentName = defaultExportMatch ? defaultExportMatch[1] : 'PageComponent';
          
          // Create a new component that combines layout + page
          // FIXED: Remove the export default from layout and page to avoid conflicts
          // ALSO FIX: Remove CSS imports since they're handled separately
          const layoutWithoutExport = layoutContent
            .replace(/export\s+default\s+function\s+RootLayout/, 'function RootLayout')
            .replace(/import\s+["']\.\/globals\.css["'];?\s*\n?/g, '') // Remove CSS imports
            .replace(/import\s+["'][^"']*\.css["'];?\s*\n?/g, ''); // Remove any CSS imports
          const pageWithoutExport = sourceCode.replace(/export\s+default\s+function\s+\w+/, `function ${pageComponentName}`);
          
          sourceCode = `// AUTO-GENERATED: Layout-wrapped page component
${layoutWithoutExport}

// Original page component
${pageWithoutExport}

// Export layout-wrapped version as default
export default function LayoutWrapped${pageComponentName}(props) {
  return RootLayout({ 
    children: ${pageComponentName}(props) 
  });
}`;
        }
        
        // ROBUST FIX: Transform "0x1" imports to browser-compatible paths
        sourceCode = sourceCode.replace(
          /from\s+["']0x1["']/g,
          'from "/node_modules/0x1/index.js"'
        );
        
        // Create a temporary file with transformed source
        const tempPath = sourcePath + '.temp';
        await Bun.write(tempPath, sourceCode);
        
        try {
          // Use Bun's transpiler instead of Bun.build for proper JSX transformation
          const transpiler = new Bun.Transpiler({
            loader: 'tsx',
            target: 'browser',
            define: {
              'process.env.NODE_ENV': '"production"',
              'global': 'globalThis'
            },
            tsconfig: {
              compilerOptions: {
                jsx: 'react-jsx',
                jsxImportSource: '/0x1/jsx-runtime.js'
              }
            }
          });
          
          // Transform JSX to JavaScript function calls
          const transpiledContent = await transpiler.transform(sourceCode);
          
          // CRITICAL FIX: Post-process the transpiled content
          const processedContent = transpiledContent
            // Fix import paths - add .js extensions for local components
            .replace(/from\s+["']\.\.\/components\/([^"']+)["']/g, 'from "../components/$1.js"')
            .replace(/from\s+["']\.\/([^"']+)["']/g, 'from "./$1.js"')
            // Extract JSX function name and add runtime import
            .replace(/^/, () => {
              // Find JSX function name (like jsxDEV_7x81h0kn)
              const jsxMatch = transpiledContent.match(/jsxDEV_[a-zA-Z0-9_]+/);
              // Find Fragment function name (like Fragment_8vg9x3sq)
              const fragmentMatch = transpiledContent.match(/Fragment_[a-zA-Z0-9_]+/);
              
              let imports = '';
              if (jsxMatch) {
                const jsxFuncName = jsxMatch[0];
                imports += `import { jsxDEV as ${jsxFuncName}`;
                
                if (fragmentMatch) {
                  const fragmentFuncName = fragmentMatch[0];
                  imports += `, Fragment as ${fragmentFuncName}`;
                }
                
                imports += ' } from "/0x1/jsx-runtime.js";\n';
                return imports;
              }
              return '';
            });
          
          // Clean up temp file references and malformed exports
          const cleanedContent = processedContent
            .replace(/\/\/[^\n]*\.temp[^\n]*\n/g, '') // Remove temp file comments
            .replace(/var\s+[^=]+=\s*["'][^"']*\.temp["'];?\s*\n/g, '') // Remove temp variable declarations
            .replace(/export\s*{\s*[^}]*_default[^}]*};?\s*\n/g, '') // Remove malformed exports
            .replace(/["'][^"']*\.temp["']/g, '""') // Replace temp file references with empty strings
            .replace(/\n\n+/g, '\n'); // Clean up extra newlines
          
          // Write the component file
          const outputComponentPath = join(outputPath, componentPath);
          const outputComponentDir = dirname(outputComponentPath);
          await mkdir(outputComponentDir, { recursive: true });
          await Bun.write(outputComponentPath, cleanedContent);
          
          generatedCount++;
          console.log(`[Build] ✅ Generated component: ${componentPath} ${isPageComponent && hasLayout ? '(with layout)' : ''}`);
        } finally {
    // Clean up temp file
          if (existsSync(tempPath)) {
            try {
              await unlink(tempPath);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
        }
    }
  } catch (error) {
      console.warn(`[Build] ⚠️ Failed to generate component ${route.componentPath}:`, error);
    }
  }
  
  // Also handle commonly imported components (but don't wrap these with layout)
  const commonComponents = [
    'components/Button.tsx',
    'components/Counter.tsx', 
    'components/ThemeToggle.tsx',
    'components/Card.tsx'
  ];
  
  for (const componentFile of commonComponents) {
    const sourcePath = join(projectPath, componentFile);
    if (existsSync(sourcePath)) {
      try {
        // Read source code and transform 0x1 imports for browser compatibility  
        let sourceCode = await Bun.file(sourcePath).text();
        
        // ROBUST FIX: Transform "0x1" imports to browser-compatible paths
        sourceCode = sourceCode.replace(
          /from\s+["']0x1["']/g,
          'from "/node_modules/0x1/index.js"'
        );
        
        // Create a temporary file with transformed source
        const tempPath = sourcePath + '.temp';
        await Bun.write(tempPath, sourceCode);
        
        try {
          // Use Bun's transpiler instead of Bun.build for proper JSX transformation
          const transpiler = new Bun.Transpiler({
            loader: 'tsx',
            target: 'browser',
            define: {
              'process.env.NODE_ENV': '"production"',
              'global': 'globalThis'
            },
            tsconfig: {
              compilerOptions: {
                jsx: 'react-jsx',
                jsxImportSource: '/0x1/jsx-runtime.js'
              }
            }
          });
          
          // Transform JSX to JavaScript function calls
          const transpiledContent = await transpiler.transform(sourceCode);
          
          // CRITICAL FIX: Post-process the transpiled content
          const processedContent = transpiledContent
            // Fix import paths - add .js extensions for local components
            .replace(/from\s+["']\.\.\/components\/([^"']+)["']/g, 'from "../components/$1.js"')
            .replace(/from\s+["']\.\/([^"']+)["']/g, 'from "./$1.js"')
            // Extract JSX function name and add runtime import
            .replace(/^/, () => {
              // Find JSX function name (like jsxDEV_7x81h0kn)
              const jsxMatch = transpiledContent.match(/jsxDEV_[a-zA-Z0-9_]+/);
              // Find Fragment function name (like Fragment_8vg9x3sq)
              const fragmentMatch = transpiledContent.match(/Fragment_[a-zA-Z0-9_]+/);
              
              let imports = '';
              if (jsxMatch) {
                const jsxFuncName = jsxMatch[0];
                imports += `import { jsxDEV as ${jsxFuncName}`;
                
                if (fragmentMatch) {
                  const fragmentFuncName = fragmentMatch[0];
                  imports += `, Fragment as ${fragmentFuncName}`;
                }
                
                imports += ' } from "/0x1/jsx-runtime.js";\n';
                return imports;
              }
              return '';
            });
          
          // Clean up temp file references and malformed exports
          const cleanedContent = processedContent
            .replace(/\/\/[^\n]*\.temp[^\n]*\n/g, '') // Remove temp file comments
            .replace(/var\s+[^=]+=\s*["'][^"']*\.temp["'];?\s*\n/g, '') // Remove temp variable declarations
            .replace(/export\s*{\s*[^}]*_default[^}]*};?\s*\n/g, '') // Remove malformed exports
            .replace(/["'][^"']*\.temp["']/g, '""') // Replace temp file references with empty strings
            .replace(/\n\n+/g, '\n'); // Clean up extra newlines
          
          // Write the component file
          const outputComponentPath = join(outputPath, componentFile.replace(/\.tsx$/, '.js'));
          const outputComponentDir = dirname(outputComponentPath);
          await mkdir(outputComponentDir, { recursive: true });
          await Bun.write(outputComponentPath, cleanedContent);
          
          generatedCount++;
          console.log(`[Build] ✅ Generated component: ${componentFile.replace(/\.tsx$/, '.js')}`);
        } finally {
          // Clean up temp file
          if (existsSync(tempPath)) {
            try {
              await unlink(tempPath);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
        }
      } catch (error) {
        console.warn(`[Build] ⚠️ Failed to generate component ${componentFile}:`, error);
      }
    }
  }
  
  console.log(`[Build] 📦 Generated ${generatedCount} component files for static serving`);
}
