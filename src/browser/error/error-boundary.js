/**
 * 0x1 Framework Error Boundary Client
 * 
 * This provides a beautiful, non-intrusive error display system
 * similar to Next.js error overlays, but more minimal and focused.
 * 
 * TODO:
 * - If we ever see a `[0x1 App] Failed to initialize application:` we need to highlight it and have appropriate troubleshooting steps, same for other expected cases (may/object/array?)
 * - our errors currently get a left gray border afterhover, we should start with a yellow one
 * - Add more generic / expected error suggestions and notes to the map
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
    recentErrors: new Map(), // Track recent errors to prevent spam
    
    // Add an error with deduplication
    addError(error, componentName) {
      // Create error fingerprint for deduplication
      const errorFingerprint = `${error.message || 'Unknown error'}_${componentName || 'Unknown Component'}`;
      const now = Date.now();
      
      // Check if this error already exists
      const existingError = this.errors.find(e => e.fingerprint === errorFingerprint);
      
      if (existingError) {
        // Update existing error instead of creating a new one
        existingError.count = (existingError.count || 1) + 1;
        existingError.lastSeen = now;
        existingError.timestamps = existingError.timestamps || [existingError.timestamp];
        existingError.timestamps.push(new Date());
        
        // Update the UI to reflect the new count
        this.renderErrorUI();
        this.notifyListeners();
        return existingError.id;
      }
      
      // Add to recent errors tracking for cleanup
      this.recentErrors.set(errorFingerprint, now);
      
      // Clean up old entries (older than 30 seconds)
      const cutoff = now - 30000;
      for (const [fingerprint, timestamp] of this.recentErrors.entries()) {
        if (timestamp < cutoff) {
          this.recentErrors.delete(fingerprint);
        }
      }
      
      // Create error object with all necessary info
      const errorObj = {
        id: Date.now(),
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        componentName: componentName || 'Unknown Component',
        timestamp: new Date(),
        lastSeen: now,
        count: 1,
        fingerprint: errorFingerprint,
        timestamps: [new Date()],
        // true if error exists:
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
      
      // Show error overlay immediately when errors exist
      this.showErrorOverlay();
      
      // Also create the floating button for when user dismisses the overlay
      this.createFloatingButton();
    },
    
    // Create the floating button (separated from main render logic)
    createFloatingButton() {
      // Create error button if it doesn't exist yet
      let errorButton = document.getElementById('0x1-error-button');
      if (!errorButton) {
        errorButton = document.createElement('div');
        errorButton.id = '0x1-error-button';
        errorButton.style.cssText = `
          position: fixed;
          bottom: 24px;
          left: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 999998;
          border: 2px solid #fed7aa;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 22px;
          font-weight: bold;
          animation: errorButtonPulse 3s infinite;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        `;
        
        // Add CSS animation if not already present
        if (!document.querySelector('#error-boundary-styles')) {
        const style = document.createElement('style');
          style.id = 'error-boundary-styles';
        style.textContent = `
          @keyframes errorButtonPulse {
            0% {
                box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(249, 115, 22, 0.7);
            }
            70% {
                box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 12px rgba(249, 115, 22, 0);
            }
            100% {
                box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 0 rgba(249, 115, 22, 0);
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
              animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            
            @keyframes bounceIn {
              0% {
                opacity: 0;
                transform: scale(0.3) rotate(-10deg);
              }
              50% {
                opacity: 1;
                transform: scale(1.05) rotate(5deg);
              }
              70% {
                transform: scale(0.95) rotate(-2deg);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotate(0deg);
              }
            }
            
            .error-button-animate-in {
              animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          }
        `;
        document.head.appendChild(style);
        }
        
        // Add lightning icon with better styling
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
        lightningIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;
        
        errorButton.appendChild(lightningIcon);
        
        // Add badge showing error count with enhanced styling
        const errorCount = document.createElement('div');
        errorCount.textContent = this.errors.length.toString();
        errorCount.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #fef2f2;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        `;
        errorButton.appendChild(errorCount);
        
        // Toggle error container visibility when button is clicked
        errorButton.addEventListener('click', () => {
          this.showErrorOverlay();
        });
        
        // Add enhanced hover effect
        errorButton.addEventListener('mouseover', () => {
          errorButton.style.transform = 'scale(1.1) translateY(-2px)';
          errorButton.style.background = 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)';
          errorButton.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.5), 0 8px 16px rgba(0, 0, 0, 0.2)';
        });
        errorButton.addEventListener('mouseout', () => {
          errorButton.style.transform = 'scale(1) translateY(0px)';
          errorButton.style.background = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
          errorButton.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        // Add entrance animation
        errorButton.classList.add('error-button-animate-in');
        
        document.body.appendChild(errorButton);
      } else {
        // Update error count with animation
        const errorCount = errorButton.querySelector('div:last-child');
        if (errorCount) {
          const newCount = this.errors.length.toString();
          if (errorCount.textContent !== newCount) {
            errorCount.style.animation = 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
            errorCount.textContent = newCount;
          }
        }
      }
    },
    
    // Show the error overlay (separated for reuse)
    showErrorOverlay() {
      // Hide the floating error button when overlay is shown
      const errorButton = document.getElementById('0x1-error-button');
      if (errorButton) {
        errorButton.style.display = 'none';
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
          background-color: rgba(5, 5, 10, 0.95);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          transition: opacity 0.3s ease;
          opacity: 0;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        `;
        document.body.appendChild(errorContainer);
      }
      
      // Clear existing error overlay content
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
        max-width: 900px;
        display: flex;
        flex-direction: column;
        background-color: #0a0a0f;
        border-radius: 16px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.3);
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        color: #f1f5f9;
        border: 1px solid #2d1b69;
        max-height: calc(100vh - 40px);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      `;
      errorContainer.appendChild(errorOverlay);
      
      // Create header with title and controls
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background-color: #1a1626;
        border-bottom: 1px solid #2d1b69;
        border-radius: 16px 16px 0 0;
        flex-shrink: 0;
      `;
      
      // Create left side with title only (no minimize button)
      const leftControls = document.createElement('div');
      leftControls.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      
      const title = document.createElement('h2');
      title.textContent = `0x1 Framework - Development Errors`;
      title.style.cssText = `
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #f1f5f9;
        font-family: inherit;
      `;
      
      // Add error count badge
      const errorBadge = document.createElement('div');
      errorBadge.textContent = `${this.errors.length}`;
      errorBadge.style.cssText = `
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
      `;
      
      leftControls.appendChild(title);
      leftControls.appendChild(errorBadge);
      header.appendChild(leftControls);
      
      // Create right side with close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '✕';
      closeButton.style.cssText = `
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-family: inherit;
        line-height: 1;
      `;
      
      closeButton.addEventListener('mouseover', () => {
        closeButton.style.background = '#374151';
        closeButton.style.color = '#f1f5f9';
      });
      closeButton.addEventListener('mouseout', () => {
        closeButton.style.background = 'none';
        closeButton.style.color = '#94a3b8';
      });
      
      closeButton.addEventListener('click', () => {
        errorContainer.style.opacity = '0';
          setTimeout(() => {
          errorContainer.style.display = 'none';
          // Show the floating error button again when overlay is closed
          const errorButton = document.getElementById('0x1-error-button');
          if (errorButton && this.errors.length > 0) {
            errorButton.style.display = 'flex';
          } else if (this.errors.length > 0) {
            // Create the floating button if it doesn't exist
            this.createFloatingButton();
          }
        }, 300);
      });
      
      header.appendChild(closeButton);
      errorOverlay.appendChild(header);
      
      // Create scrollable content area (with proper overflow handling)
      const scrollableContent = document.createElement('div');
      scrollableContent.className = 'scrollable';
      scrollableContent.style.cssText = `
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 0;
        background-color: #0a0a0f;
        border-radius: 0 0 16px 16px;
        scrollbar-width: thin;
        scrollbar-color: #475569 #1e293b;
        max-height: calc(100vh - 160px);
      `;
      
      // Create error list with better separation
      const errorList = document.createElement('div');
      errorList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px;
      `;
      
      this.errors.forEach((error, index) => {
        // Initialize seen state if not set
        if (error.seen === undefined) {
          error.seen = false;
        }
        
        // Determine border color based on seen state - start with orange/yellow, transition to gray when seen
        let borderColor = error.seen ? '#6b7280' : '#f97316'; // Gray if seen, orange if not seen
        
        const errorItem = document.createElement('div');
        errorItem.style.cssText = `
          background-color: #111827;
          border-left: 4px solid ${borderColor};
          border-radius: 8px;
          margin: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #374151;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `;
        
        // Add data attribute for easier targeting
        errorItem.setAttribute('data-error-id', error.id);
        
        // Add hover effect to error item (track seen state)
        errorItem.addEventListener('mouseover', () => {
          errorItem.style.backgroundColor = '#1f2937';
          errorItem.style.borderLeftColor = '#8b5cf6'; // Purple highlight on hover
          errorItem.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.3)';
          errorItem.style.borderColor = '#4b5563';
          errorItem.style.transform = 'translateY(-1px)';
          
          // Mark errors as seen on hover
          if (!error.seen) {
            error.seen = true;
          }
        });
        errorItem.addEventListener('mouseout', () => {
          errorItem.style.backgroundColor = '#111827';
          errorItem.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          errorItem.style.borderColor = '#374151';
          errorItem.style.transform = 'translateY(0px)';
          
          // Set the appropriate border color based on seen state
          errorItem.style.borderLeftColor = error.seen ? '#6b7280' : '#f97316';
        });
        
        // Create error header (clickable)
        const errorHeader = document.createElement('div');
        errorHeader.style.cssText = `
          padding: 18px 24px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: ${error.expanded ? '#1f2937' : 'transparent'};
          border-bottom: ${error.expanded ? '1px solid #374151' : 'none'};
          transition: background-color 0.2s ease;
        `;
        
        const errorHeaderContent = document.createElement('div');
        errorHeaderContent.style.cssText = `
          flex: 1;
          min-width: 0;
        `;
        
        const errorTitle = document.createElement('div');
        errorTitle.style.cssText = `
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 6px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        `;
        
        // Add error number badge with better styling
        const errorNumber = document.createElement('span');
        errorNumber.textContent = `#${index + 1}`;
        errorNumber.style.cssText = `
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.6) 100%);
          color: #f3f4f6;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          min-width: 26px;
          text-align: center;
          font-family: inherit;
          box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
        `;
        
        const errorTitleText = document.createElement('span');
        errorTitleText.style.cssText = `
          color: #f1f5f9;
          font-weight: 600;
        `;
        
        // Build title with count if there are duplicates
        let titleText = `${(error.type || 'ERROR').toUpperCase()}: ${error.file || error.componentName || 'Unknown Component'}`;
        if (error.count && error.count > 1) {
          titleText += ` (${error.count}x)`;
        }
        errorTitleText.textContent = titleText;
        
        errorTitle.appendChild(errorNumber);
        errorTitle.appendChild(errorTitleText);
        
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
          color: #d1d5db;
          font-size: 13px;
          line-height: 1.5;
          font-family: inherit;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: none;
          overflow: visible;
        `;
        
        // Build message with timing info for duplicates
        let messageText = error.message || 'Unknown error occurred';
        if (error.count && error.count > 1) {
          const firstTime = error.timestamps[0];
          const lastTime = error.timestamps[error.timestamps.length - 1];
          const timeRange = firstTime !== lastTime 
            ? `First: ${firstTime.toLocaleTimeString()}, Last: ${lastTime.toLocaleTimeString()}`
            : `Occurred: ${firstTime.toLocaleTimeString()}`;
          messageText += `\n\n📊 Occurred ${error.count} times - ${timeRange}`;
        }
        
        errorMessage.innerHTML = makeLinksClickable(messageText);
        
        errorHeaderContent.appendChild(errorTitle);
        errorHeaderContent.appendChild(errorMessage);
        errorHeader.appendChild(errorHeaderContent);
        
        // Better expand/collapse indicator with animation
        const expandButton = document.createElement('div');
        expandButton.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8b5cf6;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-left: 16px;
          padding: 6px 12px;
          border-radius: 6px;
          background-color: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
        `;
        
        const expandIcon = document.createElement('span');
        expandIcon.style.cssText = `
          transform: rotate(${error.expanded ? '90deg' : '0deg'});
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
          color: #a78bfa;
        `;
        expandIcon.textContent = '▶';
        
        const expandText = document.createElement('span');
        expandText.textContent = error.expanded ? 'Hide Stack' : 'Stack Trace';
        expandText.style.cssText = `
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #a78bfa;
        `;
        
        expandButton.appendChild(expandIcon);
        expandButton.appendChild(expandText);
        errorHeader.appendChild(expandButton);
        
        // Add click handler to the entire header (with proper binding)
        errorHeader.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleErrorExpanded(error.id);
          
          // Update just this accordion item instead of re-rendering everything
          const updatedError = this.errors.find(err => err.id === error.id);
          if (updatedError) {
            // Update the expand button text and icon with smooth animation
            expandIcon.style.transform = `rotate(${updatedError.expanded ? '90deg' : '0deg'})`;
            expandText.textContent = updatedError.expanded ? 'Hide Stack' : 'Stack Trace';
            
            // Update header background with smooth transition
            errorHeader.style.backgroundColor = updatedError.expanded ? '#1f2937' : 'transparent';
            errorHeader.style.borderBottom = updatedError.expanded ? '1px solid #374151' : 'none';
            
            // Show/hide error details with animation
            let errorDetails = errorItem.querySelector('.error-details');
            if (updatedError.expanded && !errorDetails) {
              // Create error details if expanded and doesn't exist
              errorDetails = document.createElement('div');
              errorDetails.className = 'error-details';
              errorDetails.style.cssText = `
                padding: 20px 24px;
                background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
                font-size: 12px;
                line-height: 1.6;
                color: #d1d5db;
                font-family: inherit;
                border-top: 1px solid #374151;
                animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              `;
              
              // Add slide down animation
              if (!document.querySelector('#error-details-styles')) {
                const style = document.createElement('style');
                style.id = 'error-details-styles';
                style.textContent = `
                  @keyframes slideDown {
                    from {
                      opacity: 0;
                      max-height: 0;
                      padding-top: 0;
                      padding-bottom: 0;
                    }
                    to {
                      opacity: 1;
                      max-height: 500px;
                      padding-top: 20px;
                      padding-bottom: 20px;
                    }
                  }
                `;
                document.head.appendChild(style);
              }
              
              // Create stack trace with enhanced styling
              const stack = document.createElement('pre');
              
              // Split stack into main content and troubleshooting tips
              const stackContent = updatedError.stack || 'No stack trace available';
              const troubleshootingIndex = stackContent.indexOf('\n\n=== TROUBLESHOOTING GUIDE ===');
              
              let mainStack = stackContent;
              let troubleshootingContent = '';
              
              if (troubleshootingIndex !== -1) {
                mainStack = stackContent.substring(0, troubleshootingIndex);
                troubleshootingContent = stackContent.substring(troubleshootingIndex + 2); // Skip the \n\n
              }
              
              stack.style.cssText = `
                margin: 0 0 16px 0;
                white-space: pre-wrap;
                word-break: break-word;
                color: #fbbf24;
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                padding: 16px;
          border-radius: 8px;
                border: 1px solid #374151;
                font-size: 11px;
          overflow-x: auto;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
              `;
              // Use innerHTML with clickable links instead of textContent
              stack.innerHTML = makeLinksClickable(mainStack);
              
              errorDetails.appendChild(stack);

              // Add separate troubleshooting box if we have troubleshooting content
              if (troubleshootingContent.trim()) {
                const troubleshootingBox = document.createElement('div');
                troubleshootingBox.style.cssText = `
                  margin: 16px 0 24px 0;
                  padding: 16px;
                  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%);
                  border-radius: 8px;
                  border: 1px solid rgba(34, 197, 94, 0.2);
                  position: relative;
                  max-width: 100%;
                  overflow: hidden;
                `;
                
                // Add troubleshooting header with icon
                const troubleshootingHeader = document.createElement('div');
                troubleshootingHeader.style.cssText = `
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 10px;
                  color: #22c55e;
                  font-weight: 600;
                  font-size: 12px;
                `;
                troubleshootingHeader.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>How to Fix This</span>
                `;
                
                // Add troubleshooting content
                const troubleshootingText = document.createElement('div');
                troubleshootingText.style.cssText = `
                  color: #d1fae5;
                  font-size: 11px;
                  line-height: 1.5;
                  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                  white-space: pre-wrap;
                  word-break: break-word;
                  overflow-wrap: break-word;
                  max-width: 100%;
                `;
                troubleshootingText.innerHTML = makeLinksClickable(troubleshootingContent);
                
                troubleshootingBox.appendChild(troubleshootingHeader);
                troubleshootingBox.appendChild(troubleshootingText);
                errorDetails.appendChild(troubleshootingBox);
              }
              
              // Enhanced dismiss button
              const dismissButton = document.createElement('button');
              dismissButton.textContent = 'Dismiss Error';
              dismissButton.style.cssText = `
                margin-top: 16px;
                background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                color: #f9fafb;
                border: 1px solid #6b7280;
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 12px;
          font-weight: 500;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: inherit;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              `;
              
              dismissButton.addEventListener('mouseover', () => {
                dismissButton.style.background = 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)';
                dismissButton.style.transform = 'translateY(-1px)';
                dismissButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        });
              dismissButton.addEventListener('mouseout', () => {
                dismissButton.style.background = 'linear-gradient(135deg, #374151 0%, #4b5563 100%)';
                dismissButton.style.transform = 'translateY(0px)';
                dismissButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
        
              dismissButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeError(updatedError.id);
        });
        
              errorDetails.appendChild(dismissButton);
              errorItem.appendChild(errorDetails);
            } else if (!updatedError.expanded && errorDetails) {
              // Remove error details if collapsed with animation
              errorDetails.style.animation = 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        
              // Add slide up animation if not exists
              if (!document.querySelector('#error-slideup-styles')) {
                const style = document.createElement('style');
                style.id = 'error-slideup-styles';
                style.textContent = `
                  @keyframes slideUp {
                    from {
                      opacity: 1;
                      max-height: 500px;
                      padding-top: 20px;
                      padding-bottom: 20px;
                    }
                    to {
                      opacity: 0;
                      max-height: 0;
                      padding-top: 0;
                      padding-bottom: 0;
                    }
                  }
                `;
                document.head.appendChild(style);
              }
              
              setTimeout(() => {
                if (errorDetails && errorDetails.parentNode) {
                  errorDetails.remove();
                }
              }, 300);
            }
          }
        });
        
        errorItem.appendChild(errorHeader);
        
        errorList.appendChild(errorItem);
      });
      
      scrollableContent.appendChild(errorList);
      errorOverlay.appendChild(scrollableContent);
      
      // Create footer with actions
      const footer = document.createElement('div');
      footer.style.cssText = `
        padding: 16px 20px;
        background-color: #1a1626;
        border-top: 1px solid #2d1b69;
        border-radius: 0 0 16px 16px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        flex-shrink: 0;
      `;
      
      // Add minimize button
      const minimizeButton = document.createElement("button");
      minimizeButton.style.cssText = `
        background-color: #2d1b69;
        color: #e2e8f0;
        border: 1px solid #4c1d95;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      `;
      minimizeButton.textContent = "Minimize";
      
      minimizeButton.addEventListener('mouseover', () => {
        minimizeButton.style.background = '#4c1d95';
        minimizeButton.style.transform = 'translateY(-1px)';
        minimizeButton.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
      });
      minimizeButton.addEventListener('mouseout', () => {
        minimizeButton.style.background = '#2d1b69';
        minimizeButton.style.transform = 'translateY(0px)';
        minimizeButton.style.boxShadow = 'none';
      });
      
      minimizeButton.addEventListener('click', () => {
        this.minimizeErrorOverlay();
      });
      
      // Add dismiss all button in the footer
      const dismissAll = document.createElement('button');
      dismissAll.textContent = 'Clear All Errors';
      dismissAll.style.cssText = `
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        font-family: inherit;
      `;
      
      dismissAll.addEventListener('mouseover', () => {
        dismissAll.style.background = 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
        dismissAll.style.transform = 'translateY(-1px)';
        dismissAll.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
      });
      dismissAll.addEventListener('mouseout', () => {
        dismissAll.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
        dismissAll.style.transform = 'translateY(0px)';
        dismissAll.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
      });
      
      dismissAll.addEventListener('click', () => {
        this.clearErrors();
      });
      
      // Add both buttons to footer
      footer.appendChild(minimizeButton);
      footer.appendChild(dismissAll);
      errorOverlay.appendChild(footer);
      
      // Show the error container with animation
      errorContainer.style.display = 'flex';
      // Trigger a reflow to ensure the transition works
      void errorContainer.offsetWidth;
      errorContainer.style.opacity = '1';
      
      // Add animation class to error list
      const errorListElement = errorContainer.querySelector('.scrollable');
      if (errorListElement) {
        errorListElement.classList.add('error-list-animate-in');
      }
      
      // Add click-outside-to-close functionality
      errorContainer.addEventListener('click', (e) => {
        if (e.target === errorContainer) {
          // Clicked outside the modal
          errorContainer.style.opacity = '0';
          setTimeout(() => {
            errorContainer.style.display = 'none';
            // Show the floating button again - ensure it's visible
            const errorButton = document.getElementById('0x1-error-button');
            if (errorButton && this.errors.length > 0) {
              errorButton.style.display = 'flex';
            } else if (this.errors.length > 0) {
              // Create the floating button if it doesn't exist
              this.createFloatingButton();
            }
          }, 300);
        }
      });
      
      // Prevent clicks inside the modal from closing it
      errorOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    },
    
    // Add new method for minimizing the error overlay
    minimizeErrorOverlay() {
      const errorContainer = document.getElementById('0x1-error-container');
      if (errorContainer) {
        errorContainer.style.opacity = '0';
        setTimeout(() => {
          errorContainer.style.display = 'none';
          // Show the floating button again
          this.createFloatingButton();
        }, 300);
      }
    }
  };
  
  // Install global error handler for ALL console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // SSE Error deduplication - track recent SSE errors to prevent spam
  const sseErrorTracker = new Map();
  const SSE_DEDUPE_WINDOW = 30000; // 30 seconds (longer window)
  
  // Global SSE error prevention - tracks if we've already added an SSE error recently
  let lastSSEErrorTime = 0;
  const SSE_ERROR_COOLDOWN = 60000; // 1 minute between SSE errors in error boundary (much longer)
  let totalSSEErrorsSuppressed = 0; // Track how many we've suppressed
  
  function shouldSuppressSSEError(message) {
    const ssePatterns = [
      'SSE connection error',
      'Live reload',
      '__0x1_live_reload',
      'EventSource',
      'live_reload',
      'connection error',
      'ERR_INCOMPLETE_CHUNKED_ENCODING',
      'net::ERR_',
      'chunked encoding',
      'ERR_NETWORK_CHANGED',
      'ERR_INTERNET_DISCONNECTED'
    ];
    
    // Check if this is an SSE-related error
    const isSSEError = ssePatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (!isSSEError) return false;
    
    // Create fingerprint for this SSE error
    const fingerprint = 'SSE_CONNECTION_ERROR';
    const now = Date.now();
    
    // Check if we've seen this error recently
    if (sseErrorTracker.has(fingerprint)) {
      const lastSeen = sseErrorTracker.get(fingerprint);
      if (now - lastSeen < SSE_DEDUPE_WINDOW) {
        // Update timestamp but suppress output completely
        sseErrorTracker.set(fingerprint, now);
        totalSSEErrorsSuppressed++;
        
        // Log a summary every 100 suppressed errors
        if (totalSSEErrorsSuppressed % 100 === 0) {
          console.warn(`[0x1] Suppressed ${totalSSEErrorsSuppressed} duplicate SSE connection errors`);
        }
        
        return true; // Suppress this error completely
      }
    }
    
    // Allow this error and update tracker
    sseErrorTracker.set(fingerprint, now);
    
    // Clean up old entries
    const cutoff = now - SSE_DEDUPE_WINDOW;
    for (const [key, timestamp] of sseErrorTracker.entries()) {
      if (timestamp < cutoff) {
        sseErrorTracker.delete(key);
      }
    }
    
    return false; // Don't suppress
  }
  
  // Global function to check if we should add SSE error to boundary
  function shouldAddSSEErrorToBoundary() {
    const now = Date.now();
    if (now - lastSSEErrorTime < SSE_ERROR_COOLDOWN) {
      return false; // Too soon since last SSE error in boundary
    }
    lastSSEErrorTime = now;
    return true;
  }
  
  // Override console.error with SSE deduplication
  console.error = function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    
    // Check if this is an SSE error that should be suppressed
    if (shouldSuppressSSEError(message)) {
      // Only add ONE SSE error to the boundary during the cooldown period
      if (shouldAddSSEErrorToBoundary()) {
        window.__0x1_errorBoundary.addError(
          new Error('Development server connection issues - requires immediate fix'),
          'Development Server'
        );
      }
      return; // Don't call original console.error - completely suppress console output
    }
    
    // Call original console.error for non-SSE errors
    originalConsoleError.apply(console, args);
    
    // Parse and add to error boundary with enhanced stack trace capture
    processConsoleMessage('error', args);
  };
  
  // Override console.warn with SSE deduplication
  console.warn = function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    
    // Check if this is an SSE error that should be suppressed
    if (shouldSuppressSSEError(message)) {
      // Only add ONE SSE error to the boundary during the cooldown period
      if (shouldAddSSEErrorToBoundary()) {
        window.__0x1_errorBoundary.addError(
          new Error('Development server connection issues - requires immediate fix'),
          'Development Server'
        );
      }
      return; // Don't call original console.warn - completely suppress console output
    }
    
    // Call original console.warn for non-SSE errors
    originalConsoleWarn.apply(console, args);
    
    // Process non-SSE warnings normally
    processConsoleMessage('warn', args);
  };
  
  // Override console.log with SSE deduplication
  console.log = function(...args) {
    const message = args.map(arg => String(arg)).join(' ');
    
    // Check if this is an SSE error that should be suppressed
    if (shouldSuppressSSEError(message)) {
      // Suppress console output completely for SSE errors in console.log too
      return; // Don't call original console.log
    }
    
    // Call original console.log for non-SSE errors
    originalConsoleLog.apply(console, args);
    
    // No need to process console.log for error boundary normally
  };
  
  // Function to process console messages with deduplication
  function processConsoleMessage(type, args) {
    // Parse and add to error boundary with enhanced stack trace capture
    let errorMessage = '';
    let actualError = null;
    let enhancedStack = '';
    
    // Build the error message from all arguments
    errorMessage = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      return String(arg);
    }).join(' ');
    
    // FIRST: Check if this is an SSE error and handle with global deduplication
    if (shouldSuppressSSEError(errorMessage)) {
      // Only add ONE SSE error to the boundary during the cooldown period
      if (shouldAddSSEErrorToBoundary()) {
        window.__0x1_errorBoundary.addError(
          new Error('Development server connection issues - requires immediate fix'),
          'Development Server'
        );
      }
      return; // Don't process further
    }
    
    // Find the actual Error object in the arguments
    for (let i = 0; i < args.length; i++) {
      if (args[i] instanceof Error) {
        actualError = args[i];
        break;
      }
    }
    
    // Extract component name and error type from the message
    let componentName = 'Unknown Component';
    let errorType = 'error';
    let file = '';
    let fullMessage = errorMessage;
    
    // Parse different error message patterns with improved logic
    if (errorMessage.includes('Failed to load component:')) {
      const componentMatch = errorMessage.match(/Failed to load component: ([^\s]+)/);
      if (componentMatch) {
        file = componentMatch[1];
        componentName = file;
      }
      errorType = 'component';
      
      // Extract the actual error after the component path
      const errorAfterComponent = errorMessage.split('Failed to load component: ')[1];
      if (errorAfterComponent) {
        const parts = errorAfterComponent.split(' ');
        if (parts.length > 1) {
          // Skip the file path and get the actual error
          fullMessage = parts.slice(1).join(' ');
        }
      }
    } else if (errorMessage.includes('Failed to load route:')) {
      const routeMatch = errorMessage.match(/Failed to load route: ([^\s]+)/);
      if (routeMatch) {
        file = routeMatch[1];
        componentName = `Route ${file}`;
      }
      errorType = 'route';
      
      // Extract the actual error after the route path
      const errorAfterRoute = errorMessage.split('Failed to load route: ')[1];
      if (errorAfterRoute) {
        const parts = errorAfterRoute.split(' ');
        if (parts.length > 1) {
          fullMessage = parts.slice(1).join(' ');
        }
      }
    } else if (errorMessage.includes('Component') && errorMessage.includes('not found in DOM')) {
      // Handle hook system component errors like "[0x1 Hooks] Component CryptoHeader_31e not found in DOM"
      console.log('🐛 [Error Boundary] Trying to extract component name from:', errorMessage);
      
      // Try multiple regex patterns to catch different formats
      let componentMatch = errorMessage.match(/Component ([A-Za-z][A-Za-z0-9]*?)_[A-Za-z0-9]+ not found in DOM/);
      if (!componentMatch) {
        // Try a simpler pattern
        componentMatch = errorMessage.match(/Component ([A-Za-z][A-Za-z0-9]*?)_/);
      }
      if (!componentMatch) {
        // Try even simpler - just get component name after "Component "
        componentMatch = errorMessage.match(/Component ([A-Za-z][A-Za-z0-9]*)/);
      }
      
      if (componentMatch) {
        componentName = componentMatch[1]; // Extract "CryptoHeader" from "CryptoHeader_31e"
        errorType = 'component';
        console.log('🐛 [Error Boundary] Successfully extracted componentName:', componentName, 'using match:', componentMatch[0]);
        // KEEP the original full message - don't replace it!
        // fullMessage stays as the original errorMessage
      } else {
        console.log('🐛 [Error Boundary] Failed to extract component name from:', errorMessage);
      }
    } else if (errorMessage.includes('SyntaxError')) {
      errorType = 'syntax';
      
      // Extract file from the error message better
      let fileMatch = errorMessage.match(/\/[^/\s]+\.(js|tsx|ts|jsx)/);
      if (!fileMatch) {
        // Try to find component in the prefix
        const componentMatch = errorMessage.match(/component: ([^\s]+)/);
        if (componentMatch) {
          file = componentMatch[1];
        }
      } else {
        file = fileMatch[0];
      }
      
      if (file) {
        componentName = file;
      }
      
      // For syntax errors, try to get the core error message
      const syntaxMatch = errorMessage.match(/SyntaxError: (.+?)(?:\s+\(at|$)/);
      if (syntaxMatch) {
        fullMessage = `SyntaxError: ${syntaxMatch[1]}`;
      }
    } else if (errorMessage.includes('hooks system not initialized') || errorMessage.includes('Hook called outside')) {
      // Handle general hook errors
      errorType = 'component';
      componentName = 'Hook System';
      
      // Try to extract component name from context if available
      const hookComponentMatch = errorMessage.match(/in component ([A-Za-z]+)/);
      if (hookComponentMatch) {
        componentName = hookComponentMatch[1];
      }
    }
    
    // ENHANCED stack trace building - capture everything available
    if (actualError && actualError.stack) {
      // Use the actual Error object's stack if available
      enhancedStack = actualError.stack;
    } else {
      // Build a comprehensive stack from available information
      enhancedStack = fullMessage;
      
      // Try to get the current call stack
      try {
        throw new Error('Stack trace capture');
      } catch (e) {
        if (e.stack) {
          const stackLines = e.stack.split('\n');
          // Skip the first few lines which are from this error boundary code
          const relevantStack = stackLines.slice(4).join('\n');
          if (relevantStack.trim()) {
            enhancedStack += '\n\nCall Stack:' + relevantStack;
          }
        }
      }
      
      // Extract and preserve location information like '(at useSyncExternalStoreWithTracked.js:4:10)'
      const locationMatches = errorMessage.match(/\(at [^)]+\)/g);
      if (locationMatches) {
        enhancedStack += '\n\nLocation Information:';
        locationMatches.forEach(location => {
          enhancedStack += `\n    ${location.replace(/^\(|\)$/g, '')}`;
        });
      }
      
      // Also try to find console.error @ stack info
      const consoleErrorMatch = errorMessage.match(/console\.error\s*@\s*([^\s]+)/);
      if (consoleErrorMatch) {
        enhancedStack += `\n    at console.error (${consoleErrorMatch[1]})`;
      }
      
      // Look for any file paths and line numbers in the message
      const filePathMatches = errorMessage.match(/[a-zA-Z0-9_-]+\.(js|ts|tsx|jsx):\d+:\d+/g);
      if (filePathMatches) {
        enhancedStack += '\n\nFile References:';
        filePathMatches.forEach(fileInfo => {
          if (!enhancedStack.includes(fileInfo)) {
            enhancedStack += `\n    at ${fileInfo}`;
          }
        });
      }
    }

    // NEW: Use the comprehensive error tips system
    const errorTips = getErrorTips(fullMessage, errorType, componentName);
    
    // Build enhanced troubleshooting information
    if (errorTips.tips.length > 0 || errorTips.context.length > 0 || errorTips.quickFixes.length > 0) {
      enhancedStack += '\n\n=== TROUBLESHOOTING GUIDE ===';
      
      if (errorTips.category) {
        enhancedStack += `\n🏷️  Error Type: ${errorTips.category}`;
      }
      
      if (errorTips.context.length > 0) {
        enhancedStack += '\n\n💡 What Happened:';
        errorTips.context.forEach(item => {
          enhancedStack += `\n   ${item}`;
        });
      }
      
      if (errorTips.quickFixes.length > 0) {
        enhancedStack += '\n\n⚡ Quick Fixes:';
        errorTips.quickFixes.forEach(item => {
          enhancedStack += `\n   • ${item}`;
        });
      }
      
      if (errorTips.tips.length > 0) {
        enhancedStack += '\n\n🔧 More Solutions:';
        errorTips.tips.forEach(item => {
          enhancedStack += `\n   • ${item}`;
        });
      }
      
      enhancedStack += '\n\n💬 Still stuck? Ask for help in the 0x1 community or check the docs.';
    }

    window.__0x1_errorBoundary.addError({
      message: fullMessage, // Use the parsed message, not truncated
      componentName: componentName,
      file: file,
      type: errorType,
      stack: enhancedStack, // Enhanced stack with all available information
      timestamp: new Date(),
      originalMessage: errorMessage, // Preserve original for debugging
      actualError: actualError // Store the actual Error object for additional debugging
    });
    
    console.log('🐛 [Error Boundary] Created error object with:', {
      componentName: componentName,
      file: file,
      type: errorType,
      message: fullMessage
    });
  }
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    window.__0x1_errorBoundary.addError(event.reason || new Error('Unhandled Promise Rejection'));
  });
  
  // Catch runtime errors
  window.addEventListener('error', (event) => {
    window.__0x1_errorBoundary.addError(event.error || new Error(event.message));
  });
})();

// Add error boundary API for 0x1/JSX components to the global scope for browser usage
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

// Function to convert URLs in text to clickable links
function makeLinksClickable(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Enhanced URL regex that matches file paths, HTTP URLs, and localhost URLs
  const urlRegex = /(https?:\/\/[^\s<>"]+|localhost:\d+[^\s<>"]*|\/[^\s<>"]*\.(js|ts|tsx|jsx|css|html)[^\s<>"]*|file:\/\/[^\s<>"]+)/gi;
  
  return text.replace(urlRegex, (url) => {
    // Clean up the URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[.,;:!?]+$/, '');
    const trailingPunc = url.slice(cleanUrl.length);
    
    // Determine link color and style based on URL type
    let linkStyle = 'color: #60a5fa; text-decoration: underline; cursor: pointer;';
    let title = cleanUrl;
    
    if (cleanUrl.includes('localhost:')) {
      linkStyle = 'color: #34d399; text-decoration: underline; cursor: pointer;';
      title = 'Open in browser: ' + cleanUrl;
    } else if (cleanUrl.startsWith('/') && (cleanUrl.includes('.js') || cleanUrl.includes('.ts'))) {
      linkStyle = 'color: #fbbf24; text-decoration: underline; cursor: pointer;';
      title = 'File path: ' + cleanUrl;
    } else if (cleanUrl.startsWith('file://')) {
      linkStyle = 'color: #a78bfa; text-decoration: underline; cursor: pointer;';
      title = 'Local file: ' + cleanUrl;
    }
    
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}" title="${title}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">${cleanUrl}</a>${trailingPunc}`;
  });
}

// Comprehensive Error Tips System - focused on end users building apps
if (typeof window.ERROR_TIPS_DATABASE === 'undefined') {
  window.ERROR_TIPS_DATABASE = {
    // Dynamic Import Errors
    'dynamic_import_failed': {
      patterns: [
        'Failed to fetch dynamically imported module',
        'Failed to load component:',
        'Failed to load route:',
        'dynamically imported module'
      ],
      category: 'Component Loading',
      tips: [
        'Check that your component file exists in the correct folder',
        'Make sure your component exports a default function',
        'Verify there are no syntax errors in your component file',
        'Check the file path matches your import statement exactly'
      ],
      context: [
        'Your component couldn\'t be loaded, likely due to a missing or broken file'
      ],
      quickFixes: [
        'Refresh the page to retry',
        'Check your component file exists',
        'Make sure you have: `export default function MyComponent() { ... }`'
      ]
    },

    // Network/Fetch Errors
    'network_fetch_error': {
      patterns: [
        'Failed to fetch',
        'NetworkError',
        'ERR_NETWORK',
        'ERR_INTERNET_DISCONNECTED',
        'net::ERR_'
      ],
      category: 'Connection Issue',
      tips: [
        'Check your internet connection',
        'Make sure your development server is still running',
        'Try refreshing the page',
        'If calling an API, check the API endpoint is working'
      ],
      context: [
        'Something couldn\'t connect to the internet or your development server'
      ],
      quickFixes: [
        'Refresh your browser',
        'Check your internet connection',
        'Restart your dev server if it stopped'
      ]
    },

    // Syntax Errors
    'syntax_error': {
      patterns: [
        'SyntaxError',
        'Unexpected token',
        'Unexpected identifier',
        'Unexpected end of input',
        'Invalid or unexpected token'
      ],
      category: 'Code Syntax',
      tips: [
        'Look for missing commas, brackets, or semicolons in your code',
        'Check that all your JSX tags are properly closed',
        'Make sure strings are properly quoted',
        'Verify your import and export statements are correct'
      ],
      context: [
        'There\'s a typo or syntax error in your JavaScript/TypeScript code'
      ],
      quickFixes: [
        'Check the line number mentioned in the error',
        'Look for missing closing brackets: }, ], )',
        'Make sure JSX elements are closed: <div></div>'
      ]
    },

    // SSE/Live Reload Errors
    'sse_connection': {
      patterns: [
        'SSE connection error',
        'EventSource',
        'ERR_INCOMPLETE_CHUNKED_ENCODING',
        'live_reload',
        '__0x1_live_reload',
        'ERR_NETWORK_CHANGED',
        'ERR_INTERNET_DISCONNECTED'
      ],
      category: 'Development Server Critical Issue',
      tips: [
        'STOP: This error indicates a serious development server problem that must be fixed',
        'Restart your development server immediately (Ctrl+C then start again)',
        'Check that your dev server is running without errors in the terminal',
        'If errors persist, there may be a port conflict or server configuration issue',
        'This prevents live reload from working properly during development'
      ],
      context: [
        'Your development server has a critical connection problem',
        'This error breaks the live reload system and must be resolved',
        'These errors are NOT normal during development - they indicate server issues'
      ],
      quickFixes: [
        'Stop your dev server (Ctrl+C) and restart it',
        'Check terminal for server startup errors',
        'Try a different port if there are conflicts',
        'Refresh browser after server restart'
      ]
    },

    // Component/Hook Errors
    'component_error': {
      patterns: [
        'Component .* not found in DOM',
        'Hook called outside of component',
        'useState not available',
        'hooks system not initialized',
        'not found in DOM - may have been unmounted',
        '\\[0x1 Hooks\\]'
      ],
      category: '0x1 Hooks',
      tips: [
        'Make sure you\'re calling hooks inside 0x1 components only',
        'Check that your component is properly mounted',
        'Don\'t call hooks inside loops, conditions, or nested functions',
        'Hooks must be at the top level of your component function'
      ],
      context: [
        'There\'s an issue with how 0x1 hooks are being used in your component'
      ],
      quickFixes: [
        'Move hook calls to the top of your component function',
        'Make sure hooks are inside an 0x1 component',
        'Refresh the page to reset the component state'
      ]
    },

    // TypeScript Errors
    'typescript_error': {
      patterns: [
        'TS\\d+:',
        'Type .* is not assignable',
        'Property .* does not exist',
        'Cannot find module',
        'has no exported member'
      ],
      category: 'TypeScript',
      tips: [
        'Check that your types match what you\'re trying to use',
        'Make sure you\'re importing the right things from the right files',
        'Add type annotations to your variables and functions',
        'Check that all required properties are provided to components'
      ],
      context: [
        'TypeScript found a type mismatch in your code'
      ],
      quickFixes: [
        'Add proper types to your variables',
        'Check your import statements',
        'Fix the type mismatch mentioned in the error'
      ]
    },

    // Generic JavaScript Errors
    'runtime_error': {
      patterns: [
        'TypeError',
        'ReferenceError',
        'Cannot read property',
        'Cannot read properties of undefined',
        'is not a function',
        'is not defined'
      ],
      category: 'Runtime Error',
      tips: [
        'Check that variables exist before using them',
        'Make sure objects have the properties you\'re trying to access',
        'Use optional chaining (?.) for safe property access',
        'Initialize your variables before using them'
      ],
      context: [
        'Your code tried to use something that doesn\'t exist or isn\'t ready yet'
      ],
      quickFixes: [
        'Add safety checks: `if (myVariable) { ... }`',
        'Use optional chaining: `myObject?.property`',
        'Make sure variables are defined before use'
      ]
    }
  };
}

// Function to find matching error tips
function getErrorTips(errorMessage, errorType = '', componentName = '') {
  const fullContext = `${errorMessage} ${errorType} ${componentName}`.toLowerCase();
  
  for (const [tipKey, tipData] of Object.entries(window.ERROR_TIPS_DATABASE)) {
    // Check if any pattern matches the error
    const hasMatch = tipData.patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(fullContext);
      } catch (e) {
        // Fallback to simple string includes if regex fails
        return fullContext.includes(pattern.toLowerCase());
      }
    });
    
    if (hasMatch) {
      return {
        ...tipData,
        tipKey
      };
    }
  }
  
  // Return generic tips if no specific match found
  return {
    category: 'General',
    tips: [
      'Check the browser console for additional error details',
      'Look at the stack trace for the exact location of the error',
      'Try refreshing the page to see if the error persists',
      'Check for recent code changes that might have caused this issue'
    ],
    context: [
      'This is a general error that doesn\'t match specific patterns',
      'Review the error message and stack trace for more details'
    ],
    quickFixes: [
      'Refresh the page',
      'Check the browser console for more information',
      'Revert recent changes to isolate the issue'
    ]
  };
}
