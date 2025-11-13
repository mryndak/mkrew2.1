import React from 'react';
import { Button } from '@/components/ui/Button';
import type { SuccessStateProps } from '@/types/auth';

/**
 * SuccessState component
 * Wyświetlany po pomyślnej weryfikacji emaila
 * Pokazuje zieloną ikonę sukcesu, komunikat i przycisk do logowania
 *
 * @param email - Zweryfikowany adres email
 * @param onRedirect - Callback do przekierowania na stronę logowania
 */
export function SuccessState({ email, onRedirect }: SuccessStateProps) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      {/* Success icon (checkmark circle) */}
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Email zweryfikowany pomyślnie!
      </h1>

      {/* Message with email */}
      <p className="text-gray-700 mb-1">
        Twój adres email <strong className="text-gray-900">{email}</strong> został zweryfikowany.
      </p>
      <p className="text-gray-600 mb-6">
        Możesz teraz zalogować się do swojego konta.
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
