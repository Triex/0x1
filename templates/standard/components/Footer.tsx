/**
 * Footer component
 */
import { Link } from "0x1/router";

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} 0x1 App. Built with <Link href="https://bun.sh" className="text-blue-600 dark:text-blue-400 hover:underline">Bun</Link></p>
          </div>
          <div className="flex space-x-4">
            <Link href="https://github.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">GitHub</Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Documentation</Link>
            <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}