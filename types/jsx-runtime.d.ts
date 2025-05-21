// Type definitions for 0x1 JSX runtime
declare namespace JSX {
  interface Element extends HTMLElement {}
  
  interface IntrinsicElements {
    // HTML elements
    [elemName: string]: any;
  }
  
  interface ElementChildrenAttribute {
    children: Record<string, unknown>;
  }
}

declare module '0x1/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export const createElement: any;
  export type JSXNode = any;
  export type JSXChildren = any[];
  export type JSXAttributes = { [key: string]: any };
  export type ComponentFunction = (props: any, ...args: any[]) => any;
}

declare module '0x1/jsx-dev-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export const createElement: any;
  export const jsxDEV: any;
}
