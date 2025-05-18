/**
 * About page for the 0x1 framework
 */
import { html } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout.js';

export function About() {
  return html`
    ${DefaultLayout({
      title: 'About',
      description: 'About the 0x1 Framework',
      content: html`
        <div class="py-12">
          <div class="max-w-4xl mx-auto">
            <div class="mb-12">
              <h1 class="text-4xl font-bold mb-4 text-gray-800 dark:text-white">About 0x1</h1>
              <div class="h-1 w-24 bg-blue-600 dark:bg-blue-400 mb-6"></div>
              <p class="text-lg text-gray-600 dark:text-gray-300">
                0x1 is an ultra-minimal JavaScript framework designed for simplicity and performance.
              </p>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12 border border-gray-200 dark:border-gray-700">
              <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Our Philosophy</h2>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                We believe web development should be simple, fast, and enjoyable. 0x1 strips away 
                unnecessary complexity to give you a lightweight framework that's easy to learn and use.
              </p>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Built on top of Bun, 0x1 leverages modern JavaScript features 
                without the bloat of traditional frameworks.
              </p>
              <div class="flex items-center mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-blue-600 dark:text-blue-400 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <span class="block text-gray-800 dark:text-white font-medium">Performance First</span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">Everything in 0x1 is optimized for speed and efficiency</span>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-3 flex items-center text-gray-800 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Minimal Dependencies
                </h2>
                <p class="text-gray-600 dark:text-gray-300">
                  We keep external dependencies to an absolute minimum, ensuring your projects remain 
                  lightweight and maintainable over time.
                </p>
              </div>
              
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-3 flex items-center text-gray-800 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Developer Experience
                </h2>
                <p class="text-gray-600 dark:text-gray-300">
                  We prioritize developer experience with intuitive APIs, clear documentation, 
                  and predictable behavior throughout the framework.
                </p>
              </div>
              
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-3 flex items-center text-gray-800 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Modern Best Practices
                </h2>
                <p class="text-gray-600 dark:text-gray-300">
                  Built with modern JavaScript best practices in mind, 0x1 helps you 
                  write clean, maintainable code that's ready for production.
                </p>
              </div>
              
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-3 flex items-center text-gray-800 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Zero-Config
                </h2>
                <p class="text-gray-600 dark:text-gray-300">
                  Get started immediately with sensible defaults. No complex configuration required to 
                  build production-ready applications.
                </p>
              </div>
            </div>
            
            <div class="text-center py-6">
              <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Get Involved</h2>
              <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
                0x1 is an open-source project. We welcome contributions and feedback!
              </p>
              <a 
                href="https://github.com/Triex/0x1" 
                target="_blank"
                class="inline-flex items-center px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors shadow-md"
              >
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                </svg>
                Contribute on GitHub
              </a>
            </div>
          </div>
        </div>
      `
    })}
  `;
}
