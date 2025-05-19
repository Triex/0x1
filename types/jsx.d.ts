/**
 * Global type definitions for JSX/TSX support in 0x1 framework
 */

// Reference DOM types to ensure HTML* types are available
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Export as a module to allow global augmentations
export {};

// Now global augmentations are valid in a module context
declare global {
  namespace JSX {
    interface Element {}

    interface IntrinsicElements {
      // Basic HTML elements (partial list for brevity)
      a: any;
      abbr: any;
      address: any;
      area: any;
      article: any;
      aside: any;
      audio: any;
      b: any;
      base: any;
      bdi: any;
      bdo: any;
      blockquote: any;
      body: any;
      br: any;
      button: any;
      canvas: any;
      caption: any;
      cite: any;
      code: any;
      col: any;
      colgroup: any;
      data: any;
      datalist: any;
      dd: any;
      del: any;
      details: any;
      dfn: any;
      dialog: any;
      div: any;
      dl: any;
      dt: any;
      em: any;
      embed: any;
      fieldset: any;
      figcaption: any;
      figure: any;
      footer: any;
      form: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      head: any;
      header: any;
      hr: any;
      html: any;
      i: any;
      iframe: any;
      img: any;
      input: any;
      ins: any;
      kbd: any;
      label: any;
      legend: any;
      li: any;
      link: any;
      main: any;
      map: any;
      mark: any;
      menu: any;
      meta: any;
      meter: any;
      nav: any;
      noscript: any;
      object: any;
      ol: any;
      optgroup: any;
      option: any;
      output: any;
      p: any;
      param: any;
      picture: any;
      pre: any;
      progress: any;
      q: any;
      rp: any;
      rt: any;
      ruby: any;
      s: any;
      samp: any;
      script: any;
      section: any;
      select: any;
      slot: any;
      small: any;
      source: any;
      span: any;
      strong: any;
      style: any;
      sub: any;
      summary: any;
      sup: any;
      table: any;
      tbody: any;
      td: any;
      template: any;
      textarea: any;
      tfoot: any;
      th: any;
      thead: any;
      time: any;
      title: any;
      tr: any;
      track: any;
      u: any;
      ul: any;
      var: any;
      video: any;
      wbr: any;

      // SVG elements
      svg: any;
      path: any;
      circle: any;
      rect: any;
      line: any;
      g: any;
    }
    
    interface ElementAttributesProperty {
      props: {};
    }
    
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// Define the 0x1 module types with proper JSX support
declare module '0x1' {
  // Define a single Fragment variable across the framework
  export const Fragment: unique symbol;
  
  // JSX factory function
  export function createElement(type: any, props: any, ...children: any[]): any;
  export function renderToString(node: any): string;
  
  // Component types (ensures proper types for 0x1 components)
  export type JSXNode = any;
  export type JSXAttributes = Record<string, any>;
  export type JSXChildren = any[];
  export type ComponentFunction = (props: any) => any;
}
