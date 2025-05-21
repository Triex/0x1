/**
 * 0x1 Minimal App - Root Layout
 * Using app directory structure
 */

// These JSX runtime imports are automatically handled by the build process
// @ts-ignore - These imports are resolved at build time
import { jsx, jsxs, Fragment, createElement } from '0x1/jsx-runtime';

// Import styles
import './globals.css';

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>0x1 Minimal App</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-200">
        <header className="bg-white dark:bg-gray-800 shadow py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">0x1 Framework</h1>
            <button 
              id="theme-toggle" 
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              aria-label="Toggle dark mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
        
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} 0x1 Framework
          </div>
        </footer>
      </body>
    </html>
  );
}
