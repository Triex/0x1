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
  // Use the CSS class-based approach from globals.css
  const baseClasses = "btn";
  
  // Size classes
  const sizeClasses = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg"
  }[size];
  
  // Variant classes
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    outline: "btn-outline",
    danger: "btn-danger"
  }[variant];
  
  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";
  
  // Combine all classes
  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses}`.trim();

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
