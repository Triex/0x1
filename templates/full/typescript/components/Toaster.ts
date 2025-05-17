/**
 * Toaster component for displaying notifications
 */

export function Toaster(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-4 max-w-md';
  
  // Listen for toast events from the application
  window.addEventListener('app:toast', ((event: CustomEvent) => {
    const { message, type, timeout = 5000 } = event.detail;
    addToast(message, type, timeout);
  }) as EventListener);
  
  function addToast(message: string, type: 'info' | 'success' | 'warning' | 'error', timeout: number = 5000): void {
    const toast = document.createElement('div');
    
    // Set color based on notification type
    const colorClasses = {
      info: 'bg-blue-500 border-blue-600',
      success: 'bg-green-500 border-green-600',
      warning: 'bg-yellow-500 border-yellow-600',
      error: 'bg-red-500 border-red-600'
    };
    
    toast.className = `p-4 rounded-lg shadow-lg border-l-4 text-white flex items-start animate-fade-in ${colorClasses[type] || colorClasses.info}`;
    
    // Icon based on type
    const icons = {
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      success: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };
    
    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'flex items-start';
    content.innerHTML = icons[type] || icons.info;
    
    // Message text
    const text = document.createElement('div');
    text.textContent = message;
    text.className = 'flex-1';
    content.appendChild(text);
    
    toast.appendChild(content);
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-4 text-white hover:text-gray-200 focus:outline-none';
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeButton.onclick = () => removeToast(toast);
    toast.appendChild(closeButton);
    
    // Add to container
    container.appendChild(toast);
    
    // Auto-remove after timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(toast);
      }, timeout);
    }
  }
  
  function removeToast(toast: HTMLElement): void {
    // Add fade out animation
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 300);
  }
  
  return container;
}
