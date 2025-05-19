/**
 * 0x1 Standard App - Not Found Page
 * Using app directory structure
 */

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-8">
        <span className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</span>
      </div>
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
        Page Not Found
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/" 
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
      >
        Back to Home
      </a>
    </div>
  );
}
