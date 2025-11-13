import { Button } from '../ui/Button';
import type { ErrorStateProps } from '../../types/rckik';

/**
 * ErrorState - wyświetlany przy błędzie API
 * - Error icon
 * - Tytuł "Wystąpił błąd"
 * - Error message (lub generic message)
 * - Retry button
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  // Określ czy to network error
  const isNetworkError = error.message?.toLowerCase().includes('network') ||
                         error.message?.toLowerCase().includes('failed to fetch');

  const errorMessage = isNetworkError
    ? 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.'
    : error.message || 'Nie udało się załadować danych. Spróbuj ponownie.';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="alert" aria-live="assertive">
      {/* Error icon */}
      <div className="mb-6 text-red-500">
        <svg
          className="w-24 h-24 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Wystąpił błąd
      </h3>

      {/* Error message */}
      <p className="text-gray-600 mb-6 max-w-md">
        {errorMessage}
      </p>

      {/* Retry button */}
      <Button
        variant="primary"
        onClick={onRetry}
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Spróbuj ponownie
      </Button>
    </div>
  );
}
