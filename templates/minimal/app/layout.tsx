/**
 * 0x1 Minimal App - Root Layout
 * Using app directory structure with beautiful dark-purple theme
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
export default function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>0x1 Minimal App</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Script to handle initial theme setting */}
        {themeInitScript && <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />}
      </head>
      <body className="h-full flex flex-col bg-gradient-to-br from-white via-violet-50/40 to-purple-100/30 dark:from-gray-950 dark:via-violet-950/40 dark:to-purple-900/20">
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="url(#gradient)" />
                <path d="M13.2 3H9.5l-3.1 9.4h4.2L8.2 21l9.1-11.3h-5.5L13.2 3z" 
                      fill="#fef08a" stroke="#fef08a" strokeWidth="0.3" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#a78bf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-bold text-xl gradient-text">0x1</span>
            </div>
            <ThemeToggle iconOnly />
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          {children}
        </main>
        
        <footer className="border-t border-border/40 bg-card/50 backdrop-blur py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} 0x1 Framework - Built with ⚡ and 💜</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
