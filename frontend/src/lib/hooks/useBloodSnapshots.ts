import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminBloodSnapshotsApi } from '@/lib/api/endpoints/adminBloodSnapshots';
import type {
  BloodSnapshotResponse,
  BloodSnapshotsListResponse,
  CreateBloodSnapshotRequest,
  UpdateBloodSnapshotRequest,
  SnapshotFilters,
  PaginationState,
  StatsData,
  ModalMode,
} from '@/lib/types/bloodSnapshots';

/**
 * Props dla hooka useBloodSnapshots
 */
interface UseBloodSnapshotsProps {
  initialData?: BloodSnapshotsListResponse;
}

/**
 * Stan zarządzany przez hook
 */
interface BloodSnapshotsState {
  snapshots: BloodSnapshotResponse[];
  isLoading: boolean;
  error: string | null;
  filters: SnapshotFilters;
  pagination: PaginationState;
  stats: StatsData;
  isModalOpen: boolean;
  modalMode: ModalMode;
  editingSnapshot: BloodSnapshotResponse | null;
  isDeleteConfirmOpen: boolean;
  deletingSnapshot: BloodSnapshotResponse | null;
}

/**
 * Akcje dostępne w hooku
 */
interface BloodSnapshotsActions {
  fetchSnapshots: () => Promise<void>;
  createSnapshot: (data: CreateBloodSnapshotRequest) => Promise<{ success: boolean; error?: any }>;
  updateSnapshot: (
    id: number,
    data: UpdateBloodSnapshotRequest
  ) => Promise<{ success: boolean; error?: any }>;
  deleteSnapshot: (id: number) => Promise<void>;
  setFilters: (filters: Partial<SnapshotFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  openCreateModal: () => void;
  openEditModal: (snapshot: BloodSnapshotResponse) => void;
  closeModal: () => void;
  openDeleteConfirm: (snapshot: BloodSnapshotResponse) => void;
  closeDeleteConfirm: () => void;
}

/**
 * Wartość zwracana przez hook
 */
interface UseBloodSnapshotsReturn {
  state: BloodSnapshotsState;
  actions: BloodSnapshotsActions;
}

/**
 * Domyślne filtry
 */
const DEFAULT_FILTERS: SnapshotFilters = {
  source: 'manual', // Domyślnie pokazuj tylko ręczne snapshoty
  rckikId: null,
  bloodGroup: null,
  fromDate: null,
  toDate: null,
  createdBy: null,
};

/**
 * Custom hook dla zarządzania Blood Snapshots
 * Enkapsuluje logikę fetch/create/update/delete oraz zarządzanie stanem
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function useBloodSnapshots({
  initialData,
}: UseBloodSnapshotsProps = {}): UseBloodSnapshotsReturn {
  // Stan snapshotów
  const [snapshots, setSnapshots] = useState<BloodSnapshotResponse[]>(
    initialData?.content || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stan filtrów i paginacji
  const [filters, setFiltersState] = useState<SnapshotFilters>(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialData?.page || 0,
    size: 50,
    totalElements: initialData?.totalElements || 0,
    totalPages: initialData?.totalPages || 0,
  });

  // Stan statystyk
  const [stats, setStats] = useState<StatsData>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  // Stan modali
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingSnapshot, setEditingSnapshot] = useState<BloodSnapshotResponse | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingSnapshot, setDeletingSnapshot] = useState<BloodSnapshotResponse | null>(null);

  /**
   * Fetch snapshots z API
   */
  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminBloodSnapshotsApi.listSnapshots({
        ...filters,
        page: pagination.page,
        size: pagination.size,
      });

      setSnapshots(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Błąd podczas ładowania snapshotów';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.size]);

  /**
   * Fetch statystyk
   */
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await adminBloodSnapshotsApi.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      // Nie pokazuj toasta dla błędów statystyk - nie są krytyczne
    }
  }, []);

  /**
   * Tworzenie nowego snapshotu
   */
  const createSnapshot = useCallback(
    async (data: CreateBloodSnapshotRequest) => {
      try {
        await adminBloodSnapshotsApi.createSnapshot(data);

        toast.success('Snapshot został dodany');
        setIsModalOpen(false);
        setEditingSnapshot(null);

        // Odśwież listę i statystyki
        await Promise.all([fetchSnapshots(), fetchStats()]);

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Błąd podczas dodawania snapshotu';
        toast.error(errorMessage);
        return { success: false, error: err };
      }
    },
    [fetchSnapshots, fetchStats]
  );

  /**
   * Aktualizacja snapshotu
   */
  const updateSnapshot = useCallback(
    async (id: number, data: UpdateBloodSnapshotRequest) => {
      try {
        await adminBloodSnapshotsApi.updateSnapshot(id, data);

        toast.success('Snapshot został zaktualizowany');
        setIsModalOpen(false);
        setEditingSnapshot(null);

        // Odśwież listę
        await fetchSnapshots();

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Błąd podczas aktualizacji snapshotu';
        toast.error(errorMessage);
        return { success: false, error: err };
      }
    },
    [fetchSnapshots]
  );

  /**
   * Usuwanie snapshotu
   */
  const deleteSnapshot = useCallback(
    async (id: number) => {
      try {
        await adminBloodSnapshotsApi.deleteSnapshot(id);

        toast.success('Snapshot został usunięty');
        setIsDeleteConfirmOpen(false);
        setDeletingSnapshot(null);

        // Odśwież listę i statystyki
        await Promise.all([fetchSnapshots(), fetchStats()]);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Błąd podczas usuwania snapshotu';
        toast.error(errorMessage);
        setIsDeleteConfirmOpen(false);
        setDeletingSnapshot(null);
      }
    },
    [fetchSnapshots, fetchStats]
  );

  /**
   * Ustawianie filtrów
   */
  const setFilters = useCallback((newFilters: Partial<SnapshotFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
    // Reset do pierwszej strony przy zmianie filtrów
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * Reset filtrów do wartości domyślnych
   */
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * Zmiana strony paginacji
   */
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  /**
   * Otwieranie modalu tworzenia
   */
  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setEditingSnapshot(null);
    setIsModalOpen(true);
  }, []);

  /**
   * Otwieranie modalu edycji
   */
  const openEditModal = useCallback((snapshot: BloodSnapshotResponse) => {
    if (!snapshot.isManual) {
      toast.error('Nie można edytować automatycznego snapshotu');
      return;
    }
    setModalMode('edit');
    setEditingSnapshot(snapshot);
    setIsModalOpen(true);
  }, []);

  /**
   * Zamykanie modalu
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSnapshot(null);
  }, []);

  /**
   * Otwieranie potwierdzenia usunięcia
   */
  const openDeleteConfirm = useCallback((snapshot: BloodSnapshotResponse) => {
    if (!snapshot.isManual) {
      toast.error('Nie można usunąć automatycznego snapshotu');
      return;
    }
    setDeletingSnapshot(snapshot);
    setIsDeleteConfirmOpen(true);
  }, []);

  /**
   * Zamykanie potwierdzenia usunięcia
   */
  const closeDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setDeletingSnapshot(null);
  }, []);

  /**
   * Initial load - pobierz snapshoty i statystyki
   */
  useEffect(() => {
    if (!initialData || initialData.content.length === 0) {
      fetchSnapshots();
    }
    fetchStats();
  }, [fetchSnapshots, fetchStats, initialData]);

  /**
   * Refetch przy zmianie filtrów lub paginacji
   */
  useEffect(() => {
    if (initialData && initialData.content.length > 0) {
      // Skip initial fetch jeśli mamy initial data
      return;
    }
    fetchSnapshots();
  }, [filters, pagination.page]);

  return {
    state: {
      snapshots,
      isLoading,
      error,
      filters,
      pagination,
      stats,
      isModalOpen,
      modalMode,
      editingSnapshot,
      isDeleteConfirmOpen,
      deletingSnapshot,
    },
    actions: {
      fetchSnapshots,
      createSnapshot,
      updateSnapshot,
      deleteSnapshot,
      setFilters,
      resetFilters,
      setPage,
      openCreateModal,
      openEditModal,
      closeModal,
      openDeleteConfirm,
      closeDeleteConfirm,
    },
  };
}
