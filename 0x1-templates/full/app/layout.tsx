/**
 * 0x1 Full App - Root Layout
 * Using app directory structure with beautiful light & dark theme
 */
import { Header } from "../components/Header";
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

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>0x1 Full App</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="description" content="0x1 Full-Featured Application with Beautiful Design" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Script to handle initial theme setting */}
        {themeInitScript && <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />}
      </head>
      <body className="h-full flex flex-col">
        <div id="app" className="min-h-screen flex flex-col">
          <Header />

          <main className="flex-grow">
            {children}
          </main>

          <footer className="border-t border-border/40 glass-panel py-8 mt-auto">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" fill="url(#footerGradient)" />
                      <path d="M13.2 3H9.5l-3.1 9.4h4.2L8.2 21l9.1-11.3h-5.5L13.2 3z"
                        fill="#fef08a" stroke="#fef08a" strokeWidth="0.3" strokeLinejoin="round" />
                      <defs>
                        <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#a78bf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="font-bold gradient-text">0x1 Framework</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Built with ⚡ and 💜</p>
                </div>
                <div className="flex space-x-4">
                  <a href="https://github.com/Triex/0x1" className="text-muted-foreground hover:text-primary transition-colors">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://twitter.com/triexdev" className="text-muted-foreground hover:text-primary transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground border-t border-border/40 pt-6">
                <p>&copy; {new Date().getFullYear()} 0x1 Framework. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
