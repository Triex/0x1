# 0x1 Highlighter 🌈

**Lightweight, beautiful code highlighting for your 0x1 applications**

A fast, customizable syntax highlighter built specifically for the 0x1 Framework with support for JavaScript, TypeScript, Bash, and more. Features beautiful themes, copy-to-clipboard functionality, and seamless React integration.

## ✨ Features

- 🚀 **Blazing Fast** - Lightweight tokenization with zero external dependencies
- 🎨 **Beautiful Themes** - Dark, Light, and Violet (0x1 brand) themes
- 📋 **Copy to Clipboard** - Built-in copy functionality with user feedback
- 📱 **Responsive** - Mobile-friendly with touch support
- ♿ **Accessible** - Proper ARIA labels and keyboard navigation
- 🌟 **Modern** - Supports latest JavaScript/TypeScript features
- 🎯 **Framework Agnostic** - Works with or without React/Next.js/0x1

## 🏗️ Installation

```bash
# Install the package
bun add @0x1js/highlighter

# Or with npm
npm install @0x1js/highlighter
```

## 🚀 Quick Start

### React Component (Recommended)

```tsx
import { SyntaxHighlighter } from '@0x1js/highlighter';
import '@0x1js/highlighter/styles';

function MyComponent() {
  const code = `
const { useState } = require('0x1');

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
`;

  return (
    <SyntaxHighlighter
      language="javascript"
      theme="violet"
      showLineNumbers
      title="Counter Component"
      copyable
    >
      {code}
    </SyntaxHighlighter>
  );
}
```

### Vanilla JavaScript

```javascript
import { highlight } from '@0x1js/highlighter';
import '@0x1js/highlighter/styles';

const code = `
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
`;

const highlightedHTML = highlight(code, {
  language: 'javascript',
  theme: 'dark',
  showLineNumbers: true
});

document.getElementById('code-container').innerHTML = highlightedHTML;
```

## 🎨 Themes

### Dark Theme (Default)
```javascript
<SyntaxHighlighter language="javascript" theme="dark">
  {code}
</SyntaxHighlighter>
```

### Light Theme
```javascript
<SyntaxHighlighter language="javascript" theme="light">
  {code}
</SyntaxHighlighter>
```

### Violet Theme (0x1 Brand)
```javascript
<SyntaxHighlighter language="javascript" theme="violet">
  {code}
</SyntaxHighlighter>
```

## 🛠️ Configuration Options

```typescript
interface HighlightOptions {
  language: 'javascript' | 'typescript' | 'bash' | 'json' | 'html' | 'css';
  theme?: 'dark' | 'light' | 'violet';
  showLineNumbers?: boolean;
  startLineNumber?: number;
  maxLines?: number;
  wrapLines?: boolean;
}

interface SyntaxHighlighterProps extends HighlightOptions {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  copyable?: boolean;
  title?: string;
  footer?: string;
  onCopy?: (code: string) => void;
}
```

## 📚 Examples

### Different Languages

```tsx
{/* TypeScript */}
<SyntaxHighlighter language="typescript" theme="violet">
  {tsCode}
</SyntaxHighlighter>

{/* Bash commands */}
<SyntaxHighlighter language="bash" theme="dark">
  {`#!/bin/bash
cd /path/to/project
bun install
bun run build`}
</SyntaxHighlighter>

{/* JSON data */}
<SyntaxHighlighter language="json" theme="light" showLineNumbers>
  {jsonData}
</SyntaxHighlighter>
```

### With Custom Styling

```tsx
<SyntaxHighlighter
  language="typescript"
  theme="violet"
  showLineNumbers
  startLineNumber={10}
  maxLines={50}
  title="API Routes"
  footer="src/api/users.ts"
  className="my-custom-class"
  style={{ marginBottom: '2rem' }}
  onCopy={(code) => console.log('Copied:', code)}
>
  {code}
</SyntaxHighlighter>
```

### Inline Code

```tsx
import { InlineCode } from '@0x1js/highlighter';

<p>
  Use <InlineCode>console.log()</InlineCode> for debugging.
</p>
```

## 🎯 Advanced Usage

### Custom Hook

```tsx
import { useHighlight } from '@0x1js/highlighter';

function CodeBlock({ code, language }) {
  const highlightedHTML = useHighlight(code, { 
    language, 
    theme: 'violet',
    showLineNumbers: true 
  });
  
  return (
    <div 
      className="syntax-highlighter theme-violet"
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
    />
  );
}
```

### Server-Side Rendering

```javascript
// Works great with SSR
import { highlight } from '@0x1js/highlighter';

export function generateStaticHTML(code) {
  return highlight(code, {
    language: 'javascript',
    theme: 'dark',
    showLineNumbers: true
  });
}
```

## 🌍 Supported Languages

- **JavaScript** - Full ES2024+ support
- **TypeScript** - Types, interfaces, generics
- **Bash** - Shell scripts, commands, variables
- **JSON** - Configuration files, API responses
- **HTML** - Markup (coming soon)
- **CSS** - Stylesheets (coming soon)

Get all supported languages:

```javascript
import { getSupportedLanguages } from '@0x1js/highlighter';

console.log(getSupportedLanguages());
// ['javascript', 'typescript', 'bash', 'json', 'html', 'css']
```

## 💡 Best Practices

### ✅ Recommended Approach
```tsx
// Use the main component with language prop
import { SyntaxHighlighter } from '@0x1js/highlighter';

<SyntaxHighlighter language="typescript" theme="dark">
  {code}
</SyntaxHighlighter>
```

### ⚠️ Alternative (but not recommended)
```tsx
// Individual language components work but are unnecessary
import { TypeScriptHighlighter } from '@0x1js/highlighter';

<TypeScriptHighlighter theme="dark">
  {code}
</TypeScriptHighlighter>
```

## 🎨 Customization

### Custom CSS

```css
/* Override theme colors */
.syntax-highlighter.theme-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.theme-custom .token-keyword {
  color: #ffd700;
  font-weight: bold;
}

.theme-custom .token-string {
  color: #98fb98;
}
```

## 🏗️ Building

```bash
# Build the package
bun run build

# Development with watch mode
bun run dev
```

## 📝 License

MIT © 0x1 Framework

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 🔗 Links

- [0x1 Framework](https://0x1.onl)
- [Documentation](https://0x1.onl/docs)
- [GitHub](https://github.com/0x1-company/0x1)

---

**Made with ❤️ for the 0x1 Community** 