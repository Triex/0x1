/**
 * 0x1 Framework JSX Import Source Definition
 * 
 * This file is recognized by TypeScript when the jsxImportSource is set to "0x1"
 * in a project's tsconfig.json. It provides the JSX namespace that TypeScript uses
 * to type-check JSX expressions.
 */

import { JSXNode } from './jsx-runtime';

declare global {
  namespace JSX {
    // Element is the return type of JSX expressions
    interface Element extends JSXNode {}
    
    // ElementClass defines the minimum interface required for class components
    interface ElementClass {
      render(): Element;
    }
    
    // ElementAttributesProperty tells TypeScript which property of a component
    // contains its props
    interface ElementAttributesProperty {
      props: any; 
    }
    
    // ElementChildrenAttribute tells TypeScript which property of a component
    // contains its children
    interface ElementChildrenAttribute {
      children: any;
    }
    
    // IntrinsicElements maps HTML tag names to their attribute types
    interface IntrinsicElements {
      // Basic HTML elements
      div: any;
      span: any;
      a: any;
      p: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      button: any;
      input: any;
      img: any;
      form: any;
      label: any;
      select: any;
      option: any;
      textarea: any;
      
      // Allow any HTML element not explicitly listed
      [elemName: string]: any;
    }
  }
}
