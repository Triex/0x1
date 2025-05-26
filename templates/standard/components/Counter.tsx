/**
 * Counter Component
 * A reusable interactive counter with increment/decrement functionality
 */

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
  // Define state variable that will be managed by the framework
  let count = initialValue;

  // Define state update function that will be used by the event handlers
  function updateDisplay() {
    const valueEl = document.getElementById('counter-value');
    if (valueEl) valueEl.textContent = count.toString();

    // Update button states if at min/max
    const decrementBtn = document.getElementById('decrement-btn') as HTMLButtonElement;
    const incrementBtn = document.getElementById('increment-btn') as HTMLButtonElement;

    if (decrementBtn) {
      decrementBtn.disabled = count <= minValue;
      decrementBtn.classList.toggle('opacity-50', decrementBtn.disabled);
      decrementBtn.classList.toggle('cursor-not-allowed', decrementBtn.disabled);
    }

    if (incrementBtn) {
      incrementBtn.disabled = count >= maxValue;
      incrementBtn.classList.toggle('opacity-50', incrementBtn.disabled);
      incrementBtn.classList.toggle('cursor-not-allowed', incrementBtn.disabled);
    }
  }

  // Event handlers for buttons
  function decrement() {
    if (count > minValue) {
      count--;
      updateDisplay();
    }
  }

  function increment() {
    if (count < maxValue) {
      count++;
      updateDisplay();
    }
  }

  // Function to be called after the component is mounted to set up initial state
  function onMount() {
    // Ensure initial display is set immediately
    updateDisplay();
  }

  // Also ensure initial setup runs as soon as possible
  if (typeof window !== 'undefined') {
    // Use requestAnimationFrame to ensure DOM is ready but run immediately
    requestAnimationFrame(() => updateDisplay());
  }

  return (
    <div className="bg-card/50 backdrop-blur border border-border/40 shadow-lg rounded-xl p-6 mb-6" onMount={onMount}>
      <div className="flex items-center justify-center gap-4 mb-3">
        <button
          id="decrement-btn"
          className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-700 dark:hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          aria-label="Decrement"
          onClick={decrement}
        >
          −
        </button>
        <span
          id="counter-value"
          className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent min-w-[3rem] text-center"
        >
          {initialValue}x1
        </span>
        <button
          id="increment-btn"
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700 hover:from-purple-600 hover:to-violet-700 dark:hover:from-purple-700 dark:hover:to-violet-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          aria-label="Increment"
          onClick={increment}
        >
          +
        </button>
      </div>
      <p className="text-muted-foreground text-center text-sm">{label}</p>
    </div>
  );
}