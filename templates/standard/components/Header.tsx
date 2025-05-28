/**
 * Header component with navigation and theme toggle
 */
import { Link } from "0x1/link";
import { useTheme } from "../lib/theme";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const links = [
    { text: 'Home', href: '/' },
    { text: 'About', href: '/about' }
  ];
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
          <Link href="/">0x1 App</Link>
        </h1>
        <nav className="flex space-x-6">
          {links.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
            >
              {link.text}
            </Link>
          ))}
        </nav>
        <button 
          id="theme-toggle" 
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ml-4"
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
