# @0x1js/tailwind-handler - Technical Documentation

## 🚀 Tailwind CSS Processing Handler

A lightweight, intelligent Tailwind CSS processor that automatically detects and processes your project's CSS files through your installed Tailwind packages.

## 🎯 Core Features

- **Automatic CSS Discovery**: Finds your project's CSS files in common locations
- **Intelligent Processing**: Detects Tailwind directives and processes through PostCSS
- **Version Aware**: Supports both Tailwind v3 and v4 automatically
- **Multiple Strategies**: CLI → PostCSS → File discovery → Fallback chain
- **Zero Configuration**: Works out of the box with standard project structures
- **Framework Agnostic**: Works with any project setup

## 🏗️ Architecture Overview

### Processing Pipeline

1. **File Discovery**: Scans common CSS file locations
2. **Directive Detection**: Identifies Tailwind-specific directives
3. **Version Detection**: Determines Tailwind v3 vs v4 from dependencies
4. **PostCSS Processing**: Processes CSS through installed Tailwind packages
5. **Fallback Handling**: Graceful degradation if processing fails

### Supported File Locations

The handler automatically searches for CSS files in these locations:

```
app/globals.css           # Next.js/0x1 Framework style
src/app/globals.css       # Nested app structure
src/globals.css           # Source directory
styles/globals.css        # Traditional location
app/global.css           # Alternative naming
styles/main.css          # Custom directories
css/main.css             # Standard CSS directory
dist/styles.css          # Build output
public/styles.css        # Static files
```

### Directive Detection

Automatically detects these Tailwind directives:

- `@import "tailwindcss"` - Tailwind v4 syntax
- `@tailwind base|components|utilities` - Tailwind v3 syntax
- `@layer base|components|utilities` - Custom layer definitions
- `@apply` - Utility application directives

## 📦 Installation & Setup

### Installation

```bash
bun add @0x1js/tailwind-handler
```

### Basic Usage

```typescript
import { processTailwindFast } from '@0x1js/tailwind-handler';

const result = await processTailwindFast('./project-path', {
  outputPath: 'dist/styles.css',
  config: {
    content: ['src/**/*.{js,ts,jsx,tsx}']
  }
});

console.log(`Generated: ${result.css.length} bytes`);
console.log(`Processing time: ${result.processingTime}ms`);
```

### Advanced Usage

```typescript
import { TailwindHandler } from '@0x1js/tailwind-handler';

const handler = new TailwindHandler('./project-path', {
  content: ['app/**/*.{js,ts,jsx,tsx}'],
  outputPath: 'dist/styles.css'
});

const result = await handler.process();
```

## 🔧 Configuration

### Project Requirements

**For Tailwind v4 projects:**
```bash
# Required dependencies
bun add tailwindcss@^4.0.0 @tailwindcss/postcss postcss

# Required CSS file
# app/globals.css
@import "tailwindcss";

# Required PostCSS config
# postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

**For Tailwind v3 projects:**
```bash
# Required dependencies
bun add -d tailwindcss@^3.0.0 postcss autoprefixer

# Required CSS file
# styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Content Configuration

```typescript
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './*.html'
  ]
};
```

## 🔍 Debug & Troubleshooting

### Enable Debug Logging

```typescript
// Enable detailed debug output
process.env.DEBUG = '@0x1js/tailwind-handler';
```

### Debug Output Example

```
[TailwindHandler] Checking package.json at: ./package.json
[TailwindHandler] Found deps: tailwindcss=^4.1.7, @tailwindcss/postcss=^4.1.7
[TailwindHandler] Tailwind v4 detected at: ./package.json
[TailwindHandler] Found CSS file: ./app/globals.css (16490 bytes)
[TailwindHandler] CSS contains Tailwind directives, processing...
[TailwindHandler] Detected directives: @import "tailwindcss", @layer
[TailwindHandler] Processing CSS with Tailwind v4
[TailwindHandler] Trying PostCSS from: ./node_modules/postcss
[TailwindHandler] PostCSS imported successfully from: ./node_modules/postcss
[TailwindHandler] Trying Tailwind v4 from: ./node_modules/@tailwindcss/postcss
[TailwindHandler] Tailwind v4 plugin imported successfully from: ./node_modules/@tailwindcss/postcss
[TailwindHandler] Creating PostCSS processor...
[TailwindHandler] PostCSS processor created
[TailwindHandler] PostCSS processing complete: 85342 bytes
```

### Common Issues

**"No Tailwind directives detected"**
- Ensure your CSS file contains `@import "tailwindcss"` (v4) or `@tailwind` directives (v3)
- Check file encoding and syntax

**"Missing dependencies"**
- Verify Tailwind packages are installed: `bun list | grep tailwind`
- For v4: Install `@tailwindcss/postcss` and `postcss`
- For v3: Install `tailwindcss` and `postcss`

**"PostCSS processing failed"**
- Ensure PostCSS config exists for v4 projects
- Check CSS syntax for errors
- Verify content paths in configuration

## 🎨 Integration Examples

### 0x1 Framework

```typescript
// Automatic integration - no configuration needed
// The handler is used automatically with 0x1-enhanced CSS processor
```

### Manual Integration

```typescript
import { createTailwindHandler } from '@0x1js/tailwind-handler';

const handler = await createTailwindHandler('./project', {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  outputPath: './dist/styles.css'
});

const result = await handler.process();
```

### Build Script Integration

```typescript
// build.ts
import { processTailwindFast } from '@0x1js/tailwind-handler';

export async function buildCSS() {
  const result = await processTailwindFast(process.cwd(), {
    outputPath: 'dist/styles.css',
    config: { content: ['src/**/*.{js,ts,jsx,tsx}'] }
  });
  
  console.log(`✅ CSS built: ${result.processingTime}ms`);
}
```

## 🔄 Processing Strategies

The handler uses multiple strategies in order of preference:

1. **Tailwind v4 PostCSS**: Direct processing through `@tailwindcss/postcss`
2. **Project CSS Discovery**: Finds and processes existing CSS files
3. **CLI Delegation**: Falls back to Tailwind CLI commands
4. **Traditional PostCSS**: Uses standard Tailwind v3 processing
5. **Minimal Fallback**: Essential CSS for graceful degradation

## 📊 API Reference

### `processTailwindFast(projectPath, options)`

**Parameters:**
- `projectPath` (string): Path to project root
- `options.outputPath` (string): Output file path
- `options.config.content` (string[]): Content file patterns
- `options.content` (string[]): Alternative content specification

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

**Constructor:**
```typescript
new TailwindHandler(projectPath: string, config: TailwindConfig)
```

**Methods:**
- `process()`: Main processing method
- `writeOutput(path, css)`: Write CSS to file

**Configuration Interface:**
```typescript
interface TailwindConfig {
  content: string[];
  outputPath?: string;
}
```

## 🌟 Best Practices

1. **Project Structure**: Use standard CSS file locations (`app/globals.css`, `styles/globals.css`)
2. **Dependencies**: Install Tailwind packages in your project or framework
3. **Content Paths**: Specify accurate content file patterns for optimal tree-shaking
4. **Version Consistency**: Use either v3 or v4 consistently throughout your project
5. **PostCSS Config**: Always include PostCSS configuration for v4 projects

## 🔗 Related Documentation

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [PostCSS Documentation](https://postcss.org/)
- [0x1 Framework CSS Processing](https://0x1.onl/docs)

---

**Built for production-ready Tailwind CSS processing** 