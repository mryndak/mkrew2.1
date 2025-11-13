import React, { useEffect, useState } from 'react';
import { useEmailVerification } from '@/lib/hooks/useEmailVerification';
import { LoadingState } from './LoadingState';
import { SuccessState } from './SuccessState';
import { ErrorState } from './ErrorState';
import { ExpiredState } from './ExpiredState';
import { AlreadyVerifiedState } from './AlreadyVerifiedState';

/**
 * VerificationStatus component
 * Główny komponent strony weryfikacji email
 * Obsługuje automatyczne wywołanie API weryfikacji, zarządza stanami i wyświetla odpowiednie komponenty
 *
 * Features:
 * - Automatyczne wyciągnięcie tokenu z URL query params
 * - Wywołanie API weryfikacji przy montowaniu
 * - Warunkowe renderowanie dla 7 stanów (loading, success, error, expired, etc.)
 * - Przekierowania do /login lub /register
 * - Usunięcie tokenu z URL dla bezpieczeństwa
 * - Obsługa przypadku odświeżenia strony (sessionStorage)
 *
 * @example
 * <VerificationStatus client:load />
 */
export function VerificationStatus() {
  const [token, setToken] = useState<string | null>(null);

  /**
   * Wyciągnij token z URL przy montowaniu
   */
  useEffect(() => {
    // Pobierz token z query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  // Użyj hooka weryfikacji email
  const { state, data, error, retry } = useEmailVerification(token);

  /**
   * Przekierowanie do strony logowania
   */
  const handleRedirectToLogin = () => {
    window.location.href = '/login?verified=true';
  };

  /**
   * Przekierowanie do strony rejestracji
   */
  const handleRedirectToRegister = () => {
    window.location.href = '/register';
  };

  /**
   * Retry weryfikacji (dla błędów sieci)
   */
  const handleRetry = () => {
    retry();
  };

  /**
   * Warunkowe renderowanie w zależności od stanu
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Loading state */}
        {state === 'loading' && <LoadingState />}

        {/* Success state */}
        {state === 'success' && data && (
          <SuccessState
            email={data.email}
            onRedirect={handleRedirectToLogin}
          />
        )}

        {/* Expired state (token wygasł) */}
        {state === 'expired' && (
          <ExpiredState email={error?.error || undefined} />
        )}

        {/* Already verified state (idempotency) */}
        {state === 'already_verified' && (
          <AlreadyVerifiedState onRedirect={handleRedirectToLogin} />
        )}

        {/* Invalid token state */}
        {state === 'invalid' && (
          <ErrorState
            title="Token weryfikacyjny jest nieprawidłowy"
            message="Link weryfikacyjny, którego użyłeś, jest nieprawidłowy lub został już wykorzystany. Upewnij się, że skopiowałeś cały link z emaila."
            actionText="Powrót do rejestracji"
            onAction={handleRedirectToRegister}
          />
        )}

        {/* Missing token state */}
        {state === 'missing_token' && (
          <ErrorState
            title="Brakuje tokenu weryfikacyjnego"
            message="Nie znaleziono tokenu weryfikacyjnego w linku. Sprawdź link w swoim emailu lub zarejestruj się ponownie."
            actionText="Powrót do rejestracji"
            onAction={handleRedirectToRegister}
          />
        )}

        {/* General error state (błąd sieci, serwera) */}
        {state === 'error' && (
          <ErrorState
            title={error?.status && error.status >= 500 ? 'Błąd serwera' : 'Błąd weryfikacji'}
            message={
              error?.message ||
              (error?.status && error.status >= 500
                ? 'Wystąpił problem z serwerem. Spróbuj ponownie za kilka minut.'
                : 'Nie udało się połączyć z serwerem. Sprawdź swoje połączenie internetowe i spróbuj ponownie.')
            }
            actionText="Spróbuj ponownie"
            onAction={handleRetry}
            showRetry={true}
          />
        )}
      </div>
    </div>
  );
}
