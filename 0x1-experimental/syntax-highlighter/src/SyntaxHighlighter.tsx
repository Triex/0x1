/**
 * 0x1 Syntax Highlighter React Component
 * Beautiful, lightweight code highlighting for your 0x1 apps
 */

import { useEffect, useMemo, useRef, useState } from '0x1';
import { highlight, HighlightOptions } from './highlighter';

export interface SyntaxHighlighterProps extends HighlightOptions {
  children: string;
  className?: string;
  style?: any; // Changed from React.CSSProperties to any for 0x1 compatibility
  copyable?: boolean;
  title?: string;
  footer?: string;
  onCopy?: (code: string) => void;
}

export function SyntaxHighlighter({
  children: code,
  language,
  theme = 'dark',
  showLineNumbers = false,
  startLineNumber = 1,
  maxLines,
  wrapLines = true,
  className = '',
  style,
  copyable = true,
  title,
  footer,
  onCopy
}: SyntaxHighlighterProps) {
  const containerRef = useRef<any>(null);
  const copyButtonRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  // Memoize the highlighted HTML to prevent re-renders
  const highlightedHTML = useMemo(() => {
    return highlight(code, {
      language,
      theme,
      showLineNumbers,
      startLineNumber,
      maxLines,
      wrapLines
    });
  }, [code, language, theme, showLineNumbers, startLineNumber, maxLines, wrapLines]);

  // Copy to clipboard functionality - no state updates!
  const handleCopy = async () => {
    console.log('Copy button clicked!', { copyable, copyButtonRef: copyButtonRef.current });
    if (!copyable || !copyButtonRef.current) return;
    
    try {
      console.log('Attempting to copy:', code);
      await navigator.clipboard.writeText(code);
      console.log('Copy successful!');
      
      // Update button directly without state
      copyButtonRef.current.textContent = '✅';
      copyButtonRef.current.classList.add('copied');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset after 2 seconds
      timeoutRef.current = setTimeout(() => {
        console.log('Resetting copy button');
        if (copyButtonRef.current) {
          copyButtonRef.current.textContent = '📋';
          copyButtonRef.current.classList.remove('copied');
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Fallback copy successful!');
        
        // Update button directly without state
        copyButtonRef.current.textContent = '✅';
        copyButtonRef.current.classList.add('copied');
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          console.log('Resetting copy button (fallback)');
          if (copyButtonRef.current) {
            copyButtonRef.current.textContent = '📋';
            copyButtonRef.current.classList.remove('copied');
          }
        }, 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Handle hover with direct DOM manipulation - no state!
  const handleMouseEnter = () => {
    if (copyButtonRef.current) {
      copyButtonRef.current.classList.add('visible');
    }
  };

  const handleMouseLeave = () => {
    if (copyButtonRef.current) {
      copyButtonRef.current.classList.remove('visible');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Add keyboard shortcut for copying (Ctrl/Cmd + C when focused)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !copyable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [code, copyable]);

  return (
    <div 
      className={`syntax-highlighter-wrapper ${className}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header with title */}
      {title && (
        <div className="syntax-highlighter-header">
          <span className="syntax-highlighter-title">{title}</span>
          <span className="syntax-highlighter-language">{language}</span>
        </div>
      )}
      
      {/* Main code container */}
      <div
        ref={containerRef}
        className={`syntax-highlighter theme-${theme}`}
        tabIndex={0}
        role="textbox"
        aria-label={`Code snippet in ${language}`}
        aria-readonly="true"
      >
        {/* Copy button with hover */}
        {copyable && (
          <button
            ref={copyButtonRef}
            className="copy-button"
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
            title="Copy code"
          >
            📋
          </button>
        )}
        
        {/* Highlighted code */}
        <div 
          className="syntax-highlighter-content"
          dangerouslySetInnerHTML={{ __html: highlightedHTML }}
        />
      </div>
      
      {/* Footer */}
      {footer && (
        <div className="syntax-highlighter-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

// Export with default props for common use cases
export function JavaScriptHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>) {
  return <SyntaxHighlighter {...props} language="javascript" />;
}

export function TypeScriptHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>) {
  return <SyntaxHighlighter {...props} language="typescript" />;
}

export function BashHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>) {
  return <SyntaxHighlighter {...props} language="bash" />;
}

export function JSONHighlighter(props: Omit<SyntaxHighlighterProps, 'language'>) {
  return <SyntaxHighlighter {...props} language="json" />;
}

// Utility component for inline code
export function InlineCode({ 
  children, 
  language = 'javascript',
  theme = 'dark'
}: { 
  children: string; 
  language?: HighlightOptions['language'];
  theme?: HighlightOptions['theme'];
}) {
  const highlightedHTML = highlight(children, { language, theme });
  
  return (
    <code 
      className={`inline-code theme-${theme}`}
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
    />
  );
}

// Hook for programmatic highlighting
export function useHighlight(code: string, options: HighlightOptions) {
  const [highlightedHTML, setHighlightedHTML] = useState('');
  
  useEffect(() => {
    const html = highlight(code, options);
    setHighlightedHTML(html);
  }, [code, options.language, options.theme]);
  
  return highlightedHTML;
}

// Export utilities
export { getSupportedLanguages } from './highlighter';
export type { HighlightOptions, Token } from './highlighter';

