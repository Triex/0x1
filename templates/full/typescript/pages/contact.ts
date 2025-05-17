/**
 * Contact page demonstrating forms and interactivity in 0x1
 */
import { html } from '../lib/html';
import { Button } from '../components/Button';
import { DefaultLayout } from '../components/layouts/DefaultLayout';
import { TextField } from '../components/TextField';

export default function renderContactPage() {
  return html`
    ${DefaultLayout({
      title: 'Contact',
      description: 'Get in touch with the 0x1 team',
      content: html`
        <div class="py-12">
          <div class="max-w-3xl mx-auto">
            <h1 class="text-4xl font-bold mb-8 text-center">Contact Us</h1>
            
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <form id="contact-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    ${TextField({
                      id: 'name',
                      label: 'Your Name',
                      placeholder: 'John Doe',
                      required: true
                    })}
                  </div>
                  
                  <div>
                    ${TextField({
                      id: 'email',
                      label: 'Email Address',
                      type: 'email',
                      placeholder: 'john@example.com',
                      required: true
                    })}
                  </div>
                </div>
                
                <div>
                  ${TextField({
                    id: 'subject',
                    label: 'Subject',
                    placeholder: 'How can we help you?',
                    required: true
                  })}
                </div>
                
                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    class="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:text-white"
                    placeholder="Your message here..."
                    required
                  ></textarea>
                </div>
                
                <div class="flex items-center">
                  <input
                    id="newsletter"
                    name="newsletter"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label for="newsletter" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Subscribe to our newsletter
                  </label>
                </div>
                
                <div>
                  ${Button({
                    type: 'submit',
                    text: 'Send Message',
                    variant: 'primary',
                    fullWidth: true
                  })}
                </div>
              </form>
              
              <div id="success-message" class="hidden mt-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                <div class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  <p>Thank you for your message! We'll get back to you soon.</p>
                </div>
              </div>
            </div>
            
            <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div class="flex justify-center">
                  <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
                <h2 class="mt-4 text-xl font-bold">Email Us</h2>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  <a href="mailto:hello@0x1.dev" class="hover:text-blue-600 dark:hover:text-blue-400">
                    hello@0x1.dev
                  </a>
                </p>
              </div>
              
              <div>
                <div class="flex justify-center">
                  <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                    </svg>
                  </div>
                </div>
                <h2 class="mt-4 text-xl font-bold">Discord Community</h2>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  <a href="https://discord.gg/0x1" class="hover:text-blue-600 dark:hover:text-blue-400">
                    Join our Discord
                  </a>
                </p>
              </div>
              
              <div>
                <div class="flex justify-center">
                  <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                  </div>
                </div>
                <h2 class="mt-4 text-xl font-bold">GitHub</h2>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                  <a href="https://github.com/Triex/0x1" class="hover:text-blue-600 dark:hover:text-blue-400">
                    Report issues or contribute
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Simple form handling
          document.getElementById('contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real app, this would send the data to a server
            // For demo purposes, we'll just show a success message
            document.getElementById('contact-form').style.display = 'none';
            document.getElementById('success-message').classList.remove('hidden');
          });
        </script>
      `
    })}
  `;
}
