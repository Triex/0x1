/**
 * Component Registry
 * Automatic discovery of Next.js 15 app directory components
 * 
 * This module simulates Next.js 15's automatic component discovery by importing
 * all components in the app directory and providing them to the router.
 */

// Import all page components
import RootLayout from '../app/layout';
import HomePage from '../app/page';
import FeaturesPage from '../app/features/page';
import AboutPage from '../app/about/page';
import ContactPage from '../app/contact/page';
import DashboardPage from '../app/dashboard/page';
import NotFoundPage from '../app/not-found';

// Type for a Next.js 15 component
type Component = (props?: any) => HTMLElement | DocumentFragment | Node | null | void;

/**
 * Get all components in the app directory
 * In a real implementation, this would be done automatically through
 * file system scanning or build-time code generation
 */
export function getAppComponents(): Record<string, { default: Component }> {
  return {
    'app/layout': { default: RootLayout },
    'app/page': { default: HomePage },
    'app/features/page': { default: FeaturesPage },
    'app/about/page': { default: AboutPage },
    'app/contact/page': { default: ContactPage },
    'app/dashboard/page': { default: DashboardPage },
    'app/not-found': { default: NotFoundPage }
  };
}

/**
 * In a more advanced implementation, this function would be called at build time
 * to automatically discover and register all components in the app directory.
 * 
 * For now, we're using the manual mapping above for simplicity.
 */
