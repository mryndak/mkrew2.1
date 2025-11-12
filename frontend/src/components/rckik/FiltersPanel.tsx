import { CityFilter } from './CityFilter';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { FiltersPanelProps } from '../../types/rckik';

/**
 * FiltersPanel - panel z wszystkimi filtrami
 * - CityFilter (dropdown miasta)
 * - SortBy filter (Select: name, city, code)
 * - SortOrder toggle (ASC/DESC)
 * - Reset filters button
 * - Responsive: drawer (mobile) vs sidebar panel (desktop)
 */
export function FiltersPanel({
  initialFilters,
  availableCities,
  onFiltersChange,
  isMobile,
  isOpen,
  onClose
}: FiltersPanelProps) {
  const { city, sortBy, sortOrder } = initialFilters;

  // Sort by options
  const sortByOptions = [
    { value: 'name', label: 'Nazwa' },
    { value: 'city', label: 'Miasto' },
    { value: 'code', label: 'Kod' }
  ];

  // Handle city change
  const handleCityChange = (newCity: string | null) => {
    onFiltersChange({ ...initialFilters, city: newCity });
  };

  // Handle sort by change
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...initialFilters, sortBy: e.target.value as 'name' | 'city' | 'code' });
  };

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onFiltersChange({ ...initialFilters, sortOrder: newOrder });
  };

  // Handle reset filters
  const handleReset = () => {
    onFiltersChange({
      city: null,
      active: true,
      sortBy: 'name',
      sortOrder: 'ASC'
    });
  };

  // Base classes
  const panelClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : 'w-full';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Filters panel */}
      <aside className={panelClasses} aria-label="Filtry listy centrów">
        <div className="h-full flex flex-col p-6">
          {/* Header (mobile only) */}
          {isMobile && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filtry</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                aria-label="Zamknij panel filtrów"
              >
                <svg
                  className="w-6 h-6"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Desktop header */}
          {!isMobile && (
            <h2 className="text-lg font-bold text-gray-900 mb-4">Filtry</h2>
          )}

          {/* Filters */}
          <div className="space-y-6 flex-1">
            {/* City filter */}
            <div>
              <CityFilter
                value={city}
                cities={availableCities}
                onChange={handleCityChange}
              />
            </div>

            {/* Sort by filter */}
            <div>
              <Select
                label="Sortuj według"
                options={sortByOptions}
                value={sortBy}
                onChange={handleSortByChange}
              />
            </div>

            {/* Sort order toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kolejność
              </label>
              <button
                onClick={handleSortOrderToggle}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg
                           border border-gray-300 bg-white text-gray-900
                           hover:border-gray-400 transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={`Sortowanie: ${sortOrder === 'ASC' ? 'rosnąco' : 'malejąco'}`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {sortOrder === 'ASC' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                      />
                    )}
                  </svg>
                  {sortOrder === 'ASC' ? 'Rosnąco (A-Z)' : 'Malejąco (Z-A)'}
                </span>
              </button>
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              <svg
                className="w-5 h-5 mr-2"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Resetuj filtry
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
