import React from 'react';
import { ReportsTableRow, ReportsTableRowSkeleton } from './ReportsTableRow';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import type { ReportsTableProps } from '@/lib/types/reports';

/**
 * ReportsTable - Główna tabela raportów
 *
 * Features:
 * - Sortowalne nagłówki kolumn (ID, Status, Użytkownik, RCKiK, Data)
 * - Ikony strzałek dla sortowania (ASC/DESC)
 * - Renderowanie wierszy z ReportsTableRow
 * - Skeleton loader podczas ładowania (10 wierszy)
 * - EmptyState gdy brak danych
 * - Pagination na dole tabeli
 * - Badge z liczbą wyników
 * - Responsywność (horizontal scroll na mobile)
 */
export function ReportsTable({
  reports,
  loading,
  sortConfig,
  onSortChange,
  onRowClick,
  pagination,
  onPageChange,
  onPageSizeChange,
}: ReportsTableProps) {
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

  // Określ czy są aktywne filtry (do przekazania do EmptyState)
  // To powinno być przekazane z parent component, ale na razie hardcodujemy false
  const hasActiveFilters = false; // TODO: Przekazać z parent

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header z liczbą wyników */}
      {!loading && reports.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Znaleziono {pagination.totalElements} raport
              {pagination.totalElements === 1
                ? ''
                : pagination.totalElements < 5
                ? 'y'
                : 'ów'}
            </h3>
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
              {pagination.totalElements}
            </span>
          </div>
        </div>
      )}

      {/* Table - Responsive wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="id" label="ID" />
              <SortableHeader field="status" label="Status" />
              <SortableHeader field="userName" label="Użytkownik" />
              <SortableHeader field="rckikName" label="RCKiK" />
              <SortableHeader field="createdAt" label="Data utworzenia" />
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Skeleton loader - 10 rows
              <>
                {Array.from({ length: 10 }).map((_, index) => (
                  <ReportsTableRowSkeleton key={index} />
                ))}
              </>
            ) : reports.length > 0 ? (
              // Data rows
              reports.map((report) => (
                <ReportsTableRow key={report.id} report={report} onClick={onRowClick} />
              ))
            ) : null}
          </tbody>
        </table>

        {/* Empty State - gdy brak danych i nie loading */}
        {!loading && reports.length === 0 && (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              // TODO: Implement clear filters callback
              console.log('Clear filters');
            }}
          />
        )}
      </div>

      {/* Pagination - tylko gdy są dane */}
      {!loading && reports.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.size}
          totalElements={pagination.totalElements}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          disabled={loading}
        />
      )}
    </div>
  );
}

/**
 * Helper function do liczby raportów (gramatyka polska)
 */
function getReportCountText(count: number): string {
  if (count === 1) return 'raport';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return 'raporty';
  }
  return 'raportów';
}
