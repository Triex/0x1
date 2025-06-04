import { useState } from '0x1';

interface BuildStep {
  id: string;
  text: string;
  time?: string;
  delay: number;
  type?: 'header' | 'info' | 'success' | 'timing' | 'section' | 'complete';
}

const frameworks = {
  '0x1': {
    name: '0x1 Framework',
    color: 'text-green-400',
    totalTime: '9.17ms',
    steps: [
      { id: '1', text: '════════════════════════', type: 'header' as const, delay: 100 },
      { id: '2', text: '║ BUILDING APPLICATION ║', type: 'header' as const, delay: 150 },
      { id: '3', text: '════════════════════════', type: 'header' as const, delay: 200 },
      { id: '4', text: '', delay: 250 },
      { id: '5', text: '💠 ⚡ Starting parallel initialization...', type: 'info' as const, delay: 300 },
      { id: '6', text: '💠 ✅ Parallel init: 1.2ms', type: 'success' as const, time: '1.2ms', delay: 500 },
      { id: '7', text: '💠 🔍 Ultra-fast discovery...', type: 'info' as const, delay: 700 },
      { id: '8', text: '💠 ✅ Discovery: 1.2ms (5 routes, 10 components)', type: 'success' as const, time: '1.2ms', delay: 900 },
      { id: '9', text: '💠 🚀 Parallel generation...', type: 'info' as const, delay: 1100 },
      { id: '10', text: '[TIMING] Starting parallel generation tasks...', type: 'timing' as const, delay: 1300 },
      { id: '11', text: '[TIMING] 📱 App.js: 0.3ms', type: 'timing' as const, time: '0.3ms', delay: 1400 },
      { id: '12', text: '[Build] 🚀 COMPONENT GENERATION with import fixes...', type: 'info' as const, delay: 1500 },
      { id: '13', text: '[Build] ✅ COMPONENT GENERATION: 15 files in 1.3ms', type: 'success' as const, time: '1.3ms', delay: 1700 },
      { id: '14', text: '[TIMING] 🧩 Components: 1.5ms', type: 'timing' as const, time: '1.5ms', delay: 1800 },
      { id: '15', text: '💠 ✅ Using updated 0x1-router as single source of truth', type: 'success' as const, delay: 1900 },
      { id: '16', text: '💠 ✅ Generated browser-compatible 0x1 framework entry point', type: 'success' as const, delay: 2000 },
      { id: '17', text: '[TIMING] 📋 Framework: 1.7ms', type: 'timing' as const, time: '1.7ms', delay: 2100 },
      { id: '18', text: '[TIMING] 📁 Assets: 1.1ms', type: 'timing' as const, time: '1.1ms', delay: 2200 },
      { id: '19', text: '[Build] 🌈 Processing Tailwind CSS v4...', type: 'info' as const, delay: 2300 },
      { id: '20', text: '[Build] 📄 Found CSS input: ./app/globals.css', type: 'info' as const, delay: 2400 },
      { id: '21', text: '[Build] ✅ CSS cache hit - skipping processing', type: 'success' as const, delay: 2500 },
      { id: '22', text: '[TIMING] 🎨 CSS: 0.8ms', type: 'timing' as const, time: '0.8ms', delay: 2600 },
      { id: '23', text: '[TIMING] 📄 HTML: 0.2ms', type: 'timing' as const, time: '0.2ms', delay: 2700 },
      { id: '24', text: '💠 ✅ Generation: 7.9ms', type: 'success' as const, time: '7.9ms', delay: 2800 },
      { id: '25', text: '', delay: 2900 },
      { id: '26', text: '╭────────────────╮', type: 'complete' as const, delay: 3000 },
      { id: '27', text: '│ Build Complete │', type: 'complete' as const, delay: 3100 },
      { id: '28', text: '╰────────────────╯', type: 'complete' as const, delay: 3200 },
      { id: '29', text: '💠 📦 Output directory: /dist', type: 'info' as const, delay: 3300 },
      { id: '30', text: '💠 🔧 Minification: enabled', type: 'info' as const, delay: 3400 },
      { id: '31', text: '💠 ⚡ Build completed in 9.17ms', type: 'complete' as const, time: '9.17ms', delay: 3500 }
    ]
  },
  nextjs: {
    name: 'Next.js 15',
    color: 'text-orange-400',
    totalTime: '14.3s',
    steps: [
      { id: '1', text: '> next build', type: 'header' as const, delay: 100 },
      { id: '2', text: '', delay: 1500 },
      { id: '3', text: '   ▲ Next.js 15.3.2', type: 'info' as const, delay: 2500 },
      { id: '4', text: '   - Environments: .env', type: 'info' as const, delay: 3000 },
      { id: '5', text: '', delay: 3500 },
      { id: '6', text: '   Creating an optimized production build ...', type: 'info' as const, delay: 4000 },
      { id: '7', text: '', delay: 6500 },
      { id: '8', text: ' ⚠ Compiled with warnings in 4.0s', type: 'info' as const, delay: 9000 },
      { id: '9', text: '', delay: 9500 },
      { id: '10', text: './node_modules/pino/lib/tools.js', type: 'info' as const, delay: 10000 },
      { id: '11', text: "Module not found: Can't resolve 'pino-pretty'", type: 'info' as const, delay: 10200 },
      { id: '12', text: '', delay: 10400 },
      { id: '13', text: 'Import trace for requested module:', type: 'info' as const, delay: 10600 },
      { id: '14', text: './node_modules/@walletconnect/logger/dist/index.es.js', type: 'info' as const, delay: 10800 },
      { id: '15', text: './node_modules/@walletconnect/ethereum-provider/dist/index.es.js', type: 'info' as const, delay: 11000 },
      { id: '16', text: './node_modules/@wagmi/connectors/dist/esm/walletConnect.js', type: 'info' as const, delay: 11200 },
      { id: '17', text: './app/auth/signin/page.tsx', type: 'info' as const, delay: 11400 },
      { id: '18', text: '', delay: 11600 },
      { id: '19', text: ' ✓ Compiled successfully in 14.3s', type: 'success' as const, time: '14.3s', delay: 14300 },
      { id: '20', text: '   Skipping validation of types', type: 'info' as const, delay: 14500 },
      { id: '21', text: '   Skipping linting', type: 'info' as const, delay: 14700 },
      { id: '22', text: ' ✓ Collecting page data', type: 'success' as const, delay: 16000 },
      { id: '23', text: ' ✓ Generating static pages (8/8)', type: 'success' as const, delay: 18500 },
      { id: '24', text: ' ✓ Collecting build traces', type: 'success' as const, delay: 20000 },
      { id: '25', text: ' ✓ Finalizing page optimization', type: 'success' as const, delay: 21500 },
      { id: '26', text: '', delay: 22000 },
      { id: '27', text: 'Route (app)                                 Size  First Load JS', type: 'info' as const, delay: 22200 },
      { id: '28', text: '┌ ○ /                                      809 B         102 kB', type: 'success' as const, delay: 22400 },
      { id: '29', text: '├ ○ /_not-found                            152 B         101 kB', type: 'success' as const, delay: 22600 },
      { id: '30', text: '├ ○ /about                                 152 B         101 kB', type: 'success' as const, delay: 22800 },
      { id: '31', text: '├ ○ /contact                               152 B         101 kB', type: 'success' as const, delay: 23000 },
      { id: '32', text: '├ ○ /dashboard                             152 B         101 kB', type: 'success' as const, delay: 23200 },
      { id: '33', text: '└ ○ /features                              152 B         101 kB', type: 'success' as const, delay: 23400 },
      { id: '34', text: '+ First Load JS shared by all             101 kB', type: 'info' as const, delay: 23600 },
      { id: '35', text: '  ├ chunks/4bd1b696-52a6696c08e3276c.js  53.2 kB', type: 'info' as const, delay: 23800 },
      { id: '36', text: '  ├ chunks/684-ead481e1ff98829d.js         46 kB', type: 'info' as const, delay: 24000 },
      { id: '37', text: '  └ other shared chunks (total)          1.88 kB', type: 'info' as const, delay: 24200 },
      { id: '38', text: '', delay: 24400 },
      { id: '39', text: '○  (Static)  prerendered as static content', type: 'info' as const, delay: 24600 },
      { id: '40', text: '', delay: 24800 }
    ]
  }
};

export default function PerformanceBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentFramework, setCurrentFramework] = useState<'0x1' | 'nextjs' | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);
  const [animatedSteps, setAnimatedSteps] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const runBenchmark = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setVisibleSteps([]);
    setAnimatedSteps(new Set());
    setProgress(0);

    // Run 0x1 framework first
    setCurrentFramework('0x1');
    await runFrameworkBenchmark('0x1');
    
    // Small delay between frameworks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run Next.js
    setCurrentFramework('nextjs');
    setVisibleSteps([]);
    setAnimatedSteps(new Set());
    setProgress(0);
    await runFrameworkBenchmark('nextjs');
    
    setIsRunning(false);
  };

  const runFrameworkBenchmark = async (framework: '0x1' | 'nextjs') => {
    const { steps } = frameworks[framework];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await new Promise(resolve => setTimeout(resolve, step.delay - (i > 0 ? steps[i-1].delay : 0)));
      
      setVisibleSteps(prev => [...prev, step.id]);
      setAnimatedSteps(prev => new Set([...prev, step.id]));
      setProgress(((i + 1) / steps.length) * 100);
    }
  };

  const getStepClassName = (step: BuildStep, isNewlyAdded: boolean) => {
    const baseClasses = 'font-mono text-sm leading-relaxed';
    const animationClass = isNewlyAdded ? 'animate-fade-in' : '';
    
    switch (step.type) {
      case 'header':
        return `${baseClasses} text-blue-400 font-bold ${animationClass}`;
      case 'info':
        return `${baseClasses} text-gray-300 ${animationClass}`;
      case 'success':
        return `${baseClasses} text-green-400 ${animationClass}`;
      case 'timing':
        return `${baseClasses} text-cyan-400 ${animationClass}`;
      case 'section':
        return `${baseClasses} text-purple-400 font-semibold ${animationClass}`;
      case 'complete':
        return `${baseClasses} text-yellow-400 font-bold ${animationClass}`;
      default:
        return `${baseClasses} text-gray-300 ${animationClass}`;
    }
  };

  const currentFrameworkData = currentFramework ? frameworks[currentFramework] : null;

  return (
    <div className="bg-muted/50 backdrop-blur border border-border/40 rounded-2xl p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">⚡</span>
          Performance Benchmark
        </h3>
        <p className="opacity-75 mb-6 text-lg">
          See the difference in build times between 0x1 and traditional frameworks.
        </p>
        
        <button 
          onClick={runBenchmark}
          disabled={isRunning}
          className={`btn btn-primary btn-lg transition-all duration-200 ${
            isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
          }`}
        >
          {isRunning ? '🔄 Running Benchmark...' : '🚀 Run Performance Benchmark'}
        </button>
      </div>
      
      {currentFramework && (
        <div className="mt-6">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-75">
                Building with {currentFrameworkData?.name}
              </span>
              <span className="text-sm font-mono opacity-75">
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-secondary/60 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-300 shadow-lg ${
                  currentFramework === '0x1' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Terminal output */}
          <div className="bg-gray-900 rounded-lg p-6 min-h-[400px] max-h-[500px] overflow-y-auto border border-gray-700">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm opacity-60 font-mono">
                Terminal - {currentFrameworkData?.name}
              </span>
            </div>
            
            <div className="space-y-1">
              {currentFrameworkData?.steps
                .filter(step => visibleSteps.includes(step.id))
                .map((step, index, filteredSteps) => {
                  const isNewlyAdded = index === filteredSteps.length - 1;
                  return (
                    <div 
                      key={step.id}
                      className={`${getStepClassName(step, isNewlyAdded)} flex items-center justify-between`}
                    >
                      <span>{step.text}</span>
                      {step.time && (
                        <span className="text-yellow-300 font-bold ml-4 bg-yellow-300/10 px-2 py-1 rounded">
                          {step.time}
                        </span>
                      )}
                    </div>
                  );
                })}
              
              {/* Cursor */}
              {visibleSteps.length > 0 && (
                <div className="flex items-center">
                  <span className="text-green-400 font-mono">$ </span>
                  <div className="w-2 h-4 bg-green-400 ml-1 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {/* Results summary */}
          {progress === 100 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    {currentFrameworkData?.name} Build Complete
                  </h4>
                  <p className="opacity-75">
                    {currentFramework === '0x1' 
                      ? 'Lightning-fast build with zero dependencies' 
                      : 'Traditional framework build process'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${currentFrameworkData?.color}`}>
                    {currentFrameworkData?.totalTime}
                  </div>
                  <div className="text-sm opacity-75">Total Time</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 