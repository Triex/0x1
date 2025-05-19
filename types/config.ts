/**
 * 0x1 Framework Configuration Types
 */

export interface _0x1Config {
  /**
   * Application information
   */
  app: {
    /**
     * Application name
     */
    name: string;
    
    /**
     * Application title used in HTML title
     */
    title: string;
    
    /**
     * Description for meta tags
     */
    description?: string;
  };
  
  /**
   * Server configuration
   */
  server: {
    /**
     * Port to run development server on
     */
    port: number;
    
    /**
     * Host to bind to
     */
    host: string;
    
    /**
     * Base path for the application
     */
    basePath: string;
    
    /**
     * Server middleware functions
     */
    middleware?: Array<(req: Request, next: () => Promise<Response>) => Promise<Response>>;
  };
  
  /**
   * Application routes
   */
  routes: Record<string, string>;
  
  /**
   * Styling configuration
   */
  styling: {
    /**
     * Use Tailwind CSS
     */
    tailwind: boolean;
    
    /**
     * Dark mode strategy ('class' or 'media')
     */
    darkMode?: 'class' | 'media';
    
    /**
     * Custom theme configuration
     */
    customTheme?: Record<string, any>;
  };
  
  /**
   * Build and optimization options
   */
  build: {
    /**
     * Output directory for build files
     */
    outDir: string;
    
    /**
     * Enable minification
     */
    minify: boolean;
    
    /**
     * Precompute templates for even faster rendering
     */
    precomputeTemplates?: boolean;
    
    /**
     * Prefetch links on hover
     */
    prefetchLinks?: boolean;
    
    /**
     * Build hooks
     */
    hooks?: {
      beforeBuild?: () => Promise<void> | void;
      afterBuild?: () => Promise<void> | void;
    };
  };
  
  /**
   * Deployment configuration
   */
  deployment?: {
    /**
     * Deployment provider
     */
    provider?: 'vercel' | 'netlify' | 'cloudflare' | 'github' | 'custom';
    
    /**
     * Enable edge functions
     */
    edge?: boolean;
    
    /**
     * Custom deployment command
     */
    command?: string;
  };
}
