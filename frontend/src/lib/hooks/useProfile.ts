import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  fetchUserProfile,
  updateProfile,
  selectUserProfile,
  selectUserLoading,
  selectUserError,
} from '@/lib/store/slices/userSlice';
import type { UpdateProfileRequest, UserProfile } from '@/types/profile';

/**
 * Custom hook dla zarządzania profilem użytkownika
 *
 * Features:
 * - Auto-fetch profilu przy montowaniu (jeśli nie istnieje)
 * - Update profilu z obsługą błędów
 * - Refresh profilu na żądanie
 * - Loading state i error handling
 *
 * @returns Hook state i actions
 */
export const useProfile = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  /**
   * Fetch profilu przy montowaniu komponentu (tylko jeśli nie istnieje)
   */
  useEffect(() => {
    if (!profile && !isLoading) {
      dispatch(fetchUserProfile());
    }
  }, [profile, isLoading, dispatch]);

  /**
   * Update profilu (optimistic update handled by Redux)
   *
   * @param data - Dane do aktualizacji (partial)
   * @returns Promise z zaktualizowanym profilem lub błędem
   */
  const updateUserProfile = useCallback(
    async (data: UpdateProfileRequest): Promise<UserProfile> => {
      const result = await dispatch(updateProfile(data));

      if (updateProfile.fulfilled.match(result)) {
        return result.payload;
      }

      // Extract error message
      const errorMessage = result.payload as string || 'Nie udało się zaktualizować profilu';
      throw new Error(errorMessage);
    },
    [dispatch]
  );

  /**
   * Refresh profilu (force fetch)
   *
   * @returns Promise z profilem lub błędem
   */
  const refresh = useCallback(async (): Promise<UserProfile | null> => {
    const result = await dispatch(fetchUserProfile());

    if (fetchUserProfile.fulfilled.match(result)) {
      return result.payload;
    }

    return null;
  }, [dispatch]);

  return {
    profile,
    isLoading,
    error,
    updateUserProfile,
    refresh,
  };
};
