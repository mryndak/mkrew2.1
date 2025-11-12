# Plan implementacji widoku Donacje

## 1. Przegląd

Widok Donacje służy do kompleksowego zarządzania dziennikiem donacji krwi użytkownika. Umożliwia przeglądanie historii donacji, dodawanie nowych wpisów, edycję istniejących, usuwanie oraz eksport danych do formatów CSV i JSON. Widok zawiera również statystyki podsumowujące aktywność dawcy krwi (łączna liczba donacji, całkowita ilość oddanej krwi, data ostatniej donacji oraz informację o następnym możliwym terminie donacji).

Główne funkcjonalności:
- Przegląd tabelaryczny wszystkich donacji użytkownika z paginacją
- Filtrowanie donacji według zakresu dat, typu donacji i centrum RCKiK
- Sortowanie po różnych kolumnach (data, centrum, ilość, typ)
- Dodawanie nowej donacji przez formularz modalny
- Edycja istniejącej donacji
- Usuwanie donacji z potwierdzeniem
- Eksport danych do CSV/JSON
- Wyświetlanie statystyk w nagłówku widoku

## 2. Routing widoku

**Ścieżka:** `/dashboard/donations`

**Typ renderowania:** SSR + React islands (client:idle dla tabeli i formularza)

**Wymagania autoryzacji:**
- Wymaga uwierzytelnienia (JWT token)
- Rola: USER lub ADMIN
- Dostęp tylko do własnych donacji (weryfikacja po stronie API)

## 3. Struktura komponentów

```
DonationsPage (Astro)
├── DashboardLayout
│   ├── Navbar
│   ├── Sidebar
│   └── PageContent
│       ├── DonationsHeader
│       │   └── DonationStatisticsCards (4 karty statystyk)
│       ├── DonationsToolbar (client:load)
│       │   ├── FiltersBar
│       │   │   ├── DateRangePicker
│       │   │   ├── DonationTypeFilter (Select)
│       │   │   └── RckikFilter (Select)
│       │   ├── SearchBar (opcjonalnie dla RCKiK)
│       │   ├── SortControls
│       │   └── ExportDropdown
│       │       ├── ExportToCsvButton
│       │       └── ExportToJsonButton
│       ├── AddDonationButton
│       └── DonationTable (client:idle)
│           ├── TableHeader
│           ├── TableBody
│           │   └── DonationRow[] (dla każdej donacji)
│           │       ├── DonationData
│           │       └── ActionButtons
│           │           ├── EditButton
│           │           └── DeleteButton
│           ├── EmptyState (gdy brak donacji)
│           └── Pagination
├── DonationFormModal (client:load)
│   ├── ModalOverlay
│   ├── ModalContent
│   │   ├── ModalHeader
│   │   ├── DonationForm
│   │   │   ├── RckikSelect
│   │   │   ├── DateInput
│   │   │   ├── QuantityInput
│   │   │   ├── DonationTypeSelect
│   │   │   └── NotesTextarea
│   │   ├── ModalFooter
│   │   │   ├── CancelButton
│   │   │   └── SubmitButton
│   └── CloseButton
└── DeleteConfirmationModal (client:load)
    ├── ModalOverlay
    ├── ModalContent
    │   ├── WarningIcon
    │   ├── ConfirmationMessage
    │   └── ActionButtons
    │       ├── CancelButton
    │       └── ConfirmDeleteButton
```

## 4. Szczegóły komponentów

### DonationsPage (Astro)
**Opis:** Główna strona widoku donacji, renderowana po stronie serwera (SSR). Odpowiada za layout, autoryzację i inicjalizację danych.

**Główne elementy:**
- Layout `DashboardLayout.astro` jako wrapper
- Middleware autoryzacyjny sprawdzający JWT
- Prefetch początkowych danych donacji (pierwsza strona)
- Hydratacja komponentów React dla interaktywności

**Obsługiwane interakcje:** Brak (strona Astro SSR)

**Walidacja:** Weryfikacja tokenu JWT w middleware

**Typy:**
- Brak własnych typów (używa layoutu)

**Propsy:** Brak (strona Astro)

---

### DonationsHeader
**Opis:** Nagłówek widoku zawierający tytuł strony oraz cztery karty ze statystykami donacji użytkownika.

**Główne elementy:**
- `<h1>` z tytułem "Moje donacje"
- 4x `DonationStatisticsCard`:
  - Łączna liczba donacji
  - Łączna ilość oddanej krwi (ml)
  - Data ostatniej donacji
  - Następna możliwa donacja (obliczona: ostatnia + 56 dni)

**Obsługiwane interakcje:** Brak (statyczny widok)

**Walidacja:** Brak

**Typy:**
- `DonationStatisticsDto` (z API)

**Propsy:**
```typescript
interface DonationsHeaderProps {
  statistics: DonationStatisticsDto;
}
```

---

### DonationStatisticsCards
**Opis:** Zestaw czterech kart wyświetlających kluczowe statystyki donacji użytkownika.

**Główne elementy:**
- `StatsCard` (komponent UI primitive) x4
- Ikony reprezentujące każdą kategorię
- Wartości liczbowe i etykiety

**Obsługiwane interakcje:** Brak (statyczny widok)

**Walidacja:** Brak

**Typy:**
- `DonationStatisticsDto`

**Propsy:**
```typescript
interface DonationStatisticsCardsProps {
  totalDonations: number;
  totalQuantityMl: number;
  lastDonationDate: string | null; // ISO 8601
  nextEligibleDate: string | null; // obliczony: lastDonationDate + 56 dni
}
```

---

### DonationsToolbar (client:load)
**Opis:** Pasek narzędziowy zawierający filtry, sortowanie i opcje eksportu. Komponent React z hydratacją client:load.

**Główne elementy:**
- `FiltersBar` - panel z filtrami
- `SortControls` - dropdown sortowania
- `ExportDropdown` - opcje eksportu
- `Button` - "Dodaj donację"

**Obsługiwane interakcje:**
- Zmiana filtrów (zakres dat, typ donacji, RCKiK)
- Zmiana sortowania (data, RCKiK, ilość)
- Kliknięcie "Eksport do CSV/JSON"
- Kliknięcie "Dodaj donację" (otwiera modal)

**Walidacja:**
- Zakres dat: `fromDate <= toDate`
- Daty nie mogą być w przyszłości

**Typy:**
- `DonationFilters` (ViewModel)
- `SortOptions` (ViewModel)

**Propsy:**
```typescript
interface DonationsToolbarProps {
  onFilterChange: (filters: DonationFilters) => void;
  onSortChange: (sort: SortOptions) => void;
  onExport: (format: 'csv' | 'json') => void;
  onAddDonation: () => void;
  availableRckiks: RckikBasicDto[];
}
```

---

### FiltersBar
**Opis:** Panel filtrów do zawężania listy donacji według kryteriów. Komponent składowy `DonationsToolbar`.

**Główne elementy:**
- `DateRangePicker` - wybór zakresu dat (od-do)
- `Select` - filtr typu donacji (FULL_BLOOD, PLASMA, PLATELETS, OTHER, ALL)
- `Select` - filtr centrum RCKiK (lista ulubionych + "Wszystkie")
- `Button` - "Wyczyść filtry"

**Obsługiwane interakcje:**
- Wybór dat z kalendarza (od/do)
- Wybór typu donacji z listy rozwijanej
- Wybór centrum RCKiK z listy rozwijanej
- Kliknięcie "Wyczyść filtry" resetuje wszystkie filtry

**Walidacja:**
- `fromDate` <= `toDate`
- Daty w formacie ISO 8601
- Daty nie mogą być w przyszłości

**Typy:**
- `DonationFilters` (ViewModel)
- `RckikBasicDto[]`

**Propsy:**
```typescript
interface FiltersBarProps {
  filters: DonationFilters;
  onChange: (filters: DonationFilters) => void;
  availableRckiks: RckikBasicDto[];
}
```

---

### DateRangePicker
**Opis:** Komponent wyboru zakresu dat (od-do) dla filtrowania donacji.

**Główne elementy:**
- 2x `Input[type="date"]` (od, do)
- Etykiety "Od:" i "Do:"
- Ikona kalendarza

**Obsługiwane interakcje:**
- Wybór daty rozpoczęcia
- Wybór daty zakończenia
- Automatyczna korekta jeśli `fromDate > toDate`

**Walidacja:**
- `fromDate` <= `toDate`
- Daty nie mogą być w przyszłości (`max="today"`)

**Typy:**
- `string` (ISO 8601 date)

**Propsy:**
```typescript
interface DateRangePickerProps {
  fromDate: string | null;
  toDate: string | null;
  onChange: (from: string | null, to: string | null) => void;
}
```

---

### ExportDropdown
**Opis:** Menu rozwijane z opcjami eksportu danych donacji do CSV lub JSON.

**Główne elementy:**
- `Dropdown` (UI primitive)
- `Button` - trigger "Eksportuj"
- Menu items:
  - "Eksportuj do CSV"
  - "Eksportuj do JSON"

**Obsługiwane interakcje:**
- Kliknięcie "Eksportuj do CSV" → wywołanie API i pobranie pliku CSV
- Kliknięcie "Eksportuj do JSON" → wywołanie API i pobranie pliku JSON

**Walidacja:** Brak (akcja bezpośrednia)

**Typy:** Brak własnych

**Propsy:**
```typescript
interface ExportDropdownProps {
  onExport: (format: 'csv' | 'json') => void;
  isLoading?: boolean;
}
```

---

### DonationTable (client:idle)
**Opis:** Tabela wyświetlająca listę donacji użytkownika z możliwością sortowania, paginacji oraz akcji edycji i usuwania. Hydratacja client:idle dla optymalizacji wydajności.

**Główne elementy:**
- `<table>` z nagłówkiem i ciałem
- `TableHeader` - nagłówki kolumn z sortowaniem
- `TableBody` - wiersze donacji (`DonationRow[]`)
- `Pagination` - kontrolki paginacji
- `EmptyState` - wyświetlany gdy brak donacji
- `Skeleton` - placeholder podczas ładowania

**Obsługiwane interakcje:**
- Kliknięcie nagłówka kolumny → zmiana sortowania (ASC/DESC)
- Kliknięcie "Edytuj" na wierszu → otwarcie modala edycji
- Kliknięcie "Usuń" na wierszu → otwarcie modala potwierdzenia
- Nawigacja paginacją (poprzednia/następna strona, numer strony)

**Walidacja:** Brak (wyświetlanie danych)

**Typy:**
- `DonationListResponse` (z API)
- `DonationResponse[]`
- `PaginationMeta`

**Propsy:**
```typescript
interface DonationTableProps {
  donations: DonationResponse[];
  paginationMeta: PaginationMeta;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  isLoading: boolean;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (donation: DonationResponse) => void;
  onDelete: (donationId: number) => void;
}
```

---

### DonationRow
**Opis:** Pojedynczy wiersz tabeli reprezentujący jedną donację użytkownika.

**Główne elementy:**
- `<td>` z datą donacji (sformatowana)
- `<td>` z nazwą i miastem centrum RCKiK
- `<td>` z typem donacji (badge z kolorem)
- `<td>` z ilością ml
- `<td>` z ikoną potwierdzenia (jeśli confirmed=true)
- `<td>` z przyciskami akcji (Edytuj, Usuń)

**Obsługiwane interakcje:**
- Kliknięcie "Edytuj" → otwarcie modala edycji z danymi donacji
- Kliknięcie "Usuń" → otwarcie modala potwierdzenia usunięcia
- Hover na wierszu → podświetlenie

**Walidacja:** Brak (wyświetlanie danych)

**Typy:**
- `DonationResponse`

**Propsy:**
```typescript
interface DonationRowProps {
  donation: DonationResponse;
  onEdit: (donation: DonationResponse) => void;
  onDelete: (donationId: number) => void;
}
```

---

### Pagination
**Opis:** Kontrolki paginacji do nawigacji między stronami listy donacji.

**Główne elementy:**
- `Button` - "Poprzednia" (disabled na pierwszej stronie)
- Lista numerów stron (z aktywną stroną)
- `Button` - "Następna" (disabled na ostatniej stronie)
- Informacja "Strona X z Y"

**Obsługiwane interakcje:**
- Kliknięcie "Poprzednia" → przejście do strony page-1
- Kliknięcie "Następna" → przejście do strony page+1
- Kliknięcie numeru strony → przejście do konkretnej strony

**Walidacja:**
- `page >= 0`
- `page < totalPages`

**Typy:**
- `PaginationMeta` (ViewModel)

**Propsy:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}
```

---

### EmptyState
**Opis:** Komunikat wyświetlany gdy użytkownik nie ma żadnych donacji lub filtry nie zwróciły wyników.

**Główne elementy:**
- Ikona (pusty folder lub strzykawka)
- Nagłówek "Brak donacji"
- Opis tekstowy zależny od kontekstu:
  - Brak donacji w systemie: "Dodaj swoją pierwszą donację, aby śledzić historię"
  - Filtry bez wyników: "Nie znaleziono donacji spełniających kryteria. Spróbuj zmienić filtry."
- `Button` - CTA: "Dodaj pierwszą donację" lub "Wyczyść filtry"

**Obsługiwane interakcje:**
- Kliknięcie "Dodaj pierwszą donację" → otwarcie modala dodawania
- Kliknięcie "Wyczyść filtry" → reset filtrów

**Walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EmptyStateProps {
  hasFilters: boolean;
  onAddDonation?: () => void;
  onClearFilters?: () => void;
}
```

---

### DonationFormModal (client:load)
**Opis:** Modal z formularzem dodawania lub edycji donacji. Obsługuje zarówno tworzenie nowego wpisu jak i edycję istniejącego. Walidacja Zod + React Hook Form.

**Główne elementy:**
- `Modal` (UI primitive)
- `Form` z polami:
  - `Select` - wybór centrum RCKiK (lista wszystkich aktywnych centrów)
  - `Input[type="date"]` - data donacji
  - `Input[type="number"]` - ilość ml (50-1000)
  - `Select` - typ donacji (FULL_BLOOD, PLASMA, PLATELETS, OTHER)
  - `Textarea` - notatki (max 1000 znaków)
- Przycisk "Anuluj"
- Przycisk "Zapisz" / "Aktualizuj"
- Komunikaty walidacyjne inline

**Obsługiwane interakcje:**
- Wypełnienie formularza
- Walidacja inline podczas wpisywania
- Kliknięcie "Zapisz" → walidacja + wywołanie API POST/PATCH
- Kliknięcie "Anuluj" → zamknięcie modala bez zapisu
- ESC → zamknięcie modala
- Kliknięcie poza modalem → zamknięcie z potwierdzeniem jeśli są zmiany

**Walidacja:**
- `rckikId`: wymagane, musi istnieć w liście
- `donationDate`: wymagane, nie może być w przyszłości, nie starsze niż 5 lat
- `quantityMl`: wymagane, zakres 50-1000 ml
- `donationType`: wymagane, jedna z wartości: FULL_BLOOD, PLASMA, PLATELETS, OTHER
- `notes`: opcjonalne, max 1000 znaków
- **Warning (nie blokujący):** Jeśli od ostatniej donacji pełnej krwi minęło mniej niż 56 dni, wyświetl ostrzeżenie

**Typy:**
- `CreateDonationRequest` (dla dodawania)
- `UpdateDonationRequest` (dla edycji)
- `DonationResponse` (dla edycji - dane początkowe)
- `RckikBasicDto[]` (lista centrów)
- `DonationFormData` (ViewModel)

**Propsy:**
```typescript
interface DonationFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  donation?: DonationResponse; // dla edycji
  availableRckiks: RckikBasicDto[];
  onClose: () => void;
  onSubmit: (data: CreateDonationRequest | UpdateDonationRequest) => Promise<void>;
}
```

---

### DeleteConfirmationModal (client:load)
**Opis:** Modal potwierdzenia usunięcia donacji. Wymaga potwierdzenia krytycznej akcji.

**Główne elementy:**
- `Modal` (UI primitive)
- Ikona ostrzeżenia (czerwony trójkąt)
- Nagłówek "Potwierdź usunięcie"
- Komunikat: "Czy na pewno chcesz usunąć donację z dnia [data] w [RCKiK]? Tej akcji nie można cofnąć."
- Przycisk "Anuluj" (secondary)
- Przycisk "Usuń" (danger, primary)

**Obsługiwane interakcje:**
- Kliknięcie "Usuń" → wywołanie API DELETE + zamknięcie modala + odświeżenie listy
- Kliknięcie "Anuluj" → zamknięcie modala bez akcji
- ESC → zamknięcie bez akcji

**Walidacja:** Brak (akcja potwierdzona)

**Typy:**
- `DonationResponse` (szczegóły usuwane donacji)

**Propsy:**
```typescript
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  donation: DonationResponse;
  onClose: () => void;
  onConfirm: (donationId: number) => Promise<void>;
}
```

---

## 5. Typy

### Typy API (DTO - z backendu)

Typy DTO są zdefiniowane w backendzie i wykorzystywane w odpowiedziach API:

```typescript
// Odpowiedź API - lista donacji z paginacją i statystykami
interface DonationListResponse {
  donations: DonationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  statistics: DonationStatisticsDto;
}

// Pojedyncza donacja w odpowiedzi
interface DonationResponse {
  id: number;
  rckik: RckikBasicDto;
  donationDate: string; // ISO 8601 (LocalDate)
  quantityMl: number;
  donationType: DonationType;
  notes: string | null;
  confirmed: boolean;
  createdAt: string; // ISO 8601 (LocalDateTime)
  updatedAt: string; // ISO 8601 (LocalDateTime)
}

// Statystyki donacji użytkownika
interface DonationStatisticsDto {
  totalDonations: number;
  totalQuantityMl: number;
  lastDonationDate: string | null; // ISO 8601 (LocalDate)
}

// Podstawowe informacje o centrum RCKiK
interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}

// Request do tworzenia nowej donacji
interface CreateDonationRequest {
  rckikId: number;
  donationDate: string; // ISO 8601 (LocalDate)
  quantityMl: number;
  donationType: DonationType;
  notes?: string;
}

// Request do aktualizacji donacji (pola opcjonalne)
interface UpdateDonationRequest {
  quantityMl?: number;
  donationType?: DonationType;
  notes?: string;
}

// Dane eksportowane do CSV/JSON
interface DonationExportDto {
  donationDate: string; // ISO 8601
  rckikName: string;
  rckikCity: string;
  quantityMl: number;
  donationType: DonationType;
  notes: string | null;
  confirmed: boolean;
}

// Typ wyliczeniowy dla rodzaju donacji
type DonationType = 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
```

### Typy ViewModel (frontend)

Typy specyficzne dla frontendu, rozszerzające lub transformujące DTO API:

```typescript
// Parametry filtrowania donacji (stan komponentu)
interface DonationFilters {
  fromDate: string | null; // ISO 8601
  toDate: string | null; // ISO 8601
  rckikId: number | null; // null = wszystkie
  donationType: DonationType | 'ALL'; // 'ALL' = wszystkie typy
}

// Parametry sortowania
interface SortOptions {
  sortBy: 'donationDate' | 'rckikName' | 'quantityMl' | 'donationType';
  sortOrder: 'ASC' | 'DESC';
}

// Metadane paginacji (wyciągnięte z DonationListResponse)
interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;
}

// Rozszerzona statystyka z obliczonym "następnym możliwym terminem"
interface DonationStatisticsViewModel extends DonationStatisticsDto {
  nextEligibleDate: string | null; // obliczone: lastDonationDate + 56 dni
  daysSinceLastDonation: number | null; // obliczone: today - lastDonationDate
  daysUntilEligible: number | null; // obliczone: nextEligibleDate - today (lub 0 jeśli ujemne)
}

// Dane formularza donacji (wewnętrzny stan React Hook Form)
interface DonationFormData {
  rckikId: number;
  donationDate: string; // ISO 8601
  quantityMl: number;
  donationType: DonationType;
  notes: string;
}

// Stan modala
interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  donation: DonationResponse | null;
}

// Query params dla API
interface DonationsQueryParams {
  fromDate?: string;
  toDate?: string;
  rckikId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
```

### Typy pomocnicze

```typescript
// Format eksportu
type ExportFormat = 'csv' | 'json';

// Status operacji asynchronicznej
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

// Opcje typu donacji dla filtra (z "Wszystkie")
type DonationTypeFilterOption = DonationType | 'ALL';

// Etykiety dla typów donacji (do wyświetlenia)
const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  FULL_BLOOD: 'Krew pełna',
  PLASMA: 'Osocze',
  PLATELETS: 'Płytki krwi',
  OTHER: 'Inne',
};

// Kolory badge dla typów donacji
const DONATION_TYPE_COLORS: Record<DonationType, string> = {
  FULL_BLOOD: 'red',
  PLASMA: 'yellow',
  PLATELETS: 'blue',
  OTHER: 'gray',
};
```

## 6. Zarządzanie stanem

### Redux Toolkit Slice: `donationsSlice`

Widok Donacje wymaga dedykowanego slice w Redux Store do zarządzania stanem donacji, filtrów, paginacji oraz statusów ładowania.

**Stan początkowy:**
```typescript
interface DonationsState {
  // Lista donacji
  donations: DonationResponse[];

  // Metadane paginacji
  pagination: PaginationMeta;

  // Statystyki użytkownika
  statistics: DonationStatisticsViewModel | null;

  // Filtry
  filters: DonationFilters;

  // Sortowanie
  sort: SortOptions;

  // Statusy ładowania
  loadingStatus: AsyncStatus; // dla fetch donacji
  createStatus: AsyncStatus; // dla dodawania
  updateStatus: AsyncStatus; // dla edycji
  deleteStatus: AsyncStatus; // dla usuwania
  exportStatus: AsyncStatus; // dla eksportu

  // Błędy
  error: string | null;

  // Stan modali
  modalState: ModalState;
  deleteConfirmation: {
    isOpen: boolean;
    donation: DonationResponse | null;
  };
}

const initialState: DonationsState = {
  donations: [],
  pagination: {
    currentPage: 0,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0,
    isFirst: true,
    isLast: true,
  },
  statistics: null,
  filters: {
    fromDate: null,
    toDate: null,
    rckikId: null,
    donationType: 'ALL',
  },
  sort: {
    sortBy: 'donationDate',
    sortOrder: 'DESC',
  },
  loadingStatus: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  deleteStatus: 'idle',
  exportStatus: 'idle',
  error: null,
  modalState: {
    isOpen: false,
    mode: 'create',
    donation: null,
  },
  deleteConfirmation: {
    isOpen: false,
    donation: null,
  },
};
```

**Async Thunks (RTK Query lub createAsyncThunk):**

```typescript
// Pobranie listy donacji z API
export const fetchDonations = createAsyncThunk(
  'donations/fetchDonations',
  async (params: DonationsQueryParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<DonationListResponse>(
        '/api/v1/users/me/donations',
        { params }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Błąd pobierania donacji');
    }
  }
);

// Utworzenie nowej donacji
export const createDonation = createAsyncThunk(
  'donations/createDonation',
  async (data: CreateDonationRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<DonationResponse>(
        '/api/v1/users/me/donations',
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Błąd tworzenia donacji');
    }
  }
);

// Aktualizacja donacji
export const updateDonation = createAsyncThunk(
  'donations/updateDonation',
  async ({ id, data }: { id: number; data: UpdateDonationRequest }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<DonationResponse>(
        `/api/v1/users/me/donations/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Błąd aktualizacji donacji');
    }
  }
);

// Usunięcie donacji
export const deleteDonation = createAsyncThunk(
  'donations/deleteDonation',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/v1/users/me/donations/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Błąd usuwania donacji');
    }
  }
);

// Eksport donacji
export const exportDonations = createAsyncThunk(
  'donations/exportDonations',
  async ({ format, filters }: { format: ExportFormat; filters: DonationFilters }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/api/v1/users/me/donations/export`,
        {
          params: { format, ...filters },
          responseType: 'blob',
        }
      );

      // Pobieranie pliku
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `donations_export_${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Błąd eksportu donacji');
    }
  }
);
```

**Reducers (synchroniczne akcje):**

```typescript
const donationsSlice = createSlice({
  name: 'donations',
  initialState,
  reducers: {
    // Zmiana filtrów
    setFilters: (state, action: PayloadAction<Partial<DonationFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 0; // reset do pierwszej strony
    },

    // Reset filtrów
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 0;
    },

    // Zmiana sortowania
    setSort: (state, action: PayloadAction<SortOptions>) => {
      state.sort = action.payload;
      state.pagination.currentPage = 0;
    },

    // Zmiana strony
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },

    // Otwarcie modala dodawania
    openCreateModal: (state) => {
      state.modalState = {
        isOpen: true,
        mode: 'create',
        donation: null,
      };
    },

    // Otwarcie modala edycji
    openEditModal: (state, action: PayloadAction<DonationResponse>) => {
      state.modalState = {
        isOpen: true,
        mode: 'edit',
        donation: action.payload,
      };
    },

    // Zamknięcie modala
    closeModal: (state) => {
      state.modalState = initialState.modalState;
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
    },

    // Otwarcie potwierdzenia usunięcia
    openDeleteConfirmation: (state, action: PayloadAction<DonationResponse>) => {
      state.deleteConfirmation = {
        isOpen: true,
        donation: action.payload,
      };
    },

    // Zamknięcie potwierdzenia usunięcia
    closeDeleteConfirmation: (state) => {
      state.deleteConfirmation = initialState.deleteConfirmation;
      state.deleteStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    // Fetch donacji
    builder.addCase(fetchDonations.pending, (state) => {
      state.loadingStatus = 'loading';
      state.error = null;
    });
    builder.addCase(fetchDonations.fulfilled, (state, action) => {
      state.loadingStatus = 'success';
      state.donations = action.payload.donations;
      state.pagination = {
        currentPage: action.payload.page,
        pageSize: action.payload.size,
        totalPages: action.payload.totalPages,
        totalElements: action.payload.totalElements,
        isFirst: action.payload.first,
        isLast: action.payload.last,
      };
      state.statistics = {
        ...action.payload.statistics,
        nextEligibleDate: calculateNextEligibleDate(action.payload.statistics.lastDonationDate),
        daysSinceLastDonation: calculateDaysSince(action.payload.statistics.lastDonationDate),
        daysUntilEligible: calculateDaysUntil(calculateNextEligibleDate(action.payload.statistics.lastDonationDate)),
      };
    });
    builder.addCase(fetchDonations.rejected, (state, action) => {
      state.loadingStatus = 'error';
      state.error = action.payload as string;
    });

    // Create donacji
    builder.addCase(createDonation.pending, (state) => {
      state.createStatus = 'loading';
    });
    builder.addCase(createDonation.fulfilled, (state, action) => {
      state.createStatus = 'success';
      // Dodaj nową donację do listy (optimistic update) lub refetch
      state.donations.unshift(action.payload);
      state.modalState = initialState.modalState;
    });
    builder.addCase(createDonation.rejected, (state, action) => {
      state.createStatus = 'error';
      state.error = action.payload as string;
    });

    // Update donacji
    builder.addCase(updateDonation.pending, (state) => {
      state.updateStatus = 'loading';
    });
    builder.addCase(updateDonation.fulfilled, (state, action) => {
      state.updateStatus = 'success';
      // Zaktualizuj donację w liście
      const index = state.donations.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.donations[index] = action.payload;
      }
      state.modalState = initialState.modalState;
    });
    builder.addCase(updateDonation.rejected, (state, action) => {
      state.updateStatus = 'error';
      state.error = action.payload as string;
    });

    // Delete donacji
    builder.addCase(deleteDonation.pending, (state) => {
      state.deleteStatus = 'loading';
    });
    builder.addCase(deleteDonation.fulfilled, (state, action) => {
      state.deleteStatus = 'success';
      // Usuń donację z listy
      state.donations = state.donations.filter(d => d.id !== action.payload);
      state.deleteConfirmation = initialState.deleteConfirmation;
    });
    builder.addCase(deleteDonation.rejected, (state, action) => {
      state.deleteStatus = 'error';
      state.error = action.payload as string;
    });

    // Export donacji
    builder.addCase(exportDonations.pending, (state) => {
      state.exportStatus = 'loading';
    });
    builder.addCase(exportDonations.fulfilled, (state) => {
      state.exportStatus = 'success';
    });
    builder.addCase(exportDonations.rejected, (state, action) => {
      state.exportStatus = 'error';
      state.error = action.payload as string;
    });
  },
});

export const {
  setFilters,
  clearFilters,
  setSort,
  setPage,
  openCreateModal,
  openEditModal,
  closeModal,
  openDeleteConfirmation,
  closeDeleteConfirmation,
} = donationsSlice.actions;

export default donationsSlice.reducer;
```

### Custom Hook: `useDonations`

Hook agregujący logikę zarządzania donacjami i upraszczający dostęp do stanu oraz akcji:

```typescript
export const useDonations = () => {
  const dispatch = useDispatch();
  const donationsState = useSelector((state: RootState) => state.donations);

  // Fetch donacji przy montowaniu i przy zmianie filtrów/sortowania/paginacji
  useEffect(() => {
    const params: DonationsQueryParams = {
      fromDate: donationsState.filters.fromDate,
      toDate: donationsState.filters.toDate,
      rckikId: donationsState.filters.rckikId,
      page: donationsState.pagination.currentPage,
      size: donationsState.pagination.pageSize,
      sortBy: donationsState.sort.sortBy,
      sortOrder: donationsState.sort.sortOrder,
    };

    // Dodaj typ donacji tylko jeśli nie 'ALL'
    if (donationsState.filters.donationType !== 'ALL') {
      params.donationType = donationsState.filters.donationType;
    }

    dispatch(fetchDonations(params));
  }, [
    donationsState.filters,
    donationsState.sort,
    donationsState.pagination.currentPage,
    dispatch,
  ]);

  // Akcje
  const handleFilterChange = (filters: Partial<DonationFilters>) => {
    dispatch(setFilters(filters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handleSortChange = (sort: SortOptions) => {
    dispatch(setSort(sort));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handleAddDonation = () => {
    dispatch(openCreateModal());
  };

  const handleEditDonation = (donation: DonationResponse) => {
    dispatch(openEditModal(donation));
  };

  const handleDeleteDonation = (donation: DonationResponse) => {
    dispatch(openDeleteConfirmation(donation));
  };

  const handleCreateDonation = async (data: CreateDonationRequest) => {
    await dispatch(createDonation(data));
  };

  const handleUpdateDonation = async (id: number, data: UpdateDonationRequest) => {
    await dispatch(updateDonation({ id, data }));
  };

  const handleConfirmDelete = async (id: number) => {
    await dispatch(deleteDonation(id));
  };

  const handleExport = async (format: ExportFormat) => {
    await dispatch(exportDonations({ format, filters: donationsState.filters }));
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleCloseDeleteConfirmation = () => {
    dispatch(closeDeleteConfirmation());
  };

  return {
    // Stan
    donations: donationsState.donations,
    pagination: donationsState.pagination,
    statistics: donationsState.statistics,
    filters: donationsState.filters,
    sort: donationsState.sort,
    loadingStatus: donationsState.loadingStatus,
    createStatus: donationsState.createStatus,
    updateStatus: donationsState.updateStatus,
    deleteStatus: donationsState.deleteStatus,
    exportStatus: donationsState.exportStatus,
    error: donationsState.error,
    modalState: donationsState.modalState,
    deleteConfirmation: donationsState.deleteConfirmation,

    // Akcje
    onFilterChange: handleFilterChange,
    onClearFilters: handleClearFilters,
    onSortChange: handleSortChange,
    onPageChange: handlePageChange,
    onAddDonation: handleAddDonation,
    onEditDonation: handleEditDonation,
    onDeleteDonation: handleDeleteDonation,
    onCreateDonation: handleCreateDonation,
    onUpdateDonation: handleUpdateDonation,
    onConfirmDelete: handleConfirmDelete,
    onExport: handleExport,
    onCloseModal: handleCloseModal,
    onCloseDeleteConfirmation: handleCloseDeleteConfirmation,
  };
};
```

### Funkcje pomocnicze

```typescript
// Obliczenie następnego możliwego terminu donacji (ostatnia + 56 dni)
function calculateNextEligibleDate(lastDonationDate: string | null): string | null {
  if (!lastDonationDate) return null;

  const lastDate = new Date(lastDonationDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 56);

  return nextDate.toISOString().split('T')[0];
}

// Obliczenie ile dni minęło od ostatniej donacji
function calculateDaysSince(date: string | null): number | null {
  if (!date) return null;

  const lastDate = new Date(date);
  const today = new Date();
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Obliczenie ile dni do następnego możliwego terminu
function calculateDaysUntil(date: string | null): number | null {
  if (!date) return null;

  const nextDate = new Date(date);
  const today = new Date();
  const diffTime = nextDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}
```

## 7. Integracja API

### Endpointy używane przez widok Donacje

**1. Pobieranie listy donacji**

- **Endpoint:** `GET /api/v1/users/me/donations`
- **Typ żądania:** Query params (`DonationsQueryParams`)
- **Typ odpowiedzi:** `DonationListResponse`
- **Kiedy wywoływane:**
  - Przy montowaniu komponentu
  - Po zmianie filtrów
  - Po zmianie sortowania
  - Po zmianie strony paginacji
  - Po pomyślnym dodaniu/edycji/usunięciu donacji (refetch)

```typescript
// Query params
interface DonationsQueryParams {
  fromDate?: string; // ISO 8601
  toDate?: string; // ISO 8601
  rckikId?: number;
  page?: number; // default: 0
  size?: number; // default: 20
  sortBy?: string; // default: "donationDate"
  sortOrder?: 'ASC' | 'DESC'; // default: "DESC"
}

// Response
interface DonationListResponse {
  donations: DonationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  statistics: DonationStatisticsDto;
}
```

**2. Tworzenie nowej donacji**

- **Endpoint:** `POST /api/v1/users/me/donations`
- **Typ żądania:** `CreateDonationRequest`
- **Typ odpowiedzi:** `DonationResponse` (201 Created)
- **Kiedy wywoływane:** Po kliknięciu "Zapisz" w formularzu dodawania donacji

```typescript
// Request body
interface CreateDonationRequest {
  rckikId: number; // wymagane
  donationDate: string; // wymagane, ISO 8601, nie w przyszłości
  quantityMl: number; // wymagane, 50-1000
  donationType: DonationType; // wymagane
  notes?: string; // opcjonalne, max 1000 znaków
}

// Response
interface DonationResponse {
  id: number;
  rckik: RckikBasicDto;
  donationDate: string;
  quantityMl: number;
  donationType: DonationType;
  notes: string | null;
  confirmed: boolean; // false by default
  createdAt: string;
  updatedAt: string;
}
```

**3. Aktualizacja donacji**

- **Endpoint:** `PATCH /api/v1/users/me/donations/{id}`
- **Typ żądania:** `UpdateDonationRequest` (pola opcjonalne)
- **Typ odpowiedzi:** `DonationResponse` (200 OK)
- **Kiedy wywoływane:** Po kliknięciu "Aktualizuj" w formularzu edycji donacji

```typescript
// Request body (wszystkie pola opcjonalne - partial update)
interface UpdateDonationRequest {
  quantityMl?: number; // 50-1000
  donationType?: DonationType;
  notes?: string; // max 1000 znaków
}

// UWAGA: rckikId i donationDate NIE MOGĄ być zmienione (business rule)
```

**4. Usuwanie donacji**

- **Endpoint:** `DELETE /api/v1/users/me/donations/{id}`
- **Typ żądania:** Brak (tylko path param)
- **Typ odpowiedzi:** 204 No Content
- **Kiedy wywoływane:** Po potwierdzeniu usunięcia w modalu potwierdzenia

```typescript
// Brak body, tylko path parameter: id
// Response: 204 No Content (brak body)
```

**5. Eksport donacji do CSV/JSON**

- **Endpoint:** `GET /api/v1/users/me/donations/export`
- **Typ żądania:** Query params (format + opcjonalne filtry)
- **Typ odpowiedzi:** File download (CSV lub JSON)
- **Kiedy wywoływane:** Po kliknięciu "Eksportuj do CSV" lub "Eksportuj do JSON"

```typescript
// Query params
interface ExportQueryParams {
  format: 'csv' | 'json'; // wymagane
  fromDate?: string; // opcjonalne
  toDate?: string; // opcjonalne
}

// Response headers:
// Content-Type: text/csv lub application/json
// Content-Disposition: attachment; filename="donations_export_YYYY-MM-DD.{csv|json}"
```

**6. Pobieranie listy centrów RCKiK (dla select w formularzu)**

- **Endpoint:** `GET /api/v1/rckik`
- **Typ żądania:** Query params (opcjonalne filtry)
- **Typ odpowiedzi:** `RckikListResponse`
- **Kiedy wywoływane:** Przy montowaniu strony (prefetch w SSR lub przy otwarciu formularza)

```typescript
// Query params
interface RckikQueryParams {
  active?: boolean; // default: true (tylko aktywne centra)
  size?: number; // default: 100 (wszystkie aktywne centra)
}

// Response
interface RckikListResponse {
  content: RckikBasicDto[];
  // ... paginacja
}
```

### Obsługa błędów API

Wszystkie endpointy mogą zwrócić następujące kody błędów:

**Błędy autoryzacji:**
- `401 Unauthorized` - Brak tokenu lub token wygasł → przekierowanie do `/login`
- `403 Forbidden` - Próba dostępu do cudzych donacji → komunikat błędu

**Błędy walidacji:**
- `400 Bad Request` - Błędy walidacji danych wejściowych
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "quantityMl",
        "message": "Quantity must be between 50 and 1000 ml",
        "rejectedValue": 1500
      }
    ]
  }
  ```

**Błędy zasobów:**
- `404 Not Found` - Donacja nie istnieje lub została usunięta
- `409 Conflict` - Duplikat donacji (jeśli API implementuje taką walidację)

**Błędy serwerowe:**
- `500 Internal Server Error` - Błąd serwera → wyświetlenie przyjaznego komunikatu
- `503 Service Unavailable` - Serwis niedostępny → retry lub komunikat

### Axios Interceptors

Interceptory obsługują globalne błędy i dodawanie tokenu:

```typescript
// Request interceptor - dodawanie tokenu JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - obsługa błędów
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token wygasł - przekierowanie do logowania
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      // Brak uprawnień
      toast.error('Nie masz uprawnień do wykonania tej operacji');
    }

    if (error.response?.status === 404) {
      // Zasób nie znaleziony
      toast.error('Zasób nie został znaleziony');
    }

    if (error.response?.status >= 500) {
      // Błąd serwera
      toast.error('Wystąpił błąd serwera. Spróbuj ponownie później.');
    }

    return Promise.reject(error);
  }
);
```

## 8. Interakcje użytkownika

### 1. Przeglądanie listy donacji

**Scenariusz:** Użytkownik otwiera stronę `/dashboard/donations`

**Kroki:**
1. Użytkownik klika "Donacje" w menu bocznym dashboardu
2. Strona ładuje się (SSR + hydratacja)
3. Wyświetlane są:
   - Nagłówek ze statystykami (4 karty)
   - Toolbar z filtrami i opcjami eksportu
   - Tabela z donacjami (pierwsze 20 wpisów, sortowane malejąco po dacie)
   - Paginacja na dole tabeli
4. Jeśli użytkownik nie ma jeszcze żadnych donacji → wyświetlany jest `EmptyState` z CTA "Dodaj pierwszą donację"

**Obsługa stanów:**
- **Loading:** Wyświetlenie skeletonów dla tabeli i statystyk
- **Success:** Wyświetlenie danych
- **Error:** Wyświetlenie komunikatu błędu z opcją retry
- **Empty:** `EmptyState` z zachętą do dodania pierwszej donacji

---

### 2. Filtrowanie donacji

**Scenariusz:** Użytkownik chce zawęzić listę donacji według kryteriów

**Kroki:**
1. Użytkownik wybiera datę początkową w `DateRangePicker` (pole "Od")
2. Użytkownik wybiera datę końcową (pole "Do")
3. Użytkownik wybiera typ donacji z listy rozwijanej (np. "Krew pełna")
4. Użytkownik wybiera centrum RCKiK z listy rozwijanej (opcjonalnie)
5. Po każdej zmianie filtra:
   - Stan Redux jest aktualizowany (`setFilters`)
   - Strona resetuje się do pierwszej (page = 0)
   - Wywoływane jest API z nowymi parametrami
   - Tabela odświeża się z wynikami
6. Jeśli filtry nie zwracają wyników → `EmptyState` z komunikatem "Brak donacji spełniających kryteria" i przyciskiem "Wyczyść filtry"

**Walidacja:**
- Jeśli `fromDate > toDate` → wyświetlenie komunikatu błędu "Data 'od' nie może być późniejsza niż 'do'"
- Daty nie mogą być w przyszłości

**Obsługa stanów:**
- **Loading:** Skeleton w tabeli
- **No results:** `EmptyState` z opcją wyczyszczenia filtrów
- **Success:** Zaktualizowana lista

---

### 3. Sortowanie donacji

**Scenariusz:** Użytkownik chce posortować donacje według wybranej kolumny

**Kroki:**
1. Użytkownik klika nagłówek kolumny w tabeli (np. "Data donacji", "Centrum", "Ilość ml")
2. Kolumna zmienia stan sortowania:
   - Pierwsze kliknięcie: sortowanie rosnące (ASC) ↑
   - Drugie kliknięcie: sortowanie malejące (DESC) ↓
   - Trzecie kliknięcie: powrót do domyślnego sortowania (data malejąco)
3. Stan Redux jest aktualizowany (`setSort`)
4. Strona resetuje się do pierwszej (page = 0)
5. API jest wywoływane z nowymi parametrami sortowania
6. Tabela odświeża się z posortowanymi wynikami

**Dostępne kolumny do sortowania:**
- Data donacji (`donationDate`)
- Centrum RCKiK (`rckikName`)
- Ilość ml (`quantityMl`)
- Typ donacji (`donationType`)

---

### 4. Paginacja

**Scenariusz:** Użytkownik nawiguje między stronami listy donacji

**Kroki:**
1. Użytkownik klika przycisk "Następna" / "Poprzednia" lub numer strony w kontrolkach paginacji
2. Stan Redux jest aktualizowany (`setPage`)
3. API jest wywoływane z nowym parametrem `page`
4. Tabela odświeża się z donacjami dla nowej strony
5. Kontrolki paginacji aktualizują aktywną stronę

**Ograniczenia:**
- Przycisk "Poprzednia" jest wyłączony na pierwszej stronie
- Przycisk "Następna" jest wyłączony na ostatniej stronie

---

### 5. Dodawanie nowej donacji

**Scenariusz:** Użytkownik chce dodać nowy wpis donacji do dziennika

**Kroki:**
1. Użytkownik klika przycisk "Dodaj donację" w toolbarze lub w `EmptyState`
2. Otwiera się modal z formularzem (`DonationFormModal`, mode='create')
3. Użytkownik wypełnia formularz:
   - Wybór centrum RCKiK z listy rozwijanej (wymagane)
   - Wybór daty donacji z kalendarza (wymagane, nie w przyszłości)
   - Wpisanie ilości ml (wymagane, 50-1000)
   - Wybór typu donacji (wymagane: Krew pełna, Osocze, Płytki, Inne)
   - Opcjonalne notatki (max 1000 znaków)
4. Walidacja inline podczas wpisywania (React Hook Form + Zod)
5. Jeśli od ostatniej donacji pełnej krwi minęło mniej niż 56 dni → wyświetlenie ostrzeżenia (żółte, nie blokujące): "Uwaga: Minimalny odstęp między donacjami pełnej krwi to 56 dni. Upewnij się, że możesz oddać krew."
6. Użytkownik klika "Zapisz":
   - Walidacja całego formularza
   - Jeśli błędy → wyświetlenie komunikatów walidacji
   - Jeśli OK → wywołanie API `POST /api/v1/users/me/donations`
   - Loading spinner na przycisku "Zapisz"
7. Po sukcesie:
   - Toast sukcesu: "Donacja została dodana pomyślnie"
   - Modal się zamyka
   - Lista donacji jest odświeżana (refetch)
   - Statystyki są aktualizowane
8. Po błędzie:
   - Toast błędu z komunikatem z API
   - Modal pozostaje otwarty

**Walidacja:**
- **rckikId:** wymagane, musi istnieć
- **donationDate:** wymagane, nie w przyszłości, nie starsze niż 5 lat
- **quantityMl:** wymagane, 50-1000 ml
- **donationType:** wymagane, jedna z 4 wartości
- **notes:** opcjonalne, max 1000 znaków

---

### 6. Edycja donacji

**Scenariusz:** Użytkownik chce poprawić dane istniejącej donacji

**Kroki:**
1. Użytkownik klika przycisk "Edytuj" (ikona ołówka) w wierszu donacji w tabeli
2. Otwiera się modal z formularzem (`DonationFormModal`, mode='edit')
3. Formularz jest wypełniony aktualnymi danymi donacji
4. **Ważne:** Pola `rckikId` i `donationDate` są **readonly** (nie można ich zmienić zgodnie z regułą biznesową API)
5. Użytkownik może edytować:
   - Ilość ml
   - Typ donacji
   - Notatki
6. Walidacja inline podczas edycji
7. Użytkownik klika "Aktualizuj":
   - Walidacja zmienionych pól
   - Wywołanie API `PATCH /api/v1/users/me/donations/{id}`
   - Loading spinner na przycisku
8. Po sukcesie:
   - Toast sukcesu: "Donacja została zaktualizowana"
   - Modal się zamyka
   - Wiersz w tabeli aktualizuje się (optimistic update lub refetch)
9. Po błędzie:
   - Toast błędu
   - Modal pozostaje otwarty

**Walidacja:** Takie same reguły jak przy dodawaniu (dla edytowalnych pól)

---

### 7. Usuwanie donacji

**Scenariusz:** Użytkownik chce usunąć błędnie dodaną donację

**Kroki:**
1. Użytkownik klika przycisk "Usuń" (ikona kosza) w wierszu donacji w tabeli
2. Otwiera się modal potwierdzenia (`DeleteConfirmationModal`)
3. Modal wyświetla:
   - Ikonę ostrzeżenia (czerwony trójkąt)
   - Komunikat: "Czy na pewno chcesz usunąć donację z dnia [data] w [RCKiK nazwa]? Tej akcji nie można cofnąć."
   - Przycisk "Anuluj" (szary)
   - Przycisk "Usuń" (czerwony)
4. Użytkownik klika "Usuń":
   - Wywołanie API `DELETE /api/v1/users/me/donations/{id}`
   - Loading spinner na przycisku
5. Po sukcesie:
   - Toast sukcesu: "Donacja została usunięta"
   - Modal się zamyka
   - Donacja znika z tabeli (optimistic update lub refetch)
   - Jeśli była ostatnia na stronie i to nie pierwsza strona → powrót do poprzedniej strony
   - Statystyki są aktualizowane
6. Po błędzie:
   - Toast błędu
   - Modal pozostaje otwarty
7. Jeśli użytkownik klika "Anuluj" lub ESC lub poza modalem → modal się zamyka bez akcji

---

### 8. Eksport donacji do CSV/JSON

**Scenariusz:** Użytkownik chce wyeksportować swoją historię donacji do pliku

**Kroki:**
1. Użytkownik klika przycisk "Eksportuj" w toolbarze
2. Rozwija się menu dropdown z opcjami:
   - "Eksportuj do CSV"
   - "Eksportuj do JSON"
3. Użytkownik wybiera format (np. CSV)
4. Wywołanie API `GET /api/v1/users/me/donations/export?format=csv&fromDate=...&toDate=...`
   - Parametry filtrów są przekazywane do API (jeśli są ustawione)
   - Loading spinner na przycisku eksportu
5. Po sukcesie:
   - Przeglądarka automatycznie pobiera plik `donations_export_YYYY-MM-DD.csv`
   - Toast sukcesu: "Plik został pobrany"
6. Po błędzie:
   - Toast błędu: "Nie udało się wyeksportować danych. Spróbuj ponownie."

**Format CSV:**
```csv
Donation Date,RCKiK Name,RCKiK City,Quantity (ml),Donation Type,Notes,Confirmed
2025-01-08,RCKiK Warszawa,Warszawa,450,FULL_BLOOD,Felt great,false
```

**Format JSON:**
```json
{
  "userId": 123,
  "exportDate": "2025-01-08T16:45:00Z",
  "donations": [
    {
      "donationDate": "2025-01-08",
      "rckikName": "RCKiK Warszawa",
      "rckikCity": "Warszawa",
      "quantityMl": 450,
      "donationType": "FULL_BLOOD",
      "notes": "Felt great",
      "confirmed": false
    }
  ],
  "totalDonations": 12,
  "totalQuantityMl": 5400
}
```

---

### 9. Zamykanie modali

**Scenariusz:** Użytkownik chce anulować operację w modalu

**Kroki:**
1. Użytkownik może zamknąć modal na kilka sposobów:
   - Kliknięcie przycisku "Anuluj"
   - Kliknięcie przycisku "X" w prawym górnym rogu
   - Naciśnięcie klawisza ESC
   - Kliknięcie poza modalem (na overlay)
2. Jeśli formularz ma niezapisane zmiany → wyświetlenie potwierdzenia:
   - "Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?"
   - "Anuluj" / "Zamknij bez zapisywania"
3. Po zamknięciu:
   - Modal znika
   - Stan formularza jest czyszczony
   - Statusy ładowania są resetowane

---

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs

Widok Donacje implementuje walidację na wielu poziomach, zarówno na frontend jak i poprzez komunikację z API backend.

### 1. Walidacja formularza dodawania/edycji donacji

**Komponent:** `DonationFormModal`

**Zod Schema dla walidacji:**
```typescript
import { z } from 'zod';

const donationFormSchema = z.object({
  rckikId: z
    .number({
      required_error: 'Wybór centrum RCKiK jest wymagany',
      invalid_type_error: 'Nieprawidłowy identyfikator centrum',
    })
    .int()
    .positive('Wybierz centrum RCKiK z listy'),

  donationDate: z
    .string({
      required_error: 'Data donacji jest wymagana',
    })
    .refine(
      (date) => {
        const donationDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return donationDate <= today;
      },
      { message: 'Data donacji nie może być w przyszłości' }
    )
    .refine(
      (date) => {
        const donationDate = new Date(date);
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        return donationDate >= fiveYearsAgo;
      },
      { message: 'Data donacji nie może być starsza niż 5 lat' }
    ),

  quantityMl: z
    .number({
      required_error: 'Ilość ml jest wymagana',
      invalid_type_error: 'Ilość musi być liczbą',
    })
    .int('Ilość musi być liczbą całkowitą')
    .min(50, 'Minimalna ilość to 50 ml')
    .max(1000, 'Maksymalna ilość to 1000 ml'),

  donationType: z.enum(['FULL_BLOOD', 'PLASMA', 'PLATELETS', 'OTHER'], {
    required_error: 'Typ donacji jest wymagany',
    invalid_type_error: 'Nieprawidłowy typ donacji',
  }),

  notes: z
    .string()
    .max(1000, 'Notatki nie mogą przekroczyć 1000 znaków')
    .optional()
    .or(z.literal('')),
});

type DonationFormData = z.infer<typeof donationFormSchema>;
```

**Walidacja inline (React Hook Form):**
- Walidacja pól po opuszczeniu (`onBlur`)
- Wyświetlanie komunikatów błędów pod polami
- Blokowanie przycisku "Zapisz" dopóki formularz nie jest poprawny

**Ostrzeżenia (nie blokujące):**
- **Odstęp 56 dni dla pełnej krwi:** Jeśli typ donacji to `FULL_BLOOD` i od ostatniej donacji pełnej krwi minęło mniej niż 56 dni, wyświetl żółty banner z ostrzeżeniem:
  ```
  ⚠️ Uwaga: Minimalny odstęp między donacjami pełnej krwi to 56 dni.
  Od twojej ostatniej donacji minęło [X] dni. Upewnij się, że możesz oddać krew.
  ```
  (Nie blokuje wysłania formularza - użytkownik może być pewien swojej decyzji)

**Szczególne przypadki:**
- **Pole `rckikId` i `donationDate` w trybie edycji:** Te pola są **readonly** (disabled) zgodnie z regułą biznesową API. Nie mogą być zmieniane po utworzeniu donacji.
- **Centrum RCKiK nieaktywne:** Jeśli centrum zostało dezaktywowane po utworzeniu donacji, w trybie edycji jest nadal wyświetlane (readonly), ale nie można wybrać go przy tworzeniu nowej donacji.

---

### 2. Walidacja filtrów

**Komponent:** `FiltersBar` / `DateRangePicker`

**Warunki:**
- **Zakres dat:** `fromDate <= toDate`
  - Jeśli użytkownik wybierze `fromDate > toDate`, wyświetl komunikat: "Data początkowa nie może być późniejsza niż data końcowa"
  - Automatyczna korekta: jeśli użytkownik wybierze `toDate < fromDate`, zaktualizuj `fromDate = toDate`

- **Daty w przyszłości:** Pole daty ma atrybut `max="today"`, uniemożliwiający wybór przyszłych dat

- **Typ donacji:** Musi być jedną z wartości: `FULL_BLOOD`, `PLASMA`, `PLATELETS`, `OTHER`, `ALL` (frontend)

- **RCKiK:** Musi być prawidłowym ID z listy lub `null` (wszystkie)

---

### 3. Walidacja paginacji

**Komponent:** `Pagination`

**Warunki:**
- `currentPage >= 0`
- `currentPage < totalPages`
- Przycisk "Poprzednia" wyłączony gdy `currentPage === 0`
- Przycisk "Następna" wyłączony gdy `currentPage === totalPages - 1`

---

### 4. Warunki autoryzacji

**Weryfikacja:** Middleware Astro (`src/middleware/auth.ts`)

**Warunki:**
- Użytkownik musi być uwierzytelniony (JWT token w localStorage lub httpOnly cookie)
- Token musi być ważny (nie wygasły)
- Użytkownik może uzyskać dostęp tylko do własnych donacji (weryfikacja po stronie API przez `user_id` z JWT)

**Akcje przy naruszeniu:**
- Brak tokenu → przekierowanie do `/login`
- Token wygasły → przekierowanie do `/login` z komunikatem "Sesja wygasła. Zaloguj się ponownie."
- Próba dostępu do cudzych danych (API zwraca 403) → Toast: "Brak uprawnień"

---

### 5. Warunki usuwania donacji

**Komponent:** `DeleteConfirmationModal`

**Warunki:**
- Użytkownik musi być właścicielem donacji (weryfikacja po stronie API)
- Donacja nie może być już usunięta (`deleted_at IS NULL` - backend)
- Usunięcie wymaga potwierdzenia w modalu

**Skutki:**
- Soft delete w bazie danych (ustawienie `deleted_at = NOW()`)
- Utworzenie wpisu audytu (`DONATION_DELETED`)
- Jeśli usunięta donacja była ostatnią w statystykach, statystyki są przeliczane

---

### 6. Warunki eksportu

**Komponent:** `ExportDropdown`

**Warunki:**
- Format musi być `csv` lub `json`
- Użytkownik może eksportować tylko własne donacje
- Eksport uwzględnia aktywne filtry (jeśli są ustawione)

**Ograniczenia (MVP):**
- Eksport synchroniczny - maksymalnie kilka tysięcy rekordów
- Dla większych zbiorów w przyszłości: async export z linkiem do pobrania

---

### 7. Wpływ warunków na stan interfejsu

**Scenariusz 1: Brak donacji**
- Warunek: `totalElements === 0 && !hasFilters`
- Efekt: Wyświetlenie `EmptyState` z komunikatem "Nie masz jeszcze żadnych donacji" i przyciskiem CTA "Dodaj pierwszą donację"

**Scenariusz 2: Filtry bez wyników**
- Warunek: `totalElements === 0 && hasFilters`
- Efekt: Wyświetlenie `EmptyState` z komunikatem "Nie znaleziono donacji spełniających kryteria" i przyciskiem "Wyczyść filtry"

**Scenariusz 3: Ostatnia donacja < 56 dni temu (full blood)**
- Warunek: Ostatnia donacja typu `FULL_BLOOD` była mniej niż 56 dni temu
- Efekt:
  - W kartach statystyk: `nextEligibleDate` wyświetlane z liczbą dni do odczekania
  - W formularzu: Ostrzeżenie (żółty banner) przy wyborze typu `FULL_BLOOD`

**Scenariusz 4: Formularz z błędami walidacji**
- Warunek: Formularz zawiera błędy (`!isValid` z React Hook Form)
- Efekt:
  - Przycisk "Zapisz" jest disabled
  - Komunikaty błędów wyświetlane pod polami z błędami
  - Pola z błędami mają czerwone obramowanie

**Scenariusz 5: Ładowanie danych**
- Warunek: `loadingStatus === 'loading'`
- Efekt:
  - Wyświetlenie skeletonów w tabeli
  - Wyświetlenie skeletonów w kartach statystyk
  - Spinner w kontrolkach ładowania (np. przyciski)

**Scenariusz 6: Błąd API**
- Warunek: `loadingStatus === 'error'` lub błąd 500
- Efekt:
  - Wyświetlenie komunikatu błędu z ikoną
  - Przycisk "Spróbuj ponownie" do refetch danych
  - Toast z komunikatem błędu

**Scenariusz 7: Edycja donacji**
- Warunek: `mode === 'edit'`
- Efekt:
  - Pola `rckikId` i `donationDate` są readonly (disabled)
  - Tytuł modala: "Edytuj donację" zamiast "Dodaj donację"
  - Przycisk: "Aktualizuj" zamiast "Zapisz"

**Scenariusz 8: Pierwsza strona paginacji**
- Warunek: `currentPage === 0`
- Efekt: Przycisk "Poprzednia" jest disabled

**Scenariusz 9: Ostatnia strona paginacji**
- Warunek: `currentPage === totalPages - 1`
- Efekt: Przycisk "Następna" jest disabled

---

## 10. Obsługa błędów

### 1. Błędy API

**Typ:** Błędy komunikacji z backendem

**Scenariusze:**

#### 401 Unauthorized - Token wygasł lub brak tokenu
- **Gdzie:** Wszystkie endpointy wymagające autoryzacji
- **Przyczyna:** Token JWT wygasł, został usunięty lub jest nieprawidłowy
- **Obsługa:**
  - Axios interceptor przechwytuje błąd 401
  - Usunięcie tokenu z localStorage
  - Przekierowanie do `/login` z parametrem `?expired=true`
  - Wyświetlenie toasta: "Twoja sesja wygasła. Zaloguj się ponownie."

#### 403 Forbidden - Brak uprawnień
- **Gdzie:** Próba dostępu do cudzych donacji
- **Przyczyna:** Użytkownik próbuje edytować/usunąć donację innego użytkownika
- **Obsługa:**
  - Axios interceptor przechwytuje błąd 403
  - Toast error: "Nie masz uprawnień do wykonania tej operacji"
  - Pozostanie na stronie (nie przekierowanie)

#### 404 Not Found - Donacja nie istnieje
- **Gdzie:** `PATCH /donations/{id}` lub `DELETE /donations/{id}`
- **Przyczyna:** Donacja została już usunięta lub nigdy nie istniała
- **Obsługa:**
  - Toast error: "Donacja nie została znaleziona. Mogła zostać już usunięta."
  - Zamknięcie modala
  - Refetch listy donacji (aby usunąć nieistniejącą donację z widoku)

#### 400 Bad Request - Błędy walidacji
- **Gdzie:** `POST /donations`, `PATCH /donations/{id}`
- **Przyczyna:** Dane wejściowe nie spełniają warunków walidacji API
- **Obsługa:**
  ```typescript
  // Response API:
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "quantityMl",
        "message": "Quantity must be between 50 and 1000 ml",
        "rejectedValue": 1500
      }
    ]
  }
  ```
  - Parsowanie `details` z odpowiedzi
  - Mapowanie błędów na pola formularza (React Hook Form `setError`)
  - Wyświetlenie komunikatów pod konkretnymi polami
  - Toast error z ogólnym komunikatem: "Formularz zawiera błędy. Popraw je i spróbuj ponownie."

#### 500 Internal Server Error - Błąd serwera
- **Gdzie:** Dowolny endpoint
- **Przyczyna:** Błąd po stronie backendu (np. błąd bazy danych)
- **Obsługa:**
  - Toast error: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
  - Jeśli w tabeli: Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie"
  - Jeśli w formularzu: Modal pozostaje otwarty, przycisk "Zapisz" jest odblokowany

#### 503 Service Unavailable - Serwis niedostępny
- **Gdzie:** Dowolny endpoint
- **Przyczyna:** Maintenance lub przeciążenie serwera
- **Obsługa:**
  - Toast error: "Serwis jest tymczasowo niedostępny. Spróbuj ponownie później."
  - Retry po 5 sekundach (max 3 próby z exponential backoff)

#### Network Error - Brak połączenia z internetem
- **Gdzie:** Wszystkie wywołania API
- **Przyczyna:** Użytkownik stracił połączenie z internetem
- **Obsługa:**
  - Toast warning: "Brak połączenia z internetem. Sprawdź swoje połączenie."
  - Banner na górze strony: "Jesteś offline. Niektóre funkcje mogą być niedostępne."
  - Blokowanie akcji wymagających API (przyciski disabled)
  - Listener na `window.online` event → automatyczny retry po przywróceniu połączenia

---

### 2. Błędy walidacji formularza (Frontend)

**Typ:** Walidacja przed wysłaniem do API

**Scenariusze:**

#### Nieprawidłowa data donacji
- **Warunek:** Data w przyszłości lub starsza niż 5 lat
- **Obsługa:**
  - Komunikat pod polem daty:
    - "Data donacji nie może być w przyszłości"
    - "Data donacji nie może być starsza niż 5 lat"
  - Czerwone obramowanie pola
  - Przycisk "Zapisz" disabled

#### Nieprawidłowa ilość ml
- **Warunek:** Wartość < 50 lub > 1000 lub nie jest liczbą
- **Obsługa:**
  - Komunikat: "Ilość musi być liczbą między 50 a 1000 ml"
  - Czerwone obramowanie pola
  - Przycisk "Zapisz" disabled

#### Brak wymaganych pól
- **Warunek:** Użytkownik nie wypełnił pola wymaganego (centrum, data, ilość, typ)
- **Obsługa:**
  - Komunikat: "[Nazwa pola] jest wymagane"
  - Czerwone obramowanie pola
  - Przycisk "Zapisz" disabled

#### Notatki za długie
- **Warunek:** Liczba znaków > 1000
- **Obsługa:**
  - Komunikat: "Notatki nie mogą przekroczyć 1000 znaków (aktualna długość: [X])"
  - Licznik znaków pod polem: "X / 1000"
  - Czerwone obramowanie pola

---

### 3. Błędy stanów

**Typ:** Błędy związane ze stanem komponentów

**Scenariusze:**

#### Brak danych do wyświetlenia (Empty State)
- **Warunek:** `donations.length === 0`
- **Obsługa:**
  - Jeśli `hasFilters === false`: "Nie masz jeszcze żadnych donacji" + CTA "Dodaj pierwszą donację"
  - Jeśli `hasFilters === true`: "Nie znaleziono donacji spełniających kryteria" + CTA "Wyczyść filtry"

#### Timeout ładowania danych
- **Warunek:** API nie odpowiada przez > 30 sekund
- **Obsługa:**
  - Cancel request (Axios timeout config)
  - Toast error: "Ładowanie zajmuje zbyt dużo czasu. Spróbuj ponownie."
  - Wyświetlenie komunikatu błędu z przyciskiem "Odśwież"

#### Optymistic Update Failed
- **Warunek:** Operacja create/update/delete zakończyła się sukcesem lokalnie, ale API zwróciło błąd
- **Obsługa:**
  - Rollback zmian w Redux (przywrócenie poprzedniego stanu)
  - Toast error: "Nie udało się zapisać zmian. Zmiany zostały cofnięte."
  - Refetch danych z API (aby mieć pewność spójności)

---

### 4. Błędy użytkownika (UX)

**Typ:** Błędy spowodowane nieprawidłowym użyciem interfejsu

**Scenariusze:**

#### Próba zamknięcia formularza z niezapisanymi zmianami
- **Warunek:** Użytkownik kliknął "X", ESC lub poza modalem, a formularz ma zmiany (`isDirty === true`)
- **Obsługa:**
  - Wyświetlenie confirmation dialog:
    - Tytuł: "Niezapisane zmiany"
    - Treść: "Masz niezapisane zmiany. Czy na pewno chcesz zamknąć formularz?"
    - Przyciski: "Anuluj" / "Zamknij bez zapisywania"
  - Jeśli "Zamknij bez zapisywania" → zamknięcie modala i czyszczenie formularza
  - Jeśli "Anuluj" → pozostanie w modalu

#### Próba usunięcia donacji bez potwierdzenia
- **Warunek:** Użytkownik kliknął "Usuń", ale nie potwierdził w modalu
- **Obsługa:**
  - Wyświetlenie `DeleteConfirmationModal` z ostrzeżeniem
  - Użytkownik musi kliknąć "Usuń" ponownie, aby potwierdzić

#### Nieprawidłowy zakres dat w filtrach
- **Warunek:** `fromDate > toDate`
- **Obsługa:**
  - Automatyczna korekja: ustawienie `fromDate = toDate`
  - Toast info: "Data początkowa została skorygowana"

---

### 5. Obsługa błędów w poszczególnych komponentach

#### DonationTable
- **Loading:** Wyświetlenie `Skeleton` rows (5 wierszy)
- **Error:** Komunikat "Nie udało się załadować donacji" + przycisk "Odśwież"
- **Empty:** `EmptyState` z odpowiednim komunikatem

#### DonationFormModal
- **Validation errors:** Inline messages pod polami + disabled button
- **API errors:** Toast + mapowanie błędów na pola (jeśli możliwe)
- **Network error:** Toast + przycisk pozostaje aktywny (retry)

#### ExportDropdown
- **API error:** Toast: "Nie udało się wyeksportować danych"
- **Network error:** Toast: "Brak połączenia. Sprawdź internet."
- **Timeout:** Toast: "Eksport trwa zbyt długo. Spróbuj ponownie."

#### DeleteConfirmationModal
- **API error:** Toast + modal pozostaje otwarty
- **Network error:** Toast + przycisk "Usuń" pozostaje aktywny

---

### 6. Logging błędów (dla deweloperów)

**Scenariusze:**
- Wszystkie błędy API są logowane do konsoli w trybie development
- W production: błędy są wysyłane do Sentry lub innego narzędzia monitoringu
- Logi zawierają:
  - Typ błędu (401, 403, 404, 500, network, validation)
  - Endpoint i metoda HTTP
  - User ID (z JWT)
  - Timestamp
  - Stack trace (jeśli dostępny)

```typescript
// Przykład logging interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorLog = {
      type: error.response?.status || 'network',
      endpoint: error.config?.url,
      method: error.config?.method,
      userId: getUserIdFromToken(),
      timestamp: new Date().toISOString(),
      message: error.response?.data?.message || error.message,
    };

    // Development
    if (import.meta.env.DEV) {
      console.error('[API Error]', errorLog);
    }

    // Production
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { extra: errorLog });
    }

    return Promise.reject(error);
  }
);
```

---

## 11. Kroki implementacji

Poniżej znajduje się sekwencyjny plan implementacji widoku Donacje z podziałem na etapy. Każdy etap zawiera szczegółowe kroki, zależności i kryteria akceptacji.

### Etap 0: Setup i konfiguracja (Prerequisites)
**Czas:** 1-2 godziny

**Kroki:**
1. Upewnij się, że istnieje `DashboardLayout.astro` z nawigacją
2. Skonfiguruj Redux Toolkit store z `donationsSlice` (jeśli jeszcze nie istnieje)
3. Skonfiguruj Axios client z interceptorami (auth + error handling)
4. Dodaj link "Donacje" do sidebaru dashboardu

**Zależności:**
- Działający system autoryzacji (JWT)
- Backend API endpoint `/api/v1/users/me/donations` dostępny

**Kryteria akceptacji:**
- ✅ Link "Donacje" widoczny w sidebarze
- ✅ Redux store skonfigurowany
- ✅ Axios interceptory działają (401 → redirect do /login)

---

### Etap 1: UI Primitives (Komponenty bazowe)
**Czas:** 2-3 godziny

**Kroki:**
1. Implementacja `Button` z wariantami (primary, secondary, danger, ghost)
2. Implementacja `Input` (text, number, date, textarea)
3. Implementacja `Select` (dropdown)
4. Implementacja `Modal` (overlay, focus trap, ESC handling)
5. Implementacja `Badge` (kolory dla typów donacji)
6. Implementacja `Skeleton` (loader placeholder)
7. Implementacja `Toast` (success, error, warning, info)
8. Implementacja `Card` (dla statystyk)

**Lokalizacja:** `src/components/ui/`

**Kryteria akceptacji:**
- ✅ Wszystkie komponenty UI dostępne z accessibility (ARIA, keyboard nav)
- ✅ Komponenty responsywne (mobile, tablet, desktop)
- ✅ Dostępne storybook lub test page dla każdego komponentu

---

### Etap 2: Redux Slice i API Integration
**Czas:** 3-4 godziny

**Kroki:**
1. Zdefiniowanie typów (`DonationsState`, `DonationFilters`, `SortOptions`, etc.)
2. Implementacja `donationsSlice` z initial state
3. Implementacja async thunks:
   - `fetchDonations`
   - `createDonation`
   - `updateDonation`
   - `deleteDonation`
   - `exportDonations`
4. Implementacja reducers (setFilters, setSort, setPage, modal actions)
5. Implementacja custom hook `useDonations`
6. Dodanie `donationsSlice` do store configuration

**Lokalizacja:**
- `src/lib/store/slices/donationsSlice.ts`
- `src/lib/hooks/useDonations.ts`

**Testy:**
- Unit testy dla reducers
- Integration testy dla async thunks (MSW mocks)

**Kryteria akceptacji:**
- ✅ Wszystkie akcje Redux działają poprawnie
- ✅ API calls wykonywane z prawidłowymi parametrami
- ✅ Testy jednostkowe passed (>80% coverage)

---

### Etap 3: Strona główna widoku (Astro Page)
**Czas:** 1-2 godziny

**Kroki:**
1. Utworzenie pliku `src/pages/dashboard/donations.astro`
2. Dodanie middleware autoryzacyjnego
3. Prefetch listy centrów RCKiK (SSR) dla formularza
4. Prefetch pierwszej strony donacji (opcjonalnie - lub fetch po stronie klienta)
5. Setup layoutu `DashboardLayout`
6. Dodanie Redux Provider dla React islands

**Lokalizacja:** `src/pages/dashboard/donations.astro`

**Kryteria akceptacji:**
- ✅ Strona dostępna pod `/dashboard/donations`
- ✅ Wymaga autoryzacji (redirect do /login jeśli brak tokenu)
- ✅ Layout dashboard wyświetla się poprawnie

---

### Etap 4: Nagłówek i statystyki
**Czas:** 2-3 godziny

**Kroki:**
1. Implementacja `DonationsHeader` (Astro lub React)
2. Implementacja `DonationStatisticsCards` (4 karty)
3. Implementacja logiki obliczania `nextEligibleDate` i `daysUntilEligible`
4. Stylowanie kart statystyk (Tailwind CSS)
5. Responsive design (mobile: 1 kolumna, tablet: 2 kolumny, desktop: 4 kolumny)

**Lokalizacja:** `src/components/dashboard/`

**Kryteria akceptacji:**
- ✅ Karty statystyk wyświetlają poprawne dane z API
- ✅ Obliczanie "następnej możliwej donacji" działa (ostatnia + 56 dni)
- ✅ Responsive layout

---

### Etap 5: Toolbar (Filtry + Eksport)
**Czas:** 4-5 godzin

**Kroki:**
1. Implementacja `DonationsToolbar` (client:load)
2. Implementacja `FiltersBar`:
   - `DateRangePicker` (od/do)
   - `Select` dla typu donacji
   - `Select` dla centrum RCKiK
   - Przycisk "Wyczyść filtry"
3. Implementacja `ExportDropdown`:
   - Menu dropdown z opcjami CSV/JSON
   - Obsługa kliknięcia → wywołanie API export
   - Loading spinner podczas eksportu
4. Przycisk "Dodaj donację" → otwarcie modala
5. Synchronizacja filtrów z query params (opcjonalnie)
6. Walidacja zakresu dat (fromDate <= toDate)

**Lokalizacja:** `src/components/dashboard/`

**Kryteria akceptacji:**
- ✅ Filtry działają (zmiana → refetch z API)
- ✅ Eksport do CSV/JSON pobiera plik
- ✅ Przycisk "Wyczyść filtry" resetuje wszystkie filtry
- ✅ Walidacja dat działa (komunikaty błędów)

---

### Etap 6: Tabela donacji + Paginacja
**Czas:** 4-5 godzin

**Kroki:**
1. Implementacja `DonationTable` (client:idle)
2. Implementacja `TableHeader` z sortowaniem (klikalne nagłówki)
3. Implementacja `DonationRow`:
   - Formatowanie daty (locale PL)
   - Badge dla typu donacji (kolory)
   - Ikona potwierdzenia (jeśli confirmed=true)
   - Przyciski akcji: Edytuj, Usuń
4. Implementacja `Pagination`:
   - Przycisk Poprzednia/Następna
   - Numery stron
   - Informacja "Strona X z Y"
5. Implementacja `EmptyState` (dwa warianty: brak donacji vs. brak wyników filtrów)
6. Loading state: `Skeleton` rows podczas ładowania
7. Obsługa sortowania (kliknięcie nagłówka → zmiana ASC/DESC)

**Lokalizacja:** `src/components/dashboard/`

**Kryteria akceptacji:**
- ✅ Tabela wyświetla donacje z poprawnym formatowaniem
- ✅ Sortowanie działa dla wszystkich kolumn
- ✅ Paginacja działa (zmiana strony → refetch)
- ✅ EmptyState wyświetla się w odpowiednich scenariuszach
- ✅ Skeleton wyświetla się podczas ładowania

---

### Etap 7: Modal dodawania/edycji donacji
**Czas:** 5-6 godzin

**Kroki:**
1. Implementacja `DonationFormModal` (client:load)
2. Setup React Hook Form + Zod validation schema
3. Implementacja pól formularza:
   - `Select` - wybór centrum RCKiK
   - `Input[type="date"]` - data donacji
   - `Input[type="number"]` - ilość ml
   - `Select` - typ donacji
   - `Textarea` - notatki
4. Implementacja walidacji inline (onBlur)
5. Implementacja logiki ostrzeżenia "56 dni" dla pełnej krwi:
   - Fetch ostatniej donacji pełnej krwi użytkownika
   - Obliczenie różnicy dni
   - Wyświetlenie żółtego bannera jeśli < 56 dni
6. Implementacja trybu edycji:
   - Pola `rckikId` i `donationDate` readonly
   - Tytuł "Edytuj donację"
   - Przycisk "Aktualizuj"
7. Implementacja submit handlera:
   - Walidacja formularza
   - Wywołanie API (POST lub PATCH)
   - Obsługa sukcesu (toast + zamknięcie modala + refetch)
   - Obsługa błędów (toast + mapowanie błędów na pola)
8. Implementacja zamykania modala:
   - ESC, X, kliknięcie poza modalem
   - Confirmation jeśli są niezapisane zmiany
9. Stylowanie formularza (labels, errors, spacing)

**Lokalizacja:** `src/components/dashboard/DonationFormModal.tsx`

**Kryteria akceptacji:**
- ✅ Formularz waliduje się poprawnie (inline + submit)
- ✅ Ostrzeżenie "56 dni" wyświetla się dla pełnej krwi
- ✅ Tryb edycji działa (readonly pola)
- ✅ API calls wykonywane prawidłowo (POST/PATCH)
- ✅ Obsługa błędów API (toast + mapowanie na pola)
- ✅ Confirmation przy zamykaniu z niezapisanymi zmianami

---

### Etap 8: Modal potwierdzenia usunięcia
**Czas:** 2-3 godziny

**Kroki:**
1. Implementacja `DeleteConfirmationModal` (client:load)
2. Wyświetlanie szczegółów donacji (data, centrum RCKiK)
3. Ikona ostrzeżenia (czerwony trójkąt)
4. Przyciski: "Anuluj" (secondary) i "Usuń" (danger)
5. Implementacja handlera usunięcia:
   - Wywołanie API DELETE
   - Loading spinner na przycisku "Usuń"
   - Obsługa sukcesu (toast + zamknięcie modala + refetch + usunięcie z listy)
   - Obsługa błędów (toast + modal pozostaje otwarty)
6. Implementacja zamykania modala (ESC, Anuluj, kliknięcie poza modalem)

**Lokalizacja:** `src/components/dashboard/DeleteConfirmationModal.tsx`

**Kryteria akceptacji:**
- ✅ Modal wyświetla poprawne dane donacji do usunięcia
- ✅ Usuwanie działa (API call + refetch)
- ✅ Obsługa błędów (toast)
- ✅ Zamykanie modala działa poprawnie

---

### Etap 9: Integracja komponentów
**Czas:** 2-3 godziny

**Kroki:**
1. Połączenie wszystkich komponentów w `donations.astro`
2. Wiring akcji Redux:
   - Kliknięcie "Dodaj donację" → `openCreateModal`
   - Kliknięcie "Edytuj" → `openEditModal(donation)`
   - Kliknięcie "Usuń" → `openDeleteConfirmation(donation)`
   - Kliknięcie "Eksportuj" → `exportDonations(format)`
   - Zmiana filtrów → `setFilters`
   - Zmiana sortowania → `setSort`
   - Zmiana strony → `setPage`
3. Implementacja refetch po operacjach CRUD
4. Testowanie flow end-to-end:
   - Dodanie donacji
   - Edycja donacji
   - Usunięcie donacji
   - Filtrowanie
   - Sortowanie
   - Paginacja
   - Eksport

**Kryteria akceptacji:**
- ✅ Wszystkie interakcje użytkownika działają poprawnie
- ✅ Refetch po CRUD operations
- ✅ Stan Redux synchronizowany z UI

---

### Etap 10: Obsługa błędów i edge cases
**Czas:** 3-4 godziny

**Kroki:**
1. Implementacja obsługi błędów API:
   - 401 → redirect do /login
   - 403 → toast error
   - 404 → toast + refetch
   - 400 → mapowanie błędów na pola formularza
   - 500 → toast + retry button
   - Network error → toast + offline banner
2. Implementacja timeout dla API calls (Axios config)
3. Implementacja retry logic dla eksportu (exponential backoff)
4. Implementacja rollback dla optimistic updates (jeśli używane)
5. Implementacja confirmation przy zamykaniu formularza z niezapisanymi zmianami
6. Implementacja edge cases:
   - Brak donacji → EmptyState
   - Filtry bez wyników → EmptyState z "Wyczyść filtry"
   - Ostatnia donacja na stronie usunięta → powrót do poprzedniej strony
   - Centrum RCKiK nieaktywne → obsługa w edycji (readonly, ale widoczne)

**Kryteria akceptacji:**
- ✅ Wszystkie scenariusze błędów obsłużone (sekcja 10)
- ✅ Edge cases nie powodują crashów
- ✅ Użytkownik otrzymuje jasne komunikaty błędów

---

### Etap 11: Responsywność i accessibility
**Czas:** 3-4 godziny

**Kroki:**
1. Testowanie responsywności na różnych rozdzielczościach:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px+)
2. Dostosowanie layoutu dla mobile:
   - Karty statystyk: 1 kolumna
   - Tabela: horizontal scroll lub karty zamiast tabeli
   - Filtry: drawer mobilny (slide-in panel)
   - Modal: full screen na mobile
3. Implementacja keyboard navigation:
   - Tab order prawidłowy
   - Escape zamyka modale
   - Enter submituje formularze
   - Arrow keys w dropdown
4. Implementacja ARIA attributes:
   - `aria-label` dla przycisków akcji
   - `aria-live` dla toastów
   - `aria-modal` dla modali
   - `role="table"` dla tabeli (jeśli div)
   - `role="button"` dla clickable elements
5. Testowanie z screen readerem (NVDA/JAWS)
6. Kontrast kolorów (min 4.5:1 dla tekstu)

**Kryteria akceptacji:**
- ✅ Widok działa na wszystkich rozdzielczościach
- ✅ Keyboard navigation działa
- ✅ ARIA attributes dodane
- ✅ Screen reader friendly
- ✅ WCAG 2.1 AA compliance (axe DevTools audit)

---

### Etap 12: Testy
**Czas:** 4-5 godzin

**Kroki:**
1. **Unit testy** (Vitest):
   - Reducers Redux (`donationsSlice`)
   - Custom hook `useDonations`
   - Funkcje pomocnicze (calculateNextEligibleDate, etc.)
   - Zod schema walidacji
2. **Component testy** (React Testing Library):
   - `DonationTable` (rendering, sorting, pagination)
   - `DonationFormModal` (validation, submit, cancel)
   - `DeleteConfirmationModal` (confirm, cancel)
   - `FiltersBar` (filtering, clearing)
   - `ExportDropdown` (menu, export)
3. **Integration testy** (RTL + MSW):
   - Fetch donacji + wyświetlenie w tabeli
   - Dodanie donacji (form submit → API → refetch)
   - Edycja donacji
   - Usunięcie donacji
   - Filtrowanie + sortowanie
   - Eksport CSV/JSON
4. **E2E testy** (Playwright):
   - Scenariusz: Logowanie → przejście do Donacje → dodanie donacji → weryfikacja w tabeli
   - Scenariusz: Filtrowanie donacji → weryfikacja wyników
   - Scenariusz: Edycja donacji → weryfikacja zmian
   - Scenariusz: Usunięcie donacji → weryfikacja zniknięcia z listy

**Lokalizacja:**
- `tests/unit/donations/`
- `tests/integration/donations/`
- `tests/e2e/donations.spec.ts`

**Kryteria akceptacji:**
- ✅ Unit tests coverage >80%
- ✅ Component tests passed
- ✅ Integration tests passed
- ✅ E2E tests passed (kluczowe ścieżki)

---

### Etap 13: Dokumentacja
**Czas:** 1-2 godziny

**Kroki:**
1. Dokumentacja komponentów (JSDoc):
   - Props description
   - Usage examples
   - Edge cases notes
2. README dla widoku:
   - Opis funkcjonalności
   - Struktura komponentów (diagram)
   - API endpoints używane
   - Typy (DTO + ViewModel)
   - Instrukcje developera
3. Aktualizacja Storybook (jeśli używany):
   - Stories dla głównych komponentów
   - Controls dla props
4. Changelog:
   - Dodanie widoku Donacje do historii zmian

**Lokalizacja:**
- Inline JSDoc w komponentach
- `docs/donations-view.md`

**Kryteria akceptacji:**
- ✅ Wszystkie publiczne komponenty mają JSDoc
- ✅ README dokumentuje architekturę i API

---

### Etap 14: Performance optimization
**Czas:** 2-3 godziny

**Kroki:**
1. Code splitting:
   - Lazy load modali (React.lazy)
   - Dynamic import dla `DonationFormModal` i `DeleteConfirmationModal`
2. Memoization:
   - `React.memo` dla `DonationRow` (unikanie re-renderów)
   - `useMemo` dla filtered/sorted data (jeśli frontend filtering)
3. Debouncing:
   - Debounce dla wyszukiwania w filtrach (jeśli search bar)
4. Virtualization:
   - Jeśli lista donacji może być bardzo długa (>100 items): użycie `react-window` lub `react-virtualized`
5. Image optimization:
   - Ikony jako SVG sprites (zamiast indywidualnych importów)
6. Bundle analysis:
   - Sprawdzenie rozmiaru bundla (`npm run build && du -h dist/`)
   - Optymalizacja jeśli > 500KB
7. Lighthouse audit:
   - Performance >90
   - Accessibility >95
   - Best Practices >90

**Kryteria akceptacji:**
- ✅ Bundle size < 500KB (initial load)
- ✅ Lighthouse Performance score >90
- ✅ First Contentful Paint < 1.5s

---

### Etap 15: Deployment i monitoring
**Czas:** 1-2 godziny

**Kroki:**
1. Deployment do staging:
   - Build projektu
   - Deploy na GCP (Cloud Run lub GKE)
   - Weryfikacja działania
2. Smoke testing na staging:
   - Test wszystkich kluczowych ścieżek
   - Weryfikacja integracji z backendem
3. Setup Sentry (error tracking):
   - Integracja Sentry SDK
   - Testowanie captureException
4. Setup analytics (opcjonalnie):
   - Google Analytics lub Plausible
   - Event tracking dla kluczowych akcji (add donation, export, etc.)
5. Monitoring logs:
   - Cloud Logging (GCP)
   - Dashboard dla błędów API

**Kryteria akceptacji:**
- ✅ Widok działa na staging
- ✅ Sentry trackuje błędy
- ✅ Smoke tests passed

---

### Etap 16: Review i polishing
**Czas:** 2-3 godziny

**Kroki:**
1. Code review (team review)
2. UX review (sprawdzenie flow użytkownika)
3. Poprawa drobnych bugów
4. Finalne testy E2E
5. Aktualizacja dokumentacji (jeśli potrzebne)
6. Przygotowanie release notes

**Kryteria akceptacji:**
- ✅ Code review approved
- ✅ UX review approved
- ✅ Wszystkie testy passed
- ✅ Dokumentacja aktualna

---

### Podsumowanie czasu implementacji

| Etap | Opis | Czas |
|------|------|------|
| 0 | Setup i konfiguracja | 1-2h |
| 1 | UI Primitives | 2-3h |
| 2 | Redux Slice i API | 3-4h |
| 3 | Strona główna (Astro) | 1-2h |
| 4 | Nagłówek i statystyki | 2-3h |
| 5 | Toolbar (filtry + eksport) | 4-5h |
| 6 | Tabela + paginacja | 4-5h |
| 7 | Modal dodawania/edycji | 5-6h |
| 8 | Modal usuwania | 2-3h |
| 9 | Integracja komponentów | 2-3h |
| 10 | Obsługa błędów | 3-4h |
| 11 | Responsywność + A11y | 3-4h |
| 12 | Testy | 4-5h |
| 13 | Dokumentacja | 1-2h |
| 14 | Performance | 2-3h |
| 15 | Deployment | 1-2h |
| 16 | Review i polishing | 2-3h |
| **RAZEM** | **Pełna implementacja** | **44-62h** |

**Szacowany czas dla doświadczonego dewelopera:** 5-8 dni roboczych (8h/dzień)

---

### Kolejność priorytetów (MVP vs Nice-to-have)

**MVP (Must Have):**
- Etapy 0-9: Core functionality (dodawanie, edycja, usuwanie, lista, filtry, statystyki)
- Etap 10: Podstawowa obsługa błędów (401, 403, 500)
- Etap 11: Basic responsywność (mobile, desktop)
- Etap 12: Unit tests dla Redux + integration tests dla CRUD
- Etap 15: Deployment

**Nice-to-have (Post-MVP):**
- Eksport do CSV/JSON (można przenieść do kolejnej iteracji)
- Zaawansowana responsywność (tablet optimization)
- Accessibility (WCAG AA - można poprawić później)
- Component tests (RTL)
- E2E tests (Playwright)
- Performance optimization (memoization, virtualization)
- Storybook documentation

---

Dokument został stworzony na podstawie PRD, UI Plan, API Plan, Tech Stack oraz struktury DTO z backendu. Plan jest gotowy do przekazania innemu deweloperowi frontendowemu.
