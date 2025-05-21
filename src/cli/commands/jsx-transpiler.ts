/**
 * JSX Transpiler - Uses Bun build command to transform JSX code
 */
import Bun from 'bun';
import * as fs from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import { logger } from '../utils/logger';
// Use Bun's native APIs instead of Node.js ones

/**
 * Process import statements in source code to handle JSX imports
 */
async function processImports(sourceCode: string, fileName: string = ''): Promise<string> {
  // Handle import statements for JSX
  let processedSource = sourceCode;
  const isLayout = fileName.includes('layout');

  // First check if the file contains CSS Tailwind directives
  const hasTailwind = processedSource.includes('@tailwind');
  
  if (hasTailwind) {
    // Fully extract any CSS-related content into special script blocks
    // This ensures they're completely ignored during JSX processing
    
    // Start by handling @tailwind directives - wrap them completely in special block comments
    processedSource = processedSource.replace(
      /(@tailwind[\s\w:;]+)/g,
      "/*! TAILWIND_DIRECTIVE \n$1\n*/"
    );
    
    // Handle any @import directives for CSS
    processedSource = processedSource.replace(
      /(@import[^;]+;)/g,
      "/*! CSS_IMPORT \n$1\n*/"
    );
    
    // Handle any other CSS @ rules that might cause parser issues
    processedSource = processedSource.replace(
      /(@layer[^{]*{[^}]*})/g,
      "/*! CSS_LAYER \n$1\n*/"
    );
    
    // Handle any @apply directives
    processedSource = processedSource.replace(
      /(@apply[^;]*;)/g,
      "/*! CSS_APPLY \n$1\n*/"
    );
    
    // Add a note that all CSS was extracted
    logger.debug("Extracted CSS directives from file to prevent JSX parsing issues");
  }

  // Replace React imports with our custom JSX runtime
  processedSource = processedSource.replace(
    /import React(, { .+? })? from ["'](react|0x1)["'];?/g,
    "// React import handled by transpiler"
  );

  // Replace direct imports of createElement and Fragment
  processedSource = processedSource.replace(
    /import { (createElement|Fragment|jsx|jsxs|jsxDEV)(?:, )?(.+?)?} from ["'](react|0x1)["'];?/g,
    (match, imp1, imp2, source) => {
      // Keep other imports if there were any
      if (
        imp2 &&
        imp2.trim() &&
        !imp2.includes("createElement") &&
        !imp2.includes("Fragment")
      ) {
        return `import { ${imp2.trim()} } from "${source}";`;
      }
      return "// JSX imports handled by transpiler";
    }
  );
  
  // Handle imports from react JSX runtime modules that Bun tries to resolve
  processedSource = processedSource.replace(
    /import .+ from ["'](react\/jsx-(?:dev-)?runtime)["'];?/g,
    "// JSX runtime imports handled by transpiler"
  );
  
  // Special handling for layout components - they often need more comprehensive JSX runtime support
  if (isLayout) {
    logger.debug(`Enhanced JSX runtime imports for layout component: ${fileName}`);
    // Make sure we explicitly force all required imports for layouts
    processedSource = `// Auto-injected JSX runtime imports for layout component
import { jsx, jsxs, Fragment } from "0x1/jsx-runtime.js";
// Import createElement directly to ensure it's available
import { createElement } from "0x1/jsx-runtime.js";
// Add React-compatible aliases for JSX transformations
const React = { createElement, Fragment };
// Ensure Link component is properly handled (required for navigation)
import { Link } from "0x1";

${processedSource}`;
  } else {
    // Add standard JSX runtime imports for all other component types
    processedSource = `// Auto-injected JSX runtime imports
import { jsx, jsxs, Fragment, createElement } from "0x1/jsx-runtime.js";

${processedSource}`;
  }

  return processedSource;
}

/**
 * Handle transpilation of a JSX file
 * @param entryFile - Path to the source JSX/TSX file
 * @param outputDir - Directory where the output should be placed
 * @param minify - Whether to minify the code
 * @param projectRoot - Root directory of the project (for relative paths)
 * @returns Promise<boolean> - Success status
 */
export async function transpileJSX(
  entryFile: string,
  outputDir: string,
  minify = false,
  projectRoot?: string
): Promise<boolean> {
  try {
    // Read the source file
    const fileBasename = basename(entryFile);
    const isLayout = fileBasename.includes('layout');
    
    if (isLayout) {
      logger.info(`Transpiling Layout JSX: ${fileBasename} (special handling)`);
    } else {
      logger.info(`Transpiling JSX: ${fileBasename}`);
    }
    
    const sourceCode = await Bun.file(entryFile).text();

    // Calculate output file path with truly unique naming to avoid conflicts
    const fileName = basename(entryFile);
    const componentName = fileName.replace(/\.(jsx|tsx)$/, '');
    
    // Create a component-specific subdirectory to guarantee no path collisions
    const safeComponentDir = join(outputDir, componentName);
    if (!existsSync(safeComponentDir)) {
      mkdirSync(safeComponentDir, { recursive: true });
    }

    // Use a very simple output file name within the component's own directory 
    // No need for complex randomization since each component has its own directory
    const outputFile = join(safeComponentDir, 'index.js');
    
    // Log the path for debugging
    logger.debug(`Using component directory for output: ${outputFile}`);

    // We'll use project root or file directory for context
    const _projectPath = projectRoot || dirname(entryFile);

    // Process imports to add our JSX runtime imports
    const processedSource = await processImports(sourceCode, fileName);
    
    // Create a temporary file for processing with enhanced runtime for layouts
    const tempDir = dirname(entryFile);
    const tempFile = join(tempDir, `.__temp_${Math.random().toString(36).slice(2)}_${fileName}`);
    await Bun.write(tempFile, processedSource);

    try {
      // Use Bun.build directly rather than spawning a process for better reliability
      // This is a cleaner approach with no process spawning or string parsing required
      logger.info(`Transpiling JSX with Bun.build API directly`); 
      
      // Variables for error handling and output capture
      let exitCode = 0;
      let stdout = '';
      let stderr = '';
      
      try {
        // First try to use Bun.build API directly which is faster
        try {
          logger.debug('Using Bun.build API directly');
          
          // Enhanced build options with better Next.js compatibility
          const buildOptions: any = {
            entrypoints: [tempFile],
            outdir: dirname(outputFile),
            naming: {
              entry: '[dir]/[name].js'
            },
            minify: minify,
            sourcemap: 'none',
            external: ['*.css', '*.scss', 'tailwind*', '@tailwind*'],
            // Improved JSX configuration for better layout component compatibility
            jsx: 'automatic', // Use automatic JSX runtime like Next.js
            jsxImportSource: '0x1', // Use our framework's JSX runtime
            jsxFactory: 'jsx',  // Default JSX factory
            jsxFragment: 'Fragment', // Fragment implementation
            // Add better logging and environment variables
            logLevel: 'debug', // More verbose logging for easier debugging
            define: {
              'process.env.NODE_ENV': JSON.stringify('production'),
              'process.env.__0X1_BUILD': 'true'
            },
            target: 'browser'
          };
          
          // Enhanced loader configuration for all component types
          buildOptions.loader = { 
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.jsx': 'jsx',
            '.js': 'js' 
          };
          
          // Special handling for layout files to ensure proper transpilation
          if (tempFile.includes('layout.tsx') || tempFile.includes('layout.jsx')) {
            logger.debug('Enhanced transpilation for layout component');
            
            // Read the original file first
            const fileContent = await Bun.file(tempFile).text();
            
            // Check for existing JSX runtime imports
            const hasExistingJsxRuntime = fileContent.includes('0x1/jsx-runtime');
            
            // For layouts, create an optimized standalone build configuration
            // that doesn't depend on external resolution
            // Use the same outdir from buildOptions
            const layoutSpecificOptions = {
              entrypoints: [tempFile],
              outdir: buildOptions.outdir,
              minify: minify,
              target: 'browser' as const,
              format: 'esm' as const,
              sourcemap: 'external' as const,
              define: {
                'process.env.__0X1_LAYOUT': 'true',
                'process.env.RUNTIME_MODE': '"development"',
                'process.env.NODE_ENV': minify ? '"production"' : '"development"'
              },
              // Critical: Force automatic JSX with our runtime
              jsx: 'automatic',
              jsxImportSource: '0x1',
              jsxFactory: 'jsx',
              jsxFragment: 'Fragment',
              // Enhanced loader configuration
              loader: { 
                '.tsx': 'tsx' as const,
                '.ts': 'ts' as const,
                '.jsx': 'jsx' as const,
                '.js': 'js' as const 
              },
              // Use an external plugin that directly provides the JSX runtime
              plugins: [
                {
                  name: 'direct-jsx-runtime-provider',
                  setup(build: any) {
                    // Intercept JSX runtime imports and provide virtual module
                    build.onResolve({ filter: /jsx-runtime/ }, () => {
                      return { path: 'jsx-runtime-virtual', namespace: 'jsx-runtime-ns' };
                    });
                    
                    // When the virtual module is loaded, provide the JSX runtime code directly
                    build.onLoad({ filter: /jsx-runtime-virtual/, namespace: 'jsx-runtime-ns' }, () => {
                      return {
                        contents: `
                          // Direct JSX runtime implementation
                          export function jsx(type, props) {
                            const element = typeof type === 'function' 
                              ? type(props || {}) 
                              : document.createElement(type);
                            
                            if (!element) return document.createDocumentFragment();
                            
                            if (props) {
                              Object.entries(props).forEach(([key, value]) => {
                                if (key === 'children') return;
                                if (key === 'className') { element.className = value; return; }
                                if (key === 'style' && typeof value === 'object') {
                                  Object.entries(value).forEach(([styleKey, styleValue]) => {
                                    element.style[styleKey] = styleValue;
                                  });
                                  return;
                                }
                                // Handle event handlers
                                if (key.startsWith('on') && typeof value === 'function') {
                                  const eventName = key.slice(2).toLowerCase();
                                  element.addEventListener(eventName, value);
                                  return;
                                }
                                // Set attribute
                                element.setAttribute(key, value);
                              });
                              
                              // Handle children
                              if (props.children) {
                                const appendChildren = (children) => {
                                  if (Array.isArray(children)) {
                                    children.forEach(child => appendChildren(child));
                                  } else if (children !== null && children !== undefined) {
                                    element.append(
                                      children instanceof Node ? children : document.createTextNode(String(children))
                                    );
                                  }
                                };
                                appendChildren(props.children);
                              }
                            }
                            return element;
                          }
                          
                          // Alias jsxs to jsx for fragment handling
                          export const jsxs = jsx;
                          
                          // Fragment support
                          export const Fragment = (props) => {
                            const fragment = document.createDocumentFragment();
                            if (props && props.children) {
                              const appendChildren = (children) => {
                                if (Array.isArray(children)) {
                                  children.forEach(child => appendChildren(child));
                                } else if (children !== null && children !== undefined) {
                                  fragment.append(
                                    children instanceof Node ? children : document.createTextNode(String(children))
                                  );
                                }
                              };
                              appendChildren(props.children);
                            }
                            return fragment;
                          };
                          
                          // Add createElement for compatibility
                          export const createElement = jsx;
                        `,
                        loader: 'js',
                      };
                    });
                  }
                }
              ]
            };
            
            logger.debug(`Configured optimized build for layout component`);
            
            try {
              // Use the enhanced layout-specific options for transpilation
              const layoutResult = await Bun.build(layoutSpecificOptions);
              
              if (!layoutResult.success) {
                throw new Error(`Layout build failed: ${layoutResult.logs?.join('\n') || 'Unknown error'}`);
              }
              
              logger.debug('Layout JSX transpilation completed successfully');
              // Return early - we've already built the file
              return true;
            } catch (layoutErr) {
              logger.error(`Layout transpilation error: ${layoutErr}`);
              logger.error('Falling back to standard build process');
              // Continue with standard build process
            }
          }
          
          // Special handling for page components too, as they need similar JSX runtime handling
          if (tempFile.includes('page.tsx') || tempFile.includes('page.jsx')) {
            logger.debug('Enhanced transpilation for page component');
            
            // Read the original file first
            const fileContent = await Bun.file(tempFile).text();
            
            // Use the same comprehensive approach for page components
            const pageSpecificOptions = {
              entrypoints: [tempFile],
              outdir: buildOptions.outdir,
              minify: minify,
              target: 'browser' as const,
              format: 'esm' as const,
              sourcemap: 'external' as const,
              define: {
                'process.env.RUNTIME_MODE': '"development"',
                'process.env.NODE_ENV': minify ? '"production"' : '"development"'
              },
              // Critical: Force automatic JSX with our runtime
              jsx: 'automatic',
              jsxImportSource: '0x1',
              jsxFactory: 'jsx',
              jsxFragment: 'Fragment',
              // Enhanced loader configuration
              loader: { 
                '.tsx': 'tsx' as const,
                '.ts': 'ts' as const,
                '.jsx': 'jsx' as const,
                '.js': 'js' as const 
              },
              // Use the same virtual JSX runtime approach
              plugins: [
                {
                  name: 'direct-jsx-runtime-provider',
                  setup(build: any) {
                    // Intercept JSX runtime imports and provide virtual module
                    build.onResolve({ filter: /jsx-runtime/ }, () => {
                      return { path: 'jsx-runtime-virtual', namespace: 'jsx-runtime-ns' };
                    });
                    
                    // When the virtual module is loaded, provide the JSX runtime code directly
                    build.onLoad({ filter: /jsx-runtime-virtual/, namespace: 'jsx-runtime-ns' }, () => {
                      return {
                        contents: `
                          // Direct JSX runtime implementation
                          export function jsx(type, props) {
                            const element = typeof type === 'function' 
                              ? type(props || {}) 
                              : document.createElement(type);
                            
                            if (!element) return document.createDocumentFragment();
                            
                            if (props) {
                              Object.entries(props).forEach(([key, value]) => {
                                if (key === 'children') return;
                                if (key === 'className') { element.className = value; return; }
                                if (key === 'style' && typeof value === 'object') {
                                  Object.entries(value).forEach(([styleKey, styleValue]) => {
                                    element.style[styleKey] = styleValue;
                                  });
                                  return;
                                }
                                // Handle event handlers
                                if (key.startsWith('on') && typeof value === 'function') {
                                  const eventName = key.slice(2).toLowerCase();
                                  element.addEventListener(eventName, value);
                                  return;
                                }
                                // Set attribute
                                element.setAttribute(key, value);
                              });
                              
                              // Handle children
                              if (props.children) {
                                const appendChildren = (children) => {
                                  if (Array.isArray(children)) {
                                    children.forEach(child => appendChildren(child));
                                  } else if (children !== null && children !== undefined) {
                                    element.append(
                                      children instanceof Node ? children : document.createTextNode(String(children))
                                    );
                                  }
                                };
                                appendChildren(props.children);
                              }
                            }
                            return element;
                          }
                          
                          // Alias jsxs to jsx for fragment handling
                          export const jsxs = jsx;
                          
                          // Fragment support
                          export const Fragment = (props) => {
                            const fragment = document.createDocumentFragment();
                            if (props && props.children) {
                              const appendChildren = (children) => {
                                if (Array.isArray(children)) {
                                  children.forEach(child => appendChildren(child));
                                } else if (children !== null && children !== undefined) {
                                  fragment.append(
                                    children instanceof Node ? children : document.createTextNode(String(children))
                                  );
                                }
                              };
                              appendChildren(props.children);
                            }
                            return fragment;
                          };
                          
                          // Add createElement for compatibility
                          export const createElement = jsx;
                        `,
                        loader: 'js',
                      };
                    });
                  }
                }
              ]
            };
            
            try {
              // Use the enhanced page-specific options for transpilation
              const pageResult = await Bun.build(pageSpecificOptions);
              
              if (!pageResult.success) {
                throw new Error(`Page build failed: ${pageResult.logs?.join('\n') || 'Unknown error'}`);
              }
              
              logger.debug('Page JSX transpilation completed successfully');
              // Return early - we've already built the file
              return true;
            } catch (pageErr) {
              logger.error(`Page transpilation error: ${pageErr}`);
              logger.error('Falling back to standard build process');
              // Continue with standard build process
            }
          }
          
          // Add better module resolution to match Next.js behavior
          buildOptions.resolve = {
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
          };
          
          // Run the build with configured options
          const result = await Bun.build(buildOptions);
          
          // Check if build succeeded
          if (!result.success) {
            throw new Error(`Bun build failed: ${result.logs?.join('\n') || 'Unknown error'}`);
          }
          
          // Successful build
          logger.debug('JSX transpilation completed with Bun.build API');
          return true;
        } catch (err) {
          logger.error(`Error in direct Bun.build: ${err}`);
          
          // Enhanced error reporting for layout components
          if (tempFile.includes('layout')) {
            logger.error('Layout component transpilation failed, checking for common issues:');
            // Check if jsx-runtime import is correct
            const fileContent = await Bun.file(tempFile).text();
            if (!fileContent.includes('import { jsx, Fragment } from')) {
              logger.error('- Layout might be missing proper JSX runtime imports');
            }
            if (fileContent.includes('React')) {
              logger.error('- Layout contains React import but should use 0x1 JSX runtime');
            }
          }
          
          // Fall back to command execution with enhanced configuration for layout components
          // Create a temporary config file for Bun build with all options
          const isLayout = tempFile.includes('layout');
          const configContent = JSON.stringify({
            entrypoints: [tempFile],
            outfile: outputFile,
            minify: minify,
            external: ['*.css', 'tailwind*', 'postcss*', '@tailwind*'],
            target: 'browser',
            jsx: 'automatic',
            jsxImportSource: '0x1',
            jsxFactory: isLayout ? 'jsx' : 'createElement',  // Use jsx for layouts
            jsxFragment: 'Fragment',
            define: {
              'process.env.NODE_ENV': JSON.stringify('production'),
              'process.env.__0X1_LAYOUT': isLayout ? 'true' : 'false'
            },
            loader: { 
              '.tsx': 'tsx',
              '.ts': 'ts',
              '.jsx': 'jsx',
              '.js': 'js' 
            }
          }, null, 2);
          
          // Write config to temp file
          const configPath = join(dirname(tempFile), '.bun-build-config.json');
          await Bun.write(configPath, configContent);
          
          // Use more stable command format
          const bunBuildProcess = Bun.spawn([
            'bun', 'build', tempFile,
            '--outfile', outputFile,
            '--config', configPath
          ], {
            cwd: dirname(tempFile),
            stdout: 'pipe',
            stderr: 'pipe'
          });
          
          // Wait for the process to complete and get output
          exitCode = await bunBuildProcess.exited;
          stdout = await new Response(bunBuildProcess.stdout).text();
          stderr = await new Response(bunBuildProcess.stderr).text();
          
          if (exitCode !== 0) {
            throw new Error(`Bun build failed with exit code ${exitCode}`);
          }
          
          logger.debug('JSX transpilation completed successfully with fallback method');
        }
      } catch (error: any) {
        // Handle any errors during the build process
        exitCode = error.code || error.status || 1;
        stderr = error.stderr || error.message || String(error);
      }
      if (exitCode !== 0) {
        // Save debug file for inspection
        const debugFile = join(
          dirname(entryFile),
          `.debug-${basename(entryFile)}`
        );
        await Bun.write(debugFile, processedSource);

        logger.error(`JSX transpilation failed for ${basename(entryFile)}:`);
        logger.error(`Command exit code: ${exitCode}`);
        logger.error(`Standard output:`);
        logger.error(stdout || "(none)");
        logger.error(`Error output:`);
        logger.error(stderr || "(none)");
        logger.error(`\nProcessed source saved to: ${debugFile}`);
        
        // Despite the error, if the output file exists, we might still be able to use it
        if (existsSync(outputFile)) {
          logger.warn(`Output file exists despite error, attempting to continue...`);
          return true;
        }

        throw new Error(
          `JSX transpilation failed for ${basename(entryFile)} - Check debug file for details`
        );
      }

      logger.info(`JSX transpilation successful for ${basename(entryFile)}`);
      return true;
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        /* ignore */
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }
}
