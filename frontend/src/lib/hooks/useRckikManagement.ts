import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminRckikApi } from '../api/endpoints/admin';
import { useDebounce } from './useDebounce';
import type {
  RckikDto,
  RckikAdminListResponse,
  CreateRckikRequest,
  UpdateRckikRequest,
  FilterState,
  SortConfig,
  PaginationState,
  ModalState,
} from '@/lib/types/admin';

/**
 * Hook State
 */
interface UseRckikManagementState {
  rckikList: RckikDto[];
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  sort: SortConfig;
  pagination: PaginationState;
  modalState: ModalState;
  availableCities: string[];
}

/**
 * Initial State
 */
const initialState: UseRckikManagementState = {
  rckikList: [],
  isLoading: true,
  error: null,
  filters: {
    search: '',
    city: null,
    active: null,
  },
  sort: {
    field: 'name',
    order: 'ASC',
  },
  pagination: {
    currentPage: 0,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0,
  },
  modalState: {
    type: 'none',
    data: null,
    isSubmitting: false,
  },
  availableCities: [],
};

/**
 * Hook Props
 */
export interface UseRckikManagementProps {
  initialData?: RckikAdminListResponse;
}

/**
 * Hook do zarządzania widokiem administracyjnym RCKiK
 * Obsługuje:
 * - Pobieranie listy centrów RCKiK z API
 * - Filtrowanie, sortowanie, paginacja
 * - Operacje CRUD (create, update, delete)
 * - Zarządzanie modalami (create, edit, delete)
 * - Walidacja formularzy
 * - Synchronizacja z URL params
 *
 * @param initialData - Opcjonalne początkowe dane (z SSR)
 * @returns Stan i akcje do zarządzania RCKiK
 *
 * @example
 * const { state, actions } = useRckikManagement({ initialData });
 * actions.openCreateModal();
 */
export function useRckikManagement(props?: UseRckikManagementProps) {
  const [state, setState] = useState<UseRckikManagementState>(() => {
    if (props?.initialData) {
      return {
        ...initialState,
        rckikList: props.initialData.content,
        pagination: {
          currentPage: props.initialData.page,
          pageSize: props.initialData.size,
          totalElements: props.initialData.totalElements,
          totalPages: props.initialData.totalPages,
        },
        isLoading: false,
      };
    }
    return initialState;
  });

  // Debounce search query (300ms delay)
  const debouncedSearch = useDebounce(state.filters.search, 300);

  /**
   * Parse parametrów z URL
   */
  const getParamsFromUrl = useCallback((): Partial<FilterState & { page: number; size: number }> => {
    if (typeof window === 'undefined') {
      return {};
    }

    const searchParams = new URLSearchParams(window.location.search);
    const params: Partial<FilterState & { page: number; size: number }> = {};

    // Filters
    const search = searchParams.get('search');
    if (search) {
      params.search = search;
    }

    const city = searchParams.get('city');
    if (city) {
      params.city = city;
    }

    const active = searchParams.get('active');
    if (active === 'true') {
      params.active = true;
    } else if (active === 'false') {
      params.active = false;
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
   * Pobieranie listy RCKiK z API
   */
  const fetchRckikList = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await adminRckikApi.list(
        {
          search: debouncedSearch,
          city: state.filters.city,
          active: state.filters.active,
        },
        {
          page: state.pagination.currentPage,
          size: state.pagination.pageSize,
        },
        state.sort
      );

      setState((prev) => ({
        ...prev,
        rckikList: response.content,
        pagination: {
          currentPage: response.page,
          pageSize: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Failed to load RCKiK list:', error);
      setState((prev) => ({
        ...prev,
        error: error?.response?.data?.message || 'Nie udało się załadować listy centrów RCKiK. Spróbuj ponownie.',
        isLoading: false,
      }));
      toast.error('Nie udało się załadować listy centrów RCKiK');
    }
  }, [
    debouncedSearch,
    state.filters.city,
    state.filters.active,
    state.pagination.currentPage,
    state.pagination.pageSize,
    state.sort,
  ]);

  /**
   * Pobieranie listy dostępnych miast dla filtru
   */
  const fetchAvailableCities = useCallback(async () => {
    try {
      const cities = await adminRckikApi.getAvailableCities();
      setState((prev) => ({ ...prev, availableCities: cities }));
    } catch (error) {
      console.error('Failed to load available cities:', error);
    }
  }, []);

  /**
   * Aktualizacja URL params
   */
  const updateUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();

    // Add filters to URL
    if (state.filters.search) {
      params.set('search', state.filters.search);
    }
    if (state.filters.city) {
      params.set('city', state.filters.city);
    }
    if (state.filters.active !== null) {
      params.set('active', state.filters.active.toString());
    }

    // Add pagination to URL
    if (state.pagination.currentPage > 0) {
      params.set('page', state.pagination.currentPage.toString());
    }
    if (state.pagination.pageSize !== 20) {
      params.set('size', state.pagination.pageSize.toString());
    }

    // Update URL bez przeładowania strony
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  }, [state.filters, state.pagination.currentPage, state.pagination.pageSize]);

  /**
   * Actions
   */
  const actions = {
    /**
     * Ustaw filtry
     */
    setFilters: useCallback((filters: Partial<FilterState>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...filters },
        pagination: { ...prev.pagination, currentPage: 0 }, // Reset page przy zmianie filtrów
      }));
    }, []),

    /**
     * Wyczyść filtry
     */
    clearFilters: useCallback(() => {
      setState((prev) => ({
        ...prev,
        filters: {
          search: '',
          city: null,
          active: null,
        },
        pagination: { ...prev.pagination, currentPage: 0 },
      }));
      toast.info('Filtry zostały wyczyszczone');
    }, []),

    /**
     * Zmień pole sortowania (toggle order jeśli to samo pole)
     */
    setSort: useCallback((field: SortConfig['field']) => {
      setState((prev) => ({
        ...prev,
        sort: {
          field,
          order:
            prev.sort.field === field && prev.sort.order === 'ASC'
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
        pagination: { ...prev.pagination, currentPage: page },
      }));
    }, []),

    /**
     * Ustaw rozmiar strony
     */
    setPageSize: useCallback((size: number) => {
      setState((prev) => ({
        ...prev,
        pagination: { ...prev.pagination, pageSize: size, currentPage: 0 }, // Reset page przy zmianie rozmiaru
      }));
    }, []),

    /**
     * Otwórz modal tworzenia
     */
    openCreateModal: useCallback(() => {
      setState((prev) => ({
        ...prev,
        modalState: {
          type: 'create',
          data: null,
          isSubmitting: false,
        },
      }));
    }, []),

    /**
     * Otwórz modal edycji
     */
    openEditModal: useCallback((rckik: RckikDto) => {
      setState((prev) => ({
        ...prev,
        modalState: {
          type: 'edit',
          data: rckik,
          isSubmitting: false,
        },
      }));
    }, []),

    /**
     * Otwórz modal usuwania
     */
    openDeleteModal: useCallback((rckik: RckikDto) => {
      setState((prev) => ({
        ...prev,
        modalState: {
          type: 'delete',
          data: rckik,
          isSubmitting: false,
        },
      }));
    }, []),

    /**
     * Zamknij modal
     */
    closeModal: useCallback(() => {
      setState((prev) => ({
        ...prev,
        modalState: {
          type: 'none',
          data: null,
          isSubmitting: false,
        },
      }));
    }, []),

    /**
     * Utwórz nowe centrum RCKiK
     */
    createRckik: useCallback(
      async (data: CreateRckikRequest) => {
        setState((prev) => ({
          ...prev,
          modalState: { ...prev.modalState, isSubmitting: true },
        }));

        try {
          await adminRckikApi.create(data);
          toast.success('Centrum zostało dodane pomyślnie');

          // Zamknij modal
          setState((prev) => ({
            ...prev,
            modalState: {
              type: 'none',
              data: null,
              isSubmitting: false,
            },
          }));

          // Odśwież listę
          await fetchRckikList();
          // Odśwież listę miast
          await fetchAvailableCities();

          return { success: true };
        } catch (error: any) {
          console.error('Failed to create RCKiK:', error);

          setState((prev) => ({
            ...prev,
            modalState: { ...prev.modalState, isSubmitting: false },
          }));

          const errorMessage = error?.response?.data?.message || 'Nie udało się dodać centrum. Spróbuj ponownie.';
          toast.error(errorMessage);

          return {
            success: false,
            error: errorMessage,
            validationErrors: error?.response?.data?.details || [],
          };
        }
      },
      [fetchRckikList, fetchAvailableCities]
    ),

    /**
     * Zaktualizuj centrum RCKiK
     */
    updateRckik: useCallback(
      async (id: number, data: UpdateRckikRequest) => {
        setState((prev) => ({
          ...prev,
          modalState: { ...prev.modalState, isSubmitting: true },
        }));

        try {
          await adminRckikApi.update(id, data);
          toast.success('Centrum zostało zaktualizowane pomyślnie');

          // Zamknij modal
          setState((prev) => ({
            ...prev,
            modalState: {
              type: 'none',
              data: null,
              isSubmitting: false,
            },
          }));

          // Odśwież listę
          await fetchRckikList();
          // Odśwież listę miast
          await fetchAvailableCities();

          return { success: true };
        } catch (error: any) {
          console.error('Failed to update RCKiK:', error);

          setState((prev) => ({
            ...prev,
            modalState: { ...prev.modalState, isSubmitting: false },
          }));

          const errorMessage = error?.response?.data?.message || 'Nie udało się zaktualizować centrum. Spróbuj ponownie.';
          toast.error(errorMessage);

          return {
            success: false,
            error: errorMessage,
            validationErrors: error?.response?.data?.details || [],
          };
        }
      },
      [fetchRckikList, fetchAvailableCities]
    ),

    /**
     * Usuń centrum RCKiK
     */
    deleteRckik: useCallback(
      async (id: number) => {
        setState((prev) => ({
          ...prev,
          modalState: { ...prev.modalState, isSubmitting: true },
        }));

        try {
          await adminRckikApi.delete(id);
          toast.success('Centrum zostało dezaktywowane pomyślnie');

          // Zamknij modal
          setState((prev) => ({
            ...prev,
            modalState: {
              type: 'none',
              data: null,
              isSubmitting: false,
            },
          }));

          // Odśwież listę
          await fetchRckikList();

          return { success: true };
        } catch (error: any) {
          console.error('Failed to delete RCKiK:', error);

          setState((prev) => ({
            ...prev,
            modalState: { ...prev.modalState, isSubmitting: false },
          }));

          const errorMessage = error?.response?.data?.message || 'Nie udało się usunąć centrum. Spróbuj ponownie.';
          toast.error(errorMessage);

          return {
            success: false,
            error: errorMessage,
          };
        }
      },
      [fetchRckikList]
    ),

    /**
     * Odśwież listę RCKiK
     */
    refreshRckikList: useCallback(() => {
      fetchRckikList();
    }, [fetchRckikList]),

    /**
     * Wyczyść błąd
     */
    clearError: useCallback(() => {
      setState((prev) => ({ ...prev, error: null }));
    }, []),
  };

  /**
   * Effect: Load RCKiK list when filters, pagination, or sort changes
   */
  useEffect(() => {
    fetchRckikList();
  }, [fetchRckikList]);

  /**
   * Effect: Load available cities on mount
   */
  useEffect(() => {
    fetchAvailableCities();
  }, [fetchAvailableCities]);

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
          search: params.search ?? prev.filters.search,
          city: params.city ?? prev.filters.city,
          active: params.active !== undefined ? params.active : prev.filters.active,
        },
        pagination: {
          ...prev.pagination,
          currentPage: params.page ?? prev.pagination.currentPage,
          pageSize: params.size ?? prev.pagination.pageSize,
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
          currentPage: urlParams.page ?? 0,
          pageSize: urlParams.size ?? 20,
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
