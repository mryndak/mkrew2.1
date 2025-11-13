import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  wrapperClassName?: string;
}

/**
 * Textarea component - multiline text input dla formularzy
 * Wspiera: label, error state, helper text, disabled state
 * Accessibility: labels, aria attributes
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Notatki"
 *   placeholder="Wpisz swoje notatki..."
 *   rows={4}
 * />
 * <Textarea
 *   label="Opis"
 *   error="To pole jest wymagane"
 * />
 * ```
 */
export function Textarea({
  label,
  error,
  helperText,
  className = '',
  wrapperClassName = '',
  id,
  disabled = false,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const textareaClasses = [
    'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
    'text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'resize-y',
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Textarea */}
      <textarea
        id={textareaId}
        className={textareaClasses}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        {...props}
      />

      {/* Error message */}
      {error && (
        <p
          id={`${textareaId}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p
          id={`${textareaId}-helper`}
          className="mt-1.5 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
