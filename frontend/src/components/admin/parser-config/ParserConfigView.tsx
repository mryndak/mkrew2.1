import React, { useState } from 'react';
import { useParserConfigs } from '@/lib/hooks/useParserConfigs';
import { ParserConfigFilters } from './ParserConfigFilters';
import { ParserConfigTable } from './ParserConfigTable';
import { ParserConfigFormModal } from './ParserConfigFormModal';
import { TestParserModal } from './TestParserModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { ParserConfigListResponse, ParserConfigDto } from '@/lib/types/parserConfig';

/**
 * Props dla ParserConfigView
 */
interface ParserConfigViewProps {
  initialData?: ParserConfigListResponse;
  userRole: string;
}

/**
 * ParserConfigView - Główny kontener dla widoku zarządzania konfiguracją parserów
 *
 * Integruje wszystkie podkomponenty:
 * - ParserConfigFilters (panel filtrów)
 * - ParserConfigTable (tabela konfiguracji)
 * - ParserConfigFormModal (modal tworzenia/edycji)
 * - ConfirmModal (modal potwierdzenia usunięcia)
 * - TestParserModal (modal testowania - TODO)
 *
 * Zarządza stanem poprzez useParserConfigs hook:
 * - Filtrowanie, paginacja, sortowanie
 * - Ładowanie danych z API
 * - Operacje CRUD
 * - Otwieranie/zamykanie modali
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów dla RCKiK
 */
export function ParserConfigView({ initialData, userRole }: ParserConfigViewProps) {
  // Użyj custom hook do zarządzania stanem
  const { state, actions } = useParserConfigs({ initialData });

  // Stan dla TestParserModal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testingConfig, setTestingConfig] = useState<ParserConfigDto | null>(null);

  /**
   * Handler dla zapisania formularza (create/edit)
   */
  const handleFormSave = async (data: any) => {
    if (state.formModalMode === 'create') {
      const result = await actions.createConfig(data);
      if (result.success) {
        actions.closeFormModal();
      }
    } else {
      const configId = state.editingConfig?.id;
      if (configId) {
        const result = await actions.updateConfig(configId, data);
        if (result.success) {
          actions.closeFormModal();
        }
      }
    }
  };

  /**
   * Handler dla potwierdzenia usunięcia
   */
  const handleDeleteConfirm = async () => {
    if (state.deletingConfig) {
      try {
        await actions.deleteConfig(state.deletingConfig.id);
        actions.closeDeleteConfirm();
      } catch (err) {
        // Error już obsłużony w hooku (toast)
        console.error('Delete failed:', err);
      }
    }
  };

  /**
   * Handler dla otwarcia modalu testowania
   */
  const handleOpenTestModal = (config: ParserConfigDto) => {
    setTestingConfig(config);
    setTestModalOpen(true);
  };

  /**
   * Handler dla zamknięcia modalu testowania
   */
  const handleCloseTestModal = () => {
    setTestModalOpen(false);
    setTestingConfig(null);
  };

  /**
   * Handler dla zapisania wyników testu
   */
  const handleSaveTestResults = async (testId: string) => {
    // Odśwież listę konfiguracji po zapisaniu wyników testu
    await actions.fetchConfigs();
  };

  return (
    <div className="space-y-6" data-test-id="parser-config-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konfiguracja parserów</h1>
          <p className="mt-1 text-sm text-gray-500">
            Zarządzanie konfiguracją parserów dla automatycznego pobierania stanów krwi z centrów
            RCKiK
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
        <button
          onClick={actions.openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
          Dodaj konfigurację parsera
        </button>

        <div className="text-sm text-gray-500">
          Znaleziono: {state.pagination.totalElements} konfiguracji
        </div>
      </div>

      {/* Filters Panel */}
      <ParserConfigFilters
        onFiltersChange={actions.setFilters}
        initialFilters={state.filters}
      />

      {/* Error Alert */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Wystąpił błąd</h3>
              <div className="mt-2 text-sm text-red-700">{state.error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Parser Config Table */}
      <ParserConfigTable
        configs={state.configs}
        totalElements={state.pagination.totalElements}
        currentPage={state.pagination.currentPage}
        pageSize={state.pagination.pageSize}
        isLoading={state.isLoading}
        onPageChange={actions.setPage}
        onSort={actions.setSort}
        onEdit={actions.openEditModal}
        onTest={handleOpenTestModal}
        onDelete={actions.openDeleteConfirm}
      />

      {/* Pagination */}
      {state.pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => actions.setPage(state.pagination.currentPage - 1)}
              disabled={state.pagination.currentPage === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Poprzednia
            </button>
            <button
              onClick={() => actions.setPage(state.pagination.currentPage + 1)}
              disabled={state.pagination.currentPage >= state.pagination.totalPages - 1}
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
                  {state.pagination.currentPage * state.pagination.pageSize + 1}
                </span>{' '}
                do{' '}
                <span className="font-medium">
                  {Math.min(
                    (state.pagination.currentPage + 1) * state.pagination.pageSize,
                    state.pagination.totalElements
                  )}
                </span>{' '}
                z <span className="font-medium">{state.pagination.totalElements}</span> wyników
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => actions.setPage(state.pagination.currentPage - 1)}
                  disabled={state.pagination.currentPage === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poprzednia
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Strona {state.pagination.currentPage + 1} z {state.pagination.totalPages}
                </span>
                <button
                  onClick={() => actions.setPage(state.pagination.currentPage + 1)}
                  disabled={state.pagination.currentPage >= state.pagination.totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Następna
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Create/Edit) */}
      <ParserConfigFormModal
        isOpen={state.isFormModalOpen}
        mode={state.formModalMode}
        initialData={state.editingConfig || undefined}
        onClose={actions.closeFormModal}
        onSave={handleFormSave}
      />

      {/* Test Parser Modal */}
      {testingConfig && (
        <TestParserModal
          isOpen={testModalOpen}
          configId={testingConfig.id}
          onClose={handleCloseTestModal}
          onSaveResults={handleSaveTestResults}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={state.isDeleteConfirmOpen}
        title="Dezaktywować parser?"
        message={
          state.deletingConfig
            ? `Czy na pewno chcesz dezaktywować parser dla ${state.deletingConfig.rckikName}? Parser zostanie wyłączony (soft delete). Istniejące snapshoty pozostaną w bazie.`
            : ''
        }
        confirmText="Dezaktywuj"
        cancelText="Anuluj"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={actions.closeDeleteConfirm}
      />
    </div>
  );
}
