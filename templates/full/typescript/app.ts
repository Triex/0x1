/**
 * 0x1 Full App
 * A complete TypeScript application with all features
 */

import { useTheme } from './lib/theme';
import { counterStore, decrementCounter, incrementCounter } from './store/counter';

// Import pages
import renderAboutPage from './pages/about';
import renderContactPage from './pages/contact';
import renderFeaturesPage from './pages/features';
import renderHomePage from './pages/index';

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Simple router implementation
class Router {
  private routes: Record<string, () => void> = {};
  private notFoundHandler: () => void = () => {};
  private currentPath: string = '';

  constructor() {
    // Handle navigation events
    window.addEventListener('popstate', () => this.handleRouteChange());
    document.addEventListener('click', (e) => {
      // Handle link clicks for client-side routing
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.getAttribute('href')?.startsWith('/') && !link.getAttribute('target')) {
        e.preventDefault();
        const href = link.getAttribute('href') as string;
        this.navigate(href);
      }
    });
  }

  add(path: string, handler: () => void): Router {
    this.routes[path] = handler;
    return this;
  }

  notFound(handler: () => void): Router {
    this.notFoundHandler = handler;
    return this;
  }

  navigate(path: string): void {
    window.history.pushState(null, '', path);
    this.handleRouteChange();
  }

  handleRouteChange(): void {
    const path = window.location.pathname;
    this.currentPath = path;
    
    // Debug logging
    console.log(`Router handling path: ${path}`);
    console.log('Available routes:', Object.keys(this.routes));
    
    // Find matching route or use not found handler
    const routeHandler = this.routes[path] || this.notFoundHandler;
    
    if (!routeHandler) {
      console.error(`No handler found for path: ${path}`);
      return;
    }
    
    console.log(`Executing handler for path: ${path}`);
    routeHandler();
    
    // Update active link in nav
    this.updateActiveLinks();
  }

  updateActiveLinks(): void {
    // Remove active class from all links
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.remove('text-primary-600', 'dark:text-primary-400');
      if (link.getAttribute('href') === this.currentPath) {
        link.classList.add('text-primary-600', 'dark:text-primary-400');
      }
    });
    
    // Also update mobile menu links
    document.querySelectorAll('#mobile-menu a').forEach(link => {
      link.classList.remove('text-primary-600', 'dark:text-primary-400');
      if (link.getAttribute('href') === this.currentPath) {
        link.classList.add('text-primary-600', 'dark:text-primary-400');
      }
    });
  }

  start(): void {
    console.log('Starting router...');
    // Force it to handle the initial route
    this.handleRouteChange();
    
    // Special case - if we're at / but it didn't work, try to navigate there explicitly
    if (window.location.pathname === '/' && !document.getElementById('main-content')?.innerHTML) {
      console.log('Forcing navigation to homepage');
      this.navigate('/');
    }
  }
}

// Initialize the app
ready(() => {
  // Initialize theme system when the app starts
  const { theme, toggleTheme } = useTheme();
  
  // Initialize counter listeners
  window.addEventListener('counter-increment', () => incrementCounter());
  window.addEventListener('counter-decrement', () => decrementCounter());
  
  // Set up theme toggle event handler
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    // Log that button was clicked for debugging
    console.log('Theme toggle button clicked');
    // Directly call toggleTheme instead of dispatching an event
    toggleTheme();
  });
  
  // Set up mobile menu toggle
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.toggle('hidden');
    }
  });
  
  // Initialize the counter demo if present on page
  const initializeCounterDemo = () => {
    const counterValue = document.getElementById('counter-value');
    const incrementBtn = document.getElementById('increment-btn');
    const decrementBtn = document.getElementById('decrement-btn');
    
    if (counterValue && incrementBtn && decrementBtn) {
      // Subscribe to counter updates
      const unsubscribe = counterStore.subscribe((state) => {
        counterValue.textContent = state.count.toString();
      });
      
      // Set initial value
      counterValue.textContent = counterStore.getState().count.toString();
      
      // Add click handlers
      incrementBtn.addEventListener('click', incrementCounter);
      decrementBtn.addEventListener('click', decrementCounter);
      
      // Store unsubscribe function for cleanup
      if (typeof window['__0x1_cleanup'] === 'undefined') {
        window['__0x1_cleanup'] = [];
      }
      window['__0x1_cleanup'].push(unsubscribe);
    }
  };
  
  // Initialize performance demo if present
  const initializePerformanceDemo = () => {
    const runBtn = document.getElementById('run-benchmark-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (runBtn && progressBar && progressText) {
      runBtn.addEventListener('click', function() {
        // Disable button during benchmark
        runBtn.setAttribute('disabled', 'true');
        runBtn.textContent = 'Running...';
        
        // Reset progress
        progressBar.style.width = '0%';
        progressText.textContent = '0ms';
        
        const startTime = performance.now();
        let progress = 0;
        
        // Simulate a benchmark with increasing progress
        const interval = setInterval(() => {
          progress += 2;
          
          if (progress <= 100) {
            progressBar.style.width = `${progress}%`;
            const elapsed = Math.round(performance.now() - startTime);
            progressText.textContent = `${elapsed}ms`;
          } else {
            clearInterval(interval);
            const finalTime = Math.round(performance.now() - startTime);
            progressText.textContent = `Complete in ${finalTime}ms`;
            
            // Re-enable button
            runBtn.removeAttribute('disabled');
            runBtn.textContent = 'Run Performance Demo';
          }
        }, 20);
      });
    }
  };
  
  // Initialize form submit handler for contact form
  const initializeContactForm = () => {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');
    
    if (form && successMessage) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // In a real app, this would send the data to a server
        // For demo purposes, we'll just show a success message
        form.style.display = 'none';
        successMessage.classList.remove('hidden');
      });
    }
  };
  
  // Initialize router and set up routes
  const router = new Router();
  const contentContainer = document.getElementById('main-content');
  
  if (contentContainer) {
    // Define routes
    router
      .add('/', () => {
        document.title = '0x1 - Home';
        contentContainer.innerHTML = renderHomePage();
        initializeCounterDemo();
      })
      .add('/features', () => {
        document.title = '0x1 - Features';
        contentContainer.innerHTML = renderFeaturesPage();
        initializePerformanceDemo();
      })
      .add('/about', () => {
        document.title = '0x1 - About';
        contentContainer.innerHTML = renderAboutPage();
      })
      .add('/contact', () => {
        document.title = '0x1 - Contact';
        contentContainer.innerHTML = renderContactPage();
        initializeContactForm();
      })
      .notFound(() => {
        document.title = '0x1 - Page Not Found';
        contentContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
            <h2 class="mt-4 text-2xl font-semibold text-gray-800 dark:text-white">Page Not Found</h2>
            <p class="mt-2 text-gray-600 dark:text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
            <a href="/" class="mt-6 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors">
              Back to Home
            </a>
          </div>
        `;
      });
      
    // Start the router
    router.start();
  }
  
  // Register service worker for PWA support if available
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
});
