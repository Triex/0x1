/**
 * Type definitions for 0x1 Framework
 */

declare module '0x1' {
  // JSX Factory and Fragment
  export function createElement(type: any, props?: any, ...children: any[]): any;
  export const Fragment: unique symbol;
  export function renderToString(element: any): string;
  
  // Core component types
  export type ComponentProps = Record<string, any>;
  export type Component = {
    render: () => HTMLElement;
  };
  
  // Component helpers
  export function createComponentElement(tag: string, attrs?: any, ...children: any[]): HTMLElement;
  export function fromHTML(html: string): HTMLElement;
  export function mount(component: Component, container: HTMLElement): void;
  export function template(strings: TemplateStringsArray, ...values: any[]): string;
  export function textElement(text: string): Text;
  export function updateComponent(oldEl: HTMLElement, newEl: HTMLElement): void;
}

// Define global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: string]: any;
    }
    
    interface Element {}
    
    interface ElementAttributesProperty {
      props: {};
    }
    
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// Ensure this is treated as a module
export {};
