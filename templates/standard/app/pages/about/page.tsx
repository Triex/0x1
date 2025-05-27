/**
 * 0x1 Standard App - About Page
 * Beautiful modern design with enhanced features
 */

import { Card } from "../../../components/Card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl font-bold mb-6 gradient-text">
          About 0x1 Framework
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A minimal, high-performance web framework designed to provide the best developer 
          experience with zero overhead. Built on Bun for lightning-fast performance.
        </p>
      </div>

      {/* Mission Section */}
      <Card className="mb-12 animate-slide-up">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 gradient-text-accent">Our Mission</h2>
          <div className="space-y-4 text-lg">
            <p>
              0x1 is designed to make web development straightforward and enjoyable, 
              focusing on what matters most: building great web applications without 
              unnecessary complexity.
            </p>
            <p>
              Our goal is to provide developers with a framework that combines the 
              simplicity of modern web standards with the performance of cutting-edge 
              runtime technology.
            </p>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">App Directory Structure</h3>
            <p className="text-muted-foreground">
              Modern file-based routing with nested layouts, making it easy to organize 
              and scale your application architecture.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Zero Dependencies</h3>
            <p className="text-muted-foreground">
              Minimal bundle size with no external dependencies, ensuring fast load times 
              and reduced security surface area.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">TypeScript-First</h3>
            <p className="text-muted-foreground">
              Built with TypeScript for type safety and improved developer experience 
              with intelligent code completion.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Bun-Powered</h3>
            <p className="text-muted-foreground">
              Leveraging Bun's speed and efficiency for development and production, 
              delivering unmatched performance.
            </p>
          </div>
        </Card>
      </div>

      {/* Philosophy Section */}
      <Card className="container-gradient mb-12">
        <div className="p-12 text-center">
          <h2 className="text-4xl font-bold mb-8 gradient-text">Our Philosophy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3">Performance First</h3>
              <p className="text-muted-foreground">
                Every decision is made with performance in mind, from runtime choice to API design.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3">Developer Experience</h3>
              <p className="text-muted-foreground">
                Intuitive APIs and excellent tooling make development a joy, not a chore.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-bold mb-3">Simplicity</h3>
              <p className="text-muted-foreground">
                Complex problems deserve simple solutions. We avoid unnecessary abstractions.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <a 
          href="/" 
          className="btn btn-primary btn-lg"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
