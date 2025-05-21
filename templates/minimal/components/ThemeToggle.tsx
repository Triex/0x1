/**
 * Theme Toggle Component
 * Toggles between light and dark mode
 */

export function ThemeToggle() {
  // This will be processed by the framework at runtime
  // using a client-side hydration approach similar to React

  // Toggle theme function - will be attached to onClick
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newMode = isDark ? 'light' : 'dark';

    // Toggle dark class on html element
    document.documentElement.classList.toggle('dark', newMode === 'dark');

    // Save user preference
    localStorage.setItem('0x1-dark-mode', newMode);
  }

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="px-3 py-2 bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white rounded-md transition-colors"
      aria-label="Toggle dark mode"
    >
      Toggle Theme
    </button>
          // <button
          //   id="theme-toggle"
          //   onClick={toggleTheme}
          //   className="flex items-center justify-center p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          //   aria-label="Toggle Dark Mode"
          // >
          //   {/* Sun icon (shown in dark mode) */}
          //   <svg className="w-5 h-5 hidden dark:block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          //     <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
          //   </svg>

          //   {/* Moon icon (shown in light mode) */}
          //   <svg className="w-5 h-5 block dark:hidden" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          //     <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
          //   </svg>
          // </button>
  );
}
