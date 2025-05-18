/**
 * 0x1 Full App
 * A complete JavaScript application with all features
 */

import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { Toaster } from './components/Toaster.js';
import { Router } from './lib/router.js';
import { About } from './pages/about.js';
import { Features } from './pages/features.js';
import { Home } from './pages/home.js';
import { NotFound } from './pages/not-found.js';
import { createStore } from './store/index.js';

// Initialize global state
const store = createStore();

// DOM ready function
function ready(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme initialization
function initializeTheme() {
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemDarkMode)) {
    document.documentElement.classList.add('dark');
    store.state.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    store.state.theme = 'light';
  }
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        store.state.theme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        store.state.theme = 'light';
      }
    }
  });
}

// Initialize the app
ready(() => {
  const appRoot = document.getElementById('app');
  
  if (!appRoot) {
    console.error('App root element not found');
    return;
  }
  
  // Initialize theme
  initializeTheme();
  
  // Create layout container
  const container = document.createElement('div');
  container.className = 'flex flex-col min-h-screen';
  appRoot.appendChild(container);
  
  // Add header
  const header = Header({ store });
  container.appendChild(header);
  
  // Create main content area
  const main = document.createElement('main');
  main.className = 'flex-1 container mx-auto px-4 py-8';
  container.appendChild(main);
  
  // Add footer
  const footer = Footer();
  container.appendChild(footer);
  
  // Add toast notification container
  const toaster = Toaster();
  container.appendChild(toaster);
  
  // Add theme toggle (fixed position)
  const themeToggle = ThemeToggle({ store });
  container.appendChild(themeToggle);
  
  // Create router with main content area as the root
  const router = new Router(main);
  
  // Define routes
  router.addRoute('/', Home);
  router.addRoute('/about', About);
  router.addRoute('/features', Features);
  router.addRoute('/products/:id', (params) => {
    const productId = params?.id || '';
    return import('./pages/product.js').then(module => {
      return module.Product(productId);
    });
  });
  router.setNotFound(NotFound);
  
  // Store router instance in global store for navigation
  store.router = router;
  
  // Initialize router
  router.init();
});
