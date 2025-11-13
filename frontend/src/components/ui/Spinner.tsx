import type { HTMLAttributes } from 'react';

export type SpinnerSize = 'small' | 'medium' | 'large';
export type SpinnerVariant = 'primary' | 'secondary' | 'white';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

/**
 * Spinner component - animated loading indicator
 * Rozmiary: small (16px), medium (24px), large (40px)
 * Warianty: primary (blue), secondary (gray), white
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="large" variant="primary" />
 * ```
 */
export function Spinner({
  size = 'medium',
  variant = 'primary',
  className = '',
  ...props
}: SpinnerProps) {
  // Mapowanie rozmiarów do klas Tailwind
  const sizeClasses: Record<SpinnerSize, string> = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-10 w-10',
  };

  // Mapowanie wariantów do klas Tailwind
  const variantClasses: Record<SpinnerVariant, string> = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
  };

  const spinnerClasses = [
    'animate-spin',
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="status" {...props}>
      <svg
        className={spinnerClasses}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
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
      <span className="sr-only">Ładowanie...</span>
    </div>
  );
}
