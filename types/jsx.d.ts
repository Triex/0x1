/**
 * Global JSX namespace declaration for TypeScript
 */

import type { HTMLAttributes, JSXNode } from './jsx.js';

declare global {
  namespace JSX {
    // The return type of JSX expressions
    type Element = JSXNode;
    
    interface ElementClass {
      render(): Element;
    }
    
    interface ElementAttributesProperty {
      props: any;
    }
    
    interface ElementChildrenAttribute {
      children: any;
    }
    
    // All HTML elements with proper typing
    interface IntrinsicElements {
      // Common elements
      div: HTMLAttributes<HTMLDivElement>;
      span: HTMLAttributes<HTMLSpanElement>;
      p: HTMLAttributes<HTMLParagraphElement>;
      a: HTMLAttributes<HTMLAnchorElement> & { href?: string; target?: string };
      button: HTMLAttributes<HTMLButtonElement> & { type?: 'button' | 'submit' | 'reset' };
      input: HTMLAttributes<HTMLInputElement> & { type?: string };
      form: HTMLAttributes<HTMLFormElement>;
      img: HTMLAttributes<HTMLImageElement> & { src: string; alt: string };
      
      // Headings
      h1: HTMLAttributes<HTMLHeadingElement>;
      h2: HTMLAttributes<HTMLHeadingElement>;
      h3: HTMLAttributes<HTMLHeadingElement>;
      h4: HTMLAttributes<HTMLHeadingElement>;
      h5: HTMLAttributes<HTMLHeadingElement>;
      h6: HTMLAttributes<HTMLHeadingElement>;
      
      // Lists
      ul: HTMLAttributes<HTMLUListElement>;
      ol: HTMLAttributes<HTMLOListElement>;
      li: HTMLAttributes<HTMLLIElement>;
      
      // Other common elements
      header: HTMLAttributes<HTMLElement>;
      footer: HTMLAttributes<HTMLElement>;
      main: HTMLAttributes<HTMLElement>;
      nav: HTMLAttributes<HTMLElement>;
      section: HTMLAttributes<HTMLElement>;
      article: HTMLAttributes<HTMLElement>;
      
      // Allow any HTML element
      [elemName: string]: any;
    }
  }
}

export { };

