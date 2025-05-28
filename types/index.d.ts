/**
 * 0x1 Framework Type Definitions
 * 
 * This file re-exports all type definitions to make them available to consuming applications
 */

// Re-export JSX namespace and related types
export * from './jsx';
export * from './jsx-runtime';

// JSX namespace augmentation - automatically picked up by TypeScript when using the framework
import './jsx';
import './jsx-runtime';

// Export JSX Element type
export declare namespace JSX {
  interface Element {
    type: string | Function;
    props: any;
    children: any[];
    __source?: {
      fileName: string;
      lineNumber: number;
      columnNumber: number;
    };
    __self?: any;
  }
  
  // Type definitions for the JSX transformer
  export interface ElementClass {
    render(): Element;
  }
  
  export interface ElementAttributesProperty {
    props: any;
  }
  
  export interface ElementChildrenAttribute {
    children: any;
  }
}

// Component type definitions
export type ComponentFunction<P = any> = (props: P) => JSX.Element;
export type ComponentClass<P = any> = new (props: P) => { render(): JSX.Element };
export type Component<P = any> = ComponentFunction<P> | ComponentClass<P>;

// JSX specific types
export type JSXNode = JSX.Element;
export type JSXChildren = JSXNode | JSXNode[] | string | number | boolean | null | undefined;
export type JSXAttributes<T = HTMLElement> = Record<string, any> & {
  children?: JSXChildren;
  ref?: { current: T | null } | ((instance: T | null) => void);
};

/**
 * Fragment component for grouping elements without a wrapper
 */
export declare const Fragment: unique symbol;

// Hooks type definitions - React-compatible hooks
export interface RefObject<T> {
  current: T | null;
}

export declare function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
export declare function useEffect(effect: () => void | (() => void), deps?: any[]): void;
export declare function useRef<T>(initialValue: T): RefObject<T>;
export declare function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
export declare function useMemo<T>(factory: () => T, deps: any[]): T;

// Custom hooks
export declare function useClickOutside<T extends HTMLElement>(callback: () => void): RefObject<T>;
export declare function useFetch<T = any>(url: string, options?: RequestInit): {
  data: T | null;
  loading: boolean;
  error: Error | null;
};
export declare function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
): {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  setValue: (name: keyof T, value: any) => void;
  setFieldTouched: (name: keyof T, isTouched?: boolean) => void;
  validateField: (name: keyof T) => string | null;
  validateAll: () => boolean;
  reset: () => void;
  handleSubmit: (onSubmit: (values: T) => void) => (event?: Event | { preventDefault?: () => void }) => void;
  isValid: boolean;
};
export declare function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void];

// Store type definitions (re-exported from 0x1-store)
export interface Action {
  type: string;
  payload?: any;
  [key: string]: any;
}

export interface Store<T> {
  getState: () => T;
  dispatch: (action: Action) => any;
  subscribe: (listener: (state: T) => void) => () => void;
  select: <S>(selector: (state: T) => S, listener?: (selectedState: S) => void) => () => S;
}

export declare function createStore<T>(
  reducer: (state: T, action: Action) => T,
  initialState: T,
  middlewares?: any[]
): Store<T>;

export declare function createSlice<T>({
  name,
  initialState,
  reducers
}: {
  name: string;
  initialState: T;
  reducers: Record<string, (state: T, payload?: any) => T | void>;
}): {
  name: string;
  reducer: (state: T, action: Action) => T;
  actions: Record<string, (payload?: any) => Action>;
};

export declare function combineReducers<T extends Record<string, any>>(
  reducers: { [K in keyof T]: (state: T[K], action: Action) => T[K] }
): (state: T, action: Action) => T;

export declare function createSelector<T, R1, Result>(
  selector1: (state: T) => R1,
  resultFn: (res1: R1) => Result
): (state: T) => Result;

export declare function createSelector2<T, R1, R2, Result>(
  selector1: (state: T) => R1,
  selector2: (state: T) => R2,
  resultFn: (res1: R1, res2: R2) => Result
): (state: T) => Result;
