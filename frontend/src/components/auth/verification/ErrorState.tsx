import React from 'react';
import { Button } from '@/components/ui/Button';
import type { ErrorStateProps } from '@/types/auth';

/**
 * ErrorState component
 * Uniwersalny komponent błędu dla różnych scenariuszy
 * Wyświetla czerwoną ikonę X, tytuł, komunikat i opcjonalne akcje
 *
 * @param title - Tytuł błędu (np. "Token nieprawidłowy")
 * @param message - Szczegółowy komunikat błędu
 * @param actionText - Tekst przycisku akcji (opcjonalny)
 * @param onAction - Callback dla akcji (opcjonalny)
 * @param showRetry - Czy pokazać przycisk "Spróbuj ponownie" (domyślnie false)
 */
export function ErrorState({
  title,
  message,
  actionText,
  onAction,
  showRetry = false,
}: ErrorStateProps) {
  return (
    <div className="text-center" role="alert" aria-live="assertive">
      {/* Error icon (X circle) */}
      <div className="flex justify-center mb-4">
        <svg
          className="w-16 h-16 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h1>

      {/* Message */}
      <p className="text-gray-600 mb-6">
        {message}
      </p>

      {/* Action buttons */}
      {(actionText || showRetry) && onAction && (
        <Button
          onClick={onAction}
          variant={showRetry ? 'primary' : 'secondary'}
          size="large"
        >
          {actionText || 'Spróbuj ponownie'}
        </Button>
      )}
    </div>
  );
}
