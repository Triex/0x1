/**
 * Toaster component for displaying notifications
 */

import { useEffect, useState } from '0x1';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timeout: number;
}

interface ToastEvent {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timeout?: number;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events from the application
    const handleToastEvent = (event: CustomEvent<ToastEvent>) => {
      const { message, type, timeout = 5000 } = event.detail;
      addToast(message, type, timeout);
    };

    window.addEventListener('app:toast', handleToastEvent as EventListener);
    
    return () => {
      window.removeEventListener('app:toast', handleToastEvent as EventListener);
    };
  }, []);

  const addToast = (message: string, type: Toast['type'], timeout: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type, timeout };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(id);
      }, timeout);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastStyles = (type: Toast['type']) => {
    const baseStyles = "p-4 rounded-lg shadow-lg border-l-4 text-white flex items-start animate-fade-in";
    const typeStyles = {
      info: 'bg-blue-500 border-blue-600',
      success: 'bg-green-500 border-green-600', 
      warning: 'bg-yellow-500 border-yellow-600',
      error: 'bg-red-500 border-red-600'
    };
    
    return `${baseStyles} ${typeStyles[type]}`;
  };

  const getIcon = (type: Toast['type']) => {
    const iconProps = {
      width: "24",
      height: "24", 
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      className: "mr-2"
    };

    switch (type) {
      case 'info':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
      case 'success':
        return (
          <svg {...iconProps}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'error':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-4 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          style={{
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <div className="flex items-start">
            {getIcon(toast.type)}
            <div className="flex-1">
              {toast.message}
            </div>
          </div>
          
          <button
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper function to trigger toast notifications from anywhere in the app
export const toast = {
  info: (message: string, timeout?: number) => {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { message, type: 'info', timeout }
    }));
  },
  success: (message: string, timeout?: number) => {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { message, type: 'success', timeout }
    }));
  },
  warning: (message: string, timeout?: number) => {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { message, type: 'warning', timeout }
    }));
  },
  error: (message: string, timeout?: number) => {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { message, type: 'error', timeout }
    }));
  }
};
