/**
 * Top-level router module for public exports
 * Exposes the main router components and utilities with consistent naming
 */

// Import from the built 0x1-router package
import { Router as RouterClass, useParams, useRouter, useSearchParams } from '../0x1-router/dist/index.js';

// Export navigation components with consistent, explicit naming to prevent name conflicts
export { Link as RouterLink, NavLink as RouterNavLink, Redirect as RouterRedirect } from './core/navigation.js';

// Export factory function for router creation
export function createRouter(options: any) {
  return new RouterClass(options);
}

// Export type definitions with consistent naming
export type { NavigationPage as Page } from './core/navigation.js';

// Re-export router hooks for Next.js-style imports
export { useParams, useRouter, useSearchParams };

