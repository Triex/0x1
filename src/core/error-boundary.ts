/**
 * 0x1 Error Boundary
 * A beautiful error display similar to Next.js that catches and displays runtime errors
 * This provides an attractive, helpful interface for debugging issues
 */

import type { Component, ComponentProps, ComponentReturn } from './component.js';

interface ErrorBoundaryProps extends ComponentProps {
  children: any;
  fallback?: Component | null;
}

interface ErrorInfo {
  componentStack?: string;
  digest?: string;
  message: string;
  name: string;
  stack?: string;
  cause?: any;
}

// Counter to generate unique IDs for error boundaries
let errorCount = 0;

/**
 * Create a beautiful default error UI inspired by Next.js
 */
export function createDefaultErrorUI(error: Error): HTMLElement {
  const errorInfo: ErrorInfo = {
    message: error.message || 'An unexpected error occurred',
    name: error.name || 'Error',
    stack: error.stack,
  };
  
  // Container for the error display
  const errorContainer = document.createElement('div');
  errorContainer.className = '0x1-error-display';
  errorContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  errorContainer.style.background = '#1e293b';
  errorContainer.style.color = '#e2e8f0';
  errorContainer.style.padding = '2rem';
  errorContainer.style.borderRadius = '0.5rem';
  errorContainer.style.margin = '1rem 0';
  errorContainer.style.boxSizing = 'border-box';
  errorContainer.style.overflow = 'auto';
  
  // Create header with logo
  const header = document.createElement('header');
  header.style.marginBottom = '1.5rem';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '0.5rem';
  
  const logoSpan = document.createElement('span');
  logoSpan.textContent = '⚠️';
  logoSpan.style.fontSize = '1.5rem';
  
  const titleSpan = document.createElement('span');
  titleSpan.innerHTML = '<span style="color: #3b82f6; font-weight: bold;">0x1</span> Error Boundary';
  titleSpan.style.fontSize = '1.25rem';
  
  header.appendChild(logoSpan);
  header.appendChild(titleSpan);
  
  // Create error message section
  const errorTitle = document.createElement('h1');
  errorTitle.textContent = errorInfo.name;
  errorTitle.style.fontSize = '1.8rem';
  errorTitle.style.color = '#f87171';
  errorTitle.style.margin = '0 0 1rem 0';
  
  const errorMessage = document.createElement('div');
  errorMessage.textContent = errorInfo.message;
  errorMessage.style.fontSize = '1.1rem';
  errorMessage.style.lineHeight = '1.5';
  errorMessage.style.background = '#334155';
  errorMessage.style.padding = '1rem';
  errorMessage.style.borderRadius = '0.5rem';
  errorMessage.style.marginBottom = '1.5rem';
  
  // Create stack trace section
  const stackSection = document.createElement('div');
  stackSection.style.marginTop = '1.5rem';
  
  const stackTitle = document.createElement('h2');
  stackTitle.textContent = 'Stack Trace';
  stackTitle.style.fontSize = '1.2rem';
  stackTitle.style.color = '#38bdf8';
  stackTitle.style.margin = '0 0 0.8rem 0';
  
  const stackContent = document.createElement('pre');
  stackContent.textContent = errorInfo.stack || 'No stack trace available';
  stackContent.style.background = '#0f172a';
  stackContent.style.color = '#e2e8f0';
  stackContent.style.padding = '1rem';
  stackContent.style.borderRadius = '0.5rem';
  stackContent.style.overflow = 'auto';
  stackContent.style.fontSize = '0.9rem';
  stackContent.style.lineHeight = '1.4';
  stackContent.style.maxHeight = '20rem';
  
  stackSection.appendChild(stackTitle);
  stackSection.appendChild(stackContent);
  
  // Assemble all parts
  errorContainer.appendChild(header);
  errorContainer.appendChild(errorTitle);
  errorContainer.appendChild(errorMessage);
  errorContainer.appendChild(stackSection);
  
  // Add a helpful component suggestion section
  const helpSection = document.createElement('div');
  helpSection.style.marginTop = '1.5rem';
  helpSection.style.background = '#334155';
  helpSection.style.padding = '1rem';
  helpSection.style.borderRadius = '0.5rem';
  
  const helpTitle = document.createElement('h2');
  helpTitle.textContent = 'How to fix this';
  helpTitle.style.fontSize = '1.2rem';
  helpTitle.style.color = '#38bdf8';
  helpTitle.style.margin = '0 0 0.8rem 0';
  
  const helpContent = document.createElement('ul');
  helpContent.style.padding = '0 0 0 1.5rem';
  helpContent.style.margin = '0';
  
  const createHelpItem = (text: string) => {
    const li = document.createElement('li');
    li.textContent = text;
    li.style.margin = '0.5rem 0';
    return li;
  };
  
  helpContent.appendChild(createHelpItem('Check the component that threw the error'));
  helpContent.appendChild(createHelpItem('Verify that all props are being passed correctly'));
  helpContent.appendChild(createHelpItem('Make sure async data is properly handled'));
  helpContent.appendChild(createHelpItem('Check for type mismatches in your code'));
  
  helpSection.appendChild(helpTitle);
  helpSection.appendChild(helpContent);
  
  errorContainer.appendChild(helpSection);
  
  return errorContainer;
}

/**
 * Create an error boundary component that catches errors in its children
 * and renders a fallback UI when an error occurs
 */
export function createErrorBoundary(props: ErrorBoundaryProps): Component {
  // Create a component function that conforms to the 0x1 Component type
  const errorBoundaryComponent: Component = () => {
    try {
      // Create container element
      const container = document.createElement('div');
      container.setAttribute('data-0x1-error-boundary', `error-boundary-${errorCount++}`);
      
      // Render children
      const childContent = typeof props.children === 'function' 
        ? props.children()
        : props.children;
      
      // Append children to container
      if (typeof childContent === 'string') {
        container.innerHTML = childContent;
      } else if (childContent instanceof Node) {
        container.appendChild(childContent);
      } else if (Array.isArray(childContent)) {
        childContent.forEach(child => {
          if (child instanceof Node) {
            container.appendChild(child);
          } else if (typeof child === 'string') {
            container.appendChild(document.createTextNode(child));
          }
        });
      }
      
      return container;
    } catch (err) {
      // Error occurred, render fallback or error UI
      const errorContainer = document.createElement('div');
      const error = err instanceof Error ? err : new Error(String(err));
      
      try {
        if (props.fallback) {
          // Use custom fallback if provided
          const fallbackContent = props.fallback({ error });
          if (typeof fallbackContent === 'string') {
            errorContainer.innerHTML = fallbackContent;
          } else if (fallbackContent instanceof Node) {
            errorContainer.appendChild(fallbackContent);
          }
        } else {
          // Use default error UI
          errorContainer.appendChild(createDefaultErrorUI(error));
        }
      } catch (fallbackError) {
        // Fallback itself failed, use minimal error display
        console.error('Error boundary fallback failed:', fallbackError);
        errorContainer.innerHTML = `
          <div style="color: #f87171; padding: 1rem; background: #1e293b;">
            <h2>Error Boundary Failed</h2>
            <p>Original error: ${error.message}</p>
            <p>Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}</p>
          </div>
        `;
      }
      
      return errorContainer;
    }
  };
  
  return errorBoundaryComponent;
}

/**
 * Higher-order function to wrap a component with an error boundary
 */
/**
 * Error boundary component for direct use in application code
 */
export const ErrorBoundary: Component = (props: ComponentProps) => {
  // Ensure props has children (required by ErrorBoundaryProps)
  const errorBoundaryProps: ErrorBoundaryProps = {
    ...props,
    // Default to empty div if no children provided
    children: props.children || (() => document.createElement('div'))
  };
  
  return createErrorBoundary(errorBoundaryProps)(props);
};

/**
 * Higher-order function to wrap a component with an error boundary
 */
export function withErrorBoundary(component: Component, fallbackComponent?: Component): Component {
  return (props: any) => {
    const wrappedComponent: Component = () => {
      return typeof component === 'function' ? component(props) : component;
    };
    
    // Create the error boundary component and call it with the props
    const errorBoundaryComp = createErrorBoundary({
      children: wrappedComponent,
      
      fallback: fallbackComponent
    });
    
    // Return the result of calling the component with props
    return errorBoundaryComp(props);
  };
}
