import React from 'react';
import { RckikTableRow, RckikTableRowSkeleton } from './RckikTableRow';
import type { RckikTableProps } from '@/lib/types/admin';

/**
 * RckikTable - Główna tabela centrów RCKiK
 *
 * Features:
 * - Sortowalne nagłówki kolumn (Nazwa, Kod, Miasto, Ostatnia aktualizacja)
 * - Ikony strzałek dla sortowania (ASC/DESC)
 * - Renderowanie wierszy z RckikTableRow
 * - Skeleton loader podczas ładowania (10 wierszy)
 * - EmptyState gdy brak danych
 * - Badge z liczbą wyników
 * - Responsywność (horizontal scroll na mobile)
 * - Akcje: Edytuj i Usuń w każdym wierszu
 *
 * US-019: Admin RCKiK Management
 */
export function RckikTable({
  data,
  isLoading,
  sortConfig,
  onSortChange,
  onEdit,
  onDelete,
}: RckikTableProps) {
  /**
   * Handler kliknięcia w nagłówek kolumny (sortowanie)
   */
  const handleHeaderClick = (field: typeof sortConfig.field) => {
    onSortChange(field);
  };

  /**
   * Render ikony sortowania dla nagłówka
   */
  const renderSortIcon = (field: typeof sortConfig.field) => {
    const isActive = sortConfig.field === field;
    const isAsc = sortConfig.order === 'ASC';

    return (
      <span className="ml-2 inline-flex">
        {isActive ? (
          isAsc ? (
            // Ascending arrow (aktywny)
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            // Descending arrow (aktywny)
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )
        ) : (
          // Neutral arrows (nieaktywny)
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
          </svg>
        )}
      </span>
    );
  };

  /**
   * Sortable header component
   */
  const SortableHeader = ({
    field,
    label,
    className = '',
  }: {
    field: typeof sortConfig.field;
    label: string;
    className?: string;
  }) => (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none ${className}`}
      onClick={() => handleHeaderClick(field)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleHeaderClick(field);
        }
      }}
      tabIndex={0}
      role="button"
      aria-sort={
        sortConfig.field === field
          ? sortConfig.order === 'ASC'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header z liczbą wyników */}
      {!isLoading && data.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Znaleziono {data.length} centr
              {data.length === 1 ? 'um' : data.length < 5 ? 'a' : 'ów'}
            </h3>
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
              {data.length}
            </span>
          </div>
        </div>
      )}

      {/* Table - Responsive wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="name" label="Nazwa" />
              <SortableHeader field="code" label="Kod" />
              <SortableHeader field="city" label="Miasto" />
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <SortableHeader field="updatedAt" label="Ostatnia aktualizacja" />
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // Skeleton loader - 10 rows
              <>
                {Array.from({ length: 10 }).map((_, index) => (
                  <RckikTableRowSkeleton key={index} />
                ))}
              </>
            ) : data.length > 0 ? (
              // Data rows
              data.map((rckik) => (
                <RckikTableRow
                  key={rckik.id}
                  rckik={rckik}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : null}
          </tbody>
        </table>

        {/* Empty State - gdy brak danych i nie loading */}
        {!isLoading && data.length === 0 && (
          <div className="text-center py-12 px-6">
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
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak centrów RCKiK</h3>
            <p className="mt-1 text-sm text-gray-500">
              Nie znaleziono centrów RCKiK spełniających podane kryteria.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Dodaj nowe centrum
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
