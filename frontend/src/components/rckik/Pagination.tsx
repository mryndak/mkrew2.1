import type { PaginationProps } from '../../types/rckik';

/**
 * Pagination - kontrolki paginacji dla listy RCKiK
 * - Previous/Next buttons (disabled states)
 * - Page numbers (current highlighted)
 * - Page size selector (10, 20, 50)
 * - Accessibility: nav element, aria-label, keyboard navigation
 */
export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  isFirst,
  isLast,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  // Generuj numery stron do wyświetlenia
  // Pokazuj: [1] ... [current-1] [current] [current+1] ... [last]
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Pokaż wszystkie strony jeśli jest mało
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Zawsze pokaż pierwszą stronę
      pages.push(0);

      if (currentPage > 2) {
        pages.push('ellipsis');
      }

      // Pokaż strony wokół current page
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('ellipsis');
      }

      // Zawsze pokaż ostatnią stronę
      pages.push(totalPages - 1);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Page size options
  const pageSizeOptions = [10, 20, 50];

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
      aria-label="Paginacja listy centrów krwiodawstwa"
    >
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Wyświetlanie <span className="font-medium">{currentPage * pageSize + 1}</span>-
        <span className="font-medium">
          {Math.min((currentPage + 1) * pageSize, totalElements)}
        </span>{' '}
        z <span className="font-medium">{totalElements}</span> centrów
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Poprzednia strona"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-400"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isActive}
                className={`px-3 py-2 rounded-lg border transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-primary-500
                           ${
                             isActive
                               ? 'bg-primary-600 text-white border-primary-600 cursor-default'
                               : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                           }`}
                aria-label={`Strona ${page + 1}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page + 1}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Następna strona"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="page-size" className="text-gray-600">
          Pokaż:
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700
                     bg-white cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     transition-colors duration-200"
          aria-label="Wybierz liczbę elementów na stronie"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}
