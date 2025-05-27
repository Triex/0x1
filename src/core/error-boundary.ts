/**
 * 0x1 Error Boundary
 * A beautiful error display similar to Next.js that catches and displays runtime errors
 * This provides an attractive, helpful interface for debugging issues
 * 
 * Features:
 * - Modal popup with dark overlay
 * - Error navigation between multiple errors
 * - Minimize support with floating error counter
 * - Stack trace display
 * - Helpful suggestions
 */

import type { Component, ComponentProps } from './component.js';

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

// Global error storage and UI state
interface ErrorEntry {
  id: string;
  error: Error;
  timestamp: number;
}

class ErrorManager {
  private static instance: ErrorManager;
  private errors: ErrorEntry[] = [];
  private minimized: boolean = false;
  private activeErrorIndex: number = 0;
  private floatingButton: HTMLElement | null = null;
  private modalContainer: HTMLElement | null = null;
  
  private constructor() {}
  
  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  addError(error: Error): ErrorEntry {
    const id = `error-${Date.now()}-${this.errors.length}`;
    const errorEntry = { id, error, timestamp: Date.now() };
    this.errors.push(errorEntry);
    this.activeErrorIndex = this.errors.length - 1;
    
    // Create or update floating button if minimized
    if (this.minimized) {
      this.updateFloatingButton();
    }
    
    return errorEntry;
  }
  
  getErrors(): ErrorEntry[] {
    return [...this.errors];
  }
  
  getCurrentError(): ErrorEntry | null {
    return this.errors.length > 0 ? this.errors[this.activeErrorIndex] : null;
  }
  
  navigateNext(): ErrorEntry | null {
    if (this.errors.length === 0) return null;
    this.activeErrorIndex = (this.activeErrorIndex + 1) % this.errors.length;
    return this.getCurrentError();
  }
  
  navigatePrevious(): ErrorEntry | null {
    if (this.errors.length === 0) return null;
    this.activeErrorIndex = (this.activeErrorIndex - 1 + this.errors.length) % this.errors.length;
    return this.getCurrentError();
  }
  
  isMinimized(): boolean {
    return this.minimized;
  }
  
  minimize() {
    this.minimized = true;
    if (this.modalContainer) {
      this.modalContainer.style.display = 'none';
    }
    this.updateFloatingButton();
  }
  
  restore() {
    this.minimized = false;
    if (this.floatingButton) {
      document.body.removeChild(this.floatingButton);
      this.floatingButton = null;
    }
    if (this.modalContainer) {
      this.modalContainer.style.display = 'flex';
    } else {
      this.renderErrorModal();
    }
  }
  
  updateFloatingButton() {
    if (!this.floatingButton) {
      this.floatingButton = document.createElement('div');
      this.floatingButton.className = '0x1-error-floating-button';
      this.floatingButton.style.position = 'fixed';
      this.floatingButton.style.bottom = '20px';
      this.floatingButton.style.left = '20px';
      this.floatingButton.style.backgroundColor = '#f43f5e';
      this.floatingButton.style.color = 'white';
      this.floatingButton.style.borderRadius = '50%';
      this.floatingButton.style.width = '40px';
      this.floatingButton.style.height = '40px';
      this.floatingButton.style.display = 'flex';
      this.floatingButton.style.alignItems = 'center';
      this.floatingButton.style.justifyContent = 'center';
      this.floatingButton.style.cursor = 'pointer';
      this.floatingButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      this.floatingButton.style.zIndex = '9999';
      this.floatingButton.style.fontSize = '18px';
      this.floatingButton.style.fontWeight = 'bold';
      
      this.floatingButton.addEventListener('click', () => {
        this.restore();
      });
      
      document.body.appendChild(this.floatingButton);
    }
    
    // Update error count
    this.floatingButton.textContent = `${this.errors.length}`;
    
    // Add a lightning bolt icon
    const bolt = document.createElement('span');
    bolt.innerHTML = '⚡';
    bolt.style.marginRight = '2px';
    this.floatingButton.innerHTML = '';
    this.floatingButton.appendChild(bolt);
    this.floatingButton.appendChild(document.createTextNode(`${this.errors.length}`));
  }
  
  renderErrorModal() {
    const currentError = this.getCurrentError();
    if (!currentError) return;
    
    if (this.modalContainer) {
      document.body.removeChild(this.modalContainer);
    }
    
    // Create modal container with overlay
    this.modalContainer = document.createElement('div');
    this.modalContainer.className = '0x1-error-modal-container';
    this.modalContainer.style.position = 'fixed';
    this.modalContainer.style.top = '0';
    this.modalContainer.style.left = '0';
    this.modalContainer.style.width = '100%';
    this.modalContainer.style.height = '100%';
    this.modalContainer.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
    this.modalContainer.style.display = 'flex';
    this.modalContainer.style.alignItems = 'center';
    this.modalContainer.style.justifyContent = 'center';
    this.modalContainer.style.zIndex = '9998';
    this.modalContainer.style.backdropFilter = 'blur(4px)';
    
    // Create modal content
    const modalContent = createDefaultErrorUI(currentError.error, this);
    
    this.modalContainer.appendChild(modalContent);
    document.body.appendChild(this.modalContainer);
  }
  
  clearError(id: string) {
    const index = this.errors.findIndex(e => e.id === id);
    if (index !== -1) {
      this.errors.splice(index, 1);
      if (this.errors.length === 0) {
        if (this.modalContainer) {
          document.body.removeChild(this.modalContainer);
          this.modalContainer = null;
        }
        if (this.floatingButton) {
          document.body.removeChild(this.floatingButton);
          this.floatingButton = null;
        }
      } else {
        // Adjust active index if needed
        if (index <= this.activeErrorIndex) {
          this.activeErrorIndex = Math.max(0, this.activeErrorIndex - 1);
        }
        this.renderErrorModal();
      }
    }
  }
  
  clearAllErrors() {
    this.errors = [];
    if (this.modalContainer) {
      document.body.removeChild(this.modalContainer);
      this.modalContainer = null;
    }
    if (this.floatingButton) {
      document.body.removeChild(this.floatingButton);
      this.floatingButton = null;
    }
  }
}

// Global error manager instance
const errorManager = ErrorManager.getInstance();

// Counter to generate unique IDs for error boundaries
let errorCount = 0;

/**
 * Create a beautiful default error UI inspired by Next.js
 */
export function createDefaultErrorUI(error: Error, errorManager?: ErrorManager): HTMLElement {
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
  errorContainer.style.width = '90%';
  errorContainer.style.maxWidth = '800px';
  errorContainer.style.maxHeight = '85vh';
  errorContainer.style.overflow = 'auto';
  errorContainer.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  errorContainer.style.position = 'relative';
  
  // Create header with logo and controls
  const header = document.createElement('header');
  header.style.marginBottom = '1.5rem';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  
  const titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.gap = '0.5rem';
  
  const logoSpan = document.createElement('span');
  logoSpan.textContent = '⚠️';
  logoSpan.style.fontSize = '1.5rem';
  
  const titleSpan = document.createElement('span');
  titleSpan.innerHTML = '<span style="color: #3b82f6; font-weight: bold;">0x1</span> Error Boundary';
  titleSpan.style.fontSize = '1.25rem';
  
  titleContainer.appendChild(logoSpan);
  titleContainer.appendChild(titleSpan);
  
  // Error counter and navigation controls
  const controlsContainer = document.createElement('div');
  controlsContainer.style.display = 'flex';
  controlsContainer.style.alignItems = 'center';
  controlsContainer.style.gap = '0.5rem';
  
  if (errorManager) {
    const errors = errorManager.getErrors();
    if (errors.length > 1) {
      // Error counter
      const errorCounter = document.createElement('span');
      const currentIndex = errors.findIndex(e => e.error === error) + 1;
      errorCounter.textContent = `${currentIndex} / ${errors.length}`;
      errorCounter.style.fontSize = '0.875rem';
      errorCounter.style.padding = '0.25rem 0.5rem';
      errorCounter.style.backgroundColor = '#334155';
      errorCounter.style.borderRadius = '0.25rem';
      controlsContainer.appendChild(errorCounter);
      
      // Previous error button
      const prevButton = document.createElement('button');
      prevButton.innerHTML = '&lt;';
      prevButton.style.width = '30px';
      prevButton.style.height = '30px';
      prevButton.style.background = '#334155';
      prevButton.style.color = 'white';
      prevButton.style.border = 'none';
      prevButton.style.borderRadius = '50%';
      prevButton.style.cursor = 'pointer';
      prevButton.style.display = 'flex';
      prevButton.style.alignItems = 'center';
      prevButton.style.justifyContent = 'center';
      prevButton.style.fontSize = '18px';
      prevButton.style.fontWeight = 'bold';
      prevButton.addEventListener('click', () => {
        errorManager.navigatePrevious();
        errorManager.renderErrorModal();
      });
      controlsContainer.appendChild(prevButton);
      
      // Next error button
      const nextButton = document.createElement('button');
      nextButton.innerHTML = '&gt;';
      nextButton.style.width = '30px';
      nextButton.style.height = '30px';
      nextButton.style.background = '#334155';
      nextButton.style.color = 'white';
      nextButton.style.border = 'none';
      nextButton.style.borderRadius = '50%';
      nextButton.style.cursor = 'pointer';
      nextButton.style.display = 'flex';
      nextButton.style.alignItems = 'center';
      nextButton.style.justifyContent = 'center';
      nextButton.style.fontSize = '18px';
      nextButton.style.fontWeight = 'bold';
      nextButton.addEventListener('click', () => {
        errorManager.navigateNext();
        errorManager.renderErrorModal();
      });
      controlsContainer.appendChild(nextButton);
    }
    
    // Minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = '_';
    minimizeButton.style.width = '30px';
    minimizeButton.style.height = '30px';
    minimizeButton.style.background = '#4f46e5';
    minimizeButton.style.color = 'white';
    minimizeButton.style.border = 'none';
    minimizeButton.style.borderRadius = '50%';
    minimizeButton.style.cursor = 'pointer';
    minimizeButton.style.display = 'flex';
    minimizeButton.style.alignItems = 'center';
    minimizeButton.style.justifyContent = 'center';
    minimizeButton.style.fontSize = '16px';
    minimizeButton.style.lineHeight = '1';
    minimizeButton.style.fontWeight = 'bold';
    minimizeButton.addEventListener('click', () => {
      errorManager.minimize();
    });
    controlsContainer.appendChild(minimizeButton);
    
    // Dismiss/Ignore button
    const dismissButton = document.createElement('button');
    dismissButton.textContent = '×';
    dismissButton.style.width = '30px';
    dismissButton.style.height = '30px';
    dismissButton.style.background = '#dc2626';
    dismissButton.style.color = 'white';
    dismissButton.style.border = 'none';
    dismissButton.style.borderRadius = '50%';
    dismissButton.style.cursor = 'pointer';
    dismissButton.style.display = 'flex';
    dismissButton.style.alignItems = 'center';
    dismissButton.style.justifyContent = 'center';
    dismissButton.style.fontSize = '20px';
    dismissButton.style.lineHeight = '1';
    dismissButton.style.fontWeight = 'bold';
    dismissButton.addEventListener('click', () => {
      const currentError = errorManager.getCurrentError();
      if (currentError) {
        errorManager.clearError(currentError.id);
      }
    });
    controlsContainer.appendChild(dismissButton);
  }
  
  header.appendChild(titleContainer);
  header.appendChild(controlsContainer);
  
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
  helpTitle.textContent = 'Possible Solutions';
  helpTitle.style.fontSize = '1.2rem';
  helpTitle.style.color = '#38bdf8';
  helpTitle.style.margin = '0 0 0.8rem 0';
  
  const helpContent = document.createElement('ul');
  helpContent.style.margin = '0';
  helpContent.style.padding = '0 0 0 1.5rem';
  helpContent.style.listStyle = 'disc';
  
  function createHelpItem(text: string) {
    const item = document.createElement('li');
    item.textContent = text;
    item.style.marginBottom = '0.5rem';
    return item;
  }
  
  helpContent.appendChild(createHelpItem('Check if your component is properly exported and imported'));
  helpContent.appendChild(createHelpItem('Verify that all required props are being passed'));
  helpContent.appendChild(createHelpItem('Check for null or undefined values'));
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
      // Error occurred, capture it and show the error UI
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Log the error to console
      console.error('Error caught by 0x1 Error Boundary:', error);
      
      try {
        // Add the error to the error manager
        const errorEntry = errorManager.addError(error);
        
        // Check if we're in development mode by looking for the 0x1 dev signature
        const isDevelopmentMode = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        // Render the error modal if not already minimized
        if (!errorManager.isMinimized()) {
          // In development mode, we might want to delay showing the error modal slightly
          // to allow any pending WebSocket connections to complete
          if (isDevelopmentMode) {
            setTimeout(() => {
              errorManager.renderErrorModal();
            }, 100);
          } else {
            errorManager.renderErrorModal();
          }
        } else {
          errorManager.updateFloatingButton();
        }
        
        // Return an empty div as the component output
        // The actual error UI is managed in the modal overlay
        const errorContainer = document.createElement('div');
        errorContainer.setAttribute('data-0x1-error-container', errorEntry.id);
        
        // If a custom fallback is provided, use it in the content area
        if (props.fallback) {
          try {
            const fallbackContent = props.fallback({ error });
            if (typeof fallbackContent === 'string') {
              errorContainer.innerHTML = fallbackContent;
            } else if (fallbackContent instanceof Node) {
              errorContainer.appendChild(fallbackContent);
            }
          } catch (fallbackError) {
            console.error('Error in custom fallback:', fallbackError);
          }
        }
        
        return errorContainer;
      } catch (errorManagerError) {
        // If the error manager fails, fall back to a basic error display
        console.error('Error manager failed:', errorManagerError);
        const errorContainer = document.createElement('div');
        
        // Use default error UI without error manager
        errorContainer.appendChild(createDefaultErrorUI(error));
        
        return errorContainer;
      }
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
