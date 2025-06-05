/**
 * Build script for 0x1 Syntax Highlighter
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const srcDir = './src';
const distDir = './dist';

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log('🚀 Building 0x1 Syntax Highlighter...');

// Build TypeScript files with Bun
try {
  console.log('📦 Transpiling TypeScript...');
  
  // Build ESM version
  const esmResult = await Bun.build({
    entrypoints: [join(srcDir, 'index.ts')],
    outdir: distDir,
    target: 'browser',
    format: 'esm',
    minify: false,
    splitting: false,
    external: ['react'],
    naming: 'index.js'
  });

  if (!esmResult.success) {
    console.error('❌ ESM Build failed:', esmResult.logs);
    process.exit(1);
  }

  // Build CJS version  
  const cjsResult = await Bun.build({
    entrypoints: [join(srcDir, 'index.ts')],
    outdir: distDir,
    target: 'node',
    format: 'cjs',
    minify: false,
    splitting: false,
    external: ['react'],
    naming: 'index.cjs'
  });

  if (!cjsResult.success) {
    console.error('❌ CJS Build failed:', cjsResult.logs);
    process.exit(1);
  }

  console.log('✅ TypeScript transpiled successfully');
} catch (error) {
  console.error('❌ Build error:', error);
  process.exit(1);
}

// Bundle CSS files
try {
  console.log('🎨 Bundling CSS...');
  
  const themesCss = readFileSync(join(srcDir, 'themes.css'), 'utf8');
  const componentCss = readFileSync(join(srcDir, 'component-styles.css'), 'utf8');
  
  const bundledCss = `/* 0x1 Syntax Highlighter - Complete Styles */\n\n${themesCss}\n\n${componentCss}`;
  
  writeFileSync(join(distDir, 'styles.css'), bundledCss);
  
  // Also create minified version
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
  
  writeFileSync(join(distDir, 'styles.min.css'), minifiedCss);
  
  console.log('✅ CSS bundled successfully');
} catch (error) {
  console.error('❌ CSS bundling error:', error);
  process.exit(1);
}

// Generate TypeScript declarations manually for core functions
try {
  console.log('📝 Generating TypeScript declarations...');
  
  const declarations = `/**
 * 0x1 Syntax Highlighter - Type Declarations
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
`;

  writeFileSync(join(distDir, 'index.d.ts'), declarations);
  
  console.log('✅ TypeScript declarations generated');
} catch (error) {
  console.error('❌ Declaration generation error:', error);
  process.exit(1);
}

console.log('🎉 Build completed successfully!');
console.log(`📁 Output: ${distDir}/`);
console.log('📦 Files generated:');
console.log('  - index.js (ESM bundle)');
console.log('  - index.cjs (CommonJS bundle)');
console.log('  - index.d.ts (TypeScript declarations)');
console.log('  - styles.css (Complete styles)');
console.log('  - styles.min.css (Minified styles)'); 