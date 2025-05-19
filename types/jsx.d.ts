/**
 * Global type definitions for JSX/TSX support in 0x1 framework
 */

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  
  interface ElementAttributesProperty {
    props: Record<string, unknown>;
  }
  
  interface ElementChildrenAttribute {
    children: Record<string, unknown>;
  }
}

declare module '0x1' {
  export const createElement: (type: any, props: any, ...children: any[]) => any;
  export const Fragment: any;
  export const renderToString: (node: any) => string;
  export type JSXNode = any;
  export type JSXAttributes = Record<string, any>;
  export type JSXChildren = any[];
  export type ComponentFunction = (props: any) => any;
}
