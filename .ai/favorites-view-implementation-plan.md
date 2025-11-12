# Plan implementacji widoku Ulubione

## 1. Przegląd

Widok Ulubione umożliwia użytkownikom zarządzanie listą swoich ulubionych centrów krwiodawstwa RCKiK. Użytkownicy mogą przeglądać swoje ulubione centra z aktualnymi poziomami krwi, zmieniać ich kolejność (priorytet), oraz usuwać je z listy. Widok ten jest kluczowy dla personalizacji doświadczenia użytkownika i umożliwia otrzymywanie ukierunkowanych powiadomień o krytycznych stanach krwi w wybranych centrach.

**Główne cele:**
- Wyświetlenie listy ulubionych RCKiK użytkownika z aktualnymi poziomami krwi
- Umożliwienie zmiany kolejności (reordering) za pomocą drag-and-drop
- Usuwanie centrów z listy ulubionych z potwierdzeniem
- Pokazanie pustego stanu (empty state) gdy użytkownik nie ma jeszcze ulubionych
- Obsługa optimistic updates z rollback w przypadku błędów
- Responsywny design (mobile-first)
- Dostępność dla użytkowników korzystających z klawiatury

## 2. Routing widoku

**Ścieżka:** `/dashboard/favorites`

**Typ renderowania:** SSR (Server-Side Rendering) z autentykacją

**Middleware:**
- Wymaga autentykacji (JWT token)
- Sprawdzenie roli USER
- Przekierowanie do `/login` jeśli użytkownik nie jest zalogowany

## 3. Struktura komponentów

```
FavoritesPage (Astro - src/pages/dashboard/favorites.astro)
│
└─── DashboardLayout (Astro Layout)
     │
     └─── FavoritesView (React Island - client:load)
          │
          ├─── FavoritesHeader
          │    ├─── Title
          │    └─── AddFavoriteButton (link do /rckik)
          │
          ├─── FavoritesList (dnd-kit sortable)
          │    └─── FavoriteCard (x N)
          │         ├─── DragHandle
          │         ├─── RckikInfo
          │         │    ├─── RckikName
          │         │    ├─── RckikAddress
          │         │    └─── RckikCode
          │         ├─── BloodLevelBadges
          │         │    └─── BloodLevelBadge (x 8 grup krwi)
          │         ├─── ActionButtons
          │         │    ├─── ViewDetailsButton
          │         │    └─── RemoveButton
          │         └─── PriorityIndicator
          │
          ├─── EmptyState
          │    ├─── EmptyIcon
          │    ├─── EmptyMessage
          │    └─── AddFirstFavoriteCTA
          │
          ├─── SaveOrderButton (auto-save on drop)
          └─── Toast (success/error notifications)
```

## 4. Szczegóły komponentów

### FavoritesView (główny kontener)

**Opis komponentu:**
Główny komponent React zarządzający całym widokiem ulubionych. Obsługuje pobieranie danych, zarządzanie stanem, drag-and-drop, oraz komunikację z API.

**Główne elementy:**
- Container `<div>` z maksymalną szerokością i paddingiem
- Warunkowe renderowanie: FavoritesList lub EmptyState
- Toast container dla powiadomień
- Loading skeleton podczas ładowania danych

**Obsługiwane interakcje:**
- Inicjalne pobranie listy ulubionych z API
- Drag-and-drop reordering ulubionych
- Usuwanie ulubionych z potwierdzeniem
- Automatyczne zapisywanie kolejności po upuszczeniu
- Obsługa błędów z rollback

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik jest zalogowany (middleware)
- Walidacja odpowiedzi API
- Obsługa błędów sieciowych

**Typy:**
- `FavoriteRckikDto` (z backendu)
- `FavoritesViewState` (lokalny stan)
- `DragEndEvent` (z @dnd-kit/core)

**Propsy:**
- `initialFavorites?: FavoriteRckikDto[]` - opcjonalne początkowe dane z SSR

### FavoritesHeader

**Opis komponentu:**
Nagłówek sekcji z tytułem i przyciskiem do dodawania nowych ulubionych.

**Główne elementy:**
- `<h1>` z tytułem "Ulubione centra"
- Licznik ulubionych (np. "5 centrów")
- Przycisk/link "Dodaj centrum" prowadzący do `/rckik`

**Obsługiwane interakcje:**
- Kliknięcie na "Dodaj centrum" → nawigacja do `/rckik`

**Obsługiwana walidacja:**
- Limit maksymalny ulubionych (opcjonalnie 10) - dezaktywacja przycisku jeśli osiągnięto

**Typy:**
- `FavoritesHeaderProps { favoritesCount: number, maxLimit?: number }`

**Propsy:**
- `favoritesCount: number` - liczba ulubionych
- `maxLimit?: number` - opcjonalny limit maksymalny

### FavoritesList (sortable container)

**Opis komponentu:**
Sortowalna lista ulubionych centrów z obsługą drag-and-drop. Używa biblioteki @dnd-kit/sortable dla dostępności i responsywności.

**Główne elementy:**
- `<DndContext>` z sensors (pointer, keyboard, touch)
- `<SortableContext>` z strategią vertical list
- Lista `FavoriteCard` komponentów
- `<DragOverlay>` dla efektu przeciągania

**Obsługiwane interakcje:**
- Drag-and-drop przeciąganie kart
- Keyboard navigation (Space/Enter do rozpoczęcia, Arrow keys do przesunięcia)
- Touch support na mobile
- Auto-scroll podczas przeciągania

**Obsługiwana walidacja:**
- Walidacja poprawności nowej kolejności przed wysłaniem do API

**Typy:**
- `FavoritesListProps { favorites: FavoriteRckikDto[], onReorder: (newOrder: FavoriteRckikDto[]) => void, onRemove: (id: number) => void }`

**Propsy:**
- `favorites: FavoriteRckikDto[]` - lista ulubionych
- `onReorder: (newOrder: FavoriteRckikDto[]) => void` - callback przy zmianie kolejności
- `onRemove: (id: number) => void` - callback przy usunięciu

### FavoriteCard

**Opis komponentu:**
Karta pojedynczego ulubionego centrum z informacjami o centrum, poziomami krwi i akcjami.

**Główne elementy:**
- Kontener karty z border, padding, shadow
- DragHandle (ikona uchwytu) - widoczny tylko na hover/focus
- Sekcja informacji o RCKiK (nazwa, miasto, adres, kod)
- Grid badge'y poziomów krwi (8 grup)
- Przyciski akcji (Zobacz szczegóły, Usuń)
- Wskaźnik priorytetu (opcjonalny numer)

**Obsługiwane interakcje:**
- Hover efekt - podniesienie karty (box-shadow)
- Kliknięcie na kartę (poza przyciskami) - nawigacja do `/rckik/[id]`
- Kliknięcie na "Zobacz szczegóły" - nawigacja do `/rckik/[id]`
- Kliknięcie na "Usuń" - pokazanie modal potwierdzenia
- Focus states dla dostępności klawiatury

**Obsługiwana walidacja:**
- Sprawdzenie czy `currentBloodLevels` istnieje przed renderowaniem
- Fallback dla brakujących danych

**Typy:**
- `FavoriteCardProps { favorite: FavoriteRckikDto, onRemove: (id: number) => void, isDragging?: boolean }`

**Propsy:**
- `favorite: FavoriteRckikDto` - dane ulubionego centrum
- `onRemove: (id: number) => void` - callback usunięcia
- `isDragging?: boolean` - czy karta jest obecnie przeciągana

### BloodLevelBadge

**Opis komponentu:**
Badge pokazujący poziom krwi dla pojedynczej grupy krwi z kolorowym oznaczeniem statusu i ikoną.

**Główne elementy:**
- Kontener badge z border-radius
- Ikona statusu (✓ OK, ⚠ IMPORTANT, ✕ CRITICAL)
- Etykieta grupy krwi (np. "A+")
- Wartość procentowa (np. "45%")
- Kolor tła zależny od statusu

**Obsługiwane interakcje:**
- Tooltip z dodatkową informacją przy hover
- Brak interakcji klikowych (informacyjny)

**Obsługiwana walidacja:**
- Walidacja `levelStatus` - musi być jednym z: CRITICAL, IMPORTANT, OK
- Fallback dla undefined/null wartości

**Typy:**
- `BloodLevelBadgeProps { bloodLevel: BloodLevelDto, compact?: boolean }`

**Propsy:**
- `bloodLevel: BloodLevelDto` - dane poziomu krwi
- `compact?: boolean` - tryb kompaktowy (bez procentu, tylko ikona + grupa)

### RemoveButton & ConfirmModal

**Opis komponentu:**
Przycisk usunięcia z modalem potwierdzenia dla bezpiecznego usuwania ulubionych.

**Główne elementy:**
- Button z ikoną kosza i tekstem "Usuń"
- Modal z pytaniem "Czy na pewno chcesz usunąć to centrum z ulubionych?"
- Informacja o centrum (nazwa, miasto)
- Przyciski: "Anuluj" i "Usuń" (czerwony, danger)

**Obsługiwane interakcje:**
- Kliknięcie przycisku "Usuń" → otwarcie modalu
- Kliknięcie "Anuluj" → zamknięcie modalu
- Kliknięcie "Usuń" w modalu → wywołanie API DELETE
- ESC key → zamknięcie modalu
- Click outside → zamknięcie modalu

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik potwierdził akcję
- Wymaganie kliknięcia przycisku (nie samo zamknięcie modalu)

**Typy:**
- `RemoveButtonProps { favoriteId: number, rckikName: string, onConfirm: () => void }`
- `ConfirmModalProps { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }`

**Propsy:**
- `favoriteId: number` - ID ulubionego do usunięcia
- `rckikName: string` - nazwa centrum (do wyświetlenia w modalu)
- `onConfirm: () => void` - callback po potwierdzeniu

### EmptyState

**Opis komponentu:**
Stan pusty wyświetlany gdy użytkownik nie ma jeszcze żadnych ulubionych centrów.

**Główne elementy:**
- Ikona/ilustracja (serce puste lub ikona RCKiK)
- Nagłówek "Nie masz jeszcze ulubionych centrów"
- Opis "Dodaj centra krwiodawstwa do ulubionych, aby łatwo śledzić stany krwi i otrzymywać powiadomienia"
- Przycisk CTA "Przeglądaj centra" → link do `/rckik`
- Opcjonalnie: lista korzyści z dodania ulubionych

**Obsługiwane interakcje:**
- Kliknięcie na CTA → nawigacja do `/rckik`

**Obsługiwana walidacja:**
- Brak (komponent informacyjny)

**Typy:**
- `EmptyStateProps { onAddClick?: () => void }`

**Propsy:**
- `onAddClick?: () => void` - opcjonalny callback zamiast standardowej nawigacji

### SaveOrderButton (opcjonalny)

**Opis komponentu:**
Przycisk zapisywania kolejności - w MVP prawdopodobnie nie będzie widoczny (auto-save on drop), ale może być użyteczny jako fallback lub visual feedback.

**Główne elementy:**
- Button "Zapisz kolejność"
- Loading spinner podczas zapisywania
- Checkmark po sukcesie

**Obsługiwane interakcje:**
- Kliknięcie → manualne zapisanie kolejności
- Disabled podczas zapisywania

**Obsługiwana walidacja:**
- Sprawdzenie czy kolejność się zmieniła od ostatniego zapisu

**Typy:**
- `SaveOrderButtonProps { onSave: () => Promise<void>, hasChanges: boolean }`

**Propsy:**
- `onSave: () => Promise<void>` - async callback zapisania
- `hasChanges: boolean` - czy są niezapisane zmiany

## 5. Typy

### DTO z backendu (istniejące)

```typescript
// Główny DTO ulubionego centrum (z backend/dto/FavoriteRckikDto.java)
interface FavoriteRckikDto {
  id: number;                          // ID wpisu w tabeli user_favorite_rckik
  rckikId: number;                     // ID centrum RCKiK
  name: string;                        // Nazwa centrum
  code: string;                        // Kod centrum (np. "RCKIK-WAW")
  city: string;                        // Miasto
  address: string;                     // Pełny adres
  latitude: number;                    // Szerokość geograficzna
  longitude: number;                   // Długość geograficzna
  active: boolean;                     // Czy centrum jest aktywne
  priority: number | null;             // Priorytet/kolejność (1, 2, 3...)
  addedAt: string;                     // ISO 8601 timestamp dodania
  currentBloodLevels: BloodLevelDto[]; // Aktualne poziomy krwi
}

// DTO poziomu krwi (z backend/dto/BloodLevelDto.java)
interface BloodLevelDto {
  bloodGroup: BloodGroup;              // Grupa krwi
  levelPercentage: number;             // Procent (0-100)
  levelStatus: BloodLevelStatus;       // Status: CRITICAL, IMPORTANT, OK
  lastUpdate: string;                  // ISO 8601 timestamp ostatniej aktualizacji
}

// Enums
type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
type BloodLevelStatus = 'CRITICAL' | 'IMPORTANT' | 'OK';
```

### Typy odpowiedzi API

```typescript
// GET /api/v1/users/me/favorites - odpowiedź
interface GetFavoritesResponse {
  favorites: FavoriteRckikDto[];
}

// POST /api/v1/users/me/favorites - request
interface AddFavoriteRequest {
  rckikId: number;
  priority?: number | null;
}

// POST /api/v1/users/me/favorites - response
interface AddFavoriteResponse extends FavoriteRckikDto {}

// PATCH /api/v1/users/me/favorites - request (bulk update priorities)
interface UpdateFavoritesOrderRequest {
  favorites: Array<{
    id: number;      // ID wpisu ulubionego
    priority: number; // Nowy priorytet
  }>;
}

// DELETE /api/v1/users/me/favorites/{rckikId} - response 204 No Content
```

### Typy lokalne (ViewModel)

```typescript
// Stan widoku ulubionych
interface FavoritesViewState {
  favorites: FavoriteRckikDto[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

// Stan pojedynczego ulubionego w drag-and-drop
interface DraggableFavorite extends FavoriteRckikDto {
  isDragging: boolean;
  sortableId: string; // dla dnd-kit
}

// Opcje sortowania (przyszła funkcjonalność)
interface SortOptions {
  sortBy: 'priority' | 'name' | 'city' | 'addedAt';
  sortOrder: 'asc' | 'desc';
}

// Event z drag-and-drop
interface ReorderEvent {
  oldIndex: number;
  newIndex: number;
  favoriteId: number;
}

// Status operacji usuwania
interface RemoveOperation {
  favoriteId: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}
```

### Typy dla komponentów

```typescript
// Props dla głównego widoku
interface FavoritesViewProps {
  initialFavorites?: FavoriteRckikDto[];
}

// Props dla listy
interface FavoritesListProps {
  favorites: FavoriteRckikDto[];
  onReorder: (newOrder: FavoriteRckikDto[]) => Promise<void>;
  onRemove: (favoriteId: number) => Promise<void>;
  isLoading?: boolean;
}

// Props dla karty
interface FavoriteCardProps {
  favorite: FavoriteRckikDto;
  onRemove: (favoriteId: number) => void;
  isDragging?: boolean;
  index: number;
}

// Props dla badge'a poziomu krwi
interface BloodLevelBadgeProps {
  bloodLevel: BloodLevelDto;
  compact?: boolean;
  showTooltip?: boolean;
}

// Props dla empty state
interface EmptyStateProps {
  onAddClick?: () => void;
}

// Props dla modal potwierdzenia
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}
```

## 6. Zarządzanie stanem

### Redux Toolkit Slice: `favoritesSlice`

Widok Ulubione używa dedykowanego Redux slice do zarządzania stanem ulubionych centrów.

**Struktura stanu:**

```typescript
interface FavoritesState {
  favorites: FavoriteRckikDto[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastFetched: string | null; // timestamp ostatniego pobrania
}
```

**Async Thunks:**

1. **fetchFavorites** - pobieranie listy ulubionych
   - Endpoint: `GET /api/v1/users/me/favorites`
   - Zwraca: `GetFavoritesResponse`
   - Cache: 5 minut (sprawdzenie `lastFetched`)

2. **addFavorite** - dodanie centrum do ulubionych (z innych widoków)
   - Endpoint: `POST /api/v1/users/me/favorites`
   - Body: `AddFavoriteRequest`
   - Optimistic update: dodanie do stanu przed potwierdzeniem

3. **updateFavoritesOrder** - aktualizacja kolejności
   - Endpoint: `PATCH /api/v1/users/me/favorites`
   - Body: `UpdateFavoritesOrderRequest`
   - Optimistic update: zmiana kolejności w stanie przed potwierdzeniem

4. **removeFavorite** - usunięcie z ulubionych
   - Endpoint: `DELETE /api/v1/users/me/favorites/{rckikId}`
   - Optimistic update: usunięcie ze stanu przed potwierdzeniem

**Reducers:**

- `setFavorites` - ustawienie listy ulubionych
- `reorderFavorites` - lokalna zmiana kolejności (przed API call)
- `rollbackReorder` - cofnięcie zmiany kolejności w przypadku błędu
- `removeFavoriteOptimistic` - usunięcie ze stanu
- `restoreFavorite` - przywrócenie w przypadku błędu
- `clearError` - czyszczenie błędów

**Selectors:**

```typescript
// Pobieranie listy ulubionych
const selectFavorites = (state: RootState) => state.favorites.favorites;

// Pobieranie statusu ładowania
const selectIsLoading = (state: RootState) => state.favorites.isLoading;

// Pobieranie statusu zapisywania
const selectIsSaving = (state: RootState) => state.favorites.isSaving;

// Pobieranie błędów
const selectError = (state: RootState) => state.favorites.error;

// Liczba ulubionych
const selectFavoritesCount = (state: RootState) => state.favorites.favorites.length;

// Czy centrum jest w ulubionych (użyteczne w innych widokach)
const selectIsFavorite = (rckikId: number) => (state: RootState) =>
  state.favorites.favorites.some(f => f.rckikId === rckikId);

// Ulubione posortowane według priorytetu
const selectFavoritesSorted = (state: RootState) =>
  [...state.favorites.favorites].sort((a, b) => {
    if (a.priority === null) return 1;
    if (b.priority === null) return -1;
    return a.priority - b.priority;
  });
```

**Optimistic Updates Pattern:**

```typescript
// Przykład dla usuwania ulubionego
const handleRemoveFavorite = async (favoriteId: number) => {
  // 1. Zapisz poprzedni stan (dla rollback)
  const previousFavorites = [...favorites];

  // 2. Optimistic update - usuń ze stanu
  dispatch(removeFavoriteOptimistic(favoriteId));

  try {
    // 3. Wywołaj API
    await dispatch(removeFavorite(favoriteId)).unwrap();

    // 4. Pokaż toast sukcesu
    toast.success('Usunięto z ulubionych');
  } catch (error) {
    // 5. Rollback w przypadku błędu
    dispatch(restoreFavorite(previousFavorites.find(f => f.id === favoriteId)));

    // 6. Pokaż toast błędu
    toast.error('Nie udało się usunąć z ulubionych. Spróbuj ponownie.');
  }
};
```

**Cache Strategy:**

```typescript
// W fetchFavorites thunk
export const fetchFavorites = createAsyncThunk(
  'favorites/fetch',
  async (forceRefresh: boolean = false, { getState }) => {
    const state = getState() as RootState;
    const { lastFetched, favorites } = state.favorites;

    // Cache na 5 minut
    const CACHE_DURATION = 5 * 60 * 1000;
    const now = Date.now();
    const lastFetchedTime = lastFetched ? new Date(lastFetched).getTime() : 0;

    if (!forceRefresh && favorites.length > 0 && (now - lastFetchedTime) < CACHE_DURATION) {
      // Zwróć cached dane
      return { favorites, fromCache: true };
    }

    // Fetch z API
    const response = await api.get<GetFavoritesResponse>('/api/v1/users/me/favorites');
    return { favorites: response.data.favorites, fromCache: false };
  }
);
```

### Custom Hook: `useFavorites`

Opcjonalnie można stworzyć custom hook dla uproszczenia dostępu do stanu i akcji:

```typescript
export const useFavorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  const isLoading = useAppSelector(selectIsLoading);
  const isSaving = useAppSelector(selectIsSaving);
  const error = useAppSelector(selectError);

  const fetchFavorites = useCallback((forceRefresh = false) => {
    return dispatch(fetchFavoritesThunk(forceRefresh));
  }, [dispatch]);

  const reorderFavorites = useCallback(async (newOrder: FavoriteRckikDto[]) => {
    return dispatch(updateFavoritesOrderThunk(newOrder));
  }, [dispatch]);

  const removeFavorite = useCallback(async (favoriteId: number) => {
    return dispatch(removeFavoriteThunk(favoriteId));
  }, [dispatch]);

  return {
    favorites,
    isLoading,
    isSaving,
    error,
    fetchFavorites,
    reorderFavorites,
    removeFavorite,
  };
};
```

## 7. Integracja API

### Endpointy używane przez widok

#### 1. Pobieranie listy ulubionych

**Request:**
```http
GET /api/v1/users/me/favorites
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "favorites": [
    {
      "id": 10,
      "rckikId": 1,
      "name": "RCKiK Warszawa",
      "code": "RCKIK-WAW",
      "city": "Warszawa",
      "address": "ul. Kasprzaka 17, 01-211 Warszawa",
      "latitude": 52.2319,
      "longitude": 20.9728,
      "active": true,
      "priority": 1,
      "addedAt": "2025-01-01T12:00:00",
      "currentBloodLevels": [
        {
          "bloodGroup": "A+",
          "levelPercentage": 45.50,
          "levelStatus": "IMPORTANT",
          "lastUpdate": "2025-01-08T02:30:00"
        },
        {
          "bloodGroup": "0-",
          "levelPercentage": 15.00,
          "levelStatus": "CRITICAL",
          "lastUpdate": "2025-01-08T02:30:00"
        }
      ]
    }
  ]
}
```

**Obsługa błędów:**
- `401 Unauthorized` - przekierowanie do `/login`
- `500 Internal Server Error` - toast z komunikatem "Nie udało się pobrać ulubionych"

**Wywołanie w komponencie:**
```typescript
useEffect(() => {
  dispatch(fetchFavorites());
}, [dispatch]);
```

#### 2. Aktualizacja kolejności ulubionych

**Request:**
```http
PATCH /api/v1/users/me/favorites
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "favorites": [
    { "id": 10, "priority": 1 },
    { "id": 11, "priority": 2 },
    { "id": 12, "priority": 3 }
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Favorites order updated successfully",
  "favorites": [...]
}
```

**Obsługa błędów:**
- `400 Bad Request` - walidacja nieudana (toast z błędem)
- `401 Unauthorized` - przekierowanie do `/login`
- `500 Internal Server Error` - rollback + toast "Nie udało się zapisać kolejności"

**Wywołanie po drag-and-drop:**
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = favorites.findIndex(f => f.id === active.id);
  const newIndex = favorites.findIndex(f => f.id === over.id);

  // Optimistic update
  const newOrder = arrayMove(favorites, oldIndex, newIndex);
  dispatch(reorderFavorites(newOrder));

  try {
    await dispatch(updateFavoritesOrder(newOrder)).unwrap();
    toast.success('Kolejność zapisana');
  } catch (error) {
    // Rollback
    dispatch(rollbackReorder());
    toast.error('Nie udało się zapisać kolejności');
  }
};
```

#### 3. Usuwanie z ulubionych

**Request:**
```http
DELETE /api/v1/users/me/favorites/{rckikId}
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

**Obsługa błędów:**
- `404 Not Found` - toast "Centrum nie znalezione w ulubionych"
- `401 Unauthorized` - przekierowanie do `/login`
- `500 Internal Server Error` - rollback + toast "Nie udało się usunąć z ulubionych"

**Wywołanie po potwierdzeniu:**
```typescript
const handleRemove = async (favoriteId: number) => {
  // Zapisz dla rollback
  const removedFavorite = favorites.find(f => f.id === favoriteId);

  // Optimistic update
  dispatch(removeFavoriteOptimistic(favoriteId));

  try {
    await api.delete(`/api/v1/users/me/favorites/${removedFavorite.rckikId}`);
    toast.success(`Usunięto ${removedFavorite.name} z ulubionych`);
  } catch (error) {
    // Rollback
    dispatch(restoreFavorite(removedFavorite));
    toast.error('Nie udało się usunąć z ulubionych. Spróbuj ponownie.');
  }
};
```

### Axios Client Configuration

Wszystkie wywołania API używają wspólnego Axios client z interceptorami:

```typescript
// src/lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodaj token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    }
    if (error.response?.status === 429) {
      // Rate limit
      const retryAfter = error.response.headers['retry-after'];
      toast.error(`Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter}s`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Service Layer

```typescript
// src/lib/api/endpoints/favorites.ts
import apiClient from '../client';
import type { GetFavoritesResponse, AddFavoriteRequest, AddFavoriteResponse, UpdateFavoritesOrderRequest } from '../types';

export const favoritesApi = {
  // GET /api/v1/users/me/favorites
  getFavorites: async (): Promise<GetFavoritesResponse> => {
    const response = await apiClient.get<GetFavoritesResponse>('/users/me/favorites');
    return response.data;
  },

  // POST /api/v1/users/me/favorites
  addFavorite: async (request: AddFavoriteRequest): Promise<AddFavoriteResponse> => {
    const response = await apiClient.post<AddFavoriteResponse>('/users/me/favorites', request);
    return response.data;
  },

  // PATCH /api/v1/users/me/favorites
  updateOrder: async (request: UpdateFavoritesOrderRequest): Promise<void> => {
    await apiClient.patch('/users/me/favorites', request);
  },

  // DELETE /api/v1/users/me/favorites/{rckikId}
  removeFavorite: async (rckikId: number): Promise<void> => {
    await apiClient.delete(`/users/me/favorites/${rckikId}`);
  },
};
```

## 8. Interakcje użytkownika

### 1. Wejście na stronę Ulubione

**Flow:**
1. Użytkownik klika "Ulubione" w nawigacji dashboardu
2. Nawigacja do `/dashboard/favorites`
3. Middleware sprawdza autentykację
4. SSR renderuje layout + placeholder
5. React Island hydratuje się (client:load)
6. Komponent wykonuje `useEffect` → `dispatch(fetchFavorites())`
7. Podczas ładowania: pokazanie skeleton loaders
8. Po otrzymaniu danych:
   - Jeśli `favorites.length === 0` → EmptyState
   - Jeśli `favorites.length > 0` → FavoritesList

**Skeleton loader:**
- 3-5 kart z animowanymi placeholder'ami (shimmer effect)
- Kształt podobny do FavoriteCard

### 2. Przeglądanie listy ulubionych

**Interakcje:**
- **Scroll:** Użytkownik scrolluje listę ulubionych
- **Hover nad kartą:** Podniesienie karty (box-shadow), pokazanie DragHandle
- **Focus (keyboard):** Obramowanie focus state, dostęp do przycisków Tab
- **Kliknięcie na kartę:** Nawigacja do `/rckik/[id]` (szczegóły centrum)
- **Kliknięcie na "Zobacz szczegóły":** Nawigacja do `/rckik/[id]`

**Dostępność:**
- Arrow keys: Nawigacja między kartami
- Tab: Nawigacja między elementami interaktywnymi (przyciski)
- Enter/Space na karcie: Otwarcie szczegółów centrum

### 3. Zmiana kolejności (Drag-and-Drop)

**Flow desktop (mysz):**
1. Użytkownik najeżdża na kartę → DragHandle staje się widoczny
2. Użytkownik chwyta za DragHandle i rozpoczyna przeciąganie
3. Karta zmienia wygląd (opacity, box-shadow) - pokazanie DragOverlay
4. Podczas przeciągania: inne karty przesuwają się tworząc miejsce
5. Użytkownik upuszcza kartę w nowym miejscu
6. **Optimistic update:** Karta natychmiast zmienia pozycję
7. **API call:** `PATCH /api/v1/users/me/favorites` (w tle)
8. **Sukces:** Toast "Kolejność zapisana" (opcjonalnie, może być cichy sukces)
9. **Błąd:** Rollback + toast "Nie udało się zapisać kolejności"

**Flow mobile (touch):**
1. Użytkownik przytrzymuje kartę (long press)
2. Karta pulsuje - feedback że jest "złapana"
3. Użytkownik przeciąga palcem
4. Auto-scroll jeśli przeciąga na krawędź ekranu
5. Pozostałe kroki jak desktop

**Flow keyboard:**
1. Użytkownik focusuje kartę (Tab lub Arrow keys)
2. Naciska Space lub Enter → "grab mode"
3. Arrow Up/Down → przemieszczanie karty
4. Space lub Enter → "drop"
5. Escape → anulowanie (powrót do pierwotnej pozycji)

**Feedback wizualny:**
- Przeciągana karta: wyższa z-index, box-shadow, lekka rotacja
- Placeholder: przerywana linia lub puste miejsce
- Inne karty: animacja przesunięcia (transition)

**Edge cases:**
- Jeśli przeciąga na tę samą pozycję → brak API call
- Jeśli API zwróci błąd → rollback animowany
- Jeśli użytkownik przeciąga poza listę → powrót do ostatniej ważnej pozycji

### 4. Usuwanie z ulubionych

**Flow:**
1. Użytkownik klika przycisk "Usuń" (ikona kosza) na karcie
2. **Modal potwierdzenia** pojawia się:
   - Tytuł: "Usuń z ulubionych?"
   - Treść: "Czy na pewno chcesz usunąć **RCKiK Warszawa** z listy ulubionych? Przestaniesz otrzymywać powiadomienia o tym centrum."
   - Przyciski: "Anuluj" (secondary) | "Usuń" (danger, czerwony)
3. Użytkownik klika "Usuń"
4. **Optimistic update:** Karta znika z animacją (fade out + slide)
5. **API call:** `DELETE /api/v1/users/me/favorites/{rckikId}`
6. **Sukces:**
   - Toast: "Usunięto RCKiK Warszawa z ulubionych"
   - Jeśli był ostatni → pokazanie EmptyState
7. **Błąd:**
   - Rollback: Karta wraca z animacją (fade in + slide)
   - Toast: "Nie udało się usunąć z ulubionych. Spróbuj ponownie."

**Keyboard:**
- Escape → zamknięcie modalu bez usuwania
- Tab → nawigacja między przyciskami w modalu
- Enter na "Usuń" → potwierdzenie

### 5. Dodanie pierwszego ulubionego (EmptyState)

**Flow:**
1. Użytkownik widzi EmptyState
2. Klika CTA "Przeglądaj centra"
3. Nawigacja do `/rckik`
4. Na liście RCKiK użytkownik klika "Dodaj do ulubionych" (serce)
5. Optimistic update: serce zapełnia się
6. API call: `POST /api/v1/users/me/favorites`
7. Sukces: Toast "Dodano do ulubionych"
8. Gdy użytkownik wraca do `/dashboard/favorites` → FavoritesList z 1 kartą

### 6. Odświeżanie danych

**Automatyczne odświeżanie:**
- Po wejściu na stronę: `fetchFavorites()` z cache (5 min)
- Po dodaniu/usunięciu: automatyczne pobranie nowych danych
- Po zmianie tab'a przeglądarki (optional): `visibilitychange` event

**Manualne odświeżanie:**
- Pull-to-refresh na mobile (opcjonalnie)
- Przycisk "Odśwież" w headerze (opcjonalnie)

**Force refresh:**
```typescript
const handleRefresh = () => {
  dispatch(fetchFavorites(true)); // forceRefresh=true
};
```

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs

#### 1. Autentykacja użytkownika

**Warunek:** Użytkownik musi być zalogowany z ważnym tokenem JWT

**Komponenty dotknięte:** Cała strona `/dashboard/favorites`

**Walidacja:**
- Middleware Astro sprawdza token przed renderowaniem SSR
- Axios interceptor sprawdza 401 przy każdym API call
- Przekierowanie do `/login` jeśli token nieważny

**Wpływ na UI:**
```typescript
// W middleware.ts
export async function onRequest({ request, cookies, redirect }, next) {
  const token = cookies.get('accessToken');

  if (!token && request.url.includes('/dashboard')) {
    return redirect('/login?redirect=/dashboard/favorites');
  }

  return next();
}
```

#### 2. Limit maksymalny ulubionych

**Warunek:** Użytkownik może mieć maksymalnie 10 ulubionych centrów (opcjonalny limit)

**Komponenty dotknięte:** FavoritesHeader (przycisk "Dodaj centrum")

**Walidacja:**
- Frontend: Sprawdzenie `favorites.length >= MAX_FAVORITES`
- Backend: Walidacja przy POST (409 Conflict jeśli przekroczono limit)

**Wpływ na UI:**
```typescript
const MAX_FAVORITES = 10;

// W FavoritesHeader
<Button
  disabled={favoritesCount >= MAX_FAVORITES}
  onClick={navigateToRckikList}
>
  {favoritesCount >= MAX_FAVORITES
    ? `Osiągnięto limit (${MAX_FAVORITES})`
    : 'Dodaj centrum'
  }
</Button>

// Tooltip dla disabled state
{favoritesCount >= MAX_FAVORITES && (
  <Tooltip>
    Możesz mieć maksymalnie {MAX_FAVORITES} ulubionych centrów.
    Usuń jedno, aby dodać nowe.
  </Tooltip>
)}
```

#### 3. Poprawność danych centrum

**Warunek:** Centrum musi istnieć i być aktywne (`active=true`)

**Komponenty dotknięte:** FavoriteCard

**Walidacja:**
- Backend: Sprawdzenie przy POST/DELETE czy `rckik_id` istnieje
- Frontend: Filtrowanie nieaktywnych centrów z listy

**Wpływ na UI:**
```typescript
// W FavoriteCard - jeśli centrum zostało dezaktywowane
{!favorite.active && (
  <Alert variant="warning">
    To centrum zostało dezaktywowane.
    <Button onClick={() => removeFavorite(favorite.id)}>
      Usuń z ulubionych
    </Button>
  </Alert>
)}
```

#### 4. Dostępność danych o poziomach krwi

**Warunek:** `currentBloodLevels` może być puste lub niekompletne (US-020)

**Komponenty dotknięte:** FavoriteCard, BloodLevelBadge

**Walidacja:**
- Sprawdzenie `currentBloodLevels !== null && currentBloodLevels.length > 0`
- Fallback dla brakujących danych

**Wpływ na UI:**
```typescript
// W FavoriteCard
{favorite.currentBloodLevels && favorite.currentBloodLevels.length > 0 ? (
  <BloodLevelsGrid>
    {favorite.currentBloodLevels.map(level => (
      <BloodLevelBadge key={level.bloodGroup} bloodLevel={level} />
    ))}
  </BloodLevelsGrid>
) : (
  <NoDataMessage>
    <Icon name="alert-circle" />
    Brak aktualnych danych o stanach krwi
    <span className="text-sm text-gray-500">
      Ostatnia aktualizacja: {formatDate(favorite.lastUpdate)}
    </span>
  </NoDataMessage>
)}
```

#### 5. Status poziomu krwi (BloodLevelStatus)

**Warunek:** `levelStatus` musi być jednym z: CRITICAL, IMPORTANT, OK

**Komponenty dotknięte:** BloodLevelBadge

**Walidacja:**
- TypeScript enum validation
- Default fallback jeśli wartość nieznana

**Wpływ na UI:**
```typescript
const getStatusColor = (status: BloodLevelStatus): string => {
  switch (status) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'IMPORTANT':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'OK':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'; // Fallback
  }
};

const getStatusIcon = (status: BloodLevelStatus): string => {
  switch (status) {
    case 'CRITICAL':
      return '✕'; // X icon
    case 'IMPORTANT':
      return '⚠'; // Warning icon
    case 'OK':
      return '✓'; // Check icon
    default:
      return '?'; // Unknown
  }
};
```

#### 6. Kolejność drag-and-drop

**Warunek:** Nowa kolejność musi być różna od poprzedniej

**Komponenty dotknięte:** FavoritesList (onDragEnd)

**Walidacja:**
- Porównanie `oldIndex !== newIndex`
- Brak API call jeśli kolejność nie uległa zmianie

**Wpływ na UI:**
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    // Upuszczono na tej samej pozycji - brak akcji
    return;
  }

  const oldIndex = favorites.findIndex(f => f.id === active.id);
  const newIndex = favorites.findIndex(f => f.id === over.id);

  if (oldIndex === newIndex) {
    // Kolejność nie uległa zmianie
    return;
  }

  // Zapisz nową kolejność
  const newOrder = arrayMove(favorites, oldIndex, newIndex);
  updateOrder(newOrder);
};
```

#### 7. Potwierdzenie usunięcia

**Warunek:** Użytkownik musi potwierdzić akcję usunięcia (wymagany click na "Usuń" w modalu)

**Komponenty dotknięte:** RemoveButton, ConfirmModal

**Walidacja:**
- Modal musi być otwarty
- Użytkownik musi kliknąć przycisk "Usuń" (nie wystarczy zamknięcie modalu)

**Wpływ na UI:**
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);

const handleRemoveClick = (favoriteId: number) => {
  setPendingRemoveId(favoriteId);
  setIsModalOpen(true);
};

const handleConfirmRemove = async () => {
  if (pendingRemoveId === null) return;

  try {
    await removeFavorite(pendingRemoveId);
    setIsModalOpen(false);
    setPendingRemoveId(null);
  } catch (error) {
    // Error handled by redux
  }
};

const handleCancelRemove = () => {
  setIsModalOpen(false);
  setPendingRemoveId(null);
};
```

#### 8. Stan ładowania

**Warunek:** Podczas operacji API interfejs musi pokazywać loading state

**Komponenty dotknięte:** Wszystkie komponenty wykonujące API calls

**Walidacja:**
- Sprawdzenie `isLoading` lub `isSaving` z Redux
- Disabled state na przyciskach podczas operacji

**Wpływ na UI:**
```typescript
// Loading skeleton podczas pierwszego ładowania
{isLoading && favorites.length === 0 && <FavoritesListSkeleton />}

// Lista z danymi
{!isLoading && favorites.length > 0 && (
  <FavoritesList favorites={favorites} />
)}

// Empty state
{!isLoading && favorites.length === 0 && <EmptyState />}

// Disabled buttons podczas zapisywania
<Button
  onClick={handleSave}
  disabled={isSaving}
>
  {isSaving ? (
    <>
      <Spinner size="sm" />
      Zapisywanie...
    </>
  ) : (
    'Zapisz'
  )}
</Button>
```

### Walidacja po stronie klienta vs serwera

| Warunek | Frontend Validation | Backend Validation | Dlaczego? |
|---------|--------------------|--------------------|-----------|
| Autentykacja | Middleware redirect | JWT verification | Bezpieczeństwo |
| Limit ulubionych | Disabled button, count check | 409 Conflict | UX + Bezpieczeństwo |
| Istnienie centrum | Pre-filter active | 404 Not Found | Integralność danych |
| Poprawność priority | Number type, range | Number type, range | Spójność |
| Potwierdzenie usunięcia | Modal required | Brak | UX only |
| Kolejność DnD | oldIndex !== newIndex | Walidacja tablicy | Performance + Integralność |

## 10. Obsługa błędów

### Kategorie błędów

#### 1. Błędy autentykacji (401 Unauthorized)

**Przyczyny:**
- Token JWT wygasł
- Token jest nieważny
- Użytkownik nie jest zalogowany

**Obsługa:**
```typescript
// W Axios interceptor (global)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token
      localStorage.removeItem('accessToken');

      // Redirect to login with return URL
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
    return Promise.reject(error);
  }
);
```

**UI:**
- Automatyczne przekierowanie do `/login`
- Toast: "Sesja wygasła. Zaloguj się ponownie."
- Po zalogowaniu: powrót do `/dashboard/favorites`

#### 2. Błędy sieci (Network Error)

**Przyczyny:**
- Brak połączenia internetowego
- Timeout (>10s)
- Serwer niedostępny

**Obsługa:**
```typescript
try {
  await dispatch(fetchFavorites()).unwrap();
} catch (error) {
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    toast.error('Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.', {
      action: {
        label: 'Spróbuj ponownie',
        onClick: () => dispatch(fetchFavorites()),
      },
    });
  }
}
```

**UI:**
- Banner na górze strony: "Jesteś offline"
- Przycisk "Spróbuj ponownie" w toaście
- Wyłączenie interaktywnych akcji (drag-and-drop, usuwanie)
- Pokazanie cached danych jeśli dostępne

#### 3. Błąd 404 Not Found

**Przyczyny:**
- Centrum RCKiK nie istnieje
- Ulubiony został już usunięty

**Obsługa:**
```typescript
try {
  await dispatch(removeFavorite(favoriteId)).unwrap();
} catch (error) {
  if (error.response?.status === 404) {
    // Centrum już nie istnieje - usuń z lokalnego stanu
    dispatch(removeFavoriteFromState(favoriteId));
    toast.info('Centrum zostało już usunięte z ulubionych.');
  }
}
```

**UI:**
- Toast informacyjny (nie error, bo akcja się powiodła)
- Usunięcie karty z widoku

#### 4. Błąd 409 Conflict

**Przyczyny:**
- Centrum już jest w ulubionych (duplikat)
- Przekroczono limit ulubionych

**Obsługa:**
```typescript
try {
  await dispatch(addFavorite(rckikId)).unwrap();
} catch (error) {
  if (error.response?.status === 409) {
    const message = error.response.data.message || 'To centrum jest już w Twoich ulubionych';
    toast.warning(message);
  }
}
```

**UI:**
- Toast ostrzeżenia z komunikatem
- Brak rollback (stan pozostaje bez zmian)

#### 5. Błąd 429 Too Many Requests (Rate Limit)

**Przyczyny:**
- Zbyt wiele żądań w krótkim czasie
- Przekroczono rate limit API

**Obsługa:**
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      toast.error(`Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter} sekund.`, {
        duration: parseInt(retryAfter) * 1000,
      });

      // Disable actions temporarily
      dispatch(setRateLimited(true));
      setTimeout(() => {
        dispatch(setRateLimited(false));
      }, parseInt(retryAfter) * 1000);
    }
    return Promise.reject(error);
  }
);
```

**UI:**
- Toast z countdown
- Disabled state na wszystkich przyciskach akcji
- Timer pokazujący kiedy można spróbować ponownie

#### 6. Błąd 500 Internal Server Error

**Przyczyny:**
- Błąd po stronie serwera
- Błąd bazy danych
- Nieoczekiwany wyjątek

**Obsługa:**
```typescript
try {
  await dispatch(updateFavoritesOrder(newOrder)).unwrap();
} catch (error) {
  if (error.response?.status === 500) {
    // Rollback do poprzedniej kolejności
    dispatch(rollbackReorder());

    toast.error('Wystąpił błąd serwera. Spróbuj ponownie za chwilę.', {
      action: {
        label: 'Zgłoś problem',
        onClick: () => window.open('/contact', '_blank'),
      },
    });
  }
}
```

**UI:**
- Rollback do poprzedniego stanu (animowany)
- Toast z opcją zgłoszenia problemu
- Przycisk "Spróbuj ponownie"

#### 7. Błędy walidacji (400 Bad Request)

**Przyczyny:**
- Nieprawidłowe dane w request
- Brakujące wymagane pola
- Nieprawidłowy format danych

**Obsługa:**
```typescript
try {
  await dispatch(updateFavoritesOrder(newOrder)).unwrap();
} catch (error) {
  if (error.response?.status === 400) {
    const details = error.response.data.details || [];
    const messages = details.map(d => d.message).join(', ');

    toast.error(`Błąd walidacji: ${messages}`);
    dispatch(rollbackReorder());
  }
}
```

**UI:**
- Toast z szczegółowymi komunikatami walidacji
- Rollback do poprzedniego stanu
- Highlight nieprawidłowych pól (jeśli applicable)

### Scenariusze Edge Case

#### 1. Pusta lista ulubionych

**Scenario:** Użytkownik nie ma jeszcze żadnych ulubionych

**Obsługa:**
```typescript
{!isLoading && favorites.length === 0 && (
  <EmptyState
    icon="heart-empty"
    title="Nie masz jeszcze ulubionych centrów"
    description="Dodaj centra krwiodawstwa do ulubionych, aby łatwo śledzić stany krwi i otrzymywać powiadomienia"
    action={{
      label: 'Przeglądaj centra',
      href: '/rckik',
    }}
  />
)}
```

#### 2. Wszystkie centra mają brakujące dane (NO_DATA)

**Scenario:** Scraper nie działa, brak aktualnych poziomów krwi

**Obsługa:**
```typescript
{favorite.currentBloodLevels?.length === 0 && (
  <Alert variant="warning">
    <Icon name="alert-triangle" />
    <div>
      <strong>Brak aktualnych danych</strong>
      <p className="text-sm">
        Ostatnia aktualizacja: {formatDate(favorite.lastUpdate)}
      </p>
      <Button
        size="sm"
        variant="link"
        onClick={() => window.location.href = `/rckik/${favorite.rckikId}`}
      >
        Sprawdź szczegóły centrum
      </Button>
    </div>
  </Alert>
)}
```

#### 3. Równoczesne edycje (Concurrent Updates)

**Scenario:** Użytkownik otwiera widok w dwóch kartach i edytuje w obu

**Obsługa:**
- Optimistic updates w obu kartach
- Ostatnia operacja wygrywa (Last Write Wins)
- Po odświeżeniu strony: synchronizacja z serwerem

**Możliwe ulepszenie (post-MVP):**
```typescript
// Polling lub WebSocket do synchronizacji
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      dispatch(fetchFavorites(true)); // force refresh
    }
  }, 30000); // co 30s

  return () => clearInterval(interval);
}, [dispatch]);
```

#### 4. Błąd podczas Drag-and-Drop (API fail)

**Scenario:** Użytkownik zmienia kolejność, API zwraca błąd

**Obsługa:**
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  // ... calculate new order

  const previousOrder = [...favorites];
  dispatch(reorderFavorites(newOrder)); // optimistic

  try {
    await dispatch(updateFavoritesOrder(newOrder)).unwrap();
  } catch (error) {
    // Animated rollback
    dispatch(rollbackReorderWithAnimation(previousOrder));
    toast.error('Nie udało się zapisać kolejności. Spróbuj ponownie.');
  }
};
```

**UI:**
- Karta wraca do oryginalnej pozycji z animacją
- Czerwone "flash" na karcie
- Toast z komunikatem błędu

#### 5. Usunięto ostatnie ulubione

**Scenario:** Użytkownik usuwa ostatnie centrum z listy

**Obsługa:**
```typescript
const handleRemove = async (favoriteId: number) => {
  const isLastFavorite = favorites.length === 1;

  try {
    await dispatch(removeFavorite(favoriteId)).unwrap();

    if (isLastFavorite) {
      // Smooth transition do EmptyState
      setTimeout(() => {
        setShowEmptyState(true);
      }, 300); // po animacji zniknięcia karty
    }
  } catch (error) {
    // handle error
  }
};
```

**UI:**
- Fade out ostatniej karty
- Fade in EmptyState z opóźnieniem
- Smooth transition bez "skoku"

### Strategia retry dla błędów przejściowych

```typescript
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === maxRetries - 1;
      const isRetryable = [500, 502, 503, 504].includes(error.response?.status);

      if (isLastRetry || !isRetryable) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Usage
try {
  await retryWithBackoff(() => dispatch(fetchFavorites()).unwrap());
} catch (error) {
  toast.error('Nie udało się pobrać ulubionych po 3 próbach.');
}
```

## 11. Kroki implementacji

### Faza 1: Setup i Struktura Podstawowa (2-3h)

#### Krok 1.1: Utworzenie struktury plików
```bash
# Strony
touch src/pages/dashboard/favorites.astro

# Komponenty React
mkdir -p src/components/dashboard/favorites
touch src/components/dashboard/favorites/FavoritesView.tsx
touch src/components/dashboard/favorites/FavoritesList.tsx
touch src/components/dashboard/favorites/FavoriteCard.tsx
touch src/components/dashboard/favorites/EmptyState.tsx

# Redux
touch src/lib/store/slices/favoritesSlice.ts

# API
touch src/lib/api/endpoints/favorites.ts

# Typy
touch src/lib/types/favorites.ts

# Testy
touch src/components/dashboard/favorites/__tests__/FavoritesList.test.tsx
```

#### Krok 1.2: Instalacja zależności
```bash
# Drag and drop
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Icons (jeśli jeszcze nie ma)
pnpm add lucide-react

# Toast notifications (jeśli jeszcze nie ma)
pnpm add sonner
```

#### Krok 1.3: Definicja typów TypeScript
Plik: `src/lib/types/favorites.ts`
```typescript
// Import z backend DTO
export interface FavoriteRckikDto {
  id: number;
  rckikId: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  active: boolean;
  priority: number | null;
  addedAt: string;
  currentBloodLevels: BloodLevelDto[];
}

export interface BloodLevelDto {
  bloodGroup: BloodGroup;
  levelPercentage: number;
  levelStatus: BloodLevelStatus;
  lastUpdate: string;
}

export type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
export type BloodLevelStatus = 'CRITICAL' | 'IMPORTANT' | 'OK';

// API responses
export interface GetFavoritesResponse {
  favorites: FavoriteRckikDto[];
}

export interface AddFavoriteRequest {
  rckikId: number;
  priority?: number | null;
}

export interface UpdateFavoritesOrderRequest {
  favorites: Array<{
    id: number;
    priority: number;
  }>;
}

// Local state types
export interface FavoritesState {
  favorites: FavoriteRckikDto[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastFetched: string | null;
}
```

**Acceptance Criteria:**
- ✅ Wszystkie pliki utworzone
- ✅ Zależności zainstalowane bez konfliktów
- ✅ Typy TypeScript zdefiniowane zgodnie z backend DTO

---

### Faza 2: Redux Store i API Integration (2-3h)

#### Krok 2.1: API Service Layer
Plik: `src/lib/api/endpoints/favorites.ts`
```typescript
import apiClient from '../client';
import type {
  GetFavoritesResponse,
  AddFavoriteRequest,
  FavoriteRckikDto,
  UpdateFavoritesOrderRequest,
} from '../../types/favorites';

export const favoritesApi = {
  getFavorites: async (): Promise<GetFavoritesResponse> => {
    const response = await apiClient.get<GetFavoritesResponse>('/users/me/favorites');
    return response.data;
  },

  addFavorite: async (request: AddFavoriteRequest): Promise<FavoriteRckikDto> => {
    const response = await apiClient.post<FavoriteRckikDto>('/users/me/favorites', request);
    return response.data;
  },

  updateOrder: async (request: UpdateFavoritesOrderRequest): Promise<void> => {
    await apiClient.patch('/users/me/favorites', request);
  },

  removeFavorite: async (rckikId: number): Promise<void> => {
    await apiClient.delete(`/users/me/favorites/${rckikId}`);
  },
};
```

#### Krok 2.2: Redux Slice
Plik: `src/lib/store/slices/favoritesSlice.ts`
```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { favoritesApi } from '../../api/endpoints/favorites';
import type { FavoritesState, FavoriteRckikDto, UpdateFavoritesOrderRequest } from '../../types/favorites';

const initialState: FavoritesState = {
  favorites: [],
  isLoading: false,
  isSaving: false,
  error: null,
  lastFetched: null,
};

// Async Thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetch',
  async (forceRefresh: boolean = false, { getState }) => {
    const state = getState() as { favorites: FavoritesState };
    const { lastFetched, favorites } = state.favorites;

    // Cache 5 min
    const CACHE_DURATION = 5 * 60 * 1000;
    const now = Date.now();
    const lastFetchedTime = lastFetched ? new Date(lastFetched).getTime() : 0;

    if (!forceRefresh && favorites.length > 0 && (now - lastFetchedTime) < CACHE_DURATION) {
      return { favorites, fromCache: true };
    }

    const response = await favoritesApi.getFavorites();
    return { favorites: response.favorites, fromCache: false };
  }
);

export const updateFavoritesOrder = createAsyncThunk(
  'favorites/updateOrder',
  async (newOrder: FavoriteRckikDto[]) => {
    const request: UpdateFavoritesOrderRequest = {
      favorites: newOrder.map((fav, index) => ({
        id: fav.id,
        priority: index + 1,
      })),
    };
    await favoritesApi.updateOrder(request);
    return newOrder;
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/remove',
  async (rckikId: number) => {
    await favoritesApi.removeFavorite(rckikId);
    return rckikId;
  }
);

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    reorderFavorites: (state, action: PayloadAction<FavoriteRckikDto[]>) => {
      state.favorites = action.payload;
    },
    rollbackReorder: (state, action: PayloadAction<FavoriteRckikDto[]>) => {
      state.favorites = action.payload;
    },
    removeFavoriteOptimistic: (state, action: PayloadAction<number>) => {
      state.favorites = state.favorites.filter(f => f.rckikId !== action.payload);
    },
    restoreFavorite: (state, action: PayloadAction<FavoriteRckikDto>) => {
      state.favorites.push(action.payload);
      state.favorites.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favorites = action.payload.favorites;
        if (!action.payload.fromCache) {
          state.lastFetched = new Date().toISOString();
        }
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Nie udało się pobrać ulubionych';
      })
      // Update order
      .addCase(updateFavoritesOrder.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateFavoritesOrder.fulfilled, (state, action) => {
        state.isSaving = false;
        state.favorites = action.payload;
      })
      .addCase(updateFavoritesOrder.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Nie udało się zapisać kolejności';
      })
      // Remove
      .addCase(removeFavorite.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.isSaving = false;
        state.favorites = state.favorites.filter(f => f.rckikId !== action.payload);
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Nie udało się usunąć z ulubionych';
      });
  },
});

export const {
  reorderFavorites,
  rollbackReorder,
  removeFavoriteOptimistic,
  restoreFavorite,
  clearError,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;

// Selectors
export const selectFavorites = (state: { favorites: FavoritesState }) => state.favorites.favorites;
export const selectIsLoading = (state: { favorites: FavoritesState }) => state.favorites.isLoading;
export const selectIsSaving = (state: { favorites: FavoritesState }) => state.favorites.isSaving;
export const selectError = (state: { favorites: FavoritesState }) => state.favorites.error;
export const selectFavoritesCount = (state: { favorites: FavoritesState }) => state.favorites.favorites.length;
```

#### Krok 2.3: Dodanie slice do store
Plik: `src/lib/store/index.ts`
```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import favoritesReducer from './slices/favoritesSlice';
// ... inne reducery

export const store = configureStore({
  reducer: {
    auth: authReducer,
    favorites: favoritesReducer,
    // ... inne slices
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Acceptance Criteria:**
- ✅ API service zwraca poprawne typy
- ✅ Redux slice kompiluje się bez błędów TypeScript
- ✅ Slice dodany do store
- ✅ Selectors działają poprawnie

---

### Faza 3: Komponenty UI - Podstawowe (3-4h)

#### Krok 3.1: Strona Astro
Plik: `src/pages/dashboard/favorites.astro`
```astro
---
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import FavoritesView from '../../components/dashboard/favorites/FavoritesView';

// Middleware sprawdzi autentykację
---

<DashboardLayout title="Ulubione centra">
  <FavoritesView client:load />
</DashboardLayout>
```

#### Krok 3.2: Główny widok (FavoritesView)
Plik: `src/components/dashboard/favorites/FavoritesView.tsx`
```typescript
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../lib/store/hooks';
import {
  fetchFavorites,
  selectFavorites,
  selectIsLoading,
  selectError,
} from '../../../lib/store/slices/favoritesSlice';
import FavoritesList from './FavoritesList';
import EmptyState from './EmptyState';
import { Toaster } from 'sonner';

const FavoritesView: React.FC = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  if (isLoading && favorites.length === 0) {
    return <FavoritesListSkeleton />;
  }

  if (error && favorites.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={() => dispatch(fetchFavorites(true))}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FavoritesHeader favoritesCount={favorites.length} />

      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <FavoritesList favorites={favorites} />
      )}

      <Toaster position="bottom-right" />
    </div>
  );
};

export default FavoritesView;
```

#### Krok 3.3: Header komponenty
```typescript
// FavoritesHeader.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../../ui/Button';

interface FavoritesHeaderProps {
  favoritesCount: number;
}

const FavoritesHeader: React.FC<FavoritesHeaderProps> = ({ favoritesCount }) => {
  const MAX_FAVORITES = 10;
  const isMaxReached = favoritesCount >= MAX_FAVORITES;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Ulubione centra
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {favoritesCount} {favoritesCount === 1 ? 'centrum' : 'centrów'}
        </p>
      </div>

      <Button
        href="/rckik"
        disabled={isMaxReached}
        variant="primary"
        icon={<Plus />}
        title={isMaxReached ? `Osiągnięto limit ${MAX_FAVORITES} centrów` : undefined}
      >
        {isMaxReached ? `Limit (${MAX_FAVORITES})` : 'Dodaj centrum'}
      </Button>
    </div>
  );
};

export default FavoritesHeader;
```

#### Krok 3.4: Empty State
```typescript
// EmptyState.tsx
import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import Button from '../../ui/Button';

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Heart className="w-12 h-12 text-gray-400" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Nie masz jeszcze ulubionych centrów
      </h2>

      <p className="text-gray-600 max-w-md mb-8">
        Dodaj centra krwiodawstwa do ulubionych, aby łatwo śledzić stany krwi
        i otrzymywać powiadomienia o krytycznych poziomach.
      </p>

      <Button
        href="/rckik"
        variant="primary"
        icon={<ArrowRight />}
        iconPosition="right"
      >
        Przeglądaj centra
      </Button>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <BenefitCard
          icon="📍"
          title="Szybki dostęp"
          description="Sprawdzaj stany krwi w ulubionych centrach"
        />
        <BenefitCard
          icon="🔔"
          title="Powiadomienia"
          description="Otrzymuj alerty o krytycznych stanach"
        />
        <BenefitCard
          icon="📊"
          title="Monitoring"
          description="Śledź zmiany poziomów krwi"
        />
      </div>
    </div>
  );
};

const BenefitCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="text-3xl mb-2">{icon}</div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default EmptyState;
```

**Acceptance Criteria:**
- ✅ Strona renderuje się bez błędów
- ✅ Header wyświetla poprawną liczbę ulubionych
- ✅ Empty State pokazuje się gdy brak ulubionych
- ✅ Loading skeleton działa podczas ładowania

---

### Faza 4: Drag-and-Drop i Lista (4-5h)

#### Krok 4.1: Lista z drag-and-drop
```typescript
// FavoritesList.tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAppDispatch, useAppSelector } from '../../../lib/store/hooks';
import {
  updateFavoritesOrder,
  reorderFavorites,
  rollbackReorder,
  selectIsSaving,
} from '../../../lib/store/slices/favoritesSlice';
import FavoriteCard from './FavoriteCard';
import { toast } from 'sonner';
import type { FavoriteRckikDto } from '../../../lib/types/favorites';

interface FavoritesListProps {
  favorites: FavoriteRckikDto[];
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites }) => {
  const dispatch = useAppDispatch();
  const isSaving = useAppSelector(selectIsSaving);
  const [localFavorites, setLocalFavorites] = useState(favorites);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localFavorites.findIndex(f => f.id === active.id);
    const newIndex = localFavorites.findIndex(f => f.id === over.id);

    if (oldIndex === newIndex) {
      return;
    }

    // Optimistic update
    const previousOrder = [...localFavorites];
    const newOrder = arrayMove(localFavorites, oldIndex, newIndex);
    setLocalFavorites(newOrder);
    dispatch(reorderFavorites(newOrder));

    try {
      await dispatch(updateFavoritesOrder(newOrder)).unwrap();
      // Opcjonalnie: cichy sukces lub toast
      // toast.success('Kolejność zapisana');
    } catch (error) {
      // Rollback
      setLocalFavorites(previousOrder);
      dispatch(rollbackReorder(previousOrder));
      toast.error('Nie udało się zapisać kolejności. Spróbuj ponownie.');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localFavorites.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {localFavorites.map((favorite, index) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              index={index}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default FavoritesList;
```

#### Krok 4.2: Karta ulubionego
```typescript
// FavoriteCard.tsx
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Trash2, ExternalLink } from 'lucide-react';
import BloodLevelBadge from '../../rckik/BloodLevelBadge';
import Button from '../../ui/Button';
import ConfirmModal from '../../ui/ConfirmModal';
import { useAppDispatch } from '../../../lib/store/hooks';
import { removeFavorite } from '../../../lib/store/slices/favoritesSlice';
import { toast } from 'sonner';
import type { FavoriteRckikDto } from '../../../lib/types/favorites';

interface FavoriteCardProps {
  favorite: FavoriteRckikDto;
  index: number;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ favorite, index }) => {
  const dispatch = useAppDispatch();
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: favorite.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = async () => {
    try {
      await dispatch(removeFavorite(favorite.rckikId)).unwrap();
      toast.success(`Usunięto ${favorite.name} z ulubionych`);
      setIsRemoveModalOpen(false);
    } catch (error) {
      toast.error('Nie udało się usunąć z ulubionych. Spróbuj ponownie.');
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          bg-white rounded-lg border border-gray-200 shadow-sm
          hover:shadow-md transition-shadow
          ${isDragging ? 'opacity-50 z-50' : ''}
        `}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <button
              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
              aria-label="Przeciągnij aby zmienić kolejność"
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {favorite.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{favorite.city}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-mono text-xs">{favorite.code}</span>
                  </div>
                </div>

                {/* Priority Badge */}
                {favorite.priority && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    #{favorite.priority}
                  </span>
                )}
              </div>

              {/* Blood Levels */}
              {favorite.currentBloodLevels && favorite.currentBloodLevels.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
                  {favorite.currentBloodLevels.map((level) => (
                    <BloodLevelBadge
                      key={level.bloodGroup}
                      bloodLevel={level}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    Brak aktualnych danych o stanach krwi
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  href={`/rckik/${favorite.rckikId}`}
                  variant="secondary"
                  size="sm"
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Zobacz szczegóły
                </Button>

                <Button
                  onClick={() => setIsRemoveModalOpen(true)}
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Usuń
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemove}
        title="Usuń z ulubionych?"
        message={`Czy na pewno chcesz usunąć ${favorite.name} z listy ulubionych? Przestaniesz otrzymywać powiadomienia o tym centrum.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        isDestructive
      />
    </>
  );
};

export default FavoriteCard;
```

**Acceptance Criteria:**
- ✅ Drag-and-drop działa myszą i touchem
- ✅ Keyboard navigation (Space/Enter, Arrow keys)
- ✅ Optimistic updates z rollback
- ✅ Smooth animations przy przeciąganiu

---

### Faza 5: BloodLevelBadge i UI Components (2h)

#### Krok 5.1: Blood Level Badge
```typescript
// src/components/rckik/BloodLevelBadge.tsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { BloodLevelDto } from '../../lib/types/favorites';

interface BloodLevelBadgeProps {
  bloodLevel: BloodLevelDto;
  compact?: boolean;
  showTooltip?: boolean;
}

const BloodLevelBadge: React.FC<BloodLevelBadgeProps> = ({
  bloodLevel,
  compact = false,
  showTooltip = true,
}) => {
  const { bloodGroup, levelPercentage, levelStatus } = bloodLevel;

  const getStatusStyles = () => {
    switch (levelStatus) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: <XCircle className="w-3 h-3" />,
        };
      case 'IMPORTANT':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300',
          icon: <AlertTriangle className="w-3 h-3" />,
        };
      case 'OK':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          icon: <CheckCircle className="w-3 h-3" />,
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-300',
          icon: null,
        };
    }
  };

  const styles = getStatusStyles();
  const tooltipText = `${bloodGroup}: ${levelPercentage}% (${levelStatus})`;

  if (compact) {
    return (
      <div
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-md border
          ${styles.bg} ${styles.text} ${styles.border}
          text-xs font-medium
        `}
        title={showTooltip ? tooltipText : undefined}
        aria-label={tooltipText}
      >
        {styles.icon}
        <span>{bloodGroup}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex flex-col items-center px-3 py-2 rounded-lg border
        ${styles.bg} ${styles.text} ${styles.border}
      `}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      <div className="flex items-center gap-1 mb-1">
        {styles.icon}
        <span className="font-semibold">{bloodGroup}</span>
      </div>
      <span className="text-sm font-medium">{levelPercentage}%</span>
    </div>
  );
};

export default BloodLevelBadge;
```

#### Krok 5.2: Confirm Modal (reusable)
```typescript
// src/components/ui/ConfirmModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  isDestructive = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-700 mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDestructive ? 'danger' : 'primary'}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
```

**Acceptance Criteria:**
- ✅ Badge pokazuje poprawne kolory i ikony dla statusów
- ✅ Compact mode działa poprawnie
- ✅ Tooltip z dodatkowymi informacjami
- ✅ Modal potwierdzenia responsywny i dostępny

---

### Faza 6: Responsive Design i Accessibility (2h)

#### Krok 6.1: Mobile adaptations
- Touch gestures dla drag-and-drop
- Bottom sheet na mobile zamiast modal
- Większe touch targets (min 44x44px)
- Collapsed view kart na małych ekranach

#### Krok 6.2: Keyboard navigation
- Focus trap w modalu
- ESC do zamykania modali
- Tab order prawidłowy
- Space/Enter dla drag-and-drop

#### Krok 6.3: Screen reader support
- ARIA labels na wszystkich interaktywnych elementach
- aria-live regions dla toastów
- Descriptive alt text
- Semantic HTML (h1-h6 hierarchy)

**Acceptance Criteria:**
- ✅ Widok działa na mobile (375px+)
- ✅ Touch gestures działają poprawnie
- ✅ Keyboard navigation bez myszy
- ✅ Screen reader czyta wszystkie elementy

---

### Faza 7: Testing (3-4h)

#### Krok 7.1: Unit tests
```typescript
// __tests__/FavoritesList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FavoritesList from '../FavoritesList';
import favoritesReducer from '../../../lib/store/slices/favoritesSlice';

const mockFavorites = [
  {
    id: 1,
    rckikId: 1,
    name: 'RCKiK Warszawa',
    code: 'RCKIK-WAW',
    city: 'Warszawa',
    // ... pełne dane
  },
];

describe('FavoritesList', () => {
  it('renders list of favorites', () => {
    const store = configureStore({
      reducer: { favorites: favoritesReducer },
      preloadedState: {
        favorites: {
          favorites: mockFavorites,
          isLoading: false,
          isSaving: false,
          error: null,
          lastFetched: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <FavoritesList favorites={mockFavorites} />
      </Provider>
    );

    expect(screen.getByText('RCKiK Warszawa')).toBeInTheDocument();
  });

  // Więcej testów...
});
```

#### Krok 7.2: Integration tests
- Test flow: fetch → display → reorder → save
- Test flow: fetch → display → remove → confirm
- Test optimistic updates z rollback

#### Krok 7.3: E2E tests (Playwright)
```typescript
// e2e/favorites.spec.ts
import { test, expect } from '@playwright/test';

test('user can reorder favorites', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/dashboard/favorites');

  // Drag first card to second position
  const firstCard = page.locator('[data-testid="favorite-card"]').first();
  const secondCard = page.locator('[data-testid="favorite-card"]').nth(1);

  await firstCard.dragTo(secondCard);

  // Verify order changed
  await expect(page.locator('[data-testid="favorite-card"]').first()).toContainText('Expected name');
});
```

**Acceptance Criteria:**
- ✅ Unit tests coverage >80%
- ✅ Integration tests dla głównych flow
- ✅ E2E tests dla critical paths

---

### Faza 8: Performance Optimization (1-2h)

#### Krok 8.1: Code splitting
```typescript
// Lazy load modali
const ConfirmModal = lazy(() => import('../../ui/ConfirmModal'));
```

#### Krok 8.2: Memoization
```typescript
const FavoriteCard = React.memo(FavoriteCardComponent);

const bloodLevelBadges = useMemo(
  () => favorite.currentBloodLevels.map(level => (
    <BloodLevelBadge key={level.bloodGroup} bloodLevel={level} />
  )),
  [favorite.currentBloodLevels]
);
```

#### Krok 8.3: Virtualization (jeśli lista >20)
```typescript
import { FixedSizeList } from 'react-window';

// Dla bardzo długich list
<FixedSizeList
  height={600}
  itemCount={favorites.length}
  itemSize={200}
>
  {({ index, style }) => (
    <div style={style}>
      <FavoriteCard favorite={favorites[index]} />
    </div>
  )}
</FixedSizeList>
```

**Acceptance Criteria:**
- ✅ Lighthouse Performance >90
- ✅ First Contentful Paint <1.5s
- ✅ Time to Interactive <3s
- ✅ Bundle size <500KB

---

### Faza 9: Documentation i Cleanup (1h)

#### Krok 9.1: Dokumentacja komponentów
```typescript
/**
 * FavoriteCard - Karta pojedynczego ulubionego centrum RCKiK
 *
 * @component
 * @example
 * ```tsx
 * <FavoriteCard
 *   favorite={favoriteData}
 *   index={0}
 * />
 * ```
 *
 * @param {FavoriteCardProps} props
 * @param {FavoriteRckikDto} props.favorite - Dane ulubionego centrum
 * @param {number} props.index - Indeks w liście (dla priorytetyzacji)
 */
```

#### Krok 9.2: README
```markdown
# Favorites View

Widok zarządzania ulubionymi centrami krwiodawstwa.

## Features
- Drag-and-drop reordering
- Optimistic updates
- Mobile responsive
- Keyboard accessible

## API Endpoints
- GET /api/v1/users/me/favorites
- PATCH /api/v1/users/me/favorites
- DELETE /api/v1/users/me/favorites/{rckikId}

## Testing
```bash
pnpm test src/components/dashboard/favorites
pnpm test:e2e e2e/favorites.spec.ts
```
```

#### Krok 9.3: Cleanup
- Usunięcie console.log
- Usunięcie nieużywanych importów
- Formatowanie kodu (Prettier)
- Lint check (ESLint)

**Acceptance Criteria:**
- ✅ Wszystkie komponenty udokumentowane
- ✅ README aktualne
- ✅ Zero console.log w produkcji
- ✅ ESLint + Prettier passed

---

### Faza 10: Final Testing i Deployment (1-2h)

#### Krok 10.1: Manual QA checklist
- [ ] Login flow
- [ ] Fetch favorites (empty state)
- [ ] Add favorite from /rckik
- [ ] View favorites list
- [ ] Drag-and-drop reorder (mouse)
- [ ] Drag-and-drop reorder (keyboard)
- [ ] Drag-and-drop reorder (touch)
- [ ] Remove favorite (cancel)
- [ ] Remove favorite (confirm)
- [ ] Remove last favorite → empty state
- [ ] Error handling (network offline)
- [ ] Error handling (API 500)
- [ ] Mobile responsive (375px, 768px, 1024px)
- [ ] Accessibility (keyboard only)
- [ ] Screen reader (NVDA/JAWS)

#### Krok 10.2: Staging deployment
```bash
# Build
pnpm build

# Deploy to staging
pnpm deploy:staging

# Smoke tests na staging
pnpm test:e2e --env=staging
```

#### Krok 10.3: Production deployment
```bash
# Tag release
git tag -a v1.0.0-favorites -m "Release: Favorites view"

# Deploy to production
pnpm deploy:prod

# Monitor logs i errors
# Sprawdź metryki w Cloud Monitoring
```

**Acceptance Criteria:**
- ✅ Wszystkie QA checks passed
- ✅ E2E tests na staging passed
- ✅ Production deployment successful
- ✅ Zero critical errors w pierwszej godzinie

---

## Podsumowanie Timeline

| Faza | Czas szacowany | Zależności |
|------|----------------|------------|
| 1. Setup | 2-3h | - |
| 2. Redux + API | 2-3h | Faza 1 |
| 3. UI Basic | 3-4h | Faza 2 |
| 4. Drag-and-Drop | 4-5h | Faza 3 |
| 5. UI Components | 2h | Faza 4 |
| 6. Responsive + A11y | 2h | Faza 5 |
| 7. Testing | 3-4h | Faza 6 |
| 8. Performance | 1-2h | Faza 7 |
| 9. Docs + Cleanup | 1h | Faza 8 |
| 10. Deploy | 1-2h | Faza 9 |
| **TOTAL** | **21-28h** | ~3-4 dni robocze |

---

## Checklist końcowy

### Funkcjonalność
- [ ] Pobieranie listy ulubionych z API
- [ ] Wyświetlanie kart z poziomami krwi
- [ ] Drag-and-drop reordering (mouse, touch, keyboard)
- [ ] Usuwanie z potwierdzeniem
- [ ] Empty state
- [ ] Optimistic updates z rollback
- [ ] Error handling dla wszystkich scenariuszy

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states (skeletons)
- [ ] Toast notifications
- [ ] Smooth animations
- [ ] Hover effects
- [ ] Focus states

### Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Screen reader support
- [ ] Kontrast kolorów WCAG AA
- [ ] Focus trap w modalu

### Performance
- [ ] Lighthouse >90
- [ ] Bundle size <500KB
- [ ] Lazy loading modali
- [ ] Memoization komponentów

### Testing
- [ ] Unit tests >80% coverage
- [ ] Integration tests
- [ ] E2E tests critical paths
- [ ] Manual QA passed

### Deployment
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Rollback plan

---

**Koniec planu implementacji**
