import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  UserProfile,
  NotificationPreferences,
  UpdateProfileRequest,
  UpdateNotificationPreferencesRequest,
} from '@/types/profile';
import {
  getUserProfile,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  deleteUserAccount,
} from '@/lib/api/endpoints/user';
import {
  mapUserProfileResponseToViewModel,
  mapNotificationPreferencesResponseToViewModel,
} from '@/lib/utils/mappers';

/**
 * User slice state
 */
interface UserState {
  profile: UserProfile | null;
  notificationPreferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

/**
 * Initial state
 */
const initialState: UserState = {
  profile: null,
  notificationPreferences: null,
  isLoading: false,
  error: null,
  lastFetch: null,
};

// ===== Async Thunks =====

/**
 * Fetch user profile (GET /api/v1/users/me)
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserProfile();
      return mapUserProfileResponseToViewModel(response);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać profilu';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update user profile (PATCH /api/v1/users/me)
 */
export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      const response = await updateUserProfile(data);
      return mapUserProfileResponseToViewModel(response);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się zaktualizować profilu';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch notification preferences (GET /api/v1/users/me/notification-preferences)
 */
export const fetchNotificationPreferences = createAsyncThunk(
  'user/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getNotificationPreferences();
      return mapNotificationPreferencesResponseToViewModel(response);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać preferencji powiadomień';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update notification preferences (PUT /api/v1/users/me/notification-preferences)
 */
export const updatePreferences = createAsyncThunk(
  'user/updateNotificationPreferences',
  async (data: UpdateNotificationPreferencesRequest, { rejectWithValue }) => {
    try {
      const response = await updateNotificationPreferences(data);
      return mapNotificationPreferencesResponseToViewModel(response);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się zaktualizować preferencji';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete user account (DELETE /api/v1/users/me)
 */
export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (password: string, { rejectWithValue }) => {
    try {
      const response = await deleteUserAccount(password);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się usunąć konta';
      return rejectWithValue(message);
    }
  }
);

// ===== Slice =====

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Set profile (synchronous action)
     */
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.lastFetch = Date.now();
    },

    /**
     * Set notification preferences (synchronous action)
     */
    setNotificationPreferences: (state, action: PayloadAction<NotificationPreferences>) => {
      state.notificationPreferences = action.payload;
    },

    /**
     * Update profile field (optimistic update)
     */
    updateProfileField: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    /**
     * Clear user data (logout)
     */
    clearUserData: (state) => {
      return initialState;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isLoading = false;
        state.lastFetch = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isLoading = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch notification preferences
    builder
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.notificationPreferences = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update notification preferences
    builder
      .addCase(updatePreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.notificationPreferences = action.payload;
        state.isLoading = false;
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        // Clear all user data after successful deletion
        return initialState;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ===== Actions =====

export const {
  setProfile,
  setNotificationPreferences,
  updateProfileField,
  clearUserData,
  clearError,
} = userSlice.actions;

// ===== Selectors =====

export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectNotificationPreferences = (state: RootState) => state.user.notificationPreferences;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectLastFetch = (state: RootState) => state.user.lastFetch;

// ===== Reducer =====

export default userSlice.reducer;
