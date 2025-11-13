import type { DonationResponse } from '@/types/dashboard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';

export interface DonationTableProps {
  donations: DonationResponse[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
  };
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string, order: 'ASC' | 'DESC') => void;
  onPageChange: (page: number) => void;
  onEdit: (donationId: number) => void;
  onDelete: (donationId: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

/**
 * DonationTable - Tabela donacji z paginacją i sortowaniem
 *
 * Features:
 * - Sortowalne nagłówki kolumn
 * - Wiersze z danymi donacji
 * - Badge dla typu donacji (z kolorami)
 * - Ikona potwierdzenia (confirmed)
 * - Przyciski akcji (Edytuj, Usuń)
 * - Paginacja (Previous, Next, numery stron)
 * - Empty state (brak donacji / brak wyników filtrów)
 * - Loading state (SkeletonTable)
 * - Responsywny (scroll horizontal na mobile)
 *
 * @example
 * ```tsx
 * <DonationTable
 *   donations={donations}
 *   pagination={pagination}
 *   isLoading={false}
 *   sortBy="donationDate"
 *   sortOrder="DESC"
 *   onSort={handleSort}
 *   onPageChange={handlePageChange}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   hasFilters={false}
 *   onClearFilters={handleClearFilters}
 * />
 * ```
 */
export function DonationTable({
  donations,
  pagination,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  onEdit,
  onDelete,
  hasFilters,
  onClearFilters,
}: DonationTableProps) {
  /**
   * Format date to readable format (DD.MM.YYYY)
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Get badge variant for donation type
   */
  const getDonationTypeBadge = (type: string): { label: string; variant: 'success' | 'info' | 'warning' | 'neutral' } => {
    switch (type) {
      case 'FULL_BLOOD':
        return { label: 'Krew pełna', variant: 'success' };
      case 'PLASMA':
        return { label: 'Osocze', variant: 'info' };
      case 'PLATELETS':
        return { label: 'Płytki krwi', variant: 'warning' };
      case 'OTHER':
        return { label: 'Inne', variant: 'neutral' };
      default:
        return { label: type, variant: 'neutral' };
    }
  };

  /**
   * Handle sort click
   */
  const handleSortClick = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'DESC' ? 'ASC' : 'DESC';
    onSort(field, newOrder);
  };

  /**
   * Calculate total pages
   */
  const totalPages = Math.ceil(pagination.totalElements / pagination.size);
  const currentPage = pagination.page;

  /**
   * Generate page numbers for pagination
   */
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show subset with current page in middle
      const start = Math.max(0, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add first page if not included
      if (!pages.includes(0)) {
        pages.unshift(0);
        if (pages[1] !== 1) {
          pages.splice(1, 0, -1); // -1 represents ellipsis
        }
      }

      // Add last page if not included
      if (!pages.includes(totalPages - 1)) {
        if (pages[pages.length - 1] !== totalPages - 2) {
          pages.push(-1); // -1 represents ellipsis
        }
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  // Loading state
  if (isLoading && donations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  // Empty state
  if (!isLoading && donations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {hasFilters ? 'Brak wyników' : 'Brak donacji'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {hasFilters
              ? 'Nie znaleziono donacji spełniających kryteria. Spróbuj zmienić filtry.'
              : 'Nie masz jeszcze żadnych donacji. Dodaj swoją pierwszą donację, aby śledzić historię.'}
          </p>
          <div className="mt-6">
            {hasFilters ? (
              <Button variant="outline" onClick={onClearFilters}>
                Wyczyść filtry
              </Button>
            ) : (
              <Button variant="primary" onClick={() => onEdit(0)}>
                Dodaj pierwszą donację
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              {/* Data */}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSortClick('donationDate')}
              >
                <div className="flex items-center gap-1">
                  Data
                  {sortBy === 'donationDate' && (
                    <span className="text-primary-600">
                      {sortOrder === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>

              {/* Centrum RCKiK */}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Centrum RCKiK
              </th>

              {/* Typ */}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Typ
              </th>

              {/* Ilość */}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSortClick('quantityMl')}
              >
                <div className="flex items-center gap-1">
                  Ilość (ml)
                  {sortBy === 'quantityMl' && (
                    <span className="text-primary-600">
                      {sortOrder === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>

              {/* Potwierdzone */}
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Potwierdzone
              </th>

              {/* Akcje */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation) => {
              const typeBadge = getDonationTypeBadge(donation.donationType);

              return (
                <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                  {/* Data */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(donation.donationDate)}
                  </td>

                  {/* Centrum RCKiK */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{donation.rckik.name}</div>
                      <div className="text-gray-500">{donation.rckik.city}</div>
                    </div>
                  </td>

                  {/* Typ */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={typeBadge.variant} size="small">
                      {typeBadge.label}
                    </Badge>
                  </td>

                  {/* Ilość */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.quantityMl} ml
                  </td>

                  {/* Potwierdzone */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {donation.confirmed ? (
                      <svg
                        className="h-5 w-5 text-green-500 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Akcje */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => onEdit(donation.id)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Edytuj
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => onDelete(donation.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Usuń
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Info */}
            <div className="text-sm text-gray-700">
              Strona <span className="font-medium">{currentPage + 1}</span> z{' '}
              <span className="font-medium">{totalPages}</span>
              {' · '}
              <span className="font-medium">{pagination.totalElements}</span> donacji
            </div>

            {/* Page buttons */}
            <div className="flex gap-1">
              {/* Previous */}
              <Button
                variant="outline"
                size="small"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Poprzednia
              </Button>

              {/* Page numbers */}
              {getPageNumbers().map((pageNum, idx) => {
                if (pageNum === -1) {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-500">
                      ...
                    </span>
                  );
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}

              {/* Next */}
              <Button
                variant="outline"
                size="small"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
              >
                Następna
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
