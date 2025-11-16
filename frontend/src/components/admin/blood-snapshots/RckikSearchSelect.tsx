import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRckikList } from '@/lib/api/endpoints/rckik';
import type { RckikBasicDto } from '@/lib/types/bloodSnapshots';

/**
 * Props dla RckikSearchSelect
 */
interface RckikSearchSelectProps {
  value: number | null;
  onChange: (rckikId: number | null, rckik?: RckikBasicDto) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * RckikSearchSelect - Typeahead dropdown z wyszukiwaniem centrów RCKiK
 *
 * Features:
 * - Wyszukiwanie po nazwie lub kodzie (debounced 300ms)
 * - Podświetlenie dopasowania w wynikach
 * - Skeleton podczas ładowania
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Click outside → zamknij dropdown
 * - Pokazuje tylko aktywne RCKiK
 *
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function RckikSearchSelect({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: RckikSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<RckikBasicDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRckik, setSelectedRckik] = useState<RckikBasicDto | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  /**
   * Fetch RCKiK list z API
   */
  const fetchRckiks = useCallback(async (search: string) => {
    setIsLoading(true);
    try {
      const response = await fetchRckikList({
        page: 0,
        size: 20,
        search: search.trim(),
        active: true, // Tylko aktywne
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      // Mapuj na RckikBasicDto
      const mapped: RckikBasicDto[] = response.content.map((rckik) => ({
        id: rckik.id,
        name: rckik.name,
        code: rckik.code,
        city: rckik.city,
        isActive: rckik.active,
      }));

      setResults(mapped);
    } catch (err) {
      console.error('Failed to fetch RCKiK list:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Debounced search
   */
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        if (query.trim().length >= 2 || query.trim().length === 0) {
          fetchRckiks(query);
        }
      }, 300);
    },
    [fetchRckiks]
  );

  /**
   * Initial load - fetch all RCKiK when opening
   */
  useEffect(() => {
    if (isOpen && results.length === 0 && !isLoading) {
      fetchRckiks('');
    }
  }, [isOpen, results.length, isLoading, fetchRckiks]);

  /**
   * Load selected RCKiK details if value is set
   */
  useEffect(() => {
    if (value && !selectedRckik) {
      // Find in current results
      const found = results.find((r) => r.id === value);
      if (found) {
        setSelectedRckik(found);
      } else {
        // Fetch from API if not in results
        fetchRckikList({
          page: 0,
          size: 1,
          search: '',
          active: true,
          sortBy: 'name',
          sortOrder: 'ASC',
        }).then((response) => {
          const found = response.content.find((r) => r.id === value);
          if (found) {
            setSelectedRckik({
              id: found.id,
              name: found.name,
              code: found.code,
              city: found.city,
              isActive: found.active,
            });
          }
        });
      }
    }
  }, [value, selectedRckik, results]);

  /**
   * Handle selection
   */
  const handleSelect = useCallback(
    (rckik: RckikBasicDto) => {
      setSelectedRckik(rckik);
      onChange(rckik.id, rckik);
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    },
    [onChange]
  );

  /**
   * Handle clear
   */
  const handleClear = useCallback(() => {
    setSelectedRckik(null);
    onChange(null);
    setSearchQuery('');
    setFocusedIndex(-1);
  }, [onChange]);

  /**
   * Click outside → close
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && results[focusedIndex]) {
            handleSelect(results[focusedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [isOpen, results, focusedIndex, handleSelect]
  );

  /**
   * Highlight matching text
   */
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 font-semibold">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedRckik ? `${selectedRckik.name} (${selectedRckik.code})` : searchQuery}
          onChange={(e) => {
            if (!selectedRckik) {
              handleSearchChange(e.target.value);
            }
          }}
          onFocus={() => {
            if (!selectedRckik) {
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (selectedRckik) {
              handleClear();
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedRckik ? '' : 'Szukaj centrum RCKiK...'}
          className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          required={required}
        />

        {/* Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {selectedRckik ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Wyczyść"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Ładowanie...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery.trim().length < 2
                ? 'Wpisz co najmniej 2 znaki aby wyszukać'
                : 'Nie znaleziono centrów RCKiK'}
            </div>
          ) : (
            <ul>
              {results.map((rckik, index) => (
                <li key={rckik.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(rckik)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      index === focusedIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {highlightMatch(rckik.name, searchQuery)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {highlightMatch(rckik.code, searchQuery)} • {rckik.city}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
