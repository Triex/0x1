/**
 * 0x1 Minimal App - Root Layout
 * Using app directory structure with modern Tailwind v4 dark mode
 */
import { ThemeToggle } from "../components/ThemeToggle";
import "./globals.css";

// Ensure our code is compatible with client-side execution
let themeInitScript = '';

// Only execute this code on the client side
if (typeof window !== 'undefined') {
  themeInitScript = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('0x1-dark-mode');
        if (savedTheme) {
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        console.error('Error setting initial theme:', e);
      }
    })();
  `;
}

// Export RootLayout as a named export and default export for maximum compatibility
export function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>0x1 Minimal App</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Script to handle initial theme setting */}
        {themeInitScript && <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />}
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-200 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">0x1 Framework</h1>
            <ThemeToggle iconOnly={true} />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6 flex-grow">
          {children}
        </main>
        
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} 0x1 Framework
          </div>
        </footer>
      </body>
    </html>
  );
}

// Explicitly export as default to ensure compatibility with different import styles
export default RootLayout;
