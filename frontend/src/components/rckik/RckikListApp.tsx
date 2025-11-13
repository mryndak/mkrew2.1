import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { SearchBar } from './SearchBar';
import { FiltersPanel } from './FiltersPanel';
import { RckikList } from './RckikList';
import { Pagination } from './Pagination';
import { useRckikList } from '../../lib/hooks/useRckikList';
import { useIsMobile } from '../../lib/hooks/useMediaQuery';
import type { RckikListApiResponse, RckikSearchParams } from '../../types/rckik';

interface RckikListAppProps {
  initialData: RckikListApiResponse | null;
  initialParams: RckikSearchParams;
  availableCities: string[];
}

/**
 * RckikListApp - główny React component dla widoku listy RCKiK
 * - Integruje wszystkie komponenty (SearchBar, FiltersPanel, RckikList, Pagination)
 * - Zarządza stanem poprzez useRckikList hook
 * - Responsive layout (mobile drawer, desktop sidebar)
 * - ErrorBoundary wrapper dla error handling
 */
export default function RckikListApp({
  initialData,
  initialParams,
  availableCities
}: RckikListAppProps) {
  const isMobile = useIsMobile();
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);

  // Main hook - zarządza stanem listy, fetching, URL sync
  const { data, loading, error, params, updateParams, refetch } = useRckikList(initialData);

  // Handle search change (memoized to prevent unnecessary SearchBar re-renders)
  const handleSearchChange = useCallback((search: string) => {
    updateParams({ search });
  }, [updateParams]);

  // Handle filters change (memoized)
  const handleFiltersChange = useCallback((filters: any) => {
    updateParams(filters);
    // Zamknij drawer na mobile po zmianie filtrów
    if (isMobile) {
      setIsFiltersPanelOpen(false);
    }
  }, [updateParams, isMobile]);

  // Handle page change (memoized)
  const handlePageChange = useCallback((page: number) => {
    updateParams({ page });
    // Scroll to top po zmianie strony
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateParams]);

  // Handle page size change (memoized)
  const handlePageSizeChange = useCallback((size: number) => {
    updateParams({ size, page: 0 });
  }, [updateParams]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters - Sidebar na desktop, drawer na mobile */}
        {isMobile ? (
          <>
            {/* Mobile: Filter toggle button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setIsFiltersPanelOpen(true)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
                           flex items-center justify-center gap-2
                           text-gray-700 font-medium
                           hover:bg-gray-50 transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Otwórz filtry"
              >
                <svg
                  className="w-5 h-5"
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filtry
                {params.search && (
                  <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                    Aktywne
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: Drawer */}
            <FiltersPanel
              initialFilters={params}
              availableCities={availableCities}
              onFiltersChange={handleFiltersChange}
              isMobile={true}
              isOpen={isFiltersPanelOpen}
              onClose={() => setIsFiltersPanelOpen(false)}
            />
          </>
        ) : (
          /* Desktop: Sidebar */
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-6">
              <FiltersPanel
                initialFilters={params}
                availableCities={availableCities}
                onFiltersChange={handleFiltersChange}
                isMobile={false}
                isOpen={true}
                onClose={() => {}}
              />
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="mb-6">
            <SearchBar
              initialValue={params.search}
              onSearchChange={handleSearchChange}
              placeholder="Szukaj centrum po nazwie..."
            />
          </div>

          {/* Results info - tylko gdy nie ładujemy */}
          {!loading && data && (
            <div className="mb-4 text-sm text-gray-600">
              Znaleziono <span className="font-semibold">{data.totalElements}</span>{' '}
              {data.totalElements === 1
                ? 'centrum'
                : data.totalElements < 5
                ? 'centra'
                : 'centrów'}
            </div>
          )}

          {/* List */}
          <RckikList data={loading ? null : data} loading={loading} error={error} />

          {/* Pagination */}
          {data && data.totalPages > 1 && !loading && (
            <div className="mt-8">
              <Pagination
                currentPage={params.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                isFirst={data.first}
                isLast={data.last}
                pageSize={params.size}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
