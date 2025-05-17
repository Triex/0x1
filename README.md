<div align="center">

# 0x1 ⚡ Ultra-Minimal Framework

**⚡ Lightning-fast web framework for JavaScript/TypeScript with zero overhead and maximum performance**

*Powered by [Bun](https://bun.sh)*

</div>

<p align="center">
  <img src="./public/0x1-banner.svg" alt="0x1 Framework" width="800" />
  <!-- <img src="https://raw.githubusercontent.com/Triex/0x1/main/public/0x1-banner.svg"  -->
</p>

## ✨ Features

- **🔄 Language flexibility**: First-class support for both JavaScript and TypeScript
- **📱 JSX/TSX support**: Create components using familiar JSX syntax with full TypeScript support
- **🔀 Zero-dependency router**: Hash-based or history API routing with lazy loading
- **⏱️ Micro-suspense**: Lightweight content loading states without React
- **🧩 Component system**: Modern component system with automatic DOM diffing
- **🚀 Extreme performance**: Sub-16kb JS payload, 100/100 Lighthouse scores
- **📦 Native ESM**: Direct compilation with no bundling step
- **🌓 Theme modes**: Built-in support for light, dark, and system modes

## 📑 Documentation

- [Getting Started](https://docs.0x1.dev/getting-started)
- [Component System](https://docs.0x1.dev/component-system)
- [TSX Guide](./docs/tsx-guide.md)
- [Routing](https://docs.0x1.dev/routing)
- [Performance Tips](https://docs.0x1.dev/performance-tips)

## 🚀 Getting Started

### Installation

```bash
# Install globally with bun (REQUIRED - framework uses Bun-specific APIs)
bun install -g 0x1
```

### Create a New Project

```bash
# Create a new project with TypeScript (default)
bun 0x1 new my-app

# Create with JavaScript
bun 0x1 new my-app --javascript

# Choose theme mode (dark, light, system)
bun 0x1 new my-app --theme-mode=light
```

### Development and Building

```bash
# Navigate to your project
cd my-app

# Start development server with hot reload
bun 0x1 dev

# Build for production
bun 0x1 build

# Preview production build
bun 0x1 preview
```

## 🚀 Features

### 🧩 TSX Components

0x1 supports TSX components out of the box, allowing you to use a React-like syntax without any additional dependencies:

```tsx
import { createElement, Fragment, renderToString } from '0x1';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ text, onClick, variant = 'primary' }: ButtonProps) {
  const className = variant === 'primary' 
    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
    
  return (
    <button 
      className={`${className} px-4 py-2 rounded transition-colors`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

// Render the component to HTML string
const html = renderToString(<Button text="Click me!" />);
```

### 🌓 Theme Mode

Choose between light, dark, or system theme modes during project creation:

```bash
# Specify theme mode with the --theme-mode flag
0x1 new my-app --theme-mode=light  # Light mode
0x1 new my-app --theme-mode=dark   # Dark mode (default)
0x1 new my-app --theme-mode=system # Follow system preference
```

### 📱 PWA Ready
- **Zero-config PWA**: Built-in Progressive Web App support
- **Offline-first**: Service workers with intelligent caching

- **Blazing Fast**: <16kb total payload size with <1s complete load time
- **Smooth Animations**: 60fps animations with no framework overhead
- **Vercel-ready**: Optimized for Vercel edge deployment
- **Zero Hydration Cost**: No client-side hydration or complex state management

## 🛠️ Technology Stack

- **Core**: Pure JavaScript/TypeScript with custom mini-framework
- **Runtime**: Bun for lightning-fast development and build optimization
- **Styling**: Optional Tailwind CSS with minimal custom utilities
- **Deployment**: Optimized for Vercel edge deployment
- **Performance**: Pre-rendered static HTML with micro-interactions
- **Development Experience**: First-class DX with smart defaults

### Deploying to Vercel

The project is configured for zero-config Vercel deployment. Simply connect your GitHub repository to Vercel, and it will automatically detect the build configuration.

## ⚙️ Under the Hood

The 0x1 framework achieves extreme performance through:

1. **Language flexibility**: Use JavaScript or TypeScript with equal first-class support
2. **Zero abstraction cost**: Direct DOM manipulation with no virtual DOM overhead
3. **Native ESM imports**: Browser-native module loading without complex bundling
4. **Precomputed static content**: Pre-rendered HTML with minimal JS hydration
5. **Micro-optimizations**: Function inlining and dependency flattening
6. **Progressive enhancement**: Core functionality works without JavaScript
7. **Bun-powered**: Leverages Bun's high-performance JavaScript runtime

## 📊 Performance Metrics of Demo Template 1

- **Total JS Size**: 1kb gzipped
- **First Contentful Paint**: <0.5s
- **Time to Interactive**: <1.0s
- **Lighthouse Score**: 100/100 (Performance)


<p align="center">
  <img src="https://raw.githubusercontent.com/Triex/0x1/main/public/0x1-logo.svg" alt="0x1 Logo" width="300" />
</p>

<p align="center">
  <strong>Lightning-fast web framework for JavaScript/TypeScript with zero overhead</strong><br>
  <span>The ultra-minimal, maximum performance framework powered by Bun</span>
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#philosophy"><strong>Philosophy</strong></a> ·
  <a href="#cli-commands"><strong>CLI Commands</strong></a> ·
  <a href="#pwa-features"><strong>PWA Support</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/0x1"><img src="https://img.shields.io/npm/v/0x1.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/0x1"><img src="https://img.shields.io/npm/dm/0x1.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/Triex/0x1"><img src="https://img.shields.io/github/stars/Triex/0x1?style=flat-square" alt="github stars"></a>
  <img src="https://img.shields.io/badge/bundle_size-<16kb-blue?style=flat-square" alt="bundle size" />
  <img src="https://img.shields.io/badge/dependencies-0-green?style=flat-square" alt="dependencies" />
</p>

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Powered_by-Bun-black?style=flat-square&logo=bun" alt="Powered by Bun" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript" alt="TypeScript Ready" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-Supported-yellow?style=flat-square&logo=javascript" alt="JavaScript Supported" /></a>
  <img src="https://img.shields.io/badge/ESM-Native-brightgreen?style=flat-square" alt="ESM Native" />
  <img src="https://img.shields.io/badge/License-TDL_v1-blue?style=flat-square" alt="License" />
</p>

---

## ⚡ Features

### 💨 Extreme Performance
- **Tiny runtime**: <16kb total JS bundle size 
- **Zero hydration cost**: No client-side hydration overhead
- **Native ESM**: Browser-native module loading without bundling
- **Precomputed content**: Minimal JS for maximum speed

### 🧩 Components Without Overhead
- **Simple API**: Modern component system for both JavaScript and TypeScript
- **Minimal abstractions**: Near-vanilla performance
- **Custom Diffing**: Optimized DOM updates
- **Type-safe**: Full TypeScript support when you want it
- **Vanilla friendly**: Works with plain JavaScript for maximum flexibility

### 🧪 Template Complexity Options

0x1 offers three complexity levels for projects, available in both JavaScript and TypeScript:

```bash
# Create a minimal project
bun 0x1 new my-app --complexity=minimal

# Create a standard project (default)
bun 0x1 new my-app --complexity=standard

# Create a full-featured project
bun 0x1 new my-app --complexity=full
```

#### Minimal Template
- Basic structure with essential files only
- Perfect for landing pages or simple sites
- Extremely lightweight with minimal dependencies

#### Standard Template
- Complete structure with organized files
- Router implementation with multi-page support
- Component architecture for building UIs

#### Full Template
- Everything in Standard, plus:
- Built-in state management system
- Progressive Web App (PWA) support
- Service worker for offline capabilities

### 📱 Progressive Web App Support
- **Auto-generated PWA assets**: Icons, splash screens, and manifest
- **Offline support**: Service worker with intelligent caching
- **Install prompts**: Native app-like experience
- **Dark/light modes**: Theme support for your PWA
- **Push notifications**: Ready infrastructure

### 🔄 Built-in Router
- **Zero-dependency**: No routing libraries needed
- **Suspense-like API**: Async data loading
- **Code-splitting**: Automatic lazy loading
- **SPA navigation**: Fast page transitions

### 🔨️ Developer Experience
- **Hot reload**: Sub-second refresh times with bun's lightning-fast runtime
- **Bun-powered**: Built on the fastest JS runtime available
- **Tailwind integration**: Zero-config styling with built-in support
- **Language choice**: JavaScript or TypeScript with equal first-class support
- **Smart defaults**: Sensible configurations out of the box
- **Theme flexibility**: Light, dark and system theme modes

### 🚀 Deployment Options

0x1 projects are optimized for modern hosting platforms:

```bash
# Deploy to Vercel (recommended)
bun 0x1 deploy --provider=vercel

# Deploy to Netlify
bun 0x1 deploy --provider=netlify

# Custom deployment
bun 0x1 build
# Then deploy the 'dist' directory
```

The framework is specially optimized for Vercel Edge Runtime and Netlify Edge Functions, providing the best possible performance at the edge.

## 💡 Community & Support

- [GitHub Issues](https://github.com/Triex/0x1/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/Triex/0x1/discussions) - Ask questions and share ideas
- [NPM Package](https://www.npmjs.com/package/0x1) - Latest releases

## 👷 Contributing

Contributions are welcome! Here's how you can help:

```bash
# Clone the repository
git clone https://github.com/Triex/0x1.git
cd 0x1

# Install dependencies
bun install

# Run tests
bun test

# Build the framework
bun run build
```

Please see our [Contributing Guidelines](https://github.com/Triex/0x1/blob/main/CONTRIBUTING.md) for more details.

## 📜 License

0x1 is licensed under the [TDL v1 License](https://github.com/Triex/0x1/blob/main/LICENSE).

## 🏎️ Performance Comparison

| Metric              | 0x1 | React | Vue  | Svelte | Next.js |
|---------------------|-------|-------|------|--------|--------|
| JS Size (gzip)      | 5kB   | 44kB  | 31kB | 21kB   | 80kB+   |
| Time to Interactive | 0.3s  | 1.1s  | 0.7s | 0.6s   | 1.5s+   |
| Memory Usage        | Low   | High  | Med  | Low    | High    |
| Lighthouse Score    | 100   | 75-85 | 85-95| 90-95  | 70-85   |

## 💡 Philosophy

0x1's philosophy is radically different from most modern frameworks:

1. **Zero abstraction cost**: No virtual DOM or complex state tracking
2. **Browser-native**: Leverage what browsers are good at
3. **Minimal over comprehensive**: Focused feature set, exceptional at few things
4. **No dependencies**: Entire framework in one tiny package
5. **Extreme performance**: Optimize for loaded page performance, not DX shortcuts

## 🚀 Quick Start

```bash
# Create a new 0x1 app with Bun
bun install -g 0x1

# Create a new project (defaults to TypeScript)
bun 0x1 new my-app

# Or specify JavaScript explicitly
bun 0x1 new my-app --javascript

# Or use the CLI directly
npx 0x1 new my-app

# Navigate to the app directory
cd my-app

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view your app in action!

## 📋 Template Options

0x1 now offers a streamlined template selection process with three complexity levels, each available in both TypeScript and JavaScript:

### 🔍 Minimal Templates

**Ideal for:** Small projects, landing pages, or developers who want full control

- Basic project structure with essential files only
- No routing or component architecture (just the basics)
- Tailwind CSS included
- Extremely lightweight with minimal dependencies

### 🧩 Standard Templates

**Ideal for:** Most web applications and sites

- Complete project structure with organized files
- Router implementation with multi-page support
- Component architecture for building complex UIs
- Tailwind CSS with dark mode support
- Common utility functions and helpers

### 🚀 Full Templates

**Ideal for:** Production applications with advanced features

- Everything in Standard, plus:
- Built-in state management system
- Progressive Web App (PWA) support
- Service worker for offline capabilities
- Advanced components with animations
- Background sync for offline form submissions
- Push notification infrastructure

Create your project with the desired template using the CLI:

```bash
bun create 0x1 my-app
```

The CLI will guide you through selecting your preferred language (TypeScript or JavaScript) and template complexity. Build

```bash
bun run build
```

## 🚀 Getting Started

### Create a New Project

```bash
bun create 0x1 my-app
```

Or install 0x1 globally:

```bash
bun install -g 0x1
0x1 new my-app
```

### Development

```bash
cd my-app
bun dev
```

### Production Build

```bash
bun run build
```

### Deploy 

Deploy anywhere with a static hosting provider:

```bash
bun run deploy
```

## 📦 Installation

### Prerequisites
- [Bun](https://bun.sh) v1.0.0 or higher (REQUIRED)

### Installation
```bash
bun install -g 0x1
```

> **Important:** The 0x1 framework uses Bun-specific APIs and cannot run on Node.js/npm.

## Publishing to npm Registry

```bash
# Log in to npm
npm login

# Build and publish with Bun
bun run prepublishOnly
npm publish
```

## 📦 Version Information

Current version: **0.0.13**

This initial release provides all core functionality with a stable API. You can install it directly with Bun (required):

## 💡 Philosophy

0x1's philosophy is radically different from most modern frameworks:

1. **Zero abstraction cost**: No virtual DOM or complex state tracking
2. **Browser-native**: Leverage what browsers are good at
3. **Minimal over comprehensive**: Focused feature set, exceptional at few things
4. **No dependencies**: Entire framework in one tiny package
5. **Extreme performance**: Optimize for loaded page performance, not DX shortcuts

## 🏎️ Performance Comparison

| Metric              | 0x1 | React | Vue  | Svelte | Next.js |
|---------------------|-------|-------|------|--------|---------|
| JS Size (gzip)      | 5kB   | 44kB  | 31kB | 21kB   | 80kB+   |
| Time to Interactive | 0.3s  | 1.1s  | 0.7s | 0.6s   | 1.5s+   |
| Memory Usage        | Low   | High  | Med  | Low    | High    |
| Lighthouse Score    | 100   | 75-85 | 85-95| 90-95  | 70-85   |

## 🧩 Component System

0x1's component system is intentionally simple but powerful:

```typescript
import { createElement, Component } from '0x1';

// Define a component
interface ButtonProps {
  onClick: () => void;
  label: string;
}

const Button: Component<ButtonProps> = (props) => {
  return createElement('button', {
    className: 'btn',
    onClick: props.onClick,
    children: [props.label]
  });
};

// Use the component
const myButton = Button({
  onClick: () => console.log('Clicked!'), 
  label: 'Click me'
});
```

## 🗺️ Routing

0x1 uses a simple but powerful routing system:

```typescript
import { Router } from '0x1';

const router = new Router({
  root: document.getElementById('app')
});

router.addRoute('/', HomePage);
router.addRoute('/about', AboutPage);
router.addRoute('/products/:id', ProductPage);

router.init();
```

## 🎭 Suspense-like Data Loading

```typescript
import { suspense } from '0x1';

function ProductPage({ params }) {
  const container = document.createElement('div');
  
  suspense(
    container,
    fetchProduct(params.id),
    (product) => `
      <h1>${product.name}</h1>
      <p>${product.description}</p>
      <span class="price">${product.price}</span>
    `
  );
  
  return container;
}
```

## 🖌️ Styling

0x1 works seamlessly with Tailwind CSS and includes PostCSS setup:

```typescript
// styles are automatically processed
import './styles.css';

const Card: Component = () => {
  return createElement('div', {
    className: 'p-4 bg-white rounded shadow-lg hover:shadow-xl transition-shadow',
    children: ['Card content here']
  });
};
```

## 📄 CLI Commands

| Command | Description |
|---------|-------------|
| `0x1 new <name>` | Create a new 0x1 project |
| `0x1 dev` | Start development server |
| `0x1 build` | Create production build |
| `0x1 preview` | Preview production build |
| `0x1 deploy` | Deploy to production |
| `0x1 pwa` | Add Progressive Web App functionality |
| `0x1 generate component <name>` | Generate a component |
| `0x1 generate page <name>` | Generate a page |

## 🗂️ Project Structure

```
my-app/
├── 0x1.config.ts           # 0x1 configuration
├── src/
│   ├── components/           # Reusable components
│   ├── pages/                # Page components
│   ├── framework/            # Extended framework code (optional)
│   ├── styles/               # CSS styles
│   ├── utils/                # Utility functions
│   ├── app.ts                # Application entry
│   └── index.html            # HTML entry point
├── public/                   # Static assets
├── package.json              # Project dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## 🎨 Tailwind CSS Integration

0x1 now provides **automatic Tailwind CSS processing** during development and build:

### Zero-Config Auto-Detection

When you run `0x1 dev`, the framework automatically:

1. Detects if you have a `tailwind.config.js` file in your project
2. Finds your CSS input file (typically in `styles/main.css` or similar locations)
3. Creates the processed output file at `public/styles/tailwind.css`
4. Watches for changes during development

All of this happens automatically without additional configuration!

### How to Use

Simply install Tailwind CSS in your project:

```bash
bun add -d tailwindcss postcss autoprefixer
bunx tailwindcss init
```

Create your input CSS file (e.g., `styles/main.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Reference the processed file in your HTML:

```html
<link rel="stylesheet" href="/styles/tailwind.css">
```

Then just run 0x1 dev:

```bash
0x1 dev
```

That's it! 0x1 handles everything else for you.

### Legacy Method (Optional)

For projects that need more control, you can still manage Tailwind processing manually with scripts:

```json
// package.json
{
  "scripts": {
    "dev": "bun run tailwind & 0x1 dev",
    "build": "bun run tailwind:build && 0x1 build",
    "tailwind": "tailwindcss -i ./styles/main.css -o ./public/styles/tailwind.css --watch",
    "tailwind:build": "tailwindcss -i ./styles/main.css -o ./public/styles/tailwind.css --minify"
  }
}
```

To disable automatic Tailwind processing:

```bash
0x1 dev --skip-tailwind
```

### Configuration Options

You can configure file ignoring in your 0x1.config.js:

```javascript
// 0x1.config.js
export default {
  build: {
    // Patterns to ignore when building or watching
    ignore: [
      'node_modules',
      '.git',
      'dist',
      '.DS_Store',
      '*.log',
      'coverage',
      '.vscode',
      '.github',
      'tmp',
      'docs'
    ]
  }
}
```

## 📕 Configuration

0x1 configuration is minimal and straightforward:

```typescript
// 0x1.config.ts
import { _0x1Config } from '0x1';

const config: _0x1Config = {
  app: {
    name: 'my-0x1-app',
    title: 'My 0x1 App',
    description: 'Built with 0x1 framework'
  },
  server: {
    port: 3000,
    host: 'localhost',
    basePath: '/'
  },
  routes: {
    '/': './pages/home',
    '/about': './pages/about',
    '/products/:id': './pages/product'
  },
  styling: {
    tailwind: true,
    darkMode: 'class',
    customTheme: {
      colors: {
        primary: '#0077cc'
      }
    }
  },
  optimization: {
    minify: true,
    precomputeTemplates: true,
    prefetchLinks: true
  },
  deployment: {
    provider: 'vercel', // or 'netlify', 'cloudflare', etc.
    edge: true
  }
};
```

## 🛠️ Advanced Usage

### Custom server middleware

```typescript
// 0x1.config.ts
export default {
  // ...other config
  server: {
    middleware: [
      async (req, res, next) => {
        console.log(`Request: ${req.url}`);
        await next();
      }
    ]
  }
};
```

### Custom build processes

```typescript
// 0x1.config.ts
export default {
  // ...other config
  build: {
    hooks: {
      beforeBuild: async () => {
        console.log('Starting build process...');
      },
      afterBuild: async () => {
        console.log('Build complete!');
      }
    }
  }
};
```

## 📈 0x1 vs Other Frameworks

### Why 0x1?

- **Radically minimal**: Focus on what matters
- **Performance first**: No compromises for DX
- **Zero dependencies**: No supply chain vulnerabilities
- **Exceptionally small**: Tiny bundle size
- **Browser-native**: Uses what browsers are good at

## 📝 License

0x1 is licensed under the TriexDev License v1 (TDL v1) - see the [LICENSE](LICENSE) file for details.

## 📦 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to 0x1.

## 📱 PWA Features <a name="pwa-features"></a>

### Creating a PWA

Turn your web application into a Progressive Web App with a single command:

```bash
0x1 pwa
```

This interactive command will guide you through configuring your PWA, including:

- App name and metadata
- Theme colors and visual styles
- Icon generation (standard, maskable, and splash screens)
- Offline support with customizable strategies
- Service worker setup with advanced caching options

### PWA Configuration Options

#### Adding PWA during project creation

The easiest way to add PWA functionality is during project creation:

```bash
# Create a new project with PWA support and custom theme
0x1 new my-project --pwa --theme "royal-purple"
```

During interactive project creation, you'll get these options:

1. **Project theme selection** - Choose from several beautiful themes that affect both the application and PWA appearance:
   - Midnight Blue - Dark blue theme with modern accents
   - Forest Green - Natural green theme with earthy tones 
   - Royal Purple - Rich purple theme with elegant styling
   - Slate Gray - Neutral gray theme with professional look
   - Classic - Default 0x1 styling

2. **PWA options** - Enable Progressive Web App features with:
   - Automatic icon generation based on project name (extracts initials or meaningful characters)
   - Theme-based icon styling with visual elements matching your selected theme
   - Custom PWA colors if desired

#### Adding PWA to existing projects

For existing projects, use the `pwa` command with customization options:

```bash
# Basic usage with common options
0x1 pwa --name "My Amazing App" --themeColor "#ff0000" --offline

# Full customization
0x1 pwa --name "My App" \
         --shortName "App" \
         --themeColor "#0077cc" \
         --backgroundColor "#ffffff" \
         --description "My awesome PWA application" \
         --icons \
         --offline \
         --skipPrompts
```

#### Available Theme Colors

When creating a project through the interactive CLI, you can choose from these predefined theme colors:

- **Blue**: `#0077cc` (Default)
- **Slate**: `#475569`
- **Green**: `#059669`
- **Purple**: `#7c3aed`
- **Rose**: `#e11d48`
- **Custom**: Enter any valid hex color

#### iOS Status Bar Options

For iOS devices, you can customize the appearance of the status bar in your PWA:

- **Default**: Standard gray background with default text color
- **Black**: Black background with white text
- **Black Translucent**: Content appears under the status bar, creating a true fullscreen experience

The black-translucent option is particularly useful for immersive UIs where you want your app content to extend to the very top of the screen.

### Advanced PWA Features

- **Complete Asset Generation**: Automatically generates all required icons, including:
  - Standard icons (multiple sizes)
  - Maskable icons for Android adaptive icons
  - iOS splash screens
  - Favicons
  - Shortcut icons for quick actions

- **Intelligent Service Worker**: Provides:
  - Network-first strategy for dynamic content
  - Cache-first strategy for static assets
  - Offline fallback page with customizable styling
  - Automatic cache management
  - Background sync for form submissions

- **Enhanced User Experience**:
  - Install prompt with customizable timing
  - Native app-like experience on home screen
  - Offline indication and notifications
  - Update notifications when new content is available
  - Dark mode support for PWA components

- **Developer Experience**:
  - TypeScript-first implementation
  - Simple API for service worker registration
  - Customizable caching strategies
  - Easy offline page customization
  - Built-in connectivity detection

### TDL License Integration

0x1 now supports the TriexDev License (TDL) directly in its project creation flow:

```bash
0x1 new my-project --tdlLicense
```

This will automatically include the TDL v1 license in your project.

## 🗂️ Template Structure

Each template complexity level is organized as follows:

### Minimal Template

```
minimal-app/
├── components/       # Basic UI components (minimal)
├── pages/            # Simple page components w home
|  ├── home.js/ts
|  ├── not-found.js/ts
├── styles/           # CSS styling with Tailwind
│   └── main.css      
├── public/           # Static assets
│   └── favicon.svg
├── app.js/ts        # Application entry point
├── index.html       # HTML template
├── 0x1.config.js/ts # Simple configuration
└── package.json     # Dependencies and scripts
```

### Standard Template

```
standard-app/
├── components/       # Reusable UI components
│   ├── Card.js/ts
│   ├── Footer.js/ts
│   └── Header.js/ts
├── lib/             # Library code and utilities
│   └── router.js/ts  # Client-side router implementation
├── pages/           # Page components
│   ├── home.js/ts
│   ├── about.js/ts
│   └── not-found.js/ts
├── public/          # Static assets
│   └── favicon.svg
├── styles/          # CSS styling with Tailwind
│   └── main.css
├── app.js/ts        # Main application entry point
├── index.html       # HTML template
├── 0x1.config.js/ts # Standard configuration
└── package.json     # Dependencies and scripts
```

### Full Template

```
full-app/
├── components/       # Advanced UI components
│   ├── Header.js/ts
│   ├── Footer.js/ts
│   ├── ThemeToggle.js/ts
│   └── Toaster.js/ts
├── lib/             # Library code and utilities
│   └── router.js/ts  # Advanced client-side router
├── pages/           # Page components with dynamic loading
│   ├── home.js/ts
│   ├── about.js/ts
│   ├── features.js/ts
│   └── not-found.js/ts
├── public/          # Static assets
│   ├── icons/       # PWA icons
│   ├── manifest.json # PWA manifest
│   └── service-worker.js # PWA service worker
├── store/           # State management
│   └── index.js/ts
├── styles/          # CSS styling with Tailwind
│   └── main.css
├── app.js/ts        # Application entry with state
├── sw-register.js/ts # Service worker registration
├── index.html       # HTML template with PWA support
├── 0x1.config.js/ts # Advanced configuration
└── package.json     # Dependencies and scripts
```
