import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from '@/components/ui/Toast';
import { logout } from '@/lib/store/slices/authSlice';
import { clearUserData } from '@/lib/store/slices/userSlice';

/**
 * Hook do obsługi błędów API na poziomie aplikacji
 * Nasłuchuje na event 'api-max-retries-reached' z axios interceptora
 * i wyświetla odpowiednie komunikaty toast
 *
 * Dodatkowo nasłuchuje na event 'logout-403' który wymusza wylogowanie
 * użytkownika gdy endpoint /users/me zwróci 403 Forbidden
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
  const dispatch = useDispatch();
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

    const handleLogout403 = (event: Event) => {
      const customEvent = event as CustomEvent<{
        error: any;
        url: string;
      }>;

      // Log for debugging (development only)
      if (import.meta.env.DEV) {
        console.log('403 Forbidden on /users/me - forcing logout', customEvent.detail);
      }

      // Dispatch logout actions
      dispatch(logout());
      dispatch(clearUserData());

      // Show toast notification
      toast.error(
        'Twoja sesja wygasła lub dostęp został odwołany. Zaloguj się ponownie.',
        'Sesja wygasła'
      );

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    };

    // Add event listeners
    window.addEventListener('api-max-retries-reached', handleMaxRetriesReached);
    window.addEventListener('logout-403', handleLogout403);

    // Cleanup
    return () => {
      window.removeEventListener('api-max-retries-reached', handleMaxRetriesReached);
      window.removeEventListener('logout-403', handleLogout403);
    };
  }, [toast, dispatch]);
}
