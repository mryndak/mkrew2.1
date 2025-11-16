import { useState } from 'react';
import { resendVerificationEmail } from '@/lib/api/endpoints/auth';
import type { ResendAttempts, UseResendVerificationReturn } from '@/types/auth';

/**
 * Custom hook dla ponownego wysyłania emaila weryfikacyjnego
 * Zarządza rate limiting (max 3 próby w 10 minut) i stanem ładowania
 *
 * @returns {UseResendVerificationReturn} Funkcja resend, stan, błąd i możliwość wysłania
 *
 * @example
 * const { resend, isLoading, error, canResend } = useResendVerification();
 * await resend('user@example.com');
 */
export function useResendVerification(): UseResendVerificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAllowedTime, setNextAllowedTime] = useState<number | null>(null);

  // Constants
  const MAX_ATTEMPTS = 3;
  const WINDOW_MS = 10 * 60 * 1000; // 10 minut
  const STORAGE_KEY = 'resend_attempts';

  /**
   * Sprawdź czy użytkownik nie przekroczył rate limit
   * @returns true jeśli można wysłać, false jeśli limit przekroczony
   */
  const checkRateLimit = (): boolean => {
    // Check if running in browser (not during SSR)
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return true;
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return true;

      const attempts: ResendAttempts = JSON.parse(stored);
      const now = Date.now();
      const windowStart = now - WINDOW_MS;

      // Filtruj próby z ostatnich 10 minut
      const recentAttempts = attempts.timestamps.filter(t => t > windowStart);

      // Sprawdź czy przekroczono limit
      if (recentAttempts.length >= MAX_ATTEMPTS) {
        const oldestAttempt = Math.min(...recentAttempts);
        const nextAllowed = oldestAttempt + WINDOW_MS;
        setNextAllowedTime(nextAllowed);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Failed to check rate limit:', err);
      return true; // W przypadku błędu, pozwól na wysłanie
    }
  };

  /**
   * Zapisz próbę wysłania w sessionStorage
   */
  const recordAttempt = (): void => {
    // Check if running in browser (not during SSR)
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const attempts: ResendAttempts = stored
        ? JSON.parse(stored)
        : { timestamps: [], lastAttempt: 0 };

      const now = Date.now();
      attempts.timestamps.push(now);
      attempts.lastAttempt = now;

      // Zachowaj tylko próby z ostatnich 10 minut
      const windowStart = now - WINDOW_MS;
      attempts.timestamps = attempts.timestamps.filter(t => t > windowStart);

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));

      // Ustaw nextAllowedTime (60 sekund cooldown po wysłaniu)
      setNextAllowedTime(now + 60 * 1000);
    } catch (err) {
      console.warn('Failed to record attempt:', err);
    }
  };

  /**
   * Wyślij ponownie email weryfikacyjny
   * @param email - Adres email użytkownika
   * @returns Promise<boolean> - true jeśli sukces, false jeśli błąd
   */
  const resend = async (email: string): Promise<boolean> => {
    // Walidacja email
    if (!email || email.trim() === '') {
      setError('Adres email jest wymagany');
      return false;
    }

    // Sprawdź rate limit (lokalne)
    if (!checkRateLimit()) {
      const remaining = nextAllowedTime ? Math.ceil((nextAllowedTime - Date.now()) / 1000 / 60) : 10;
      setError(`Zbyt wiele prób. Spróbuj ponownie za ${remaining} ${remaining === 1 ? 'minutę' : 'minut'}.`);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wywołaj API
      await resendVerificationEmail(email);

      // Sukces - zapisz próbę
      recordAttempt();
      return true;

    } catch (err: any) {
      // Obsługa błędów
      if (err.response?.status === 429) {
        // Rate limit z backendu
        const retryAfter = err.response.headers['retry-after'];
        const seconds = retryAfter ? parseInt(retryAfter) : 60;

        setError(`Zbyt wiele prób. Spróbuj ponownie za ${seconds} sekund.`);
        setNextAllowedTime(Date.now() + seconds * 1000);
      } else if (err.response?.status === 400) {
        // Błąd walidacji
        const errorMessage = err.response?.data?.message || 'Nieprawidłowy adres email';
        setError(errorMessage);
      } else if (!err.response) {
        // Błąd sieci
        setError('Problem z połączeniem. Sprawdź swoje połączenie internetowe.');
      } else {
        // Inny błąd
        setError(err.response?.data?.message || 'Nie udało się wysłać emaila. Spróbuj ponownie.');
      }

      return false;

    } finally {
      setIsLoading(false);
    }
  };

  // Sprawdź czy można wysłać (nie ładuje się i czas nie wygasł)
  const canResend = !isLoading && (!nextAllowedTime || Date.now() >= nextAllowedTime);

  return {
    resend,
    isLoading,
    error,
    canResend,
    nextAllowedTime,
  };
}
