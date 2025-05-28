/**
 * 0x1 Standard App - Root Layout
 * Using app directory structure with beautiful light & dark theme
 */
import { Header } from "components/Header";
import "./globals.css";

export const metadata = {
  title: "0x1 Framework Standard App",
  description:
    "Discover the powerful features of 0x1 Framework: ultra-fast performance, TypeScript support, and modern development experience.",
  image: "/og-image.png",
  url: "/pages/features",
  type: "website",
  authors: [{ name: "0x1 Framework" }],
  creator: "0x1 Framework",
  publisher: "0x1 Framework",
  themeColor: "#7c3aed",
  colorScheme: "light dark",
};

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
export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>0x1 Standard App</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Script to handle initial theme setting */}
        {themeInitScript && <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />}
      </head>
      <body className="h-full flex flex-col">
        <Header />
        {/* <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/40">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
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
                <span className="text-sm text-muted-foreground hidden sm:inline">Standard</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium">Home</Link>
              <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle iconOnly />
              <button id="mobile-menu-toggle" className="md:hidden btn btn-ghost btn-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          <div id="mobile-menu" className="hidden md:hidden glass-panel border-t border-border/40">
            <div className="px-4 py-3 space-y-3">
              <Link href="/" className="block text-foreground hover:text-primary transition-colors">Home</Link>
              <Link href="/features" className="block text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors">About</Link>
            </div>
          </div>
        </header> */}

        <main className="flex-grow">
          {children}
        </main>

        <footer className="border-t border-border/40 glass-panel py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} 0x1 Framework - Built with ⚡ and 💜</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
