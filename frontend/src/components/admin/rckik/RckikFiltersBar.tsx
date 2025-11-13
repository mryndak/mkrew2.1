import React from 'react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { RckikFiltersBarProps } from '@/lib/types/admin';

/**
 * RckikFiltersBar - Panel filtrów dla listy centrów RCKiK
 *
 * Obsługuje filtrowanie po:
 * - Nazwa (search input z debounce 300ms)
 * - Miasto (select z listą miast)
 * - Status aktywności (Wszystkie / Aktywne / Nieaktywne)
 *
 * Funkcjonalności:
 * - Reset filtrów do wartości domyślnych
 * - Debounced search (obsługiwane przez parent hook)
 * - Synchronizacja z URL params (przez parent)
 * - Wskaźnik aktywnych filtrów
 *
 * US-019: Admin RCKiK Management
 */
export function RckikFiltersBar({
  onFilterChange,
  initialFilters,
  availableCities,
}: RckikFiltersBarProps) {
  // Local state dla filtrów (controlled inputs)
  const [search, setSearch] = React.useState(initialFilters?.search || '');
  const [city, setCity] = React.useState<string | null>(initialFilters?.city || null);
  const [active, setActive] = React.useState<boolean | null>(
    initialFilters?.active !== undefined ? initialFilters.active : null
  );

  /**
   * Handler zmiany wyszukiwania
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onFilterChange({ search: value, city, active });
  };

  /**
   * Handler zmiany miasta
   */
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newCity = value ? value : null;
    setCity(newCity);
    onFilterChange({ search, city: newCity, active });
  };

  /**
   * Handler zmiany statusu aktywności
   */
  const handleActiveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    let newActive: boolean | null = null;

    if (value === 'true') {
      newActive = true;
    } else if (value === 'false') {
      newActive = false;
    }

    setActive(newActive);
    onFilterChange({ search, city, active: newActive });
  };

  /**
   * Handler reset filtrów
   */
  const handleClearFilters = () => {
    setSearch('');
    setCity(null);
    setActive(null);
    onFilterChange({ search: '', city: null, active: null });
  };

  /**
   * Sprawdź czy są aktywne filtry
   */
  const hasActiveFilters =
    (search && search.trim() !== '') ||
    city !== null ||
    active !== null;

  // Opcje dla select miasta
  const citySelectOptions = [
    { value: '', label: 'Wszystkie miasta' },
    ...availableCities.map((cityName) => ({
      value: cityName,
      label: cityName,
    })),
  ];

  // Opcje dla select statusu
  const activeSelectOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'true', label: 'Aktywne' },
    { value: 'false', label: 'Nieaktywne' },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* City Filter */}
        <Select
          label="Miasto"
          options={citySelectOptions}
          value={city || ''}
          onChange={handleCityChange}
          className="w-full"
        />

        {/* Status Filter */}
        <Select
          label="Status"
          options={activeSelectOptions}
          value={
            active === null ? '' : active === true ? 'true' : 'false'
          }
          onChange={handleActiveChange}
          className="w-full"
        />

        {/* Placeholder for alignment */}
        <div className="hidden md:block"></div>
      </div>

      {/* Search Input - Full Width */}
      <div>
        <Input
          label="Szukaj centrum"
          type="search"
          placeholder="Wpisz nazwę lub kod centrum..."
          value={search}
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
