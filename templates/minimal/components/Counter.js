/**
 * Counter Component
 * A reusable interactive counter with increment/decrement functionality
 * Pre-transpiled version for better browser compatibility
 */

// Import createElement and Fragment from 0x1 framework
import { createElement, Fragment } from '0x1';

/**
 * Counter component with increment/decrement functionality
 * @param {Object} props Component properties
 * @param {number} [props.initialValue=0] Initial counter value
 * @param {number} [props.minValue=-10] Minimum allowed value
 * @param {number} [props.maxValue=10] Maximum allowed value
 * @param {string} [props.label="Interactive Counter"] Label text for the counter
 */
export function Counter(props) {
  // Set default values for props
  const initialValue = props.initialValue ?? 0;
  const minValue = props.minValue ?? -10;
  const maxValue = props.maxValue ?? 10;
  const label = props.label ?? "Interactive Counter";
  
  // Define state variable that will be managed by the framework
  let count = initialValue;
  
  // Define state update function that will be used by the event handlers
  function updateDisplay() {
    const valueEl = document.getElementById('counter-value');
    if (valueEl) valueEl.textContent = count.toString();
    
    // Update button states if at min/max
    const decrementBtn = document.getElementById('decrement-btn');
    const incrementBtn = document.getElementById('increment-btn');
    
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
    // Delay to ensure DOM is ready
    setTimeout(() => {
      updateDisplay();
    }, 0);
  }
  
  return createElement(
    'div', 
    {
      className: "bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6",
      onMount: onMount
    },
    createElement(
      'div',
      { className: "flex items-center justify-center gap-4 mb-3" },
      createElement(
        'button',
        {
          id: "decrement-btn",
          className: "px-4 py-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded transition-colors",
          'aria-label': "Decrement",
          onClick: decrement
        },
        '-'
      ),
      createElement(
        'span',
        {
          id: "counter-value",
          className: "text-2xl font-bold text-gray-900 dark:text-white"
        },
        count.toString()
      ),
      createElement(
        'button',
        {
          id: "increment-btn",
          className: "px-4 py-2 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white rounded transition-colors",
          'aria-label': "Increment",
          onClick: increment
        },
        '+'
      )
    ),
    createElement(
      'p',
      { className: "text-gray-600 dark:text-gray-300 text-center" },
      label
    )
  );
}
