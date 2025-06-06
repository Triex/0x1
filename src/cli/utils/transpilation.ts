/**
 * 0x1 Framework - Unified Transpilation Utilities
 * Provides comprehensive functions for handling JSX/TSX transpilation, file processing, and component discovery
 * This is the single source of truth for all transpilation functionality in the 0x1 Framework
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from 'node:path';
import { logger } from "./logger";

// Internal component and TypeScript processing utilities
// These are now defined directly in this file for better organization

// Define all types here to avoid isolated module issues

/**
 * Types for component metadata
 */
/**
 * Unified ComponentInfo type that works for all use cases
 * Can be a string or an object with component metadata
 */
export type ComponentInfo = string | {
  name: string;
  path: string;
  type?: string;
  hasExport?: boolean;
  isDefault?: boolean;
  relativePath?: string;
  content?: string;
}

/**
 * Types for transpilation options
 */
export interface TranspileOptions {
  filename?: string;
  minify?: boolean;
  transformImports?: boolean;
  sourceMaps?: boolean;
  projectRoot?: string;
  debug?: boolean;
}

/**
 * Component info type
 */
// ComponentInfo is now defined above

/**
 * Types for transpilation metadata
 */
export interface TranspileMetadata {
  hasComponents: boolean;
  components: ComponentInfo[];
  hasJsx: boolean;
  success: boolean;
  errors?: string[];
}

/**
 * Types for transpilation result
 */
export interface TranspileResult {
  code: string;
  metadata: TranspileMetadata;
  map?: any;
}

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
 * Transform TypeScript to JavaScript
 */
export function transformTypeScript(content: string): string {
  return content
    // Remove type imports
    .replace(/import\s+type\s+.*?;/g, '')
    .replace(/import\s+\{\s*type\s+[^}]+\}\s+from\s+['"][^'"]+['"];/g, '')
    // Remove interface declarations with better regex (handles multi-line)
    .replace(/interface\s+[A-Za-z0-9_]+(\s*<[^>]*>)?\s*(extends\s+[A-Za-z0-9_]+(\s*<[^>]*>)?\s*)?\{[\s\S]*?\n\}/g, '')
    // Remove type declarations (including complex types)
    .replace(/type\s+[A-Za-z0-9_]+(\s*<[^>]*>)?\s*=\s*[\s\S]*?;/g, '')
    // Remove type annotations in function parameters and return types
    .replace(/:\s*[A-Za-z<>[\]|&,\s]+(?=[,)])/g, '')
    // Remove return type annotations
    .replace(/\)\s*:\s*[A-Za-z<>[\]|&,\s]+\s*(?={)/g, ')')
    // Remove generic type parameters
    .replace(/<[^>]+>/g, '')
    // Remove type assertions
    .replace(/as\s+[A-Za-z<>[\]|&,\s]+/g, '')
    // Remove optional chaining operator (?.),  nullish coalescing operator (??), and optional parameters (?)
    .replace(/\?\./g, '.')
    .replace(/\?\?/g, '||')
    .replace(/([a-zA-Z0-9_]+)\?:/g, '$1:')
    // Fix for object destructuring with type annotations
    .replace(/(\{[\s\n]*[^}:]+):\s*[A-Za-z0-9_]+(<[^>]*>)?(\[\])?([,\s}])/g, '$1$4')
    // Clean up any leftover type artifacts
    .replace(/:\s*any\s*([,=)])/g, '$1')
    .replace(/:\s*unknown\s*([,=)])/g, '$1')
    .replace(/:\s*never\s*([,=)])/g, '$1')
    .replace(/:\s*void\s*([,=)])/g, '$1');
}

/**
 * Process imports in JSX/TSX files to ensure compatibility
 */
export async function processImports(sourceCode: string, fileName: string = ''): Promise<string> {
  // Handle import statements for JSX
  let processedSource = sourceCode;
  const isLayout = fileName.includes('layout');
  const isPage = fileName.includes('page');
  const isNotFound = fileName.includes('not-found');
  const isErrorPage = fileName.includes('error');
  const isLoading = fileName.includes('loading');
  
  // Component type detection for better handling
  const isSpecialComponent = isLayout || isPage || isNotFound || isErrorPage || isLoading;

  // First check if the file contains CSS Tailwind directives
  const hasTailwind = processedSource.includes('@tailwind');
  
  if (hasTailwind) {
    // For files with Tailwind, preserve the content but add a note about CSS processing
    processedSource = `// This file contains Tailwind CSS directives
// They will be processed by the Tailwind CLI separately
${processedSource}`;
  }

  // Check for existing React imports
  const hasReactImport = /import\s+(?:(?:\*\s+as\s+)?React|\{\s*([\w\s,]+)\s*\})\s+from\s+["'](react|0x1|next|preact)[""];?/g.test(processedSource);

  // Check for JSX runtime imports which might cause conflicts
  const jsxRuntimeImportRegex = /import\s+(?:\{\s*(?:jsx|jsxs|Fragment|createElement|jsxDEV)[\w\s,]*\}\s+)?from\s+["'](react\/jsx-runtime|0x1\/jsx-runtime)[""];?/g;
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
      /import\s+(?:(?:\*\s+as\s+)?React|\{\s*([\w\s,]+)\s*\})\s+from\s+["'](react|0x1|next|preact)[""];?/g,
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
    
    // Add special imports for loading components
    if (isLoading && !processedSource.includes('import { Suspense } from "0x1"')) {
      specialImports.push('import { Suspense } from "0x1";');
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
 * Find component files in a directory (recursive)
 */
export function findComponentFiles(directory: string, extensions: string[] = ['.js', '.jsx', '.ts', '.tsx']): string[] {
  const componentFiles: string[] = [];
  
  if (!existsSync(directory)) {
    return componentFiles;
  }
  
  const files = readdirSync(directory);
  
  for (const file of files) {
    const fullPath = join(directory, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file === 'node_modules' || file === '.git' || file === '.0x1-temp') {
        continue;
      }
      
      // Recursively find components in subdirectories
      const subComponents = findComponentFiles(fullPath, extensions);
      componentFiles.push(...subComponents);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      // Check if it's likely a component file (has PascalCase name or is in components/pages directory)
      const isPascalCase = /^[A-Z][a-zA-Z0-9]*\.[jt]sx?$/.test(file);
      const isInComponentsDir = fullPath.includes('/components/') || 
                                fullPath.includes('/pages/') || 
                                fullPath.includes('/app/');
      
      if (isPascalCase || isInComponentsDir) {
        componentFiles.push(fullPath);
      }
    }
  }
  
  return componentFiles;
}

/**
 * Generate a static file mapping for all components
 */
export async function generateComponentsMap(directory: string): Promise<Record<string, string>> {
  const componentFiles = findComponentFiles(directory);
  const componentsMap: Record<string, string> = {};
  
  for (const file of componentFiles) {
    const relativePath = file.replace(directory, '').replace(/^\//, '');
    const importPath = '/' + relativePath.replace(/\.[jt]sx?$/, '.js');
    const componentName = basename(file, extname(file));
    
    componentsMap[componentName] = importPath;
  }
  
  return componentsMap;
}

// Using the unified TranspileOptions interface defined earlier

/**
 * Component metadata structure - using the ComponentInfo type defined earlier
 */
export type ComponentMetadata = {
  path: string;
  name: string;
  type: 'page' | 'layout' | 'component' | 'error' | 'loading' | 'not-found';
  relativePath: string;
  content?: string;
};

// Using the unified TranspileResult interface defined earlier

/**
 * Process JSX/TSX files
 */
export async function processJsxFile(
  filePath: string,
  options: TranspileOptions = {}
): Promise<TranspileResult> {
  try {
    // Read the JSX file
    const content = await Bun.file(filePath).text();
    
    // Skip non-JSX files
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
      logger.debug(`Skipping non-JSX file: ${filePath}`);
      return {
        code: content,
        metadata: {
          hasComponents: false,
          components: [],
          hasJsx: false,
          success: true
        }
      };
    }
    
    // Process imports to ensure compatibility
    const processedContent = await processImports(content, basename(filePath));
    
    // Transpile the JSX/TSX file
    return await transpileJsx(processedContent, { ...options, filename: filePath });
  } catch (error) {
    logger.error(`Error processing JSX file ${filePath}: ${error}`);
    return {
      code: `// Error occurred during processing\nconsole.error("JSX processing failed: ${error instanceof Error ? error.message.replace(/"/g, "'") : String(error).replace(/"/g, "'")}");\nexport default function ErrorComponent() { return null; }`,
      metadata: {
        hasComponents: true,
        components: ['ErrorComponent'],
        hasJsx: false,
        success: false
      }
    };
  }
}

/**
 * Process TypeScript files
 */
export async function processTypeScriptFile(
  filePath: string,
  options: TranspileOptions = {}
): Promise<TranspileResult> {
  try {
    // Read the TypeScript file
    const content = await Bun.file(filePath).text();
    
    // Handle .d.ts declaration files - these should be skipped
    if (filePath.endsWith('.d.ts')) {
      return {
        code: '',
        metadata: {
          hasComponents: false,
          components: [],
          hasJsx: false,
          success: true
        }
      };
    }
    
    // Check if it's a JSX/TSX file
    const isJsxFile = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    
    // For non-JSX TypeScript files, use our custom transformation
    if (!isJsxFile) {
      // Process the content first
      const processedContent = await processImports(content, basename(filePath));
      const transformed = transformTypeScript(processedContent);
      
      return {
        code: options.minify ? minifyCode(transformed) : transformed,
        metadata: {
          hasComponents: transformed.includes('export default') || transformed.includes('export function'),
          components: [],
          hasJsx: false,
          success: true
        }
      };
    }
    
    // For JSX/TSX files, use transpileJsx
    return await transpileJsx(content, { ...options, filename: filePath });
  } catch (error) {
    logger.error(`TypeScript processing error: ${error}`);
    return {
      code: `console.error("TypeScript processing failed: ${error}");`,
      metadata: {
        hasComponents: false,
        components: [],
        hasJsx: false,
        success: false
      }
    };
  }
}

/**
 * Transpile JSX/TSX to JavaScript
 */
export async function transpileJsx(input: string, options?: TranspileOptions): Promise<TranspileResult> {
  const { filename = 'component.jsx', minify = false, projectRoot } = options || {};
  
  try {
    // Check if we're in a deployment environment (like Vercel)
    const isDeployment = Boolean(
      process.env.VERCEL || 
      process.env.NETLIFY || 
      process.env.CI ||
      (typeof process !== 'undefined' && process.stdout && !process.stdout.isTTY)
    );
    
    // Create a temporary file instead of using virtual filesystem
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    const { writeFileSync, unlinkSync } = await import('fs');
    
    const tempFile = join(tmpdir(), `0x1-jsx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.tsx`);
    
    try {
      // Write the input to a temporary file
      writeFileSync(tempFile, input);
      
      // Build using the temporary file
    const result = await Bun.build({
        entrypoints: [tempFile],
      target: 'browser',
      format: 'esm',
      minify,
      define: {
        'process.env.NODE_ENV': '"development"'
      },
        external: ['0x1', '0x1/jsx-runtime', 'react', 'react-dom']
      });

      // Clean up the temporary file
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors in deployment environments
        if (!isDeployment) {
          logger.warn(`Could not clean up temporary file: ${e}`);
        }
      }

    if (!result.success) {
      throw new Error('Transpilation failed');
    }

    const output = await result.outputs[0].text();
    
    const wrappedOutput = `
import { jsx, jsxs, Fragment } from '/0x1/jsx-runtime.js';

${output}
`;

    return {
      code: wrappedOutput,
      metadata: {
        hasComponents: wrappedOutput.includes('export default') || wrappedOutput.includes('export function'),
        components: [],
        hasJsx: true,
        success: true
      }
    };
    } catch (buildError) {
      // Clean up temp file even if build fails
      try {
        unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw buildError;
    }
  } catch (error) {
    logger.error(`JSX transpilation error: ${error}`);
    return {
      code: `console.error("JSX transpilation failed: ${error}");`,
      metadata: {
        hasComponents: false,
        components: [],
        hasJsx: false,
        success: false
      }
    };
  }
}
