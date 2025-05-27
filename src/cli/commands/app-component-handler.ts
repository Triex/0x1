/**
 * App Component Handler for 0x1 Development Server
 * Provides special handling for app router components when transpilation fails
 */

import { logger } from "../utils/logger.js";
import { existsSync } from "fs";
import Bun from "bun";

/**
 * Generate a stub component for app router special components
 * This is used when transpilation fails to ensure the app can still run
 */
export function generateStubComponent(componentType: string): string {
  return `// 0x1 Framework - Stub component for ${componentType}

// Import from our custom JSX runtime
import { jsx, jsxs, Fragment, createElement, jsxDEV } from '0x1/jsx-runtime';

// Export these functions for compatibility
export { jsx, jsxs, Fragment, createElement, jsxDEV };

// Create a proper HTML element that can be rendered
function createHtmlElement(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  
  // Apply props to the element
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.toLowerCase().substring(2);
      element.addEventListener(eventName, value);
    } else if (key !== 'children') {
      element.setAttribute(key, value);
    }
  }
  
  // Add children
  for (const child of children) {
    if (child) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }
  }
  
  return element;
}

// Export default component that works with both React and DOM rendering
export default function ${componentType[0].toUpperCase() + componentType.slice(1)}Component(props) {
  // Determine if we're in browser or server environment
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    // For browser rendering, return an actual HTML element
    return createHtmlElement('div', {
      className: 'auto-generated-${componentType}-component 0x1-stub-component',
      style: {
        padding: '20px',
        margin: '10px',
        border: '1px dashed #ccc',
        borderRadius: '4px'
      }
    }, 'Auto-generated ${componentType} component');
  } else {
    // For React-style JSX rendering
    return jsx('div', { 
      className: 'auto-generated-${componentType}-component 0x1-stub-component',
      style: {
        padding: '20px',
        margin: '10px',
        border: '1px dashed #ccc',
        borderRadius: '4px'
      },
      children: 'Auto-generated ${componentType} component'
    });
  }
}

// Export special React/Next.js compatibility functions
export function useRouter() { return { push: () => {}, pathname: '/' }; }
export function useParams() { return {}; }
export function useSearchParams() { return new Map(); }
`;
}

/**
 * Handles requests for app router components
 * Returns a stub component when transpilation fails
 */
export function handleAppComponent(request: Request): Response | null {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only handle app router special components
  if (!path.startsWith('/app/') ||
      !(path.endsWith('/page.js') || 
        path.endsWith('/layout.js') || 
        path.endsWith('/not-found.js') || 
        path.endsWith('/error.js'))) {
    return null;
  }

  // Extract component type from path
  const componentType = path.split('/').pop()?.split('.')[0] || 'page';
  logger.debug(`App component handler for: ${path} (${componentType})`);

  // Generate a stub component
  const stubComponent = generateStubComponent(componentType);
  
  // Return the stub component as JavaScript
  logger.info(`🚀 Serving stub component for ${path}`);
  return new Response(stubComponent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
