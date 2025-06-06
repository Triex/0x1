/**
 * Features page component
 * Similar to Next15's app/features/page.tsx
 */

import PerformanceBenchmark from '../../components/PerformanceBenchmark';

export default function FeaturesPage() {
  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-20 text-center">
          <div className="mb-8">
            <span className="badge badge-primary mb-6 text-sm px-4 py-2">Framework Features</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-8 gradient-text leading-tight">
            Powerful Features
          </h1>
          <p className="text-xl md:text-2xl opacity-80 max-w-3xl mx-auto leading-relaxed">
            Explore what makes 0x1 powerful yet lightweight - every feature designed with performance and developer experience in mind.
          </p>
        </div>
        
        {/* Feature sections */}
        <div className="space-y-16">
          {/* Performance */}
          <div className="card rounded-2xl shadow-2xl p-10 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-6 gradient-text">Blazing Fast Performance</h2>
                <p className="text-lg opacity-80 leading-relaxed">
                  Built on Bun, 0x1 delivers exceptional performance for both development and production. 
                  Experience sub-second builds and lightning-fast hot reloads.
                </p>
              </div>
              
              <PerformanceBenchmark />
            </div>
          </div>
          
          {/* Zero Dependencies */}
          <div className="card rounded-2xl shadow-2xl p-10 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-6 gradient-text">Zero External Dependencies</h2>
              <p className="text-lg opacity-80 max-w-2xl mx-auto leading-relaxed">
                The core 0x1 framework has zero npm dependencies, keeping your projects lightweight and secure.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-2xl p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-red-500 dark:text-red-400">Traditional Framework</h3>
                </div>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span className="opacity-80">Dependencies:</span>
                    <span className="font-bold text-red-500">250+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Install size:</span>
                    <span className="font-bold text-red-500">~300MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Build time:</span>
                    <span className="font-bold text-red-500">15-30s</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-2xl p-8 text-center shadow-xl">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 gradient-text">0x1 Framework</h3>
                </div>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span className="opacity-80">Dependencies:</span>
                    <span className="font-bold text-green-500">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Install size:</span>
                    <span className="font-bold text-green-500">~120KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Build time:</span>
                    <span className="font-bold text-green-500">&lt;1s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* TypeScript First */}
          <div className="card rounded-2xl shadow-2xl p-10 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-2xl p-6 overflow-hidden">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="ml-4 text-sm opacity-60 font-mono">Button.tsx</span>
                    </div>
                  </div>
                  <pre className="text-sm font-mono overflow-x-auto"><code>{`// Strongly typed components
interface ButtonProps {
  onClick: () => void;
  children: string;
  variant?: 'primary' | 'secondary';
}

function Button({ 
  onClick, 
  children, 
  variant = 'primary' 
}: ButtonProps) {
  const className = \`btn \${
    variant === 'primary' 
      ? 'btn-primary' 
      : 'btn-secondary'
  }\`;
  
  return (
    <button 
      className={className} 
      onClick={onClick}
    >
      {children}
    </button>
  );
}`}</code></pre>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-6 gradient-text">TypeScript First</h2>
                <p className="text-lg opacity-80 leading-relaxed mb-8">
                  Enjoy full TypeScript support with zero configuration. Built-in type safety, 
                  intelligent IntelliSense, and seamless developer experience from day one.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="opacity-80">Zero configuration required</span>
                  </div>
                  <div className="flex items-center gap-3 text-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="opacity-80">Intelligent type inference</span>
                  </div>
                  <div className="flex items-center gap-3 text-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="opacity-80">Enhanced developer experience</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
