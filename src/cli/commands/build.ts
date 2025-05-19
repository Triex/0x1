/**
 * 0x1 CLI - Build Command
 * Builds the application for production
 */

import { existsSync } from 'fs';
import { mkdir, readdir } from 'fs/promises'; // For directory operations
// We'll use Bun.file() instead of readFile/writeFile for better performance
import { dirname, join, relative, resolve } from 'path';
import { logger } from '../utils/logger.js';

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
    await processCssFiles(projectPath, outputPath, { minify, ignorePatterns });
    cssSpin.stop('success', 'CSS styles: processed and optimized');
  } catch (error) {
    // CSS processing is optional, so just show a warning
    cssSpin.stop('warn', 'CSS processing skipped (not configured)');
    log.warn(`CSS processing error: ${error}`);
  }
  
  // Output build info with beautiful formatting
  log.spacer();
  log.box('Build Complete');
  log.info('📦 Output directory: ' + log.highlight(outputPath));
  log.info('🔧 Minification: ' + (minify ? log.highlight('enabled') : 'disabled'));
  
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
  // Find all page, layout, and special component files
  async function findAppComponents(dir: string): Promise<string[]> {
    const components: string[] = [];
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
      let componentsMapCode = `// Auto-generated component registry for 0x1 router\n`;
      componentsMapCode += `// This file is auto-generated by the build process\n\n`;
      componentsMapCode += `window.__0x1_components = {\n`;
      
      for (const component of appComponents) {
        // Get the relative path from project root to the component
        const relativePath = relative(projectPath, component);
        
        // Create the component key - remove file extension and map to router path
        const componentKey = relativePath
          .replace(/\.\w+$/, '') // Remove extension
          .replace(/\\+/g, '/'); // Normalize path separators for Windows
          
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
async function processJSBundle(entryFile: string, projectPath: string, options: { minify: boolean }): Promise<void> {
  const { minify } = options;
  
  // Check if this is a TypeScript file
  const isTsx = entryFile.endsWith('.tsx') || entryFile.endsWith('.ts');
  
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

    // Configure Bun's bundler
    const loader: { [key: string]: 'tsx' | 'jsx' | 'js' | 'ts' } =
      isTsx ? { '.tsx': 'tsx', '.jsx': 'jsx' } : {};

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
      await mkdir(framework0x1Dir, { recursive: true });

      // Create browser-compatible index module for non-router imports
      const indexContent = `
        // 0x1 Framework - Browser Compatible Version
        export * from '../node_modules/0x1/dist/index.js';
        import * as Core from '../node_modules/0x1/dist/index.js';
        export default Core;
      `;
      await Bun.write(join(framework0x1Dir, 'index.js'), indexContent);

      // If we modified content for router imports, write it to a temporary file for bundling
      if (modifiedContent !== fileContent) {
        const tempFile = join(dirname(entryFile), `.temp-${basename(entryFile)}`);
        await Bun.write(tempFile, modifiedContent);
        // Use the temp file for bundling instead
        // Note: We need to pass this separately to Bun.build below
        // We don't actually modify entryFile directly as it could cause TypeScript errors
      }
    }

    // Create a temporary file path for modified content
    let actualEntryFile = entryFile;
    const tempFile = join(dirname(entryFile), `.temp-${basename(entryFile)}`);
    
    // If we modified the content, use the temp file for bundling
    if (modifiedContent !== fileContent) {
      await Bun.write(tempFile, modifiedContent);
      actualEntryFile = tempFile;
    }
    
    // Use Bun's built-in bundler
    const result = await Bun.build({
      entrypoints: [actualEntryFile],
      outdir: dirname(outputFile),
      target: 'browser',
      format: 'esm',
      splitting: true,
      naming: {
        entry: '[dir]/[name].[ext]',
        chunk: '[name]-[hash].[ext]',
        asset: 'assets/[name]-[hash].[ext]',
      },
      loader,
      plugins: [],
      // Apply minification based on options
      minify,
      // Add source maps for better debugging
      sourcemap: options.minify ? 'none' : 'external',
      // Define environment variables
      define: {
        'process.env.NODE_ENV': options.minify ? '"production"' : '"development"',
        'process.env.APP_DIR': existsSync(join(projectPath, 'app')) ? 'true' : 'false',
      },
      // Improve module resolution and tree shaking
      // treeshake: options.minify, // Removing unsupported property
      // Handle node modules properly
      external: ['*'],
      // Enable better error messages
      // logLevel: 'error', // Removing unsupported property
    });
    
    if (!result.success) {
      throw new Error(`Build failed with ${result.logs.length} errors`);
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
      // Effective CSS minification
      const minified = css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\n/g, '') // Remove newlines
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around symbols
        .replace(/;}/, '}') // Remove trailing semicolons
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

// This function has been removed as there's another more comprehensive implementation below

/**
 * Helper function to find files with specific extensions
 */
async function findFilesByExtension(dir: string, extensions: string[], ignorePatterns: string[] = ['node_modules', '.git', 'dist']): Promise<string[]> {
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
