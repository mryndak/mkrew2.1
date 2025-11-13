import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  InAppNotificationDto,
  InAppNotificationsResponse,
} from '@/types/dashboard';
import {
  getUserNotifications,
  getRecentNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/api/endpoints/notifications';

/**
 * Notifications slice state
 * Zarządza powiadomieniami in-app użytkownika
 */
interface NotificationsState {
  notifications: InAppNotificationDto[];
  recentNotifications: InAppNotificationDto[]; // Cache dla ostatnich 5 powiadomień
  unreadCount: number;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
  };
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

/**
 * Initial state
 */
const initialState: NotificationsState = {
  notifications: [],
  recentNotifications: [],
  unreadCount: 0,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
  },
  loading: false,
  error: null,
  lastFetched: null,
};

// ===== Async Thunks =====

/**
 * Fetch lista powiadomień z paginacją
 * Endpoint: GET /api/v1/users/me/notifications
 */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (
    params: { unreadOnly?: boolean; page?: number; size?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const data = await getUserNotifications(params);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać powiadomień';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch ostatnie N powiadomień (dla Dashboard)
 * Endpoint: GET /api/v1/users/me/notifications?size=N
 */
export const fetchRecentNotifications = createAsyncThunk(
  'notifications/fetchRecent',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      const data = await getRecentNotifications(limit);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać ostatnich powiadomień';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch liczba nieprzeczytanych powiadomień
 * Endpoint: GET /api/v1/users/me/notifications/unread-count
 */
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUnreadNotificationsCount();
      return data.unreadCount;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać liczby nieprzeczytanych';
      return rejectWithValue(message);
    }
  }
);

/**
 * Oznacz powiadomienie jako przeczytane
 * Endpoint: PATCH /api/v1/users/me/notifications/{id}
 * Z optimistic update
 */
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const notification = await markNotificationAsRead(notificationId);
      return notification;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się oznaczyć jako przeczytane';
      return rejectWithValue(message);
    }
  }
);

/**
 * Oznacz wszystkie powiadomienia jako przeczytane
 * Endpoint: PATCH /api/v1/users/me/notifications/mark-all-read
 */
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const data = await markAllNotificationsAsRead();
      return data.markedCount;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się oznaczyć wszystkich jako przeczytane';
      return rejectWithValue(message);
    }
  }
);

/**
 * Usuń powiadomienie
 * Endpoint: DELETE /api/v1/users/me/notifications/{id}
 */
export const removeNotification = createAsyncThunk(
  'notifications/removeNotification',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      await deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się usunąć powiadomienia';
      return rejectWithValue(message);
    }
  }
);

// ===== Slice =====

/**
 * Notifications slice
 * Zarządza powiadomieniami z optimistic updates
 */
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /**
     * Wyczyść błąd
     */
    clearError(state) {
      state.error = null;
    },

    /**
     * Reset state (np. przy logout)
     */
    resetNotifications(state) {
      return initialState;
    },

    /**
     * Ustaw stronę paginacji
     */
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },

    /**
     * Ustaw rozmiar strony
     */
    setPageSize(state, action: PayloadAction<number>) {
      state.pagination.size = action.payload;
    },

    /**
     * Optimistic update - oznacz jako przeczytane (przed API call)
     */
    markAsReadOptimistic(state, action: PayloadAction<number>) {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.readAt) {
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }

      const recentNotification = state.recentNotifications.find((n) => n.id === action.payload);
      if (recentNotification && !recentNotification.readAt) {
        recentNotification.readAt = new Date().toISOString();
      }
    },

    /**
     * Rollback optimistic update (gdy API call failed)
     */
    rollbackMarkAsRead(state, action: PayloadAction<number>) {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.readAt = null;
        state.unreadCount += 1;
      }

      const recentNotification = state.recentNotifications.find((n) => n.id === action.payload);
      if (recentNotification) {
        recentNotification.readAt = null;
      }
    },

    /**
     * Dodaj nowe powiadomienie (z WebSocket lub polling)
     */
    addNewNotification(state, action: PayloadAction<InAppNotificationDto>) {
      state.notifications = [action.payload, ...state.notifications];
      state.recentNotifications = [action.payload, ...state.recentNotifications].slice(0, 5);
      if (!action.payload.readAt) {
        state.unreadCount += 1;
      }
    },

    /**
     * Dekrementuj licznik nieprzeczytanych
     */
    decrementUnreadCount(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },

    /**
     * Inkrementuj licznik nieprzeczytanych
     */
    incrementUnreadCount(state) {
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    // ===== Fetch notifications =====
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
      state.pagination = {
        page: action.payload.page,
        size: action.payload.size,
        totalElements: action.payload.totalElements,
      };
      state.lastFetched = Date.now();
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Fetch recent notifications =====
    builder.addCase(fetchRecentNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRecentNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.recentNotifications = action.payload;
      state.lastFetched = Date.now();
    });
    builder.addCase(fetchRecentNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Fetch unread count =====
    builder.addCase(fetchUnreadCount.pending, (state) => {
      // Don't set loading for background count fetch
      state.error = null;
    });
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });
    builder.addCase(fetchUnreadCount.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // ===== Mark as read =====
    builder.addCase(markAsRead.pending, (state) => {
      // Optimistic update already done, no loading state
      state.error = null;
    });
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload.id);
      if (index !== -1) {
        state.notifications[index] = action.payload;
      }
      const recentIndex = state.recentNotifications.findIndex((n) => n.id === action.payload.id);
      if (recentIndex !== -1) {
        state.recentNotifications[recentIndex] = action.payload;
      }
    });
    builder.addCase(markAsRead.rejected, (state, action) => {
      state.error = action.payload as string;
      // Rollback will be done by caller
    });

    // ===== Mark all as read =====
    builder.addCase(markAllAsRead.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.loading = false;
      state.notifications = state.notifications.map((n) => ({
        ...n,
        readAt: n.readAt || new Date().toISOString(),
      }));
      state.recentNotifications = state.recentNotifications.map((n) => ({
        ...n,
        readAt: n.readAt || new Date().toISOString(),
      }));
      state.unreadCount = 0;
    });
    builder.addCase(markAllAsRead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Remove notification =====
    builder.addCase(removeNotification.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeNotification.fulfilled, (state, action) => {
      state.loading = false;
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.readAt) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      state.recentNotifications = state.recentNotifications.filter((n) => n.id !== action.payload);
    });
    builder.addCase(removeNotification.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===== Actions =====
export const {
  clearError,
  resetNotifications,
  setPage,
  setPageSize,
  markAsReadOptimistic,
  rollbackMarkAsRead,
  addNewNotification,
  decrementUnreadCount,
  incrementUnreadCount,
} = notificationsSlice.actions;

// ===== Selectors =====
export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectRecentNotifications = (state: RootState) =>
  state.notifications.recentNotifications;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state: RootState) => state.notifications.loading;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectNotificationsPagination = (state: RootState) => state.notifications.pagination;

export default notificationsSlice.reducer;
