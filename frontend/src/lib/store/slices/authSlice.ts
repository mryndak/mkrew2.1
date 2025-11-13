import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginResponse, User } from '@/types/auth';

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

      // Store tokens in localStorage (or use httpOnly cookies in production)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },

    /**
     * Logout action - clear all auth state
     * Removes tokens from localStorage
     */
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
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
export default authSlice.reducer;
