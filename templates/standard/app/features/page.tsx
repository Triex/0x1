/**
 * 0x1 Standard App - Features Page
 * Showcase of framework features with beautiful design
 */

import { Card } from "../../components/Card";

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl font-bold mb-6 gradient-text">
          Framework Features
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover the powerful features that make 0x1 the perfect choice for modern web development.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Built on Bun runtime for incredible performance and instant hot reloading during development.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">TypeScript Ready</h3>
            <p className="text-muted-foreground">
              Full TypeScript support with intelligent code completion and type safety out of the box.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Responsive Design</h3>
            <p className="text-muted-foreground">
              Beautiful responsive layouts that work perfectly on all devices and screen sizes.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Zero Config</h3>
            <p className="text-muted-foreground">
              Start building immediately with sensible defaults and minimal configuration required.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Developer Experience</h3>
            <p className="text-muted-foreground">
              Intuitive APIs, excellent error messages, and powerful development tools.
            </p>
          </div>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Production Ready</h3>
            <p className="text-muted-foreground">
              Optimized builds, excellent performance, and battle-tested in production environments.
            </p>
          </div>
        </Card>
      </div>

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