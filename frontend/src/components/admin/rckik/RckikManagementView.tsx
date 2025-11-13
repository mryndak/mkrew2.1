import React from 'react';
import { toast } from 'react-toastify';
import { useRckikManagement } from '@/lib/hooks/useRckikManagement';
import { RckikFiltersBar } from './RckikFiltersBar';
import { RckikTable } from './RckikTable';
import { RckikPagination } from './RckikPagination';
import { RckikFormModal } from './RckikFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import type { RckikManagementContainerProps } from '@/lib/types/admin';

/**
 * RckikManagementView - Główny kontener dla widoku zarządzania centrami RCKiK
 *
 * Integruje wszystkie podkomponenty:
 * - RckikFiltersBar (panel filtrów)
 * - RckikTable (tabela z centrami)
 * - RckikPagination (paginacja)
 * - RckikFormModal (modal dodawania/edycji)
 * - ConfirmDeleteModal (modal potwierdzenia usunięcia)
 *
 * Zarządza stanem poprzez useRckikManagement hook:
 * - Filtrowanie, sortowanie, paginacja
 * - Ładowanie danych z API
 * - Operacje CRUD
 * - Otwieranie/zamykanie modali
 *
 * US-019: Admin RCKiK Management
 */
export function RckikManagementView({
  initialData,
  userRole,
}: RckikManagementContainerProps) {
  // Użyj custom hook do zarządzania stanem
  const { state, actions } = useRckikManagement({ initialData });

  /**
   * Handler dla submit formularza (create/edit)
   */
  const handleFormSubmit = async (data: any) => {
    if (state.modalState.type === 'create') {
      const result = await actions.createRckik(data);
      if (!result.success) {
        throw result; // Rzuć błąd aby formularz mógł go obsłużyć
      }
    } else if (state.modalState.type === 'edit' && state.modalState.data) {
      const result = await actions.updateRckik(state.modalState.data.id, data);
      if (!result.success) {
        throw result; // Rzuć błąd aby formularz mógł go obsłużyć
      }
    }
  };

  /**
   * Handler dla potwierdzenia usunięcia
   */
  const handleDeleteConfirm = async () => {
    if (state.modalState.data) {
      await actions.deleteRckik(state.modalState.data.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header z przyciskiem "Dodaj nowe centrum" */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zarządzanie centrami RCKiK</h1>
          <p className="mt-1 text-sm text-gray-500">
            Zarządzaj kanoniczną listą Regionalnych Centrów Krwiodawstwa i Krwiolecznictwa
          </p>
        </div>
        <button
          onClick={actions.openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Dodaj nowe centrum
        </button>
      </div>

      {/* Filtry */}
      <RckikFiltersBar
        onFilterChange={(filters) => actions.setFilters(filters)}
        initialFilters={state.filters}
        availableCities={state.availableCities}
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
                onClick={actions.refreshRckikList}
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

      {/* Tabela */}
      <RckikTable
        data={state.rckikList}
        isLoading={state.isLoading}
        sortConfig={state.sort}
        onSortChange={actions.setSort}
        onEdit={actions.openEditModal}
        onDelete={actions.openDeleteModal}
      />

      {/* Paginacja */}
      {!state.isLoading && state.rckikList.length > 0 && (
        <RckikPagination
          currentPage={state.pagination.currentPage}
          totalPages={state.pagination.totalPages}
          pageSize={state.pagination.pageSize}
          totalElements={state.pagination.totalElements}
          onPageChange={actions.setPage}
          onPageSizeChange={actions.setPageSize}
        />
      )}

      {/* Modal formularza (Create/Edit) */}
      <RckikFormModal
        isOpen={state.modalState.type === 'create' || state.modalState.type === 'edit'}
        mode={state.modalState.type === 'create' ? 'create' : 'edit'}
        initialData={state.modalState.data || undefined}
        onClose={actions.closeModal}
        onSubmit={handleFormSubmit}
        isSubmitting={state.modalState.isSubmitting}
      />

      {/* Modal potwierdzenia usunięcia */}
      <ConfirmDeleteModal
        rckik={state.modalState.data}
        isOpen={state.modalState.type === 'delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={actions.closeModal}
        isDeleting={state.modalState.isSubmitting}
      />
    </div>
  );
}
