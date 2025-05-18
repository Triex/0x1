/**
 * Features page for the 0x1 framework
 */
import { html } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout.js';

export function Features() {
  return html`
    ${DefaultLayout({
      title: 'Features',
      description: 'Key features of the 0x1 Framework',
      content: html`
        <div class="py-12">
          <div class="max-w-4xl mx-auto">
            <div class="mb-12">
              <h1 class="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Features</h1>
              <div class="h-1 w-24 bg-blue-600 dark:bg-blue-400 mb-6"></div>
              <p class="text-lg text-gray-600 dark:text-gray-300">
                Discover what makes 0x1 the perfect lightweight JavaScript framework for your next project.
              </p>
            </div>
            
            <!-- Key Features Section -->
            <div class="grid gap-8 mb-12">
              <!-- Performance -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="md:flex">
                  <div class="md:flex-shrink-0 flex items-center justify-center p-6 bg-blue-600 dark:bg-blue-800 text-white md:w-48">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div class="p-6">
                    <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Blazing Fast Performance</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">
                      Built on top of Bun, 0x1 delivers exceptional speed in both development and production. 
                      Pages load instantly with minimal overhead.
                    </p>
                    <ul class="space-y-2">
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Tiny runtime (~3KB gzipped)</span>
                      </li>
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">No client-side hydration cost</span>
                      </li>
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Optimized bundle splitting and lazy loading</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- Simplified State Management -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="md:flex">
                  <div class="md:flex-shrink-0 flex items-center justify-center p-6 bg-green-600 dark:bg-green-800 text-white md:w-48">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div class="p-6">
                    <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Simple State Management</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">
                      Manage application state without complexity. 0x1 includes a lightweight store with 
                      automatic UI updates.
                    </p>
                    <ul class="space-y-2">
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Predictable state updates</span>
                      </li>
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">No boilerplate reducer patterns</span>
                      </li>
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Automatic UI synchronization</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- Routing -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="md:flex">
                  <div class="md:flex-shrink-0 flex items-center justify-center p-6 bg-purple-600 dark:bg-purple-800 text-white md:w-48">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div class="p-6">
                    <h2 class="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Client-Side Routing</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">
                      Navigate between pages without full-page reloads. 0x1 comes with a lightweight client-side 
                      router that uses the browser's History API.
                    </p>
                    <ul class="space-y-2">
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Declarative route definitions</span>
                      </li>
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Route parameters and dynamic routing</span>
                      </li>
                      <li class="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-gray-600 dark:text-gray-300">Lazy-loaded page components</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Secondary Features Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <!-- Bun-powered -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-800 dark:text-white">Bun-powered Development</h3>
                    <p class="mt-2 text-gray-600 dark:text-gray-300">
                      Enjoy lightning-fast development with Bun's superior JavaScript runtime. 
                      Hot module replacement provides instant feedback.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Dark Mode Support -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-800 dark:text-white">Built-in Dark Mode</h3>
                    <p class="mt-2 text-gray-600 dark:text-gray-300">
                      Toggle between light and dark themes with system preference detection. 
                      All components automatically respond to theme changes.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Tailwind Integration -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-800 dark:text-white">Tailwind CSS Integration</h3>
                    <p class="mt-2 text-gray-600 dark:text-gray-300">
                      Seamless integration with Tailwind CSS for rapid UI development. 
                      Optimized build process with minimal configuration.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- TypeScript Support -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-800 dark:text-white">TypeScript and JavaScript</h3>
                    <p class="mt-2 text-gray-600 dark:text-gray-300">
                      Full TypeScript support for type safety and better developer experience,
                      or use plain JavaScript if you prefer. Your choice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- CTA Section -->
            <div class="bg-blue-600 dark:bg-blue-800 text-white rounded-lg shadow-lg overflow-hidden">
              <div class="p-8 text-center">
                <h2 class="text-2xl font-bold mb-4">Ready to try 0x1?</h2>
                <p class="mb-6 text-blue-100">Get started with our minimal template and start building in minutes.</p>
                <div class="inline-block bg-gray-800 dark:bg-gray-900 rounded p-4 text-sm font-mono">
                  <code>bun create 0x1 my-app</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    })}
  `;
}
