import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  wrapperClassName?: string;
}

/**
 * Input component - React version dla formularzy i search
 * Wspiera różne typy (text, search, email, etc.)
 * Stany: default, focus, error, disabled
 * Ikony: leading (po lewej), trailing (po prawej)
 * Accessibility: labels, aria attributes
 */
export function Input({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  className = '',
  wrapperClassName = '',
  id,
  disabled = false,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const inputClasses = [
    'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
    'text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
    leadingIcon && 'pl-10',
    trailingIcon && 'pr-10',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Leading icon */}
        {leadingIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leadingIcon}
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {/* Trailing icon */}
        {trailingIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {trailingIcon}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
