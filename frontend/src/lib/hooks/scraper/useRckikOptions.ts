import { useState, useEffect } from 'react';
import { fetchRckikList } from '@/lib/api/endpoints/rckik';
import type { RckikBasicDto } from '@/lib/types/scraper';

/**
 * Custom hook dla pobierania listy wszystkich aktywnych RCKiK dla scraper modal
 *
 * Features:
 * - Fetch wszystkich aktywnych RCKiK przy montowaniu
 * - Mapowanie z RckikSummary na RckikBasicDto
 * - Loading states
 * - Error handling
 *
 * Usage:
 * ```tsx
 * const { rckikOptions, isLoading, error } = useRckikOptions();
 * ```
 */

interface UseRckikOptionsReturn {
  rckikOptions: RckikBasicDto[];
  isLoading: boolean;
  error: Error | null;
}

export function useRckikOptions(): UseRckikOptionsReturn {
  const [rckikOptions, setRckikOptions] = useState<RckikBasicDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch wszystkich aktywnych RCKiK (size=200 powinno wystarczyć)
        const response = await fetchRckikList({
          page: 0,
          size: 200,
          search: '',
          city: null,
          active: true,
          sortBy: 'name',
          sortOrder: 'ASC',
        });

        // Mapuj RckikSummary na RckikBasicDto
        const options: RckikBasicDto[] = response.content.map((rckik) => ({
          id: rckik.id,
          name: rckik.name,
          code: rckik.code,
          city: rckik.city,
        }));

        setRckikOptions(options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch RCKiK options');
        setError(error);
        console.error('Error fetching RCKiK options:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return {
    rckikOptions,
    isLoading,
    error,
  };
}
