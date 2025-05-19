/**
 * 0x1 Standard App - About Page
 * Using app directory structure
 */

export default function AboutPage() {
  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          About 0x1 Framework
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            0x1 is a minimal, high-performance web framework designed to provide the best developer experience with zero overhead.
            Built on Bun, it delivers lightning-fast performance while maintaining a simple and intuitive API.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Our goal is to make web development straightforward and enjoyable, focusing on what matters most: building great web applications without unnecessary complexity.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Key Features</h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <span className="font-semibold">App Directory Structure</span> - Modern file-based routing with nested layouts
              </div>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <span className="font-semibold">Zero Dependencies</span> - Minimal bundle size with no external dependencies
              </div>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <span className="font-semibold">TypeScript-First</span> - Built with TypeScript for type safety and improved developer experience
              </div>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <span className="font-semibold">Bun-Powered</span> - Leveraging Bun's speed and efficiency for development and production
              </div>
            </li>
          </ul>
        </div>
        
        <div className="text-center">
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
