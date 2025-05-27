/**
 * 0x1 Framework
 * 
 * An ultra-minimal TypeScript framework with extreme performance powered by Bun
 * https://github.com/Triex/0x1
 * Main entry point exporting all core functionality
 */

// Import JSX types instead of using triple slash references
import './jsx-runtime.js';

// Export core components and functionality
export {
  // Use legacy names for HTML element creation functions
  createElement as createComponentElement, fromHTML,
  mount,
  template,
  textElement,
  updateComponent
} from './core/component.js';

// Export Next.js-compatible Link component as the main Link export
export { default as Link } from './components/link.js';
export type { LinkProps } from './components/link.js';
export type { Component, ComponentProps } from './core/component.js';

// Export JSX runtime for TSX support
// These exports take precedence for TSX files
export * from './jsx-runtime.js';

// Export JSX types
export type {
  ComponentFunction, JSXAttributes,
  JSXChildren, JSXNode
} from './jsx-runtime.js';

// Export router and navigation with renamed legacy components to avoid conflicts  
export {
  Link as DOMLink, // Rename to avoid conflict with JSX Link
  NavLink as DOMNavLink,
  Redirect as RouterRedirect,
  type Page
} from './core/navigation.js';

// Export the new router implementation
export { Router, type RouteParams } from '0x1-router';

// Export the error boundary for catching and displaying runtime errors
export {
  createDefaultErrorUI, createErrorBoundary, ErrorBoundary, withErrorBoundary
} from './core/error-boundary.js';

// Export hooks system - ensure this is the single source of truth
export {
  clearComponentContext, getAllComponentStats, getComponentStats, isComponentMounted, setComponentContext, unmountComponent, useCallback, useClickOutside, useEffect, useFetch,
  useForm,
  useLocalStorage, useMemo, useRef, useState, type RefObject
} from './core/hooks.js';

// Store exports are handled by the re-export from 0x1-store below

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
export const version = '0.0.169';

// Re-export router from the standalone package
export * from '0x1-router';

// Re-export store from the standalone package  
export * from '0x1-store';

// Convenience sub-module exports for the 0x1/router and 0x1/store pattern
export * as router from '0x1-router';
export * as store from '0x1-store';

