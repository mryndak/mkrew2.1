import React from 'react';
import { Button } from '@/components/ui/Button';
import { ResendButton } from './ResendButton';

export interface VerificationPendingStatusProps {
  email?: string;
}

/**
 * VerificationPendingStatus component
 * Wyświetlany po pomyślnej rejestracji - informuje użytkownika o wysłaniu emaila weryfikacyjnego
 * Pokazuje instrukcje i pozwala na ponowne wysłanie emaila
 *
 * @param email - Adres email użytkownika (z query params lub Redux state)
 */
export function VerificationPendingStatus({ email }: VerificationPendingStatusProps) {
  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Email icon */}
          <div className="flex justify-center mb-6">
            <svg
              className="w-20 h-20 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sprawdź swoją skrzynkę email
          </h1>

          {/* Success message */}
          <div className="mb-6">
            <p className="text-lg text-gray-700 mb-2">
              Rejestracja zakończona pomyślnie!
            </p>
            {email && (
              <p className="text-gray-600 mb-4">
                Wysłaliśmy link weryfikacyjny na adres:{' '}
                <strong className="text-gray-900">{email}</strong>
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h2 className="text-sm font-semibold text-blue-900 mb-2">
              Co dalej?
            </h2>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Otwórz swoją skrzynkę odbiorczą</li>
              <li>Znajdź email od mKrew z tematem "Weryfikacja konta"</li>
              <li>Kliknij w link weryfikacyjny (ważny przez 24 godziny)</li>
              <li>Po weryfikacji będziesz mógł się zalogować</li>
            </ol>
          </div>

          {/* Spam notice */}
          <p className="text-sm text-gray-500 mb-6">
            Nie widzisz emaila? Sprawdź folder SPAM lub Oferty.
          </p>

          {/* Resend button */}
          {email && (
            <div className="mb-6">
              <ResendButton
                email={email}
                onSuccess={() => {
                  // Success handled by ResendButton component
                }}
                onError={(error) => {
                  console.error('Resend error:', error);
                }}
              />
            </div>
          )}

          {/* Go to login button */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Już zweryfikowałeś email?
            </p>
            <Button
              onClick={handleGoToLogin}
              variant="secondary"
              size="large"
              className="w-full"
            >
              Przejdź do logowania
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
