# 0x1 Framework Architecture

This document outlines the architectural design of 0x1, an ultra-minimal TypeScript framework focused on extreme performance and React/Next.js compatibility.

## Core Philosophy

0x1 follows a minimalist architecture with zero dependencies, designed as a drop-in replacement for React and Next.js while maintaining sub-30KB bundle size and extreme performance.

### Key Principles

1. **Zero abstraction cost**: No virtual DOM or complex state tracking
2. **Browser-native**: Leverage what browsers are good at
3. **Minimal over comprehensive**: Focused feature set, exceptional at few things
4. **No dependencies**: Entire framework in one tiny package
5. **TypeScript-first**: Built exclusively for TypeScript with full type safety
6. **React/Next.js compatibility**: Drop-in replacement for existing applications

## Core Architecture

### 1. JSX Runtime (`src/jsx-runtime.ts`)

0x1 includes a custom JSX runtime that eliminates React dependencies while maintaining full JSX functionality:

```typescript
// Custom JSX runtime
export function jsx(type: string, props: any): HTMLElement {
  const element = document.createElement(type);
  
  // Apply props efficiently
  Object.keys(props || {}).forEach(key => {
    if (key === 'children') {
      appendChildren(element, props.children);
    } else if (key.startsWith('on') && typeof props[key] === 'function') {
      // Event handlers
      element.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else if (key === 'className') {
      element.className = props[key];
    } else {
      element.setAttribute(key, props[key]);
    }
  });
  
  return element;
}

export { jsx as jsxs };
export function Fragment({ children }: { children: any }) {
  const fragment = document.createDocumentFragment();
  appendChildren(fragment, children);
  return fragment;
}
```

Key features:
- **Zero React dependencies**: Use JSX without React
- **Automatic transpilation**: Bun handles JSX transforms
- **Development/production modes**: Enhanced debugging in dev
- **TypeScript integration**: Full type safety

### 2. React-Compatible Hooks System (`src/hooks/`)

Provides a complete React-compatible hooks API with enhanced features:

```typescript
// State management identical to React's useState
export function useState<T>(initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  const componentId = getCurrentComponentId();
  const hookIndex = getNextHookIndex();
  
  if (!stateRegistry[componentId]?.[hookIndex]) {
    initializeState(componentId, hookIndex, initialValue);
  }
  
  const state = stateRegistry[componentId][hookIndex];
  
  const setState = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(state.value) 
      : newValue;
      
    if (nextValue !== state.value) {
      state.value = nextValue;
      scheduleComponentUpdate(componentId);
    }
  };
  
  return [state.value, setState];
}

// Enhanced hooks for 0x1
export function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [url]);
  
  return { data, loading, error };
}
```

Supported hooks:
- **useState** - State management with React compatibility
- **useEffect** - Side effects and lifecycle
- **useCallback** - Function memoization
- **useMemo** - Value memoization
- **useRef** - DOM references and mutable values
- **useFetch** - Built-in data fetching with loading states
- **useForm** - Form state management with validation
- **useLocalStorage** - Persistent state with localStorage

### 3. App Directory Router (`src/router/`)

Next.js 15-compatible file-based routing with app directory structure:

```typescript
export class AppRouter {
  private routes: Map<string, RouteComponent> = new Map();
  private layouts: Map<string, LayoutComponent> = new Map();
  
  constructor(private rootElement: HTMLElement) {
    this.initializeRouter();
    this.setupNavigation();
  }
  
  // Automatically discover routes from app directory
  async discoverRoutes() {
    const routes = await this.scanAppDirectory();
    
    routes.forEach(({ path, component, layout }) => {
      this.addRoute(path, component);
      if (layout) this.addLayout(path, layout);
    });
  }
  
  // Handle client-side navigation
  navigate(path: string, options: NavigationOptions = {}) {
    if (options.replace) {
      history.replaceState(null, '', path);
    } else {
      history.pushState(null, '', path);
    }
    
    this.renderRoute(path);
  }
  
  // Render route with nested layouts
  private async renderRoute(path: string) {
    const route = this.findRoute(path);
    const layouts = this.getLayoutsForPath(path);
    
    // Show loading state
    this.showLoading();
    
    try {
      // Load component and layouts
      const [component, ...layoutComponents] = await Promise.all([
        route.load(),
        ...layouts.map(layout => layout.load())
      ]);
      
      // Render with nested layouts
      const rendered = this.renderWithLayouts(component, layoutComponents);
      this.rootElement.innerHTML = '';
      this.rootElement.appendChild(rendered);
      
    } catch (error) {
      this.renderError(error);
    }
  }
}
```

Features:
- **File-based routing**: `app/page.tsx`, `app/about/page.tsx`
- **Nested layouts**: `app/layout.tsx`, `app/blog/layout.tsx`
- **Special files**: `loading.tsx`, `error.tsx`, `not-found.tsx`
- **Dynamic routes**: `app/blog/[slug]/page.tsx`
- **Client-side navigation**: Fast SPA transitions
- **Code splitting**: Automatic lazy loading

### 4. Link Component (`src/components/Link.tsx`)

Next.js-compatible Link component for client-side navigation:

```typescript
import { useRouter } from '../router';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  className?: string;
}

export default function Link({ 
  href, 
  children, 
  replace = false, 
  scroll = true,
  prefetch = true,
  ...props 
}: LinkProps) {
  const router = useRouter();
  
  const handleClick = (e: Event) => {
    e.preventDefault();
    router.navigate(href, { replace, scroll });
  };
  
  // Prefetch on hover (when enabled)
  const handleMouseEnter = () => {
    if (prefetch) {
      router.prefetch(href);
    }
  };
  
  return (
    <a 
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </a>
  );
}
```

### 5. Metadata System (`src/metadata/`)

Next.js 15-compatible metadata handling:

```typescript
// Metadata types
export interface Metadata {
  title?: string | { template?: string; default?: string };
  description?: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    images?: string[];
    type?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
  };
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
  icons?: {
    icon?: string;
    apple?: string;
  };
}

// Automatic metadata processing
export function processMetadata(metadata: Metadata, pathname: string) {
  // Update document head with metadata
  updateTitle(metadata.title, pathname);
  updateMetaTags(metadata);
  updateOpenGraph(metadata.openGraph);
  updateTwitterCard(metadata.twitter);
}
```

## CLI Architecture (`src/cli/`)

### 1. Project Creation

Modern project scaffolding with multiple template options:

```typescript
// Template complexity levels
export enum TemplateComplexity {
  MINIMAL = 'minimal',    // Basic structure, essential files
  STANDARD = 'standard',  // Complete structure with routing
  FULL = 'full'          // Everything + PWA + advanced features
}

export async function createProject(name: string, options: CreateOptions) {
  const templatePath = getTemplatePath(options.complexity);
  
  // Copy template files
  await copyTemplate(templatePath, name);
  
  // Process template variables
  await processTemplateFiles(name, options);
  
  // Install dependencies
  await installDependencies(name);
  
  // Initialize PWA if requested
  if (options.pwa) {
    await setupPWA(name, options);
  }
}
```

### 2. Development Server

Bun-powered development server with hot reload:

```typescript
export class DevServer {
  private server: Server;
  private watcher: FSWatcher;
  
  async start(port: number = 3000) {
    // Start Bun server
    this.server = Bun.serve({
      port,
      fetch: this.handleRequest.bind(this),
      websocket: this.handleWebSocket.bind(this)
    });
    
    // Set up file watching
    this.watcher = watch('./src', { recursive: true });
    this.watcher.on('change', this.handleFileChange.bind(this));
    
    // Auto-detect and process Tailwind
    if (await this.hasTailwindConfig()) {
      await this.processTailwind();
    }
  }
  
  private async handleFileChange(filename: string) {
    // TypeScript compilation
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      await this.compileTypeScript(filename);
    }
    
    // CSS processing
    if (filename.endsWith('.css')) {
      await this.processCSS(filename);
    }
    
    // Trigger hot reload
    this.broadcastReload();
  }
}
```

## Build System

### 1. Production Optimization

```typescript
export async function buildForProduction() {
  // Bundle application
  const result = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'browser',
    minify: true,
    splitting: true,
    sourcemap: false
  });
  
  // Optimize assets
  await optimizeImages('./dist');
  await generateManifest('./dist');
  
  // Generate service worker if PWA
  if (await isPWAProject()) {
    await generateServiceWorker('./dist');
  }
}
```

### 2. Bundle Analysis

```typescript
export function analyzeBundleSize(buildResult: BuildResult) {
  const stats = {
    totalSize: calculateTotalSize(buildResult),
    jsSize: calculateJSSize(buildResult),
    cssSize: calculateCSSSize(buildResult),
    dependencies: analyzeDependencies(buildResult)
  };
  
  // Ensure under 30KB target
  if (stats.totalSize > 30 * 1024) {
    console.warn('Bundle size exceeds 30KB target');
  }
  
  return stats;
}
```

## PWA Architecture

### 1. Automatic Asset Generation

```typescript
export async function generatePWAAssets(config: PWAConfig) {
  // Generate icons in multiple sizes
  await generateIcons(config.icon, [16, 32, 48, 96, 144, 192, 512]);
  
  // Generate manifest
  const manifest = {
    name: config.name,
    short_name: config.shortName,
    description: config.description,
    theme_color: config.themeColor,
    background_color: config.backgroundColor,
    display: 'standalone',
    icons: generateIconEntries(),
    start_url: '/',
    scope: '/'
  };
  
  await writeFile('./public/manifest.json', JSON.stringify(manifest, null, 2));
}
```

### 2. Service Worker Generation

```typescript
export function generateServiceWorker(options: SWOptions) {
  const swContent = `
// 0x1 Service Worker
const CACHE_NAME = '0x1-v${options.version}';
const STATIC_ASSETS = [${options.staticAssets.map(a => `'${a}'`).join(', ')}];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
`;
  
  return swContent;
}
```

## Performance Optimizations

### 1. Minimal Runtime

- **Direct DOM manipulation**: No virtual DOM overhead
- **Tree shaking**: Unused code elimination
- **Code splitting**: Load only what's needed
- **Native ESM**: Browser-native modules

### 2. Build-time Optimizations

- **Bun bundling**: Ultra-fast compilation
- **TypeScript optimization**: Efficient transpilation
- **CSS processing**: Tailwind optimization
- **Asset optimization**: Image compression, font subsetting

### 3. Runtime Optimizations

- **Efficient diffing**: Minimal DOM updates
- **Memory management**: Automatic cleanup
- **Event delegation**: Optimized event handling
- **Lazy loading**: Component and route splitting

## Future Architecture

### Planned Features

1. **Server Actions**: `"use server"` and `"use client"` directives
2. **Streaming SSR**: Server-side rendering with streaming
3. **Edge Runtime**: Optimized edge deployment
4. **Enhanced Error Boundaries**: React-error-boundary compatibility
5. **Crypto Template**: Wallet Connect, NFT viewing, DeFi components

The architecture is designed to scale while maintaining the core philosophy of minimalism and extreme performance.
