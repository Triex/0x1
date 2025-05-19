/**
 * 0x1 Framework Type Definitions
 */

export interface _0x1Config {
  app: {
    name: string;
    title: string;
    description: string;
    [key: string]: any;
  };
  server: {
    port: number;
    host: string;
    basePath: string;
    [key: string]: any;
  };
  routes: Record<string, string>;
  styling: {
    tailwind:
      | boolean
      | {
          version: string;
          config: {
            darkMode?: 'media' | 'class';
            future?: Record<string, boolean>;
            plugins?: any[];
            [key: string]: any;
          };
        };
    [key: string]: any;
  };
  build: {
    outDir: string;
    minify: boolean;
    precomputeTemplates?: boolean;
    prefetchLinks?: boolean;
    [key: string]: any;
  };
  deployment?: {
    provider?: string;
    edge?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}
