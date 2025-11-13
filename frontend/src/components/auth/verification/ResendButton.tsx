import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useResendVerification } from '@/lib/hooks/useResendVerification';
import type { ResendButtonProps } from '@/types/auth';

/**
 * ResendButton component
 * Przycisk do ponownego wysłania emaila weryfikacyjnego
 * Obsługuje rate limiting (max 3 próby w 10 minut) i countdown timer
 *
 * Features:
 * - Loading state podczas wysyłania
 * - Cooldown 60s po sukcesie
 * - Rate limiting (lokalne + backendowe)
 * - Toast notifications (TODO: dodać toast system)
 * - Countdown timer wyświetlany jako tekst przycisku
 *
 * @param email - Adres email użytkownika (opcjonalny)
 * @param onSuccess - Callback po sukcesie (opcjonalny)
 * @param onError - Callback po błędzie (opcjonalny)
 */
export function ResendButton({ email, onSuccess, onError }: ResendButtonProps) {
  const { resend, isLoading, error, canResend, nextAllowedTime } = useResendVerification();
  const [countdown, setCountdown] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  /**
   * Countdown timer effect
   * Aktualizuje countdown co sekundę jeśli nextAllowedTime jest ustawiony
   */
  useEffect(() => {
    if (!nextAllowedTime) {
      setCountdown(0);
      return;
    }

    // Oblicz początkowy countdown
    const updateCountdown = () => {
      const remaining = Math.ceil((nextAllowedTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    };

    // Ustaw początkowy countdown
    updateCountdown();

    // Aktualizuj co sekundę
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextAllowedTime]);

  /**
   * Obsługa kliknięcia przycisku
   */
  const handleClick = async () => {
    // Walidacja email
    if (!email) {
      setShowError(true);
      onError?.('Brak adresu email. Spróbuj zarejestrować się ponownie.');
      return;
    }

    // Reset komunikatów
    setShowSuccess(false);
    setShowError(false);

    // Wywołaj API
    const success = await resend(email);

    if (success) {
      setShowSuccess(true);
      onSuccess?.();

      // Auto-hide success message po 5 sekundach
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } else {
      setShowError(true);
      onError?.(error || 'Nie udało się wysłać emaila.');

      // Auto-hide error message po 10 sekundach
      setTimeout(() => {
        setShowError(false);
      }, 10000);
    }
  };

  /**
   * Tekst przycisku w zależności od stanu
   */
  const getButtonText = (): string => {
    if (isLoading) {
      return 'Wysyłanie...';
    }

    if (countdown > 0) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;

      if (minutes > 0) {
        return `Spróbuj ponownie za ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return `Spróbuj ponownie za ${countdown}s`;
    }

    if (showSuccess) {
      return 'Email wysłany!';
    }

    return 'Wyślij ponownie email weryfikacyjny';
  };

  return (
    <div className="space-y-4">
      {/* Success message */}
      {showSuccess && (
        <div
          className="rounded-lg border border-green-400 bg-green-50 p-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-green-800">
              Email wysłany ponownie. Sprawdź swoją skrzynkę odbiorczą.
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {showError && error && (
        <div
          className="rounded-lg border border-red-400 bg-red-50 p-3"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium text-red-800">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Resend button */}
      <Button
        onClick={handleClick}
        disabled={!canResend || isLoading || countdown > 0 || !email}
        loading={isLoading}
        variant={showSuccess ? 'secondary' : 'primary'}
        size="large"
        className="w-full"
      >
        {getButtonText()}
      </Button>

      {/* Help text */}
      {!email && (
        <p className="text-xs text-gray-500 text-center">
          Email nie jest dostępny. Spróbuj zarejestrować się ponownie.
        </p>
      )}
    </div>
  );
}
