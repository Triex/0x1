/**
 * Toast Component - Lightweight, efficient toast notifications with auto-dismiss
 * Part of @0x1js/components
 */

import { useEffect, useState } from '0x1';

export interface ToastProps {
  /** Toast message content */
  message: string;
  /** Toast type/variant */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Whether toast is visible */
  visible?: boolean;
  /** Auto-dismiss duration in milliseconds (0 to disable) */
  duration?: number;
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Whether toast can be manually dismissed */
  dismissible?: boolean;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Additional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Toast({
  message,
  type = 'info',
  visible = true,
  duration = 4000,
  position = 'top-right',
  dismissible = true,
  onDismiss,
  action,
  className = '',
  'data-testid': testId,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(visible);
    if (visible) setIsExiting(false);
  }, [visible]);

  useEffect(() => {
    if (!isVisible || duration === 0) return;

    const timeout = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timeout);
  }, [isVisible, duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const baseClasses = [
    'toast',
    `toast--${type}`,
    `toast--${position}`,
    isExiting && 'toast--exiting',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={baseClasses}
      style={{
        ...getToastStyles(type, position, isExiting),
      }}
      data-testid={testId}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content" style={getContentStyles()}>
        <div className="toast-icon" style={getIconStyles(type)}>
          {getIcon(type)}
        </div>
        <div className="toast-message" style={getMessageStyles()}>
          {message}
        </div>
        {action && (
          <button
            className="toast-action"
            style={getActionStyles(type)}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
        {dismissible && (
          <button
            className="toast-dismiss"
            style={getDismissStyles()}
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Toast Manager for global toast notifications
class ToastManager {
  private static instance: ToastManager;
  private toasts: Array<{ id: string; props: ToastProps }> = [];
  private listeners: Array<(toasts: typeof this.toasts) => void> = [];

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  show(props: Omit<ToastProps, 'visible' | 'onDismiss'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = {
      id,
      props: {
        ...props,
        visible: true,
        onDismiss: () => this.dismiss(id)
      }
    };
    
    this.toasts.push(toast);
    this.notify();
    
    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  subscribe(listener: (toasts: typeof this.toasts) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

// Convenience functions
export const toast = {
  success: (message: string, options?: Partial<ToastProps>) => 
    ToastManager.getInstance().show({ ...options, message, type: 'success' }),
  
  error: (message: string, options?: Partial<ToastProps>) => 
    ToastManager.getInstance().show({ ...options, message, type: 'error' }),
  
  warning: (message: string, options?: Partial<ToastProps>) => 
    ToastManager.getInstance().show({ ...options, message, type: 'warning' }),
  
  info: (message: string, options?: Partial<ToastProps>) => 
    ToastManager.getInstance().show({ ...options, message, type: 'info' }),
  
  dismiss: (id: string) => ToastManager.getInstance().dismiss(id),
  clear: () => ToastManager.getInstance().clear()
};

function getToastStyles(type: string, position: string, isExiting: boolean): Record<string, string | number> {
  const [vPos, hPos] = position.split('-') as [string, string];
  
  const baseStyles: Record<string, string | number> = {
    position: 'fixed',
    zIndex: 9999,
    minWidth: '300px',
    maxWidth: '500px',
    padding: '0',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transform: isExiting ? getExitTransform(position) : 'translateY(0) scale(1)',
    opacity: isExiting ? 0 : 1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'auto'
  };

  // Position
  if (vPos === 'top') {
    baseStyles.top = '1rem';
  } else {
    baseStyles.bottom = '1rem';
  }

  switch (hPos) {
    case 'left':
      baseStyles.left = '1rem';
      break;
    case 'right':
      baseStyles.right = '1rem';
      break;
    case 'center':
      baseStyles.left = '50%';
      baseStyles.transform = `translateX(-50%) ${baseStyles.transform}`;
      break;
  }

  // Type-specific styling
  const typeColors = {
    success: { bg: '#10b981', text: '#ffffff' },
    error: { bg: '#ef4444', text: '#ffffff' },
    warning: { bg: '#f59e0b', text: '#ffffff' },
    info: { bg: '#3b82f6', text: '#ffffff' }
  };

  const colors = typeColors[type as keyof typeof typeColors] || typeColors.info;
  
  return {
    ...baseStyles,
    backgroundColor: colors.bg,
    color: colors.text
  };
}

function getExitTransform(position: string): string {
  const [vPos, hPos] = position.split('-');
  
  if (vPos === 'top') {
    return 'translateY(-100%) scale(0.95)';
  } else {
    return 'translateY(100%) scale(0.95)';
  }
}

function getContentStyles(): Record<string, string | number> {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem'
  };
}

function getIconStyles(type: string): Record<string, string | number> {
  return {
    fontSize: '1.25rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem'
  };
}

function getMessageStyles(): Record<string, string | number> {
  return {
    flex: 1,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: '500'
  };
}

function getActionStyles(type: string): Record<string, string | number> {
  return {
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'inherit',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)'
    }
  };
}

function getDismissStyles(): Record<string, string | number> {
  return {
    padding: '0.25rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    color: 'inherit',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 1
    }
  };
}

function getIcon(type: string): string {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type as keyof typeof icons] || icons.info;
}

// Export for convenience
export default Toast;
