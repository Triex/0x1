# 0x1-experimental/transpiler

A high-performance JSX transpiler for the 0x1 framework that converts JSX syntax to 0x1-compatible JavaScript/TypeScript. This transpiler is designed to be minimal, clean, and production-ready while providing optimal performance.

> Pending integration into 0x1 dev/build system. 

## Implementations

### Node.js Implementation (`/js`)
- Production-ready implementation using pure JavaScript
- Enhanced JSX parsing with proper handling of components vs HTML elements
- Clean error handling and detailed output
- Uses the same transformation logic as the Zig version
- Easy to integrate with the 0x1 build system and dev server

### Zig Implementation (Experimental)
- Experimental high-performance implementation
- Manual lexing and parsing in Zig for maximum speed
- Controlled allocation and deallocation for memory efficiency
- No GC overhead and potential for ahead-of-time compilation

## Integration Points

The transpiler can be integrated with 0x1's build system in two places:

1. **Build Process** (`src/cli/commands/build.ts`)
   - Replace or enhance the current JSX transformation logic
   - Alternative to Bun's built-in transpiler for more control over output

2. **Development Server** (`src/cli/server/dev-server.ts`)
   - Improve component hot-reloading with more accurate transformations
   - Better error reporting in development mode

## Usage

```javascript
// Import the transpiler
const { JSXTranspiler } = require('./js/jsx-transpiler.js');

// Create an instance with JSX source code
const transpiler = new JSXTranspiler(jsxSource);

// Transpile to JavaScript
const jsOutput = transpiler.transpile();
```

## Example Transformations

```jsx
// Input: JSX
<div>Hello</div>

// Output: JavaScript
createElement('div', null, 'Hello')
```

```jsx
// Input: JSX with component and props
<Button onClick={handleClick}>Click</Button>

// Output: JavaScript
createElement(Button, {onClick: handleClick}, 'Click')
```