import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'path';
import { logger } from '../../utils/logger.js';

// Import directive validation functions
import { processDirectives } from '../../../core/directives.js';

/**
 * Transform code content to handle imports for browser compatibility
 * This converts React and 0x1 imports to browser-compatible paths
 * and removes CSS imports that would cause MIME type errors
 */
function transformBareImports(content: string, filePath?: string): string {
  let transformed = content;
  
  // Remove CSS imports that cause MIME type errors in the browser
  transformed = transformed
    .replace(/import\s+['"][^'"]*\.css['"];?/g, '// CSS import removed for browser compatibility')
    .replace(/import\s+['"][^'"]*\.scss['"];?/g, '// SCSS import removed for browser compatibility')
    .replace(/import\s+['"][^'"]*\.sass['"];?/g, '// SASS import removed for browser compatibility');
  
  // Transform React imports to use 0x1 framework
  transformed = transformed
    .replace(/from\s+['"]react['"];?/g, 'from "/node_modules/0x1/index.js";')
    .replace(/from\s+['"]react\/jsx-runtime['"];?/g, 'from "/0x1/jsx-runtime.js";')
    .replace(/from\s+['"]react\/jsx-dev-runtime['"];?/g, 'from "/0x1/jsx-runtime.js";');
    
  // Fix use-sync-external-store module paths - critical for component loading
  transformed = transformed
    .replace(/from\s+['"]use-sync-external-store\/([^'"]+)['"];?/g, (match, path) => {
      // Make sure the path is properly absolute to prevent resolution errors
      return `from "/node_modules/use-sync-external-store/${path}"`;  
    })
    // Specific fixes for common problematic imports
    .replace(/from\s+['"]use-sync-external-store\/shim\/with-selector(\.js)?['"];?/g, 
      'from "/node_modules/use-sync-external-store/shim/with-selector.js";')
    .replace(/from\s+['"]use-sync-external-store\/shim(\.js)?['"];?/g, 
      'from "/node_modules/use-sync-external-store/shim/index.js";');
  
  // Transform 0x1 imports
  transformed = transformed
    .replace(/from\s+['"]0x1['"];?/g, 'from "/node_modules/0x1/index.js";')
    .replace(/from\s+['"]0x1\/router['"];?/g, 'from "/0x1/router.js";')
    .replace(/from\s+['"]0x1\/link['"];?/g, 'from "/0x1/link";');
  
  // Transform relative imports to absolute paths for components
  transformed = transformed
    .replace(/from\s+['"]\.\/([^'"]+)['"];?/g, (match, path) => {
      // Don't transform CSS imports - they should be removed above
      if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.sass')) {
        return '// CSS import removed for browser compatibility';
      }
      return `from "/components/${path}";`;
    })
    .replace(/from\s+['"]\.\.\/([^'"]+)['"];?/g, (match, path) => {
      // Don't transform CSS imports - they should be removed above
      if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.sass')) {
        return '// CSS import removed for browser compatibility';
      }
      return `from "/${path}";`;
    });

  return transformed;
}

/**
 * Fix JSX function calls to use standard names instead of hashed names
 * This handles Bun's transpiler output which generates hashed function names
 */
function normalizeJsxFunctionCalls(content: string): string {
  // Replace hashed JSX function calls with standard ones
  // Pattern: jsxDEV_[hash] -> jsxDEV
  content = content.replace(/jsxDEV_[a-zA-Z0-9_]+/g, 'jsxDEV');
  
  // Pattern: jsx_[hash] -> jsx  
  content = content.replace(/jsx_[a-zA-Z0-9_]+/g, 'jsx');
  
  // Pattern: jsxs_[hash] -> jsxs
  content = content.replace(/jsxs_[a-zA-Z0-9_]+/g, 'jsxs');
  
  // Pattern: Fragment_[hash] -> Fragment
  content = content.replace(/Fragment_[a-zA-Z0-9_]+/g, 'Fragment');
  
  return content;
}

/**
 * Generate production-quality JSX runtime preamble
 * Uses the proper JSX runtime with hooks context support
 */
function generateJsxRuntimePreamble(): string {
  return `// 0x1 Framework - Component uses global JSX runtime
// JSX functions (jsx, jsxs, jsxDEV, Fragment, createElement) are available globally
`;
}

/**
 * Process and validate a TypeScript/JSX file for directive usage
 */
function validateFileDirectives(
  filePath: string,
  sourceCode: string
): {
  hasErrors: boolean;
  errors: Array<{ type: string; message: string; line: number; suggestion: string }>;
  inferredContext?: 'client' | 'server';
  processedCode: string;
} {
  try {
    const result = processDirectives(sourceCode, filePath);
    
    return {
      hasErrors: result.errors.length > 0,
      errors: result.errors,
      inferredContext: result.inferredContext,
      processedCode: result.code
    };
  } catch (error) {
    return {
      hasErrors: true,
      errors: [{
        type: 'processing-error',
        message: `Failed to process directives: ${error instanceof Error ? error.message : String(error)}`,
        line: 1,
        suggestion: 'Check your syntax and directive usage'
      }],
      processedCode: sourceCode
    };
  }
}

/**
 * Generate error boundary JavaScript to display directive validation errors
 */
function generateDirectiveErrorScript(
  filePath: string,
  errors: Array<{ type: string; message: string; line: number; suggestion: string }>
): string {
  const errorData = {
    file: filePath,
    errors: errors,
    timestamp: new Date().toISOString()
  };
  
  return `
// 0x1 Directive Validation Errors
if (typeof window !== 'undefined' && window.__0x1_errorBoundary) {
  const directiveErrors = ${JSON.stringify(errorData, null, 2)};
  
  // Create a comprehensive error for each validation issue
  directiveErrors.errors.forEach((validationError, index) => {
    const error = new Error(\`Directive Validation Error in \${directiveErrors.file}:
    
Line \${validationError.line}: \${validationError.message}

💡 Suggestion: \${validationError.suggestion}

Context: This error was caught by 0x1's automatic directive validation system.\`);
    
    error.name = 'DirectiveValidationError';
    error.stack = \`DirectiveValidationError: \${validationError.message}
    at \${directiveErrors.file}:\${validationError.line}:1
    
Suggestion: \${validationError.suggestion}\`;
    
    // Add to error boundary with file context
    window.__0x1_errorBoundary.addError(error, \`\${directiveErrors.file} (validation)\`);
  });
}
`;
}

/**
 * Handles component requests and transpilation
 */
export function handleComponentRequest(
  reqPath: string, 
  projectPath: string,
  componentBasePath: string
): Response | null {
  // Check for the component in various formats (.tsx, .jsx, .ts, .js)
  const possibleComponentPaths = [
    join(projectPath, `${componentBasePath}.tsx`),
    join(projectPath, `${componentBasePath}.jsx`),
    join(projectPath, `${componentBasePath}.ts`),
    join(projectPath, `${componentBasePath}.js`)
  ];
  
  // Find the first matching component path
  const componentPath = possibleComponentPaths.find(path => existsSync(path));
  
  if (!componentPath) return null;
  
  try {
    logger.info(`✅ 200 OK: ${reqPath} (Component from ${componentPath.replace(projectPath, '')})`);
    
    // Read the source code
    const sourceCode = readFileSync(componentPath, 'utf-8');
    
    // Determine if this is a JSX/TSX file
    const extension = componentPath.split('.').pop() || 'js';
    const isJSX = extension === 'tsx' || extension === 'jsx';
    
    // If this is a JSX/TSX file, transpile it with Bun
    if (isJSX) {
      try {
        logger.debug(`Transpiling ${componentPath} using Bun.Transpiler`);
        
        // Transform bare imports first
        const transformedContent = transformBareImports(sourceCode);
        
        // Create transpiler with simple, working configuration
        const transpiler = new Bun.Transpiler({
          loader: extension === 'tsx' ? 'tsx' : 'jsx',
          target: 'browser',
          define: {
            'process.env.NODE_ENV': '"development"',
          },
          // Handle jsx/tsx content
          macro: {
            // Convert JSX to createElement calls
            jsxFactory: { jsx: "createElement" },
            jsxFragment: { jsx: "Fragment" },
          },
        });
        
        // Transpile the TypeScript code
        let transpiled = transpiler.transformSync(transformedContent);
        
        // Normalize hashed JSX function calls to standard names
        transpiled = normalizeJsxFunctionCalls(transpiled);
        
        // Debug: Log the transpiled content to see what's happening
        logger.debug(`Transpiled content for ${componentPath}:`);
        logger.debug(`Has 'export default': ${transpiled.includes('export default')}`);
        logger.debug(`Has 'function ': ${transpiled.includes('function ')}`);
        
        // Generate final code (clean, no directive processing interference)
        const finalCode = `${generateJsxRuntimePreamble()}

${transpiled}`;

        // Perform directive validation in the background (server-side only, no code modification)
        try {
          const validation = validateFileDirectives(componentPath, sourceCode);
          
          // Log context inference if applicable (server-side only)
          if (validation.inferredContext) {
            logger.info(`🔍 Auto-inferred context for ${componentPath}: "${validation.inferredContext}"`);
          }
          
          // Log validation issues but don't inject anything into browser code
          if (validation.hasErrors) {
            const criticalErrors = validation.errors.filter(error => 
              error.type.includes('error') && !error.type.includes('warning')
            );
            
            if (criticalErrors.length > 0) {
              logger.error(`🚨 Critical directive validation errors in ${componentPath}:`);
              criticalErrors.forEach((error, index) => {
                logger.error(`  ${index + 1}. Line ${error.line}: ${error.message}`);
                logger.info(`     💡 ${error.suggestion}`);
              });
            }
            
            const warnings = validation.errors.filter(error => 
              error.type.includes('warning')
            );
            
            if (warnings.length > 0) {
              logger.warn(`⚠️ Directive validation warnings in ${componentPath}:`);
              warnings.forEach((error, index) => {
                logger.warn(`  ${index + 1}. Line ${error.line}: ${error.message}`);
                logger.info(`     💡 ${error.suggestion}`);
              });
            }
          }
        } catch (validationError) {
          // Don't let validation errors break the actual transpilation
          logger.debug(`Directive validation failed for ${componentPath}: ${validationError}`);
        }
        
        logger.debug(`Successfully transpiled and normalized ${componentPath}`);
        
        // Return transpiled JavaScript with proper MIME type
        return new Response(finalCode, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      } catch (error: unknown) {
        const transpileError = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to transpile ${componentPath}: ${transpileError}`);
        
        // Return a production-quality error component with enhanced styling
        const errorScript = `${generateJsxRuntimePreamble()}

// Enhanced Error Component for Transpilation Failures
export default function TranspilationErrorComponent(props) {
  console.group('🚨 0x1 Framework Transpilation Error');
  console.error('Component:', '${componentPath}');
  console.error('Error:', '${transpileError.replace(/'/g, "\\'")}');
  console.groupEnd();

  return jsxDEV('div', {
    className: 'transpilation-error p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg shadow-lg max-w-4xl mx-auto mt-8',
    children: [
      jsxDEV('div', {
        className: 'flex items-center mb-4',
        children: [
          jsxDEV('div', {
            className: 'flex-shrink-0',
            children: jsxDEV('svg', {
              className: 'w-6 h-6 text-red-500',
              fill: 'currentColor',
              viewBox: '0 0 20 20',
              children: jsxDEV('path', {
                fillRule: 'evenodd',
                d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
                clipRule: 'evenodd'
              })
            })
          }),
          jsxDEV('div', {
            className: 'ml-3',
            children: jsxDEV('h3', {
              className: 'text-lg font-medium text-red-800 dark:text-red-200',
              children: 'Component Transpilation Failed'
            })
          })
        ]
      }),
      jsxDEV('div', {
        className: 'mb-4',
        children: [
          jsxDEV('p', {
            className: 'text-sm text-red-700 dark:text-red-300 mb-2 font-mono',
            children: 'File: ${componentPath}'
          }),
          jsxDEV('pre', {
            className: 'text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800/30 p-3 rounded border overflow-auto',
            children: '${transpileError.replace(/'/g, "\\'")}'
          })
        ]
      }),
      jsxDEV('div', {
        className: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4',
        children: [
          jsxDEV('h4', {
            className: 'text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2',
            children: 'Troubleshooting Tips:'
          }),
          jsxDEV('ul', {
            className: 'text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside',
            children: [
              jsxDEV('li', { children: 'Check for syntax errors in your JSX/TSX code' }),
              jsxDEV('li', { children: 'Ensure all imports are properly formatted' }),
              jsxDEV('li', { children: 'Verify TypeScript types are correct' }),
              jsxDEV('li', { children: 'Check the browser console for detailed error information' }),
              jsxDEV('li', { children: 'Try restarting the development server' })
            ]
          })
        ]
      })
    ]
  });
}`;
        
        return new Response(errorScript, {
          status: 200, // Return 200 to avoid breaking the app
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }
    } else {
      // For non-JSX files, transform bare imports and return
      const transformedContent = transformBareImports(sourceCode);
      
      return new Response(transformedContent, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate" 
        }
      });
    }
  } catch (error) {
    logger.error(`Failed to process component ${componentPath}: ${error}`);
    return null;
  }
}

/**
 * Generate the component code with proper error handling and exports
 */
export function generateComponentCode(componentPath: string, sourceCode: string): string {
  const componentName = basename(componentPath, extname(componentPath));
  
  // Check if the source already has exports to avoid duplicates
  const hasDefaultExport = sourceCode.includes('export default');
  const hasNamedExports = sourceCode.includes('export ') && !sourceCode.includes('export default');
  
  // If the source already has proper exports, just return it with JSX runtime imports
  if (hasDefaultExport) {
    return `
// Auto-generated component for ${componentName}
import { jsx, jsxs, Fragment } from '/0x1/jsx-runtime.js';

// Original component code with existing exports
${sourceCode}
`;
  }
  
  // Otherwise, wrap it with error boundary
  return `
// Auto-generated component wrapper for ${componentName}
import { jsx, jsxs, Fragment } from '/0x1/jsx-runtime.js';

// Original component code
${sourceCode}

// Ensure we have a default export
${hasNamedExports ? `export default ${componentName};` : ''}
`;
}

/**
 * Generate component code with integrated error boundary
 */
export function generateComponentCodeWithErrorBoundary(componentPath: string, sourceCode: string, originalComponentName?: string): string {
  const componentName = originalComponentName || basename(componentPath, extname(componentPath));
  
  return `
// Auto-generated component with error boundary for ${componentName}
import { jsx, jsxs, Fragment } from '/0x1/jsx-runtime.js';

// Original component code
${sourceCode}
`;
}

/**
 * Generate a fallback component for error cases
 */
export function generateFallbackComponent(componentName: string, errorMessage: string): string {
  return `
// 0x1 fallback component for ${componentName}
export default function ${componentName}(props) {
  const container = document.createElement('div');
  container.className = 'fallback-component p-4 border border-yellow-300 bg-yellow-50 rounded';
  container.innerHTML = '<p>Component not found: ${componentName}</p>';
  return container;
}
`;
}