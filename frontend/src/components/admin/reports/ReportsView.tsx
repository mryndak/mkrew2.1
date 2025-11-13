import React, { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useReports } from '@/lib/hooks/useReports';
import { ReportsFilters } from './ReportsFilters';
import { ReportsTable } from './ReportsTable';
import type { ReportsViewProps, RckikBasicDto, ReportStatistics } from '@/lib/types/reports';

/**
 * ReportsView - Główny kontener dla widoku raportów użytkowników
 *
 * Integruje wszystkie podkomponenty:
 * - ReportsFilters (panel filtrów)
 * - ReportsTable (tabela z raportami)
 * - Statystyki raportów (nagłówek)
 *
 * Zarządza stanem poprzez useReports hook:
 * - Filtrowanie, sortowanie, paginacja
 * - Ładowanie danych z API
 * - Otwieranie/zamykanie modalu szczegółów
 */

interface ReportsViewComponentProps extends ReportsViewProps {
  rckikOptions: RckikBasicDto[];
  onOpenModal: (reportId: number) => void;
}

export function ReportsView({
  initialData,
  rckikOptions,
  onOpenModal,
}: ReportsViewComponentProps) {
  // Użyj custom hook do zarządzania stanem
  const { state, actions } = useReports({ initialData });

  /**
   * Oblicz statystyki raportów
   */
  const statistics: ReportStatistics = useMemo(() => {
    const total = state.pagination.totalElements;
    const newCount = state.reports.filter((r) => r.status === 'NEW').length;
    const inReviewCount = state.reports.filter((r) => r.status === 'IN_REVIEW').length;
    const resolvedCount = state.reports.filter((r) => r.status === 'RESOLVED').length;
    const rejectedCount = state.reports.filter((r) => r.status === 'REJECTED').length;

    return {
      total,
      new: newCount,
      inReview: inReviewCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
    };
  }, [state.reports, state.pagination.totalElements]);

  /**
   * Handler dla kliknięcia w wiersz tabeli
   */
  const handleRowClick = (reportId: number) => {
    onOpenModal(reportId);
  };

  /**
   * Handler dla clear filters
   */
  const handleClearFilters = () => {
    actions.clearFilters();
    toast.info('Filtry zostały wyczyszczone', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  /**
   * Sprawdź czy są aktywne filtry
   */
  const hasActiveFilters =
    (state.filters.status && state.filters.status !== 'ALL') ||
    state.filters.rckikId !== undefined ||
    state.filters.fromDate !== undefined ||
    state.filters.toDate !== undefined ||
    (state.filters.searchQuery && state.filters.searchQuery.trim() !== '');

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {!state.loading && state.pagination.totalElements > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total */}
          <StatCard
            label="Wszystkie"
            value={statistics.total}
            color="gray"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />

          {/* New */}
          <StatCard
            label="Nowe"
            value={statistics.new}
            color="blue"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          />

          {/* In Review */}
          <StatCard
            label="W weryfikacji"
            value={statistics.inReview}
            color="yellow"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />

          {/* Resolved */}
          <StatCard
            label="Rozwiązane"
            value={statistics.resolved}
            color="green"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />

          {/* Rejected */}
          <StatCard
            label="Odrzucone"
            value={statistics.rejected}
            color="red"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>
      )}

      {/* Filters */}
      <ReportsFilters
        filters={state.filters}
        onFiltersChange={actions.setFilters}
        rckikOptions={rckikOptions}
      />

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Błąd ładowania danych</h3>
              <p className="mt-1 text-sm text-red-700">{state.error}</p>
              <button
                onClick={actions.refreshReports}
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Spróbuj ponownie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <ReportsTable
        reports={state.reports}
        loading={state.loading}
        sortConfig={state.sortConfig}
        onSortChange={actions.toggleSort}
        onRowClick={handleRowClick}
        pagination={state.pagination}
        onPageChange={actions.setPage}
        onPageSizeChange={actions.setPageSize}
      />
    </div>
  );
}

/**
 * StatCard - Komponent karty statystyk
 */
interface StatCardProps {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red';
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
