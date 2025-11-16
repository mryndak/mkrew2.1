import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useParserTest } from '@/lib/hooks/useParserTest';
import { ParseResultsPreview } from './ParseResultsPreview';
import type { TestParserModalProps } from '@/lib/types/parserConfig';

/**
 * TestParserModal - Modal do testowania konfiguracji parsera w trybie dry-run
 *
 * Features:
 * - Opcjonalne pole testUrl (override URL)
 * - Progress indicator podczas testowania
 * - ParseResultsPreview z wynikami (tabela + warnings + errors)
 * - TestSummaryCard z metrykami (execution time, HTTP status, groups found, success rate)
 * - Przycisk "Zapisz wyniki do bazy" (tylko jeśli test SUCCESS)
 * - Przycisk "Uruchom test" i "Zamknij"
 *
 * US-029, US-030: Testowanie parserów przed aktywacją
 */
export function TestParserModal({
  isOpen,
  configId,
  onClose,
  onSaveResults,
}: TestParserModalProps) {
  const [testUrl, setTestUrl] = useState('');
  const { state, actions } = useParserTest();

  /**
   * Reset state when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      actions.reset();
      setTestUrl('');
    }
  }, [isOpen, actions]);

  /**
   * Handle test execution
   */
  const handleRunTest = async () => {
    await actions.runTest(configId, testUrl || undefined);
  };

  /**
   * Handle save results to database
   */
  const handleSaveResults = async () => {
    await actions.saveResults(configId, testUrl || undefined);
    if (onSaveResults && state.testResult) {
      await onSaveResults(state.testResult.testId);
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-600';
      case 'PARTIAL':
        return 'text-yellow-600';
      case 'FAILED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  /**
   * Footer buttons
   */
  const footer = (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onClose}
        disabled={state.isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Zamknij
      </button>

      <div className="flex items-center gap-3">
        {/* Save Results Button - tylko jeśli test SUCCESS i nie został zapisany */}
        {state.testResult &&
          state.testResult.status === 'SUCCESS' &&
          !state.testResult.summary.saved && (
            <button
              type="button"
              onClick={handleSaveResults}
              disabled={state.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isLoading ? 'Zapisywanie...' : 'Zapisz wyniki do bazy'}
            </button>
          )}

        {/* Run Test Button */}
        <button
          type="button"
          onClick={handleRunTest}
          disabled={state.isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.isLoading ? 'Testowanie...' : state.hasRun ? 'Uruchom ponownie' : 'Uruchom test'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Testowanie parsera"
      size="large"
      footer={footer}
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        {/* Test URL Override */}
        <div>
          <label htmlFor="testUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Test URL (opcjonalnie)
          </label>
          <input
            id="testUrl"
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            disabled={state.isLoading}
            placeholder="https://... (zostaw puste, aby użyć URL z konfiguracji)"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Możesz podać inny URL do testowania parsera (np. do testów na staging)
          </p>
        </div>

        {/* Loading State */}
        {state.isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 font-medium">Parsowanie w toku...</p>
                <p className="text-xs text-blue-600 mt-1">
                  Trwa pobieranie i parsowanie danych ze strony źródłowej
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
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

        {/* Test Results */}
        {state.testResult && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Podsumowanie testu</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className={`text-lg font-semibold ${getStatusColor(state.testResult.status)}`}>
                    {state.testResult.status === 'SUCCESS'
                      ? 'Sukces'
                      : state.testResult.status === 'PARTIAL'
                      ? 'Częściowy'
                      : 'Błąd'}
                  </div>
                </div>

                {/* Execution Time */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Czas wykonania</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {state.testResult.executionTimeMs}ms
                  </div>
                </div>

                {/* HTTP Status */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">HTTP Status</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {state.testResult.httpStatusCode}
                  </div>
                </div>

                {/* Groups Found */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Grupy krwi</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {state.testResult.summary.totalGroupsFound}/{state.testResult.summary.totalGroupsExpected}
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Skuteczność parsowania</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {state.testResult.summary.totalGroupsExpected > 0
                      ? (
                          (state.testResult.summary.totalGroupsFound /
                            state.testResult.summary.totalGroupsExpected) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      state.testResult.status === 'SUCCESS'
                        ? 'bg-green-600'
                        : state.testResult.status === 'PARTIAL'
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{
                      width: `${
                        state.testResult.summary.totalGroupsExpected > 0
                          ? (state.testResult.summary.totalGroupsFound /
                              state.testResult.summary.totalGroupsExpected) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Saved Status */}
              {state.testResult.summary.saved && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-green-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Wyniki zostały zapisane do bazy danych
                  </div>
                </div>
              )}
            </div>

            {/* Parsed Data Preview */}
            <ParseResultsPreview
              parsedData={state.testResult.parsedData}
              warnings={state.testResult.warnings}
              errors={state.testResult.errors}
            />
          </div>
        )}

        {/* Initial State */}
        {!state.hasRun && !state.isLoading && (
          <div className="text-center py-8 text-gray-500">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-sm">Kliknij "Uruchom test", aby przetestować parser</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
