/**
 * Type definitions for the 0x1 framework
 */

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
}
