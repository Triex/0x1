 # 0x1 Framework Hooks Guide

**Complete guide to React-compatible hooks in 0x1 Framework**

## Table of Contents

- [Overview](#overview)
- [Core React Hooks](#core-react-hooks)
- [Advanced Performance Hooks](#advanced-performance-hooks)
- [Enhanced 0x1 Hooks](#enhanced-0x1-hooks)
- [Context API](#context-api)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)
- [Migration from React](#migration-from-react)

## Overview

0x1 Framework provides a complete React-compatible hooks API with advanced performance optimizations. Our hooks implementation includes:

- **Complete React compatibility**: All standard React hooks work identically
- **Advanced performance features**: Priority-based scheduling, batched updates, deferred values
- **Enhanced 0x1 hooks**: Additional utilities for common use cases
- **Automatic optimization**: Built-in memory cleanup and performance optimizations
- **TypeScript-first**: Full type safety and IntelliSense support

## Core React Hooks

### useState

Manage component state with automatic re-rendering on state changes.

```tsx
import { useState } from '0x1';

function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  
  // Functional updates
  const increment = () => setCount(prev => prev + 1);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
    </div>
  );
}
```

### useEffect

Handle side effects and component lifecycle events.

```tsx
import { useState, useEffect } from '0x1';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Cleanup function
    const controller = new AbortController();
    
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal
        });
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch user:', error);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
    
    // Cleanup on unmount or userId change
    return () => controller.abort();
  }, [userId]); // Dependencies array
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

### useCallback

Memoize callback functions to prevent unnecessary re-renders.

```tsx
import { useState, useCallback } from '0x1';

function ExpensiveList({ items, onItemClick }: { 
  items: Item[], 
  onItemClick: (id: string) => void 
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Memoized callback to prevent child re-renders
  const handleItemClick = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    onItemClick(id);
  }, [onItemClick]);
  
  return (
    <div>
      {items.map(item => (
        <ExpensiveItem 
          key={item.id} 
          item={item}
          isSelected={selectedIds.has(item.id)}
          onClick={handleItemClick} // Stable reference
        />
      ))}
    </div>
  );
}
```

### useMemo

Memoize expensive computations.

```tsx
import { useState, useMemo } from '0x1';

function DataAnalytics({ data }: { data: number[] }) {
  const [filter, setFilter] = useState('');
  
  // Expensive computation only runs when dependencies change
  const analytics = useMemo(() => {
    console.log('Computing analytics...'); // Only logs when data changes
    
    const filteredData = data.filter(item => 
      item.toString().includes(filter)
    );
    
    return {
      sum: filteredData.reduce((a, b) => a + b, 0),
      average: filteredData.length > 0 ? 
        filteredData.reduce((a, b) => a + b, 0) / filteredData.length : 0,
      max: Math.max(...filteredData),
      min: Math.min(...filteredData),
      count: filteredData.length
    };
  }, [data, filter]); // Only recompute when data or filter changes
  
  return (
    <div>
      <input 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter data..."
      />
      <div>
        <p>Sum: {analytics.sum}</p>
        <p>Average: {analytics.average.toFixed(2)}</p>
        <p>Count: {analytics.count}</p>
      </div>
    </div>
  );
}
```

### useRef

Create mutable references that persist across renders.

```tsx
import { useRef, useEffect } from '0x1';

function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);
  
  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Track renders without causing re-render
    renderCount.current += 1;
    console.log(`Component rendered ${renderCount.current} times`);
  });
  
  const handleReset = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };
  
  return (
    <div>
      <input ref={inputRef} placeholder="Type here..." />
      <button onClick={handleReset}>Reset & Focus</button>
    </div>
  );
}
```

### useReducer

Manage complex state with reducer pattern.

```tsx
import { useReducer } from '0x1';

interface CartState {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
}

type CartAction = 
  | { type: 'ADD_ITEM'; item: { id: string; name: string; price: number } }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QUANTITY'; id: string; quantity: number }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.item.id);
      
      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.item.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.item, quantity: 1 }];
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: newItems, total };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.id);
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: newItems, total };
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.id ? { ...item, quantity: action.quantity } : item
      ).filter(item => item.quantity > 0);
      
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: newItems, total };
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    
    default:
      return state;
  }
}

function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  
  const addItem = (item: { id: string; name: string; price: number }) => {
    dispatch({ type: 'ADD_ITEM', item });
  };
  
  return (
    <div>
      <h2>Shopping Cart (${cart.total.toFixed(2)})</h2>
      {cart.items.map(item => (
        <div key={item.id}>
          <span>{item.name} x{item.quantity}</span>
          <button onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={() => dispatch({ type: 'CLEAR_CART' })}>
        Clear Cart
      </button>
    </div>
  );
}
```

## Advanced Performance Hooks

### useTransition

Mark updates as non-urgent to keep the UI responsive.

```tsx
import { useState, useTransition } from '0x1';

function SearchableList({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery); // Urgent: Update input immediately
    
    startTransition(() => {
      // Non-urgent: Filter operation can be deferred
      const filtered = items.filter(item => 
        item.toLowerCase().includes(newQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    });
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search items..."
      />
      
      {isPending && <div className="loading">Filtering...</div>}
      
      <ul style={{ opacity: isPending ? 0.5 : 1 }}>
        {filteredItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useDeferredValue

Defer updates to non-critical values.

```tsx
import { useState, useDeferredValue, useMemo } from '0x1';

function LiveChart({ data }: { data: number[] }) {
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Defer the animation speed so it doesn't block urgent updates
  const deferredSpeed = useDeferredValue(animationSpeed);
  
  // Expensive chart computation uses deferred value
  const chartConfig = useMemo(() => {
    return generateExpensiveChart(data, deferredSpeed);
  }, [data, deferredSpeed]);
  
  return (
    <div>
      <label>
        Animation Speed: 
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
        />
      </label>
      
      <div>Current: {animationSpeed}</div>
      <div>Deferred: {deferredSpeed}</div>
      
      <Chart config={chartConfig} />
    </div>
  );
}
```

### useId

Generate stable, unique IDs for accessibility.

```tsx
import { useId } from '0x1';

function FormField({ label, type = 'text' }: { label: string; type?: string }) {
  const id = useId();
  
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} />
    </div>
  );
}

function LoginForm() {
  const formId = useId();
  
  return (
    <form id={formId}>
      <h2>Login</h2>
      <FormField label="Email" type="email" />
      <FormField label="Password" type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Context API

### createContext & useContext

Share state across components without prop drilling.

```tsx
import { createContext, useContext, useState, useCallback } from '0x1';

// Define context type
interface ToastContextType {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | null>(null);

// Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastContextType['toasts']>([]);
  
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook for consuming context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Toast container component
function ToastContainer() {
  const { toasts, removeToast } = useToast();
  
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
          <button onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// Usage in components
function MyComponent() {
  const { addToast } = useToast();
  
  const handleSuccess = () => {
    addToast('Operation completed successfully!', 'success');
  };
  
  const handleError = () => {
    addToast('Something went wrong!', 'error');
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Success Action</button>
      <button onClick={handleError}>Error Action</button>
    </div>
  );
}
```

## Enhanced 0x1 Hooks

### useFetch

Built-in data fetching with loading states and error handling.

```tsx
import { useFetch } from '0x1';

function UserList() {
  const { data: users, loading, error, refetch } = useFetch<User[]>('/api/users', {
    // Optional configuration
    method: 'GET',
    headers: { 'Authorization': 'Bearer token' },
    cache: true,
    retries: 3
  });
  
  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### useForm

Form state management with validation.

```tsx
import { useForm } from '0x1';

interface LoginForm {
  email: string;
  password: string;
}

function LoginComponent() {
  const {
    values,
    errors,
    isValid,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldError
  } = useForm<LoginForm>({
    initialValues: {
      email: '',
      password: ''
    },
    validate: (values) => {
      const errors: Partial<LoginForm> = {};
      
      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = 'Email is invalid';
      }
      
      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      try {
        await loginUser(values);
      } catch (error) {
        setFieldError('password', 'Invalid credentials');
      }
    }
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="email"
          value={values.email}
          onChange={handleChange}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          placeholder="Password"
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      
      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### useLocalStorage

Persistent state with localStorage synchronization.

```tsx
import { useLocalStorage } from '0x1';

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <div className={`app ${theme}`}>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </button>
    </div>
  );
}
```

### useClickOutside

Detect clicks outside of an element.

```tsx
import { useRef } from '0x1';
import { useClickOutside } from '0x1';

function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
  });
  
  return (
    <div ref={dropdownRef} className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>
        Menu {isOpen ? '↑' : '↓'}
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <a href="/profile">Profile</a>
          <a href="/settings">Settings</a>
          <a href="/logout">Logout</a>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Hook Dependencies

Always include all dependencies in useEffect, useCallback, and useMemo:

```tsx
// ✅ Correct
useEffect(() => {
  fetchData(userId, filter);
}, [userId, filter]);

// ❌ Wrong - missing dependencies
useEffect(() => {
  fetchData(userId, filter);
}, [userId]);
```

### 2. Avoid Stale Closures

```tsx
// ✅ Correct - use functional updates
const increment = useCallback(() => {
  setCount(prev => prev + 1);
}, []);

// ❌ Wrong - stale closure
const increment = useCallback(() => {
  setCount(count + 1);
}, []); // Missing count dependency
```

### 3. Optimize with useTransition

```tsx
// ✅ Use useTransition for expensive updates
const [isPending, startTransition] = useTransition();

const handleExpensiveUpdate = (data) => {
  startTransition(() => {
    setExpensiveData(processData(data));
  });
};
```

### 4. Context Performance

```tsx
// ✅ Split context by update frequency
const ThemeContext = createContext(); // Rarely changes
const UserContext = createContext();  // Changes often

// ❌ Don't put everything in one context
const AppContext = createContext(); // Everything together
```

## Performance Considerations

### Priority Levels

0x1 uses priority-based scheduling with these levels:

1. **IMMEDIATE** - User input, focus, urgent updates
2. **USER_BLOCKING** - Transitions that block user interaction
3. **NORMAL** - Regular updates, network responses
4. **LOW** - Analytics, prefetching
5. **IDLE** - Background cleanup, non-essential updates

### Batching

Updates are automatically batched using:
- RequestAnimationFrame for visual updates
- Timeout fallback for urgent updates
- Micro-task scheduling for context updates

### Memory Management

- Automatic cleanup of subscriptions
- Garbage collection of unused contexts
- Reference counting for dependency tracking

## Migration from React

0x1 hooks are 100% compatible with React. Simply update your imports:

```tsx
// Before (React)
import { useState, useEffect, useCallback } from 'react';

// After (0x1)
import { useState, useEffect, useCallback } from '0x1';
```

All existing React code will work without changes. You can gradually adopt 0x1's enhanced features like `useTransition` and performance optimizations.

---

**Next Steps:**
- [Component System Guide](./component-guide.md) - Learn about 0x1 components
- [Routing Guide](./routing-guide.md) - Master the routing system
- [Performance Guide](./performance-guide.md) - Optimize your applications