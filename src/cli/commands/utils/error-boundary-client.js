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
    
    // Clear all errors
    clearErrors() {
      this.errors = [];
      this.notifyListeners();
      this.renderErrorUI();
    },
    
    // Toggle error expansion
    toggleErrorExpanded(errorId) {
      const error = this.errors.find(e => e.id === errorId);
      if (error) {
        error.expanded = !error.expanded;
        this.renderErrorUI();
      }
    },
    
  // Close all errors and hide the UI
  clearErrors() {
    this.errors = [];
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
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
          padding: 32px;
          box-sizing: border-box;
          z-index: 999999;
          overflow-y: auto;
          opacity: 0;
          transition: opacity 0.3s ease-out;
        `;
        document.body.appendChild(errorContainer);
        
        // Add animation styles for the container
        const overlayAnimations = document.createElement('style');
        overlayAnimations.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          .error-list-animate-in > * {
            animation: slideIn 0.3s ease-out forwards;
            opacity: 0;
          }
          
          .error-list-animate-in > *:nth-child(1) { animation-delay: 0.1s; }
          .error-list-animate-in > *:nth-child(2) { animation-delay: 0.15s; }
          .error-list-animate-in > *:nth-child(3) { animation-delay: 0.2s; }
          .error-list-animate-in > *:nth-child(4) { animation-delay: 0.25s; }
          .error-list-animate-in > *:nth-child(5) { animation-delay: 0.3s; }
          .error-list-animate-in > *:nth-child(n+6) { animation-delay: 0.35s; }
        `;
        document.head.appendChild(overlayAnimations);
      }
      
      // Clear the container for fresh content
      errorContainer.innerHTML = '';
      
      // Create error content wrapper
      const errorOverlay = document.createElement('div');
      errorOverlay.id = '0x1-error-overlay';
      errorOverlay.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 800px;
        margin: 60px auto 20px auto;
        padding: 24px;
        background-color: #1a1a2e;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        color: #e2e8f0;
        border: 1px solid #2d2d44;
      `;
      errorContainer.appendChild(errorOverlay);
      
      // Create or get the error button
      let errorButton = document.getElementById('0x1-error-button');
      if (!errorButton) {
        errorButton = document.createElement('div');
        errorButton.id = '0x1-error-button';
        errorButton.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 20px;
          background-color: #ef4444;
          color: white;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
          z-index: 999998;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 2px solid rgba(246, 139, 139, 0.8);
        `;
        
        // Add lightning bolt icon with pulse animation
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
        
        // Add pulse animation keyframes
        const pulseAnimation = document.createElement('style');
        pulseAnimation.textContent = `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.9;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(pulseAnimation);
        
        // Create count badge
        const countBadge = document.createElement('div');
        countBadge.id = '0x1-error-count';
        countBadge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #1a1a2e;
          color: #ef4444;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          padding: 0 4px;
          border: 2px solid rgba(246, 139, 139, 0.8);
        `;
        errorButton.appendChild(countBadge);
        
        // Toggle overlay visibility on click with smooth animations
        errorButton.addEventListener('click', function() {
          const container = document.getElementById('0x1-error-container');
          if (container) {
            if (container.style.display === 'none' || !container.style.display) {
              // Show with animation
              container.style.display = 'flex';
              // Trigger a reflow to ensure the transition works
              void container.offsetWidth;
              container.style.opacity = '1';
              
              // Add animation class to error list
              const errorList = container.querySelector('div:not(#0x1-error-overlay)');
              if (errorList) {
                errorList.classList.add('error-list-animate-in');
              }
            } else {
              // Hide with animation
              container.style.opacity = '0';
              setTimeout(() => {
                container.style.display = 'none';
                // Remove animation class when hidden
                const errorList = container.querySelector('.error-list-animate-in');
                if (errorList) {
                  errorList.classList.remove('error-list-animate-in');
                }
              }, 300);
            }
          }
        });
        document.body.appendChild(errorButton);
      }
      
      // Update error count on badge
      const countBadge = document.getElementById('0x1-error-count');
      if (countBadge) {
        countBadge.textContent = this.errors.length.toString();
        
        // Add a subtle animation to the badge
        countBadge.animate([
          { transform: 'scale(0.8)', opacity: 0.8 },
          { transform: 'scale(1.2)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 }
        ], {
          duration: 300,
          easing: 'ease-out'
        });
      }
      
      // Build error list content inside errorOverlay
      
      // Add header
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        max-width: 800px;
        margin-bottom: 24px;
        padding: 16px 20px;
        background-color: #222236;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid #2d2d44;
      `;
      
      const titleContainer = document.createElement('div');
      titleContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      
      // Add lightning icon to title
      const titleIcon = document.createElement('div');
      titleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;
      
      const title = document.createElement('h2');
      title.textContent = 'Runtime Errors';
      title.style.cssText = `
        margin: 0;
        color: #a78bf6;
        font-size: 20px;
        font-weight: 600;
      `;
      
      titleContainer.appendChild(titleIcon);
      titleContainer.appendChild(title);
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
      `;
      
      const dismissAllButton = document.createElement('button');
      dismissAllButton.textContent = 'Dismiss All';
      dismissAllButton.style.cssText = `
        background-color: #2d2d44;
        color: #e2e8f0;
        border: 1px solid #4b4b66;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      `;
      dismissAllButton.addEventListener('mouseover', () => {
        dismissAllButton.style.backgroundColor = '#3a3a57';
        dismissAllButton.style.borderColor = '#5d5d82';
      });
      dismissAllButton.addEventListener('mouseout', () => {
        dismissAllButton.style.backgroundColor = '#2d2d44';
        dismissAllButton.style.borderColor = '#4b4b66';
      });
      dismissAllButton.addEventListener('click', () => {
        this.clearErrors();
      });
      
      const closeButton = document.createElement('button');
      closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      closeButton.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #2d2d44;
        border: 1px solid #4b4b66;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        cursor: pointer;
        color: #e2e8f0;
        transition: all 0.2s;
      `;
      closeButton.addEventListener('mouseover', () => {
        closeButton.style.backgroundColor = '#3a3a57';
        closeButton.style.borderColor = '#5d5d82';
      });
      closeButton.addEventListener('mouseout', () => {
        closeButton.style.backgroundColor = '#2d2d44';
        closeButton.style.borderColor = '#4b4b66';
      });
      closeButton.addEventListener('click', () => {
        errorContainer.style.display = 'none';
      });
      
      buttonContainer.appendChild(dismissAllButton);
      buttonContainer.appendChild(closeButton);
      
      header.appendChild(titleContainer);
      header.appendChild(buttonContainer);
      errorOverlay.appendChild(header);
      
      // Add error cards
      const errorList = document.createElement('div');
      errorList.style.cssText = `
        width: 100%;
        max-width: 800px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `;
      
      this.errors.forEach(errorObj => {
        const errorCard = document.createElement('div');
        errorCard.style.cssText = `
          background-color: #222236;
          border-radius: 12px;
          padding: 16px 20px;
          width: 100%;
          overflow-wrap: break-word;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-left: 4px solid #8b5cf6;
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
          color: #111827;
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
      
      errorOverlay.appendChild(errorList);
      
      // Add dismiss all button
      const dismissAll = document.createElement('button');
      dismissAll.style.cssText = `
        background-color: #2d2d44;
        color: #e2e8f0;
        border: 1px solid #4b4b66;
        border-radius: 6px;
        padding: 8px 16px;
        margin-top: 16px;
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
      
      errorOverlay.appendChild(dismissAll);
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
