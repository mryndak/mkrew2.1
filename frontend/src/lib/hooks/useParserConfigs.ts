import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminParsersApi } from '@/lib/api/endpoints/adminParsers';
import type {
  ParserConfigDto,
  ParserConfigListResponse,
  ParserConfigRequest,
  ParserConfigFiltersState,
  PaginationState,
  SortConfig,
} from '@/lib/types/parserConfig';

/**
 * Props dla hooka useParserConfigs
 */
interface UseParserConfigsProps {
  initialData?: ParserConfigListResponse;
}

/**
 * Stan zarządzany przez hook
 */
interface ParserConfigsState {
  configs: ParserConfigDto[];
  selectedConfig: ParserConfigDto | null;
  isLoading: boolean;
  error: string | null;
  filters: ParserConfigFiltersState;
  pagination: PaginationState;
  sort: SortConfig;
  isFormModalOpen: boolean;
  formModalMode: 'create' | 'edit';
  editingConfig: ParserConfigDto | null;
  isDeleteConfirmOpen: boolean;
  deletingConfig: ParserConfigDto | null;
}

/**
 * Akcje dostępne w hooku
 */
interface ParserConfigsActions {
  fetchConfigs: () => Promise<void>;
  fetchConfigDetails: (id: number) => Promise<void>;
  createConfig: (data: ParserConfigRequest) => Promise<{ success: boolean; error?: any }>;
  updateConfig: (
    id: number,
    data: Partial<ParserConfigRequest>
  ) => Promise<{ success: boolean; error?: any }>;
  deleteConfig: (id: number) => Promise<void>;
  setFilters: (filters: Partial<ParserConfigFiltersState>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  openCreateModal: () => void;
  openEditModal: (config: ParserConfigDto) => void;
  closeFormModal: () => void;
  openDeleteConfirm: (config: ParserConfigDto) => void;
  closeDeleteConfirm: () => void;
}

/**
 * Wartość zwracana przez hook
 */
interface UseParserConfigsReturn {
  state: ParserConfigsState;
  actions: ParserConfigsActions;
}

/**
 * Domyślne filtry
 */
const DEFAULT_FILTERS: ParserConfigFiltersState = {
  rckikId: null,
  parserType: null,
  active: null,
};

/**
 * Domyślne sortowanie
 */
const DEFAULT_SORT: SortConfig = {
  field: 'rckikName',
  order: 'ASC',
};

/**
 * Custom hook dla zarządzania konfiguracjami parserów
 * Enkapsuluje logikę fetch/create/update/delete oraz zarządzanie stanem
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów dla RCKiK
 */
export function useParserConfigs({
  initialData,
}: UseParserConfigsProps = {}): UseParserConfigsReturn {
  // Stan konfiguracji
  const [configs, setConfigs] = useState<ParserConfigDto[]>(initialData?.content || []);
  const [selectedConfig, setSelectedConfig] = useState<ParserConfigDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stan filtrów, paginacji i sortowania
  const [filters, setFiltersState] = useState<ParserConfigFiltersState>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialData?.page || 0,
    pageSize: 50,
    totalElements: initialData?.totalElements || 0,
    totalPages: initialData?.totalPages || 0,
  });
  const [sort, setSortState] = useState<SortConfig>(DEFAULT_SORT);

  // Stan modali
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'create' | 'edit'>('create');
  const [editingConfig, setEditingConfig] = useState<ParserConfigDto | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState<ParserConfigDto | null>(null);

  /**
   * Generuje string sortowania dla API (format: "field,direction")
   */
  const getSortString = useCallback(() => {
    return `${sort.field},${sort.order.toLowerCase()}`;
  }, [sort]);

  /**
   * Fetch konfiguracji parserów z API
   */
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminParsersApi.getConfigs({
        ...filters,
        page: pagination.currentPage,
        size: pagination.pageSize,
        sort: getSortString(),
      });

      setConfigs(response.content);
      setPagination({
        currentPage: response.page,
        pageSize: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Błąd podczas ładowania konfiguracji parserów';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.pageSize, getSortString]);

  /**
   * Fetch szczegółów konfiguracji (z audit trail i recent runs)
   */
  const fetchConfigDetails = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const config = await adminParsersApi.getConfigDetails(id);
      setSelectedConfig(config);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Błąd podczas ładowania szczegółów konfiguracji';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Tworzy nową konfigurację parsera
   */
  const createConfig = useCallback(
    async (data: ParserConfigRequest) => {
      try {
        const newConfig = await adminParsersApi.createConfig(data);
        toast.success('Konfiguracja parsera została utworzona');

        // Odśwież listę
        await fetchConfigs();

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Błąd podczas tworzenia konfiguracji';
        toast.error(errorMessage);
        return { success: false, error: err };
      }
    },
    [fetchConfigs]
  );

  /**
   * Aktualizuje istniejącą konfigurację parsera
   */
  const updateConfig = useCallback(
    async (id: number, data: Partial<ParserConfigRequest>) => {
      try {
        const updatedConfig = await adminParsersApi.updateConfig(id, data);
        toast.success('Konfiguracja parsera została zaktualizowana');

        // Zaktualizuj listę (optimistic update)
        setConfigs((prev) =>
          prev.map((config) => (config.id === id ? updatedConfig : config))
        );

        // Jeśli edytujemy wybraną konfigurację, zaktualizuj ją
        if (selectedConfig?.id === id) {
          setSelectedConfig(updatedConfig);
        }

        return { success: true };
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Błąd podczas aktualizacji konfiguracji';
        toast.error(errorMessage);

        // Rollback optimistic update
        await fetchConfigs();

        return { success: false, error: err };
      }
    },
    [fetchConfigs, selectedConfig]
  );

  /**
   * Dezaktywuje konfigurację parsera (soft delete)
   */
  const deleteConfig = useCallback(
    async (id: number) => {
      try {
        await adminParsersApi.deleteConfig(id);
        toast.success('Konfiguracja parsera została dezaktywowana');

        // Odśwież listę
        await fetchConfigs();
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Błąd podczas dezaktywacji konfiguracji';
        toast.error(errorMessage);
        throw err;
      }
    },
    [fetchConfigs]
  );

  /**
   * Ustawia filtry
   */
  const setFilters = useCallback((newFilters: Partial<ParserConfigFiltersState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    // Reset do pierwszej strony przy zmianie filtrów
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  }, []);

  /**
   * Resetuje filtry do domyślnych
   */
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  }, []);

  /**
   * Zmienia stronę
   */
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  /**
   * Ustawia sortowanie
   */
  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortState({
      field: field as SortConfig['field'],
      order: direction.toUpperCase() as 'ASC' | 'DESC',
    });
  }, []);

  /**
   * Otwiera modal tworzenia nowej konfiguracji
   */
  const openCreateModal = useCallback(() => {
    setFormModalMode('create');
    setEditingConfig(null);
    setIsFormModalOpen(true);
  }, []);

  /**
   * Otwiera modal edycji konfiguracji
   */
  const openEditModal = useCallback((config: ParserConfigDto) => {
    setFormModalMode('edit');
    setEditingConfig(config);
    setIsFormModalOpen(true);
  }, []);

  /**
   * Zamyka modal formularza
   */
  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingConfig(null);
  }, []);

  /**
   * Otwiera modal potwierdzenia usunięcia
   */
  const openDeleteConfirm = useCallback((config: ParserConfigDto) => {
    setDeletingConfig(config);
    setIsDeleteConfirmOpen(true);
  }, []);

  /**
   * Zamyka modal potwierdzenia usunięcia
   */
  const closeDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setDeletingConfig(null);
  }, []);

  /**
   * Effect: Fetch configs przy zmianie filtrów, paginacji lub sortowania
   */
  useEffect(() => {
    if (!initialData) {
      fetchConfigs();
    }
  }, [filters, pagination.currentPage, sort]);

  // Return state and actions
  return {
    state: {
      configs,
      selectedConfig,
      isLoading,
      error,
      filters,
      pagination,
      sort,
      isFormModalOpen,
      formModalMode,
      editingConfig,
      isDeleteConfirmOpen,
      deletingConfig,
    },
    actions: {
      fetchConfigs,
      fetchConfigDetails,
      createConfig,
      updateConfig,
      deleteConfig,
      setFilters,
      resetFilters,
      setPage,
      setSort,
      openCreateModal,
      openEditModal,
      closeFormModal,
      openDeleteConfirm,
      closeDeleteConfirm,
    },
  };
}
