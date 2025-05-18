/**
 * Home page showcasing 0x1 features
 */
import { html } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout.js';
import { counterStore } from '../store/counter.js';

export function Home() {
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
                The ultra-minimal JavaScript framework powered by Bun
              </p>
            </div>
            
            <!-- Feature demo cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <!-- State Management -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">State Management</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Simple but powerful state management with automatic UI updates.
                </p>
                <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <button 
                    id="decrement-btn"
                    class="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    -
                  </button>
                  <span id="counter-value" class="text-xl font-semibold">${count}</span>
                  <button 
                    id="increment-btn"
                    class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <!-- Routing -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Client-Side Routing</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Fast, history-based navigation without page reloads.
                </p>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <nav class="flex flex-wrap gap-2">
                    <a href="/" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Home</a>
                    <a href="/about" class="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">About</a>
                    <a href="/features" class="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Features</a>
                    <a href="/contact" class="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Contact</a>
                  </nav>
                </div>
              </div>
              
              <!-- Responsive Design -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Responsive Design</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Mobile-first design with Tailwind CSS for all screen sizes.
                </p>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div class="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <!-- Dark Mode -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Dark Mode Support</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Toggle between light and dark themes with system preference detection.
                </p>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-center">
                  <button 
                    id="theme-toggle-demo"
                    class="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 hidden dark:block">
                      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 block dark:hidden">
                      <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Call to action -->
            <div class="text-center py-8">
              <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Ready to get started?</h2>
              <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Build your next project with 0x1 and experience the simplicity.
              </p>
              <div class="flex flex-wrap justify-center gap-4">
                <a href="/features" class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md">
                  Explore Features
                </a>
                <a href="https://github.com/Triex/0x1" target="_blank" class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-md flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      `
    })}
  `;
}
