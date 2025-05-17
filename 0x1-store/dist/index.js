// src/index.ts
function createStore(initialState, options) {
  return new Store({ initialState, ...options });
}
function registerStore(name, initialState, options) {
  if (stores[name]) {
    console.warn(`Store with name "${name}" already exists. Returning existing store.`);
    return stores[name];
  }
  const store = createStore(initialState, options);
  stores[name] = store;
  return store;
}
function useStore(name) {
  return stores[name] || null;
}

class Store {
  state;
  subscribers = [];
  options;
  constructor(options) {
    this.options = {
      persist: false,
      storageKey: "0x1-store",
      ...options
    };
    if (this.options.persist && typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem(this.options.storageKey);
        if (savedState) {
          this.state = JSON.parse(savedState);
        } else {
          this.state = this.options.initialState;
        }
      } catch (e) {
        console.error("Failed to load state from localStorage:", e);
        this.state = this.options.initialState;
      }
    } else {
      this.state = this.options.initialState;
    }
  }
  getState() {
    return { ...this.state };
  }
  setState(updater) {
    const nextState = typeof updater === "function" ? { ...this.state, ...updater(this.state) } : { ...this.state, ...updater };
    this.state = nextState;
    if (this.options.persist && typeof window !== "undefined") {
      try {
        localStorage.setItem(this.options.storageKey, JSON.stringify(this.state));
      } catch (e) {
        console.error("Failed to save state to localStorage:", e);
      }
    }
    this.notifySubscribers();
  }
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }
  notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.getState());
      } catch (e) {
        console.error("Error in store subscriber:", e);
      }
    });
  }
  reset() {
    this.setState(this.options.initialState);
  }
}
var stores = {};
export {
  useStore,
  registerStore,
  createStore,
  Store
};
