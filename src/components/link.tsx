/**
 * 0x1 Link Component
 * 
 * Next.js-compatible Link component for client-side navigation
 * This allows easy migration from Next.js to 0x1
 */

import type { JSXChildren } from '../jsx-runtime.js';

// Define the LinkProps interface to match Next.js Link component API
export interface LinkProps {
  href: string;
  className?: string;
  children?: JSXChildren;
  target?: string;
  rel?: string;
  [key: string]: any;
}

/**
 * Next.js-compatible Link component for 0x1
 * This is a JSX function component that returns JSX.Element
 */
export default function Link(props: LinkProps): JSX.Element {
  const { href, children, className = '', target, rel, ...otherProps } = props;
  
  // Create JSX element instead of HTMLElement
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
          // Use router navigation if available
          if (typeof window !== 'undefined' && (window as any).router) {
            (window as any).router.navigate(href);
          } else {
            window.history.pushState(null, '', href);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
        // Call original onClick if provided
        if (otherProps.onClick) {
          otherProps.onClick(e);
        }
      }
    },
    children: Array.isArray(children) ? children : [children],
    key: null
  } as JSX.Element;
}

// Add a preload method to the Link component for API compatibility
Link.preload = (href: string): void => {
  // Implementation of preload logic
  const router = (window as any).__0x1_ROUTER__;
  if (router && router.preload) {
    router.preload(href);
  }
};
