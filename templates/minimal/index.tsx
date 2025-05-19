/**
 * 0x1 Minimal App - Entry Point
 * Using automatic app directory structure
 */
// Router is available as a global from the script included in index.html
declare const Router: any;
declare const Link: any;
declare const NavLink: any;
declare const Redirect: any;

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Theme manager - simple implementation
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

// Bootstrap the application when DOM is loaded
ready(() => {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('App container not found. Add a div with id="app" to your HTML.');
    return;
  }
  
  // Initialize theme handling
  initializeTheme();
  
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
          <p class="text-xl mb-8">The lightning-fast web framework powered by Bun</p>
          
          <div class="bg-white shadow-md rounded-lg p-6 mb-8">
            <div class="flex items-center justify-center gap-4 mb-4">
              <button id="decrement-btn" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">-</button>
              <span id="counter-value" class="text-2xl font-bold">0</span>
              <button id="increment-btn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">+</button>
            </div>
            <p class="text-gray-600">Try out this interactive counter component!</p>
          </div>
          
          <p class="text-gray-700 mb-4">Edit <code class="bg-gray-100 px-1 py-0.5 rounded">index.tsx</code> to customize this page</p>
          <div class="flex justify-center gap-4">
            <a href="https://github.com/Triex/0x1" target="_blank" class="text-indigo-600 hover:underline">GitHub</a>
            <a href="https://bun.sh" target="_blank" class="text-indigo-600 hover:underline">Bun Docs</a>
          </div>
        </div>
      `;
      
      // Initialize counter functionality
      let count = 0;
      const updateCounter = () => {
        const counterValue = element.querySelector('#counter-value');
        if (counterValue) counterValue.textContent = count.toString();
      };
      
      // Add event listeners after the element is mounted
      setTimeout(() => {
        const incrementBtn = element.querySelector('#increment-btn');
        const decrementBtn = element.querySelector('#decrement-btn');
        
        if (incrementBtn) {
          incrementBtn.addEventListener('click', () => {
            count++;
            updateCounter();
          });
        }
        
        if (decrementBtn) {
          decrementBtn.addEventListener('click', () => {
            count--;
            updateCounter();
          });
        }
      }, 0);
      return element;
    }
  };
  
  // Add routes
  router.addRoute('/', HomePage);
  
  // Trigger initial route
  router.navigate(window.location.pathname);
  
  console.log('0x1 Minimal App started!');
});
