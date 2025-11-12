# Plan implementacji widoku Profil

## 1. Przegląd

Widok Profil jest chronioną stroną aplikacji, która umożliwia zalogowanym użytkownikom zarządzanie swoimi danymi osobowymi, preferencjami powiadomień oraz bezpieczeństwem konta. Widok integruje się z API backendu w celu zapewnienia aktualizacji danych w czasie rzeczywistym oraz wspiera funkcjonalności związane z GDPR (eksport i usunięcie danych).

**Główne funkcjonalności:**
- Edycja danych osobowych (imię, nazwisko, grupa krwi)
- Zarządzanie preferencjami powiadomień (email i in-app)
- Zmiana hasła (inicjowanie procesu resetu)
- Narzędzia GDPR (eksport danych, usunięcie konta)
- Auto-zapis z debounce dla lepszego UX

**User Stories:**
- US-005: Edycja profilu użytkownika
- US-006: Ustawienia powiadomień
- US-016: Żądanie usunięcia danych (Right to be Forgotten)

## 2. Routing widoku

**Ścieżka:** `/dashboard/profile`

**Typ renderowania:** SSR (Server-Side Rendering) z React islands dla interaktywnych komponentów

**Middleware autoryzacji:** Wymaga uwierzytelnienia JWT - użytkownicy nieuwierzytelnieni są przekierowywani do `/login`

**Layout:** `DashboardLayout.astro` - zawiera sidebar nawigacyjny, header z użytkownikiem oraz footer

## 3. Struktura komponentów

```
ProfilePage (Astro)
├── ProfileView (React island - client:load)
    ├── ProfileHeader
    │   ├── PageTitle
    │   └── Breadcrumbs
    │
    ├── ProfileForm (React island - client:load)
    │   ├── FormSection (Dane osobowe)
    │   │   ├── Input (firstName)
    │   │   ├── Input (lastName)
    │   │   └── Select (bloodGroup)
    │   ├── FormSection (Email - readonly)
    │   │   └── Input (email - disabled)
    │   └── SaveIndicator (auto-save status)
    │
    ├── NotificationPreferencesForm (React island - client:idle)
    │   ├── FormSection (Email notifications)
    │   │   ├── Checkbox (emailEnabled)
    │   │   └── Select (emailFrequency)
    │   ├── FormSection (In-app notifications)
    │   │   ├── Checkbox (inAppEnabled)
    │   │   └── Select (inAppFrequency)
    │   └── Button (Zapisz preferencje)
    │
    ├── PasswordChangeSection (React)
    │   ├── InfoBox (wyjaśnienie procesu)
    │   └── Button (Zmień hasło - otwiera modal)
    │
    └── GDPRTools (React island - client:visible)
        ├── Card (Eksport danych)
        │   ├── Description
        │   └── Button (Eksportuj dane)
        ├── Card (Usuń konto)
        │   ├── WarningText
        │   └── Button (Usuń konto - otwiera modal)
        └── ConfirmModal (potwierdzenie usunięcia)
            ├── ModalHeader
            ├── ModalBody (ostrzeżenie + input password)
            └── ModalFooter (Anuluj / Potwierdź)
```

## 4. Szczegóły komponentów

### ProfileView
- **Opis:** Główny kontener widoku profilu, zarządza stanem globalnym i koordynuje komunikację między komponentami
- **Główne elementy:**
  - Container z maksymalną szerokością (max-w-4xl)
  - Grid layout dla responsywności (1 kolumna mobile, 2 kolumny desktop dla niektórych sekcji)
  - Toast container dla notyfikacji
- **Obsługiwane interakcje:**
  - Pobieranie danych profilu przy montowaniu komponentu
  - Obsługa błędów autoryzacji (redirect do login)
  - Wyświetlanie globalnych toastów (sukces/błąd)
- **Obsługiwana walidacja:** N/A (koordynacja walidacji z podkomponentów)
- **Typy:**
  - `UserProfile` (ViewModel)
  - `NotificationPreferences` (ViewModel)
  - `ProfileViewState` (local state)
- **Propsy:** Brak (root component dla strony)

### ProfileForm
- **Opis:** Formularz edycji danych osobowych z automatycznym zapisem po wykryciu zmian (debounce 2s)
- **Główne elementy:**
  - Card wrapper z tytułem "Dane osobowe"
  - FormField dla firstName (Input + Label + Error)
  - FormField dla lastName (Input + Label + Error)
  - FormField dla bloodGroup (Select + Label + Error)
  - FormField dla email (Input disabled + Label + ikona info)
  - SaveIndicator (ikona + tekst statusu: "Zapisywanie...", "Zapisano", "Błąd zapisu")
- **Obsługiwane interakcje:**
  - onChange dla każdego pola → trigger debounced save
  - onBlur → natychmiastowy zapis jeśli są niezapisane zmiany
  - Optimistic updates (lokalnie aktualizuje UI przed potwierdzeniem z API)
  - Rollback przy błędzie API
- **Obsługiwana walidacja:**
  - firstName: max 100 znaków, brak liczb
  - lastName: max 100 znaków, brak liczb
  - bloodGroup: jedna z 8 wartości ("0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-") lub pusta
  - email: readonly (tylko wyświetlanie)
  - Inline validation z natychmiastowym feedbackiem
- **Typy:**
  - `UserProfile` (ViewModel)
  - `UpdateProfileRequest` (DTO)
  - `UpdateProfileFormState` (local state)
  - `ValidationErrors` (error state)
- **Propsy:**
  ```typescript
  interface ProfileFormProps {
    initialData: UserProfile;
    onSave: (data: UpdateProfileRequest) => Promise<void>;
    onError: (error: string) => void;
  }
  ```

### NotificationPreferencesForm
- **Opis:** Formularz zarządzania preferencjami powiadomień z natychmiastowym zapisem po kliknięciu przycisku
- **Główne elementy:**
  - Card wrapper z tytułem "Preferencje powiadomień"
  - Section "Powiadomienia e-mail":
    - Checkbox (emailEnabled) + Label
    - Select (emailFrequency) z opcjami: Wyłączone, Tylko krytyczne, Codziennie, Natychmiast
  - Section "Powiadomienia w aplikacji":
    - Checkbox (inAppEnabled) + Label
    - Select (inAppFrequency) z opcjami: Wyłączone, Tylko krytyczne, Codziennie, Natychmiast
  - Button "Zapisz preferencje" (primary, disabled podczas zapisywania)
  - Tooltip z wyjaśnieniem każdej opcji częstotliwości
- **Obsługiwane interakcje:**
  - onChange dla checkboxów → enable/disable odpowiedniego selecta
  - onSubmit → zapis do API z loading state
  - Toast notification po sukcesie/błędzie
  - Disabled state dla selecta gdy checkbox jest unchecked
- **Obsługiwana walidacja:**
  - emailEnabled: boolean (required)
  - emailFrequency: enum ["DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"] (required)
  - inAppEnabled: boolean (required)
  - inAppFrequency: enum ["DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"] (required)
  - Walidacja logiczna: jeśli emailEnabled=false, emailFrequency może być dowolne (ale zalecane DISABLED)
- **Typy:**
  - `NotificationPreferences` (ViewModel)
  - `UpdateNotificationPreferencesRequest` (DTO)
  - `NotificationPreferencesFormState` (local state)
- **Propsy:**
  ```typescript
  interface NotificationPreferencesFormProps {
    initialData: NotificationPreferences;
    onSave: (data: UpdateNotificationPreferencesRequest) => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (error: string) => void;
  }
  ```

### PasswordChangeSection
- **Opis:** Sekcja umożliwiająca użytkownikowi inicjowanie procesu zmiany hasła poprzez email reset
- **Główne elementy:**
  - Card wrapper z tytułem "Zmiana hasła"
  - Alert box (info) z wyjaśnieniem: "Aby zmienić hasło, otrzymasz link resetujący na swój adres email"
  - Button "Zmień hasło" (secondary)
  - Modal z potwierdzeniem wysłania emaila (opcjonalnie)
- **Obsługiwane interakcje:**
  - onClick na Button → wywołanie API POST /api/v1/auth/password-reset/request
  - Wyświetlenie modalu potwierdzającego wysłanie emaila
  - Toast notification po sukcesie/błędzie
- **Obsługiwana walidacja:** Brak (proces resetowania waliduje email w osobnym flow)
- **Typy:**
  - `PasswordResetRequestDto` (DTO)
- **Propsy:**
  ```typescript
  interface PasswordChangeSectionProps {
    userEmail: string;
    onRequestReset: (email: string) => Promise<void>;
    onSuccess: (message: string) => void;
    onError: (error: string) => void;
  }
  ```

### GDPRTools
- **Opis:** Komponent z narzędziami związanymi z GDPR - eksport danych użytkownika i usunięcie konta
- **Główne elementy:**
  - Card wrapper z tytułem "Zarządzanie danymi"
  - Section "Eksport danych":
    - Opis funkcjonalności
    - Button "Pobierz moje dane" (secondary)
    - Format eksportu: JSON
  - Section "Usunięcie konta":
    - Alert box (danger) z ostrzeżeniem o nieodwracalności
    - Button "Usuń konto" (danger)
  - ConfirmModal (potwierdzenie usunięcia konta):
    - Tytuł: "Czy na pewno chcesz usunąć konto?"
    - Opis konsekwencji
    - Input password (wymagane do potwierdzenia)
    - Checkbox "Rozumiem, że ta akcja jest nieodwracalna"
    - Button "Anuluj" / Button "Usuń konto" (danger)
- **Obsługiwane interakcje:**
  - onClick "Pobierz moje dane" → wywołanie API (może być async z linkiem do pobrania)
  - onClick "Usuń konto" → otwarcie ConfirmModal
  - onSubmit ConfirmModal → wywołanie API DELETE /api/v1/users/me z password w body
  - Po sukcesie usunięcia → logout i redirect do strony głównej z komunikatem
  - Rollback modalu przy błędzie walidacji hasła
- **Obsługiwana walidacja:**
  - Password: required w modalu potwierdzenia
  - Checkbox potwierdzenia: required (must be checked)
- **Typy:**
  - `DeleteAccountRequest` (local type z password)
  - `DeleteAccountResponse` (DTO)
- **Propsy:**
  ```typescript
  interface GDPRToolsProps {
    userId: number;
    onExportData: () => Promise<void>;
    onDeleteAccount: (password: string) => Promise<DeleteAccountResponse>;
    onSuccess: (message: string) => void;
    onError: (error: string) => void;
  }
  ```

### ConfirmModal
- **Opis:** Reużywalny komponent modalny do potwierdzania niebezpiecznych akcji (np. usunięcie konta)
- **Główne elementy:**
  - Modal overlay (backdrop z blur)
  - Modal container (center screen)
  - Modal header (tytuł + X button)
  - Modal body (treść + opcjonalnie input/checkbox)
  - Modal footer (buttony akcji)
  - Focus trap (zarządzanie focusem klawiatury)
- **Obsługiwane interakcje:**
  - ESC key → zamknięcie modalu
  - Click na backdrop → zamknięcie modalu
  - Click na X button → zamknięcie modalu
  - Click na "Anuluj" → zamknięcie modalu
  - Click na "Potwierdź" → wywołanie onConfirm callback
  - Focus trap dla accessibility
- **Obsługiwana walidacja:**
  - Opcjonalna walidacja inputów w body (np. password required)
- **Typy:**
  - `ConfirmModalProps` (generic)
- **Propsy:**
  ```typescript
  interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    requirePassword?: boolean;
    requireConfirmation?: boolean;
    onConfirm: (data?: any) => Promise<void>;
    onCancel: () => void;
  }
  ```

### SaveIndicator
- **Opis:** Komponent wyświetlający status zapisu formularza (saving, saved, error)
- **Główne elementy:**
  - Container inline z ikoną + tekstem
  - Ikona: spinner (saving), checkmark (saved), exclamation (error)
  - Tekst statusu z odpowiednim kolorem
  - Opcjonalnie: timestamp ostatniego zapisu
- **Obsługiwane interakcje:** N/A (tylko prezentacja stanu)
- **Obsługiwana walidacja:** N/A
- **Typy:**
  - `SaveStatus` = 'idle' | 'saving' | 'saved' | 'error'
- **Propsy:**
  ```typescript
  interface SaveIndicatorProps {
    status: SaveStatus;
    message?: string;
    lastSavedAt?: Date;
  }
  ```

## 5. Typy

### DTO Types (z backendu)

```typescript
// Response z GET /api/v1/users/me
interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: string | null;
  emailVerified: boolean;
  consentTimestamp: string; // ISO 8601
  consentVersion: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Request do PATCH /api/v1/users/me
interface UpdateProfileRequest {
  firstName?: string; // max 100 chars
  lastName?: string; // max 100 chars
  bloodGroup?: string | null; // "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-" or null
}

// Response z GET /api/v1/users/me/notification-preferences
interface NotificationPreferencesResponse {
  id: number;
  userId: number;
  emailEnabled: boolean;
  emailFrequency: NotificationFrequency;
  inAppEnabled: boolean;
  inAppFrequency: NotificationFrequency;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Request do PUT /api/v1/users/me/notification-preferences
interface UpdateNotificationPreferencesRequest {
  emailEnabled: boolean;
  emailFrequency: NotificationFrequency;
  inAppEnabled: boolean;
  inAppFrequency: NotificationFrequency;
}

// Response z DELETE /api/v1/users/me
interface DeleteAccountResponse {
  message: string;
  deletionScheduledAt: string; // ISO 8601
}
```

### ViewModel Types (frontend)

```typescript
// ViewModel dla profilu użytkownika (frontend reprezentacja)
interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: BloodGroup | null;
  emailVerified: boolean;
  consentInfo: {
    timestamp: Date;
    version: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ViewModel dla preferencji powiadomień
interface NotificationPreferences {
  id: number;
  userId: number;
  email: {
    enabled: boolean;
    frequency: NotificationFrequency;
  };
  inApp: {
    enabled: boolean;
    frequency: NotificationFrequency;
  };
  updatedAt: Date;
}

// Enum dla grupy krwi
enum BloodGroup {
  O_POSITIVE = '0+',
  O_NEGATIVE = '0-',
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-'
}

// Enum dla częstotliwości powiadomień
enum NotificationFrequency {
  DISABLED = 'DISABLED',
  ONLY_CRITICAL = 'ONLY_CRITICAL',
  DAILY = 'DAILY',
  IMMEDIATE = 'IMMEDIATE'
}

// Typy dla stanu formularza profilu
interface ProfileFormState {
  data: UpdateProfileRequest;
  isDirty: boolean;
  isSaving: boolean;
  errors: ValidationErrors;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
}

// Typy dla stanu formularza preferencji
interface NotificationPreferencesFormState {
  data: UpdateNotificationPreferencesRequest;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: ValidationErrors;
}

// Typy dla walidacji
interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  bloodGroup?: string;
  emailFrequency?: string;
  inAppFrequency?: string;
  password?: string;
  [key: string]: string | undefined;
}

// Status zapisu
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Request usunięcia konta (z hasłem)
interface DeleteAccountRequest {
  password: string;
  confirmation: boolean;
}
```

### Form Types (React Hook Form)

```typescript
import { z } from 'zod';

// Schema walidacji dla profilu (Zod)
const profileSchema = z.object({
  firstName: z.string()
    .max(100, 'Imię nie może być dłuższe niż 100 znaków')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]+$/, 'Imię zawiera niedozwolone znaki')
    .optional()
    .or(z.literal('')),
  lastName: z.string()
    .max(100, 'Nazwisko nie może być dłuższe niż 100 znaków')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]+$/, 'Nazwisko zawiera niedozwolone znaki')
    .optional()
    .or(z.literal('')),
  bloodGroup: z.enum(['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
    .nullable()
    .optional()
});

// Schema walidacji dla preferencji powiadomień
const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  emailFrequency: z.enum(['DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE']),
  inAppEnabled: z.boolean(),
  inAppFrequency: z.enum(['DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE'])
});

// Schema walidacji dla usunięcia konta
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Hasło jest wymagane'),
  confirmation: z.boolean().refine(val => val === true, {
    message: 'Musisz potwierdzić usunięcie konta'
  })
});

// Typy inferred z schematów
type ProfileFormData = z.infer<typeof profileSchema>;
type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;
type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
```

## 6. Zarządzanie stanem

### Redux Store (Global State)

**Slice: `userSlice`**

```typescript
// src/lib/store/slices/userSlice.ts

interface UserState {
  profile: UserProfile | null;
  notificationPreferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: UserState = {
  profile: null,
  notificationPreferences: null,
  isLoading: false,
  error: null,
  lastFetch: null
};

// Actions
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous actions
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.lastFetch = Date.now();
    },
    setNotificationPreferences: (state, action: PayloadAction<NotificationPreferences>) => {
      state.notificationPreferences = action.payload;
    },
    updateProfileField: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    clearUserData: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    // Async actions (createAsyncThunk)
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
        state.error = action.error.message || 'Failed to fetch profile';
      })
      // ... similar patterns for other async actions
  }
});

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<UserProfileResponse>('/users/me');
      return mapUserProfileResponseToViewModel(response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unknown error');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<UserProfileResponse>('/users/me', data);
      return mapUserProfileResponseToViewModel(response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'user/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationPreferencesResponse>(
        '/users/me/notification-preferences'
      );
      return mapNotificationPreferencesResponseToViewModel(response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unknown error');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'user/updateNotificationPreferences',
  async (data: UpdateNotificationPreferencesRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<NotificationPreferencesResponse>(
        '/users/me/notification-preferences',
        data
      );
      return mapNotificationPreferencesResponseToViewModel(response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'user/deleteAccount',
  async (password: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete<DeleteAccountResponse>('/users/me', {
        data: { password }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Deletion failed');
    }
  }
);

// Selectors
export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectNotificationPreferences = (state: RootState) => state.user.notificationPreferences;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;
```

### Custom Hooks

**Hook: `useProfile`**

```typescript
// src/lib/hooks/useProfile.ts

export const useProfile = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  // Fetch profile na mount jeśli nie istnieje
  useEffect(() => {
    if (!profile) {
      dispatch(fetchUserProfile());
    }
  }, [profile, dispatch]);

  const updateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      const result = await dispatch(updateUserProfile(data));
      if (updateUserProfile.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.error.message);
    },
    [dispatch]
  );

  const refresh = useCallback(() => {
    return dispatch(fetchUserProfile());
  }, [dispatch]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refresh
  };
};
```

**Hook: `useNotificationPreferences`**

```typescript
// src/lib/hooks/useNotificationPreferences.ts

export const useNotificationPreferences = () => {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectNotificationPreferences);
  const isLoading = useAppSelector(selectUserLoading);

  useEffect(() => {
    if (!preferences) {
      dispatch(fetchNotificationPreferences());
    }
  }, [preferences, dispatch]);

  const updatePreferences = useCallback(
    async (data: UpdateNotificationPreferencesRequest) => {
      const result = await dispatch(updateNotificationPreferences(data));
      if (updateNotificationPreferences.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.error.message);
    },
    [dispatch]
  );

  return {
    preferences,
    isLoading,
    updatePreferences
  };
};
```

**Hook: `useDebouncedSave`**

```typescript
// src/lib/hooks/useDebouncedSave.ts

export const useDebouncedSave = <T>(
  saveFn: (data: T) => Promise<void>,
  delay: number = 2000
) => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback(
    (data: T) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set saving status
      setStatus('saving');

      // Create new timeout
      timeoutRef.current = setTimeout(async () => {
        try {
          await saveFn(data);
          setStatus('saved');
          setLastSavedAt(new Date());

          // Reset to idle after 2 seconds
          setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
          setStatus('error');
          console.error('Save failed:', error);
        }
      }, delay);
    },
    [saveFn, delay]
  );

  const saveImmediately = useCallback(
    async (data: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setStatus('saving');
      try {
        await saveFn(data);
        setStatus('saved');
        setLastSavedAt(new Date());
        setTimeout(() => setStatus('idle'), 2000);
      } catch (error) {
        setStatus('error');
        throw error;
      }
    },
    [saveFn]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    status,
    lastSavedAt
  };
};
```

### Local Component State

Każdy formularz zarządza własnym lokalnym stanem za pomocą React Hook Form:

- **ProfileForm:** `useForm<ProfileFormData>` + debounced save
- **NotificationPreferencesForm:** `useForm<NotificationPreferencesFormData>` + submit handler
- **ConfirmModal (delete account):** `useForm<DeleteAccountFormData>` + submit handler

## 7. Integracja API

### Endpoints i typy żądań/odpowiedzi

#### 1. GET /api/v1/users/me (Pobranie profilu)

**Request:**
- Method: GET
- Headers: `Authorization: Bearer <token>`
- Body: brak

**Response (200 OK):**
```typescript
UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: string | null;
  emailVerified: boolean;
  consentTimestamp: string; // "2025-01-01T10:00:00"
  consentVersion: string; // "1.0"
  createdAt: string; // "2025-01-01T10:00:00"
  updatedAt: string; // "2025-01-05T15:30:00"
}
```

**Error Responses:**
- 401 Unauthorized: Token invalid lub expired → redirect do /login
- 500 Internal Server Error: Błąd serwera → toast error

---

#### 2. PATCH /api/v1/users/me (Aktualizacja profilu)

**Request:**
- Method: PATCH
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
```typescript
UpdateProfileRequest {
  firstName?: string; // max 100 chars
  lastName?: string; // max 100 chars
  bloodGroup?: string | null; // valid blood group or null
}
```

**Response (200 OK):**
```typescript
UserProfileResponse {
  // ... (same as GET response)
  updatedAt: string; // nowy timestamp
}
```

**Error Responses:**
- 400 Bad Request: Walidacja niepoprawna → wyświetl inline errors
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "firstName",
        "message": "First name must not exceed 100 characters"
      }
    ]
  }
  ```
- 401 Unauthorized: Token invalid → redirect do /login
- 500 Internal Server Error: Błąd serwera → toast error, rollback changes

---

#### 3. GET /api/v1/users/me/notification-preferences (Pobranie preferencji powiadomień)

**Request:**
- Method: GET
- Headers: `Authorization: Bearer <token>`
- Body: brak

**Response (200 OK):**
```typescript
NotificationPreferencesResponse {
  id: number;
  userId: number;
  emailEnabled: boolean;
  emailFrequency: "DISABLED" | "ONLY_CRITICAL" | "DAILY" | "IMMEDIATE";
  inAppEnabled: boolean;
  inAppFrequency: "DISABLED" | "ONLY_CRITICAL" | "DAILY" | "IMMEDIATE";
  createdAt: string;
  updatedAt: string;
}
```

**Error Responses:**
- 401 Unauthorized: Token invalid → redirect do /login
- 404 Not Found: Preferencje nie istnieją (auto-create on backend, unlikely)

---

#### 4. PUT /api/v1/users/me/notification-preferences (Aktualizacja preferencji)

**Request:**
- Method: PUT
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
```typescript
UpdateNotificationPreferencesRequest {
  emailEnabled: boolean; // required
  emailFrequency: "DISABLED" | "ONLY_CRITICAL" | "DAILY" | "IMMEDIATE"; // required
  inAppEnabled: boolean; // required
  inAppFrequency: "DISABLED" | "ONLY_CRITICAL" | "DAILY" | "IMMEDIATE"; // required
}
```

**Response (200 OK):**
```typescript
NotificationPreferencesResponse {
  // ... (same as GET response)
  updatedAt: string; // nowy timestamp
}
```

**Error Responses:**
- 400 Bad Request: Walidacja niepoprawna → wyświetl inline errors
- 401 Unauthorized: Token invalid → redirect do /login

---

#### 5. DELETE /api/v1/users/me (Usunięcie konta)

**Request:**
- Method: DELETE
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body (opcjonalnie, dla weryfikacji hasła):
```typescript
{
  password: string; // wymagane do potwierdzenia
}
```

**Response (200 OK):**
```typescript
DeleteAccountResponse {
  message: string; // "Account deletion initiated. You will receive confirmation via email."
  deletionScheduledAt: string; // "2025-01-08T15:00:00"
}
```

**Error Responses:**
- 400 Bad Request: Niepoprawne hasło → wyświetl błąd w modalu
  ```json
  {
    "error": "INVALID_PASSWORD",
    "message": "Incorrect password"
  }
  ```
- 401 Unauthorized: Token invalid → redirect do /login
- 500 Internal Server Error: Błąd serwera → toast error, nie zamykaj modalu

**Post-deletion flow:**
1. Po sukcesie: wywołaj logout (clear Redux state, remove token)
2. Redirect do `/` z query param `?account_deleted=true`
3. Wyświetl toast na stronie głównej: "Twoje konto zostało usunięte"

---

#### 6. POST /api/v1/auth/password-reset/request (Zmiana hasła - request)

**Request:**
- Method: POST
- Headers: `Content-Type: application/json`
- Body:
```typescript
{
  email: string; // email użytkownika
}
```

**Response (200 OK):**
```typescript
{
  message: string; // "If the email exists, a password reset link has been sent."
}
```

**Note:** Backend zawsze zwraca sukces (security - nie ujawnia czy email istnieje)

**Error Responses:**
- 429 Too Many Requests: Rate limit exceeded → wyświetl toast z retry-after

---

### Mapowanie DTO → ViewModel

```typescript
// src/lib/utils/mappers.ts

export function mapUserProfileResponseToViewModel(dto: UserProfileResponse): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    bloodGroup: dto.bloodGroup as BloodGroup | null,
    emailVerified: dto.emailVerified,
    consentInfo: {
      timestamp: new Date(dto.consentTimestamp),
      version: dto.consentVersion
    },
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
  };
}

export function mapNotificationPreferencesResponseToViewModel(
  dto: NotificationPreferencesResponse
): NotificationPreferences {
  return {
    id: dto.id,
    userId: dto.userId,
    email: {
      enabled: dto.emailEnabled,
      frequency: dto.emailFrequency as NotificationFrequency
    },
    inApp: {
      enabled: dto.inAppEnabled,
      frequency: dto.inAppFrequency as NotificationFrequency
    },
    updatedAt: new Date(dto.updatedAt)
  };
}
```

### Axios Client Configuration

```typescript
// src/lib/api/client.ts

import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - dodaj token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // 401: Token expired or invalid → redirect to login
    if (status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login?expired=true';
      toast.error('Sesja wygasła. Zaloguj się ponownie.');
    }

    // 429: Rate limit → show toast with retry-after
    if (status === 429) {
      const retryAfter = error.response?.data?.retryAfter || 60;
      toast.error(`Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter}s.`);
    }

    // 500: Server error → show generic error
    if (status >= 500) {
      toast.error('Wystąpił błąd serwera. Spróbuj ponownie później.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

## 8. Interakcje użytkownika

### 1. Edycja danych osobowych

**Scenariusz:**
1. Użytkownik wchodzi na stronę `/dashboard/profile`
2. Widzi formularz z wypełnionymi danymi (firstName, lastName, bloodGroup, email)
3. Zmienia wartość w polu "Imię" → automatycznie uruchamia się debounced save (2s)
4. Po 2 sekundach bezczynności: SaveIndicator pokazuje "Zapisywanie..."
5. Po sukcesie API: SaveIndicator pokazuje "Zapisano" z zielonym checkmarkiem
6. Po 2 sekundach: SaveIndicator wraca do stanu idle
7. Jeśli użytkownik zmieni kolejne pole przed zapisem: timer debounce resetuje się

**Scenariusz błędu:**
1. Użytkownik wprowadza niepoprawną wartość (np. firstName > 100 znaków)
2. Inline validation wyświetla błąd pod polem natychmiast
3. SaveIndicator nie uruchamia się (walidacja blokuje zapis)
4. Użytkownik poprawia błąd → walidacja znika
5. Po 2s bezczynności: zapis się uruchamia

**Scenariusz opuszczenia pola (blur):**
1. Użytkownik edytuje pole i klika poza formularz (blur event)
2. Jeśli są niezapisane zmiany: natychmiastowe wywołanie API (bez debounce)
3. SaveIndicator pokazuje "Zapisywanie..." i następnie "Zapisano"

### 2. Zmiana preferencji powiadomień

**Scenariusz:**
1. Użytkownik widzi sekcję "Preferencje powiadomień"
2. Checkbox "Powiadomienia e-mail" jest zaznaczony, select "Częstotliwość" ma wartość "Codziennie"
3. Użytkownik odznacza checkbox → select staje się disabled (szary)
4. Użytkownik klika "Zapisz preferencje"
5. Button pokazuje loading spinner podczas zapisu
6. Po sukcesie: Toast notification "Preferencje zostały zaktualizowane"
7. Button wraca do normalnego stanu

**Scenariusz błędu:**
1. Użytkownik zmienia preferencje i klika "Zapisz"
2. API zwraca błąd 400 (np. invalid frequency)
3. Toast error: "Nie udało się zapisać preferencji. Spróbuj ponownie."
4. Formularz pozostaje w edytowalnym stanie (nie rollback)
5. Użytkownik może poprawić i spróbować ponownie

### 3. Zmiana hasła

**Scenariusz:**
1. Użytkownik klika "Zmień hasło" w sekcji "Zmiana hasła"
2. Otwiera się modal potwierdzający: "Wyślemy link resetujący na Twój email: user@example.com"
3. Użytkownik klika "Wyślij link"
4. API wysyła email resetujący (POST /api/v1/auth/password-reset/request)
5. Modal pokazuje sukces: "Link został wysłany. Sprawdź swoją skrzynkę email."
6. Użytkownik zamyka modal
7. Proces resetowania hasła odbywa się w osobnym flow (email → /reset-password?token=...)

### 4. Eksport danych (GDPR)

**Scenariusz:**
1. Użytkownik klika "Pobierz moje dane" w sekcji GDPR
2. Button pokazuje loading spinner
3. API generuje eksport (może być async)
   - **Opcja A (MVP):** Synchroniczny download pliku JSON
   - **Opcja B (future):** Async job → email z linkiem do pobrania
4. Po sukcesie:
   - **Opcja A:** Plik JSON pobiera się automatycznie
   - **Opcja B:** Toast: "Eksport w trakcie. Otrzymasz email z linkiem."
5. Button wraca do normalnego stanu

### 5. Usunięcie konta

**Scenariusz:**
1. Użytkownik klika "Usuń konto" (danger button) w sekcji GDPR
2. Otwiera się ConfirmModal z tytułem "Czy na pewno chcesz usunąć konto?"
3. Modal zawiera:
   - Ostrzeżenie (czerwony alert): "Ta akcja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte."
   - Input "Hasło" (wymagane do potwierdzenia tożsamości)
   - Checkbox "Rozumiem, że ta akcja jest nieodwracalna" (required)
   - Button "Anuluj" / Button "Usuń konto" (danger, disabled dopóki checkbox unchecked)
4. Użytkownik wpisuje hasło i zaznacza checkbox
5. Button "Usuń konto" staje się aktywny
6. Użytkownik klika "Usuń konto"
7. API wywołuje DELETE /api/v1/users/me z hasłem w body
8. Po sukcesie:
   - Modal zamyka się
   - Toast: "Twoje konto zostało usunięte"
   - Logout użytkownika (clear Redux state, remove token)
   - Redirect do `/` z komunikatem

**Scenariusz błędu - niepoprawne hasło:**
1. Użytkownik wpisuje błędne hasło i klika "Usuń konto"
2. API zwraca 400 Bad Request: "Incorrect password"
3. Inline error pod inputem hasła: "Niepoprawne hasło"
4. Modal pozostaje otwarty, użytkownik może spróbować ponownie

**Scenariusz anulowania:**
1. Użytkownik klika "Anuluj" lub ESC lub backdrop
2. Modal zamyka się bez żadnych zmian
3. Żadne API nie jest wywoływane

### 6. Obsługa offline / błędów sieciowych

**Scenariusz:**
1. Użytkownik edytuje dane i jest offline
2. Debounced save próbuje zapisać → timeout error
3. SaveIndicator pokazuje "Błąd zapisu" (czerwony wykrzyknik)
4. Toast error: "Brak połączenia z internetem. Zmiany nie zostały zapisane."
5. Dane pozostają w formularzu (nie gubią się)
6. Gdy połączenie wraca: użytkownik może kliknąć "Zapisz" lub zmiany zapiszą się auto-save

## 9. Warunki i walidacja

### Warunki walidacji na poziomie komponentów

#### ProfileForm - Dane osobowe

| Pole | Warunek | Komunikat błędu | Moment walidacji |
|------|---------|-----------------|------------------|
| firstName | max 100 znaków | "Imię nie może być dłuższe niż 100 znaków" | onChange (inline) |
| firstName | tylko litery, spacje, myślniki, apostrofy | "Imię zawiera niedozwolone znaki" | onChange (inline) |
| firstName | opcjonalne (może być puste) | - | - |
| lastName | max 100 znaków | "Nazwisko nie może być dłuższe niż 100 znaków" | onChange (inline) |
| lastName | tylko litery, spacje, myślniki, apostrofy | "Nazwisko zawiera niedozwolone znaki" | onChange (inline) |
| lastName | opcjonalne (może być puste) | - | - |
| bloodGroup | jedna z 8 wartości lub null | "Wybierz poprawną grupę krwi" | onBlur |
| email | readonly | - | nie walidowany (readonly) |

**Wpływ na stan UI:**
- **Pole z błędem:** czerwona ramka, czerwony tekst błędu pod polem
- **Pole poprawne:** zielona ramka (opcjonalnie), brak komunikatu
- **SaveIndicator:** nie uruchamia się jeśli są błędy walidacji (disabled state)

**Implementacja walidacji:**
```typescript
// Zod schema
const profileSchema = z.object({
  firstName: z.string()
    .max(100, 'Imię nie może być dłuższe niż 100 znaków')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]*$/, 'Imię zawiera niedozwolone znaki')
    .optional()
    .or(z.literal('')),
  lastName: z.string()
    .max(100, 'Nazwisko nie może być dłuższe niż 100 znaków')
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]*$/, 'Nazwisko zawiera niedozwolone znaki')
    .optional()
    .or(z.literal('')),
  bloodGroup: z.enum(['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
    .nullable()
    .optional()
});

// React Hook Form integration
const { register, formState: { errors }, watch, trigger } = useForm<ProfileFormData>({
  resolver: zodResolver(profileSchema),
  mode: 'onChange' // inline validation
});
```

---

#### NotificationPreferencesForm - Preferencje powiadomień

| Pole | Warunek | Komunikat błędu | Moment walidacji |
|------|---------|-----------------|------------------|
| emailEnabled | boolean (required) | "To pole jest wymagane" | onSubmit |
| emailFrequency | jedna z 4 wartości (required) | "Wybierz częstotliwość powiadomień" | onSubmit |
| inAppEnabled | boolean (required) | "To pole jest wymagane" | onSubmit |
| inAppFrequency | jedna z 4 wartości (required) | "Wybierz częstotliwość powiadomień" | onSubmit |

**Walidacja logiczna:**
- Jeśli `emailEnabled = false`, to `emailFrequency` może być dowolne, ale zalecane jest ustawienie na "DISABLED"
- Jeśli `inAppEnabled = false`, to `inAppFrequency` może być dowolne, ale zalecane jest ustawienie na "DISABLED"

**Wpływ na stan UI:**
- **Checkbox unchecked:** odpowiedni select staje się disabled (szary, nie edytowalny)
- **Checkbox checked:** select staje się enabled
- **Button "Zapisz":** disabled gdy formularz jest invalid (walidacja Zod)
- **Button podczas zapisu:** disabled + loading spinner

**Implementacja walidacji:**
```typescript
const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  emailFrequency: z.enum(['DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE']),
  inAppEnabled: z.boolean(),
  inAppFrequency: z.enum(['DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE'])
});

// Conditional disable logic
const emailEnabled = watch('emailEnabled');
<Select
  disabled={!emailEnabled}
  {...register('emailFrequency')}
/>
```

---

#### ConfirmModal (usunięcie konta) - Walidacja

| Pole | Warunek | Komunikat błędu | Moment walidacji |
|------|---------|-----------------|------------------|
| password | required, min 1 znak | "Hasło jest wymagane" | onSubmit |
| confirmation | checkbox must be checked | "Musisz potwierdzić usunięcie konta" | onChange |

**Wpływ na stan UI:**
- **Button "Usuń konto":** disabled dopóki checkbox nie jest zaznaczony
- **Pole hasła z błędem:** czerwona ramka + komunikat błędu
- **API zwraca błąd (niepoprawne hasło):** inline error pod polem hasła: "Niepoprawne hasło"

**Implementacja walidacji:**
```typescript
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Hasło jest wymagane'),
  confirmation: z.boolean().refine(val => val === true, {
    message: 'Musisz potwierdzić usunięcie konta'
  })
});

// Conditional button enable
const confirmation = watch('confirmation');
<Button
  disabled={!confirmation || isSubmitting}
  variant="danger"
  type="submit"
>
  Usuń konto
</Button>
```

### Warunki wymagane przez API

#### PATCH /api/v1/users/me

**Warunki backendu (z UpdateProfileRequest DTO):**
- `firstName`: Optional, max 100 chars
- `lastName`: Optional, max 100 chars
- `bloodGroup`: Optional, must match pattern `^(0\+|0-|A\+|A-|B\+|B-|AB\+|AB-)?$`

**Weryfikacja na poziomie frontendu:**
- Walidacja Zod przed wysłaniem żądania
- Jeśli walidacja nie przejdzie: nie wysyłaj API request, wyświetl inline errors

---

#### PUT /api/v1/users/me/notification-preferences

**Warunki backendu:**
- `emailEnabled`: Required, boolean
- `emailFrequency`: Required, must be one of: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"
- `inAppEnabled`: Required, boolean
- `inAppFrequency`: Required, must be one of: "DISABLED", "ONLY_CRITICAL", "DAILY", "IMMEDIATE"

**Weryfikacja na poziomie frontendu:**
- Wszystkie pola required → button disabled jeśli invalid
- Enum validation dla frequency fields
- Submit handler sprawdza validity przed wysłaniem

---

#### DELETE /api/v1/users/me

**Warunki backendu:**
- `password`: Required w request body (dla weryfikacji tożsamości)

**Weryfikacja na poziomie frontendu:**
- Password required w modal
- Confirmation checkbox must be checked
- API zwraca 400 jeśli hasło niepoprawne → wyświetl error w modal (nie zamykaj)

## 10. Obsługa błędów

### Typy błędów i strategie obsługi

#### 1. Błędy walidacji (400 Bad Request)

**Źródło:** Backend zwraca błędy walidacji w odpowiedzi API

**Format błędu:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [
    {
      "field": "firstName",
      "message": "First name must not exceed 100 characters"
    }
  ]
}
```

**Strategia obsługi:**
- Parse `details` array z odpowiedzi
- Mapuj błędy do odpowiednich pól formularza
- Wyświetl inline errors pod polami (czerwony tekst)
- Nie wyświetlaj toast notification (inline errors wystarczą)
- Logika:
  ```typescript
  if (error.response?.status === 400) {
    const details = error.response.data.details;
    details.forEach(({ field, message }) => {
      setError(field, { type: 'server', message });
    });
  }
  ```

---

#### 2. Błędy autoryzacji (401 Unauthorized)

**Źródło:** Token JWT wygasł lub jest nieprawidłowy

**Strategia obsługi:**
- Axios interceptor automatycznie przechwytuje 401
- Usuń token z localStorage
- Redirect do `/login?expired=true`
- Wyświetl toast: "Sesja wygasła. Zaloguj się ponownie."
- Użytkownik musi się zalogować ponownie

---

#### 3. Błędy uprawnień (403 Forbidden)

**Źródło:** Użytkownik nie ma uprawnień do operacji (unlikely w widoku profilu - własne dane)

**Strategia obsługi:**
- Wyświetl toast error: "Nie masz uprawnień do wykonania tej operacji"
- Nie wykonuj żadnych zmian w UI
- Loguj błąd do konsoli dla debugowania

---

#### 4. Błędy sieciowe (Network Error, Timeout)

**Źródło:** Brak połączenia z internetem lub timeout API (10s)

**Strategia obsługi:**
- SaveIndicator pokazuje "Błąd zapisu" (czerwony wykrzyknik)
- Toast error: "Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie."
- Dane w formularzu pozostają nienaruszone (nie gubią się)
- Użytkownik może spróbować ponownie (retry):
  - Auto-retry po nawiązaniu połączenia (opcjonalnie z useOnlineStatus hook)
  - Lub manualny retry przez edycję pola

**Implementacja:**
```typescript
try {
  await updateProfile(data);
} catch (error) {
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    toast.error('Brak połączenia z internetem. Sprawdź swoje połączenie.');
    setSaveStatus('error');
  }
}
```

---

#### 5. Błędy serwera (500 Internal Server Error)

**Źródło:** Błąd po stronie backendu

**Strategia obsługi:**
- Axios interceptor przechwytuje 500+
- Toast error: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Rollback zmian w formularzu (przywróć poprzedni stan z Redux)
- Loguj błąd do zewnętrznego systemu monitorowania (np. Sentry)
- Nie wyświetlaj szczegółów błędu użytkownikowi (security)

---

#### 6. Rate limit (429 Too Many Requests)

**Źródło:** Zbyt wiele żądań do API w krótkim czasie

**Format błędu:**
```json
{
  "error": "TOO_MANY_ATTEMPTS",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

**Strategia obsługi:**
- Axios interceptor przechwytuje 429
- Toast error: "Zbyt wiele żądań. Spróbuj ponownie za {retryAfter}s."
- Disable wszystkie przyciski na {retryAfter} sekund
- Countdown timer w toast (opcjonalnie)
- Po upływie czasu: enable przyciski, użytkownik może spróbować ponownie

---

#### 7. Błąd usunięcia konta - niepoprawne hasło

**Źródło:** API DELETE /api/v1/users/me zwraca 400 z komunikatem "Incorrect password"

**Strategia obsługi:**
- Modal pozostaje otwarty (nie zamykaj)
- Inline error pod polem hasła: "Niepoprawne hasło"
- Pole hasła wyczyść (reset value)
- Focus na pole hasła
- Użytkownik może spróbować ponownie wpisać hasło

**Implementacja:**
```typescript
try {
  await deleteAccount(password);
  // success: close modal, logout, redirect
} catch (error) {
  if (error.response?.data?.error === 'INVALID_PASSWORD') {
    setError('password', {
      type: 'server',
      message: 'Niepoprawne hasło'
    });
    resetField('password');
  } else {
    toast.error('Nie udało się usunąć konta. Spróbuj ponownie.');
  }
}
```

---

#### 8. Błędy optimistic updates (rollback)

**Scenariusz:**
- Użytkownik edytuje dane → UI aktualizuje się natychmiast (optimistic update)
- API request fails
- Trzeba przywrócić poprzedni stan (rollback)

**Strategia obsługi:**
```typescript
const previousData = useRef<UserProfile | null>(null);

const handleSave = async (newData: UpdateProfileRequest) => {
  // Store previous data
  previousData.current = profile;

  // Optimistic update
  dispatch(updateProfileField(newData));

  try {
    await updateProfile(newData);
    // Success: keep optimistic update
  } catch (error) {
    // Rollback to previous data
    if (previousData.current) {
      dispatch(setProfile(previousData.current));
    }
    toast.error('Nie udało się zapisać zmian. Spróbuj ponownie.');
    setSaveStatus('error');
  }
};
```

---

### Przypadki brzegowe (Edge Cases)

#### 1. Użytkownik opuszcza stronę podczas zapisywania

**Problem:** Debounced save jest w trakcie, użytkownik klika link do innej strony

**Rozwiązanie:**
- `beforeunload` event listener:
  ```typescript
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = 'Zmiany są zapisywane. Czy na pewno chcesz opuścić stronę?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);
  ```

#### 2. Użytkownik zmienia wartość przed zakończeniem poprzedniego zapisu

**Problem:** Auto-save działa na poprzednią wartość, użytkownik już zmienił pole

**Rozwiązanie:**
- Cancel poprzedni request (Axios cancelToken)
- Użyj najnowszej wartości z formularza
- debounce automatycznie resetuje timer

#### 3. Email jest readonly ale użytkownik próbuje kopiować

**Rozwiązanie:**
- Input z `readOnly` (nie `disabled`) → umożliwia zaznaczanie i kopiowanie
- Visual indicator: szare tło, kursor `not-allowed`
- Tooltip: "Email nie może być zmieniony"

## 11. Kroki implementacji

### Faza 1: Setup i struktura (1-2 dni)

1. **Utworzenie struktury plików**
   ```
   src/
   ├── pages/
   │   └── dashboard/
   │       └── profile.astro
   ├── components/
   │   ├── profile/
   │   │   ├── ProfileView.tsx
   │   │   ├── ProfileForm.tsx
   │   │   ├── NotificationPreferencesForm.tsx
   │   │   ├── PasswordChangeSection.tsx
   │   │   ├── GDPRTools.tsx
   │   │   └── SaveIndicator.tsx
   │   ├── ui/
   │   │   ├── ConfirmModal.tsx (jeśli nie istnieje)
   │   │   └── ... (inne primitive components)
   ├── lib/
   │   ├── store/
   │   │   └── slices/
   │   │       └── userSlice.ts
   │   ├── hooks/
   │   │   ├── useProfile.ts
   │   │   ├── useNotificationPreferences.ts
   │   │   └── useDebouncedSave.ts
   │   ├── types/
   │   │   ├── profile.ts
   │   │   └── notifications.ts
   │   └── utils/
   │       ├── mappers.ts
   │       └── validation.ts (Zod schemas)
   ```

2. **Konfiguracja Redux slice**
   - Utworzyć `userSlice.ts` z akcjami i async thunks
   - Dodać selectors dla profile i notification preferences
   - Zintegrować slice z głównym store

3. **Utworzenie typów DTO i ViewModel**
   - Zdefiniować wszystkie typy w `lib/types/`
   - Utworzyć Zod schemas dla walidacji w `lib/utils/validation.ts`
   - Utworzyć funkcje mapujące w `lib/utils/mappers.ts`

### Faza 2: Komponent ProfileForm (2-3 dni)

4. **Implementacja ProfileForm z podstawową strukturą**
   - Layout z Card wrapper
   - FormField dla każdego pola (firstName, lastName, bloodGroup, email)
   - Integracja React Hook Form z Zod resolver
   - Inline validation (mode: 'onChange')

5. **Implementacja auto-save z debounce**
   - Utworzenie custom hook `useDebouncedSave`
   - Integracja z ProfileForm (watch formState, trigger save on change)
   - Obsługa blur event (immediate save)
   - Optimistic updates

6. **Dodanie SaveIndicator**
   - Komponent wyświetlający status: idle, saving, saved, error
   - Ikony: spinner, checkmark, exclamation
   - Auto-reset do idle po 2s

7. **Obsługa błędów w ProfileForm**
   - Inline errors z API (400 Bad Request)
   - Rollback przy błędzie
   - Toast notifications dla błędów sieciowych

### Faza 3: Komponent NotificationPreferencesForm (1-2 dni)

8. **Implementacja NotificationPreferencesForm**
   - Layout z Card wrapper
   - Sections: Email notifications, In-app notifications
   - Checkbox + Select dla każdej sekcji
   - Conditional disable logic (checkbox kontroluje select)

9. **Implementacja zapisu preferencji**
   - Submit handler z walidacją Zod
   - Loading state na button
   - Toast notifications (success/error)

10. **Dodanie tooltipów z wyjaśnieniem opcji**
    - Tooltip dla każdej opcji frequency
    - Wyjaśnienie: DISABLED, ONLY_CRITICAL, DAILY, IMMEDIATE

### Faza 4: PasswordChangeSection i GDPRTools (2-3 dni)

11. **Implementacja PasswordChangeSection**
    - Card z info box
    - Button "Zmień hasło"
    - Modal potwierdzający wysłanie emaila
    - Integracja z API POST /api/v1/auth/password-reset/request

12. **Implementacja GDPRTools - Eksport danych**
    - Button "Pobierz moje dane"
    - API call z loading state
    - Download pliku JSON (synchroniczny w MVP)

13. **Implementacja GDPRTools - Usunięcie konta**
    - Button "Usuń konto" (danger)
    - ConfirmModal z:
      - Ostrzeżeniem (alert danger)
      - Input password (required)
      - Checkbox potwierdzenia (required)
      - Buttons: Anuluj / Usuń konto
    - Walidacja hasła inline
    - Post-deletion flow: logout + redirect

14. **Komponent ConfirmModal (reusable)**
    - Generic modal z props: title, message, variant
    - Focus trap dla accessibility
    - ESC key + backdrop click → close
    - Conditional rendering: password input, checkbox

### Faza 5: Integracja i Redux (1 dzień)

15. **Implementacja custom hooks**
    - `useProfile`: fetch i update profilu
    - `useNotificationPreferences`: fetch i update preferencji
    - Integracja z Redux selectors i actions

16. **Utworzenie głównego ProfileView**
    - Container komponent łączący wszystkie sekcje
    - Layout z grid (responsywność)
    - Toast container

17. **Utworzenie Astro page: profile.astro**
    - DashboardLayout
    - SSR z auth middleware
    - Hydratacja React islands:
      - ProfileView (client:load)
      - ProfileForm (client:load)
      - NotificationPreferencesForm (client:idle)
      - GDPRTools (client:visible)

### Faza 6: Styling i responsywność (1-2 dni)

18. **Stylowanie z Tailwind CSS**
    - Responsive layout (mobile-first)
    - Cards z shadows i borders
    - Form fields z focus states
    - Buttons z variants (primary, secondary, danger)
    - Colors: success (green), error (red), warning (yellow)

19. **Mobile responsywność**
    - Stack layout na mobile (1 kolumna)
    - Grid na desktop (2 kolumny dla niektórych sekcji)
    - Responsive font sizes
    - Touch-friendly button sizes (min 44px)

### Faza 7: Accessibility (WCAG 2.1 AA) (1 dzień)

20. **Implementacja accessibility features**
    - Semantic HTML (form, fieldset, legend)
    - Label dla każdego inputa (explicit association)
    - aria-label dla buttons i icons
    - aria-live dla SaveIndicator i toasts
    - aria-invalid dla pól z błędami
    - Focus states widoczne (outline)
    - Keyboard navigation (Tab, Enter, ESC)
    - Focus trap w modalu
    - Screen reader testing

21. **Kontrast kolorów**
    - Sprawdzić wszystkie kolory (min 4.5:1 dla tekstu)
    - Error messages z wystarczającym kontrastem
    - Disabled states z wyraźną wizualną różnicą

### Faza 8: Testing (2-3 dni)

22. **Unit tests (Vitest + React Testing Library)**
    - ProfileForm: render, validation, auto-save
    - NotificationPreferencesForm: render, submit, conditional disable
    - SaveIndicator: status changes
    - Custom hooks: useProfile, useDebouncedSave
    - Mappers: DTO → ViewModel
    - Zod schemas: validation logic

23. **Integration tests (RTL + MSW)**
    - ProfileForm: API success/error scenarios
    - NotificationPreferencesForm: API success/error
    - GDPRTools: delete account flow
    - Optimistic updates + rollback

24. **E2E tests (Playwright)**
    - Scenariusz 1: Edycja profilu end-to-end (login → edit → auto-save → logout)
    - Scenariusz 2: Zmiana preferencji powiadomień
    - Scenariusz 3: Zmiana hasła (trigger reset flow)
    - Scenariusz 4: Usunięcie konta (full flow z modal)

### Faza 9: Obsługa błędów i edge cases (1 dzień)

25. **Implementacja wszystkich error handlers**
    - 400: inline errors
    - 401: redirect do login
    - 429: rate limit toast + countdown
    - 500: rollback + toast
    - Network error: toast + retry
    - Password incorrect: modal inline error

26. **Edge cases**
    - beforeunload warning podczas saving
    - Cancel previous request podczas nowej zmiany
    - Readonly email z copy support
    - Empty state handling

### Faza 10: Performance optimization (1 dzień)

27. **Lazy loading**
    - GDPRTools z client:visible (only render in viewport)
    - NotificationPreferencesForm z client:idle

28. **Bundle size optimization**
    - Code splitting per component
    - Tree-shaking unused imports
    - Analyze bundle z Vite

29. **Memoization**
    - React.memo dla ProfileForm (prevent re-renders)
    - useMemo dla computed values
    - useCallback dla event handlers

### Faza 11: Dokumentacja i code review (1 dzień)

30. **Dokumentacja kodu**
    - JSDoc comments dla komponentów
    - Props interfaces z komentarzami
    - README dla folderu `components/profile/`

31. **Code review**
    - Sprawdzić TypeScript errors (strict mode)
    - ESLint passed
    - Prettier formatting
    - Accessibility audit (axe DevTools)
    - Lighthouse audit (Performance, Accessibility)

### Faza 12: Deployment i monitoring (0.5 dnia)

32. **Staging deployment**
    - Deploy do środowiska staging
    - Smoke tests
    - Manual testing przez zespół

33. **Production deployment**
    - Deploy do produkcji
    - Monitor błędów w Sentry/Cloud Logging
    - Sprawdzić metryki performance

---

## Podsumowanie timeline

**Szacowany czas implementacji:** 14-20 dni roboczych (1 developer full-time)

| Faza | Czas | Główne deliverables |
|------|------|---------------------|
| 1. Setup i struktura | 1-2 dni | Struktura plików, typy, Redux slice |
| 2. ProfileForm | 2-3 dni | Formularz profilu z auto-save |
| 3. NotificationPreferencesForm | 1-2 dni | Formularz preferencji |
| 4. PasswordChangeSection i GDPRTools | 2-3 dni | Sekcje zmiany hasła i GDPR |
| 5. Integracja i Redux | 1 dzień | Custom hooks, ProfileView, page Astro |
| 6. Styling i responsywność | 1-2 dni | Tailwind CSS, responsive layout |
| 7. Accessibility | 1 dzień | WCAG 2.1 AA compliance |
| 8. Testing | 2-3 dni | Unit, integration, E2E tests |
| 9. Obsługa błędów | 1 dzień | Error handlers, edge cases |
| 10. Performance optimization | 1 dzień | Lazy loading, bundle optimization |
| 11. Dokumentacja i code review | 1 dzień | Docs, review, audits |
| 12. Deployment | 0.5 dnia | Staging i production |

**Łączny czas:** 14-20 dni

---

## Definition of Done

Widok Profil jest "Done" gdy:

1. ✅ Wszystkie komponenty zaimplementowane zgodnie ze specyfikacją
2. ✅ Integracja z API działa poprawnie (GET, PATCH, PUT, DELETE)
3. ✅ Auto-save z debounce działa bez błędów
4. ✅ Wszystkie formy walidacji działają (inline i submit)
5. ✅ Optimistic updates + rollback przy błędach
6. ✅ ConfirmModal dla usunięcia konta z password verification
7. ✅ GDPR tools (eksport i delete) działają poprawnie
8. ✅ Responsywność: mobile (375px+), tablet (768px+), desktop (1024px+)
9. ✅ Accessibility: WCAG 2.1 AA (axe DevTools 0 critical issues)
10. ✅ Keyboard navigation działa (Tab, Enter, ESC)
11. ✅ Screen reader support (aria-labels, aria-live)
12. ✅ Toast notifications dla wszystkich akcji (success/error)
13. ✅ Unit tests coverage ≥80%
14. ✅ Integration tests dla kluczowych flows
15. ✅ E2E tests dla 4 głównych scenariuszy
16. ✅ TypeScript bez błędów (strict mode)
17. ✅ ESLint i Prettier passed
18. ✅ Lighthouse: Performance >90, Accessibility >95
19. ✅ Code review passed
20. ✅ Deployed do staging i production bez błędów

---

**Koniec planu implementacji**
