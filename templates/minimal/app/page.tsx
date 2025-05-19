/**
 * 0x1 Minimal App - Home Page
 * Using app directory structure
 */

// Simple functional component for the home page
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to 0x1</h1>
      <p className="mb-4">A minimal TypeScript framework powered by Bun</p>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
        <p className="mb-4">Edit <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">app/page.tsx</code> to modify this page.</p>
        <div className="flex items-center space-x-2">
          <button 
            id="theme-toggle"
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Toggle Theme
          </button>
        </div>
      </div>
    </div>
  );
}
