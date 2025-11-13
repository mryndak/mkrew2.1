import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
}

/**
 * Checkbox component - checkbox input z label i description
 * Wspiera: label, description, error state, disabled state
 * Accessibility: proper labels, aria attributes, keyboard navigation
 *
 * @example
 * ```tsx
 * <Checkbox label="Zapamiętaj mnie" />
 * <Checkbox
 *   label="Akceptuję regulamin"
 *   description="Przeczytaj pełny regulamin przed zaakceptowaniem"
 *   required
 * />
 * <Checkbox
 *   label="Newsletter"
 *   error="To pole jest wymagane"
 * />
 * ```
 */
export function Checkbox({
  label,
  description,
  error,
  className = '',
  wrapperClassName = '',
  id,
  disabled = false,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const checkboxClasses = [
    'h-4 w-4 rounded border-gray-300 transition-colors',
    'text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
    error && 'border-red-300 focus:ring-red-500',
    disabled && 'opacity-50 cursor-not-allowed',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex items-start ${wrapperClassName}`}>
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={checkboxId}
          className={checkboxClasses}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${checkboxId}-error`
              : description
              ? `${checkboxId}-description`
              : undefined
          }
          {...props}
        />
      </div>

      {(label || description || error) && (
        <div className="ml-3 text-sm">
          {/* Label */}
          {label && (
            <label
              htmlFor={checkboxId}
              className={`font-medium ${
                disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}

          {/* Description */}
          {description && !error && (
            <p id={`${checkboxId}-description`} className="text-gray-500 mt-0.5">
              {description}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p
              id={`${checkboxId}-error`}
              className="text-red-600 mt-0.5"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
