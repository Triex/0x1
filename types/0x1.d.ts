/**
 * 0x1 Framework Type Definitions
 * 
 * This is the consolidated type declaration file for the 0x1 framework.
 */

// Reference DOM types
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference path="./jsx.d.ts" />

// Clean import declarations for Next.js-style imports
declare module '0x1/router' {
  export interface RouterOptions {
    root: HTMLElement;
    mode?: 'history' | 'hash';
    basePath?: string;
    notFoundComponent?: any;
    transitionDuration?: number;
  }
  
  export interface RouteParams {
    [key: string]: string;
  }

  export interface Page<T = any> {
    render: (params?: RouteParams) => HTMLElement;
    onMount?: (element: HTMLElement, params?: RouteParams) => void;
    onUnmount?: (element: HTMLElement) => void;
    getData?: () => Promise<T>;
  }

  export interface Component {
    render: (props?: any) => HTMLElement;
    onMount?: (element: HTMLElement, props?: any) => void;
    onUnmount?: (element: HTMLElement) => void;
  }
  
  export class Router {
    constructor(options: RouterOptions);
    rootElement: HTMLElement;
    mode: 'history' | 'hash';
    routes: Map<string, any>;
    basePath: string;
    notFoundComponent: any;
    transitionDuration: number;
    currentComponent: any;
    
    add(path: string, component: any): void;
    addRoute(path: string, component: Page<any> | Component): void;
    navigate(path: string): void;
    back(): void;
    forward(): void;
  }
  
  export interface LinkOptions {
    to: string;
    text: string;
    className?: string;
  }
  
  export class Link {
    constructor(options: LinkOptions);
    to: string;
    text: string;
    className: string;
    render(): HTMLElement;
  }
  
  export interface NavLinkOptions extends LinkOptions {
    activeClass?: string;
  }
  
  export class NavLink extends Link {
    constructor(options: NavLinkOptions);
    activeClass: string;
  }
  
  export interface RedirectOptions {
    to: string;
  }
  
  export class Redirect {
    constructor(options: RedirectOptions);
    to: string;
    render(): HTMLElement;
  }
}

// Main module declaration
declare module '0x1' {
  // JSX types and rendering - these are also defined in jsx.d.ts which is referenced above
  export function createElement(type: any, props: any, ...children: any[]): any;
  export const Fragment: unique symbol;
  export function renderToString(node: any): string;
  
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

// No additional declarations needed for '0x1/router' as they're defined at the top of the file

// Legacy path-specific module declarations for backward compatibility
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
