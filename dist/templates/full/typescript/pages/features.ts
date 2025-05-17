/**
 * Features page to showcase 0x1 capabilities
 */
import { html } from '0x1';
import { FeatureCard } from '../components/FeatureCard';
import { DefaultLayout } from '../components/layouts/DefaultLayout';

export default function FeaturesPage() {
  return html`
    ${DefaultLayout({
      title: 'Features',
      description: 'Explore the powerful features of 0x1 Framework',
      content: html`
        <div class="py-12">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold mb-8 text-center">0x1 Framework Features</h1>
            
            <div class="space-y-12">
              <!-- Performance -->
              <section>
                <h2 class="text-3xl font-bold mb-4">⚡️ Blazing Fast Performance</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                  0x1 leverages the incredibly fast Bun runtime to deliver exceptional performance at every stage:
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  ${FeatureCard({
                    title: 'Fast Startup',
                    description: 'Start your development server in milliseconds, not seconds.',
                    icon: '🚀'
                  })}
                  
                  ${FeatureCard({
                    title: 'Quick Builds',
                    description: 'Production builds complete in a fraction of the time.',
                    icon: '⏱️'
                  })}
                  
                  ${FeatureCard({
                    title: 'Responsive UI',
                    description: 'No lag or delays in rendering or interactivity.',
                    icon: '✨'
                  })}
                </div>
              </section>
              
              <!-- Developer Experience -->
              <section>
                <h2 class="text-3xl font-bold mb-4">🧑‍💻 Exceptional DX</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                  0x1 prioritizes developer experience with intuitive APIs and intelligent defaults:
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  ${FeatureCard({
                    title: 'TypeScript First',
                    description: 'Complete type safety and IDE integration.',
                    icon: '🔍'
                  })}
                  
                  ${FeatureCard({
                    title: 'Intuitive API',
                    description: 'Simple and consistent APIs that make sense.',
                    icon: '🧩'
                  })}
                  
                  ${FeatureCard({
                    title: 'Fast Refresh',
                    description: 'Instant feedback as you develop.',
                    icon: '🔄'
                  })}
                </div>
              </section>
              
              <!-- Lightweight -->
              <section>
                <h2 class="text-3xl font-bold mb-4">🪶 Ultra-Lightweight</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                  0x1 is designed to be minimal with zero bloat:
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  ${FeatureCard({
                    title: 'Tiny Runtime',
                    description: 'Minuscule footprint for blazing performance.',
                    icon: '📦'
                  })}
                  
                  ${FeatureCard({
                    title: 'No Dependencies',
                    description: 'Zero external dependencies in the core package.',
                    icon: '🔒'
                  })}
                  
                  ${FeatureCard({
                    title: 'Small bundle Size',
                    description: 'Your apps ship with minimal overhead.',
                    icon: '💨'
                  })}
                </div>
              </section>
              
              <!-- Feature Rich -->
              <section>
                <h2 class="text-3xl font-bold mb-4">🔌 Powerful When You Need It</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                  While staying minimal, 0x1 provides all the features you need for modern web development:
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${FeatureCard({
                    title: 'File-based Routing',
                    description: 'Intuitive routing based on your file structure.',
                    icon: '🧭'
                  })}
                  
                  ${FeatureCard({
                    title: 'Component System',
                    description: 'Create reusable UI components with TypeScript support.',
                    icon: '🧱'
                  })}
                  
                  ${FeatureCard({
                    title: 'State Management',
                    description: 'Simple yet powerful state management with 0x1-store.',
                    icon: '🗄️'
                  })}
                  
                  ${FeatureCard({
                    title: 'PWA Support',
                    description: 'Built-in progressive web app capabilities.',
                    icon: '📱'
                  })}
                  
                  ${FeatureCard({
                    title: 'SEO Friendly',
                    description: 'Server-rendered HTML for optimal SEO.',
                    icon: '🔍'
                  })}
                  
                  ${FeatureCard({
                    title: 'Production Ready',
                    description: 'Optimized builds ready for deployment.',
                    icon: '🚀'
                  })}
                </div>
              </section>
              
              <section class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h2 class="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                  Create your first 0x1 project in seconds:
                </p>
                
                <div class="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
                  <pre class="text-sm text-yellow-600 dark:text-yellow-400"><code>npx create-0x1-app my-project</code></pre>
                </div>
                
                <div class="mt-6 flex justify-center">
                  <a 
                    href="/docs/getting-started" 
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Read Documentation
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      `
    })}
  `;
}
