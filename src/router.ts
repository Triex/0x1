/**
 * 0x1 Router Export
 * Simplified exports for better developer experience
 */

// Define router-specific types
export interface RouteParams {
  [key: string]: string;
}

// Export Router from its source file
export { Router } from './core/router';

// Export navigation components
export { Link, NavLink, Redirect } from './core/navigation';
export type { Page } from './core/navigation';
