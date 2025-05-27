/**
 * 0x1 Full App - Home Page
 * Comprehensive showcase with advanced features and beautiful design
 */

import { Button } from "../components/Button";

// This is a server component in Next.js world
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-20 animate-fade-in">
        <div className="mb-8">
          <span className="badge badge-primary mb-4">v1.0.0 - Production Ready</span>
        </div>
        <h1 className="text-6xl font-bold mb-6 gradient-text">
          Welcome to 0x1 Full
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          The ultimate TypeScript framework powered by Bun. Complete with state management, 
          component library, PWA support, and production-ready architecture.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="secondary" size="lg">
            View Documentation
          </Button>
          <Button variant="ghost" size="lg">
            GitHub →
          </Button>
        </div>
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>TypeScript</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Bun Runtime</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>PWA Ready</span>
          </div>
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
                <span id="counter-value" className="text-xl font-bold">0</span>
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
