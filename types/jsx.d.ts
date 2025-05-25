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
  ComponentFunction, JSXAttributes, JSXChildren, JSXNode
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
    
    // Define IntrinsicElements to fix the "JSX element implicitly has type 'any'" errors
    interface IntrinsicElements {
      // HTML elements
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
      className?: string;
      style?: { [key: string]: string | number } | string;
      title?: string;
      role?: string;
      tabIndex?: number;
      
      // Event handlers - mouse
      onClick?: EventHandler<MouseEvent>;
      onDoubleClick?: EventHandler<MouseEvent>;
      onContextMenu?: EventHandler<MouseEvent>;
      onMouseDown?: EventHandler<MouseEvent>;
      onMouseUp?: EventHandler<MouseEvent>;
      onMouseEnter?: EventHandler<MouseEvent>;
      onMouseLeave?: EventHandler<MouseEvent>;
      onMouseMove?: EventHandler<MouseEvent>;
      onMouseOver?: EventHandler<MouseEvent>;
      onMouseOut?: EventHandler<MouseEvent>;
      
      // Event handlers - touch
      onTouchStart?: EventHandler<TouchEvent>;
      onTouchEnd?: EventHandler<TouchEvent>;
      onTouchMove?: EventHandler<TouchEvent>;
      onTouchCancel?: EventHandler<TouchEvent>;
      
      // Event handlers - keyboard
      onKeyDown?: EventHandler<KeyboardEvent>;
      onKeyUp?: EventHandler<KeyboardEvent>;
      onKeyPress?: EventHandler<KeyboardEvent>;
      
      // Event handlers - focus
      onFocus?: EventHandler<FocusEvent>;
      onBlur?: EventHandler<FocusEvent>;
      
      // Event handlers - form
      onChange?: EventHandler<Event>;
      onInput?: EventHandler<Event>;
      onSubmit?: EventHandler<Event>;
      
      // ARIA attributes
      'aria-label'?: string;
      'aria-labelledby'?: string;
      'aria-describedby'?: string;
      'aria-hidden'?: boolean | 'true' | 'false';
      'aria-disabled'?: boolean | 'true' | 'false';
      'aria-required'?: boolean | 'true' | 'false';
      'aria-checked'?: boolean | 'true' | 'false' | 'mixed';
      'aria-expanded'?: boolean | 'true' | 'false';
      'aria-controls'?: string;
      'aria-selected'?: boolean | 'true' | 'false';
      'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
      'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
      'aria-valuemin'?: number;
      'aria-valuemax'?: number;
      'aria-valuenow'?: number;
      'aria-valuetext'?: string;
      'aria-live'?: 'off' | 'assertive' | 'polite';
      'aria-atomic'?: boolean | 'true' | 'false';
      'aria-busy'?: boolean | 'true' | 'false';
      'aria-relevant'?: 'additions' | 'additions text' | 'all' | 'removals' | 'text';
      
      // Data attributes
      [key: `data-${string}`]: any;
      
      // Other common attributes
      draggable?: boolean | 'true' | 'false';
      hidden?: boolean;
      spellCheck?: boolean | 'true' | 'false';
      translate?: 'yes' | 'no';
      dir?: 'ltr' | 'rtl' | 'auto';
      lang?: string;
      
      // Allow any other attributes
      [key: string]: any;
    }
    
    /**
     * Attributes collection for HTML elements with ref support
     */
    type AttributeCollection<T = HTMLElement> = HTMLAttributes & {
      ref?: { current: T | null } | ((instance: T | null) => void);
    };
    
    /**
     * All HTML intrinsic elements
     */
    interface IntrinsicElements {
      // Document elements
      html: AttributeCollection<HTMLHtmlElement>;
      head: AttributeCollection<HTMLHeadElement>;
      body: AttributeCollection<HTMLBodyElement>;
      title: AttributeCollection<HTMLTitleElement>;
      meta: AttributeCollection<HTMLMetaElement>;
      link: AttributeCollection<HTMLLinkElement>;
      script: AttributeCollection<HTMLScriptElement>;
      style: AttributeCollection<HTMLStyleElement>;
      
      // Sectioning elements
      div: AttributeCollection<HTMLDivElement>;
      span: AttributeCollection<HTMLSpanElement>;
      section: AttributeCollection<HTMLElement>;
      article: AttributeCollection<HTMLElement>;
      aside: AttributeCollection<HTMLElement>;
      header: AttributeCollection<HTMLElement>;
      footer: AttributeCollection<HTMLElement>;
      main: AttributeCollection<HTMLElement>;
      nav: AttributeCollection<HTMLElement>;
      
      // Text content elements
      p: AttributeCollection<HTMLParagraphElement>;
      h1: AttributeCollection<HTMLHeadingElement>;
      h2: AttributeCollection<HTMLHeadingElement>;
      h3: AttributeCollection<HTMLHeadingElement>;
      h4: AttributeCollection<HTMLHeadingElement>;
      h5: AttributeCollection<HTMLHeadingElement>;
      h6: AttributeCollection<HTMLHeadingElement>;
      ul: AttributeCollection<HTMLUListElement>;
      ol: AttributeCollection<HTMLOListElement>;
      li: AttributeCollection<HTMLLIElement>;
      blockquote: AttributeCollection<HTMLQuoteElement>;
      pre: AttributeCollection<HTMLPreElement>;
      code: AttributeCollection<HTMLElement>;
      
      // Form elements
      form: AttributeCollection<HTMLFormElement>;
      input: AttributeCollection<HTMLInputElement> & { type?: string };
      button: AttributeCollection<HTMLButtonElement> & { type?: 'button' | 'submit' | 'reset' };
      textarea: AttributeCollection<HTMLTextAreaElement>;
      select: AttributeCollection<HTMLSelectElement>;
      option: AttributeCollection<HTMLOptionElement>;
      label: AttributeCollection<HTMLLabelElement>;
      fieldset: AttributeCollection<HTMLFieldSetElement>;
      legend: AttributeCollection<HTMLLegendElement>;
      
      // Inline elements
      a: AttributeCollection<HTMLAnchorElement> & { href?: string; target?: string };
      strong: AttributeCollection<HTMLElement>;
      em: AttributeCollection<HTMLElement>;
      small: AttributeCollection<HTMLElement>;
      s: AttributeCollection<HTMLElement>;
      cite: AttributeCollection<HTMLElement>;
      q: AttributeCollection<HTMLQuoteElement>;
      time: AttributeCollection<HTMLTimeElement>;
      
      // Embedded content
      img: AttributeCollection<HTMLImageElement> & { src: string; alt: string };
      iframe: AttributeCollection<HTMLIFrameElement>;
      canvas: AttributeCollection<HTMLCanvasElement>;
      audio: AttributeCollection<HTMLAudioElement>;
      video: AttributeCollection<HTMLVideoElement>;
      source: AttributeCollection<HTMLSourceElement>;
      track: AttributeCollection<HTMLTrackElement>;
      embed: AttributeCollection<HTMLEmbedElement>;
      object: AttributeCollection<HTMLObjectElement>;
      
      // Table elements
      table: AttributeCollection<HTMLTableElement>;
      caption: AttributeCollection<HTMLTableCaptionElement>;
      colgroup: AttributeCollection<HTMLTableColElement>;
      col: AttributeCollection<HTMLTableColElement>;
      tbody: AttributeCollection<HTMLTableSectionElement>;
      thead: AttributeCollection<HTMLTableSectionElement>;
      tfoot: AttributeCollection<HTMLTableSectionElement>;
      tr: AttributeCollection<HTMLTableRowElement>;
      td: AttributeCollection<HTMLTableCellElement>;
      th: AttributeCollection<HTMLTableCellElement>;
      
      // Others
      hr: AttributeCollection<HTMLHRElement>;
      br: AttributeCollection<HTMLBRElement>;
      wbr: AttributeCollection<HTMLElement>;
      sup: AttributeCollection<HTMLElement>;
      sub: AttributeCollection<HTMLElement>;
      
      // SVG elements (basic support)
      svg: AttributeCollection<SVGSVGElement>;
      path: AttributeCollection<SVGPathElement>;
      circle: AttributeCollection<SVGCircleElement>;
      rect: AttributeCollection<SVGRectElement>;
      line: AttributeCollection<SVGLineElement>;
      g: AttributeCollection<SVGGElement>;
      
      // Allow any other element with any props
      [elemName: string]: any;
    }
    
    /**
     * The type of a JSX element node
     */
    interface JSXNode {
      type: string | ComponentFunction;
      props: Record<string, any>;
      key: string | number | null;
      ref: any;
      children: JSXNode[];
    }

    /**
     * The type of a component function
     */
    type ComponentFunction = (props: Record<string, any>, ...children: any[]) => JSXNode;

    /**
     * The type of the children prop
     */
    type JSXChildren = JSXNode | JSXNode[] | string | number | boolean | null | undefined;

    /**
     * The type of the props object
     */
    interface JSXAttributes<T = HTMLElement> extends HTMLAttributes<T> {
      // Allow any other props
      [key: string]: any;
    }

    /**
     * The type of the props for the Fragment component
     */
    interface FragmentProps {
      children?: JSXChildren;
    }

    /**
     * The Fragment component
     */
    const Fragment: ComponentFunction<FragmentProps>;

    /**
     * The type of the JSX namespace
     */
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
    
    interface IntrinsicElements {
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
