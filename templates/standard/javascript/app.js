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
  // Check for stored theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

// Initialize the app
ready(() => {
  // Initialize theme
  initTheme();
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
