/**
 * Unit tests for authSlice (Redux Toolkit)
 *
 * Test framework: Vitest
 * Coverage: Redux auth state management
 *
 * Tested functionality:
 * - login() action - stores user, tokens, cookies
 * - logout() action - clears all auth data
 * - setLoading() action - manages loading state
 * - restoreSession() action - restores from localStorage
 * - Selectors - selectIsAuthenticated, selectUser, selectAuthLoading
 *
 * Security-critical tests:
 * - Token storage in localStorage AND cookies
 * - Token cleanup on logout
 * - Token expiration calculation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  setLoading,
  restoreSession,
  selectIsAuthenticated,
  selectUser,
  selectAuthLoading,
} from '../authSlice';
import type { AuthState, LoginResponse, User } from '@/types/auth';
import * as cookieUtils from '@/lib/utils/cookies';

// Mock cookies module
vi.mock('@/lib/utils/cookies', () => ({
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

describe('authSlice (Redux)', () => {
  let store: ReturnType<typeof configureStore>;

  // Helper to create store
  function createTestStore(preloadedState?: { auth: Partial<AuthState> }) {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState,
    });
  }

  // Mock data
  const mockUser: User = {
    id: 123,
    email: 'test@example.com',
    firstName: 'Jan',
    lastName: 'Kowalski',
    bloodType: 'A+',
    role: 'USER',
    emailVerified: true,
    createdAt: '2025-01-15T10:00:00Z',
  };

  const mockLoginResponse: LoginResponse = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-abc',
    expiresIn: 3600, // 1 hour in seconds
    user: mockUser,
  };

  beforeEach(() => {
    store = createTestStore();

    // Mock localStorage
    const localStorageMock: Storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock Date.now() for consistent expiration calculation
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;

      expect(state).toEqual({
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });
  });

  describe('login() action', () => {
    describe('Happy path', () => {
      it('should set user and tokens in state', () => {
        store.dispatch(login(mockLoginResponse));

        const state = store.getState().auth;

        expect(state.user).toEqual(mockUser);
        expect(state.accessToken).toBe('mock-access-token-xyz');
        expect(state.refreshToken).toBe('mock-refresh-token-abc');
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
      });

      it('should calculate correct expiresAt timestamp', () => {
        const now = Date.now(); // 2025-01-15T12:00:00Z
        const expectedExpiresAt = now + 3600 * 1000; // + 1 hour

        store.dispatch(login(mockLoginResponse));

        const state = store.getState().auth;

        expect(state.expiresAt).toBe(expectedExpiresAt);
      });

      it('should store tokens in localStorage', () => {
        store.dispatch(login(mockLoginResponse));

        expect(localStorage.setItem).toHaveBeenCalledWith(
          'accessToken',
          'mock-access-token-xyz'
        );
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'refreshToken',
          'mock-refresh-token-abc'
        );
      });

      it('should set tokens in cookies with 7 days expiration', () => {
        store.dispatch(login(mockLoginResponse));

        expect(cookieUtils.setCookie).toHaveBeenCalledWith(
          'accessToken',
          'mock-access-token-xyz',
          7
        );
        expect(cookieUtils.setCookie).toHaveBeenCalledWith(
          'refreshToken',
          'mock-refresh-token-abc',
          7
        );
      });

      it('should set isAuthenticated to true', () => {
        store.dispatch(login(mockLoginResponse));

        const isAuth = selectIsAuthenticated(store.getState());

        expect(isAuth).toBe(true);
      });

      it('should set isLoading to false after login', () => {
        // Start with loading
        store.dispatch(setLoading(true));
        expect(store.getState().auth.isLoading).toBe(true);

        // Login should set loading to false
        store.dispatch(login(mockLoginResponse));

        expect(store.getState().auth.isLoading).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle very long token expiration (weeks)', () => {
        const longExpirationResponse: LoginResponse = {
          ...mockLoginResponse,
          expiresIn: 604800, // 7 days in seconds
        };

        const now = Date.now();
        const expectedExpiresAt = now + 604800 * 1000;

        store.dispatch(login(longExpirationResponse));

        expect(store.getState().auth.expiresAt).toBe(expectedExpiresAt);
      });

      it('should handle short token expiration (minutes)', () => {
        const shortExpirationResponse: LoginResponse = {
          ...mockLoginResponse,
          expiresIn: 300, // 5 minutes
        };

        const now = Date.now();
        const expectedExpiresAt = now + 300 * 1000;

        store.dispatch(login(shortExpirationResponse));

        expect(store.getState().auth.expiresAt).toBe(expectedExpiresAt);
      });

      it('should overwrite previous login state', () => {
        // First login
        store.dispatch(login(mockLoginResponse));

        // Second login with different user
        const differentUser: User = {
          ...mockUser,
          id: 456,
          email: 'different@example.com',
        };

        const secondLoginResponse: LoginResponse = {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 7200,
          user: differentUser,
        };

        store.dispatch(login(secondLoginResponse));

        const state = store.getState().auth;

        expect(state.user?.id).toBe(456);
        expect(state.user?.email).toBe('different@example.com');
        expect(state.accessToken).toBe('new-access-token');
      });
    });
  });

  describe('logout() action', () => {
    beforeEach(() => {
      // Login first before testing logout
      store.dispatch(login(mockLoginResponse));
    });

    describe('Happy path', () => {
      it('should reset all auth state to initial values', () => {
        store.dispatch(logout());

        const state = store.getState().auth;

        expect(state).toEqual({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });

      it('should remove tokens from localStorage', () => {
        store.dispatch(logout());

        expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
        expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(localStorage.removeItem).toHaveBeenCalledWith('rememberMe');
      });

      it('should delete tokens from cookies', () => {
        store.dispatch(logout());

        expect(cookieUtils.deleteCookie).toHaveBeenCalledWith('accessToken');
        expect(cookieUtils.deleteCookie).toHaveBeenCalledWith('refreshToken');
      });

      it('should set isAuthenticated to false', () => {
        expect(selectIsAuthenticated(store.getState())).toBe(true);

        store.dispatch(logout());

        expect(selectIsAuthenticated(store.getState())).toBe(false);
      });

      it('should clear user data', () => {
        expect(selectUser(store.getState())).toBeTruthy();

        store.dispatch(logout());

        expect(selectUser(store.getState())).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should be idempotent (safe to call multiple times)', () => {
        store.dispatch(logout());
        store.dispatch(logout());
        store.dispatch(logout());

        const state = store.getState().auth;

        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });

      it('should work even if not logged in', () => {
        const freshStore = createTestStore();

        freshStore.dispatch(logout());

        const state = freshStore.getState().auth;

        expect(state).toEqual({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });
    });
  });

  describe('setLoading() action', () => {
    it('should set loading to true', () => {
      store.dispatch(setLoading(true));

      expect(store.getState().auth.isLoading).toBe(true);
      expect(selectAuthLoading(store.getState())).toBe(true);
    });

    it('should set loading to false', () => {
      store.dispatch(setLoading(true));
      store.dispatch(setLoading(false));

      expect(store.getState().auth.isLoading).toBe(false);
    });

    it('should not affect other state properties', () => {
      store.dispatch(login(mockLoginResponse));

      const stateBefore = store.getState().auth;

      store.dispatch(setLoading(true));

      const stateAfter = store.getState().auth;

      expect(stateAfter.user).toEqual(stateBefore.user);
      expect(stateAfter.accessToken).toBe(stateBefore.accessToken);
      expect(stateAfter.isAuthenticated).toBe(stateBefore.isAuthenticated);
      expect(stateAfter.isLoading).toBe(true); // Changed
    });
  });

  describe('restoreSession() action', () => {
    const restorePayload = {
      accessToken: 'restored-access-token',
      refreshToken: 'restored-refresh-token',
      user: mockUser,
    };

    describe('Happy path', () => {
      it('should restore user and tokens from localStorage', () => {
        store.dispatch(restoreSession(restorePayload));

        const state = store.getState().auth;

        expect(state.user).toEqual(mockUser);
        expect(state.accessToken).toBe('restored-access-token');
        expect(state.refreshToken).toBe('restored-refresh-token');
        expect(state.isAuthenticated).toBe(true);
        expect(state.isLoading).toBe(false);
      });

      it('should set isAuthenticated to true', () => {
        store.dispatch(restoreSession(restorePayload));

        expect(selectIsAuthenticated(store.getState())).toBe(true);
      });

      it('should set isLoading to false', () => {
        store.dispatch(setLoading(true));

        store.dispatch(restoreSession(restorePayload));

        expect(store.getState().auth.isLoading).toBe(false);
      });

      it('should NOT set expiresAt (not provided in restore)', () => {
        store.dispatch(restoreSession(restorePayload));

        // expiresAt stays null because restoreSession doesn't calculate it
        expect(store.getState().auth.expiresAt).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should work when restoring over existing session', () => {
        // Login first
        store.dispatch(login(mockLoginResponse));

        // Then restore different session
        const differentRestorePayload = {
          accessToken: 'new-restored-token',
          refreshToken: 'new-refresh-token',
          user: { ...mockUser, id: 999 },
        };

        store.dispatch(restoreSession(differentRestorePayload));

        const state = store.getState().auth;

        expect(state.user?.id).toBe(999);
        expect(state.accessToken).toBe('new-restored-token');
      });
    });
  });

  describe('Selectors', () => {
    describe('selectIsAuthenticated', () => {
      it('should return false when not authenticated', () => {
        expect(selectIsAuthenticated(store.getState())).toBe(false);
      });

      it('should return true when authenticated', () => {
        store.dispatch(login(mockLoginResponse));

        expect(selectIsAuthenticated(store.getState())).toBe(true);
      });

      it('should return false after logout', () => {
        store.dispatch(login(mockLoginResponse));
        store.dispatch(logout());

        expect(selectIsAuthenticated(store.getState())).toBe(false);
      });
    });

    describe('selectUser', () => {
      it('should return null when not authenticated', () => {
        expect(selectUser(store.getState())).toBeNull();
      });

      it('should return user object when authenticated', () => {
        store.dispatch(login(mockLoginResponse));

        const user = selectUser(store.getState());

        expect(user).toEqual(mockUser);
      });

      it('should return null after logout', () => {
        store.dispatch(login(mockLoginResponse));
        store.dispatch(logout());

        expect(selectUser(store.getState())).toBeNull();
      });
    });

    describe('selectAuthLoading', () => {
      it('should return false initially', () => {
        expect(selectAuthLoading(store.getState())).toBe(false);
      });

      it('should return true when loading', () => {
        store.dispatch(setLoading(true));

        expect(selectAuthLoading(store.getState())).toBe(true);
      });

      it('should return false after login completes', () => {
        store.dispatch(setLoading(true));
        store.dispatch(login(mockLoginResponse));

        expect(selectAuthLoading(store.getState())).toBe(false);
      });
    });
  });

  describe('Integration - Login/Logout flow', () => {
    it('should handle complete authentication flow', () => {
      // Initial state
      expect(selectIsAuthenticated(store.getState())).toBe(false);
      expect(selectUser(store.getState())).toBeNull();

      // Start loading
      store.dispatch(setLoading(true));
      expect(selectAuthLoading(store.getState())).toBe(true);

      // Login success
      store.dispatch(login(mockLoginResponse));
      expect(selectIsAuthenticated(store.getState())).toBe(true);
      expect(selectUser(store.getState())).toEqual(mockUser);
      expect(selectAuthLoading(store.getState())).toBe(false);

      // Logout
      store.dispatch(logout());
      expect(selectIsAuthenticated(store.getState())).toBe(false);
      expect(selectUser(store.getState())).toBeNull();
    });

    it('should handle session restore flow', () => {
      // App initialization - restore from localStorage
      store.dispatch(restoreSession({
        accessToken: 'restored-token',
        refreshToken: 'restored-refresh',
        user: mockUser,
      }));

      expect(selectIsAuthenticated(store.getState())).toBe(true);
      expect(selectUser(store.getState())).toEqual(mockUser);

      // User logs out
      store.dispatch(logout());

      expect(selectIsAuthenticated(store.getState())).toBe(false);
    });

    it('should handle login → logout → login cycle', () => {
      // First login
      store.dispatch(login(mockLoginResponse));
      expect(store.getState().auth.user?.id).toBe(123);

      // Logout
      store.dispatch(logout());
      expect(store.getState().auth.user).toBeNull();

      // Second login with different user
      const newUser: User = { ...mockUser, id: 456, email: 'new@example.com' };
      store.dispatch(login({ ...mockLoginResponse, user: newUser }));

      expect(store.getState().auth.user?.id).toBe(456);
      expect(store.getState().auth.user?.email).toBe('new@example.com');
    });
  });

  describe('Security checks', () => {
    it('should store tokens in both localStorage AND cookies for SSR', () => {
      store.dispatch(login(mockLoginResponse));

      // localStorage (for API requests)
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', expect.any(String));
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', expect.any(String));

      // Cookies (for SSR auth check)
      expect(cookieUtils.setCookie).toHaveBeenCalledWith('accessToken', expect.any(String), 7);
      expect(cookieUtils.setCookie).toHaveBeenCalledWith('refreshToken', expect.any(String), 7);
    });

    it('should completely clear all auth artifacts on logout', () => {
      store.dispatch(login(mockLoginResponse));
      store.dispatch(logout());

      // State cleared
      expect(store.getState().auth.accessToken).toBeNull();
      expect(store.getState().auth.refreshToken).toBeNull();
      expect(store.getState().auth.user).toBeNull();

      // localStorage cleared
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');

      // Cookies cleared
      expect(cookieUtils.deleteCookie).toHaveBeenCalledWith('accessToken');
      expect(cookieUtils.deleteCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should not leak sensitive data when logging out', () => {
      store.dispatch(login(mockLoginResponse));

      const stateBefore = { ...store.getState().auth };

      store.dispatch(logout());

      const stateAfter = store.getState().auth;

      // All sensitive fields should be null
      expect(stateAfter.accessToken).toBeNull();
      expect(stateAfter.refreshToken).toBeNull();
      expect(stateAfter.user).toBeNull();
      expect(stateAfter.expiresAt).toBeNull();
    });
  });
});
