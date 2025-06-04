/**
 * 0x1 Full App - Header Component
 * Modern header with mobile menu using 0x1 hooks
 */
import { useEffect, useState } from "0x1";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <a href="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="url(#gradient)" />
              <path
                d="M13.2 3H9.5l-3.1 9.4h4.2L8.2 21l9.1-11.3h-5.5L13.2 3z"
                fill="#fef08a"
                stroke="#fef08a"
                strokeWidth="0.3"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-xl gradient-text">0x1</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Full
            </span>
          </a>
        </div>

        {/* Visual Separator - Made more visible */}
        <div className="hidden md:block h-10 w-1 bg-gray-100 dark:bg-[#2a204c] mx-6 opacity-80"></div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 flex-1">
          <a
            href="/"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Home
          </a>
          <a
            href="/features"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="/about"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            About
          </a>
          <a
            href="/contact"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Actions Section */}
        <div className="flex items-center space-x-4">
          <ThemeToggle iconOnly />
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted dark:hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-border/40">
          <div className="px-4 py-3 space-y-3">
            <a
              href="/"
              onClick={closeMobileMenu}
              className="block text-foreground hover:text-primary transition-colors font-medium"
            >
              Home
            </a>
            <a
              href="/features"
              onClick={closeMobileMenu}
              className="block text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="/about"
              onClick={closeMobileMenu}
              className="block text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </a>
            <a
              href="/contact"
              onClick={closeMobileMenu}
              className="block text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </header>
  );
} 