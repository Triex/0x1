/**
 * Top-level router module for public exports
 * Exposes the main router components and utilities with consistent naming
 */

// Import router class first to avoid duplicate exports
import { Router as RouterClass } from '0x1-router';

// Export core router components with explicit naming to prevent duplicates
export { Router } from '0x1-router';
export type { RouteParams } from '0x1-router';

// Export navigation components with consistent, explicit naming to prevent name conflicts
export { Link as RouterLink, NavLink as RouterNavLink, Redirect as RouterRedirect } from './core/navigation.js';

// Export factory function for router creation
export function createRouter(options: any) {
  return new RouterClass();
}

// Export type definitions with consistent naming
export type { Page } from './core/navigation.js';

/**
 * Router re-export module for 0x1/router imports
 */
export * from '0x1-router';
