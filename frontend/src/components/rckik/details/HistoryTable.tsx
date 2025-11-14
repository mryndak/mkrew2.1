import { useState, useMemo } from 'react';
import { useBloodLevelHistory } from '@/lib/hooks/useBloodLevelHistory';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pagination } from '../Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import type {
  HistoryTableProps,
  HistoryTableFilters,
  TableSortConfig,
  BloodGroup,
} from '@/types/rckik';

/**
 * HistoryTable - tabela z historycznymi snapshotami poziomów krwi
 *
 * Funkcje:
 * - Sortowanie po kolumnach (data, grupa krwi, poziom)
 * - Filtrowanie (grupa krwi, zakres dat)
 * - Paginacja
 * - Loading/Error/Empty states
 * - Responsive (horizontal scroll na mobile)
 *
 * Kolumny:
 * - Data snapshotu
 * - Grupa krwi
 * - Poziom % (z kolorowym badge statusu)
 * - Status (badge tekstowy)
 * - Czas pobrania
 * - Źródło (Ręczne/Automatyczne)
 */
export function HistoryTable({
  rckikId,
  initialPage = 0,
  initialPageSize = 20,
  initialFilters = {},
}: HistoryTableProps) {
  // State dla filtrów
  const [filters, setFilters] = useState<HistoryTableFilters>(initialFilters);

  // State dla sortowania
  const [sort, setSort] = useState<TableSortConfig>({
    sortBy: 'snapshotDate',
    sortOrder: 'DESC',
  });

  // State dla paginacji
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Fetch history z hooka
  const { snapshots, pagination, loading, error, refetch } = useBloodLevelHistory(
    rckikId,
    {
      ...filters,
      page,
      size: pageSize,
    }
  );

  // Local sorting (client-side) - API może nie wspierać sortowania
  const sortedSnapshots = useMemo(() => {
    if (!snapshots) return [];

    const sorted = [...snapshots];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sort.sortBy) {
        case 'snapshotDate':
          comparison = new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime();
          break;
        case 'bloodGroup':
          comparison = a.bloodGroup.localeCompare(b.bloodGroup);
          break;
        case 'levelPercentage':
          comparison = Number(a.levelPercentage) - Number(b.levelPercentage);
          break;
      }

      return sort.sortOrder === 'ASC' ? comparison : -comparison;
    });

    return sorted;
  }, [snapshots, sort]);

  // Wszystkie grupy krwi dla filtra
  const ALL_BLOOD_GROUPS: BloodGroup[] = [
    '0+',
    '0-',
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
  ];

  // Handle sort change
  const handleSort = (column: TableSortConfig['sortBy']) => {
    setSort((prev) => ({
      sortBy: column,
      sortOrder:
        prev.sortBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  // Handle filter change
  const handleFilterChange = (key: keyof HistoryTableFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0); // Reset do pierwszej strony przy zmianie filtrów
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  // Format date
  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  // Format timestamp
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (
    status: string
  ): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'OK':
        return 'success';
      case 'IMPORTANT':
        return 'warning';
      case 'CRITICAL':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Status labels
  const statusLabels = {
    CRITICAL: 'Krytyczny',
    IMPORTANT: 'Ważny',
    OK: 'Wystarczający',
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: TableSortConfig['sortBy'] }) => {
    if (sort.sortBy !== column) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sort.sortOrder === 'ASC' ? (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  // Loading state
  if (loading && !snapshots) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" role="status" aria-live="polite">
        <span className="sr-only">Ładowanie historii snapshotów...</span>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Historia snapshotów
        </h2>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
        Historia snapshotów
      </h2>

      {/* Filters Bar */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Blood Group Filter */}
          <div>
            <Select
              id="bloodGroupFilter"
              label="Grupa krwi"
              value={filters.bloodGroup || ''}
              onChange={(e) =>
                handleFilterChange(
                  'bloodGroup',
                  e.target.value ? (e.target.value as BloodGroup) : undefined
                )
              }
              options={[
                { value: '', label: 'Wszystkie grupy' },
                ...ALL_BLOOD_GROUPS.map((group) => ({
                  value: group,
                  label: group,
                })),
              ]}
            />
          </div>

          {/* Date From Filter */}
          <div>
            <label
              htmlFor="fromDateFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data od
            </label>
            <Input
              id="fromDateFilter"
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label
              htmlFor="toDateFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data do
            </label>
            <Input
              id="toDateFilter"
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filters.bloodGroup || filters.fromDate || filters.toDate) && (
          <div className="flex justify-start">
            <Button variant="outline" size="medium" onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          </div>
        )}
      </div>

      {/* Table - Responsive wrapper */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
        {sortedSnapshots.length === 0 ? (
          <EmptyState
            title="Brak snapshotów"
            message="Nie znaleziono snapshotów dla wybranych filtrów"
            onReset={clearFilters}
          />
        ) : (
          <>
            <table
              className="min-w-full divide-y divide-gray-200"
              aria-label="Historia snapshotów poziomów krwi"
              role="table"
            >
              <thead className="bg-gray-50">
                <tr>
                  {/* Data snapshotu */}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('snapshotDate')}
                    aria-sort={
                      sort.sortBy === 'snapshotDate'
                        ? sort.sortOrder === 'ASC'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>Data</span>
                      <SortIcon column="snapshotDate" />
                    </div>
                  </th>

                  {/* Grupa krwi */}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bloodGroup')}
                    aria-sort={
                      sort.sortBy === 'bloodGroup'
                        ? sort.sortOrder === 'ASC'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>Grupa</span>
                      <SortIcon column="bloodGroup" />
                    </div>
                  </th>

                  {/* Poziom % */}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('levelPercentage')}
                    aria-sort={
                      sort.sortBy === 'levelPercentage'
                        ? sort.sortOrder === 'ASC'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>Poziom</span>
                      <SortIcon column="levelPercentage" />
                    </div>
                  </th>

                  {/* Status */}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>

                  {/* Czas pobrania */}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Pobranie
                  </th>

                  {/* Źródło */}
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Źródło
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSnapshots.map((snapshot) => (
                  <tr
                    key={snapshot.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Data */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(snapshot.snapshotDate)}
                    </td>

                    {/* Grupa krwi */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {snapshot.bloodGroup}
                    </td>

                    {/* Poziom % */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className="font-semibold text-gray-900">
                        {Number(snapshot.levelPercentage).toFixed(1)}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Badge
                        variant={getStatusBadgeVariant(snapshot.levelStatus)}
                        size="small"
                      >
                        {statusLabels[snapshot.levelStatus]}
                      </Badge>
                    </td>

                    {/* Czas pobrania */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(snapshot.scrapedAt)}
                    </td>

                    {/* Źródło */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Badge
                        variant={snapshot.isManual ? 'info' : 'neutral'}
                        size="small"
                      >
                        {snapshot.isManual ? 'Ręczne' : 'Automatyczne'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalElements={pagination.totalElements}
                  isFirst={pagination.first}
                  isLast={pagination.last}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(0); // Reset do pierwszej strony
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Info text */}
      {sortedSnapshots.length > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          Wyświetlanie {sortedSnapshots.length} z {pagination?.totalElements || 0}{' '}
          snapshotów
        </p>
      )}
    </div>
  );
}
