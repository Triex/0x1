/**
 * Reusable TextField component for 0x1 applications
 */
import { html } from '0x1';

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
  onChange
}: TextFieldProps) {
  // Generate a unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // Set classes based on state (error, disabled)
  const inputClasses = `
    w-full rounded-lg
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500'}
    bg-white dark:bg-gray-900 shadow-sm
    ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
    dark:text-white
  `.trim();
  
  return html`
    <div>
      <label for="${inputId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        ${label}${required ? ' *' : ''}
      </label>
      
      <input
        type="${type}"
        id="${inputId}"
        name="${id}"
        class="${inputClasses}"
        placeholder="${placeholder}"
        value="${value}"
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
        ${onChange ? `onchange="${onChange}"` : ''}
      />
      
      ${error ? html`
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">${error}</p>
      ` : ''}
      
      ${helperText && !error ? html`
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${helperText}</p>
      ` : ''}
    </div>
  `;
}
