# 0x1 Framework Architecture

This document outlines the architectural design of 0x1, an ultra-minimal TypeScript framework focused on extreme performance.

## Core Architecture

0x1 follows a minimalist architecture with these key components:

### 1. Component System (`src/core/component.ts`)

The component system provides a lightweight abstraction for creating DOM elements without the overhead of a virtual DOM:

```typescript
// Component creation
export function createElement<T extends Element>(
  tag: string,
  props: ComponentProps
): T {
  const element = document.createElement(tag) as T;
  
  // Apply props to element
  applyProps(element, props);
  
  return element;
}

// Component function type for type safety
export type Component<P = {}> = (props: P) => HTMLElement;
```

Key features:
- Direct DOM manipulation for maximum performance
- Type-safe prop handling with TypeScript
- No virtual DOM overhead
- Support for event handling and attributes

### 2. Hooks System (`src/core/hooks.ts`)

Provides React-like hooks for state management and side effects:

```typescript
// State management like React's useState
export function useState<T>(initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] {
  const componentId = getCurrentComponentId();
  const stateId = getNextStateId();
  
  if (!stateRegistry[componentId]?.[stateId]) {
    stateRegistry[componentId] = stateRegistry[componentId] || {};
    stateRegistry[componentId][stateId] = {
      value: typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    };
  }
  
  const state = stateRegistry[componentId][stateId];
  
  const setState = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(state.value) 
      : newValue;
      
    if (nextValue !== state.value) {
      state.value = nextValue;
      scheduleUpdate(componentId);
    }
  };
  
  return [state.value, setState];
}
```

Key features:
- Full useState/useEffect/useRef/useMemo/useCallback support
- Custom hooks for common patterns
- Efficient re-rendering strategy
- Side effect management

### 3. Router (`src/core/navigation.ts`)

Zero-dependency router for SPA navigation with code splitting:

```typescript
export class Router {
  private routes: Record<string, () => Promise<any>>;
  private root: HTMLElement;
  
  constructor(options: RouterOptions) {
    this.routes = options.routes || {};
    this.root = options.root;
    
    // Set up event listeners for navigation
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
    document.addEventListener('click', this.handleLinkClick.bind(this));
    
    // Initial route
    this.handleRouteChange();
  }
  
  // Navigate to a new route
  navigate(path: string) {
    history.pushState(null, '', path);
    this.handleRouteChange();
  }
  
  // Handle route changes
  private async handleRouteChange() {
    const path = window.location.pathname;
    const route = this.routes[path] || this.routes['*'];
    
    if (route) {
      // Show loading state
      this.showLoading();
      
      try {
        // Load component (with code splitting)
        const component = await route();
        
        // Render component
        this.renderComponent(component);
      } catch (error) {
        console.error('Error loading route:', error);
        this.showError();
      }
    }
  }
}
```

Key features:
- History API and hash-based navigation support
- Automatic code splitting
- Suspense-like loading states
- Link prefetching for performance

### 4. Store (`src/core/store.ts`)

Lightweight Redux-inspired state management:

```typescript
export function createStore<T>(
  reducer: Reducer<T>,
  initialState: T,
  middlewares: Middleware<T>[] = []
): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener>();
  
  // Apply middlewares
  const middlewareAPI = {
    getState: () => state,
    dispatch: (action: any) => dispatch(action)
  };
  
  const chain = middlewares.map(middleware => middleware(middlewareAPI));
  let dispatch = (action: any) => {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
    return action;
  };
  
  // Compose middlewares
  if (chain.length > 0) {
    dispatch = compose(...chain)(dispatch);
  }
  
  return {
    getState: () => state,
    dispatch,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
```

Key features:
- Predictable state container
- Action creators and reducers
- Middleware support
- Selectors for efficient derived data

## CLI Architecture (`src/cli/`)

The CLI is structured for an excellent developer experience:

### 1. Command System

Each command is a separate module with a consistent API:

```typescript
// src/cli/commands/new.ts
export async function createNewProject(name: string, options: NewProjectOptions = {}): Promise<void> {
  // Implementation
}

// src/cli/index.ts
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';
  
  switch (command) {
    case 'new':
    case 'create':
      await createNewProject(args._[1], args);
      break;
    // Other commands
  }
}
```

### 2. Interactive UI

Enhanced with beautiful prompts for configuration:

```typescript
async function promptProjectOptions(defaultOptions: {...}): Promise<{...}> {
  // Template selection with enhanced UI
  const templateResponse = await prompts({
    type: 'select',
    name: 'template',
    message: '📦 Select a template:',
    choices: [
      { title: '🔧 Basic', value: 'basic', description: 'A minimal starter template' },
      // Other choices
    ],
    initial: 0,
    hint: '← → to navigate, ↵ to select'
  });
  
  // More prompts...
  
  return {
    template: templateResponse.template,
    // Other options
  };
}
```

### 3. Logger Utility

Beautiful terminal output:

```typescript
export const logger = {
  info: (message: string) => {
    console.log(kleur.blue('ℹ'), message);
  },
  success: (message: string) => {
    console.log(kleur.green('✓'), message);
  },
  // Other methods
};
```

## Template System

Templates are organized by type with a consistent structure:

```
templates/
├── basic/              # JavaScript template
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── app.js
│   │   └── index.html
│   ├── public/
│   ├── 0x1.config.js
│   └── README.md
└── typescript/         # TypeScript template
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── styles/
    │   ├── app.ts
    │   └── index.html
    ├── public/
    ├── 0x1.config.ts
    ├── tsconfig.json
    └── README.md
```

## Performance Optimizations

0x1 achieves extreme performance through:

1. **Zero abstraction cost**: Direct DOM manipulation with no virtual DOM
2. **Native ESM imports**: Browser-native module loading
3. **Bun runtime**: Using Bun's performance advantages
4. **Code splitting**: Loading only what's needed
5. **Minimal dependencies**: Keeping the bundle size tiny
6. **Tree-shaking**: Eliminating unused code

## Testing Strategy

1. **Unit tests**: For core utilities and components
2. **Integration tests**: For routers, stores, and hooks
3. **Performance benchmarks**: Ensuring speed targets are met
4. **Build verification**: Ensuring small bundle size

## Deployment Strategy

0x1 applications are optimized for:

1. **Vercel**: Edge function deployment
2. **Static hosting**: Netlify, GitHub Pages, etc.
3. **Self-hosted**: Simple static file serving

## Future Directions

1. **Server-side rendering**: For improved SEO and initial load
2. **Streaming**: Progressive rendering for large pages
3. **Plugin system**: Extensibility without bloat
4. **Build optimization**: Further reducing bundle size
