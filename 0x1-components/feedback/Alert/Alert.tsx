/**
 * Alert Component - Contextual feedback messages for user actions
 * Part of @0x1js/components
 */

import { JSX } from '0x1';

export interface AlertProps {
  /** Alert message content */
  children: JSX.Element | JSX.Element[] | string;
  /** Alert variant/type */
  variant?: 'success' | 'error' | 'warning' | 'info';
  /** Alert size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether alert can be dismissed */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Optional title for the alert */
  title?: string;
  /** Whether to show icon */
  showIcon?: boolean;
  /** Custom icon (overrides default) */
  icon?: string | JSX.Element;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: Record<string, string | number>;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Alert({
  children,
  variant = 'info',
  size = 'md',
  dismissible = false,
  onDismiss,
  title,
  showIcon = true,
  icon,
  className = '',
  style = {},
  'data-testid': testId,
  ...props
}: AlertProps) {
  const baseClasses = [
    'alert',
    `alert--${variant}`,
    `alert--${size}`,
    dismissible && 'alert--dismissible',
    className
  ].filter(Boolean).join(' ');

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <div
      className={baseClasses}
      style={{
        ...getAlertStyles(variant, size),
        ...style
      }}
      data-testid={testId}
      role="alert"
      {...props}
    >
      <div className="alert-content" style={getContentStyles()}>
        {showIcon && (
          <div className="alert-icon" style={getIconStyles(variant)}>
            {icon || getDefaultIcon(variant)}
          </div>
        )}
        
        <div className="alert-body" style={getBodyStyles()}>
          {title && (
            <div className="alert-title" style={getTitleStyles(size)}>
              {title}
            </div>
          )}
          <div className="alert-message" style={getMessageStyles(size, !!title)}>
            {children}
          </div>
        </div>

        {dismissible && (
          <button
            className="alert-dismiss"
            style={getDismissStyles(variant)}
            onClick={handleDismiss}
            aria-label="Dismiss alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function getAlertStyles(variant: string, size: string): Record<string, string | number> {
  const variantStyles = {
    success: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      color: '#166534'
    },
    error: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      color: '#dc2626'
    },
    warning: {
      backgroundColor: '#fffbeb',
      borderColor: '#fed7aa',
      color: '#d97706'
    },
    info: {
      backgroundColor: '#eff6ff',
      borderColor: '#bfdbfe',
      color: '#2563eb'
    }
  };

  const sizeStyles = {
    sm: { padding: '0.75rem' },
    md: { padding: '1rem' },
    lg: { padding: '1.25rem' }
  };

  return {
    border: '1px solid',
    borderRadius: '0.5rem',
    ...variantStyles[variant as keyof typeof variantStyles],
    ...sizeStyles[size as keyof typeof sizeStyles]
  };
}

function getContentStyles(): Record<string, string | number> {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem'
  };
}

function getIconStyles(variant: string): Record<string, string | number> {
  const iconColors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  return {
    fontSize: '1.25rem',
    color: iconColors[variant as keyof typeof iconColors],
    flexShrink: 0,
    marginTop: '0.125rem'
  };
}

function getBodyStyles(): Record<string, string | number> {
  return {
    flex: 1,
    minWidth: 0
  };
}

function getTitleStyles(size: string): Record<string, string | number> {
  const fontSize = {
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem'
  };

  return {
    fontWeight: '600',
    fontSize: fontSize[size as keyof typeof fontSize],
    marginBottom: '0.25rem'
  };
}

function getMessageStyles(size: string, hasTitle: boolean): Record<string, string | number> {
  const fontSize = {
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem'
  };

  return {
    fontSize: fontSize[size as keyof typeof fontSize],
    lineHeight: '1.5',
    ...(hasTitle && { marginTop: '0.25rem' })
  };
}

function getDismissStyles(variant: string): Record<string, string | number> {
  return {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    flexShrink: 0,
    marginTop: '-0.25rem',
    marginRight: '-0.25rem',
    ':hover': {
      opacity: 1
    }
  };
}

function getDefaultIcon(variant: string): string {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[variant as keyof typeof icons] || icons.info;
}

// Convenience components for specific alert types
export const SuccessAlert = (props: Omit<AlertProps, 'variant'>) => (
  <Alert variant="success" {...props} />
);

export const ErrorAlert = (props: Omit<AlertProps, 'variant'>) => (
  <Alert variant="error" {...props} />
);

export const WarningAlert = (props: Omit<AlertProps, 'variant'>) => (
  <Alert variant="warning" {...props} />
);

export const InfoAlert = (props: Omit<AlertProps, 'variant'>) => (
  <Alert variant="info" {...props} />
);

// Export for convenience
export default Alert;
