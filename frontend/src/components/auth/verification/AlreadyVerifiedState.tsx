import React from 'react';
import { Button } from '@/components/ui/Button';
import type { AlreadyVerifiedStateProps } from '@/types/auth';

/**
 * AlreadyVerifiedState component
 * Wyświetlany gdy email był już wcześniej zweryfikowany (idempotency)
 * Pokazuje niebieską ikonę info i przycisk do logowania
 *
 * @param onRedirect - Callback do przekierowania na stronę logowania
 */
export function AlreadyVerifiedState({ onRedirect }: AlreadyVerifiedStateProps) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      {/* Info icon (circle with i) */}
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Email już zweryfikowany
      </h1>

      {/* Message */}
      <p className="text-gray-700 mb-1">
        Ten adres email został już zweryfikowany wcześniej.
      </p>
      <p className="text-gray-600 mb-6">
        Możesz się zalogować do swojego konta.
      </p>

      {/* Redirect button */}
      <Button
        onClick={onRedirect}
        variant="primary"
        size="large"
      >
        Przejdź do logowania
      </Button>
    </div>
  );
}
