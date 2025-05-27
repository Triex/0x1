"use client"
/**
 * Theme Toggle Component (With State Managemenet)
 */

import { useEffect, useState } from "0x1";

interface ThemeToggleProps {
  className?: string;
  iconOnly?: boolean;
}

export function ThemeToggle({
  className = "",
  iconOnly = false,
}: ThemeToggleProps) {
  // State to track if dark mode is active
  const [isDark, setIsDark] = useState<boolean>(false);

  // Initialize theme on component mount
  useEffect(() => {
    // Check for saved preference first
    const savedTheme = localStorage.getItem("0x1-dark-mode");

    // If there's a saved preference, use it
    if (savedTheme) {
      const shouldBeDark = savedTheme === "dark";
      setIsDark(shouldBeDark);
      document.documentElement.classList.toggle("dark", shouldBeDark);
    } else {
      // If no saved preference, check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
      localStorage.setItem("0x1-dark-mode", prefersDark ? "dark" : "light");
    }

    // Set up listener for changes to color scheme preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("0x1-dark-mode")) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("0x1-dark-mode", newIsDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors ${className}`}
      aria-label="Toggle Dark Mode"
    >
      {iconOnly ? (
        <>
          {/* Sun icon - Only visible in dark mode */}
          <svg
            className={`w-5 h-5 ${isDark ? 'block' : 'hidden'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          {/* Moon icon - Only visible in light mode */}
          <svg
            className={`w-5 h-5 ${isDark ? 'hidden' : 'block'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </>
      ) : (
        <span className="flex items-center text-sm font-medium">
          {/* Moon icon for light mode */}
          <svg
            className={`w-4 h-4 mr-2 ${isDark ? 'hidden' : 'block'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          {/* Sun icon for dark mode */}
          <svg
            className={`w-4 h-4 mr-2 ${isDark ? 'block' : 'hidden'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
          {isDark ? "🌙 Dark" : "☀️ Light"} Theme
        </span>
      )}
    </button>
  );
}
