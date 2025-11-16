import { useState, useEffect, useCallback } from 'react';
import { verifyEmail } from '@/lib/api/endpoints/auth';
import type {
  VerificationState,
  VerifyEmailResponse,
  ErrorResponse,
  UseEmailVerificationReturn,
  EMAIL_VERIFICATION_CONFIG,
} from '@/types/auth';

/**
 * Custom hook dla weryfikacji email
 * Automatycznie wywołuje API weryfikacji przy montowaniu z podanym tokenem
 *
 * @param token - Token weryfikacyjny z URL query params
 * @returns {UseEmailVerificationReturn} Stan weryfikacji, dane, błąd i funkcja retry
 *
 * @example
 * const { state, data, error, retry } = useEmailVerification(token);
 */
export function useEmailVerification(token: string | null): UseEmailVerificationReturn {
  const [state, setState] = useState<VerificationState>('loading');
  const [data, setData] = useState<VerifyEmailResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Główna funkcja weryfikacji
   * Wywołuje API i mapuje odpowiedzi na stany
   */
  const verify = useCallback(async () => {
    // Walidacja: sprawdź czy token istnieje
    if (!token || token.trim() === '') {
      setState('missing_token');
      setError({
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'MISSING_TOKEN',
        message: 'Brakuje tokenu weryfikacyjnego w URL',
        path: '/verify-email',
      });
      return;
    }

    setIsLoading(true);
    setState('loading');

    try {
      // Wywołaj API weryfikacji
      const response = await verifyEmail(token);

      // Sukces
      setState('success');
      setData(response);
      setError(null);

      // Zapisz informację o weryfikacji w sessionStorage
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem(
            'email_verified',
            JSON.stringify({
              email: response.email,
              timestamp: Date.now(),
            })
          );
        } catch (storageError) {
          console.warn('Failed to save verification state to sessionStorage:', storageError);
        }
      }

      // Usuń token z URL dla bezpieczeństwa (zapobiegaj leakom tokenów)
      try {
        window.history.replaceState({}, '', '/verify-email');
      } catch (historyError) {
        console.warn('Failed to remove token from URL:', historyError);
      }

    } catch (err: any) {
      // Obsługa błędów
      const errorResponse: ErrorResponse = err.response?.data;
      setError(errorResponse || null);

      // Mapuj błędy API na odpowiednie stany
      if (!err.response) {
        // Błąd sieci (brak odpowiedzi)
        setState('error');
      } else if (errorResponse?.error === 'INVALID_TOKEN') {
        // Token nieprawidłowy - sprawdź typ błędu
        const message = errorResponse.message?.toLowerCase() || '';

        if (message.includes('expired') || message.includes('wygasł')) {
          setState('expired');
        } else if (message.includes('already verified') || message.includes('już zweryfikowany')) {
          setState('already_verified');
        } else {
          setState('invalid');
        }
      } else if (err.response.status === 404) {
        // Token nie znaleziony
        setState('invalid');
      } else if (err.response.status >= 500) {
        // Błąd serwera
        setState('error');
      } else {
        // Inny błąd
        setState('error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Automatyczne wywołanie weryfikacji przy montowaniu
   */
  useEffect(() => {
    // Sprawdź czy weryfikacja była już wykonana (odświeżenie strony)
    if (!token) {
      // Check if running in browser (not during SSR)
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          const stored = sessionStorage.getItem('email_verified');
        if (stored) {
          const { email, timestamp } = JSON.parse(stored);
          const VERIFIED_SESSION_TTL_MS = 5 * 60 * 1000; // 5 minut

          // Jeśli weryfikacja była w ciągu ostatnich 5 minut
          if (Date.now() - timestamp < VERIFIED_SESSION_TTL_MS) {
            setState('already_verified');
            setData({ message: 'Email already verified', email });
            return;
          }
        }
        } catch (storageError) {
          console.warn('Failed to load verification state from sessionStorage:', storageError);
        }
      }

      // Brak tokenu i brak sesji - pokaż błąd
      setState('missing_token');
      return;
    }

    // Wywołaj weryfikację
    verify();
  }, [token, verify]);

  return {
    state,
    data,
    error,
    isLoading,
    retry: verify,
  };
}
