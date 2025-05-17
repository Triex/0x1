/**
 * 0x1 Store - Simple State Management for 0x1 Framework
 */

// Type for subscription callbacks
type Subscriber<T> = (state: T) => void;

// Interface for store options
interface StoreOptions<T> {
  initialState: T;
  persist?: boolean;
  storageKey?: string;
}

// Main store class
export class Store<T> {
  private state: T;
  private subscribers: Subscriber<T>[] = [];
  private options: StoreOptions<T>;

  constructor(options: StoreOptions<T>) {
    this.options = {
      persist: false,
      storageKey: '0x1-store',
      ...options
    };

    // Try to load from storage if persist is enabled
    if (this.options.persist && typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(this.options.storageKey!);
        if (savedState) {
          this.state = JSON.parse(savedState);
        } else {
          this.state = this.options.initialState;
        }
      } catch (e) {
        console.error('Failed to load state from localStorage:', e);
        this.state = this.options.initialState;
      }
    } else {
      this.state = this.options.initialState;
    }
  }

  // Get current state
  getState(): T {
    return { ...this.state };
  }

  // Update state
  setState(updater: Partial<T> | ((state: T) => Partial<T>)): void {
    const nextState = typeof updater === 'function'
      ? { ...this.state, ...updater(this.state) }
      : { ...this.state, ...updater };
    
    this.state = nextState as T;
    
    // Persist state if enabled
    if (this.options.persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          this.options.storageKey!,
          JSON.stringify(this.state)
        );
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
    }
    
    // Notify subscribers
    this.notifySubscribers();
  }

  // Subscribe to state changes
  subscribe(callback: Subscriber<T>): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.getState());
      } catch (e) {
        console.error('Error in store subscriber:', e);
      }
    });
  }

  // Reset state to initial
  reset(): void {
    this.setState(this.options.initialState);
  }
}

// Factory function to create a new store
export function createStore<T>(initialState: T, options?: Omit<StoreOptions<T>, 'initialState'>): Store<T> {
  return new Store<T>({ initialState, ...options });
}

// Create a context-like API for managing global state
const stores: Record<string, Store<any>> = {};

export function registerStore<T>(name: string, initialState: T, options?: Omit<StoreOptions<T>, 'initialState'>): Store<T> {
  if (stores[name]) {
    console.warn(`Store with name "${name}" already exists. Returning existing store.`);
    return stores[name] as Store<T>;
  }
  
  const store = createStore(initialState, options);
  stores[name] = store;
  return store;
}

export function useStore<T>(name: string): Store<T> | null {
  return (stores[name] as Store<T>) || null;
}
