import { useState, useEffect, useCallback, useRef } from 'react';
import { scraperApi } from '@/lib/api/endpoints/scraper';
import type { ScraperRunDetailsDto } from '@/lib/types/scraper';

/**
 * Custom hook do pobierania szczegółów uruchomienia scrapera
 *
 * Features:
 * - Lazy loading (fetch tylko gdy runId jest podany)
 * - Loading state
 * - Error handling
 * - Manual refetch
 *
 * Usage:
 * ```tsx
 * const { details, isLoading, error, refetch } = useScraperRunDetails(runId);
 * ```
 */

interface UseScraperRunDetailsReturn {
  details: ScraperRunDetailsDto | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useScraperRunDetails(
  runId: number | null
): UseScraperRunDetailsReturn {
  const [details, setDetails] = useState<ScraperRunDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  /**
   * Fetch details from API
   */
  const fetchDetails = useCallback(async () => {
    if (!runId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await scraperApi.getRunDetails(runId);

      if (isMountedRef.current) {
        setDetails(data);
        setError(null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Failed to fetch run details');
        setError(error);

        // Handle specific errors
        if (err.response?.status === 404) {
          console.error('Run not found:', runId);
        } else {
          console.error('Error fetching run details:', error);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [runId]);

  /**
   * Manual refetch (exposed to component)
   */
  const refetch = useCallback(async () => {
    await fetchDetails();
  }, [fetchDetails]);

  /**
   * Fetch details when runId changes
   */
  useEffect(() => {
    if (runId) {
      fetchDetails();
    } else {
      // Reset state when runId is null
      setDetails(null);
      setError(null);
    }
  }, [runId, fetchDetails]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    details,
    isLoading,
    error,
    refetch,
  };
}
