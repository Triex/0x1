# 0x1-store

A lightweight, type-safe state management library for JavaScript and TypeScript applications.

## Features

- 🔄 Simple API for state management
- 🔒 Type-safe with full TypeScript support
- 💾 Optional local storage persistence
- 📢 Subscription-based updates
- 🌐 Global store registry
- 🪶 Tiny footprint with zero dependencies

## Installation

```bash
# Using bun
bun add 0x1-store

# Using npm
npm install 0x1-store

# Using yarn
yarn add 0x1-store
```

## Basic Usage

```typescript
import { createStore } from '0x1-store';

// Create a store with initial state
const counterStore = createStore({ count: 0 });

// Get current state
console.log(counterStore.getState()); // { count: 0 }

// Update state with an object
counterStore.setState({ count: 1 });

// Update state with a function
counterStore.setState((prevState) => ({ 
  count: prevState.count + 1 
}));

// Subscribe to state changes
const unsubscribe = counterStore.subscribe((state) => {
  console.log('State updated:', state);
});

// Later, unsubscribe when needed
unsubscribe();

// Reset state to initial value
counterStore.reset();
```

## Persistence

Enable localStorage persistence to keep state between page reloads:

```typescript
import { createStore } from '0x1-store';

const userStore = createStore(
  { name: '', loggedIn: false },
  { 
    persist: true,
    storageKey: 'user-store' 
  }
);

// State will automatically be saved to localStorage
userStore.setState({ name: 'John', loggedIn: true });

// And loaded when the store is created again
```

## Global Stores

Register and use stores across your application:

```typescript
import { registerStore, useStore } from '0x1-store';

// In your store definition file
registerStore('theme', { dark: false });

// Anywhere else in your application
const themeStore = useStore('theme');
if (themeStore) {
  const { dark } = themeStore.getState();
  themeStore.setState({ dark: !dark });
}
```

## API Reference

### `createStore<T>(initialState: T, options?: StoreOptions<T>): Store<T>`

Creates a new store with the given initial state and options.

### `Store<T>` Methods

- `getState(): T` - Returns the current state
- `setState(updater: Partial<T> | ((state: T) => Partial<T>)): void` - Updates the state
- `subscribe(callback: (state: T) => void): () => void` - Subscribes to state changes, returns unsubscribe function
- `reset(): void` - Resets the state to the initial value

### `StoreOptions<T>`

- `initialState: T` - The initial state of the store
- `persist?: boolean` - Whether to persist the state to localStorage (default: false)
- `storageKey?: string` - The key to use for localStorage (default: '0x1-store')

### Global Store API

- `registerStore<T>(name: string, initialState: T, options?: StoreOptions<T>): Store<T>` - Registers a global store
- `useStore<T>(name: string): Store<T> | null` - Gets a registered store by name

## License

MIT
