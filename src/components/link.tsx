/**
 * 0x1 Link Component
 * 
 * Next.js-compatible Link component for client-side navigation
 * This allows easy migration from Next.js to 0x1
 */

import type { JSXChildren, JSXElement } from '../jsx-runtime.js';

// Define the base LinkProps interface to match Next.js Link component API
export interface LinkProps {
  href: string;
  className?: string;
  children?: JSXChildren;
  target?: string;
  rel?: string;
  onClick?: (e: MouseEvent) => void;
}

// Allow additional props through intersection with Record
type LinkPropsWithExtras = LinkProps & Record<string, any>;

/**
 * Next.js-compatible Link component for 0x1
 * FIXED: Now properly handles children in 0x1 JSX runtime
 */
function Link(props: LinkPropsWithExtras): JSXElement {
  const { href, children, className = '', target, rel, onClick, ...otherProps } = props;
  
  // CRITICAL FIX: Properly process children for 0x1 JSX runtime
  // Handle different children types: string, number, JSX elements, arrays
  const processedChildren = (() => {
    if (children === undefined || children === null) return [];
    if (typeof children === 'string' || typeof children === 'number') return [children];
    if (Array.isArray(children)) return children;
    return [children];
  })();
  
  // Use 0x1 JSX runtime structure with properly processed children
  return {
    type: 'a',
    props: {
      href,
      className,
      target,
      rel,
      ...otherProps,
      onClick: (e: MouseEvent) => {
        // Only handle internal links for SPA navigation
        if (href.startsWith('/') && !target) {
          e.preventDefault();
          // Use the correct router instance created in dev.html template
          if (typeof window !== 'undefined' && (window as any).__0x1_ROUTER__) {
            (window as any).__0x1_ROUTER__.navigate(href);
          } else if (typeof window !== 'undefined' && (window as any).router) {
            (window as any).router.navigate(href);
          } else {
            // Fallback to history API navigation
            window.history.pushState(null, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
        // Call original onClick if provided
        if (onClick) {
          onClick(e);
        }
      }
    },
    children: processedChildren,
    key: null
  };
}

// Add a preload method to the Link component for API compatibility
Link.preload = (href: string): void => {
  // Implementation of preload logic
  const router = (window as any).__0x1_ROUTER__;
  if (router && router.preload) {
    router.preload(href);
  }
};

export default Link;
