/**
 * 0x1 CLI - Build Command
 * Builds the application for production
 */

import { existsSync } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises'; // For directory operations
// We'll use Bun.file() instead of readFile/writeFile for better performance
import { dirname, join, relative, resolve } from 'node:path';
import { buildAppBundle, buildComponents } from '../utils/builder'; // Import component builder utilities
import { logger } from '../utils/logger';
import { transpileJSX } from './jsx-transpiler';

// For dynamic imports
// Prefixing with underscore to indicate this interface is used for type checking only
interface _TailwindProcessor {
  process: (css: string, options: any) => Promise<{ css: string }>;
}

export interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  watch?: boolean;
  silent?: boolean;
  config?: string;
  ignore?: string[];
}

/**
 * Build the application for production
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  // const projectPath = process.cwd();
  // const outputPath = options.outDir || join(projectPath, 'dist');
  // const minify = options.minify ?? false;
  
  // // Define supported file extensions
  // const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

  // Start timing the build process
  const startTime = performance.now();
  // Only show logs if not silent
  const log = options.silent ?
    {
      info: () => {},
      error: () => {},
      warn: () => {},
      section: () => {},
      spinner: () => ({ stop: () => {} }),
      spacer: () => {}, // Add spacer method to silent logger
      success: () => {},
      highlight: (text: string) => text, // Make sure to include highlight
      gradient: (text: string) => text, // Include gradient function
      box: () => {}, // Add box method for silent logger
      command: () => {} // Add command method for silent logger
    } :
    logger;

  // Get project path
  const projectPath = process.cwd();

  // Load config file
  const configPath = options.config ?
    resolve(projectPath, options.config) :
    await findConfigFile(projectPath);

  const config = configPath ? await loadConfig(configPath) : {};

  // Set build options
  const outDir = options.outDir || config?.build?.outDir || 'dist';
  const minify = options.minify ?? config?.build?.minify ?? true;
  const ignorePatterns = options.ignore || config?.build?.ignore || ['node_modules', '.git', 'dist'];

  // Start build with beautiful section header
  log.section('BUILDING APPLICATION');
  log.spacer();

  // Log app structure detection
  const isAppDirStructure = existsSync(join(projectPath, 'app'));
  if (isAppDirStructure) {
    log.info('📁 App directory structure detected');
  } else {
    log.info('📁 Classic structure detected - consider migrating to app directory structure');
  }

  // Ensure output directory exists
  const outputPath = resolve(projectPath, outDir);
  await mkdir(outputPath, { recursive: true });

  // Copy static assets with file icon
  const assetsSpin = log.spinner('Copying static assets', 'file');
  try {
    await copyStaticAssets(projectPath, outputPath);
    
    // Copy 0x1 framework files to build output
    await copy0x1FrameworkFiles(outputPath);
    
    assetsSpin.stop('success', 'Static assets: copied successfully');
  } catch (error) {
    assetsSpin.stop('error', 'Failed to copy static assets');
    log.error(`${error}`);
    if (!options.silent) process.exit(1);
    return;
  }

  // Process HTML files with prettier output
  const htmlSpin = log.spinner('Processing HTML templates', 'file');
  try {
    await processHtmlFiles(projectPath, outputPath);
    htmlSpin.stop('success', 'HTML templates: generated successfully');
  } catch (error) {
    htmlSpin.stop('error', 'Failed to process HTML files');
    log.error(`${error}`);
    if (!options.silent) process.exit(1);
    return;
  }

  // Bundle JavaScript/TypeScript with appropriate icons
  const bundleSpin = log.spinner('Bundling JavaScript/TypeScript modules', 'typescript');
  try {
    await bundleJavaScript(projectPath, outputPath, { minify, ignorePatterns });
    bundleSpin.stop('success', 'JavaScript/TypeScript: bundled successfully');
  } catch (error) {
    bundleSpin.stop('error', 'Failed to bundle JavaScript/TypeScript');
    log.error(`${error}`);
    if (!options.silent) process.exit(1);
    return;
  }

  // Process CSS with appropriate icon
  const cssSpin = log.spinner('Processing CSS styles', 'css');
  
  // Check if we're in a deployment environment
  const isDeployment = Boolean(
    process.env.VERCEL || 
    process.env.NETLIFY || 
    process.env.CI ||
    !process.stdout.isTTY
  );

  try {
    // Handle CSS files - look for Tailwind setup
    let tailwindSuccess = false;
    const appGlobalsCss = join(projectPath, 'app', 'globals.css');
    if (existsSync(appGlobalsCss)) {
      log.info(`📂 Found app/globals.css - processing with Tailwind`);
      // Make sure the public/styles directory exists for TailwindCSS output
      const outputStylesDir = join(outputPath, 'styles');
      if (!existsSync(outputStylesDir)) {
        await mkdir(outputStylesDir, { recursive: true });
      }

      // Create the browser directory structure for live-reload script
      const outputBrowserDir = join(outputPath, 'browser');
      if (!existsSync(outputBrowserDir)) {
        await mkdir(outputBrowserDir, { recursive: true });
      }

      // Copy the live-reload script to dist/browser for use in projects
      // Check if __dirname already includes 'src' to avoid src/src duplication
      const baseDir = join(__dirname, '..', '..');
      const dirnameEndsWithSrc = baseDir.endsWith('/src') || baseDir.endsWith('\\src');
      
      // Create the path based on whether we already have 'src' in the path
      const liveReloadSrc = dirnameEndsWithSrc
        ? join(baseDir, 'browser', 'live-reload.js')
        : join(baseDir, 'src', 'browser', 'live-reload.js');
      
      // Add debug logging
      logger.debug(`Base directory: ${baseDir}`);
      logger.debug(`Live reload src path: ${liveReloadSrc}`);
      
      // Skip live-reload script in deployment environments
      const liveReloadDest = join(outputBrowserDir, 'live-reload.js');
      if (!isDeployment && existsSync(liveReloadSrc)) {
        logger.info(`Copying live-reload script to ${liveReloadDest}`);
        await Bun.write(liveReloadDest, await Bun.file(liveReloadSrc).text());
      } else if (!isDeployment) {
        logger.warn(`Could not find live-reload script at ${liveReloadSrc}`);
      } else {
        logger.info('Skipping live-reload script in deployment environment');
      }

      // Run Tailwind CSS build on globals.css - use multiple fallback approaches
      log.info('Processing Tailwind CSS...');
      
      // Try different Tailwind execution methods
      const tailwindCommands = [
        // Try npx first (most compatible)
        ['npx', 'tailwindcss', '-i', appGlobalsCss, '-o', join(outputStylesDir, 'tailwind.css'), minify ? '--minify' : ''].filter(Boolean),
        // Try bun x as fallback
        ['bun', 'x', 'tailwindcss', '-i', appGlobalsCss, '-o', join(outputStylesDir, 'tailwind.css'), minify ? '--minify' : ''].filter(Boolean),
        // Try direct node_modules path
        ['node', join(projectPath, 'node_modules', 'tailwindcss', 'lib', 'cli.js'), '-i', appGlobalsCss, '-o', join(outputStylesDir, 'tailwind.css'), minify ? '--minify' : ''].filter(Boolean)
      ];
      
      for (const command of tailwindCommands) {
        try {
          const tailwindResult = Bun.spawnSync(command, {
            cwd: projectPath,
            env: {
              ...process.env,
              NODE_ENV: 'production',
              TAILWIND_MODE: 'build',
              TAILWIND_DISABLE_TOUCH: '1'
            },
            stdout: 'pipe',
            stderr: 'pipe'
          });

          if (tailwindResult.exitCode === 0) {
            log.info('✅ Tailwind CSS processed successfully');
            tailwindSuccess = true;
            break;
          } else {
            const errorOutput = new TextDecoder().decode(tailwindResult.stderr);
            if (!isDeployment) {
              logger.warn(`Tailwind command failed: ${command[0]} - ${errorOutput}`);
            }
          }
        } catch (cmdError) {
          if (!isDeployment) {
            logger.warn(`Tailwind command error: ${command[0]} - ${cmdError}`);
          }
          continue;
        }
      }
      
      if (!tailwindSuccess) {
        log.warn('⚠️ Failed to process Tailwind CSS: error: could not determine executable to run for package tailwindcss');
        log.info('💠 Falling back to standard CSS processing');
      }
    }

    // Process CSS files (will handle fallback internally if Tailwind failed)
    await processCssFiles(projectPath, outputPath, { minify, ignorePatterns, tailwindFailed: !tailwindSuccess });
    cssSpin.stop('success', 'CSS styles: processed and optimized');
  } catch (error) {
    // CSS processing is optional, so just show a warning
    cssSpin.stop('warn', 'CSS processing skipped (not configured)');
    log.warn(`CSS processing error: ${error}`);
  }

  // Output build info with beautiful formatting
  log.box('Build Complete');
  log.info(`📦 Output directory: ${log.highlight(outputPath)}`);
  log.info(`🔧 Minification: ${minify ? 'enabled' : 'disabled'}`);

  // Calculate and display build time
  const endTime = performance.now();
  const buildTimeMs = endTime - startTime;
  const formattedTime = buildTimeMs < 1000 ?
    `${buildTimeMs.toFixed(2)}ms` :
    `${(buildTimeMs / 1000).toFixed(2)}s`;

  log.spacer();
  log.info(`⚡ Build completed in ${log.highlight(formattedTime)}`);

  // Watch mode if requested
  if (options.watch && !options.silent) {
    log.spacer();
    log.info('👀 Watching for changes...');
    log.info('Press Ctrl+C to stop');

    // Implementation of watch mode would go here
    // For now, this is a placeholder
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
  // Check for TypeScript config first
  const tsConfigPath = join(projectPath, '0x1.config.ts');
  if (existsSync(tsConfigPath)) {
    return tsConfigPath;
  }

  // Then check for JavaScript config
  const jsConfigPath = join(projectPath, '0x1.config.js');
  if (existsSync(jsConfigPath)) {
    return jsConfigPath;
  }

  // Look for package.json with 0x1 field
  const packageJsonPath = join(projectPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());
      if (packageJson['0x1']) {
        return packageJsonPath;
      }
    } catch (error) {
      // Ignore errors in package.json parsing
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
      // For JS/TS configs, use dynamic import
      try {
        const config = await import(configPath);
        return config.default || config;
      } catch (error) {
        logger.warn(`Failed to import config from ${configPath}: ${error}`);
        // Fallback to reading as text and evaluating
        const content = await Bun.file(configPath).text();

        try {
          // Extract the config object literal from the file
          const match = content.match(/export\s+default\s+({[\s\S]*});?$/m);
          if (match && match[1]) {
            // Very simple approach - this will only work for basic objects
            // A real implementation would need a proper parser
            return JSON.parse(match[1].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'));
          }
        } catch (evalError) {
          logger.warn(`Failed to evaluate config: ${evalError}`);
        }
      }
    } else if (configPath.endsWith('package.json')) {
      // For package.json, extract the 0x1 field
      const content = Bun.file(configPath).text();
      const packageJson = JSON.parse(await content);
      return packageJson['0x1'] || {};
    }

    return {};
  } catch (error) {
    logger.warn(`Failed to load config from ${configPath}: ${error}`);
    return {};
  }
}

/**
 * Copy static assets
 */
async function copyStaticAssets(projectPath: string, outputPath: string): Promise<void> {
  // We'll consider anything in the public directory as static assets
  const publicDir = join(projectPath, 'public');

  if (existsSync(publicDir)) {
    await copyDir(publicDir, outputPath);
  }
}

/**
 * Copy 0x1 framework files to build output
 */
async function copy0x1FrameworkFiles(outputPath: string): Promise<void> {
  try {
    // Create the 0x1 directory in the output
    const framework0x1Dir = join(outputPath, '0x1');
    await mkdir(framework0x1Dir, { recursive: true });
    
    // Get the path to the framework dist directory more reliably
    // From the CLI commands directory, go up to the project root and then to dist
    const currentFile = new URL(import.meta.url).pathname;
    const cliCommandsDir = dirname(currentFile);
    const frameworkRoot = resolve(cliCommandsDir, '..', '..');
    const frameworkDistPath = join(frameworkRoot, 'dist');
    
    logger.debug(`Looking for framework files in: ${frameworkDistPath}`);
    
    // Copy essential framework files
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
        logger.debug(`Copied framework file: ${src} -> ${dest}`);
        copiedCount++;
      } else {
        logger.warn(`Framework file not found: ${srcPath}`);
      }
    }
    
    if (copiedCount > 0) {
      logger.info(`✅ Copied ${copiedCount} 0x1 framework files to build output`);
    } else {
      logger.warn('⚠️ No 0x1 framework files were copied - build may not work in production');
    }
  } catch (error) {
    logger.warn(`Failed to copy 0x1 framework files: ${error}`);
  }
}

/**
 * Process HTML files
 */
async function processHtmlFiles(projectPath: string, outputPath: string): Promise<void> {
  // Find HTML files in the project
  const htmlFiles = await findFiles(projectPath, '.html', ['node_modules', 'dist', '.git']);

  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    // Get the relative path to maintain directory structure
    const relativePath = relative(projectPath, htmlFile);
    const outputFile = join(outputPath, relativePath);

    // Create output directory if needed
    await mkdir(dirname(outputFile), { recursive: true });

    // Read the HTML file
    const content = await Bun.file(htmlFile).text();

    // Process the HTML content
    const processedContent = await processHtml(content, {
      projectPath,
      outputPath,
      relativePath
    });

    // Write the processed HTML file
    await Bun.write(outputFile, processedContent);
  }

  // If no HTML files found, create a proper index.html that loads the application
  if (htmlFiles.length === 0) {
    // Check for app entry point (app/page.tsx, app/page.jsx, app/page.js, etc.)
    const appDir = join(projectPath, 'app');
    const hasAppDir = existsSync(appDir);

    if (hasAppDir) {
      // Using modern app router structure with proper app loading
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    /* FIXME: Minimise/reduce this, but keep pretty & probably dark mode only */
    /* Modern base styles for the 0x1 app */
    :root {
      --primary: #0070f3;
      --secondary: #6219ff;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: var(--font);
      background: #18181b;
      color: #f3f3f3;
    }
    /* Loading styles */
    .app-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;
      background: #18181b;
      z-index: 1000;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .app-loading.loaded {
      opacity: 0;
      visibility: hidden;
    }
    .dots-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .loading-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--primary);
      animation: dot-pulse 1.5s infinite ease-in-out;
    }
    .loading-dot:nth-child(2) {
      animation-delay: 0.2s;
      background-color: var(--secondary);
    }
    .loading-dot:nth-child(3) {
      animation-delay: 0.4s;
      background-color: var(--primary);
    }
    @keyframes dot-pulse {
      0%, 100% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    .error-container {
      display: none;
      color: red;
      padding: 20px;
      text-align: center;
      background: rgba(255, 235, 235, 0.9);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 80%;
    }
    .error-title {
      font-size: 1.4rem;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .error-message {
      font-size: 1rem;
      margin-bottom: 15px;
    }
    .error-details {
      font-family: monospace;
      background: rgba(0, 0, 0, 0.05);
      padding: 10px;
      border-radius: 4px;
      font-size: 0.9rem;
      white-space: pre-wrap;
      overflow-x: auto;
      text-align: left;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  
  <!-- Loading overlay that will be removed once app loads -->
  <div class="app-loading" id="app-loading">
    <div class="dots-container">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
  </div>
  
  <!-- Error container shown only if there's an error -->
  <div class="error-container" id="error-container">
    <div class="error-title">Application Error</div>
    <div class="error-message">Failed to load the application.</div>
    <div class="error-details" id="error-details">Check browser console for more details.</div>
  </div>
  
  <script>
    // Enhanced error handling
    window.addEventListener('error', function(e) {
      console.error('App Error:', e.error);
      const errorContainer = document.getElementById('error-container');
      const errorDetails = document.getElementById('error-details');
      const appLoading = document.getElementById('app-loading');
      
      // Hide loading indicator
      if (appLoading) {
        appLoading.style.display = 'none';
      }
      
      // Show error with details
      if (errorContainer && errorDetails) {
        errorContainer.style.display = 'block';
        errorDetails.textContent = e.error ? e.error.toString() : 'Unknown error';
      }
    });
    
    // Hide loading overlay when app is ready
    // This will be called by the app.js when it finishes loading the app
    window.appReady = function() {
      const loadingEl = document.getElementById('app-loading');
      if (loadingEl) {
        loadingEl.classList.add('loaded');
        // Remove from DOM after animation completes
        setTimeout(() => {
          loadingEl.remove();
        }, 500);
      }
    };
    
    // Fallback: If app doesn't call appReady within 3 seconds, remove loading overlay anyway
    setTimeout(() => {
      const loadingEl = document.getElementById('app-loading');
      if (loadingEl && !loadingEl.classList.contains('loaded')) {
        loadingEl.classList.add('loaded');
      }
    }, 3000);
  </script>
  
  <!-- Load the actual application -->  
  <script src="/app.js" type="module" onerror="console.error('Failed to load app.js')"></script>
</body>
</html>`;

      await Bun.write(join(outputPath, 'index.html'), indexHtml);
      logger.info('✅ Created proper index.html that loads the application');
    }
  }
}

/**
 * Process HTML content
 */
async function processHtml(
  content: string,
  _options: { projectPath: string; outputPath: string; relativePath: string }
): Promise<string> {
  // This is a placeholder for more complex HTML processing
  // In a real implementation, you might want to:
  // - Inject CSS and JS bundles
  // - Add preload hints
  // - Minify HTML
  // - Add CSP headers
  // - etc.
  return content;
}

/**
 * Bundle JavaScript/TypeScript with enhanced Bun APIs
 * Optimized for app router structure
 */
async function bundleJavaScript(
  projectPath: string,
  outputPath: string,
  options: { minify: boolean, ignorePatterns?: string[] }
): Promise<void> {
  const { minify, ignorePatterns = ['node_modules', '.git', 'dist'] } = options;
  // File extensions to look for
  const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];

  // Create public directory for bundled JS (but also put main files in root)
  const jsOutputPath = join(outputPath, 'public', 'js');
  await mkdir(jsOutputPath, { recursive: true });
  
  // Also ensure we can put main files directly in the output root
  await mkdir(outputPath, { recursive: true });

  // Create .0x1 directory for temp files if it doesn't exist
  const tempDir = join(projectPath, '.0x1', 'temp');
  await mkdir(tempDir, { recursive: true });
  
  // Helper function to find main entry file
  function findMainEntryFile(dir: string): string | null {
    const entryFileNames = ['index.js', 'index.ts', 'index.tsx', 'index.jsx', 'app.js', 'app.ts', 'app.tsx', 'app.jsx', '_app.js', '_app.ts', '_app.tsx', '_app.jsx'];

    for (const fileName of entryFileNames) {
      const entryPath = join(dir, fileName);
      if (existsSync(entryPath)) {
        return entryPath;
      }
    }
    return null;
  }
  
  // First build all components using our new builder utility
  const componentsBuilt = await buildComponents(projectPath);
  
  if (!componentsBuilt) {
    logger.warn('No components were found or built. Application may not function correctly.');
  }
  
  // Build the app bundle
  const bundleBuilt = await buildAppBundle(projectPath);
  
  if (!bundleBuilt) {
    // If bundle build fails, try traditional entry point approach as fallback
    logger.warn('Failed to build using modern app structure, falling back to traditional entry point detection');
    
    // Find entry points using traditional approach
    let mainEntryFile = findMainEntryFile(join(projectPath, 'app'));

    // If no entry point found in app/, try src/ directory
    if (!mainEntryFile && existsSync(join(projectPath, 'src'))) {
      mainEntryFile = findMainEntryFile(join(projectPath, 'src'));
    }

    // If no entry point found in src/, check project root
    if (!mainEntryFile) {
      mainEntryFile = findMainEntryFile(projectPath);
    }

    if (!mainEntryFile) {
      throw new Error('No entry point found. Please create app/page.tsx or src/index.js');
    }

    // Process bundle
    await processJSBundle(mainEntryFile, projectPath, { minify });
  } else {
    logger.info('✅ App bundle built successfully using modern structure');
    
    // Copy the built bundle to the output directory directly
    const builtBundlePath = join(projectPath, '.0x1', 'public', 'app-bundle.js');
    if (existsSync(builtBundlePath)) {
      const bundleContent = await Bun.file(builtBundlePath).text();
      
      // Use the bundle content directly - it should already have proper imports and component handling
      await Bun.write(join(outputPath, 'app.js'), bundleContent);
      logger.info('✅ App bundle deployed successfully');
    } else {
      // Bundle build reported success but no file created - create a diagnostic bundle
      logger.warn('Bundle build succeeded but no file found - creating diagnostic bundle');
      const diagnosticBundle = `// 0x1 Diagnostic Bundle
import { jsx, jsxs, Fragment, createElement } from '/0x1/jsx-runtime.js';

function DiagnosticApp() {
  return jsx('div', { 
    className: 'p-8 text-center',
    children: [
      jsx('h1', { className: 'text-2xl font-bold mb-4', children: '0x1 Diagnostic' }),
      jsx('p', { className: 'mb-2', children: 'App bundle build succeeded but no bundle file was found.' }),
      jsx('p', { className: 'text-sm opacity-75', children: 'Check your app/page.tsx file and build process.' })
    ]
  });
}

// Mount the diagnostic app
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app');
    if (appRoot) {
      appRoot.innerHTML = '';
      appRoot.appendChild(DiagnosticApp());
      console.log('✅ Diagnostic app rendered');
      if (window.appReady) window.appReady();
    }
  });
}

export default DiagnosticApp;
`;
      await Bun.write(join(outputPath, 'app.js'), diagnosticBundle);
      logger.warn('Created diagnostic bundle as fallback');
    }
  }
}

/**
 * Process JavaScript/TypeScript file bundle
 */
async function processJSBundle(entryFile: string, projectPath: string, options: { minify: boolean }): Promise<boolean | void> {
  // Use direct transpilation for .tsx files to avoid bundling issues
  if (entryFile.endsWith('.tsx') || entryFile.endsWith('.jsx')) {
    // Calculate output file path similar to how it's done for other files
    const relativePath = relative(projectPath, entryFile);
    const outputDir = join(projectPath, 'dist');
    const baseName = relativePath.replace(/\\/g, '/'); // Normalize path separators for Windows
    const outputFile = join(outputDir, baseName.replace(/\.(tsx|jsx|ts|js)$/, '.js'));

    // Call transpileJSX with correct parameters
    return await transpileJSX(entryFile, dirname(outputFile), options.minify, projectPath);
  }
  const { minify } = options;

  // Not needed to check for TypeScript file type since we handle all file types

  // Get the relative path to the entry file from the project root
  const relativePath = relative(projectPath, entryFile);

  // Calculate the output file path
  // Convert .tsx/.ts to .js
  const outputName = relativePath
    .replace(/\.tsx?$/, '.js')
    .replace(/\.jsx$/, '.js');

  // Determine the output file path
  const outputFile = join(projectPath, 'dist', outputName);

  try {
    // Ensure the output directory exists
    await mkdir(dirname(outputFile), { recursive: true });

    // Read the entry file content
    const fileContent = await Bun.file(entryFile).text();

    // Configure Bun's bundler with proper JSX handling
    const loader: { [key: string]: 'tsx' | 'jsx' | 'js' | 'ts' } = {
      '.tsx': 'tsx',
      '.jsx': 'jsx',
      '.ts': 'ts',
      '.js': 'js'
    };

    // Check for 0x1 framework imports
    const file0x1Imports = fileContent.match(/from\s+['"]0x1(\/[\w-]+)?['"]|import\s+['"]0x1(\/[\w-]+)?['"]/);
    const routerImport = fileContent.match(/from\s+['"]0x1\/router['"]|import\s+['"]0x1\/router['"]/);

    // Modify content based on imports
    let modifiedContent = fileContent;

    // If we have router imports, replace them with global declarations
    if (routerImport) {
      logger.debug(`File ${relative(projectPath, entryFile)} contains router imports. Converting to global approach.`);

      // Replace router imports with global declarations
      modifiedContent = modifiedContent.replace(
        /import\s+\{\s*(?:Router|Link|NavLink|Redirect)(?:\s*,\s*(?:Router|Link|NavLink|Redirect))*\s*\}\s+from\s+['"]0x1\/router['"];?/g,
        '// Router components are available as globals from the script in index.html\n' +
        'declare const Router: any;\n' +
        'declare const Link: any;\n' +
        'declare const NavLink: any;\n' +
        'declare const Redirect: any;'
      );
    }

    // For other 0x1 framework imports, we still need to set up browser compatibility
    if (file0x1Imports && !routerImport) {
      logger.debug(`File ${relative(projectPath, entryFile)} contains other 0x1 framework imports. Setting up browser compatibility.`);

      // Create 0x1 module for browser compatibility
      const framework0x1Dir = join(dirname(outputFile), '0x1');

      // Transform bare imports like 'import { createElement, Fragment } from "0x1"'
      modifiedContent = modifiedContent.replace(
        /from\s+["'](0x1)["']|import\s+["']0x1["']|import\(["']0x1["']\)/g,
        (match) => {
          return match.replace(/["']0x1["']/, '"/0x1/index.js"');
        }
      );

      // Handle submodule imports like 'import { Router } from "0x1/router"'
      modifiedContent = modifiedContent.replace(
        /from\s+["'](0x1\/[\w-]+)["']|import\s+["']0x1(\/[\w-]+)["']|import\(["']0x1(\/[\w-]+)["']\)/g,
        (match, subpath1, subpath2, subpath3) => {
          const subpath = subpath1 || subpath2 || subpath3;
          return match.replace(/["']0x1(\/[\w-]+)["']/, '"/0x1' + subpath + '.js"');
        }
      );

      await mkdir(framework0x1Dir, { recursive: true });

      // Create browser-compatible index module for the 0x1 framework
      const indexJsContent = `
// 0x1 Framework - Browser Compatible Version

// Import main hooks system first
import * as hooks from './core/hooks.js';

// Import JSX runtime components
import { jsx, jsxs, Fragment, createElement } from './jsx-runtime.js';

// Import router components with consistent naming
import { Router, RouterLink, RouterNavLink, RouterRedirect, createRouter } from './router.js';

// Export version
export const version = '0.1.0';

// Export all hooks
export const {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  setComponentContext,
  clearComponentContext,
  unmountComponent,
  isComponentMounted,
  getComponentStats,
  getAllComponentStats
} = hooks;

// Export all components and utilities
export {
  // JSX Runtime exports
  jsx,
  jsxs,
  Fragment,
  createElement,
  
  // Router exports
  Router,
  createRouter,
  RouterLink as Link, 
  RouterNavLink as NavLink,
  RouterRedirect as Redirect
};

// Default export for easy access to all components
export default {
  // Hooks
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  setComponentContext,
  clearComponentContext,
  
  // JSX Runtime
  jsx,
  jsxs,
  Fragment,
  createElement,
  
  // Router components
  Router,
  createRouter,
  Link: RouterLink,
  NavLink: RouterNavLink,
  Redirect: RouterRedirect,
  
  // Version
  version
};`;

      await Bun.write(join(framework0x1Dir, 'index.js'), indexJsContent);
      
      // Also ensure hooks are available at the framework level
      const frameworkHooksDir = join(framework0x1Dir, 'core');
      await mkdir(frameworkHooksDir, { recursive: true });
      
      // Copy the transpiled hooks from dist if available
      const distHooksPath = join(__dirname, '..', '..', '..', 'dist', 'core', 'hooks.js');
      const nodeModulesHooksPath = join(framework0x1Dir, 'core', 'hooks.js');
      
      if (existsSync(distHooksPath)) {
        await Bun.write(nodeModulesHooksPath, await Bun.file(distHooksPath).text());
        console.log('✅ Hooks system copied to project framework directory');
        
        // Also ensure it's available in the node_modules structure for dev server
        const nodeModulesDevPath = join(framework0x1Dir, '..', '..', 'node_modules', '0x1', 'core');
        await mkdir(nodeModulesDevPath, { recursive: true });
        await Bun.write(join(nodeModulesDevPath, 'hooks.js'), await Bun.file(distHooksPath).text());
        console.log('✅ Hooks system copied to node_modules dev path');
      } else {
        console.warn('⚠️ Transpiled hooks not found at:', distHooksPath);
      }
    }
    // Create a temporary file path for modified content
    let actualEntryFile = entryFile;
    const tempFile = join(dirname(entryFile), `.temp-${basename(entryFile)}`);

    // If we modified the content, use the temp file for bundling
    if (modifiedContent !== fileContent) {
      // Use the temp file for bundling instead
      // Note: We don't actually modify entryFile directly as it could cause TypeScript errors
      await Bun.write(tempFile, modifiedContent);
      actualEntryFile = tempFile;
    }

    // Get base filename for naming configuration
    const baseName = basename(entryFile).split('.')[0];

    // Direct JSX handling approach using Bun's internal transpilation
    // This minimizes external dependencies for better reliability
    if (actualEntryFile.endsWith('.tsx') || actualEntryFile.endsWith('.jsx')) {
      logger.info(`Processing JSX in ${basename(actualEntryFile)}...`);

      try {
        // Create a simple JS file that directly imports our JSX runtime
        // and uses Bun's native JSX handling
        const tempJsFile = join(dirname(actualEntryFile), `.jsx-transpiled-${basename(actualEntryFile).replace(/\.tsx$|\.jsx$/, '.js')}`);

        // Create a temporary file that configures Bun's transpiler correctly
        const tempTsConfigFile = join(dirname(actualEntryFile), `.temp-tsconfig-jsx.json`);
        await Bun.write(tempTsConfigFile, JSON.stringify({
          "compilerOptions": {
            "target": "ESNext",
            "module": "ESNext",
            "jsx": "preserve",
            "jsxFactory": "createElement",
            "jsxFragmentFactory": "Fragment"
          }
        }));

        // Create a unique directory for the transpiled output
        const uniqueOutDir = dirname(tempJsFile);
        if (!existsSync(uniqueOutDir)) {
          await mkdir(uniqueOutDir, { recursive: true });
        }

        // Use Bun's built-in transpiler to handle JSX with unique settings to avoid conflicts
        // Create a completely unique output file to prevent collisions
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const fileName = basename(actualEntryFile).replace(/\.tsx$/, '');
        const uniqueOutFile = join(uniqueOutDir, `${fileName}.${timestamp}-${randomId}.js`);

        // Use Bun's spawn for better performance and reliability
        const transpileResult = Bun.spawn([
          'bun', 'build', actualEntryFile,
          '--outfile', uniqueOutFile,
          '--tsconfig-override', tempTsConfigFile,
          '--external:@tailwind*',
          '--external:tailwindcss',
          '--external:postcss*',
          '--external:*.css',
          '--no-bundle-nodejs-globals'
        ]);

        const exitCode = await transpileResult.exited;
        if (exitCode === 0) {
          logger.debug(`Successfully transpiled JSX in ${basename(actualEntryFile)}`);

          // Modify the transpiled file to ensure it imports our JSX runtime properly
          let jsContent = await Bun.file(tempJsFile).text();

          // Add our JSX runtime imports at the top
          // Make sure we're defining Fragment properly with a consistent identifier
          const jsxRuntimeImport = `// Add JSX runtime imports\nimport { createElement, Fragment, jsx, jsxs, jsxDEV } from '/0x1/jsx-runtime.js';\n\n// Ensure Fragment is globally available with a consistent name\nwindow.Fragment = Fragment;\n\n`;

          jsContent = jsxRuntimeImport + jsContent;
          await Bun.write(tempJsFile, jsContent);

          // Use the pre-processed JS file for the main bundle
          actualEntryFile = tempJsFile;
        } else {
          logger.error(`Failed to transpile JSX in ${basename(actualEntryFile)}`);
        }
      } catch (err) {
        logger.error(`Error processing JSX: ${String(err)}`);
      }
    }

    // Create JSX runtime support files for the build - focused on modern approach
    const jsxRuntimeDir = dirname(outputFile);
    await mkdir(jsxRuntimeDir, { recursive: true });

    // Write JSX runtime shim that re-exports from the framework
    const jsxRuntimePath = join(jsxRuntimeDir, 'jsx-runtime.js');
    const jsxRuntimeContent = `// 0x1 Framework - JSX Runtime
// This exports all JSX runtime functions needed for components
import { createElement, Fragment, jsx, jsxs } from '/0x1/jsx-runtime.js';

// Export JSX runtime functions
export { createElement, Fragment, jsx, jsxs };
export const jsxDEV = jsx; // Development mode alias

// Also export as default for module interop
export default {
  createElement, Fragment, jsx, jsxs, jsxDEV
};
`;

    await Bun.write(jsxRuntimePath, jsxRuntimeContent);

    // Create dev runtime variant
    const jsxDevRuntimePath = join(jsxRuntimeDir, 'jsx-dev-runtime.js');
    const jsxDevRuntimeContent = jsxRuntimeContent.replace(/jsx-runtime\.js/g, 'jsx-dev-runtime.js');
    await Bun.write(jsxDevRuntimePath, jsxDevRuntimeContent);
    
    logger.info('✅ JSX runtime files created for modern imports');
    
    // Define build options using Bun's API
    const result = await Bun.build({
      entrypoints: [actualEntryFile],
      outdir: dirname(outputFile),
      naming: `[dir]/[name]${baseName === 'index' ? '' : '.[name]'}.js`,
      loader,
      // Apply minification based on options
      minify,
      // Add source maps for better debugging
      sourcemap: options.minify ? 'none' : 'external',
      // Define environment variables and JSX handling
      define: {
        'process.env.NODE_ENV': options.minify ? '"production"' : '"development"',
        'process.env.APP_DIR': existsSync(join(projectPath, 'app')) ? 'true' : 'false'
      },
      // Improve module resolution and tree shaking
      // treeshake: options.minify, // Removing unsupported property
      // Handle node modules properly
      external: ['*'],
      // Enable better error messages
      // logLevel: 'error', // Removing unsupported property
    });

    try {
      if (!result.success) {
        // Enhanced error logging to diagnose the JSX transpilation issue
        console.error('\n=============== BUILD ERROR DETAILS ===============');
        console.error('Build logs:', result.logs?.join('\n'));
        console.error('File being bundled:', actualEntryFile);

        // Try to read the file to see what might be causing the error
        try {
          const fileContent = await Bun.file(actualEntryFile).text();
          console.error('\nFile content snippet (first 200 chars):', fileContent.substring(0, 200) + '...');
        } catch (err) {
          console.error('Could not read file content:', err);
        }

        console.error('\n===============================================');
        throw new Error(`Bundle failed: ${result.logs?.join('\n') || 'Unknown error'}`);
      }
    } catch (e) {
      // Type assertion for better error handling
      const error = e as Error;
      logger.error(`Error during bundling of ${entryFile}: ${error.message || String(error)}`);
      if (error.stack) {
        logger.debug(`Stack trace: ${error.stack}`);
      }
      throw new Error(`Failed to bundle ${entryFile}: ${error.message || String(error)}`);
    }

    logger.debug(`Bundle generated: ${outputFile}`);
  } catch (error: any) {
    logger.error(`Error during bundling of ${entryFile}: ${error.message || error}`);
    if (error.stack) {
      logger.debug(`Stack trace: ${error.stack}`);
    }
    throw new Error(`Failed to bundle ${entryFile}: ${error.message || error}`);
  }
}

/**
 * Process CSS files
 */
async function processCssFiles(
  projectPath: string,
  outputPath: string,
  options: { minify: boolean, ignorePatterns?: string[], tailwindFailed: boolean }
): Promise<void> {
  const { minify, ignorePatterns = ['node_modules', '.git', 'dist'], tailwindFailed } = options;

  // Get all css files
  const cssFiles = await findFiles(projectPath, '.css', ignorePatterns);

  // Check for tailwind config files
  const hasTailwind = existsSync(join(projectPath, 'tailwind.config.js')) ||
    existsSync(join(projectPath, 'tailwind.config.ts'));

  // If Tailwind processing already failed upstream, go directly to standard processing
  if (tailwindFailed) {
    logger.info('Using standard CSS processing (Tailwind failed upstream)');
    await processCssFilesStandard();
    return;
  }

  // Process Tailwind CSS if available and not already attempted
  if (hasTailwind) {
    // Create a combined CSS file for all CSS files
    let combinedCSS = '';

    // First add Tailwind directives
    combinedCSS = `
      /* Tailwind Directives */
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `;

    // Then add all other CSS files
    for (const cssFile of cssFiles) {
      const cssContent = await Bun.file(cssFile).text();
      combinedCSS += `\n/* From ${relative(projectPath, cssFile)} */\n${cssContent}`;
    }

    try {
      // Use Bun's built-in process.spawn to run tailwind CLI instead of importing modules
      // This avoids TypeScript errors with missing type declarations
      const tailwindCssOutputPath = join(outputPath, 'styles.css');
      // Write the combined CSS to a temporary file
      const tempCssPath = join(projectPath, '.temp-tailwind-input.css');
      await Bun.write(tempCssPath, combinedCSS);

      // Use Bun to process Tailwind CSS
      try {
        // Using Bun to run tailwindcss for optimal performance
        const args = [
          'bunx', 'tailwindcss',
          '-i', tempCssPath,
          '-o', tailwindCssOutputPath
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

        // Clean up temporary file
        try {
          Bun.spawnSync(['rm', tempCssPath], { cwd: projectPath });
        } catch (e) {
          // Ignore cleanup errors
        }

        if (result.exitCode === 0) {
          logger.info('🎨 Tailwind CSS: processed successfully');
        } else {
          const error = new TextDecoder().decode(result.stderr);
          throw new Error(`Failed to process Tailwind CSS: ${error}`);
        }
      } catch (error) {
        // Clean up temporary file if it still exists
        if (existsSync(tempCssPath)) {
          try {
            Bun.spawnSync(['rm', tempCssPath], { cwd: projectPath });
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        throw error;
      }
    } catch (error) {
      logger.warn(`Failed to process Tailwind CSS: ${error}`);
      logger.info('Falling back to standard CSS processing');

      // Fall back to standard CSS processing
      await processCssFilesStandard();
    }
  } else {
    // Process CSS files without Tailwind
    await processCssFilesStandard();
  }

  // Standard CSS processing
  async function processCssFilesStandard() {
    if (cssFiles.length === 0) {
      logger.info('No CSS files found');

      // Create a minimal styles.css file with modern CSS resets
      const minimalCSS = `
        /* Modern CSS Reset */
        *, *::before, *::after {
          box-sizing: border-box;
        }

        body, h1, h2, h3, h4, p, figure, blockquote, dl, dd {
          margin: 0;
        }

        html:focus-within {
          scroll-behavior: smooth;
        }

        body {
          min-height: 100vh;
          text-rendering: optimizeSpeed;
          line-height: 1.5;
          font-family: system-ui, sans-serif;
        }

        img, picture {
          max-width: 100%;
          display: block;
        }

        input, button, textarea, select {
          font: inherit;
        }

        /* Basic styles for 0x1 app */
        #app {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }
      `;

      const finalCSS = minify ? await minifyCss(minimalCSS) : minimalCSS;
      await Bun.write(join(outputPath, 'styles.css'), finalCSS);
      return;
    }

    // Combine all CSS files
    let combinedCSS = '';

    for (const cssFile of cssFiles) {
      const relativePath = relative(projectPath, cssFile);
      const cssContent = await Bun.file(cssFile).text();

      combinedCSS += `\n/* From ${relativePath} */\n${cssContent}`;
    }

    // Minify if needed
    const finalCSS = minify ? await minifyCss(combinedCSS) : combinedCSS;

    // Write the combined CSS file
    await Bun.write(join(outputPath, 'styles.css'), finalCSS);
  }
}

/**
 * Helper function to minify CSS with a Bun-optimized implementation
 * This avoids external dependencies that might cause issues
 */
async function minifyCss(css: string): Promise<string> {
  try {
    // First attempt: Use Bun's temporary file approach for better performance
    const tempFile = join('/tmp', `temp-css-${Date.now()}.css`);
    await Bun.write(tempFile, css);

    // Use Bun to process the CSS
    const minifyScript = `
      const fs = require('fs');
      const css = fs.readFileSync('${tempFile}', 'utf8');

      // Manual string-based CSS minification to avoid regex escaping issues
      let minified = '';
      let inComment = false;

      // Manual parsing to remove comments and whitespace
      for (let i = 0; i < css.length; i++) {
        // Handle comments
        if (i < css.length - 1 && css[i] === '/' && css[i+1] === '*') {
          inComment = true;
          i++; // Skip the * character
          continue;
        }
        if (inComment && i < css.length - 1 && css[i] === '*' && css[i+1] === '/') {
          inComment = false;
          i++; // Skip the / character
          continue;
        }
        if (inComment) continue;

        // Skip newlines and excessive whitespace
        if (css[i] === '\n') continue;
        if (css[i] === ' ' && (minified.endsWith(' ') || minified.endsWith('{') || minified.endsWith(':') || minified.endsWith(';'))) continue;

        // Add current character
        minified += css[i];
      }

      // Final fixes
      minified = minified.replace(/;}/g, '}');
        .trim();
      process.stdout.write(minified);
    `;

    const result = await Bun.spawn(['bun', 'run', '-e', minifyScript]);
    const minified = await new Response(result.stdout).text();

    // Clean up temp file
    await Bun.spawn(['rm', tempFile]);

    if (minified && minified.length > 0) {
      return minified;
    }
  } catch (error) {
    logger.debug(`Error using Bun minification: ${error}. Falling back to basic minification.`);
  }

  // Fallback: Basic CSS minification implementation if Bun approach fails
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/[\r\n\t]+/g, '') // Remove whitespace
    .replace(/ {2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/([{:;,}]) /g, '$1')
    .replace(/ ([{:;,}])/g, '$1')
    .replace(/;}/, '}') // Remove trailing semicolons
    .trim();
}

/**
 * Helper function to find files with specific extensions
 */
async function _findFilesByExtension(dir: string, extensions: string[], ignorePatterns: string[] = ['node_modules', '.git', 'dist']): Promise<string[]> {
  // Directly use the comprehensive findFiles function below
  return findFiles(dir, extensions, ignorePatterns);
}

/**
 * Helper function to copy a directory recursively
 * Using Bun's optimized implementation for better performance
 */
async function copyDir(source: string, destination: string): Promise<void> {
  // Use Bun's native spawnSync for optimal performance when copying directories
  // This is much faster than recursive file copying for large directories
  try {
    // Ensure destination exists
    await mkdir(destination, { recursive: true });

    // Use cp -r for high-performance directory copying
    // This is faster than manually walking directories and copying files
    const result = Bun.spawnSync(['cp', '-r', `${source}/.`, destination], {
      cwd: process.cwd(),
      env: process.env,
      stdin: 'ignore',
      stdout: 'ignore',
      stderr: 'pipe'
    });

    if (result.exitCode !== 0) {
      // Handle copy errors more gracefully
      const error = new TextDecoder().decode(result.stderr);
      throw new Error(`Failed to copy directory: ${error}`);
    }
  } catch (error) {
    // Fallback to manual copying if the command fails
    // Get all files and subdirectories in the source directory
    const entries = await readdir(source, { withFileTypes: true });

    // Copy each entry
    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const destPath = join(destination, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        await copyDir(sourcePath, destPath);
      } else {
        // Copy file using Bun's optimized file API
        const file = Bun.file(sourcePath);
        await Bun.write(destPath, file);
      }
    }
  }
}

/**
 * Helper function to find files with specific extensions
 */
async function findFiles(dir: string, extensions: string | string[], ignorePatterns: string[] = ['node_modules', '.git', 'dist']): Promise<string[]> {
  const extensionsArray = Array.isArray(extensions) ? extensions : [extensions];
  const result: string[] = [];

  // Helper function to check if a path should be ignored
  function shouldIgnore(path: string): boolean {
    return ignorePatterns.some(pattern => {
      // Convert pattern to regex if it has wildcards
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
      }
      return path.includes(pattern);
    });
  }

  // Recursive function to search directories
  async function searchDir(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(currentDir, entry.name);
      const relativePath = relative(dir, path);

      // Skip ignored paths
      if (shouldIgnore(relativePath) || shouldIgnore(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await searchDir(path);
      } else if (extensionsArray.some(ext => entry.name.endsWith(ext))) {
        result.push(path);
      }
    }
  }

  await searchDir(dir);
  return result;
}

/**
 * Helper function to get filename without extension
 */
function basename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}
