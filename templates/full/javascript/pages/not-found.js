/**
 * Not Found (404) page for the 0x1 framework
 */
import { html } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout.js';

export function NotFound() {
  return html`
    ${DefaultLayout({
      title: 'Page Not Found',
      description: 'The requested page could not be found',
      content: html`
        <div class="flex items-center justify-center min-h-[60vh] py-12">
          <div class="text-center">
            <h1 class="text-8xl font-bold text-blue-600 dark:text-blue-400">404</h1>
            <h2 class="text-3xl font-bold mt-4 mb-6 text-gray-800 dark:text-white">Page Not Found</h2>
            <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <a 
              href="/" 
              class="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Return Home
            </a>
          </div>
        </div>
      `
    })}
  `;
}
