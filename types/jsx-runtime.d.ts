/**
 * JSX Runtime Type Definitions for 0x1 Framework
 * React 19+ compatible JSX runtime implementation
 */

import type { JSXElement } from './jsx.js';

// Core JSX runtime functions
export function jsx(type: any, props: any, key?: any): JSXElement;
export function jsxs(type: any, props: any, key?: any): JSXElement;
export function jsxDEV(type: any, props: any, key?: any, isStatic?: boolean, source?: any, self?: any): JSXElement;

// Fragment component
export const Fragment: React.ComponentType<{ children?: React.ReactNode }>;

// JSX runtime types for 0x1 framework compatibility  
export interface JSXRuntime {
  jsx: typeof jsx;
  jsxs: typeof jsxs;
  jsxDEV?: typeof jsxDEV;
  Fragment: typeof Fragment;
}

// Export everything from jsx types to avoid conflicts
export * from './jsx.js';

