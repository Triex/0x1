/**
 * JSX Transpiler - Uses Bun build command to transform JSX code
 * Optimized for React 19 and Next.js 15 compatibility
 */
import Bun from 'bun';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';
import { tmpdir } from 'os';
import { logger } from '../utils/logger';

// Constants for build configuration
const EXTERNAL_MODULES = [
  'react', 
  'react-dom', 
  'next', 
  'next/link', 
  'next/head',
  'next/router',
  'next/navigation',
  '0x1',
  '0x1/router',
  '0x1/jsx-runtime'
];

/**
 * Process imports and prepare source code for JSX transpilation
 * Handles various component types with special treatment for layouts and pages
 */
async function processImports(sourceCode: string, fileName: string = ''): Promise<string> {
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
  const hasReactImport = /import\s+(?:(?:\*\s+as\s+)?React|\{\s*(?:[\w\s,]+)\s*\})\s+from\s+["'](react|0x1|next|preact)["'];?/g.test(processedSource);

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
      /import\s+(?:(?:\*\s+as\s+)?React|\{\s*(?:[\w\s,]+)\s*\})\s+from\s+["'](react|0x1|next|preact)["'];?/g,
      '// 0x1 Framework: React compatibility layer automatically provided'
    );
  }

  // For special component types, ensure they have the right imports
  if (isSpecialComponent) {
    // Add important imports based on component type
    let specialImports = [];
    
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
    // First, create a temporary directory for the build process
    const tempDir = join(tmpdir(), `jsx-build-${Date.now()}`);
    await fsPromises.mkdir(tempDir, { recursive: true });

    // Create a unique output filename based on the entry file
    const outputFileName = basename(entryFile).replace(/\.(jsx|tsx|js|ts)$/, '.js');
    const outputFile = join(outputDir, outputFileName);

    // Ensure the output directory exists
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Read the source file
    const source = await Bun.file(entryFile).text();

    // Get the filename for component type detection
    const fileName = basename(entryFile);
    const isLayout = fileName.includes('layout');
    const isPage = fileName.includes('page');
    const isNotFound = fileName.includes('not-found');
    const isErrorPage = fileName.includes('error');
    const isSpecialComponent = isLayout || isPage || isNotFound || isErrorPage;
    
    // Process imports to handle React/0x1 imports
    const processedSource = await processImports(source, fileName);
    
    // Create a temporary file with the processed source
    const tempFile = join(tempDir, `${basename(entryFile)}`);
    await Bun.write(tempFile, processedSource);
    
    // Create a debug file to help with troubleshooting
    const debugFileName = isSpecialComponent ? 
      `.debug-${fileName}` : 
      `.debug-${Date.now()}-${fileName}`;
      
    const debugFile = join(dirname(outputFile), debugFileName);
    
    // Prepare the enhanced code with proper JSX runtime exports
    const finalCode = `${processedSource}

// Add browser environment compatibility
if (typeof window !== 'undefined') {
  // Add React to window for client components
  window.React = globalThis.React;
}

// Export pre-defined global JSX functions directly
// This avoids the circular definition errors
export { __jsx as jsx, __jsxs as jsxs, __fragment as Fragment } from '0x1';
export { createElement } from '0x1';
export { __jsx as jsxDEV } from '0x1';`;
    
    // Write the enhanced generated code to the debug file
    await Bun.write(debugFile, finalCode);
    
    // Write the processed source to the temp file for building
    await Bun.write(tempFile, finalCode);
    
    // Configure the build based on component type
    const buildConfig: any = {
      entrypoints: [tempFile],
      outdir: outputDir,
      minify: minify,
      target: 'browser' as const,
      splitting: false,
      format: 'esm' as const,  // Using ESM format for better compatibility
      naming: {
        entry: '[dir]/[name].[ext]',
      },
      loader: {
        '.tsx': 'tsx',
        '.jsx': 'jsx',
        '.ts': 'ts',
        '.js': 'js',
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
      external: EXTERNAL_MODULES,
    };
    
    // Special handling for layout, page, and not-found components
    if (isSpecialComponent) {
      logger.debug(`Special handling for ${fileName}`);
      // Use custom loader settings for special components
      buildConfig.jsx = {
        factory: '__jsx',
        fragment: '__fragment',
        runtime: 'automatic',
      };
    }
    
    // Run the build using Bun
    const buildResult = await Bun.build(buildConfig);
    
    if (!buildResult.success) {
      logger.error(`Build failed for ${fileName}: ${buildResult.logs?.join('\n') || 'Unknown error'}`);
      
      // Try a fallback approach for special components
      if (isSpecialComponent) {
        logger.debug(`Attempting fallback build for special component: ${fileName}`);
        
        // Simplify the build configuration for special components
        const fallbackConfig: any = {
          entrypoints: [tempFile],
          outdir: outputDir,
          minify: false, // Disable minification for better debugging
          target: 'browser' as const,
          format: 'esm' as const,
          external: EXTERNAL_MODULES,
        };
        
        const fallbackResult = await Bun.build(fallbackConfig);
        if (!fallbackResult.success) {
          logger.error(`Fallback build also failed: ${fallbackResult.logs?.join('\n')}`);
          return false;
        }
        
        logger.info(`Fallback build succeeded for ${fileName}`);
        return true;
      }
      
      return false;
    }
    
    logger.debug(`Successfully transpiled ${fileName}`);
    return true;
  } catch (error) {
    logger.error(`JSX transpilation error: ${error}`);
    return false;
  }
}
