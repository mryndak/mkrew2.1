import React, { useState } from 'react';
import { ALL_BLOOD_GROUPS } from '@/lib/constants/bloodGroups';
import type { SnapshotFilters, SnapshotSource } from '@/lib/types/bloodSnapshots';

/**
 * Props dla FiltersPanel
 */
interface FiltersPanelProps {
  filters: SnapshotFilters;
  onChange: (filters: Partial<SnapshotFilters>) => void;
  onReset: () => void;
}

/**
 * FiltersPanel - Panel filtrów dla tabeli snapshotów
 *
 * Filtry:
 * - DateRangePicker (od-do)
 * - RckikSelect (TODO: implement typeahead)
 * - BloodGroupSelect (dropdown)
 * - SourceFilter (All/Manual/Scraped - radio buttons)
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function FiltersPanel({ filters, onChange, onReset }: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  /**
   * Format daty do ISO string (YYYY-MM-DD)
   */
  const formatDateToISO = (date: string): string => {
    if (!date) return '';
    return date.split('T')[0]; // Ensure YYYY-MM-DD format
  };

  /**
   * Handler dla zmiany daty "od"
   */
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({ fromDate: value || null });
  };

  /**
   * Handler dla zmiany daty "do"
   */
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({ toDate: value || null });
  };

  /**
   * Handler dla zmiany grupy krwi
   */
  const handleBloodGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({ bloodGroup: value || null });
  };

  /**
   * Handler dla zmiany źródła
   */
  const handleSourceChange = (source: SnapshotSource) => {
    onChange({ source });
  };

  /**
   * Oblicz ile filtrów jest aktywnych
   */
  const activeFiltersCount = [
    filters.fromDate,
    filters.toDate,
    filters.bloodGroup,
    filters.rckikId,
    filters.source !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow" data-test-id="filters-panel">
      {/* Header z toggle */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-700">Filtry</h3>
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Resetuj wszystkie
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? 'Zwiń filtry' : 'Rozwiń filtry'}
          >
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtry */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range - From */}
            <div>
              <label htmlFor="filter-date-from" className="block text-sm font-medium text-gray-700 mb-1">
                Data od
              </label>
              <input
                id="filter-date-from"
                type="date"
                value={filters.fromDate || ''}
                onChange={handleFromDateChange}
                max={filters.toDate || undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            {/* Date Range - To */}
            <div>
              <label htmlFor="filter-date-to" className="block text-sm font-medium text-gray-700 mb-1">
                Data do
              </label>
              <input
                id="filter-date-to"
                type="date"
                value={filters.toDate || ''}
                onChange={handleToDateChange}
                min={filters.fromDate || undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            {/* Blood Group Select */}
            <div>
              <label htmlFor="filter-blood-group" className="block text-sm font-medium text-gray-700 mb-1">
                Grupa krwi
              </label>
              <select
                id="filter-blood-group"
                value={filters.bloodGroup || ''}
                onChange={handleBloodGroupChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="">Wszystkie</option>
                {ALL_BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Źródło</label>
              <div className="flex items-center space-x-4 h-[38px]">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="source-filter"
                    value="all"
                    checked={filters.source === 'all'}
                    onChange={() => handleSourceChange('all')}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Wszystkie</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="source-filter"
                    value="manual"
                    checked={filters.source === 'manual'}
                    onChange={() => handleSourceChange('manual')}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ręczne</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="source-filter"
                    value="scraped"
                    checked={filters.source === 'scraped'}
                    onChange={() => handleSourceChange('scraped')}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto</span>
                </label>
              </div>
            </div>
          </div>

          {/* RCKiK Filter - TODO: Implement typeahead search */}
          {/* <div className="mt-4">
            <label htmlFor="filter-rckik" className="block text-sm font-medium text-gray-700 mb-1">
              Centrum RCKiK
            </label>
            <RckikSearchSelect
              value={filters.rckikId}
              onChange={(id) => onChange({ rckikId: id })}
            />
          </div> */}
        </div>
      )}
    </div>
  );
}
