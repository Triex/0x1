<p align="center">
  <img src="./public/0x1-banner.svg" alt="0x1 Framework" width="800" />
</p>

<p align="center">
  <strong>Lightning-fast TypeScript-only web framework with zero overhead</strong><br>
  <span>The ultra-minimal, maximum performance framework powered by Bun</span>
</p>

<p align="center">
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-philosophy"><strong>Philosophy</strong></a> ·
  <a href="#-cli-commands"><strong>CLI Commands</strong></a> ·
  <a href="#-pwa-features"><strong>PWA Support</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/0x1"><img src="https://img.shields.io/npm/v/0x1.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/0x1"><img src="https://img.shields.io/npm/dm/0x1.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/Triex/0x1"><img src="https://img.shields.io/github/stars/Triex/0x1?style=flat-square" alt="github stars"></a>
  <img src="https://img.shields.io/badge/bundle_size-~16kb-blue?style=flat-square" alt="bundle size" />
  <img src="https://img.shields.io/badge/dependencies-0-green?style=flat-square" alt="dependencies" />
</p>

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Powered_by-Bun-black?style=flat-square&logo=bun" alt="Powered by Bun" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-First-blue?style=flat-square&logo=typescript" alt="TypeScript First" /></a>
  <img src="https://img.shields.io/badge/ESM-Native-brightgreen?style=flat-square" alt="ESM Native" />
  <img src="https://img.shields.io/badge/License-TDL_v1-blue?style=flat-square" alt="License" />
</p>

---

## ⚡ Features

### 💨 Extreme Performance
- **Tiny runtime**: ~16kb total JS bundle size 
- **Zero hydration cost**: No client-side hydration overhead
- **Native ESM**: Browser-native module loading without bundling
- **Precomputed content**: Minimal JS for maximum speed

### 🧩 Components Without Overhead
- **TypeScript-Only**: Exclusively built for TypeScript with full type safety
- **Simple API**: Modern component system with comprehensive TypeScript typing
- **Minimal abstractions**: Near-vanilla performance with type-checked templates
- **Custom Diffing**: Optimized DOM updates with TypeScript safety
- **Compile-time validation**: Catch errors early with strict typing

### 🧪 Template Complexity Options

0x1 offers three complexity levels for projects, all built with TypeScript:

```bash
# Create a new project (all templates use Next.js 15 app directory structure)
bun 0x1 new my-app

# Customize your project complexity
bun 0x1 new my-app --complexity=minimal
bun 0x1 new my-app --complexity=standard
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

### Next.js 15 App Directory Structure

**All 0x1 templates now use the Next.js 15 app directory structure by default:**
- Modern app directory structure with file-based routing
- Nested layouts with component co-location
- Special file conventions for pages and layouts
- Native support for `page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`, etc.

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
- **App directory routing**: Next.js 15-style file-based routing system
- **Nested layouts**: Support for shared UI across routes
- **Special files**: Support for `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx`

### 🔨️ Developer Experience
- **Hot reload**: Sub-second refresh times with bun's lightning-fast runtime
- **Bun-powered**: Built on the fastest JS runtime available
- **Tailwind integration**: Zero-config styling with built-in support
- **TypeScript-native**: Full type safety with TypeScript-only codebase
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

0x1 now offers a streamlined template selection process with three complexity levels, all built with TypeScript for maximum type safety and developer experience:

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

The CLI will guide you through selecting your preferred template complexity and other project options. Build

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
# Using bun (recommended)
bun install -g 0x1

# Or using npm
npm install -g 0x1
```

### Important: Global CLI Access

After installing with `bun install -g`, you need to add Bun's bin directory to your PATH to use the `0x1` command:

```bash
# Add these lines to your shell config (~/.bashrc, ~/.zshrc, etc.)
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

Alternatively, you can always use 0x1 without modifying your PATH:

```bash
bunx 0x1 <command>
```

> **Note:** When installed globally, you may need to run the CLI using `bun 0x1` instead of just `0x1`. This is due to how Bun handles global binary installations.
>
> ```bash
> # Instead of this
> 0x1 new my-project
> 
> # Use this
> bun 0x1 new my-project
> ```

## 📦 Version Information

Current version: **0.0.53**

This initial release provides all core functionality with a stable API. You can install it directly with Bun (required):

## 💡 Philosophy

0x1's philosophy is radically different from most modern frameworks:

1. **Zero abstraction cost**: No virtual DOM or complex state tracking
2. **Browser-native**: Leverage what browsers are good at
3. **Minimal over comprehensive**: Focused feature set, exceptional at few things
4. **No dependencies**: Entire framework in one tiny package
5. **Extreme performance**: Optimize for loaded page performance, not DX shortcuts

## 🏎️ Performance Comparison

Expected out-of-the-box performance

| Metric              | 0x1 | React | Vue  | Svelte | Next.js |
|---------------------|-------|-------|------|--------|---------|
| JS Size (gzip)      | 5kB   | 44kB  | 31kB | 4-21kB | 80kB+   |
| Time to Interactive | 0.3s  | 1.1s  | 0.7s | 0.6s   | 1.5s+   |
| Memory Usage        | Low   | High  | Med  | Low    | High    |
| Lighthouse Score    | 100   | 75-85 | 85-95| 90-95  | 70-85   |

## 🧩 Component System

0x1's component system is intentionally simple but powerful:

```tsx
import { Fragment } from '0x1';

// Define a component
interface ButtonProps {
  onClick: () => void;
  label: string;
}

export function Button({ onClick, label }: ButtonProps) {
  return (
    <button 
      className="btn" 
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// Use the component
function App() {
  return (
    <div>
      <Button 
        onClick={() => console.log('Clicked!')} 
        label="Click me" 
      />
    </div>
  );
}
```

## 🗺️ Routing

0x1 uses a simple but powerful routing system:

```typescript
import { Router } from '0x1';

// Initialize the router with the root element
const router = new Router(document.getElementById('app')!);

// Add routes
router.addRoute('/', HomePage);
router.addRoute('/about', AboutPage);
router.addRoute('/products/:id', ProductPage);

// Set a handler for 404 pages
router.setNotFound(NotFoundPage);

// Start the router
router.navigateTo('/');
```

## 🎭 Suspense-like Data Loading

```tsx
import { useState, useEffect } from '0x1';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface ProductPageProps {
  params: { id: string };
}

export function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const data = await fetchProduct(params.id);
      setProduct(data);
      setLoading(false);
    }
    
    loadProduct();
  }, [params.id]);
  
  return (
    <div className="product-container">
      {loading ? (
        <div className="loading">Loading product...</div>
      ) : product ? (
        <>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <span className="price">{product.price}</span>
        </>
      ) : (
        <div className="error">Product not found</div>
      )}
    </div>
  );
}
```

## 🖌️ Styling

0x1 works seamlessly with Tailwind CSS and includes PostCSS setup:

```tsx
// styles are automatically processed
import './styles.css';

interface CardProps {
  children?: string | JSX.Element | (string | JSX.Element)[];
}

export function Card({ children = 'Card content here' }: CardProps) {
  return (
    <div className="p-4 bg-white rounded shadow-lg hover:shadow-xl transition-shadow">
      {children}
    </div>
  );
}
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
```bash
# No extra setup required!
# Just install Tailwind CSS
bun add -d tailwindcss postcss autoprefixer

# Create a tailwind.config.js
bunx tailwindcss init

# Create an input CSS file
mkdir -p styles
echo '@tailwind base;\n@tailwind components;\n@tailwind utilities;' > styles/main.css
```

Then just run 0x1 dev:

```bash
0x1 dev
```

That's it! 0x1 automatically detects and processes your Tailwind CSS files, handling everything for you.

### Next.js-Like Developer Experience

The 0x1 framework is designed to provide a seamless, Next.js-like developer experience:

```json
// package.json - Simple and elegant
{
  "scripts": {
    "dev": "0x1 dev",     // Starts development server with hot reload
    "build": "0x1 build", // Optimized production build
    "preview": "0x1 preview" // Preview production build
  }
}
```

Features include:

1. **Zero-Config TypeScript** - TypeScript files are automatically bundled with the correct settings
2. **Automatic CSS Processing** - Tailwind and PostCSS are handled automatically
3. **Fast Refresh** - Changes are immediately reflected without losing state
4. **Smart Routing** - Route handling without complex configuration
5. **Flexible Structure** - Support for both root-level and src directory project structures

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

## 🚀 App Directory Structure (Next.js 15-Style)

0x1 now supports a modern Next.js 15-style app directory structure with file-based routing, nested layouts, and special file conventions.

### File Conventions

```
app/
  layout.tsx      # Root layout (required)
  page.tsx        # Home page component for the root route
  not-found.tsx   # Custom 404 page
  about/
    page.tsx      # /about route
  contact/
    page.tsx      # /contact route
  features/
    layout.tsx    # Nested layout for the features section
    page.tsx      # /features route
    [id]/         # Dynamic route segment
      page.tsx    # /features/[id] route
```

### Special Files

- `page.tsx` - Renders the unique UI of a route and makes it publicly accessible
- `layout.tsx` - Shared UI for a segment and its children
- `loading.tsx` - Loading UI for a segment and its children
- `error.tsx` - Error UI for a segment and its children
- `not-found.tsx` - UI for 404 errors

### How Routing Works

- **Automatic Route Discovery**: The `Router` automatically discovers all pages in the `app` directory
- **Nested Layouts**: Layouts wrap child routes and persist across route changes
- **Client Navigation**: Full client-side navigation without page refreshes
- **Zero Configuration**: No need to manually register routes

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

## 🔧 Troubleshooting

### Global CLI Installation Issues

If you encounter `command not found: 0x1` after installing globally with `bun install -g 0x1`, this is because Bun doesn't automatically add its bin directory to your PATH.

#### Quick Solution

You can always use Bun directly to run 0x1 commands without PATH configuration:

```bash
# Alternative way to run any 0x1 command
bunx 0x1 <command>
```

#### Permanent Fix

Add Bun's bin directory to your PATH:

**For macOS (zsh shell - default):**
```bash
# Add these lines to your ~/.zshrc file
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Then reload your shell configuration
source ~/.zshrc
```

**For Linux/older macOS (bash shell):**
```bash
# Add these lines to your ~/.bashrc or ~/.bash_profile file
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Then reload your shell configuration
source ~/.bashrc  # or source ~/.bash_profile
```

**For fish shell:**
```fish
# Add these lines to your ~/.config/fish/config.fish file
set -x BUN_INSTALL "$HOME/.bun"
set -x PATH "$BUN_INSTALL/bin" $PATH

# Then reload your shell configuration
source ~/.config/fish/config.fish
```

**For Windows (WSL):**
```bash
# Add these lines to your ~/.bashrc file in WSL
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Then reload your shell configuration
source ~/.bashrc
```

### Content Not Showing in Browser

If you're experiencing issues with content not displaying in your browser when running a 0x1 project:

1. **Check Browser Console**: Look for MIME type errors related to ES modules

2. **Script Tag Type**: Ensure your script tags in `index.html` don't have `type="module"` if you're not using a bundler:
   ```html
   <!-- Use this for direct browser loading -->
   <script src="./app.js"></script>
   
   <!-- Not this, unless bundling properly -->
   <!-- <script type="module" src="./app.js"></script> -->
   ```

3. **Build Process**: Run the build script before starting the dev server:
   ```bash
   bun run build.js && bun dev
   ```

4. **TypeScript Compilation**: The dev server automatically transpiles TypeScript files, but ensure you're not using ES module imports/exports without proper bundling:
   ```typescript
   // Instead of ES module imports:
   // import { something } from './somewhere';
   
   // Use pattern that works in browsers:
   const { something } = window.globalNamespace;
   ```

5. **Dev Server Configuration**: The 0x1 dev server has been updated to properly handle TypeScript files and set the correct MIME types for browser compatibility.

## 🗂️ Template Structure

All templates now follow the Next.js 15 app directory structure with standardized organization patterns:

### Shared Structure Across All Templates

```
project-name/
├── app/              # Next.js 15 app directory structure
│   ├── layout.tsx    # Root layout wrapper (required)
│   ├── page.tsx      # Home page component
│   ├── not-found.tsx # 404 error page
│   ├── about/        # Route folder
│   │   └── page.tsx  # About page component
│   ├── contact/      # Route folder
│   │   └── page.tsx  # Contact page component
│   └── features/     # Route folder
│       └── page.tsx  # Features page component
├── components/       # Shared components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── ThemeToggle.tsx
├── lib/             # Library code and utilities
│   ├── component-registry.ts # Component registry for app directory
│   ├── jsx-runtime.tsx      # JSX runtime implementation
│   └── theme.ts            # Theme management
├── public/          # Static assets
│   ├── favicon.svg
│   └── manifest.json # PWA manifest (full template only)
├── store/           # State management (standard and full templates)
│   └── index.ts
├── styles/          # CSS styling with Tailwind
│   └── main.css
├── index.html       # HTML template
├── index.tsx        # Application entry point
├── 0x1.config.ts    # Framework configuration
├── tailwind.config.js # Tailwind configuration
└── package.json     # Dependencies and scripts
```

### Template Differences

#### Minimal Template
The minimal template includes only essential files with a simplified app directory structure, basic components, and core styling.

#### Standard Template
The standard template adds more components, state management, and enhanced routing capabilities while maintaining the app directory structure.

#### Full Template
The full template includes everything from standard plus Progressive Web App (PWA) support, advanced components, theming, animations, and comprehensive state management.
