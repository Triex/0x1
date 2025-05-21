/// <reference path="jsx.d.ts" />

import { ComponentFunction, JSXNode, JSXChildren, JSXAttributes } from '0x1';

declare global {
  namespace JSX {
    interface Element extends JSXNode {}
    
    interface ElementClass {
      render(): JSXNode;
    }

    interface ElementAttributesProperty {
      props: {};
    }

    interface ElementChildrenAttribute {
      children: JSXChildren;
    }

    interface IntrinsicElements {
      // HTML Elements
      a: JSXAttributes<HTMLAnchorElement>;
      div: JSXAttributes<HTMLDivElement>;
      span: JSXAttributes<HTMLSpanElement>;
      button: JSXAttributes<HTMLButtonElement>;
      input: JSXAttributes<HTMLInputElement> & { type?: string };
      form: JSXAttributes<HTMLFormElement>;
      label: JSXAttributes<HTMLLabelElement>;
      select: JSXAttributes<HTMLSelectElement>;
      option: JSXAttributes<HTMLOptionElement>;
      textarea: JSXAttributes<HTMLTextAreaElement>;
      img: JSXAttributes<HTMLImageElement> & { src: string; alt: string };
      
      // Add more HTML elements as needed
      [elemName: string]: any;
    }
  }
}

declare module '0x1/jsx-runtime' {
  import { ComponentFunction, JSXNode, JSXChildren, JSXAttributes } from '0x1';

  export function jsx(
    type: string | ComponentFunction,
    props: any,
    key?: string
  ): JSXNode;

  export function jsxs(
    type: string | ComponentFunction,
    props: any,
    key?: string
  ): JSXNode;

  // We use a symbol for Fragment in typings to prevent conflicts with implementation
  // Note: This is just for type checking - the actual implementation is in jsx-runtime.ts
  export const Fragment: unique symbol | ((props: { children?: JSXChildren }) => JSXNode);
  
  export function createElement(
    type: string | ComponentFunction,
    props: any,
    ...children: JSXChildren
  ): JSXNode;
}

declare module '0x1/jsx-dev-runtime' {
  export * from '0x1/jsx-runtime';
  
  export function jsxDEV(
    type: any,
    props: any,
    key: any,
    isStaticChildren: boolean,
    source?: any,
    self?: any
  ): any;
}

// Add this to make TypeScript recognize .tsx files as modules
export {};
