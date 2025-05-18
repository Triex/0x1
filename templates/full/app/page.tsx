/**
 * Home page component
 * Similar to Next.js 15's app/page.tsx
 */
import { createElement, Fragment } from '../lib/jsx-runtime';
import { counterStore } from '../store/counter';

// This is a server component in Next.js world
export default function HomePage() {
  // Initial state from the store (would be server-side in Next.js)
  const { count } = counterStore.getState();

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome to 0x1
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            The ultra-minimal TypeScript framework powered by Bun
          </p>
        </div>
        
        {/* Feature demo cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* State Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">State Management</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              0x1 includes simple and powerful state management.
            </p>
            
            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <button 
                id="decrement-btn"
                className="px-4 py-2 bg-red-500 text-white rounded-l-lg hover:bg-red-600"
              >
                -
              </button>
              <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
                <span id="counter-value" className="text-xl font-bold">{count}</span>
              </div>
              <button 
                id="increment-btn"
                className="px-4 py-2 bg-green-500 text-white rounded-r-lg hover:bg-green-600"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Component Library */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Component Library</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Build UIs with 0x1's lightweight component approach.
            </p>
            
            <div className="flex flex-col space-y-4">
              <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Secondary Button
              </button>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="demo-checkbox"
                  className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500" 
                />
                <label htmlFor="demo-checkbox" className="text-gray-700 dark:text-gray-300">
                  Interactive components
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick start guide */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p>Get started with 0x1 in minutes:</p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto">
              <code>
                bun create 0x1@latest my-project
              </code>
            </pre>
            <p>Navigate to the features page to explore more capabilities.</p>
            <a 
              href="/features" 
              className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
