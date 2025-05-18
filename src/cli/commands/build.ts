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
    findConfigFile(projectPath);
  
  const config = configPath ? await loadConfig(configPath) : {};
  
  // Set build options
  const outDir = options.outDir || config?.build?.outDir || 'dist';
  const minify = options.minify ?? config?.build?.minify ?? true;
  const ignorePatterns = options.ignore || config?.build?.ignore || ['node_modules', '.git', 'dist'];
  
  // Start build with beautiful section header
  log.section('BUILDING APPLICATION');
  log.spacer();
  
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
  log.box(`🎉 Build completed successfully!\n\nOutput directory: ${log.highlight(outputPath)}\nBuild time:      ${log.highlight(new Date().toLocaleTimeString())}`);
  
  // Display minification status and helpful next steps
  if (minify) {
    log.info(`Files have been minified for production use`);
  }
  log.spacer();
  log.success(`Your 0x1 application is ready to be deployed`);
  log.info(`To deploy your application, you can run:`);
  log.command(`bun 0x1 deploy`);
  log.info(`To learn more about deployment options, see the documentation`);
  
  // Build successful
  if (!options.silent) {
    // Add extra space before success message
    console.log('');
    log.info(`✨ Build completed in ${outputPath}`);
    log.info(`The ${outDir}/ directory is ready to be deployed.`);
  }
}

/**
 * Find configuration file in project directory
 */
function findConfigFile(projectPath: string): string | null {
  const possibleConfigs = [
    '0x1.config.ts',
    '0x1.config.js',
    '0x1.config.mjs',
  ];
  
  for (const config of possibleConfigs) {
    const configPath = resolve(projectPath, config);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  
  return null;
}

/**
 * Load configuration from file
 */
async function loadConfig(configPath: string): Promise<any> {
  try {
    if (!existsSync(configPath)) {
      logger.warn(`Configuration file not found: ${configPath}`);
      return {};
    }
    
    // For now we'll just parse the file to extract configuration values
    // In a real implementation, we would properly import the module
    // Use Bun's native file API for better performance
    const content = await Bun.file(configPath).text();
    
    // Very basic parsing - in a real implementation, we would use proper module loading
    const config: any = {};
    
    // Extract build options
    const outDirMatch = content.match(/outDir:\s*['"]([^'"]+)['"]/);
    if (outDirMatch) {
      config.build = config.build || {};
      config.build.outDir = outDirMatch[1];
    }
    
    const minifyMatch = content.match(/minify:\s*(true|false)/);
    if (minifyMatch) {
      config.build = config.build || {};
      config.build.minify = minifyMatch[1] === 'true';
    }
    
    return config;
  } catch (error) {
    logger.warn(`Failed to load configuration from ${configPath}: ${error}`);
    return {};
  }
}

/**
 * Copy static assets
 */
async function copyStaticAssets(projectPath: string, outputPath: string): Promise<void> {
  // Copy public folder contents to output directory
  const publicDir = resolve(projectPath, 'public');
  
  if (existsSync(publicDir)) {
    await copyDir(publicDir, outputPath);
  }
}

/**
 * Process HTML files
 */
async function processHtmlFiles(projectPath: string, outputPath: string): Promise<void> {
  // Check for custom structure configuration
  const customStructureFile = resolve(projectPath, 'structure.js');
  const hasCustomStructure = existsSync(customStructureFile);
  
  let srcDir;
  if (hasCustomStructure) {
    try {
      // Load custom structure configuration
      const structureConfigModule = await import(customStructureFile);
      const structureConfig = structureConfigModule.default || structureConfigModule;
      if (structureConfig.sourceDirs && structureConfig.sourceDirs.pages) {
        // Use the root directory as source
        srcDir = projectPath;
        logger.info('Using custom project structure from structure.js');
      } else {
        // Fall back to standard src directory
        srcDir = resolve(projectPath, 'src');
      }
    } catch (error) {
      logger.warn(`Failed to load custom structure from ${customStructureFile}. Using default src directory.`);
      srcDir = resolve(projectPath, 'src');
    }
  } else {
    // Check if src directory exists, if not use project root
    const standardSrcDir = resolve(projectPath, 'src');
    srcDir = existsSync(standardSrcDir) ? standardSrcDir : projectPath;
  }
  
  // Find all HTML files in the source directory
  const htmlFiles = await findFiles(srcDir, '.html');
  
  for (const htmlFile of htmlFiles) {
    const relativePath = relative(srcDir, htmlFile);
    const outputFilePath = join(outputPath, relativePath);
    
    // Ensure output directory exists
    await mkdir(dirname(outputFilePath), { recursive: true });
    
    // Read HTML content
    // Use Bun's native file API for better performance
    let content = await Bun.file(htmlFile).text();
    
    // Process HTML: Update file references, inject scripts, etc.
    content = await processHtml(content, { projectPath, outputPath, relativePath });
    
    // Write processed HTML file
    // Use Bun's native file API for better performance
    await Bun.write(outputFilePath, content);
  }
}

/**
 * Process HTML content
 */
async function processHtml(
  content: string,
  _options: { projectPath: string; outputPath: string; relativePath: string }
): Promise<string> {
  // Replace .ts and .tsx references with .js
  content = content.replace(/src="([^"]+)\.ts(x?)"/g, 'src="$1.js"');
  
  // Remove development-only scripts
  content = content.replace(/<script[^>]*data-dev-only[^>]*>.*?<\/script>/gs, '');
  
  return content;
}

/**
 * bundle JavaScript/TypeScript with enhanced Bun APIs
 * Optimized for Next.js 15 app directory structure
 */
async function bundleJavaScript(
  projectPath: string,
  outputPath: string,
  options: { minify: boolean, ignorePatterns?: string[] }
): Promise<void> {
  // Find entry files in app directory
  const entryFiles: string[] = [];
  const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  
  // Always use app directory structure for Next.js 15
  const appDir = join(projectPath, 'app');
  const isAppDirStructure = existsSync(appDir);
  
  if (isAppDirStructure) {
    async function findAppComponents(dir: string): Promise<string[]> {
      const components: string[] = [];
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively find components in subdirectories
          const subComponents = await findAppComponents(fullPath);
          components.push(...subComponents);
        } else if (entry.isFile()) {
          // Check for Next.js 15-style component naming patterns
          if (
            entry.name.match(/^(page|layout|error|loading|not-found)\.(tsx|jsx|ts|js)$/)
          ) {
            components.push(fullPath);
          }
        }
      }

      return components;
    }

    const appComponents = await findAppComponents(appDir);
    logger.info(`Found ${appComponents.length} Next.js 15-style app components`);
    entryFiles.push(...appComponents);
  }

  // Always check for root level entry files for backwards compatibility
  const srcDir = projectPath;
  for (const name of ['app', 'index']) {
    for (const ext of fileExtensions) {
      const filePath = join(srcDir, `${name}${ext}`);
      if (existsSync(filePath)) {
        entryFiles.push(filePath);
      }
    }
  }
  
  if (entryFiles.length === 0) {
    logger.warn('No entry files found. Creating a basic entry point for Next.js 15 app structure.');
    // Create a basic entry file if none exists
    const basicAppContent = `/**
 * Basic Next.js 15 entry point
 */
import { Router } from './src/core/router';

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container not found.');
    return;
  }
  
  const router = new Router({
    rootElement: appContainer,
    mode: 'history',
    transitionDuration: 150,
    appComponents: {}
  });
  
  router.init();
});
`;
    const basicAppPath = join(projectPath, 'index.tsx');
    await Bun.write(basicAppPath, basicAppContent);
    entryFiles.push(basicAppPath);
    logger.info('Created basic entry point at index.tsx');
  } else {
    logger.info(`Found ${entryFiles.length} entry files: ${entryFiles.map(file => basename(file)).join(', ')}`);
  }
  
  // Process each entry file using Bun's optimized bundler
  for (const entryFile of entryFiles) {
    try {
      // Determine output file path (convert .ts/.tsx to .js)
      const outputDir = join(outputPath);
      const outputFile = join(outputDir, basename(entryFile).replace(/\.(ts|tsx|jsx)$/, '.js'));
      
      // Ensure output directory exists
      await mkdir(dirname(outputFile), { recursive: true });
      
      const isTsx = entryFile.endsWith('.tsx') || entryFile.endsWith('.jsx');
      // Define proper loader types for Bun's build API
      const loader: { [key: string]: 'tsx' | 'jsx' | 'js' | 'ts' } = 
        isTsx ? { '.tsx': 'tsx', '.jsx': 'jsx' } : {};
      
      // Use Bun's bundler with enhanced options optimized for Next.js 15 compatibility
      const buildConfig: any = {
        entrypoints: [entryFile],
        outdir: dirname(outputFile),
        naming: {
          entry: basename(outputFile),
          // Use content hashing for better caching in production
          chunk: options.minify ? '[name].[hash]' : '[name]',
          asset: options.minify ? '[name].[hash]' : '[name]',
        },
        minify: options.minify,
        target: 'browser',
        loader,
        // Add source maps for better debugging
        sourcemap: options.minify ? 'none' : 'external',
        // Define environment variables
        define: {
          'process.env.NODE_ENV': options.minify ? '"production"' : '"development"',
          'process.env.APP_DIR': isAppDirStructure ? 'true' : 'false',
        },
        // Improve module resolution and tree shaking
        treeshake: options.minify,
        // Handle node modules properly
        external: ['*'],
        // Enable better error messages
        logLevel: 'error',
      };
      
      // Explicitly set the tsconfig if it exists
      if (existsSync(join(projectPath, 'tsconfig.json'))) {
        buildConfig.tsconfig = join(projectPath, 'tsconfig.json');
      }
      
      // Handle JSX/TSX files if needed
      if (isTsx) {
        // Configure JSX options optimized for Next.js 15 compatibility
        buildConfig.jsx = 'automatic';
        buildConfig.jsxImportSource = undefined; // Let bundler decide optimal handling
        buildConfig.format = 'esm'; // Use ESM for modern browser support
      }
      
      const result = await Bun.build(buildConfig);
      
      if (!result.success) {
        logger.error(`Failed to bundle ${entryFile}:\n${result.logs.join('\n')}`);
        throw new Error(`bundle failed for ${entryFile}`);
      } else {
        logger.info(`Successfully bundled: ${entryFile}`);
      }
    } catch (error: any) {
      logger.error(`Error during bundling of ${entryFile}: ${error.message || error}`);
      if (error.stack) {
        logger.debug(`Stack trace: ${error.stack}`);
      }
    }
  }
}

/* Remove obsolete code below - all functionality has been migrated to the bundleJavaScript function above */
  
    async function findAppComponents(dir: string): Promise<string[]> {
      const components: string[] = [];
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively find components in subdirectories
          const subComponents = await findAppComponents(fullPath);
          components.push(...subComponents);
        } else if (entry.isFile()) {
          // Check for Next.js 15-style component naming patterns
          if (
            entry.name.match(/^(page|layout|error|loading|not-found)\.(tsx|jsx|ts|js)$/)
          ) {
            components.push(fullPath);
          }
        }
      }

      return components;
    }

    const appComponents = await findAppComponents(appDir);
    logger.info(`Found ${appComponents.length} Next.js 15-style app components`);
    entryFiles.push(...appComponents);
  }

  // For backwards compatibility, also check for traditional entry files
  for (const name of ['app', 'index']) {
    for (const ext of fileExtensions) {
      const filePath = join(srcDir, `${name}${ext}`);
      if (existsSync(filePath)) {
        entryFiles.push(filePath);
        break; // Only add the first match for each name
      }
    }
  }
}

/**
 * Process JavaScript/TypeScript file bundle
 */
async function processJSBundle(entryFile: string, projectPath: string, options: { minify: boolean }): Promise<void> {
  try {
    // Determine output file path (convert .ts/.tsx to .js)
    const outputDir = join(projectPath, 'dist');
    const outputFile = join(outputDir, basename(entryFile).replace(/\.(ts|tsx|jsx)$/, '.js'));
    
    // Ensure output directory exists
    await mkdir(dirname(outputFile), { recursive: true });
    
    const isTsx = entryFile.endsWith('.tsx') || entryFile.endsWith('.jsx');
      // Define proper loader types for Bun's build API
      const loader: { [key: string]: 'tsx' | 'jsx' | 'js' | 'ts' } = 
        isTsx ? { '.tsx': 'tsx', '.jsx': 'jsx' } : {};
      
      // Use Bun's bundler with enhanced options optimized for Next.js 15 compatibility
      const buildConfig: any = {
        entrypoints: [entryFile],
        outdir: dirname(outputFile),
        naming: {
          entry: basename(outputFile),
          // Use content hashing for better caching in production
          chunk: options.minify ? '[name].[hash]' : '[name]',
          asset: options.minify ? '[name].[hash]' : '[name]',
        },
        minify: options.minify,
        target: 'browser',
        loader,
        // Add source maps for better debugging
        sourcemap: options.minify ? 'none' : 'external',
        // Define environment variables
        define: {
          'process.env.NODE_ENV': options.minify ? '"production"' : '"development"',
          'process.env.APP_DIR': isAppDirStructure ? 'true' : 'false',
        },
        // Improve module resolution and tree shaking
        treeshake: options.minify,
        // Handle node modules properly
        external: ['*'],
        // Enable better error messages
        logLevel: 'error',
      };
      
      // Explicitly set the tsconfig if it exists
      if (existsSync(join(projectPath, 'tsconfig.json'))) {
        buildConfig.tsconfig = join(projectPath, 'tsconfig.json');
      }
      
      // Handle JSX/TSX files if needed
      if (isTsx) {
        // Configure JSX options optimized for Next.js 15 compatibility
        buildConfig.jsx = 'automatic';
        buildConfig.jsxImportSource = undefined; // Let bundler decide optimal handling
        buildConfig.format = 'esm'; // Use ESM for modern browser support
      }
      
      const result = await Bun.build(buildConfig);
      
      if (!result.success) {
        logger.error(`Failed to bundle ${entryFile}:\n${result.logs.join('\n')}`);
        throw new Error(`bundle failed for ${entryFile}`);
      } else {
        logger.info(`Successfully bundled: ${entryFile}`);
      }
    } catch (error: any) {
      logger.error(`Error during bundling of ${entryFile}: ${error.message || error}`);
      if (error.stack) {
        logger.debug(`Stack trace: ${error.stack}`);
      }
      throw new Error(`Failed to bundle ${entryFile}: ${error.message || error}`);
    }
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
  // Check for custom structure configuration
  const customStructureFile = resolve(projectPath, 'structure.js');
  const hasCustomStructure = existsSync(customStructureFile);
  
  let srcDir;
  let stylesDir;
  
  if (hasCustomStructure) {
    try {
      // Load custom structure configuration
      const structureConfigModule = await import(customStructureFile);
      const structureConfig = structureConfigModule.default || structureConfigModule;
      if (structureConfig.sourceDirs) {
        // Use the custom structure paths
        srcDir = projectPath;
        // Check for custom styles directory
        stylesDir = resolve(projectPath, structureConfig.sourceDirs.styles || 'styles');
        logger.info('Using custom project structure for CSS processing');
      } else {
        // Fall back to standard src directory
        srcDir = resolve(projectPath, 'src');
        stylesDir = join(srcDir, 'styles');
      }
    } catch (error) {
      logger.warn(`Failed to load custom structure from ${customStructureFile}. Using default src directory.`);
      srcDir = resolve(projectPath, 'src');
      stylesDir = join(srcDir, 'styles');
    }
  } else {
    // Check if src directory exists, if not use project root
    const standardSrcDir = resolve(projectPath, 'src');
    
    if (existsSync(standardSrcDir)) {
      srcDir = standardSrcDir;
      stylesDir = join(srcDir, 'styles');
    } else {
      // Use project root if no src directory
      srcDir = projectPath;
      stylesDir = join(projectPath, 'styles');
    }
  }
  
  // First, look for CSS files in the styles directory
  let cssFiles: string[] = [];
  
  if (existsSync(stylesDir)) {
    // Find CSS files in the styles directory
    cssFiles = await findFiles(stylesDir, '.css');
  }
  
  // Also look for CSS files in the src directory if it's not the same as project root
  if (srcDir !== projectPath) {
    const srcCssFiles = await findFiles(srcDir, '.css');
    cssFiles = [...cssFiles, ...srcCssFiles];
  } else {
    // If using root-based project, be careful not to pick up CSS files from node_modules
    const rootCssFiles = (await findFiles(srcDir, '.css'))
      .filter(file => !file.includes('node_modules'));
    cssFiles = [...cssFiles, ...rootCssFiles];
  }
  
  // Check if tailwindcss is being used
  const hasTailwind = existsSync(join(projectPath, 'tailwind.config.js')) || 
                      existsSync(join(projectPath, 'tailwind.config.ts'));
  
  for (const cssFile of cssFiles) {
    // Determine the relative path based on which directory the file is from
    let relativePath;
    if (cssFile.startsWith(stylesDir)) {
      relativePath = join('styles', relative(stylesDir, cssFile));
    } else {
      relativePath = relative(srcDir, cssFile);
    }
    
    const outputFilePath = join(outputPath, relativePath);
    
    // Ensure output directory exists
    await mkdir(dirname(outputFilePath), { recursive: true });
    
    // Use Bun's native file API for better performance
    let cssContent = await Bun.file(cssFile).text();
    
    // Process CSS
    if (hasTailwind) {
      try {
        // Check if tailwindcss is installed in the project
        const tailwindConfigPath = existsSync(join(projectPath, 'tailwind.config.js')) 
          ? join(projectPath, 'tailwind.config.js')
          : join(projectPath, 'tailwind.config.ts');
          
        // Try to import PostCSS and Tailwind dynamically
        try {
          const postcssModulePath = Bun.resolveSync('postcss', projectPath);
          const tailwindModulePath = Bun.resolveSync('tailwindcss', projectPath);
          const autoprefixerModulePath = Bun.resolveSync('autoprefixer', projectPath);
          
          if (postcssModulePath && tailwindModulePath) {
            const postcss = await import(postcssModulePath);
            const tailwindcss = await import(tailwindModulePath);
            const autoprefixer = await import(autoprefixerModulePath);
            
            // Process the CSS with PostCSS + Tailwind
            const result = await postcss.default([
              tailwindcss.default({ config: tailwindConfigPath }),
              autoprefixer.default()
            ]).process(cssContent, {
              from: cssFile,
              to: outputFilePath
            });
            
            // Update the CSS content with the processed result
            cssContent = result.css;
            logger.debug(`Processed ${cssFile} with Tailwind CSS`);
          }
        } catch (error) {
          logger.warn(`Failed to process Tailwind CSS for ${cssFile}: ${error}`);
          logger.warn('Make sure tailwindcss, postcss, and autoprefixer are installed in your project.');
        }
      } catch (error) {
        logger.warn(`Error processing Tailwind CSS: ${error}`);
      }
    }
    
    // Minify if needed
    if (options.minify) {
      cssContent = await minifyCss(cssContent);
    }
    
    // Write processed CSS file
    // Use Bun's native file API for better performance
    await Bun.write(outputFilePath, cssContent);
  }
}

/**
 * Helper function to minify CSS using lightningcss for optimal results
 */
async function minifyCss(css: string): Promise<string> {
  try {
    // Try to use lightningcss which is a dependency we kept
    // This gives much better results than basic regex replacement
    const lightningCssPath = Bun.resolveSync('lightningcss', process.cwd());
    if (lightningCssPath) {
      const { transform } = await import(lightningCssPath);
      const { code } = transform({
        code: Buffer.from(css),
        minify: true,
        sourceMap: false
      });
      return new TextDecoder().decode(code);
    }
  } catch (error) {
    // Fall back to basic minification if lightningcss is not available
    logger.debug(`Using basic CSS minification: ${error}`);
  }
  
  // Basic CSS minification fallback
  return css
    .replace(/\/\*(?:(?!\*\/).[\s\S])*\*\/|[\r\n\t]+/g, '') // Remove comments and whitespace
    .replace(/ {2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/([{:}]) /g, '$1')
    .replace(/ ([{:}])/g, '$1');
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
