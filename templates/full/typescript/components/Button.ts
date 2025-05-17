/**
 * Reusable Button component for 0x1 applications
 */
import { html } from '0x1';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export function Button({
  text,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  size = 'md',
  icon
}: ButtonProps) {
  // Determine class names based on variant
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-blue-600 hover:bg-blue-700 text-white';
      break;
    case 'secondary':
      variantClasses = 'bg-gray-600 hover:bg-gray-700 text-white';
      break;
    case 'outline':
      variantClasses = 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600';
      break;
    case 'danger':
      variantClasses = 'bg-red-600 hover:bg-red-700 text-white';
      break;
  }
  
  // Determine size classes
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'py-1 px-3 text-sm';
      break;
    case 'md':
      sizeClasses = 'py-2 px-4';
      break;
    case 'lg':
      sizeClasses = 'py-3 px-6 text-lg';
      break;
  }
  
  // Handle fullWidth
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Handle disabled state
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md';
  
  return html`
    <button
      type="${type}"
      class="${variantClasses} ${sizeClasses} ${widthClasses} ${disabledClasses} rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onclick="${onClick || ''}"
      ${disabled ? 'disabled' : ''}
    >
      ${icon ? html`<span class="mr-2">${icon}</span>` : ''}
      ${text}
    </button>
  `;
}
