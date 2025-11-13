import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { formatResponseTime, copyToClipboard, truncateText } from '@/lib/utils/scraperHelpers';
import { toast } from 'react-toastify';
import type { ScraperLogDto } from '@/lib/types/scraper';

/**
 * LogsTable - Tabela logów dla szczegółów uruchomienia scrapera
 *
 * Features:
 * - Kolumny: RCKiK Name, URL, Status, Response Time, HTTP Code, Records, Error
 * - Sortowanie po status (FAILED na górze)
 * - Filter checkbox "Show only failed"
 * - Kopiowanie URL i error message do schowka
 * - Tooltips dla długich tekstów
 */

interface LogsTableProps {
  logs: ScraperLogDto[];
  showOnlyFailed?: boolean;
}

export function LogsTable({ logs, showOnlyFailed = false }: LogsTableProps) {
  const [sortBy, setSortBy] = useState<'status' | 'responseTime'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter logs
  const filteredLogs = showOnlyFailed
    ? logs.filter(log => log.status === 'FAILED')
    : logs;

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortBy === 'status') {
      // Priority: FAILED > PARTIAL > SUCCESS
      const statusPriority = { FAILED: 3, PARTIAL: 2, SUCCESS: 1 };
      const diff = statusPriority[b.status] - statusPriority[a.status];
      return sortOrder === 'desc' ? diff : -diff;
    } else {
      // Sort by response time
      const diff = b.responseTimeMs - a.responseTimeMs;
      return sortOrder === 'desc' ? diff : -diff;
    }
  });

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success(`${label} skopiowany do schowka`, {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } else {
      toast.error('Nie udało się skopiować', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    }
  };

  const handleSort = (column: 'status' | 'responseTime') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (sortedLogs.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          {showOnlyFailed ? 'Brak błędów w tym uruchomieniu' : 'Brak logów'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              RCKiK
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              URL
            </th>
            <th
              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {sortBy === 'status' && (
                  <svg
                    className={`ml-1 h-4 w-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </th>
            <th
              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('responseTime')}
            >
              <div className="flex items-center">
                Response
                {sortBy === 'responseTime' && (
                  <svg
                    className={`ml-1 h-4 w-4 transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              HTTP
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Records
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Error
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLogs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              {/* RCKiK Name */}
              <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="max-w-xs truncate" title={log.rckikName}>
                  {log.rckikName}
                </div>
              </td>

              {/* URL */}
              <td className="px-3 py-3 text-sm text-gray-900">
                <button
                  onClick={() => handleCopy(log.url, 'URL')}
                  className="max-w-xs truncate text-primary-600 hover:text-primary-900 text-left"
                  title={`Kliknij aby skopiować: ${log.url}`}
                >
                  {truncateText(log.url, 40)}
                </button>
              </td>

              {/* Status */}
              <td className="px-3 py-3 whitespace-nowrap">
                <StatusBadge status={log.status} size="sm" />
              </td>

              {/* Response Time */}
              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                <span
                  className={`${
                    log.responseTimeMs > 5000
                      ? 'text-red-600'
                      : log.responseTimeMs > 3000
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {formatResponseTime(log.responseTimeMs)}
                </span>
              </td>

              {/* HTTP Status Code */}
              <td className="px-3 py-3 whitespace-nowrap text-sm">
                {log.httpStatusCode ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      log.httpStatusCode >= 200 && log.httpStatusCode < 300
                        ? 'bg-green-100 text-green-800'
                        : log.httpStatusCode >= 400 && log.httpStatusCode < 500
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.httpStatusCode}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>

              {/* Records Parsed/Failed */}
              <td className="px-3 py-3 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium">{log.recordsParsed}</span>
                  {log.recordsFailed > 0 && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-600 font-medium">{log.recordsFailed}</span>
                    </>
                  )}
                </div>
              </td>

              {/* Error Message */}
              <td className="px-3 py-3 text-sm">
                {log.errorMessage ? (
                  <button
                    onClick={() => handleCopy(log.errorMessage!, 'Error')}
                    className="max-w-xs text-red-600 hover:text-red-900 text-left"
                    title={`Kliknij aby skopiować: ${log.errorMessage}`}
                  >
                    {truncateText(log.errorMessage, 50)}
                  </button>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
