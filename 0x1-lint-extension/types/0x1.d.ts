/**
 * Type definitions for 0x1 Framework in the Lint Extension
 * This is a simplified version to avoid conflicts with the main declaration
 */

// Reference DOM lib to allow HTMLElement and Text types
/// <reference lib="dom" />

// Use a namespace approach to avoid global conflicts
declare namespace ZeroX1Core {
  // Framework component types
  export interface Component {
    render(): HTMLElement;
  }
  
  export type ComponentProps = Record<string, any>;
}

// Export the namespace for use in TypeScript
declare module '0x1' {
  // Re-export core types
  export import Component = ZeroX1Core.Component;
  export import ComponentProps = ZeroX1Core.ComponentProps;
  
  // Core JSX functions
  export function createElement(type: any, props?: any, ...children: any[]): any;
  export function createComponentElement(tag: string, attrs?: any, ...children: any[]): HTMLElement;
  export function fromHTML(html: string): HTMLElement;
  export function mount(component: ZeroX1Core.Component, container: HTMLElement): void;
  export function renderToString(element: any): string;
  export function template(strings: TemplateStringsArray, ...values: any[]): string;
  export function textElement(text: string): Text;
  export function updateComponent(oldEl: HTMLElement, newEl: HTMLElement): void;
  
  // Fragment is defined but with a different approach to avoid conflicts
  export const Fragment: symbol;
}

// Ensure this is treated as a module
export {};
