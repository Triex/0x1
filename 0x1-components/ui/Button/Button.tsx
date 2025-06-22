/**
 * Button Component
 * A flexible, accessible button component with multiple variants
 */

import { JSX, type JSXNode } from '0x1';

// Define button variants and sizes with a type-safe approach
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonWidth = 'auto' | 'full';

export interface ButtonProps {
  /**
   * The visual style of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * The size of the button
   * @default 'md'
   */
  size?: ButtonSize;
  
  /**
   * Make the button take the full width of its container
   * @default 'auto'
   */
  width?: ButtonWidth;
  
  /**
   * Whether the button is in a loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Icon to display before button content
   */
  iconLeft?: JSXNode;
  
  /**
   * Icon to display after button content
   */
  iconRight?: JSXNode;
  
  /**
   * Content of the button
   */
  children: JSXNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Button type
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Whether button is disabled
   */
  disabled?: boolean;

  /**
   * Click handler
   */
  onClick?: (event: Event) => void;

  /**
   * Additional props
   */
  [key: string]: any;
}

/**
 * Button component with multiple variants and sizes
 */
export function Button({
  variant = 'primary',
  size = 'md',
  width = 'auto',
  isLoading = false,
  iconLeft,
  iconRight,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  // Base button styles
  let baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-blue-500';
  
  // Size-specific styles
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-6 py-3 h-12'
  };
  
  // Width-specific styles
  const widthStyles = {
    auto: 'w-auto',
    full: 'w-full'
  };
  
  // Variant-specific styles
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-50 disabled:text-gray-400',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:text-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:text-gray-300',
    link: 'bg-transparent text-blue-600 hover:underline p-0 h-auto disabled:text-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300'
  };
  
  // Loading state styles
  const loadingStyles = isLoading
    ? 'relative text-transparent transition-none hover:text-transparent'
    : '';
  
  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${widthStyles[width]} ${variantStyles[variant]} ${loadingStyles} ${className}`;
  
  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={disabled || isLoading}
      onClick={props.onClick}
      {...props}
    >
      {/* Left icon */}
      {iconLeft && <span className={`mr-2 ${isLoading ? 'opacity-0' : ''}`}>{iconLeft}</span>}
      
      {/* Button content */}
      <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      
      {/* Right icon */}
      {iconRight && <span className={`ml-2 ${isLoading ? 'opacity-0' : ''}`}>{iconRight}</span>}
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
