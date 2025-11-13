import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  fetchNotificationPreferences,
  updatePreferences,
  selectNotificationPreferences,
  selectUserLoading,
  selectUserError,
} from '@/lib/store/slices/userSlice';
import type { UpdateNotificationPreferencesRequest, NotificationPreferences } from '@/types/profile';

/**
 * Custom hook dla zarządzania preferencjami powiadomień użytkownika
 *
 * Features:
 * - Auto-fetch preferencji przy montowaniu (jeśli nie istnieją)
 * - Update preferencji z obsługą błędów
 * - Loading state i error handling
 *
 * @returns Hook state i actions
 */
export const useNotificationPreferences = () => {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectNotificationPreferences);
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  /**
   * Fetch preferencji przy montowaniu komponentu (tylko jeśli nie istnieją)
   */
  useEffect(() => {
    if (!preferences && !isLoading) {
      dispatch(fetchNotificationPreferences());
    }
  }, [preferences, isLoading, dispatch]);

  /**
   * Update preferencji powiadomień
   *
   * @param data - Nowe preferencje powiadomień
   * @returns Promise z zaktualizowanymi preferencjami lub błędem
   */
  const updateNotificationPreferences = useCallback(
    async (data: UpdateNotificationPreferencesRequest): Promise<NotificationPreferences> => {
      const result = await dispatch(updatePreferences(data));

      if (updatePreferences.fulfilled.match(result)) {
        return result.payload;
      }

      // Extract error message
      const errorMessage = result.payload as string || 'Nie udało się zaktualizować preferencji';
      throw new Error(errorMessage);
    },
    [dispatch]
  );

  return {
    preferences,
    isLoading,
    error,
    updateNotificationPreferences,
  };
};
