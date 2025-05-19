/**
 * 0x1 Full App - Entry Point
 * Using automatic app directory structure
 */
import { Router } from '0x1/router';

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme manager
function initializeTheme(): void {
  const storageKey = '0x1-dark-mode';
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial dark mode state based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  }
  
  // Set up toggle button
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      // Toggle dark class on html element
      const isDark = document.documentElement.classList.toggle('dark');
      
      // Save user preference
      localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
    });
  }
}

// Initialize mobile menu functionality
function initializeMobileMenu(): void {
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isVisible = mobileMenu.classList.contains('flex');
      
      if (isVisible) {
        mobileMenu.classList.replace('flex', 'hidden');
      } else {
        mobileMenu.classList.replace('hidden', 'flex');
      }
    });
  }
}

// Initialize navigation events for client-side routing
function initializeNavigation(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Check if the click was on a link
    if (target.tagName === 'A' || target.closest('a')) {
      const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a') as HTMLAnchorElement;
      const href = link.getAttribute('href');
      
      // Only handle internal links
      if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#')) {
        e.preventDefault();
        window.history.pushState(null, '', href);
        // Trigger route change
        window.dispatchEvent(new Event('popstate'));
      }
    }
  });
}

// Bootstrap the application when DOM is loaded
ready(() => {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('App container not found. Add a div with id="app" to your HTML.');
    return;
  }
  
  // Initialize UI theme handling
  initializeTheme();
  
  // Initialize mobile menu
  initializeMobileMenu();
  
  // Initialize navigation events
  initializeNavigation();
  
  // Initialize the router
  const router = new Router({
    root: appContainer,
    mode: 'history',
    transitionDuration: 150
  });
  
  // Create a simple home page component
  const HomePage = {
    render: () => {
      const element = document.createElement('div');
      element.className = 'p-8 max-w-4xl mx-auto';
      element.innerHTML = `
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-6 text-indigo-600">Welcome to 0x1</h1>
          <p class="text-xl mb-8">The full-featured template for modern web apps</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white shadow-md rounded-lg p-6">
              <h2 class="text-xl font-bold mb-2 text-indigo-600">Performance</h2>
              <p class="text-gray-600">Built on Bun for lightning-fast builds and optimal runtime performance</p>
            </div>
            <div class="bg-white shadow-md rounded-lg p-6">
              <h2 class="text-xl font-bold mb-2 text-indigo-600">Full Stack</h2>
              <p class="text-gray-600">TypeScript, Tailwind CSS, and state management included</p>
            </div>
            <div class="bg-white shadow-md rounded-lg p-6">
              <h2 class="text-xl font-bold mb-2 text-indigo-600">PWA Support</h2>
              <p class="text-gray-600">Progressive Web App capabilities built-in</p>
            </div>
          </div>
          
          <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4 text-indigo-600">Features</h2>
            <ul class="list-disc list-inside text-left max-w-md mx-auto">
              <li class="mb-2">Client-side routing with history support</li>
              <li class="mb-2">Component-based architecture</li>
              <li class="mb-2">Built-in state management</li>
              <li class="mb-2">Responsive design with Tailwind CSS</li>
              <li class="mb-2">Dark mode support</li>
              <li class="mb-2">PWA capabilities</li>
            </ul>
          </div>
          
          <p class="text-gray-700 mb-4">Edit <code class="bg-gray-100 px-1 py-0.5 rounded">index.tsx</code> to customize this page</p>
          <div class="flex justify-center gap-4">
            <a href="https://github.com/Triex/0x1" target="_blank" class="text-indigo-600 hover:underline">GitHub</a>
            <a href="https://bun.sh" target="_blank" class="text-indigo-600 hover:underline">Bun Docs</a>
          </div>
        </div>
      `;
      return element;
    }
  };
  
  // Add routes
  router.addRoute('/', HomePage);
  
  // Trigger initial route
  router.navigate(window.location.pathname);
  
  console.log('0x1 Full App started with app directory structure!');
});
