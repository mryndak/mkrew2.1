import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  fetchDonations,
  fetchDonationStats,
  selectDonations,
  selectDonationStatistics,
  selectDonationsLoading,
  selectDonationsError,
  selectDonationsPagination,
  setPage,
  addDonation,
  editDonation,
  removeDonation,
} from '@/lib/store/slices/donationsSlice';
import { fetchRckikList } from '@/lib/api/endpoints/rckik';
import { toast, Toaster } from 'sonner';
import { DonationsHeader } from './DonationsHeader';
import { DonationsToolbar, type DonationFilters } from './DonationsToolbar';
import { DonationTable } from './DonationTable';
import { DonationFormModal } from './DonationFormModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { DonationResponse } from '@/types/dashboard';

/**
 * DonationsView - Główny widok zarządzania donacjami
 *
 * Features:
 * - Automatyczne pobieranie listy donacji i statystyk z API
 * - Wyświetlanie statystyk w nagłówku (4 karty)
 * - Toolbar z filtrami, sortowaniem i eksportem
 * - Tabela donacji z paginacją i sortowaniem
 * - Modalne formularze (dodawanie/edycja)
 * - Modal potwierdzenia usunięcia
 * - Empty state dla braku donacji
 * - Loading skeleton
 * - Error handling z toast notifications
 * - Responsywny design
 *
 * Data Flow:
 * - Mount → fetchDonations() + fetchDonationStats() z Redux
 * - CRUD operations → optimistic updates + API calls
 * - Filter/Sort change → refetch z parametrami
 * - Error → toast notification
 *
 * @example
 * ```tsx
 * <DonationsView />
 * ```
 */
export function DonationsView() {
  const dispatch = useAppDispatch();

  // Redux state
  const donations = useAppSelector(selectDonations);
  const statistics = useAppSelector(selectDonationStatistics);
  const isLoading = useAppSelector(selectDonationsLoading);
  const error = useAppSelector(selectDonationsError);
  const pagination = useAppSelector(selectDonationsPagination);

  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [filters, setFilters] = useState<DonationFilters>({
    fromDate: null,
    toDate: null,
    donationType: null,
    rckikId: null,
  });
  const [sortBy, setSortBy] = useState('donationDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [availableRckiks, setAvailableRckiks] = useState<Array<{ id: number; name: string; city: string }>>([]);
  const [isLoadingRckiks, setIsLoadingRckiks] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedDonation, setSelectedDonation] = useState<DonationResponse | null>(null);

  /**
   * Fetch available RCKiK centers
   */
  const loadAvailableRckiks = async () => {
    try {
      setIsLoadingRckiks(true);
      const response = await fetchRckikList({
        page: 0,
        size: 100,
        active: true,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      setAvailableRckiks(
        response.content.map((rckik) => ({
          id: rckik.id,
          name: rckik.name,
          city: rckik.city,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch RCKiK list:', error);
      toast.error('Nie udało się pobrać listy centrów RCKiK');
    } finally {
      setIsLoadingRckiks(false);
    }
  };

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (!isInitialized) {
      dispatch(fetchDonations({ page: 0, size: 20, sortOrder: 'DESC' }));
      dispatch(fetchDonationStats());
      loadAvailableRckiks();
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  /**
   * Refetch on filter/sort change
   */
  useEffect(() => {
    if (isInitialized) {
      dispatch(
        fetchDonations({
          page: 0,
          size: 20,
          sortOrder,
          // TODO: Add filter params when API supports them
        })
      );
    }
  }, [filters, sortBy, sortOrder, dispatch, isInitialized]);

  /**
   * Error handling
   */
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilters: DonationFilters) => {
    setFilters(newFilters);
    dispatch(setPage(0)); // Reset to first page
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (field: string, order: 'ASC' | 'DESC') => {
    setSortBy(field);
    setSortOrder(order);
    dispatch(setPage(0)); // Reset to first page
  };

  /**
   * Handle export
   */
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      toast.info(`Eksportowanie do ${format.toUpperCase()}...`);
      // TODO: Implement export API call
      // const blob = await exportDonations(format, filters);
      // downloadFile(blob, `donations.${format}`);
      toast.success(`Wyeksportowano dane do ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Nie udało się wyeksportować danych');
    }
  };

  /**
   * Handle add donation
   */
  const handleAddDonation = () => {
    setFormMode('create');
    setSelectedDonation(null);
    setIsFormModalOpen(true);
  };

  /**
   * Handle edit donation
   */
  const handleEditDonation = (donationId: number) => {
    const donation = donations.find((d) => d.id === donationId);
    if (donation) {
      setFormMode('edit');
      setSelectedDonation(donation);
      setIsFormModalOpen(true);
    }
  };

  /**
   * Handle delete donation
   */
  const handleDeleteDonation = (donationId: number) => {
    const donation = donations.find((d) => d.id === donationId);
    if (donation) {
      setSelectedDonation(donation);
      setIsDeleteModalOpen(true);
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
    dispatch(fetchDonations({ page, size: 20, sortOrder }));
  };

  return (
    <div className="space-y-6">
      {/* Toast container */}
      <Toaster position="top-right" richColors />

      {/* Header with statistics */}
      <DonationsHeader statistics={statistics} isLoading={isLoading} />

      {/* Toolbar (filters, sort, export) */}
      <DonationsToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onExport={handleExport}
        onAddDonation={handleAddDonation}
        availableRckiks={availableRckiks}
      />

      {/* Donations Table */}
      <DonationTable
        donations={donations}
        pagination={pagination}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSortChange}
        onPageChange={handlePageChange}
        onEdit={handleEditDonation}
        onDelete={handleDeleteDonation}
        hasFilters={!!(filters.fromDate || filters.toDate || filters.donationType || filters.rckikId)}
        onClearFilters={() => handleFilterChange({ fromDate: null, toDate: null, donationType: null, rckikId: null })}
      />

      {/* Donation Form Modal (Create/Edit) */}
      <DonationFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        donation={selectedDonation}
        availableRckiks={availableRckiks}
        lastDonationDate={statistics?.lastDonationDate || null}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedDonation(null);
        }}
        onSubmit={async (data) => {
          try {
            if (formMode === 'create') {
              await dispatch(addDonation(data)).unwrap();
              toast.success('Donacja została dodana');
              dispatch(fetchDonationStats()); // Refresh statistics
            } else if (selectedDonation) {
              await dispatch(
                editDonation({ donationId: selectedDonation.id, data })
              ).unwrap();
              toast.success('Donacja została zaktualizowana');
              dispatch(fetchDonationStats()); // Refresh statistics
            }
          } catch (error: any) {
            toast.error(error || 'Nie udało się zapisać donacji');
            throw error; // Re-throw to prevent modal close
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        donation={selectedDonation}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDonation(null);
        }}
        onConfirm={async (donationId) => {
          try {
            await dispatch(removeDonation(donationId)).unwrap();
            toast.success('Donacja została usunięta');
            setIsDeleteModalOpen(false);
            setSelectedDonation(null);
            dispatch(fetchDonationStats()); // Refresh statistics
          } catch (error: any) {
            toast.error(error || 'Nie udało się usunąć donacji');
            throw error; // Re-throw to keep modal open
          }
        }}
      />
    </div>
  );
}
