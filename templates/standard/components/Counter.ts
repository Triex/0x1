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
  container.className = 'flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700';
  
  // Add label if provided
  if (label) {
    const labelEl = document.createElement('h3');
    labelEl.className = 'text-gray-700 dark:text-gray-300 text-sm mb-2';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }
  
  // Create counter display
  const counterWrapper = document.createElement('div');
  counterWrapper.className = 'flex items-center justify-center gap-3 mb-1';
  container.appendChild(counterWrapper);
  
  // Decrement button
  const decrementBtn = document.createElement('button');
  decrementBtn.className = 'w-8 h-8 flex items-center justify-center bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white font-bold rounded transition-colors';
  decrementBtn.textContent = '-';
  decrementBtn.setAttribute('aria-label', 'Decrement');
  counterWrapper.appendChild(decrementBtn);
  
  // Value display
  const valueEl = document.createElement('span');
  valueEl.className = 'text-xl font-bold w-10 text-center text-gray-900 dark:text-white';
  valueEl.textContent = count.toString();
  counterWrapper.appendChild(valueEl);
  
  // Increment button
  const incrementBtn = document.createElement('button');
  incrementBtn.className = 'w-8 h-8 flex items-center justify-center bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white font-bold rounded transition-colors';
  incrementBtn.textContent = '+';
  incrementBtn.setAttribute('aria-label', 'Increment');
  counterWrapper.appendChild(incrementBtn);
  
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
