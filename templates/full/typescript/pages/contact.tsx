/**
 * Contact page demonstrating forms and interactivity in 0x1
 */
import { createElement, Fragment, renderToString } from '0x1';
import { Button } from '../components/Button';
import { DefaultLayout } from '../components/layouts/DefaultLayout';
import { TextField } from '../components/TextField';

export default function renderContactPage(): string {
  return renderToString(
    <DefaultLayout
      title="Contact"
      description="Get in touch with the 0x1 team"
    >
      <div className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <form id="contact-form" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  id="name"
                  label="Name"
                  required={true}
                  placeholder="Your name"
                />
                
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  required={true}
                  placeholder="your.email@example.com"
                  autocomplete="email"
                />
              </div>
              
              <TextField
                id="subject"
                label="Subject"
                required={true}
                placeholder="Subject of your message"
              />
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  placeholder="Your message"
                  className="w-full px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-300 dark:focus:ring-primary-700 transition-colors"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <Button
                  text="Send Message"
                  type="submit"
                  variant="primary"
                  size="lg"
                />
              </div>
            </form>
            
            <div id="success-message" className="hidden text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
              <p className="text-gray-600 dark:text-gray-300">Thank you for contacting us. We'll get back to you shortly.</p>
              <div className="mt-6">
                <Button
                  text="Return to Home"
                  variant="secondary"
                  onClick={() => window.location.href = '/'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
