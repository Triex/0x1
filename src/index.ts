/**
 * 0x1 Framework - Main Entry Point
 * Ultra-minimal TypeScript framework for modern web development
 */

// JSX Runtime core exports - primary source
export {
  createElement,
  jsx,
  jsxDEV,
  jsxs,
  // Fragment
} from './jsx-runtime.js';

// JSX types for component development
export type {
  JSXElement,
  // JSXNode,
  // JSXChildren,
  // JSXAttributes,
  // ComponentFunction
} from './jsx/runtime.js';

// Browser rendering utilities
export { renderToDOM, renderToString } from './jsx/runtime.js';



// Component exports
export { default as Link } from './components/link.js';

// Router (from 0x1-router package)
export { 
  NavLink, 
  Redirect, 
  Router, 
  Link as RouterLink, 
  useParams, 
  useRouter, 
  useSearchParams, 
  type RouteParams 
} from '0x1-router';

// Store (from 0x1-store package)
export * as store from '0x1-store';

// Hooks - all essential hooks for component development
export {
  clearComponentContext, 
  setComponentContext, 
  useCallback,
  useClickOutside, 
  useEffect, 
  useFetch, 
  useForm, 
  useLayoutEffect, 
  useLocalStorage, 
  useMemo, 
  useRef, 
  useState,
  type RefObject
} from './core/hooks.js';

// Metadata and head management system
export {
  generateHeadContent,
  generateMetaTags,
  generateLinkTags,
  extractMetadataFromFile,
  mergeMetadata,
  resolveTitle,
  DEFAULT_METADATA,
  type Metadata,
  type OpenGraph,
  type TwitterCard,
  type Viewport
} from './core/metadata.js';

// Head management
export { 
  getGlobalMetadata, 
  Head, 
  initializeHeadManagement, 
  setGlobalMetadata, 
  updateDocumentHead, 
  useMetadata 
} from './core/head.js';

// Directives system
export { 
  clientComponent, 
  createServerAction, 
  executeServerFunction, 
  handleServerAction, 
  initializeDirectives, 
  markAsClient, 
  markAsServer, 
  processDirectives, 
  serverAction, 
  type ServerFunction 
} from './core/directives.js';

// PWA utilities
export {
  generateManifest,
  generateServiceWorker,
  pwaConfigToMetadata,
  // validatePWAConfigForMetadata,
  registerPWA,
  type PWAConfig
} from './core/pwa.js';

// CLI utilities (for build tools)
export * from './cli/utils/transpilation.js';
