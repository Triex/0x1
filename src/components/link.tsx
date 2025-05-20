/**
 * 0x1 Link Component
 * 
 * Next.js-compatible Link component for client-side navigation
 * This allows easy migration from Next.js to 0x1
 */

import { createElement } from '../jsx-runtime.js';

// Define the LinkProps interface to match Next.js Link component API
export interface LinkProps {
  href: string | { pathname: string; query?: Record<string, string> };
  as?: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
  children: any;
  className?: string;
  [key: string]: any; // Allow any other props to be passed through
}

/**
 * Next.js-compatible Link component for 0x1
 * 
 * Usage:
 * ```tsx
 * import Link from '0x1/link';
 * 
 * <Link href="/about">About</Link>
 * ```
 */
export default function Link({
  href,
  as,
  replace = false,
  scroll = true,
  prefetch = null,
  children,
  ...props
}: LinkProps) {
  // Normalize the href value
  let normalizedHref = '';
  if (typeof href === 'string') {
    normalizedHref = href;
  } else if (typeof href === 'object' && href.pathname) {
    normalizedHref = href.pathname;
    if (href.query) {
      const queryParams = new URLSearchParams();
      Object.entries(href.query).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      if (queryString) {
        normalizedHref += `?${queryString}`;
      }
    }
  }

  // Handle client-side navigation
  const handleClick = (e: any) => {
    if (
      e.defaultPrevented || // If default is already prevented, don't handle
      (e.button !== undefined && e.button !== 0) || // Only handle primary mouse button
      e.metaKey || 
      e.ctrlKey || 
      e.shiftKey || 
      e.altKey // Don't handle if modifier keys are pressed
    ) {
      return;
    }
    
    e.preventDefault();
    
    // Get the router from the window (set during router initialization)
    const router = (window as any).__0x1_ROUTER__;
    
    if (router) {
      // Use replace if specified
      if (replace) {
        if (router.replaceState) {
          router.replaceState(normalizedHref);
        } else {
          // Fallback to navigate if replaceState is not available
          router.navigate(normalizedHref);
        }
      } else {
        router.navigate(normalizedHref);
      }
      
      // Handle scroll behavior
      if (scroll) {
        window.scrollTo(0, 0);
      }
    } else {
      // Fallback to regular navigation if router is not available
      window.location.href = normalizedHref;
    }
  };

  // Create anchor element with all props passed through
  return createElement(
    'a',
    {
      href: normalizedHref,
      onClick: handleClick,
      ...props
    },
    children
  );
}

// Add a preload method to the Link component for API compatibility
Link.preload = (href: string): void => {
  // Implementation of preload logic
  const router = (window as any).__0x1_ROUTER__;
  if (router && router.preload) {
    router.preload(href);
  }
};
