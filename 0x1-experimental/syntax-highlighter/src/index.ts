/**
 * 0x1 Syntax Highlighter - Main Entry Point
 * Lightweight, beautiful code highlighting for 0x1 Framework
 */

// Core highlighting functions
export {
    getSupportedLanguages, highlight, tokenizeBash, tokenizeJavaScript, type HighlightOptions,
    type Token
} from './highlighter';

// Main React component (recommended)
export {
    InlineCode, SyntaxHighlighter, useHighlight,
    type SyntaxHighlighterProps
} from './SyntaxHighlighter';

// Convenience components (optional - SyntaxHighlighter with language prop is preferred)
export {
    BashHighlighter, JavaScriptHighlighter, JSONHighlighter, TypeScriptHighlighter
} from './SyntaxHighlighter';

// Re-import for default export
import {
    getSupportedLanguages,
    highlight,
    tokenizeBash,
    tokenizeJavaScript
} from './highlighter';

// Version
export const version = '0.1.4';

// Default export for convenience
export default {
  highlight,
  tokenizeJavaScript,
  tokenizeBash,
  getSupportedLanguages,
  version
}; 