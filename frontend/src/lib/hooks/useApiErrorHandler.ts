import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

/**
 * Hook do obsługi błędów API na poziomie aplikacji
 * Nasłuchuje na event 'api-max-retries-reached' z axios interceptora
 * i wyświetla odpowiednie komunikaty toast
 *
 * Zapobiega duplikacji komunikatów (pokazuje max 1 komunikat na 5 sekund)
 *
 * Umieść ten hook w głównym komponencie aplikacji (np. App.tsx)
 *
 * @example
 * ```tsx
 * function App() {
 *   useApiErrorHandler();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useApiErrorHandler() {
  const toast = useToast();
  const lastErrorTimeRef = useRef<number>(0);
  const DEDUPE_WINDOW_MS = 5000; // 5 seconds

  useEffect(() => {
    const handleMaxRetriesReached = (event: Event) => {
      const customEvent = event as CustomEvent<{
        error: any;
        url: string;
        retryCount: number;
      }>;

      const { error, url } = customEvent.detail;

      // Deduplicate: only show one error message per 5 seconds
      const now = Date.now();
      if (now - lastErrorTimeRef.current < DEDUPE_WINDOW_MS) {
        if (import.meta.env.DEV) {
          console.log('Skipping duplicate error notification');
        }
        return;
      }
      lastErrorTimeRef.current = now;

      // Determine error message based on error type
      let message = 'Usługa jest obecnie niedostępna. Spróbuj ponownie później.';
      let title = 'Błąd połączenia';

      // Network error (backend not available)
      if (!error.response) {
        message = 'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.';
        title = 'Serwer niedostępny';
      }
      // Rate limiting (429)
      else if (error.response?.status === 429) {
        message = 'Przekroczono limit zapytań. Poczekaj chwilę i spróbuj ponownie.';
        title = 'Zbyt wiele zapytań';
      }
      // Service unavailable (503)
      else if (error.response?.status === 503) {
        message = 'Serwis jest tymczasowo niedostępny. Spróbuj ponownie za chwilę.';
        title = 'Serwis niedostępny';
      }

      // Show error toast
      toast.error(message, title);

      // Log error for debugging (development only)
      if (import.meta.env.DEV) {
        console.error('API max retries reached:', {
          url,
          error,
        });
      }
    };

    // Add event listener
    window.addEventListener('api-max-retries-reached', handleMaxRetriesReached);

    // Cleanup
    return () => {
      window.removeEventListener('api-max-retries-reached', handleMaxRetriesReached);
    };
  }, [toast]);
}
