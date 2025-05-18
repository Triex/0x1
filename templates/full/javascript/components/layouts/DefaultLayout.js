/**
 * Default layout component for 0x1 applications
 */
import { html } from '0x1';
import { useTheme } from '../../lib/theme';

export function DefaultLayout({ title, description, content }) {
  const { theme, toggleTheme } = useTheme();
  
  return html`
    <!DOCTYPE html>
    <html lang="en" class="${theme === 'dark' ? 'dark' : ''}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} - 0x1 App</title>
        <link rel="stylesheet" href="/styles/main.css" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="description" content="${description || 'A 0x1 framework application'}" />
        <script type="module" src="/app.js"></script>
        <!-- PWA support -->
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body class="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-150">
        <header class="border-b border-gray-200 dark:border-gray-800">
          <div class="container mx-auto px-4 py-4">
            <nav class="flex items-center justify-between">
              <div class="flex items-center space-x-1">
                <a href="/" class="text-2xl font-bold">0x1 App</a>
              </div>
              
              <div class="hidden md:flex items-center space-x-8">
                <a href="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</a>
                <a href="/features" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
                <a href="/about" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</a>
                <a href="/contact" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
              </div>
              
              <div class="flex items-center space-x-4">
                <button id="theme-toggle" aria-label="Toggle theme" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path id="moon-icon" class="${theme === 'dark' ? 'hidden' : ''}" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    <circle id="sun-icon" class="${theme === 'dark' ? '' : 'hidden'}" cx="12" cy="12" r="5"></circle>
                    <line id="sun-line-1" class="${theme === 'dark' ? '' : 'hidden'}" x1="12" y1="1" x2="12" y2="3"></line>
                    <line id="sun-line-2" class="${theme === 'dark' ? '' : 'hidden'}" x1="12" y1="21" x2="12" y2="23"></line>
                    <line id="sun-line-3" class="${theme === 'dark' ? '' : 'hidden'}" x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line id="sun-line-4" class="${theme === 'dark' ? '' : 'hidden'}" x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line id="sun-line-5" class="${theme === 'dark' ? '' : 'hidden'}" x1="1" y1="12" x2="3" y2="12"></line>
                    <line id="sun-line-6" class="${theme === 'dark' ? '' : 'hidden'}" x1="21" y1="12" x2="23" y2="12"></line>
                    <line id="sun-line-7" class="${theme === 'dark' ? '' : 'hidden'}" x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line id="sun-line-8" class="${theme === 'dark' ? '' : 'hidden'}" x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </button>
                
                <button id="mobile-menu-toggle" class="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
              </div>
            </nav>
          </div>
          
          <div id="mobile-menu" class="hidden md:hidden">
            <div class="container mx-auto px-4 py-4 border-t border-gray-200 dark:border-gray-800">
              <div class="flex flex-col space-y-4">
                <a href="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</a>
                <a href="/features" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
                <a href="/about" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</a>
                <a href="/contact" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </header>
        
        <main class="container mx-auto px-4 py-8">
          ${content}
        </main>
        
        <footer class="border-t border-gray-200 dark:border-gray-800 mt-16">
          <div class="container mx-auto px-4 py-8">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <div class="mb-4 md:mb-0">
                <p>&copy; ${new Date().getFullYear()} 0x1 App. All rights reserved.</p>
                <p class="text-sm text-gray-500">Built with 0x1 Framework</p>
              </div>
              
              <div class="flex space-x-8">
                <a href="/" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Home</a>
                <a href="/about" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</a>
                <a href="/privacy" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
                <a href="/terms" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </footer>
        
        <script>
          // Theme toggle functionality
          document.getElementById('theme-toggle').addEventListener('click', function() {
            const event = new CustomEvent('theme-toggle');
            window.dispatchEvent(event);
          });
          
          // Mobile menu toggle
          document.getElementById('mobile-menu-toggle').addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
          });
        </script>
      </body>
    </html>
  `;
}
