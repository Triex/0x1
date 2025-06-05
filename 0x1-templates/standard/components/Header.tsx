/**
 * Header component with navigation and theme toggle
 */
import { useEffect, useState } from "0x1";
import { useTheme } from "../lib/theme";

// Simple Link component that works with the main JSX runtime
function Link({ href, children, className, ...props }: { href: string; children: any; className?: string; [key: string]: any }) {
  return (
    <a 
      href={href} 
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const links = [
    { text: 'Home', href: '/' },
    { text: 'Features', href: '/features' },
    { text: 'About', href: '/about' },
  ];
  
  // Close mobile menu when navigating
  const _handleNavigation = () => {
    setMobileMenuOpen(false);
  };
  
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
  
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/40">
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
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {links.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {link.text}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button 
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          {/* Mobile Menu Toggle Button */}
          <button 
            aria-label="Toggle mobile menu"
            className="md:hidden btn btn-ghost btn-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden glass-panel border-t border-border/40`}>
        <div className="px-4 py-3 space-y-3">
          {links.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className="block text-foreground hover:text-primary transition-colors"
            >
              {link.text}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
