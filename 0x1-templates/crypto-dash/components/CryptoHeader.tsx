'use client';

import { useEffect, useState } from '0x1';
import Link from '0x1/link';
import { ThemeToggle } from "./ThemeToggle";
import { WalletConnectButton } from "./WalletConnect";

export function CryptoHeader() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="card border-b h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="w-32 h-8 bg-muted rounded animate-pulse"></div>
          <div className="w-32 h-8 bg-muted rounded animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-card"></div>
            </div>
            <div>
              <span className="font-bold text-xl">
                0x1
              </span>
              <span className="ml-2 text-sm font-medium text-violet-600 dark:text-violet-400 hidden sm:inline">
                Crypto Dashboard
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/portfolio"
              className="opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
            >
              Portfolio
            </Link>
            <Link
              href="/swap"
              className="opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
            >
              Swap
            </Link>
            <Link
              href="/nft"
              className="opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
            >
              NFTs
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <WalletConnectButton />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="space-y-3">
              <Link
                href="/"
                className="block px-3 py-2 opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/portfolio"
                className="block px-3 py-2 opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Portfolio
              </Link>
              <Link
                href="/swap"
                className="block px-3 py-2 opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Swap
              </Link>
              <Link
                href="/nft"
                className="block px-3 py-2 opacity-75 hover:opacity-100 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                NFTs
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 