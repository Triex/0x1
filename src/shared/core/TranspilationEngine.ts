/**
 * 0x1 Framework - Unified Transpilation Engine
 * Single source of truth for transpilation in both dev and build
 * Context-aware, intelligent caching, and error boundaries
 */

import { logger } from '../../cli/utils/logger';
import { processDirectives } from '../../core/directives.js';

export interface TranspileOptions {
  mode: 'development' | 'production';
  sourcePath: string;
  projectPath?: string;
  minify?: boolean;
  sourceMaps?: boolean | 'inline';
  target?: 'browser' | 'node';
  jsxRuntime?: 'automatic' | 'classic';
  debug?: boolean;
}

export interface TranspileResult {
  code: string;
  sourcePath: string;
  errors: Array<{
    type: string;
    message: string;
    line?: number;
    suggestion?: string;
  }>;
  warnings: string[];
  metadata: {
    hasJsx: boolean;
    hasDirectives: boolean;
    imports: string[];
    exports: string[];
    processingTime: number;
  };
}

export interface TranspileInput {
  sourceCode: string;
  sourcePath: string;
  options: TranspileOptions;
  hash?: string;
}

export class TranspilationEngine {
  private cache = new Map<string, TranspileResult>();
  private mode: 'development' | 'production' = 'development';
  
  /**
   * Configure the engine for specific context
   */
  configure(mode: 'development' | 'production'): this {
    this.mode = mode;
    return this;
  }
  
  /**
   * Single method for both dev and build transpilation
   * Context-aware with intelligent caching and error handling
   */
  async transpile(input: TranspileInput): Promise<TranspileResult> {
    const startTime = performance.now();
    
    try {
      // 1. Normalize and validate input
      const normalized = this.normalizeInput(input);
      
      // 2. Check cache (dev = memory, build = content-hash based)
      const cached = await this.getCachedResult(normalized);
      if (cached) {
        if (normalized.options.debug) {
          logger.debug(`[TranspilationEngine] Cache hit: ${normalized.sourcePath}`);
        }
        return cached;
      }
      
      // 3. Process directives (skip for docs files)
      const withDirectives = await this.processDirectives(normalized);
      
      // 4. Detect JSX and determine transpilation strategy
      const jsxInfo = this.analyzeJsx(withDirectives.sourceCode, normalized.sourcePath);
      
      // 5. Transform imports for browser compatibility
      const withImports = await this.transformImports(withDirectives);
      
      // 6. Transpile TypeScript/JSX if needed
      const transpiled = await this.performTranspilation(withImports, jsxInfo);
      
      // 7. Post-process and optimize
      const optimized = await this.postProcess(transpiled);
      
      // 8. Create result with metadata
      const result = this.createResult(optimized, normalized, startTime, jsxInfo);
      
      // 9. Cache result
      await this.cacheResult(normalized, result);
      
      return result;
      
    } catch (error) {
      return this.createErrorResult(input, error, startTime);
    }
  }
  
  /**
   * Normalize input and generate hash for caching
   */
  private normalizeInput(input: TranspileInput): TranspileInput {
    const options: TranspileOptions = {
      ...input.options,
      mode: this.mode,
      sourceMaps: this.mode === 'development' ? 'inline' as const : false,
      minify: this.mode === 'production',
      target: input.options.target || 'browser',
      jsxRuntime: input.options.jsxRuntime || 'automatic'
    };
    
    const hash = input.hash || this.generateHash(input.sourceCode + JSON.stringify(options));
    
    return {
      ...input,
      options,
      hash
    };
  }
  
  /**
   * Generate content hash for caching
   */
  private generateHash(content: string): string {
    return Bun.hash(content).toString(16).slice(0, 8);
  }
  
  /**
   * Intelligent caching based on mode
   */
  private async getCachedResult(input: TranspileInput): Promise<TranspileResult | null> {
    if (input.options.mode === 'development') {
      // Memory cache for dev (fast but temporary)
      return this.cache.get(input.hash!) || null;
    } else {
      // For production, we could implement persistent caching here
      // For now, use memory cache but could extend to file-based
      return this.cache.get(input.hash!) || null;
    }
  }
  
  /**
   * Cache result based on mode
   */
  private async cacheResult(input: TranspileInput, result: TranspileResult): Promise<void> {
    if (input.hash) {
      this.cache.set(input.hash, result);
      
      // Clean cache in development mode to prevent memory leaks
      if (input.options.mode === 'development' && this.cache.size > 100) {
        const keys = Array.from(this.cache.keys());
        const oldKeys = keys.slice(0, 20); // Remove oldest 20 entries
        oldKeys.forEach(key => this.cache.delete(key));
      }
    }
  }
  
  /**
   * Process 0x1 directives with error handling
   */
  private async processDirectives(input: TranspileInput): Promise<TranspileInput> {
    const isDocumentationFile = input.sourcePath.includes('/docs/') || 
                               input.sourcePath.includes('/app/docs/');
    
    if (isDocumentationFile) {
      // Skip directive validation for documentation
      return input;
    }
    
    try {
      const result = processDirectives(input.sourceCode, input.sourcePath);
      
      if (result.errors.length > 0 && input.options.debug) {
        logger.warn(`[TranspilationEngine] Directive warnings in ${input.sourcePath}: ${JSON.stringify(result.errors)}`);
      }
      
      return {
        ...input,
        sourceCode: result.code
      };
    } catch (error) {
      logger.warn(`[TranspilationEngine] Directive processing failed for ${input.sourcePath}: ${error}`);
      return input; // Continue with original code
    }
  }
  
  /**
   * Analyze JSX content with context-aware detection
   */
  private analyzeJsx(sourceCode: string, sourcePath: string): {
    hasJsx: boolean;
    hasJsxElements: boolean;
    hasJsxCalls: boolean;
    shouldTranspile: boolean;
    confidence: number;
  } {
    const isTsxOrJsx = sourcePath.endsWith('.tsx') || sourcePath.endsWith('.jsx');
    const hasJsxElements = this.detectActualJsxElements(sourceCode);
    const hasJsxCalls = /jsx\s*\(/.test(sourceCode) || 
                       /jsxs\s*\(/.test(sourceCode) || 
                       /jsxDEV\s*\(/.test(sourceCode);
    
    // Confidence scoring
    let confidence = 0;
    if (isTsxOrJsx) confidence += 0.5;
    if (hasJsxElements) confidence += 0.4;
    if (hasJsxCalls) confidence += 0.1;
    
    const shouldTranspile = isTsxOrJsx || hasJsxElements || confidence > 0.6;
    
    return {
      hasJsx: hasJsxElements || hasJsxCalls,
      hasJsxElements,
      hasJsxCalls,
      shouldTranspile,
      confidence
    };
  }
  
  /**
   * Context-aware JSX detection (from dev-server.ts)
   */
  private detectActualJsxElements(sourceCode: string): boolean {
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
          i++;
          continue;
        }
        
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        
        if (inBlockComment && char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++;
          continue;
        }
        
        if (inLineComment && char === '\n') {
          inLineComment = false;
          continue;
        }
      }
      
      if (inLineComment || inBlockComment) continue;
      
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
      
      if (inTemplateString && char === '$' && nextChar === '{') {
        templateDepth++;
        i++;
        continue;
      }
      
      if (inTemplateString && char === '}') {
        templateDepth--;
        continue;
      }
      
      if (inSingleQuote || inDoubleQuote || inTemplateString) continue;
      
      // Check for JSX elements (only outside strings/comments)
      if (char === '<') {
        const nextFewChars = sourceCode.slice(i, i + 20);
        const jsxPatterns = [
          /^<[A-Z][A-Za-z0-9]*[\s/>]/,
          /^<[a-z][A-Za-z0-9-]*[\s/>]/,
          /^<>/,
          /^<[/][A-Za-z]/
        ];
        
        if (jsxPatterns.some(pattern => pattern.test(nextFewChars))) {
          const prevChar = chars[i - 1];
          const isComparison = prevChar === '=' || prevChar === '<' || prevChar === '>' || prevChar === '!';
          
          if (!isComparison) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Transform imports for browser compatibility
   */
  private async transformImports(input: TranspileInput): Promise<TranspileInput> {
    const lines = input.sourceCode.split('\n');
    const transformedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed.includes('import') || this.isCodeExample(line, lines, i)) {
        transformedLines.push(line);
        continue;
      }
      
      const importMatch = trimmed.match(/^\s*import\s+(?:(.*?)\s+from\s+)?['"]([^'"]+)['"];?/);
      if (importMatch) {
        const [, importClause, importPath] = importMatch;
        const transformedImport = this.transformSingleImport(line, importPath);
        transformedLines.push(transformedImport);
      } else {
        transformedLines.push(line);
      }
    }
    
    return {
      ...input,
      sourceCode: transformedLines.join('\n')
    };
  }
  
  /**
   * Transform a single import statement
   */
  private transformSingleImport(line: string, importPath: string): string {
    // Remove CSS imports
    if (/\.(css|scss|sass|less)$/.test(importPath)) {
      return '// CSS import removed for browser compatibility';
    }
    
    // Transform 0x1 framework imports
    if (importPath === '0x1') {
      return line.replace(/['"]0x1['"]/, '"/node_modules/0x1/index.js"');
    }
    
    if (importPath.startsWith('0x1/')) {
      const submodule = importPath.replace('0x1/', '');
      const moduleMap: Record<string, string> = {
        'jsx-runtime': '/0x1/jsx-runtime.js',
        'jsx-dev-runtime': '/0x1/jsx-dev-runtime.js',
        'hooks': '/0x1/hooks.js',
        'router': '/0x1/router.js',
        'link': '/0x1/link.js'
      };
      const resolvedPath = moduleMap[submodule] || `/0x1/${submodule}.js`;
      return line.replace(/['"]0x1\/[^'"]+['"]/, `"${resolvedPath}"`);
    }
    
    // Transform relative imports
    if (importPath.startsWith('./')) {
      const normalizedPath = this.normalizeModulePath(importPath.slice(2));
      return line.replace(/['"]\.\/[^'"]+['"]/, `"/${normalizedPath}"`);
    }
    
    if (importPath.startsWith('../')) {
      const normalizedPath = this.normalizeModulePath(importPath.replace(/^\.\.\//, ''));
      return line.replace(/['"]\.\.\/[^'"]+['"]/, `"/${normalizedPath}"`);
    }
    
    // Transform npm package imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      const skipPackages = ['react', 'react-dom'];
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0];
      
      if (!skipPackages.includes(packageName)) {
        return line.replace(/['"][^'"]+['"]/, `"/node_modules/${importPath}"`);
      }
    }
    
    return line;
  }
  
  /**
   * Normalize module paths for browser compatibility
   */
  private normalizeModulePath(path: string): string {
    let normalizedPath = path;
    
    if (path.includes('components/')) {
      normalizedPath = path.replace(/^.*?components\//, 'components/');
    } else if (path.includes('lib/')) {
      normalizedPath = path.replace(/^.*?lib\//, 'lib/');
    } else {
      normalizedPath = path.startsWith('components/') ? path : `components/${path}`;
    }
    
    if (!normalizedPath.match(/\.(js|ts|tsx|jsx|json|css|svg|png|jpg|gif)$/)) {
      normalizedPath += '.js';
    } else if (normalizedPath.match(/\.(ts|tsx|jsx)$/)) {
      normalizedPath = normalizedPath.replace(/\.(ts|tsx|jsx)$/, '.js');
    }
    
    return normalizedPath;
  }
  
  /**
   * Check if line is a code example vs real import
   */
  private isCodeExample(line: string, allLines: string[], lineIndex: number): boolean {
    const trimmed = line.trim();
    
    const codeExamplePatterns = [
      /^\s*(\/\/|\/\*|\*)/,
      /['"`].*import.*['"`]/,
      /[-+]\s*import/,
      /<[^>]*import/,
      /```.*import/,
      /children:/,
      /className=/
    ];
    
    if (codeExamplePatterns.some(pattern => pattern.test(line))) {
      return true;
    }
    
    const context = allLines.slice(Math.max(0, lineIndex - 3), lineIndex + 3).join(' ');
    return context.includes('<div') || context.includes('return (') || context.includes('children:');
  }
  
  /**
   * Perform actual transpilation using Bun
   */
  private async performTranspilation(input: TranspileInput, jsxInfo: any): Promise<TranspileInput> {
    if (!jsxInfo.shouldTranspile) {
      return input;
    }
    
    try {
      const transpiler = new Bun.Transpiler({
        loader: input.sourcePath.endsWith('.tsx') || input.sourcePath.endsWith('.jsx') ? 'tsx' : 'js',
        target: input.options.target || 'browser',
        define: {
          'process.env.NODE_ENV': JSON.stringify(input.options.mode === 'production' ? 'production' : 'development'),
          'global': 'globalThis'
        }
      });
      
      const transpiledContent = await transpiler.transform(input.sourceCode);
      
      // Normalize JSX function calls and add runtime preamble
      let finalCode = this.normalizeJsxFunctionCalls(transpiledContent);
      finalCode = this.insertJsxRuntimePreamble(finalCode);
      
      return {
        ...input,
        sourceCode: finalCode
      };
      
    } catch (error) {
      throw new Error(`Transpilation failed for ${input.sourcePath}: ${error}`);
    }
  }
  
  /**
   * Normalize hashed JSX function calls
   */
  private normalizeJsxFunctionCalls(content: string): string {
    return content
      .replace(/jsxDEV_[a-zA-Z0-9_]+/g, 'jsxDEV')
      .replace(/jsx_[a-zA-Z0-9_]+/g, 'jsx')
      .replace(/jsxs_[a-zA-Z0-9_]+/g, 'jsxs')
      .replace(/Fragment_[a-zA-Z0-9_]+/g, 'Fragment');
  }
  
  /**
   * Insert JSX runtime preamble
   */
  private insertJsxRuntimePreamble(code: string): string {
    const lines = code.split('\n');
    let insertIndex = 0;
    let foundImports = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('import ') || (line.startsWith('export ') && line.includes('from '))) {
        foundImports = true;
        insertIndex = i + 1;
      } else if (line.startsWith('//') || line.startsWith('/*') || line.includes('*/') || line === '') {
        if (foundImports) {
          insertIndex = i + 1;
        }
      } else if (line && foundImports) {
        break;
      }
    }
    
    const preamble = `// 0x1 Framework - JSX Runtime Access\nimport { jsx, jsxs, jsxDEV, Fragment, createElement } from '/0x1/jsx-runtime.js';`;
    lines.splice(insertIndex, 0, preamble);
    
    return lines.join('\n');
  }
  
  /**
   * Post-process and optimize based on mode
   */
  private async postProcess(input: TranspileInput): Promise<TranspileInput> {
    let code = input.sourceCode;
    
    if (input.options.mode === 'production') {
      // Production optimizations
      if (input.options.minify) {
        code = this.minifyCode(code);
      }
      
      // Remove console.log statements in production
      code = code.replace(/console\.log\([^)]*\);?\s*/g, '');
    }
    
    return {
      ...input,
      sourceCode: code
    };
  }
  
  /**
   * Simple code minification
   */
  private minifyCode(code: string): string {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .trim();
  }
  
  /**
   * Create successful transpilation result
   */
  private createResult(
    input: TranspileInput,
    original: TranspileInput,
    startTime: number,
    jsxInfo: any
  ): TranspileResult {
    const processingTime = performance.now() - startTime;
    
    // Extract imports and exports for metadata
    const imports = this.extractImports(original.sourceCode);
    const exports = this.extractExports(input.sourceCode);
    
    return {
      code: input.sourceCode,
      sourcePath: input.sourcePath,
      errors: [],
      warnings: [],
      metadata: {
        hasJsx: jsxInfo.hasJsx,
        hasDirectives: input.sourceCode.includes('use client') || input.sourceCode.includes('use server'),
        imports,
        exports,
        processingTime
      }
    };
  }
  
  /**
   * Create error result for failed transpilation
   */
  private createErrorResult(input: TranspileInput, error: any, startTime: number): TranspileResult {
    const processingTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      code: `// Transpilation error: ${errorMessage}\nexport default function ErrorComponent() { return { type: 'div', props: { children: ['Transpilation Error: ${errorMessage}'] } }; }`,
      sourcePath: input.sourcePath,
      errors: [{
        type: 'transpilation-error',
        message: errorMessage,
        suggestion: 'Check TypeScript/JSX syntax and imports'
      }],
      warnings: [],
      metadata: {
        hasJsx: false,
        hasDirectives: false,
        imports: [],
        exports: ['default'],
        processingTime
      }
    };
  }
  
  /**
   * Extract import statements for metadata
   */
  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"];?/g;
    let match;
    
    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }
  
  /**
   * Extract export statements for metadata
   */
  private extractExports(code: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(code)) !== null) {
      exports.push(match[1] ? 'default' : match[2]);
    }
    
    return exports;
  }
  
  /**
   * Clear cache (useful for development)
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Could implement hit rate tracking
    };
  }
}

// Export singleton instance for convenience
export const transpilationEngine = new TranspilationEngine(); 