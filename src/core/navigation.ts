/**
 * 0x1 Navigation System
 * Provides routing and page navigation components
 */

export interface NavigationComponent {
  render: (props?: any) => HTMLElement;
  onMount?: () => void;
  onUnmount?: () => void;
}

// Page interface for navigation (renamed to avoid conflicts with router Page)
export interface NavigationPage {
  render: (params?: any) => HTMLElement;
  onMount?: (element: HTMLElement, params?: any) => void;
  onUnmount?: (element: HTMLElement) => void;
}


/**
 * Link component for navigation
 */
export function Link(props: {
  to: string;
  children: Array<HTMLElement | string>;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  [key: string]: any;
}): HTMLElement {
  const { to, children, className = '', activeClassName = 'active', exact = false, ...rest } = props;
  
  // Create anchor element
  const a = document.createElement('a');
  a.href = to;
  
  // Set class name
  a.className = className;
  
  // Check if link should be active (matches current path)
  const currentPath = window.location.pathname;
  const isActive = exact
    ? currentPath === to
    : currentPath.startsWith(to) && (to !== '/' || currentPath === '/');
  
  if (isActive && activeClassName) {
    a.className = a.className
      ? `${a.className} ${activeClassName}`
      : activeClassName;
  }
  
  // Set other attributes
  Object.entries(rest).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      // Handle event listeners
      const eventName = key.substring(2).toLowerCase();
      a.addEventListener(eventName, value as EventListener);
    } else if (key === 'style' && typeof value === 'object') {
      // Handle style object
      Object.entries(value).forEach(([cssKey, cssValue]) => {
        (a.style as any)[cssKey] = cssValue;
      });
    } else if (value !== undefined && value !== null) {
      // Set attribute for everything else
      a.setAttribute(key, String(value));
    }
  });
  
  // Append children
  children.forEach(child => {
    if (typeof child === 'string') {
      a.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      a.appendChild(child);
    }
  });
  
  return a;
}

/**
 * NavLink component - Link that can automatically highlight when active
 */
export function NavLink(props: {
  to: string;
  children: Array<HTMLElement | string>;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  [key: string]: any;
}): HTMLElement {
  return Link({
    ...props,
    activeClassName: props.activeClassName || 'active',
  });
}

/**
 * Create a redirect component
 */
export function Redirect(props: { to: string }): NavigationComponent {
  return {
    render: () => {
      setTimeout(() => {
        // Get the current router if available
        const currentRouter = (window as any).__0x1_ROUTER__;
        
        if (currentRouter && typeof currentRouter.navigate === 'function') {
          currentRouter.navigate(props.to);
        } else {
          // Fallback to regular navigation
          if (props.to.startsWith('http') || props.to.startsWith('//')) {
            window.location.href = props.to;
          } else {
            window.location.pathname = props.to;
          }
        }
      }, 0);
      
      return document.createElement('div');
    }
  };
}
