import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../api/endpoints/reports';
import { useDebounce } from './useDebounce';
import type {
  UserReportDto,
  ReportListResponse,
  ReportsFilterState,
  SortConfig,
  PaginationState,
  UpdateUserReportRequest,
} from '@/lib/types/reports';

/**
 * Hook State
 */
interface UseReportsState {
  reports: UserReportDto[];
  loading: boolean;
  error: string | null;
  filters: ReportsFilterState;
  sortConfig: SortConfig;
  pagination: PaginationState;
  selectedReportId: number | null;
  modalOpen: boolean;
}

/**
 * Initial State
 */
const initialState: UseReportsState = {
  reports: [],
  loading: true,
  error: null,
  filters: {
    status: 'ALL',
    rckikId: undefined,
    fromDate: undefined,
    toDate: undefined,
    searchQuery: '',
  },
  sortConfig: {
    field: 'createdAt',
    order: 'DESC',
  },
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  selectedReportId: null,
  modalOpen: false,
};

/**
 * Hook Props
 */
export interface UseReportsProps {
  initialData?: ReportListResponse;
}

/**
 * Hook do zarządzania widokiem raportów
 * Obsługuje:
 * - Pobieranie listy raportów z API
 * - Filtrowanie, sortowanie, paginacja
 * - Synchronizacja z URL params
 * - Otwieranie/zamykanie modalu szczegółów
 * - Aktualizacja raportów
 *
 * @param initialData - Opcjonalne początkowe dane (z SSR)
 * @returns Stan i akcje do zarządzania raportami
 *
 * @example
 * const { state, actions } = useReports({ initialData });
 * actions.setFilters({ status: 'NEW' });
 */
export function useReports(props?: UseReportsProps) {
  const [state, setState] = useState<UseReportsState>(() => {
    if (props?.initialData) {
      return {
        ...initialState,
        reports: props.initialData.reports || [],
        pagination: {
          page: props.initialData.page ?? 0,
          size: props.initialData.size ?? 20,
          totalElements: props.initialData.totalElements ?? 0,
          totalPages: props.initialData.totalPages ?? 0,
        },
        loading: false,
      };
    }
    return initialState;
  });

  // Debounce search query (300ms delay)
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  /**
   * Parse parametrów z URL
   */
  const getParamsFromUrl = useCallback((): Partial<ReportsFilterState & { page: number; size: number }> => {
    if (typeof window === 'undefined') {
      return {};
    }

    const searchParams = new URLSearchParams(window.location.search);
    const params: Partial<ReportsFilterState & { page: number; size: number }> = {};

    // Filters
    const status = searchParams.get('status');
    if (status && ['NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'ALL'].includes(status)) {
      params.status = status as ReportsFilterState['status'];
    }

    const rckikId = searchParams.get('rckikId');
    if (rckikId) {
      params.rckikId = parseInt(rckikId);
    }

    const fromDate = searchParams.get('fromDate');
    if (fromDate) {
      params.fromDate = fromDate;
    }

    const toDate = searchParams.get('toDate');
    if (toDate) {
      params.toDate = toDate;
    }

    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      params.searchQuery = searchQuery;
    }

    // Pagination
    const page = searchParams.get('page');
    if (page) {
      params.page = Math.max(0, parseInt(page));
    }

    const size = searchParams.get('size');
    if (size) {
      params.size = Math.min(100, Math.max(1, parseInt(size)));
    }

    return params;
  }, []);

  /**
   * Pobieranie raportów z API
   */
  const loadReports = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await reportsApi.getReports(
        {
          status: state.filters.status,
          rckikId: state.filters.rckikId,
          fromDate: state.filters.fromDate,
          toDate: state.filters.toDate,
          searchQuery: debouncedSearchQuery,
        },
        {
          page: state.pagination.page,
          size: state.pagination.size,
        },
        state.sortConfig
      );

      setState((prev) => ({
        ...prev,
        reports: response.reports,
        pagination: {
          page: response.page,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load reports:', error);
      setState((prev) => ({
        ...prev,
        error: 'Nie udało się załadować raportów. Spróbuj ponownie.',
        loading: false,
      }));
    }
  }, [
    state.filters.status,
    state.filters.rckikId,
    state.filters.fromDate,
    state.filters.toDate,
    debouncedSearchQuery,
    state.pagination.page,
    state.pagination.size,
    state.sortConfig,
  ]);

  /**
   * Aktualizacja URL params
   */
  const updateUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    // Add filters to URL
    if (state.filters.status && state.filters.status !== 'ALL') {
      params.set('status', state.filters.status);
    }
    if (state.filters.rckikId) {
      params.set('rckikId', state.filters.rckikId.toString());
    }
    if (state.filters.fromDate) {
      params.set('fromDate', state.filters.fromDate);
    }
    if (state.filters.toDate) {
      params.set('toDate', state.filters.toDate);
    }
    if (state.filters.searchQuery) {
      params.set('search', state.filters.searchQuery);
    }

    // Add pagination to URL
    if (state.pagination.page > 0) {
      params.set('page', state.pagination.page.toString());
    }
    if (state.pagination.size !== 20) {
      params.set('size', state.pagination.size.toString());
    }

    // Update URL bez przeładowania strony
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [state.filters, state.pagination.page, state.pagination.size]);

  /**
   * Actions
   */
  const actions = {
    /**
     * Ustaw filtry
     */
    setFilters: useCallback((filters: Partial<ReportsFilterState>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...filters },
        pagination: { ...prev.pagination, page: 0 }, // Reset page przy zmianie filtrów
      }));
    }, []),

    /**
     * Wyczyść filtry
     */
    clearFilters: useCallback(() => {
      setState((prev) => ({
        ...prev,
        filters: {
          status: 'ALL',
          rckikId: undefined,
          fromDate: undefined,
          toDate: undefined,
          searchQuery: '',
        },
        pagination: { ...prev.pagination, page: 0 },
      }));
    }, []),

    /**
     * Ustaw sortowanie
     */
    setSortConfig: useCallback((sortConfig: SortConfig) => {
      setState((prev) => ({ ...prev, sortConfig }));
    }, []),

    /**
     * Zmień pole sortowania (toggle order jeśli to samo pole)
     */
    toggleSort: useCallback((field: SortConfig['field']) => {
      setState((prev) => ({
        ...prev,
        sortConfig: {
          field,
          order:
            prev.sortConfig.field === field && prev.sortConfig.order === 'ASC'
              ? 'DESC'
              : 'ASC',
        },
      }));
    }, []),

    /**
     * Ustaw stronę
     */
    setPage: useCallback((page: number) => {
      setState((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, page },
      }));
    }, []),

    /**
     * Ustaw rozmiar strony
     */
    setPageSize: useCallback((size: number) => {
      setState((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, size, page: 0 }, // Reset page przy zmianie rozmiaru
      }));
    }, []),

    /**
     * Otwórz modal szczegółów
     */
    openModal: useCallback((reportId: number) => {
      setState((prev) => ({
        ...prev,
        selectedReportId: reportId,
        modalOpen: true,
      }));
    }, []),

    /**
     * Zamknij modal
     */
    closeModal: useCallback(() => {
      setState((prev) => ({
        ...prev,
        selectedReportId: null,
        modalOpen: false,
      }));
    }, []),

    /**
     * Aktualizuj raport
     */
    updateReport: useCallback(
      async (reportId: number, updates: UpdateUserReportRequest) => {
        try {
          await reportsApi.updateReport(reportId, updates);
          // Odśwież listę po aktualizacji
          await loadReports();
          return { success: true };
        } catch (error) {
          console.error('Failed to update report:', error);
          return {
            success: false,
            error: 'Nie udało się zaktualizować raportu. Spróbuj ponownie.',
          };
        }
      },
      [loadReports]
    ),

    /**
     * Odśwież listę raportów
     */
    refreshReports: useCallback(() => {
      loadReports();
    }, [loadReports]),
  };

  /**
   * Effect: Load reports when filters, pagination, or sort changes
   */
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /**
   * Effect: Update URL params when state changes
   */
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  /**
   * Effect: Sync URL params on mount and browser back/forward
   */
  useEffect(() => {
    const params = getParamsFromUrl();
    if (Object.keys(params).length > 0) {
      setState((prev) => ({
        ...prev,
        filters: {
          ...prev.filters,
          ...params,
        },
        pagination: {
          ...prev.pagination,
          page: params.page ?? prev.pagination.page,
          size: params.size ?? prev.pagination.size,
        },
      }));
    }

    const handlePopState = () => {
      const urlParams = getParamsFromUrl();
      setState((prev) => ({
        ...prev,
        filters: {
          ...initialState.filters,
          ...urlParams,
        },
        pagination: {
          ...prev.pagination,
          page: urlParams.page ?? 0,
          size: urlParams.size ?? 20,
        },
      }));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getParamsFromUrl]);

  return {
    state,
    actions,
  };
}
