/**
 * 0x1 Minimal App - Entry Point
 * Using automatic app directory structure
 */
// Import createElement and Fragment for JSX support
import { createElement, Fragment } from '0x1';

// Router is available as a global from the script included in index.html
declare const Router: any;
declare const Link: any;
declare const NavLink: any;
declare const Redirect: any;

// Import components
import { Counter } from './components/Counter.js';
import { Header } from './components/Header.js'; // Note: .js extension for browser compatibility

// DOM ready function
function ready(callback: () => void): void {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// Initialize theme from local storage
function initializeTheme(): void {
  // Check for saved theme preference in localStorage
  const savedTheme = localStorage.getItem('0x1-dark-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // If user has explicitly chosen a theme, use it; otherwise, respect OS preference
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Note: Theme toggle functionality is now handled in the Header component

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
  
  // Create home page component using proper component architecture
  
  // Create a home page component using proper component architecture and JSX
  const HomePage = {
    render: () => {
      // Using JSX syntax with the createElement and Fragment imported from 0x1
      const jsxElement = (
        <div className="flex flex-col min-h-screen">
          {/* Include the header with logo and theme toggle */}
          <Header />
          
          {/* Main content area */}
          <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
              {/* Hero section */}
              <div className="mb-12 text-center">
                <h1 className="text-5xl font-bold mb-6 text-indigo-600 dark:text-indigo-400 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
                  Welcome to 0x1
                </h1>
                
                <p className="text-xl text-gray-800 dark:text-gray-200">
                  The lightning-fast web framework powered by Bun
                </p>
              </div>
              
              {/* Features showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Blazingly Fast</h2>
                  <p className="text-gray-700 dark:text-gray-300">Built on top of Bun, 0x1 delivers exceptional performance with minimal overhead.</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">TypeScript First</h2>
                  <p className="text-gray-700 dark:text-gray-300">Enjoy full TypeScript support right out of the box with no additional configuration required.</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Modern Styling</h2>
                  <p className="text-gray-700 dark:text-gray-300">Integrated with Tailwind CSS v4 for a powerful, utility-first styling experience.</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">JSX Support</h2>
                  <p className="text-gray-700 dark:text-gray-300">Write components using familiar JSX syntax without the overhead of React.</p>
                </div>
              </div>
              
              {/* Counter demo */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 mb-12 text-center border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Interactive Components</h2>
                <Counter 
                  initialValue={0}
                  minValue={-10}
                  maxValue={10}
                  label="Try out this interactive counter component!"
                />
                
                <p className="mt-6 text-gray-700 dark:text-gray-300">
                  Edit <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-800 dark:text-gray-200">
                    index.tsx
                  </code> to customize this page
                </p>
              </div>
              
              {/* CTA section */}
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ready to get started?</h2>
                <div className="flex justify-center gap-4 mt-6">
                  <a 
                    href="https://github.com/Triex/0x1" 
                    target="_blank" 
                    className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Documentation
                  </a>
                  <a 
                    href="https://bun.sh" 
                    target="_blank" 
                    className="inline-flex items-center px-5 py-2.5 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-gray-600 rounded-md transition"
                  >
                    Bun Docs
                  </a>
                </div>
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© {new Date().getFullYear()} 0x1 Framework. Built with <span className="text-red-500">♥</span> using Bun.</p>
            </div>
          </footer>
        </div>
      );
      
      return jsxElement;
    }
  };
  
  // Add routes
  router.addRoute('/', HomePage);
  
  // Trigger initial route
  router.navigate(window.location.pathname);
  
  console.log('0x1 Minimal App started!');
});
