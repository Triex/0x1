/**
 * JSX type declarations for 0x1 Framework templates
 */

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  
  interface Element {
    type: any;
    props: any;
    key: any;
  }
  
  interface ElementClass {
    render: any;
  }
  
  interface ElementAttributesProperty {
    props: any;
  }
  
  interface ElementChildrenAttribute {
    children: any;
  }
}

declare module "0x1/jsx-runtime" {
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export function jsxDEV(type: any, props: any, key?: any): any;
  export { jsx as Fragment };
}

declare module "0x1/jsx-dev-runtime" {
  export function jsxDEV(type: any, props: any, key?: any): any;
  export { jsxDEV as Fragment, jsxDEV as jsx, jsxDEV as jsxs };
} 