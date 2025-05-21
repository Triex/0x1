/**
 * Top-level router module for public exports
 * Exposes the main router components and utilities
 */

// Export core components with appropriate naming
export { Link } from './core/navigation.js';
export { Router } from './core/router.js';

// Named exports to avoid collision
export { NavLink as RouterNavLink } from './core/navigation.js';
export { Redirect as RouterRedirect } from './core/navigation.js';

// Export type definitions
export type { RouteParams } from './core/router.js';
export type { Page } from './core/navigation.js';
