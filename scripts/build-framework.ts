/**
 * 0x1 Framework Build Script - Production Optimized
 * Builds only essential framework files for distribution with production optimizations
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Generate cache-busting hash
function generateHash(content: string): string {
  return Bun.hash(content).toString(16).slice(0, 8);
}

// Production console.log removal plugin
const consoleLogRemovalPlugin = {
  name: 'remove-console-logs',
  setup(build: any) {
    build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args: any) => {
      const contents = await Bun.file(args.path).text();
      
      // CRITICAL FIX: Only remove console.log statements, don't modify JSX or function calls
      // Be extremely careful with regex to avoid breaking JSX syntax
      const processedContents = contents
        // Only match standalone console.log statements (not within JSX)
        .replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '/* console.log removed */')
        // Handle console.log with line-ending context but preserve JSX
        .replace(/(?<!jsx|jsxs|jsxDEV|createElement)\s*console\.log\([^)]*\);?(?=\s*[\r\n])/g, '/* console.log removed */')
        // Handle debug statements similarly
        .replace(/^\s*console\.debug\([^)]*\);?\s*$/gm, '/* console.debug removed */')
        .replace(/(?<!jsx|jsxs|jsxDEV|createElement)\s*console\.debug\([^)]*\);?(?=\s*[\r\n])/g, '/* console.debug removed */');
      
      return {
        contents: processedContents,
        loader: args.path.endsWith('.tsx') ? 'tsx' : 
               args.path.endsWith('.ts') ? 'ts' : 
               args.path.endsWith('.jsx') ? 'jsx' : 'js'
      };
    });
  }
};

async function buildFramework() {
  try {
    console.log("🚀 Building 0x1 framework (production optimized)...");

    const srcDir = resolve("src");
    const distDir = resolve("dist");

    // Clean dist directory
    console.log("🧹 Cleaning dist directory...");
    if (existsSync("dist")) {
      await Bun.spawn(['rm', '-rf', 'dist']).exited;
    }
    await Bun.spawn(['mkdir', '-p', 'dist']).exited;

    // Copy types directory to dist
    console.log("📝 Copying type definitions...");
    if (existsSync("types")) {
      await Bun.spawn(['cp', '-r', 'types', 'dist/']).exited;
      // Also create React compatibility types in dist
      await Bun.spawn(['mkdir', '-p', 'dist/react']).exited;
      await Bun.write(
        "dist/react/jsx-runtime.d.ts", 
        'export * from "../types/jsx-runtime.js";'
      );
      await Bun.write(
        "dist/react/jsx-dev-runtime.d.ts", 
        'export * from "../types/jsx-runtime.js";'
      );
    }

    // Create minimal dist structure
    Bun.spawn(["mkdir", "-p", distDir]);
    Bun.spawn(["mkdir", "-p", join(distDir, "core")]);
    Bun.spawn(["mkdir", "-p", join(distDir, "types")]);

    console.log("📦 Building core framework bundle with production optimizations...");

    // Production build configuration
    const productionBuildConfig = {
      target: "browser" as const,
      format: "esm" as const,
      minify: true,
      splitting: true, // Enable code splitting for parallel loading
      plugins: [consoleLogRemovalPlugin],
      loader: {
        ".ts": "ts" as const,
        ".tsx": "tsx" as const,
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        '__DEV__': 'false'
      }
    };

    // Create optimized package.json with cache busting
    const buildTime = Date.now();
    const packageJson = {
      name: "0x1",
      version: "0.1.0",
      type: "module",
      main: "index.js",
      types: "types/index.d.ts",
      exports: {
        ".": {
          types: "./types/index.d.ts",
          import: "./index.js",
          default: "./index.js",
        },
        "./link": {
          types: "./types/link.d.ts",
          import: "./link.js",
          default: "./link.js",
        },
        "./router": {
          types: "./types/router.d.ts",
          import: "./router.js",
          default: "./router.js",
        },
        "./core/*": {
          types: "./types/*.d.ts",
          import: "./core/*.js",
          default: "./core/*.js",
        },
        "./jsx-runtime": {
          types: "./types/jsx-runtime.d.ts",
          import: "./jsx-runtime.js",
          default: "./jsx-runtime.js",
        },
        "./jsx-dev-runtime": {
          types: "./types/jsx-runtime.d.ts",
          import: "./jsx-dev-runtime.js",
          default: "./jsx-dev-runtime.js",
        },
        "./jsx": {
          types: "./types/jsx.d.ts"
        },
        "./store": {
          types: "./types/store.d.ts",
          import: "./core/store.js",
          default: "./core/store.js",
        }
      },
      buildTime // Add build timestamp for cache busting
    };

    await Bun.write(
      join(distDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    console.log("📦 Building main framework bundle...");

    // Build main framework bundle with production optimizations
    const buildResult = await Bun.build({
      entrypoints: [join(srcDir, "index.ts")],
      outdir: distDir,
      ...productionBuildConfig
    });

    if (!buildResult.success) {
      console.error("Build errors:", buildResult.logs);
      throw new Error("Main bundle build failed");
    }

    // Add cache busting to main bundle
    const mainBundlePath = join(distDir, "index.js");
    if (existsSync(mainBundlePath)) {
      const content = await Bun.file(mainBundlePath).text();
      const hash = generateHash(content);
      const hashedPath = join(distDir, `index-${hash}.js`);
      await Bun.write(hashedPath, content);
      
      // Create a loader that points to the hashed version
      await Bun.write(mainBundlePath, `export * from './index-${hash}.js';`);
      console.log(`✅ Main bundle with cache busting: index-${hash}.js`);
    }

    console.log("📦 Building core modules...");

    // Only build essential core files with production optimizations
    const essentialCoreFiles = [
      'hooks.ts',
      'component.ts',
      'navigation.ts',
      'error-boundary.ts',
      'metadata.ts',
      'head.ts',
      'directives.ts',
      'pwa.ts'
    ];

    // Build core modules in parallel for better performance
    const corePromises = essentialCoreFiles.map(async (file) => {
      const tsPath = join(srcDir, "core", file);

      if (existsSync(tsPath)) {
        console.log(`Building ${file}...`);

        const { success, outputs } = await Bun.build({
          entrypoints: [tsPath],
          outdir: distDir,
          ...productionBuildConfig
        });

        if (success && outputs.length > 0) {
          // Add cache busting to core modules
          const outputPath = outputs[0].path;
          let content = await Bun.file(outputPath).text();
          
          // CRITICAL FIX: Apply browser compatibility for hooks.js (same as BuildOrchestrator)
          if (file === 'hooks.ts') {
            console.log('🔧 Applying browser compatibility to hooks.js...');
            
            // CRITICAL FIX: Don't add broken browser compatibility - the original hooks work fine!
            // Just add the basic browser compatibility without fallback hooks
            const browserCompatCode = `

// CRITICAL FIX: Browser compatibility that waits for all exports to be defined
if (typeof window !== 'undefined' && !window['__0x1_hooks_init_done']) {
  // Wait for the module to fully load before accessing exports
  setTimeout(function() {
    try {
      // Initialize React-compatible global context
      window.React = window.React || {};
      
      // CRITICAL FIX: Access hooks from the module scope safely
      // Use try-catch to handle cases where hooks might not be available yet
      const moduleScope = (function() {
        try {
          // Try to access hooks from the current module scope
          return {
            useState: typeof useState !== 'undefined' ? useState : null,
            useEffect: typeof useEffect !== 'undefined' ? useEffect : null,
            useLayoutEffect: typeof useLayoutEffect !== 'undefined' ? useLayoutEffect : null,
            useMemo: typeof useMemo !== 'undefined' ? useMemo : null,
            useCallback: typeof useCallback !== 'undefined' ? useCallback : null,
            useRef: typeof useRef !== 'undefined' ? useRef : null,
            useClickOutside: typeof useClickOutside !== 'undefined' ? useClickOutside : null,
            useFetch: typeof useFetch !== 'undefined' ? useFetch : null,
            useForm: typeof useForm !== 'undefined' ? useForm : null,
            useLocalStorage: typeof useLocalStorage !== 'undefined' ? useLocalStorage : null,
            enterComponentContext: typeof enterComponentContext !== 'undefined' ? enterComponentContext : function() {},
            exitComponentContext: typeof exitComponentContext !== 'undefined' ? exitComponentContext : function() {},
            triggerComponentUpdate: typeof triggerComponentUpdate !== 'undefined' ? triggerComponentUpdate : function() {}
          };
        } catch (error) {
          console.warn('[0x1 Hooks] Could not access module scope:', error);
          return {};
        }
      })();
      
      // Only assign hooks that are actually available
      Object.keys(moduleScope).forEach(function(hookName) {
        if (moduleScope[hookName] && typeof moduleScope[hookName] === 'function') {
          window[hookName] = moduleScope[hookName];
          if (window.React) {
            window.React[hookName] = moduleScope[hookName];
          }
        }
      });
      
      // Set the context functions that JSX runtime looks for
      window.__0x1_enterComponentContext = moduleScope.enterComponentContext || function() {};
      window.__0x1_exitComponentContext = moduleScope.exitComponentContext || function() {};
      window.__0x1_triggerUpdate = moduleScope.triggerComponentUpdate || function() {};
      
      globalThis.__0x1_enterComponentContext = window.__0x1_enterComponentContext;
      globalThis.__0x1_exitComponentContext = window.__0x1_exitComponentContext;
      
      // Global hooks registry with the available hooks
      window.__0x1_hooks = Object.assign({
        isInitialized: true,
        contextReady: true,
        enterComponentContext: window.__0x1_enterComponentContext,
        exitComponentContext: window.__0x1_exitComponentContext,
        triggerUpdate: window.__0x1_triggerUpdate
      }, moduleScope);
      
      console.log('[0x1 Hooks] IMMEDIATE browser compatibility initialized (production build)');
      console.log('[0x1 Hooks] Component context functions available for JSX runtime');
      console.log('[0x1 Hooks] Browser-compatible hooks active (no context checking)');
      
      // Component context ready flag
      window.__0x1_component_context_ready = true;
      
    } catch (error) {
      console.error('[0x1 Hooks] Browser compatibility initialization failed:', error);
      
      // Fallback: create minimal working hooks to prevent total failure
      const createFallbackHook = function(hookName) {
        return function() {
          console.warn('[0x1 Hooks] Using fallback for ' + hookName + ' - full hooks system failed to initialize');
          if (hookName === 'useState') {
            return [null, function() {}];
          }
          return function() {};
        };
      };
      
      window.useState = createFallbackHook('useState');
      window.useEffect = createFallbackHook('useEffect');
      window.__0x1_hooks_init_done = true;
      window.__0x1_component_context_ready = true;
    }
  }, 0); // Execute after current execution stack
}
`;
            
            // Append browser compatibility code
            content += browserCompatCode;
            
            console.log('✅ Browser compatibility added to hooks.js');
          }
          
          const hash = generateHash(content);
          const fileName = file.replace('.ts', '');
          const hashedPath = join(distDir, `${fileName}-${hash}.js`);
          
          await Bun.write(hashedPath, content);
          // Create loader pointing to hashed version
          await Bun.write(outputPath, `export * from './${fileName}-${hash}.js';`);
          
          console.log(`✅ Built ${fileName}-${hash}.js`);
          return true;
        } else {
          console.warn(`⚠️ Failed to build ${file}`);
          return false;
        }
      }
      return false;
    });

    await Promise.all(corePromises);

    console.log("📦 Building Link component...");

    // Build Link component with production optimizations
    const linkPath = join(srcDir, "link.ts");
    if (existsSync(linkPath)) {
      const { success, outputs } = await Bun.build({
        entrypoints: [linkPath],
        outdir: distDir,
        ...productionBuildConfig
      });

      if (success && outputs.length > 0) {
        // Add cache busting to link component
        const outputPath = outputs[0].path;
        const content = await Bun.file(outputPath).text();
        const hash = generateHash(content);
        const hashedPath = join(distDir, `link-${hash}.js`);
        
        await Bun.write(hashedPath, content);
        // CRITICAL FIX: Re-export both named and default exports for Link
        await Bun.write(outputPath, `export * from './link-${hash}.js';\nexport { default } from './link-${hash}.js';`);
        
        console.log(`✅ Built link-${hash}.js`);
      } else {
        console.warn("⚠️ Failed to build link.js");
      }
    }

    console.log("📦 Building JSX runtime...");

    // Build JSX runtime files from our ONE SOURCE OF TRUTH with production optimizations
    const jsxRuntimePath = join(srcDir, "jsx", "runtime.ts");

    if (existsSync(jsxRuntimePath)) {
      const { success, outputs } = await Bun.build({
        entrypoints: [jsxRuntimePath],
        outdir: distDir,
        ...productionBuildConfig
      });

      if (!success) {
        throw new Error("JSX runtime build failed");
      }
      
      // Add cache busting to JSX runtime
      if (outputs.length > 0) {
        const outputPath = outputs[0].path;
        const content = await Bun.file(outputPath).text();
        const hash = generateHash(content);
        const hashedPath = join(distDir, `jsx-runtime-${hash}.js`);
        const targetPath = join(distDir, "jsx-runtime.js");
        
        await Bun.write(hashedPath, content);
        await Bun.write(targetPath, `export * from './jsx-runtime-${hash}.js';`);
        
        console.log(`✅ JSX runtime built with cache busting: jsx-runtime-${hash}.js`);
      }
    }

    // Create jsx-dev-runtime.js that points to the same optimized runtime
    const jsxRuntimeContent = `export * from './jsx-runtime.js';`;
    await Bun.write(join(distDir, "jsx-dev-runtime.js"), jsxRuntimeContent);
    console.log("✅ JSX dev runtime created (points to production runtime)");

    console.log("📦 Building browser scripts...");

    // Build live-reload script from TypeScript source with production optimizations
    const liveReloadTsPath = join(srcDir, "browser", "live-reload.ts");
    const liveReloadJsPath = join(srcDir, "browser", "live-reload.js");
    
    if (existsSync(liveReloadTsPath)) {
      const { success, outputs } = await Bun.build({
        entrypoints: [liveReloadTsPath],
        outdir: distDir,
        ...productionBuildConfig
      });

      if (success && outputs.length > 0) {
        const content = await Bun.file(outputs[0].path).text();
        const hash = generateHash(content);
        const hashedPath = join(distDir, `live-reload-${hash}.js`);
        
        await Bun.write(hashedPath, content);
        await Bun.write(join(distDir, "live-reload.js"), `export * from './live-reload-${hash}.js';`);
        
        console.log(`✅ Built live-reload-${hash}.js from TypeScript source`);
      }
    } else if (existsSync(liveReloadJsPath)) {
      // Fallback to existing JS file with optimization
      const content = await Bun.file(liveReloadJsPath).text();
      const optimizedContent = content
        .replace(/console\.log\([^;]*\);?/g, '/* console.log removed */;')
        .replace(/console\.log\([^)]*\)/g, '/* console.log removed */');
      
      const hash = generateHash(optimizedContent);
      const hashedPath = join(distDir, `live-reload-${hash}.js`);
      
      await Bun.write(hashedPath, optimizedContent);
      await Bun.write(join(distDir, "live-reload.js"), `export * from './live-reload-${hash}.js';`);
      
      console.log(`✅ Built live-reload-${hash}.js from existing source`);
    }

    console.log("📦 Copying essential type definitions...");

    // Skip TypeScript compilation and just copy essential types manually
    // This avoids generating unnecessary declaration files for templates, etc.

    // Copy only essential type definitions
    const essentialTypes = [
      "index.d.ts",
      "jsx.d.ts", 
      "jsx-runtime.d.ts",
      "link.d.ts"
    ];

    const typesDir = join("types");
    if (existsSync(typesDir)) {
      for (const typeFile of essentialTypes) {
        const srcPath = join(typesDir, typeFile);
        const destPath = join(distDir, "types", typeFile);
        
        if (existsSync(srcPath)) {
          const content = await Bun.file(srcPath).text();
          await Bun.write(destPath, content);
          console.log(`✅ Copied ${typeFile}`);
        }
      }
    }

    console.log("📦 Building standalone packages...");

    // Build @0x1js/tailwind-handler package
    console.log("Building @0x1js/tailwind-handler...");
    const tailwindHandlerSrc = resolve("0x1-experimental/tailwind-handler");
    const tailwindHandlerDist = join(tailwindHandlerSrc, "dist");
    
    // Clean and create dist directory for TailwindHandler
    if (existsSync(tailwindHandlerDist)) {
      await Bun.spawn(['rm', '-rf', tailwindHandlerDist]).exited;
    }
    await Bun.spawn(['mkdir', '-p', tailwindHandlerDist]).exited;
    
    const tailwindHandlerBuildResult = await Bun.build({
      entrypoints: [join(tailwindHandlerSrc, "TailwindHandler.ts")],
      outdir: tailwindHandlerDist,
      target: "bun", // Optimized for Bun runtime
      format: "esm",
      minify: true,
      splitting: false, // Single file for maximum performance
      plugins: [consoleLogRemovalPlugin], // Remove console logs in production
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });
    
    if (!tailwindHandlerBuildResult.success) {
      console.warn("⚠️ @0x1js/tailwind-handler build failed, but framework build continues");
      console.error("TailwindHandler build errors:", tailwindHandlerBuildResult.logs);
    } else {
      // Generate TypeScript declarations
      const declarationContent = `/**
 * @0x1js/tailwind-handler - Lightning-fast Tailwind CSS processor
 * Built for Bun 1.2+ with native performance optimizations
 */

export interface TailwindConfig {
  enabled: boolean;
  inputPath: string;
  outputPath: string;
  configPath?: string;
  darkMode?: 'class' | 'media';
  content: string[];
  theme?: {
    extend?: Record<string, any>;
  };
  plugins?: string[];
}

export interface ProcessingResult {
  css: string;
  processingTime: number;
  fromCache: boolean;
  classesExtracted: number;
  cacheHit: boolean;
}

export declare class TailwindHandler {
  constructor(projectPath: string, config?: Partial<TailwindConfig>);
  process(): Promise<ProcessingResult>;
  cleanCache(): Promise<void>;
  static getCoreCSS(): string;
}

export declare function createTailwindHandler(
  projectPath: string, 
  config?: Partial<TailwindConfig>
): Promise<TailwindHandler>;

export declare function processTailwindFast(
  projectPath: string,
  options?: {
    outputPath?: string;
    config?: Partial<TailwindConfig>;
  }
): Promise<ProcessingResult>;
`;

      await Bun.write(join(tailwindHandlerDist, "TailwindHandler.d.ts"), declarationContent);
      console.log("✅ Built @0x1js/tailwind-handler with TypeScript declarations");
      
      // Copy to main dist for framework usage
      const handlerSource = join(tailwindHandlerDist, "TailwindHandler.js");
      const handlerDest = join(distDir, "core/tailwind-handler.js");
      if (existsSync(handlerSource)) {
        await Bun.write(handlerDest, await Bun.file(handlerSource).text());
        console.log("✅ Copied TailwindHandler to dist/core/tailwind-handler.js");
      }
    }

    // Build 0x1-store package
    console.log("Building 0x1-store...");
    const storeBuildResult = await Bun.build({
      entrypoints: ["./0x1-store/src/index.ts"],
      outdir: "./0x1-store/dist",
      target: "browser",
      format: "esm",
      minify: true,
    });
    
    if (!storeBuildResult.success) {
      throw new Error("0x1-store build failed");
    }
    console.log("✅ Built 0x1-store");
    
    // Copy store to main dist for dev server access
    const storeSource = resolve("0x1-store/dist/index.js");
    const storeDest = resolve(distDir, "core/store.js");
    if (existsSync(storeSource)) {
      await Bun.write(storeDest, await Bun.file(storeSource).text());
      console.log("✅ Copied store to dist/core/store.js");
    }

    // Build 0x1-router package
    console.log("Building 0x1-router...");
    const routerBuildResult = await Bun.build({
      entrypoints: ["./0x1-router/src/index.ts"],
      outdir: "./0x1-router/dist",
      target: "browser",
      format: "esm",
      minify: true,
    });
    
    if (!routerBuildResult.success) {
      throw new Error("0x1-router build failed");
    }
    console.log("✅ Built 0x1-router");
    
    // Copy router to main dist for dev server access
    const routerSource = resolve("0x1-router/dist/index.js");
    const routerDest = resolve(distDir, "core/router.js");
    if (existsSync(routerSource)) {
      // CRITICAL FIX: Apply JSX normalization to 0x1-router package too
      let routerContent = await Bun.file(routerSource).text();
      
      console.log('🔧 Applying comprehensive JSX normalization to 0x1-router package...');
      
      // 1. Add JSX runtime imports at the beginning (if not already present)
      if (!routerContent.includes('jsx-runtime.js')) {
        const jsxImport = 'import { jsx, jsxs, jsxDEV, Fragment, createElement } from "/0x1/jsx-runtime.js";\n';
        routerContent = jsxImport + routerContent;
      }
      
      // 2. COMPREHENSIVE JSX function normalization (exact same as DevOrchestrator)
      // Replace mangled JSX function names with proper ones
      routerContent = routerContent
        .replace(/jsxDEV_[a-zA-Z0-9]+/g, 'jsxDEV')
        .replace(/jsx_[a-zA-Z0-9]+/g, 'jsx')
        .replace(/jsxs_[a-zA-Z0-9]+/g, 'jsxs')
        .replace(/Fragment_[a-zA-Z0-9]+/g, 'Fragment');

      // 3. Handle mixed alphanumeric patterns
      routerContent = routerContent
        .replace(/jsxDEV_[0-9a-z]+/gi, 'jsxDEV')
        .replace(/jsx_[0-9a-z]+/gi, 'jsx')
        .replace(/jsxs_[0-9a-z]+/gi, 'jsxs')
        .replace(/Fragment_[0-9a-z]+/gi, 'Fragment');
      
      // 4. Ultra aggressive catch-all patterns
      routerContent = routerContent
        .replace(/\bjsxDEV_\w+/g, 'jsxDEV')
        .replace(/\bjsx_\w+/g, 'jsx')
        .replace(/\bjsxs_\w+/g, 'jsxs')
        .replace(/\bFragment_\w+/g, 'Fragment');

      // 5. CRITICAL: Transform imports to browser-resolvable URLs
      routerContent = routerContent
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\.\/components\/([^"']+)["']/g, 
          'import { $1 } from "/components/$2.js"')
        .replace(/import\s*["']\.\/globals\.css["']/g, '// CSS import externalized')
        .replace(/import\s*["']\.\.\/globals\.css["']/g, '// CSS import externalized')
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-dev-runtime["']/g, 
          'import { $1 } from "/0x1/jsx-runtime.js"')
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-runtime["']/g, 
          'import { $1 } from "/0x1/jsx-runtime.js"')
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/link["']/g, 
          'import { $1 } from "/0x1/router.js"')
        .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
          'import { $1 } from "/node_modules/0x1/index.js"');
      
      // Write the normalized router content
      await Bun.write(routerDest, routerContent);
      
      // CRITICAL FIX: Apply the exact Link export fix from BuildOrchestrator
      let finalContent = await Bun.file(routerDest).text();
      
      // EXACT same Link export logic as BuildOrchestrator (which works in DevOrchestrator)
      finalContent = finalContent.replace(
        /export\s*\{([^}]*)\s+as\s+Link\s*([^}]*)\}/g,
        (match, before, after) => {
          // Find the RouterLink function and export it as Link instead
          if (finalContent.includes('RouterLink')) {
            return match.replace(/\w+\s+as\s+Link/, 'RouterLink as Link');
          }
          // Look for function that creates <a> elements or calls jsx/createElement
          const linkFunctionMatch = finalContent.match(/function\s+(\w+)\([^{]*\{[^}]*(?:createElement\(["']a["']|jsx\(["']a["'])/);
          if (linkFunctionMatch) {
            const correctLinkFunction = linkFunctionMatch[1];
            return match.replace(/\w+\s+as\s+Link/, `${correctLinkFunction} as Link`);
          }
          return match;
        }
      );
      
      await Bun.write(routerDest, finalContent);
      
      console.log("✅ Built router.js with JSX normalization and corrected Link export");
    }

    console.log("📦 Building Router module...");

    // Build Router module for Next.js-style imports (0x1/router)
    const routerModulePath = join(srcDir, "router.ts");
    if (existsSync(routerModulePath)) {
      const { success, outputs } = await Bun.build({
        entrypoints: [routerModulePath],
        outdir: distDir,
        target: "browser",
        format: "esm",
        minify: true,
      });

      if (success && outputs.length > 0) {
        // CRITICAL FIX: Apply JSX normalization to router.js (same as BuildOrchestrator)
        const outputPath = outputs[0].path;
        let content = await Bun.file(outputPath).text();
        
        console.log('🔧 Applying comprehensive JSX normalization to router.js...');
        
        // 1. Add JSX runtime imports at the beginning
        const jsxImport = 'import { jsx, jsxs, jsxDEV, Fragment, createElement } from "/0x1/jsx-runtime.js";\n';
        content = jsxImport + content;
        
        // 2. COMPREHENSIVE JSX function normalization (exact same as DevOrchestrator)
        // Replace mangled JSX function names with proper ones
        content = content
          .replace(/jsxDEV_[a-zA-Z0-9]+/g, 'jsxDEV')
          .replace(/jsx_[a-zA-Z0-9]+/g, 'jsx')
          .replace(/jsxs_[a-zA-Z0-9]+/g, 'jsxs')
          .replace(/Fragment_[a-zA-Z0-9]+/g, 'Fragment');
        
        // 3. Handle mixed alphanumeric patterns
        content = content
          .replace(/jsxDEV_[0-9a-z]+/gi, 'jsxDEV')
          .replace(/jsx_[0-9a-z]+/gi, 'jsx')
          .replace(/jsxs_[0-9a-z]+/gi, 'jsxs')
          .replace(/Fragment_[0-9a-z]+/gi, 'Fragment');
        
        // 4. Ultra aggressive catch-all patterns
        content = content
          .replace(/\bjsxDEV_\w+/g, 'jsxDEV')
          .replace(/\bjsx_\w+/g, 'jsx')
          .replace(/\bjsxs_\w+/g, 'jsxs')
          .replace(/\bFragment_\w+/g, 'Fragment');
        
        // 5. Transform imports to browser-resolvable URLs
        content = content
          .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']\.\.\/components\/([^"']+)["']/g, 
            'import { $1 } from "/components/$2.js"')
          .replace(/import\s*["']\.\/globals\.css["']/g, '// CSS import externalized')
          .replace(/import\s*["']\.\.\/globals\.css["']/g, '// CSS import externalized')
          .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-dev-runtime["']/g, 
            'import { $1 } from "/0x1/jsx-runtime.js"')
          .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/jsx-runtime["']/g, 
            'import { $1 } from "/0x1/jsx-runtime.js"')
          .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1\/link["']/g, 
            'import { $1 } from "/0x1/router.js"')
          .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']0x1["']/g, 
            'import { $1 } from "/node_modules/0x1/index.js"');
        
        // Write the normalized router content
        await Bun.write(outputPath, content);
        
        // CRITICAL FIX: Apply the exact Link export fix from BuildOrchestrator
        let finalContent = await Bun.file(outputPath).text();
        
        // EXACT same Link export logic as BuildOrchestrator (which works in DevOrchestrator)
        finalContent = finalContent.replace(
          /export\s*\{([^}]*)\s+as\s+Link\s*([^}]*)\}/g,
          (match, before, after) => {
            // Find the RouterLink function and export it as Link instead
            if (finalContent.includes('RouterLink')) {
              return match.replace(/\w+\s+as\s+Link/, 'RouterLink as Link');
            }
            // Look for function that creates <a> elements
            const linkFunctionMatch = finalContent.match(/function\s+(\w+)\([^{]*\{[^}]*createElement\(["']a["']\)/);
            if (linkFunctionMatch) {
              const correctLinkFunction = linkFunctionMatch[1];
              return match.replace(/\w+\s+as\s+Link/, `${correctLinkFunction} as Link`);
            }
            return match;
          }
        );
        
        await Bun.write(outputPath, finalContent);
        
        console.log("✅ Built router.js with JSX normalization and corrected Link export");
      } else {
        console.warn("⚠️ Failed to build router.js");
      }
    }

    // Build 0x1-templates package
    console.log("Building 0x1-templates...");
    const templatesBuildResult = await Bun.build({
      entrypoints: ["./0x1-templates/src/index.ts"],
      outdir: "./0x1-templates/dist",
      target: "node",
      format: "esm",
      minify: true,
    });
    
    if (!templatesBuildResult.success) {
      throw new Error("0x1-templates build failed");
    }
    console.log("✅ Built 0x1-templates");
    
    // Save the ESM version before building CJS (to prevent overwrite)
    const esmOutputPath = "./0x1-templates/dist/index.js";
    let esmContent = "";
    if (existsSync(esmOutputPath)) {
      esmContent = await Bun.file(esmOutputPath).text();
    }
    
    // Also build CJS version for broader compatibility
    const templatesCjsBuildResult = await Bun.build({
      entrypoints: ["./0x1-templates/src/index.ts"],
      outdir: "./0x1-templates/dist",
      target: "node", 
      format: "cjs",
      minify: true,
    });
    
    if (templatesCjsBuildResult.success) {
      // Rename the CJS output to index.cjs
      const cjsOutputPath = "./0x1-templates/dist/index.js";
      const cjsTargetPath = "./0x1-templates/dist/index.cjs";
      if (existsSync(cjsOutputPath)) {
        const cjsContent = await Bun.file(cjsOutputPath).text();
        await Bun.write(cjsTargetPath, cjsContent);
        
        // Restore the ESM version as index.js
        if (esmContent) {
          await Bun.write(cjsOutputPath, esmContent);
        }
        
        console.log("✅ Built 0x1-templates (CJS)");
        console.log("✅ Restored 0x1-templates (ESM)");
      }
    } else {
      console.warn("⚠️ 0x1-templates CJS build failed (ESM version available)");
    }

    console.log("🔍 Final validation...");

    // Validate essential files exist
    const requiredFiles = [
      join(distDir, "index.js"),
      join(distDir, "package.json"), 
      join(distDir, "jsx-runtime.js"),
      join(distDir, "hooks.js"), // CRITICAL FIX: Core modules are now in distDir, not distDir/core
    ];
    
    let buildValid = true;
    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        console.error(`❌ Missing: ${file}`);
        buildValid = false;
      }
    }
    
    if (!buildValid) {
      throw new Error("Build validation failed");
    }

    // Calculate bundle sizes properly
    let indexSize = 0;
    let jsxRuntimeSize = 0;
    let totalCoreSize = 0;
    
    // Check for main bundle (could be hashed)
    const indexPath = join(distDir, "index.js");
    if (existsSync(indexPath)) {
      try {
        const content = await Bun.file(indexPath).text();
        indexSize = Buffer.byteLength(content, 'utf8');
        
        // If it's a redirect file, find the actual hashed file
        if (content.includes('index-') && content.length < 200) {
          const hashMatch = content.match(/index-([a-f0-9]+)\.js/);
          if (hashMatch) {
            const hashedPath = join(distDir, `index-${hashMatch[1]}.js`);
            if (existsSync(hashedPath)) {
              const hashedContent = await Bun.file(hashedPath).text();
              indexSize = Buffer.byteLength(hashedContent, 'utf8');
            }
          }
        }
      } catch {
        indexSize = 0;
      }
    }
    
    // Check for JSX runtime (could be hashed)
    const jsxRuntimeFilePath = join(distDir, "jsx-runtime.js");
    if (existsSync(jsxRuntimeFilePath)) {
      try {
        const content = await Bun.file(jsxRuntimeFilePath).text();
        jsxRuntimeSize = Buffer.byteLength(content, 'utf8');
        
        // If it's a redirect file, find the actual hashed file
        if (content.includes('jsx-runtime-') && content.length < 200) {
          const hashMatch = content.match(/jsx-runtime-([a-f0-9]+)\.js/);
          if (hashMatch) {
            const hashedPath = join(distDir, `jsx-runtime-${hashMatch[1]}.js`);
            if (existsSync(hashedPath)) {
              const hashedContent = await Bun.file(hashedPath).text();
              jsxRuntimeSize = Buffer.byteLength(hashedContent, 'utf8');
            }
          }
        }
      } catch {
        jsxRuntimeSize = 0;
      }
    }
    
    // Calculate total core size (essential files only)
    const coreFiles = ['hooks.js', 'jsx-runtime.js', 'router.js', 'index.js'];
    for (const file of coreFiles) {
      const filePath = join(distDir, file);
      if (existsSync(filePath)) {
        try {
          const content = await Bun.file(filePath).text();
          totalCoreSize += Buffer.byteLength(content, 'utf8');
        } catch {
          // Skip files that can't be read
        }
      }
    }
    
    const totalSize = await calculateTotalSize(distDir);

    console.log("\n📦 Build Summary:");
    console.log(`  • Main bundle: ${(indexSize / 1024).toFixed(1)} KB`);
    console.log(`  • JSX runtime: ${(jsxRuntimeSize / 1024).toFixed(1)} KB`);
    console.log(`  • Core files: ${(totalCoreSize / 1024).toFixed(1)} KB`);
    console.log(`  • Total size: ${(totalSize / 1024).toFixed(1)} KB`);
    console.log(`  • Files: ${requiredFiles.length} essential files`);

    console.log("🎉 Production optimized build completed successfully!");

  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

async function calculateTotalSize(dir: string): Promise<number> {
  let totalSize = 0;
  
  try {
    // Read all files in the directory recursively
    const scanDir = (dirPath: string) => {
      try {
        const items = readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = join(dirPath, item.name);
          
          if (item.isDirectory()) {
            scanDir(itemPath);
          } else if (item.isFile()) {
            try {
              const stats = statSync(itemPath);
              totalSize += stats.size;
            } catch {
              // Skip files that can't be read
            }
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    };
    
    scanDir(dir);
  } catch {
    // Fallback estimate if scanning fails
    totalSize = 250000; // 250KB estimate
  }
  
  return totalSize;
}

// Run the build
buildFramework().catch((err) => {
  console.error("💥 Build error:", err);
  process.exit(1);
});
