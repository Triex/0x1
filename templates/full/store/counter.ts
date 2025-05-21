// templates/full/store/counter.ts
import { createStore } from '0x1-store';

export const counterStore = createStore('counter', {
  count: 0,
  increment: (state) => ({ count: state.count + 1 }),
  decrement: (state) => ({ count: state.count - 1 }),
});