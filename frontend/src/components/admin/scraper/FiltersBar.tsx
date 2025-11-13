import React, { useState, useEffect } from 'react';
import type { RunsFilters, RunStatus, RunType } from '@/lib/types/scraper';

/**
 * FiltersBar - Panel filtrów dla listy uruchomień scrapera
 *
 * Features:
 * - Run Type filter (radio: All/Scheduled/Manual)
 * - Status filter (checkboxes: Running/Completed/Failed/Partial)
 * - Date Range filter (from/to date inputs)
 * - Clear filters button
 * - Debounce dla dat (500ms)
 *
 * Usage:
 * ```tsx
 * <FiltersBar
 *   filters={filters}
 *   onFiltersChange={(newFilters) => setFilters(newFilters)}
 * />
 * ```
 */

interface FiltersBarProps {
  filters: RunsFilters;
  onFiltersChange: (filters: RunsFilters) => void;
}

export function FiltersBar({ filters, onFiltersChange }: FiltersBarProps) {
  // Local state dla date inputs (debounce)
  const [localFromDate, setLocalFromDate] = useState(filters.fromDate || '');
  const [localToDate, setLocalToDate] = useState(filters.toDate || '');

  // Debounce dla dat
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localFromDate !== filters.fromDate || localToDate !== filters.toDate) {
        onFiltersChange({
          ...filters,
          fromDate: localFromDate || undefined,
          toDate: localToDate || undefined,
        });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [localFromDate, localToDate]);

  const handleRunTypeChange = (runType: RunType | null) => {
    onFiltersChange({
      ...filters,
      runType,
    });
  };

  const handleStatusToggle = (status: RunStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleClearFilters = () => {
    setLocalFromDate('');
    setLocalToDate('');
    onFiltersChange({
      runType: null,
      status: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
  };

  const hasActiveFilters =
    filters.runType ||
    (filters.status && filters.status.length > 0) ||
    filters.fromDate ||
    filters.toDate;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-4 space-y-4 lg:space-y-0">
        {/* Run Type Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ uruchomienia
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={filters.runType === null}
                onChange={() => handleRunTypeChange(null)}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Wszystkie</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={filters.runType === 'SCHEDULED'}
                onChange={() => handleRunTypeChange('SCHEDULED')}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Zaplanowane</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={filters.runType === 'MANUAL'}
                onChange={() => handleRunTypeChange('MANUAL')}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Ręczne</span>
            </label>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-3">
            {(['RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'] as RunStatus[]).map((status) => (
              <label key={status} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status?.includes(status) || false}
                  onChange={() => handleStatusToggle(status)}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {status === 'RUNNING' && 'W trakcie'}
                  {status === 'COMPLETED' && 'Zakończony'}
                  {status === 'FAILED' && 'Błąd'}
                  {status === 'PARTIAL' && 'Częściowy'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zakres dat
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={localFromDate}
              onChange={(e) => setLocalFromDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Od"
            />
            <span className="flex items-center text-gray-500">-</span>
            <input
              type="date"
              value={localToDate}
              onChange={(e) => setLocalToDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min={localFromDate || undefined}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Do"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Wyczyść
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Aktywne filtry:</span>
            {filters.runType && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800">
                Typ: {filters.runType === 'SCHEDULED' ? 'Zaplanowane' : 'Ręczne'}
              </span>
            )}
            {filters.status && filters.status.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800">
                Status: {filters.status.length} wybrane
              </span>
            )}
            {(filters.fromDate || filters.toDate) && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800">
                Daty: {filters.fromDate || '...'} - {filters.toDate || '...'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
