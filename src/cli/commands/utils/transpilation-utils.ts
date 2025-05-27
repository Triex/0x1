/**
 * Transpilation Utilities for 0x1 Framework
 * Provides functions for handling JSX/TSX transpilation, file processing, and component discovery
 */

import { existsSync, readdirSync, statSync } from "fs";
import { basename, dirname, join, resolve } from 'path';
import { logger } from "../../utils/logger";

/**
 * Minify code string
 */
export function minifyCode(code: string): string {
  // Simple minification
  return code
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Replace whitespace sequences with a single space
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
    .trim();
}

/**
 * Transform bare imports to proper paths
 */
export function transformBareImports(content: string): string {
  // Replace bare imports with proper paths
  return content.replace(/from\s+['"]([^./][^'"]*)['"];?/g, (match, p1) => {
    // This is a simplistic approach, should be expanded for production
    return `from "/${p1}.js";`;
  });
}

/**
 * Process imports and prepare source code for JSX transpilation
 * Handles various component types with special treatment for layouts and pages
 */
export async function processImports(sourceCode: string, fileName: string = ''): Promise<string> {
  // Handle import statements for JSX
  let processedSource = sourceCode;
  const isLayout = fileName.includes('layout');
  const isPage = fileName.includes('page');
  const isNotFound = fileName.includes('not-found');
  const isErrorPage = fileName.includes('error');
  
  // Component type detection for better handling
  const isSpecialComponent = isLayout || isPage || isNotFound || isErrorPage;

  // First check if the file contains CSS Tailwind directives
  const hasTailwind = processedSource.includes('@tailwind');
  
  if (hasTailwind) {
    // For files with Tailwind, preserve the content but add a note about CSS processing
    processedSource = `// This file contains Tailwind CSS directives
// They will be processed by the Tailwind CLI separately
${processedSource}`;
  }

  // Check for existing React imports
  const hasReactImport = /import\s+(?:(?:\*\s+as\s+)?React|\{\s*([\w\s,]+)\s*\})\s+from\s+["'](react|0x1|next|preact)["'];?/g.test(processedSource);

  // Check for JSX runtime imports which might cause conflicts
  const jsxRuntimeImportRegex = /import\s+(?:\{\s*(?:jsx|jsxs|Fragment|createElement|jsxDEV)[\w\s,]*\}\s+)?from\s+["'](react\/jsx-runtime|0x1\/jsx-runtime)["'];?/g;
  const hasJsxRuntimeImport = jsxRuntimeImportRegex.test(processedSource);

  // Remove any direct JSX runtime imports to avoid conflicts
  if (hasJsxRuntimeImport) {
    processedSource = processedSource.replace(
      jsxRuntimeImportRegex,
      '// 0x1 Framework: JSX runtime automatically provided'
    );
  }

  // If the file already imports React, we'll modify it to use our version
  if (hasReactImport) {
    processedSource = processedSource.replace(
      /import\s+(?:(?:\*\s+as\s+)?React|\{\s*([\w\s,]+)\s*\})\s+from\s+["'](react|0x1|next|preact)["'];?/g,
      '// 0x1 Framework: React compatibility layer automatically provided'
    );
  }

  // For special component types, ensure they have the right imports
  if (isSpecialComponent) {
    // Add important imports based on component type
    const specialImports = [];
    
    if (isLayout) {
      if (!processedSource.includes('import { Link } from "0x1"')) {
        specialImports.push('import { Link } from "0x1";');
      }
    }
    
    // Add more component-specific imports as needed
    if (isPage || isNotFound || isErrorPage) {
      if (!processedSource.includes('import { useState, useEffect } from "0x1"')) {
        specialImports.push('import { useState, useEffect } from "0x1";');
      }
    }
    
    // Add the special imports at the top if needed
    if (specialImports.length > 0) {
      processedSource = `// Component-specific imports
${specialImports.join('\n')}

${processedSource}`;
    }
  }

  return processedSource;
}

/**
 * Handle transpilation of JSX/TSX files using Bun.build
 */
export async function transpileFile(
  filePath: string,
  options: { 
    minify?: boolean,
    projectRoot?: string,
    debug?: boolean
  } = {}
): Promise<{ success: boolean, content?: string, error?: string, contentType?: string, status?: number }> {
  try {
    const { minify = false, debug = false, projectRoot } = options;
    const fileName = basename(filePath);
    
    // Get component type info for special handling
    const isLayout = fileName.includes('layout');
    const isPage = fileName.includes('page');
    const isNotFound = fileName.includes('not-found');
    const isErrorPage = fileName.includes('error');
    const isSpecialComponent = isLayout || isPage || isNotFound || isErrorPage;
    
    debug && logger.debug(`Transpiling file: ${filePath}`);
    
    // Try to use Bun's built-in transpiler for JSX/TSX/TS/JS files
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || 
        filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      debug && logger.debug(`Transpiling file: ${filePath}`);
      
      try {
        // Read the source file content
        const source = await Bun.file(filePath).text();
        
        // Process imports to handle React/0x1 imports
        const processedSource = await processImports(source, fileName);
        
        // Create JSX runtime preamble to ensure proper functionality
        const preamble = `
// 0x1 Framework JSX compatibility layer
// This ensures compatibility with React and JSX

// Global JSX functions to ensure consistent behavior
globalThis.__jsx = function jsx(type, props, key) { return { type, props, key }; };
globalThis.__jsxs = function jsxs(type, props, key) { return { type, props, key }; };
globalThis.__fragment = Symbol.for('react.fragment');

// Make React available in browser context with necessary functions
if (typeof window !== 'undefined') {
  window.React = window.React || {};
  window.React.createElement = window.React.createElement || function(type, props, ...children) { 
    return { type, props, children };
  };
  window.React.Fragment = window.React.Fragment || Symbol.for('react.fragment');
}

// Export these functions for direct usage in the component
export const jsx = globalThis.__jsx;
export const jsxs = globalThis.__jsxs;
export const Fragment = globalThis.__fragment;
export const createElement = (type, props, ...children) => ({ type, props, children });
export const jsxDEV = jsx;
`;

        // Handle JSX/TSX files with special processing
        if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
          let finalCode;
          
          // Special handling for different component types
          if (isSpecialComponent) {
            // For these critical components, place the preamble at the beginning
            finalCode = `${preamble}
// Special component: ${fileName}
${processedSource}`;
            
            // Make sure there's a default export that won't break
            if (!finalCode.includes('export default')) {
              // Extract potential component name from the file
              const componentNameMatch = processedSource.match(/(?:function|class|const|let)\s+([A-Z][\w$]*)/i);
              const componentName = componentNameMatch ? componentNameMatch[1] : 'DefaultComponent';
              
              finalCode += `
// Ensure there's a default export
export default function ${componentName}(props) {
  return jsx('div', { ...props }, null);
};
`;
            }
          } else {
            // For regular components, append the preamble at the end
            finalCode = `${processedSource}

${preamble}`;
          }
          
          // Use Bun's build API for proper transpilation if possible
          try {
            const externalModules = [
              'react', 'react-dom', 'next', 'next/link', 'next/head',
              'next/router', 'next/navigation', '0x1', '0x1/router',
              '0x1/jsx-runtime'
            ];
            
            const buildResult = await Bun.build({
              entrypoints: [filePath],
              target: 'browser',
              format: 'esm',
              minify: false,
              sourcemap: 'external',
              define: {
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                '__jsx': 'jsx',
                '__jsxs': 'jsxs',
                '__fragment': 'Fragment'
              },
              external: externalModules,
              loader: {
                '.tsx': 'tsx',
                '.jsx': 'jsx',
                '.ts': 'ts',
                '.js': 'js',
              },
            });
            
            if (buildResult.success) {
              // Use the built output if successful
              let builtCode = '';
              for (const output of buildResult.outputs) {
                builtCode += await output.text();
              }
              
              // Add our preamble to ensure JSX runtime is available
              const enhancedCode = `${preamble}

// Transpiled code
${builtCode}`;
              
              return { 
                success: true, 
                content: enhancedCode,
                contentType: 'application/javascript'
              };
            }
            
            // If build fails, fall back to our manual processing
            debug && logger.warn(`Bun build failed for ${filePath}, falling back to manual processing`);
          } catch (buildError) {
            debug && logger.warn(`Error during Bun build: ${buildError}, falling back`);
          }
          
          // Return our manually processed code as fallback
          return { 
            success: true, 
            content: finalCode,
            contentType: 'application/javascript'
          };
        } else {
          // For regular TS/JS files, minimal processing is needed
          return { 
            success: true, 
            content: processedSource,
            contentType: 'application/javascript'
          };
        }
      } catch (error) {
        debug && logger.error(`Transpilation error: ${error}`);
        
        // Final fallback for special components: create a minimal stub
        if (isSpecialComponent) {
          // Extract potential component name from filename
          const componentName = fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '') || 'Component';
          const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
          
          const minimalStub = `// 0x1 Framework - Minimal stub for ${fileName}
// This is a fallback component because transpilation failed

// Define JSX runtime functions
export function jsx(type, props, key) { 
  props = props || {};
  return { type, props, key, children: props.children || [] }; 
}

export function jsxs(type, props, key) { 
  props = props || {};
  return { type, props, key, children: props.children || [] };
}

export const Fragment = Symbol.for('react.fragment');

export function createElement(type, props, ...children) {
  props = props || {};
  return { type, props, children: children.filter(c => c != null) };
}

export const jsxDEV = jsx;

// Export a working component that won't break the application
export default function ${capitalizedName}(props) {
  return jsx('div', { className: 'auto-generated-component', ...props }, null);
}

// Export any special Next.js or React compatibility functions
export const useRouter = () => ({ push: () => {}, pathname: '/' });
export const useParams = () => ({});
export const useSearchParams = () => new Map();

// Make React compatibility globals available
if (typeof window !== 'undefined') {
  window.React = window.React || {};
  window.React.createElement = window.React.createElement || createElement;
  window.React.Fragment = window.React.Fragment || Fragment;
}

// Register global JSX functions
globalThis.__jsx = jsx;
globalThis.__jsxs = jsxs;
globalThis.__fragment = Fragment;
`;
          
          return { 
            success: true, 
            content: minimalStub,
            contentType: 'application/javascript'
          };
        }
        
        // General fallback with error message
        return { 
          success: false, 
          error: `Transpilation error: ${error}`,
          content: `console.error('Transpilation error for ${filePath}: ${error}');`,
          contentType: 'application/javascript'
        };
      }
    }
    
    // For other file types, just return the content
    return { 
      success: true, 
      content: await Bun.file(filePath).text(),
      contentType: 'text/plain'
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Transpilation error: ${error}`,
      content: `console.error('Transpilation error for ${filePath}: ${error}');`,
      contentType: 'application/javascript'
    };
  }
}

/**
 * Find and load all components in the app directory structure
 */
export async function discoverComponents(
  appDir: string,
  options: { debug?: boolean } = {}
): Promise<Record<string, any>> {
  const { debug = false } = options;
  const components: Record<string, any> = {};
  
  try {
    debug && logger.debug(`Discovering components in: ${appDir}`);
    
    // Check if directory exists
    if (!existsSync(appDir)) {
      debug && logger.warn(`App directory doesn't exist: ${appDir}`);
      return components;
    }
    
    // Standard Next.js app directory component files
    const componentTypes = ['page', 'layout', 'loading', 'error', 'not-found'];
    
        /**
     * Recursive function to scan directories for components
     */
    async function scanDirectory(dir: string, relativePath: string = '') {
      try {
        // Check if the directory exists
        if (!existsSync(dir)) return;
        
        // Read directory contents
        const dirEntries = readdirSync(dir);
        if (!dirEntries || dirEntries.length === 0) return;
        
        // Process each file/directory
        for (const entry of dirEntries) {
          // Skip hidden files and directories
          if (entry.startsWith('.') || entry === 'node_modules') continue;
          
          const fullPath = join(dir, entry);
          const newRelativePath = relativePath ? join(relativePath, entry) : entry;
          
          // Check if this is a directory
          const stat = statSync(fullPath);
          const isDirectory = stat.isDirectory();
          
          if (isDirectory) {
            // Recurse into subdirectories
            await scanDirectory(fullPath, newRelativePath);
          } else {
            // Check if this is a component file
            const isComponent = componentTypes.some(type => {
              return entry === `${type}.tsx` || entry === `${type}.jsx` || 
                     entry === `${type}.ts` || entry === `${type}.js`;
            });
            
            if (isComponent) {
              // Extract the component type (page, layout, etc.)
              const componentType = entry.split('.')[0];
              // Create the path that would be requested by the browser
              // We need to use dirname() to get the parent directory path
              const dirPath = dirname(newRelativePath) === '.' ? '' : dirname(newRelativePath);
              const componentPath = join('app', dirPath, componentType);
              
              // Transpile the component
              debug && logger.debug(`Found component: ${componentPath} at ${fullPath}`);
              
              const result = await transpileFile(fullPath, { 
                projectRoot: appDir,
                debug
              });
              
              if (result.success && result.content) {
                // Store the transpiled component
                components[componentPath] = result.content;
                debug && logger.debug(`Successfully transpiled component: ${componentPath}`);
              } else {
                debug && logger.warn(`Failed to transpile component: ${componentPath}`);
              }
            }
          }
        }
      } catch (error) {
        logger.error(`Error scanning directory ${dir}: ${error}`);
      }
    }
    
    // Start the recursive scan from the app directory
    await scanDirectory(appDir);
    
    debug && logger.info(`Discovered ${Object.keys(components).length} components`);
    
    return components;
  } catch (error) {
    logger.error(`Error discovering components: ${error}`);
    return components;
  }
}

/**
 * Process and handle TypeScript/JavaScript file requests
 * Supports handling JS files that might exist as TS files
 */
export async function handleScriptRequest(
  path: string,
  projectPath: string,
  options: { debug?: boolean } = {}
): Promise<{ success: boolean, content?: string, contentType?: string, status?: number }> {
  const { debug = false } = options;
  
  try {
    debug && logger.debug(`Handling script request: ${path}`);
    
    // Handle requests for JS files that might exist as TS/TSX files
    if (path.endsWith(".js") && !path.includes("node_modules")) {
      // Check if there's a corresponding .ts or .tsx file
      const basePath = path.replace(/\.js$/, "");
      const tsPath = `${basePath}.ts`;
      const tsxPath = `${basePath}.tsx`;
      
      let tsFilePath = null;
      
      // Check if TS/TSX file exists
      if (existsSync(resolve(projectPath, tsPath.slice(1)))) {
        tsFilePath = resolve(projectPath, tsPath.slice(1));
      } else if (existsSync(resolve(projectPath, tsxPath.slice(1)))) {
        tsFilePath = resolve(projectPath, tsxPath.slice(1));
      }
      
      if (tsFilePath) {
        debug && logger.debug(`Found TypeScript source: ${tsFilePath}`);
        
        // Transpile the TS file
        const result = await transpileFile(tsFilePath, { 
          projectRoot: projectPath,
          debug
        });
        
        if (result.success && result.content) {
          return {
            success: true,
            content: result.content,
            contentType: "application/javascript",
            status: 200
          };
        } else {
          return {
            success: false,
            content: result.content || `console.error('Failed to transpile: ${tsFilePath}');`,
            contentType: "application/javascript",
            status: 500
          };
        }
      }
    }
    
    // If no special handling was applied, indicate that we couldn't handle this request
    return { success: false };
  } catch (error) {
    logger.error(`Error handling script request: ${error}`);
    return { 
      success: false,
      content: `console.error('Error processing script: ${error}');`,
      contentType: "application/javascript",
      status: 500
    };
  }
}
