/**
 * 0x1 Full App
 * A complete TypeScript application with all features
 */

import { createElement, Fragment, renderToString } from '0x1';
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
    
    // Find matching route or use not found handler
    const routeHandler = this.routes[path] || this.notFoundHandler;
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
    this.handleRouteChange();
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
      runBtn.addEventListener('click', () => {
        // Disable button during benchmark
        runBtn.setAttribute('disabled', 'true');
        runBtn.classList.add('opacity-50', 'cursor-not-allowed');
        
        progressText.textContent = 'Running benchmark...';
        
        // Simple benchmark
        const ITERATIONS = 1000000;
        let progress = 0;
        
        // Create array of objects to simulate real workload
        const objects = Array.from({ length: 100 }, (_, i) => ({ 
          id: i, 
          name: `Item ${i}`,
          value: Math.random() * 100
        }));
        
        // Start benchmark
        const startTime = performance.now();
        
        // Do work in chunks to keep UI responsive
        const chunk = Math.floor(ITERATIONS / 20); // 5% chunks
        let i = 0;
        
        const processChunk = () => {
          const end = Math.min(i + chunk, ITERATIONS);
          
          // Do some work
          for (; i < end; i++) {
            // Simulate data processing
            const index = i % objects.length;
            objects[index].value = Math.sqrt(objects[index].value) * Math.log(i + 1);
          }
          
          // Update progress
          progress = (i / ITERATIONS) * 100;
          progressBar.style.width = `${progress}%`;
          progressText.textContent = `Processing... ${Math.floor(progress)}%`;
          
          if (i < ITERATIONS) {
            // Process next chunk
            setTimeout(processChunk, 20);
          } else {
            // Finish
            const endTime = performance.now();
            const elapsed = ((endTime - startTime) / 1000).toFixed(2);
            
            progressText.textContent = `Completed in ${elapsed}s`;
            
            // Re-enable button
            setTimeout(() => {
              runBtn.removeAttribute('disabled');
              runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }, 1000);
          }
        };
        
        // Start processing chunks
        setTimeout(() => {
          processChunk();
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
          <div class="py-12 text-center">
            <h1 class="text-6xl font-bold mb-4">404</h1>
            <h2 class="text-2xl mb-6">Page Not Found</h2>
            <a href="/" class="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded transition-colors">
              Go Home
            </a>
          </div>
        `;
      });
      
    // Start router
    router.start();
  }
});
