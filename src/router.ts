/**
 * Top-level router module for public exports
 * Exposes the main router components and utilities with consistent naming
 */

// Export core router components with explicit naming to prevent duplicates
export { Router } from './core/router.js';

// Export navigation components with consistent, explicit naming
export { Link as RouterLink } from './core/navigation.js';
export { NavLink as RouterNavLink } from './core/navigation.js';
export { Redirect as RouterRedirect } from './core/navigation.js';

// Import Router class to use in factory function
import { Router as RouterClass } from './core/router.js';

// Export factory function for router creation
export function createRouter(options: any) {
  return new RouterClass(options);
}

// Export type definitions with consistent naming
export type { RouteParams } from './core/router.js';
export type { Page } from './core/navigation.js';
