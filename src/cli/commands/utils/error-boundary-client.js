/**
 * 0x1 Framework Error Boundary Client
 * 
 * This provides a beautiful, non-intrusive error display system
 * similar to Next.js error overlays, but more minimal and focused.
 */

// Create and initialize the error manager
(() => {
  if (typeof window === 'undefined') return;
  
  // Avoid duplicate initialization
  if (window.__0x1_errorBoundary) return;
  
  // Initialize error tracking
  window.__0x1_errorBoundary = {
    errors: [],
    listeners: new Set(),
    
    // Add an error
    addError(error, componentName) {
      // Create error object with all necessary info
      const errorObj = {
        id: Date.now(),
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        componentName: componentName || 'Unknown Component',
        timestamp: new Date(),
        expanded: false,
      };
      
      // Add to errors array
      this.errors.push(errorObj);
      
      // Make sure we're in the browser environment before rendering
      if (typeof window !== 'undefined') {
        this.renderErrorUI();
      }
      
      return errorObj.id;
    },
    
    // Remove an error
    removeError(errorId) {
      const index = this.errors.findIndex(e => e.id === errorId);
      if (index >= 0) {
        this.errors.splice(index, 1);
        this.notifyListeners();
        this.renderErrorUI();
      }
    },
    
    // Toggle error expansion
    toggleErrorExpanded(errorId) {
      const error = this.errors.find(e => e.id === errorId);
      if (error) {
        error.expanded = !error.expanded;
        
        // Update only the specific error card's stack and button text without re-rendering entire UI
        const errorCard = document.querySelector(`[data-error-id="${errorId}"]`);
        if (errorCard) {
          const stackTrace = errorCard.querySelector('pre');
          const toggleButton = errorCard.querySelector('button');
          
          if (stackTrace) {
            stackTrace.style.display = error.expanded ? 'block' : 'none';
          }
          
          if (toggleButton) {
            toggleButton.textContent = error.expanded ? 'Hide Details' : 'Show Details';
          }
        }
      }
    },
    
    // Close all errors and hide the UI
    clearErrors() {
      this.errors = [];
      this.notifyListeners();
      this.renderErrorUI();
    },
    
    // Add a listener for error changes
    addListener(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    },
    
    // Notify all listeners
    notifyListeners() {
      this.listeners.forEach(listener => listener(this.errors));
    },
    
    // Render the error UI
    renderErrorUI() {
      // Remove existing UI if errors are empty
      if (!this.errors.length) {
        const errorButton = document.getElementById('0x1-error-button');
        if (errorButton) {
          document.body.removeChild(errorButton);
        }
        
        const errorContainer = document.getElementById('0x1-error-container');
        if (errorContainer) {
          errorContainer.style.opacity = '0';
          setTimeout(() => {
            errorContainer.style.display = 'none';
          }, 300); // Match the transition duration
        }
        return;
      }
      
      // Create or get the error container
      let errorContainer = document.getElementById('0x1-error-container');
      if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = '0x1-error-container';
        // Structure the overlay with a fixed header and scrollable content area
        errorContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(10, 10, 15, 0.9);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          box-sizing: border-box;
          z-index: 999999;
          opacity: 0;
          transition: opacity 0.3s ease-out;
          padding: 20px;
        `;
        document.body.appendChild(errorContainer);
      }

      // Create error button if it doesn't exist yet
      let errorButton = document.getElementById('0x1-error-button');
      if (!errorButton) {
        errorButton = document.createElement('div');
        errorButton.id = '0x1-error-button';
        errorButton.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #7c3aed;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 999998;
          border: 2px solid #8b5cf6;
          transition: transform 0.3s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: bold;
          animation: errorButtonPulse 2s infinite;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes errorButtonPulse {
            0% {
              box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(124, 58, 237, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translate3d(0, 20px, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
          
          .error-list-animate-in {
            animation: fadeInUp 0.3s ease forwards;
          }
        `;
        document.head.appendChild(style);
        
        // Add lightning icon
        const lightningIcon = document.createElement('div');
        lightningIcon.style.cssText = `
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        `;
        lightningIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;
        
        errorButton.appendChild(lightningIcon);
        
        // Add badge showing error count
        const errorCount = document.createElement('div');
        errorCount.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #ef4444;
          color: white;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #f8fafc;
        `;
        errorCount.textContent = this.errors.length.toString();
        errorButton.appendChild(errorCount);
        
        // Toggle error container visibility when button is clicked
        errorButton.addEventListener('click', () => {
          const container = document.getElementById('0x1-error-container');
          if (container) {
            const isVisible = container.style.display === 'flex';
            
            if (!isVisible) {
              // Show with animation
              container.style.display = 'flex';
              // Trigger a reflow to ensure the transition works
              void container.offsetWidth;
              container.style.opacity = '1';
              
              // Add animation class to error list
              const errorListElement = container.querySelector('.scrollable');
              if (errorListElement) {
                errorListElement.classList.add('error-list-animate-in');
              }
            } else {
              // Hide with animation
              container.style.opacity = '0';
              setTimeout(() => {
                container.style.display = 'none';
                // Remove animation class when hidden
                const errorListElement = container.querySelector('.scrollable');
                if (errorListElement) {
                  errorListElement.classList.remove('error-list-animate-in');
                }
              }, 300);
            }
          }
        });
        
        // Add hover effect
        errorButton.addEventListener('mouseover', () => {
          errorButton.style.transform = 'scale(1.1)';
        });
        errorButton.addEventListener('mouseout', () => {
          errorButton.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(errorButton);
      } else {
        // Update error count
        const errorCount = errorButton.querySelector('div:last-child');
        if (errorCount) {
          errorCount.textContent = this.errors.length.toString();
        }
      }
      
      // Clear existing error overlay
      const existingOverlay = document.getElementById('0x1-error-overlay');
      if (existingOverlay) {
        errorContainer.removeChild(existingOverlay);
      }
      
      // Create error content wrapper
      const errorOverlay = document.createElement('div');
      errorOverlay.id = '0x1-error-overlay';
      // Create a container with header and scrollable content
      errorOverlay.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 800px;
        display: flex;
        flex-direction: column;
        background-color: #1a1a2e;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        color: #e2e8f0;
        border: 1px solid #2d2d44;
        max-height: calc(100vh - 40px);
        overflow: hidden;
      `;
      errorContainer.appendChild(errorOverlay);
      
      // Create header
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 16px 20px;
        background-color: #222236;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-bottom: 1px solid #2d2d44;
        position: sticky;
        top: 0;
        z-index: 1;
      `;
      
      const titleContainer = document.createElement('div');
      titleContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      // Add warning icon
      const warningIcon = document.createElement('div');
      warningIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      
      const title = document.createElement('div');
      title.textContent = '0x1 Framework Error';
      title.style.cssText = `
        font-weight: 600;
        color: #f8fafc;
        font-size: 18px;
      `;
      
      titleContainer.appendChild(warningIcon);
      titleContainer.appendChild(title);
      
      // Create close button
      const buttonContainer = document.createElement('div');
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        background-color: transparent;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      `;
      closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      
      closeButton.addEventListener('mouseover', () => {
        closeButton.style.backgroundColor = '#2d2d44';
        closeButton.style.color = '#f8fafc';
      });
      closeButton.addEventListener('mouseout', () => {
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.color = '#94a3b8';
      });
      closeButton.addEventListener('click', () => {
        const container = document.getElementById('0x1-error-container');
        if (container) {
          container.style.opacity = '0';
          setTimeout(() => {
            container.style.display = 'none';
          }, 300);
        }
      });
      
      buttonContainer.appendChild(closeButton);
      header.appendChild(titleContainer);
      header.appendChild(buttonContainer);
      errorOverlay.appendChild(header);
      
      // Create a scrollable container for error content
      const scrollableContainer = document.createElement('div');
      scrollableContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        width: 100%;
        max-height: calc(100vh - 150px);
        scrollbar-width: thin;
        scrollbar-color: #4b4b66 #222236;
      `;
      
      // Add custom scrollbar styling for webkit browsers
      const scrollbarStyle = document.createElement('style');
      scrollbarStyle.textContent = `
        #0x1-error-overlay .scrollable::-webkit-scrollbar {
          width: 8px;
        }
        #0x1-error-overlay .scrollable::-webkit-scrollbar-track {
          background: #222236;
          border-radius: 4px;
        }
        #0x1-error-overlay .scrollable::-webkit-scrollbar-thumb {
          background-color: #4b4b66;
          border-radius: 4px;
        }
        #0x1-error-overlay .scrollable::-webkit-scrollbar-thumb:hover {
          background-color: #5d5d82;
        }
      `;
      document.head.appendChild(scrollbarStyle);
      scrollableContainer.classList.add('scrollable');
      
      // Add error cards inside the scrollable container
      const errorList = document.createElement('div');
      errorList.style.cssText = `
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `;
      
      this.errors.forEach(errorObj => {
        // Create error card
        const errorCard = document.createElement('div');
        errorCard.setAttribute('data-error-id', errorObj.id);
        errorCard.style.cssText = `
          background-color: #222236;
          border-radius: 12px;
          padding: 16px 20px;
          width: 100%;
          overflow-wrap: break-word;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid #2d2d44;
          border-left: 4px solid #8b5cf6;
          transition: all 0.2s ease;
          color: #e2e8f0;
        `;
        
        // Error card hover effect
        errorCard.addEventListener('mouseover', () => {
          errorCard.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
          errorCard.style.borderColor = '#3d3d5c';
        });
        errorCard.addEventListener('mouseout', () => {
          errorCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          errorCard.style.borderColor = '#2d2d44';
        });
        
        const errorHeader = document.createElement('div');
        errorHeader.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        `;
        
        const errorTitleContainer = document.createElement('div');
        errorTitleContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        
        // Add error icon
        const errorIcon = document.createElement('div');
        errorIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        
        const errorTitle = document.createElement('div');
        errorTitle.textContent = errorObj.componentName ? `Error in ${errorObj.componentName}` : 'Runtime Error';
        errorTitle.style.cssText = `
          font-weight: 600;
          color: #ff0000;
          font-size: 16px;
        `;
        
        errorTitleContainer.appendChild(errorIcon);
        errorTitleContainer.appendChild(errorTitle);
        
        const errorTime = document.createElement('div');
        errorTime.textContent = errorObj.timestamp.toLocaleTimeString();
        errorTime.style.cssText = `
          color: #a78bf6;
          font-size: 12px;
          background-color: #2d2d44;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid #4b4b66;
        `;
        
        errorHeader.appendChild(errorTitleContainer);
        errorHeader.appendChild(errorTime);
        
        const errorMessage = document.createElement('div');
        errorMessage.textContent = errorObj.message;
        errorMessage.style.cssText = `
          margin-bottom: 12px;
          font-weight: 500;
          color: #f8fafc;
          padding: 8px 12px;
          background-color: #35355a;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid #4b4b66;
        `;
        
        const errorStack = document.createElement('pre');
        errorStack.textContent = errorObj.stack;
        errorStack.style.cssText = `
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 13px;
          line-height: 1.5;
          background-color: #181825;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0;
          color: #c2c8d0;
          border: 1px solid #2d2d44;
          display: ${errorObj.expanded ? 'block' : 'none'};
        `;
        
        // Add toggle button for stack trace
        const errorToggle = document.createElement('button');
        errorToggle.style.cssText = `
          background-color: #2d2d44;
          border: 1px solid #4b4b66;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 12px;
          color: #a78bf6;
          font-weight: 500;
          transition: all 0.2s;
        `;
        errorToggle.textContent = errorObj.expanded ? 'Hide Details' : 'Show Details';
        
        // Toggle button hover effect
        errorToggle.addEventListener('mouseover', () => {
          errorToggle.style.backgroundColor = '#3a3a57';
          errorToggle.style.borderColor = '#5d5d82';
        });
        errorToggle.addEventListener('mouseout', () => {
          errorToggle.style.backgroundColor = '#2d2d44';
          errorToggle.style.borderColor = '#4b4b66';
        });
        
        errorToggle.addEventListener('click', () => {
          this.toggleErrorExpanded(errorObj.id);
        });
        
        // Add components to error card in the right order
        errorCard.appendChild(errorHeader);
        errorCard.appendChild(errorMessage);
        errorCard.appendChild(errorStack);
        errorCard.appendChild(errorToggle);
        
        // Add error card to the list
        errorList.appendChild(errorCard);
      });
      
      // Add the error list to the scrollable container
      scrollableContainer.appendChild(errorList);
      
      // Add the scrollable container to the overlay
      errorOverlay.appendChild(scrollableContainer);
      
      // Add a footer for the dismiss all button
      const footer = document.createElement('div');
      footer.style.cssText = `
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 16px;
        background-color: #1a1a2e;
        border-top: 1px solid #2d2d44;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
      `;
      
      // Add dismiss all button in the footer
      const dismissAll = document.createElement('button');
      dismissAll.style.cssText = `
        background-color: #2d2d44;
        color: #e2e8f0;
        border: 1px solid #4b4b66;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      `;
      dismissAll.textContent = 'Dismiss All';
      
      // Button hover effects
      dismissAll.addEventListener('mouseover', () => {
        dismissAll.style.backgroundColor = '#3a3a57';
        dismissAll.style.borderColor = '#5d5d82';
      });
      dismissAll.addEventListener('mouseout', () => {
        dismissAll.style.backgroundColor = '#2d2d44';
        dismissAll.style.borderColor = '#4b4b66';
      });
      
      dismissAll.addEventListener('click', () => {
        this.clearErrors();
      });
      
      // Add dismiss all button to footer and footer to overlay
      footer.appendChild(dismissAll);
      errorOverlay.appendChild(footer);
    }
  };
  
  // Install global error handler
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Call original console.error
    originalConsoleError.apply(console, args);
    
    // Extract error object from arguments
    const error = args.find(arg => arg instanceof Error) || new Error(args.join(' '));
    
    // Add to error boundary
    window.__0x1_errorBoundary.addError(error);
  };
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    window.__0x1_errorBoundary.addError(event.reason || new Error('Unhandled Promise Rejection'));
  });
  
  // Catch runtime errors
  window.addEventListener('error', (event) => {
    window.__0x1_errorBoundary.addError(event.error || new Error(event.message));
  });
})();

// Add error boundary API for React components to the global scope for browser usage
if (typeof window !== 'undefined') {
  // Define the createErrorBoundary function in the global scope
  window.createErrorBoundary = (Component, fallback) => {
    return function ErrorBoundaryWrapper(props) {
      try {
        return Component(props);
      } catch (error) {
        if (window.__0x1_errorBoundary) {
          window.__0x1_errorBoundary.addError(error, Component.name || 'Component');
        }
        
        if (fallback) {
          return fallback(error);
        }
        
        // Default fallback
        return {
          type: 'div',
          props: {
            className: 'error-boundary-fallback'
          },
          children: []
        };
      }
    };
  };

  // Also expose it through 0x1 namespace for more organized access
  window._0x1 = window._0x1 || {};
  window._0x1.createErrorBoundary = window.createErrorBoundary;
}
