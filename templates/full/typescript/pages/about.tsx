/**
 * About page to demonstrate routing in 0x1
 */
import { createElement, Fragment, renderToString } from '0x1';
import { DefaultLayout } from '../components/layouts/DefaultLayout';

export default function renderAboutPage(): string {
  return renderToString(
    <DefaultLayout
      title="About"
      description="Learn about the 0x1 Framework"
    >
      <div className="py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About 0x1 Framework</h1>
          
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p>
              0x1 is an ultra-minimal TypeScript framework built on top of Bun.
              It focuses on developer experience, performance, and simplicity.
            </p>
            
            <p>
              Unlike traditional frameworks that come with a lot of overhead,
              0x1 provides just enough structure to build modern web applications
              without unnecessary complexity.
            </p>
            
            <h2>Why 0x1?</h2>
            
            <p>
              The name "0x1" refers to the hexadecimal value for 1 (one), symbolizing:
            </p>
            
            <ul>
              <li>
                <strong>Minimalism:</strong> Only what you need, nothing more
              </li>
              <li>
                <strong>First principles:</strong> Built from the ground up with modern web in mind
              </li>
              <li>
                <strong>Binary simplicity:</strong> Embracing the 0 and 1 of simple solutions
              </li>
            </ul>
            
            <h2>Core Principles</h2>
            
            <ol>
              <li>
                <strong>Zero Overhead:</strong> No unnecessary abstractions or dependencies
              </li>
              <li>
                <strong>Type Safety:</strong> First-class TypeScript support
              </li>
              <li>
                <strong>Developer Experience:</strong> Intuitive APIs and conventions
              </li>
              <li>
                <strong>Performance:</strong> Lightning-fast development and runtime
              </li>
              <li>
                <strong>Flexibility:</strong> Adaptable to different project needs
              </li>
            </ol>
            
            <p>
              0x1 is open source and actively maintained by a growing community of developers 
              who value simplicity and performance above all.
            </p>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
