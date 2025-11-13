import React from 'react';
import type { SubmitButtonProps } from '@/types/auth';

/**
 * SubmitButton component
 * Przycisk submit formularza z loading state i spinner
 *
 * @param loading - Czy formularz jest w trakcie submitu
 * @param disabled - Czy przycisk jest disabled (np. rate limit lockout)
 *
 * @example
 * <SubmitButton loading={isSubmitting} disabled={isLocked} />
 */
export function SubmitButton({ loading, disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`
        w-full flex justify-center items-center gap-2 py-3 px-4
        border border-transparent rounded-lg shadow-sm text-sm font-medium
        text-white bg-blue-600 hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5 text-white"
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
      )}
      <span>{loading ? 'Logowanie...' : 'Zaloguj się'}</span>
    </button>
  );
}
