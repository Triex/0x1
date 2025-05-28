/**
 * 0x1 Link Component Type Definitions
 */

export interface LinkProps {
  href: string;
  className?: string;
  children?: any;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  [key: string]: any;
}

export default function Link(props: LinkProps): any; 