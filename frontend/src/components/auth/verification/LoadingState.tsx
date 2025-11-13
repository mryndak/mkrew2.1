import React from 'react';

/**
 * LoadingState component
 * Wyświetlany podczas weryfikacji emaila (spinner + komunikat)
 * Używa inline SVG spinner zamiast zewnętrznej biblioteki
 */
export function LoadingState() {
  return (
    <div className="text-center" role="status" aria-live="polite">
      {/* Spinner */}
      <div className="flex justify-center mb-4">
        <svg
          className="animate-spin h-12 w-12 text-blue-600"
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
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Weryfikacja w toku...
      </h1>

      {/* Message */}
      <p className="text-gray-600">
        Proszę czekać, weryfikujemy Twój adres email.
      </p>
    </div>
  );
}
