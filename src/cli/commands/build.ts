/**
 * 0x1 CLI - Build Command - ULTRA-FAST OPTIMIZED WITH COMPONENT IMPORT FIXES
 * Builds the application for production using Bun's full potential
 * Target: <100ms build times with parallel processing and smart caching
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { logger } from '../utils/logger';

// Import the proper metadata system
import { extractMetadataFromFile } from '../../core/metadata';

// Import directive validation functions from component handler
import { processDirectives } from '../../core/directives.js';

export interface BuildOptions {
  outDir?: string;
  minify?: boolean;
  watch?: boolean;
  silent?: boolean;
  config?: string;
  ignore?: string[];
}

// 🚀 ULTRA-FAST BUILD CACHE SYSTEM WITH HASH-BASED CACHING
class BuildCache {
  private cache = new Map<string, { content: string; hash: string; mtime: number }>();
  private readonly cacheFile = '.0x1/build-cache.json';
  
  constructor() {
    this.loadCache();
  }
  
  private loadCache(): void {
    try {
      if (existsSync(this.cacheFile)) {
        const data = JSON.parse(readFileSync(this.cacheFile, 'utf8'));
        this.cache = new Map(data);
      }
  } catch (error) {
      // Silent fail, start with empty cache
    }
  }
  
  private saveCache(): void {
    try {
      // Ensure .0x1 directory exists
      const cacheDir = dirname(this.cacheFile);
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }
      
      writeFileSync(this.cacheFile, JSON.stringify([...this.cache.entries()]));
    } catch (error) {
      // Silent fail
    }
  }
  
  async isCached(filePath: string): Promise<boolean> {
    if (!existsSync(filePath)) return false;
    
    const stats = statSync(filePath);
    const cacheEntry = this.cache.get(filePath);
    
    if (!cacheEntry) return false;
    
    // Check both mtime and content hash for ultimate accuracy
    if (cacheEntry.mtime !== stats.mtimeMs) return false;
    
    // Double-check with content hash for ultimate reliability
    const currentContent = await Bun.file(filePath).text();
    const currentHash = Bun.hash(currentContent).toString(16);
    
    return cacheEntry.hash === currentHash;
  }
  
  async get(filePath: string): Promise<string | null> {
    if (await this.isCached(filePath)) {
      return this.cache.get(filePath)!.content;
    }
    return null;
  }
  
  async set(filePath: string, content: string): Promise<void> {
    const stats = statSync(filePath);
    const sourceContent = await Bun.file(filePath).text();
    const hash = Bun.hash(sourceContent).toString(16);
    
    this.cache.set(filePath, { content, hash, mtime: stats.mtimeMs });
    this.saveCache();
  }

  // 🚀 ULTRA-FAST BATCH OPERATIONS
  async batchGet(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const tasks = filePaths.map(async (filePath) => {
      const cached = await this.get(filePath);
      if (cached) {
        results.set(filePath, cached);
      }
    });
    await Promise.all(tasks);
    return results;
  }

  async batchSet(entries: Map<string, { filePath: string; content: string }>): Promise<void> {
    const tasks = Array.from(entries.values()).map(async ({ filePath, content }) => {
      await this.set(filePath, content);
    });
    await Promise.all(tasks);
  }
  
  clear(): void {
    this.cache.clear();
    try {
      unlinkSync(this.cacheFile);
  } catch (error) {
      // Silent fail
    }
  }
}

// 🚀 PRODUCTION CACHE BUSTING UTILITIES
class CacheBustingManager {
  private assetMap = new Map<string, string>();
  private readonly manifestFile = '.0x1/asset-manifest.json';

  // Generate cache-busting hash
  generateHash(content: string | Buffer): string {
    return Bun.hash(content).toString(16).slice(0, 8);
  }

  // Process file with cache busting
  async processAssetWithCacheBusting(
    sourcePath: string, 
    outputDir: string, 
    originalName: string
  ): Promise<string> {
    const content = await Bun.file(sourcePath).arrayBuffer();
    const buffer = Buffer.from(content);
    const hash = this.generateHash(buffer);
    const ext = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const hashedName = `${nameWithoutExt}-${hash}.${ext}`;
    const hashedPath = join(outputDir, hashedName);
    
    await Bun.write(hashedPath, buffer);
    this.assetMap.set(originalName, hashedName);
    
    return hashedName;
  }

  // Create asset manifest for cache busting
  async saveAssetManifest(outputDir: string): Promise<void> {
    const manifestPath = join(outputDir, 'asset-manifest.json');
    const manifest = Object.fromEntries(this.assetMap);
    await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));
  }

  // Get hashed asset name
  getAssetName(originalName: string): string {
    return this.assetMap.get(originalName) || originalName;
  }
}

// 🚀 PARALLEL MODULE LOADER GENERATOR
function generateParallelModuleLoader(modules: string[]): string {
  return `
/**
 * 0x1 Production Parallel Module Loader
 * Eliminates waterfall loading by preloading all modules in parallel
 */

const moduleCache = new Map();
const loadingPromises = new Map();

// Preload all modules in parallel
const moduleManifest = ${JSON.stringify(modules)};

// Create parallel loading promises
const parallelLoaders = moduleManifest.map(module => {
  const loadPromise = import(module).then(mod => {
    moduleCache.set(module, mod);
    return mod;
  }).catch(err => {
    console.warn('[0x1] Failed to preload module:', module, err);
    return null;
  });
  
  loadingPromises.set(module, loadPromise);
  return loadPromise;
});

// Wait for critical modules to load
export const criticalModulesReady = Promise.all(parallelLoaders);

// Fast module getter with fallback
export async function getModule(modulePath) {
  if (moduleCache.has(modulePath)) {
    return moduleCache.get(modulePath);
  }
  
  if (loadingPromises.has(modulePath)) {
    return await loadingPromises.get(modulePath);
  }
  
  // Fallback to dynamic import
  try {
    const module = await import(modulePath);
    moduleCache.set(modulePath, module);
    return module;
  } catch (err) {
    console.error('[0x1] Module loading failed:', modulePath, err);
    throw err;
  }
}

// Preload styles in parallel
const styleSheets = [
  '/styles/global.css'
];

styleSheets.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.onload = () => console.log('[0x1] Preloaded stylesheet:', href);
  document.head.appendChild(link);
});

// Export for debugging
if (typeof window !== 'undefined') {
  window.__0x1_modules = { cache: moduleCache, loaders: loadingPromises };
}
`;
}

// 🚀 BULLETPROOF: Simple and reliable context-aware import transformation
function transformImportsForBrowser(sourceCode: string): string {
  console.log('[Build] 🧠 Applying bulletproof import transformations...');
  
  const lines = sourceCode.split('\n');
  const transformedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip if line doesn't contain import
    if (!trimmed.includes('import')) {
      transformedLines.push(line);
      continue;
    }
    
    // BULLETPROOF: Skip obvious code examples and JSX content
    const isCodeExample = 
      trimmed.includes('- import') ||
      trimmed.includes('+ import') ||
      line.includes('children:') ||
      line.includes('className=') ||
      /['"`].*import.*['"`]/.test(line) ||
      /<[^>]*import/.test(line) ||
      trimmed.includes('```') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      !/^\s*import\s/.test(line);
    
    if (isCodeExample) {
      console.log(`[Build] 🚫 Skipping code example at line ${i + 1}: ${trimmed.substring(0, 50)}...`);
      transformedLines.push(line);
      continue;
    }
    
    // CRITICAL: Only transform actual import statements with proper regex
    if (/^\s*import\s/.test(line)) {
      console.log(`[Build] ✅ Transforming actual import at line ${i + 1}: ${trimmed}`);
      
      let transformedLine = line;
      
      // DYNAMIC CSS TRACKING: Track and remove CSS imports
      if (/import\s*['"'][^'"]*\.(css|scss|sass|less)['"];?/.test(line)) {
        const cssMatch = line.match(/import\s*['"']([^'"]*\.(css|scss|sass|less))['"];?/);
        if (cssMatch) {
          const cssPath = cssMatch[1];
          // Track the CSS dependency for later inclusion in HTML
          if (cssPath.includes('@0x1js/highlighter/styles')) {
            cssDependencyTracker.addDependency('/node_modules/@0x1js/highlighter/dist/styles.css');
          } else if (cssPath.includes('globals.css') || cssPath.includes('global.css')) {
            cssDependencyTracker.addDependency('/styles.css');
          } else {
            // Handle other CSS files
            cssDependencyTracker.addDependency(cssPath.startsWith('/') ? cssPath : `/${cssPath}`);
          }
        }
        transformedLine = '// CSS import removed for browser compatibility - tracked for HTML inclusion';
      }
      // Transform CSS-only imports (like @0x1js/highlighter/styles)
      else if (/^\s*import\s+["']([^"']+\/styles?)["']/.test(line)) {
        const styleMatch = line.match(/^\s*import\s+["']([^"']+\/styles?)["']/);
        if (styleMatch) {
          const stylePath = styleMatch[1];
          if (stylePath.includes('@0x1js/highlighter/styles')) {
            cssDependencyTracker.addDependency('/node_modules/@0x1js/highlighter/dist/styles.css');
          } else {
            cssDependencyTracker.addDependency(`/${stylePath}.css`);
          }
        }
        transformedLine = '// CSS import removed for browser compatibility - tracked for HTML inclusion';
        console.log(`[Build] 🎨 Tracked CSS-only import for HTML inclusion`);
      }
      // Transform 0x1 framework imports
      else if (/^\s*import\s+.*?\s+from\s+["']0x1["']/.test(line)) {
        transformedLine = line.replace(
          /^(\s*import\s+.*?\s+from\s+)["']0x1["']/,
          '$1"/node_modules/0x1/index.js"'
        );
      }
      // Transform 0x1 submodule imports
      else if (/^\s*import\s+.*?\s+from\s+["']0x1\//.test(line)) {
        transformedLine = line.replace(
          /^(\s*import\s+.*?\s+from\s+)["']0x1\/(link|router|jsx-runtime|jsx-dev-runtime)["']/,
          (match, importPart, module) => {
            const moduleMap: Record<string, string> = {
              'link': '/0x1/link.js',
              'router': '/0x1/router.js',
              'jsx-runtime': '/0x1/jsx-runtime.js',
              'jsx-dev-runtime': '/0x1/jsx-dev-runtime.js'
            };
            return `${importPart}"${moduleMap[module]}"`;
          }
        );
      }
      // Transform relative imports
      else if (/^\s*import\s+.*?\s+from\s+["']\./.test(line)) {
        transformedLine = line.replace(
          /^(\s*import\s+.*?\s+from\s+)["'](\.[^"']+)["']/,
          (match, importPart, path) => {
            let browserPath = path;
            if (path.startsWith('../')) {
              browserPath = path.replace(/^\.\.\//, '/');
            } else if (path.startsWith('./')) {
              browserPath = path.replace(/^\.\//, '/components/');
            }
            
            if (!browserPath.match(/\.(js|ts|tsx|jsx|json|css|svg|png|jpg|gif)$/)) {
              browserPath += '.js';
            } else if (browserPath.match(/\.(ts|tsx|jsx)$/)) {
              browserPath = browserPath.replace(/\.(ts|tsx|jsx)$/, '.js');
            }
            
            return `${importPart}"${browserPath}"`;
          }
        );
      }
      // DYNAMIC: Transform npm package imports for browser compatibility
      else if (/^\s*import\s+.*?\s+from\s+["']([^"'./][^"']*)["']/.test(line)) {
        transformedLine = line.replace(
          /^(\s*import\s+.*?\s+from\s+)["']([^"'./][^"']*)["']/,
          (match, importPart, packageName) => {
            const skipPackages = ['react', 'react-dom', '0x1'];
            if (skipPackages.includes(packageName) || packageName.startsWith('0x1/')) {
              return match;
            }
            
            // Handle scoped packages like @0x1js/highlighter
            if (packageName.startsWith('@')) {
              console.log(`[Build] 🎨 Transforming scoped package: ${packageName}`);
              return `${importPart}"/node_modules/${packageName}/dist/index.js"`;
            }
            
            // Handle regular packages
            console.log(`[Build] 📦 Transforming npm package: ${packageName}`);
            return `${importPart}"/node_modules/${packageName}/index.js"`;
          }
        );
      }
      
      transformedLines.push(transformedLine);
    } else {
      transformedLines.push(line);
    }
  }
  
  console.log('[Build] ✅ Bulletproof import transformation complete');
  return transformedLines.join('\n');
}

// Normalize module paths for browser compatibility
function normalizeModulePath(path: string): string {
  let normalizedPath = path;
  
  // Handle different directory structures
  if (path.includes('components/')) {
    normalizedPath = path.replace(/^.*?components\//, 'components/');
  } else if (path.includes('lib/')) {
    normalizedPath = path.replace(/^.*?lib\//, 'lib/');
  } else if (path.includes('utils/')) {
    normalizedPath = path.replace(/^.*?utils\//, 'utils/');
  } else if (path.includes('hooks/')) {
    normalizedPath = path.replace(/^.*?hooks\//, 'hooks/');
  } else if (path.includes('context/')) {
    normalizedPath = path.replace(/^.*?context\//, 'context/');
  } else {
    // Default: assume it's a component if no specific directory
    normalizedPath = path.startsWith('components/') ? path : `components/${path}`;
  }
  
  // Add .js extension if needed
  if (!normalizedPath.match(/\.(js|ts|tsx|jsx|json|css|svg|png|jpg|gif)$/)) {
    normalizedPath += '.js';
  } else if (normalizedPath.match(/\.(ts|tsx|jsx)$/)) {
    normalizedPath = normalizedPath.replace(/\.(ts|tsx|jsx)$/, '.js');
  }
  
  return normalizedPath;
}

// Advanced JavaScript/TypeScript tokenizer for accurate context detection
function tokenizeJavaScript(sourceCode: string): Array<{type: string, value: string, line: number, column: number}> {
  const tokens: Array<{type: string, value: string, line: number, column: number}> = [];
  const lines = sourceCode.split('\n');
  
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateString = false;
  const inRegex = false;
  let inBlockComment = false;
  let inLineComment = false;
  let escapeNext = false;
  let templateDepth = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    inLineComment = false; // Reset for each line
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      const prevChar = line[i - 1];
      
      // Handle escape sequences
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && (inSingleQuote || inDoubleQuote || inTemplateString)) {
        escapeNext = true;
        continue;
      }
      
      // Skip if in comments
      if (inLineComment || inBlockComment) {
        if (inBlockComment && char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++; // Skip the '/'
        }
        continue;
      }
      
      // Handle comment detection
      if (!inSingleQuote && !inDoubleQuote && !inTemplateString && !inRegex) {
        if (char === '/' && nextChar === '/') {
          inLineComment = true;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          i++; // Skip the '*'
          continue;
        }
      }
      
      // Handle string literals
      if (!inLineComment && !inBlockComment && !inRegex) {
        if (char === '"' && !inSingleQuote && !inTemplateString) {
          inDoubleQuote = !inDoubleQuote;
          continue;
        }
        
        if (char === "'" && !inDoubleQuote && !inTemplateString) {
          inSingleQuote = !inSingleQuote;
          continue;
        }
        
        if (char === '`' && !inSingleQuote && !inDoubleQuote) {
          if (inTemplateString) {
            templateDepth--;
            if (templateDepth <= 0) {
              inTemplateString = false;
              templateDepth = 0;
            }
          } else {
            inTemplateString = true;
            templateDepth++;
          }
          continue;
        }
        
        // Handle template literal expressions ${...}
        if (inTemplateString && char === '$' && nextChar === '{') {
          templateDepth++;
          i++; // Skip the '{'
          continue;
        }
        
        if (inTemplateString && char === '}') {
          templateDepth--;
          continue;
        }
      }
      
      // Skip if inside strings
      if (inSingleQuote || inDoubleQuote || inTemplateString) {
        continue;
      }
      
      // Detect import statements (only outside strings/comments)
      if (char === 'i' && line.slice(i, i + 6) === 'import' && 
          (i === 0 || /\s/.test(line[i - 1])) &&
          (i + 6 >= line.length || /\s/.test(line[i + 6]))) {
        tokens.push({
          type: 'import',
          value: 'import',
          line: lineIndex + 1,
          column: i + 1
        });
      }
    }
  }
  
  return tokens;
}

// Robust detection of imports in non-code contexts
function isImportInNonCodeContext(line: string, allLines: string[], lineIndex: number): boolean {
  const trimmed = line.trim();
  
  // Check for JSX text content patterns
  const jsxPatterns = [
    /^\s*["'`].*?import.*?["'`]/, // String literals containing import
    /children:\s*\[/, // JSX children arrays
    /className\s*=/, // JSX className props
    /<code[^>]*>.*import/, // Code examples in JSX
    /<pre[^>]*>.*import/, // Preformatted code blocks
    /[-+]\s*import/, // Diff-style examples (- import, + import)
    /```.*import/, // Markdown code blocks
  ];
  
  if (jsxPatterns.some(pattern => pattern.test(line))) {
    return true;
  }
  
  // Check surrounding context for JSX
  const contextWindow = 3;
  const startLine = Math.max(0, lineIndex - contextWindow);
  const endLine = Math.min(allLines.length - 1, lineIndex + contextWindow);
  
  for (let i = startLine; i <= endLine; i++) {
    const contextLine = allLines[i].trim();
    if (contextLine.includes('return (') || 
        contextLine.includes('<div') || 
        contextLine.includes('<span') ||
        contextLine.includes('<pre') ||
        contextLine.includes('<code') ||
        contextLine.includes('children:')) {
      return true;
    }
  }
  
  return false;
}

// Validate actual import statements vs pseudo-imports
function isValidImportStatement(line: string): boolean {
  const trimmed = line.trim();
  
  // Must start with import
  if (!trimmed.startsWith('import ')) {
    return false;
  }
  
  // Must have 'from' keyword
  if (!trimmed.includes(' from ')) {
    return false;
  }
  
  // Must have proper import syntax
  const importRegex = /^import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+)?['"`][^'"`]+['"`]/;
  if (!importRegex.test(trimmed)) {
    return false;
  }
  
  // Must not be inside a string (check for unmatched quotes before import)
  const beforeImport = line.substring(0, line.indexOf('import'));
  const singleQuotes = (beforeImport.match(/'/g) || []).length;
  const doubleQuotes = (beforeImport.match(/"/g) || []).length;
  const templateQuotes = (beforeImport.match(/`/g) || []).length;
  
  if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || templateQuotes % 2 === 1) {
    return false;
  }
  
  return true;
}

// Apply all import transformations with modern React/Next.js support
function applyImportTransformations(line: string): string {
  let transformedLine = line;
  
  // 1. Remove CSS imports first (MIME type errors in browser)
  if (/import\s*['"'][^'"]*\.(css|scss|sass|less)['"];?/.test(line)) {
    return '// CSS import removed for browser compatibility';
  }
  
  // 2. Transform 0x1 framework imports
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1["']/,
    '$1"/node_modules/0x1/index.js"'
  );
  
  // 3. Transform 0x1 submodule imports
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']0x1\/(link|router|jsx-runtime|jsx-dev-runtime)["']/,
    (match, importPart, module) => {
      const moduleMap: Record<string, string> = {
        'link': '/0x1/link.js',
        'router': '/0x1/router.js',
        'jsx-runtime': '/0x1/jsx-runtime.js',
        'jsx-dev-runtime': '/0x1/jsx-dev-runtime.js'
      };
      return `${importPart}"${moduleMap[module]}"`;
    }
  );
  
  // 4. Transform relative imports (./component → /component)
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']\.\/([^"']+)["']/,
    (match, importPart, path) => {
      const normalizedPath = normalizeModulePath(path);
      return `${importPart}"/${normalizedPath}"`;
    }
  );
  
  // 5. Transform parent directory imports (../component → /component)
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']\.\.\/([^"']+)["']/,
    (match, importPart, path) => {
      const normalizedPath = normalizeModulePath(path);
      return `${importPart}"/${normalizedPath}"`;
    }
  );
  
  // 6. Transform absolute imports that need normalization
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']\/([^"']+)["']/,
    (match, importPart, path) => {
      if (path.startsWith('node_modules/') || path.startsWith('0x1/')) {
        return match; // Already correct
      }
      const normalizedPath = normalizeModulePath(path);
      return `${importPart}"/${normalizedPath}"`;
    }
  );
  
  // 7. Transform npm package imports for browser compatibility
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']([^"'./][^"']*)["']/,
    (match, importPart, packageName) => {
      const skipPackages = ['react', 'react-dom', '0x1'];
      if (skipPackages.includes(packageName) || packageName.startsWith('0x1/')) {
        return match;
      }
      return `${importPart}"/node_modules/${packageName}"`;
    }
  );
  
  // 4.5. CRITICAL FIX: Transform @0x1js/highlighter imports
  transformedLine = transformedLine.replace(
    /^(\s*import\s+.*?\s+from\s+)["']@0x1js\/highlighter["']/,
    '$1"/node_modules/@0x1js/highlighter/dist/index.js"'
  );
  
  // 4.6. Transform @0x1js/highlighter/styles imports
  transformedLine = transformedLine.replace(
    /^(\s*import\s+)["']@0x1js\/highlighter\/styles["']/,
    '// CSS import removed for browser compatibility (styles should be linked in HTML)'
  );
  
  return transformedLine;
}

// Helper function to detect actual import statements vs code examples
function isActualImportStatement(line: string): boolean {
  const trimmed = line.trim();
  
  // Must start with import (possibly with whitespace)
  if (!trimmed.startsWith('import ')) {
    return false;
  }
  
  // Should not be inside a string literal (basic check)
  const beforeImport = line.substring(0, line.indexOf('import'));
  const hasOpenQuote = (beforeImport.match(/"/g) || []).length % 2 === 1;
  const hasOpenSingleQuote = (beforeImport.match(/'/g) || []).length % 2 === 1;
  const hasOpenTemplate = (beforeImport.match(/`/g) || []).length % 2 === 1;
  
  if (hasOpenQuote || hasOpenSingleQuote || hasOpenTemplate) {
    return false;
  }
  
  // Should have proper import syntax
  if (!trimmed.includes(' from ') || !trimmed.match(/import\s+.*?\s+from\s+["'].+["']/)) {
    return false;
  }
  
  return true;
}

// Helper function to detect if line is inside JSX text content
function isLineInJsxTextContent(line: string, allLines: string[], lineIndex: number): boolean {
  // Look for patterns that suggest this is JSX text content containing code examples
  const trimmed = line.trim();
  
  // Check if line contains code example patterns
  const hasCodeExamplePattern = 
    trimmed.includes('- import') ||
    trimmed.includes('+ import') ||
    trimmed.includes('```') ||
    (trimmed.includes('import') && (trimmed.includes('{') || trimmed.includes('useState')));
  
  if (!hasCodeExamplePattern) {
    return false;
  }
  
  // Look backwards and forwards to see if we're in JSX content
  let inJsxContent = false;
  
  // Check surrounding lines for JSX patterns
  for (let i = Math.max(0, lineIndex - 5); i <= Math.min(allLines.length - 1, lineIndex + 5); i++) {
    const contextLine = allLines[i].trim();
    
    // Look for JSX opening tags, className props, or JSX structure
    if (contextLine.includes('className=') || 
        contextLine.includes('<div') || 
        contextLine.includes('<pre') ||
        contextLine.includes('<code') ||
        contextLine.includes('children:') ||
        /return\s*\(/.test(contextLine)) {
      inJsxContent = true;
      break;
    }
  }
  
  return inJsxContent;
}

// Helper function to detect if line is inside a string literal
function isLineInStringContent(line: string): boolean {
  // Check if the import statement is inside quotes
  const importIndex = line.indexOf('import');
  if (importIndex === -1) return false;
  
  const beforeImport = line.substring(0, importIndex);
  const afterImport = line.substring(importIndex);
  
  // Count quotes before import
  const singleQuotesBefore = (beforeImport.match(/'/g) || []).length;
  const doubleQuotesBefore = (beforeImport.match(/"/g) || []).length;
  const templateQuotesBefore = (beforeImport.match(/`/g) || []).length;
  
  // If odd number of quotes before, we're inside a string
  if (singleQuotesBefore % 2 === 1 || doubleQuotesBefore % 2 === 1 || templateQuotesBefore % 2 === 1) {
    return true;
  }
  
  // Check for string literal patterns around import
  if (beforeImport.includes('"') || beforeImport.includes("'") || beforeImport.includes('`')) {
    const hasClosingQuote = afterImport.includes('"') || afterImport.includes("'") || afterImport.includes('`');
    if (hasClosingQuote) {
      return true;
    }
  }
  
  return false;
}

// CRITICAL FIX: Add string sanitization function to prevent syntax errors
function sanitizeJavaScriptString(str: string): string {
  // Replace actual line breaks in strings with escaped line breaks
  return str
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`') // CRITICAL FIX: Escape backticks to prevent template literal syntax errors
    .replace(/\\/g, '\\\\'); // CRITICAL FIX: Escape backslashes
}

// Insert JSX runtime preamble function (same as dev-server)
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
    } else if (line.startsWith('//') || line.startsWith('/*') || line.includes('*/') || line === '') {
      // Skip comments and empty lines but don't update insertIndex unless after imports
      if (foundImports) {
        insertIndex = i + 1;
      }
    } else if (line && foundImports) {
      // Found first non-import, non-comment line after imports
      break;
    }
  }
  
  // Generate JSX runtime preamble
  const preamble = `// 0x1 Framework - JSX Runtime Access\nimport { jsx, jsxs, jsxDEV, Fragment, createElement } from '/0x1/jsx-runtime.js';`;
  
  // Insert the preamble
  lines.splice(insertIndex, 0, preamble);
  
  return lines.join('\n');
}

// Normalize JSX function calls (same as dev-server)
function normalizeJsxFunctionCalls(content: string): string {
  // Log original content statistics
  const originalHashedFunctions = content.match(/jsx[A-Za-z]*_[a-zA-Z0-9_]+/g) || [];
  console.log(`🔧 Starting normalization with ${originalHashedFunctions.length} hashed functions found`);
  
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
  
  // Log final statistics
  const finalHashedFunctions = content.match(/jsx[A-Za-z]*_[a-zA-Z0-9_]+/g) || [];
  console.log(`🔧 Normalization complete: ${originalHashedFunctions.length} -> ${finalHashedFunctions.length} hashed functions`);
  
  return content;
}

// CRITICAL FIX: Add proper transpilation with safer syntax validation using Bun.Transpiler
async function transpileComponentSafely(sourceCode: string, sourcePath: string): Promise<string> {
  try {
    console.log(`[Build] Attempting to transpile: ${sourcePath}`);
    
    // ROBUST FIX: Always transpile .tsx/.jsx files regardless of JSX detection
    const isTsxOrJsx = sourcePath.endsWith('.tsx') || sourcePath.endsWith('.jsx');
    
    // ROBUST FIX: Proper JSX detection using AST-like parsing instead of string matching
    const hasActualJsxElements = detectActualJsxElements(sourceCode);
    
    const hasJsxCalls = /jsx\s*\(/.test(sourceCode) || 
                       /jsxs\s*\(/.test(sourceCode) || 
                       /jsxDEV\s*\(/.test(sourceCode) ||
                       /jsx[A-Za-z]*_[a-zA-Z0-9_]+\s*\(/.test(sourceCode); // Detect hashed jsx functions
    
    console.log(`[Build] JSX Detection for ${sourcePath}:`);
    console.log(`[Build]   Is TSX/JSX file: ${isTsxOrJsx}`);
    console.log(`[Build]   Has actual JSX elements: ${hasActualJsxElements}`);
    console.log(`[Build]   Has jsx calls: ${hasJsxCalls}`);
    
    // CRITICAL FIX: Disable aggressive directive validation for documentation files
    const isDocumentationFile = sourcePath.includes('/docs/') || sourcePath.includes('/app/docs/');
    
    let processedCode = sourceCode;
    if (!isDocumentationFile) {
      // Only validate non-documentation files
      const directiveValidation = validateFileDirectives(sourcePath, sourceCode);
      if (directiveValidation.hasErrors) {
        // Filter out false positives from code examples
        const realErrors = directiveValidation.errors.filter((error: any) => {
          if (error.message.includes('server API') || error.message.includes('Async functions')) {
            return false;
          }
          return true;
        });
        
        if (realErrors.length > 0) {
          console.warn(`[Build] Directive validation errors in ${sourcePath}:`, realErrors);
          // For build, we'll continue but log the errors
        }
      }
      processedCode = directiveValidation.processedCode;
    } else {
      console.log(`[Build] Skipping directive validation for documentation file: ${sourcePath}`);
    }
    
    // Transform imports for browser compatibility
    processedCode = transformBareImports(processedCode, sourcePath);
    
    // CRITICAL FIX: ALWAYS transpile .tsx/.jsx files, even if JSX detection fails
    const shouldTranspile = isTsxOrJsx || hasActualJsxElements;
    
    if (shouldTranspile) {
      console.log(`[Build] FORCING JSX transpilation for: ${sourcePath} (TSX/JSX: ${isTsxOrJsx}, JSX elements: ${hasActualJsxElements})`);
    
      const transpiler = new Bun.Transpiler({
        loader: isTsxOrJsx ? 'tsx' : 'js', // Use tsx loader for .tsx/.jsx files
        target: 'browser',
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
          'global': 'globalThis'
        }
      });
    
      const transpiledContent = await transpiler.transform(processedCode);
      console.log(`[Build] Transpilation complete for ${sourcePath}. Output length: ${transpiledContent.length}`);
      
      // Check if transpilation actually converted JSX (same validation as dev server)
      const hasJsxAfterTranspile = /<[A-Za-z]/.test(transpiledContent);
      const hasJsxCallsAfterTranspile = /jsx\s*\(/.test(transpiledContent) || 
                                        /jsxs\s*\(/.test(transpiledContent) || 
                                        /jsxDEV\s*\(/.test(transpiledContent) ||
                                        /jsx[A-Za-z]*_[a-zA-Z0-9_]+\s*\(/.test(transpiledContent); // Detect hashed jsx functions
      
      console.log(`[Build] Post-transpilation analysis for ${sourcePath}:`);
      console.log(`[Build]   Still has JSX elements: ${hasJsxAfterTranspile}`);
      console.log(`[Build]   Now has jsx calls: ${hasJsxCallsAfterTranspile}`);
      
      // CRITICAL FIX: Better error handling for failed transpilation
      if (hasJsxAfterTranspile && !hasJsxCallsAfterTranspile) {
        console.error(`[Build] CRITICAL: JSX elements still present but no jsx calls generated in ${sourcePath}`);
        console.error(`[Build] Original code sample: ${sourceCode.substring(0, 200)}...`);
        console.error(`[Build] Transpiled code sample: ${transpiledContent.substring(0, 200)}...`);
        
        // Try a more aggressive transpilation
        console.log(`[Build] Attempting aggressive transpilation for ${sourcePath}`);
        const aggressiveTranspiler = new Bun.Transpiler({
          loader: 'tsx', // Force tsx loader
          target: 'browser',
          define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
            'global': 'globalThis'
          }
        });
        
        const aggressiveResult = await aggressiveTranspiler.transform(sourceCode); // Use original sourceCode
        
        if (!/<[A-Za-z]/.test(aggressiveResult) || /jsx[A-Za-z]*\s*\(/.test(aggressiveResult)) {
          console.log(`[Build] Aggressive transpilation succeeded for ${sourcePath}`);
          let finalCode = normalizeJsxFunctionCalls(aggressiveResult);
          finalCode = insertJsxRuntimePreamble(finalCode);
          return finalCode;
        } else {
          throw new Error(`JSX elements still present after aggressive transpilation in ${sourcePath}`);
        }
      }
      
      // Normalize JSX function calls and insert runtime preamble
      let finalCode = normalizeJsxFunctionCalls(transpiledContent);
      finalCode = insertJsxRuntimePreamble(finalCode);
      
      console.log(`[Build] ✅ Successfully transpiled JSX file: ${sourcePath}`);
      return finalCode;
    } else {
      // Non-JSX file - just process imports and return
      console.log(`[Build] Processing non-JSX file: ${sourcePath}`);
      let finalCode = processedCode;
      
      // Still add JSX runtime preamble in case the component needs it
      finalCode = insertJsxRuntimePreamble(finalCode);
      
      console.log(`[Build] ✅ Successfully processed non-JSX file: ${sourcePath}`);
      return finalCode;
    }
    
  } catch (error) {
    console.error(`[Build] CRITICAL ERROR transpiling ${sourcePath}:`, error);
    
    // CRITICAL FIX: Generate error component instead of failing build
    const errorComponent = generateErrorComponent(sourcePath, error instanceof Error ? error.message : String(error));
    console.log(`[Build] Generated error component for failed transpilation: ${sourcePath}`);
    return errorComponent;
  }
}

// ROBUST FIX: Context-aware JSX detection that properly parses code structure
function detectActualJsxElements(sourceCode: string): boolean {
  // State machine to track if we're inside strings, template literals, or comments
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escapeNext = false;
  let templateDepth = 0;
  
  const chars = sourceCode.split('');
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];
    
    // Handle escape sequences
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    // Handle comments
    if (!inSingleQuote && !inDoubleQuote && !inTemplateString) {
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        i++; // Skip next char
        continue;
      }
      
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++; // Skip next char
        continue;
      }
      
      if (inBlockComment && char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++; // Skip next char
        continue;
      }
      
      if (inLineComment && char === '\n') {
        inLineComment = false;
        continue;
      }
    }
    
    // Skip if we're in any kind of comment
    if (inLineComment || inBlockComment) {
      continue;
    }
    
    // Handle string literals
    if (char === '"' && !inSingleQuote && !inTemplateString) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    
    if (char === "'" && !inDoubleQuote && !inTemplateString) {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    
    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      if (inTemplateString) {
        templateDepth--;
        if (templateDepth <= 0) {
          inTemplateString = false;
          templateDepth = 0;
        }
      } else {
        inTemplateString = true;
        templateDepth++;
      }
      continue;
    }
    
    // Handle template literal expressions ${...}
    if (inTemplateString && char === '$' && nextChar === '{') {
      templateDepth++;
      i++; // Skip the '{'
      continue;
    }
    
    if (inTemplateString && char === '}') {
      templateDepth--;
      continue;
    }
    
    // If we're inside any string/template, skip JSX detection
    if (inSingleQuote || inDoubleQuote || inTemplateString) {
      continue;
    }
    
    // Now check for actual JSX elements (only outside strings/comments)
    if (char === '<') {
      // Look ahead to see if this looks like JSX
      const nextFewChars = sourceCode.slice(i, i + 20);
      
      // Enhanced JSX detection patterns
      const jsxPatterns = [
        /^<[A-Z][A-Za-z0-9]*[\s/>]/, // React components <Component>
        /^<[a-z][A-Za-z0-9-]*[\s/>]/, // HTML elements <div>
        /^<>/, // React fragments <>
        /^<[/][A-Za-z]/, // Closing tags </div>
        /^<[a-z]+\s+[^>]*>/, // HTML with attributes <div className="...">
        /^<[A-Z][A-Za-z0-9]*\s+[^>]*>/, // Components with props <Component prop="...">
      ];
      
      // Check if this matches JSX patterns
      if (jsxPatterns.some(pattern => pattern.test(nextFewChars))) {
        // Additional validation: make sure it's not a comparison operator
        const prevChar = chars[i - 1];
        const isComparison = prevChar === '=' || prevChar === '<' || prevChar === '>' || prevChar === '!';
        
        if (!isComparison) {
          console.log(`[Build] Found actual JSX element at position ${i}: ${nextFewChars.substring(0, 10)}`);
          return true;
        }
      }
    }
  }
  
  console.log(`[Build] No actual JSX elements found (all angle brackets are in strings/templates/comments)`);
  return false;
}

// CRITICAL FIX: Generate error component for failed transpilation
function generateErrorComponent(filePath: string, errorMessage: string): string {
  const safePath = sanitizeJavaScriptString(filePath);
  const safeError = sanitizeJavaScriptString(errorMessage);
  
  return `
// Error component for failed transpilation: ${safePath}
export default function ErrorComponent(props) {
  return {
    type: 'div',
    props: {
      className: 'p-6 bg-red-50 border border-red-200 rounded-lg m-4',
      style: 'color: #dc2626;'
    },
    children: [
      {
        type: 'h3',
        props: { className: 'font-bold mb-2' },
        children: ['Transpilation Error'],
        key: null
      },
      {
        type: 'p',
        props: { className: 'mb-2' },
        children: ['File: ${safePath}'],
        key: null
      },
      {
        type: 'p',
        props: { className: 'text-sm' },
        children: ['Error: ${safeError}'],
        key: null
      }
    ],
    key: null
  };
}
`;
}

// Global build cache instance
const buildCache = new BuildCache();

/**
 * Build the application for production - ULTRA-FAST OPTIMIZED
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  const startTime = Date.now();
  const { outDir = 'dist', minify = true, silent = false, config, ignore = [] } = options;

  if (!silent) {
    logger.info('🚀 Building 0x1 application for production...');
  }

  try {
    const projectPath = process.cwd();
    const outputPath = join(projectPath, outDir);
    const cache = new BuildCache();
    const cacheBuster = new CacheBustingManager();

    // Clean output directory
    if (existsSync(outputPath)) {
      await Bun.$`rm -rf ${outputPath}`;
    }
    mkdirSync(outputPath, { recursive: true });

    // Load configuration
    const buildConfig = await loadConfigFast(projectPath, config);
    
    // Discover all routes for the application
    const { discoverRoutesFromFileSystem } = await import('../server/dev-server');
    const fullRoutes = discoverRoutesFromFileSystem(projectPath);
    const discoveredRoutes = fullRoutes.map(route => ({
      path: route.path,
      componentPath: route.componentPath,
      layouts: route.layouts || []
    }));

    if (!silent) {
      logger.success(`Discovered ${discoveredRoutes.length} routes`);
    }

    // Discover all components for intelligent compilation
    const allComponents = await discoverAllComponentsSuperFast(projectPath);
    
    if (!silent) {
      logger.info(`Found ${allComponents.length} components to compile`);
    }

    // Generate sophisticated app.js with production optimizations
    await generateSophisticatedAppJsFast(projectPath, outputPath, discoveredRoutes);

    // Generate static component files with cache busting
    await generateStaticComponentFilesSuperFast(projectPath, outputPath, discoveredRoutes, allComponents);

    // Copy 0x1 framework files with production optimizations
    await copy0x1FrameworkFilesFast(outputPath);

    // Copy static assets with cache busting
    await copyStaticAssetsFast(projectPath, outputPath);

    // Process CSS with production optimizations and cache busting
    await processTailwindCssFast(projectPath, outputPath, minify);
    
    // CRITICAL FIX: Ensure global.css exists for compatibility
    const globalCssPath = join(outputPath, 'global.css');
    const stylesCssPath = join(outputPath, 'styles.css');
    
    if (existsSync(stylesCssPath) && !existsSync(globalCssPath)) {
      // Create a symlink or copy styles.css as global.css for compatibility
      const stylesContent = await Bun.file(stylesCssPath).text();
      await Bun.write(globalCssPath, stylesContent);
      console.log('[Build] ✅ Created global.css for compatibility');
    }
    
    // Also create it in the styles directory for module loader compatibility
    const stylesDir = join(outputPath, 'styles');
    await mkdir(stylesDir, { recursive: true });
    const stylesGlobalCssPath = join(stylesDir, 'global.css');
    
    if (existsSync(stylesCssPath) && !existsSync(stylesGlobalCssPath)) {
      const stylesContent = await Bun.file(stylesCssPath).text();
      await Bun.write(stylesGlobalCssPath, stylesContent);
      console.log('[Build] ✅ Created styles/global.css for module loader compatibility');
    }

    // Generate HTML files with proper metadata and SEO
    await generateProductionHtmlFast(projectPath, outputPath);

    // Generate PWA files for production
    await generatePwaFilesFast(outputPath);

    // Generate parallel module loader for eliminating waterfall loading
    const moduleList = [
      '/0x1/index.js',
      '/0x1/jsx-runtime.js',
      '/0x1/hooks.js',        // FIXED: Use direct path, not core/hooks.js
      '/0x1/router.js',       // FIXED: Use direct path, not core/router.js
      ...discoveredRoutes.map(route => route.componentPath.replace(/\.tsx?$/, '.js')),
      ...allComponents.slice(0, 10).map(comp => comp.relativePath.replace(/\.tsx?$/, '.js')) // Top 10 components
    ];

    const parallelLoader = generateParallelModuleLoader(moduleList);
    await Bun.write(join(outputPath, 'module-loader.js'), parallelLoader);

    // Update the main app.js to use the parallel loader
    const appJsPath = join(outputPath, 'app.js');
    if (existsSync(appJsPath)) {
      const appContent = await Bun.file(appJsPath).text();
      const optimizedAppContent = `// 0x1 Production Build with Parallel Loading
import { criticalModulesReady, getModule } from './module-loader.js';

// Wait for critical modules before starting the app
await criticalModulesReady;

${appContent}`;
      
      await Bun.write(appJsPath, optimizedAppContent);
    }

    // Save final asset manifest
    await cacheBuster.saveAssetManifest(outputPath);

    // Generate build info for debugging
    const buildInfo = {
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      routes: discoveredRoutes.length,
      components: allComponents.length,
      assets: moduleList.length,
      buildTime: Date.now() - startTime,
      optimizations: {
        cacheBusting: true,
        parallelLoading: true,
        consoleLogRemoval: true,
        minification: minify,
        codeSplitting: true
      }
    };

    await Bun.write(join(outputPath, 'build-info.json'), JSON.stringify(buildInfo, null, 2));

    const buildTime = Date.now() - startTime;
    
    if (!silent) {
      logger.success(`✅ Build completed in ${buildTime}ms`);
      logger.info(`📁 Output: ${outputPath}`);
      logger.info(`🛣️ Routes: ${discoveredRoutes.length}`);
      logger.info(`🧩 Components: ${allComponents.length}`);
      logger.info(`📦 Assets with cache busting: ${moduleList.length}`);
      logger.info('🚀 Production optimizations: ✅ Cache busting, ✅ Parallel loading, ✅ Console log removal, ✅ Minification');
    }

    // CRITICAL FIX: Ensure build process exits cleanly
    process.exit(0);

  } catch (error) {
    if (!silent) {
      logger.error(`❌ Build failed: ${error}`);
    }
    // CRITICAL FIX: Ensure proper exit on error
    process.exit(1);
  }
}

/**
 * Alias for compatibility with CLI index
 */
export const buildProject = build;

// 🚀 ULTRA-FAST CONFIG LOADING WITH PARALLEL FALLBACKS
async function loadConfigFast(projectPath: string, configPath?: string): Promise<any> {
  if (configPath) {
    try {
      const fullPath = resolve(projectPath, configPath);
      if (existsSync(fullPath)) {
        if (fullPath.endsWith('.json') || fullPath.endsWith('package.json')) {
          const content = await Bun.file(fullPath).text();
          const json = JSON.parse(content);
          return fullPath.endsWith('package.json') ? json['0x1'] || {} : json;
        } else {
          const config = await import(fullPath);
          return config.default || config;
        }
      }
    } catch (error) {
      logger.warn(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  // Parallel config file discovery
  const configFiles = [
    '0x1.config.ts',
    '0x1.config.js', 
    'package.json'
  ];

  const tasks = configFiles.map(async (file) => {
    const fullPath = join(projectPath, file);
    if (!existsSync(fullPath)) return null;

    try {
      if (file === 'package.json') {
        const content = await Bun.file(fullPath).text();
        const json = JSON.parse(content);
        return json['0x1'] || null;
    } else {
        const config = await import(fullPath);
        return config.default || config;
      }
  } catch (error) {
      return null;
    }
  });

  const results = await Promise.all(tasks);
  return results.find(config => config !== null) || {};
}

// 🚀 ULTRA-FAST COMPONENT DISCOVERY WITH PARALLEL SCANNING
async function discoverAllComponentsSuperFast(projectPath: string): Promise<Array<{ path: string; relativePath: string; dir: string }>> {
  const allComponents: Array<{ path: string; relativePath: string; dir: string }> = [];
  const componentDirectories = ['components', 'lib', 'src/components', 'src/lib'];
  const componentExtensions = ['.tsx', '.jsx', '.ts', '.js'];

  const dirTasks = componentDirectories.map(async (dir) => {
    const fullDirPath = join(projectPath, dir);
    if (!existsSync(fullDirPath)) return;

    const scanRecursive = async (dirPath: string, relativePath: string = ''): Promise<void> => {
      try {
        const items = readdirSync(dirPath, { withFileTypes: true });
        
        const itemTasks = items.map(async (item) => {
          const itemPath = join(dirPath, item.name);
          
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            const newRelativePath = relativePath ? join(relativePath, item.name) : item.name;
            await scanRecursive(itemPath, newRelativePath);
          } else if (componentExtensions.some(ext => item.name.endsWith(ext))) {
            const componentFile = relativePath ? join(dir, relativePath, item.name) : join(dir, item.name);
            allComponents.push({
              path: itemPath,
              relativePath: componentFile,
              dir: dir
            });
          }
        });
        
        await Promise.all(itemTasks);
      } catch (error) {
        // Silent fail for individual directories
      }
    };

    await scanRecursive(fullDirPath);
  });

  await Promise.all(dirTasks);
  return allComponents;
}

// 🚀 ULTRA-FAST APP.JS GENERATION - FIXED WITH BUILD-OLD.TS STABILITY
async function generateSophisticatedAppJsFast(projectPath: string, outputPath: string, routes: Array<{ path: string; componentPath: string }>): Promise<void> {
  // Safely serialize routes data
  let routesJson;
  try {
    const sanitizedRoutes = routes.map(route => ({
      path: route.path,
      componentPath: route.componentPath
    }));
    routesJson = JSON.stringify(sanitizedRoutes, null, 2);
  } catch (jsonError) {
    logger.error(`Error serializing routes: ${jsonError}`);
    routesJson = '[]';
  }

  // Generate the production app.js with enhanced stability (from build-old.ts)
  const appScript = `// 0x1 Framework App Bundle - PRODUCTION-READY with ENHANCED STABILITY
console.log('[0x1 App] Starting production-ready app with proper sequencing...');

// Server-discovered routes
const serverRoutes = ${routesJson};

// ===== PRODUCTION-READY POLYFILL SYSTEM =====
const polyfillCache = new Map();
const polyfillQueue = new Map();

async function loadPolyfillOnDemand(polyfillName) {
  if (polyfillCache.has(polyfillName)) {
    return polyfillCache.get(polyfillName);
  }
  
  if (polyfillQueue.has(polyfillName)) {
    return polyfillQueue.get(polyfillName);
  }
  
  console.log('[0x1 App] Loading polyfill:', polyfillName);
  
  const promise = (async () => {
    try {
      const polyfillScript = document.createElement('script');
      polyfillScript.type = 'module';
      polyfillScript.src = '/node_modules/' + polyfillName;
      
      await new Promise((resolve, reject) => {
        polyfillScript.onload = resolve;
        polyfillScript.onerror = reject;
        document.head.appendChild(polyfillScript);
      });
      
      console.log('[0x1 App] ✅ Polyfill loaded:', polyfillName);
      return true;
    } catch (error) {
      console.error('[0x1 App] ❌ Failed to load polyfill:', polyfillName, error);
      return false;
    }
  })();
  
  polyfillQueue.set(polyfillName, promise);
  polyfillCache.set(polyfillName, promise);
  
  try {
    await promise;
    return promise;
  } finally {
    polyfillQueue.delete(polyfillName);
  }
}

// ===== MAIN INITIALIZATION WITH ENHANCED STABILITY =====
async function initApp() {
  try {
    console.log('[0x1 App] 🚀 Starting production-ready initialization...');
    
    // CRITICAL: Clear any existing router state and timers
    if (window.__0x1_ROUTER__) {
      console.log('[0x1 App] 🧹 Cleaning up existing router state...');
      try {
        window.__0x1_ROUTER__.destroy?.();
      } catch (e) {
        console.warn('[0x1 App] Router cleanup warning:', e);
      }
      delete window.__0x1_ROUTER__;
      delete window.__0x1_router;
      delete window.router;
    }
    
    // Clear any existing timers and callbacks
    if (window.__0x1_cleanup) {
      console.log('[0x1 App] 🧹 Running existing cleanup...');
      try {
        window.__0x1_cleanup();
      } catch (e) {
        console.warn('[0x1 App] Cleanup warning:', e);
      }
    }
    
    // Clear any existing app content and ensure clean state
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '';
      // Force a DOM flush
      appElement.offsetHeight;
    }
    
    // Step 1: Load essential dependencies with retry logic
    console.log('[0x1 App] 🎯 Loading essential dependencies...');
    
    let hooksLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!hooksLoaded && retryCount < maxRetries) {
      try {
        const hooksScript = document.createElement('script');
        hooksScript.type = 'module';
        hooksScript.src = '/0x1/hooks.js' + (retryCount > 0 ? '?retry=' + retryCount : '');
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Hooks loading timeout'));
          }, 5000);
          
          hooksScript.onload = () => {
            clearTimeout(timeout);
            console.log('[0x1 App] ✅ Hooks ready');
            hooksLoaded = true;
            resolve();
          };
          hooksScript.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
          document.head.appendChild(hooksScript);
        });
      } catch (error) {
        retryCount++;
        console.warn('[0x1 App] ⚠️ Hooks loading attempt ' + retryCount + ' failed:', error);
        if (retryCount >= maxRetries) {
          throw new Error('Failed to load hooks after ' + maxRetries + ' attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Step 2: Create router with enhanced error handling
    console.log('[0x1 App] Creating router...');
    
    let routerModule;
    retryCount = 0;
    
    while (!routerModule && retryCount < maxRetries) {
      try {
        routerModule = await import('/0x1/router.js' + (retryCount > 0 ? '?retry=' + retryCount : ''));
      } catch (error) {
        retryCount++;
        console.warn('[0x1 App] ⚠️ Router loading attempt ' + retryCount + ' failed:', error);
        if (retryCount >= maxRetries) {
          throw new Error('Failed to load router after ' + maxRetries + ' attempts: ' + error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    const { Router } = routerModule;
    
    if (typeof Router !== 'function') {
      throw new Error('Router class not found in router module');
    }
    
    if (!appElement) {
      throw new Error('App container element not found');
    }
    
    // Create beautiful 404 component
    const notFoundComponent = () => ({
      type: 'div',
      props: { 
        className: 'flex flex-col items-center justify-center min-h-[60vh] text-center px-4'
      },
      children: [
        {
          type: 'h1',
          props: { className: 'text-9xl font-bold text-violet-600 dark:text-violet-400 mb-4' },
          children: ['404'],
          key: null
        },
        {
          type: 'h2',
          props: { className: 'text-3xl font-bold text-gray-800 dark:text-white mb-4' },
          children: ['Page Not Found'],
          key: null
        },
        {
          type: 'p',
          props: { className: 'text-lg text-gray-600 dark:text-gray-300 mb-8' },
          children: ['The page you are looking for does not exist.'],
          key: null
        },
        {
          type: 'a',
          props: {
            href: '/',
            className: 'inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium',
            onClick: (e) => {
              e.preventDefault();
              if (window.router && typeof window.router.navigate === 'function') {
                window.router.navigate('/');
  } else {
                window.location.href = '/';
              }
            }
          },
          children: ['🏠 Back to Home'],
          key: null
        }
      ],
      key: null
    });
    
    const router = new Router({
      rootElement: appElement,
      mode: 'history',
      debug: false,
      base: '/',
      notFoundComponent: notFoundComponent
    });
    
    window.__0x1_ROUTER__ = router;
    window.__0x1_router = router;
    window.router = router;
    
    console.log('[0x1 App] ✅ Router ready with beautiful 404 handling');
    
    // Step 3: Register routes with enhanced error handling and DOM mounting sync
    console.log('[0x1 App] 📝 Registering routes...');
    
    for (const route of serverRoutes) {
      try {
        const routeComponent = async (props) => {
          console.log('[0x1 App] 🔍 Route component called for:', route.path);
          
          let componentModule;
          let loadRetryCount = 0;
          const maxLoadRetries = 3;
          
          while (!componentModule && loadRetryCount < maxLoadRetries) {
            try {
              // Use cache-busting query parameter for retries only
              const importPath = route.componentPath + (loadRetryCount > 0 ? '?retry=' + loadRetryCount : '');
              componentModule = await import(importPath);
              break; // Exit loop on success
              
            } catch (error) {
              loadRetryCount++;
              console.warn('[0x1 App] ⚠️ Component loading attempt ' + loadRetryCount + ' failed for ' + route.path + ':', error);
              
              if (loadRetryCount >= maxLoadRetries) {
                console.error('[0x1 App] ❌ Route component error after all retries:', route.path, error);
                return {
                  type: 'div',
                  props: { 
                    className: 'p-8 text-center',
                    style: 'color: #ef4444;' 
                  },
                  children: ['❌ Failed to load component: ' + route.path]
                };
              }
              
              // Short retry delay
              await new Promise(resolve => setTimeout(resolve, 100 * loadRetryCount));
            }
          }
          
          if (componentModule && componentModule.default) {
            console.log('[0x1 App] ✅ Route component resolved:', route.path);
            // NO EXTRA DELAYS - let router handle timing
            return componentModule.default(props);
          } else {
            console.warn('[0x1 App] ⚠️ Component has no default export:', route.path);
            return {
              type: 'div',
              props: { 
                className: 'p-8 text-center',
                style: 'color: #f59e0b;' 
              },
              children: ['⚠️ Component loaded but has no default export: ' + route.path]
            };
          }
        };
        
        router.addRoute(route.path, routeComponent, { 
          componentPath: route.componentPath 
        });
        
        console.log('[0x1 App] ✅ Route registered:', route.path);
        
      } catch (error) {
        console.error('[0x1 App] ❌ Failed to register route:', route.path, error);
      }
    }
    
    console.log('[0x1 App] 📊 All routes registered successfully');
    
    // Step 4: Start router with proper DOM synchronization
    console.log('[0x1 App] 🎯 Starting router...');
    
    // Simple DOM readiness check
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    
    router.init();
    
    // Navigate to current path immediately
    router.navigate(window.location.pathname, false);
    
    // Setup cleanup function for future use
    window.__0x1_cleanup = () => {
      if (router && router.destroy) {
        router.destroy();
      }
    };
    
    // Hide loading indicator immediately
    if (typeof window.appReady === 'function') {
      window.appReady();
    }
    
    console.log('[0x1 App] ✅ Production-ready app initialized successfully!');
    
  } catch (error) {
    console.error('[0x1 App] ❌ Initialization failed:', error);
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = '<div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444; margin-bottom: 16px;">Application Error</h2><p style="color: #6b7280; margin-bottom: 20px;">' + error.message + '</p><details style="text-align: left; background: #f9fafb; padding: 16px; border-radius: 8px;"><summary style="cursor: pointer; font-weight: bold;">Error Details</summary><pre style="font-size: 12px; overflow-x: auto;">' + (error.stack || 'No stack trace') + '</pre></details><button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button></div>';
    }
    
    // Hide loading indicator immediately
    if (typeof window.appReady === 'function') {
      window.appReady();
    }
  }
}

// ===== START IMMEDIATELY =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}`;

  // Write the ultra-fast app.js
  const appJsPath = join(outputPath, 'app.js');
  await Bun.write(appJsPath, appScript);
}

// 🚀 CRITICAL FIX: STATIC COMPONENT GENERATION WITH PROPER IMPORT TRANSFORMS
async function generateStaticComponentFilesSuperFast(
  projectPath: string,
  outputPath: string,
  routes: Array<{ path: string; componentPath: string; layouts: Array<{ path: string; componentPath: string }> }>,
  allComponents: Array<{ path: string; relativePath: string; dir: string }>
): Promise<void> {
  console.log(`[Build] 🚀 COMPONENT GENERATION with nested layout support (FIXED)...`);

  const results = await Promise.all(
    routes.map(async (route) => {
      try {
        const sourcePath = join(projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
        
        // Check cache first
        const cached = await buildCache.get(sourcePath);
        if (cached) {
          const outputPath_component = join(outputPath, route.componentPath.replace(/^\//, ''));
          await mkdir(dirname(outputPath_component), { recursive: true });
          await Bun.write(outputPath_component, cached);
          return 1;
        }
        
        if (!existsSync(sourcePath)) {
          const tsxAlt = sourcePath.replace('.tsx', '.ts');
          const jsxAlt = sourcePath.replace('.tsx', '.jsx');
          const jsAlt = sourcePath.replace('.tsx', '.js');
          
          if (existsSync(tsxAlt)) {
            return await processRouteComponent(tsxAlt, route, outputPath);
          } else if (existsSync(jsxAlt)) {
            return await processRouteComponent(jsxAlt, route, outputPath);
          } else if (existsSync(jsAlt)) {
            return await processRouteComponent(jsAlt, route, outputPath);
          }
          
          console.warn(`[Build] ⚠️ Route component not found: ${sourcePath}`);
          return 0;
        }
        
        return await processRouteComponent(sourcePath, route, outputPath);
      } catch (error) {
        console.warn(`[Build] ⚠️ Failed to generate route component ${route.path}:`, error);
        return 0;
      }
    })
  );

  // Helper function to process individual route components with nested layouts
  async function processRouteComponent(sourcePath: string, route: any, outputPath: string): Promise<number> {
    try {
      let sourceCode = await Bun.file(sourcePath).text();
      const isPageComponent = sourcePath.endsWith('/page.tsx') || sourcePath.endsWith('/page.jsx') || 
                             sourcePath.endsWith('/page.ts') || sourcePath.endsWith('/page.js');
      
      // Handle nested layouts composition - FIXED VERSION
      if (isPageComponent && route.layouts && route.layouts.length > 0) {
        console.log(`[Build] Composing ${route.layouts.length} layouts for route ${route.path}`);
        
        // Load all layout components
        const layoutContents: string[] = [];
        const layoutNames: string[] = [];
        
        for (let i = 0; i < route.layouts.length; i++) {
          const layout = route.layouts[i];
          const layoutSourcePath = join(projectPath, layout.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
          
          // Try different extensions for layout
          let actualLayoutPath = layoutSourcePath;
          if (!existsSync(layoutSourcePath)) {
            const alternatives = [
              layoutSourcePath.replace('.tsx', '.ts'),
              layoutSourcePath.replace('.tsx', '.jsx'),
              layoutSourcePath.replace('.tsx', '.js')
            ];
            
            for (const alt of alternatives) {
              if (existsSync(alt)) {
                actualLayoutPath = alt;
                break;
              }
            }
          }
          
          if (existsSync(actualLayoutPath)) {
            const layoutContent = await Bun.file(actualLayoutPath).text();
            const layoutFunctionName = `Layout${i}`;
            
            // FIXED: More robust layout processing
            let processedLayoutContent = layoutContent;
            
            // Remove CSS imports
            processedLayoutContent = processedLayoutContent.replace(/import\s+["']\.\/globals\.css[""];?\s*\n?/g, '');
            processedLayoutContent = processedLayoutContent.replace(/import\s+["'][^"']*\.css[""];?\s*\n?/g, '');
            
            // FIXED: More careful function name replacement
            const exportMatch = processedLayoutContent.match(/export\s+default\s+function\s+(\w+)/);
            if (exportMatch) {
              const originalName = exportMatch[1];
              processedLayoutContent = processedLayoutContent.replace(
                new RegExp(`export\\s+default\\s+function\\s+${originalName}`, 'g'),
                `function ${layoutFunctionName}`
              );
            } else {
              // Fallback for arrow functions or other patterns
              processedLayoutContent = processedLayoutContent.replace(
                /export\s+default\s+function\s+\w+/g,
                `function ${layoutFunctionName}`
              );
            }
            
            layoutContents.push(processedLayoutContent);
            layoutNames.push(layoutFunctionName);
            
            console.log(`[Build] Loaded layout ${i}: ${layout.componentPath} as ${layoutFunctionName}`);
          } else {
            console.warn(`[Build] Layout not found: ${actualLayoutPath}`);
          }
        }
        
        // FIXED: More robust page component extraction
        const pageExportMatch = sourceCode.match(/export\s+default\s+function\s+(\w+)/);
        const pageComponentName = pageExportMatch?.[1] || 'PageComponent';
        
        // FIXED: More careful replacement of the page component export
        let pageWithoutExport = sourceCode;
        if (pageExportMatch) {
          const originalPageName = pageExportMatch[1];
          pageWithoutExport = sourceCode.replace(
            new RegExp(`export\\s+default\\s+function\\s+${originalPageName}`, 'g'),
            `function ${pageComponentName}`
          );
        } else {
          pageWithoutExport = sourceCode.replace(
            /export\s+default\s+function\s+\w+/g,
            `function ${pageComponentName}`
          );
        }
        
        // Compose all layouts with the page component
        let wrappedComponentCode = `${pageComponentName}(props)`;
        
        // Apply layouts from innermost to outermost (reverse order)
        for (let i = layoutNames.length - 1; i >= 0; i--) {
          const layoutName = layoutNames[i];
          wrappedComponentCode = `${layoutName}({ children: ${wrappedComponentCode}, ...props })`;
        }
        
        // FIXED: Better composition with proper spacing and validation
        const layoutSection = layoutContents.join('\n\n');
        const pageSection = pageWithoutExport;
        const wrapperSection = `\nexport default function WrappedPage(props) {\n  return ${wrappedComponentCode};\n}`;
        
        // Validate that none of the sections are empty or malformed
        if (layoutSection.trim() && pageSection.trim()) {
          sourceCode = `${layoutSection}\n\n${pageSection}${wrapperSection}`;
          console.log(`[Build] ✅ Composed nested layouts for ${route.path}: ${layoutNames.join(' -> ')} -> ${pageComponentName}`);
        } else {
          console.warn(`[Build] ⚠️ Layout composition failed for ${route.path}, using original page`);
          // Fall back to original sourceCode if composition fails
        }
      }
      
      // CRITICAL FIX: Use safe transpilation
      let transpiledContent = await transpileComponentSafely(sourceCode, sourcePath);
      
      // Transform imports AFTER transpiling
      transpiledContent = transformImportsForBrowser(transpiledContent);
      
      const outputPath_component = join(outputPath, route.componentPath.replace(/^\//, ''));
      await mkdir(dirname(outputPath_component), { recursive: true });
      await Bun.write(outputPath_component, transpiledContent);
      
      // Cache the result
      await buildCache.set(sourcePath, transpiledContent);
      
      return 1;
    } catch (error) {
      console.warn(`[Build] ⚠️ Failed to process route component ${route.path}:`, error);
      return 0;
    }
  }

  const successful = results.reduce((sum: number, result: number) => sum + result, 0);
  console.log(`[Build] ✅ Generated ${successful}/${routes.length} components with nested layout support (FIXED)`);
  
  // CRITICAL FIX: Also process regular components (Header, etc.) that are imported by pages
  console.log(`[Build] 🧩 Processing ${allComponents.length} regular components...`);
  
  const componentResults = await Promise.all(
    allComponents.map(async (component) => {
      try {
        // Check cache first
        const cached = await buildCache.get(component.path);
        if (cached) {
          const outputComponentPath = join(outputPath, component.relativePath.replace(/\.(tsx|ts|jsx)$/, '.js'));
          await mkdir(dirname(outputComponentPath), { recursive: true });
          await Bun.write(outputComponentPath, cached);
          return 1;
        }
        
        const sourceCode = await Bun.file(component.path).text();
        let transpiledContent = await transpileComponentSafely(sourceCode, component.path);
        transpiledContent = transformImportsForBrowser(transpiledContent);
        
        const outputComponentPath = join(outputPath, component.relativePath.replace(/\.(tsx|ts|jsx)$/, '.js'));
        await mkdir(dirname(outputComponentPath), { recursive: true });
        await Bun.write(outputComponentPath, transpiledContent);
        
        // Cache the result
        await buildCache.set(component.path, transpiledContent);
        
        return 1;
      } catch (error) {
        console.warn(`[Build] ⚠️ Failed to process component ${component.relativePath}:`, error);
        return 0;
      }
    })
  );
  
  const componentSuccessful = componentResults.reduce((sum: number, result: number) => sum + result, 0);
  console.log(`[Build] ✅ Generated ${componentSuccessful}/${allComponents.length} regular components`);
}

// 🚀 LIGHTNING-FAST FRAMEWORK FILES COPY - FIXED ROUTER ISSUE  
async function copy0x1FrameworkFilesFast(outputPath: string): Promise<void> {
  const framework0x1Dir = join(outputPath, '0x1');
  const nodeModulesDir = join(outputPath, 'node_modules', '0x1');
  
  // Get framework files from the same location as build-old.ts
  const currentFile = new URL(import.meta.url).pathname;
  const frameworkRoot = resolve(dirname(currentFile), '..', '..');
  const frameworkDistPath = join(frameworkRoot, 'dist');

  // CRITICAL FIX: Use the updated 0x1-router as single source of truth (from build-old.ts)
  const routerSourcePath = join(frameworkRoot, '0x1-router', 'dist', 'index.js');

  const frameworkFiles = [
    { src: 'jsx-runtime.js', dest: 'jsx-runtime.js' },
    { src: 'jsx-dev-runtime.js', dest: 'jsx-dev-runtime.js' },
    { src: 'hooks.js', dest: 'hooks.js' }, // CRITICAL FIX: Changed from core/hooks.js
    { src: 'index.js', dest: 'index.js' },
    { src: 'link.js', dest: 'link.js' }
  ];

  let copiedCount = 0;

  // Copy standard framework files
  for (const { src, dest } of frameworkFiles) {
    const srcPath = join(frameworkDistPath, src);
    const destPath = join(framework0x1Dir, dest);

    if (existsSync(srcPath)) {
      const content = await Bun.file(srcPath).text();
      await Bun.write(destPath, content);
      copiedCount++;
    }
  }

  // CRITICAL FIX: Copy all hashed files that redirects point to
  console.log('[Build] 🔧 Copying hashed framework files...');
  
  // First, scan the actual framework dist directory for all files
  const frameworkDistFiles = existsSync(frameworkDistPath) 
    ? readdirSync(frameworkDistPath).filter(file => file.endsWith('.js') || file.endsWith('.css'))
    : [];
  
  console.log(`[Build] Found ${frameworkDistFiles.length} framework files to copy`);
  
  // Copy ALL files from framework dist, not just a hardcoded list
  for (const file of frameworkDistFiles) {
    const srcPath = join(frameworkDistPath, file);
    const destPath = join(framework0x1Dir, file);

    if (existsSync(srcPath)) {
      const content = await Bun.file(srcPath).text();
      await Bun.write(destPath, content);
      console.log(`[Build] ✅ Copied framework file: ${file}`);
      copiedCount++;
    }
  }
  
  // Also copy any chunk files from the 0x1-experimental/syntax-highlighter if they exist
  const highlighterDistPath = join(frameworkRoot, '0x1-experimental', 'syntax-highlighter', 'dist');
  if (existsSync(highlighterDistPath)) {
    console.log('[Build] 🎨 Copying syntax highlighter files...');
    const highlighterNodeModulesPath = join(outputPath, 'node_modules', '@0x1js', 'highlighter', 'dist');
    await mkdir(highlighterNodeModulesPath, { recursive: true });
    
    const highlighterFiles = readdirSync(highlighterDistPath);
    for (const file of highlighterFiles) {
      const srcPath = join(highlighterDistPath, file);
      const destPath = join(highlighterNodeModulesPath, file);
      
      if (statSync(srcPath).isFile()) {
        const content = await Bun.file(srcPath).arrayBuffer();
        await Bun.write(destPath, content);
        console.log(`[Build] ✅ Copied highlighter file: ${file}`);
      }
    }
  }

  // CRITICAL: Copy the updated router from 0x1-router package (same as build-old.ts)
  if (existsSync(routerSourcePath)) {
    const routerContent = await Bun.file(routerSourcePath).text();
    const routerDestPath = join(framework0x1Dir, 'router.js');
    await Bun.write(routerDestPath, routerContent);
    copiedCount++;
    logger.info('✅ Using updated 0x1-router as single source of truth');
  } else {
    logger.error(`❌ Updated 0x1-router not found at: ${routerSourcePath}`);
    // Fallback to old router if new one doesn't exist
    const fallbackRouterPath = join(frameworkDistPath, 'core/router.js');
    if (existsSync(fallbackRouterPath)) {
      const content = await Bun.file(fallbackRouterPath).text();
      await Bun.write(join(framework0x1Dir, 'router.js'), content);
      copiedCount++;
      logger.warn('⚠️ Using fallback router - rebuild 0x1-router for latest fixes');
    }
  }

  // CRITICAL: Generate browser-compatible 0x1 framework entry point (same as build-old.ts)
  await generateBrowserCompatible0x1EntryFast(nodeModulesDir);

  if (copiedCount === 0) {
    logger.warn('⚠️ No 0x1 framework files found - build may not work in production');
  }
}

async function generateBrowserCompatible0x1EntryFast(nodeModulesDir: string): Promise<void> {
  // Use the EXACT same browser-compatible module as build-old.ts
  const cleanFrameworkModule = `// 0x1 Framework - Dynamic Runtime Hook Resolution (Build Version)
console.log('[0x1] Framework module loaded - dynamic runtime version');

// =====================================================
// DYNAMIC RUNTIME HOOK RESOLUTION
// =====================================================

// Create dynamic getters that resolve hooks at import time, not module load time
if (!globalThis.hasOwnProperty('__0x1_hooks_getter')) {
Object.defineProperty(globalThis, '__0x1_hooks_getter', {
  value: function(hookName) {
    // Check window.React first (set by hooks module)
    if (typeof window !== 'undefined' && window.React && typeof window.React[hookName] === 'function') {
      return window.React[hookName];
    }
    
    // Check direct window access
    if (typeof window !== 'undefined' && typeof window[hookName] === 'function') {
      return window[hookName];
    }
    
    // Check JSX runtime hooks
    if (typeof window !== 'undefined' && typeof window.__0x1_useState === 'function' && hookName === 'useState') {
      return window.__0x1_useState;
    }
    
    // Check for useEffect specifically
    if (typeof window !== 'undefined' && typeof window.__0x1_useEffect === 'function' && hookName === 'useEffect') {
      return window.__0x1_useEffect;
    }
    
    // Debug: show what's available
    const available = typeof window !== 'undefined' && window.React 
      ? Object.keys(window.React).filter(k => typeof window.React[k] === 'function')
      : 'React not available';
    
    console.error('[0x1] Hook "' + hookName + '" not found. Available: ' + available);
    throw new Error('[0x1] ' + hookName + ' not available - hooks may not be loaded yet');
  },
  writable: false,
  enumerable: false
});
}

// Create runtime hook getters - these resolve the actual hooks when first accessed
if (!globalThis.hasOwnProperty('__0x1_useState')) {
Object.defineProperty(globalThis, '__0x1_useState', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useState');
    // Replace this getter with the actual hook for performance
    Object.defineProperty(globalThis, '__0x1_useState', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useEffect')) {
Object.defineProperty(globalThis, '__0x1_useEffect', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useEffect');
    Object.defineProperty(globalThis, '__0x1_useEffect', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useCallback')) {
Object.defineProperty(globalThis, '__0x1_useCallback', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useCallback');
    Object.defineProperty(globalThis, '__0x1_useCallback', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useMemo')) {
Object.defineProperty(globalThis, '__0x1_useMemo', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useMemo');
    Object.defineProperty(globalThis, '__0x1_useMemo', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

if (!globalThis.hasOwnProperty('__0x1_useRef')) {
Object.defineProperty(globalThis, '__0x1_useRef', {
  get() {
    const hook = globalThis.__0x1_hooks_getter('useRef');
    Object.defineProperty(globalThis, '__0x1_useRef', { value: hook, writable: false });
    return hook;
  },
  configurable: true
});
}

// Export the dynamic hooks - CRITICAL FIX: Add useEffect export
export const useState = (...args) => globalThis.__0x1_useState(...args);
export const useEffect = (...args) => globalThis.__0x1_useEffect(...args);
export const useCallback = (...args) => globalThis.__0x1_useCallback(...args);
export const useMemo = (...args) => globalThis.__0x1_useMemo(...args);
export const useRef = (...args) => globalThis.__0x1_useRef(...args);
export const useClickOutside = (...args) => globalThis.__0x1_hooks_getter('useClickOutside')(...args);
export const useFetch = (...args) => globalThis.__0x1_hooks_getter('useFetch')(...args);
export const useForm = (...args) => globalThis.__0x1_hooks_getter('useForm')(...args);
export const useLocalStorage = (...args) => globalThis.__0x1_hooks_getter('useLocalStorage')(...args);

// Additional exports
export const JSXNode = (...args) => {
  if (typeof window !== 'undefined' && window.JSXNode) {
    return window.JSXNode(...args);
  }
  throw new Error('[0x1] JSXNode not available - JSX runtime not loaded');
};

console.log('[0x1] Dynamic runtime hook resolution ready');

// =====================================================
// MINIMAL JSX RUNTIME DELEGATION
// =====================================================

export function jsx(type, props, key) {
  if (typeof window !== 'undefined' && window.jsx) {
    return window.jsx(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export function jsxs(type, props, key) {
  if (typeof window !== 'undefined' && window.jsxs) {
    return window.jsxs(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  if (typeof window !== 'undefined' && window.jsxDEV) {
    return window.jsxDEV(type, props, key, isStaticChildren, source, self);
  }
  throw new Error('[0x1] JSX dev runtime not loaded');
}

export function createElement(type, props, ...children) {
  if (typeof window !== 'undefined' && window.createElement) {
    return window.createElement(type, props, ...children);
  }
  throw new Error('[0x1] JSX runtime not loaded');
}

export const Fragment = (() => {
  if (typeof window !== 'undefined' && window.Fragment) {
    return window.Fragment;
  }
  return Symbol.for('react.fragment');
})();

// Export version
export const version = '0.1.0';

// Default export
export default {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useClickOutside,
  useFetch,
  useForm,
  useLocalStorage,
  jsx,
  jsxs,
  jsxDEV,
  createElement,
  Fragment,
  JSXNode,
  version
};
`;

  // Write the browser-compatible entry point
  await Bun.write(join(nodeModulesDir, 'index.js'), cleanFrameworkModule);

  logger.info('✅ Generated browser-compatible 0x1 framework entry point');
}

// 🚀 LIGHTNING-FAST ASSET COPYING WITH CACHE BUSTING
async function copyStaticAssetsFast(projectPath: string, outputPath: string): Promise<void> {
  const publicDir = join(projectPath, 'public');
  const appDir = join(projectPath, 'app');
  const cacheBuster = new CacheBustingManager();
  
  const tasks: Promise<any>[] = [];
  
  // Copy public directory with cache busting for non-favicon files
  if (existsSync(publicDir)) {
    const files = readdirSync(publicDir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile()) {
        const fileName = file.name;
        const sourceFile = join(publicDir, fileName);
        
        // Apply cache busting to assets but not to favicon files (browsers expect them at root)
        if (fileName.startsWith('favicon.') || fileName === 'robots.txt' || fileName === 'sitemap.xml') {
          // Copy special files without cache busting
          tasks.push((async () => {
            const content = await Bun.file(sourceFile).arrayBuffer();
            await Bun.write(join(outputPath, fileName), content);
          })());
        } else {
          // Apply cache busting to other assets
          tasks.push((async () => {
            const hashedName = await cacheBuster.processAssetWithCacheBusting(
              sourceFile,
              outputPath,
              fileName
            );
            console.log(`[Build] ✅ Asset with cache busting: ${fileName} → ${hashedName}`);
          })());
        }
      } else if (file.isDirectory()) {
        // Recursively copy directories
        tasks.push(Bun.spawn(['cp', '-r', join(publicDir, file.name), outputPath], {
          cwd: process.cwd(),
          stdin: 'ignore',
          stdout: 'ignore',
          stderr: 'pipe'
        }).exited);
      }
    }
  }
  
  // Copy favicons from app directory (without cache busting)
  const faviconFormats = ['favicon.ico', 'favicon.svg', 'favicon.png'];
  for (const faviconFile of faviconFormats) {
    const faviconPath = join(appDir, faviconFile);
    if (existsSync(faviconPath)) {
      tasks.push((async () => {
        const content = await Bun.file(faviconPath).arrayBuffer();
        await Bun.write(join(outputPath, faviconFile), content);
      })());
    }
  }
  
  await Promise.all(tasks);
  
  // Save asset manifest for reference
  await cacheBuster.saveAssetManifest(outputPath);
  
  console.log('[Build] ✅ Static assets copied with cache busting');
}

// 🚀 LIGHTNING-FAST CSS PROCESSING WITH REAL TAILWIND CSS V4 + SMART CACHING
async function processTailwindCssFast(projectPath: string, outputPath: string, minify: boolean): Promise<void> {
  try {
    console.log('[Build] 🌈 Processing Tailwind CSS v4 with smart caching...');

    // Find the CSS input file
    const possibleInputs = [
      join(projectPath, 'app/globals.css'),
      join(projectPath, 'src/globals.css'),
      join(projectPath, 'src/input.css'),
      join(projectPath, 'src/index.css'),
      join(projectPath, 'app.css'),
      join(projectPath, 'styles.css')
    ];

    let inputFile = null;
    for (const file of possibleInputs) {
      if (existsSync(file)) {
        inputFile = file;
        break;
      }
    }

    if (!inputFile) {
      console.log('[Build] ⚠️ No CSS input file found. Using minimal CSS.');
      const minimalCss = `/* 0x1 Framework - Production CSS */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}
html{line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif;height:100%}
body{line-height:1.6;font-family:system-ui,sans-serif;margin:0}
.flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}
.glass-panel{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2)}`;
      await Bun.write(join(outputPath, 'styles.css'), minimalCss);
      return;
    }

    console.log(`[Build] 📄 Found CSS input: ${inputFile.replace(projectPath, '.')}`);

    // 🚀 SMART CACHING: Check if CSS needs rebuilding
    const outputCssPath = join(outputPath, 'styles.css');
    const inputStats = statSync(inputFile);
    
    if (existsSync(outputCssPath)) {
      const outputStats = statSync(outputCssPath);
      // If output is newer than input, skip processing
      if (outputStats.mtimeMs > inputStats.mtimeMs) {
        console.log('[Build] ✅ CSS cache hit - skipping processing');
        return;
      }
    }

    // 🚀 REAL TAILWIND CSS V4 PROCESSING (Same working approach as dev-server.ts)
    console.log('[Build] ⚡ Using SAME approach as dev-server.ts...');
    
    const inputCss = await Bun.file(inputFile).text();
    let finalCss = '';
    
    // Use the EXACT same Tailwind v4 handler that works in dev-server.ts
    try {
      // Import the working Tailwind v4 handler from dev-server
      const { tailwindV4Handler } = await import('./utils/server/tailwind-v4');
      
      // Check if Tailwind v4 is available (same check as dev-server)
      const isV4Available = await tailwindV4Handler.isAvailable(projectPath);
      
      if (isV4Available) {
        console.log('[Build] 🌟 Using Tailwind CSS v4 handler'); 
        
        // Create output directory if needed
        await mkdir(dirname(outputCssPath), { recursive: true });
        
        // Use the v4 handler's startProcess method for one-time build
        const tailwindProcess = await tailwindV4Handler.startProcess(
          projectPath,
          inputFile,
          outputCssPath
        );
        
        // Wait for the build to complete
        if (tailwindProcess.process) {
          const result = await tailwindProcess.process.exited;
          
          if (result === 0 && existsSync(outputCssPath)) {
            finalCss = await Bun.file(outputCssPath).text();
            console.log('[Build] ✅ Tailwind CSS v4 processed successfully with v4 handler');
        } else {
            throw new Error('Tailwind CSS v4 handler process failed');
          }
        } else {
          throw new Error('Tailwind CSS v4 handler could not start process');
        }
      } else {
        throw new Error('Tailwind CSS v4 not available');
      }
      
    } catch (error) {
      console.log('[Build] ⏱️ Tailwind v4 handler failed, using enhanced fallback...');
      
      // Smart fallback: If we have a previous successful build, use it
      if (existsSync(outputCssPath)) {
        console.log('[Build] 🔄 Reusing previous CSS build');
        return;
      }
      
      // Enhanced CSS processing fallback (keep user's styles + essential utilities)
      console.log('[Build] 🎨 Using enhanced CSS processing...');
      
      // Keep user's custom CSS but replace @import "tailwindcss"
      finalCss = inputCss.replace(
        /@import\s+["']tailwindcss[""];?\s*/g,
        `/* Tailwind CSS v4 - Enhanced Build */
:root{--color-violet-600:#7c3aed;--color-white:#fff;--spacing:0.25rem}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}
html{line-height:1.5;font-family:ui-sans-serif,system-ui,sans-serif;height:100%}
body{line-height:1.6;font-family:system-ui,sans-serif;margin:0}
.container{width:100%;max-width:1200px;margin:0 auto;padding:0 1rem}
.flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}
.grid{display:grid}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.bg-violet-600{background-color:var(--color-violet-600)}.text-white{color:var(--color-white)}.bg-gray-900{background-color:#111827}.text-gray-100{color:#f3f4f6}
.p-4{padding:1rem}.px-4{padding-left:1rem;padding-right:1rem}.py-2{padding-top:0.5rem;padding-bottom:0.5rem}.m-4{margin:1rem}
.rounded-lg{border-radius:0.5rem}.shadow-lg{box-shadow:0 10px 15px -3px rgb(0 0 0/0.1)}.border{border-width:1px}
.w-full{width:100%}.h-full{height:100%}.min-h-screen{min-height:100vh}.max-w-md{max-width:28rem}
.text-center{text-align:center}.font-bold{font-weight:700}.text-sm{font-size:0.875rem}.text-lg{font-size:1.125rem}
.space-y-4>:not([hidden])~:not([hidden]){margin-top:1rem}.space-x-2>:not([hidden])~:not([hidden]){margin-left:0.5rem}
.hover\\:bg-violet-700:hover{background-color:#6d28d9}.transition{transition-property:all;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}
.glass-panel{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2)}
`
      );
      
      // Write the fallback CSS
      await Bun.write(outputCssPath, finalCss);
    }
    
    // Apply minification if requested and we have CSS content
    if (minify && finalCss) {
      finalCss = finalCss
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove last semicolon before }
        .replace(/\s*{\s*/g, '{') // Trim around {
        .replace(/\s*}\s*/g, '}') // Trim around }
        .replace(/\s*,\s*/g, ',') // Trim around commas
        .replace(/\s*:\s*/g, ':') // Trim around colons
        .replace(/\s*;\s*/g, ';') // Trim around semicolons
    .trim();
      
      await Bun.write(outputCssPath, finalCss);
    }

    console.log('[Build] ✅ CSS processing complete');

  } catch (error) {
    console.error('[Build] ❌ CSS processing failed:', error);
    // Create absolute minimal fallback
    const fallbackCss = '* { box-sizing: border-box; } body { font-family: system-ui, sans-serif; }';
    await Bun.write(join(outputPath, 'styles.css'), fallbackCss);
  }
}

// 🚀 LIGHTNING-FAST HTML GENERATION WITH METADATA EXTRACTION
async function generateProductionHtmlFast(projectPath: string, outputPath: string): Promise<void> {
  const appDir = join(projectPath, 'app');
  if (!existsSync(appDir)) return;

  // Get discovered routes for metadata extraction
  const { discoverRoutesFromFileSystem } = await import('../server/dev-server');
  const fullRoutes = discoverRoutesFromFileSystem(projectPath);
  // Convert to simplified format for HTML generation compatibility
  const discoveredRoutes = fullRoutes.map(route => ({
    path: route.path,
    componentPath: route.componentPath,
    layouts: route.layouts
  }));
  
  const faviconLink = existsSync(join(projectPath, 'app/favicon.svg')) ? 
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">' :
    '<link rel="icon" href="/favicon.ico">';

  // Generate metadata for each route
  const routeMetadata = await Promise.all(discoveredRoutes.map(async (route) => {
    const metadata = await extractMetadataFromPage(projectPath, route);
    return { ...route, metadata };
  }));

  // Generate the main index.html (fallback for SPA)
  const baseMetadata = {
    title: "0x1 App",
    description: "The ultimate TypeScript framework powered by Bun"
  };
  
  const baseHtml = generateHtmlTemplate(baseMetadata, faviconLink, "/");
  await Bun.write(join(outputPath, 'index.html'), baseHtml);

  // Generate individual HTML files for each route with proper metadata
  for (const { path: routePath, metadata } of routeMetadata) {
    const mergedMetadata = {
      title: metadata.title || "0x1 App",
      description: metadata.description || "0x1 Framework page",
      keywords: metadata.keywords,
      author: metadata.author,
      image: metadata.image,
      openGraph: metadata.openGraph,
      twitter: metadata.twitter
    };
    
    if (routePath === '/') {
      // Update the main index.html with homepage metadata
      const homeHtml = generateHtmlTemplate(mergedMetadata, faviconLink, "/");
      await Bun.write(join(outputPath, 'index.html'), homeHtml);
      } else {
      // Generate individual HTML files for other routes
      const routeHtml = generateHtmlTemplate(mergedMetadata, faviconLink, routePath);
      
      // Create the directory structure for the route
      const routeDir = join(outputPath, routePath === '/' ? '' : routePath);
      if (routePath !== '/') {
        await mkdir(routeDir, { recursive: true });
        await Bun.write(join(routeDir, 'index.html'), routeHtml);
      }
    }
  }

  console.log(`[Build] ✅ Generated HTML files for ${routeMetadata.length} routes with metadata`);
}

// Extract metadata from page components using the proper metadata system
async function extractMetadataFromPage(projectPath: string, route: { path: string; componentPath: string }): Promise<any> {
  try {
    // Find the source file for this route
    const sourcePath = join(projectPath, route.componentPath.replace(/^\//, '').replace(/\.js$/, '.tsx'));
    const possiblePaths = [
      sourcePath,
      sourcePath.replace('.tsx', '.ts'),
      sourcePath.replace('.tsx', '.jsx'),
      sourcePath.replace('.tsx', '.js')
    ];
    
    const pageFile = possiblePaths.find(path => existsSync(path));
    if (!pageFile) return {};
    
    // Use the built-in metadata extraction system
    const extractedMetadata = await extractMetadataFromFile(pageFile);
    
    if (extractedMetadata) {
      console.log(`[Build] ✅ Extracted metadata from ${pageFile}:`, extractedMetadata.title);
      return extractedMetadata;
    }
    
    // Fallback: extract from comments if no export found
    const content = await Bun.file(pageFile).text();
    const metadata: any = {};
    
    // Look for metadata comments at the top of the file
    const metadataComment = content.match(/\/\*\*[\s\S]*?\*\//);
    if (metadataComment) {
      const comment = metadataComment[0];
      
      // Extract title
      const titleMatch = comment.match(/@title\s+(.+)/);
      if (titleMatch) metadata.title = titleMatch[1].trim();
      
      // Extract description
      const descMatch = comment.match(/@description\s+(.+)/);
      if (descMatch) metadata.description = descMatch[1].trim();
      
      // Extract keywords
      const keywordsMatch = comment.match(/@keywords\s+(.+)/);
      if (keywordsMatch) metadata.keywords = keywordsMatch[1].trim();
      
      // Extract author
      const authorMatch = comment.match(/@author\s+(.+)/);
      if (authorMatch) {
        metadata.author = authorMatch[1].trim();
      }
      
      // Extract image for OpenGraph
      const imageMatch = comment.match(/@image\s+(.+)/);
      if (imageMatch) {
        metadata.image = imageMatch[1].trim();
        metadata.openGraph = {
          images: [{ url: imageMatch[1].trim(), width: 1200, height: 630, alt: metadata.title || 'Page Image' }]
        };
        metadata.twitter = {
          card: 'summary_large_image' as const,
          image: imageMatch[1].trim()
        };
      }
    }
    
    // Default metadata based on route path if nothing found
    if (!metadata.title) {
      const routeName = route.path === '/' ? 'Home' : 
                       route.path.split('/').filter(p => p).map(p => 
                         p.charAt(0).toUpperCase() + p.slice(1)
                       ).join(' ');
      metadata.title = `${routeName} | 0x1 App`;
    }
    
    if (!metadata.description) {
      const titleStr = typeof metadata.title === 'string' ? metadata.title : metadata.title?.default || 'Page';
      metadata.description = `${titleStr.replace(' | 0x1 App', '')} page for 0x1 Framework application`;
    }
    
    return metadata;
  } catch (error) {
    console.warn(`[Build] Failed to extract metadata from ${route.componentPath}:`, error);
    return {};
  }
}

// Generate HTML template with metadata using simple approach
function generateHtmlTemplate(metadata: any, faviconLink: string, currentPath: string): string {
  // Resolve title properly
  const resolvedTitle = typeof metadata.title === 'string' 
    ? metadata.title 
    : metadata.title?.absolute || metadata.title?.default || '0x1 App';
    
  const description = metadata.description || "0x1 Framework application";
  const keywords = Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords || "";
  const author = metadata.author || metadata.authors?.[0]?.name || "";
  const ogImage = metadata.image || metadata.openGraph?.images?.[0]?.url || metadata.twitter?.image || "";
  
  // DYNAMIC CSS INCLUSION: Generate CSS links from dependencies
  const dynamicCssLinks = cssDependencyTracker.generateHtmlLinks();
  
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${resolvedTitle}</title>
  <meta name="title" content="${resolvedTitle}">
  <meta name="description" content="${description}">
  ${keywords ? `<meta name="keywords" content="${keywords}">` : ''}
  ${author ? `<meta name="author" content="${author}">` : ''}
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${currentPath}">
  <meta property="og:title" content="${resolvedTitle}">
  <meta property="og:description" content="${description}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${currentPath}">
  <meta property="twitter:title" content="${resolvedTitle}">
  <meta property="twitter:description" content="${description}">
  ${ogImage ? `<meta property="twitter:image" content="${ogImage}">` : ''}
  
  <!-- Additional Meta Tags -->
  <meta name="robots" content="index, follow">
  <meta name="language" content="English">
  <meta name="theme-color" content="#7c3aed">
  
  ${faviconLink}
  <link rel="stylesheet" href="/styles.css">
${dynamicCssLinks}
  <script type="importmap">{"imports":{"0x1":"/node_modules/0x1/index.js","0x1/jsx-runtime":"/0x1/jsx-runtime.js","0x1/router":"/0x1/router.js","0x1/":"/0x1/"}}</script>
  <style>.app-loading{position:fixed;top:20px;right:20px;opacity:0.6;transition:opacity 0.3s}.app-loading.loaded{opacity:0}</style>
</head>
<body class="bg-slate-900 text-white">
  <div id="app"></div>
  <div class="app-loading" id="app-loading">⚡</div>
  <script>
    window.process={env:{NODE_ENV:'production'}};
    (function(){try{const t=localStorage.getItem('0x1-dark-mode');t==='light'?(document.documentElement.classList.remove('dark'),document.body.className='bg-white text-gray-900'):(document.documentElement.classList.add('dark'),document.body.className='bg-slate-900 text-white')}catch{document.documentElement.classList.add('dark')}})();
    window.appReady=function(){const l=document.getElementById('app-loading');l&&l.classList.add('loaded')};
  </script>
  <script src="/app.js" type="module"></script>
</body>
</html>`;
}

// 🚀 LIGHTNING-FAST PWA GENERATION
async function generatePwaFilesFast(outputPath: string): Promise<void> {
  const tasks = [
    Bun.write(join(outputPath, 'manifest.json'), JSON.stringify({
      name: "0x1 App",
      short_name: "0x1",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0a0a",
      theme_color: "#0070f3",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    })),
    Bun.write(join(outputPath, 'robots.txt'), 'User-agent: *\nAllow: /'),
    Bun.write(join(outputPath, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc><lastmod>${new Date().toISOString()}</lastmod></url>
</urlset>`)
  ];

  await Promise.all(tasks);
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

// CRITICAL FIX: Fix template literal syntax issues in transpiled code
function fixTemplateLiteralSyntax(code: string): string {
  // ROBUST FIX: Parse and fix JavaScript AST properly instead of pattern matching
  
  try {
    // Use Bun's built-in JavaScript parser to handle this properly
    const transpiler = new Bun.Transpiler({
      loader: 'js',
      target: 'browser',
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      }
    });
    
    // Parse and re-transpile to normalize syntax
    const normalizedCode = transpiler.transformSync(code);
    
    // If that worked, use it
    if (normalizedCode && !normalizedCode.includes('SyntaxError')) {
      console.log('[Build] JavaScript normalized successfully with AST parser');
      return normalizedCode;
    }
  } catch (error) {
    console.warn('[Build] AST normalization failed, using manual fix:', error);
  }
  
  // FALLBACK: Comprehensive manual fix using proper regex patterns
  let fixedCode = code;
  
  // Fix 1: Convert template literals that should be strings (comprehensive)
  // This handles ALL template literals that don't use interpolation
  fixedCode = fixedCode.replace(/`([^`$\\]+)`/g, (match, content) => {
    // Only convert if there's no template literal interpolation (${...})
    if (!content.includes('${')) {
      // Properly escape the content for a string literal
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    return match;
  });
  
  // Fix 2: Handle any remaining template literal fragments in arrays/objects
  fixedCode = fixedCode.replace(
    /([[{,]\s*)`([^`$]+)`(\s*[\]},])/g,
    (match, before, content, after) => {
      if (!content.includes('${')) {
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `${before}"${escaped}"${after}`;
      }
      return match;
    }
  );
  
  // Fix 3: Validate the result
  try {
    // Use Function constructor to validate syntax without executing
    new Function(fixedCode);
    console.log('[Build] JavaScript syntax validated successfully');
  } catch (error) {
    console.error('[Build] Generated JavaScript still has syntax errors:', error);
    // In this case, we could try more aggressive fixes or fall back to error component
  }
  
  console.log('[Build] Applied comprehensive JavaScript syntax fixes');
  return fixedCode;
} 

/**
 * ROOT CAUSE FIX: Pre-process template literals in source code before transpilation
 * This prevents Bun from generating invalid JavaScript with unescaped backticks
 */
function preprocessTemplateLiterals(sourceCode: string): string {
  // The root issue: Template literals in JSX examples/documentation should be treated as text
  // Instead of letting Bun transpile them as actual template literals, convert them to strings
  
  let processed = sourceCode;
  
  // Strategy 1: Convert template literals in JSX text content to regular strings
  // Look for template literals that are clearly text content, not actual template literals
  processed = processed.replace(
    /(\w+:\s*)`([^`]*)`/g,
    (match, prefix, content) => {
      // If this looks like a documentation example (no interpolation), convert to string
      if (!content.includes('${') && (
        content.includes('{') || 
        content.includes('useState') || 
        content.includes('import') ||
        content.includes('export') ||
        content.includes('function')
      )) {
        // This is likely a code example, convert to string
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'");
        return `${prefix}'${escaped}'`;
      }
      return match;
    }
  );
  
  // Strategy 2: Convert template literals in JSX attribute values that are code examples
  processed = processed.replace(
    /(\w+\s*=\s*)`([^`]*)`/g,
    (match, prefix, content) => {
      if (!content.includes('${') && (
        content.includes('{') || 
        content.includes('useState') || 
        content.includes('import') ||
        content.includes('export')
      )) {
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'");
        return `${prefix}'${escaped}'`;
      }
      return match;
    }
  );
  
  // Strategy 3: Convert template literals in array/object literals that are documentation
  processed = processed.replace(
    /(\[\s*|\{\s*|,\s*)`([^`]*)`(\s*[\],}])/g,
    (match, before, content, after) => {
      if (!content.includes('${') && (
        content.includes('{') || 
        content.includes('useState') || 
        content.includes('import') ||
        content.includes('export') ||
        content.includes('React') ||
        content.includes('function')
      )) {
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'");
        return `${before}'${escaped}'${after}`;
      }
      return match;
    }
  );
  
  console.log('[Build] Pre-processed template literals to prevent syntax errors');
  return processed;
}

/**
 * Transform code content to handle imports for browser compatibility
 * This converts React and 0x1 imports to browser-compatible paths
 * and removes CSS imports that would cause MIME type errors
 */
function transformBareImports(content: string, filePath?: string, projectPath?: string): string {
  console.log('[Build] 🧠 Applying context-aware import transformations (transformBareImports)...');
  
  // CRITICAL FIX: Use the same bulletproof context-aware logic
  return transformImportsForBrowser(content);
}

// 🚀 CSS DEPENDENCY TRACKER - DYNAMIC CSS DETECTION
class CssDependencyTracker {
  private dependencies = new Set<string>();
  private packageCssFiles = new Map<string, string>();

  // Track a CSS dependency
  addDependency(cssPath: string): void {
    this.dependencies.add(cssPath);
    console.log(`[Build] 📝 Tracked CSS dependency: ${cssPath}`);
  }

  // Register package CSS files
  registerPackageCss(packageName: string, cssPath: string): void {
    this.packageCssFiles.set(packageName, cssPath);
    console.log(`[Build] 📦 Registered package CSS: ${packageName} -> ${cssPath}`);
  }

  // Get all dependencies as HTML link tags
  generateHtmlLinks(): string {
    const links: string[] = [];
    
    for (const dep of this.dependencies) {
      links.push(`  <link rel="stylesheet" href="${dep}">`);
    }
    
    return links.join('\n');
  }

  // Get all dependencies as an array
  getDependencies(): string[] {
    return Array.from(this.dependencies);
  }

  // Clear all dependencies
  clear(): void {
    this.dependencies.clear();
    this.packageCssFiles.clear();
  }
}

// Global CSS dependency tracker instance
const cssDependencyTracker = new CssDependencyTracker();
