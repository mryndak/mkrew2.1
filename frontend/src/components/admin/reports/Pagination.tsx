import React from 'react';
import { Select } from '@/components/ui/Select';

/**
 * Pagination - Komponent paginacji dla listy raportów
 *
 * Extended version z dodatkowymi features:
 * - Informacja o wynikach (Wyświetlanie 1-20 z 45 wyników)
 * - Select rozmiaru strony (20, 50, 100)
 * - Previous/Next buttons
 * - Page numbers (z ellipsis dla długich list)
 * - Responsywny design
 */

interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: PaginationProps) {
  // Oblicz zakres wyświetlanych elementów
  const startElement = currentPage * pageSize + 1;
  const endElement = Math.min((currentPage + 1) * pageSize, totalElements);

  // Jeśli brak wyników, nie pokazuj paginacji
  if (totalElements === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange(newSize);
  };

  /**
   * Generate page numbers array with ellipsis
   */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      if (currentPage <= 2) {
        // Near start
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // Near end
        pages.push('ellipsis');
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Page size options
  const pageSizeOptions = [
    { value: '20', label: '20' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ];

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
      {/* Mobile view */}
      <div className="flex flex-col gap-4 sm:hidden">
        {/* Results info */}
        <div className="text-sm text-gray-700 text-center">
          Wyświetlanie <span className="font-medium">{startElement}</span>-
          <span className="font-medium">{endElement}</span> z{' '}
          <span className="font-medium">{totalElements}</span> wyników
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={disabled || currentPage === 0}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Poprzednia
          </button>
          <span className="text-sm text-gray-700">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={disabled || currentPage === totalPages - 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Następna
          </button>
        </div>

        {/* Page size selector */}
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="mobile-page-size" className="text-sm text-gray-700">
            Na stronę:
          </label>
          <select
            id="mobile-page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={disabled}
            className="rounded-md border-gray-300 text-sm focus:border-red-500 focus:ring-red-500"
          >
            {pageSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        {/* Left: Results info + page size */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">
            Wyświetlanie <span className="font-medium">{startElement}</span>-
            <span className="font-medium">{endElement}</span> z{' '}
            <span className="font-medium">{totalElements}</span> wyników
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="desktop-page-size" className="text-sm text-gray-700">
              Na stronę:
            </label>
            <select
              id="desktop-page-size"
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={disabled}
              className="rounded-md border-gray-300 text-sm focus:border-red-500 focus:ring-red-500 py-1.5 px-2"
            >
              {pageSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Page navigation */}
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginacja">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={disabled || currentPage === 0}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Poprzednia strona"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Page numbers */}
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={disabled || isCurrentPage}
                aria-current={isCurrentPage ? 'page' : undefined}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors ${
                  isCurrentPage
                    ? 'z-10 bg-red-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                } disabled:cursor-not-allowed`}
              >
                {page + 1}
              </button>
            );
          })}

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={disabled || currentPage === totalPages - 1}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Następna strona"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
