/**
 * Reusable Button component for 0x1 applications
 */

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
  // Compute classes based on props
  const baseClasses = "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  }[size];
  
  // Variant classes
  const variantClasses = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-800 focus:ring-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-200",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
  }[variant];
  
  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";
  
  // Combine all classes
  const classes = `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span className="mr-2">
          {icon}
        </span>
      )}
      {text}
    </button>
  );
}
