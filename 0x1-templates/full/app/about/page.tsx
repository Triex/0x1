/**
 * About page component
 * Similar to Next.js 15's app/about/page.tsx
 */

export default function AboutPage() {
  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-20 text-center">
          <div className="mb-8">
            <span className="badge badge-primary mb-6 text-sm px-4 py-2">Our Story</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-8 gradient-text leading-tight">
            About 0x1
          </h1>
          <p className="text-xl md:text-2xl opacity-80 max-w-4xl mx-auto leading-relaxed">
            The modern ultra-minimal framework for TypeScript - built by developers, for developers who value simplicity and performance.
          </p>
        </div>
        
        {/* About sections */}
        <div className="space-y-16">
          <div className="card rounded-2xl shadow-2xl p-10 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-6 gradient-text">Our Mission</h2>
                <p className="text-lg opacity-80 leading-relaxed">
                  0x1 was created with a singular purpose: to provide developers with an ultra-lightweight, 
                  blazing fast framework that strips away all the unnecessary complexity and bloat that has 
                  infected modern web development.
                </p>
              </div>
              
              <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-center gradient-text">We believe web development should be:</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2">Simple</h4>
                      <p className="opacity-75">No complex toolchains or configurations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2">Fast</h4>
                      <p className="opacity-75">From development to production</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2">Efficient</h4>
                      <p className="opacity-75">Small bundle sizes, minimal dependencies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2">Modern</h4>
                      <p className="opacity-75">TypeScript, ES modules, and modern JavaScript features</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-2">Flexible</h4>
                      <p className="opacity-75">Works with your existing tools and workflows</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card rounded-2xl shadow-2xl p-10 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-6 gradient-text">The Team</h2>
              <p className="text-lg opacity-80 max-w-3xl mx-auto leading-relaxed">
                0x1 is developed and maintained by a small team of passionate developers who are committed 
                to creating tools that make web development more enjoyable and productive.
              </p>
            </div>
            
            <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">TriexDev</h3>
              <p className="text-lg opacity-80 mb-6 max-w-2xl mx-auto">
                A guy focused on creating a framework that respects 
                developers and their time. Passionate about performance, simplicity, and great developer experience.
              </p>
              <a 
                href="https://github.com/Triex" 
                className="btn btn-primary btn-lg inline-flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
          
          <div className="card rounded-2xl shadow-2xl p-10 container-gradient border-2 border-primary/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-card/80 backdrop-blur border border-border/40 rounded-2xl p-8">
                  <div className="text-center mb-8">
                    <div className="text-6xl font-bold mb-4 gradient-text">0x1</div>
                    <p className="text-lg opacity-80">Hexadecimal for 1</p>
                  </div>
                  
                  <div className="bg-muted/50 backdrop-blur rounded-xl p-6">
                    <blockquote className="text-xl italic text-center leading-relaxed opacity-90">
                      "The best code is the code you don't have to write."
                    </blockquote>
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-6 gradient-text">Why 0x1?</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg opacity-80 leading-relaxed mb-6">
                    The name "0x1" is derived from the hexadecimal representation of the number 1 (0x1). 
                    This reflects our philosophy of starting from the smallest, most fundamental unit and 
                    building up only what is necessary - no more, no less.
                  </p>
                  <p className="text-lg opacity-80 leading-relaxed mb-8">
                    In a world of heavyweight frameworks that try to do everything, 0x1 stands out by doing 
                    only what's essential - and doing it exceptionally well.
                  </p>
                  
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 mb-6">
                    <p className="text-lg opacity-90 mb-4">
                      0x1 is open source and free to use for any purpose. We welcome contributions from 
                      the community and are committed to maintaining the framework's core principles of 
                      simplicity, performance, and developer experience.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <span className="badge badge-primary">Open Source</span>
                      <span className="badge badge-primary">Community Driven</span>
                      <span className="badge badge-primary">Performance First</span>
                    </div>
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
