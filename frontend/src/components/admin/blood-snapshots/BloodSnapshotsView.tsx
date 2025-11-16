import React from 'react';
import { useBloodSnapshots } from '@/lib/hooks/useBloodSnapshots';
import { FiltersPanel } from './FiltersPanel';
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

      {/* Stats Cards - TODO: Implement */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Placeholder for StatsCards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Dzisiaj</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {state.isLoading ? '...' : state.stats.today}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ten tydzień</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {state.isLoading ? '...' : state.stats.thisWeek}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ten miesiąc</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {state.isLoading ? '...' : state.stats.thisMonth}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Table - TODO: Implement proper table component */}
      <div className="bg-white shadow rounded-lg">
        {state.isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-sm text-gray-500">Ładowanie...</p>
          </div>
        ) : state.snapshots.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak snapshotów</h3>
            <p className="mt-1 text-sm text-gray-500">
              {state.filters.source === 'all'
                ? 'Nie znaleziono żadnych snapshotów.'
                : 'Zmień filtry lub dodaj nowy snapshot.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RCKiK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupa krwi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poziom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Źródło
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utworzono
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.snapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(snapshot.snapshotDate).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {snapshot.rckikName}
                      </div>
                      <div className="text-sm text-gray-500">{snapshot.rckikCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {snapshot.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {snapshot.levelPercentage.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          snapshot.isManual
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {snapshot.isManual ? 'Ręcznie' : 'Automatycznie'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(snapshot.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {snapshot.isManual && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => actions.openEditModal(snapshot)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => actions.openDeleteConfirm(snapshot)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Usuń
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
