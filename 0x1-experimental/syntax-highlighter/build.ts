/**
 * Build script for 0x1 Syntax Highlighter - Production Optimized
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const srcDir = './src';
const distDir = './dist';

// Build timing and stats
const buildStart = Date.now();
const buildStats = {
  filesGenerated: 0,
  totalSize: 0,
  originalSize: 0,
  compressionRatio: 0
};

// Helper functions for nice output
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getFileSize(filePath: string): number {
  try {
    return existsSync(filePath) ? statSync(filePath).size : 0;
  } catch {
    return 0;
  }
}

function logFileGenerated(filePath: string, description: string) {
  const size = getFileSize(filePath);
  buildStats.filesGenerated++;
  buildStats.totalSize += size;
  console.log(`  ✅ ${description}: ${formatBytes(size)}`);
}

// Generate cache-busting hash
function generateHash(content: string): string {
  return Bun.hash(content).toString(16).slice(0, 8);
}

// Import transformation plugin for browser compatibility
const importTransformPlugin = {
  name: 'transform-imports',
  setup(build: any) {
    build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args: any) => {
      const contents = await Bun.file(args.path).text();
      
      // Transform imports for browser compatibility
      const transformedContents = contents
        // Transform 0x1 jsx-runtime import to include .js extension
        .replace(/from\s*["']0x1\/jsx-runtime["']/g, 'from "0x1/jsx-runtime.js"')
        .replace(/from\s*["']0x1\/jsx-dev-runtime["']/g, 'from "0x1/jsx-dev-runtime.js"')
        // Transform other 0x1 imports
        .replace(/from\s*["']0x1\/([^"']+)["']/g, (match, path) => {
          if (path.endsWith('.js')) return match;
          return `from "0x1/${path}.js"`;
        })
        // Transform main 0x1 import
        .replace(/from\s*["']0x1["']/g, 'from "0x1/index.js"')
        // Remove console.log statements but keep console.error and console.warn
        .replace(/console\.log\([^;]*\);?/g, '/* console.log removed */;')
        .replace(/console\.log\([^)]*\)/g, '/* console.log removed */')
        .replace(/console\.debug\([^;]*\);?/g, '/* console.debug removed */;')
        .replace(/console\.debug\([^)]*\)/g, '/* console.debug removed */');
      
      return {
        contents: transformedContents,
        loader: args.path.endsWith('.tsx') ? 'tsx' : 
               args.path.endsWith('.ts') ? 'ts' : 
               args.path.endsWith('.jsx') ? 'jsx' : 'js'
      };
    });
  }
};

// Production console.log removal plugin
const consoleLogRemovalPlugin = {
  name: 'remove-console-logs',
  setup(build: any) {
    // This is now handled in the importTransformPlugin above
    // Keeping this for backwards compatibility but it won't do anything
  }
};

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log('🚀 Building 0x1 Syntax Highlighter (Production Optimized)...');
console.log(`📂 Source: ${srcDir}`);
console.log(`📁 Output: ${distDir}`);
console.log('');

// Production build configuration
const productionBuildConfig = {
  target: 'browser' as const,
  format: 'esm' as const,
  minify: true,
  splitting: true,
  plugins: [importTransformPlugin],
  external: ['react', '0x1'],
  define: {
    'process.env.NODE_ENV': '"production"',
    '__DEV__': 'false'
  }
};

// Build TypeScript files with Bun
try {
  console.log('📦 Transpiling TypeScript with production optimizations...');
  
  // Build ESM version with cache busting
  const esmResult = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: distDir,
    ...productionBuildConfig,
    naming: 'index.js'
  });

  if (!esmResult.success) {
    console.error('❌ ESM Build failed:', esmResult.logs);
    process.exit(1);
  }

  // Add cache busting to ESM build
  const esmPath = join(distDir, 'index.js');
  if (existsSync(esmPath)) {
    const content = await Bun.file(esmPath).text();
    const hash = generateHash(content);
    const hashedPath = join(distDir, `index-${hash}.js`);
    
    await Bun.write(hashedPath, content);
    await Bun.write(esmPath, `export * from './index-${hash}.js';`);
    
    logFileGenerated(hashedPath, `ESM Bundle (index-${hash}.js)`);
    logFileGenerated(esmPath, 'ESM Entry (index.js)');
  }

  // Build CJS version with production optimizations
  const cjsResult = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: distDir,
    target: 'node' as const,
    format: 'cjs' as const,
    minify: true,
    plugins: [importTransformPlugin],
    external: ['react', '0x1'],
    naming: 'index.cjs',
    define: {
      'process.env.NODE_ENV': '"production"',
      '__DEV__': 'false'
    }
  });

  if (!cjsResult.success) {
    console.error('❌ CJS Build failed:', cjsResult.logs);
    process.exit(1);
  }

  // Add cache busting to CJS build
  const cjsPath = join(distDir, 'index.cjs');
  if (existsSync(cjsPath)) {
    const content = await Bun.file(cjsPath).text();
    const hash = generateHash(content);
    const hashedPath = join(distDir, `index-${hash}.cjs`);
    
    await Bun.write(hashedPath, content);
    await Bun.write(cjsPath, `module.exports = require('./index-${hash}.cjs');`);
    
    logFileGenerated(hashedPath, `CJS Bundle (index-${hash}.cjs)`);
    logFileGenerated(cjsPath, 'CJS Entry (index.cjs)');
  }

  console.log('');
} catch (error) {
  console.error('❌ Build error:', error);
  process.exit(1);
}

// CRITICAL FIX: Post-build transformation to fix jsx-runtime imports
// Bun adds jsx-runtime imports after our plugin runs, so we need to fix them manually
try {
  console.log('🔧 Applying post-build jsx-runtime import fixes...');
  
  const filesToFix = [
    join(distDir, 'index.js'),
    join(distDir, 'index.cjs')
  ];
  
  for (const filePath of filesToFix) {
    if (existsSync(filePath)) {
      let content = await Bun.file(filePath).text();
      
      // Fix jsx-runtime imports that Bun added during transpilation
      const originalContent = content;
      content = content
        .replace(/from"0x1\/jsx-runtime"/g, 'from"0x1/jsx-runtime.js"')
        .replace(/from '0x1\/jsx-runtime'/g, "from '0x1/jsx-runtime.js'")
        .replace(/from `0x1\/jsx-runtime`/g, "from `0x1/jsx-runtime.js`")
        .replace(/require\("0x1\/jsx-runtime"\)/g, 'require("0x1/jsx-runtime.js")')
        .replace(/import\("0x1\/jsx-runtime"\)/g, 'import("0x1/jsx-runtime.js")');
      
      if (content !== originalContent) {
        await Bun.write(filePath, content);
        console.log(`✅ Fixed jsx-runtime imports in ${filePath}`);
      } else {
        console.log(`ℹ️ No jsx-runtime imports found in ${filePath}`);
      }
    }
  }
  
  // Also fix the hashed versions
  const hashFiles = await import('node:fs').then(fs => 
    fs.readdirSync(distDir).filter(file => 
      file.match(/index-[a-f0-9]+\.(js|cjs)$/)
    )
  );
  
  for (const hashFile of hashFiles) {
    const filePath = join(distDir, hashFile);
    let content = await Bun.file(filePath).text();
    
    const originalContent = content;
    content = content
      .replace(/from"0x1\/jsx-runtime"/g, 'from"0x1/jsx-runtime.js"')
      .replace(/from '0x1\/jsx-runtime'/g, "from '0x1/jsx-runtime.js'")
      .replace(/from `0x1\/jsx-runtime`/g, "from `0x1/jsx-runtime.js`")
      .replace(/require\("0x1\/jsx-runtime"\)/g, 'require("0x1/jsx-runtime.js")')
      .replace(/import\("0x1\/jsx-runtime"\)/g, 'import("0x1/jsx-runtime.js")');
    
    if (content !== originalContent) {
      await Bun.write(filePath, content);
      console.log(`✅ Fixed jsx-runtime imports in ${hashFile}`);
    }
  }
  
  console.log('✅ Post-build jsx-runtime import fixes complete');
} catch (error) {
  console.error('❌ Post-build fix error:', error);
  process.exit(1);
}

// Bundle CSS files with optimization
try {
  console.log('🎨 Bundling and optimizing CSS...');
  
  const themesCss = readFileSync(join(srcDir, 'themes.css'), 'utf8');
  const componentCss = readFileSync(join(srcDir, 'component-styles.css'), 'utf8');
  
  const bundledCss = `/* 0x1 Syntax Highlighter - Complete Styles */\n\n${themesCss}\n\n${componentCss}`;
  buildStats.originalSize += bundledCss.length;
  
  // Create minified version
  const minifiedCss = bundledCss
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove last semicolon before }
    .replace(/\s*{\s*/g, '{') // Trim around {
    .replace(/\s*}\s*/g, '}') // Trim around }
    .replace(/\s*,\s*/g, ',') // Trim around commas
    .replace(/\s*:\s*/g, ':') // Trim around colons
    .replace(/\s*;\s*/g, ';') // Trim around semicolons
    .trim();
  
  // Add cache busting to CSS
  const cssHash = generateHash(minifiedCss);
  const hashedCssPath = join(distDir, `styles-${cssHash}.css`);
  const hashedMinCssPath = join(distDir, `styles-${cssHash}.min.css`);
  
  writeFileSync(join(distDir, 'styles.css'), `@import './styles-${cssHash}.css';`);
  writeFileSync(hashedCssPath, bundledCss);
  writeFileSync(hashedMinCssPath, minifiedCss);
  
  logFileGenerated(join(distDir, 'styles.css'), 'CSS Entry (styles.css)');
  logFileGenerated(hashedCssPath, `CSS Bundle (styles-${cssHash}.css)`);
  logFileGenerated(hashedMinCssPath, `CSS Minified (styles-${cssHash}.min.css)`);
  
  const compressionRatio = ((bundledCss.length - minifiedCss.length) / bundledCss.length * 100).toFixed(1);
  console.log(`  📊 CSS Compression: ${compressionRatio}% smaller`);
  console.log('');
} catch (error) {
  console.error('❌ CSS bundling error:', error);
  process.exit(1);
}

// Generate TypeScript declarations with enhanced types
try {
  console.log('📝 Generating enhanced TypeScript declarations...');
  
  const declarations = `/**
 * 0x1 Syntax Highlighter - Enhanced Type Declarations
 * Production-ready types with full React/0x1 compatibility
 */

export interface HighlightOptions {
  language: 'javascript' | 'typescript' | 'bash' | 'json' | 'html' | 'css';
  theme?: 'dark' | 'light' | 'violet';
  showLineNumbers?: boolean;
  startLineNumber?: number;
  maxLines?: number;
  wrapLines?: boolean;
}

export interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'function' | 'variable' | 'type' | 'property' | 'constant' | 'plain';
  value: string;
  start: number;
  end: number;
}

export interface SyntaxHighlighterProps extends HighlightOptions {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  copyable?: boolean;
  title?: string;
  footer?: string;
  onCopy?: (code: string) => void;
}

export declare function highlight(code: string, options: HighlightOptions): string;
export declare function tokenizeJavaScript(code: string): Token[];
export declare function tokenizeBash(code: string): Token[];
export declare function getSupportedLanguages(): string[];

export declare function SyntaxHighlighter(props: SyntaxHighlighterProps): JSX.Element;
export declare function JavaScriptHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>): JSX.Element;
export declare function TypeScriptHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>): JSX.Element;
export declare function BashHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>): JSX.Element;
export declare function JSONHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>): JSX.Element;
export declare function InlineCode(props: { children: string; language?: HighlightOptions['language']; theme?: HighlightOptions['theme']; }): JSX.Element;
export declare function useHighlight(code: string, options: HighlightOptions): string;

export declare const version: string;

declare const _default: {
  highlight: typeof highlight;
  tokenizeJavaScript: typeof tokenizeJavaScript;
  tokenizeBash: typeof tokenizeBash;
  getSupportedLanguages: typeof getSupportedLanguages;
  version: string;
};

export default _default;

// Enhanced module resolution for browser environments
declare module '@0x1js/highlighter' {
  export * from './index';
  export { default } from './index';
}

declare module '@0x1js/highlighter/styles' {
  const styles: string;
  export default styles;
}
`;

  writeFileSync(join(distDir, 'index.d.ts'), declarations);
  logFileGenerated(join(distDir, 'index.d.ts'), 'TypeScript Declarations (index.d.ts)');
  console.log('');
} catch (error) {
  console.error('❌ Declaration generation error:', error);
  process.exit(1);
}

// Create browser-compatible package.json
try {
  console.log('📦 Creating production-optimized package.json...');
  
  const buildTime = Date.now();
  const packageJson = {
    name: "@0x1js/highlighter",
    version: "0.1.9",
    description: "Lightweight, beautiful syntax highlighter for JavaScript, TypeScript, and Bash - Production Optimized",
    main: "index.cjs",
    module: "index.js",
    types: "index.d.ts",
    type: "module",
    sideEffects: false, // Enable tree shaking
    exports: {
      ".": {
        import: "./index.js",
        require: "./index.cjs",
        types: "./index.d.ts"
      },
      "./styles": {
        import: "./styles.css",
        require: "./styles.css"
      }
    },
    files: [
      "dist/",
      "README.md"
    ],
    keywords: [
      "syntax-highlighter",
      "javascript",
      "typescript", 
      "bash",
      "code",
      "highlighting",
      "0x1",
      "react",
      "production-ready"
    ],
    peerDependencies: {
      "0x1": "*",
      "react": "^18.0.0"
    },
    buildTime, // Add build timestamp for cache busting
    browser: {
      "./index.js": "./index.js",
      "./styles": "./styles.css"
    }
  };
  
  writeFileSync(join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  logFileGenerated(join(distDir, 'package.json'), 'Package Configuration (package.json)');
  console.log('');
} catch (error) {
  console.error('❌ Package.json creation error:', error);
  process.exit(1);
}

const buildEnd = Date.now();
const buildTime = buildEnd - buildStart;

// Calculate final compression ratio
if (buildStats.originalSize > 0) {
  buildStats.compressionRatio = ((buildStats.originalSize - buildStats.totalSize) / buildStats.originalSize * 100);
}

console.log('🎉 Build completed successfully!');
console.log('');
console.log('📊 Build Summary:');
console.log('  ┌─────────────────────────────────────────────────┐');
console.log(`  │ Build Time: ${formatTime(buildTime).padEnd(31)} │`);
console.log(`  │ Files Generated: ${buildStats.filesGenerated.toString().padEnd(27)} │`);
console.log(`  │ Total Size: ${formatBytes(buildStats.totalSize).padEnd(31)} │`);
console.log('  └─────────────────────────────────────────────────┘');
console.log('');
console.log('📁 Generated Files:');

// List all generated files with sizes
try {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(distDir)
    .filter(file => !file.startsWith('.'))
    .sort()
    .map(file => {
      const filePath = join(distDir, file);
      const size = getFileSize(filePath);
      return { name: file, size, path: filePath };
    });

  files.forEach(file => {
    const sizeStr = formatBytes(file.size);
    const padding = 40 - file.name.length;
    console.log(`  📄 ${file.name}${' '.repeat(Math.max(1, padding))}${sizeStr}`);
  });
} catch (error) {
  console.log('  📄 (File listing unavailable)');
}

console.log('');
console.log('✨ Production-ready build with cache busting and optimization!');
console.log(`📁 Output directory: ${distDir}/`);
console.log('🚀 Ready for deployment!'); 