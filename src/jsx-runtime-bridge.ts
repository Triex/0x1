/**
 * JSX Runtime Bridge
 * This file acts as a bridge between the framework's JSX runtime and consuming applications
 * ensuring all types are properly exported and available.
 */

// Reference our type definitions to make them available to consumers
/// <reference path="../types/jsx.d.ts" />
/// <reference path="../types/jsx-runtime.d.ts" />

// Re-export everything from jsx-runtime
export * from './jsx-runtime';

// Export specific JSX namespace for TypeScript
export namespace JSX {
  export interface Element {
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
  
  export interface ElementClass {
    render(): Element;
  }
  
  export interface ElementAttributesProperty {
    props: any;
  }
  
  export interface ElementChildrenAttribute {
    children: any;
  }
  
  export interface IntrinsicElements {
    [elemName: string]: any;
  }
}
