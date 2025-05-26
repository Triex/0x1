/**
 * 0x1 Framework - Professional Starter Template
 * Modern app with beautiful black-purple theme
 */
import { Counter } from '../components/Counter';
import { ThemeToggle } from '../components/ThemeToggle';

// Home page component with modern styling
export function HomePage() {
  return (
    <div className="container-gradient flex-1 pb-10 py-8 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="animate-fade-in max-w-5xl mx-auto text-center mb-0">
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-4">
            Welcome to <span className="gradient-text">0x1 Framework</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The lightning-fast web development framework powered by Bun
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Blazing Fast</h3>
            <p className="text-muted-foreground text-sm">Built on top of Bun for incredible performance and development speed</p>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Beautiful UI</h3>
            <p className="text-muted-foreground text-sm">Modern design system with dark mode and stunning animations</p>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Developer Friendly</h3>
            <p className="text-muted-foreground text-sm">TypeScript support, server components, and streamlined workflow</p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="glass-panel p-8 mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Interactive Demo</h2>

          <div className="mb-8">
            <Counter
              initialValue={0}
              minValue={-10}
              maxValue={10}
              label="Try out this interactive counter component!"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Toggle Theme:</span>
              <ThemeToggle iconOnly={true} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm">Primary Action</button>
              <button className="btn btn-secondary btn-sm">Secondary</button>
              <button className="btn btn-ghost btn-sm">Ghost</button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Get Started Now</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Edit <code className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">app/page.tsx</code> to customize this page and start building your next great project
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/Triex/0x1"
              target="_blank"
              className="btn btn-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="mr-2">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://bun.sh"
              target="_blank"
              className="btn btn-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" />
              </svg>
              Bun Docs
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Explicitly export as default for compatibility with different import styles
export default HomePage;
