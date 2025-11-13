import React from 'react';
import { ResendButton } from './ResendButton';
import type { ExpiredStateProps } from '@/types/auth';

/**
 * ExpiredState component
 * Wyświetlany gdy token weryfikacyjny wygasł (>24h)
 * Pokazuje ikonę zegara, komunikat i przycisk do ponownego wysłania emaila
 *
 * @param email - Adres email użytkownika (opcjonalny, z error response)
 */
export function ExpiredState({ email }: ExpiredStateProps) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      {/* Clock icon (expired) */}
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Token weryfikacyjny wygasł
      </h1>

      {/* Message */}
      <p className="text-gray-700 mb-1">
        Link weryfikacyjny stracił ważność. Tokeny weryfikacyjne są ważne przez 24 godziny.
      </p>
      <p className="text-gray-600 mb-6">
        Możesz wysłać nowy email weryfikacyjny poniżej.
      </p>

      {/* Resend button */}
      <ResendButton email={email} />

      {/* Alternative action */}
      <div className="mt-6">
        <p className="text-sm text-gray-500">
          Lub{' '}
          <a
            href="/register"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            zarejestruj się ponownie
          </a>
        </p>
      </div>
    </div>
  );
}
