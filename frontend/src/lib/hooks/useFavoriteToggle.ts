import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addFavorite,
  removeFavorite,
  optimisticAddFavorite,
  optimisticRemoveFavorite,
  rollbackOptimisticUpdate,
  selectIsFavorite,
  selectFavoritesLoading,
} from '../store/slices/favoritesSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';

/**
 * Typ dla toast notification (do integracji z toast system)
 */
type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type: ToastType;
}

/**
 * Custom hook do zarządzania dodawaniem/usuwaniem centrum z ulubionych
 * Implementuje optimistic updates z rollback przy błędzie
 *
 * @param rckikId - ID centrum RCKiK
 * @param initialIsFavorite - Początkowy stan (czy centrum jest w ulubionych)
 * @param onAuthRequired - Callback wywoływany gdy użytkownik nie jest zalogowany
 * @param onToast - Callback do wyświetlania toast notifications (opcjonalny)
 * @returns Obiekt z stanem isFavorite, funkcją toggleFavorite i loading state
 *
 * @example
 * ```tsx
 * const { isFavorite, toggleFavorite, loading } = useFavoriteToggle(
 *   rckikId,
 *   initialIsFavorite,
 *   () => router.push('/login?returnUrl=/rckik/1'),
 *   (message, type) => toast(message, { type })
 * );
 *
 * return (
 *   <button onClick={toggleFavorite} disabled={loading}>
 *     {isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
 *   </button>
 * );
 * ```
 */
export function useFavoriteToggle(
  rckikId: number,
  initialIsFavorite: boolean = false,
  onAuthRequired?: () => void,
  onToast?: (options: ToastOptions) => void
) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isFavoriteFromStore = useAppSelector(selectIsFavorite(rckikId));
  const globalLoading = useAppSelector(selectFavoritesLoading);

  // Local loading state dla tego konkretnego przycisku
  const [localLoading, setLocalLoading] = useState(false);

  // Stan isFavorite - używamy store jeśli dostępny, inaczej initial value
  const isFavorite = isFavoriteFromStore ?? initialIsFavorite;

  /**
   * Toggle favorite z optimistic update
   */
  const toggleFavorite = useCallback(async () => {
    // Sprawdź czy użytkownik jest zalogowany
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    setLocalLoading(true);
    const wasAdded = !isFavorite;

    try {
      if (wasAdded) {
        // DODAWANIE do ulubionych

        // 1. Optimistic update - natychmiastowa zmiana UI
        dispatch(optimisticAddFavorite(rckikId));

        // 2. API request
        await dispatch(addFavorite({ rckikId })).unwrap();

        // 3. Sukces - pokaż toast
        onToast?.({
          message: 'Dodano do ulubionych',
          type: 'success',
        });
      } else {
        // USUWANIE z ulubionych

        // 1. Optimistic update - natychmiastowa zmiana UI
        dispatch(optimisticRemoveFavorite(rckikId));

        // 2. API request
        await dispatch(removeFavorite(rckikId)).unwrap();

        // 3. Sukces - pokaż toast
        onToast?.({
          message: 'Usunięto z ulubionych',
          type: 'success',
        });
      }
    } catch (error: any) {
      // BŁĄD - rollback optimistic update

      dispatch(rollbackOptimisticUpdate({ rckikId, wasAdded }));

      // Wyświetl toast z komunikatem błędu
      const errorMessage = error.message || error || 'Wystąpił błąd';
      onToast?.({
        message: errorMessage,
        type: 'error',
      });

      // Log błędu w development
      if (import.meta.env.DEV) {
        console.error('useFavoriteToggle error:', error);
      }
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, rckikId, isFavorite, isAuthenticated, onAuthRequired, onToast]);

  return {
    isFavorite,
    toggleFavorite,
    loading: localLoading || globalLoading,
    isAuthenticated,
  };
}

/**
 * Helper hook do integracji z React Toast (np. react-hot-toast, sonner)
 * Używaj tego zamiast przekazywać onToast ręcznie
 *
 * @example
 * ```tsx
 * import toast from 'react-hot-toast';
 *
 * const showToast = useFavoriteToast();
 * const { isFavorite, toggleFavorite, loading } = useFavoriteToggle(
 *   rckikId,
 *   initialIsFavorite,
 *   () => router.push('/login'),
 *   showToast
 * );
 * ```
 */
export function useFavoriteToast() {
  return useCallback((options: ToastOptions) => {
    // TODO: Integracja z toast system (np. react-hot-toast)
    // toast[options.type](options.message);

    // Fallback: console w development
    if (import.meta.env.DEV) {
      console.log(`[Toast ${options.type}]:`, options.message);
    }
  }, []);
}
