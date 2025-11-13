import React from 'react';
import { StatusBadge } from './StatusBadge';
import { useScraperGlobalStatus } from '@/lib/hooks/scraper/useScraperGlobalStatus';
import {
  formatRelativeTime,
  formatAbsoluteDate,
  isStaleData,
} from '@/lib/utils/scraperHelpers';
import type { ScraperGlobalStatusDto } from '@/lib/types/scraper';

/**
 * ScraperGlobalStatus - Główny komponent wyświetlający globalny status scrapera
 *
 * Features:
 * - Karty z metrykami (Status, Last Success, Recent Runs)
 * - Auto-refresh co 30s (opcjonalny)
 * - Manual refresh button
 * - Alert banner dla prolonged failures
 * - Loading states i error handling
 */

interface ScraperGlobalStatusProps {
  initialData: ScraperGlobalStatusDto;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ScraperGlobalStatus({
  initialData,
  autoRefresh = true,
  refreshInterval = 30000,
}: ScraperGlobalStatusProps) {
  const { status, isRefreshing, error, refetch, lastUpdated } = useScraperGlobalStatus(
    initialData,
    { autoRefresh, refreshInterval }
  );

  // Sprawdź czy dane są aktualne (nie starsze niż 5 minut)
  const dataIsStale = status?.lastSuccessfulTimestamp
    ? isStaleData(status.lastSuccessfulTimestamp, 5)
    : false;

  return (
    <section className="mb-8">
      {/* Alert Banner - Prolonged Failure */}
      {status?.requiresAdminAlert && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Długotrwała awaria scrapera
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{status.message}</p>
                <p className="mt-1">
                  Liczba kolejnych niepowodzeń: <strong>{status.consecutiveFailures}</strong>
                </p>
                <div className="mt-3">
                  <p className="font-medium mb-1">Sugerowane działania:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sprawdź dostępność stron RCKiK</li>
                    <li>Zweryfikuj logi błędów w ostatnich uruchomieniach</li>
                    <li>Rozważ ręczne pobranie danych i import</li>
                    <li>Skontaktuj się z zespołem technicznym</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Status Card */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Status Globalny</h2>
          <div className="flex items-center space-x-3">
            {/* Last Updated */}
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Aktualizacja: {lastUpdated.toLocaleTimeString('pl-PL')}
              </span>
            )}

            {/* Auto-refresh indicator */}
            {autoRefresh && (
              <div className="flex items-center text-xs text-gray-500">
                <svg
                  className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
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
                <span>Auto-odświeżanie</span>
              </div>
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={refetch}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Odśwież status"
            >
              <svg
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
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
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
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
                  Nie udało się pobrać statusu
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

        {/* Stale Data Warning */}
        {dataIsStale && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-yellow-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm text-yellow-800">
                Dane mogą być nieaktualne (brak nowych danych od ponad 5 minut)
              </span>
            </div>
          </div>
        )}

        {/* Status Cards Grid */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Card */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">Status</div>
              <div className="flex items-center mb-2">
                <StatusBadge status={status.globalStatus} size="lg" />
              </div>
              <p className="text-xs text-gray-600 mt-2">{status.message}</p>
            </div>

            {/* Last Successful Run */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">
                Ostatnie udane uruchomienie
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatRelativeTime(status.lastSuccessfulTimestamp)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatAbsoluteDate(status.lastSuccessfulTimestamp)}
              </p>
            </div>

            {/* Recent Runs Summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-2">
                Ostatnie uruchomienia (5)
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-green-600">
                    {status.successfulRecentRuns}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">sukces</span>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-red-600">
                    {status.failedRecentRuns}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">błąd</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Łącznie: {status.totalRecentRuns} uruchomień
              </div>
            </div>
          </div>
        )}

        {/* Loading State (initial render) */}
        {!status && isRefreshing && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Ładowanie statusu...</span>
          </div>
        )}
      </div>
    </section>
  );
}
