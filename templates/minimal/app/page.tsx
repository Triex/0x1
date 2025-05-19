/**
 * 0x1 Minimal App - Home Page
 * Using 0x1's app directory structure with React/Next.js style components
 */
import { createElement, Fragment } from '0x1';
import { Counter } from '../components/Counter';
import { ThemeToggle } from '../components/ThemeToggle';

// Home page component with proper Next.js style
export default function HomePage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
          Welcome to 0x1
        </h1>
        <p className="text-xl mb-8 text-gray-800 dark:text-gray-200">
          The lightning-fast web framework powered by Bun
        </p>
        
        {/* Interactive Counter Component */}
        <Counter 
          initialValue={0}
          minValue={-10}
          maxValue={10}
          label="Try out this interactive counter component!"
        />
        
        {/* Theme Toggle Component */}
        <div className="mb-6">
          <ThemeToggle />
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Edit <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-800 dark:text-gray-200">app/page.tsx</code> to customize this page
        </p>
        
        <div className="flex justify-center gap-4">
          <a 
            href="https://github.com/Triex/0x1" 
            target="_blank" 
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            GitHub
          </a>
          <a 
            href="https://bun.sh" 
            target="_blank" 
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Bun Docs
          </a>
        </div>
      </div>
    </div>
  );
}
