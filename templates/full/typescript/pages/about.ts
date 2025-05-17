/**
 * About page to demonstrate routing in 0x1
 */
import { html } from '../lib/html';
import { DefaultLayout } from '../components/layouts/DefaultLayout';

export default function renderAboutPage() {
  return html`
    ${DefaultLayout({
      title: 'About',
      description: 'Learn about the 0x1 Framework',
      content: html`
        <div class="py-12">
          <div class="max-w-3xl mx-auto">
            <h1 class="text-4xl font-bold mb-8 text-center">About 0x1 Framework</h1>
            
            <div class="prose prose-lg dark:prose-invert mx-auto">
              <p>
                0x1 is an ultra-minimal TypeScript framework built on top of Bun.
                It focuses on developer experience, performance, and simplicity.
              </p>
              
              <h2>Our Philosophy</h2>
              <p>
                The web development ecosystem has become increasingly complex, with large frameworks
                and dependencies that add unnecessary bloat to projects. 0x1 takes a different approach:
              </p>
              
              <ul>
                <li><strong>Simplicity:</strong> Minimal API surface with intuitive patterns</li>
                <li><strong>Performance:</strong> Built on Bun for blazing fast development and runtime</li>
                <li><strong>TypeScript-First:</strong> Built with TypeScript from the ground up</li>
                <li><strong>Zero Dependencies:</strong> Core package has no external dependencies</li>
                <li><strong>Progressive Complexity:</strong> Start minimal and add features as needed</li>
              </ul>
              
              <h2>The Team</h2>
              <p>
                0x1 is developed and maintained by the Triex.Dev team, a group of developers
                passionate about creating minimal, efficient tools for modern web development.
              </p>
              
              <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg my-8">
                <h3 class="text-xl font-bold mb-2">Open Source</h3>
                <p class="mb-4">
                  0x1 is open source under the TDL license. We welcome contributions from the community!
                </p>
                <a 
                  href="https://github.com/Triex/0x1" 
                  class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C17.139 18.197 20 14.445 20 10.017 20 4.484 15.522 0 10 0z" clip-rule="evenodd"></path>
                  </svg>
                  View on GitHub
                </a>
              </div>
              
              <h2>Why Choose 0x1?</h2>
              <p>
                If you're tired of heavyweight frameworks with complex APIs and long build times,
                0x1 offers a refreshing alternative. It's perfect for:
              </p>
              
              <ul>
                <li>Developers who value simplicity and performance</li>
                <li>Projects that need to ship quickly with minimal overhead</li>
                <li>Applications where bundle size and startup time matter</li>
                <li>Teams looking for a TypeScript-first development experience</li>
              </ul>
              
              <p>
                Whether you're building a simple website or a complex web application,
                0x1 provides the tools you need without the bloat.
              </p>
            </div>
          </div>
        </div>
      `
    })}
  `;
}
