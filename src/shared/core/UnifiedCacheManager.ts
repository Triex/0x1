/**
 * 0x1 Framework - Unified Cache Manager
 * Context-aware caching system for both dev and build modes
 * Provides intelligent cache invalidation and optimal performance
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { logger } from '../../cli/utils/logger';

export interface CacheEntry {
  content: string;
  hash: string;
  mtime: number;
  metadata: {
    dependencies: string[];
    compilationTime: number;
    sourcePath: string;
    mode: 'development' | 'production';
  };
}

export interface CacheOptions {
  mode: 'development' | 'production';
  projectPath: string;
  cacheDir?: string;
  maxEntries?: number;
  ttl?: number; // Time to live in milliseconds
  debug?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  totalSize: number;
}

export class UnifiedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private options: Required<CacheOptions>;
  private cacheFile: string;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    hitRate: 0,
    totalSize: 0
  };

  constructor(options: CacheOptions) {
    this.options = {
      cacheDir: '.0x1/cache',
      maxEntries: 1000,
      ttl: 1000 * 60 * 60, // 1 hour default
      debug: false,
      ...options
    };

    this.cacheFile = join(this.options.projectPath, this.options.cacheDir, `${this.options.mode}-cache.json`);
    
    this.ensureCacheDirectory();
    this.loadCache();
    this.setupCleanupTimer();
  }

  /**
   * Get cached entry with intelligent validation
   */
  async get(key: string, sourcePath?: string): Promise<CacheEntry | null> {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Validate cache entry
    if (await this.isEntryValid(entry, sourcePath)) {
      this.stats.hits++;
      this.updateHitRate();
      
      if (this.options.debug) {
        logger.info(`[Cache] HIT: ${key}`);
      }
      
      return entry;
    } else {
      // Invalid entry, remove it
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.updateHitRate();
      
      if (this.options.debug) {
        logger.info(`[Cache] INVALID: ${key}`);
      }
      
      return null;
    }
  }

  /**
   * Set cache entry with metadata
   */
  async set(key: string, content: string, sourcePath: string, dependencies: string[] = []): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const hash = this.generateContentHash(content);
    const mtime = sourcePath && existsSync(sourcePath) ? statSync(sourcePath).mtime.getTime() : Date.now();

    const entry: CacheEntry = {
      content,
      hash,
      mtime,
      metadata: {
        dependencies,
        compilationTime: Date.now(),
        sourcePath,
        mode: this.options.mode
      }
    };

    this.cache.set(cacheKey, entry);
    this.stats.entries = this.cache.size;
    
    // Cleanup if we exceed max entries
    if (this.cache.size > this.options.maxEntries!) {
      await this.cleanup();
    }

    if (this.options.debug) {
      logger.info(`[Cache] SET: ${key}`);
    }

    // Persist cache periodically
    if (this.cache.size % 10 === 0) {
      await this.saveCache();
    }
  }

  /**
   * Check if a file or its dependencies have changed
   */
  async hasChanged(key: string, sourcePath?: string, dependencies: string[] = []): Promise<boolean> {
    const entry = await this.get(key, sourcePath);
    if (!entry) return true;

    // Check main file
    if (sourcePath && existsSync(sourcePath)) {
      const currentMtime = statSync(sourcePath).mtime.getTime();
      if (currentMtime > entry.mtime) return true;
    }

    // Check dependencies
    for (const dep of [...entry.metadata.dependencies, ...dependencies]) {
      if (existsSync(dep)) {
        const depMtime = statSync(dep).mtime.getTime();
        if (depMtime > entry.metadata.compilationTime) return true;
      }
    }

    return false;
  }

  /**
   * Invalidate cache entry and dependencies
   */
  async invalidate(key: string): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    
    // Remove main entry
    if (this.cache.delete(cacheKey)) {
      if (this.options.debug) {
        logger.info(`[Cache] INVALIDATED: ${key}`);
      }
    }

    // Remove dependent entries
    const dependentKeys = Array.from(this.cache.keys()).filter(k => {
      const entry = this.cache.get(k);
      return entry?.metadata.dependencies.some(dep => dep.includes(key));
    });

    for (const depKey of dependentKeys) {
      this.cache.delete(depKey);
      if (this.options.debug) {
        logger.info(`[Cache] INVALIDATED DEPENDENT: ${depKey}`);
      }
    }

    this.stats.entries = this.cache.size;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      hitRate: 0,
      totalSize: 0
    };

    try {
      if (existsSync(this.cacheFile)) {
        await Bun.$`rm -f ${this.cacheFile}`;
      }
    } catch (error) {
      // Silent fail
    }

    if (this.options.debug) {
      logger.info('[Cache] CLEARED');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      totalSize: this.calculateTotalSize()
    };
  }

  /**
   * Save cache to disk
   */
  async saveCache(): Promise<void> {
    try {
      const cacheData = Array.from(this.cache.entries());
      const jsonData = JSON.stringify({
        entries: cacheData,
        stats: this.stats,
        timestamp: Date.now(),
        mode: this.options.mode
      }, null, 2);

      writeFileSync(this.cacheFile, jsonData, 'utf-8');

      if (this.options.debug) {
        logger.info(`[Cache] Saved ${this.cache.size} entries to ${this.cacheFile}`);
      }
    } catch (error) {
      if (this.options.debug) {
        logger.warn(`[Cache] Failed to save: ${error}`);
      }
    }
  }

  /**
   * Load cache from disk
   */
  private loadCache(): void {
    try {
      if (!existsSync(this.cacheFile)) return;

      const jsonData = readFileSync(this.cacheFile, 'utf-8');
      const cacheData = JSON.parse(jsonData);

      // Validate cache data structure
      if (!cacheData.entries || !Array.isArray(cacheData.entries)) return;

      // Only load cache from same mode
      if (cacheData.mode !== this.options.mode) {
        if (this.options.debug) {
          logger.info(`[Cache] Skipping cache from different mode: ${cacheData.mode}`);
        }
        return;
      }

      // Load entries
      for (const [key, entry] of cacheData.entries) {
        if (this.isValidCacheEntry(entry)) {
          this.cache.set(key, entry);
        }
      }

      // Restore stats
      if (cacheData.stats) {
        this.stats = { ...this.stats, ...cacheData.stats };
      }

      this.stats.entries = this.cache.size;
      this.updateHitRate();

      if (this.options.debug) {
        logger.info(`[Cache] Loaded ${this.cache.size} entries from ${this.cacheFile}`);
      }
    } catch (error) {
      if (this.options.debug) {
        logger.warn(`[Cache] Failed to load: ${error}`);
      }
    }
  }

  /**
   * Validate cache entry structure
   */
  private isValidCacheEntry(entry: any): entry is CacheEntry {
    return (
      entry &&
      typeof entry.content === 'string' &&
      typeof entry.hash === 'string' &&
      typeof entry.mtime === 'number' &&
      entry.metadata &&
      Array.isArray(entry.metadata.dependencies)
    );
  }

  /**
   * Check if cache entry is still valid
   */
  private async isEntryValid(entry: CacheEntry, sourcePath?: string): Promise<boolean> {
    // Check TTL
    const age = Date.now() - entry.metadata.compilationTime;
    if (age > this.options.ttl!) {
      return false;
    }

    // Check file modification time
    if (sourcePath && existsSync(sourcePath)) {
      const currentMtime = statSync(sourcePath).mtime.getTime();
      if (currentMtime > entry.mtime) {
        return false;
      }
    }

    // Check dependencies
    for (const dep of entry.metadata.dependencies) {
      if (existsSync(dep)) {
        const depMtime = statSync(dep).mtime.getTime();
        if (depMtime > entry.metadata.compilationTime) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Generate cache key from input
   */
  private generateCacheKey(key: string): string {
    return createHash('md5')
      .update(`${this.options.mode}:${key}`)
      .digest('hex');
  }

  /**
   * Generate content hash
   */
  private generateContentHash(content: string): string {
    return createHash('md5')
      .update(content)
      .digest('hex');
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Calculate total cache size
   */
  private calculateTotalSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.content.length;
    }
    return totalSize;
  }

  /**
   * Cleanup old entries
   */
  private async cleanup(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by compilation time (oldest first)
    entries.sort((a, b) => a[1].metadata.compilationTime - b[1].metadata.compilationTime);
    
    // Remove oldest 10%
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    this.stats.entries = this.cache.size;

    if (this.options.debug) {
      logger.info(`[Cache] Cleaned up ${toRemove} old entries`);
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): void {
    const cacheDir = dirname(this.cacheFile);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
  }

  /**
   * Setup cleanup timer for development mode
   */
  private setupCleanupTimer(): void {
    if (this.options.mode === 'development') {
      // Clean up every 10 minutes in development
      setInterval(() => {
        this.cleanup();
      }, 10 * 60 * 1000);
    }
  }

  /**
   * Graceful shutdown - save cache
   */
  async shutdown(): Promise<void> {
    await this.saveCache();
    
    if (this.options.debug) {
      const stats = this.getStats();
      logger.info(`[Cache] Shutdown - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate.toFixed(1)}%`);
    }
  }
}

// Export singleton instances for both modes
export const devCacheManager = new UnifiedCacheManager({
  mode: 'development',
  projectPath: process.cwd(),
  ttl: 1000 * 60 * 30, // 30 minutes for dev
  debug: true
});

export const buildCacheManager = new UnifiedCacheManager({
  mode: 'production',
  projectPath: process.cwd(),
  ttl: 1000 * 60 * 60 * 24, // 24 hours for build
  maxEntries: 5000,
  debug: false
}); 