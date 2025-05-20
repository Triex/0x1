/**
 * Header Component with 0x1 Logo and Theme Toggle
 */
import { createElement, Fragment } from '0x1';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  // Toggle the theme between light and dark mode
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';

    // Toggle dark class on root element
    document.documentElement.classList.toggle('dark');

    // Save preference to local storage
    localStorage.setItem('0x1-dark-mode', newTheme);
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* 0x1 Logo */}
        <div className="flex items-center">
          <div className="flex items-center mr-2 h-8 w-8 min-w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded text-white font-bold justify-center">
            0x1
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Framework</span>
        </div>

        {/* Right Side Menu */}
        <div className="flex items-center gap-4">
          {/* GitHub Link */}
          <a
            href="https://github.com/Triex/0x1"
            target="_blank"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
            aria-label="GitHub"
          >
            {/* GitHub Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
