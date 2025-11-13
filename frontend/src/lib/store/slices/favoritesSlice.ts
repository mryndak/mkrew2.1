import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { FavoriteRckikDto } from '@/types/rckik';
import {
  addFavorite as addFavoriteApi,
  removeFavorite as removeFavoriteApi,
  fetchFavorites as fetchFavoritesApi,
} from '@/lib/api/endpoints/favorites';

/**
 * Favorites slice state
 * Zarządza listą ulubionych centrów użytkownika
 */
interface FavoritesState {
  favorites: FavoriteRckikDto[];
  favoriteIds: number[]; // Cache ID dla szybkiego sprawdzania
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

/**
 * Initial state
 */
const initialState: FavoritesState = {
  favorites: [],
  favoriteIds: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// ===== Async Thunks =====

/**
 * Fetch lista ulubionych centrów
 * Endpoint: GET /api/v1/users/me/favorites
 */
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchFavoritesApi();
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się pobrać ulubionych';
      return rejectWithValue(message);
    }
  }
);

/**
 * Dodaj centrum do ulubionych
 * Endpoint: POST /api/v1/users/me/favorites
 * Z optimistic update
 */
export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (
    { rckikId, priority }: { rckikId: number; priority?: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await addFavoriteApi(rckikId, priority);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się dodać do ulubionych';
      return rejectWithValue(message);
    }
  }
);

/**
 * Usuń centrum z ulubionych
 * Endpoint: DELETE /api/v1/users/me/favorites/{rckikId}
 * Z optimistic update
 */
export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (rckikId: number, { rejectWithValue }) => {
    try {
      await removeFavoriteApi(rckikId);
      return rckikId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nie udało się usunąć z ulubionych';
      return rejectWithValue(message);
    }
  }
);

// ===== Slice =====

/**
 * Favorites slice
 * Zarządza listą ulubionych centrów z optimistic updates
 */
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /**
     * Optimistic update - dodaj do ulubionych
     * Wywołaj przed API request
     */
    optimisticAddFavorite(state, action: PayloadAction<number>) {
      const rckikId = action.payload;
      if (!state.favoriteIds.includes(rckikId)) {
        state.favoriteIds.push(rckikId);
      }
    },

    /**
     * Optimistic update - usuń z ulubionych
     * Wywołaj przed API request
     */
    optimisticRemoveFavorite(state, action: PayloadAction<number>) {
      const rckikId = action.payload;
      state.favoriteIds = state.favoriteIds.filter(id => id !== rckikId);
      state.favorites = state.favorites.filter(fav => fav.rckikId !== rckikId);
    },

    /**
     * Rollback optimistic update
     * Wywołaj przy błędzie API request
     */
    rollbackOptimisticUpdate(state, action: PayloadAction<{ rckikId: number; wasAdded: boolean }>) {
      const { rckikId, wasAdded } = action.payload;
      if (wasAdded) {
        // Rollback dodania - usuń z favoriteIds
        state.favoriteIds = state.favoriteIds.filter(id => id !== rckikId);
      } else {
        // Rollback usunięcia - dodaj z powrotem do favoriteIds
        if (!state.favoriteIds.includes(rckikId)) {
          state.favoriteIds.push(rckikId);
        }
      }
    },

    /**
     * Wyczyść błąd
     */
    clearError(state) {
      state.error = null;
    },

    /**
     * Wyczyść wszystkie ulubione (np. po logout)
     */
    clearFavorites(state) {
      state.favorites = [];
      state.favoriteIds = [];
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFavorites - pending
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // fetchFavorites - fulfilled
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.favoriteIds = action.payload.map(fav => fav.rckikId);
        state.lastFetched = Date.now();
        state.error = null;
      })
      // fetchFavorites - rejected
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // addFavorite - pending (optimistic update już wykonane)
      .addCase(addFavorite.pending, (state) => {
        state.error = null;
      })
      // addFavorite - fulfilled
      .addCase(addFavorite.fulfilled, (state, action) => {
        // Dodaj pełne dane do listy favorites
        const newFavorite = action.payload;
        const exists = state.favorites.some(fav => fav.rckikId === newFavorite.rckikId);
        if (!exists) {
          state.favorites.push(newFavorite);
        }
        // Upewnij się że ID jest w favoriteIds
        if (!state.favoriteIds.includes(newFavorite.rckikId)) {
          state.favoriteIds.push(newFavorite.rckikId);
        }
        state.error = null;
      })
      // addFavorite - rejected (rollback w komponencie)
      .addCase(addFavorite.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // removeFavorite - pending (optimistic update już wykonane)
      .addCase(removeFavorite.pending, (state) => {
        state.error = null;
      })
      // removeFavorite - fulfilled
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const rckikId = action.payload;
        state.favorites = state.favorites.filter(fav => fav.rckikId !== rckikId);
        state.favoriteIds = state.favoriteIds.filter(id => id !== rckikId);
        state.error = null;
      })
      // removeFavorite - rejected (rollback w komponencie)
      .addCase(removeFavorite.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ===== Actions =====
export const {
  optimisticAddFavorite,
  optimisticRemoveFavorite,
  rollbackOptimisticUpdate,
  clearError,
  clearFavorites,
} = favoritesSlice.actions;

// ===== Selectors =====

/**
 * Selector - pobierz wszystkie ulubione
 */
export const selectFavorites = (state: RootState) => state.favorites.favorites;

/**
 * Selector - pobierz listę ID ulubionych
 */
export const selectFavoriteIds = (state: RootState) => state.favorites.favoriteIds;

/**
 * Selector - sprawdź czy centrum jest w ulubionych
 */
export const selectIsFavorite = (rckikId: number) => (state: RootState) => {
  return state.favorites.favoriteIds.includes(rckikId);
};

/**
 * Selector - pobierz loading state
 */
export const selectFavoritesLoading = (state: RootState) => state.favorites.loading;

/**
 * Selector - pobierz error state
 */
export const selectFavoritesError = (state: RootState) => state.favorites.error;

/**
 * Selector - sprawdź czy dane są aktualne (poniżej 5 minut)
 */
export const selectIsFavoritesDataFresh = (state: RootState) => {
  if (!state.favorites.lastFetched) return false;
  const FIVE_MINUTES = 5 * 60 * 1000;
  return Date.now() - state.favorites.lastFetched < FIVE_MINUTES;
};

// ===== Reducer =====
export default favoritesSlice.reducer;
