"use client";

/**
 * Counter Component
 * A reusable interactive counter with increment/decrement functionality
 */

import { useState } from "0x1";

interface CounterProps {
  initialValue?: number;
  minValue?: number;
  maxValue?: number;
  label?: string;
}

export function Counter({
  initialValue = 0,
  minValue = -10,
  maxValue = 10,
  label = "Interactive Counter",
}: CounterProps) {
  // Use React state instead of direct DOM manipulation
  const [count, setCount] = useState(initialValue);

  // Handle decrement action
  const decrement = () => {
    if (count > minValue) {
      setCount(count - 1);
    }
  };

  // Handle increment action
  const increment = () => {
    if (count < maxValue) {
      setCount(count + 1);
    }
  };

  // Determine if buttons should be disabled
  const isDecrementDisabled = count <= minValue;
  const isIncrementDisabled = count >= maxValue;

  return (
    <div className="bg-card/50 backdrop-blur border border-border/40 shadow-lg rounded-xl p-6">
      <div className="flex items-center justify-center gap-4 mb-3">
        <button
          className={`px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${isDecrementDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Decrement"
          onClick={(e) => {
            decrement();
          }}
          disabled={isDecrementDisabled}
        >
          −
        </button>
        <span
          className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent min-w-[3rem] text-center"
        >
          {String(count)}
        </span>
        <button
          className={`px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700 hover:from-purple-600 hover:to-violet-700 dark:hover:from-purple-700 dark:hover:to-violet-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${isIncrementDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Increment"
          onClick={() => {
            increment();
          }}
          disabled={isIncrementDisabled}
        >
          +
        </button>
      </div>
      <p className="text-muted-foreground text-center text-sm">{label}</p>
    </div>
  );
}