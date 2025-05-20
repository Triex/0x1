/**
 * 0x1 Framework
 * 
 * An ultra-minimal TypeScript framework with extreme performance powered by Bun
 * https://github.com/Triex/0x1
 * Main entry point exporting all core functionality
 */

// Export core components and functionality
export {
  // Use legacy names for HTML element creation functions
  createElement as createComponentElement, fromHTML,
  mount,
  template,
  textElement,
  updateComponent
} from './core/component.js';

// Export Next.js-compatible Link component
export { default as Link } from './components/link.js';
export type { Component, ComponentProps } from './core/component.js';

// Export JSX runtime for TSX support
// These exports take precedence for TSX files
export {
  createElement,
  Fragment,
  renderToString
} from './jsx-runtime.js';

// Export JSX types
export type {
  ComponentFunction, JSXAttributes,
  JSXChildren, JSXNode
} from './jsx-runtime.js';

// Export router and navigation
export {
  Link as BasicLink, // Rename to avoid conflict with Next.js-compatible Link
  NavLink,
  Redirect, type Page
} from './core/navigation.js';

// Export the new router implementation
export { Router, type RouteParams } from './core/router.js';

// Export hooks
export {
  useCallback, useClickOutside, useEffect, useFetch, useForm, useLocalStorage, useMemo, useRef, useState
} from './core/hooks.js';

// Export store
export {
  combineReducers, connect, createSelector,
  createSelector2, createSlice, createStore, initializeStore,
  logger,
  thunk, type Action,
  type Store
} from './core/store.js';

// Export animations
export {
  animate, animateProperties, easings, fadeIn,
  fadeOut,
  slideDown,
  slideUp, spring, type AnimationOptions
} from './utils/animations.js';

// DOM utilities
export { clearElement, patchElement, setAttributes, setStyles } from './utils/dom.js';

// Config types
export type { _0x1Config } from '../types/config.js';

// Version info
export const version = '0.1.0';
