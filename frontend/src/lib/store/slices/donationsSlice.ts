import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  DonationResponse,
  DonationStatisticsDto,
  DonationListResponse,
} from '@/types/dashboard';
import {
  getUserDonations,
  getDonationStatistics,
  getRecentDonations,
  createDonation,
  updateDonation,
  deleteDonation,
} from '@/lib/api/endpoints/donations';

/**
 * Donations slice state
 * Zarządza listą donacji i statystykami użytkownika
 */
interface DonationsState {
  donations: DonationResponse[];
  recentDonations: DonationResponse[]; // Cache dla ostatnich 3 donacji
  statistics: DonationStatisticsDto | null;
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
const initialState: DonationsState = {
  donations: [],
  recentDonations: [],
  statistics: null,
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
 * Fetch lista donacji użytkownika z paginacją
 * Endpoint: GET /api/v1/users/me/donations
 */
export const fetchDonations = createAsyncThunk(
  'donations/fetchDonations',
  async (
    params: { page?: number; size?: number; sortOrder?: 'ASC' | 'DESC' } = {},
    { rejectWithValue }
  ) => {
    try {
      const data = await getUserDonations(params);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać donacji';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch statystyki donacji użytkownika
 * Endpoint: GET /api/v1/users/me/donations/statistics
 */
export const fetchDonationStats = createAsyncThunk(
  'donations/fetchStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDonationStatistics();
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać statystyk';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch ostatnie N donacji (dla Dashboard)
 * Endpoint: GET /api/v1/users/me/donations?size=N
 */
export const fetchRecentDonations = createAsyncThunk(
  'donations/fetchRecent',
  async (limit: number = 3, { rejectWithValue }) => {
    try {
      const data = await getRecentDonations(limit);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać ostatnich donacji';
      return rejectWithValue(message);
    }
  }
);

/**
 * Dodaj nową donację
 * Endpoint: POST /api/v1/users/me/donations
 */
export const addDonation = createAsyncThunk(
  'donations/addDonation',
  async (
    data: {
      rckikId: number;
      donationDate: string;
      quantityMl: number;
      donationType: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
      notes?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const donation = await createDonation(data);
      return donation;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się dodać donacji';
      return rejectWithValue(message);
    }
  }
);

/**
 * Aktualizuj istniejącą donację
 * Endpoint: PATCH /api/v1/users/me/donations/{id}
 */
export const editDonation = createAsyncThunk(
  'donations/editDonation',
  async (
    {
      donationId,
      data,
    }: {
      donationId: number;
      data: {
        rckikId?: number;
        donationDate?: string;
        quantityMl?: number;
        donationType?: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
        notes?: string | null;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const donation = await updateDonation(donationId, data);
      return donation;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się zaktualizować donacji';
      return rejectWithValue(message);
    }
  }
);

/**
 * Usuń donację
 * Endpoint: DELETE /api/v1/users/me/donations/{id}
 */
export const removeDonation = createAsyncThunk(
  'donations/removeDonation',
  async (donationId: number, { rejectWithValue }) => {
    try {
      await deleteDonation(donationId);
      return donationId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się usunąć donacji';
      return rejectWithValue(message);
    }
  }
);

// ===== Slice =====

/**
 * Donations slice
 * Zarządza donacjami użytkownika z cache'owaniem i optimistic updates
 */
const donationsSlice = createSlice({
  name: 'donations',
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
    resetDonations(state) {
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
  },
  extraReducers: (builder) => {
    // ===== Fetch donations =====
    builder.addCase(fetchDonations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDonations.fulfilled, (state, action) => {
      state.loading = false;
      state.donations = action.payload.donations;
      state.statistics = action.payload.statistics;
      state.pagination = {
        page: action.payload.page,
        size: action.payload.size,
        totalElements: action.payload.totalElements,
      };
      state.lastFetched = Date.now();
    });
    builder.addCase(fetchDonations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Fetch statistics =====
    builder.addCase(fetchDonationStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDonationStats.fulfilled, (state, action) => {
      state.loading = false;
      state.statistics = action.payload;
      state.lastFetched = Date.now();
    });
    builder.addCase(fetchDonationStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Fetch recent donations =====
    builder.addCase(fetchRecentDonations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRecentDonations.fulfilled, (state, action) => {
      state.loading = false;
      state.recentDonations = action.payload;
      state.lastFetched = Date.now();
    });
    builder.addCase(fetchRecentDonations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Add donation =====
    builder.addCase(addDonation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addDonation.fulfilled, (state, action) => {
      state.loading = false;
      // Add to beginning of list (most recent first)
      state.donations = [action.payload, ...state.donations];
      // Update recent donations if needed
      state.recentDonations = [action.payload, ...state.recentDonations].slice(0, 3);
      // Invalidate statistics (will need refetch)
      state.statistics = null;
    });
    builder.addCase(addDonation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Edit donation =====
    builder.addCase(editDonation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(editDonation.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.donations.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) {
        state.donations[index] = action.payload;
      }
      // Update in recent donations if present
      const recentIndex = state.recentDonations.findIndex((d) => d.id === action.payload.id);
      if (recentIndex !== -1) {
        state.recentDonations[recentIndex] = action.payload;
      }
      // Invalidate statistics
      state.statistics = null;
    });
    builder.addCase(editDonation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ===== Remove donation =====
    builder.addCase(removeDonation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeDonation.fulfilled, (state, action) => {
      state.loading = false;
      state.donations = state.donations.filter((d) => d.id !== action.payload);
      state.recentDonations = state.recentDonations.filter((d) => d.id !== action.payload);
      // Invalidate statistics
      state.statistics = null;
    });
    builder.addCase(removeDonation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ===== Actions =====
export const { clearError, resetDonations, setPage, setPageSize } = donationsSlice.actions;

// ===== Selectors =====
export const selectDonations = (state: RootState) => state.donations.donations;
export const selectRecentDonations = (state: RootState) => state.donations.recentDonations;
export const selectDonationStatistics = (state: RootState) => state.donations.statistics;
export const selectDonationsLoading = (state: RootState) => state.donations.loading;
export const selectDonationsError = (state: RootState) => state.donations.error;
export const selectDonationsPagination = (state: RootState) => state.donations.pagination;

export default donationsSlice.reducer;
