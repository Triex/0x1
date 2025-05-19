/**
 * Counter component with increment/decrement functionality
 * Demonstrates interactive component usage with proper dark mode styling
 */

interface CounterProps {
  initialValue?: number;
  minValue?: number;
  maxValue?: number;
  label?: string;
}

export function Counter(props: CounterProps = {}): HTMLElement {
  const {
    initialValue = 0,
    minValue = Number.MIN_SAFE_INTEGER,
    maxValue = Number.MAX_SAFE_INTEGER,
    label = 'Counter'
  } = props;

  let count = initialValue;
  
  // Create container
  const container = document.createElement('div');
  container.className = 'bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8';
  
  // Add counter UI
  const counterWrapper = document.createElement('div');
  counterWrapper.className = 'flex items-center justify-center gap-4 mb-4';
  container.appendChild(counterWrapper);
  
  // Decrement button
  const decrementBtn = document.createElement('button');
  decrementBtn.id = 'decrement-btn';
  decrementBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition';
  decrementBtn.textContent = '-';
  decrementBtn.setAttribute('aria-label', 'Decrement');
  counterWrapper.appendChild(decrementBtn);
  
  // Value display
  const valueEl = document.createElement('span');
  valueEl.id = 'counter-value';
  valueEl.className = 'text-2xl font-bold text-gray-900 dark:text-white';
  valueEl.textContent = count.toString();
  counterWrapper.appendChild(valueEl);
  
  // Increment button
  const incrementBtn = document.createElement('button');
  incrementBtn.id = 'increment-btn';
  incrementBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition';
  incrementBtn.textContent = '+';
  incrementBtn.setAttribute('aria-label', 'Increment');
  counterWrapper.appendChild(incrementBtn);
  
  // Add description
  const description = document.createElement('p');
  description.className = 'text-gray-600 dark:text-gray-300';
  description.textContent = label || 'Try out this interactive counter component!';
  container.appendChild(description);
  
  // Button event handlers
  decrementBtn.addEventListener('click', () => {
    if (count > minValue) {
      count--;
      updateDisplay();
    }
  });
  
  incrementBtn.addEventListener('click', () => {
    if (count < maxValue) {
      count++;
      updateDisplay();
    }
  });
  
  // Helper to update display
  function updateDisplay() {
    valueEl.textContent = count.toString();
    
    // Update button states based on limits
    decrementBtn.disabled = count <= minValue;
    incrementBtn.disabled = count >= maxValue;
    
    // Apply disabled styling if needed
    decrementBtn.classList.toggle('opacity-50 cursor-not-allowed', decrementBtn.disabled);
    incrementBtn.classList.toggle('opacity-50 cursor-not-allowed', incrementBtn.disabled);
  }
  
  // Initialize display
  updateDisplay();
  
  return container;
}
