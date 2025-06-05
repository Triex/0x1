/**
 * 0x1 Framework - Main Entry Point
 * Ultra-minimal TypeScript framework for modern web development
 */

// JSX Runtime exports - primary source
export { createElement, jsx, jsxDEV, jsxs, type JSXElement } from './jsx-runtime.js';

// Component exports
  export { default as Link } from './components/link.js';

// Browser utilities - only exports not already defined above
export {
  renderToDOM, renderToString
} from './jsx/runtime.js';

// Hooks
export {
  clearComponentContext, setComponentContext, useCallback,
  useClickOutside, useEffect, useFetch, useForm, useLayoutEffect, useLocalStorage, useMemo, useRef, useState, type RefObject
} from './core/hooks.js';

// Router (from 0x1-router package)
export { NavLink, Redirect, Router, Link as RouterLink, useParams, useRouter, useSearchParams, type RouteParams } from '0x1-router';

// Store (from 0x1-store package)
export * as store from '0x1-store';

// Export metadata and head management system
export {
  DEFAULT_METADATA, generateAnalyticsScripts, generateHeadContent, generateLinkTags, generateMetaTags,
  // Metadata types and utilities
  type Metadata, type OpenGraph, type OpenGraphImage, type Robots, type TwitterCard, type Viewport
} from './core/metadata.js';

// Export head management
export { getGlobalMetadata, Head, initializeHeadManagement, setGlobalMetadata, updateDocumentHead, useMetadata } from './core/head.js';

// Export directives system
export { clientComponent, createServerAction, executeServerFunction, handleServerAction, initializeDirectives, markAsClient, markAsServer, processDirectives, serverAction, type ServerFunction } from './core/directives.js';

// Export PWA utilities
export { generateManifest, generateServiceWorker, pwaConfigToMetadata, registerPWA, type PWAConfig } from './core/pwa.js';

// CLI utilities (for build tools)
export * from './cli/utils/transpilation.js';

