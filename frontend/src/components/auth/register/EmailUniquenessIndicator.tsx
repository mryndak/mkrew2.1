import React from 'react';
import type { EmailCheckStatus } from '@/types/auth';

interface EmailUniquenessIndicatorProps {
  status: EmailCheckStatus;
  email: string;
}

/**
 * EmailUniquenessIndicator component
 * Wyświetla status sprawdzania unikalności emaila
 * Pokazuje spinner podczas sprawdzania, checkmark jeśli dostępny, błąd jeśli zajęty
 *
 * @param status - Status sprawdzania emaila (idle | checking | available | taken | error)
 * @param email - Email do sprawdzenia
 *
 * @example
 * <EmailUniquenessIndicator status={emailCheckStatus} email={formData.email} />
 */
export function EmailUniquenessIndicator({ status, email }: EmailUniquenessIndicatorProps) {
  // Nie pokazuj wskaźnika jeśli status idle lub email pusty
  if (status === 'idle' || !email) {
    return null;
  }

  return (
    <div className="mt-2">
      {/* Checking status - spinner */}
      {status === 'checking' && (
        <div className="flex items-center text-xs text-gray-600">
          <svg
            className="animate-spin h-4 w-4 mr-2 text-blue-500"
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
          <span>Sprawdzam dostępność emaila...</span>
        </div>
      )}

      {/* Available status - green checkmark */}
      {status === 'available' && (
        <div className="flex items-center text-xs text-green-600">
          <svg
            className="w-4 h-4 mr-2"
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
          <span className="font-medium">Email dostępny</span>
        </div>
      )}

      {/* Taken status - red X */}
      {status === 'taken' && (
        <div className="flex items-center text-xs text-red-600">
          <svg
            className="w-4 h-4 mr-2"
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
          <span className="font-medium">Email jest już zarejestrowany</span>
        </div>
      )}

      {/* Error status - warning */}
      {status === 'error' && (
        <div className="flex items-center text-xs text-yellow-600">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium">Nie udało się sprawdzić emaila</span>
        </div>
      )}
    </div>
  );
}
