/**
 * Container Component - A responsive layout container with max-width and centering
 * Part of @0x1js/components
 */

import { JSX, type JSXNode } from '0x1';

export interface ContainerProps {
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: Record<string, string | number>;
  /** Content to display inside the container */
  children: JSX.Element | JSX.Element[] | JSXNode | string;
  /** Container size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding on x-axis */
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Padding on y-axis */
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to center the container */
  centered?: boolean;
  /** HTML element type */
  as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer';
  /** Test ID for testing */
  'data-testid'?: string;
}

export const Container = ({
  children,
  size = 'lg',
  paddingX = 'md',
  paddingY = 'none',
  centered = true,
  className = '',
  style = {},
  as: Element = 'div',
  'data-testid': testId,
  ...props
}: ContainerProps) => {
    const baseClasses = [
      'container',
      `container--${size}`,
      `container--px-${paddingX}`,
      `container--py-${paddingY}`,
      centered && 'container--centered',
      className
    ].filter(Boolean).join(' ');

    return (
      <Element
        className={baseClasses}
        style={{
          ...getContainerStyles(size, paddingX, paddingY, centered),
          ...style
        }}
        data-testid={testId}
        {...props}
      >
        {children}
      </Element>
    );
  };

function getContainerStyles(
  size: string, 
  paddingX: string, 
  paddingY: string, 
  centered: boolean
): Record<string, string | number> {
  const sizeMap = {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%'
  };

  const paddingXMap = {
    none: '0',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  };

  const paddingYMap = {
    none: '0',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  };

  const styles: Record<string, string | number> = {
    width: '100%',
    maxWidth: sizeMap[size as keyof typeof sizeMap] || sizeMap.lg,
    paddingLeft: paddingXMap[paddingX as keyof typeof paddingXMap] || paddingXMap.md,
    paddingRight: paddingXMap[paddingX as keyof typeof paddingXMap] || paddingXMap.md,
    paddingTop: paddingYMap[paddingY as keyof typeof paddingYMap] || paddingYMap.none,
    paddingBottom: paddingYMap[paddingY as keyof typeof paddingYMap] || paddingYMap.none,
  };

  if (centered) {
    styles.marginLeft = 'auto';
    styles.marginRight = 'auto';
  }

  return styles;
}

// Export for convenience
export default Container;
