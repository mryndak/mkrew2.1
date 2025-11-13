import React from 'react';
import type { SaveIndicatorProps } from '@/types/profile';

/**
 * SaveIndicator component
 *
 * Wyświetla status zapisu formularza (saving, saved, error)
 * z odpowiednią ikoną i tekstem
 *
 * Features:
 * - Visual feedback dla każdego statusu (spinner, checkmark, error icon)
 * - Opcjonalny timestamp ostatniego zapisu
 * - Automatyczne ukrywanie po powrocie do stanu 'idle'
 *
 * @param status - Status zapisu: 'idle' | 'saving' | 'saved' | 'error'
 * @param message - Opcjonalna własna wiadomość
 * @param lastSavedAt - Timestamp ostatniego zapisu
 */
export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  message,
  lastSavedAt,
}) => {
  // Nie pokazuj nic gdy status jest 'idle'
  if (status === 'idle') {
    return null;
  }

  /**
   * Format timestamp do czytelnej formy
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) {
      return 'przed chwilą';
    } else if (diffSecs < 60) {
      return `${diffSecs} sek. temu`;
    } else if (diffMins < 60) {
      return `${diffMins} min. temu`;
    } else {
      return date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  /**
   * Render różnych statusów
   */
  const renderContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            {/* Spinner icon */}
            <svg
              className="animate-spin h-4 w-4"
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
            <span>{message || 'Zapisywanie...'}</span>
          </div>
        );

      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            {/* Checkmark icon */}
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>
              {message || 'Zapisano'}
              {lastSavedAt && (
                <span className="ml-1 text-gray-500">
                  ({formatTimestamp(lastSavedAt)})
                </span>
              )}
            </span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            {/* Error icon */}
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{message || 'Błąd zapisu'}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="inline-flex items-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {renderContent()}
    </div>
  );
};
