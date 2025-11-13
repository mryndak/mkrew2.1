import React from 'react';
import { ReportStatusBadge } from './ReportStatusBadge';
import type { ReportsTableRowProps } from '@/lib/types/reports';

/**
 * ReportsTableRow - Pojedynczy wiersz tabeli raportów
 *
 * Wyświetla:
 * - ID raportu
 * - Status (badge)
 * - Informacje o użytkowniku (imię + nazwisko)
 * - Nazwa RCKiK
 * - Data utworzenia (format: DD.MM.YYYY HH:mm)
 * - Ikona akcji (podgląd szczegółów)
 *
 * Interakcje:
 * - Kliknięcie w wiersz otwiera modal szczegółów
 * - Hover effect (zmiana tła)
 */
export function ReportsTableRow({ report, onClick }: ReportsTableRowProps) {
  /**
   * Formatowanie daty do DD.MM.YYYY HH:mm
   */
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Failed to format date:', error);
      return isoString;
    }
  };

  /**
   * Handler kliknięcia w wiersz
   */
  const handleClick = () => {
    onClick(report.id);
  };

  /**
   * Handler kliknięcia klawiszem (accessibility)
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(report.id);
    }
  };

  // Pełne imię użytkownika
  const userName = `${report.user.firstName} ${report.user.lastName}`;

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-200"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Szczegóły raportu #${report.id} od ${userName}`}
    >
      {/* ID Raportu */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #{report.id}
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        <ReportStatusBadge status={report.status} size="small" />
      </td>

      {/* Użytkownik */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{userName}</div>
        <div className="text-sm text-gray-500">{report.user.email}</div>
      </td>

      {/* RCKiK */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{report.rckikName}</div>
        {report.bloodSnapshotId && (
          <div className="text-xs text-gray-500">
            Snapshot ID: {report.bloodSnapshotId}
          </div>
        )}
      </td>

      {/* Data utworzenia */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(report.createdAt)}
      </td>

      {/* Akcje - Ikona podglądu */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded p-1"
          onClick={(e) => {
            e.stopPropagation(); // Zatrzymaj propagację do wiersza
            onClick(report.id);
          }}
          aria-label={`Podgląd szczegółów raportu #${report.id}`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
}

/**
 * Skeleton Row - Placeholder podczas ładowania
 */
export function ReportsTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-200 animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-40"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="h-5 bg-gray-200 rounded w-5 ml-auto"></div>
      </td>
    </tr>
  );
}
