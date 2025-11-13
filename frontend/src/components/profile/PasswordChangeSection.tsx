import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { requestPasswordReset } from '@/lib/api/endpoints/user';
import type { PasswordChangeSectionProps } from '@/types/profile';

/**
 * PasswordChangeSection component
 *
 * Sekcja umożliwiająca użytkownikowi inicjowanie procesu zmiany hasła
 * poprzez email reset (POST /auth/password-reset/request)
 *
 * Features:
 * - Info box z wyjaśnieniem procesu
 * - Button "Zmień hasło"
 * - Confirmation modal po wysłaniu emaila
 * - Rate limiting handling (429)
 * - Toast notifications
 *
 * @param userEmail - Email użytkownika (dla wysłania linku resetującego)
 * @param onRequestReset - Callback do wysłania żądania resetu
 * @param onSuccess - Callback po sukcesie (dla toast)
 * @param onError - Callback po błędzie (dla toast)
 */
export const PasswordChangeSection: React.FC<PasswordChangeSectionProps> = ({
  userEmail,
  onRequestReset,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  /**
   * Handle password reset request
   */
  const handlePasswordReset = async () => {
    setIsLoading(true);

    try {
      await onRequestReset(userEmail);
      setShowConfirmation(true);
      onSuccess('Link do zmiany hasła został wysłany na Twój adres email');
    } catch (error: any) {
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 60;
        onError(
          `Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter} ${retryAfter === 1 ? 'sekundę' : 'sekund'}.`
        );
      } else {
        onError(error.message || 'Nie udało się wysłać linku resetującego');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Close confirmation modal
   */
  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Card header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Zmiana hasła</h2>
        <p className="mt-1 text-sm text-gray-600">
          Zmień hasło do swojego konta
        </p>
      </div>

      {/* Info box - wyjaśnienie procesu */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Jak zmienić hasło?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Kliknij przycisk "Zmień hasło" poniżej</li>
              <li>Otrzymasz link resetujący na swój adres email: <strong>{userEmail}</strong></li>
              <li>Kliknij w link w emailu (ważny przez 24 godziny)</li>
              <li>Ustaw nowe hasło w formularzu resetowania</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="flex justify-start">
        <Button
          variant="secondary"
          onClick={handlePasswordReset}
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Wysyłanie...' : 'Zmień hasło'}
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeConfirmation}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Email wysłany
              </h3>
              <button
                onClick={closeConfirmation}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Zamknij"
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <svg
                  className="w-16 h-16 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-center text-gray-700">
                Link do zmiany hasła został wysłany na adres:
              </p>
              <p className="text-center text-blue-600 font-semibold mt-2">
                {userEmail}
              </p>
              <p className="text-center text-sm text-gray-500 mt-4">
                Sprawdź swoją skrzynkę pocztową. Link jest ważny przez 24 godziny.
              </p>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end">
              <Button variant="primary" onClick={closeConfirmation}>
                Rozumiem
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
