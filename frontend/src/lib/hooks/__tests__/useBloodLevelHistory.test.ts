/**
 * Unit tests dla useBloodLevelHistory hook
 *
 * Test framework: Vitest
 * Testing utilities: @testing-library/react-hooks
 *
 * Instalacja:
 * npm install -D @testing-library/react-hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBloodLevelHistory } from '../useBloodLevelHistory';
import * as rckikApi from '@/lib/api/endpoints/rckik';
import type { BloodLevelHistoryResponse } from '@/types/rckik';

// Mock API module
vi.mock('@/lib/api/endpoints/rckik');

const mockHistoryResponse: BloodLevelHistoryResponse = {
  snapshots: [
    {
      id: 1,
      snapshotDate: '2025-01-15',
      bloodGroup: 'A+',
      levelPercentage: 45.5,
      levelStatus: 'IMPORTANT',
      scrapedAt: '2025-01-15T10:00:00',
      isManual: false,
    },
    {
      id: 2,
      snapshotDate: '2025-01-14',
      bloodGroup: 'A+',
      levelPercentage: 50.0,
      levelStatus: 'OK',
      scrapedAt: '2025-01-14T10:00:00',
      isManual: false,
    },
  ],
  page: 0,
  size: 30,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
};

describe('useBloodLevelHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('should start with empty data and not loading when autoFetch is false', () => {
      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() =>
        useBloodLevelHistory(1, {}, { autoFetch: false })
      );

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.pagination).toBe(null);
    });

    it('should start loading when autoFetch is true', () => {
      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Successful data fetching', () => {
    it('should fetch and store history data', async () => {
      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.snapshots).toEqual(mockHistoryResponse.snapshots);
      expect(result.current.data).toEqual(mockHistoryResponse);
      expect(result.current.error).toBe(null);
    });

    it('should include pagination data', async () => {
      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pagination).toEqual({
        page: 0,
        size: 30,
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      });
    });

    it('should call API with correct parameters', async () => {
      const fetchSpy = vi
        .spyOn(rckikApi, 'fetchBloodLevelHistory')
        .mockResolvedValue(mockHistoryResponse);

      renderHook(() =>
        useBloodLevelHistory(1, {
          bloodGroup: 'A+',
          fromDate: '2025-01-01',
          toDate: '2025-01-31',
          page: 0,
          size: 20,
        })
      );

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(1, {
          bloodGroup: 'A+',
          fromDate: '2025-01-01',
          toDate: '2025-01-31',
          page: 0,
          size: 20,
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors with specific message', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };

      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockRejectedValue(error404);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Nie znaleziono historii dla tego centrum');
    });

    it('should handle 403 errors with specific message', async () => {
      const error403 = {
        response: {
          status: 403,
          data: {},
        },
      };

      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockRejectedValue(error403);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Brak dostępu do historii snapshotów');
    });

    it('should handle 500 errors with specific message', async () => {
      const error500 = {
        response: {
          status: 500,
          data: {},
        },
      };

      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockRejectedValue(error500);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Błąd serwera. Spróbuj ponownie później');
    });

    it('should handle network errors', async () => {
      const networkError = {
        request: {},
        message: 'Network Error',
      };

      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockRejectedValue(networkError);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.message).toBe(
        'Brak połączenia z serwerem. Sprawdź połączenie internetowe'
      );
    });

    it('should preserve error cause chain', async () => {
      const originalError = new Error('Original error');
      const apiError = {
        response: { status: 500 },
        cause: originalError,
      };

      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockRejectedValue(apiError);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error?.cause).toBe(apiError);
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const fetchSpy = vi
        .spyOn(rckikApi, 'fetchBloodLevelHistory')
        .mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Call refetch
      result.current.refetch();

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });

    it('should set loading state during refetch', async () => {
      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
    });
  });

  describe('Parameter changes', () => {
    it('should refetch when parameters change', async () => {
      const fetchSpy = vi
        .spyOn(rckikApi, 'fetchBloodLevelHistory')
        .mockResolvedValue(mockHistoryResponse);

      const { rerender } = renderHook(
        ({ params }) => useBloodLevelHistory(1, params),
        {
          initialProps: {
            params: { bloodGroup: 'A+' as const },
          },
        }
      );

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      // Change params
      rerender({ params: { bloodGroup: 'B+' as const } });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });

      expect(fetchSpy).toHaveBeenLastCalledWith(1, {
        bloodGroup: 'B+',
        fromDate: undefined,
        toDate: undefined,
        page: 0,
        size: 30,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null rckikId', () => {
      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(mockHistoryResponse);

      const { result } = renderHook(() => useBloodLevelHistory(null));

      expect(result.current.loading).toBe(false);
      expect(result.current.snapshots).toEqual([]);
    });

    it('should handle empty response', async () => {
      const emptyResponse: BloodLevelHistoryResponse = {
        snapshots: [],
        page: 0,
        size: 30,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      };

      vi.spyOn(rckikApi, 'fetchBloodLevelHistory').mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useBloodLevelHistory(1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.snapshots).toEqual([]);
      expect(result.current.pagination?.totalElements).toBe(0);
    });

    it('should use default values for missing parameters', async () => {
      const fetchSpy = vi
        .spyOn(rckikApi, 'fetchBloodLevelHistory')
        .mockResolvedValue(mockHistoryResponse);

      renderHook(() => useBloodLevelHistory(1, {}));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(1, {
          bloodGroup: undefined,
          fromDate: undefined,
          toDate: undefined,
          page: 0,
          size: 30,
        });
      });
    });
  });
});
