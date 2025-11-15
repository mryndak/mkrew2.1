import React from 'react';
import type { RckikTableRowProps } from '@/lib/types/admin';

/**
 * RckikTableRow - Pojedynczy wiersz tabeli centrów RCKiK
 *
 * Wyświetla:
 * - Nazwę centrum
 * - Kod centrum
 * - Miasto
 * - Status aktywności (badge)
 * - Ostatnia aktualizacja (format: DD.MM.YYYY HH:mm)
 * - Akcje (Edytuj, Usuń)
 *
 * Interakcje:
 * - Kliknięcie przycisku Edytuj otwiera modal edycji
 * - Kliknięcie przycisku Usuń otwiera modal potwierdzenia usunięcia
 * - Hover effect (zmiana tła)
 *
 * US-019: Admin RCKiK Management
 */
export function RckikTableRow({ rckik, onEdit, onDelete }: RckikTableRowProps) {
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
   * Handler kliknięcia przycisku Edytuj
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(rckik);
  };

  /**
   * Handler kliknięcia przycisku Usuń
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(rckik);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-200" data-test-id="admin-rckik-table-row">
      {/* Nazwa */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900" data-test-id="admin-rckik-row-name">{rckik.name}</div>
        {rckik.aliases && rckik.aliases.length > 0 && (
          <div className="text-xs text-gray-500">
            Aliasy: {rckik.aliases.join(', ')}
          </div>
        )}
      </td>

      {/* Kod */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800" data-test-id="admin-rckik-row-code">
          {rckik.code}
        </span>
      </td>

      {/* Miasto */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span data-test-id="admin-rckik-row-city">{rckik.city}</span>
        {rckik.address && (
          <div className="text-xs text-gray-500 mt-0.5">{rckik.address}</div>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        {rckik.active ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" data-test-id="admin-rckik-row-status-active">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Aktywne
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800" data-test-id="admin-rckik-row-status-inactive">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                clipRule="evenodd"
              />
            </svg>
            Nieaktywne
          </span>
        )}
      </td>

      {/* Ostatnia aktualizacja */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(rckik.updatedAt)}
      </td>

      {/* Akcje */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        {/* Przycisk Edytuj */}
        <button
          data-test-id="admin-rckik-edit-button"
          onClick={handleEdit}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          aria-label={`Edytuj centrum ${rckik.name}`}
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edytuj
        </button>

        {/* Przycisk Usuń */}
        <button
          data-test-id="admin-rckik-delete-button"
          onClick={handleDelete}
          className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          aria-label={`Usuń centrum ${rckik.name}`}
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Usuń
        </button>
      </td>
    </tr>
  );
}

/**
 * RckikTableRowSkeleton - Skeleton loader dla wiersza
 */
export function RckikTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-200 animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-40"></div>
        <div className="h-3 bg-gray-200 rounded w-24 mt-1"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="inline-flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </td>
    </tr>
  );
}
