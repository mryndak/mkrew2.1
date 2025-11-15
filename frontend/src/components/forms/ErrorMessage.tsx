import React from 'react';
import type { ErrorMessageProps } from '@/types/auth';

/**
 * ErrorMessage component
 * Wyświetla globalny komunikat błędu (np. z API)
 * Używa role="alert" i aria-live dla accessibility
 *
 * @param message - Komunikat błędu
 * @param type - Typ komunikatu (error, warning, info) - wpływa na styling
 * @param data-test-id - ID testowe dla automatycznych testów
 *
 * @example
 * <ErrorMessage message="Nieprawidłowy email lub hasło" type="error" data-test-id="login-error" />
 */
export function ErrorMessage({ message, type = 'error', 'data-test-id': dataTestId }: ErrorMessageProps & { 'data-test-id'?: string }) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: 'text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: 'text-blue-400',
    },
  };

  const style = styles[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-test-id={dataTestId || 'error-message'}
      className={`rounded-lg border ${style.border} ${style.bg} p-4 mb-4`}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`w-5 h-5 flex-shrink-0 ${style.icon}`}
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
        <p className={`text-sm font-medium ${style.text}`}>{message}</p>
      </div>
    </div>
  );
}
