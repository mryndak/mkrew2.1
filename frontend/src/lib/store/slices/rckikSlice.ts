import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { RckikDetailDto } from '@/types/rckik';
import { fetchRckikDetails as fetchRckikDetailsApi } from '@/lib/api/endpoints/rckik';

/**
 * RCKiK slice state
 * Przechowuje dane aktualnie wyświetlanego centrum
 */
interface RckikState {
  currentRckik: RckikDetailDto | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null; // timestamp dla cache invalidation
}

/**
 * Initial state
 */
const initialState: RckikState = {
  currentRckik: null,
  loading: false,
  error: null,
  lastFetched: null,
};

// ===== Async Thunks =====

/**
 * Fetch szczegółowych danych centrum RCKiK
 * Endpoint: GET /api/v1/rckik/{id}
 */
export const fetchRckikDetails = createAsyncThunk(
  'rckik/fetchDetails',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await fetchRckikDetailsApi(id);
      return data;
    } catch (error: any) {
      // Enhanced error handling with specific messages
      let errorMessage = 'Nie udało się pobrać szczegółów centrum';

      if (error.response) {
        // HTTP error responses
        switch (error.response.status) {
          case 404:
            errorMessage = 'Centrum RCKiK nie zostało znalezione';
            break;
          case 403:
            errorMessage = 'Brak dostępu do szczegółów centrum';
            break;
          case 500:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
            break;
          case 503:
            errorMessage = 'Serwis chwilowo niedostępny. Spróbuj ponownie za chwilę';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        // Network error - no response received
        errorMessage = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe';
      } else if (error.message) {
        // Other errors
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// ===== Slice =====

/**
 * RCKiK slice
 * Zarządza stanem aktualnie wyświetlanego centrum RCKiK
 */
const rckikSlice = createSlice({
  name: 'rckik',
  initialState,
  reducers: {
    /**
     * Wyczyść dane aktualnego centrum
     * Użycie: przy opuszczaniu widoku szczegółów
     */
    clearCurrentRckik(state) {
      state.currentRckik = null;
      state.error = null;
      state.lastFetched = null;
    },

    /**
     * Ustaw błąd manualnie
     * Użycie: przy obsłudze błędów w komponentach
     */
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },

    /**
     * Wyczyść błąd
     */
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchRckikDetails - pending
      .addCase(fetchRckikDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // fetchRckikDetails - fulfilled
      .addCase(fetchRckikDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRckik = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      // fetchRckikDetails - rejected
      .addCase(fetchRckikDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ===== Actions =====
export const { clearCurrentRckik, setError, clearError } = rckikSlice.actions;

// ===== Selectors =====

/**
 * Selector - pobierz aktualne centrum
 */
export const selectCurrentRckik = (state: RootState) => state.rckik.currentRckik;

/**
 * Selector - pobierz loading state
 */
export const selectRckikLoading = (state: RootState) => state.rckik.loading;

/**
 * Selector - pobierz error state
 */
export const selectRckikError = (state: RootState) => state.rckik.error;

/**
 * Selector - pobierz timestamp ostatniego fetch
 */
export const selectRckikLastFetched = (state: RootState) => state.rckik.lastFetched;

/**
 * Selector - sprawdź czy dane są aktualne (poniżej 5 minut)
 */
export const selectIsRckikDataFresh = (state: RootState) => {
  if (!state.rckik.lastFetched) return false;
  const FIVE_MINUTES = 5 * 60 * 1000;
  return Date.now() - state.rckik.lastFetched < FIVE_MINUTES;
};

// ===== Reducer =====
export default rckikSlice.reducer;
