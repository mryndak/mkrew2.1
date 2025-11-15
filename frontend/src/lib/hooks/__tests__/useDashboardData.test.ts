/**
 * Unit tests dla useDashboardData hook
 *
 * Test framework: Vitest
 * Testing utilities: @testing-library/react
 *
 * Tests:
 * - Initial state
 * - Auto-fetch on mount
 * - Data aggregation from Redux
 * - Next donation info calculation
 * - Refresh functions
 * - Loading and error states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDashboardData } from '../useDashboardData';
import authReducer from '@/lib/store/slices/authSlice';
import donationsReducer from '@/lib/store/slices/donationsSlice';
import favoritesReducer from '@/lib/store/slices/favoritesSlice';
import notificationsReducer from '@/lib/store/slices/notificationsSlice';
import * as donationsApi from '@/lib/api/endpoints/donations';
import * as favoritesApi from '@/lib/api/endpoints/favorites';
import * as notificationsApi from '@/lib/api/endpoints/notifications';

// Mock API modules
vi.mock('@/lib/api/endpoints/donations');
vi.mock('@/lib/api/endpoints/favorites');
vi.mock('@/lib/api/endpoints/notifications');

// Mock data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Jan',
  lastName: 'Kowalski',
  bloodGroup: 'A+',
  emailVerified: true,
};

const mockStatistics = {
  totalDonations: 5,
  totalQuantityMl: 2250,
  lastDonationDate: '2024-12-01',
};

const mockDonations = [
  {
    id: 1,
    rckik: { id: 1, name: 'RCKiK Warszawa', code: 'WAW', city: 'Warszawa' },
    donationDate: '2024-12-01',
    quantityMl: 450,
    donationType: 'FULL_BLOOD' as const,
    notes: null,
    confirmed: true,
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 2,
    rckik: { id: 1, name: 'RCKiK Warszawa', code: 'WAW', city: 'Warszawa' },
    donationDate: '2024-10-15',
    quantityMl: 450,
    donationType: 'FULL_BLOOD' as const,
    notes: null,
    confirmed: true,
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-10-15T10:00:00Z',
  },
];

const mockFavorites = [
  {
    id: 1,
    rckikId: 1,
    name: 'RCKiK Warszawa',
    code: 'WAW',
    city: 'Warszawa',
    address: 'ul. Testowa 1',
    latitude: 52.2297,
    longitude: 21.0122,
    active: true,
    priority: 1,
    addedAt: '2024-01-01T00:00:00Z',
    currentBloodLevels: [
      {
        bloodGroup: 'A+',
        levelPercentage: 45,
        levelStatus: 'IMPORTANT' as const,
        lastUpdate: '2025-01-15T10:00:00Z',
      },
    ],
  },
];

const mockNotifications = [
  {
    id: 1,
    type: 'CRITICAL_BLOOD_LEVEL',
    rckik: { id: 1, name: 'RCKiK Warszawa' },
    title: 'Krytyczny poziom krwi A+',
    message: 'Poziom krwi A+ w RCKiK Warszawa jest krytycznie niski',
    linkUrl: '/rckik/1',
    readAt: null,
    expiresAt: null,
    createdAt: '2025-01-15T10:00:00Z',
  },
];

// Helper to create a test store with initial state
function createTestStore(initialState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      donations: donationsReducer,
      favorites: favoritesReducer,
      notifications: notificationsReducer,
    },
    preloadedState: {
      auth: {
        user: mockUser,
        isAuthenticated: true,
        token: 'test-token',
        loading: false,
        error: null,
      },
      donations: {
        donations: mockDonations,
        recentDonations: mockDonations.slice(0, 3),
        statistics: mockStatistics,
        pagination: { page: 0, size: 20, totalElements: 5 },
        loading: false,
        error: null,
        lastFetched: Date.now(),
      },
      favorites: {
        items: mockFavorites,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      },
      notifications: {
        notifications: mockNotifications,
        recentNotifications: mockNotifications,
        unreadCount: 1,
        pagination: { page: 0, size: 20, totalElements: 1 },
        loading: false,
        error: null,
        lastFetched: Date.now(),
      },
      ...initialState,
    },
  });
}

// Wrapper component with Redux Provider
function createWrapper(store: ReturnType<typeof createTestStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
}

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state with existing data', () => {
    it('should return all dashboard data from Redux store', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.statistics).toEqual(mockStatistics);
      expect(result.current.recentDonations).toEqual(mockDonations.slice(0, 3));
      expect(result.current.favorites).toEqual(mockFavorites.slice(0, 3));
      expect(result.current.notifications).toEqual(mockNotifications.slice(0, 5));
      expect(result.current.unreadCount).toBe(1);
    });

    it('should calculate nextDonationInfo correctly', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.nextDonationInfo).toBeDefined();
      expect(result.current.nextDonationInfo.date).toBe('2025-01-26'); // 2024-12-01 + 56 days
      expect(result.current.nextDonationInfo.daysRemaining).toBeGreaterThan(0);
      expect(result.current.nextDonationInfo.isEligible).toBe(false);
    });

    it('should return null for nextDonationInfo when no last donation', () => {
      const store = createTestStore({
        donations: {
          donations: [],
          recentDonations: [],
          statistics: { totalDonations: 0, totalQuantityMl: 0, lastDonationDate: null },
          pagination: { page: 0, size: 20, totalElements: 0 },
          loading: false,
          error: null,
          lastFetched: null,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.nextDonationInfo.date).toBeNull();
      expect(result.current.nextDonationInfo.daysRemaining).toBeNull();
      expect(result.current.nextDonationInfo.isEligible).toBe(true);
    });
  });

  describe('Auto-fetch on mount', () => {
    it('should not fetch when autoFetch is false', () => {
      const store = createTestStore({
        donations: {
          donations: [],
          recentDonations: [],
          statistics: null,
          pagination: { page: 0, size: 20, totalElements: 0 },
          loading: false,
          error: null,
          lastFetched: null,
        },
      });

      const fetchStatsSpy = vi.spyOn(donationsApi, 'getDonationStatistics');

      renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(fetchStatsSpy).not.toHaveBeenCalled();
    });

    it('should fetch all data when autoFetch is true and data is missing', async () => {
      const store = createTestStore({
        donations: {
          donations: [],
          recentDonations: [],
          statistics: null,
          pagination: { page: 0, size: 20, totalElements: 0 },
          loading: false,
          error: null,
          lastFetched: null,
        },
        favorites: {
          items: [],
          loading: false,
          error: null,
          lastFetched: null,
        },
        notifications: {
          notifications: [],
          recentNotifications: [],
          unreadCount: 0,
          pagination: { page: 0, size: 20, totalElements: 0 },
          loading: false,
          error: null,
          lastFetched: null,
        },
      });

      vi.spyOn(donationsApi, 'getDonationStatistics').mockResolvedValue(mockStatistics);
      vi.spyOn(donationsApi, 'getRecentDonations').mockResolvedValue(mockDonations);
      vi.spyOn(favoritesApi, 'getFavorites').mockResolvedValue({ favorites: mockFavorites });
      vi.spyOn(notificationsApi, 'getRecentNotifications').mockResolvedValue(mockNotifications);
      vi.spyOn(notificationsApi, 'getUnreadNotificationsCount').mockResolvedValue({
        unreadCount: 1,
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: true }), {
        wrapper: createWrapper(store),
      });

      await waitFor(() => {
        expect(result.current.statistics).not.toBeNull();
      });
    });
  });

  describe('Loading and error states', () => {
    it('should aggregate loading states', () => {
      const store = createTestStore({
        donations: {
          ...createTestStore().getState().donations,
          loading: true,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should aggregate error states', () => {
      const errorMessage = 'Failed to load donations';
      const store = createTestStore({
        donations: {
          ...createTestStore().getState().donations,
          error: errorMessage,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should return first error when multiple errors exist', () => {
      const donationsError = 'Donations error';
      const notificationsError = 'Notifications error';

      const store = createTestStore({
        donations: {
          ...createTestStore().getState().donations,
          error: donationsError,
        },
        notifications: {
          ...createTestStore().getState().notifications,
          error: notificationsError,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.error).toBe(donationsError);
    });
  });

  describe('Refresh functions', () => {
    it('should provide refreshAll function', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.refreshAll).toBeDefined();
      expect(typeof result.current.refreshAll).toBe('function');
    });

    it('should provide refreshDonations function', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.refreshDonations).toBeDefined();
      expect(typeof result.current.refreshDonations).toBe('function');
    });

    it('should provide refreshNotifications function', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.refreshNotifications).toBeDefined();
      expect(typeof result.current.refreshNotifications).toBe('function');
    });

    it('should provide refreshFavorites function', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.refreshFavorites).toBeDefined();
      expect(typeof result.current.refreshFavorites).toBe('function');
    });
  });

  describe('Data limits', () => {
    it('should limit recent donations to specified limit', () => {
      const manyDonations = Array.from({ length: 10 }, (_, i) => ({
        ...mockDonations[0],
        id: i + 1,
      }));

      const store = createTestStore({
        donations: {
          ...createTestStore().getState().donations,
          recentDonations: manyDonations,
        },
      });

      const { result } = renderHook(
        () => useDashboardData({ autoFetch: false, recentDonationsLimit: 3 }),
        {
          wrapper: createWrapper(store),
        }
      );

      expect(result.current.recentDonations).toHaveLength(3);
    });

    it('should limit favorites to top 3', () => {
      const manyFavorites = Array.from({ length: 10 }, (_, i) => ({
        ...mockFavorites[0],
        id: i + 1,
      }));

      const store = createTestStore({
        favorites: {
          ...createTestStore().getState().favorites,
          items: manyFavorites,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.favorites).toHaveLength(3);
    });

    it('should limit notifications to specified limit', () => {
      const manyNotifications = Array.from({ length: 20 }, (_, i) => ({
        ...mockNotifications[0],
        id: i + 1,
      }));

      const store = createTestStore({
        notifications: {
          ...createTestStore().getState().notifications,
          recentNotifications: manyNotifications,
        },
      });

      const { result } = renderHook(
        () => useDashboardData({ autoFetch: false, recentNotificationsLimit: 5 }),
        {
          wrapper: createWrapper(store),
        }
      );

      expect(result.current.notifications).toHaveLength(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user data', () => {
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          token: null,
          loading: false,
          error: null,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.dashboardData).toBeNull();
    });

    it('should handle empty arrays gracefully', () => {
      const store = createTestStore({
        donations: {
          ...createTestStore().getState().donations,
          recentDonations: [],
        },
        favorites: {
          ...createTestStore().getState().favorites,
          items: [],
        },
        notifications: {
          ...createTestStore().getState().notifications,
          recentNotifications: [],
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.recentDonations).toEqual([]);
      expect(result.current.favorites).toEqual([]);
      expect(result.current.notifications).toEqual([]);
    });

    it('should handle null statistics', () => {
      const store = createTestStore({
        donations: {
          ...createTestStore().getState().donations,
          statistics: null,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.statistics).toBeNull();
    });
  });

  describe('DashboardData aggregation', () => {
    it('should aggregate all data into dashboardData object', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.dashboardData).toBeDefined();
      expect(result.current.dashboardData?.user).toEqual(mockUser);
      expect(result.current.dashboardData?.statistics).toEqual(mockStatistics);
      expect(result.current.dashboardData?.recentDonations).toEqual(mockDonations.slice(0, 3));
      expect(result.current.dashboardData?.favorites).toEqual(mockFavorites.slice(0, 3));
      expect(result.current.dashboardData?.notifications).toEqual(mockNotifications.slice(0, 5));
      expect(result.current.dashboardData?.unreadNotificationsCount).toBe(1);
      expect(result.current.dashboardData?.nextEligibleDonationDate).toBe('2025-01-26');
    });

    it('should return null dashboardData when user is null', () => {
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          token: null,
          loading: false,
          error: null,
        },
      });

      const { result } = renderHook(() => useDashboardData({ autoFetch: false }), {
        wrapper: createWrapper(store),
      });

      expect(result.current.dashboardData).toBeNull();
    });
  });
});
