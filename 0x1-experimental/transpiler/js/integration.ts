/**
 * 0x1 JSX Transpiler Integration (TypeScript)
 * 
 * This module integrates the JSX transpiler with the 0x1 build system.
 * It provides utility functions for both the build process and dev server.
 */


// Import the transpiler using dynamic import to handle ESM/CJS differences
import { JSXTranspiler } from './jsx-transpiler.js';

/**
 * Interface for Transpiler options
 */
interface TranspileOptions {
  minify?: boolean;
  sourceMaps?: boolean;
  development?: boolean;
  preprocess?: (code: string) => string;
  postprocess?: (code: string) => string;
}

/**
 * Transpile JSX content to JavaScript
 * 
 * @param sourceCode - Source JSX code to transpile
 * @param filePath - Path to the source file (for error reporting)
 * @param options - Transpilation options
 * @returns Transpiled JavaScript code
 */
export function transpileJSX(
  sourceCode: string, 
  filePath: string = 'unknown', 
  options: TranspileOptions = {}
): string {
  try {
    // Apply preprocessing if defined
    let processedSource = sourceCode;
    if (options.preprocess) {
      processedSource = options.preprocess(processedSource);
    }
    
    // Transpile the JSX
    const transpiler = new JSXTranspiler(processedSource);
    let result = transpiler.transpile();
    
    // Apply postprocessing if defined
    if (options.postprocess) {
      result = options.postprocess(result);
    }
    
    // Apply minification if requested
    if (options.minify) {
      // Simple minification - would use a proper minifier in production
      result = result
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Remove comments
        .replace(/^\s*\n/gm, '')                   // Remove empty lines
        .replace(/\s{2,}/g, ' ');                  // Collapse multiple spaces
    }
    
    return result;
  } catch (error) {
    console.error(`[0x1 Transpiler] Error transpiling ${filePath}:`, error);
    
    // Generate fallback component for error case
    return generateErrorComponent(filePath, error.message);
  }
}

/**
 * Batch transpile multiple JSX files
 * 
 * @param files - Map of filePath to source content
 * @param options - Transpilation options
 * @returns Map of filePath to transpiled content
 */
export function batchTranspileJSX(
  files: Map<string, string>,
  options: TranspileOptions = {}
): Map<string, string> {
  const results = new Map<string, string>();
  
  for (const [filePath, content] of files.entries()) {
    try {
      results.set(filePath, transpileJSX(content, filePath, options));
    } catch (error) {
      console.error(`[0x1 Transpiler] Error transpiling ${filePath}:`, error);
      results.set(filePath, generateErrorComponent(filePath, error.message));
    }
  }
  
  return results;
}

/**
 * Generate fallback component for error cases
 * 
 * @param filePath - Path to the file that failed transpilation
 * @param errorMessage - Error message to display
 * @returns JavaScript code for error component
 */
export function generateErrorComponent(filePath: string, errorMessage: string): string {
  const safePath = filePath.replace(/'/g, "\\'");
  const safeError = errorMessage.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  
  return `
// Component error fallback: ${safePath}
console.error('[0x1 Dev] Component error:', '${safeError}');

export default function ComponentErrorFallback(props) {
  const container = document.createElement('div');
  container.className = 'component-error p-4 border border-red-400 bg-red-50 rounded m-4';
  container.innerHTML = \`
    <div class="text-red-800">
      <h3 class="font-bold mb-2">Component Error</h3>
      <p class="mb-2">Failed to load: <code>${safePath}</code></p>
      <details class="text-sm">
        <summary class="cursor-pointer font-medium">Error Details</summary>
        <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">${safeError}</pre>
      </details>
    </div>
  \`;
  return container;
}

// Make error component available globally for debugging
if (typeof window !== 'undefined') {
  window.__0x1_lastComponentError = {
    path: '${safePath}',
    error: '${safeError}',
    timestamp: new Date().toISOString()
  };
}
`;
}

/**
 * Build-system integration helper
 * Can be used as a drop-in replacement for the existing transpile function
 */
export function transpileForBuild(sourceCode: string, filePath: string): string {
  return transpileJSX(sourceCode, filePath, {
    minify: true,
    sourceMaps: false,
    development: false,
    preprocess: (code) => {
      // Transform imports for browser compatibility
      return transformImportsForBrowser(code);
    }
  });
}

/**
 * Development server integration helper
 * Designed to work with the dev-server's hot reload system
 */
export function transpileForDevServer(sourceCode: string, filePath: string): string {
  return transpileJSX(sourceCode, filePath, {
    minify: false,
    sourceMaps: true,
    development: true,
    postprocess: (code) => {
      // Add hot reload marker
      return `
// Hot reload marker: ${Date.now()}
${code}
// Enable hot reload
if (import.meta.hot) {
  import.meta.hot.accept();
}
`.trim();
    }
  });
}

/**
 * Transform imports for browser compatibility
 */
function transformImportsForBrowser(sourceCode: string): string {
  let transformedCode = sourceCode;
  
  // Transform "0x1" imports
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1["']/gm,
    '$1"/0x1/core.js"'
  );
  
  // Transform relative imports without extensions
  transformedCode = transformedCode.replace(
    /^(\s*import\s+.*?\s+from\s+["'])([./][^"']*?)(?:["'])/gm,
    (match, prefix, importPath) => {
      // If the import already has an extension, leave it alone
      if (importPath.match(/\.(js|jsx|ts|tsx|mjs|cjs|json)$/)) {
        return match;
      }
      
      // Otherwise add .js extension
      return `${prefix}${importPath}.js"`;
    }
  );
  
  return transformedCode;
}

// Example of how to use this with the build system
export function exampleBuildIntegration(): void {
  console.log(`
To integrate this transpiler with the 0x1 build system:

1. In build.ts, replace the transpileComponentSafely function:

// Replace or enhance the existing transpilation function
import { transpileForBuild } from '../../0x1-experimental/transpiler/js/integration';

// In your build process
const transpiledCode = transpileForBuild(sourceCode, filePath);

2. In dev-server.ts, update the handleJsxComponent function:

// Import the transpiler integration
import { transpileForDevServer } from '../../0x1-experimental/transpiler/js/integration';

// In your component handler
const transpiledContent = transpileForDevServer(sourceCode, filePath);
`);
}
