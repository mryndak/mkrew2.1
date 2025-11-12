# Plan implementacji widoku Zarządzanie RCKiK

## 1. Przegląd

Widok **Zarządzanie RCKiK** jest panelem administracyjnym umożliwiającym zarządzanie kanoniczną listą Regionalnych Centrów Krwiodawstwa i Krwiolecznictwa (RCKiK). Widok pozwala administratorom na pełne operacje CRUD (tworzenie, odczyt, aktualizacja, usuwanie) centrów krwi, zarządzanie ich metadanymi (nazwa, kod, lokalizacja, aliasy) oraz kontrolowanie statusu aktywności centrów.

**Cel widoku:**
- Umożliwienie administratorom zarządzania kanoniczną listą RCKiK
- Zapewnienie możliwości dodawania nowych centrów, edycji istniejących i dezaktywacji nieaktywnych
- Dostarczenie przejrzystego interfejsu do zarządzania mapowaniem danych scrapera
- Rejestrowanie wszystkich krytycznych operacji w audyt logu (zgodnie z US-024)

**Powiązane User Stories:**
- **US-019**: Zarządzanie kanoniczną listą RCKiK - główna funkcjonalność CRUD
- **US-024**: Rejestr audytu operacji krytycznych - wszystkie operacje rejestrowane

## 2. Routing widoku

**Ścieżka:** `/admin/rckik`

**Wymagania dostępu:**
- Autentykacja: Wymagana (JWT token)
- Autoryzacja: Rola `ADMIN` wymagana
- Middleware: `auth.ts` (Astro middleware) weryfikuje token i rolę
- Redirect: Użytkownicy bez roli ADMIN przekierowywani do `/dashboard` lub `/login`

**Layout:** `AdminLayout.astro`
- Sidebar z nawigacją administratora (RCKiK, Scraper, Raporty)
- Header z informacją o zalogowanym adminie
- Breadcrumbs: Home > Admin > Zarządzanie RCKiK

## 3. Struktura komponentów

```
AdminRckikPage (pages/admin/rckik.astro)
├── AdminLayout (layouts/AdminLayout.astro)
│   ├── AdminSidebar
│   ├── AdminHeader
│   └── Breadcrumbs
├── RckikManagementContainer (client:load)
│   ├── RckikFiltersBar (React)
│   │   ├── SearchInput (debounced)
│   │   ├── CityFilter (Select)
│   │   └── StatusFilter (Select - Aktywne/Nieaktywne/Wszystkie)
│   ├── RckikTable (React, client:idle)
│   │   ├── RckikTableHeader (sortable columns)
│   │   └── RckikTableRow[] (każdy wiersz)
│   │       ├── RckikCellData
│   │       └── RckikActionsCell
│   │           ├── EditButton
│   │           ├── DeleteButton (dezaktywacja)
│   │           └── ViewDetailsButton
│   ├── RckikPagination
│   ├── CreateRckikButton
│   └── RckikFormModal (conditionally rendered)
│       └── RckikForm
│           ├── BasicInfoSection
│           │   ├── NameInput
│           │   ├── CodeInput
│           │   └── CityInput
│           ├── LocationSection
│           │   ├── AddressTextarea
│           │   ├── LatitudeInput
│           │   └── LongitudeInput
│           ├── AliasesSection
│           │   └── AliasesMultiInput (dynamic list)
│           ├── StatusSection
│           │   └── ActiveCheckbox
│           └── FormActions
│               ├── SaveButton
│               └── CancelButton
└── ConfirmDeleteModal (conditionally rendered)
    ├── WarningMessage
    ├── ConfirmButton
    └── CancelButton
```

## 4. Szczegóły komponentów

### RckikManagementContainer
**Opis:** Główny kontener zarządzający stanem widoku, operacjami CRUD i komunikacją z API.

**Główne elementy:**
- Filtracja i wyszukiwarka
- Tabela z listą RCKiK
- Paginacja
- Przyciski akcji (Dodaj nowy)
- Modale (formularz edycji/dodawania, potwierdzenie usunięcia)

**Obsługiwane interakcje:**
- Ładowanie listy RCKiK z API (`GET /api/v1/admin/rckik`)
- Filtrowanie po nazwie, mieście, statusie aktywności
- Sortowanie kolumn (nazwa, kod, miasto)
- Otwieranie modala dodawania/edycji
- Otwieranie modala potwierdzenia usunięcia
- Obsługa paginacji

**Obsługiwana walidacja:**
- Sprawdzenie roli administratora (middleware)
- Walidacja formularza przed wysłaniem
- Obsługa błędów API

**Typy:**
- `RckikDto` - pojedynczy RCKiK
- `RckikListResponse` - odpowiedź z paginacją
- `CreateRckikRequest` - request tworzenia
- `UpdateRckikRequest` - request aktualizacji
- `ErrorResponse` - odpowiedzi błędów
- `ManagementState` (ViewModel) - stan lokalny kontenera

**Propsy:**
- `initialData?: RckikListResponse` - dane SSR (opcjonalnie)
- `userRole: string` - rola użytkownika z middleware

---

### RckikFiltersBar
**Opis:** Panel filtrów umożliwiający wyszukiwanie i filtrowanie listy RCKiK.

**Główne elementy:**
- `SearchInput` - wyszukiwarka po nazwie (debounce 300ms)
- `CityFilter` - dropdown z listą miast
- `StatusFilter` - dropdown: Wszystkie / Aktywne / Nieaktywne
- `ClearFiltersButton` - przycisk resetowania filtrów

**Obsługiwane interakcje:**
- Wpisywanie w search (debounced)
- Zmiana filtru miasta
- Zmiana filtru statusu
- Resetowanie wszystkich filtrów

**Obsługiwana walidacja:**
- Brak specyficznej walidacji (filtry opcjonalne)

**Typy:**
- `FilterState` (ViewModel):
  ```typescript
  interface FilterState {
    search: string;
    city: string | null;
    active: boolean | null;
  }
  ```

**Propsy:**
```typescript
interface RckikFiltersBarProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  availableCities: string[];
}
```

---

### RckikTable
**Opis:** Tabela wyświetlająca listę centrów RCKiK z możliwością sortowania i akcjami.

**Główne elementy:**
- Nagłówki kolumn (sortowalne): Nazwa, Kod, Miasto, Status, Ostatnia aktualizacja, Akcje
- Wiersze z danymi RCKiK
- Loading skeleton podczas ładowania
- Empty state gdy brak wyników

**Obsługiwane interakcje:**
- Kliknięcie nagłówka kolumny → sortowanie
- Kliknięcie przycisku edycji → otwarcie modala edycji
- Kliknięcie przycisku usunięcia → otwarcie modala potwierdzenia
- Kliknięcie wiersza → przejście do szczegółów (opcjonalnie)

**Obsługiwana walidacja:**
- Brak (tylko wyświetlanie danych)

**Typy:**
- `RckikDto[]` - lista centrów
- `SortConfig` (ViewModel):
  ```typescript
  interface SortConfig {
    field: 'name' | 'code' | 'city' | 'updatedAt';
    order: 'ASC' | 'DESC';
  }
  ```

**Propsy:**
```typescript
interface RckikTableProps {
  data: RckikDto[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSortChange: (field: string) => void;
  onEdit: (rckik: RckikDto) => void;
  onDelete: (rckik: RckikDto) => void;
}
```

---

### RckikForm
**Opis:** Formularz do dodawania nowego lub edycji istniejącego centrum RCKiK.

**Główne elementy:**
- Sekcja informacji podstawowych (nazwa, kod, miasto)
- Sekcja lokalizacji (adres, współrzędne GPS)
- Sekcja aliasów (dynamiczna lista alternatywnych nazw)
- Sekcja statusu (checkbox aktywności)
- Przyciski akcji (Zapisz, Anuluj)

**Obsługiwane interakcje:**
- Wypełnianie pól formularza
- Dodawanie/usuwanie aliasów
- Walidacja inline (błędy pod polami)
- Submisja formularza (POST lub PUT)
- Anulowanie (zamknięcie modala)

**Obsługiwana walidacja:**
Zgodnie z API Plan i DTO:

**Pole `name` (Nazwa):**
- Wymagane: Tak
- Max długość: 255 znaków
- Błąd: "Nazwa jest wymagana" / "Nazwa nie może przekraczać 255 znaków"

**Pole `code` (Kod):**
- Wymagane: Tak
- Max długość: 50 znaków
- Format: Wielkie litery, cyfry, myślniki
- Unikalność: Musi być unikalny (walidacja po stronie API)
- Błąd: "Kod jest wymagany" / "Kod nie może przekraczać 50 znaków" / "Kod już istnieje"

**Pole `city` (Miasto):**
- Wymagane: Tak
- Max długość: 100 znaków
- Błąd: "Miasto jest wymagane" / "Miasto nie może przekraczać 100 znaków"

**Pole `address` (Adres):**
- Wymagane: Nie
- Max długość: 1000 znaków
- Błąd: "Adres nie może przekraczać 1000 znaków"

**Pole `latitude` (Szerokość geograficzna):**
- Wymagane: Nie
- Format: Liczba dziesiętna NUMERIC(9,6)
- Zakres: -90 do 90
- Błąd: "Szerokość geograficzna musi być w zakresie od -90 do 90"

**Pole `longitude` (Długość geograficzna):**
- Wymagane: Nie
- Format: Liczba dziesiętna NUMERIC(9,6)
- Zakres: -180 do 180
- Błąd: "Długość geograficzna musi być w zakresie od -180 do 180"

**Pole `aliases` (Aliasy):**
- Wymagane: Nie
- Format: Tablica stringów
- Max długość każdego aliasu: 255 znaków
- Błąd: "Każdy alias nie może przekraczać 255 znaków"

**Pole `active` (Aktywne):**
- Wymagane: Nie
- Format: Boolean
- Domyślna wartość: true

**Typy:**
- `CreateRckikRequest` - dla tworzenia
- `UpdateRckikRequest` - dla edycji
- `RckikDto` - dane istniejącego RCKiK
- `FormErrors` (ViewModel):
  ```typescript
  interface FormErrors {
    name?: string;
    code?: string;
    city?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    aliases?: string[];
  }
  ```

**Propsy:**
```typescript
interface RckikFormProps {
  mode: 'create' | 'edit';
  initialData?: RckikDto;
  onSubmit: (data: CreateRckikRequest | UpdateRckikRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}
```

---

### ConfirmDeleteModal
**Opis:** Modal potwierdzenia dezaktywacji/usunięcia centrum RCKiK.

**Główne elementy:**
- Tytuł: "Potwierdź dezaktywację"
- Komunikat ostrzegawczy z nazwą centrum
- Informacja o konsekwencjach (centrum będzie nieaktywne, nie usunie danych historycznych)
- Przyciski: "Potwierdź" (czerwony), "Anuluj"

**Obsługiwane interakcje:**
- Kliknięcie "Potwierdź" → wywołanie DELETE/PATCH na API
- Kliknięcie "Anuluj" → zamknięcie modala
- Kliknięcie poza modalem → zamknięcie (opcjonalnie)
- ESC → zamknięcie

**Obsługiwana walidacja:**
- Brak (tylko potwierdzenie)

**Typy:**
- `RckikDto` - centrum do usunięcia

**Propsy:**
```typescript
interface ConfirmDeleteModalProps {
  rckik: RckikDto;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}
```

## 5. Typy

### DTO (z backendu)

```typescript
// backend/src/main/java/pl/mkrew/backend/dto/RckikDto.java
interface RckikDto {
  id: number;
  name: string;
  code: string;
  city: string;
  address: string | null;
  latitude: string | null; // BigDecimal jako string
  longitude: string | null; // BigDecimal jako string
  aliases: string[] | null;
  active: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// CreateRckikRequest
interface CreateRckikRequest {
  name: string;
  code: string;
  city: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  aliases?: string[];
  active?: boolean; // default: true
}

// UpdateRckikRequest
interface UpdateRckikRequest {
  name: string;
  code: string;
  city: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  aliases?: string[];
  active?: boolean;
}

// RckikListResponse (z paginacją)
interface RckikListResponse {
  content: RckikDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ErrorResponse
interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

// AuditLogDto (dla informacji o auditach)
interface AuditLogDto {
  id: number;
  actorId: string;
  action: string; // np. "RCKIK_CREATED", "RCKIK_UPDATED", "RCKIK_DELETED"
  targetType: string; // "rckik"
  targetId: number;
  metadata: Record<string, any>; // JSON
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
```

### ViewModels (frontend)

```typescript
// Stan zarządzania widokiem
interface ManagementState {
  rckikList: RckikDto[];
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  sort: SortConfig;
  pagination: PaginationState;
  modalState: ModalState;
}

// Stan filtrów
interface FilterState {
  search: string;
  city: string | null;
  active: boolean | null; // null = wszystkie, true = aktywne, false = nieaktywne
}

// Konfiguracja sortowania
interface SortConfig {
  field: 'name' | 'code' | 'city' | 'updatedAt';
  order: 'ASC' | 'DESC';
}

// Stan paginacji
interface PaginationState {
  currentPage: number; // zero-based
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

// Stan modali
interface ModalState {
  type: 'none' | 'create' | 'edit' | 'delete';
  data: RckikDto | null;
  isSubmitting: boolean;
}

// Błędy formularza
interface FormErrors {
  name?: string;
  code?: string;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  aliases?: string[];
  general?: string;
}
```

## 6. Zarządzanie stanem

### Redux Toolkit Slice: `rckikAdminSlice`

**Ścieżka:** `src/lib/store/slices/rckikAdminSlice.ts`

**Stan początkowy:**
```typescript
interface RckikAdminState {
  rckikList: RckikDto[];
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  sort: SortConfig;
  pagination: PaginationState;
  modalState: ModalState;
  lastFetchTime: number | null;
}

const initialState: RckikAdminState = {
  rckikList: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    city: null,
    active: null,
  },
  sort: {
    field: 'name',
    order: 'ASC',
  },
  pagination: {
    currentPage: 0,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0,
  },
  modalState: {
    type: 'none',
    data: null,
    isSubmitting: false,
  },
  lastFetchTime: null,
};
```

**Actions (async thunks):**
1. `fetchRckikList` - pobieranie listy z API
2. `createRckik` - tworzenie nowego centrum
3. `updateRckik` - aktualizacja istniejącego
4. `deleteRckik` - dezaktywacja centrum (soft delete / active=false)

**Reducers:**
- `setFilters` - aktualizacja filtrów
- `setSort` - aktualizacja sortowania
- `setPage` - zmiana strony
- `openCreateModal` - otwarcie modala tworzenia
- `openEditModal` - otwarcie modala edycji
- `openDeleteModal` - otwarcie modala usuwania
- `closeModal` - zamknięcie modala
- `clearError` - wyczyszczenie błędu

**Selektory:**
- `selectRckikList` - lista RCKiK
- `selectIsLoading` - status ładowania
- `selectError` - błąd
- `selectFilters` - filtry
- `selectSort` - sortowanie
- `selectPagination` - paginacja
- `selectModalState` - stan modali

### Custom Hook: `useRckikManagement`

**Ścieżka:** `src/lib/hooks/useRckikManagement.ts`

**Odpowiedzialność:**
- Enkapsulacja logiki zarządzania RCKiK
- Dispatch akcji Redux
- Obsługa side effects (toasty, optymistic updates)
- Walidacja formularzy

**API:**
```typescript
interface UseRckikManagementReturn {
  // Stan
  rckikList: RckikDto[];
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  sort: SortConfig;
  pagination: PaginationState;
  modalState: ModalState;

  // Akcje
  fetchRckikList: () => Promise<void>;
  setFilters: (filters: FilterState) => void;
  setSort: (field: string) => void;
  setPage: (page: number) => void;

  // Operacje CRUD
  createRckik: (data: CreateRckikRequest) => Promise<void>;
  updateRckik: (id: number, data: UpdateRckikRequest) => Promise<void>;
  deleteRckik: (id: number) => Promise<void>;

  // Modale
  openCreateModal: () => void;
  openEditModal: (rckik: RckikDto) => void;
  openDeleteModal: (rckik: RckikDto) => void;
  closeModal: () => void;

  // Utilitki
  clearError: () => void;
}
```

## 7. Integracja API

### Endpointy

**Lista RCKiK (GET):**
```typescript
GET /api/v1/admin/rckik
Query params:
  - page?: number (default: 0)
  - size?: number (default: 20)
  - city?: string
  - active?: boolean
  - sortBy?: string (default: "name")
  - sortOrder?: "ASC" | "DESC" (default: "ASC")

Request Headers:
  Authorization: Bearer <JWT_TOKEN>

Response 200 OK:
  Body: RckikListResponse

Response 401 Unauthorized:
  Body: ErrorResponse { error: "UNAUTHORIZED", message: "Authentication required" }

Response 403 Forbidden:
  Body: ErrorResponse { error: "FORBIDDEN", message: "Admin role required" }
```

**Tworzenie RCKiK (POST):**
```typescript
POST /api/v1/admin/rckik
Request Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Request Body: CreateRckikRequest

Response 201 Created:
  Body: RckikDto

Response 400 Bad Request:
  Body: ErrorResponse {
    error: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: ValidationError[]
  }

Response 409 Conflict:
  Body: ErrorResponse {
    error: "DUPLICATE_CODE",
    message: "RCKiK code already exists"
  }
```

**Aktualizacja RCKiK (PUT):**
```typescript
PUT /api/v1/admin/rckik/{id}
Path params:
  - id: number

Request Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Request Body: UpdateRckikRequest

Response 200 OK:
  Body: RckikDto

Response 404 Not Found:
  Body: ErrorResponse { error: "NOT_FOUND", message: "RCKiK not found" }
```

**Usuwanie RCKiK (DELETE):**
```typescript
DELETE /api/v1/admin/rckik/{id}
Path params:
  - id: number

Request Headers:
  Authorization: Bearer <JWT_TOKEN>

Response 204 No Content

Response 404 Not Found:
  Body: ErrorResponse { error: "NOT_FOUND", message: "RCKiK not found" }

Response 409 Conflict:
  Body: ErrorResponse {
    error: "CANNOT_DELETE",
    message: "Cannot delete RCKiK with associated blood snapshots"
  }
```

### Implementacja API Client

**Ścieżka:** `src/lib/api/endpoints/admin.ts`

```typescript
import { apiClient } from '../client';
import type {
  RckikDto,
  RckikListResponse,
  CreateRckikRequest,
  UpdateRckikRequest,
} from '../types';

export const adminRckikApi = {
  // Lista RCKiK
  list: async (params?: {
    page?: number;
    size?: number;
    city?: string;
    active?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<RckikListResponse> => {
    const response = await apiClient.get<RckikListResponse>('/admin/rckik', {
      params,
    });
    return response.data;
  },

  // Pobranie szczegółów
  getById: async (id: number): Promise<RckikDto> => {
    const response = await apiClient.get<RckikDto>(`/admin/rckik/${id}`);
    return response.data;
  },

  // Tworzenie
  create: async (data: CreateRckikRequest): Promise<RckikDto> => {
    const response = await apiClient.post<RckikDto>('/admin/rckik', data);
    return response.data;
  },

  // Aktualizacja
  update: async (id: number, data: UpdateRckikRequest): Promise<RckikDto> => {
    const response = await apiClient.put<RckikDto>(`/admin/rckik/${id}`, data);
    return response.data;
  },

  // Usuwanie
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/rckik/${id}`);
  },
};
```

## 8. Interakcje użytkownika

### Scenariusz 1: Przeglądanie listy RCKiK
1. Admin loguje się i nawiguje do `/admin/rckik`
2. Widok ładuje się (SSR z AdminLayout)
3. `RckikManagementContainer` wykonuje `fetchRckikList()` (client-side)
4. API zwraca listę RCKiK z paginacją
5. Tabela wyświetla dane z loadingiem podczas pobierania
6. Admin może:
   - Przewijać strony (pagination)
   - Sortować po kolumnach (kliknięcie nagłówka)
   - Filtrować po nazwie, mieście, statusie

### Scenariusz 2: Wyszukiwanie centrum
1. Admin wpisuje tekst w pole wyszukiwania (np. "Warszawa")
2. Debounce (300ms) czeka na zakończenie wpisywania
3. Hook `useRckikManagement` wywołuje `setFilters({ search: "Warszawa" })`
4. Redux aktualizuje stan filtrów
5. UseEffect w komponencie wykrywa zmianę i wywołuje `fetchRckikList()`
6. API zwraca przefiltrowane wyniki
7. Tabela odświeża się z nowymi danymi

### Scenariusz 3: Dodawanie nowego centrum
1. Admin klika przycisk "Dodaj nowe centrum"
2. `openCreateModal()` → modalState zmienia się na `{ type: 'create', data: null }`
3. `RckikFormModal` renderuje się z trybem `mode="create"`
4. Admin wypełnia formularz:
   - Nazwa: "RCKiK Gdańsk"
   - Kod: "RCKIK-GDA"
   - Miasto: "Gdańsk"
   - Adres: "ul. Przykładowa 10"
   - Współrzędne (opcjonalne)
   - Aliasy (opcjonalne)
5. Walidacja inline pokazuje błędy na bieżąco
6. Admin klika "Zapisz"
7. `createRckik()` wysyła POST do `/api/v1/admin/rckik`
8. Jeśli sukces:
   - Toast: "Centrum zostało dodane pomyślnie"
   - Modal zamyka się
   - Lista odświeża się (nowe centrum widoczne)
   - Audit log tworzy wpis (RCKIK_CREATED)
9. Jeśli błąd (np. kod już istnieje):
   - Toast: "Błąd: Kod już istnieje"
   - Formularz pozostaje otwarty z błędem pod polem

### Scenariusz 4: Edycja istniejącego centrum
1. Admin klika przycisk "Edytuj" przy wybranym centrum
2. `openEditModal(rckik)` → modalState: `{ type: 'edit', data: rckik }`
3. `RckikFormModal` renderuje się z `mode="edit"` i `initialData=rckik`
4. Formularz wypełnia się danymi centrum
5. Admin modyfikuje pole (np. adres)
6. Klika "Zapisz"
7. `updateRckik(id, data)` wysyła PUT do `/api/v1/admin/rckik/{id}`
8. Jeśli sukces:
   - Toast: "Centrum zostało zaktualizowane"
   - Modal zamyka się
   - Lista odświeża się (zmiany widoczne)
   - Audit log: RCKIK_UPDATED
9. Jeśli błąd:
   - Toast z komunikatem błędu
   - Formularz pozostaje otwarty

### Scenariusz 5: Dezaktywacja centrum
1. Admin klika przycisk "Usuń" przy wybranym centrum
2. `openDeleteModal(rckik)` → modalState: `{ type: 'delete', data: rckik }`
3. `ConfirmDeleteModal` wyświetla komunikat:
   - "Czy na pewno chcesz dezaktywować centrum {nazwa}?"
   - "Centrum zostanie oznaczone jako nieaktywne, ale dane historyczne zostaną zachowane."
4. Admin klika "Potwierdź"
5. `deleteRckik(id)` wysyła DELETE do `/api/v1/admin/rckik/{id}`
6. Backend:
   - Soft delete: `active=false` lub `deleted_at=NOW()`
   - Audit log: RCKIK_DELETED
7. Jeśli sukces:
   - Toast: "Centrum zostało dezaktywowane"
   - Modal zamyka się
   - Lista odświeża się (centrum oznaczone jako nieaktywne lub ukryte)
8. Jeśli błąd (np. centrum ma powiązane snapshoty):
   - Toast: "Nie można usunąć centrum z historycznymi danymi"
   - Modal pozostaje otwarty

### Scenariusz 6: Sortowanie
1. Admin klika nagłówek kolumny "Miasto"
2. `setSort('city')` aktualizuje stan sortowania
3. Jeśli poprzednio sortowano po mieście ASC → zmienia na DESC
4. Jeśli sortowano po innym polu → ustawia city ASC
5. `fetchRckikList()` pobiera dane z nowymi parametrami `sortBy=city&sortOrder=DESC`
6. Tabela odświeża się z posortowanymi danymi

### Scenariusz 7: Filtrowanie po statusie
1. Admin wybiera z dropdown "Statusu" opcję "Tylko nieaktywne"
2. `setFilters({ active: false })` aktualizuje stan
3. `fetchRckikList()` z parametrem `active=false`
4. API zwraca tylko nieaktywne centra
5. Tabela wyświetla przefiltrowane wyniki

## 9. Warunki i walidacja

### Walidacja po stronie API (backend)
Backend sprawdza wszystkie warunki zgodnie z `CreateRckikRequest` i `UpdateRckikRequest`:

**Warunki sprawdzane przez API:**
1. **Unikalność kodu** (`code`):
   - Kod musi być unikalny w całej tabeli `rckik`
   - Przy próbie utworzenia/aktualizacji z istniejącym kodem → 409 Conflict

2. **Długości pól:**
   - `name`: max 255 znaków
   - `code`: max 50 znaków
   - `city`: max 100 znaków
   - `address`: max 1000 znaków
   - `aliases[]`: każdy alias max 255 znaków

3. **Zakres współrzędnych:**
   - `latitude`: -90 do 90
   - `longitude`: -180 do 180

4. **Format kodu:**
   - Wielkie litery, cyfry, myślniki (regex)

5. **Pola wymagane:**
   - `name`, `code`, `city` muszą być niepuste

6. **Integralność referencyjna:**
   - Nie można hard delete centrum z powiązanymi `blood_snapshots`
   - Soft delete zalecany (`active=false`)

### Walidacja po stronie frontend

**Komponent:** `RckikForm`

**Warunki sprawdzane przed submisją:**

1. **Pola wymagane:**
   - Nazwa nie może być pusta
   - Kod nie może być pusty
   - Miasto nie może być puste

2. **Długość pól:**
   - Inline walidacja podczas wpisywania
   - Licznik znaków pod polami długich (np. adres 0/1000)

3. **Format współrzędnych:**
   - Sprawdzenie czy wartość jest liczbą
   - Sprawdzenie zakresu przed wysłaniem

4. **Unikalność kodu:**
   - Walidowana po stronie API
   - Frontend wyświetla błąd z API w formularzu

**Stan walidacji w komponencie:**

```typescript
const [errors, setErrors] = useState<FormErrors>({});

const validateForm = (data: CreateRckikRequest | UpdateRckikRequest): boolean => {
  const newErrors: FormErrors = {};

  // Nazwa
  if (!data.name || data.name.trim() === '') {
    newErrors.name = 'Nazwa jest wymagana';
  } else if (data.name.length > 255) {
    newErrors.name = 'Nazwa nie może przekraczać 255 znaków';
  }

  // Kod
  if (!data.code || data.code.trim() === '') {
    newErrors.code = 'Kod jest wymagany';
  } else if (data.code.length > 50) {
    newErrors.code = 'Kod nie może przekraczać 50 znaków';
  }

  // Miasto
  if (!data.city || data.city.trim() === '') {
    newErrors.city = 'Miasto jest wymagane';
  } else if (data.city.length > 100) {
    newErrors.city = 'Miasto nie może przekraczać 100 znaków';
  }

  // Adres (opcjonalny)
  if (data.address && data.address.length > 1000) {
    newErrors.address = 'Adres nie może przekraczać 1000 znaków';
  }

  // Szerokość geograficzna (opcjonalna)
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = parseFloat(data.latitude);
    if (isNaN(lat)) {
      newErrors.latitude = 'Nieprawidłowy format współrzędnej';
    } else if (lat < -90 || lat > 90) {
      newErrors.latitude = 'Szerokość geograficzna musi być w zakresie od -90 do 90';
    }
  }

  // Długość geograficzna (opcjonalna)
  if (data.longitude !== undefined && data.longitude !== null) {
    const lon = parseFloat(data.longitude);
    if (isNaN(lon)) {
      newErrors.longitude = 'Nieprawidłowy format współrzędnej';
    } else if (lon < -180 || lon > 180) {
      newErrors.longitude = 'Długość geograficzna musi być w zakresie od -180 do 180';
    }
  }

  // Aliasy (opcjonalne)
  if (data.aliases && data.aliases.length > 0) {
    const aliasErrors: string[] = [];
    data.aliases.forEach((alias, index) => {
      if (alias.length > 255) {
        aliasErrors[index] = `Alias ${index + 1} nie może przekraczać 255 znaków`;
      }
    });
    if (aliasErrors.length > 0) {
      newErrors.aliases = aliasErrors;
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**Wpływ walidacji na UI:**

- **Pola z błędami:** czerwone obramowanie + komunikat pod polem
- **Przycisk "Zapisz":** disabled gdy walidacja nie przechodzi (opcjonalnie)
- **Inline feedback:** walidacja podczas opuszczania pola (onBlur)
- **Submit feedback:** pełna walidacja przed wysłaniem

**Obsługa błędów z API:**

Gdy API zwróci 400 Bad Request z `ErrorResponse.details[]`:
```typescript
// Przykład odpowiedzi API
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [
    { "field": "code", "message": "Code already exists", "rejectedValue": "RCKIK-WAW" }
  ]
}

// Frontend mapuje błędy na pola formularza
const mapApiErrorsToForm = (apiErrors: ValidationError[]): FormErrors => {
  const formErrors: FormErrors = {};
  apiErrors.forEach(err => {
    formErrors[err.field as keyof FormErrors] = err.message;
  });
  return formErrors;
};
```

## 10. Obsługa błędów

### Typy błędów i ich obsługa

#### 1. Błędy autentykacji i autoryzacji

**401 Unauthorized:**
- **Przyczyna:** Brak tokena JWT lub token wygasły
- **Obsługa:**
  - Interceptor Axios wykrywa 401
  - Próba odświeżenia tokena (refresh token flow)
  - Jeśli refresh fail → wylogowanie i redirect do `/login`
  - Toast: "Sesja wygasła. Proszę zalogować się ponownie."

**403 Forbidden:**
- **Przyczyna:** Token poprawny, ale użytkownik nie ma roli ADMIN
- **Obsługa:**
  - Middleware wykrywa brak roli (SSR)
  - Redirect do `/dashboard` z komunikatem
  - Toast: "Brak uprawnień do tej strony."
  - Client-side: ukrycie całego widoku i pokazanie komunikatu

**Implementacja interceptora:**
```typescript
// src/lib/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Próba refresh tokena
      try {
        await refreshAccessToken();
        // Powtórz żądanie
        return apiClient.request(error.config);
      } catch {
        // Wyloguj użytkownika
        store.dispatch(logout());
        window.location.href = '/login?session_expired=true';
      }
    }

    if (error.response?.status === 403) {
      showToast('Brak uprawnień do wykonania tej operacji', 'error');
    }

    return Promise.reject(error);
  }
);
```

#### 2. Błędy walidacji (400 Bad Request)

**Przyczyna:** Nieprawidłowe dane w formularzu

**Obsługa:**
- API zwraca `ErrorResponse` z `details[]`
- Frontend mapuje błędy na pola formularza
- Wyświetlenie komunikatów pod polami
- Toast: "Popraw błędy w formularzu"

**Przykład:**
```typescript
try {
  await adminRckikApi.create(formData);
  showToast('Centrum dodane pomyślnie', 'success');
  closeModal();
  fetchRckikList();
} catch (error) {
  if (error.response?.status === 400) {
    const apiErrors = error.response.data.details;
    const formErrors = mapApiErrorsToForm(apiErrors);
    setErrors(formErrors);
    showToast('Popraw błędy w formularzu', 'error');
  }
}
```

#### 3. Konflikt danych (409 Conflict)

**Przyczyna:** Kod RCKiK już istnieje w bazie

**Obsługa:**
- API zwraca 409 z komunikatem "RCKiK code already exists"
- Frontend wyświetla błąd pod polem "Kod"
- Toast: "Kod już istnieje. Wybierz inny kod."
- Formularz pozostaje otwarty
- Sugestia: Podpowiedź alternatywnego kodu (np. dodanie cyfry)

#### 4. Nie znaleziono zasobu (404 Not Found)

**Przyczyna:** Próba edycji/usunięcia nieistniejącego centrum

**Obsługa:**
- Toast: "Centrum nie zostało znalezione. Mogło zostać usunięte przez innego administratora."
- Zamknięcie modala
- Odświeżenie listy (`fetchRckikList()`)

**Możliwe scenariusze:**
- Admin A otwiera modal edycji centrum
- Admin B usuwa to centrum
- Admin A próbuje zapisać zmiany → 404
- Rollback do aktualnego stanu listy

#### 5. Ograniczenia integralności (409 Conflict przy usuwaniu)

**Przyczyna:** Centrum ma powiązane snapshoty krwi

**Obsługa:**
- API zwraca 409: "Cannot delete RCKiK with associated blood snapshots"
- Toast: "Nie można usunąć centrum z danymi historycznymi. Możesz dezaktywować centrum zamiast go usuwać."
- Modal pozostaje otwarty
- Opcja: Zmiana przycisku "Usuń" na "Dezaktywuj" (PATCH z `active=false`)

#### 6. Błędy sieciowe (Network Error, Timeout)

**Przyczyna:** Brak połączenia, timeout API

**Obsługa:**
- Toast: "Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie."
- Przycisk "Ponów" w toaście
- Opcja retry (exponential backoff)
- Offline banner na górze strony

**Implementacja retry:**
```typescript
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
};
```

#### 7. Błędy serwera (500 Internal Server Error)

**Przyczyna:** Błąd po stronie backendu

**Obsługa:**
- Toast: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- Logowanie błędu do konsoli (dev) / Sentry (prod)
- Nie ujawnianie szczegółów technicznych użytkownikowi
- Automatyczne retry po 5 sekundach (opcjonalnie)

#### 8. Rate limiting (429 Too Many Requests)

**Przyczyna:** Przekroczenie limitu żądań

**Obsługa:**
- API zwraca nagłówek `Retry-After: 60` (sekundy)
- Toast: "Zbyt wiele żądań. Spróbuj ponownie za 1 minutę."
- Countdown timer w toaście
- Blokada przycisków akcji na czas rate limit

### Obsługa błędów w komponencie

**RckikManagementContainer:**
```typescript
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);

  // Wyciągnij informacje o błędzie
  const status = error.response?.status;
  const errorData = error.response?.data as ErrorResponse;

  switch (status) {
    case 400:
      // Walidacja - obsługiwane w formularzu
      break;
    case 401:
      // Obsługiwane przez interceptor
      break;
    case 403:
      showToast('Brak uprawnień do tej operacji', 'error');
      break;
    case 404:
      showToast('Zasób nie został znaleziony', 'error');
      closeModal();
      fetchRckikList(); // Odśwież listę
      break;
    case 409:
      showToast(errorData?.message || 'Konflikt danych', 'error');
      break;
    case 429:
      const retryAfter = error.response?.headers['retry-after'] || 60;
      showToast(`Zbyt wiele żądań. Spróbuj za ${retryAfter}s`, 'error');
      break;
    case 500:
      showToast('Błąd serwera. Spróbuj ponownie później', 'error');
      break;
    default:
      if (error.message === 'Network Error') {
        showToast('Błąd połączenia. Sprawdź internet', 'error');
      } else {
        showToast('Wystąpił nieoczekiwany błąd', 'error');
      }
  }
};
```

### Error boundary

**Komponent:** `ErrorBoundary` (React)

**Cel:** Wychwycenie błędów renderowania komponentów

**Implementacja:**
```typescript
// src/components/common/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Log to Sentry
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Coś poszło nie tak</h2>
          <p>Spróbuj odświeżyć stronę</p>
          <button onClick={() => window.location.reload()}>
            Odśwież stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 11. Kroki implementacji

### Faza 1: Setup i infrastruktura (1-2 dni)

**Krok 1.1: Przygotowanie typów TypeScript**
- Utworzenie `src/lib/types/admin.ts`
- Definicja wszystkich DTO (RckikDto, CreateRckikRequest, UpdateRckikRequest, itp.)
- Definicja ViewModels (ManagementState, FilterState, SortConfig, itp.)
- Export typów

**Krok 1.2: Setup API client dla endpointów admin**
- Utworzenie `src/lib/api/endpoints/admin.ts`
- Implementacja funkcji: `list()`, `create()`, `update()`, `delete()`
- Konfiguracja interceptorów dla błędów 401/403
- Testy wywołań API (Postman/Insomnia)

**Krok 1.3: Utworzenie Redux slice**
- Utworzenie `src/lib/store/slices/rckikAdminSlice.ts`
- Definicja stanu początkowego
- Implementacja async thunks dla operacji CRUD
- Implementacja reducers dla filtrów, sortowania, modali
- Definicja selektorów
- Testy slice'a (Vitest)

**Krok 1.4: Utworzenie custom hook**
- Utworzenie `src/lib/hooks/useRckikManagement.ts`
- Enkapsulacja logiki Redux dispatch
- Obsługa side effects (toasty, optymistic updates)
- Funkcje walidacji formularza
- Testy hooka (React Testing Library)

**Acceptance Criteria:**
- ✅ Wszystkie typy zdefiniowane bez błędów TypeScript
- ✅ API client działa poprawnie (testy manualne z Postman)
- ✅ Redux slice przechodzi testy jednostkowe
- ✅ Custom hook zwraca poprawne wartości i akcje

---

### Faza 2: UI Primitives i komponenty podstawowe (2-3 dni)

**Krok 2.1: Utworzenie komponentów UI primitives (jeśli nie istnieją)**
- `Button` - warianty (primary, danger, ghost)
- `Input` - z obsługą błędów i labelek
- `Textarea` - dla adresu
- `Select` - dla filtrów
- `Checkbox` - dla statusu aktywności
- `Modal` - bazowy modal z focus trap
- `Toast` - dla powiadomień
- Testy accessibility (aria-labels, keyboard nav)

**Krok 2.2: Utworzenie AdminLayout**
- `src/layouts/AdminLayout.astro`
- Sidebar z nawigacją (RCKiK, Scraper, Raporty)
- Header z informacją o adminie
- Breadcrumbs
- Middleware auth check (rola ADMIN)
- Responsywność (mobile: hamburger menu)

**Krok 2.3: Utworzenie komponentów pomocniczych**
- `LoadingSkeleton` - placeholder dla tabeli
- `EmptyState` - gdy brak wyników
- `ErrorMessage` - wyświetlanie błędów
- `ConfirmModal` - reużywalny modal potwierdzenia

**Acceptance Criteria:**
- ✅ Wszystkie komponenty UI działają poprawnie
- ✅ AdminLayout renderuje się z poprawną nawigacją
- ✅ Komponenty spełniają WCAG 2.1 AA (kontrast, keyboard nav)
- ✅ Testy snapshot dla komponentów (Vitest)

---

### Faza 3: Główne komponenty widoku (3-4 dni)

**Krok 3.1: RckikFiltersBar**
- Utworzenie `src/components/admin/RckikFiltersBar.tsx`
- SearchInput z debounce (300ms)
- CityFilter (dropdown)
- StatusFilter (Wszystkie/Aktywne/Nieaktywne)
- ClearFiltersButton
- Połączenie z `useRckikManagement` hook
- Synchronizacja z query params (shareable URLs)
- Testy jednostkowe

**Krok 3.2: RckikTable**
- Utworzenie `src/components/admin/RckikTable.tsx`
- TableHeader z sortowalnymi kolumnami
- TableRow dla każdego RCKiK
- Kolumny: Nazwa, Kod, Miasto, Status, Ostatnia aktualizacja, Akcje
- Loading skeleton podczas ładowania
- Empty state gdy brak danych
- Obsługa kliknięć (sortowanie, akcje)
- Testy jednostkowe

**Krok 3.3: RckikTableRow i akcje**
- Utworzenie `src/components/admin/RckikTableRow.tsx`
- Przyciski akcji: Edytuj, Usuń
- Tooltip z dodatkową informacją (opcjonalnie)
- Disabled state gdy operacja w toku
- Testy interakcji

**Krok 3.4: Paginacja**
- Utworzenie `src/components/admin/RckikPagination.tsx`
- Przyciski: Poprzednia, Następna, numery stron
- Informacja: "Wyświetlanie 1-20 z 120"
- Dropdown z rozmiarem strony (20, 50, 100)
- Testy

**Acceptance Criteria:**
- ✅ Filtrowanie działa poprawnie (debounce, synchronizacja z API)
- ✅ Sortowanie aktualizuje tabelę
- ✅ Paginacja przełącza strony
- ✅ Wszystkie komponenty responsive (mobile/tablet/desktop)
- ✅ Keyboard navigation działa

---

### Faza 4: Formularz RCKiK (3-4 dni)

**Krok 4.1: RckikFormModal - struktura**
- Utworzenie `src/components/admin/RckikFormModal.tsx`
- Modal wrapper z overlay
- Header modala (tytuł zmienia się: "Dodaj centrum" / "Edytuj centrum")
- Close button (X) i obsługa ESC
- Footer z przyciskami akcji

**Krok 4.2: RckikForm - sekcja informacji podstawowych**
- Utworzenie `src/components/admin/RckikForm.tsx`
- Pola: Nazwa, Kod, Miasto
- Walidacja inline (onBlur)
- Komunikaty błędów pod polami
- Character count dla długich pól

**Krok 4.3: RckikForm - sekcja lokalizacji**
- Pola: Adres (textarea), Szerokość geo, Długość geo
- Walidacja współrzędnych (zakres, format)
- Opcjonalne: integracja z mapą (Leaflet) do wyboru punktu
- Tooltip z wyjaśnieniem formatu

**Krok 4.4: RckikForm - sekcja aliasów**
- Dynamiczna lista aliasów
- Przycisk "Dodaj alias"
- Przycisk "Usuń" przy każdym aliasie
- Walidacja długości każdego aliasu
- Max 10 aliasów (business rule)

**Krok 4.5: RckikForm - sekcja statusu**
- Checkbox "Aktywne"
- Tooltip z wyjaśnieniem (nieaktywne = ukryte dla użytkowników)
- Domyślnie zaznaczony dla nowych centrów

**Krok 4.6: RckikForm - obsługa submisji**
- Funkcja `validateForm()` przed wysłaniem
- Wywołanie `createRckik()` lub `updateRckik()`
- Loading state na przycisku "Zapisz"
- Obsługa błędów z API
- Mapowanie błędów API na pola formularza
- Zamknięcie modala po sukcesie

**Krok 4.7: Testy formularza**
- Testy walidacji (każde pole)
- Testy submisji (sukces i błędy)
- Testy trybu create vs edit
- Testy accessibility

**Acceptance Criteria:**
- ✅ Formularz działa w trybie create i edit
- ✅ Wszystkie walidacje działają poprawnie
- ✅ Błędy z API wyświetlane pod polami
- ✅ Optymistic updates (opcjonalnie)
- ✅ Loading states podczas submisji
- ✅ Formularz dostępny z klawiatury
- ✅ Testy pokrywają >80% kodu

---

### Faza 5: Modal usuwania i operacje CRUD (1-2 dni)

**Krok 5.1: ConfirmDeleteModal**
- Utworzenie `src/components/admin/ConfirmDeleteModal.tsx`
- Ostrzeżenie z nazwą centrum
- Wyjaśnienie konsekwencji (soft delete)
- Przyciski: Potwierdź (czerwony), Anuluj
- Loading state podczas usuwania
- Obsługa błędów (409 Conflict)

**Krok 5.2: Integracja operacji CRUD**
- Połączenie wszystkich komponentów w `RckikManagementContainer`
- Obsługa stanów modali (create/edit/delete)
- Toasty dla każdej operacji (sukces/błąd)
- Odświeżanie listy po operacji
- Optymistic updates dla szybszego UX

**Krok 5.3: Testy integracyjne operacji**
- Test: Dodanie nowego centrum (end-to-end w komponencie)
- Test: Edycja centrum
- Test: Usunięcie centrum
- Test: Obsługa błędów (409, 404)
- MSW mocks dla API

**Acceptance Criteria:**
- ✅ Wszystkie operacje CRUD działają
- ✅ Toasty wyświetlają się poprawnie
- ✅ Lista odświeża się po operacjach
- ✅ Obsługa wszystkich scenariuszy błędów
- ✅ Testy integracyjne przechodzą

---

### Faza 6: Strona główna i container (1-2 dni)

**Krok 6.1: Utworzenie strony Astro**
- Utworzenie `src/pages/admin/rckik.astro`
- Użycie `AdminLayout`
- SSR: sprawdzenie autentykacji i roli
- Opcjonalne: SSR fetch initial data
- Hydratacja `RckikManagementContainer` (client:load)

**Krok 6.2: RckikManagementContainer - integracja**
- Utworzenie `src/components/admin/RckikManagementContainer.tsx`
- Połączenie wszystkich komponentów:
  - RckikFiltersBar
  - RckikTable
  - RckikPagination
  - CreateButton
  - RckikFormModal
  - ConfirmDeleteModal
- Integracja z `useRckikManagement` hook
- UseEffect do initial fetch

**Krok 6.3: Routing i navigation**
- Link w AdminSidebar do `/admin/rckik`
- Breadcrumbs: Home > Admin > Zarządzanie RCKiK
- Active state w nawigacji

**Krok 6.4: Query params sync**
- Synchronizacja filtrów z URL query params
- Shareable URLs (np. `/admin/rckik?city=Warszawa&active=true`)
- Back button browser działa poprawnie

**Acceptance Criteria:**
- ✅ Strona renderuje się poprawnie
- ✅ SSR sprawdza autentykację
- ✅ Komponenty hydratują się na kliencie
- ✅ Wszystkie interakcje działają
- ✅ Query params synchronizowane

---

### Faza 7: Polishing i accessibility (2-3 dni)

**Krok 7.1: Accessibility audit**
- Sprawdzenie WCAG 2.1 AA (axe DevTools)
- Kontrast kolorów (min 4.5:1)
- Aria-labels dla wszystkich interaktywnych elementów
- Keyboard navigation (Tab, Enter, ESC)
- Focus trap w modalach
- Screen reader testing

**Krok 7.2: Responsywność**
- Mobile (375px): collapse filtrów do drawer
- Tablet (768px): 2-kolumnowy layout
- Desktop (1024px+): pełna tabela
- Touch targets min 44x44px (mobile)
- Sticky header tabeli (opcjonalnie)

**Krok 7.3: Loading states i skeletons**
- Skeleton loader dla tabeli podczas fetchowania
- Loading spinner w przyciskach podczas submisji
- Disabled state dla akcji gdy operacja w toku
- Debounce indicators (np. ikona w search)

**Krok 7.4: Error states**
- Empty state z ilustracją i CTA
- Error boundary dla błędów renderowania
- Retry buttons w komunikatach błędów
- Offline banner (opcjonalnie)

**Krok 7.5: Performance optimization**
- React.memo dla komponentów które nie muszą się re-renderować
- useMemo dla ciężkich obliczeń
- useCallback dla event handlers
- Virtualized list jeśli >100 elementów (react-window)
- Bundle size analysis (Vite bundle analyzer)

**Krok 7.6: UX improvements**
- Confirm przed zamknięciem modala z niezapisanymi zmianami
- Auto-save draft w sessionStorage (opcjonalnie)
- Animations (Framer Motion): fade in/out modali
- Focus management: po zamknięciu modala focus wraca do przycisku

**Acceptance Criteria:**
- ✅ WCAG 2.1 AA compliance (0 critical issues w axe)
- ✅ Responsive na wszystkich breakpointach
- ✅ Loading states dla wszystkich async operacji
- ✅ Performance: First Contentful Paint <2s
- ✅ Bundle size <500KB (dla strony admin)

---

### Faza 8: Testing (2-3 dni)

**Krok 8.1: Unit tests**
- Testy wszystkich komponentów (React Testing Library)
- Testy Redux slice (actions, reducers, selectors)
- Testy custom hooks
- Testy utility functions (walidacja)
- Coverage >80%

**Krok 8.2: Integration tests**
- Testy operacji CRUD (z MSW mocks)
- Testy filtrowania i sortowania
- Testy paginacji
- Testy obsługi błędów

**Krok 8.3: E2E tests**
- Test: Admin loguje się i nawiguje do `/admin/rckik`
- Test: Admin dodaje nowe centrum (happy path)
- Test: Admin edytuje centrum
- Test: Admin usuwa centrum
- Test: Obsługa błędu 409 (duplicate code)
- Test: Filtrowanie i wyszukiwanie
- Playwright lub Cypress

**Krok 8.4: Manual testing**
- Testy na różnych przeglądarkach (Chrome, Firefox, Safari)
- Testy na urządzeniach mobilnych (iOS, Android)
- Testy z screen readerem (NVDA, VoiceOver)
- Testy ze zwolnionym internetem (Network throttling)

**Acceptance Criteria:**
- ✅ >80% code coverage (unit tests)
- ✅ Wszystkie integration tests przechodzą
- ✅ E2E testy dla kluczowych scenariuszy
- ✅ Manual tests bez krytycznych bugów

---

### Faza 9: Documentation i deployment (1-2 dni)

**Krok 9.1: Code documentation**
- JSDoc dla wszystkich publicznych funkcji
- Comments dla złożonej logiki
- README dla folderu komponentów admin
- Type documentation (TypeScript interfaces)

**Krok 9.2: User documentation**
- Instrukcja dla adminów (jak dodać centrum)
- Screenshots/GIFy kluczowych operacji
- FAQ (częste pytania)
- Troubleshooting guide

**Krok 9.3: Deployment preparation**
- Environment variables (.env.production)
- Build optimization (Vite config)
- Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
- Security headers (CSP, HSTS)

**Krok 9.4: Monitoring setup**
- Error tracking (Sentry)
- Analytics (Google Analytics / Plausible)
- Performance monitoring (Web Vitals)
- Audit log verification

**Krok 9.5: Deployment**
- Deploy do staging
- Smoke tests na staging
- User acceptance testing (UAT)
- Deploy do production
- Post-deployment verification

**Acceptance Criteria:**
- ✅ Kod udokumentowany
- ✅ User documentation dostępna
- ✅ Lighthouse scores: Performance >90, Accessibility >95
- ✅ Deployed to production bez błędów
- ✅ Monitoring działa poprawnie

---

### Podsumowanie timeline

**Szacowany czas:** 15-22 dni robocze (3-4 tygodnie)

**Breakdown:**
- Faza 1: Setup i infrastruktura → 1-2 dni
- Faza 2: UI Primitives → 2-3 dni
- Faza 3: Główne komponenty → 3-4 dni
- Faza 4: Formularz → 3-4 dni
- Faza 5: Operacje CRUD → 1-2 dni
- Faza 6: Strona główna → 1-2 dni
- Faza 7: Polishing → 2-3 dni
- Faza 8: Testing → 2-3 dni
- Faza 9: Deployment → 1-2 dni

**Priorytety:**
1. **P0 (MVP):** Fazy 1-6 - podstawowa funkcjonalność CRUD
2. **P1 (Quality):** Fazy 7-8 - accessibility, testing
3. **P2 (Nice to have):** Optymalizacje performance, advanced features

**Zalecenia:**
- Rozpocznij od Fazy 1 i 2 równolegle (setup backend + UI primitives)
- Testy pisz równolegle z implementacją (TDD approach)
- Code review po każdej fazie
- Daily standup dla synchronizacji
- Sprint review po każdym tygodniu

---

## Załączniki

### A. Przykładowy kod Redux Slice

```typescript
// src/lib/store/slices/rckikAdminSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminRckikApi } from '../../api/endpoints/admin';
import type { RckikDto, CreateRckikRequest, UpdateRckikRequest } from '../../types';

// Async thunks
export const fetchRckikList = createAsyncThunk(
  'rckikAdmin/fetchList',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { filters, sort, pagination } = state.rckikAdmin;

    const response = await adminRckikApi.list({
      page: pagination.currentPage,
      size: pagination.pageSize,
      city: filters.city || undefined,
      active: filters.active ?? undefined,
      sortBy: sort.field,
      sortOrder: sort.order,
    });

    return response;
  }
);

export const createRckik = createAsyncThunk(
  'rckikAdmin/create',
  async (data: CreateRckikRequest) => {
    const response = await adminRckikApi.create(data);
    return response;
  }
);

export const updateRckik = createAsyncThunk(
  'rckikAdmin/update',
  async ({ id, data }: { id: number; data: UpdateRckikRequest }) => {
    const response = await adminRckikApi.update(id, data);
    return response;
  }
);

export const deleteRckik = createAsyncThunk(
  'rckikAdmin/delete',
  async (id: number) => {
    await adminRckikApi.delete(id);
    return id;
  }
);

// Slice
const rckikAdminSlice = createSlice({
  name: 'rckikAdmin',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 0; // Reset page on filter change
    },
    setSort: (state, action: PayloadAction<string>) => {
      const field = action.payload as SortConfig['field'];
      if (state.sort.field === field) {
        // Toggle order
        state.sort.order = state.sort.order === 'ASC' ? 'DESC' : 'ASC';
      } else {
        state.sort.field = field;
        state.sort.order = 'ASC';
      }
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    openCreateModal: (state) => {
      state.modalState = { type: 'create', data: null, isSubmitting: false };
    },
    openEditModal: (state, action: PayloadAction<RckikDto>) => {
      state.modalState = { type: 'edit', data: action.payload, isSubmitting: false };
    },
    openDeleteModal: (state, action: PayloadAction<RckikDto>) => {
      state.modalState = { type: 'delete', data: action.payload, isSubmitting: false };
    },
    closeModal: (state) => {
      state.modalState = { type: 'none', data: null, isSubmitting: false };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch list
    builder.addCase(fetchRckikList.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRckikList.fulfilled, (state, action) => {
      state.isLoading = false;
      state.rckikList = action.payload.content;
      state.pagination = {
        currentPage: action.payload.page,
        pageSize: action.payload.size,
        totalPages: action.payload.totalPages,
        totalElements: action.payload.totalElements,
      };
      state.lastFetchTime = Date.now();
    });
    builder.addCase(fetchRckikList.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch RCKiK list';
    });

    // Create
    builder.addCase(createRckik.pending, (state) => {
      state.modalState.isSubmitting = true;
    });
    builder.addCase(createRckik.fulfilled, (state, action) => {
      state.modalState = { type: 'none', data: null, isSubmitting: false };
      // Optionally: optimistic update
      state.rckikList.unshift(action.payload);
    });
    builder.addCase(createRckik.rejected, (state, action) => {
      state.modalState.isSubmitting = false;
      state.error = action.error.message || 'Failed to create RCKiK';
    });

    // Update
    builder.addCase(updateRckik.pending, (state) => {
      state.modalState.isSubmitting = true;
    });
    builder.addCase(updateRckik.fulfilled, (state, action) => {
      state.modalState = { type: 'none', data: null, isSubmitting: false };
      // Update list
      const index = state.rckikList.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rckikList[index] = action.payload;
      }
    });
    builder.addCase(updateRckik.rejected, (state, action) => {
      state.modalState.isSubmitting = false;
      state.error = action.error.message || 'Failed to update RCKiK';
    });

    // Delete
    builder.addCase(deleteRckik.pending, (state) => {
      state.modalState.isSubmitting = true;
    });
    builder.addCase(deleteRckik.fulfilled, (state, action) => {
      state.modalState = { type: 'none', data: null, isSubmitting: false };
      // Remove from list
      state.rckikList = state.rckikList.filter(r => r.id !== action.payload);
    });
    builder.addCase(deleteRckik.rejected, (state, action) => {
      state.modalState.isSubmitting = false;
      state.error = action.error.message || 'Failed to delete RCKiK';
    });
  },
});

export const {
  setFilters,
  setSort,
  setPage,
  openCreateModal,
  openEditModal,
  openDeleteModal,
  closeModal,
  clearError,
} = rckikAdminSlice.actions;

export default rckikAdminSlice.reducer;
```

### B. Przykładowy kod walidacji Zod

```typescript
// src/lib/utils/validation.ts
import { z } from 'zod';

export const createRckikSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .max(255, 'Nazwa nie może przekraczać 255 znaków'),
  code: z
    .string()
    .min(1, 'Kod jest wymagany')
    .max(50, 'Kod nie może przekraczać 50 znaków')
    .regex(/^[A-Z0-9-]+$/, 'Kod może zawierać tylko wielkie litery, cyfry i myślniki'),
  city: z
    .string()
    .min(1, 'Miasto jest wymagane')
    .max(100, 'Miasto nie może przekraczać 100 znaków'),
  address: z
    .string()
    .max(1000, 'Adres nie może przekraczać 1000 znaków')
    .optional(),
  latitude: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= -90 && num <= 90;
    }, 'Szerokość geograficzna musi być w zakresie od -90 do 90')
    .optional(),
  longitude: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= -180 && num <= 180;
    }, 'Długość geograficzna musi być w zakresie od -180 do 180')
    .optional(),
  aliases: z
    .array(z.string().max(255, 'Alias nie może przekraczać 255 znaków'))
    .optional(),
  active: z.boolean().optional(),
});

export const updateRckikSchema = createRckikSchema;

export type CreateRckikFormData = z.infer<typeof createRckikSchema>;
export type UpdateRckikFormData = z.infer<typeof updateRckikSchema>;
```

### C. Checklist przed deployment

**Frontend:**
- [ ] Wszystkie typy TypeScript zdefiniowane bez błędów
- [ ] API client testowany i działający
- [ ] Redux slice działa poprawnie
- [ ] Wszystkie komponenty zaimplementowane
- [ ] Walidacja formularza działa
- [ ] Obsługa błędów API
- [ ] Loading states
- [ ] Empty states
- [ ] Error boundaries
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Responsywność (mobile/tablet/desktop)
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Bundle size <500KB

**Backend:**
- [ ] Endpointy API zaimplementowane
- [ ] Walidacja po stronie serwera
- [ ] Autoryzacja (role ADMIN)
- [ ] Audit logs dla operacji
- [ ] Rate limiting
- [ ] Error handling
- [ ] Database migrations
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Integration tests

**Deployment:**
- [ ] Environment variables skonfigurowane
- [ ] Build działa bez błędów
- [ ] Lighthouse audit >90
- [ ] Security headers (CSP, HSTS)
- [ ] Monitoring setup (Sentry, Analytics)
- [ ] Staging deployment i testy
- [ ] Production deployment
- [ ] Post-deployment smoke tests

---

**Koniec dokumentu**
