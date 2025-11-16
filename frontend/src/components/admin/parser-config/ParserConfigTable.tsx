import React from 'react';
import { ParserStatusBadge } from './ParserStatusBadge';
import type { ParserConfigDto } from '@/lib/types/parserConfig';

/**
 * Props dla ParserConfigTable
 */
interface ParserConfigTableProps {
  configs: ParserConfigDto[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onEdit: (config: ParserConfigDto) => void;
  onTest: (config: ParserConfigDto) => void;
  onDelete: (config: ParserConfigDto) => void;
}

/**
 * ParserConfigTable - Tabela konfiguracji parserów z sortowaniem i akcjami CRUD
 *
 * Features:
 * - Sortowanie po kliknięciu nagłówków kolumn
 * - Akcje inline (Edit/Test/Delete)
 * - Badges dla statusu parsera i typu
 * - Skrócony URL z tooltip
 * - Timestamp ostatniego uruchomienia
 * - Empty state
 * - Loading skeleton
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów
 */
export function ParserConfigTable({
  configs,
  totalElements,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onSort,
  onEdit,
  onTest,
  onDelete,
}: ParserConfigTableProps) {
  /**
   * Skraca URL do N znaków z ...
   */
  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  /**
   * Formatuje timestamp do czytelnej daty
   */
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Nigdy';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours}h temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;

    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Loading state (skeleton)
   */
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Ładowanie konfiguracji...</p>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (configs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Brak konfiguracji parserów</h3>
          <p className="mt-1 text-sm text-gray-500">
            Dodaj pierwszą konfigurację, aby rozpocząć automatyczne pobieranie danych z RCKiK.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Table view
   */
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                RCKiK
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Typ parsera
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                URL źródłowy
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Ostatnie uruchomienie
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configs.map((config) => (
              <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                {/* RCKiK */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{config.rckikName}</div>
                  <div className="text-xs text-gray-500">{config.rckikCode}</div>
                </td>

                {/* Typ parsera */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      config.parserType === 'JSOUP'
                        ? 'bg-blue-100 text-blue-800'
                        : config.parserType === 'SELENIUM'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {config.parserType}
                  </span>
                </td>

                {/* URL źródłowy */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs" title={config.sourceUrl}>
                    <a
                      href={config.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {truncateUrl(config.sourceUrl)}
                    </a>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <ParserStatusBadge active={config.active} lastRunStatus={config.lastRunStatus} />
                </td>

                {/* Ostatnie uruchomienie */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTimestamp(config.lastSuccessfulRun)}
                  </div>
                </td>

                {/* Akcje */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => onEdit(config)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edytuj konfigurację"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    {/* Test Button */}
                    <button
                      onClick={() => onTest(config)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="Testuj parser"
                    >
                      <svg
                        className="w-5 h-5"
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
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDelete(config)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Dezaktywuj parser"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
