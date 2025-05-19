/**
 * Global JSX declarations for the 0x1 framework
 * This provides VSCode with the necessary information to understand JSX syntax
 */

// Reference the framework's type definitions
/// <reference path="../../types/0x1.d.ts" />

// Define global JSX namespace for TypeScript tooling
declare global {
  namespace JSX {
    interface Element {}
    
    interface ElementAttributesProperty {
      props: {};
    }
    
    interface ElementChildrenAttribute {
      children: {};
    }
    
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
