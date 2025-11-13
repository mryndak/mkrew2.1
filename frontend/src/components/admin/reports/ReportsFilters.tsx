import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { ReportsFiltersProps, ReportStatus } from '@/lib/types/reports';

/**
 * ReportsFilters - Panel filtrów dla listy raportów
 *
 * Obsługuje filtrowanie po:
 * - Status (NEW, IN_REVIEW, RESOLVED, REJECTED, ALL)
 * - RCKiK (select z listą centrów)
 * - Zakres dat (fromDate - toDate)
 * - Wyszukiwanie w opisie (debounced)
 *
 * Walidacja:
 * - fromDate <= toDate
 *
 * Funkcjonalności:
 * - Reset filtrów do wartości domyślnych
 * - Synchronizacja z URL params (przez parent)
 */
export function ReportsFilters({
  filters,
  onFiltersChange,
  rckikOptions,
}: ReportsFiltersProps) {
  // Local state dla walidacji dat
  const [dateError, setDateError] = useState<string | null>(null);

  /**
   * Walidacja zakresu dat
   */
  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      const from = new Date(filters.fromDate);
      const to = new Date(filters.toDate);

      if (from > to) {
        setDateError('Data od nie może być późniejsza niż data do');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [filters.fromDate, filters.toDate]);

  /**
   * Handler zmiany statusu
   */
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ReportStatus | 'ALL';
    onFiltersChange({ ...filters, status: value });
  };

  /**
   * Handler zmiany RCKiK
   */
  const handleRckikChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      rckikId: value ? parseInt(value) : undefined,
    });
  };

  /**
   * Handler zmiany daty od
   */
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, fromDate: e.target.value || undefined });
  };

  /**
   * Handler zmiany daty do
   */
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, toDate: e.target.value || undefined });
  };

  /**
   * Handler zmiany search query
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value });
  };

  /**
   * Handler reset filtrów
   */
  const handleClearFilters = () => {
    onFiltersChange({
      status: 'ALL',
      rckikId: undefined,
      fromDate: undefined,
      toDate: undefined,
      searchQuery: '',
    });
  };

  /**
   * Sprawdź czy są aktywne filtry
   */
  const hasActiveFilters =
    (filters.status && filters.status !== 'ALL') ||
    filters.rckikId ||
    filters.fromDate ||
    filters.toDate ||
    (filters.searchQuery && filters.searchQuery.trim() !== '');

  // Opcje dla select statusu
  const statusOptions = [
    { value: 'ALL', label: 'Wszystkie' },
    { value: 'NEW', label: 'Nowe' },
    { value: 'IN_REVIEW', label: 'W weryfikacji' },
    { value: 'RESOLVED', label: 'Rozwiązane' },
    { value: 'REJECTED', label: 'Odrzucone' },
  ];

  // Opcje dla select RCKiK
  const rckikSelectOptions = [
    { value: '', label: 'Wszystkie centra' },
    ...rckikOptions.map((rckik) => ({
      value: String(rckik.id),
      label: `${rckik.name} (${rckik.city})`,
    })),
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleClearFilters}
            className="text-gray-600 hover:text-gray-900"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Wyczyść filtry
          </Button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <Select
          label="Status"
          options={statusOptions}
          value={filters.status || 'ALL'}
          onChange={handleStatusChange}
          className="w-full"
        />

        {/* RCKiK Filter */}
        <Select
          label="Centrum RCKiK"
          options={rckikSelectOptions}
          value={filters.rckikId ? String(filters.rckikId) : ''}
          onChange={handleRckikChange}
          className="w-full"
        />

        {/* Date From */}
        <div>
          <label
            htmlFor="filter-date-from"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Data od
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filters.fromDate || ''}
            onChange={handleFromDateChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Date To */}
        <div>
          <label
            htmlFor="filter-date-to"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Data do
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filters.toDate || ''}
            onChange={handleToDateChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Date validation error */}
      {dateError && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <svg
            className="w-4 h-4 mr-1.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {dateError}
        </div>
      )}

      {/* Search Input - Full Width */}
      <div className="mt-4">
        <Input
          label="Szukaj w opisie"
          type="search"
          placeholder="Wpisz słowa kluczowe..."
          value={filters.searchQuery || ''}
          onChange={handleSearchChange}
          leadingIcon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
          helperText="Wyszukiwanie jest automatycznie opóźnione o 300ms"
        />
      </div>

      {/* Active Filters Badge */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-1.5 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
              clipRule="evenodd"
            />
          </svg>
          <span>Aktywne filtry są zastosowane</span>
        </div>
      )}
    </div>
  );
}
