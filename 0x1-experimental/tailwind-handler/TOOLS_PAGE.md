# @0x1js/tailwind-handler

**Intelligent Tailwind CSS Processor** - Automatically detects and processes your project's Tailwind CSS files.

## 🎯 Overview

A lightweight CSS processor that finds your project's Tailwind CSS files and processes them through your installed Tailwind packages. Supports both Tailwind v3 and v4 with automatic version detection.

## ✨ Key Features

- **Automatic CSS Discovery**: Scans common file locations
- **Smart Processing**: Uses your installed Tailwind packages via PostCSS
- **Version Detection**: Automatically handles v3 vs v4 differences
- **Multi-Strategy Fallback**: Robust processing with graceful degradation
- **Zero Configuration**: Works with standard project structures
- **Framework Agnostic**: Compatible with any build system

## 🚀 Quick Usage

```typescript
import { processTailwindFast } from '@0x1js/tailwind-handler';

const result = await processTailwindFast('./project', {
  outputPath: 'dist/styles.css',
  config: { content: ['src/**/*.{js,ts,jsx,tsx}'] }
});
```

## 🔧 Processing Pipeline

1. **File Discovery** → Scans for CSS files in standard locations
2. **Directive Detection** → Identifies Tailwind syntax (`@import`, `@tailwind`, etc.)
3. **Version Detection** → Determines v3 vs v4 from package.json
4. **PostCSS Processing** → Processes through installed packages
5. **Fallback Handling** → Provides essential CSS if processing fails

## 📁 Supported File Locations

```
app/globals.css           # Next.js/0x1 Framework
src/app/globals.css       # Nested app structure
styles/globals.css        # Traditional location
css/main.css             # Standard CSS directory
dist/styles.css          # Build output
```

## 🎯 Setup Requirements

### Tailwind v4
```bash
bun add tailwindcss@^4.0.0 @tailwindcss/postcss postcss
```
- CSS: `@import "tailwindcss";`
- PostCSS config required

### Tailwind v3
```bash
bun add -d tailwindcss@^3.0.0 postcss
```
- CSS: `@tailwind base; @tailwind components; @tailwind utilities;`

## 🔍 Debug Mode

```typescript
process.env.DEBUG = '@0x1js/tailwind-handler';
// Shows: file discovery, directive detection, processing steps
```

## 📊 API

### `processTailwindFast(projectPath, options)`
**Returns:** `{ success, css, processingTime, fromCache }`

### `TailwindHandler` Class
```typescript
const handler = new TailwindHandler(projectPath, config);
const result = await handler.process();
```

## 🛠️ Troubleshooting

- **No output**: Check Tailwind packages installed, CSS directives present
- **Processing fails**: Verify PostCSS config (v4), CSS syntax, content paths
- **Wrong version**: Check package.json dependencies

## 🎨 Integration

- **0x1 Framework**: Automatic integration with `0x1-enhanced` processor
- **Build Scripts**: Manual integration for custom build systems
- **Any Framework**: Compatible with Next.js, Vite, custom setups

---

**Production-ready Tailwind CSS processing for modern web development** 