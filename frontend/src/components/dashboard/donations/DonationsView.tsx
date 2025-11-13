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
} from '@/lib/store/slices/donationsSlice';
import { toast, Toaster } from 'sonner';
import { DonationsHeader } from './DonationsHeader';

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

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (!isInitialized) {
      dispatch(fetchDonations({ page: 0, size: 20, sortOrder: 'DESC' }));
      dispatch(fetchDonationStats());
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  /**
   * Error handling
   */
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="space-y-6">
      {/* Toast container */}
      <Toaster position="top-right" richColors />

      {/* Header with statistics */}
      <DonationsHeader statistics={statistics} isLoading={isLoading} />

      {/* TODO: Toolbar (filters, sort, export) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-gray-500">Toolbar (w budowie)</p>
      </div>

      {/* TODO: Donations Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">
          Tabela donacji (w budowie)
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Liczba donacji: {donations.length}
        </p>
      </div>

      {/* TODO: DonationFormModal */}
      {/* TODO: DeleteConfirmationModal */}
    </div>
  );
}
