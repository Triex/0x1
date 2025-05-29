/**
 * JSX Type Definitions for 0x1 Framework
 * Provides React 19+ compatible JSX types
 */

// Base JSX node type
export type JSXNode = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | JSXElement 
  | JSXNode[];

// JSX Element interface
export interface JSXElement {
  type: string | React.ComponentType<any>;
  props: Record<string, any>;
  key?: string | number | null;
}

// HTML Attributes with proper generic support
export interface HTMLAttributes<T = HTMLElement> {
  // React-compatible HTML attributes
  className?: string;
  id?: string;
  style?: React.CSSProperties | string;
  
  // Event handlers
  onClick?: (event: React.MouseEvent<T>) => void;
  onChange?: (event: React.ChangeEvent<T>) => void;
  onSubmit?: (event: React.FormEvent<T>) => void;
  
  // Common HTML attributes
  [key: string]: any;
}

// JSX Attributes that extend HTML attributes
export interface JSXAttributes<T = HTMLElement> extends HTMLAttributes<T> {
  children?: JSXNode;
  key?: string | number | null;
  ref?: React.Ref<T>;
}

// JSX namespace for TypeScript
declare global {
  namespace JSX {
    type Element = JSXNode;
    
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
      
      // Layout elements
      div: JSXAttributes<HTMLDivElement>;
      span: JSXAttributes<HTMLSpanElement>;
      section: JSXAttributes<HTMLElement>;
      article: JSXAttributes<HTMLElement>;
      aside: JSXAttributes<HTMLElement>;
      header: JSXAttributes<HTMLElement>;
      footer: JSXAttributes<HTMLElement>;
      main: JSXAttributes<HTMLElement>;
      nav: JSXAttributes<HTMLElement>;
      
      // Text content
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
      
      // Form elements
      form: JSXAttributes<HTMLFormElement>;
      input: JSXAttributes<HTMLInputElement> & { type?: string };
      button: JSXAttributes<HTMLButtonElement> & { type?: 'button' | 'submit' | 'reset' };
      textarea: JSXAttributes<HTMLTextAreaElement>;
      select: JSXAttributes<HTMLSelectElement>;
      option: JSXAttributes<HTMLOptionElement>;
      label: JSXAttributes<HTMLLabelElement>;
      
      // Media elements
      img: JSXAttributes<HTMLImageElement> & { src: string; alt: string };
      a: JSXAttributes<HTMLAnchorElement> & { href?: string; target?: string };
    }
  }
}

export { };

