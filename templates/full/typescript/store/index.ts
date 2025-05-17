/**
 * Simple state management for 0x1
 */

import type { Router } from '../lib/router';

// Define the store state interface
export interface StoreState {
  theme: 'light' | 'dark';
  user: {
    isLoggedIn: boolean;
    name: string | null;
    email: string | null;
  };
  notifications: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timeout: number;
  }[];
  cart: {
    items: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    total: number;
  };
  isOnline: boolean;
  lastUpdated: number;
}

// Define the store interface with methods
export interface Store {
  state: StoreState;
  subscribers: ((state: StoreState) => void)[];
  router?: Router;
  
  subscribe(callback: (state: StoreState) => void): () => void;
  setState<K extends keyof StoreState>(key: K, value: StoreState[K]): void;
  
  // User actions
  login(name: string, email: string): void;
  logout(): void;
  
  // Cart actions
  addToCart(item: { id: string; name: string; price: number }): void;
  removeFromCart(id: string): void;
  updateQuantity(id: string, quantity: number): void;
  clearCart(): void;
  
  // Notification actions
  addNotification(message: string, type: 'info' | 'success' | 'warning' | 'error', timeout?: number): string;
  removeNotification(id: string): void;
  
  // Theme actions
  toggleTheme(): void;
}

// Create the store with initial state
export function createStore(): Store {
  // Initialize with default state
  const state: StoreState = {
    theme: 'light',
    user: {
      isLoggedIn: false,
      name: null,
      email: null
    },
    notifications: [],
    cart: {
      items: [],
      total: 0
    },
    isOnline: navigator.onLine,
    lastUpdated: Date.now()
  };
  
  // Create store object
  const store: Store = {
    state,
    subscribers: [],
    
    // Subscription management
    subscribe(callback) {
      this.subscribers.push(callback);
      // Return unsubscribe function
      return () => {
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
      };
    },
    
    // Generic state setter with notification
    setState(key, value) {
      this.state[key] = value;
      this.state.lastUpdated = Date.now();
      this.notifySubscribers();
    },
    
    // User actions
    login(name, email) {
      this.state.user = {
        isLoggedIn: true,
        name,
        email
      };
      this.notifySubscribers();
      this.addNotification(`Welcome back, ${name}!`, 'success');
    },
    
    logout() {
      const name = this.state.user.name;
      this.state.user = {
        isLoggedIn: false,
        name: null,
        email: null
      };
      this.notifySubscribers();
      this.addNotification(`Goodbye, ${name}!`, 'info');
    },
    
    // Cart actions
    addToCart(item) {
      const existingItem = this.state.cart.items.find(i => i.id === item.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.state.cart.items.push({
          ...item,
          quantity: 1
        });
      }
      
      this.recalculateCart();
      this.addNotification(`Added ${item.name} to cart`, 'success', 2000);
    },
    
    removeFromCart(id) {
      const item = this.state.cart.items.find(i => i.id === id);
      if (item) {
        this.state.cart.items = this.state.cart.items.filter(i => i.id !== id);
        this.recalculateCart();
        this.addNotification(`Removed ${item.name} from cart`, 'info', 2000);
      }
    },
    
    updateQuantity(id, quantity) {
      const item = this.state.cart.items.find(i => i.id === id);
      if (item) {
        if (quantity <= 0) {
          this.removeFromCart(id);
        } else {
          item.quantity = quantity;
          this.recalculateCart();
        }
      }
    },
    
    clearCart() {
      this.state.cart.items = [];
      this.state.cart.total = 0;
      this.notifySubscribers();
      this.addNotification('Cart cleared', 'info');
    },
    
    // Notification actions
    addNotification(message, type, timeout = 5000) {
      const id = Date.now().toString();
      this.state.notifications.push({
        id,
        message,
        type,
        timeout
      });
      this.notifySubscribers();
      
      // Auto-remove after timeout
      setTimeout(() => {
        this.removeNotification(id);
      }, timeout);
      
      return id;
    },
    
    removeNotification(id) {
      this.state.notifications = this.state.notifications.filter(n => n.id !== id);
      this.notifySubscribers();
    },
    
    // Theme actions
    toggleTheme() {
      const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
      this.state.theme = newTheme;
      
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save preference
      localStorage.setItem('theme', newTheme);
      
      this.notifySubscribers();
    },
    
    // Helper to notify all subscribers
    notifySubscribers() {
      this.subscribers.forEach(callback => callback(this.state));
    },
    
    // Helper to recalculate cart total
    recalculateCart() {
      this.state.cart.total = this.state.cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      this.notifySubscribers();
    }
  };
  
  // Set up online/offline detection
  window.addEventListener('online', () => {
    store.state.isOnline = true;
    store.notifySubscribers();
    store.addNotification('You are back online', 'success');
  });
  
  window.addEventListener('offline', () => {
    store.state.isOnline = false;
    store.notifySubscribers();
    store.addNotification('You are offline. Some features may be unavailable', 'warning');
  });
  
  return store;
}
