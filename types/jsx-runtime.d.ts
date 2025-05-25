/**
 * 0x1 Framework JSX Runtime Type Definitions
 * This file provides TypeScript type definitions for the JSX runtime used by 0x1.
 */

// Ensure JSX types are available
/// <reference path="jsx.d.ts" />

// Define core types
export type JSXAttributes = Record<string, any>;
export type JSXChildren = (string | JSXNode | null | undefined | boolean | number)[];

export interface JSXNode {
  type: string | ComponentFunction;
  props: JSXAttributes;
  children: JSXChildren;
  key?: string | number | null;
  // Additional metadata for debugging
  __source?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  __self?: any;
}

export type ComponentFunction = (props: JSXAttributes & { children?: JSXChildren }) => string | JSXNode;

// Make types available globally to support JSX in consuming apps
declare global {
  namespace JSX {
    interface Element extends JSXNode {}
    
    interface ElementClass {
      render(): JSXNode;
    }

    interface ElementAttributesProperty {
      props: any; // Using any to avoid property narrowing issues
    }

    interface ElementChildrenAttribute {
      children: any; // Using any to avoid property narrowing issues
    }

    // Define common intrinsic elements that can be used in JSX
    interface IntrinsicElements {
      // Document elements
      html: JSXAttributes<HTMLHtmlElement>;
      head: JSXAttributes<HTMLHeadElement>;
      body: JSXAttributes<HTMLBodyElement>;
      title: JSXAttributes<HTMLTitleElement>;
      meta: JSXAttributes<HTMLMetaElement>;
      link: JSXAttributes<HTMLLinkElement>;
      script: JSXAttributes<HTMLScriptElement>;
      style: JSXAttributes<HTMLStyleElement>;
      
      // Sectioning elements
      div: JSXAttributes<HTMLDivElement>;
      span: JSXAttributes<HTMLSpanElement>;
      section: JSXAttributes<HTMLElement>;
      article: JSXAttributes<HTMLElement>;
      aside: JSXAttributes<HTMLElement>;
      header: JSXAttributes<HTMLElement>;
      footer: JSXAttributes<HTMLElement>;
      main: JSXAttributes<HTMLElement>;
      nav: JSXAttributes<HTMLElement>;
      
      // Text content elements
      p: JSXAttributes<HTMLParagraphElement>;
      h1: JSXAttributes<HTMLHeadingElement>;
      h2: JSXAttributes<HTMLHeadingElement>;
      h3: JSXAttributes<HTMLHeadingElement>;
      h4: JSXAttributes<HTMLHeadingElement>;
      h5: JSXAttributes<HTMLHeadingElement>;
      h6: JSXAttributes<HTMLHeadingElement>;
      ul: JSXAttributes<HTMLUListElement>;
      ol: JSXAttributes<HTMLOListElement>;
      li: JSXAttributes<HTMLLIElement>;
      blockquote: JSXAttributes<HTMLQuoteElement>;
      pre: JSXAttributes<HTMLPreElement>;
      code: JSXAttributes<HTMLElement>;
      
      // Form elements
      form: JSXAttributes<HTMLFormElement>;
      input: JSXAttributes<HTMLInputElement> & { type?: string };
      button: JSXAttributes<HTMLButtonElement> & { type?: 'button' | 'submit' | 'reset' };
      textarea: JSXAttributes<HTMLTextAreaElement>;
      select: JSXAttributes<HTMLSelectElement>;
      option: JSXAttributes<HTMLOptionElement>;
      label: JSXAttributes<HTMLLabelElement>;
      fieldset: JSXAttributes<HTMLFieldSetElement>;
      legend: JSXAttributes<HTMLLegendElement>;
      
      // Inline elements
      a: JSXAttributes<HTMLAnchorElement> & { href?: string; target?: string };
      strong: JSXAttributes<HTMLElement>;
      em: JSXAttributes<HTMLElement>;
      small: JSXAttributes<HTMLElement>;
      s: JSXAttributes<HTMLElement>;
      cite: JSXAttributes<HTMLElement>;
      q: JSXAttributes<HTMLQuoteElement>;
      time: JSXAttributes<HTMLTimeElement>;
      
      // Embedded content
      img: JSXAttributes<HTMLImageElement> & { src: string; alt: string };
      iframe: JSXAttributes<HTMLIFrameElement>;
      canvas: JSXAttributes<HTMLCanvasElement>;
      audio: JSXAttributes<HTMLAudioElement>;
      video: JSXAttributes<HTMLVideoElement>;
      source: JSXAttributes<HTMLSourceElement>;
      track: JSXAttributes<HTMLTrackElement>;
      embed: JSXAttributes<HTMLEmbedElement>;
      object: JSXAttributes<HTMLObjectElement>;
      
      // Table elements
      table: JSXAttributes<HTMLTableElement>;
      caption: JSXAttributes<HTMLTableCaptionElement>;
      colgroup: JSXAttributes<HTMLTableColElement>;
      col: JSXAttributes<HTMLTableColElement>;
      tbody: JSXAttributes<HTMLTableSectionElement>;
      thead: JSXAttributes<HTMLTableSectionElement>;
      tfoot: JSXAttributes<HTMLTableSectionElement>;
      tr: JSXAttributes<HTMLTableRowElement>;
      td: JSXAttributes<HTMLTableCellElement>;
      th: JSXAttributes<HTMLTableCellElement>;
      
      // Others
      hr: JSXAttributes<HTMLHRElement>;
      br: JSXAttributes<HTMLBRElement>;
      wbr: JSXAttributes<HTMLElement>;
      sup: JSXAttributes<HTMLElement>;
      sub: JSXAttributes<HTMLElement>;
      
      // SVG elements (basic support)
      svg: JSXAttributes<SVGSVGElement>;
      path: JSXAttributes<SVGPathElement>;
      circle: JSXAttributes<SVGCircleElement>;
      rect: JSXAttributes<SVGRectElement>;
      line: JSXAttributes<SVGLineElement>;
      g: JSXAttributes<SVGGElement>;
      
      // Allow any other element with any props
      [elemName: string]: any;
    }
  }
}

/**
 * JSX Runtime module for modern JSX transformation
 * Follows the React 17+ JSX transformation spec
 */
declare module '0x1/jsx-runtime' {
  /**
   * Create a JSX element (static children version)
   */
  export function jsx(
    type: string | ComponentFunction,
    props: any,
    key?: string
  ): JSXNode;

  /**
   * Create a JSX element (with potentially complex children structures)
   */
  export function jsxs(
    type: string | ComponentFunction,
    props: any,
    key?: string
  ): JSXNode;

  /**
   * Fragment component for grouping elements without a wrapper
   */
  export const Fragment: unique symbol;

  /**
   * Development version of JSX transformation function
   * Used by the compiler in development mode
   */
  export function jsxDEV(
    type: string | ComponentFunction,
    props: any, 
    key: string | undefined,
    isStaticChildren: boolean,
    source: { fileName: string; lineNumber: number; columnNumber: number },
    self: any
  ): JSXNode;
}

/**
 * JSX Dev Runtime module (used in development mode)
 * Re-exports from the main JSX runtime
 */
declare module '0x1/jsx-dev-runtime' {
  export * from '0x1/jsx-runtime';
}

/**
 * For React compatibility (some libraries might expect this)
 */
declare module 'react/jsx-runtime' {
  export * from '0x1/jsx-runtime';
}

declare module 'react/jsx-dev-runtime' {
  export * from '0x1/jsx-runtime';
}

// Add this to make TypeScript recognize .tsx files as modules
export {};
