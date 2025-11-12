import { useState, useEffect } from 'react';

/**
 * Debounce hook dla search inputu
 * Opóźnia aktualizację wartości o określony czas (delay)
 *
 * @param value - wartość do debounce
 * @param delay - opóźnienie w ms (default 500)
 * @returns debounced wartość
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // API call z debouncedSearchTerm
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Ustaw timer do aktualizacji debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup funkcja - anuluj timer jeśli value zmienia się przed delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
