/**
 * 0x1 Standard App - Home Page
 * Beautiful modern design with enhanced features
 */

import { Card } from "../components/Card";
import { Counter } from "../components/Counter";

// Home page component
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl font-bold mb-6 gradient-text">
          Welcome to 0x1 Standard
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          A lightning-fast web framework powered by Bun with enhanced features, 
          beautiful components, and production-ready architecture.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/features" 
            className="btn btn-primary btn-lg"
          >
            Explore Features
          </a>
          <a 
            href="/about" 
            className="btn btn-secondary btn-lg"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Built on Bun runtime for incredible performance and instant hot reloading.
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
              Full TypeScript support with intelligent code completion and type safety.
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
              Beautiful responsive layouts that work perfectly on all devices.
            </p>
          </div>
        </Card>
      </div>

      {/* Interactive Demo Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card className="glass-panel">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 gradient-text-accent">Interactive Counter</h2>
            <p className="text-muted-foreground mb-6">
              Try out our reactive state management with this interactive counter component.
            </p>
            <Counter />
          </div>
        </Card>

        <Card className="glass-panel">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 gradient-text-accent">Getting Started</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Edit Components</p>
                  <p className="text-sm text-muted-foreground">Modify <code className="bg-muted px-1 rounded">app/page.tsx</code> to customize this page</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Add Routes</p>
                  <p className="text-sm text-muted-foreground">Create new pages in the <code className="bg-muted px-1 rounded">app/</code> directory</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Deploy</p>
                  <p className="text-sm text-muted-foreground">Build and deploy your app with <code className="bg-muted px-1 rounded">bun run build</code></p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Features List */}
      <Card className="container-gradient">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Standard Template Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>App directory structure with file-based routing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Enhanced component library with beautiful styling</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Tailwind CSS v4 with custom design system</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Professional light and dark mode themes</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Interactive components with state management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Glass-morphism effects and animations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Responsive design with mobile-first approach</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Production-ready architecture and performance</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
