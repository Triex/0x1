# 0x1 Framework - Quick Start Guide

Get up and running with 0x1, the lightning-fast TypeScript framework that's a drop-in replacement for React/Next.js.

## Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher (REQUIRED)

## Installation

Install the 0x1 framework globally:

```bash
# Using Bun (preferred)
bun install -g 0x1
```

### Important: PATH Configuration

Bun installs global binaries to `~/.bun/bin`, but doesn't automatically add this to your PATH.

**If you get a "command not found" error after installation, add the following to your shell config:**

For **Bash** users (add to `~/.bashrc`):
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

For **Zsh** users (add to `~/.zshrc`):
```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

For **Fish** users (add to `~/.config/fish/config.fish`):
```bash
set -gx BUN_INSTALL "$HOME/.bun"
set -gx PATH "$BUN_INSTALL/bin" $PATH
```

After updating your shell config, reload it:
```bash
# For bash/zsh
source ~/.bashrc  # or ~/.zshrc

# For fish
source ~/.config/fish/config.fish
```

## Alternative: Use Without Installation

You can also use 0x1 without installing it globally:

```bash
bunx 0x1 <command>
```

## Quick Start

### 1. Create a New Project

```bash
# Create a new project with default options
0x1 new my-app

# Select template complexity during creation
0x1 new my-app --complexity=minimal|standard|full

# Create with PWA support
0x1 new my-app --pwa --theme="royal-purple"
```

### 2. Template Options

Choose from three complexity levels:

- **Minimal**: Basic structure, perfect for landing pages
- **Standard**: Complete project with routing and components
- **Full**: Everything + PWA + advanced features

### 3. Start Development

```bash
cd my-app
0x1 dev
```

Open [http://localhost:3000](http://localhost:3000) to view your app!

> **Auto Port Detection**: If port 3000 is busy, 0x1 automatically finds the next available port.

### 4. Build for Production

```bash
# Create optimized production build
0x1 build

# Preview production build locally
0x1 preview
```

### 5. Deploy

```bash
# Deploy to Vercel (recommended)
0x1 deploy --provider=vercel

# Deploy to Netlify
0x1 deploy --provider=netlify
```

## React/Next.js Migration

0x1 is designed as a **drop-in replacement** for React and Next.js. Migration is simple:

### Replace Imports

```tsx
// Before (React/Next.js)
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// After (0x1)
import { useState, useEffect } from '0x1';
import Link from '0x1/link';
```

### One-liner Migration

```bash
# Replace React imports
find ./src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from ['\''"]react['\''"];/from "0x1";/g'

# Replace Next.js Link imports
find ./src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from ['\''"]next\/link['\''"];/from "0x1\/link";/g'
```

## App Directory Structure

0x1 uses Next.js 15-compatible app directory structure:

```
my-app/
├── app/                    # App directory (Next.js 15-style)
│   ├── layout.tsx          # Root layout (required)
│   ├── page.tsx            # Home page
│   ├── not-found.tsx       # 404 page
│   ├── about/
│   │   └── page.tsx        # /about route
│   └── blog/
│       ├── layout.tsx      # Nested layout
│       ├── page.tsx        # /blog route
│       └── [slug]/
│           └── page.tsx    # /blog/[slug] dynamic route
├── components/             # Reusable components
├── public/                 # Static assets
├── styles/                 # CSS files
├── 0x1.config.ts          # Framework configuration
└── package.json
```

## Essential Commands

| Command | Description |
|---------|-------------|
| `0x1 new <name>` | Create a new project |
| `0x1 dev` | Start development server with hot reload |
| `0x1 build` | Create optimized production build |
| `0x1 preview` | Preview production build locally |
| `0x1 deploy` | Deploy to production |
| `0x1 pwa` | Add Progressive Web App features |

### Development Options

```bash
# Start with custom port
0x1 dev --port=8080

# Enable debug logging
0x1 dev --debug

# Skip Tailwind processing
0x1 dev --skip-tailwind
```

## React Hooks Support

0x1 provides full React hooks compatibility:

```tsx
import { useState, useEffect, useCallback, useMemo, useRef } from '0x1';

function MyComponent() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Side effects work exactly like React
    console.log('Component mounted or count changed');
  }, [count]);
  
  const memoizedValue = useMemo(() => {
    return count * 2;
  }, [count]);
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <p>Doubled: {memoizedValue}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}
```

## Enhanced Hooks

0x1 also provides enhanced hooks for common patterns:

```tsx
import { useFetch, useLocalStorage, useForm } from '0x1';

function EnhancedComponent() {
  // Data fetching with loading states
  const { data, loading, error } = useFetch('/api/data');
  
  // Persistent state
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  
  // Form handling
  const { values, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', email: '' }
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <p>Current theme: {theme}</p>
    </div>
  );
}
```

## Metadata & SEO

0x1 supports Next.js 15-style metadata:

```tsx
// app/page.tsx
export const metadata = {
  title: 'Home Page',
  description: 'Welcome to my 0x1 app',
  openGraph: {
    title: 'Home Page',
    description: 'Welcome to my 0x1 app',
  }
};

export default function HomePage() {
  return <h1>Welcome to 0x1!</h1>;
}
```

## Styling with Tailwind CSS

0x1 automatically processes Tailwind CSS:

```bash
# Install Tailwind (if not already included)
bun add -d tailwindcss@next @tailwindcss/postcss autoprefixer

# Create input CSS file
echo '@tailwind base;\n@tailwind components;\n@tailwind utilities;' > styles/main.css

# Start development (Tailwind is processed automatically)
0x1 dev
```

## Performance Benefits

| Metric | 0x1 | React | Next.js |
|--------|-----|-------|---------|
| Bundle Size | <30KB | 44KB | 80KB+ |
| Time to Interactive | 0.3s | 1.1s | 1.5s+ |
| Lighthouse Score | 100 | 75-85 | 70-85 |

## Next Steps

- 📚 Read the [full documentation](https://github.com/Triex/0x1#readme)
- 💬 Join [GitHub Discussions](https://github.com/Triex/0x1/discussions)
- 🚀 Check out the [Migration Guide](https://github.com/Triex/0x1#-migration-from-reactnextjs)
- ⚡ Explore [Performance Optimization](https://github.com/Triex/0x1/blob/main/PERFORMANCE.md)

## Troubleshooting

### Command Not Found

```bash
# Use bunx if global installation fails
bunx 0x1 new my-app

# Or check your PATH configuration above
echo $PATH | grep -q ".bun/bin" && echo "PATH configured" || echo "PATH needs configuration"
```

### Content Not Showing

1. Check browser console for errors
2. Ensure you're using the latest Bun version
3. Try rebuilding: `0x1 build && 0x1 dev`

## Get Help

For more detailed help:

```bash
0x1 help
```

Ready to build lightning-fast web applications? Let's go! ⚡
