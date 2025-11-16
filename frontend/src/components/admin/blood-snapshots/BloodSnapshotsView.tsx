import React from 'react';
import { useBloodSnapshots } from '@/lib/hooks/useBloodSnapshots';
import { StatsCards } from './StatsCards';
import { FiltersPanel } from './FiltersPanel';
import { BloodSnapshotTable } from './BloodSnapshotTable';
import { ManualSnapshotModal } from './ManualSnapshotModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { BloodSnapshotsListResponse } from '@/lib/types/bloodSnapshots';

/**
 * Props dla BloodSnapshotsView
 */
interface BloodSnapshotsViewProps {
  initialData?: BloodSnapshotsListResponse;
  userRole: string;
}

/**
 * BloodSnapshotsView - Główny kontener dla widoku ręcznego wprowadzania stanów krwi
 *
 * Integruje wszystkie podkomponenty:
 * - StatsCards (statystyki)
 * - ActionBar (przycisk dodawania + toggle filtrów)
 * - FiltersPanel (panel filtrów)
 * - BloodSnapshotTable (tabela snapshotów)
 * - ManualSnapshotModal (modal dodawania/edycji)
 * - ConfirmDeleteModal (modal potwierdzenia usunięcia)
 *
 * Zarządza stanem poprzez useBloodSnapshots hook:
 * - Filtrowanie, paginacja
 * - Ładowanie danych z API
 * - Operacje CRUD
 * - Otwieranie/zamykanie modali
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function BloodSnapshotsView({ initialData, userRole }: BloodSnapshotsViewProps) {
  // Użyj custom hook do zarządzania stanem
  const { state, actions } = useBloodSnapshots({ initialData });

  return (
    <div className="space-y-6" data-test-id="blood-snapshots-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stany krwi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ręczne wprowadzanie i zarządzanie snapshotami stanów krwi w centrach RCKiK
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={state.stats} isLoading={state.isLoading} />

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
        <button
          onClick={actions.openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Dodaj snapshot
        </button>

        <div className="text-sm text-gray-500">
          Znaleziono: {state.pagination.totalElements} snapshot(ów)
        </div>
      </div>

      {/* Filters Panel */}
      <FiltersPanel
        filters={state.filters}
        onChange={actions.setFilters}
        onReset={actions.resetFilters}
      />

      {/* Blood Snapshot Table */}
      <BloodSnapshotTable
        snapshots={state.snapshots}
        isLoading={state.isLoading}
        onEdit={actions.openEditModal}
        onDelete={actions.openDeleteConfirm}
      />

      {/* Pagination - TODO: Implement proper pagination component */}
      {state.pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => actions.setPage(state.pagination.page - 1)}
              disabled={state.pagination.page === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Poprzednia
            </button>
            <button
              onClick={() => actions.setPage(state.pagination.page + 1)}
              disabled={state.pagination.page >= state.pagination.totalPages - 1}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Następna
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Pokazuję{' '}
                <span className="font-medium">
                  {state.pagination.page * state.pagination.size + 1}
                </span>{' '}
                do{' '}
                <span className="font-medium">
                  {Math.min(
                    (state.pagination.page + 1) * state.pagination.size,
                    state.pagination.totalElements
                  )}
                </span>{' '}
                z <span className="font-medium">{state.pagination.totalElements}</span> wyników
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => actions.setPage(state.pagination.page - 1)}
                  disabled={state.pagination.page === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poprzednia
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Strona {state.pagination.page + 1} z {state.pagination.totalPages}
                </span>
                <button
                  onClick={() => actions.setPage(state.pagination.page + 1)}
                  disabled={state.pagination.page >= state.pagination.totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Następna
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Manual Snapshot Modal (Create/Edit) */}
      <ManualSnapshotModal
        isOpen={state.isModalOpen}
        mode={state.modalMode}
        initialData={state.editingSnapshot || undefined}
        onClose={actions.closeModal}
        onSubmit={async (data) => {
          if (state.modalMode === 'create') {
            await actions.createSnapshot(data as any);
          } else if (state.editingSnapshot) {
            await actions.updateSnapshot(state.editingSnapshot.id, data as any);
          }
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={state.isDeleteConfirmOpen}
        snapshot={state.deletingSnapshot}
        onConfirm={async () => {
          if (state.deletingSnapshot) {
            await actions.deleteSnapshot(state.deletingSnapshot.id);
          }
        }}
        onCancel={actions.closeDeleteConfirm}
      />
    </div>
  );
}
