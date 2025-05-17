/**
 * 0x1 Standard App
 * A complete TypeScript application with component system and routing
 */

import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Router } from './lib/router';
import { About } from './pages/about';
import { Home } from './pages/home';
import { NotFound } from './pages/not-found';

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Initialize the app
ready(() => {
  const appRoot = document.getElementById('app');
  
  if (!appRoot) {
    console.error('App root element not found');
    return;
  }
  
  // Create layout container
  const container = document.createElement('div');
  container.className = 'flex flex-col min-h-screen';
  appRoot.appendChild(container);
  
  // Add header
  const header = Header();
  container.appendChild(header);
  
  // Create main content area
  const main = document.createElement('main');
  main.className = 'flex-1 container mx-auto px-4 py-8';
  container.appendChild(main);
  
  // Add footer
  const footer = Footer();
  container.appendChild(footer);
  
  // Create router with main content area as the root
  const router = new Router(main);
  
  // Define routes
  router.addRoute('/', Home);
  router.addRoute('/about', About);
  router.setNotFound(NotFound);
  
  // Initialize router
  router.init();
});
