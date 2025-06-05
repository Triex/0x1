/**
 * React Compatibility Layer for 0x1 Framework
 * Provides React 19+ compatible types for full ecosystem compatibility
 */

import type { JSXElement, JSXNode } from './jsx.js';

// Core React types that libraries expect
export type ReactNode = JSXNode;
export type ReactElement<_P = any, _T = any> = JSXElement;
export interface ComponentType<_P = Record<string, never>> {
  (_props: _P): JSX.Element | null;
}

export interface ForwardRefComponent<_T, _P = Record<string, never>> {
  (_props: _P): JSX.Element | null;
}

export interface ComponentClass<_P = Record<string, never>> {
  new (_props: _P): Component<_P>;
}

export type ElementType<_P = any> = {
  [K in keyof JSX.IntrinsicElements]: _P extends JSX.IntrinsicElements[K] ? K : never;
}[keyof JSX.IntrinsicElements] | ComponentType<_P>;

export interface FunctionComponent<_P = Record<string, never>> {
  (_props: _P): JSX.Element | null;
}

export interface ReactEventHandler<_E = Event> {
  (event: _E): void;
}

// Props types
export interface PropsWithChildren<_P = unknown> {
  children?: ReactNode;
}

// Ref types
export type Ref<T> = ((instance: T | null) => void) | { current: T | null } | null;
export type RefObject<T> = { current: T | null };

// Event types
export interface SyntheticEvent<T = Element, _E = Event> {
  currentTarget: T;
  target: EventTarget & T;
  preventDefault(): void;
  stopPropagation(): void;
}

export interface MouseEvent<T = Element> extends SyntheticEvent<T, Event> {
  button: number;
  clientX: number;
  clientY: number;
}

export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
  target: EventTarget & T;
}

export interface FormEvent<T = Element> extends SyntheticEvent<T> {}

// CSS Properties (simplified for compatibility)
export interface CSSProperties {
  [key: string]: any;
}

// Context types
export interface Context<T> {
  Provider: ComponentType<{ value: T; children?: ReactNode }>;
  Consumer: ComponentType<{ children: (value: T) => ReactNode }>;
}

// Fragment
export const Fragment: ComponentType<{ children?: ReactNode }>;

// Core React functions (type declarations only)
export function createElement<P>(
  type: ComponentType<P> | string,
  props?: P,
  ...children: ReactNode[]
): ReactElement<P>;

export function createContext<T>(defaultValue: T): Context<T>;

// Export JSX compatibility
export { JSXNode as Element };
export namespace JSX {
  export type Element = JSXNode;
  export interface IntrinsicElements {
    [elemName: string]: any;
  }
} 