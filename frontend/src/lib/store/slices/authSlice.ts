import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginResponse, User } from '@/types/auth';
import { setCookie, deleteCookie } from '@/lib/utils/cookies';

/**
 * Initial state for auth slice
 */
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * Auth slice - manages authentication state
 * Handles login, logout, and loading states
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Login action - save user data and tokens
     * Called after successful login API response
     */
    login(state, action: PayloadAction<LoginResponse>) {
      const { accessToken, refreshToken, expiresIn, user } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.expiresAt = Date.now() + expiresIn * 1000;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store tokens in both localStorage and cookies
      // localStorage for API requests, cookies for SSR auth check
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Set cookies for middleware auth check (7 days expiration)
        setCookie('accessToken', accessToken, 7);
        setCookie('refreshToken', refreshToken, 7);
      }
    },

    /**
     * Logout action - clear all auth state
     * Removes tokens from localStorage and cookies
     */
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage and cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('rememberMe');

        // Delete cookies
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
      }
    },

    /**
     * Set loading state
     * Used during token refresh or auth check
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    /**
     * Restore session from localStorage
     * Called on app initialization to restore auth state
     */
    restoreSession(state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>) {
      const { accessToken, refreshToken, user } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
  },
});

export const { login, logout, setLoading, restoreSession } = authSlice.actions;

// ===== Selectors =====
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;

export default authSlice.reducer;
