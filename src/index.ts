/**
 * 0x1 Framework
 * 
 * An ultra-minimal TypeScript framework with extreme performance powered by Bun
 * https://github.com/Triex/0x1
 * Main entry point exporting all core functionality
 */

// Export core components
export {
  createComponent, createElement, Fragment, fromHTML, mount, template, textElement, updateComponent
} from './core/component.js';
export type { Component } from './core/component.js';

// Export router and navigation
export {
  Link,
  NavLink,
  Redirect, Router, type Page,
  type RouteParams
} from './core/navigation.js';

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
export type { _0x1Config } from './types/config.js';

// Version info
export const version = '0.1.0';
