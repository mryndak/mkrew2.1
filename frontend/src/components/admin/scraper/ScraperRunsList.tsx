import React, { useState } from 'react';
import { FiltersBar } from './FiltersBar';
import { RunsTable } from './RunsTable';
import { Pagination } from './Pagination';
import { useScraperRuns } from '@/lib/hooks/scraper/useScraperRuns';
import type { ScraperRunDto, RunsFilters, RunsListResponse } from '@/lib/types/scraper';

/**
 * ScraperRunsList - Główny komponent listy uruchomień scrapera
 *
 * Features:
 * - Integracja FiltersBar + RunsTable + Pagination
 * - useScraperRuns hook z auto-refresh
 * - Auto-refresh indicator dla running runs
 * - Callback do otwierania szczegółów runa
 * - Error handling
 *
 * Usage:
 * ```tsx
 * <ScraperRunsList
 *   initialRuns={runsData.runs}
 *   initialPage={runsData.page}
 *   initialTotalPages={runsData.totalPages}
 *   initialTotalElements={runsData.totalElements}
 *   initialFilters={{}}
 *   onViewDetails={(runId) => setSelectedRunId(runId)}
 * />
 * ```
 */

interface ScraperRunsListProps {
  initialRuns: ScraperRunDto[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalElements: number;
  initialFilters: RunsFilters;
  onViewDetails?: (runId: number) => void;
}

export function ScraperRunsList({
  initialRuns,
  initialPage,
  initialTotalPages,
  initialTotalElements,
  initialFilters,
  onViewDetails,
}: ScraperRunsListProps) {
  const {
    runs,
    filters,
    pagination,
    totalPages,
    totalElements,
    isLoading,
    error,
    hasRunningRun,
    updateFilters,
    changePage,
    refetch,
  } = useScraperRuns({
    initialData: {
      runs: initialRuns,
      page: initialPage,
      totalPages: initialTotalPages,
      totalElements: initialTotalElements,
    },
    initialFilters,
  });

  const handleViewDetails = (runId: number) => {
    onViewDetails?.(runId);
  };

  return (
    <section className="space-y-4">
      {/* Header with title and auto-refresh indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Historia uruchomień</h2>
          <p className="mt-1 text-sm text-gray-500">
            Łącznie: <span className="font-medium">{totalElements}</span> uruchomień
          </p>
        </div>

        {/* Auto-refresh indicator */}
        {hasRunningRun && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center text-blue-600">
              <svg
                className="animate-spin h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="font-medium">Auto-odświeżanie co 10s</span>
            </div>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
              aria-label="Odśwież listę"
              title="Odśwież teraz"
            >
              <svg
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <FiltersBar filters={filters} onFiltersChange={updateFilters} />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Nie udało się pobrać listy uruchomień
              </h3>
              <p className="mt-1 text-sm text-red-700">{error.message}</p>
              <button
                onClick={refetch}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="relative">
          <RunsTable
            runs={runs}
            isLoading={isLoading && runs.length === 0}
            onViewDetails={handleViewDetails}
          />

          {/* Loading overlay for existing data */}
          {isLoading && runs.length > 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3">
                <svg
                  className="animate-spin h-5 w-5 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm text-gray-700">Odświeżanie...</span>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {runs.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={changePage}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Info message when no active filters and no results */}
      {runs.length === 0 && !isLoading && !error && Object.keys(filters).length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Nie znaleziono żadnych uruchomień scrapera w systemie.
                Użyj przycisku <strong>"Uruchom Scraper"</strong> powyżej aby rozpocząć pierwsze uruchomienie.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
