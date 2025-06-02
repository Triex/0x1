/**
 * Store Example Component
 * Demonstrates how to use the 0x1 store in components
 */

import { createSlice, createStore } from '0x1';

// Create a simple counter slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => ({ ...state, value: state.value + 1 }),
    decrement: (state) => ({ ...state, value: state.value - 1 }),
    reset: () => ({ value: 0 })
  }
});

// Create store
const store = createStore(counterSlice.reducer, { value: 0 });

export default function StoreExample() {
  const count = store.getState().value;

  const handleIncrement = () => {
    store.dispatch(counterSlice.actions.increment());
  };

  const handleDecrement = () => {
    store.dispatch(counterSlice.actions.decrement());
  };

  const handleReset = () => {
    store.dispatch(counterSlice.actions.reset());
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">Store Example</h3>
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={handleDecrement}
          className="btn btn-secondary"
        >
          -
        </button>
        <span className="text-2xl font-bold">{count}</span>
        <button 
          onClick={handleIncrement}
          className="btn btn-primary"
        >
          +
        </button>
      </div>
      <button 
        onClick={handleReset}
        className="btn btn-ghost"
      >
        Reset
      </button>
    </div>
  );
} 