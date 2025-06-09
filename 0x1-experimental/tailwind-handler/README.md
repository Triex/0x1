# @0x1js/tailwind-handler

🚀 **Intelligent Tailwind CSS Processor** - Automatically detects and processes your project's Tailwind CSS through your installed packages.

## ✨ Features

- **🔍 Automatic Discovery**: Finds your CSS files in standard locations
- **⚡ Smart Processing**: Processes through your installed Tailwind packages  
- **🎯 Version Aware**: Supports both Tailwind v3 and v4
- **🔄 Multi-Strategy**: Multiple fallback approaches for reliability
- **📦 Zero Config**: Works out of the box with standard project setups
- **🌙 Future-Proof**: Compatible with current and future Tailwind versions

## 📦 Installation

```bash
bun add @0x1js/tailwind-handler
```

## 🚀 Quick Start

```typescript
import { processTailwindFast } from '@0x1js/tailwind-handler';

// Automatically finds and processes your project's CSS
const result = await processTailwindFast('./my-project', {
  outputPath: 'dist/styles.css',
  config: {
    content: ['src/**/*.{js,ts,jsx,tsx}']
  }
});

console.log(`✅ Generated: ${result.css.length} bytes`);
console.log(`⚡ Processing time: ${result.processingTime}ms`);
```

## 🔧 How It Works

### 1. **File Discovery**
Automatically scans for CSS files in common locations:
```
app/globals.css          # Next.js/0x1 style
src/app/globals.css      # Nested structure  
styles/globals.css       # Traditional
css/main.css            # Standard
```

### 2. **Directive Detection**  
Recognizes Tailwind directives:
- `@import "tailwindcss"` (v4)
- `@tailwind base|components|utilities` (v3)
- `@layer` and `@apply` directives

### 3. **Smart Processing**
Processes through your installed Tailwind packages via PostCSS

### 4. **Graceful Fallback**
Provides essential CSS if processing fails

## 🎯 Project Setup

### Tailwind v4 Projects

```bash
# Install dependencies
bun add tailwindcss@^4.0.0 @tailwindcss/postcss postcss

# Create CSS file (app/globals.css)
@import "tailwindcss";

# Create PostCSS config (postcss.config.js)
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

### Tailwind v3 Projects

```bash
# Install dependencies  
bun add -d tailwindcss@^3.0.0 postcss autoprefixer

# Create CSS file (styles/globals.css)
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🔍 Advanced Usage

### Manual Handler Creation

```typescript
import { TailwindHandler } from '@0x1js/tailwind-handler';

const handler = new TailwindHandler('./project', {
  content: ['src/**/*.{js,ts,jsx,tsx}'],
  outputPath: 'dist/styles.css'
});

const result = await handler.process();
```

### Debug Mode

```typescript
// Enable detailed logging
process.env.DEBUG = '@0x1js/tailwind-handler';

// Shows processing steps:
// [TailwindHandler] Found CSS file: app/globals.css (16490 bytes)  
// [TailwindHandler] CSS contains Tailwind directives, processing...
// [TailwindHandler] Processing with Tailwind v4
// [TailwindHandler] PostCSS processing complete: 85342 bytes
```

## 🎨 Framework Integration

### 0x1 Framework
```typescript
// Automatic integration - no setup required
// Uses 0x1-enhanced CSS processor
```

### Build Scripts
```typescript
import { processTailwindFast } from '@0x1js/tailwind-handler';

export async function buildCSS() {
  const result = await processTailwindFast(process.cwd(), {
    outputPath: 'dist/styles.css',
    config: { content: ['src/**/*.{js,ts,jsx,tsx}'] }
  });
  
  console.log(`✅ CSS built in ${result.processingTime}ms`);
}
```

## 🛠️ Troubleshooting

**No CSS generated?**
- Ensure Tailwind packages are installed
- Check CSS file contains proper directives
- Enable debug mode for detailed logs

**Processing failed?**
- Verify PostCSS config for v4 projects
- Check content paths in configuration
- Ensure CSS syntax is valid

**Wrong version detected?**
- Check package.json dependencies
- Ensure consistent Tailwind version usage

## 📊 API Reference

### `processTailwindFast(projectPath, options)`

**Parameters:**
- `projectPath`: Project root directory
- `options.outputPath`: CSS output file path
- `options.config.content`: File patterns to scan for classes

**Returns:**
```typescript
{
  success: boolean;
  css: string;
  processingTime: number;
  fromCache: boolean;
}
```

### `TailwindHandler` Class

```typescript
// Constructor
new TailwindHandler(projectPath: string, config: TailwindConfig)

// Main method
async process(): Promise<{
  css: string;
  fromCache: boolean;
  processingTime: number;
}>

// Configuration
interface TailwindConfig {
  content: string[];
  outputPath?: string;
}
```

## 🌟 Best Practices

1. **Standard Locations**: Place CSS in `app/globals.css` or `styles/globals.css`
2. **Proper Dependencies**: Install Tailwind packages in your project
3. **Accurate Content**: Specify correct file patterns for optimal output
4. **PostCSS Config**: Include for v4 projects
5. **Debug Logging**: Use when troubleshooting issues

## 📝 License

MIT © 0x1 Framework

---

**Reliable Tailwind CSS processing for modern web projects** 