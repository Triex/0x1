/**
 * NavLink Component
 * A specialized link component that can highlight when active
 */

import { createElement } from '0x1';

export interface NavLinkProps {
  label: string;
  href: string;
  external?: boolean;
  className?: string;
  activeClassName?: string;
}

export function NavLink({ 
  label, 
  href, 
  external = false,
  className = '',
  activeClassName = 'text-blue-600' 
}: NavLinkProps): HTMLElement {
  const isActive = !external && window.location.pathname === href;
  
  const combinedClassName = isActive 
    ? `${className} ${activeClassName}`.trim() 
    : className;

  return createElement('li', {
    children: [
      createElement('a', {
        href,
        className: `hover:text-blue-600 transition-colors ${combinedClassName}`.trim(),
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        children: [label]
      })
    ]
  });
}
