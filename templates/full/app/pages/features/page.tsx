/**
 * Features page component
 * Similar to Next.js 15's app/features/page.tsx
 */

export default function FeaturesPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 text-primary-600 dark:text-primary-400">
            Features
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Explore what makes 0x1 powerful yet lightweight
          </p>
        </div>
        
        {/* Feature sections */}
        <div className="space-y-12">
          {/* Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Blazing Fast Performance</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Built on Bun, 0x1 delivers exceptional performance for both development and production.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg">
              <div className="mb-4">
                <p className="text-lg font-semibold mb-2">Performance Benchmark</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Click the button below to run a performance test.</p>
                
                <button 
                  id="run-benchmark-btn"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  Run Benchmark
                </button>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                  <div 
                    id="progress-bar"
                    className="bg-primary-600 h-4 rounded-full" 
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <p id="progress-text" className="text-sm text-gray-600 dark:text-gray-400">Ready to start</p>
              </div>
            </div>
          </div>
          
          {/* Zero Dependencies */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Zero External Dependencies</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              The core 0x1 framework has zero npm dependencies, keeping your projects lightweight.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Traditional Framework</h3>
                <div className="text-sm">
                  <p>Dependencies: 250+</p>
                  <p>Install size: ~300MB</p>
                  <p>Build time: 15-30s</p>
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-2 border-primary-600 dark:border-primary-400">
                <h3 className="font-bold mb-2">0x1 Framework</h3>
                <div className="text-sm">
                  <p>Dependencies: 0</p>
                  <p>Install size: ~120KB</p>
                  <p>Build time: &lt;1s</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* TypeScript First */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">TypeScript First</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Enjoy full TypeScript support with zero configuration.
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <pre><code>{`// Strongly typed components
interface ButtonProps {
  onClick: () => void;
  children: string;
  variant?: 'primary' | 'secondary';
}

function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  const className = \`btn \${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}\`;
  return <button className={className} onClick={onClick}>{children}</button>;
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
