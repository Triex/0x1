/**
 * 0x1 Framework - Consolidated Development Server
 *
 * This server provides enhanced features including:
 * - Proper MIME type handling
 * - Live reload via WebSocket and EventSource
 * - Component transpilation with error handling
 * - Static file serving with caching
 * - Enhanced error messages in development
 */

import { serve, type Server, type ServerWebSocket } from "bun";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  watch,
} from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { tailwindV4Handler } from "../commands/utils/server/tailwind-v4";
import { logger } from "../utils/logger";
import {
  processTailwindCss,
  stopTailwindProcess,
} from "./handlers/tailwind-handler";

// Import handlers and middleware
import { handleComponentRequest } from "./handlers/component-handler";
import {
  generateCssModuleScript,
  isCssModuleJsRequest,
  processCssFile,
} from "./handlers/css-handler";
import { notFoundHandler } from "./middleware/error-boundary";
import { getMimeType, serveStaticFile } from "./middleware/static-files";

// Import template functions for proper app initialization
import { injectJsxRuntime } from "../commands/utils/jsx-templates";
import {
  composeHtmlTemplate,
  generateLandingPage,
} from "../commands/utils/server/templates";

// Import directives and error boundary utilities
import { processDirectives } from '../../core/directives.js';

// Path resolution helpers
const currentFilePath = fileURLToPath(import.meta.url);

// Calculate the absolute path to the framework root
// src/cli/server/ -> go up 3 levels to reach framework root
const frameworkPath = process.cwd().includes("00-Dev/0x1")
  ? process.cwd().split("00-Dev/0x1")[0] + "00-Dev/0x1"
  : resolve(dirname(currentFilePath), "../../../");

const frameworkDistPath = resolve(frameworkPath, "dist");
const frameworkCorePath = join(frameworkDistPath, "core");

/**
 * Interface for development server options
 */
interface DevServerOptions {
  port: number;
  host: string;
  projectPath: string;
  debug?: boolean;
  ignorePatterns?: string[];
  liveReload?: boolean;
  open?: boolean;
}

// WebSocket type for live reload
interface LiveReloadSocket extends ServerWebSocket<any> {
  data: {
    connectionId: string;
    clientType?: string;
  };
}

/**
 * Helper function to locate a file across multiple possible locations
 */
function locateFile(filename: string): string | null {
  // Define standard locations to check in priority order with absolute paths
  const possibleLocations = [
    join(dirname(currentFilePath), filename), // Current directory
    join(frameworkPath, "src", "cli", "server", filename), // Server directory
    join(frameworkPath, "src", "cli", "commands", "utils", filename), // Source tree utils
    join(frameworkPath, "dist", filename), // Dist root
    join(frameworkPath, "dist", "browser", filename), // Browser dist
  ];

  // Try each location
  for (const path of possibleLocations) {
    if (existsSync(path)) {
      logger.debug(`Found file at: ${path}`);
      return path;
    }
  }

  // Not found anywhere
  logger.debug(`File not found: ${filename}`);
  return null;
}

/**
 * Detect favicon in multiple locations and formats
 */
function detectFavicon(
  projectPath: string
): { path: string; format: string; location: string } | null {
  // Define formats and locations to check
  const formats = [".ico", ".svg", ".png"];
  const locations = ["public", "app"];

  // Track all found favicons
  const foundFavicons: Array<{
    path: string;
    format: string;
    location: string;
  }> = [];

  // Check all combinations
  for (const location of locations) {
    for (const format of formats) {
      const faviconName =
        format === ".ico" ? "favicon.ico" : `favicon${format}`;
      const faviconPath = join(projectPath, location, faviconName);

      if (existsSync(faviconPath)) {
        foundFavicons.push({
          path: faviconPath,
          format: format.substring(1), // Remove the dot
          location,
        });
      }
    }
  }

  // Also check for src/public which is used by the framework itself
  const frameworkFaviconPath = join(
    frameworkPath,
    "src",
    "public",
    "favicon.ico"
  );
  if (existsSync(frameworkFaviconPath)) {
    foundFavicons.push({
      path: frameworkFaviconPath,
      format: "ico",
      location: "framework",
    });
  }

  if (foundFavicons.length === 0) {
    return null;
  }

  // If multiple favicons found, log a warning
  if (foundFavicons.length > 1) {
    logger.warn(
      `Multiple favicons detected: ${foundFavicons.map((f) => `${f.location}/${f.format}`).join(", ")}. Using ${foundFavicons[0].location}/favicon.${foundFavicons[0].format}`
    );
  } else {
    logger.info(
      `Using favicon from ${foundFavicons[0].location}/favicon.${foundFavicons[0].format}`
    );
  }

  // Return the first one found (priority is defined by the order in locations and formats arrays)
  return foundFavicons[0];
}

/**
 * Broadcast reload message to connected WebSocket clients
 */
function broadcastReload(
  clients: Set<ServerWebSocket<unknown>>,
  type: string = "reload",
  filename?: string
): void {
  const message = JSON.stringify({ type, filename });

  for (const client of clients) {
    try {
      client.send(message);
    } catch (error) {
      logger.error(`Failed to send reload message: ${error}`);
    }
  }
}

/**
 * Generate HTML template for index page with proper app initialization
 */
function generateIndexHtml(projectPath: string): string {
  // Check if we have an app/page.tsx or similar
  const possibleAppDirPaths = [
    join(projectPath, "app/page.tsx"),
    join(projectPath, "app/page.jsx"),
    join(projectPath, "app/page.js"),
    join(projectPath, "app/page.ts"),
  ];

  const hasAppDirPage = possibleAppDirPaths.some((path) => existsSync(path));

  if (hasAppDirPage) {
    // Serve the full app with router and proper initialization
    return injectJsxRuntime(
      composeHtmlTemplate({
        title: "0x1 App",
        includeImportMap: true,
        includeAppScript: true,
      })
    );
  } else {
    // Show landing page if no app/page component exists
    return generateLandingPage();
  }
}

/**
 * Generate live reload script
 */
function generateLiveReloadScript(host: string): string {
  return `
// 0x1 Framework Live Reload Client
(function() {
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = '${host || "location.host"}';
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  
  function connect() {
    try {
      // Use the correct WebSocket endpoint
      ws = new WebSocket(\`\${wsProtocol}//\${host}/__0x1_ws\`);
      
      ws.onopen = () => {
        console.log('[0x1] Live reload connected');
        reconnectAttempts = 0;
        // Send ping to keep connection alive
        setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[0x1] Live reload:', data);
          
          if (data.type === 'reload') {
            window.location.reload();
          } else if (data.type === 'css-update') {
            updateStyles(data.filename);
          }
        } catch (error) {
          console.warn('[0x1] Failed to parse live reload message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('[0x1] Live reload disconnected');
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimer = setTimeout(connect, 1000 * reconnectAttempts);
        }
      };
      
      ws.onerror = (error) => {
        // Avoid logging errors that might be intercepted by browser extensions
        console.warn('[0x1] Live reload connection issue - will retry');
      };
    } catch (error) {
      console.error('[0x1] Failed to connect to live reload:', error);
    }
  }
  
  function updateStyles(filename) {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    if (!links.length) {
      window.location.reload();
      return;
    }
    
    let found = false;
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes(filename) || filename.includes(href))) {
        const newHref = href.split('?')[0] + '?t=' + Date.now();
        link.setAttribute('href', newHref);
        console.log('[0x1] Updated stylesheet:', newHref);
        found = true;
      }
    });
    
    if (!found) {
      window.location.reload();
    }
  }
  
  // Start connection
  connect();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (ws) {
      ws.close();
    }
  });
})();
`;
}

/**
 * Create JSX runtime script - Modern React 19 / Next.js 15 compatible
 */
function generateJsxRuntime(isDevRuntime: boolean = false): string {
  return `
// 0x1 Framework JSX Runtime - React 19 / Next.js 15 Compatible
console.log('[0x1 JSX Runtime] Loading modern JSX runtime');

// Core JSX symbols following React 19 standards - STANDARDIZED
const REACT_ELEMENT_TYPE = Symbol.for('react.element');
const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
const REACT_PROVIDER_TYPE = Symbol.for('react.provider');
const REACT_CONTEXT_TYPE = Symbol.for('react.context');

// Fragment symbol for JSX shorthand syntax - use React 19 standard
const Fragment = REACT_FRAGMENT_TYPE;

// MUCH SIMPLER HOOKS IMPLEMENTATION - Actually works like React
const globalHooksState = {
  components: new Map(),
  currentComponent: null,
  hookIndex: 0
};

// Component registry for reliable re-rendering
const componentRegistry = new Map();
let componentCounter = 0;

/**
 * Register a component for re-rendering
 */
function registerComponent(fn, props) {
  const id = \`comp_\${++componentCounter}\`;
  componentRegistry.set(id, { fn, props, element: null });
  return id;
}

/**
 * Simple, reliable useState implementation
 */
function useState(initialValue) {
  if (!globalHooksState.currentComponent) {
    throw new Error('[0x1 Hooks] useState must be called within a component');
  }
  
  const componentId = globalHooksState.currentComponent;
  const hookIndex = globalHooksState.hookIndex++;
  
  // Get or create component state
  if (!globalHooksState.components.has(componentId)) {
    globalHooksState.components.set(componentId, { hooks: [], renderFn: null });
  }
  
  const componentState = globalHooksState.components.get(componentId);
  
  // Initialize hook if it doesn't exist
  if (!componentState.hooks[hookIndex]) {
    componentState.hooks[hookIndex] = {
      value: typeof initialValue === 'function' ? initialValue() : initialValue
    };
  }
  
  const hook = componentState.hooks[hookIndex];
  
  const setState = (newValue) => {
    const nextValue = typeof newValue === 'function' ? newValue(hook.value) : newValue;
    
    if (!Object.is(hook.value, nextValue)) {
      hook.value = nextValue;
      
      // Trigger simple re-render
      requestAnimationFrame(() => {
        rerenderComponent(componentId);
      });
    }
  };
  
  return [hook.value, setState];
}

/**
 * Re-render a specific component
 */
function rerenderComponent(componentId) {
  const componentState = globalHooksState.components.get(componentId);
  if (!componentState || !componentState.renderFn) return;
  
  try {
    // Find all elements with this component ID
    const elements = document.querySelectorAll(\`[data-0x1-component="\${componentId}"]\`);
    
    elements.forEach(element => {
      // Set up hooks context
      globalHooksState.currentComponent = componentId;
      globalHooksState.hookIndex = 0;
      
      try {
        // Call the component function to get new result
        const newResult = componentState.renderFn();
        
        // Convert to DOM
        const newElement = renderToDOM(newResult);
        
        if (newElement && element.parentNode) {
          // Preserve the component ID
          if (newElement.setAttribute) {
            newElement.setAttribute('data-0x1-component', componentId);
          }
          
          // Replace the element
          element.parentNode.replaceChild(newElement, element);
        }
      } catch (error) {
        console.error('[0x1] Component re-render error:', error);
      } finally {
        // Clean up hooks context
        globalHooksState.currentComponent = null;
        globalHooksState.hookIndex = 0;
      }
    });
  } catch (error) {
    console.error('[0x1] Re-render error:', error);
  }
}

/**
 * Generate stable component ID
 */
function generateComponentId(type) {
  const name = type.name || type.displayName || 'Anonymous';
  return \`\${name}_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
}

/**
 * Call component with hooks support
 */
function callComponentWithHooks(type, props) {
  const componentId = generateComponentId(type);
  
  try {
    // Set up hooks context
    globalHooksState.currentComponent = componentId;
    globalHooksState.hookIndex = 0;
    
    // Store the component function for re-rendering
    if (!globalHooksState.components.has(componentId)) {
      globalHooksState.components.set(componentId, { hooks: [], renderFn: null });
    }
    
    const componentState = globalHooksState.components.get(componentId);
    componentState.renderFn = () => type(props);
    
    // Call the component
    const result = type(props);
    
    // Add component ID to result for DOM targeting
    if (result && typeof result === 'object' && result.$$typeof === REACT_ELEMENT_TYPE) {
      if (!result.props) result.props = {};
      result.props['data-0x1-component'] = componentId;
    }
    
    return result;
  } finally {
    // Clean up hooks context
    globalHooksState.currentComponent = null;
    globalHooksState.hookIndex = 0;
  }
}

/**
 * Modern JSX factory function following React 19 automatic transform
 */
function jsx(type, config, maybeKey) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;
  
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }
  
  if (config != null) {
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    
    // Copy props from config
    for (propName in config) {
      if (
        config.hasOwnProperty(propName) &&
        propName !== 'key' &&
        propName !== 'ref'
      ) {
        props[propName] = config[propName];
      }
    }
  }
  
  // Handle Fragment using standardized symbol
  if (type === Fragment || type === REACT_FRAGMENT_TYPE) {
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: REACT_FRAGMENT_TYPE,
      key: key,
      ref: null,
      props: {
        children: props.children
      },
      _owner: null
    };
  }
  
  // Handle function components
  if (typeof type === 'function') {
    return callComponentWithHooks(type, props);
  }
  
  // Handle DOM elements - create proper React element structure
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: null
  };
}

/**
 * JSX factory for static children (React 19 automatic transform)
 */
function jsxs(type, config, maybeKey) {
  return jsx(type, config, maybeKey);
}

/**
 * Development JSX function with enhanced debugging
 */
function jsxDEV(type, config, maybeKey, isStaticChildren, source, self) {
  const element = jsx(type, config, maybeKey);
  
  ${
    isDevRuntime
      ? `
  // Add development-only properties
  if (element && typeof element === 'object') {
    if (source) {
      element._source = source;
    }
    if (self !== undefined) {
      element._self = self;
    }
  }
  `
      : ""
  }
  
  return element;
}

/**
 * Legacy createElement for React compatibility
 */
function createElement(type, config, ...children) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;
  
  if (config != null) {
    if (config.key !== undefined) {
      key = '' + config.key;
    }
    
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    
    for (propName in config) {
      if (
        config.hasOwnProperty(propName) &&
        propName !== 'key' &&
        propName !== 'ref'
      ) {
        props[propName] = config[propName];
      }
    }
  }
  
  // Handle children
  const childrenLength = children.length;
  if (childrenLength === 1) {
    props.children = children[0];
  } else if (childrenLength > 1) {
    props.children = children;
  }
  
  return jsx(type, props, key);
}

/**
 * Render JSX to DOM with proper React 19 patterns
 */
function renderToDOM(element) {
  if (typeof window === 'undefined') {
    throw new Error('[0x1 JSX] renderToDOM can only be used in browser environment');
  }
  
  if (!element) return null;
  
  // Handle primitives
  if (typeof element === 'string' || typeof element === 'number') {
    return document.createTextNode(String(element));
  }
  
  if (typeof element === 'boolean' || element === null || element === undefined) {
    return null;
  }
  
  // Handle arrays (fragments)
  if (Array.isArray(element)) {
    const fragment = document.createDocumentFragment();
    element.forEach(child => {
      const childNode = renderToDOM(child);
      if (childNode) fragment.appendChild(childNode);
    });
    return fragment;
  }
  
  // Handle React elements
  if (typeof element === 'object' && element.$$typeof === REACT_ELEMENT_TYPE) {
    // Handle Fragment using standardized symbol
    if (element.type === REACT_FRAGMENT_TYPE) {
      const fragment = document.createDocumentFragment();
      const children = element.props.children;
      if (children) {
        const childArray = Array.isArray(children) ? children : [children];
        childArray.forEach(child => {
          const childNode = renderToDOM(child);
          if (childNode) fragment.appendChild(childNode);
        });
      }
      return fragment;
    }
    
    // Handle function components
    if (typeof element.type === 'function') {
      const result = callComponentWithHooks(element.type, element.props);
      return renderToDOM(result);
    }
    
    // Handle DOM elements - Fixed SVG handling
    const tagName = element.type;
    let domElement;
    
    // SVG elements need special namespace handling
    const svgElements = new Set([
      'svg', 'path', 'circle', 'rect', 'line', 'ellipse', 'polygon', 'polyline',
      'g', 'defs', 'use', 'symbol', 'marker', 'clipPath', 'mask', 'pattern',
      'linearGradient', 'radialGradient', 'stop', 'text', 'tspan', 'textPath',
      'foreignObject', 'switch', 'animate', 'animateTransform', 'animateMotion'
    ]);
    
    if (svgElements.has(tagName)) {
      domElement = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    } else {
      domElement = document.createElement(tagName);
    }
    
    // Set attributes and properties
    Object.entries(element.props || {}).forEach(([key, value]) => {
      if (key === 'children') return;
      
      if (key === 'className') {
        // SVG elements need class attribute, not className property
        if (svgElements.has(tagName)) {
          domElement.setAttribute('class', String(value));
        } else {
          domElement.className = String(value);
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        domElement.addEventListener(eventName, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(domElement.style, value);
      } else if (key === 'dangerouslySetInnerHTML' && value && value.__html) {
        domElement.innerHTML = value.__html;
        return; // Skip children processing
      } else if (typeof value === 'boolean') {
        if (value) domElement.setAttribute(key, '');
      } else if (value != null) {
        domElement.setAttribute(key, String(value));
      }
    });
    
    // Add children
    const children = element.props.children;
    if (children) {
      const childArray = Array.isArray(children) ? children : [children];
      childArray.forEach(child => {
        const childNode = renderToDOM(child);
        if (childNode) domElement.appendChild(childNode);
      });
    }
    
    return domElement;
  }
  
  // Handle legacy JSX objects (fallback)
  if (typeof element === 'object' && element.type) {
    return renderToDOM({
      $$typeof: REACT_ELEMENT_TYPE,
      type: element.type,
      props: element.props || {},
      key: element.key,
      ref: null,
      _owner: null
    });
  }
  
  return null;
}

// Make functions globally available using standardized names
if (typeof globalThis !== 'undefined') {
  globalThis.jsx = jsx;
  globalThis.jsxs = jsxs;
  globalThis.jsxDEV = jsxDEV;
  globalThis.createElement = createElement;
  globalThis.Fragment = Fragment;
  globalThis.renderToDOM = renderToDOM;
  globalThis.useState = useState;
  
  // Hooks context compatibility
  globalThis.__0x1_hooksContext = globalHooksState;
  globalThis.__0x1_useState = useState;
  globalThis.__0x1_enterComponentContext = (id) => {
    globalHooksState.currentComponent = id;
    globalHooksState.hookIndex = 0;
  };
  globalThis.__0x1_exitComponentContext = () => {
    globalHooksState.currentComponent = null;
    globalHooksState.hookIndex = 0;
  };
}

// Browser compatibility
if (typeof window !== 'undefined') {
  window.jsx = jsx;
  window.jsxs = jsxs;
  window.jsxDEV = jsxDEV;
  window.createElement = createElement;
  window.Fragment = Fragment;
  window.renderToDOM = renderToDOM;
  window.useState = useState;
  window.__0x1_renderToDOM = renderToDOM; // Add compatibility reference
  
  // Hooks context compatibility
  window.__0x1_hooksContext = globalHooksState;
  window.__0x1_useState = useState;
  window.__0x1_enterComponentContext = (id) => {
    globalHooksState.currentComponent = id;
    globalHooksState.hookIndex = 0;
  };
  window.__0x1_exitComponentContext = () => {
    globalHooksState.currentComponent = null;
    globalHooksState.hookIndex = 0;
  };
  
  // React compatibility layer
  window.React = {
    createElement,
    Fragment,
    jsx,
    jsxs,
    useState,
    version: '19.0.0-0x1',
    
    // Modern React 19 APIs
    use: function(promise) {
      throw new Error('React.use() not implemented in 0x1 runtime');
    },
    
    // Legacy APIs for compatibility
    Component: class Component {
      constructor(props) {
        this.props = props;
      }
      render() {
        throw new Error('Class components not supported in 0x1 runtime');
      }
    },
    
    PureComponent: class PureComponent {
      constructor(props) {
        this.props = props;
      }
      render() {
        throw new Error('Class components not supported in 0x1 runtime');
      }
    }
  };
}

${
  isDevRuntime
    ? `
// Development-only features
console.log('[0x1 JSX Dev] Development mode enabled');
window.__0x1_dev = {
  version: '0.1.0',
  runtime: 'jsx-dev',
  refresh: () => {
    console.log('[0x1 JSX Dev] Refreshing...');
    window.location.reload();
  },
  inspectElement: (element) => {
    console.log('[0x1 JSX Dev] Element inspection:', element);
    return element;
  },
  inspectHooks: () => {
    console.log('[0x1 JSX Dev] Hooks state:', globalHooksState);
    return globalHooksState;
  }
};
`
    : ""
}

console.log('[0x1 JSX Runtime] Modern runtime ready (React 19 compatible)');
`;
}

/**
 * Handle component requests
 */
function handleJsxComponent(
  reqPath: string,
  projectPath: string
): Response | null {
  // Handle JSX runtime requests - standardized paths
  if (
    reqPath === "/0x1/jsx-runtime.js" ||
    reqPath === "/0x1/jsx-dev-runtime.js" ||
    reqPath === "/__0x1_jsx_runtime.js" ||
    reqPath === "/__0x1_jsx_dev_runtime.js"
  ) {
    const isDevRuntime = reqPath.includes("dev");
    logger.info(
      `✅ 200 OK: Serving ${isDevRuntime ? "development" : "production"} JSX runtime`
    );

    // Use the generateJsxRuntime function to get the runtime content
    const jsxRuntimeContent = generateJsxRuntime(isDevRuntime);

    return new Response(jsxRuntimeContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  // Handle component transpilation using the component handler
  return handleComponentRequest(
    reqPath,
    projectPath,
    reqPath.replace(/^\//, "")
  );
}

/**
 * Server-side route discovery - scans the actual file system
 */
function discoverRoutesFromFileSystem(
  projectPath: string
): Array<{ path: string; componentPath: string }> {
  const routes: Array<{ path: string; componentPath: string }> = [];

  function scanDirectory(dirPath: string, routePath: string = "") {
    try {
      if (!existsSync(dirPath)) {
        return;
      }

      const items = readdirSync(dirPath);

      // Check for page files in current directory
      const pageFiles = items.filter((item: string) =>
        item.match(/^page\.(tsx|jsx|ts|js)$/)
      );

      if (pageFiles.length > 0) {
        // Found a page file, add route
        const route = routePath || "/";
        // Use the actual file extension found, but serve as .js (transpiled)
        const actualFile = pageFiles[0];
        const componentPath = `/app${routePath}/${actualFile.replace(/\.(tsx|ts)$/, ".js")}`;
        routes.push({ path: route, componentPath });
        logger.debug(
          `Found route: ${route} -> ${componentPath} (source: ${actualFile})`
        );
      }

      // Recursively scan subdirectories (but avoid infinite recursion)
      const subdirs = items.filter((item: string) => {
        const itemPath = join(dirPath, item);
        try {
          return (
            statSync(itemPath).isDirectory() &&
            !item.startsWith(".") &&
            !item.startsWith("_") &&
            item !== "node_modules"
          );
        } catch {
          return false;
        }
      });

      for (const subdir of subdirs) {
        const subdirPath = join(dirPath, subdir);
        const subroutePath = routePath + "/" + subdir;
        scanDirectory(subdirPath, subroutePath);
      }
    } catch (error) {
      logger.debug(`Error scanning directory ${dirPath}: ${error}`);
    }
  }

  // Scan app directory
  const appDir = join(projectPath, "app");
  scanDirectory(appDir);

  // Also scan app/pages directory if it exists
  const pagesDir = join(projectPath, "app", "pages");
  if (existsSync(pagesDir)) {
    scanDirectory(pagesDir);
  }

  // Sort routes by path length (more specific routes first)
  routes.sort((a, b) => {
    if (a.path === "/") return 1; // Root route last
    if (b.path === "/") return -1;
    return b.path.length - a.path.length;
  });

  logger.info(
    `Discovered ${routes.length} routes: ${routes.map((r) => r.path).join(", ")}`
  );
  return routes;
}

/**
 * Create a development server
 */
export function createDevServer(options: DevServerOptions): Server {
  const {
    port,
    host,
    projectPath,
    debug = false,
    ignorePatterns = [],
    liveReload = true,
  } = options;

  // Socket clients for live reload
  const clients = new Set<ServerWebSocket<unknown>>();

  // Detect favicon
  const detectedFavicon = detectFavicon(projectPath);
  if (!detectedFavicon) {
    logger.warn(
      "No favicon detected in app/ or public/ directories. Using framework default."
    );
  }

  // Create directories if they don't exist
  const publicDir = join(projectPath, "public");
  const distDir = join(projectPath, "dist");
  const tempDir = join(projectPath, ".0x1-temp");

  for (const dir of [publicDir, distDir, tempDir]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }

  // Watch files for changes
  const isLightRefresh = (filename: string): boolean => {
    if (filename.endsWith(".css")) return true;
    return false;
  };

  // Create a watcher
  const watcher = watch(projectPath, { recursive: true }, (event, filename) => {
    if (!filename) return;

    // Convert filename to string if it's a Buffer
    // Using type assertion to avoid TS2358 error with instanceof check
    const filenameStr =
      typeof filename === "object" &&
      filename !== null &&
      "toString" in filename
        ? (filename as Buffer).toString()
        : (filename as string);

    // Ignore node_modules, .git, dist, and other specified patterns
    const defaultIgnorePatterns = [
      "node_modules",
      ".git",
      "dist",
      ".DS_Store",
      ".0x1-temp",
    ];
    const allIgnorePatterns = [...defaultIgnorePatterns, ...ignorePatterns];

    if (allIgnorePatterns.some((pattern) => filenameStr.includes(pattern))) {
      return;
    }

    // Log the file change if debug is enabled
    if (debug) {
      logger.debug(`File changed: ${filenameStr}`);
    }

    // Determine if we need a full refresh or just a CSS refresh
    if (isLightRefresh(filenameStr)) {
      logger.info(
        `CSS file changed: ${filenameStr} (sending lightweight refresh)`
      );
      broadcastReload(clients, "css-update", filenameStr);
    } else {
      logger.info(`File changed: ${filenameStr} (sending full refresh)`);
      broadcastReload(clients, "reload", filenameStr);
    }
  });

  // Start Tailwind processing early in the server startup
  const startTailwind = async () => {
    try {
      // Check if Tailwind v4 is available first
      const isV4Available = await tailwindV4Handler.isAvailable(projectPath);

      if (isV4Available) {
        const version = await tailwindV4Handler.getVersion(projectPath);
        logger.info(`🌈 Detected Tailwind CSS v4 (${version})`);
        logger.info("🌟 Using modern Tailwind CSS v4 integration with Bun");

        // Find or create input file
        let inputFile = tailwindV4Handler.findInputFile(projectPath);
        if (!inputFile) {
          inputFile = tailwindV4Handler.createDefaultInput(projectPath);
        }

        if (inputFile) {
          logger.info(`💠 Found Tailwind v4 input file: ${inputFile}`);

          const outputFile = join(projectPath, ".0x1/public/styles.css");

          try {
            const tailwindProcess = await tailwindV4Handler.startProcess(
              projectPath,
              inputFile,
              outputFile
            );
            logger.success("✅ ✅ ✅ ✅ Tailwind CSS v4 watcher started");

            // Handle process output for better logging
            if (tailwindProcess.process && tailwindProcess.process.stderr) {
              const reader = tailwindProcess.process.stderr.getReader();
              const decoder = new TextDecoder();

              const readError = async () => {
                try {
                  let reading = true;
                  while (reading) {
                    const { done, value } = await reader.read();
                    if (done) {
                      reading = false;
                      break;
                    }

                    const output = decoder.decode(value);
                    if (output.trim()) {
                      // Filter out noise and only show important messages
                      if (output.includes("Done in")) {
                        logger.success("✅ Tailwind CSS ready for development");
                      } else if (
                        !output.includes("Resolving dependencies") &&
                        !output.includes("Resolved, downloaded")
                      ) {
                        logger.warn(`💠 Tailwind stderr: ${output.trim()}`);
                      }
                    }
                  }
                } catch (error) {
                  logger.debug(`Tailwind stderr reader error: ${error}`);
                }
              };
              readError();
            }
          } catch (error) {
            logger.warn(`⚠️ Could not start Tailwind v4 watcher: ${error}`);
            // Fall back to basic CSS processing
            const success = await processTailwindCss(projectPath);
            if (success) {
              logger.success(
                "✅ Tailwind CSS ready for development (fallback)"
              );
            }
          }
        }
      } else {
        // Fall back to the existing handler for v3 or other setups
        const success = await processTailwindCss(projectPath);
        if (success) {
          logger.success("✅ Tailwind CSS ready for development");
        } else {
          logger.warn("⚠️ Tailwind CSS not available - continuing without it");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.debug(`Tailwind processing error: ${errorMessage}`);
      logger.warn("⚠️ Tailwind CSS not available - continuing without it");
    }
  };

  // Start Tailwind in the background
  startTailwind();

  // Create the server
  const server = serve({
    port,
    hostname: host,
    development: true,

    // WebSocket handling
    websocket: {
      message: (ws: LiveReloadSocket, message: string | Uint8Array) => {
        try {
          // Parse the message
          const data =
            typeof message === "string"
              ? JSON.parse(message)
              : JSON.parse(new TextDecoder().decode(message));

          // Handle ping messages silently
          if (data.type === "ping") {
            // Send pong response
            ws.send(
              JSON.stringify({
                type: "pong",
                timestamp: Date.now(),
              })
            );
            return;
          }

          // Log other messages
          if (debug) {
            logger.debug(
              `[0x1] Received message from ${ws.data.connectionId}: ${JSON.stringify(data)}`
            );
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logger.error(`[0x1] Error handling message: ${errorMessage}`);
        }
      },
      open: (ws: ServerWebSocket<any>) => {
        // Generate a unique connection ID
        ws.data = {
          connectionId: `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        };

        clients.add(ws);
        logger.info(
          `[0x1] WebSocket client connected (${(ws.data as any).connectionId})`
        );
      },
      close: (ws: ServerWebSocket<any>) => {
        // Remove from clients set
        clients.delete(ws);
        logger.info(
          `[0x1] WebSocket client disconnected (${(ws.data as any).connectionId || "unknown"})`
        );
      },
    },

    // Main request handler
    fetch: async (req: Request, server: Server): Promise<Response> => {
      const url = new URL(req.url);
      const reqPath = url.pathname;

      // Log request status with color-coded output
      const logRequestStatus = (
        status: number,
        path: string,
        extraInfo?: string
      ) => {
        const statusText =
          status >= 200 && status < 300
            ? "OK"
            : status >= 300 && status < 400
              ? "Redirect"
              : "Error";

        const emoji =
          status >= 200 && status < 300
            ? "✅"
            : status >= 300 && status < 400
              ? "↪️"
              : "❌";

        const message = `${emoji} ${status} ${statusText}: ${path}${extraInfo ? ` (${extraInfo})` : ""}`;

        if (status >= 200 && status < 300) {
          logger.info(message);
        } else if (status >= 300 && status < 400) {
          logger.warn(message);
        } else {
          logger.error(message);
        }
      };

      // Debug logging for requests
      if (debug) {
        logger.debug(`Request for: ${reqPath} (${req.method})`);
      }

      // Upgrade WebSocket connections
      if (
        reqPath === "/ws" ||
        reqPath === "/__0x1_ws" ||
        reqPath === "/__0x1_ws_live_reload"
      ) {
        if (server.upgrade(req)) {
          return new Response(null, { status: 101 });
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Handle EventSource connections for live reload
      if (reqPath === "/__0x1_sse_live_reload") {
        const headers = new Headers({
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        // Create a readable stream that will be sent to the client
        const stream = new ReadableStream({
          start(controller) {
            // Send initial connection message
            controller.enqueue(": connected\n\n");

            // Function to send events to this client
            const sendEvent = (event: string, data: any) => {
              controller.enqueue(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              );
            };

            // Send initial connection event
            sendEvent("connected", { timestamp: Date.now() });

            // Set up an interval to send keep-alive messages
            const keepAliveInterval = setInterval(() => {
              sendEvent("ping", { timestamp: Date.now() });
            }, 30000);

            // Handle stream closure
            req.signal.addEventListener("abort", () => {
              clearInterval(keepAliveInterval);
            });
          },
        });

        return new Response(stream, { headers });
      }

      // Handle live reload script request
      if (reqPath === "/__0x1_live_reload.js") {
        logRequestStatus(200, reqPath, "Serving live reload script");
        const script = generateLiveReloadScript(
          req.headers.get("host") || `${host}:${port}`
        );

        return new Response(script, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      // Handle server actions (Next15 style)
      if (reqPath === "/__0x1_server_action" && req.method === "POST") {
        try {
          logRequestStatus(200, reqPath, "Processing server action");
          
          // Import the directives handler
          const { handleServerAction } = await import('../../core/directives.js');
          const result = await handleServerAction(req);
          
          return result;
        } catch (error) {
          logRequestStatus(500, reqPath, `Server action error: ${error}`);
          return new Response(JSON.stringify({ 
            error: "Server action failed",
            message: error instanceof Error ? error.message : String(error)
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Handle server action preflight requests
      if (reqPath === "/__0x1_server_action" && req.method === "OPTIONS") {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      // Handle JSX runtime requests
      const jsxResponse = handleJsxComponent(reqPath, projectPath);
      if (jsxResponse) {
        return jsxResponse;
      }

      // Handle 0x1 core hooks module requests
      if (
        reqPath === "/node_modules/0x1/core/hooks.js" ||
        reqPath === "/0x1/hooks.js"
      ) {
        try {
          // Try to serve the hooks module from the framework dist
          const hooksPath = join(frameworkCorePath, "hooks.js");
          if (existsSync(hooksPath)) {
            logRequestStatus(200, reqPath, "Serving 0x1 Hooks module");
            const hooksContent = readFileSync(hooksPath, "utf-8");
            return new Response(hooksContent, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }
        } catch (error) {
          logger.error(`Error serving hooks module: ${error}`);
        }

        // Fallback: Generate a basic hooks module that delegates to browser hooks
        logRequestStatus(200, reqPath, "Serving generated hooks module");
        const hooksModule = `
// 0x1 Framework - Browser Hooks Module
console.log('[0x1] Hooks module loaded');

// Delegate to browser hook system
export function useState(initialValue) {
  // Use hooks context if available (preferred)
  if (typeof window !== 'undefined' && window.useState) {
    return window.useState(initialValue);
  }
  
  // Fallback implementation for when hooks context is not available
  console.warn('[0x1 Hooks] Using fallback useState - hooks context not available');
  
  // Simple fallback that doesn't require component context
  let state = typeof initialValue === 'function' ? initialValue() : initialValue;
  const setState = (newValue) => {
    const nextValue = typeof newValue === 'function' ? newValue(state) : newValue;
    if (!Object.is(state, nextValue)) {
      state = nextValue;
      console.warn('[0x1 Hooks] setState called without proper context - state updated but no re-render');
    }
  };
  return [state, setState];
}

export function useEffect(callback, deps) {
  // Simple effect implementation
  if (typeof window !== 'undefined') {
    // Run immediately for now (no dependency tracking)
    setTimeout(callback, 0);
  }
}

export function useCallback(callback, deps) {
  // Simple callback implementation (no memoization)
  return callback;
}

export function useMemo(factory, deps) {
  // Simple memo implementation (no memoization)
  return factory();
}

export function useRef(initialValue) {
  // Simple ref implementation
  return { current: initialValue };
}

export function setComponentContext(componentId, updateCallback) {
  if (typeof window !== 'undefined' && window.__0x1_enterComponentContext) {
    return window.__0x1_enterComponentContext(componentId, updateCallback);
  }
}

export function clearComponentContext() {
  if (typeof window !== 'undefined' && window.__0x1_exitComponentContext) {
    return window.__0x1_exitComponentContext();
  }
}

// Export version
export const version = '0.1.0';

// Default export
export default {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  setComponentContext,
  clearComponentContext,
  version
};
`;

        return new Response(hooksModule, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      // Handle 0x1 framework module requests
      if (
        reqPath === "/node_modules/0x1/index.js" ||
        reqPath === "/node_modules/0x1" ||
        reqPath === "/0x1/index.js" ||
        reqPath.startsWith("/node_modules/0x1/index.js?")
      ) {
        // Log the exact request path to see cache-busting parameters
        logger.info(`🔧 Framework module requested: ${reqPath}`);

        // CRITICAL FIX: Serve a clean, non-conflicting framework module
        logRequestStatus(
          200,
          reqPath,
          "Serving clean framework module (production-ready)"
        );

        const cleanFrameworkModule = `
// 0x1 Framework - Production Module
console.log('[0x1] Framework module loaded - production version');

// Re-export from the production hooks system
export * from '/0x1/hooks.js';

// Direct hooks exports for better compatibility
export function useState(initialValue) {
  if (typeof window !== 'undefined' && window.useState) {
    return window.useState(initialValue);
  }
  throw new Error('[0x1] useState not available - JSX runtime not loaded');
}

export function useEffect(callback, deps) {
  if (typeof window !== 'undefined') {
    setTimeout(callback, 0);
  }
}

export function useCallback(callback, deps) {
  return callback;
}

export function useMemo(factory, deps) {
  return factory();
}

export function useRef(initialValue) {
  return { current: initialValue };
}

// Basic JSX support (delegates to runtime)
export function jsx(type, props, key) {
  if (typeof window !== 'undefined' && window.jsx) {
    return window.jsx(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not available');
}

export function jsxs(type, props, key) {
  if (typeof window !== 'undefined' && window.jsxs) {
    return window.jsxs(type, props, key);
  }
  throw new Error('[0x1] JSX runtime not available');
}

export function createElement(type, props, ...children) {
  if (typeof window !== 'undefined' && window.createElement) {
    return window.createElement(type, props, ...children);
  }
  throw new Error('[0x1] JSX runtime not available');
}

export const Fragment = Symbol.for('react.fragment');

// Default export
export default { 
  jsx, 
  jsxs, 
  createElement, 
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  version: '0.1.0-production'
};
`;

        return new Response(cleanFrameworkModule, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
      }

      // Handle router module requests
      if (
        reqPath === "/0x1/router.js" ||
        reqPath === "/node_modules/0x1/router.js"
      ) {
        try {
          // CRITICAL FIX: Use the precompiled router from 0x1-router package
          const routerPath = join(frameworkPath, "0x1-router", "dist", "index.js");
          if (existsSync(routerPath)) {
            logRequestStatus(200, reqPath, "Serving precompiled 0x1 Router");
            const routerContent = readFileSync(routerPath, "utf-8");
            return new Response(routerContent, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }

          // Fallback to source if dist doesn't exist
          const routerSourcePath = join(frameworkPath, "0x1-router", "src", "index.ts");
          if (existsSync(routerSourcePath)) {
            logRequestStatus(200, reqPath, "Serving 0x1 Router source (transpiled)");
            let routerContent = readFileSync(routerSourcePath, "utf-8");
            
            // Simple TypeScript to JavaScript conversion for the router
            routerContent = routerContent
              .replace(/: \w+(\[\])?/g, '') // Remove type annotations
              .replace(/interface \w+\s*{[^}]*}/g, '') // Remove interfaces
              .replace(/export interface[^}]*}/g, '') // Remove exported interfaces
              .replace(/declare function[^;]*;/g, '') // Remove declare statements
              .replace(/import\s+type\s+{[^}]+}\s+from\s+[^;]+;/g, '') // Remove type imports
              .replace(/\?\s*:/g, ':') // Remove optional property markers
              .replace(/export\s+type\s+[^=]+=\s*[^;]+;/g, ''); // Remove type definitions

            return new Response(routerContent, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }
        } catch (error) {
          logger.error(`Error serving precompiled router: ${error}`);
        }

        // Only use fallback if precompiled router is not available
        logRequestStatus(200, reqPath, "Serving router fallback (not recommended)");
        const { generateRouterModule } = await import(
          "../commands/utils/jsx-templates"
        );
        const routerContent = generateRouterModule();

        return new Response(routerContent, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      // Handle Link component requests
      if (reqPath === "/0x1/link" || reqPath === "/node_modules/0x1/link") {
        try {
          // Try to serve the Link component from the framework dist
          const linkPath = join(frameworkCorePath, "link.js");
          if (existsSync(linkPath)) {
            logRequestStatus(200, reqPath, "Serving 0x1 Link component");
            const linkContent = readFileSync(linkPath, "utf-8");
            return new Response(linkContent, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }
        } catch (error) {
          logger.error(`Error serving Link component: ${error}`);
        }

        // Fallback: Generate Link component dynamically
        logRequestStatus(200, reqPath, "Serving generated Link component");
        const linkComponent = `
// 0x1 Framework Link Component - Enhanced for proper JSX runtime compatibility
export default function Link({ href, children, className, target, rel, ...props }) {
  // Ensure proper JSX element structure for 0x1 runtime
  // Remove onClick handler to let the router handle navigation through its global click handler
  return {
    $$typeof: Symbol.for('react.element'),
    type: 'a',
    props: {
      href,
      className,
      target,
      rel,
      ...props,
      children
      // No onClick handler - let the router's global click handler manage navigation
    },
    key: null,
    ref: null,
    _owner: null
  };
}

// Named export for compatibility
export { Link };

// Export as both default and named for maximum compatibility
export const LinkComponent = Link;
`;

        return new Response(linkComponent, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      // Handle error boundary requests
      if (
        reqPath === "/0x1-error-boundary.js" ||
        reqPath === "/error-boundary-client.js"
      ) {
        try {
          // Try multiple possible locations for the error boundary
          const possiblePaths = [
            join(frameworkPath, "src", "browser", "error", "error-boundary.js"),
            join(frameworkPath, "dist", "browser", "error-boundary.js"),
            join(frameworkPath, "dist", "error-boundary-client.js"),
          ];

          let errorBoundaryContent = null;
          let foundPath = null;

          for (const path of possiblePaths) {
            if (existsSync(path)) {
              errorBoundaryContent = readFileSync(path, "utf-8");
              foundPath = path;
              break;
            }
          }

          if (errorBoundaryContent) {
            logRequestStatus(
              200,
              reqPath,
              `Serving error boundary from ${foundPath?.replace(frameworkPath, "") || "source"}`
            );
            return new Response(errorBoundaryContent, {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }
        } catch (error) {
          logger.error(`Error serving error boundary: ${error}`);
        }

        // Fallback error boundary - browser compatible
        logRequestStatus(200, reqPath, "Serving error boundary fallback");
        return new Response(
          `
// 0x1 Error Boundary Fallback - Browser Compatible
console.log('[0x1] Error boundary loaded (fallback)');

// Initialize error boundary on window
window.__0x1_errorBoundary = window.__0x1_errorBoundary || {
  errors: [],
  addError(error, componentName) {
    console.error('[0x1] Error in component:', componentName || 'Unknown', error);
    this.errors.push({
      id: Date.now(),
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      componentName: componentName || 'Unknown Component',
      timestamp: new Date()
    });
    this.showErrorNotification(error, componentName);
    return this.errors.length - 1;
  },
  
  showErrorNotification(error, componentName) {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      max-width: 400px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    \`;
    
    notification.innerHTML = \`
      <div style="font-weight: bold; margin-bottom: 4px;">
        Error in \${componentName || 'Component'}
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        \${error.message || 'Unknown error occurred'}
      </div>
    \`;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  },
  
  clearErrors() {
    this.errors = [];
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  window.__0x1_errorBoundary.addError(event.error || new Error(event.message), 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
  window.__0x1_errorBoundary.addError(event.reason || new Error('Unhandled Promise Rejection'), 'Promise');
});

// Export for module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.__0x1_errorBoundary;
}
`,
          {
            status: 200,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache",
            },
          }
        );
      }

      // Handle favicon requests
      if (reqPath === "/favicon.ico" || reqPath.startsWith("/favicon.")) {
        // Use the detected favicon or fall back to the framework default
        const favicon = detectedFavicon || {
          path: join(frameworkPath, "src", "public", "favicon.ico"),
          format: "ico",
          location: "framework",
        };

        if (existsSync(favicon.path)) {
          logRequestStatus(
            200,
            reqPath,
            `Serving favicon from ${favicon.location}`
          );
          const content = readFileSync(favicon.path);
          const mimeType = getMimeType(favicon.path);

          return new Response(content, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }

      // Handle CSS module requests
      if (isCssModuleJsRequest(reqPath)) {
        try {
          const cssFilePath = join(projectPath, reqPath.replace(".js", ""));

          if (existsSync(cssFilePath)) {
            logRequestStatus(200, reqPath, "Serving CSS module");
            const result = generateCssModuleScript(reqPath);

            return new Response(result || "", {
              status: 200,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }
        } catch (error) {
          logger.error(`Error serving CSS module: ${error}`);
        }
      }

      // Handle CSS file requests
      if (reqPath.endsWith(".css")) {
        try {
          const cssFilePath = join(projectPath, reqPath);

          if (existsSync(cssFilePath)) {
            logRequestStatus(200, reqPath, "Serving CSS file");
            const processedCss = await processCssFile(cssFilePath);

            return new Response(processedCss?.content || "", {
              status: 200,
              headers: {
                "Content-Type":
                  processedCss?.contentType || "text/css; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            });
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error serving CSS file: ${errorMessage}`);
          return new Response("/* Tailwind CSS not available */", {
            headers: { "Content-Type": "text/css" },
          });
        }
      }

      // Handle app.js bundle request (main app entry point)
      if (reqPath === "/app.js") {
        try {
          // Discover routes on the server side
          const discoveredRoutes = discoverRoutesFromFileSystem(projectPath);

          // Generate a dynamic app.js that loads and renders the app components
          const appScript = `
// 0x1 Framework App Bundle - Production Ready
console.log('[0x1 App] Starting production-ready app...');

// Import the production router
import { createRouter } from '/0x1/router.js';

// Wait for JSX runtime to be ready
function waitForJsxRuntime() {
  return new Promise((resolve) => {
    const checkRuntime = () => {
      if (window.jsx && window.jsxs && window.Fragment && window.createElement) {
        resolve();
      } else {
        setTimeout(checkRuntime, 10);
      }
    };
    checkRuntime();
  });
}

// Component loader with proper error handling
async function loadComponent(path) {
  try {
    const module = await import(path + '?t=' + Date.now());
    return module;
  } catch (error) {
    console.error('[0x1 App] Failed to load component:', path, error);
    throw error;
  }
}

// Server-discovered routes
const serverRoutes = ${JSON.stringify(discoveredRoutes)};

// Production-ready route loading
async function loadRoutes() {
  const routes = [];
  
  for (const routeInfo of serverRoutes) {
    try {
      const module = await loadComponent(routeInfo.componentPath);
      const component = module.default || module[Object.keys(module)[0]];
      
      if (typeof component === 'function') {
        routes.push({
          path: routeInfo.path,
          component: component
        });
      }
    } catch (error) {
      console.error('[0x1 App] Failed to load route:', routeInfo.path, error);
    }
  }
  
  return routes;
}

// Initialize the production app
async function initApp() {
  try {
    await waitForJsxRuntime();
    
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('[0x1 App] App container not found');
      return;
    }

    // Load layout component (optional)
    let layoutComponent = null;
    try {
      const layoutModule = await loadComponent('/app/layout.js');
      layoutComponent = layoutModule.default;
    } catch (error) {
      console.log('[0x1 App] No layout component found (this is optional)');
    }

    // Load all routes
    const routes = await loadRoutes();
    
    if (routes.length === 0) {
      console.warn('[0x1 App] No routes discovered');
      return;
    }

    // Create production router with proper configuration
    const router = createRouter({
      rootElement: appContainer,
      mode: 'history',
      debug: false,
      base: '/'
    });

    // Register routes with optional layout
    for (const route of routes) {
      if (layoutComponent) {
        // Wrap component with layout
        const wrappedComponent = (props) => {
          const pageElement = route.component(props);
          return layoutComponent({ children: pageElement });
        };
        router.addRoute(route.path, wrappedComponent, { exact: true });
      } else {
        router.addRoute(route.path, route.component, { exact: true });
      }
    }
    
    // Initialize router
    router.init();
    
    // Navigate to current path
    const currentPath = window.location.pathname || '/';
    router.navigate(currentPath, false);
    
    // Make router globally available
    window.__0x1_router = router;
    
    console.log('[0x1 App] Production app initialized with', routes.length, 'routes');
  } catch (error) {
    console.error('[0x1 App] App initialization failed:', error);
  }
}

// Start the app
initApp();
`;

          logRequestStatus(200, reqPath, "Serving app bundle");
          return new Response(appScript, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
              ETag: `"app-${Date.now()}-${Math.random()}"`, // Force cache busting with random component
              "Last-Modified": new Date().toUTCString(),
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error generating app bundle: ${errorMessage}`);
          return new Response(
            `console.error('Failed to load app bundle: \${errorMessage}');`,
            {
              status: 500,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            }
          );
        }
      }

      // Handle component requests (including app directory components and bare component names)
      if (
        (reqPath.endsWith(".js") &&
          (reqPath.includes("/app/") || reqPath.includes("/components/"))) ||
        (reqPath.startsWith("/components/") && !reqPath.includes(".")) ||
        (reqPath.startsWith("/app/") && reqPath.endsWith(".js"))
      ) {
        try {
          // Handle bare component names (e.g., /components/Counter)
          const basePath = reqPath.endsWith(".js")
            ? reqPath.replace(".js", "")
            : reqPath;

          // Convert .js request to source file (.tsx, .jsx, .ts, .js)
          const possibleSourcePaths = [
            join(projectPath, `${basePath}.tsx`),
            join(projectPath, `${basePath}.jsx`),
            join(projectPath, `${basePath}.ts`),
            join(projectPath, `${basePath}.js`),
          ];

          // Find the actual source file
          const sourcePath = possibleSourcePaths.find((path) =>
            existsSync(path)
          );

          if (sourcePath) {
            logRequestStatus(
              200,
              reqPath,
              `Transpiling component from ${sourcePath.replace(projectPath, "")}`
            );

            // Use the component handler to transpile and serve
            const componentBasePath = basePath.replace(/^\//, ""); // Remove leading slash
            const result = handleComponentRequest(
              reqPath,
              projectPath,
              componentBasePath
            );

            if (result) {
              return result;
            }
          } else {
            // Component source not found - return a helpful fallback
            logRequestStatus(
              200,
              reqPath,
              "Component not found, serving fallback"
            );
            return new Response(
              `// Component fallback: ${reqPath}
console.warn('[0x1] Component not found: \${basePath}');

export default function NotFoundComponent(props) {
  const container = document.createElement('div');
  container.className = 'component-not-found p-4 border border-yellow-400 bg-yellow-50 rounded';
  container.innerHTML = \`
    <div class="text-yellow-800">
      <h3 class="font-bold">Component Not Found</h3>
      <p>Could not find component: <code>\${basePath}</code></p>
      <p class="text-sm mt-2">Expected one of:</p>
      <ul class="text-xs mt-1 ml-4">
        <li>\${basePath}.tsx</li>
        <li>\${basePath}.jsx</li>
        <li>\${basePath}.ts</li>
        <li>\${basePath}.js</li>
      </ul>
    </div>
  \`;
  return container;
}
`,
              {
                status: 200,
                headers: {
                  "Content-Type": "application/javascript; charset=utf-8",
                  "Cache-Control": "no-cache",
                },
              }
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error serving component: ${errorMessage}`);
          return new Response(
            `// Component error: \${errorMessage}\\nconsole.error('Component error: \${errorMessage}');`,
            {
              status: 500,
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            }
          );
        }
      }

      // Handle index.html requests (root route)
      if (reqPath === "/" || reqPath === "/index.html") {
        logRequestStatus(200, reqPath, "Serving index.html");
        const html = generateIndexHtml(projectPath);

        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }

      // Handle app page routes (only for initial page loads, not client-side navigation)
      if (
        reqPath !== "/" &&
        !reqPath.includes(".") &&
        !reqPath.startsWith("/node_modules") &&
        !reqPath.startsWith("/components") &&
        !reqPath.startsWith("/app/") &&
        !reqPath.startsWith("/0x1") &&
        !reqPath.startsWith("/__0x1")
      ) {
        // Check if this is a client-side navigation request by examining headers
        const userAgent = req.headers.get("User-Agent") || "";
        const accept = req.headers.get("Accept") || "";
        const secFetchMode = req.headers.get("Sec-Fetch-Mode");
        const secFetchDest = req.headers.get("Sec-Fetch-Dest");
        const secFetchSite = req.headers.get("Sec-Fetch-Site");

        // Detect client-side navigation (when user clicks a link)
        const isClientSideNavigation =
          secFetchMode === "navigate" &&
          secFetchDest === "document" &&
          secFetchSite === "same-origin";

        // Only serve HTML for initial page loads (direct URL access, refresh, etc.)
        const isInitialPageLoad = !isClientSideNavigation;

        const possiblePagePaths = [
          join(projectPath, "app", reqPath.slice(1), "page.tsx"),
          join(projectPath, "app", reqPath.slice(1), "page.jsx"),
          join(projectPath, "app", reqPath.slice(1), "page.ts"),
          join(projectPath, "app", reqPath.slice(1), "page.js"),
          join(projectPath, "app", "pages", reqPath.slice(1), "page.tsx"),
          join(projectPath, "app", "pages", reqPath.slice(1), "page.jsx"),
          join(projectPath, "app", "pages", reqPath.slice(1), "page.ts"),
          join(projectPath, "app", "pages", reqPath.slice(1), "page.js"),
        ];

        const pageExists = possiblePagePaths.some((path) => existsSync(path));

        if (pageExists && isInitialPageLoad) {
          // This is a valid page route AND an initial page load - serve the main app HTML
          logRequestStatus(
            200,
            reqPath,
            "Serving app page route (initial load)"
          );
          const html = generateIndexHtml(projectPath);

          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache",
            },
          });
        } else if (pageExists && isClientSideNavigation) {
          // This is client-side navigation - return 204 No Content to let the router handle it
          logRequestStatus(
            204,
            reqPath,
            "Client-side navigation (router handled)"
          );
          return new Response(null, { status: 204 });
        }
      }

      // Try to serve static files from project directories
      for (const dir of ["public", "app", "src", "dist"]) {
        const staticFileResponse = await serveStaticFile(
          req,
          join(projectPath, dir)
        );

        if (staticFileResponse) {
          logRequestStatus(200, reqPath, `Serving from ${dir}`);
          return staticFileResponse;
        }
      }

      // Try to serve static files from framework
      const frameworkStaticResponse = await serveStaticFile(
        req,
        join(frameworkPath, "dist")
      );

      if (frameworkStaticResponse) {
        logRequestStatus(200, reqPath, "Serving from framework");
        return frameworkStaticResponse;
      }

      // Handle Tailwind CSS requests early - comprehensive v4 support
      if (
        reqPath === "/styles.css" ||
        reqPath === "/tailwind-runtime.js" ||
        reqPath === "/processed-tailwind.css" ||
        reqPath === "/tailwindcss" ||
        reqPath === "/app/tailwindcss"
      ) {
        try {
          // First try the v4 handler
          const isV4Available =
            await tailwindV4Handler.isAvailable(projectPath);

          if (isV4Available) {
            // Handle v4 CSS requests
            if (
              reqPath.endsWith(".css") ||
              reqPath === "/processed-tailwind.css"
            ) {
              // Try multiple possible CSS file locations for v4
              const possibleCssPaths = [
                join(projectPath, ".0x1/public/styles.css"),
                join(projectPath, "public/styles.css"),
                join(projectPath, "dist/styles.css"),
                join(projectPath, "app/globals.css"), // Fallback to source
              ];

              for (const cssPath of possibleCssPaths) {
                if (existsSync(cssPath)) {
                  const css = readFileSync(cssPath, "utf-8");
                  logRequestStatus(
                    200,
                    reqPath,
                    `Serving Tailwind CSS v4 from ${cssPath.replace(projectPath, "")}`
                  );
                  return new Response(css, {
                    headers: {
                      "Content-Type": "text/css; charset=utf-8",
                      "Cache-Control": "no-cache",
                    },
                  });
                }
              }

              // If no processed CSS found, serve the source CSS with v4 imports
              const sourceGlobals = join(projectPath, "app/globals.css");
              if (existsSync(sourceGlobals)) {
                const css = readFileSync(sourceGlobals, "utf-8");
                logRequestStatus(
                  200,
                  reqPath,
                  "Serving Tailwind CSS v4 source (unprocessed)"
                );
                return new Response(css, {
                  headers: {
                    "Content-Type": "text/css; charset=utf-8",
                    "Cache-Control": "no-cache",
                  },
                });
              }
            }

            // Handle v4 runtime requests
            if (reqPath === "/tailwindcss" || reqPath === "/app/tailwindcss") {
              logRequestStatus(200, reqPath, "Serving Tailwind CSS v4 runtime");
              return new Response(
                `// 0x1 Framework - Tailwind CSS v4 Runtime
(function() {
  'use strict';
  
  // Dark mode toggle functionality for v4
  function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
  
  // Initialize theme on page load
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }
  
  // Expose to global scope
  window.toggleDarkMode = toggleDarkMode;
  window.initTheme = initTheme;
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
  
  console.log('[0x1] Tailwind CSS v4 runtime loaded');
})();`,
                {
                  headers: {
                    "Content-Type": "application/javascript; charset=utf-8",
                    "Cache-Control": "no-cache",
                  },
                }
              );
            }
          }

          // Fallback to v3 handler
          const { handleTailwindRequest } = await import(
            "./handlers/tailwind-handler"
          );
          const tailwindResponse = await handleTailwindRequest(
            req,
            projectPath
          );
          if (tailwindResponse) {
            logRequestStatus(200, reqPath, "Serving Tailwind CSS v3");
            return tailwindResponse;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Tailwind request error: ${errorMessage}`);
        }

        // Enhanced fallback for missing Tailwind files
        if (reqPath.endsWith(".css")) {
          logRequestStatus(200, reqPath, "Serving Tailwind CSS fallback");
          return new Response(
            `/* 0x1 Framework - Tailwind CSS v4 Fallback */
/* This is a fallback when Tailwind CSS is not properly configured */

/* Reset and base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Essential utility classes */
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.text-center { text-align: center; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.text-red-600 { color: #dc2626; }
.text-red-800 { color: #991b1b; }
.text-yellow-800 { color: #92400e; }
.text-green-800 { color: #166534; }
.bg-red-50 { background-color: #fef2f2; }
.bg-yellow-50 { background-color: #fffbeb; }
.bg-green-50 { background-color: #f0fdf4; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-white { background-color: #ffffff; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.border { border-width: 1px; }
.border-red-400 { border-color: #f87171; }
.border-yellow-400 { border-color: #fbbf24; }
.border-gray-300 { border-color: #d1d5db; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.max-w-6xl { max-width: 72rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .dark\\:bg-gray-800 { background-color: #1f2937; }
  .dark\\:text-white { color: #ffffff; }
}

/* Component error styles */
.component-error {
  padding: 1rem;
  border: 1px solid #f87171;
  background-color: #fef2f2;
  border-radius: 0.5rem;
  color: #991b1b;
}

.component-not-found {
  padding: 1rem;
  border: 1px solid #fbbf24;
  background-color: #fffbeb;
  border-radius: 0.5rem;
  color: #92400e;
}
`,
            {
              headers: {
                "Content-Type": "text/css; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            }
          );
        } else {
          logRequestStatus(200, reqPath, "Serving Tailwind runtime fallback");
          return new Response(
            `// 0x1 Framework - Tailwind Runtime Fallback
console.log('[0x1] Tailwind runtime loaded (fallback)');
window.toggleDarkMode = function() {
  document.documentElement.classList.toggle('dark');
  console.log('[0x1] Dark mode toggled');
};
window.initTheme = function() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
};
// Auto-initialize theme
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initTheme);
} else {
  window.initTheme();
}
`,
            {
              headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "no-cache",
              },
            }
          );
        }
      }

      // Not found
      logRequestStatus(404, reqPath);
      return notFoundHandler(req);
    },
  });

  // Enhanced cleanup for comprehensive process termination
  const cleanup = async () => {
    logger.info("💠 Cleaning up dev server processes...");

    try {
      // Stop Tailwind process
      await stopTailwindProcess();
      logger.debug("💠 Tailwind process stopped");

      // Close all WebSocket connections
      if (clients.size > 0) {
        clients.forEach((client: ServerWebSocket<unknown>) => {
          try {
            client.close();
          } catch (e) {
            // Ignore errors
          }
        });
        clients.clear();
        logger.debug("💠 WebSocket connections closed");
      }

      // Stop file watcher if it exists
      if (watcher) {
        try {
          watcher.close();
          logger.debug("💠 File watcher stopped");
        } catch (e) {
          // Ignore errors
        }
      }

      // Force stop the server
      if (server) {
        try {
          server.stop(true);
          logger.debug("💠 Server stopped");
        } catch (e) {
          // Ignore errors
        }
      }

      logger.debug("💠 Dev server cleanup complete");
    } catch (error) {
      logger.error(`Error during dev server cleanup: ${error}`);
    }
  };

  // Add cleanup to server object for external access
  (server as any).cleanup = cleanup;

  return server;
}

/**
 * Process and validate a TypeScript/JSX file for directive usage
 */
function validateFileDirectives(
  filePath: string,
  sourceCode: string
): {
  hasErrors: boolean;
  errors: Array<{ type: string; message: string; line: number; suggestion: string }>;
  inferredContext?: 'client' | 'server';
  processedCode: string;
} {
  try {
    const result = processDirectives(sourceCode, filePath);
    
    return {
      hasErrors: result.errors.length > 0,
      errors: result.errors,
      inferredContext: result.inferredContext,
      processedCode: result.code
    };
  } catch (error) {
    return {
      hasErrors: true,
      errors: [{
        type: 'processing-error',
        message: `Failed to process directives: ${error instanceof Error ? error.message : String(error)}`,
        line: 1,
        suggestion: 'Check your syntax and directive usage'
      }],
      processedCode: sourceCode
    };
  }
}

/**
 * Generate error boundary JavaScript to display directive validation errors
 */
function generateDirectiveErrorScript(
  filePath: string,
  errors: Array<{ type: string; message: string; line: number; suggestion: string }>
): string {
  const errorData = {
    file: filePath,
    errors: errors,
    timestamp: new Date().toISOString()
  };
  
  return `
// 0x1 Directive Validation Errors
if (typeof window !== 'undefined' && window.__0x1_errorBoundary) {
  const directiveErrors = ${JSON.stringify(errorData, null, 2)};
  
  // Create a comprehensive error for each validation issue
  directiveErrors.errors.forEach((validationError, index) => {
    const error = new Error(\`Directive Validation Error in \${directiveErrors.file}:
    
Line \${validationError.line}: \${validationError.message}

💡 Suggestion: \${validationError.suggestion}

Context: This error was caught by 0x1's automatic directive validation system.\`);
    
    error.name = 'DirectiveValidationError';
    error.stack = \`DirectiveValidationError: \${validationError.message}
    at \${directiveErrors.file}:\${validationError.line}:1
    
Suggestion: \${validationError.suggestion}\`;
    
    // Add to error boundary with file context
    window.__0x1_errorBoundary.addError(error, \`\${directiveErrors.file} (validation)\`);
  });
}
`;
}
