import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRckikList } from '../api/endpoints/rckik';
import type {
  RckikListState,
  RckikSearchParams,
  RckikListApiResponse
} from '../../types/rckik';
import { DEFAULT_RCKIK_SEARCH_PARAMS } from '../../types/rckik';

// Throttling configuration
// Note: This throttling prevents excessive API calls from rapid user interactions
// (e.g., clicking filters quickly). It's different from retry logic in axios interceptor.
const THROTTLE_DELAY_MS = 1000; // 1 second

/**
 * Hook do zarządzania listą RCKiK
 * Synchronizuje parametry z URL i wykonuje API calls
 * Includes throttling (1 request per second) to prevent excessive API calls from rapid user interactions
 *
 * Note: Error handling and retry logic is handled by axios interceptor (see client.ts)
 *
 * @param initialData - Opcjonalne początkowe dane (z SSR)
 * @returns Stan listy RCKiK wraz z funkcjami do zarządzania
 *
 * @example
 * const { data, loading, error, params, updateParams, refetch } = useRckikList(initialData);
 */
export function useRckikList(initialData?: RckikListApiResponse | null) {
  // Throttling refs
  const lastFetchTimeRef = useRef<number>(0);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Parse params z URL
  const getParamsFromUrl = useCallback((): RckikSearchParams => {
    if (typeof window === 'undefined') {
      return DEFAULT_RCKIK_SEARCH_PARAMS;
    }

    const searchParams = new URLSearchParams(window.location.search);

    return {
      page: Math.max(0, parseInt(searchParams.get('page') || '0')),
      size: Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20'))),
      search: searchParams.get('search') || '',
      city: searchParams.get('city') || null,
      active: searchParams.get('active') !== 'false',
      sortBy: (searchParams.get('sortBy') as 'name' | 'city' | 'code') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC'
    };
  }, []);

  const [state, setState] = useState<RckikListState>({
    data: initialData || null,
    loading: !initialData,
    error: null,
    params: getParamsFromUrl()
  });

  /**
   * Helper: sprawdź czy parametry się zmieniły
   */
  const paramsChanged = useCallback((oldParams: RckikSearchParams, newParams: RckikSearchParams): boolean => {
    return JSON.stringify(oldParams) !== JSON.stringify(newParams);
  }, []);

  /**
   * Fetch data z API with throttling
   */
  const fetchData = useCallback(async (params: RckikSearchParams, skipThrottle = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    // Check throttle (skip on first load or when explicitly skipped)
    if (!skipThrottle && lastFetchTimeRef.current > 0 && timeSinceLastFetch < THROTTLE_DELAY_MS) {
      // Clear previous timer if exists
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      // Schedule fetch after throttle delay
      const remainingDelay = THROTTLE_DELAY_MS - timeSinceLastFetch;
      console.log(`Throttling API request. Następne zapytanie za ${remainingDelay}ms`);

      throttleTimerRef.current = setTimeout(() => {
        fetchData(params, true); // Skip throttle on scheduled call
      }, remainingDelay);

      return;
    }

    // Update throttle tracking
    lastFetchTimeRef.current = now;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchRckikList(params);
      setState(prev => ({
        ...prev,
        data,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to fetch RCKiK list:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
        loading: false
      }));
    }
  }, []);

  /**
   * Update URL params i trigger fetch
   */
  const updateParams = useCallback((newParams: Partial<RckikSearchParams>) => {
    setState(prev => {
      const currentParams = prev.params;
      const updated = { ...currentParams, ...newParams };

      console.log('updateParams called:', { newParams, currentParams, updated });

      // Reset page do 0 przy zmianie filtrów (nie paginacji)
      // WAŻNE: Resetuj tylko gdy wartość faktycznie się zmienia!
      const filtersChanged =
        (newParams.city !== undefined && newParams.city !== currentParams.city) ||
        (newParams.search !== undefined && newParams.search !== currentParams.search) ||
        (newParams.active !== undefined && newParams.active !== currentParams.active) ||
        (newParams.sortBy !== undefined && newParams.sortBy !== currentParams.sortBy) ||
        (newParams.sortOrder !== undefined && newParams.sortOrder !== currentParams.sortOrder);

      if (filtersChanged && newParams.page === undefined) {
        console.log('Filtry się zmieniły - resetuję page do 0');
        updated.page = 0;
      }

      // Sprawdź czy parametry się zmieniły
      if (!paramsChanged(currentParams, updated)) {
        console.log('Parametry nie zmieniły się - pomijam fetch');
        return prev; // Nie zmieniaj stanu
      }

      console.log('Parametry zmieniły się - wykonuję fetch');

      // Build URL params
      const urlParams = new URLSearchParams();
      Object.entries(updated).forEach(([key, value]) => {
        const defaultValue = DEFAULT_RCKIK_SEARCH_PARAMS[key as keyof RckikSearchParams];

        // Dodaj tylko wartości różne od default
        if (value !== null && value !== '' && value !== defaultValue) {
          urlParams.set(key, String(value));
        }
      });

      // Update URL bez przeładowania strony
      const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
      window.history.pushState({}, '', newUrl);

      // Fetch nowe dane
      fetchData(updated);

      // Return updated state with new params
      return {
        ...prev,
        params: updated
      };
    });
  }, [fetchData, paramsChanged]);

  /**
   * Refetch z obecnymi parametrami (force refresh)
   */
  const refetch = useCallback(() => {
    fetchData(state.params, true); // Skip throttle on manual refresh
  }, [fetchData, state.params]);

  /**
   * Effect: listen to browser back/forward buttons
   */
  useEffect(() => {
    const handlePopState = () => {
      setState(prev => {
        const params = getParamsFromUrl();

        console.log('popstate triggered:', { prevParams: prev.params, newParams: params });

        // Sprawdź czy parametry się zmieniły
        if (!paramsChanged(prev.params, params)) {
          console.log('Parametry nie zmieniły się (popstate) - pomijam fetch');
          return prev;
        }

        console.log('Parametry zmieniły się (popstate) - wykonuję fetch');

        fetchData(params);

        return {
          ...prev,
          params
        };
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getParamsFromUrl, fetchData, paramsChanged]);

  /**
   * Effect: fetch initial data jeśli nie ma initialData
   */
  useEffect(() => {
    if (!initialData) {
      fetchData(state.params, true); // Skip throttle on initial load
    }
  }, []); // Run only once on mount

  /**
   * Cleanup effect: clear throttle timer on unmount
   */
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    params: state.params,
    updateParams,
    refetch
  };
}
