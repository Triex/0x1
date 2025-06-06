/**
 * Build script for 0x1 Syntax Highlighter - Production Optimized
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const srcDir = './src';
const distDir = './dist';

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
      
      // Remove console.log statements but keep console.error and console.warn
      const processedContents = contents
        .replace(/console\.log\([^;]*\);?/g, '/* console.log removed */;')
        .replace(/console\.log\([^)]*\)/g, '/* console.log removed */')
        .replace(/console\.debug\([^;]*\);?/g, '/* console.debug removed */;')
        .replace(/console\.debug\([^)]*\)/g, '/* console.debug removed */');
      
      return {
        contents: processedContents,
        loader: args.path.endsWith('.tsx') ? 'tsx' : 
               args.path.endsWith('.ts') ? 'ts' : 
               args.path.endsWith('.jsx') ? 'jsx' : 'js'
      };
    });
  }
};

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log('🚀 Building 0x1 Syntax Highlighter (Production Optimized)...');

// Production build configuration
const productionBuildConfig = {
  target: 'browser' as const,
  format: 'esm' as const,
  minify: true,
  splitting: true,
  plugins: [consoleLogRemovalPlugin],
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
    entrypoints: [join(srcDir, 'index.ts')],
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
    
    console.log(`✅ ESM Build with cache busting: index-${hash}.js`);
  }

  // Build CJS version with production optimizations
  const cjsResult = await Bun.build({
    entrypoints: [join(srcDir, 'index.ts')],
    outdir: distDir,
    target: 'node' as const,
    format: 'cjs' as const,
    minify: true,
    plugins: [consoleLogRemovalPlugin],
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
    
    console.log(`✅ CJS Build with cache busting: index-${hash}.cjs`);
  }

  console.log('✅ TypeScript transpiled successfully with production optimizations');
} catch (error) {
  console.error('❌ Build error:', error);
  process.exit(1);
}

// Bundle CSS files with optimization
try {
  console.log('🎨 Bundling and optimizing CSS...');
  
  const themesCss = readFileSync(join(srcDir, 'themes.css'), 'utf8');
  const componentCss = readFileSync(join(srcDir, 'component-styles.css'), 'utf8');
  
  const bundledCss = `/* 0x1 Syntax Highlighter - Complete Styles */\n\n${themesCss}\n\n${componentCss}`;
  
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
  
  console.log(`✅ CSS bundled and optimized with cache busting: styles-${cssHash}.css`);
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
  
  console.log('✅ Enhanced TypeScript declarations generated');
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
    version: "0.1.3",
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
  
  console.log('✅ Production-optimized package.json created');
} catch (error) {
  console.error('❌ Package.json creation error:', error);
  process.exit(1);
}

console.log('🎉 Production-optimized build completed successfully!');
console.log(`📁 Output: ${distDir}/`);
console.log('📦 Files generated:');
console.log('  - index.js (ESM bundle with cache busting)');
console.log('  - index.cjs (CommonJS bundle with cache busting)');
console.log('  - index.d.ts (Enhanced TypeScript declarations)');
console.log('  - styles.css (Optimized styles with cache busting)');
console.log('  - package.json (Production-ready configuration)');
console.log('✨ All files are production-ready with cache busting and optimization!'); 