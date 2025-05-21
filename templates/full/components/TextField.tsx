/**
 * Reusable TextField component for 0x1 applications
 */

interface TextFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  autocomplete?: string;
  helperText?: string;
  error?: string;
  onChange?: (e: Event) => void;
}

export function TextField({
  id,
  label,
  type = 'text',
  placeholder = '',
  value = '',
  required = false,
  disabled = false,
  autocomplete,
  helperText,
  error,
  onChange,
}: TextFieldProps) {
  const hasError = !!error;
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className={`block text-sm font-medium mb-1 ${
          hasError 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete={autocomplete}
        onChange={onChange}
        className={`
          w-full px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 
          border rounded-md focus:outline-none focus:ring-2 transition-colors
          ${hasError 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-300 dark:focus:ring-red-700' 
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-300 dark:focus:ring-primary-700'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}
        `}
      />
      
      {(helperText || error) && (
        <div className={`mt-1 text-sm ${
          hasError 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
