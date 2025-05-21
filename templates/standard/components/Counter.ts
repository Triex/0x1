/**
 * Counter component with increment/decrement functionality
 * Demonstrates interactive component usage with proper dark mode styling
 */
import { Card } from "./Card";
import { useState } from "0x1";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <Card title="Counter" content="This is a counter component">
      <h1>Counter</h1>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </Card>
  );
}