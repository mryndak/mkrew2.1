import type { InputHTMLAttributes, ReactNode } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
}

/**
 * Radio component - radio button input z label i description
 * Wspiera: label, description, error state, disabled state
 * Accessibility: proper labels, aria attributes, keyboard navigation
 *
 * @example
 * ```tsx
 * <Radio name="option" value="1" label="Opcja 1" />
 * <Radio
 *   name="option"
 *   value="2"
 *   label="Opcja 2"
 *   description="Dodatkowy opis opcji"
 * />
 * <Radio
 *   name="option"
 *   value="3"
 *   label="Opcja 3"
 *   disabled
 * />
 * ```
 */
export function Radio({
  label,
  description,
  error,
  className = '',
  wrapperClassName = '',
  id,
  disabled = false,
  ...props
}: RadioProps) {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  const radioClasses = [
    'h-4 w-4 border-gray-300 transition-colors',
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
          type="radio"
          id={radioId}
          className={radioClasses}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${radioId}-error`
              : description
              ? `${radioId}-description`
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
              htmlFor={radioId}
              className={`font-medium ${
                disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}

          {/* Description */}
          {description && !error && (
            <p id={`${radioId}-description`} className="text-gray-500 mt-0.5">
              {description}
            </p>
          )}

          {/* Error message */}
          {error && (
            <p
              id={`${radioId}-error`}
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
