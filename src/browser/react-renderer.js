/**
 * 0x1 React Element Renderer
 * Provides client-side rendering support for React-style components
 */

// Helper function to safely render React-style elements to DOM
export function renderReactElement(element, container) {
  // Handle null/undefined elements
  if (!element) {
    console.warn('Attempted to render null or undefined element');
    return;
  }

  // Handle DOM elements directly
  if (element instanceof HTMLElement || element instanceof DocumentFragment) {
    container.innerHTML = '';
    container.appendChild(element);
    return;
  }

  // Handle string content
  if (typeof element === 'string') {
    container.innerHTML = element;
    return;
  }

  // Handle React-style element objects with { type, props, children }
  if (element && typeof element === 'object' && element.type) {
    try {
      let result;
      
      // If type is a function, call it to get the actual element
      if (typeof element.type === 'function') {
        const props = element.props || {};
        result = element.type(props);
        // Recursive rendering for function components
        return renderReactElement(result, container);
      }
      
      // For string type (like 'div', 'span', etc.), create the DOM element
      if (typeof element.type === 'string') {
        const domElement = document.createElement(element.type);
        const props = element.props || {};
        
        // Apply props to the DOM element
        for (const [key, value] of Object.entries(props)) {
          // Skip special React props
          if (key === 'children') continue;
          
          // Handle className (React) -> className (DOM)
          if (key === 'className') {
            domElement.className = value;
            continue;
          }
          
          // Handle style objects
          if (key === 'style' && typeof value === 'object') {
            Object.assign(domElement.style, value);
            continue;
          }
          
          // Handle event handlers (onClick, etc.)
          if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.toLowerCase().substring(2);
            domElement.addEventListener(eventName, value);
            continue;
          }
          
          // Handle other attributes
          domElement.setAttribute(key, value);
        }
        
        // Handle children
        if (props.children) {
          const children = Array.isArray(props.children) 
            ? props.children 
            : [props.children];
            
          for (const child of children) {
            if (child == null) continue;
            
            if (typeof child === 'string' || typeof child === 'number') {
              domElement.appendChild(document.createTextNode(String(child)));
            } else if (typeof child === 'object') {
              // Recursively render child elements
              const childContainer = document.createElement('div');
              renderReactElement(child, childContainer);
              
              // Move child elements to parent instead of the container
              while (childContainer.firstChild) {
                domElement.appendChild(childContainer.firstChild);
              }
            }
          }
        }
        
        // Clear container and append the new element
        container.innerHTML = '';
        container.appendChild(domElement);
        return;
      }
    } catch (error) {
      console.error('Error rendering React element:', error);
      container.innerHTML = `<div class="error">Error rendering component: ${error.message}</div>`;
    }
  }
  
  // Fallback for unknown element types
  console.warn('Unknown element type:', element);
  container.innerHTML = `<div class="error">Unable to render unknown element type</div>`;
}
