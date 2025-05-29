// templates/full/store/counter.ts
import { createStore } from '0x1-store';

interface CounterState {
  count: number;
}

export const counterStore = createStore<CounterState>({ count: 0 });

// Helper functions for common actions
export const incrementCounter = () => {
  counterStore.setState(state => ({ count: state.count + 1 }));
};

export const decrementCounter = () => {
  counterStore.setState(state => ({ count: state.count - 1 }));
};

export const resetCounter = () => {
  counterStore.reset();
};