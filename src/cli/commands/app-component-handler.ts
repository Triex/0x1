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

// Define and export JSX runtime functions directly
export function jsx(type, props, key) { 
  props = props || {};
  return { type, props, key, children: props.children || [] }; 
}

export function jsxs(type, props, key) { 
  props = props || {};
  return { type, props, key, children: props.children || [] };
}

export const Fragment = Symbol.for('react.fragment');

export function createElement(type, props, ...children) {
  props = props || {};
  return { type, props, children: children.filter(c => c != null) };
}

export const jsxDEV = jsx;

// Export a working component that won't break the application
export default function ${componentType[0].toUpperCase() + componentType.slice(1)}Component(props) {
  return jsx('div', { className: 'auto-generated-component', ...props }, null);
}

// Export any special Next.js or React compatibility functions
export const useRouter = () => ({ push: () => {}, pathname: '/' });
export const useParams = () => ({});
export const useSearchParams = () => new Map();
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
