/**
 * 0x1 Framework - Unified Route Discovery
 * Single source of truth for route discovery in both dev and build
 * Context-aware with smart caching and error handling
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { logger } from '../../cli/utils/logger';

export interface Route {
  path: string;
  componentPath: string;
  layouts: Array<{ path: string; componentPath: string }>;
  isDynamic: boolean;
  dynamicSegments: Array<{ 
    name: string; 
    type: 'dynamic' | 'catchAll' | 'optionalCatchAll' 
  }>;
  routeGroup?: string;
  filePath?: string;
}

export interface DiscoveryOptions {
  mode: 'development' | 'production';
  debug?: boolean;
  ignorePatterns?: string[];
}

export class RouteDiscovery {
  private cache = new Map<string, Route[]>();
  private readonly cacheTimeout = 5000; // 5 seconds for dev, longer for production
  
  /**
   * Single source of truth for route discovery
   * Context-aware: fast scanning for dev, thorough for production
   */
  async discover(projectPath: string, options: DiscoveryOptions): Promise<Route[]> {
    const cacheKey = this.generateCacheKey(projectPath, options);
    const cached = this.cache.get(cacheKey);
    
    // Use cache in development for speed, skip in production for accuracy
    if (cached && options.mode === 'development') {
      if (options.debug) {
        logger.debug(`[RouteDiscovery] Cache hit: ${cached.length} routes`);
      }
      return cached;
    }
    
    const startTime = performance.now();
    const routes = await this.scanFileSystem(projectPath, options);
    const duration = performance.now() - startTime;
    
    // Cache result with appropriate TTL
    this.cache.set(cacheKey, routes);
    if (options.mode === 'development') {
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
    }
    
    if (options.debug) {
      logger.debug(`[RouteDiscovery] Discovered ${routes.length} routes in ${duration.toFixed(1)}ms`);
    }
    
    return routes;
  }
  
  /**
   * Context-aware file system scanning
   * Fast scanning for dev, comprehensive for production
   */
  private async scanFileSystem(projectPath: string, options: DiscoveryOptions): Promise<Route[]> {
    const routes: Route[] = [];
    const appDir = join(projectPath, 'app');
    
    if (!existsSync(appDir)) {
      if (options.debug) {
        logger.warn(`[RouteDiscovery] No app directory found at ${appDir}`);
      }
      return routes;
    }
    
    // Track route conflicts for production builds
    const routeConflicts = new Map<string, Array<{
      filePath: string;
      componentPath: string;
      routeGroup?: string;
      isGrouped: boolean;
    }>>();
    
    await this.scanDirectory(
      appDir, 
      '', 
      [], 
      undefined, 
      '', 
      routes, 
      routeConflicts,
      options
    );
    
    // Handle conflicts in production mode
    if (options.mode === 'production' && routeConflicts.size > 0) {
      this.resolveRouteConflicts(routeConflicts, routes, options);
    }
    
    // Sort routes by specificity
    this.sortRoutesBySpecificity(routes);
    
    return routes;
  }
  
  /**
   * Recursive directory scanning with Next.js pattern support
   */
  private async scanDirectory(
    dirPath: string,
    routePath: string,
    parentLayouts: Array<{ path: string; componentPath: string }>,
    routeGroup: string | undefined,
    fileSystemPath: string,
    routes: Route[],
    routeConflicts: Map<string, any[]>,
    options: DiscoveryOptions
  ): Promise<void> {
    try {
      if (!existsSync(dirPath)) return;
      
      const items = readdirSync(dirPath);
      
      // Find layout in current directory
      const layoutFiles = items.filter(item =>
        item.match(/^layout\.(tsx|jsx|ts|js)$/)
      );
      
      const currentLayouts = [...parentLayouts];
      if (layoutFiles.length > 0) {
        const layoutFile = layoutFiles[0];
        const layoutComponentPath = `/app${routePath}/${layoutFile.replace(/\.(tsx|ts)$/, '.js')}`;
        currentLayouts.push({
          path: routePath || '/',
          componentPath: layoutComponentPath
        });
      }
      
      // Find page files
      const pageFiles = items.filter(item =>
        item.match(/^page\.(tsx|jsx|ts|js)$/)
      );
      
      if (pageFiles.length > 0) {
        const pageFile = pageFiles[0];
        const processedRoute = this.processRoutePattern(routePath || '/');
        const componentPath = `/app${routePath}/${pageFile.replace(/\.(tsx|ts)$/, '.js')}`;
        const fullFilePath = join(dirPath, pageFile);
        const relativeFilePath = relative(join(dirPath, '../..'), fullFilePath);
        
        // Track for conflict detection
        const urlPath = processedRoute.path;
        if (!routeConflicts.has(urlPath)) {
          routeConflicts.set(urlPath, []);
        }
        
        routeConflicts.get(urlPath)!.push({
          filePath: relativeFilePath,
          componentPath,
          routeGroup,
          isGrouped: !!routeGroup
        });
        
        routes.push({
          path: processedRoute.path,
          componentPath,
          layouts: currentLayouts,
          isDynamic: processedRoute.isDynamic,
          dynamicSegments: processedRoute.dynamicSegments,
          routeGroup,
          filePath: relativeFilePath
        });
        
        if (options.debug) {
          logger.debug(`[RouteDiscovery] Found route: ${processedRoute.path} -> ${componentPath}`);
        }
      }
      
      // Scan subdirectories
      const subdirs = items.filter(item => {
        const itemPath = join(dirPath, item);
        try {
          return (
            statSync(itemPath).isDirectory() &&
            !item.startsWith('.') &&
            !item.startsWith('_') &&
            item !== 'node_modules'
          );
        } catch {
          return false;
        }
      });
      
      // Parallel directory scanning for performance
      const scanTasks = subdirs.map(async (subdir) => {
        const subdirPath = join(dirPath, subdir);
        
        if (subdir.startsWith('(') && subdir.endsWith(')')) {
          // Route group - doesn't affect URL structure
          const groupName = subdir.slice(1, -1);
          await this.scanDirectory(
            subdirPath,
            routePath,
            currentLayouts,
            groupName,
            fileSystemPath + `(${groupName})/`,
            routes,
            routeConflicts,
            options
          );
        } else {
          // Normal directory
          const subroutePath = routePath + '/' + subdir;
          await this.scanDirectory(
            subdirPath,
            subroutePath,
            currentLayouts,
            routeGroup,
            fileSystemPath + subdir + '/',
            routes,
            routeConflicts,
            options
          );
        }
      });
      
      // Use parallel processing in development, sequential in production for stability
      if (options.mode === 'development') {
        await Promise.all(scanTasks);
      } else {
        for (const task of scanTasks) {
          await task;
        }
      }
      
    } catch (error) {
      if (options.debug) {
        logger.warn(`[RouteDiscovery] Error scanning ${dirPath}: ${error}`);
      }
    }
  }
  
  /**
   * Process Next.js route patterns (dynamic routes, catch-all, etc.)
   */
  private processRoutePattern(routePath: string): {
    path: string;
    isDynamic: boolean;
    dynamicSegments: Array<{ name: string; type: 'dynamic' | 'catchAll' | 'optionalCatchAll' }>;
  } {
    const segments = routePath.split('/').filter(s => s);
    const processedSegments: string[] = [];
    const dynamicSegments: Array<{ name: string; type: 'dynamic' | 'catchAll' | 'optionalCatchAll' }> = [];
    let isDynamic = false;
    
    for (const segment of segments) {
      if (segment.startsWith('[[') && segment.endsWith(']]')) {
        // Optional catch-all: [[...slug]]
        const paramName = segment.slice(5, -2);
        processedSegments.push(':' + paramName + '*');
        dynamicSegments.push({ name: paramName, type: 'optionalCatchAll' });
        isDynamic = true;
      } else if (segment.startsWith('[...') && segment.endsWith(']')) {
        // Catch-all: [...slug]
        const paramName = segment.slice(4, -1);
        processedSegments.push(':' + paramName + '+');
        dynamicSegments.push({ name: paramName, type: 'catchAll' });
        isDynamic = true;
      } else if (segment.startsWith('[') && segment.endsWith(']')) {
        // Dynamic: [slug]
        const paramName = segment.slice(1, -1);
        processedSegments.push(':' + paramName);
        dynamicSegments.push({ name: paramName, type: 'dynamic' });
        isDynamic = true;
      } else if (segment.startsWith('(') && segment.endsWith(')')) {
        // Route group - skip in URL
        continue;
      } else {
        // Static segment
        processedSegments.push(segment);
      }
    }
    
    const finalPath = '/' + processedSegments.join('/');
    return {
      path: finalPath === '//' ? '/' : finalPath,
      isDynamic,
      dynamicSegments
    };
  }
  
  /**
   * Resolve route conflicts with clear winner selection
   */
  private resolveRouteConflicts(
    routeConflicts: Map<string, any[]>,
    routes: Route[],
    options: DiscoveryOptions
  ): void {
    for (const [urlPath, sources] of routeConflicts.entries()) {
      if (sources.length > 1) {
        const sortedSources = [...sources].sort((a, b) => {
          // Non-grouped routes win over grouped routes
          if (!a.isGrouped && b.isGrouped) return -1;
          if (a.isGrouped && !b.isGrouped) return 1;
          return a.filePath.localeCompare(b.filePath);
        });
        
        const winner = sortedSources[0];
        
        if (options.debug) {
          logger.warn(`[RouteDiscovery] Route conflict for "${urlPath}": ${sources.length} files, winner: ${winner.filePath}`);
        }
        
        // Filter out losing routes
        for (let i = routes.length - 1; i >= 0; i--) {
          const route = routes[i];
          if (route.path === urlPath && route.filePath !== winner.filePath) {
            routes.splice(i, 1);
          }
        }
      }
    }
  }
  
  /**
   * Sort routes by specificity for proper matching
   */
  private sortRoutesBySpecificity(routes: Route[]): void {
    routes.sort((a, b) => {
      if (a.path === '/' && b.path !== '/') return 1;
      if (b.path === '/' && a.path !== '/') return -1;
      
      // Static routes before dynamic routes
      if (!a.isDynamic && b.isDynamic) return -1;
      if (a.isDynamic && !b.isDynamic) return 1;
      
      // More segments = more specific
      const aSegments = a.path.split('/').filter(s => s).length;
      const bSegments = b.path.split('/').filter(s => s).length;
      return bSegments - aSegments;
    });
  }
  
  /**
   * Generate cache key for route discovery results
   */
  private generateCacheKey(projectPath: string, options: DiscoveryOptions): string {
    return `${projectPath}:${options.mode}:${JSON.stringify(options.ignorePatterns || [])}`;
  }
  
  /**
   * Clear all cached routes (useful for development)
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance for convenience
export const routeDiscovery = new RouteDiscovery(); 