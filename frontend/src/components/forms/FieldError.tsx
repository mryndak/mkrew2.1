import React from 'react';

export interface FieldErrorProps {
  message?: string;
  'data-test-id'?: string;
}

/**
 * FieldError component
 * Wyświetla błąd walidacji pod polem formularza
 * Używa role="alert" dla accessibility
 *
 * @param message - Komunikat błędu do wyświetlenia
 * @param data-test-id - ID testowe dla automatycznych testów
 *
 * @example
 * <FieldError message="Email jest wymagany" data-test-id="email-error" />
 */
export function FieldError({ message, 'data-test-id': dataTestId }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      data-test-id={dataTestId}
      className="mt-1 text-sm text-red-600 flex items-center gap-1"
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </p>
  );
}
