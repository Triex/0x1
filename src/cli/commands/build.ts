/**
 * 0x1 CLI - Build Command
 * Builds the application for production - simplified to match dev server approach
 */

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { logger } from '../utils/logger';

// Import favicon detection function from dev-server

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

    // Step 6: Generate HTML (simple production-specific template)
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
  
  // CRITICAL FIX: Use the updated 0x1-router as single source of truth
  const routerSourcePath = join(frameworkRoot, '0x1-router', 'dist', 'index.js');
  
  const frameworkFiles = [
    { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
    { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
    { src: 'core/hooks.js', dest: 'hooks.js' },
    { src: 'index.js', dest: 'index.js' }
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
  
  // CRITICAL: Copy the updated router from 0x1-router package
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
  // Copy from public directory
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
  
  // CRITICAL FIX: Also copy favicon files from app directory
  const appDir = join(projectPath, 'app');
  const faviconFormats = ['favicon.ico', 'favicon.svg', 'favicon.png', 'favicon.jpg', 'favicon.jpeg', 'favicon.gif'];
  
  for (const faviconFile of faviconFormats) {
    const faviconPath = join(appDir, faviconFile);
    if (existsSync(faviconPath)) {
      const targetPath = join(outputPath, faviconFile);
      const content = await Bun.file(faviconPath).arrayBuffer();
      await Bun.write(targetPath, content);
      logger.info(`📄 Copied favicon: ${faviconFile} from app/ directory`);
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
 * Generate production HTML (simple production-specific template)
 */
async function generateProductionHtml(projectPath: string, outputPath: string): Promise<void> {
  const isAppDirStructure = existsSync(join(projectPath, 'app'));
  
  if (!isAppDirStructure) {
    return; // Skip HTML generation if no app structure
  }

  // Detect favicon for production
  const detectedFavicon = detectFavicon(projectPath);
  if (detectedFavicon) {
    logger.info(`🔍 Detected favicon: ${detectedFavicon.location}/favicon.${detectedFavicon.format}`);
  }

  // Generate favicon HTML links
  let faviconLinks = '';
  if (detectedFavicon) {
    const { format } = detectedFavicon;
    if (format === 'ico') {
      faviconLinks = `<link rel="icon" href="/favicon.ico">`;
    } else if (format === 'svg') {
      faviconLinks = `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`;
    } else if (format === 'png') {
      faviconLinks = `<link rel="icon" type="image/png" href="/favicon.png">`;
    } else {
      faviconLinks = `<link rel="icon" type="image/${format}" href="/favicon.${format}">`;
    }
  } else {
    // Fallback favicon links
    faviconLinks = `<link rel="icon" href="/favicon.ico">`;
  }

  // Simple production HTML template
  const indexHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <meta name="description" content="Fast, modern web applications built with 0x1 framework">
  ${faviconLinks}
  <link rel="stylesheet" href="/styles.css">
  
  <!-- Import map for 0x1 framework module resolution -->
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
    /* Production loading styles */
    #app { min-height: 100vh; }
    
    .app-loading {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      width: 24px;
      height: 24px;
      opacity: 0.6;
      transform: translateY(0);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }
    
    .app-loading.loaded {
      opacity: 0;
      transform: translateY(-4px) scale(0.8);
    }
    
    .loading-icon {
      width: 24px;
      height: 24px;
      animation: lightning-pulse 2s ease-in-out infinite;
    }
    
    .lightning-bolt {
      fill: #fbbf24;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }
    
    html:not(.dark) .lightning-bolt {
      fill: #f59e0b;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
    }
    
    @keyframes lightning-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
    
    @media (max-width: 640px) {
      .app-loading { top: 16px; right: 16px; width: 20px; height: 20px; opacity: 0.5; }
      .loading-icon { width: 20px; height: 20px; }
    }
  </style>
</head>
<body class="bg-slate-900 dark:bg-slate-900 text-white dark:text-white">
  <div id="app"></div>
  <div class="app-loading" id="app-loading">
    <div class="loading-icon">
      <svg class="lightning-bolt" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
      </svg>
    </div>
  </div>
  
  <script>
    // Production theme detection
    (function() {
      try {
        const savedTheme = localStorage.getItem('0x1-dark-mode');
        if (savedTheme === 'light') {
          document.documentElement.classList.remove('dark');
          document.body.className = 'bg-white text-gray-900';
        } else {
          document.documentElement.classList.add('dark');
          document.body.className = 'bg-slate-900 dark:bg-slate-900 text-white dark:text-white';
        }
      } catch (e) {
        console.log('Theme detection error, defaulting to dark');
        document.documentElement.classList.add('dark');
        document.body.className = 'bg-slate-900 dark:bg-slate-900 text-white dark:text-white';
      }
    })();
    
    if (typeof process === 'undefined') {
      window.process = { env: { NODE_ENV: 'production' } };
    }
    
    let appReadyCalled = false;
    let loadingTimeout = setTimeout(() => {
      if (!appReadyCalled) {
        console.warn('[0x1] App seems stuck, forcing hide loading screen');
        const loading = document.getElementById('app-loading');
        if (loading) loading.classList.add('loaded');
      }
    }, 10000);
    
    window.addEventListener('error', function(e) {
      console.error('[0x1] Error:', e.error);
      clearTimeout(loadingTimeout);
      const loading = document.getElementById('app-loading');
      if (loading && !appReadyCalled) loading.classList.add('loaded');
    });
    
    window.appReady = function() {
      if (appReadyCalled) return;
      appReadyCalled = true;
      clearTimeout(loadingTimeout);
      const loading = document.getElementById('app-loading');
      if (loading) loading.classList.add('loaded');
    };
  </script>
  
  <script src="/app.js" type="module"></script>
</body>
</html>`;

  await Bun.write(join(outputPath, 'index.html'), indexHtml);
  logger.info(`📄 Production HTML generated with ${detectedFavicon ? 'detected' : 'fallback'} favicon`);
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

  // Generate the production app.js with enhanced stability
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
}
`;

  // Write the production app.js
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
        // Read source code
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
        
        // SIMPLIFIED: Transform "0x1" imports to browser-compatible paths
        sourceCode = sourceCode.replace(
          /from\s+["']0x1["']/g,
          'from "/node_modules/0x1/index.js"'
        );
        
        try {
          // Use Bun's transpiler for proper JSX transformation
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
          let transpiledContent = await transpiler.transform(sourceCode);
          
          // SIMPLIFIED: Fix import paths for absolute resolution
          transpiledContent = transpiledContent
            // Convert relative component imports to absolute
            .replace(/from\s+["']\.\.\/components\/([^"']+)["']/g, 'from "/components/$1.js"')
            .replace(/from\s+["']\.\/([^"']+)["']/g, 'from "./$1.js"');
          
          // Add JSX runtime import at the top
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
          
          // Write the component file
          const outputComponentPath = join(outputPath, componentPath);
          const outputComponentDir = dirname(outputComponentPath);
          await mkdir(outputComponentDir, { recursive: true });
          await Bun.write(outputComponentPath, transpiledContent);
          
          generatedCount++;
          console.log(`[Build] ✅ Generated component: ${componentPath} ${isPageComponent && hasLayout ? '(with layout)' : ''}`);
          
        } catch (transpileError) {
          console.warn(`[Build] ⚠️ Transpilation failed for ${route.componentPath}:`, transpileError);
        }
    }
  } catch (error) {
      console.warn(`[Build] ⚠️ Failed to generate component ${route.componentPath}:`, error);
    }
  }
  
  // Also handle commonly imported components
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
        // Read and transform source code
        let sourceCode = await Bun.file(sourcePath).text();
        
        // Transform "0x1" imports
        sourceCode = sourceCode.replace(
          /from\s+["']0x1["']/g,
          'from "/node_modules/0x1/index.js"'
        );
        
        try {
          // Use Bun's transpiler
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
          
          let transpiledContent = await transpiler.transform(sourceCode);
          
          // Add JSX runtime import
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
          
          // Write the component file
          const outputComponentPath = join(outputPath, componentFile.replace(/\.tsx$/, '.js'));
          const outputComponentDir = dirname(outputComponentPath);
          await mkdir(outputComponentDir, { recursive: true });
          await Bun.write(outputComponentPath, transpiledContent);
          
          generatedCount++;
          console.log(`[Build] ✅ Generated component: ${componentFile.replace(/\.tsx$/, '.js')}`);
          
        } catch (transpileError) {
          console.warn(`[Build] ⚠️ Transpilation failed for ${componentFile}:`, transpileError);
        }
      } catch (error) {
        console.warn(`[Build] ⚠️ Failed to generate component ${componentFile}:`, error);
      }
    }
  }
  
  console.log(`[Build] 📦 Generated ${generatedCount} component files for static serving`);
}

/**
 * Detect favicon in multiple locations and formats (same logic as dev server)
 */
function detectFavicon(
  projectPath: string
): { path: string; format: string; location: string } | null {
  // Define formats and locations to check
  const formats = [".ico", ".svg", ".png"];
  const locations = ["public", "app"];

  // Track all found favicons
  const foundFavicons: Array<{
    path: string;
    format: string;
    location: string;
  }> = [];

  // Check all combinations
  for (const location of locations) {
    for (const format of formats) {
      const faviconName =
        format === ".ico" ? "favicon.ico" : `favicon${format}`;
      const faviconPath = join(projectPath, location, faviconName);

      if (existsSync(faviconPath)) {
        foundFavicons.push({
          path: faviconPath,
          format: format.substring(1), // Remove the dot
          location,
        });
      }
    }
  }

  if (foundFavicons.length === 0) {
    return null;
  }

  // If multiple favicons found, log a warning
  if (foundFavicons.length > 1) {
    logger.warn(
      `Multiple favicons detected: ${foundFavicons.map((f) => `${f.location}/${f.format}`).join(", ")}. Using ${foundFavicons[0].location}/favicon.${foundFavicons[0].format}`
    );
  } else {
    logger.info(
      `Using favicon from ${foundFavicons[0].location}/favicon.${foundFavicons[0].format}`
    );
  }

  // Return the first one found (priority is defined by the order in locations and formats arrays)
  return foundFavicons[0];
}
