# TSX Support in 0x1 Framework

This guide explains how to use TSX (TypeScript JSX) within your 0x1 projects for a more React-like component authoring experience.

## Overview

0x1 framework now provides full JSX/TSX support, enabling you to:

- Write components using the familiar React-like JSX syntax
- Benefit from full TypeScript type checking for your components
- Use the same underlying performance optimizations of the 0x1 framework

## Creating TSX Components

### Basic Component

```tsx
import { Fragment } from '0x1';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ text, onClick, variant = 'primary' }: ButtonProps) {
  const className = variant === 'primary' 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900';
    
  return (
    <button 
      className={`px-4 py-2 rounded ${className}`} 
      onClick={onClick}
    >
      {text}
    </button>
  );
}
```

### Using Components

```tsx
import { Fragment } from '0x1';
import { Button } from '../components/Button';

export function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to 0x1</h1>
      <Button 
        text="Click me" 
        onClick={() => console.log('Button clicked')} 
      />
    </div>
  );
}
```

## JSX Runtime

The 0x1 JSX runtime provides the following key features:

- **Component-Based Architecture**: Write reusable components with props
- **Fragment Support**: Use `<>...</>` to avoid unnecessary wrapper elements - creates a fragment that doesn't add extra DOM nodes
- **TypeScript Integration**: Full type-checking of props and component structure
- **CSS Class Management**: Easy handling of conditional classes
- **Event Handling**: Simplified DOM event handling

## Configuration

To use TSX in your 0x1 project, ensure your `tsconfig.json` contains:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "createElement",
    "jsxFragmentFactory": "Fragment"
  }
}
```

## Build and Development

The 0x1 framework's build and development servers have been enhanced to automatically handle TSX files:

```bash
# Run development server with TSX support
bun run dev

# Build project including TSX files
bun run build
```

## Differences from React

While the syntax is similar to React, 0x1's TSX implementation:

- Is focused on static rendering, not client-side reactivity
- Has significantly smaller runtime footprint (~2KB vs React's ~40KB)
- Integrates directly with 0x1's optimized templating system
- Doesn't include a virtual DOM diffing algorithm like React

## Performance Considerations

- TSX components compile to efficient vanilla JavaScript
- The JSX runtime adds minimal overhead to your application
- Server-side rendering performance remains excellent

## Best Practices

1. Use the appropriate component style for your needs:
   - TSX components for complex UI with many props/children
   - Standard template literals for simpler components
   
2. Minimize runtime transformations where possible

3. Use TypeScript interfaces for props to ensure type safety

4. Keep the component tree shallow to optimize rendering performance

## Migration from Template Literals

If you're migrating from template literal syntax to TSX, follow these guidelines:

### Before (Template Literals):
```ts
import { html } from '0x1';

export function Button({ text, onClick }) {
  return html`
    <button class="px-4 py-2 rounded bg-blue-600 text-white" onclick=${onClick}>
      ${text}
    </button>
  `;
}
```

### After (TSX):
```tsx
import { Fragment } from '0x1';

export function Button({ text, onClick }) {
  return (
    <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onClick}>
      {text}
    </button>
  );
}
```

Note the key differences:
- `class` becomes `className`
- Event handlers use camelCase (`onClick` instead of `onclick`)
- Expressions use curly braces `{text}` instead of `${text}`
- No need for backticks or interpolation
