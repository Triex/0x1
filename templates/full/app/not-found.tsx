/**
 * Not Found component
 * Similar to Next.js 15's app/not-found.tsx
 */
import { createElement, Fragment } from '../lib/jsx-runtime';

export default function NotFound() {
  return (
    <div className="py-16 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
        <div className="mt-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
