/**
 * 0x1 Syntax Highlighter - Main Entry Point
 * Lightweight, beautiful code highlighting for 0x1 Framework
 */

// Core highlighting functions
export {
  getSupportedLanguages, highlight, tokenizeBash, tokenizeJavaScript, type HighlightOptions,
  type Token
} from './highlighter';

// React components (will be available when React is installed)
export {
  BashHighlighter, InlineCode, JavaScriptHighlighter, JSONHighlighter, SyntaxHighlighter, TypeScriptHighlighter, useHighlight,
  type SyntaxHighlighterProps
} from './SyntaxHighlighter';

// Re-import for default export
import {
  getSupportedLanguages,
  highlight,
  tokenizeBash,
  tokenizeJavaScript
} from './highlighter';

// Version
export const version = '0.1.0';

// Default export for convenience
export default {
  highlight,
  tokenizeJavaScript,
  tokenizeBash,
  getSupportedLanguages,
  version
}; 