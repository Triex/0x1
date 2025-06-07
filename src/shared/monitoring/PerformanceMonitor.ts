/**
 * 0x1 Framework - Unified Performance Monitor
 * Real-time performance monitoring for both dev and build modes
 * Provides metrics, insights, and optimization recommendations
 */

import { logger } from '../../cli/utils/logger';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  context: 'development' | 'production';
  category: 'build' | 'transpilation' | 'discovery' | 'cache' | 'plugin' | 'network' | 'other';
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalMetrics: number;
  averageDuration: number;
  totalDuration: number;
  fastestMetric: PerformanceMetric | null;
  slowestMetric: PerformanceMetric | null;
  categories: Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
  }>;
}

export interface PerformanceReport {
  overview: PerformanceStats;
  development: PerformanceStats;
  production: PerformanceStats;
  recommendations: string[];
  bottlenecks: PerformanceMetric[];
  trends: {
    improvingMetrics: string[];
    degradingMetrics: string[];
  };
}

export interface PerformanceTimer {
  name: string;
  category: 'build' | 'transpilation' | 'discovery' | 'cache' | 'plugin' | 'network' | 'other';
  context: 'development' | 'production';
  startTime: number;
  stop(): PerformanceMetric;
}

export interface MonitorOptions {
  mode: 'development' | 'production';
  enableDetailedLogging?: boolean;
  slowThreshold?: number; // milliseconds
  reportInterval?: number; // milliseconds
  maxMetricsHistory?: number;
}

export class UnifiedPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, PerformanceTimer> = new Map();
  private options: Required<MonitorOptions>;
  private reportIntervalId?: any;
  private metricsHistory: Map<string, number[]> = new Map();

  constructor(options: MonitorOptions) {
    this.options = {
      enableDetailedLogging: false,
      slowThreshold: 100, // 100ms
      reportInterval: 30000, // 30 seconds
      maxMetricsHistory: 1000,
      ...options
    };

    // Start periodic reporting if enabled
    if (this.options.reportInterval > 0 && this.options.enableDetailedLogging) {
      this.startPeriodicReporting();
    }
  }

  /**
   * Start timing a phase
   */
  startPhase(
    name: string, 
    category: 'build' | 'transpilation' | 'discovery' | 'cache' | 'plugin' | 'network' | 'other' = 'other',
    metadata?: Record<string, any>
  ): PerformanceTimer {
    const timer: PerformanceTimer = {
      name,
      category,
      context: this.options.mode,
      startTime: performance.now(),
      stop: () => {
        const endTime = performance.now();
        const duration = endTime - timer.startTime;
        
        const metric: PerformanceMetric = {
          name: timer.name,
          startTime: timer.startTime,
          endTime,
          duration,
          context: timer.context,
          category: timer.category,
          metadata
        };

        this.recordMetric(metric);
        this.activeTimers.delete(name);
        
        return metric;
      }
    };

    this.activeTimers.set(name, timer);

    if (this.options.enableDetailedLogging) {
      logger.debug(`[PerformanceMonitor] Started: ${name} (${category})`);
    }

    return timer;
  }

  /**
   * Record a completed metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Maintain history for trend analysis
    const history = this.metricsHistory.get(metric.name) || [];
    history.push(metric.duration!);
    
    // Keep only recent history
    if (history.length > 10) {
      history.shift();
    }
    
    this.metricsHistory.set(metric.name, history);

    // Cleanup old metrics
    if (this.metrics.length > this.options.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.options.maxMetricsHistory);
    }

    // Log slow operations
    if (metric.duration! > this.options.slowThreshold && this.options.enableDetailedLogging) {
      logger.warn(`[PerformanceMonitor] SLOW: ${metric.name} took ${metric.duration!.toFixed(2)}ms (threshold: ${this.options.slowThreshold}ms)`);
    } else if (this.options.enableDetailedLogging) {
      logger.debug(`[PerformanceMonitor] Completed: ${metric.name} in ${metric.duration!.toFixed(2)}ms`);
    }
  }

  /**
   * Record a phase duration manually
   */
  recordPhase(
    name: string, 
    duration: number, 
    category: 'build' | 'transpilation' | 'discovery' | 'cache' | 'plugin' | 'network' | 'other' = 'other',
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      context: this.options.mode,
      category,
      metadata
    };

    this.recordMetric(metric);
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Get metrics by context
   */
  getMetricsByContext(context: 'development' | 'production'): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.context === context);
  }

  /**
   * Calculate statistics for metrics
   */
  calculateStats(metrics: PerformanceMetric[]): PerformanceStats {
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        totalDuration: 0,
        fastestMetric: null,
        slowestMetric: null,
        categories: {}
      };
    }

    const durations = metrics.map(m => m.duration!);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / metrics.length;
    
    const sortedMetrics = metrics.sort((a, b) => a.duration! - b.duration!);
    const fastestMetric = sortedMetrics[0];
    const slowestMetric = sortedMetrics[sortedMetrics.length - 1];

    // Group by category
    const categories: Record<string, { count: number; totalDuration: number; averageDuration: number }> = {};
    
    for (const metric of metrics) {
      if (!categories[metric.category]) {
        categories[metric.category] = { count: 0, totalDuration: 0, averageDuration: 0 };
      }
      categories[metric.category].count++;
      categories[metric.category].totalDuration += metric.duration!;
    }

    // Calculate averages
    for (const category of Object.keys(categories)) {
      categories[category].averageDuration = categories[category].totalDuration / categories[category].count;
    }

    return {
      totalMetrics: metrics.length,
      averageDuration,
      totalDuration,
      fastestMetric,
      slowestMetric,
      categories
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const allMetrics = this.metrics;
    const devMetrics = this.getMetricsByContext('development');
    const prodMetrics = this.getMetricsByContext('production');

    const overview = this.calculateStats(allMetrics);
    const development = this.calculateStats(devMetrics);
    const production = this.calculateStats(prodMetrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(overview, development, production);
    
    // Identify bottlenecks (top 10% slowest operations)
    const sortedMetrics = allMetrics.sort((a, b) => b.duration! - a.duration!);
    const bottleneckCount = Math.max(1, Math.floor(allMetrics.length * 0.1));
    const bottlenecks = sortedMetrics.slice(0, bottleneckCount);

    // Analyze trends
    const trends = this.analyzeTrends();

    return {
      overview,
      development,
      production,
      recommendations,
      bottlenecks,
      trends
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    overview: PerformanceStats,
    development: PerformanceStats,
    production: PerformanceStats
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance recommendations
    if (overview.averageDuration > 200) {
      recommendations.push('Consider enabling more aggressive caching to reduce average operation time');
    }

    if (overview.categories.transpilation?.averageDuration > 100) {
      recommendations.push('Transpilation is slow - consider splitting large files or using incremental compilation');
    }

    if (overview.categories.discovery?.averageDuration > 50) {
      recommendations.push('Route/component discovery is slow - consider caching discovered routes');
    }

    if (overview.categories.build?.averageDuration > 500) {
      recommendations.push('Build process is slow - consider parallel processing and build optimization');
    }

    // Development vs production comparison
    if (development.averageDuration > production.averageDuration * 2) {
      recommendations.push('Development mode is significantly slower than production - consider dev-specific optimizations');
    }

    // Cache performance
    if (overview.categories.cache?.averageDuration > 10) {
      recommendations.push('Cache operations are slow - consider using faster storage or smaller cache entries');
    }

    // Plugin performance
    if (overview.categories.plugin?.averageDuration > 50) {
      recommendations.push('Plugin execution is slow - review plugin priority and consider disabling unused plugins');
    }

    // General recommendations
    if (overview.totalMetrics > 1000) {
      recommendations.push('High number of operations detected - consider batching or reducing granularity');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is good! No specific recommendations at this time.');
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): { improvingMetrics: string[]; degradingMetrics: string[] } {
    const improvingMetrics: string[] = [];
    const degradingMetrics: string[] = [];

    for (const [metricName, history] of this.metricsHistory) {
      if (history.length < 3) continue; // Need at least 3 data points

      const recent = history.slice(-3);
      const older = history.slice(0, -3);
      
      if (older.length === 0) continue;

      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

      const improvement = (olderAvg - recentAvg) / olderAvg;

      if (improvement > 0.1) { // 10% improvement
        improvingMetrics.push(metricName);
      } else if (improvement < -0.1) { // 10% degradation
        degradingMetrics.push(metricName);
      }
    }

    return { improvingMetrics, degradingMetrics };
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    this.reportIntervalId = setInterval(() => {
      const report = this.generateReport();
      this.logReport(report);
    }, this.options.reportInterval);
  }

  /**
   * Stop periodic reporting
   */
  stopPeriodicReporting(): void {
    if (this.reportIntervalId) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = undefined;
    }
  }

  /**
   * Log performance report
   */
  logReport(report: PerformanceReport): void {
    logger.info(`[PerformanceMonitor] Performance Report (${this.options.mode})`);
    logger.info(`Total Operations: ${report.overview.totalMetrics}`);
    logger.info(`Average Duration: ${report.overview.averageDuration.toFixed(2)}ms`);
    logger.info(`Total Time: ${report.overview.totalDuration.toFixed(2)}ms`);
    
    if (report.bottlenecks.length > 0) {
      logger.warn(`Slowest Operation: ${report.bottlenecks[0].name} (${report.bottlenecks[0].duration!.toFixed(2)}ms)`);
    }

    if (report.recommendations.length > 0) {
      logger.info('Performance Recommendations:');
      report.recommendations.forEach(rec => logger.info(`  • ${rec}`));
    }

    if (report.trends.improvingMetrics.length > 0) {
      logger.success(`Improving: ${report.trends.improvingMetrics.join(', ')}`);
    }

    if (report.trends.degradingMetrics.length > 0) {
      logger.warn(`Degrading: ${report.trends.degradingMetrics.join(', ')}`);
    }
  }

  /**
   * Get current performance snapshot
   */
  getSnapshot(): {
    activeTimers: number;
    totalMetrics: number;
    recentAverage: number;
    mode: string;
  } {
    const recentMetrics = this.metrics.slice(-10);
    const recentAverage = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration!, 0) / recentMetrics.length 
      : 0;

    return {
      activeTimers: this.activeTimers.size,
      totalMetrics: this.metrics.length,
      recentAverage,
      mode: this.options.mode
    };
  }

  /**
   * Clear all metrics and history
   */
  clear(): void {
    this.metrics = [];
    this.metricsHistory.clear();
    this.activeTimers.clear();
    
    if (this.options.enableDetailedLogging) {
      logger.info('[PerformanceMonitor] Cleared all metrics');
    }
  }

  /**
   * Dispose monitor and cleanup
   */
  dispose(): void {
    this.stopPeriodicReporting();
    this.clear();
    
    if (this.options.enableDetailedLogging) {
      logger.info('[PerformanceMonitor] Disposed');
    }
  }
}

// Export singleton instances for both modes
export const devPerformanceMonitor = new UnifiedPerformanceMonitor({
  mode: 'development',
  enableDetailedLogging: true,
  slowThreshold: 50, // Lower threshold for dev
  reportInterval: 60000, // 1 minute
  maxMetricsHistory: 500
});

export const buildPerformanceMonitor = new UnifiedPerformanceMonitor({
  mode: 'production',
  enableDetailedLogging: false,
  slowThreshold: 100,
  reportInterval: 0, // No periodic reporting in build
  maxMetricsHistory: 1000
}); 