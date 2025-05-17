/**
 * Home page showcasing 0x1 features
 */
import { html } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout';
import { counterStore } from '../store/counter';

export default function HomePage() {
  // Demo of using store state
  const { count } = counterStore.getState();

  return html`
    ${DefaultLayout({
      title: 'Home',
      description: 'Welcome to the 0x1 Framework Demo',
      content: html`
        <div class="py-12">
          <div class="max-w-4xl mx-auto">
            <div class="mb-12 text-center">
              <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Welcome to 0x1
              </h1>
              <p class="text-xl text-gray-600 dark:text-gray-300">
                The ultra-minimal TypeScript framework powered by Bun
              </p>
            </div>
            
            <!-- Feature demo cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <!-- State Management -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-2xl font-bold mb-4">State Management</h2>
                <p class="mb-4 text-gray-600 dark:text-gray-300">
                  0x1 includes 0x1-store for simple and powerful state management.
                </p>
                
                <div class="flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                  <button 
                    id="decrement-btn"
                    class="px-4 py-2 bg-red-500 text-white rounded-l-lg hover:bg-red-600"
                  >
                    -
                  </button>
                  <span id="counter-value" class="px-6 py-2 bg-gray-200 dark:bg-gray-700 font-mono">
                    ${count}
                  </span>
                  <button 
                    id="increment-btn"
                    class="px-4 py-2 bg-green-500 text-white rounded-r-lg hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <!-- Routing -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-2xl font-bold mb-4">File-based Routing</h2>
                <p class="mb-4 text-gray-600 dark:text-gray-300">
                  Simple and intuitive file-based routing system.
                </p>
                
                <div class="space-y-2">
                  <a 
                    href="/features"
                    class="block w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-center transition-colors"
                  >
                    Features Page
                  </a>
                  <a 
                    href="/about"
                    class="block w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-center transition-colors"
                  >
                    About Page
                  </a>
                  <a 
                    href="/contact"
                    class="block w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-center transition-colors"
                  >
                    Contact Page
                  </a>
                </div>
              </div>
              
              <!-- Component System -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-2xl font-bold mb-4">Component System</h2>
                <p class="mb-4 text-gray-600 dark:text-gray-300">
                  Create reusable UI components with TypeScript support.
                </p>
                
                <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                  <pre class="text-sm text-green-600 dark:text-green-400"><code>import { html } from '0x1';

export function Button({ text, onClick }) {
  return html\`
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded" 
      onclick=\${onClick}
    >
      \${text}
    </button>
  \`;
}</code></pre>
                </div>
              </div>
              
              <!-- TypeScript -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-2xl font-bold mb-4">TypeScript First</h2>
                <p class="mb-4 text-gray-600 dark:text-gray-300">
                  Full TypeScript support for enhanced developer experience.
                </p>
                
                <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                  <pre class="text-sm text-blue-600 dark:text-blue-400"><code>interface User {
  id: number;
  name: string;
  email: string;
}

function formatUser(user: User): string {
  return \`\${user.name} <\${user.email}>\`;
}</code></pre>
                </div>
              </div>
            </div>
            
            <!-- Performance Demo -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-12">
              <h2 class="text-2xl font-bold mb-4">Lightning Fast</h2>
              <p class="mb-4 text-gray-600 dark:text-gray-300">
                0x1 leverages Bun's speed for incredibly fast performance.
              </p>
              
              <div class="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  id="progress-bar"
                  class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style="width: 0%;"
                ></div>
              </div>
              <div class="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">
                <span id="progress-text">0ms</span>
              </div>
              
              <button
                id="run-benchmark-btn"
                class="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
              >
                Run Performance Demo
              </button>
            </div>
            
            <!-- Getting Started -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 class="text-2xl font-bold mb-4">Getting Started</h2>
              <p class="mb-4 text-gray-600 dark:text-gray-300">
                Create a new 0x1 project in seconds:
              </p>
              
              <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                <pre class="text-sm text-yellow-600 dark:text-yellow-400"><code>npx create-0x1-app my-project</code></pre>
              </div>
              
              <p class="mt-4 text-gray-600 dark:text-gray-300">
                Or use the 0x1 CLI directly:
              </p>
              
              <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                <pre class="text-sm text-yellow-600 dark:text-yellow-400"><code>bun install -g 0x1
0x1 new my-project</code></pre>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Counter demo functionality
          document.getElementById('increment-btn').addEventListener('click', function() {
            const event = new CustomEvent('counter-increment');
            window.dispatchEvent(event);
            
            // Update the UI immediately (the real store would handle this)
            const counterElement = document.getElementById('counter-value');
            if (counterElement) {
              counterElement.textContent = String(parseInt(counterElement.textContent || '0') + 1);
            }
          });
          
          document.getElementById('decrement-btn').addEventListener('click', function() {
            const event = new CustomEvent('counter-decrement');
            window.dispatchEvent(event);
            
            // Update the UI immediately (the real store would handle this)
            const counterElement = document.getElementById('counter-value');
            if (counterElement) {
              counterElement.textContent = String(parseInt(counterElement.textContent || '0') - 1);
            }
          });
          
          // Performance demo
          document.getElementById('run-benchmark-btn').addEventListener('click', function() {
            const btn = this;
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            
            // Disable button during benchmark
            btn.disabled = true;
            btn.textContent = 'Running...';
            
            // Reset progress
            progressBar.style.width = '0%';
            progressText.textContent = '0ms';
            
            const startTime = performance.now();
            let progress = 0;
            
            // Simulate a benchmark with increasing progress
            const interval = setInterval(() => {
              progress += 2;
              
              if (progress <= 100) {
                progressBar.style.width = \`\${progress}%\`;
                const elapsed = Math.round(performance.now() - startTime);
                progressText.textContent = \`\${elapsed}ms\`;
              } else {
                clearInterval(interval);
                const finalTime = Math.round(performance.now() - startTime);
                progressText.textContent = \`Complete in \${finalTime}ms\`;
                
                // Re-enable button
                btn.disabled = false;
                btn.textContent = 'Run Performance Demo';
              }
            }, 20);
          });
        </script>
      `,
    })}
  `;
}
