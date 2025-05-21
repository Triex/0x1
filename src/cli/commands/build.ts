/**
 * 0x1 CLI - Build Command
 * Builds the application for production
 */

import { existsSync } from 'fs';
import { mkdir, readdir } from 'fs/promises'; // For directory operations
// We'll use Bun.file() instead of readFile/writeFile for better performance
import { dirname, join, relative, resolve } from 'path';
import { logger } from '../utils/logger.js';
import { transpileJSX } from './jsx-transpiler.js'; // Import the JSX transpiler module

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
  try {
    // Check for app/globals.css for Tailwind processing
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
      const liveReloadSrc = join(__dirname, '..', '..', 'src', 'browser', 'live-reload.js');
      const liveReloadDest = join(outputBrowserDir, 'live-reload.js');
      if (existsSync(liveReloadSrc)) {
        logger.info(`Copying live-reload script to ${liveReloadDest}`);
        await Bun.write(liveReloadDest, await Bun.file(liveReloadSrc).text());
      } else {
        logger.warn(`Could not find live-reload script at ${liveReloadSrc}`);
      }

      // Run Tailwind CSS build on globals.css using bun x (per user rules)
      const tailwindResult = Bun.spawnSync([
        'bun', 'x', 'tailwindcss',
        '-i', appGlobalsCss,
        '-o', join(outputStylesDir, 'tailwind.css'),
        '--postcss', // Add postcss flag to properly handle @tailwind directives
        minify ? '--minify' : ''
      ].filter(Boolean), { // Filter to remove empty string if minify is false
        cwd: projectPath,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          // Add these environment variables to fix Tailwind CSS processing
          TAILWIND_MODE: 'build',
          TAILWIND_DISABLE_TOUCH: '1'
        },
        stdout: 'pipe',
        stderr: 'pipe'
      });

      if (tailwindResult.exitCode !== 0) {
        const errorOutput = new TextDecoder().decode(tailwindResult.stderr);
        log.warn(`Tailwind processing warning: ${errorOutput}`);
        // Continue even if there's a warning - we'll handle CSS processing as a fallback
      } else {
        log.info('✅ Tailwind CSS processed successfully');
      }
    }

    // Process all other CSS files
    await processCssFiles(projectPath, outputPath, { minify, ignorePatterns });
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

  // If no HTML files found, create a basic index.html
  if (htmlFiles.length === 0) {
    // Check for app entry point (app/page.tsx, app/page.jsx, app/page.js, etc.)
    const appDir = join(projectPath, 'app');
    const hasAppDir = existsSync(appDir);

    if (hasAppDir) {
      // Using modern app router structure
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>0x1 App</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="/app.js" type="module"></script>
</body>
</html>`;

      await Bun.write(join(outputPath, 'index.html'), indexHtml);
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

  // Main entry file - always required
  const mainEntryFile = findMainEntryFile(projectPath);
  if (mainEntryFile) {
    await processJSBundle(mainEntryFile, projectPath, { minify });

    // Ensure the temp index.js file is correctly moved to index.js
    const tempIndexPath = join(outputPath, '.temp-index.js');
    const finalIndexPath = join(outputPath, 'index.js');

    // Check if temp file exists but final doesn't
    if (existsSync(tempIndexPath)) {
      try {
        // Read the content from temp file
        const content = await Bun.file(tempIndexPath).text();
        // Write to the final destination
        await Bun.write(finalIndexPath, content);
        logger.debug('Successfully created index.js from .temp-index.js');
      } catch (error) {
        logger.error(`Failed to copy .temp-index.js to index.js: ${error}`);
      }
    }
  } else {
    logger.warn('No main entry file found (index.tsx/ts/jsx/js). Project may not work correctly.');
  }

  // Helper function to find main entry file
  function findMainEntryFile(dir: string): string | null {
    const entryFileNames = ['index.js', 'index.ts', 'index.tsx', 'index.jsx', 'app.js', 'app.ts', 'app.tsx', 'app.jsx'];

    for (const fileName of entryFileNames) {
      const entryPath = join(dir, fileName);
      if (existsSync(entryPath)) {
        return entryPath;
      }
    }

    return null;
  }

  // Modern app router structure component discovery
  // Find all page, layout, special component files, and regular components
  async function findAppComponents(dir: string): Promise<string[]> {
    const components: string[] = [];
    // Also include normal components from root-level components directory
    const projectRoot = dir.includes('/app') ? dir.split('/app')[0] : dir;
    const rootComponentsDir = join(projectRoot, 'components');

    // Process the app directory for page components
    if (existsSync(dir)) {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const path = join(dir, entry.name);

        // Skip ignored directories
        if (entry.isDirectory() && !ignorePatterns.includes(entry.name)) {
          // Recursively search subdirectories
          const subComponents = await findAppComponents(path);
          components.push(...subComponents);
        } else if (entry.isFile()) {
          // Check for special app router components
          for (const ext of fileExtensions) {
            // Support for all app router special files
            if (entry.name === `page${ext}` ||
                entry.name === `layout${ext}` ||
                entry.name === `loading${ext}` ||
                entry.name === `error${ext}` ||
                entry.name === `not-found${ext}`) {
              components.push(path);
              break;
            }
          }
        }
      }
    }

    // Add components from the root components directory
    if (existsSync(rootComponentsDir)) {
      const componentEntries = await readdir(rootComponentsDir, { withFileTypes: true });

      for (const entry of componentEntries) {
        const path = join(rootComponentsDir, entry.name);

        if (entry.isDirectory() && !ignorePatterns.includes(entry.name)) {
          // Recursively search subdirectories of components
          const subComponents = await findAppComponents(path);
          components.push(...subComponents);
        } else if (entry.isFile()) {
          // Add component files
          for (const ext of fileExtensions) {
            if (entry.name.endsWith(ext)) {
              components.push(path);
              break;
            }
          }
        }
      }
    }

    return components;
  }

  // App directory processing - modern app router structure is required
  const appDir = join(projectPath, 'app');
  if (!existsSync(appDir)) {
    logger.warn('No app directory found. App router structure is required for 0x1 framework.');
    logger.info('Create an app directory with page.tsx and other components.');
  } else {
    // Find and process app router components
    const appComponents = await findAppComponents(appDir);

    if (appComponents.length === 0) {
      logger.warn('No app router components found in app directory.');
      logger.info('Create page.tsx, layout.tsx, and other components in the app directory.');
    } else {
      logger.info(`Found ${appComponents.length} app router components.`);

      // Process each app router component
      for (const component of appComponents) {
        await processJSBundle(component, projectPath, { minify });
      }

      // Generate component registry for autoDiscovery
      logger.info('Generating component registry for auto-discovery...');

      // Create a component registry map for runtime auto-discovery
      const componentsMapPath = join(outputPath, 'components-map.js');
      let componentsMapCode = '// Auto-generated component registry for 0x1 router\n';
      componentsMapCode += '// This file is auto-generated by the build process\n\n';
      componentsMapCode += 'window.__0x1_components = {\n';

      for (const component of appComponents) {
        // Get the relative path from project root to the component
        const relativePath = relative(projectPath, component);

        // Create the component key - remove file extension and map to router path
        const componentKey = relativePath
          .replace(/\.\w+$/, '') // Remove extension
          .replace(/\\/g, '/'); // Normalize path separators for Windows

        // Import path relative to the output directory
        const importPath = `./${relativePath.replace(/\.\w+$/, '')}`;
        componentsMapCode += `  '${componentKey}': () => import('${importPath}'),\n`;
      }

      // Close the components map object
      componentsMapCode += `};\n`;

      // Write the component registry file
      await Bun.write(componentsMapPath, componentsMapCode);
      logger.info(`Component registry written to ${componentsMapPath}`);
    }
  }

  // Add a client-side entry point if using app directory
  if (existsSync(join(projectPath, 'app'))) {
    const clientEntry = "// Auto-generated client entry point\ndocument.addEventListener('DOMContentLoaded', () => {\n  // Import all pages components\n  const appRoot = document.getElementById('app');\n  if (appRoot) {\n    // In a real implementation, this would use client-side routing\n    console.log('0x1 App Started');\n  }\n});";

    await Bun.write(join(outputPath, 'app.js'), clientEntry);
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

// Import JSX runtime components
import { jsx, jsxs, Fragment, createElement } from '/0x1/jsx-runtime';

// Import router components
import { Router, Link, RouterNavLink, RouterRedirect } from '/0x1/router';

// Export version
export const version = '0.1.0';

// Export all components and utilities
// Use consistent naming with renamed exports to avoid collisions
export {
  // JSX Runtime exports
  jsx,
  jsxs,
  Fragment,
  createElement,
  
  // Router exports
  Router,
  Link, 
  RouterNavLink as NavLink,
  RouterRedirect as Redirect
};

// Default export for easy access to all components
export default {
  // JSX Runtime
  jsx,
  jsxs,
  Fragment,
  createElement,
  
  // Router components
  Router,
  Link,
  NavLink: RouterNavLink,
  Redirect: RouterRedirect,
  
  // Version
  version
};`;

      await Bun.write(join(framework0x1Dir, 'index.js'), indexJsContent);
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
          const jsxRuntimeImport = `// Add JSX runtime imports\nimport { createElement, Fragment, jsx, jsxs, jsxDEV } from '/0x1/jsx-runtime.js';\n\n`;

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

    // Create JSX runtime support files for the build
    const jsxRuntimeDir = join(dirname(outputFile), '0x1');
    await mkdir(jsxRuntimeDir, { recursive: true });

    // Write JSX runtime shim that re-exports from the framework
    const jsxRuntimePath = join(jsxRuntimeDir, 'jsx-runtime.js');
    const jsxRuntimeContent = `// 0x1 Framework - JSX Runtime shim
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
  options: { minify: boolean, ignorePatterns?: string[] }
): Promise<void> {
  const { minify, ignorePatterns = ['node_modules', '.git', 'dist'] } = options;

  // Get all css files
  const cssFiles = await findFiles(projectPath, '.css', ignorePatterns);

  // Check for tailwind config files
  const hasTailwind = existsSync(join(projectPath, 'tailwind.config.js')) ||
    existsSync(join(projectPath, 'tailwind.config.ts'));

  // Process Tailwind CSS if available
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
