import { useState, useEffect } from 'react';
import { useDebounce } from '../../lib/hooks/useDebounce';
import type { SearchBarProps } from '../../types/rckik';

/**
 * SearchBar - wyszukiwanie centrów RCKiK po nazwie
 * - Debounce mechanism (500ms)
 * - Clear button (pokazany gdy input nie pusty)
 * - Ikona search
 * - Accessibility: label dla screen readers
 */
export function SearchBar({
  initialValue,
  onSearchChange,
  placeholder = 'Szukaj centrum po nazwie...'
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Wywołaj callback po debounce
  useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  // Handle clear button
  const handleClear = () => {
    setSearchTerm('');
    onSearchChange(''); // Immediate search reset
  };

  // Handle Enter key (skip debounce)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchChange(searchTerm);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="rckik-search" className="sr-only">
        Wyszukaj centrum krwiodawstwa
      </label>

      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search Input */}
        <input
          id="rckik-search"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={100}
          className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-300
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     transition-all duration-200"
          aria-label="Wyszukaj centrum krwiodawstwa po nazwie"
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400
                       hover:text-gray-600 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Wyczyść wyszukiwanie"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Helper text for debounce indicator (optional) */}
      {searchTerm && searchTerm !== debouncedSearchTerm && (
        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
          <svg
            className="animate-spin h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Wyszukiwanie...
        </p>
      )}
    </div>
  );
}
