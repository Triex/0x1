/**
 * 0x1 Full App - Home Page
 * Comprehensive showcase with advanced features and beautiful design
 */

import Link from "0x1/link";
import { Button } from "../components/Button";
import { Counter } from "../components/Counter";

export const metadata = {
  title: '0x1 Framework - Lightning-Fast TypeScript Framework',
  description: 'The lightning-fast, zero-dependency TypeScript framework that replaces React and Next.js. Build modern web apps with extreme performance.',
  keywords: ['0x1', 'framework', 'typescript', 'react', 'nextjs', 'replacement', 'performance', 'bun'],
  openGraph: {
    title: '0x1 Framework - Lightning-Fast TypeScript Framework',
    description: 'The lightning-fast, zero-dependency TypeScript framework that replaces React and Next.js',
    type: 'website',
  }
};

// This is a server component in Next.js world
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-24 animate-fade-in">
        <div className="mb-8">
          <span className="badge badge-primary mb-6 text-sm px-4 py-2">
            ⚡ Zero Dependencies • Sub-30KB • TypeScript-First
          </span>
        </div>
        <h1 className="text-6xl md:text-7xl font-bold mb-8 gradient-text leading-tight">
          The Future of Web Development
        </h1>
        <p className="text-xl md:text-2xl opacity-80 mb-12 max-w-4xl mx-auto leading-relaxed">
          Meet 0x1 - the lightning-fast TypeScript framework that serves as a drop-in replacement 
          for React and Next.js. Zero hydration cost, extreme performance, and familiar APIs.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <Link href="/features" className="btn btn-primary btn-lg inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get Started
          </Link>
          <Link href="/about" className="btn btn-secondary btn-lg inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documentation
          </Link>
          <Link href="/contact" className="btn btn-outline btn-lg inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub →
          </Link>
        </div>
        <div className="flex items-center justify-center space-x-12 text-sm opacity-70">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">TypeScript</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Bun Runtime</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="font-medium">PWA Ready</span>
          </div>
        </div>
      </div>

      {/* Feature demo cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* State Management */}
        <div className="card rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 gradient-text">State Management</h2>
            <p className="opacity-75 text-lg leading-relaxed">
              0x1 includes simple and powerful state management with React-like hooks.
            </p>
          </div>
          
          <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-xl p-6">
            <Counter 
              initialValue={0} 
              minValue={-10} 
              maxValue={10} 
              label="Try the interactive counter"
            />
          </div>
        </div>
        
        {/* Component Library */}
        <div className="card rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4 gradient-text">Component Library</h2>
            <p className="opacity-75 text-lg leading-relaxed">
              Build UIs with 0x1's lightweight component approach.
            </p>
          </div>
          
          <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-xl p-6 space-y-4">
            <Button variant="primary" text="Primary Button" />
            <Button variant="secondary" text="Secondary Button" />
            <div className="flex items-center space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="demo-checkbox"
                className="h-5 w-5 text-primary rounded focus:ring-primary accent-primary" 
              />
              <label htmlFor="demo-checkbox" className="opacity-75 font-medium">
                Interactive components
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick start guide */}
      <div className="card rounded-2xl shadow-2xl p-10 container-gradient border-2 border-primary/10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-6 gradient-text">Quick Start Guide</h2>
          <p className="text-xl opacity-80 max-w-2xl mx-auto">
            Get started with 0x1 in minutes and experience the future of web development.
          </p>
        </div>
        
        <div className="bg-card/80 backdrop-blur border border-border/40 rounded-xl p-8 shadow-lg">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
              Install 0x1 Framework
            </h3>
            <div className="bg-muted/80 backdrop-blur rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-primary">$</span> bun create 0x1@latest my-project
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
              Start Development
            </h3>
            <div className="bg-muted/80 backdrop-blur rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-primary">$</span> cd my-project && bun run dev
            </div>
          </div>
          
          <div className="text-center">
            <p className="opacity-75 mb-6">Ready to explore more capabilities?</p>
            <a 
              href="/features" 
              className="btn btn-primary btn-lg inline-flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Explore Features
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
