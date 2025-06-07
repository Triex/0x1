/**
 * 0x1 Framework - Unified Import Transformer
 * SINGLE SOURCE OF TRUTH for all import transformations
 * Handles all types of imports robustly for both dev and build
 */

import { dirname, relative, resolve } from 'node:path';

export interface ImportTransformOptions {
  sourceFilePath: string;
  projectPath: string;
  mode: 'development' | 'production';
  debug?: boolean;
}

export interface ImportTransformResult {
  transformed: string;
  warnings: string[];
  isExternal: boolean;
  resolvedPath?: string;
}

export class ImportTransformer {
  /**
   * Transform all types of imports to browser-resolvable URLs
   * COMPREHENSIVE handling following BuildOptimisation.md principles
   */
  static transformImports(content: string, options: ImportTransformOptions): string {
    const lines = content.split('\n');
    const transformedLines: string[] = [];
    const warnings: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // CRITICAL: Handle CSS imports FIRST (before general import filtering)
      // CSS imports don't have 'from' and may not have spaces: import"./style.css"
      if (/import\s*['"][^'"]*\.(css|scss|sass|less)['"];?/.test(trimmed)) {
        transformedLines.push('// CSS import removed for browser compatibility');
        continue;
      }
      
      // CRITICAL: Handle scoped package CSS imports specifically
      // Pattern: import"@scope/package/styles" or import "@scope/package/styles"
      if (/import\s*['"]@[^'"]*\/styles?['"];?/.test(trimmed) || /import\s*['"]@[^'"]*\/style['"];?/.test(trimmed)) {
        transformedLines.push('// CSS import from scoped package removed for browser compatibility');
        if (options.debug) {
          const match = trimmed.match(/import\s*['"]([^'"]+)['"];?/);
          if (match) {
            console.log(`[ImportTransformer] Removed CSS side-effect import: ${match[1]}`);
          }
        }
        continue;
      }
      
      // Skip non-import lines or comments
      if (!trimmed.startsWith('import ') || ImportTransformer.isImportInComment(line, lines, i)) {
        transformedLines.push(line);
        continue;
      }
      
      // Extract import statement components
      const importMatch = line.match(/^(\s*import\s+.*?\s+from\s+)(['"])(.*?)\2(.*)$/);
      if (!importMatch) {
        // Handle side-effect imports: import "module" or import"module" (no space)
        const sideEffectMatch = line.match(/^(\s*import\s*)(['"])(.*?)\2(.*)$/);
        if (sideEffectMatch) {
          const [, importPrefix, quote, modulePath, suffix] = sideEffectMatch;
          
          // CRITICAL: Handle CSS imports from scoped packages in side-effect imports
          if (modulePath.startsWith('@') && (modulePath.includes('/styles') || modulePath.includes('/style'))) {
            transformedLines.push('// CSS import from scoped package removed for browser compatibility');
            if (options.debug) {
              console.log(`[ImportTransformer] Removed CSS side-effect import: ${modulePath}`);
            }
            continue;
          }
          
          const result = ImportTransformer.transformModulePath(modulePath, options);
          
          // If the transformation resulted in a comment (CSS removal), use it directly
          if (result.transformed.startsWith('//')) {
            transformedLines.push(result.transformed);
          } else {
            transformedLines.push(`${importPrefix}${quote}${result.transformed}${quote}${suffix}`);
          }
          warnings.push(...result.warnings);
        } else {
          transformedLines.push(line);
        }
        continue;
      }
      
      const [, importPrefix, quote, modulePath, suffix] = importMatch;
      
      // Transform the module path
      const result = ImportTransformer.transformModulePath(modulePath, options);
      transformedLines.push(`${importPrefix}${quote}${result.transformed}${quote}${suffix}`);
      warnings.push(...result.warnings);
      
      if (options.debug && result.transformed !== modulePath) {
        console.log(`[ImportTransformer] ${modulePath} → ${result.transformed}`);
      }
    }
    
    // CRITICAL: Apply Link component fixes for router files to prevent class constructor errors
    let finalContent = transformedLines.join('\n');
    
    // Apply additional comprehensive transformations (includes working DevOrchestrator patterns)
    finalContent = ImportTransformer.applyAdditionalTransformations(finalContent, options);
    
    // More robust router file detection - check filename and content
    const isRouterFile = options.sourceFilePath.includes('router') || 
                        options.sourceFilePath.includes('Router') ||
                        finalContent.includes('function F(') ||
                        finalContent.includes('export{') && finalContent.includes('Link');
    
    if (isRouterFile && (finalContent.includes('function F') || finalContent.includes('type:"a"'))) {
      if (options.debug) {
        console.log(`[ImportTransformer] Applying Link fixes to: ${options.sourceFilePath}`);
      }
      finalContent = ImportTransformer.fixLinkComponentForBrowser(finalContent, options);
    }
    
    // Log warnings in debug mode
    if (options.debug && warnings.length > 0) {
      console.warn(`[ImportTransformer] Warnings for ${options.sourceFilePath}:`, warnings);
    }
    
    return finalContent;
  }

  /**
   * Transform a single module path to browser-resolvable URL
   * COMPREHENSIVE handling of all import patterns
   */
  private static transformModulePath(modulePath: string, options: ImportTransformOptions): ImportTransformResult {
    const warnings: string[] = [];
    
    // 1. FRAMEWORK IMPORTS: 0x1/module → /0x1/module.js
    if (modulePath.startsWith('0x1/')) {
      const submodule = modulePath.substring(4); // Remove '0x1/'
      const moduleMap: Record<string, string> = {
        'link': '/0x1/router.js', // CRITICAL: Will be handled as named import by additional transformations
        'router': '/0x1/router.js',
        'jsx-runtime': '/0x1/jsx-runtime.js',
        'jsx-dev-runtime': '/0x1/jsx-runtime.js',
        'hooks': '/0x1/hooks.js'
      };
      
      return {
        transformed: moduleMap[submodule] || `/0x1/${submodule}.js`,
        warnings,
        isExternal: false,
        resolvedPath: moduleMap[submodule] || `/0x1/${submodule}.js`
      };
    }
    
    // 2. FRAMEWORK ROOT: 0x1 → /node_modules/0x1/index.js
    if (modulePath === '0x1') {
      return {
        transformed: '/node_modules/0x1/index.js',
        warnings,
        isExternal: false,
        resolvedPath: '/node_modules/0x1/index.js'
      };
    }
    
    // 3. RELATIVE IMPORTS: ./path or ../path
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const resolved = ImportTransformer.resolveRelativeImport(modulePath, options);
      return {
        transformed: resolved.path,
        warnings: resolved.warnings,
        isExternal: false,
        resolvedPath: resolved.path
      };
    }
    
    // 4. ABSOLUTE IMPORTS: /path
    if (modulePath.startsWith('/')) {
      // Check if it's already a valid browser path
      if (modulePath.startsWith('/node_modules/') || modulePath.startsWith('/0x1/')) {
        return {
          transformed: modulePath,
          warnings,
          isExternal: false,
          resolvedPath: modulePath
        };
      }
      
      // Transform project absolute paths
      const normalized = ImportTransformer.normalizeComponentPath(modulePath.substring(1), '/', options);
      return {
        transformed: normalized,
        warnings,
        isExternal: false,
        resolvedPath: normalized
      };
    }
    
    // 5. SCOPED PACKAGES: @scope/package or @scope/package/submodule
    if (modulePath.startsWith('@')) {
      return ImportTransformer.transformScopedPackage(modulePath, options);
    }
    
    // 6. BARE MODULE SPECIFIERS: package-name or package-name/submodule
    return ImportTransformer.transformBareModule(modulePath, options);
  }

  /**
   * Transform scoped packages (@scope/package)
   * ROBUST handling including submodules and styles
   */
  private static transformScopedPackage(modulePath: string, options: ImportTransformOptions): ImportTransformResult {
    const warnings: string[] = [];
    
    // CRITICAL: Handle CSS imports from scoped packages - REMOVE completely
    // Browser cannot import CSS as ES modules, so these should be stripped
    if (modulePath.includes('/styles') && !modulePath.endsWith('.js')) {
      warnings.push(`CSS import from scoped package removed: ${modulePath}`);
      return {
        transformed: '// CSS import from scoped package removed for browser compatibility',
        warnings,
        isExternal: true,
        resolvedPath: undefined
      };
    }
    
    // INTELLIGENT PATTERN MATCHING - No hardcoded mappings needed
    // Handle all scoped packages dynamically using standard npm patterns
    const parts = modulePath.split('/');
    const scope = parts[0]; // @scope
    const packageName = parts[1]; // package
    const submodule = parts.slice(2).join('/'); // submodule/path
    
    if (!packageName) {
      warnings.push(`Invalid scoped package: ${modulePath}`);
      return {
        transformed: `/node_modules/${modulePath}`,
        warnings,
        isExternal: true
      };
    }
    
    // Handle submodules
    if (submodule) {
      // CRITICAL: Remove CSS imports completely
      if (submodule === 'styles' || submodule.endsWith('.css') || submodule.includes('style')) {
        warnings.push(`CSS import from scoped package removed: ${modulePath}`);
        return {
          transformed: '// CSS import from scoped package removed for browser compatibility',
          warnings,
          isExternal: true,
          resolvedPath: undefined
        };
      }
      
      // General submodule handling - standard npm resolution
      const extension = ImportTransformer.inferExtension(submodule);
      return {
        transformed: `/node_modules/${scope}/${packageName}/${submodule}${extension}`,
        warnings,
        isExternal: true
      };
    }
    
    // Main package entry - FIXED: Use working pattern (no /index.js for scoped packages)
    // Transform @scope/package → /node_modules/@scope/package (matches working logic)
    return {
      transformed: `/node_modules/${scope}/${packageName}`,
      warnings,
      isExternal: true
    };
  }

  /**
   * Transform bare module specifiers (package-name)
   * INTELLIGENT handling with common patterns - MATCHES WORKING LOGIC
   */
  private static transformBareModule(modulePath: string, options: ImportTransformOptions): ImportTransformResult {
    const warnings: string[] = [];
    
    // Skip special packages that should remain as-is (matches working logic)
    const skipPackages = ['react', 'react-dom', '0x1'];
    if (skipPackages.includes(modulePath.split('/')[0])) {
      return {
        transformed: modulePath,
        warnings,
        isExternal: true
      };
    }
    
    // Handle submodule imports
    const parts = modulePath.split('/');
    const packageName = parts[0];
    const submodule = parts.slice(1).join('/');
    
    if (submodule) {
      const extension = ImportTransformer.inferExtension(submodule);
      return {
        transformed: `/node_modules/${packageName}/${submodule}${extension}`,
        warnings,
        isExternal: true
      };
    }
    
    // Main package entry - FIXED: Use working pattern (no /index.js for bare packages)
    // Transform package-name → /node_modules/package-name (matches working logic)
    return {
      transformed: `/node_modules/${packageName}`,
      warnings,
      isExternal: true
    };
  }

  /**
   * Resolve relative imports to absolute browser URLs
   * SMART path resolution with file system awareness
   */
  private static resolveRelativeImport(modulePath: string, options: ImportTransformOptions): { path: string; warnings: string[] } {
    const warnings: string[] = [];
    const sourceDir = dirname(options.sourceFilePath);
    
    try {
      // Resolve the path relative to the source file
      const absolutePath = resolve(sourceDir, modulePath);
      const relativeToProjct = relative(options.projectPath, absolutePath);
      
      // Determine the correct base path based on location
      let basePath = '/components/';
      if (relativeToProjct.includes('lib/')) {
        basePath = '/lib/';
      } else if (relativeToProjct.includes('app/')) {
        basePath = '/app/';
      } else if (relativeToProjct.includes('src/')) {
        basePath = '/src/';
      }
      
      // Normalize the path
      const normalized = ImportTransformer.normalizeComponentPath(relativeToProjct, basePath, options);
      
      return { path: normalized, warnings };
    } catch (error) {
      warnings.push(`Failed to resolve relative import: ${modulePath}`);
      
      // Fallback: simple transformation
      const fallback = ImportTransformer.normalizeComponentPath(modulePath, '/components/', options);
      return { path: fallback, warnings };
    }
  }

  /**
   * Normalize component paths and ensure proper extensions
   * INTELLIGENT extension inference and path normalization
   */
  private static normalizeComponentPath(path: string, basePath: string, options: ImportTransformOptions): string {
    let normalized = path;
    
    // Handle different directory structures intelligently
    if (path.includes('components/')) {
      normalized = path.replace(/^.*?components\//, 'components/');
    } else if (path.includes('lib/')) {
      normalized = path.replace(/^.*?lib\//, 'lib/');
    } else if (path.includes('utils/')) {
      normalized = path.replace(/^.*?utils\//, 'utils/');
    } else if (path.includes('hooks/')) {
      normalized = path.replace(/^.*?hooks\//, 'hooks/');
    } else if (path.includes('app/')) {
      normalized = path.replace(/^.*?app\//, 'app/');
    } else if (path.includes('src/')) {
      normalized = path.replace(/^.*?src\//, 'src/');
    } else if (!path.startsWith('/')) {
      // Default: assume it's a component if no specific directory
      normalized = basePath.replace(/\/$/, '') + '/' + path;
    }
    
    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    
    // Add appropriate extension
    const extension = ImportTransformer.inferExtension(normalized);
    if (extension && !normalized.includes('.')) {
      normalized += extension;
    } else if (normalized.match(/\.(ts|tsx|jsx)$/)) {
      normalized = normalized.replace(/\.(ts|tsx|jsx)$/, '.js');
    }
    
    return normalized;
  }

  /**
   * Infer appropriate file extension based on context
   * SMART extension detection
   */
  private static inferExtension(path: string): string {
    // Already has extension
    if (/\.(js|ts|tsx|jsx|json|css|svg|png|jpg|gif|wasm)$/.test(path)) {
      return '';
    }
    
    // Special cases
    if (path.includes('styles') || path.includes('css')) {
      return '.css';
    }
    
    if (path.includes('types') || path.includes('@types')) {
      return '.d.ts';
    }
    
    // Default to .js for components and modules
    return '.js';
  }

  /**
   * Check if import statement is inside a comment or string
   * ROBUST comment detection
   */
  private static isImportInComment(line: string, allLines: string[], lineIndex: number): boolean {
    const trimmed = line.trim();
    
    // Check for obvious comment patterns
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return true;
    }
    
    // Check for JSX text content patterns
    const jsxPatterns = [
      /^\s*["'`].*?import.*?["'`]/, // String literals containing import
      /children:\s*\[/, // JSX children arrays
      /className\s*=/, // JSX className props
      /<code[^>]*>.*import/, // Code examples in JSX
      /<pre[^>]*>.*import/, // Preformatted code blocks
    ];
    
    return jsxPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Get import transformation statistics for debugging
   * PERFORMANCE monitoring support
   */
  static getTransformationStats(content: string, options: ImportTransformOptions): {
    totalImports: number;
    transformedImports: number;
    externalImports: number;
    frameworkImports: number;
    relativeImports: number;
  } {
    const lines = content.split('\n');
    let totalImports = 0;
    let transformedImports = 0;
    let externalImports = 0;
    let frameworkImports = 0;
    let relativeImports = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') && !ImportTransformer.isImportInComment(line, lines, 0)) {
        totalImports++;
        
        const match = line.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
          const modulePath = match[1];
          
          if (modulePath.startsWith('0x1')) {
            frameworkImports++;
          } else if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
            relativeImports++;
          } else if (modulePath.startsWith('@') || !modulePath.startsWith('/')) {
            externalImports++;
          }
          
          const result = ImportTransformer.transformModulePath(modulePath, options);
          if (result.transformed !== modulePath) {
            transformedImports++;
          }
        }
      }
    }
    
    return {
      totalImports,
      transformedImports,
      externalImports,
      frameworkImports,
      relativeImports
    };
  }

  /**
   * Fix Link component for browser compatibility
   * INTELLIGENT handling of Link component "Class constructor K" errors
   */
  private static fixLinkComponentForBrowser(content: string, options: ImportTransformOptions): string {
    if (options.debug) {
      console.log('[ImportTransformer] Applying Link component fixes for browser compatibility');
    }
    
    let modifiedContent = content;
    
    // CRITICAL: Ensure JSX runtime is available FIRST
    if (!modifiedContent.includes('const jsx=') && !modifiedContent.includes('window.jsx')) {
      const jsxRuntimeSetup = `
// 0x1 Framework - JSX Runtime Setup for Link Components
const jsx = (typeof window !== 'undefined' && (window.jsx || window.jsxDEV)) || 
           (() => {
             console.warn('[0x1 Router] JSX runtime not available, using fallback');
             return (type, props) => ({ type, props });
           })();
`;
      modifiedContent = jsxRuntimeSetup + modifiedContent;
    }
    
    // CRITICAL: Fix function D (NavLink) - the more problematic one
    if (modifiedContent.includes('function D(') && modifiedContent.includes('return{type:"a"')) {
      
      // Find function D and fix its return statement
      const funcDIndex = modifiedContent.indexOf('function D(');
      if (funcDIndex !== -1) {
        
        // Find the return{type:"a" part within function D
        const returnIndex = modifiedContent.indexOf('return{type:"a"', funcDIndex);
        if (returnIndex !== -1) {
          
          // Find the matching closing brace for the return object
          let braceCount = 0;
          let endIndex = returnIndex + 'return{'.length;
          
          for (let i = endIndex; i < modifiedContent.length; i++) {
            if (modifiedContent[i] === '{') braceCount++;
            if (modifiedContent[i] === '}') {
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
              braceCount--;
            }
          }
          
          // Replace the entire return statement for function D - use jsx() call
          const oldReturn = modifiedContent.substring(returnIndex, endIndex);
          const newReturn = 'return jsx("a",{href:z,className:V,onClick:(Z)=>{if(Z.preventDefault(),Z.stopPropagation(),z.startsWith("/")){let _=$();if(_)_.navigate(z);else if(typeof window!=="undefined")window.history.pushState(null,"",z),window.dispatchEvent(new PopStateEvent("popstate"))}else window.location.href=z},children:G})';
          
          modifiedContent = modifiedContent.replace(oldReturn, newReturn);
          
          if (options.debug) {
            console.log(`[ImportTransformer] Fixed function D (NavLink): ${oldReturn.substring(0, 50)}... → jsx("a",...)`);
          }
        }
      }
    }
    
    // CRITICAL: Fix function F (Link) if it still uses plain objects  
    if (modifiedContent.includes('function F(') && modifiedContent.includes('return{type:"a"')) {
      
      const funcFIndex = modifiedContent.indexOf('function F(');
      if (funcFIndex !== -1) {
        
        const returnIndex = modifiedContent.indexOf('return{type:"a"', funcFIndex);
        if (returnIndex !== -1) {
          
          let braceCount = 0;
          let endIndex = returnIndex + 'return{'.length;
          
          for (let i = endIndex; i < modifiedContent.length; i++) {
            if (modifiedContent[i] === '{') braceCount++;
            if (modifiedContent[i] === '}') {
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
              braceCount--;
            }
          }
          
          const oldReturn = modifiedContent.substring(returnIndex, endIndex);
          const newReturn = 'return jsx("a",{href:q,className:z,onClick:(V)=>{if(V.preventDefault(),V.stopPropagation(),q.startsWith("/")){let Z=$();if(Z)Z.navigate(q,!0,Y);else if(typeof window!=="undefined")window.history.pushState(null,"",q),window.dispatchEvent(new PopStateEvent("popstate"))}else window.location.href=q},children:Q})';
          
          modifiedContent = modifiedContent.replace(oldReturn, newReturn);
          
          if (options.debug) {
            console.log(`[ImportTransformer] Fixed function F (Link): ${oldReturn.substring(0, 50)}... → jsx("a",...)`);
          }
        }
      }
    }
    
    // CRITICAL: Also fix any other functions that return plain objects for links
    // Sometimes there might be other patterns like `export function Link()` returning objects
    const plainObjectPattern = /return\s*\{\s*type\s*:\s*["']a["']\s*,\s*props\s*:\s*\{[^}]*href\s*:[^}]*\}\s*\}/g;
    const matches = modifiedContent.match(plainObjectPattern);
    
    if (matches) {
      for (const match of matches) {
        // Replace each plain object return with jsx call
        const jsxReplacement = match.replace(
          /return\s*\{\s*type\s*:\s*["']a["']\s*,\s*props\s*:\s*(\{[^}]*\})\s*\}/,
          'return jsx("a", $1)'
        );
        modifiedContent = modifiedContent.replace(match, jsxReplacement);
        
        if (options.debug) {
          console.log(`[ImportTransformer] Fixed additional plain object pattern: ${match.substring(0, 30)}...`);
        }
      }
    }
    
    // Ensure Link functions are exposed for wrapper usage
    if (!modifiedContent.includes('window.__0x1_RouterLink = F')) {
      modifiedContent += `
// Expose original Link functions for wrapper
if (typeof window !== 'undefined') {
  window.__0x1_RouterLink = F;
  if (typeof D !== 'undefined') window.__0x1_RouterNavLink = D;
}
`;
    }
    
    if (options.debug) {
      console.log('[ImportTransformer] Link component fixes applied successfully');
      if (modifiedContent === content) {
        console.warn('[ImportTransformer] WARNING: No Link transformations were applied - patterns may not match');
      } else {
        console.log('[ImportTransformer] ✅ Content was successfully modified');
      }
    }
    
    return modifiedContent;
  }

  /**
   * Apply additional comprehensive transformations after basic import transformation
   * INCLUDES WORKING PATTERNS from DevOrchestrator for maximum compatibility
   */
  static applyAdditionalTransformations(content: string, options: ImportTransformOptions): string {
    // CRITICAL: Apply the WORKING regex patterns from DevOrchestrator 
    // These patterns are proven to work and should be included in ImportTransformer
    const transformedContent = content
      // Components and relative imports
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\.\/components\/([^"']+)["']/g, 
        'import { $1 } from "/components/$2.js"')
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\/([^"']+)["']/g, 
        'import { $1 } from "/$2.js"')
      
      // CSS imports (remove completely)
      .replace(/import\s*["']\.\/globals\.css["']/g, '// CSS import externalized')
      .replace(/import\s*["']\.\.\/globals\.css["']/g, '// CSS import externalized')
      .replace(/import\s*["'][^"']*\.css["'];?/g, '// CSS import removed for browser compatibility')
      .replace(/import\s*["']@0x1js\/highlighter\/styles["'];?/g, '// CSS import from scoped package removed for browser compatibility')
      
      // Framework runtime imports
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-dev-runtime["']/g, 
        'import { $1 } from "/0x1/jsx-runtime.js"')
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-runtime["']/g, 
        'import { $1 } from "/0x1/jsx-runtime.js"')
      
      // CRITICAL: Link imports - must import named export, not default (default is Router class!)
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/link["']/g, 
        'import { $1 } from "/0x1/router.js"')
      .replace(/import\s*([^{\s][^}]*?)\s*from\s*["']0x1\/link["']/g, 
        'import { Link as $1 } from "/0x1/router.js"')  // Original paths
      .replace(/import\s*([^{\s][^}]*?)\s*from\s*["']\/0x1\/router\.js["']/g, 
        'import { Link as $1 } from "/0x1/router.js"')  // CRITICAL: Fix already-transformed paths
      
      // Framework main imports  
      .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
        'import { $1 } from "/node_modules/0x1/index.js"')
      .replace(/import\s*([^{\s][^}]*?)\s*from\s*["']0x1["']/g, 
        'import $1 from "/node_modules/0x1/index.js"');

    return transformedContent;
  }
}

/**
 * Convenience function for quick import transformation
 * SIMPLE API for common use cases
 */
export function transformImports(content: string, sourceFilePath: string, projectPath: string, mode: 'development' | 'production' = 'development'): string {
  return ImportTransformer.transformImports(content, {
    sourceFilePath,
    projectPath,
    mode
  });
}

export default ImportTransformer; 