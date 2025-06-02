/**
 * 0x1 Crypto Dashboard - Root Layout
 * Web3-enabled layout with wallet connection and beautiful theming
 */

import Link from '0x1/link';
import { CryptoHeader } from "../components/CryptoHeader";
import { Web3Provider } from "../lib/providers";
import "./globals.css";

export const metadata = {
  title: "0x1 Crypto Dashboard",
  description:
    "A powerful crypto dashboard built with 0x1 Framework, featuring wallet connection, token tracking, and DeFi integrations.",
  image: "/og-crypto-dashboard.png",
  url: "/",
  type: "website",
  authors: [{ name: "0x1 Framework" }],
  creator: "0x1 Framework",
  publisher: "0x1 Framework",
  themeColor: "#7c3aed",
  colorScheme: "light dark",
  keywords: ["crypto", "wallet", "DeFi", "dashboard", "blockchain", "ethereum"],
};

// Theme initialization script
const themeInitScript = `
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

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>0x1 Crypto Dashboard</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full flex flex-col transition-colors">
        <Web3Provider>
          <>
            <CryptoHeader />
            
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>

            <footer className="border-t py-8 mt-auto">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Brand */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="font-bold text-xl">0x1</span>
                    </div>
                    <p className="text-sm">
                      The fastest crypto dashboard built with cutting-edge Web3 technology.
                    </p>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <h3 className="font-semibold mb-4">Quick Links</h3>
                    <div className="space-y-2">
                      <Link href="/dashboard" className="block text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        Dashboard
                      </Link>
                      <a href="https://github.com/Triex/0x1" target="_blank" rel="noopener noreferrer" className="block text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        Documentation
                      </a>
                      <a href="https://github.com/Triex/0x1" target="_blank" rel="noopener noreferrer" className="block text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        GitHub
                      </a>
                    </div>
                  </div>

                  {/* Legal */}
                  <div>
                    <h3 className="font-semibold mb-4">Legal</h3>
                    <div className="space-y-2">
                      <Link href="/privacy" className="block text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        Privacy Policy
                      </Link>
                      <Link href="/terms" className="block text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="border-t mt-8 pt-8 text-center">
                  <p className="text-sm">
                    &copy; {new Date().getFullYear()} 0x1 Crypto Dashboard - Built with ⚡ and 💜
                  </p>
                  <p className="text-sm mt-1">
                    Powered by{' '}
                    <a 
                      href="https://github.com/Triex/0x1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      0x1 Framework
                    </a>
                  </p>
                </div>
              </div>
            </footer>
          </>
        </Web3Provider>
      </body>
    </html>
  );
}
