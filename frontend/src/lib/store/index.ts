import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import rckikReducer from './slices/rckikSlice';
import favoritesReducer from './slices/favoritesSlice';
import donationsReducer from './slices/donationsSlice';
import notificationsReducer from './slices/notificationsSlice';

/**
 * Redux store configuration
 * Combines all reducers and configures middleware
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    rckik: rckikReducer,
    favorites: favoritesReducer,
    donations: donationsReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['auth/login', 'auth/restoreSession'],
      },
    }),
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Typed hooks for Redux
 * Use these instead of plain useDispatch and useSelector
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T => useSelector(selector);
