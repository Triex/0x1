/**
 * 0x1 Framework - Unified Import Engine
 * Single source of truth for import resolution in both dev and build
 * Context-aware, intelligent caching, and universal resolution
 */

import { logger } from '../../cli/utils/logger';

export interface ImportResolution {
  originalPath: string;
  resolvedPath: string;
  type: 'js' | 'css' | 'asset';
  packageName?: string;
  isExternal?: boolean;
}

export interface ImportContext {
  mode: 'development' | 'production';
  projectPath: string;
  currentFilePath: string;
  debug?: boolean;
}

export interface DependencyGraph {
  imports: Map<string, ImportResolution>;
  cssFiles: Set<string>;
  packages: Set<string>;
  files: Set<string>;
}

export class ImportEngine {
  private dependencyGraph: DependencyGraph = {
    imports: new Map(),
    cssFiles: new Set(),
    packages: new Set(),
    files: new Set()
  };
  
  private cache = new Map<string, ImportResolution>();
  
  /**
   * Single source of truth for import resolution
   * Works with any import path and resolves according to Node.js rules
   */
  resolveImport(importPath: string, context: ImportContext): ImportResolution {
    const cacheKey = `${importPath}:${context.mode}:${context.currentFilePath}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      if (context.debug) {
        logger.debug(`[ImportEngine] Cache hit: ${importPath} -> ${cached.resolvedPath}`);
      }
      return cached;
    }
    
    const resolution = this.performResolution(importPath, context);
    this.cache.set(cacheKey, resolution);
    
    // Track in dependency graph
    this.updateDependencyGraph(resolution, context);
    
    if (context.debug) {
      logger.debug(`[ImportEngine] Resolved: ${importPath} -> ${resolution.resolvedPath} (${resolution.type})`);
    }
    
    return resolution;
  }
  
  /**
   * Discover all imports across the entire codebase
   * Builds comprehensive dependency graph for build optimization
   */
  async discoverDependencies(projectPath: string, sourceFiles: string[]): Promise<DependencyGraph> {
    logger.info(`[ImportEngine] Discovering dependencies across ${sourceFiles.length} files...`);
    
    const importTasks = sourceFiles.map(async (filePath) => {
      try {
        const content = await Bun.file(filePath).text();
        await this.extractImportsFromFile(content, filePath, projectPath);
      } catch (error) {
        logger.warn(`[ImportEngine] Failed to process ${filePath}: ${error}`);
      }
    });
    
    await Promise.all(importTasks);
    
    logger.info(`[ImportEngine] Discovered: ${this.dependencyGraph.packages.size} packages, ${this.dependencyGraph.cssFiles.size} CSS files, ${this.dependencyGraph.imports.size} total imports`);
    
    return this.dependencyGraph;
  }
  
  /**
   * Transform source code imports for browser compatibility
   * Uses discovered resolutions for consistent transformations
   */
  transformImports(sourceCode: string, context: ImportContext): string {
    const lines = sourceCode.split('\n');
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
        const resolution = this.resolveImport(importPath, context);
        
        if (resolution.type === 'css') {
          // CSS imports become comments and are tracked for HTML inclusion
          transformedLines.push('// CSS import removed for browser compatibility - tracked for HTML inclusion');
        } else {
          // Transform JS imports to resolved paths
          const transformedImport = line.replace(
            /(['"])([^'"]+)(['"])/,
            `$1${resolution.resolvedPath}$3`
          );
          transformedLines.push(transformedImport);
        }
      } else {
        transformedLines.push(line);
      }
    }
    
    return transformedLines.join('\n');
  }
  
  /**
   * Core import resolution logic
   * Follows Node.js module resolution algorithm with browser adaptations
   */
  private performResolution(importPath: string, context: ImportContext): ImportResolution {
    // CSS files
    if (this.isCssFile(importPath)) {
      return {
        originalPath: importPath,
        resolvedPath: this.resolveCssPath(importPath),
        type: 'css'
      };
    }
    
    // CSS-only imports (like @package/styles)
    if (this.isCssOnlyImport(importPath)) {
      const packageName = this.extractPackageName(importPath);
      return {
        originalPath: importPath,
        resolvedPath: this.resolveCssPath(importPath + '.css'),
        type: 'css',
        packageName
      };
    }
    
    // 0x1 Framework core imports
    if (this.is0x1Import(importPath)) {
      return {
        originalPath: importPath,
        resolvedPath: this.resolve0x1Import(importPath),
        type: 'js'
      };
    }
    
    // Relative imports
    if (this.isRelativeImport(importPath)) {
      return {
        originalPath: importPath,
        resolvedPath: this.resolveRelativeImport(importPath, context),
        type: 'js'
      };
    }
    
    // npm package imports
    const packageName = this.extractPackageName(importPath);
    if (packageName) {
      return {
        originalPath: importPath,
        resolvedPath: this.resolvePackageImport(importPath, packageName),
        type: 'js',
        packageName,
        isExternal: !this.isSystemPackage(packageName)
      };
    }
    
    // Fallback
    return {
      originalPath: importPath,
      resolvedPath: importPath,
      type: 'js'
    };
  }
  
  /**
   * Extract imports from source file content
   */
  private async extractImportsFromFile(content: string, filePath: string, projectPath: string): Promise<void> {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip code examples and comments
      if (this.isCodeExample(line, lines, i)) continue;
      
      // Extract actual import statements
      const importMatch = trimmed.match(/^\s*import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"];?/);
      if (importMatch) {
        const importPath = importMatch[1];
        const context: ImportContext = {
          mode: 'production', // Use production for comprehensive discovery
          projectPath,
          currentFilePath: filePath
        };
        
        const resolution = this.resolveImport(importPath, context);
        const key = `${filePath}:${importPath}`;
        
        this.dependencyGraph.imports.set(key, resolution);
        this.updateDependencyGraph(resolution, context);
      }
    }
  }
  
  /**
   * Update dependency graph with resolution
   */
  private updateDependencyGraph(resolution: ImportResolution, context: ImportContext): void {
    if (resolution.type === 'css') {
      this.dependencyGraph.cssFiles.add(resolution.resolvedPath);
    }
    
    if (resolution.packageName && !this.isSystemPackage(resolution.packageName)) {
      this.dependencyGraph.packages.add(resolution.packageName);
    }
    
    this.dependencyGraph.files.add(context.currentFilePath);
  }
  
  /**
   * Check if import path is a CSS file
   */
  private isCssFile(importPath: string): boolean {
    return /\.(css|scss|sass|less)$/.test(importPath);
  }
  
  /**
   * Check if import is CSS-only (like @package/styles)
   */
  private isCssOnlyImport(importPath: string): boolean {
    return importPath.endsWith('/styles') || importPath.includes('/styles/');
  }
  
  /**
   * Check if import is 0x1 framework
   */
  private is0x1Import(importPath: string): boolean {
    return importPath === '0x1' || importPath.startsWith('0x1/');
  }
  
  /**
   * Check if import is relative
   */
  private isRelativeImport(importPath: string): boolean {
    return importPath.startsWith('./') || importPath.startsWith('../');
  }
  
  /**
   * Extract package name from import path
   */
  private extractPackageName(importPath: string): string | undefined {
    if (importPath.startsWith('@')) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = importPath.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : undefined;
    } else if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      // Regular package: package or package/subpath
      return importPath.split('/')[0];
    }
    return undefined;
  }
  
  /**
   * Check if package is a system package (should be externalized)
   */
  private isSystemPackage(packageName: string): boolean {
    const systemPackages = new Set(['react', 'react-dom', 'next', 'typescript', 'eslint']);
    const systemPrefixes = ['@types/', '@babel/', '@webpack/', '0x1/'];
    
    return systemPackages.has(packageName) || 
           systemPrefixes.some(prefix => packageName.startsWith(prefix));
  }
  
  /**
   * Resolve CSS paths for browser compatibility
   */
  private resolveCssPath(cssPath: string): string {
    if (cssPath.startsWith('@') || (!cssPath.startsWith('.') && !cssPath.startsWith('/'))) {
      // npm package CSS
      const packageName = this.extractPackageName(cssPath);
      if (packageName) {
        const subPath = cssPath.replace(packageName, '').replace(/^\//, '');
        if (subPath && !subPath.endsWith('.css')) {
          return `/node_modules/${packageName}/dist/${subPath}.css`;
        }
        return `/node_modules/${packageName}/dist/styles.css`;
      }
    }
    
    if (cssPath.includes('global') || cssPath.includes('main')) {
      return '/styles.css';
    }
    
    // Relative or absolute
    const resolved = cssPath.startsWith('/') ? cssPath : `/${cssPath.replace(/^\.\.?\//, '')}`;
    return resolved.endsWith('.css') ? resolved : `${resolved}.css`;
  }
  
  /**
   * Resolve 0x1 framework imports
   */
  private resolve0x1Import(importPath: string): string {
    if (importPath === '0x1') {
      return '/node_modules/0x1/index.js';
    }
    
    const submodule = importPath.replace('0x1/', '');
    const moduleMap: Record<string, string> = {
      'jsx-runtime': '/0x1/jsx-runtime.js',
      'jsx-dev-runtime': '/0x1/jsx-dev-runtime.js',
      'hooks': '/0x1/hooks.js',
      'router': '/0x1/router.js',
      'link': '/0x1/link.js'
    };
    
    return moduleMap[submodule] || `/0x1/${submodule}.js`;
  }
  
  /**
   * Resolve relative imports
   */
  private resolveRelativeImport(importPath: string, context: ImportContext): string {
    let resolved = importPath;
    
    if (importPath.startsWith('../')) {
      resolved = importPath.replace(/^\.\.\//, '/');
    } else if (importPath.startsWith('./')) {
      resolved = importPath.replace(/^\.\//, '/components/');
    }
    
    // Add .js extension if needed
    if (!resolved.match(/\.(js|ts|tsx|jsx|json|css|svg|png|jpg|gif)$/)) {
      resolved += '.js';
    } else if (resolved.match(/\.(ts|tsx|jsx)$/)) {
      resolved = resolved.replace(/\.(ts|tsx|jsx)$/, '.js');
    }
    
    return resolved;
  }
  
  /**
   * Resolve npm package imports
   */
  private resolvePackageImport(importPath: string, packageName: string): string {
    const skipPackages = ['react', 'react-dom'];
    if (skipPackages.includes(packageName)) {
      return importPath; // Keep as-is for externals
    }
    
    if (packageName.startsWith('@')) {
      // Scoped package - always point to dist/index.js
      return `/node_modules/${packageName}/dist/index.js`;
    }
    
    // Regular package
    return `/node_modules/${packageName}/index.js`;
  }
  
  /**
   * Check if line is a code example vs real import
   */
  private isCodeExample(line: string, allLines: string[], lineIndex: number): boolean {
    const trimmed = line.trim();
    
    // Obvious code examples
    const codeExamplePatterns = [
      /^\s*(\/\/|\/\*|\*)/,  // Comments
      /['"`].*import.*['"`]/, // String literals containing import
      /[-+]\s*import/,       // Diff-style examples
      /<[^>]*import/,        // JSX content
      /```.*import/,         // Markdown code blocks
      /children:/,           // JSX children
      /className=/           // JSX attributes
    ];
    
    if (codeExamplePatterns.some(pattern => pattern.test(line))) {
      return true;
    }
    
    // Check if we're inside JSX or documentation context
    const context = allLines.slice(Math.max(0, lineIndex - 3), lineIndex + 3).join(' ');
    if (context.includes('<div') || context.includes('return (') || context.includes('children:')) {
      return true;
    }
    
    // Must be a real import statement
    return !/^\s*import\s/.test(trimmed);
  }
  
  /**
   * Get discovered packages for copying
   */
  getDiscoveredPackages(): string[] {
    return Array.from(this.dependencyGraph.packages);
  }
  
  /**
   * Get CSS dependencies for HTML inclusion
   */
  getCssDependencies(): string[] {
    return Array.from(this.dependencyGraph.cssFiles);
  }
  
  /**
   * Get all discovered files
   */
  getDiscoveredFiles(): string[] {
    return Array.from(this.dependencyGraph.files);
  }
  
  /**
   * Get import graph for analysis
   */
  getImportGraph(): Map<string, ImportResolution> {
    return new Map(this.dependencyGraph.imports);
  }
  
  /**
   * Clear all caches and dependency graph
   */
  clearCache(): void {
    this.cache.clear();
    this.dependencyGraph = {
      imports: new Map(),
      cssFiles: new Set(),
      packages: new Set(),
      files: new Set()
    };
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { 
    size: number; 
    dependencyGraphSize: number;
    packages: number;
    cssFiles: number;
  } {
    return {
      size: this.cache.size,
      dependencyGraphSize: this.dependencyGraph.imports.size,
      packages: this.dependencyGraph.packages.size,
      cssFiles: this.dependencyGraph.cssFiles.size
    };
  }
}

// Export singleton instance for convenience
export const importEngine = new ImportEngine(); 