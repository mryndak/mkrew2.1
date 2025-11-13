import React, { useEffect, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { LogsTable } from './LogsTable';
import { useScraperRunDetails } from '@/lib/hooks/scraper/useScraperRunDetails';
import {
  formatAbsoluteDate,
  formatDuration,
  calculateSuccessRate,
  getSuccessRateColor,
} from '@/lib/utils/scraperHelpers';

/**
 * RunDetailsModal - Modal ze szczegółami uruchomienia scrapera
 *
 * Features:
 * - Header: Run ID, Type, Triggered By
 * - Summary: timestamps, duration, counts, error summary
 * - LogsTable: szczegółowe logi dla każdego centrum
 * - Filter: "Show only failed logs"
 * - Loading state, Error state
 * - ESC to close
 */

interface RunDetailsModalProps {
  runId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RunDetailsModal({ runId, isOpen, onClose }: RunDetailsModalProps) {
  const { details, isLoading, error, refetch } = useScraperRunDetails(runId);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset showOnlyFailed when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowOnlyFailed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const successRate = details
    ? calculateSuccessRate(details.successfulCount, details.totalRckiks)
    : 0;
  const successRateColor = getSuccessRateColor(successRate);

  const failedLogsCount = details?.logs.filter(log => log.status === 'FAILED').length || 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900" id="modal-title">
                  Run Details #{runId}
                </h2>
                {details && (
                  <>
                    <StatusBadge status={details.status} size="md" />
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        details.runType === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {details.runType === 'SCHEDULED' ? 'Zaplanowany' : 'Ręczny'}
                    </span>
                  </>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Zamknij"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Triggered by */}
            {details && (
              <div className="mt-2 text-sm text-gray-600">
                Uruchomione przez: <span className="font-medium">{details.triggeredBy}</span>
              </div>
            )}
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Loading State */}
            {isLoading && !details && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600">Ładowanie szczegółów...</span>
              </div>
            )}

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
                      Nie udało się pobrać szczegółów
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

            {/* Content */}
            {details && (
              <div className="space-y-6">
                {/* Summary Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Podsumowanie</h3>

                  <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Started At */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rozpoczęty</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatAbsoluteDate(details.startedAt)}
                      </dd>
                    </div>

                    {/* Completed At */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Zakończony</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {details.completedAt ? (
                          formatAbsoluteDate(details.completedAt)
                        ) : (
                          <span className="text-blue-600 font-medium">W trakcie...</span>
                        )}
                      </dd>
                    </div>

                    {/* Duration */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Czas trwania</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {details.durationSeconds !== null ? (
                          formatDuration(details.durationSeconds)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </dd>
                    </div>

                    {/* Total RCKiK */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Łącznie centrów</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">
                        {details.totalRckiks}
                      </dd>
                    </div>

                    {/* Successful Count */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sukces</dt>
                      <dd className="mt-1 text-sm text-green-600 font-semibold">
                        {details.successfulCount}
                      </dd>
                    </div>

                    {/* Failed Count */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Błędy</dt>
                      <dd className="mt-1 text-sm text-red-600 font-semibold">
                        {details.failedCount}
                      </dd>
                    </div>
                  </dl>

                  {/* Success Rate Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Wskaźnik sukcesu</span>
                      <span className={`text-sm font-semibold ${successRateColor.text}`}>
                        {successRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${successRateColor.bg} h-2 rounded-full transition-all`}
                        style={{ width: `${successRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Error Summary */}
                  {details.errorSummary && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="text-sm font-medium text-red-800 mb-1">Podsumowanie błędów</h4>
                      <p className="text-sm text-red-700">{details.errorSummary}</p>
                    </div>
                  )}
                </div>

                {/* Logs Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Logi ({details.logs.length})
                    </h3>

                    {/* Show only failed filter */}
                    {failedLogsCount > 0 && (
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnlyFailed}
                          onChange={(e) => setShowOnlyFailed(e.target.checked)}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Pokaż tylko błędy ({failedLogsCount})
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <LogsTable logs={details.logs} showOnlyFailed={showOnlyFailed} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
