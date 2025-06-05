/**
 * JSX type definitions for 0x1 Framework
 */

// Core types for JSX support
export type ComponentFunction<P = any> = (props: P & { children?: JSXChildren }) => JSXNode;
export type JSXChildren = JSXNode | JSXNode[] | string | number | boolean | null | undefined;
export type JSXAttributes<T = HTMLElement> = Partial<Omit<T, 'children'>> & {
  children?: JSXChildren;
  className?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  [key: string]: any;
};

// JSX element structure - this was missing before!
export interface JSXNode {
  type: string | ComponentFunction | symbol;
  props: any;
  children: any[];
  key?: string | number | null;
}

// Event handler type
export type EventHandler<T = Event> = (event: T) => void;

// HTML attributes interface
export interface HTMLAttributes<T = HTMLElement> {
  // Standard HTML attributes
  id?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  title?: string;
  role?: string;
  tabIndex?: number;
  
  // Event handlers
  onClick?: EventHandler<MouseEvent>;
  onChange?: EventHandler<Event>;
  onInput?: EventHandler<Event>;
  onSubmit?: EventHandler<Event>;
  onFocus?: EventHandler<FocusEvent>;
  onBlur?: EventHandler<FocusEvent>;
  
  // Data attributes
  [key: `data-${string}`]: any;
  
  // Allow any other attributes
  [key: string]: any;
}

export interface ElementAttributesProperty<_T = any> {
  // Add any necessary properties here
} 