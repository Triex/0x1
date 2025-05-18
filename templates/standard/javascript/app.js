/**
 * 0x1 Standard App
 * A complete JavaScript application with component system and routing
 */

import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { Router } from './lib/router.js';
import { About } from './pages/about.js';
import { Home } from './pages/home.js';
import { NotFound } from './pages/not-found.js';

// DOM ready function
function ready(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme initialization function
function initTheme() {
  console.log('Initializing theme system...');
  
  // Check for stored theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  console.log(`Theme debug - Saved theme: ${savedTheme}, System prefers dark: ${prefersDark}`);
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    console.log('Theme set to dark mode');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    console.log('Theme set to light mode');
  }
  
  // Set up listener for theme media query changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      console.log(`System theme preference changed: ${e.matches ? 'dark' : 'light'}`);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });
}

// Initialize the app
ready(() => {
  console.log('DOM is ready, initializing app...');
  
  // Initialize theme
  initTheme();
  
  // Get app root element
  let appRoot = document.getElementById('app');
  console.log('App root element:', appRoot);
  
  if (!appRoot) {
    console.error('App root element not found - creating one');
    // Create a new app root if it doesn't exist
    const newAppRoot = document.createElement('div');
    newAppRoot.id = 'app';
    document.body.appendChild(newAppRoot);
    // Update the reference
    appRoot = newAppRoot;
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
