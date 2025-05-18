/**
 * Features page to showcase 0x1 capabilities
 */
import { createElement, Fragment, renderToString } from '0x1';
import { FeatureCard } from '../components/FeatureCard';
import { DefaultLayout } from '../components/layouts/DefaultLayout';

export default function renderFeaturesPage(): string {
  return renderToString(
    <DefaultLayout
      title="Features"
      description="Explore the powerful features of 0x1 Framework"
    >
      <div className="py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">0x1 Framework Features</h1>
          
          <div className="space-y-12">
            {/* Performance */}
            <section>
              <h2 className="text-3xl font-bold mb-4">⚡️ Blazing Fast Performance</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Built on top of Bun, 0x1 delivers exceptional speed for both development and production.
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
            
            {/* TypeScript */}
            <section>
              <h2 className="text-3xl font-bold mb-4">🔧 TypeScript Support</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                First-class TypeScript support with type-safe APIs and components.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard
                  title="Type Safety"
                  description="Catch errors during development with comprehensive type checking."
                  icon="🛡️"
                />
                
                <FeatureCard
                  title="TSX Components"
                  description="Build components using TSX syntax for improved developer experience."
                  icon="📝"
                />
              </div>
            </section>
            
            {/* Developer Experience */}
            <section>
              <h2 className="text-3xl font-bold mb-4">🚀 Developer Experience</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Designed for a seamless development workflow.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                  title="Hot Reloading"
                  description="Instant updates as you edit your code."
                  icon="🔄"
                />
                
                <FeatureCard
                  title="Simple CLI"
                  description="Easy-to-use commands for development, building, and deployment."
                  icon="💻"
                />
                
                <FeatureCard
                  title="No Configuration"
                  description="Works out of the box with sensible defaults."
                  icon="⚙️"
                />
              </div>
            </section>
            
            {/* Architecture */}
            <section>
              <h2 className="text-3xl font-bold mb-4">🏗️ Modern Architecture</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Built with modern web standards and best practices.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-3">State Management</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                    <code className="text-gray-800 dark:text-gray-200">
{`import { createStore } from '0x1';

const counterStore = createStore({ count: 0 });

export function increment() {
  const { count } = counterStore.getState();
  counterStore.setState({ count: count + 1 });
}

// Subscribe to changes
counterStore.subscribe(state => {
  console.log('Count:', state.count);
});`}
                    </code>
                  </pre>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-3">Routing</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                    <code className="text-gray-800 dark:text-gray-200">
{`import { Router } from '0x1';

const router = new Router();

router
  .add('/', () => renderHomePage())
  .add('/about', () => renderAboutPage())
  .add('/contact', () => renderContactPage())
  .notFound(() => render404Page())
  .start();`}
                    </code>
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
