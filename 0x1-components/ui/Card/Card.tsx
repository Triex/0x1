/**
 * Card Component - A flexible container with elevation and padding
 * Part of @0x1js/components
 */

import { JSX, type JSXNode } from '0x1';

export interface CardProps {
  /** Content to display inside the card */
  children: JSX.Element | JSX.Element[] | JSXNode | string;
  /** Card variant - affects styling */
  variant?: 'default' | 'outlined' | 'elevated' | 'glass';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Click handler for clickable cards */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: Record<string, string | number>;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  onClick,
  className = '',
  style = {},
  'data-testid': testId,
  ...props
}: CardProps) {
  const baseClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    clickable && 'card--clickable',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={baseClasses}
      style={{
        ...getCardStyles(variant, padding, clickable),
        ...style
      }}
      onClick={handleClick}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
}

function getCardStyles(variant: string, padding: string, clickable: boolean): Record<string, any> {
  const paddingMap = {
    none: '0',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  };

  // Define base styles common to all variants
  const baseStyles: Record<string, string | number> = {
    borderRadius: '0.5rem',
    padding: paddingMap[padding as keyof typeof paddingMap] || paddingMap.md,
    transition: 'all 0.2s ease-in-out'
  };

  if (clickable) {
    baseStyles.cursor = 'pointer';
  }
  
  // In 0x1, we can't use :hover directly in inline styles
  // Instead we'll apply hover styles through className

  // Add variant-specific styles
  let variantStyles: Record<string, any> = {};
  
  switch (variant) {
    case 'outlined':
      variantStyles = {
        border: '1px solid #e2e8f0',
        backgroundColor: 'transparent'
      };
      break;

    case 'elevated':
      variantStyles = {
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      };
      break;

    case 'glass':
      variantStyles = {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      };
      break;

    default: // 'default'
      variantStyles = {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0'
      };
      break;
  }
  
  // Combine base styles with variant-specific styles
  return {
    ...baseStyles,
    ...variantStyles
  };
}

// Export for convenience
export default Card;
