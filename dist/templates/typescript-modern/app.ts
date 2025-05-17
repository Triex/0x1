/**
 * 0x1 TypeScript App Entry Point
 */

import { mount, Router } from 'bundl';
import { AboutPage } from './pages/about';
import { HomePage } from './pages/home';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  // You can choose between router-based or simple component mounting
  if (window.location.pathname === '/router-demo') {
    // Router-based app
    initializeRouter(rootElement);
  } else {
    // Simple component mounting
    mount(HomePage(), rootElement);
  }
});

/**
 * Initialize the router with routes
 */
function initializeRouter(rootElement: HTMLElement): void {
  // Create a router instance
  const router = new Router({
    root: rootElement,
    mode: 'history',
    transitionDuration: 300
  });
  
  // Add routes
  router.addRoute('/', HomePage);
  router.addRoute('/about', AboutPage);
  
  // Initialize the router
  router.init();
  
  // Store router instance globally for debugging and programmatic navigation
  (window as any).__BUNDL_ROUTER__ = router;
}
