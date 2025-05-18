/**
 * Home page showcasing 0x1 features
 */
import { createElement, Fragment, renderToString } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout';
import { counterStore } from '../store/counter';

export default function renderHomePage(): string {
  // Demo of using store state
  const { count } = counterStore.getState();

  return renderToString(
    <DefaultLayout
      title="Home"
      description="Welcome to the 0x1 Framework Demo"
    >
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
                0x1 includes 0x1-store for simple and powerful state management.
              </p>
              
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <button 
                  id="decrement-btn"
                  className="px-4 py-2 bg-red-500 text-white rounded-l-lg hover:bg-red-600"
                >
                  -
                </button>
                <span id="counter-value" className="px-6 py-2 bg-gray-200 dark:bg-gray-700 font-mono">
                  {count}
                </span>
                <button 
                  id="increment-btn"
                  className="px-4 py-2 bg-green-500 text-white rounded-r-lg hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Routing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4">File-based Routing</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Simple and intuitive file-based routing system.
              </p>
              
              <div className="space-y-2">
                <a 
                  href="/features"
                  className="block w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-center transition-colors"
                >
                  Features Page
                </a>
                <a 
                  href="/about"
                  className="block w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-center transition-colors"
                >
                  About Page
                </a>
                <a 
                  href="/contact"
                  className="block w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-center transition-colors"
                >
                  Contact Page
                </a>
              </div>
            </div>
            
            {/* Component System */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Component System</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Create reusable UI components with TypeScript support.
              </p>
              
              <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                <pre className="text-sm text-green-600 dark:text-green-400"><code>{`import { createElement } from '0x1';

export function Button({ text, onClick }) {
  return (
    <button 
      className="px-4 py-2 bg-blue-500 text-white rounded" 
      onClick={onClick}
    >
      {text}
    </button>
  );
}`}</code></pre>
              </div>
            </div>
            
            {/* TypeScript */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4">TypeScript First</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Full TypeScript support for enhanced developer experience.
              </p>
              
              <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                <pre className="text-sm text-blue-600 dark:text-blue-400"><code>{`interface User {
  id: number;
  name: string;
  email: string;
}

function formatUser(user: User): string {
  return \`\${user.name} (\${user.email})\`;
}`}</code></pre>
              </div>
            </div>
          </div>
          
          {/* Additional features section */}
          <div className="space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4">Built for Speed</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                0x1 is designed from the ground up to be incredibly fast and efficient. 
                Built on top of Bun, it offers near-native performance for your web applications.
              </p>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Performance Demo</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      Click the button below to run a simple benchmark
                    </p>
                    
                    <button 
                      id="run-benchmark-btn"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Run Benchmark
                    </button>
                    
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                        <div id="progress-bar" className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                      </div>
                      <div id="progress-text" className="text-sm text-gray-600 dark:text-gray-300">Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
