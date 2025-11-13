import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchRckikDetails,
  selectCurrentRckik,
  selectRckikLoading,
  selectRckikError,
  selectIsRckikDataFresh,
  clearCurrentRckik,
} from '../store/slices/rckikSlice';

/**
 * Custom hook do pobierania i cache'owania szczegółów centrum RCKiK
 *
 * @param rckikId - ID centrum RCKiK do pobrania
 * @param options - Opcje (autoFetch: czy automatycznie pobrać dane przy mount)
 * @returns Obiekt z danymi centrum, stanem loading/error i funkcją refetch
 *
 * @example
 * ```tsx
 * const { rckik, loading, error, refetch } = useRckikDetails(1);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 * if (!rckik) return null;
 *
 * return <RckikHeader rckik={rckik} />;
 * ```
 */
export function useRckikDetails(
  rckikId: number | null,
  options: { autoFetch?: boolean } = { autoFetch: true }
) {
  const dispatch = useAppDispatch();
  const rckik = useAppSelector(selectCurrentRckik);
  const loading = useAppSelector(selectRckikLoading);
  const error = useAppSelector(selectRckikError);
  const isDataFresh = useAppSelector(selectIsRckikDataFresh);

  /**
   * Funkcja do manualnego refetch danych
   */
  const refetch = () => {
    if (rckikId !== null) {
      dispatch(fetchRckikDetails(rckikId));
    }
  };

  /**
   * Auto-fetch przy mount lub zmianie ID
   * Pomija fetch jeśli dane są świeże (poniżej 5 minut)
   */
  useEffect(() => {
    if (options.autoFetch && rckikId !== null) {
      // Jeśli dane są świeże i ID się zgadza, nie fetch ponownie
      if (rckik?.id === rckikId && isDataFresh) {
        return;
      }

      // Fetch nowych danych
      dispatch(fetchRckikDetails(rckikId));
    }

    // Cleanup: wyczyść dane przy unmount (opcjonalnie)
    return () => {
      // Możesz odkomentować poniższą linię jeśli chcesz czyścić cache przy unmount
      // dispatch(clearCurrentRckik());
    };
  }, [rckikId, options.autoFetch, dispatch]);

  return {
    rckik,
    loading,
    error,
    refetch,
    isDataFresh,
  };
}
