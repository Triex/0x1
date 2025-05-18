/**
 * About page component
 * Similar to Next.js 15's app/about/page.tsx
 */
import { createElement, Fragment } from '../../lib/jsx-runtime';

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 text-primary-600 dark:text-primary-400">
            About 0x1
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            The modern ultra-minimal framework for TypeScript
          </p>
        </div>
        
        {/* About sections */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                0x1 was created with a singular purpose: to provide developers with an ultra-lightweight, 
                blazing fast framework that strips away all the unnecessary complexity and bloat that has 
                infected modern web development.
              </p>
              <p>
                We believe that web development should be:
              </p>
              <ul>
                <li><strong>Simple</strong> - No complex toolchains or configurations</li>
                <li><strong>Fast</strong> - From development to production</li>
                <li><strong>Efficient</strong> - Small bundle sizes, minimal dependencies</li>
                <li><strong>Modern</strong> - TypeScript, ES modules, and modern JavaScript features</li>
                <li><strong>Flexible</strong> - Works with your existing tools and workflows</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">The Team</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                0x1 is developed and maintained by a small team of passionate developers who are committed 
                to creating tools that make web development more enjoyable and productive.
              </p>
              <p>
                Lead by <a href="https://github.com/Triex" className="text-primary-600 dark:text-primary-400 hover:underline">
                Alex Zarov (Triex)</a>, the 0x1 team focuses on creating a framework that respects 
                developers and their time.
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Why 0x1?</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                The name "0x1" is derived from the hexadecimal representation of the number 1 (0x1). 
                This reflects our philosophy of starting from the smallest, most fundamental unit and 
                building up only what is necessary - no more, no less.
              </p>
              <p>
                In a world of heavyweight frameworks that try to do everything, 0x1 stands out by doing 
                only what's essential - and doing it exceptionally well.
              </p>
              <blockquote>
                The best code is the code you don't have to write.
              </blockquote>
              <p>
                0x1 is open source and free to use for any purpose. We welcome contributions from 
                the community and are committed to maintaining the framework's core principles of 
                simplicity, performance, and developer experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
