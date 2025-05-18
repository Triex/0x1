/**
 * 0x1 Standard App - Home Page
 * Using Next.js 15 app directory structure
 */

// Home page component
export default function HomePage() {
  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Welcome to 0x1 Framework
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          A lightning-fast web framework powered by Bun
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <p className="mb-4">
              This template uses the Next.js 15 app directory structure with file-based routing.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li>Edit <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">app/page.tsx</code> to modify this page</li>
              <li>Create new routes by adding folders in the app directory</li>
              <li>Add layout components with <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">layout.tsx</code></li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li>Next.js 15 app directory structure</li>
              <li>TypeScript support</li>
              <li>Tailwind CSS styling</li>
              <li>Dark mode support</li>
              <li>File-based routing</li>
              <li>Zero dependencies</li>
            </ul>
            <div className="mt-4">
              <a 
                href="/about" 
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Theme Toggle Demo</h2>
          <p className="mb-4">
            Click the button below to toggle between light and dark mode:
          </p>
          <button 
            id="theme-toggle"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Toggle Theme
          </button>
        </div>
      </div>
    </div>
  );
}
