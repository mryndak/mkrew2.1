import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  fetchRecentDonations,
  fetchDonationStats,
  selectRecentDonations,
  selectDonationStatistics,
  selectDonationsLoading,
  selectDonationsError,
} from '@/lib/store/slices/donationsSlice';
import {
  fetchRecentNotifications,
  fetchUnreadCount,
  selectRecentNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectNotificationsError,
} from '@/lib/store/slices/notificationsSlice';
import {
  fetchFavorites,
  selectFavorites,
  selectFavoritesLoading,
  selectFavoritesError,
} from '@/lib/store/slices/favoritesSlice';
import { selectUser } from '@/lib/store/slices/authSlice';
import {
  calculateNextEligibleDate,
  getDaysRemaining,
  isEligibleToDonate,
  type NextDonationInfo,
  type DashboardData,
} from '@/types/dashboard';

/**
 * Custom hook dla agregacji danych Dashboard
 *
 * Features:
 * - Auto-fetch wszystkich danych Dashboard przy montowaniu
 * - Agregacja danych z różnych slice'ów Redux
 * - Obliczanie nextEligibleDate na podstawie ostatniej donacji
 * - Unified loading i error state
 * - Refresh wszystkich danych na żądanie
 *
 * @param options - Opcje konfiguracyjne
 * @param options.autoFetch - Automatycznie fetchuj dane przy montowaniu (default: true)
 * @param options.recentDonationsLimit - Liczba ostatnich donacji (default: 3)
 * @param options.recentNotificationsLimit - Liczba ostatnich powiadomień (default: 5)
 *
 * @returns Hook state z danymi Dashboard
 */
export const useDashboardData = (options?: {
  autoFetch?: boolean;
  recentDonationsLimit?: number;
  recentNotificationsLimit?: number;
}) => {
  const {
    autoFetch = true,
    recentDonationsLimit = 3,
    recentNotificationsLimit = 5,
  } = options || {};

  const dispatch = useAppDispatch();

  // Selectors z różnych slice'ów
  const user = useAppSelector(selectUser);
  const recentDonations = useAppSelector(selectRecentDonations);
  const statistics = useAppSelector(selectDonationStatistics);
  const favorites = useAppSelector(selectFavorites);
  const notifications = useAppSelector(selectRecentNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  // Loading states
  const donationsLoading = useAppSelector(selectDonationsLoading);
  const notificationsLoading = useAppSelector(selectNotificationsLoading);
  const favoritesLoading = useAppSelector(selectFavoritesLoading);

  // Error states
  const donationsError = useAppSelector(selectDonationsError);
  const notificationsError = useAppSelector(selectNotificationsError);
  const favoritesError = useAppSelector(selectFavoritesError);

  /**
   * Aggregate loading state
   * True jeśli którykolwiek z fetch'y jest w toku
   */
  const isLoading = donationsLoading || notificationsLoading || favoritesLoading;

  /**
   * Aggregate error state
   * Zwraca pierwszy napotkany błąd lub null
   */
  const error = donationsError || notificationsError || favoritesError || null;

  /**
   * Oblicz nextEligibleDonationDate z lastDonationDate
   */
  const nextDonationInfo: NextDonationInfo = useMemo(() => {
    if (!statistics?.lastDonationDate) {
      return {
        date: null,
        daysRemaining: null,
        isEligible: true,
      };
    }

    const nextDate = calculateNextEligibleDate(statistics.lastDonationDate);
    const daysRemaining = getDaysRemaining(statistics.lastDonationDate);
    const isEligible = isEligibleToDonate(statistics.lastDonationDate);

    return {
      date: nextDate,
      daysRemaining,
      isEligible,
    };
  }, [statistics?.lastDonationDate]);

  /**
   * Track whether we've already attempted to fetch data
   * Prevents infinite retry loops when data fetching fails
   */
  const fetchAttemptedRef = useRef({
    donationStats: false,
    recentDonations: false,
    favorites: false,
    notifications: false,
    unreadCount: false,
  });

  /**
   * Auto-fetch wszystkich danych przy montowaniu
   * Fetchuje tylko jeśli dane nie istnieją i nie ma błędu
   * Zapobiega ponownemu fetchowaniu po niepowodzeniu (infinite loop)
   */
  useEffect(() => {
    if (!autoFetch) return;

    // Fetch donations statistics
    // Only fetch if: no data, not loading, no error, and haven't attempted yet
    if (!statistics && !donationsLoading && !donationsError && !fetchAttemptedRef.current.donationStats) {
      fetchAttemptedRef.current.donationStats = true;
      dispatch(fetchDonationStats());
    }

    // Fetch recent donations
    if (recentDonations.length === 0 && !donationsLoading && !donationsError && !fetchAttemptedRef.current.recentDonations) {
      fetchAttemptedRef.current.recentDonations = true;
      dispatch(fetchRecentDonations(recentDonationsLimit));
    }

    // Fetch favorites
    if (favorites.length === 0 && !favoritesLoading && !favoritesError && !fetchAttemptedRef.current.favorites) {
      fetchAttemptedRef.current.favorites = true;
      dispatch(fetchFavorites());
    }

    // Fetch notifications
    if (notifications.length === 0 && !notificationsLoading && !notificationsError && !fetchAttemptedRef.current.notifications) {
      fetchAttemptedRef.current.notifications = true;
      dispatch(fetchRecentNotifications(recentNotificationsLimit));
    }

    // Fetch unread count
    if (!notificationsLoading && !notificationsError && !fetchAttemptedRef.current.unreadCount) {
      fetchAttemptedRef.current.unreadCount = true;
      dispatch(fetchUnreadCount());
    }
  }, [
    autoFetch,
    statistics,
    recentDonations.length,
    favorites.length,
    notifications.length,
    donationsLoading,
    favoritesLoading,
    notificationsLoading,
    donationsError,
    favoritesError,
    notificationsError,
    recentDonationsLimit,
    recentNotificationsLimit,
    dispatch,
  ]);

  /**
   * Refresh wszystkich danych Dashboard
   * Force fetch bez względu na cache
   * Resetuje flagi fetchAttempted aby umożliwić ponowne próby
   *
   * @returns Promise<void>
   */
  const refreshAll = useCallback(async () => {
    // Reset fetch attempted flags
    fetchAttemptedRef.current = {
      donationStats: false,
      recentDonations: false,
      favorites: false,
      notifications: false,
      unreadCount: false,
    };

    await Promise.all([
      dispatch(fetchDonationStats()),
      dispatch(fetchRecentDonations(recentDonationsLimit)),
      dispatch(fetchFavorites()),
      dispatch(fetchRecentNotifications(recentNotificationsLimit)),
      dispatch(fetchUnreadCount()),
    ]);
  }, [dispatch, recentDonationsLimit, recentNotificationsLimit]);

  /**
   * Refresh tylko statystyk donacji
   * Resetuje flagi fetchAttempted dla donacji
   *
   * @returns Promise<void>
   */
  const refreshDonations = useCallback(async () => {
    // Reset donation fetch flags
    fetchAttemptedRef.current.donationStats = false;
    fetchAttemptedRef.current.recentDonations = false;

    await Promise.all([
      dispatch(fetchDonationStats()),
      dispatch(fetchRecentDonations(recentDonationsLimit)),
    ]);
  }, [dispatch, recentDonationsLimit]);

  /**
   * Refresh tylko powiadomień
   * Resetuje flagi fetchAttempted dla powiadomień
   *
   * @returns Promise<void>
   */
  const refreshNotifications = useCallback(async () => {
    // Reset notification fetch flags
    fetchAttemptedRef.current.notifications = false;
    fetchAttemptedRef.current.unreadCount = false;

    await Promise.all([
      dispatch(fetchRecentNotifications(recentNotificationsLimit)),
      dispatch(fetchUnreadCount()),
    ]);
  }, [dispatch, recentNotificationsLimit]);

  /**
   * Refresh tylko ulubionych
   * Resetuje flagę fetchAttempted dla ulubionych
   *
   * @returns Promise<void>
   */
  const refreshFavorites = useCallback(async () => {
    // Reset favorites fetch flag
    fetchAttemptedRef.current.favorites = false;

    await dispatch(fetchFavorites());
  }, [dispatch]);

  /**
   * Agregowane dane Dashboard
   * Format zgodny z DashboardData type
   */
  const dashboardData: DashboardData | null = useMemo(() => {
    if (!user) return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bloodGroup: user.bloodGroup,
        emailVerified: user.emailVerified,
        consentTimestamp: '', // Not available in auth user
        consentVersion: '',
        createdAt: '',
        updatedAt: '',
      },
      statistics: statistics || {
        totalDonations: 0,
        totalQuantityMl: 0,
        lastDonationDate: null,
      },
      recentDonations: recentDonations.slice(0, recentDonationsLimit),
      favorites: favorites.slice(0, 3), // Dashboard shows top 3
      notifications: notifications.slice(0, recentNotificationsLimit),
      unreadNotificationsCount: unreadCount,
      nextEligibleDonationDate: nextDonationInfo.date,
    };
  }, [
    user,
    statistics,
    recentDonations,
    favorites,
    notifications,
    unreadCount,
    nextDonationInfo.date,
    recentDonationsLimit,
    recentNotificationsLimit,
  ]);

  return {
    // Dane
    user,
    statistics,
    recentDonations: recentDonations.slice(0, recentDonationsLimit),
    favorites: favorites.slice(0, 3), // Dashboard shows top 3 favorites
    notifications: notifications.slice(0, recentNotificationsLimit),
    unreadCount,
    nextDonationInfo,
    dashboardData,

    // States
    isLoading,
    error,

    // Actions
    refreshAll,
    refreshDonations,
    refreshNotifications,
    refreshFavorites,
  };
};

export default useDashboardData;
