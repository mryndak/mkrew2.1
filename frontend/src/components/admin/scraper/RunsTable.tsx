import React from 'react';
import { StatusBadge, PulsatingStatusBadge } from './StatusBadge';
import {
  formatRelativeTime,
  formatShortDate,
  formatDuration,
  calculateSuccessRate,
  getSuccessRateColor,
} from '@/lib/utils/scraperHelpers';
import type { ScraperRunDto } from '@/lib/types/scraper';

/**
 * RunsTable - Tabela wyświetlająca listę uruchomień scrapera
 *
 * Features:
 * - Kolumny: ID, Type, Started At, Duration, Success Rate, Status, Actions
 * - Success rate z progress bar
 * - Relative time + absolute time w tooltip
 * - Przycisk "Szczegóły" dla każdego runa
 * - Empty state
 * - Loading skeleton
 */

interface RunsTableProps {
  runs: ScraperRunDto[];
  isLoading: boolean;
  onViewDetails: (runId: number) => void;
}

export function RunsTable({ runs, isLoading, onViewDetails }: RunsTableProps) {
  if (isLoading && runs.length === 0) {
    return <LoadingSkeleton />;
  }

  if (runs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto" data-test-id="admin-scraper-runs-table">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Typ
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Rozpoczęty
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Czas trwania
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Sukces
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {runs.map((run) => {
            const successRate = calculateSuccessRate(run.successfulCount, run.totalRckiks);
            const successRateColor = getSuccessRateColor(successRate);

            return (
              <tr key={run.id} className="hover:bg-gray-50 transition-colors" data-test-id="admin-scraper-run-row">
                {/* ID */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-test-id="admin-scraper-run-id">
                  #{run.id}
                </td>

                {/* Type */}
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      run.runType === 'SCHEDULED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {run.runType === 'SCHEDULED' ? 'Zaplanowany' : 'Ręczny'}
                  </span>
                </td>

                {/* Started At */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div
                    className="cursor-help"
                    title={formatShortDate(run.startedAt)}
                  >
                    {formatRelativeTime(run.startedAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    przez {run.triggeredBy}
                  </div>
                </td>

                {/* Duration */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {run.durationSeconds !== null ? (
                    formatDuration(run.durationSeconds)
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* Success Rate */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${successRateColor.text}`}>
                        {successRate}%
                      </span>
                      <span className="text-xs text-gray-500">
                        ({run.successfulCount}/{run.totalRckiks})
                      </span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`${successRateColor.bg} h-1.5 rounded-full transition-all`}
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4 whitespace-nowrap">
                  {run.status === 'RUNNING' ? (
                    <PulsatingStatusBadge status={run.status} size="sm" />
                  ) : (
                    <StatusBadge status={run.status} size="sm" />
                  )}
                  {run.errorSummary && (
                    <div
                      className="mt-1 text-xs text-red-600 truncate max-w-xs cursor-help"
                      title={run.errorSummary}
                    >
                      {run.errorSummary}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    data-test-id="admin-scraper-run-details-button"
                    onClick={() => onViewDetails(run.id)}
                    className="text-primary-600 hover:text-primary-900 font-medium"
                  >
                    Szczegóły
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Loading overlay */}
      {isLoading && runs.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rozpoczęty</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Czas</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sukces</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Empty State
 */
function EmptyState() {
  return (
    <div className="text-center py-12" data-test-id="admin-scraper-runs-empty-state">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">Brak uruchomień</h3>
      <p className="mt-1 text-sm text-gray-500">
        Nie znaleziono żadnych uruchomień scrapera pasujących do wybranych filtrów.
      </p>
      <div className="mt-6">
        <p className="text-xs text-gray-500">
          Zmień filtry lub uruchom scraper ręcznie aby zobaczyć wyniki
        </p>
      </div>
    </div>
  );
}
