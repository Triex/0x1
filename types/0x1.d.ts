/**
 * 0x1 Framework Type Definitions
 * 
 * This is the consolidated type declaration file for the 0x1 framework.
 */

// Main module declaration
declare module '0x1' {
  // JSX types and rendering
  export function createElement(type: any, props: any, ...children: any[]): any;
  export const Fragment: any;
  export function renderToString(node: any): string;
  
  // Component types
  export type JSXNode = any;
  export type JSXAttributes = Record<string, any>;
  export type JSXChildren = any[];
  export type ComponentFunction = (props: any) => any;
  
  // Store functionality
  export function createStore<T>(
    initialState: T,
    options?: { persist?: boolean; storageKey?: string }
  ): {
    getState: () => T;
    setState: (newState: Partial<T>) => void;
    subscribe: (listener: (state: T) => void) => () => void;
  };
  
  // HTML helpers
  export function html(strings: TemplateStringsArray, ...values: any[]): string;
  
  // Routing
  export class Router {
    constructor();
    add(path: string, handler: () => void): Router;
    notFound(handler: () => void): Router;
    navigate(path: string): void;
    start(): void;
    updateActiveLinks(): void;
  }
  
  export function Link(props: { href: string; children: any; className?: string }): string;

  // Configuration interface
  export interface Config {
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
}

// Path-specific module declarations for templates
declare module '0x1/core/router' {
  export interface RouterOptions {
    rootElement: HTMLElement;
    mode?: 'history' | 'hash';
    transitionDuration?: number;
    appComponents?: Record<string, { default: any }>;
    autoDiscovery?: boolean;
  }

  export class Router {
    constructor(options: RouterOptions);
    init(): void;
  }
}

declare module '0x1/core/component' {
  export type Component = (props?: any) => HTMLElement | DocumentFragment | Node | null | void;
}
