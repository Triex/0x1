/**
 * 0x1 Suspense
 * A lightweight system for handling async loading states
 */

/**
 * Options for suspense loading states
 */
export interface SuspenseOptions {
  fallback?: string | HTMLElement;
  errorFallback?: (error: Error) => string | HTMLElement;
  loadingDelay?: number; // ms before showing the loading state
}

/**
 * Default loading indicator
 */
const defaultLoadingIndicator = `
  <div class="0x1-loading">
    <div class="0x1-spinner"></div>
  </div>
`;

/**
 * Default error indicator
 */
const defaultErrorIndicator = (error: Error) => `
  <div class="0x1-error">
    <p>Error loading content</p>
    <p class="0x1-error-message">${error.message}</p>
  </div>
`;

/**
 * Creates a suspense boundary that handles async content loading
 */
export function createSuspenseBoundary(
  container: HTMLElement,
  options: SuspenseOptions = {}
): {
  showLoading: () => void;
  showContent: (content: string | HTMLElement) => void;
  showError: (error: Error) => void;
} {
  const loadingContent = options.fallback || defaultLoadingIndicator;
  const errorRenderer = options.errorFallback || defaultErrorIndicator;
  
  return {
    showLoading: () => {
      if (typeof loadingContent === 'string') {
        container.innerHTML = loadingContent;
      } else {
        container.innerHTML = '';
        container.appendChild(loadingContent);
      }
    },
    
    showContent: (content) => {
      if (typeof content === 'string') {
        container.innerHTML = content;
      } else {
        container.innerHTML = '';
        container.appendChild(content);
      }
    },
    
    showError: (error) => {
      const errorContent = errorRenderer(error);
      if (typeof errorContent === 'string') {
        container.innerHTML = errorContent;
      } else {
        container.innerHTML = '';
        container.appendChild(errorContent);
      }
    }
  };
}

/**
 * Suspense function for handling async data loading with proper loading states
 */
export async function suspense<T>(
  element: HTMLElement,
  promise: Promise<T>,
  renderer: (data: T) => string | HTMLElement,
  options: SuspenseOptions = {}
): Promise<void> {
  const boundary = createSuspenseBoundary(element, options);
  
  // Handle loading delay 
  if (options.loadingDelay && options.loadingDelay > 0) {
    const delay = new Promise<void>(resolve => setTimeout(() => {
      boundary.showLoading();
      resolve();
    }, options.loadingDelay));
    
    // Race the promise with the delay
    await Promise.race([promise.then(() => {}), delay]);
  } else {
    boundary.showLoading();
  }
  
  try {
    const data = await promise;
    const content = renderer(data);
    boundary.showContent(content);
  } catch (error) {
    boundary.showError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Creates a resource that can be loaded asynchronously once and reused
 */
export function createResource<T>(
  loader: () => Promise<T>
): {
  read: () => T | Promise<T>;
  preload: () => void;
  invalidate: () => void;
} {
  let resource: T | null = null;
  let error: Error | null = null;
  let promise: Promise<T> | null = null;
  
  const load = () => {
    if (promise === null) {
      promise = loader()
        .then((data) => {
          resource = data;
          return data;
        })
        .catch((e) => {
          error = e instanceof Error ? e : new Error(String(e));
          throw error;
        });
    }
    return promise;
  };
  
  return {
    read: () => {
      if (error) throw error;
      if (resource !== null) return resource;
      throw load();
    },
    preload: load,
    invalidate: () => {
      resource = null;
      error = null;
      promise = null;
    }
  };
}

/**
 * Create a suspense container for multi-part loading
 * Useful for loading multiple resources in parallel
 */
export function createSuspenseContainer(container: HTMLElement) {
  // Add CSS class for styling
  container.classList.add('0x1-suspense-container');
  
  // Create loading indicator
  const loadingElement = document.createElement('div');
  loadingElement.className = '0x1-suspense-loading';
  loadingElement.innerHTML = defaultLoadingIndicator;
  
  // Create content container
  const contentElement = document.createElement('div');
  contentElement.className = '0x1-suspense-content';
  
  // Create error container
  const errorElement = document.createElement('div');
  errorElement.className = '0x1-suspense-error';
  
  // Add elements to container
  container.appendChild(loadingElement);
  container.appendChild(contentElement);
  container.appendChild(errorElement);
  
  // Hide content and error initially
  contentElement.style.display = 'none';
  errorElement.style.display = 'none';
  
  return {
    loading: () => {
      loadingElement.style.display = '';
      contentElement.style.display = 'none';
      errorElement.style.display = 'none';
      return container;
    },
    
    content: (render: () => string | HTMLElement) => {
      try {
        const content = render();
        contentElement.innerHTML = '';
        
        if (typeof content === 'string') {
          contentElement.innerHTML = content;
        } else {
          contentElement.appendChild(content);
        }
        
        loadingElement.style.display = 'none';
        contentElement.style.display = '';
        errorElement.style.display = 'none';
      } catch (error) {
        // If rendering fails, show error
        const errorContent = String(error);
        errorElement.innerHTML = `<div class="0x1-error">
          <p>Error rendering content</p>
          <p class="0x1-error-message">${errorContent}</p>
        </div>`;
        
        loadingElement.style.display = 'none';
        contentElement.style.display = 'none';
        errorElement.style.display = '';
      }
      
      return container;
    },
    
    error: (error: Error) => {
      errorElement.innerHTML = defaultErrorIndicator(error);
      loadingElement.style.display = 'none';
      contentElement.style.display = 'none';
      errorElement.style.display = '';
      return container;
    }
  };
}
