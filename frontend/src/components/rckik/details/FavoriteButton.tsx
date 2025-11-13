import { useFavoriteToggle } from '@/lib/hooks/useFavoriteToggle';
import type { FavoriteButtonProps } from '@/types/rckik';

/**
 * FavoriteButton - standalone przycisk do dodawania/usuwania centrum z ulubionych
 *
 * Funkcje:
 * - Heart icon (filled/outline) z animacją
 * - Optimistic updates z rollback
 * - Loading spinner podczas zapisu
 * - Toast notifications (success/error)
 * - Redirect do /login dla niezalogowanych
 * - Accessibility (aria-label, keyboard navigation)
 *
 * Używa hooka useFavoriteToggle z optimistic updates.
 *
 * @example
 * ```tsx
 * <FavoriteButton
 *   rckikId={1}
 *   initialIsFavorite={false}
 *   isAuthenticated={true}
 *   onAuthRequired={() => window.location.href = '/login?returnUrl=/rckik/1'}
 * />
 * ```
 */
export function FavoriteButton({
  rckikId,
  initialIsFavorite,
  isAuthenticated,
  onAuthRequired,
}: FavoriteButtonProps) {
  // Toast notification handler
  const handleToast = (options: { message: string; type: 'success' | 'error' | 'info' }) => {
    // TODO: Integracja z toast system (np. react-hot-toast, sonner)
    // W development mode wyświetlamy w console
    if (import.meta.env.DEV) {
      console.log(`[Toast ${options.type}]:`, options.message);
    }

    // Fallback: używamy prostego alert dla critical errors
    if (options.type === 'error' && !import.meta.env.DEV) {
      // W production używamy native notifications jeśli dostępne
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('mkrew', {
          body: options.message,
          icon: '/favicon.ico',
        });
      }
    }
  };

  const { isFavorite, toggleFavorite, loading } = useFavoriteToggle(
    rckikId,
    initialIsFavorite,
    onAuthRequired,
    handleToast
  );

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={[
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium',
        'transition-all duration-200 border-2',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isFavorite
          ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 focus:ring-red-500'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
      ].join(' ')}
      aria-label={
        loading
          ? 'Przetwarzanie...'
          : isFavorite
          ? 'Usuń z ulubionych'
          : isAuthenticated
          ? 'Dodaj do ulubionych'
          : 'Zaloguj się, aby dodać do ulubionych'
      }
      aria-pressed={isFavorite}
    >
      {/* Loading spinner */}
      {loading ? (
        <svg
          className="w-5 h-5 animate-spin text-current"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
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
      ) : (
        /* Heart icon */
        <>
          {isFavorite ? (
            // Filled heart
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          ) : (
            // Outline heart
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </>
      )}

      {/* Button text */}
      <span className="hidden sm:inline">
        {loading
          ? 'Przetwarzanie...'
          : isFavorite
          ? 'Usuń z ulubionych'
          : 'Dodaj do ulubionych'}
      </span>
    </button>
  );
}

/**
 * CompactFavoriteButton - mniejsza wersja tylko z ikoną
 * Użyj gdy brakuje miejsca lub chcesz minimalistyczny wygląd
 *
 * @example
 * ```tsx
 * <CompactFavoriteButton
 *   rckikId={1}
 *   initialIsFavorite={false}
 *   isAuthenticated={true}
 * />
 * ```
 */
export function CompactFavoriteButton({
  rckikId,
  initialIsFavorite,
  isAuthenticated,
  onAuthRequired,
}: FavoriteButtonProps) {
  const handleToast = (options: { message: string; type: 'success' | 'error' | 'info' }) => {
    if (import.meta.env.DEV) {
      console.log(`[Toast ${options.type}]:`, options.message);
    }
  };

  const { isFavorite, toggleFavorite, loading } = useFavoriteToggle(
    rckikId,
    initialIsFavorite,
    onAuthRequired,
    handleToast
  );

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={[
        'inline-flex items-center justify-center p-2 rounded-full',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isFavorite
          ? 'text-red-600 hover:bg-red-50 focus:ring-red-500'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      ].join(' ')}
      aria-label={
        loading
          ? 'Przetwarzanie...'
          : isFavorite
          ? 'Usuń z ulubionych'
          : isAuthenticated
          ? 'Dodaj do ulubionych'
          : 'Zaloguj się, aby dodać do ulubionych'
      }
      aria-pressed={isFavorite}
    >
      {loading ? (
        <svg
          className="w-6 h-6 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
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
      ) : isFavorite ? (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}
