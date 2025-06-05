/**
 * 0x1 Syntax Highlighter - Lightweight & Beautiful
 * Fast tokenization with modern styling
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

// JavaScript/TypeScript keywords and operators
const JS_KEYWORDS = new Set([
  'abstract', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'implements', 'import', 'in', 'instanceof', 'interface',
  'let', 'new', 'null', 'of', 'public', 'private', 'protected', 'readonly', 'return', 
  'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined',
  'var', 'void', 'while', 'with', 'yield'
]);

const JS_TYPES = new Set([
  'string', 'number', 'boolean', 'object', 'symbol', 'bigint', 'any', 'unknown', 'never',
  'void', 'Array', 'Promise', 'Set', 'Map', 'Date', 'RegExp', 'Error'
]);

const JS_CONSTANTS = new Set([
  'console', 'window', 'document', 'global', 'process', 'require', 'module', 'exports',
  'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite'
]);

const BASH_KEYWORDS = new Set([
  'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'select', 'while', 'until',
  'do', 'done', 'in', 'function', 'time', 'coproc', 'cd', 'echo', 'export', 'alias',
  'unalias', 'set', 'unset', 'readonly', 'local', 'declare', 'typeset', 'exit', 'return',
  'break', 'continue', 'shift', 'test', 'source', 'eval', 'exec', 'trap', 'kill', 'jobs',
  'bg', 'fg', 'wait', 'suspend', 'true', 'false'
]);

const BASH_COMMANDS = new Set([
  'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'ln', 'find', 'grep', 'sed',
  'awk', 'sort', 'uniq', 'cut', 'tr', 'head', 'tail', 'wc', 'cat', 'less', 'more',
  'file', 'which', 'whereis', 'locate', 'man', 'info', 'help', 'history', 'alias',
  'ps', 'top', 'htop', 'kill', 'killall', 'nohup', 'screen', 'tmux', 'ssh', 'scp',
  'rsync', 'wget', 'curl', 'git', 'npm', 'bun', 'node', 'python', 'pip', 'docker',
  'kubectl', 'make', 'gcc', 'clang', 'java', 'javac'
]);

/**
 * Fast JavaScript/TypeScript tokenizer
 */
export function tokenizeJavaScript(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < code.length) {
    const char = code[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Line comments
    if (char === '/' && code[i + 1] === '/') {
      const start = i;
      while (i < code.length && code[i] !== '\n') i++;
      tokens.push({
        type: 'comment',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Block comments
    if (char === '/' && code[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      tokens.push({
        type: 'comment',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // String literals
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      const start = i;
      i++;
      
      while (i < code.length) {
        if (code[i] === quote && code[i - 1] !== '\\') {
          i++;
          break;
        }
        if (code[i] === '\\') i++; // Skip escaped character
        i++;
      }
      
      tokens.push({
        type: 'string',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Numbers
    if (/\d/.test(char) || (char === '.' && /\d/.test(code[i + 1]))) {
      const start = i;
      while (i < code.length && /[\d.eE+-]/.test(code[i])) i++;
      tokens.push({
        type: 'number',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      const start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
      const value = code.slice(start, i);
      
      let type: Token['type'] = 'plain';
      if (JS_KEYWORDS.has(value)) type = 'keyword';
      else if (JS_TYPES.has(value)) type = 'type';
      else if (JS_CONSTANTS.has(value)) type = 'constant';
      else if (/^[A-Z]/.test(value)) type = 'type'; // PascalCase = likely type/class
      else if (code[i] === '(') type = 'function'; // Function call
      
      tokens.push({ type, value, start, end: i });
      continue;
    }
    
    // Operators
    if (/[+\-*/%=<>!&|^~?:;,.[\]{}()]/.test(char)) {
      const start = i;
      // Handle multi-character operators
      if (i < code.length - 1) {
        const twoChar = code.slice(i, i + 2);
        if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '=>', '??'].includes(twoChar)) {
          i += 2;
        } else if (i < code.length - 2 && ['===', '!=='].includes(code.slice(i, i + 3))) {
          i += 3;
        } else {
          i++;
        }
      } else {
        i++;
      }
      
      tokens.push({
        type: 'operator',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Unknown character - treat as plain
    tokens.push({
      type: 'plain',
      value: char,
      start: i,
      end: i + 1
    });
    i++;
  }
  
  return tokens;
}

/**
 * Fast Bash tokenizer
 */
export function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < code.length) {
    const char = code[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Comments
    if (char === '#') {
      const start = i;
      while (i < code.length && code[i] !== '\n') i++;
      tokens.push({
        type: 'comment',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // String literals
    if (char === '"' || char === "'") {
      const quote = char;
      const start = i;
      i++;
      
      while (i < code.length) {
        if (code[i] === quote && code[i - 1] !== '\\') {
          i++;
          break;
        }
        if (code[i] === '\\') i++;
        i++;
      }
      
      tokens.push({
        type: 'string',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Variables ($VAR, ${VAR})
    if (char === '$') {
      const start = i;
      i++;
      
      if (code[i] === '{') {
        i++;
        while (i < code.length && code[i] !== '}') i++;
        i++;
      } else {
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) i++;
      }
      
      tokens.push({
        type: 'variable',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Numbers
    if (/\d/.test(char)) {
      const start = i;
      while (i < code.length && /\d/.test(code[i])) i++;
      tokens.push({
        type: 'number',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(char)) {
      const start = i;
      while (i < code.length && /[a-zA-Z0-9_-]/.test(code[i])) i++;
      const value = code.slice(start, i);
      
      let type: Token['type'] = 'plain';
      if (BASH_KEYWORDS.has(value)) type = 'keyword';
      else if (BASH_COMMANDS.has(value)) type = 'function';
      
      tokens.push({ type, value, start, end: i });
      continue;
    }
    
    // Operators and special characters
    if (/[|&;<>()[\]{}*?~]/.test(char)) {
      const start = i;
      // Handle multi-character operators
      if (i < code.length - 1) {
        const twoChar = code.slice(i, i + 2);
        if (['&&', '||', '>>', '<<', '2>', '2&'].includes(twoChar)) {
          i += 2;
        } else {
          i++;
        }
      } else {
        i++;
      }
      
      tokens.push({
        type: 'operator',
        value: code.slice(start, i),
        start,
        end: i
      });
      continue;
    }
    
    // Unknown character
    tokens.push({
      type: 'plain',
      value: char,
      start: i,
      end: i + 1
    });
    i++;
  }
  
  return tokens;
}

/**
 * Main highlight function
 */
export function highlight(code: string, options: HighlightOptions): string {
  const { language, showLineNumbers = false, startLineNumber = 1, maxLines, wrapLines = true } = options;
  
  // Tokenize based on language
  let tokens: Token[];
  switch (language) {
    case 'javascript':
    case 'typescript':
      tokens = tokenizeJavaScript(code);
      break;
    case 'bash':
      tokens = tokenizeBash(code);
      break;
    case 'json':
      tokens = tokenizeJavaScript(code); // JSON is a subset of JS
      break;
    default:
      // Fallback to plain text
      tokens = [{ type: 'plain', value: code, start: 0, end: code.length }];
  }
  
  // Generate HTML
  let html = '';
  const lines = code.split('\n');
  const maxLinesToShow = maxLines ? Math.min(lines.length, maxLines) : lines.length;
  
  for (let lineIndex = 0; lineIndex < maxLinesToShow; lineIndex++) {
    const lineStart = lines.slice(0, lineIndex).reduce((acc, line) => acc + line.length + 1, 0);
    const lineEnd = lineStart + lines[lineIndex].length;
    
    // Get tokens for this line
    const lineTokens = tokens.filter(token => 
      token.start >= lineStart && token.end <= lineEnd + 1
    );
    
    html += '<div class="highlight-line">';
    
    if (showLineNumbers) {
      const lineNum = startLineNumber + lineIndex;
      html += `<span class="line-number" data-line="${lineNum}">${lineNum}</span>`;
    }
    
    html += '<span class="line-content">';
    
    let lastEnd = lineStart;
    for (const token of lineTokens) {
      // Add any text between tokens
      if (token.start > lastEnd) {
        html += escapeHtml(code.slice(lastEnd, token.start));
      }
      
      // Add the token
      html += `<span class="token-${token.type}">${escapeHtml(token.value)}</span>`;
      lastEnd = token.end;
    }
    
    // Add remaining text on the line
    if (lastEnd < lineEnd) {
      html += escapeHtml(code.slice(lastEnd, lineEnd));
    }
    
    html += '</span></div>';
  }
  
  if (maxLines && lines.length > maxLines) {
    html += `<div class="highlight-line truncated">... ${lines.length - maxLines} more lines</div>`;
  }
  
  return html;
}

/**
 * Escape HTML characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): string[] {
  return ['javascript', 'typescript', 'bash', 'json', 'html', 'css'];
} 