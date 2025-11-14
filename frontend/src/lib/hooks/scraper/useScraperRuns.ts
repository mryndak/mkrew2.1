import { useState, useEffect, useCallback, useRef } from 'react';
import { scraperApi } from '@/lib/api/endpoints/scraper';
import type {
  ScraperRunDto,
  RunsFilters,
  PaginationParams,
  RunsListResponse,
} from '@/lib/types/scraper';

/**
 * Custom hook dla zarządzania listą uruchomień scrapera
 *
 * Features:
 * - Filtrowanie (Run Type, Status, Date Range)
 * - Paginacja
 * - Auto-refresh dla running runs (co 10s)
 * - Loading states
 * - Error handling
 *
 * Usage:
 * ```tsx
 * const {
 *   runs,
 *   filters,
 *   pagination,
 *   totalPages,
 *   isLoading,
 *   hasRunningRun,
 *   updateFilters,
 *   changePage,
 *   refetch
 * } = useScraperRuns(initialData, initialFilters);
 * ```
 */

interface UseScraperRunsOptions {
  initialData: RunsListResponse;
  initialFilters: RunsFilters;
}

interface UseScraperRunsReturn {
  runs: ScraperRunDto[];
  filters: RunsFilters;
  pagination: PaginationParams;
  totalPages: number;
  totalElements: number;
  isLoading: boolean;
  error: Error | null;
  hasRunningRun: boolean;
  updateFilters: (newFilters: Partial<RunsFilters>) => void;
  changePage: (newPage: number) => void;
  refetch: () => Promise<void>;
}

export function useScraperRuns({
  initialData,
  initialFilters,
}: UseScraperRunsOptions): UseScraperRunsReturn {
  // State
  const [runs, setRuns] = useState<ScraperRunDto[]>(initialData?.runs || []);
  const [filters, setFilters] = useState<RunsFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: initialData?.page || 0,
    size: 20,
  });
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 0);
  const [totalElements, setTotalElements] = useState(initialData?.totalElements || 0);
  // Set loading to true if initial data is empty (will fetch from API)
  const [isLoading, setIsLoading] = useState(!initialData?.runs || initialData.runs.length === 0);
  const [error, setError] = useState<Error | null>(null);

  // Check if any run is RUNNING
  const hasRunningRun = runs?.some(run => run.status === 'RUNNING') || false;

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch runs from API
   */
  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await scraperApi.getRuns(filters, pagination);

      if (isMountedRef.current) {
        setRuns(data.runs || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Failed to fetch runs');
        setError(error);
        console.error('Error fetching scraper runs:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters, pagination]);

  /**
   * Manual refetch (exposed to component)
   */
  const refetch = useCallback(async () => {
    await fetchRuns();
  }, [fetchRuns]);

  /**
   * Update filters (resets page to 0)
   */
  const updateFilters = useCallback((newFilters: Partial<RunsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 0 }));
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  /**
   * Fetch runs when filters or pagination change
   */
  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  /**
   * Setup auto-refresh for running runs
   */
  useEffect(() => {
    if (!hasRunningRun) {
      // Clear interval if no running runs
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Setup auto-refresh co 10s
    intervalRef.current = setInterval(() => {
      fetchRuns();
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasRunningRun, fetchRuns]);

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
    runs,
    filters,
    pagination,
    totalPages,
    totalElements,
    isLoading,
    error,
    hasRunningRun,
    updateFilters,
    changePage,
    refetch,
  };
}
