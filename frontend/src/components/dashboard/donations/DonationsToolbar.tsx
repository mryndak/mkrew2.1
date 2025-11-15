import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import type { SelectOption } from '@/components/ui/Select';

export interface DonationFilters {
  fromDate: string | null;
  toDate: string | null;
  donationType: string | null;
  rckikId: number | null;
}

export interface DonationsToolbarProps {
  filters: DonationFilters;
  onFilterChange: (filters: DonationFilters) => void;
  onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  onExport: (format: 'csv' | 'json') => void;
  onAddDonation: () => void;
  availableRckiks?: Array<{ id: number; name: string; city: string }>;
}

/**
 * DonationsToolbar - Pasek narzędziowy z filtrami, sortowaniem i eksportem
 *
 * Features:
 * - Filtry: zakres dat, typ donacji, centrum RCKiK
 * - Przycisk "Wyczyść filtry"
 * - Dropdown sortowania
 * - Dropdown eksportu (CSV/JSON)
 * - Przycisk "Dodaj donację"
 * - Walidacja zakresu dat (fromDate <= toDate)
 * - Responsywny layout (wrap na mobile)
 *
 * @example
 * ```tsx
 * <DonationsToolbar
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   onSortChange={handleSortChange}
 *   onExport={handleExport}
 *   onAddDonation={handleAddDonation}
 *   availableRckiks={rckiks}
 * />
 * ```
 */
export function DonationsToolbar({
  filters,
  onFilterChange,
  onSortChange,
  onExport,
  onAddDonation,
  availableRckiks = [],
}: DonationsToolbarProps) {
  const [sortBy, setSortBy] = useState('donationDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Opcje typu donacji
  const donationTypeOptions: SelectOption[] = [
    { value: '', label: 'Wszystkie typy' },
    { value: 'FULL_BLOOD', label: 'Krew pełna' },
    { value: 'PLASMA', label: 'Osocze' },
    { value: 'PLATELETS', label: 'Płytki krwi' },
    { value: 'OTHER', label: 'Inne' },
  ];

  // Opcje RCKiK
  const rckikOptions: SelectOption[] = [
    { value: '', label: 'Wszystkie centra' },
    ...availableRckiks.map((rckik) => ({
      value: rckik.id.toString(),
      label: `${rckik.name} - ${rckik.city}`,
    })),
  ];

  // Opcje sortowania
  const sortOptions: SelectOption[] = [
    { value: 'donationDate-DESC', label: 'Data: najnowsze' },
    { value: 'donationDate-ASC', label: 'Data: najstarsze' },
    { value: 'quantityMl-DESC', label: 'Ilość: malejąco' },
    { value: 'quantityMl-ASC', label: 'Ilość: rosnąco' },
  ];

  /**
   * Handle date range change with validation
   */
  const handleDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    const newFilters = { ...filters, [field]: value || null };

    // Validate: fromDate <= toDate
    if (newFilters.fromDate && newFilters.toDate) {
      const from = new Date(newFilters.fromDate);
      const to = new Date(newFilters.toDate);

      if (from > to) {
        // Auto-correct: set fromDate = toDate
        if (field === 'fromDate') {
          newFilters.fromDate = newFilters.toDate;
        } else {
          newFilters.toDate = newFilters.fromDate;
        }
      }
    }

    onFilterChange(newFilters);
  };

  /**
   * Handle donation type change
   */
  const handleDonationTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      donationType: value || null,
    });
  };

  /**
   * Handle RCKiK change
   */
  const handleRckikChange = (value: string) => {
    onFilterChange({
      ...filters,
      rckikId: value ? parseInt(value, 10) : null,
    });
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-') as [string, 'ASC' | 'DESC'];
    setSortBy(field);
    setSortOrder(order);
    onSortChange(field, order);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    onFilterChange({
      fromDate: null,
      toDate: null,
      donationType: null,
      rckikId: null,
    });
  };

  /**
   * Check if any filter is active
   */
  const hasActiveFilters = !!(
    filters.fromDate ||
    filters.toDate ||
    filters.donationType ||
    filters.rckikId
  );

  // Get today's date for max attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4" data-test-id="donations-toolbar">
      {/* Top row: Add button + Export/Sort */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Left: Add button */}
        <Button
          variant="primary"
          onClick={onAddDonation}
          className="w-full sm:w-auto"
          data-test-id="donations-toolbar-add-button"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Dodaj donację
        </Button>

        {/* Right: Sort + Export */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Sort select */}
          <Select
            options={sortOptions}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm"
            wrapperClassName="flex-1 sm:w-48"
            data-test-id="donations-toolbar-sort-select"
          />

          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="whitespace-nowrap"
              data-test-id="donations-toolbar-export-button"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Eksportuj
            </Button>

            {/* Export menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onExport('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  data-test-id="donations-toolbar-export-csv-button"
                >
                  Eksportuj do CSV
                </button>
                <button
                  onClick={() => {
                    onExport('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  data-test-id="donations-toolbar-export-json-button"
                >
                  Eksportuj do JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Date from */}
        <Input
          type="date"
          label="Data od"
          value={filters.fromDate || ''}
          onChange={(e) => handleDateChange('fromDate', e.target.value)}
          max={today}
          className="text-sm"
          data-test-id="donations-toolbar-filter-from-date"
        />

        {/* Date to */}
        <Input
          type="date"
          label="Data do"
          value={filters.toDate || ''}
          onChange={(e) => handleDateChange('toDate', e.target.value)}
          max={today}
          className="text-sm"
          data-test-id="donations-toolbar-filter-to-date"
        />

        {/* Donation type */}
        <Select
          label="Typ donacji"
          options={donationTypeOptions}
          value={filters.donationType || ''}
          onChange={(e) => handleDonationTypeChange(e.target.value)}
          className="text-sm"
          data-test-id="donations-toolbar-filter-type"
        />

        {/* RCKiK center */}
        <Select
          label="Centrum RCKiK"
          options={rckikOptions}
          value={filters.rckikId?.toString() || ''}
          onChange={(e) => handleRckikChange(e.target.value)}
          className="text-sm"
          data-test-id="donations-toolbar-filter-rckik"
        />
      </div>

      {/* Clear filters button (only if filters active) */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            data-test-id="donations-toolbar-clear-filters-button"
          >
            Wyczyść filtry
          </button>
        </div>
      )}
    </div>
  );
}
