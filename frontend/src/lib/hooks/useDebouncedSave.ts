import { useState, useCallback, useRef, useEffect } from 'react';
import type { SaveStatus } from '@/types/profile';

/**
 * Custom hook dla debounced auto-save
 *
 * Features:
 * - Debounce save function (default 2s delay)
 * - Immediate save on demand (bypass debounce)
 * - Save status tracking (idle, saving, saved, error)
 * - Last saved timestamp
 * - Automatic cleanup on unmount
 *
 * @param saveFn - Funkcja zapisująca dane (async)
 * @param delay - Delay w ms (default 2000ms = 2s)
 * @returns Hook state i actions
 */
export const useDebouncedSave = <T>(
  saveFn: (data: T) => Promise<void>,
  delay: number = 2000
) => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const statusResetTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Debounced save - czeka `delay` ms przed zapisem
   * Jeśli funkcja jest wywołana ponownie przed upływem czasu, timer jest resetowany
   *
   * @param data - Dane do zapisu
   */
  const debouncedSave = useCallback(
    (data: T) => {
      // Clear existing timeout (reset timer)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set saving status immediately (show "saving..." indicator)
      setStatus('saving');

      // Create new timeout for actual save
      timeoutRef.current = setTimeout(async () => {
        try {
          await saveFn(data);
          setStatus('saved');
          setLastSavedAt(new Date());

          // Reset status to idle after 2 seconds
          statusResetTimeoutRef.current = setTimeout(() => {
            setStatus('idle');
          }, 2000);
        } catch (error) {
          setStatus('error');
          console.error('Debounced save failed:', error);
        }
      }, delay);
    },
    [saveFn, delay]
  );

  /**
   * Save immediately - bypasses debounce (używane np. przy onBlur)
   *
   * @param data - Dane do zapisu
   * @throws Error jeśli zapis się nie powiedzie
   */
  const saveImmediately = useCallback(
    async (data: T) => {
      // Clear pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setStatus('saving');

      try {
        await saveFn(data);
        setStatus('saved');
        setLastSavedAt(new Date());

        // Reset status to idle after 2 seconds
        statusResetTimeoutRef.current = setTimeout(() => {
          setStatus('idle');
        }, 2000);
      } catch (error) {
        setStatus('error');
        throw error; // Re-throw dla error handlera w komponencie
      }
    },
    [saveFn]
  );

  /**
   * Cancel pending save (przydatne przy unmount lub cancel action)
   */
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (statusResetTimeoutRef.current) {
      clearTimeout(statusResetTimeoutRef.current);
      statusResetTimeoutRef.current = undefined;
    }
    setStatus('idle');
  }, []);

  /**
   * Reset error status (przydatne gdy użytkownik poprawia dane)
   */
  const resetError = useCallback(() => {
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  /**
   * Cleanup on unmount - clear wszystkie timers
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    cancelSave,
    resetError,
    status,
    lastSavedAt,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    hasError: status === 'error',
  };
};
