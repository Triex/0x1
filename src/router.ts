/**
 * 0x1 Router Export
 * Simplified exports for better developer experience
 * 
 * This file acts as the main entry point for router functionality
 * and centralizes all exports to avoid circular dependencies.
 */

// Import from source files first
import { Router as RouterImpl } from './core/router';
import { Link as LinkImpl, NavLink as NavLinkImpl, Redirect as RedirectImpl, type Page } from './core/navigation';

// Define router-specific types
export interface RouteParams {
  [key: string]: string;
}

// Re-export components with unique names to avoid conflicts
export const Router = RouterImpl;
export const Link = LinkImpl;
export const NavLink = NavLinkImpl;
export const Redirect = RedirectImpl;

// Export Page type
export type { Page };
