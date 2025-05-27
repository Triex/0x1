/**
 * 0x1 Framework Type Definitions
 * 
 * This file re-exports all type definitions to make them available to consuming applications
 */

// Re-export JSX namespace and related types
export * from './jsx';
export * from './jsx-runtime';

// JSX namespace augmentation - automatically picked up by TypeScript when using the framework
import './jsx';
import './jsx-runtime';

// Export JSX Element type
export declare namespace JSX {
  interface Element {
    type: string | Function;
    props: any;
    children: any[];
    __source?: {
      fileName: string;
      lineNumber: number;
      columnNumber: number;
    };
    __self?: any;
  }
  
  // Type definitions for the JSX transformer
  export interface ElementClass {
    render(): Element;
  }
  
  export interface ElementAttributesProperty {
    props: any;
  }
  
  export interface ElementChildrenAttribute {
    children: any;
  }
}

// Component type definitions
export type ComponentFunction<P = any> = (props: P) => JSX.Element;
export type ComponentClass<P = any> = new (props: P) => { render(): JSX.Element };
export type Component<P = any> = ComponentFunction<P> | ComponentClass<P>;

// JSX specific types
export type JSXNode = JSX.Element;
export type JSXChildren = JSXNode | JSXNode[] | string | number | boolean | null | undefined;
export type JSXAttributes<T = HTMLElement> = Record<string, any> & {
  children?: JSXChildren;
  ref?: { current: T | null } | ((instance: T | null) => void);
};

/**
 * Fragment component for grouping elements without a wrapper
 */
export declare const Fragment: unique symbol;
