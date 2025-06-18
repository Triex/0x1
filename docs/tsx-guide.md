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
import { Fragment, useState, useCallback } from '0x1';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ text, onClick, variant = 'primary' }: ButtonProps) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = useCallback(async () => {
    if (onClick) {
      setLoading(true);
      await onClick();
      setLoading(false);
    }
  }, [onClick]);
  
  const className = variant === 'primary' 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-900';
    
  return (
    <button 
      className={`px-4 py-2 rounded ${className} ${loading ? 'opacity-50' : ''}`} 
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : text}
    </button>
  );
}
```

### Using Components

```tsx
import { 
  Fragment, 
  useState, 
  useReducer, 
  useContext, 
  createContext,
  useTransition,
  useDeferredValue,
  useId 
} from '0x1';
import { Button } from '../components/Button';

// Context example
const CountContext = createContext<{
  count: number;
  increment: () => void;
} | null>(null);

// Reducer example
const countReducer = (state: { count: number }, action: { type: 'increment' | 'decrement' }) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      return state;
  }
};

export function HomePage() {
  const [state, dispatch] = useReducer(countReducer, { count: 0 });
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const searchId = useId();
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    startTransition(() => {
      // This update will be deprioritized
      console.log('Searching for:', deferredQuery);
    });
  };
  
  return (
    <CountContext.Provider value={{ 
      count: state.count, 
      increment: () => dispatch({ type: 'increment' }) 
    }}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to 0x1</h1>
        
        <div className="mb-4">
          <p>Count: {state.count}</p>
          <Button 
            text="Increment" 
            onClick={() => dispatch({ type: 'increment' })} 
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor={searchId}>Search:</label>
          <input
            id={searchId}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type to search..."
            className="ml-2 p-2 border rounded"
          />
          {isPending && <span className="ml-2 text-gray-500">Searching...</span>}
        </div>
        
        <CountDisplay />
      </div>
    </CountContext.Provider>
  );
}

function CountDisplay() {
  const context = useContext(CountContext);
  if (!context) return null;
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <p>Current count from context: {context.count}</p>
      <Button text="Increment via Context" onClick={context.increment} />
    </div>
  );
}
```

## JSX Runtime

The 0x1 JSX runtime provides the following key features:

- **Component-Based Architecture**: Write reusable components with props
- **Complete React Hooks Support**: Full compatibility with `useState`, `useEffect`, `useReducer`, `useContext`, etc.
- **Advanced Performance Hooks**: `useTransition`, `useDeferredValue`, `useId` with priority-based scheduling
- **Fragment Support**: Use `<>...</>` to avoid unnecessary wrapper elements - creates a fragment that doesn't add extra DOM nodes
- **Context API**: Full `createContext` and `useContext` support for prop drilling solutions
- **TypeScript Integration**: Full type-checking of props and component structure
- **CSS Class Management**: Easy handling of conditional classes
- **Event Handling**: Simplified DOM event handling
- **Batched Updates**: Automatic batching with RequestAnimationFrame optimization

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

- Is focused on static rendering with selective client-side reactivity
- Has significantly smaller runtime footprint (~30KB vs React's ~44KB) including all hooks
- Integrates directly with 0x1's optimized templating system
- Uses priority-based scheduling instead of React's virtual DOM diffing
- Provides batched updates with RequestAnimationFrame optimization
- Includes advanced performance hooks (`useTransition`, `useDeferredValue`) out of the box
- Features automatic memory cleanup and context subscription management

## Advanced Hooks Usage

### State Management with useReducer

```tsx
import { useReducer } from '0x1';

interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
}

type TodoAction = 
  | { type: 'ADD_TODO'; text: string }
  | { type: 'TOGGLE_TODO'; id: number }
  | { type: 'DELETE_TODO'; id: number };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        todos: [...state.todos, { 
          id: Date.now(), 
          text: action.text, 
          completed: false 
        }]
      };
    case 'TOGGLE_TODO':
      return {
        todos: state.todos.map(todo =>
          todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
        )
      };
    case 'DELETE_TODO':
      return {
        todos: state.todos.filter(todo => todo.id !== action.id)
      };
    default:
      return state;
  }
};

export function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, { todos: [] });
  
  return (
    <div>
      <button onClick={() => dispatch({ type: 'ADD_TODO', text: 'New todo' })}>
        Add Todo
      </button>
      {state.todos.map(todo => (
        <div key={todo.id}>
          <span>{todo.text}</span>
          <button onClick={() => dispatch({ type: 'TOGGLE_TODO', id: todo.id })}>
            {todo.completed ? 'Undo' : 'Complete'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Performance Optimization with useTransition

```tsx
import { useState, useTransition, useDeferredValue } from '0x1';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery); // Immediate update for input
    
    startTransition(() => {
      // This expensive operation will be deprioritized
      const searchResults = performExpensiveSearch(deferredQuery);
      setResults(searchResults);
    });
  };
  
  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <div>Searching...</div>}
      <div>
        {results.map(result => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    </div>
  );
}
```

### Context API for Global State

```tsx
import { createContext, useContext, useState } from '0x1';

// Create typed context
interface AuthContextType {
  user: { name: string; id: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);
  
  const login = async (email: string, password: string) => {
    // Simulate API call
    const userData = await authenticateUser(email, password);
    setUser(userData);
  };
  
  const logout = () => {
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for consuming context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage in components
export function LoginButton() {
  const { user, login, logout } = useAuth();
  
  if (user) {
    return (
      <div>
        Welcome, {user.name}!
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return (
    <button onClick={() => login('user@example.com', 'password')}>
      Login
    </button>
  );
}
```

## Performance Considerations

- TSX components compile to efficient vanilla JavaScript
- The JSX runtime adds minimal overhead to your application (~30KB total)
- Server-side rendering performance remains excellent
- Priority-based scheduling ensures smooth user interactions
- Batched updates reduce unnecessary re-renders
- Automatic memory cleanup prevents memory leaks

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
