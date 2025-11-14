import { useState, useEffect, useCallback, useRef } from 'react';
import { scraperApi } from '@/lib/api/endpoints/scraper';
import type { ScraperGlobalStatusDto } from '@/lib/types/scraper';

/**
 * Custom hook dla zarządzania globalnym statusem scrapera
 *
 * Features:
 * - Auto-refresh co X sekund (domyślnie 30s)
 * - Manual refresh (refetch)
 * - Error handling
 * - Loading states
 * - Automatyczne czyszczenie intervalów
 *
 * Usage:
 * ```tsx
 * const { status, isRefreshing, error, refetch } = useScraperGlobalStatus(initialData, {
 *   autoRefresh: true,
 *   refreshInterval: 30000
 * });
 * ```
 */

interface UseScraperGlobalStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // w milisekundach
}

interface UseScraperGlobalStatusReturn {
  status: ScraperGlobalStatusDto | null;
  isRefreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useScraperGlobalStatus(
  initialData: ScraperGlobalStatusDto,
  options: UseScraperGlobalStatusOptions = {}
): UseScraperGlobalStatusReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 sekund domyślnie
  } = options;

  // State
  const [status, setStatus] = useState<ScraperGlobalStatusDto | null>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);

  // Refs dla cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch status from API
   */
  const fetchStatus = useCallback(async () => {
    // Prevent multiple concurrent fetches
    if (isRefreshing) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const data = await scraperApi.getGlobalStatus();

      // Only update if component is still mounted
      if (isMountedRef.current) {
        setStatus(data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Failed to fetch global status');
        setError(error);
        console.error('Error fetching scraper global status:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [isRefreshing]);

  /**
   * Manual refetch (exposed to component)
   */
  const refetch = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  /**
   * Fetch immediately on mount if no initial data
   */
  useEffect(() => {
    if (!initialData) {
      fetchStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Setup new interval
    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, refreshInterval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isRefreshing,
    error,
    refetch,
    lastUpdated,
  };
}
