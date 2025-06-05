/**
 * 0x1 JSX Transpiler Integration
 * 
 * This module integrates the JSX transpiler with the 0x1 build system.
 * It provides utility functions for both the build process and dev server.
 */

import { JSXTranspiler } from './jsx-transpiler.js';

/**
 * Transpile JSX content to JavaScript
 * @param {string} sourceCode - Source JSX code to transpile
 * @param {string} filePath - Path to the source file (for error reporting)
 * @returns {string} Transpiled JavaScript code
 */
function transpileJSX(sourceCode, filePath = 'unknown') {
  try {
    const transpiler = new JSXTranspiler(sourceCode);
    return transpiler.transpile();
  } catch (error) {
    console.error(`[0x1 Transpiler] Error transpiling ${filePath}:`, error);
    
    // Generate fallback component for error case
    return generateErrorComponent(filePath, error.message);
  }
}

/**
 * Batch transpile multiple JSX files
 * @param {Map<string, string>} files - Map of filePath to source content
 * @returns {Map<string, string>} Map of filePath to transpiled content
 */
function batchTranspileJSX(files) {
  const results = new Map();
  
  for (const [filePath, content] of files.entries()) {
    try {
      const transpiler = new JSXTranspiler(content);
      results.set(filePath, transpiler.transpile());
    } catch (error) {
      console.error(`[0x1 Transpiler] Error transpiling ${filePath}:`, error);
      results.set(filePath, generateErrorComponent(filePath, error.message));
    }
  }
  
  return results;
}

/**
 * Generate fallback component for error cases
 * @param {string} filePath - Path to the file that failed transpilation
 * @param {string} errorMessage - Error message to display
 * @returns {string} JavaScript code for error component
 */
function generateErrorComponent(filePath, errorMessage) {
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
function transpileForBuild(sourceCode, filePath) {
  // Pre-process the source code if necessary
  // Here you could add any build-specific transformations
  
  // Transpile the JSX
  const result = transpileJSX(sourceCode, filePath);
  
  // Post-process for build system (e.g., add imports, optimize)
  return result;
}

/**
 * Development server integration helper
 * Designed to work with the dev-server's hot reload system
 */
function transpileForDevServer(sourceCode, filePath) {
  // Pre-process the source code for development
  // Could include development-specific transformations
  
  // Transpile the JSX
  const result = transpileJSX(sourceCode, filePath);
  
  // Add development helpers like hot reload markers
  return result;
}

export {
  batchTranspileJSX, generateErrorComponent, transpileForBuild,
  transpileForDevServer, transpileJSX
};

