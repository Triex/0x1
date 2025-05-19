/**
 * 0x1 Standard App - Entry Point
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
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storageKey = '0x1-dark-mode';
  
  // Check for saved preference
  const savedTheme = localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial dark mode state based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  }
  
  // Set up toggle button if it exists
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      // Toggle dark class on html element
      const isDark = document.documentElement.classList.toggle('dark');
      
      // Save user preference
      localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
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
  
  // Initialize theme handling
  initializeTheme();
  
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
          <p class="text-xl mb-8">The standard template with enhanced features</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white shadow-md rounded-lg p-6">
              <h2 class="text-xl font-bold mb-2 text-indigo-600">Fast Development</h2>
              <p class="text-gray-600">Built on Bun for lightning-fast builds and hot reloading</p>
            </div>
            <div class="bg-white shadow-md rounded-lg p-6">
              <h2 class="text-xl font-bold mb-2 text-indigo-600">Modern Stack</h2>
              <p class="text-gray-600">TypeScript, Tailwind CSS, and modular architecture</p>
            </div>
            <div class="bg-white shadow-md rounded-lg p-6">
              <h2 class="text-xl font-bold mb-2 text-indigo-600">Lightweight</h2>
              <p class="text-gray-600">Zero dependencies for the core framework</p>
            </div>
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
  
  console.log('0x1 Standard App started with app directory structure!');
});
