import { useState, useEffect, useCallback } from 'react';
import { fetchBloodLevelHistory } from '../api/endpoints/rckik';
import type {
  BloodLevelHistoryResponse,
  BloodLevelHistoryDto,
  HistoryTableFilters,
} from '@/types/rckik';

/**
 * Stan hooka useBloodLevelHistory
 */
interface UseBloodLevelHistoryState {
  data: BloodLevelHistoryResponse | null;
  snapshots: BloodLevelHistoryDto[];
  loading: boolean;
  error: Error | null;
}

/**
 * Parametry filtrowania i paginacji
 */
interface UseBloodLevelHistoryParams extends HistoryTableFilters {
  page?: number;
  size?: number;
}

/**
 * Custom hook do pobierania historycznych snapshotów poziomów krwi
 *
 * @param rckikId - ID centrum RCKiK
 * @param params - Parametry filtrowania (bloodGroup, fromDate, toDate) i paginacji (page, size)
 * @param options - Opcje (autoFetch: czy automatycznie pobrać dane przy mount)
 * @returns Obiekt z danymi historii, stanem loading/error i funkcją refetch
 *
 * @example
 * ```tsx
 * const { snapshots, loading, error, refetch, pagination } = useBloodLevelHistory(1, {
 *   bloodGroup: 'A+',
 *   page: 0,
 *   size: 30,
 * });
 *
 * if (loading) return <Skeleton />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 *
 * return <HistoryTable snapshots={snapshots} pagination={pagination} />;
 * ```
 */
export function useBloodLevelHistory(
  rckikId: number | null,
  params: UseBloodLevelHistoryParams = {},
  options: { autoFetch?: boolean } = { autoFetch: true }
) {
  const [state, setState] = useState<UseBloodLevelHistoryState>({
    data: null,
    snapshots: [],
    loading: false,
    error: null,
  });

  /**
   * Funkcja do fetch danych z API
   */
  const fetchData = useCallback(async () => {
    if (rckikId === null) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetchBloodLevelHistory(rckikId, {
        bloodGroup: params.bloodGroup,
        fromDate: params.fromDate,
        toDate: params.toDate,
        page: params.page ?? 0,
        size: params.size ?? 30,
      });

      setState({
        data: response,
        snapshots: response.snapshots,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, [rckikId, params.bloodGroup, params.fromDate, params.toDate, params.page, params.size]);

  /**
   * Auto-fetch przy mount lub zmianie parametrów
   */
  useEffect(() => {
    if (options.autoFetch) {
      fetchData();
    }
  }, [options.autoFetch, fetchData]);

  /**
   * Funkcja do manualnego refetch
   */
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Dane
    data: state.data,
    snapshots: state.snapshots,

    // Paginacja (z response)
    pagination: state.data
      ? {
          page: state.data.page,
          size: state.data.size,
          totalElements: state.data.totalElements,
          totalPages: state.data.totalPages,
          first: state.data.first,
          last: state.data.last,
        }
      : null,

    // Status
    loading: state.loading,
    error: state.error,

    // Akcje
    refetch,
  };
}
