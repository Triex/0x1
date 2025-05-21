/**
 * Global type definitions for JSX/TSX support in 0x1 framework
 */

// Reference DOM types to ensure HTML* types are available
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Core types for JSX support
type JSXNode = HTMLElement | string | number | boolean | null | undefined | JSXNode[];
type JSXChildren = JSXNode | JSXNode[];
type JSXAttributes<T = HTMLElement> = Partial<Omit<T, 'children'>> & {
  children?: JSXChildren;
  className?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  [key: string]: any;
};

type ComponentFunction<P = any> = (props: P) => JSXNode;

// Export types that will be used in other type definitions
export type {
  JSXNode,
  JSXChildren,
  JSXAttributes,
  ComponentFunction,
};

// Now global augmentations are valid in a module context
declare global {
  namespace JSX {
    // The return type of JSX expressions
    type Element = JSXNode;

    // The type of the children prop
    type Children = JSXNode | JSXNode[] | string | number | boolean | null | undefined;

    // The type of the props object
    interface PropsWithChildren {
      children?: Children;
      key?: string | number;
      ref?: any;
    }

    // The type of the props for HTML elements
    interface HTMLAttributes<T = HTMLElement> extends PropsWithChildren {
      // Standard HTML Attributes
      accessKey?: string;
      className?: string;
      contentEditable?: boolean | 'true' | 'false';
      contextMenu?: string;
      dir?: string;
      draggable?: boolean | 'true' | 'false';
      hidden?: boolean;
      id?: string;
      lang?: string;
      slot?: string;
      spellCheck?: boolean | 'true' | 'false';
      style?: Partial<CSSStyleDeclaration> | string;
      tabIndex?: number;
      title?: string;
      translate?: 'yes' | 'no';

      // Event handlers
      onAbort?: (event: Event) => void;
      onAnimationEnd?: (event: AnimationEvent) => void;
      onAnimationIteration?: (event: AnimationEvent) => void;
      onAnimationStart?: (event: AnimationEvent) => void;
      onBlur?: (event: FocusEvent) => void;
      onChange?: (event: Event) => void;
      onClick?: (event: MouseEvent) => void;
      onContextMenu?: (event: MouseEvent) => void;
      onDoubleClick?: (event: MouseEvent) => void;
      onError?: (event: Event) => void;
      onFocus?: (event: FocusEvent) => void;
      onInput?: (event: Event) => void;
      onKeyDown?: (event: KeyboardEvent) => void;
      onKeyPress?: (event: KeyboardEvent) => void;
      onKeyUp?: (event: KeyboardEvent) => void;
      onLoad?: (event: Event) => void;
      onMouseDown?: (event: MouseEvent) => void;
      onMouseEnter?: (event: MouseEvent) => void;
      onMouseLeave?: (event: MouseEvent) => void;
      onMouseMove?: (event: MouseEvent) => void;
      onMouseOut?: (event: MouseEvent) => void;
      onMouseOver?: (event: MouseEvent) => void;
      onMouseUp?: (event: MouseEvent) => void;
      onSubmit?: (event: Event) => void;
      onWheel?: (event: WheelEvent) => void;

      // Allow any other props
      [key: string]: any;
    }

    // The type of the props for SVG elements
    interface SVGAttributes<T = SVGElement> extends HTMLAttributes<T> {
      // SVG Attributes
      viewBox?: string;
      width?: string | number;
      height?: string | number;
      fill?: string;
      stroke?: string;
      strokeWidth?: string | number;
      d?: string;
      x?: string | number;
      y?: string | number;
      cx?: string | number;
      cy?: string | number;
      r?: string | number;
      rx?: string | number;
      ry?: string | number;
      transform?: string;
    }

    // The type of a JSX element node
    interface JSXNode {
      type: string | ComponentFunction;
      props: Record<string, any>;
      key: string | number | null;
      ref: any;
      children: JSXNode[];
    }

    // The type of a component function
    type ComponentFunction = (props: Record<string, any>, ...children: any[]) => JSXNode;

    // The type of the children prop
    type JSXChildren = JSXNode | JSXNode[] | string | number | boolean | null | undefined;

    // The type of the props object
    interface JSXAttributes<T = HTMLElement> extends HTMLAttributes<T> {
      // Allow any other props
      [key: string]: any;
    }

    // The type of the props for the Fragment component
    interface FragmentProps {
      children?: JSXChildren;
    }

    // The Fragment component
    const Fragment: ComponentFunction<FragmentProps>;

    // The type of the JSX namespace
    interface Element extends JSXNode {}
    
    interface ElementClass {
      render(): Element;
    }
    
    interface ElementAttributesProperty {
      props: {};
    }
    
    interface ElementChildrenAttribute {
      children: {};
    }

    // Intrinsic elements
    interface IntrinsicElements {
      // Basic HTML elements (partial list for brevity)
      a: JSXAttributes<HTMLAnchorElement>;
      abbr: JSXAttributes;
      address: JSXAttributes;
      area: JSXAttributes<HTMLAreaElement>;
      article: JSXAttributes<HTMLElement>;
      aside: JSXAttributes<HTMLElement>;
      audio: JSXAttributes<HTMLAudioElement>;
      b: JSXAttributes;
      base: JSXAttributes<HTMLBaseElement>;
      bdi: JSXAttributes;
      bdo: JSXAttributes;
      blockquote: JSXAttributes<HTMLQuoteElement>;
      body: JSXAttributes<HTMLBodyElement>;
      br: JSXAttributes<HTMLBRElement>;
      button: JSXAttributes<HTMLButtonElement>;
      canvas: JSXAttributes<HTMLCanvasElement>;
      caption: JSXAttributes<HTMLTableCaptionElement>;
      cite: JSXAttributes;
      code: JSXAttributes;
      col: JSXAttributes<HTMLTableColElement>;
      colgroup: JSXAttributes<HTMLTableColElement>;
      data: JSXAttributes<HTMLDataElement>;
      datalist: JSXAttributes<HTMLDataListElement>;
      dd: JSXAttributes;
      del: JSXAttributes<HTMLModElement>;
      details: JSXAttributes<HTMLDetailsElement>;
      dfn: JSXAttributes;
      dialog: JSXAttributes<HTMLDialogElement>;
      div: JSXAttributes<HTMLDivElement>;
      dl: JSXAttributes<HTMLDListElement>;
      dt: JSXAttributes;
      em: JSXAttributes;
      embed: JSXAttributes<HTMLEmbedElement>;
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
