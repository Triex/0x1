/**
 * Contact page for the 0x1 framework
 */
import { html } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout.js';

export function Contact() {
  return html`
    ${DefaultLayout({
      title: 'Contact',
      description: 'Contact the 0x1 team',
      content: html`
        <div class="py-12">
          <div class="max-w-4xl mx-auto">
            <div class="mb-12">
              <h1 class="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Contact Us</h1>
              <div class="h-1 w-24 bg-blue-600 dark:bg-blue-400 mb-6"></div>
              <p class="text-lg text-gray-600 dark:text-gray-300">
                Have questions or feedback about 0x1? We'd love to hear from you!
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <!-- GitHub -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white mb-4">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">GitHub</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Report issues, contribute code, or explore the source on GitHub.
                </p>
                <a 
                  href="https://github.com/Triex/0x1" 
                  target="_blank"
                  class="inline-block px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors"
                >
                  Visit Repository
                </a>
              </div>
              
              <!-- Twitter -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mb-4">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">Twitter</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Follow us on Twitter to get the latest news and updates.
                </p>
                <a 
                  href="https://twitter.com/triexdev" 
                  target="_blank"
                  class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Follow @triexdev
                </a>
              </div>
              
              <!-- Discord -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mb-4">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.6869-.2762-5.4742 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">Discord</h2>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                  Join our Discord community to chat with other developers.
                </p>
                <a 
                  href="https://discord.gg/0x1" 
                  target="_blank"
                  class="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Join Community
                </a>
              </div>
            </div>
            
            <!-- Contact Form -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-12">
              <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Send Us a Message</h2>
              
              <form id="contact-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label for="subject" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input 
                    type="text" 
                    id="subject" 
                    name="subject" 
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    required
                  />
                </div>
                
                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="5" 
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <button 
                    type="submit" 
                    id="submit-form"
                    class="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
            
            <!-- FAQ Section -->
            <div>
              <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Frequently Asked Questions</h2>
              
              <div class="space-y-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Is 0x1 free to use?</h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    Yes, 0x1 is completely free and open-source under the MIT license. You can use it for personal or commercial projects without any restrictions.
                  </p>
                </div>
                
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Can I use 0x1 with my existing project?</h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    0x1 is designed as a complete framework, so it's best suited for new projects. However, you can integrate parts of 0x1 into existing projects with some adaptation.
                  </p>
                </div>
                
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">How do I deploy a 0x1 application?</h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    0x1 applications can be deployed on any static hosting platform like Vercel, Netlify, or GitHub Pages. The framework includes optimized build scripts for production deployment.
                  </p>
                </div>
                
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Where can I get help if I'm stuck?</h3>
                  <p class="text-gray-600 dark:text-gray-300">
                    You can ask questions on our GitHub discussions, join our Discord community, or reach out on Twitter. We have a growing community of developers ready to help.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    })}
  `;

  // In a real app, you would add form submission handling here
}
