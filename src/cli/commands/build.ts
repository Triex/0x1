/**
 * 0x1 CLI - Build Command
 * Builds the application for production - simplified to match dev server approach
 */

import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
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

    // Step 2: Generate component files as static assets (CRITICAL FOR VERCEL)
    log.info('🧩 Pre-building component files for static serving...');
    await generateStaticComponentFiles(projectPath, outputPath);
    log.info('✅ Component files pre-built');

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
    await processCss(projectPath, outputPath, { minify });
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
  
  if (copiedCount === 0) {
    logger.warn('⚠️ No 0x1 framework files found - build may not work in production');
  }
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
 * Process CSS files (with proper Tailwind v4 support like dev server)
 */
async function processCss(
  projectPath: string,
  outputPath: string,
  options: { minify: boolean }
): Promise<void> {
  const { minify } = options;

  // Check for Tailwind config
  const hasTailwind = existsSync(join(projectPath, 'tailwind.config.js')) ||
    existsSync(join(projectPath, 'tailwind.config.ts'));

  if (hasTailwind) {
    // Import the same v4 handler used by dev server
    const { tailwindV4Handler } = await import('../commands/utils/server/tailwind-v4.js');
    
    try {
      // Check if v4 is available
      const isV4Available = await tailwindV4Handler.isAvailable(projectPath);
      
      if (isV4Available) {
        logger.info("🌈 Using Tailwind CSS v4 for build");
        
        // Find the input file (same logic as dev server)
        const inputFile = tailwindV4Handler.findInputFile(projectPath);
        
        if (inputFile && existsSync(inputFile)) {
          // Use the actual input file content (app/globals.css)
          const inputContent = readFileSync(inputFile, 'utf-8');
          
          // Process with Tailwind v4
          const args = [
            'bun', 'x', 'tailwindcss',
            '-i', inputFile,
            '-o', join(outputPath, 'styles.css')
          ];

          if (minify) {
            args.push('--minify');
          }

          const result = Bun.spawnSync(args, {
            cwd: projectPath,
            env: process.env,
            stdout: 'pipe',
            stderr: 'pipe'
          });

          if (result.exitCode !== 0) {
            const error = new TextDecoder().decode(result.stderr);
            logger.warn(`Tailwind v4 processing failed: ${error}`);
            
            // Generate fallback with user's custom styles
            const fallbackCss = tailwindV4Handler.generateMinimalFallback(inputContent);
            await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
            logger.info("Generated fallback CSS with custom styles");
  } else {
            logger.info("✅ Tailwind CSS v4 processed successfully");
          }
          return;
        }
      }

      // Fallback to v3 processing if v4 not available
      logger.info("Using Tailwind CSS v3 fallback");
      
      // Process with Tailwind v3 (original logic)
      const tempCssPath = join(projectPath, '.temp-tailwind-input.css');
      const tailwindInput = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
      
      await Bun.write(tempCssPath, tailwindInput);
      
      const args = [
        'bun', 'x', 'tailwindcss',
        '-i', tempCssPath,
        '-o', join(outputPath, 'styles.css')
      ];

      if (minify) {
        args.push('--minify');
      }

      const result = Bun.spawnSync(args, {
        cwd: projectPath,
        env: process.env,
        stdout: 'pipe',
        stderr: 'pipe'
      });

      // Clean up temp file
      Bun.spawnSync(['rm', tempCssPath], { cwd: projectPath });

      if (result.exitCode !== 0) {
        const error = new TextDecoder().decode(result.stderr);
        throw new Error(`Tailwind processing failed: ${error}`);
      }
    } catch (error) {
      logger.warn(`Tailwind processing failed: ${error}`);
      await createFallbackCss(outputPath, minify);
    }
  } else {
    await createFallbackCss(outputPath, minify);
  }
}

/**
 * Create fallback CSS file
 */
async function createFallbackCss(outputPath: string, minify: boolean): Promise<void> {
  const css = `/* 0x1 Framework - Default Styles */
 *, *::before, *::after { box-sizing: border-box; }
 body, h1, h2, h3, h4, p, figure, blockquote, dl, dd { margin: 0; }
 html:focus-within { scroll-behavior: smooth; }
 body { min-height: 100vh; text-rendering: optimizeSpeed; line-height: 1.6; font-family: system-ui, sans-serif; }
 img, picture { max-width: 100%; display: block; }
 input, button, textarea, select { font: inherit; }
 #app { padding: 1rem; max-width: 1200px; margin: 0 auto; }`;

  const finalCss = minify ? css.replace(/\s+/g, ' ').replace(/;\s/g, ';').trim() : css;
  await Bun.write(join(outputPath, 'styles.css'), finalCss);
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
  const routes = await discoverRoutesFromFileSystem(projectPath);
  
  // Create app directory structure in build output
  const appDir = join(outputPath, 'app');
  const componentsDir = join(outputPath, 'components');
  await mkdir(appDir, { recursive: true });
  await mkdir(componentsDir, { recursive: true });
  
  let generatedCount = 0;
  
  // Generate component files for each route
  for (const route of routes) {
    try {
      // Convert component path to source file path
      const componentPath = route.componentPath.replace(/^\//, ''); // Remove leading slash
      const sourceFile = componentPath.replace(/\.js$/, '.tsx'); // Convert .js to .tsx
      const sourcePath = join(projectPath, sourceFile);
      
      if (existsSync(sourcePath)) {
        // Read and transpile the component
        const sourceCode = await Bun.file(sourcePath).text();
        
        // Transpile using Bun (same as dev server)
        const transpiled = await Bun.build({
          entrypoints: [sourcePath],
          format: 'esm',
          target: 'browser',
          minify: false,
          splitting: false,
          outdir: outputPath,
          naming: {
            entry: componentPath // Use the exact path from route discovery
          },
          external: ['node:*', 'path', 'url', 'fs', '0x1'] // Exclude Node.js modules and 0x1 framework
        });
        
        if (transpiled.success) {
          generatedCount++;
          console.log(`[Build] ✅ Generated component: ${componentPath}`);
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
        const outputPath_component = join(outputPath, componentFile.replace(/\.tsx$/, '.js'));
        const outputDir = dirname(outputPath_component);
        await mkdir(outputDir, { recursive: true });
        
        const transpiled = await Bun.build({
          entrypoints: [sourcePath],
          format: 'esm', 
          target: 'browser',
          minify: false,
          splitting: false,
          outdir: outputDir,
          naming: {
            entry: basename(outputPath_component)
          },
          external: ['node:*', 'path', 'url', 'fs', '0x1'] // Exclude Node.js modules and 0x1 framework
        });
        
        if (transpiled.success) {
          generatedCount++;
          console.log(`[Build] ✅ Generated component: ${componentFile.replace(/\.tsx$/, '.js')}`);
        }
      } catch (error) {
        console.warn(`[Build] ⚠️ Failed to generate component ${componentFile}:`, error);
      }
    }
  }
  
  console.log(`[Build] 📦 Generated ${generatedCount} component files for static serving`);
}
