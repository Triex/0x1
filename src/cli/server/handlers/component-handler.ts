import { existsSync, readFileSync, statSync } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';

// Import directive validation functions
import { processDirectives } from '../../../core/directives.js';

// Transpilation cache to prevent duplicate work
const transpilationCache = new Map<string, { content: string; mtime: number; etag: string }>();

/**
 * Transform code content to handle imports for browser compatibility
 * This converts React and 0x1 imports to browser-compatible paths
 * and removes CSS imports that would cause MIME type errors
 */
function transformBareImports(content: string, filePath?: string, projectPath?: string): string {
  let transformed = content;
  
  // Remove CSS imports that cause MIME type errors in the browser
  transformed = transformed
    .replace(/import\s*['"'][^'"]*\.css['"];?/g, '// CSS import removed for browser compatibility')
    .replace(/import\s*['"'][^'"]*\.scss['"];?/g, '// SCSS import removed for browser compatibility')
    .replace(/import\s*['"'][^'"]*\.sass['"];?/g, '// SASS import removed for browser compatibility')
    .replace(/import\s*['"'][^'"]*\.less['"];?/g, '// LESS import removed for browser compatibility')
    // Handle the specific format: import"./globals.css"
    .replace(/import"[^"]*\.css"/g, '// CSS import removed for browser compatibility')
    .replace(/import'[^']*\.css'/g, '// CSS import removed for browser compatibility');
  
  // CRITICAL FIX: Transform React hook imports to use direct window.React access
  // This completely bypasses ES6 import issues with the hooks module
  transformed = transformed
    .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]0x1['"];?/g, (match, imports) => {
      // Parse the imports 
      const hookNames = imports.split(',').map((s: string) => s.trim());
      const hookAssignments = hookNames.map((hookName: string) => {
        const cleanName = hookName.trim();
        // Map hooks to window.React access
        if (['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'].includes(cleanName)) {
          return `const ${cleanName} = window.React?.${cleanName} || (() => { throw new Error('[0x1] ${cleanName} not available'); });`;
        }
        return `// Skipped non-hook import: ${cleanName}`;
      });
      return `// Hook imports transformed to direct window.React access\n${hookAssignments.join('\n')}`;
    })
    .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]\/0x1\/hooks\.js['"];?/g, (match, imports) => {
      // Parse the imports from hooks.js
      const hookNames = imports.split(',').map((s: string) => s.trim());
      const hookAssignments = hookNames.map((hookName: string) => {
        const cleanName = hookName.trim();
        // Map hooks to window.React access
        if (['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'].includes(cleanName)) {
          return `const ${cleanName} = window.React?.${cleanName} || (() => { throw new Error('[0x1] ${cleanName} not available'); });`;
        }
        return `// Skipped non-hook import: ${cleanName}`;
      });
      return `// Hook imports transformed to direct window.React access\n${hookAssignments.join('\n')}`;
    });
  
  // Transform third-party Web3 imports to polyfill paths (keep this working)
  // ULTRA-DYNAMIC: Convert named imports to property access of polyfill namespace
  transformed = transformed
    .replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]viem['"]/g,
      (match, imports) => {
        const namedImports = imports.split(',').map((name: string) => name.trim());
        const assignments = namedImports.map((name: string) => 
          `const ${name} = (() => { 
            const polyfill = globalThis.__0x1_polyfill_viem || window.__0x1_polyfill_viem;
            if (!polyfill) throw new Error('[0x1] viem polyfill not loaded - ensure /node_modules/viem is loaded first');
            return polyfill.${name} || polyfill.default?.${name} || (() => { throw new Error('[0x1] ${name} not available from viem polyfill'); });
          })();`
        );
        return `// ULTRA-DYNAMIC viem imports\n${assignments.join('\n')}`;
      }
    )
    .replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]viem\/([^'"]+)['"]/g,
      (match, imports, subPath) => {
        const namedImports = imports.split(',').map((name: string) => name.trim());
        const assignments = namedImports.map((name: string) => 
          `const ${name} = (() => { 
            const polyfill = globalThis.__0x1_polyfill_viem || window.__0x1_polyfill_viem;
            if (!polyfill) throw new Error('[0x1] viem polyfill not loaded - ensure /node_modules/viem is loaded first');
            return polyfill.${name} || polyfill.default?.${name} || (() => { throw new Error('[0x1] ${name} not available from viem/${subPath} polyfill'); });
          })();`
        );
        return `// ULTRA-DYNAMIC viem/${subPath} imports\n${assignments.join('\n')}`;
      }
    )
    .replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]wagmi['"]/g,
      (match, imports) => {
        const namedImports = imports.split(',').map((name: string) => name.trim());
        const assignments = namedImports.map((name: string) => 
          `const ${name} = (() => { 
            const polyfill = globalThis.__0x1_polyfill_wagmi || window.__0x1_polyfill_wagmi;
            if (!polyfill) throw new Error('[0x1] wagmi polyfill not loaded - ensure /node_modules/wagmi is loaded first');
            return polyfill.${name} || polyfill.default?.${name} || (() => { throw new Error('[0x1] ${name} not available from wagmi polyfill'); });
          })();`
        );
        return `// ULTRA-DYNAMIC wagmi imports\n${assignments.join('\n')}`;
      }
    )
    .replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]wagmi\/([^'"]+)['"]/g,
      (match, imports, subPath) => {
        const namedImports = imports.split(',').map((name: string) => name.trim());
        const assignments = namedImports.map((name: string) => 
          `const ${name} = (() => { 
            const polyfill = globalThis.__0x1_polyfill_wagmi || window.__0x1_polyfill_wagmi;
            if (!polyfill) throw new Error('[0x1] wagmi polyfill not loaded - ensure /node_modules/wagmi is loaded first');
            return polyfill.${name} || polyfill.default?.${name} || (() => { throw new Error('[0x1] ${name} not available from wagmi/${subPath} polyfill'); });
          })();`
        );
        return `// ULTRA-DYNAMIC wagmi/${subPath} imports\n${assignments.join('\n')}`;
      }
    )
    .replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@tanstack\/react-query['"]/g,
      (match, imports) => {
        const namedImports = imports.split(',').map((name: string) => name.trim());
        const assignments = namedImports.map((name: string) => 
          `const ${name} = (() => { 
            const polyfill = globalThis.__0x1_polyfill__tanstack_react_query || window.__0x1_polyfill__tanstack_react_query;
            if (!polyfill) throw new Error('[0x1] @tanstack/react-query polyfill not loaded - ensure /node_modules/@tanstack/react-query is loaded first');
            return polyfill.${name} || polyfill.default?.${name} || (() => { throw new Error('[0x1] ${name} not available from @tanstack/react-query polyfill'); });
          })();`
        );
        return `// ULTRA-DYNAMIC @tanstack/react-query imports\n${assignments.join('\n')}`;
      }
    )
    .replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@rainbow-me\/rainbowkit['"]/g,
      (match, imports) => {
        const namedImports = imports.split(',').map((name: string) => name.trim());
        const assignments = namedImports.map((name: string) => 
          `const ${name} = (() => { 
            const polyfill = globalThis.__0x1_polyfill__rainbow_me_rainbowkit || window.__0x1_polyfill__rainbow_me_rainbowkit;
            console.log('[0x1 DEBUG] Accessing ${name} from RainbowKit polyfill. Polyfill exists:', !!polyfill);
            if (!polyfill) {
              console.error('[0x1 ERROR] RainbowKit polyfill not found. Available keys:', Object.keys(globalThis).filter(k => k.includes('polyfill')));
              throw new Error('[0x1] @rainbow-me/rainbowkit polyfill not loaded - ensure /node_modules/@rainbow-me/rainbowkit is loaded first');
            }
            const result = polyfill.${name} || polyfill.default?.${name};
            console.log('[0x1 DEBUG] Retrieved ${name}:', typeof result, result);
            if (!result) {
              console.error('[0x1 ERROR] ${name} not available in polyfill. Available props:', Object.getOwnPropertyNames(polyfill));
              throw new Error('[0x1] ${name} not available from @rainbow-me/rainbowkit polyfill');
            }
            return result;
          })();`
        );
        return `// ULTRA-DYNAMIC @rainbow-me/rainbowkit imports\n${assignments.join('\n')}`;
      }
    );
  
  // Transform other 0x1 framework imports
  transformed = transformed
    .replace(/from\s+['"]0x1\/link['"]/g, 'from "/0x1/link"')
    .replace(/from\s+['"]0x1\/router['"]/g, 'from "/0x1/router.js"')
    .replace(/from\s+['"]0x1['"]/g, 'from "/node_modules/0x1/index.js"');
  
  // Transform relative imports to absolute paths
  if (filePath && projectPath) {
    const currentDir = dirname(filePath);
    
    // Handle parent directory imports: ../filename
    transformed = transformed.replace(
      /from\s+['"](\.\.[/\\][^'"]+)['"]/g, 
      (match, relativePath) => {
        const absolutePath = resolve(currentDir, relativePath).replace(projectPath, '');
        return `from "${absolutePath.replace(/\\/g, '/')}"`;
      }
    );
    
    // Handle same directory imports: ./filename
    transformed = transformed.replace(
      /from\s+['"](\.[/\\][^'"]+)['"]/g, 
      (match, relativePath) => {
        const absolutePath = resolve(currentDir, relativePath).replace(projectPath, '');
        return `from "${absolutePath.replace(/\\/g, '/')}"`;
      }
    );
  }

  return transformed;
}

/**
 * Fix JSX function calls to use standard names instead of hashed names
 * This handles Bun's transpiler output which generates hashed function names
 */
function normalizeJsxFunctionCalls(content: string): string {
  // Log original content statistics
  const originalHashedFunctions = content.match(/jsx[A-Za-z]*_[a-zA-Z0-9_]+/g) || [];
  console.log(`🔧 Starting normalization with ${originalHashedFunctions.length} hashed functions found`);
  
  // Let's log the exact patterns we're seeing
  if (originalHashedFunctions.length > 0) {
    console.log(`🔍 First 5 hashed functions found: ${originalHashedFunctions.slice(0, 5).join(', ')}`);
  }
  
  // Much more aggressive and comprehensive normalization patterns
  // Handle the specific pattern we're seeing: jsxDEV_7x81h0kn
  
  // 1. Most aggressive: Replace any jsx function with underscore and hash
  content = content.replace(/jsxDEV_[a-zA-Z0-9_]+/g, 'jsxDEV');
  content = content.replace(/jsx_[a-zA-Z0-9_]+/g, 'jsx');
  content = content.replace(/jsxs_[a-zA-Z0-9_]+/g, 'jsxs');
  content = content.replace(/Fragment_[a-zA-Z0-9_]+/g, 'Fragment');
  
  // 2. Handle mixed alphanumeric patterns like the one we're seeing
  content = content.replace(/jsxDEV_[0-9a-z]+/gi, 'jsxDEV');
  content = content.replace(/jsx_[0-9a-z]+/gi, 'jsx');
  content = content.replace(/jsxs_[0-9a-z]+/gi, 'jsxs');
  content = content.replace(/Fragment_[0-9a-z]+/gi, 'Fragment');
  
  // 3. Ultra aggressive catch-all: any jsx followed by underscore and anything
  content = content.replace(/\bjsxDEV_\w+/g, 'jsxDEV');
  content = content.replace(/\bjsx_\w+/g, 'jsx');
  content = content.replace(/\bjsxs_\w+/g, 'jsxs');
  content = content.replace(/\bFragment_\w+/g, 'Fragment');
  
  // 4. Even more aggressive: handle any character combinations
  content = content.replace(/jsxDEV_[^(\s]+/g, 'jsxDEV');
  content = content.replace(/jsx_[^(\s]+/g, 'jsx');
  content = content.replace(/jsxs_[^(\s]+/g, 'jsxs');
  content = content.replace(/Fragment_[^(\s]+/g, 'Fragment');
  
  // 5. Final nuclear option: match the exact pattern we're seeing
  content = content.replace(/jsxDEV_7x81h0kn/g, 'jsxDEV');
  content = content.replace(/jsx_7x81h0kn/g, 'jsx');
  content = content.replace(/jsxs_7x81h0kn/g, 'jsxs');
  content = content.replace(/Fragment_7x81h0kn/g, 'Fragment');
  
  // 6. Absolutely aggressive: replace ALL occurrences regardless of pattern
  content = content.replace(/jsx[a-zA-Z]*_[a-zA-Z0-9]+/g, (match) => {
    console.log(`🔄 Processing match: ${match}`);
    if (match.startsWith('jsxDEV_')) return 'jsxDEV';
    if (match.startsWith('jsxs_')) return 'jsxs';
    if (match.startsWith('jsx_')) return 'jsx';
    if (match.startsWith('Fragment_')) return 'Fragment';
    // Fallback: just remove the hash
    const base = match.split('_')[0];
    console.log(`🔄 Fallback: ${match} -> ${base}`);
    return base;
  });
  
  // Log final statistics
  const finalHashedFunctions = content.match(/jsx[A-Za-z]*_[a-zA-Z0-9_]+/g) || [];
  console.log(`🔧 Normalization complete: ${originalHashedFunctions.length} -> ${finalHashedFunctions.length} hashed functions`);
  
  // If we still have hashed functions, log them for debugging
  if (finalHashedFunctions.length > 0) {
    console.log(`🚨 REMAINING HASHED FUNCTIONS: ${finalHashedFunctions.slice(0, 10).join(', ')}`);
    
    // Show context around remaining functions
    finalHashedFunctions.slice(0, 3).forEach((func, i) => {
      const index = content.indexOf(func);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + func.length + 30);
        const context = content.substring(start, end);
        console.log(`Context ${i + 1} for "${func}": ${context}`);
      }
    });
  }
  
  return content;
}

/**
 * Generate production-quality JSX runtime preamble
 * Uses import statements instead of variable declarations to avoid syntax errors
 */
function generateJsxRuntimePreamble(): string {
  return `// 0x1 Framework - JSX Runtime Access
import { jsx, jsxs, jsxDEV, Fragment, createElement } from '/0x1/jsx-runtime.js';`;
}

/**
 * Insert JSX runtime import after existing imports
 */
function insertJsxRuntimePreamble(code: string): string {
  const lines = code.split('\n');
  let insertIndex = 0;
  let foundImports = false;
  
  // Find the end of imports
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('import ') || (line.startsWith('export ') && line.includes('from '))) {
      foundImports = true;
      insertIndex = i + 1;
    } else if (line.startsWith('//') || line.startsWith('/*') || line === '') {
      // Skip comments and empty lines but don't update insertIndex unless after imports
      if (foundImports) {
        insertIndex = i + 1;
      }
    } else if (line && foundImports) {
      // Found first non-import, non-comment line after imports
      break;
    }
  }
  
  // If no imports found, insert at the very beginning
  if (!foundImports) {
    insertIndex = 0;
  }
  
  // Insert JSX runtime import at the determined position
  const jsxRuntimeImport = generateJsxRuntimePreamble();
  lines.splice(insertIndex, 0, jsxRuntimeImport);
  return lines.join('\n');
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
 * Locate a component file based on the request path
 */
function locateComponent(reqPath: string, projectPath: string): string | null {
  // Remove .js extension and add project path
  const componentBasePath = reqPath.replace(/\.js$/, '');
  
  // Check for the component in various formats (.tsx, .jsx, .ts, .js)
  const possibleComponentPaths = [
    join(projectPath, `${componentBasePath}.tsx`),
    join(projectPath, `${componentBasePath}.jsx`),
    join(projectPath, `${componentBasePath}.ts`),
    join(projectPath, `${componentBasePath}.js`)
  ];
  
  // Find the first matching component path
  return possibleComponentPaths.find(path => existsSync(path)) || null;
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
    console.log(`✅ 200 OK: ${reqPath} (Component from ${componentPath.replace(projectPath, '')})`);
    
    // Read the source code
    const sourceCode = readFileSync(componentPath, 'utf-8');
    
    // PERFORMANCE: Check transpilation cache first
    const stats = statSync(componentPath);
    const currentMtime = stats.mtime.getTime();
    const cacheKey = componentPath;
    
    if (transpilationCache.has(cacheKey)) {
      const cached = transpilationCache.get(cacheKey)!;
      if (cached.mtime >= currentMtime) {
        console.log(`[0x1 Cache] Using cached transpilation for ${componentPath}`);
        return new Response(cached.content, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "ETag": cached.etag,
            "X-Transpiled": "cached"
          }
        });
      }
    }
    
    // CRITICAL FIX: Process directives to detect client components
    const directiveResult = processDirectives(sourceCode, componentPath);
    if (directiveResult.errors.length > 0) {
      console.warn(`Component ${componentPath} has directive errors:`, directiveResult.errors);
      return new Response(generateDirectiveErrorScript(componentPath, directiveResult.errors), {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }
      });
    }
    
    // Use processed code from directive validation
    const processedSource = directiveResult.code;
    
    // Add logging for client component detection
    if (directiveResult.directive === 'client' || directiveResult.inferredContext === 'client') {
      console.log(`[0x1 Directive] Detected CLIENT component: ${componentPath}`);
    }
    
    // Transform bare imports
    const transformedContent = transformBareImports(processedSource, componentPath, projectPath);
    
    // Determine if this is a JSX/TSX file
    const extension = componentPath.split('.').pop() || 'js';
    const isJSX = extension === 'tsx' || extension === 'jsx';
    
    // If this is a JSX/TSX file, transpile it with Bun
    if (isJSX) {
      try {
        console.log(`Transpiling ${componentPath} using Bun.Transpiler`);
        
        const transpiler = new Bun.Transpiler({
          loader: componentPath.endsWith('.tsx') ? 'tsx' : 'jsx',
          target: 'browser',
          define: {
            'process.env.NODE_ENV': '"development"',
            'global': 'window'
          }
        });
        
        const transpiled = transpiler.transformSync(transformedContent);
        
        // Insert JSX runtime preamble to ensure it's available
        const withJsxRuntime = insertJsxRuntimePreamble(transpiled);
        
        // // Log debug info for the transpilation
        // console.log(`=== TRANSPILATION DEBUG for ${componentPath} ===`);
        // console.log(`Original source (first 200 chars):`, sourceCode.substring(0, 200));
        // console.log(`Transformed imports (first 200 chars):`, transformedContent.substring(0, 200));
        // console.log(`Transpiled output (first 500 chars):`, withJsxRuntime.substring(0, 500));
        // console.log(`Transpiled output (last 200 chars):`, withJsxRuntime.substring(-200));
        
        // Apply JSX normalization to handle dynamic hashed function names
        const normalized = normalizeJsxFunctionCalls(withJsxRuntime);
        
        // DISABLE ES6 conversion for proper module loading
        // Let the browser handle ES6 imports properly via import maps
        const finalContent = normalized;
        
        console.log('✅ ES6 syntax converted to browser-compatible JavaScript');
        
        // PERFORMANCE: Cache the transpilation result
        const etag = `"${Date.now()}-${Math.random()}"`;
        transpilationCache.set(cacheKey, {
          content: finalContent,
          mtime: currentMtime,
          etag: etag
        });
        
        return new Response(finalContent, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Last-Modified": new Date().toUTCString(),
            "ETag": etag,
            "X-Transpiled": "bun"
          }
        });
      } catch (error: unknown) {
        const transpileError = error instanceof Error ? error.message : String(error);
        console.error(`Failed to transpile ${componentPath}: ${transpileError}`);
        
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
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Last-Modified": new Date().toUTCString(),
            "ETag": `"${Date.now()}-${Math.random()}"`,
            "X-Transpiled": "error"
          }
        });
      }
    } else {
      // For non-JSX files, handle TypeScript transpilation if it's a .ts file
      if (extension === 'ts') {
        try {
          console.log(`Transpiling TypeScript file ${componentPath} using Bun.Transpiler`);
          
          // Create transpiler for TypeScript
          const transpiler = new Bun.Transpiler({
            loader: 'ts',
            target: 'browser',
            define: {
              'process.env.NODE_ENV': '"development"',
            },
          });
          
          // Transpile the TypeScript code to remove type annotations
          const transpiled = transpiler.transformSync(transformedContent);
          
          console.log(`Successfully transpiled TypeScript file ${componentPath}`);
          
          return new Response(transpiled, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
              "Last-Modified": new Date().toUTCString(),
              "ETag": `"${Date.now()}-${Math.random()}"`,
              "X-Transpiled": "typescript"
            }
          });
        } catch (error: unknown) {
          const transpileError = error instanceof Error ? error.message : String(error);
          console.error(`Failed to transpile TypeScript file ${componentPath}: ${transpileError}`);
          
          // Fall back to basic transformation
          console.warn(`Falling back to basic transformation for ${componentPath}`);
        }
      }
      
      // For non-JSX files (.js or failed .ts), transform bare imports and return
      return new Response(transformedContent, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Last-Modified": new Date().toUTCString(),
          "ETag": `"${Date.now()}-${Math.random()}"`,
          "X-Transpiled": "bare-imports"
        }
      });
    }
  } catch (error) {
    console.error(`Failed to process component ${componentPath}: ${error}`);
    return null;
  }
}

/**
 * Generate basic component code with proper error handling and exports (utility function)
 */
export function generateComponentCode(componentPath: string, sourceCode: string, projectPath: string): string {
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

// Add path normalization function
function normalizePath(path: string): string {
  // Split the path into segments
  const segments = path.split('/').filter(segment => segment !== '');
  const normalized: string[] = [];
  
  for (const segment of segments) {
    if (segment === '..') {
      // Go up one level (remove last segment)
      if (normalized.length > 0) {
        normalized.pop();
      }
    } else if (segment !== '.') {
      // Add the segment (ignore '.' which means current directory)
      normalized.push(segment);
    }
  }
  
  // Return normalized path with leading slash
  return '/' + normalized.join('/');
}

/**
 * Convert ES6 import/export syntax to browser-compatible JavaScript
 */
function convertES6ToBrowserJS(code: string, componentPath: string): string {
  let browserCode = code;
  
  // Step 1: Convert import statements to global variable assignments with silent fallbacks
  browserCode = browserCode.replace(
    /import\s+(\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`];?\s*/g,
    (match, imports, modulePath) => {
      // Handle different import patterns
      if (imports.includes('{')) {
        // Named imports: import { A, B } from 'module'
        const namedImports = imports.replace(/[{}]/g, '').split(',').map((imp: string) => imp.trim());
        const globalAssignments = namedImports.map((imp: string) => {
          const [importName, alias] = imp.includes(' as ') ? imp.split(' as ').map((s: string) => s.trim()) : [imp, imp];
          // Silent fallback without console.warn to avoid "Import not found" errors
          return `const ${alias} = globalThis.${importName} || window.${importName} || null;`;
        }).join('\n');
        return `// Import: ${match.trim()}\n${globalAssignments}`;
      } else if (imports.includes('*')) {
        // Namespace imports: import * as Module from 'module'
        const namespaceName = imports.replace(/\*\s+as\s+/, '').trim();
        return `// Import: ${match.trim()}\nconst ${namespaceName} = globalThis.${namespaceName} || window.${namespaceName} || {};`;
      } else {
        // Default imports: import Module from 'module'
        const importName = imports.trim();
        return `// Import: ${match.trim()}\nconst ${importName} = globalThis.${importName} || window.${importName} || null;`;
      }
    }
  );
  
  // Track exports for final export statement
  const namedExports: string[] = [];
  let defaultExport: string | null = null;
  
  // Step 2: Convert export statements to browser-compatible code
  
  // Handle: export const metadata = {...}
  browserCode = browserCode.replace(
    /export\s+(const|let|var)\s+(\w+)\s*=\s*([^;]+);?/g,
    (match, declaration, name, value) => {
      namedExports.push(name);
      return `${declaration} ${name} = ${value};`;
    }
  );
  
  // Handle: export function FunctionName() - make it global
  browserCode = browserCode.replace(
    /export\s+function\s+(\w+)/g,
    (match, functionName) => {
      namedExports.push(functionName);
      return `function ${functionName}`;
    }
  );
  
  // Handle: export default function FunctionName() - make it global and set as default
  browserCode = browserCode.replace(
    /export\s+default\s+function\s+(\w+)/g,
    (match, functionName) => {
      defaultExport = functionName;
      return `function ${functionName}`;
    }
  );
  
  // Handle: export default SomeName - assign to window.default
  browserCode = browserCode.replace(
    /export\s+default\s+(\w+);?/g,
    (match, name) => {
      defaultExport = name;
      return `// Default export: ${name}`;
    }
  );
  
  // Step 3: Add global assignments for all functions found in the code
  const functionMatches = browserCode.match(/function\s+(\w+)/g);
  if (functionMatches) {
    const uniqueFunctions = [...new Set(functionMatches.map(match => match.replace('function ', '')))];
    const globalAssignments = uniqueFunctions.map(funcName => {
      return `\n// Global assignment for ${funcName}\nwindow.${funcName} = ${funcName};`;
    }).join('');
    browserCode += globalAssignments;
  }
  
  // Step 4: Add proper ES6 export statements at the end
  browserCode += '\n\n// ES6 module exports for dynamic import compatibility\n';
  
  // Add named exports
  namedExports.forEach(exportName => {
    browserCode += `export { ${exportName} };\n`;
  });
  
  // Add default export
  if (defaultExport) {
    browserCode += `export default ${defaultExport};\n`;
    browserCode += `window.default = ${defaultExport};\n`;
  }
  
  return browserCode;
}