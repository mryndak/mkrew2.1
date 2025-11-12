# Plan implementacji widoku Raporty

## 1. Przegląd

Widok Raporty (Reports) to interfejs administracyjny przeznaczony dla użytkowników z rolą ADMIN, umożliwiający zarządzanie zgłoszeniami problemów z jakością danych dotyczących stanów krwi w RCKiK. Użytkownicy mogą zgłaszać nieprawidłowości w danych, a administratorzy przeglądają te zgłoszenia, weryfikują je i odpowiednio je rozwiązują lub odrzucają.

Widok składa się z dwóch głównych części:
- **Lista raportów** - tabela ze wszystkimi zgłoszeniami użytkowników z możliwością filtrowania i sortowania
- **Szczegóły raportu** - panel/modal z pełnymi informacjami o zgłoszeniu i możliwością aktualizacji statusu

## 2. Routing widoku

```
/admin/reports
```

**Wymagania dostępu:**
- Użytkownik musi być zalogowany (JWT authentication)
- Użytkownik musi posiadać rolę `ADMIN`
- Middleware `auth.ts` weryfikuje token i rolę
- W przypadku braku uprawnień: przekierowanie do `/login` lub `/dashboard` z komunikatem błędu

## 3. Struktura komponentów

```
AdminReportsPage (Astro SSR)
├── AdminLayout.astro
│   ├── AdminSidebar.astro
│   └── AdminNavbar.astro
└── ReportsView (React client:load)
    ├── ReportsFilters (React)
    │   ├── StatusFilter (Select)
    │   ├── RckikFilter (Select z autocomplete)
    │   ├── DateRangeFilter (DatePicker)
    │   └── SearchInput (Input)
    ├── ReportsTable (React client:idle)
    │   ├── ReportsTableHeader (sortowanie)
    │   ├── ReportsTableRow[] (wirtualizacja dla >50)
    │   │   └── ReportStatusBadge
    │   └── Pagination
    ├── ReportDetailsModal (React client:load)
    │   ├── ReportHeader
    │   ├── ReportInfoSection
    │   │   ├── UserInfo
    │   │   ├── RckikInfo
    │   │   └── SnapshotInfo
    │   ├── ReportDescription
    │   ├── ScreenshotViewer (lazy load)
    │   ├── AdminNotesSection
    │   │   └── AdminNotesTextarea
    │   └── ReportActionsPanel
    │       ├── StatusSelect
    │       └── ActionButtons (Save, Reject, Resolve, Close)
    └── EmptyState (gdy brak raportów)
```

## 4. Szczegóły komponentów

### 4.1 ReportsView

**Opis komponentu:**
Główny kontener dla widoku raportów, zarządzający stanem całego interfejsu oraz komunikacją z API.

**Główne elementy:**
- Nagłówek z tytułem "Raporty użytkowników" i statystykami (nowe/w trakcie/rozwiązane)
- Panel filtrów (`ReportsFilters`)
- Tabela raportów (`ReportsTable`)
- Modal szczegółów (`ReportDetailsModal`)
- Komunikaty toast dla akcji (sukces/błąd)

**Obsługiwane interakcje:**
- Ładowanie listy raportów z API
- Filtrowanie raportów (status, RCKiK, zakres dat, wyszukiwanie)
- Sortowanie po kolumnach
- Paginacja
- Otwieranie modalu szczegółów po kliknięciu w wiersz
- Odświeżanie listy po aktualizacji raportu

**Warunki walidacji:**
- Brak walidacji formularzy (tylko filtrowanie)
- Weryfikacja uprawnień admina (middleware)

**Typy:**
- `ReportsViewProps` - props głównego komponentu
- `ReportListResponse` - odpowiedź z API dla listy raportów
- `UserReportDto` - szczegóły pojedynczego raportu
- `ReportsFilters` - stan filtrów

**Propsy:**
```typescript
interface ReportsViewProps {
  initialData?: ReportListResponse; // Opcjonalne dane SSR
}
```

### 4.2 ReportsFilters

**Opis komponentu:**
Panel filtrów pozwalający administratorowi na zawężenie listy raportów według różnych kryteriów.

**Główne elementy:**
- `StatusFilter` - dropdown z opcjami: Wszystkie, NEW, IN_REVIEW, RESOLVED, REJECTED
- `RckikFilter` - select z autocomplete dla centrów RCKiK
- `DateRangeFilter` - picker zakresu dat (od-do)
- `SearchInput` - pole tekstowe z debounce (300ms) do wyszukiwania w opisie
- Przycisk "Wyczyść filtry"

**Obsługiwane interakcje:**
- Zmiana filtrów aktualizuje query params w URL (shareable links)
- Automatyczne odświeżanie tabeli po zmianie filtru (z debounce dla wyszukiwania)
- Reset filtrów przywraca domyślne wartości

**Warunki walidacji:**
- `fromDate` nie może być późniejsza niż `toDate`
- Walidacja formatu daty (ISO 8601)

**Typy:**
- `ReportsFiltersProps`
- `ReportsFilterState`

**Propsy:**
```typescript
interface ReportsFiltersProps {
  filters: ReportsFilterState;
  onFiltersChange: (filters: ReportsFilterState) => void;
  rckikOptions: RckikBasicDto[];
}
```

### 4.3 ReportsTable

**Opis komponentu:**
Tabela wyświetlająca listę raportów z możliwością sortowania i paginacji.

**Główne elementy:**
- Nagłówki kolumn (klikalne dla sortowania):
  - ID
  - Status
  - Użytkownik (imię + nazwisko)
  - RCKiK
  - Data utworzenia
  - Akcje
- Wiersze z danymi raportów (`ReportsTableRow`)
- Wskaźnik ładowania (skeleton loader)
- Paginacja na dole tabeli
- Badge z liczbą wyników

**Obsługiwane interakcje:**
- Kliknięcie w wiersz otwiera modal szczegółów
- Sortowanie po kolumnach (ASC/DESC)
- Zmiana strony paginacji
- Zmiana liczby elementów na stronie (20, 50, 100)

**Warunki walidacji:**
- Brak szczególnej walidacji

**Typy:**
- `ReportsTableProps`
- `SortConfig`
- `PaginationState`

**Propsy:**
```typescript
interface ReportsTableProps {
  reports: UserReportDto[];
  loading: boolean;
  sortConfig: SortConfig;
  onSortChange: (field: string) => void;
  onRowClick: (reportId: number) => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}
```

### 4.4 ReportsTableRow

**Opis komponentu:**
Pojedynczy wiersz tabeli reprezentujący jeden raport.

**Główne elementy:**
- ID raportu
- Badge statusu (`ReportStatusBadge` z kolorami: NEW=blue, IN_REVIEW=yellow, RESOLVED=green, REJECTED=red)
- Informacja o użytkowniku (imię, nazwisko)
- Nazwa RCKiK
- Data utworzenia (format: DD.MM.YYYY HH:mm)
- Ikona podglądu (otwiera modal)

**Obsługiwane interakcje:**
- Kliknięcie w wiersz wywołuje `onRowClick` z ID raportu
- Hover effect (zmiana tła)

**Warunki walidacji:**
- Brak

**Typy:**
- `ReportsTableRowProps`

**Propsy:**
```typescript
interface ReportsTableRowProps {
  report: UserReportDto;
  onClick: (reportId: number) => void;
}
```

### 4.5 ReportDetailsModal

**Opis komponentu:**
Modal wyświetlający pełne szczegóły raportu i umożliwiający administratorowi aktualizację statusu oraz dodanie notatek.

**Główne elementy:**
- Nagłówek z ID i statusem raportu
- Sekcja informacji o użytkowniku (imię, nazwisko, email)
- Sekcja informacji o RCKiK (nazwa, kod, miasto) z linkiem do `/rckik/{id}`
- Sekcja snapshot (jeśli `bloodSnapshotId` istnieje) - dane snapshota
- Opis zgłoszenia (textarea readonly)
- Screenshot viewer (jeśli `screenshotUrl` istnieje) - możliwość powiększenia
- Sekcja notatek admina (textarea edytowalne)
- Select statusu (NEW, IN_REVIEW, RESOLVED, REJECTED)
- Panel akcji: przyciski "Zapisz", "Anuluj", "Rozwiąż", "Odrzuć"
- Informacje o rozwiązaniu (jeśli `resolvedBy` i `resolvedAt` istnieją)

**Obsługiwane interakcje:**
- Edycja notatek admina (max 2000 znaków)
- Zmiana statusu raportu
- Zapisanie zmian (wywołanie `PATCH /api/v1/admin/reports/{id}`)
- Szybkie akcje: "Rozwiąż" (ustawia status=RESOLVED), "Odrzuć" (status=REJECTED)
- Zamknięcie modalu (ESC lub kliknięcie tła)
- Focus trap - nawigacja klawiaturą wewnątrz modalu

**Warunki walidacji:**
- `status` musi być jednym z: NEW, IN_REVIEW, RESOLVED, REJECTED
- `adminNotes` max 2000 znaków
- Przed zapisaniem: weryfikacja czy wprowadzono zmiany

**Typy:**
- `ReportDetailsModalProps`
- `UpdateUserReportRequest`
- `UserReportDto`

**Propsy:**
```typescript
interface ReportDetailsModalProps {
  reportId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Callback po aktualizacji (odświeża listę)
}
```

### 4.6 ReportStatusBadge

**Opis komponentu:**
Komponent wizualny wyświetlający status raportu w formie kolorowego badge'a.

**Główne elementy:**
- Badge z tekstem i ikoną
- Kolory według statusu:
  - NEW: niebieski (#3B82F6)
  - IN_REVIEW: żółty (#F59E0B)
  - RESOLVED: zielony (#10B981)
  - REJECTED: czerwony (#EF4444)
- Ikony dla każdego statusu (opcjonalnie)

**Obsługiwane interakcje:**
- Brak interakcji (komponent prezentacyjny)

**Warunki walidacji:**
- Brak

**Typy:**
- `ReportStatusBadgeProps`

**Propsy:**
```typescript
interface ReportStatusBadgeProps {
  status: 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  size?: 'small' | 'medium' | 'large';
}
```

### 4.7 EmptyState

**Opis komponentu:**
Komponent wyświetlany gdy brak raportów spełniających kryteria filtrów.

**Główne elementy:**
- Ikona (np. dokument z lupą)
- Tytuł: "Brak raportów"
- Opis: "Nie znaleziono raportów spełniających wybrane kryteria."
- Przycisk "Wyczyść filtry" (jeśli aktywne)

**Obsługiwane interakcje:**
- Kliknięcie przycisku resetuje filtry

**Warunki walidacji:**
- Brak

**Typy:**
- `EmptyStateProps`

**Propsy:**
```typescript
interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}
```

## 5. Typy

### 5.1 DTO z backendu (Java)

```typescript
// Backend DTOs (do użycia w frontendzie - TypeScript equivalent)

interface UserReportDto {
  id: number;
  user: UserSummaryDto;
  rckikId: number;
  rckikName: string;
  bloodSnapshotId?: number;
  description: string;
  screenshotUrl?: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: UserSummaryDto;
  resolvedAt?: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface UserSummaryDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface CreateUserReportRequest {
  rckikId: number;
  bloodSnapshotId?: number;
  description: string; // max 2000 chars
  screenshotUrl?: string; // max 2048 chars
}

interface UpdateUserReportRequest {
  status?: ReportStatus;
  adminNotes?: string; // max 2000 chars
}

type ReportStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}
```

### 5.2 Typy ViewModel (Frontend)

```typescript
// Frontend specific types

interface ReportListResponse {
  reports: UserReportDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface ReportsFilterState {
  status?: ReportStatus | 'ALL';
  rckikId?: number;
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
  searchQuery?: string;
}

interface SortConfig {
  field: 'id' | 'status' | 'createdAt' | 'rckikName' | 'userName';
  order: 'ASC' | 'DESC';
}

interface PaginationState {
  page: number; // 0-indexed
  size: number; // 20, 50, 100
  totalElements: number;
  totalPages: number;
}

interface ReportsViewState {
  reports: UserReportDto[];
  loading: boolean;
  error: string | null;
  filters: ReportsFilterState;
  sortConfig: SortConfig;
  pagination: PaginationState;
  selectedReportId: number | null;
  modalOpen: boolean;
}

interface ReportStatistics {
  total: number;
  new: number;
  inReview: number;
  resolved: number;
  rejected: number;
}
```

## 6. Zarządzanie stanem

### 6.1 Redux Toolkit Store

Widok Raporty nie wymaga skomplikowanego globalnego stanu, ponieważ jest to widok administracyjny używany sporadycznie. Zarządzanie stanem odbywa się głównie na poziomie komponentu.

**Struktura stanu lokalnego (React useState + useReducer):**

```typescript
// Hook: useReportsView
function useReportsView() {
  const [state, dispatch] = useReducer(reportsReducer, initialState);

  // Actions
  const loadReports = async (filters: ReportsFilterState, pagination: PaginationState, sort: SortConfig) => {
    // Fetch data from API
  };

  const updateReport = async (reportId: number, updates: UpdateUserReportRequest) => {
    // Update report via API
  };

  return { state, loadReports, updateReport };
}
```

**Opcjonalnie: Redux slice dla cache'owania**

Jeśli widok jest często używany i chcemy cache'ować dane:

```typescript
// src/lib/store/slices/adminReportsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface AdminReportsState {
  reports: UserReportDto[];
  statistics: ReportStatistics | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

export const fetchReports = createAsyncThunk(
  'adminReports/fetchReports',
  async (params: { filters: ReportsFilterState, page: number, size: number, sort: SortConfig }) => {
    // API call
  }
);

const adminReportsSlice = createSlice({
  name: 'adminReports',
  initialState,
  reducers: {
    clearReports: (state) => {
      state.reports = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports = action.payload.reports;
        state.loading = false;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch reports';
        state.loading = false;
      });
  },
});
```

### 6.2 Custom Hook: useReports

```typescript
// src/lib/hooks/useReports.ts
import { useState, useCallback, useEffect } from 'react';
import { fetchReports, updateReportStatus } from '@/lib/api/endpoints/admin';
import { useDebounce } from './useDebounce';

export function useReports() {
  const [state, setState] = useState<ReportsViewState>(initialState);

  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const loadReports = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetchReports({
        status: state.filters.status !== 'ALL' ? state.filters.status : undefined,
        rckikId: state.filters.rckikId,
        fromDate: state.filters.fromDate,
        toDate: state.filters.toDate,
        page: state.pagination.page,
        size: state.pagination.size,
        sortBy: state.sortConfig.field,
        sortOrder: state.sortConfig.order,
      });

      setState(prev => ({
        ...prev,
        reports: response.reports,
        pagination: {
          ...prev.pagination,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        },
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Nie udało się załadować raportów',
        loading: false,
      }));
    }
  }, [state.filters, state.pagination.page, state.pagination.size, state.sortConfig]);

  // Auto-reload on filter/sort/pagination change
  useEffect(() => {
    loadReports();
  }, [debouncedSearchQuery, state.filters.status, state.filters.rckikId,
      state.filters.fromDate, state.filters.toDate, state.pagination.page,
      state.pagination.size, state.sortConfig]);

  const updateReport = useCallback(async (reportId: number, updates: UpdateUserReportRequest) => {
    try {
      await updateReportStatus(reportId, updates);
      // Reload reports after update
      await loadReports();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Nie udało się zaktualizować raportu' };
    }
  }, [loadReports]);

  return {
    state,
    actions: {
      setFilters: (filters: ReportsFilterState) => setState(prev => ({ ...prev, filters })),
      setSortConfig: (sortConfig: SortConfig) => setState(prev => ({ ...prev, sortConfig })),
      setPage: (page: number) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } })),
      setPageSize: (size: number) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, size, page: 0 } })),
      openModal: (reportId: number) => setState(prev => ({ ...prev, selectedReportId: reportId, modalOpen: true })),
      closeModal: () => setState(prev => ({ ...prev, selectedReportId: null, modalOpen: false })),
      updateReport,
      refreshReports: loadReports,
    },
  };
}
```

## 7. Integracja API

### 7.1 Endpointy API

**Lista raportów:**
```typescript
GET /api/v1/admin/reports
Query Params:
  - status?: 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'
  - rckikId?: number
  - fromDate?: string (ISO 8601)
  - toDate?: string (ISO 8601)
  - page?: number (default: 0)
  - size?: number (default: 20, max: 100)
  - sortBy?: string (default: 'createdAt')
  - sortOrder?: 'ASC' | 'DESC' (default: 'DESC')

Response: 200 OK
{
  "reports": UserReportDto[],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3
}

Error: 401 Unauthorized, 403 Forbidden (nie admin)
```

**Aktualizacja raportu:**
```typescript
PATCH /api/v1/admin/reports/{id}
Request Body:
{
  "status": "RESOLVED",
  "adminNotes": "Zweryfikowano z RCKiK..."
}

Response: 200 OK
{
  "id": 701,
  "status": "RESOLVED",
  "adminNotes": "Zweryfikowano z RCKiK...",
  "resolvedBy": "admin@mkrew.pl",
  "resolvedAt": "2025-01-08T19:00:00"
}

Error: 400 Bad Request, 403 Forbidden, 404 Not Found
```

**Szczegóły pojedynczego raportu (opcjonalnie, jeśli SSR):**
```typescript
GET /api/v1/admin/reports/{id}
Response: 200 OK
UserReportDto
```

### 7.2 API Client Functions

```typescript
// src/lib/api/endpoints/admin.ts
import apiClient from '@/lib/api/client';

export interface FetchReportsParams {
  status?: ReportStatus;
  rckikId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export async function fetchReports(params: FetchReportsParams): Promise<ReportListResponse> {
  const response = await apiClient.get<ReportListResponse>('/admin/reports', { params });
  return response.data;
}

export async function updateReportStatus(
  reportId: number,
  updates: UpdateUserReportRequest
): Promise<UserReportDto> {
  const response = await apiClient.patch<UserReportDto>(`/admin/reports/${reportId}`, updates);
  return response.data;
}

export async function fetchReportDetails(reportId: number): Promise<UserReportDto> {
  const response = await apiClient.get<UserReportDto>(`/admin/reports/${reportId}`);
  return response.data;
}
```

### 7.3 Axios Interceptor (globalny)

Obsługa błędów i tokenów w `src/lib/api/client.ts`:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // Forbidden - show toast
      showToast('Brak uprawnień do wykonania tej operacji', 'error');
    }
    if (error.response?.status === 404) {
      showToast('Raport nie został znaleziony', 'error');
    }
    return Promise.reject(error);
  }
);
```

## 8. Interakcje użytkownika

### 8.1 Scenariusz główny: Przeglądanie i aktualizacja raportu

1. **Admin wchodzi na `/admin/reports`**
   - Widzi tabelę z wszystkimi raportami (domyślnie sortowane po dacie utworzenia DESC)
   - Widzi statystyki w nagłówku (liczba nowych, w trakcie, rozwiązanych)

2. **Filtrowanie raportów**
   - Admin wybiera status "NEW" z dropdowna
   - Tabela automatycznie odświeża się i pokazuje tylko nowe raporty
   - URL aktualizuje się: `/admin/reports?status=NEW`

3. **Wyszukiwanie w opisie**
   - Admin wpisuje "A+ niepoprawne" w pole wyszukiwania
   - Po 300ms debounce tabela filtruje raporty zawierające tę frazę w opisie

4. **Sortowanie**
   - Admin klika w nagłówek kolumny "Data utworzenia"
   - Tabela sortuje się rosnąco (od najstarszych)
   - Ikona strzałki zmienia kierunek

5. **Otwieranie szczegółów**
   - Admin klika w wiersz raportu ID=701
   - Otwiera się modal z pełnymi szczegółami raportu
   - Modal pokazuje: użytkownika, RCKiK, opis, screenshot, obecny status

6. **Aktualizacja raportu**
   - Admin czyta opis: "Poziom A+ wydaje się niepoprawny"
   - Admin zmienia status na "IN_REVIEW"
   - Admin dodaje notatkę: "Sprawdzam z RCKiK Warszawa..."
   - Admin klika "Zapisz"
   - Pokazuje się toast: "Raport zaktualizowany pomyślnie"
   - Modal się zamyka
   - Tabela odświeża się automatycznie

7. **Rozwiązanie raportu**
   - Admin ponownie otwiera raport ID=701
   - Po weryfikacji admin klika przycisk "Rozwiąż"
   - System automatycznie ustawia status=RESOLVED i dodaje timestamp
   - Admin dodaje notatkę końcową: "Zweryfikowano z RCKiK. Dane były poprawne."
   - Toast: "Raport został rozwiązany"

8. **Paginacja**
   - Admin widzi 20 raportów na stronie
   - Klika "Następna strona" - ładuje się strona 2
   - Admin zmienia rozmiar strony na 50 - tabela odświeża się

### 8.2 Scenariusze alternatywne

**Brak raportów:**
- Admin wchodzi na `/admin/reports`
- Widzi komponent `EmptyState` z komunikatem "Brak raportów"
- Jeśli ma aktywne filtry - widzi przycisk "Wyczyść filtry"

**Błąd ładowania:**
- API zwraca 500 Internal Server Error
- Pokazuje się toast z błędem: "Nie udało się załadować raportów. Spróbuj ponownie."
- Przycisk "Odśwież" w pustym stanie

**Błąd aktualizacji:**
- Admin próbuje zapisać raport z pustymi notatkami (dozwolone)
- API zwraca 400 Bad Request (np. status nieprawidłowy)
- Toast: "Nie udało się zaktualizować raportu: Nieprawidłowy status"

**Screenshot nie ładuje się:**
- Admin otwiera raport ze screenshotem
- URL screenshota jest nieprawidłowy lub obrazek został usunięty
- Pokazuje się placeholder "Nie można załadować obrazka" z ikoną

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie frontendu

**ReportDetailsModal - Formularz aktualizacji:**

1. **Status:**
   - Wymagany: Tak (ale zawsze ma wartość)
   - Dozwolone wartości: NEW, IN_REVIEW, RESOLVED, REJECTED
   - Walidacja: Select z ograniczonymi opcjami
   - Komunikat błędu: "Wybierz prawidłowy status"

2. **Admin Notes:**
   - Wymagany: Nie
   - Max długość: 2000 znaków
   - Walidacja: Real-time counter znaków pod textarea
   - Komunikat błędu: "Notatki nie mogą przekraczać 2000 znaków" (czerwony tekst gdy > 2000)
   - Blokada przycisku "Zapisz" gdy przekroczono limit

**ReportsFilters - Walidacja dat:**

1. **fromDate i toDate:**
   - Format: ISO 8601 date (YYYY-MM-DD)
   - Walidacja: `fromDate <= toDate`
   - Komunikat błędu: "Data od nie może być późniejsza niż data do"
   - Walidacja przed wysłaniem zapytania do API

**Przykład walidacji (React Hook Form + Zod):**

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const updateReportSchema = z.object({
  status: z.enum(['NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED']),
  adminNotes: z.string().max(2000, 'Notatki nie mogą przekraczać 2000 znaków').optional(),
});

type UpdateReportFormData = z.infer<typeof updateReportSchema>;

function ReportDetailsModal({ reportId }: Props) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<UpdateReportFormData>({
    resolver: zodResolver(updateReportSchema),
    defaultValues: {
      status: report.status,
      adminNotes: report.adminNotes || '',
    },
  });

  const adminNotes = watch('adminNotes');
  const charsRemaining = 2000 - (adminNotes?.length || 0);

  const onSubmit = async (data: UpdateReportFormData) => {
    // Call API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
      <textarea {...register('adminNotes')} />
      <span className={charsRemaining < 0 ? 'text-red-500' : 'text-gray-500'}>
        Pozostało: {charsRemaining} znaków
      </span>
      {errors.adminNotes && <p className="text-red-500">{errors.adminNotes.message}</p>}
      {/* ... */}
    </form>
  );
}
```

### 9.2 Warunki stanu UI

**Przycisk "Zapisz" w modalu:**
- Disabled gdy:
  - Trwa zapisywanie (`loading === true`)
  - Brak zmian w formularzu (porównanie z początkowymi wartościami)
  - Błędy walidacji (`!isValid`)
  - Przekroczony limit znaków w adminNotes

**Przycisk "Rozwiąż" / "Odrzuć":**
- Disabled gdy:
  - Raport już ma status RESOLVED lub REJECTED
  - Trwa zapisywanie

**Tabela raportów:**
- Skeleton loader gdy `loading === true`
- EmptyState gdy `reports.length === 0 && !loading`
- Error state gdy `error !== null`

**Filtry:**
- DateRangePicker disabled gdy trwa ładowanie
- Reset filters button disabled gdy brak aktywnych filtrów

## 10. Obsługa błędów

### 10.1 Błędy API

**401 Unauthorized:**
- Przyczyna: Brak tokenu lub token wygasł
- Obsługa: Axios interceptor automatycznie przekierowuje do `/login`
- UI: Nie wymaga dodatkowej obsługi (redirect)

**403 Forbidden:**
- Przyczyna: Użytkownik nie ma roli ADMIN
- Obsługa:
  - Middleware Astro blokuje dostęp do strony (SSR)
  - Toast: "Brak uprawnień do przeglądania raportów"
  - Redirect do `/dashboard`

**404 Not Found:**
- Przyczyna: Raport o podanym ID nie istnieje (rzadkie)
- Obsługa:
  - Toast: "Raport nie został znaleziony"
  - Zamknięcie modalu
  - Odświeżenie listy raportów

**400 Bad Request:**
- Przyczyna: Nieprawidłowe dane w żądaniu (np. błędny status)
- Obsługa:
  - Toast: "Nie udało się zaktualizować raportu: [szczegóły błędu z API]"
  - Formularz pozostaje otwarty
  - Podświetlenie błędnych pól (jeśli API zwraca `details`)

**500 Internal Server Error:**
- Przyczyna: Błąd serwera
- Obsługa:
  - Toast: "Wystąpił błąd serwera. Spróbuj ponownie później."
  - Przycisk "Odśwież" w toastcie
  - Log do Sentry/Error Reporting

**429 Too Many Requests:**
- Przyczyna: Rate limit przekroczony
- Obsługa:
  - Toast: "Zbyt wiele żądań. Spróbuj ponownie za [retryAfter] sekund."
  - Disable przycisku akcji na czas `retryAfter`
  - Countdown timer w toastcie

### 10.2 Błędy walidacji

**Frontend validation errors:**
- Walidacja przed wysłaniem do API (Zod schema)
- Komunikaty inline pod polami formularza
- Czerwone obramowanie błędnych pól
- Blokada przycisku "Zapisz"

**Przykład obsługi:**
```typescript
try {
  await updateReport(reportId, formData);
  showToast('Raport zaktualizowany pomyślnie', 'success');
  closeModal();
  refreshReports();
} catch (error) {
  if (error.response?.status === 400) {
    const details = error.response.data.details;
    if (details && Array.isArray(details)) {
      // Show field-specific errors
      details.forEach((err: any) => {
        setError(err.field, { message: err.message });
      });
    } else {
      showToast(`Błąd walidacji: ${error.response.data.message}`, 'error');
    }
  } else if (error.response?.status === 403) {
    showToast('Brak uprawnień do aktualizacji raportu', 'error');
  } else {
    showToast('Nie udało się zaktualizować raportu', 'error');
  }
}
```

### 10.3 Błędy sieciowe

**Network Error (offline):**
- Axios timeout (default: 10s)
- Obsługa:
  - Toast: "Brak połączenia z internetem"
  - Przycisk "Spróbuj ponownie"
  - Retry logic (maksymalnie 3 próby z exponential backoff)

**Timeout:**
- Żądanie trwa > 10s
- Toast: "Żądanie trwało zbyt długo. Spróbuj ponownie."

## 11. Kroki implementacji

### Krok 1: Setup struktury projektu (1h)
1. Utworzenie pliku `src/pages/admin/reports.astro`
2. Dodanie middleware auth dla roli ADMIN w `src/middleware/auth.ts`
3. Utworzenie struktury folderów:
   - `src/components/admin/reports/`
   - `src/lib/api/endpoints/admin.ts` (jeśli nie istnieje)
   - `src/lib/types/reports.ts`

### Krok 2: Typy i API client (1.5h)
1. Definicja wszystkich typów TypeScript w `src/lib/types/reports.ts`:
   - `UserReportDto`, `UpdateUserReportRequest`, `ReportListResponse`, etc.
2. Implementacja funkcji API w `src/lib/api/endpoints/admin.ts`:
   - `fetchReports`, `updateReportStatus`, `fetchReportDetails`
3. Testy API functions z MSW (Mock Service Worker)

### Krok 3: Custom hook useReports (2h)
1. Implementacja `src/lib/hooks/useReports.ts`:
   - Stan lokalny: filters, pagination, sorting, reports
   - Funkcje: loadReports, updateReport, setFilters, etc.
   - Auto-refresh przy zmianie filtrów (useEffect + debounce)
2. Testy hooka (React Testing Library + renderHook)

### Krok 4: UI Primitives (jeśli nie istnieją) (1h)
1. Sprawdzenie dostępności w `src/components/ui/`:
   - `Select.tsx`, `Input.tsx`, `Textarea.tsx`, `Badge.tsx`, `Modal.tsx`, `Button.tsx`
2. Implementacja brakujących komponentów z accessibility (ARIA)
3. Dodanie wariantów dla `Badge` (status colors)

### Krok 5: ReportsFilters component (2h)
1. Utworzenie `src/components/admin/reports/ReportsFilters.tsx`
2. Implementacja:
   - StatusFilter (Select z opcjami)
   - RckikFilter (Select z autocomplete - opcjonalnie combo z API)
   - DateRangeFilter (DatePicker - użycie biblioteki np. react-datepicker)
   - SearchInput (Input z debounce)
   - Reset button
3. Synchronizacja z URL query params (useSearchParams z Astro lub React Router)
4. Testy komponentu (RTL)

### Krok 6: ReportStatusBadge component (0.5h)
1. Utworzenie `src/components/admin/reports/ReportStatusBadge.tsx`
2. Mapowanie statusów na kolory i ikony
3. Warianty rozmiaru (small, medium, large)
4. Testy snapshot

### Krok 7: ReportsTableRow component (1h)
1. Utworzenie `src/components/admin/reports/ReportsTableRow.tsx`
2. Renderowanie danych raportu z `UserReportDto`
3. Formatowanie daty (DD.MM.YYYY HH:mm)
4. Hover effect i kliknięcie
5. Testy

### Krok 8: ReportsTable component (3h)
1. Utworzenie `src/components/admin/reports/ReportsTable.tsx`
2. Implementacja:
   - Nagłówki z sortowaniem (ikony strzałek)
   - Wirtualizacja dla >50 elementów (react-window lub @tanstack/react-virtual)
   - Skeleton loader (podczas ładowania)
   - EmptyState (gdy brak danych)
   - Paginacja (komponent z UI)
3. Obsługa kliknięcia w wiersz (wywołanie onRowClick)
4. Accessibility (tabindex, aria-sort)
5. Testy

### Krok 9: ReportDetailsModal component (4h)
1. Utworzenie `src/components/admin/reports/ReportDetailsModal.tsx`
2. Implementacja layout modalu:
   - Nagłówek z ID i statusem
   - Sekcje informacji (użytkownik, RCKiK, snapshot)
   - Opis (readonly textarea)
   - Screenshot viewer (lazy load, powiększenie)
   - Formularz edycji (adminNotes + status select)
   - Panel akcji (przyciski)
3. React Hook Form + Zod validation:
   - Schema walidacji
   - Error handling
   - Counter znaków dla adminNotes
4. Obsługa API calls:
   - Fetch report details (jeśli nie przekazane z listy)
   - Update report (PATCH)
5. Focus trap i keyboard navigation (ESC, Tab)
6. Accessibility (aria-modal, aria-labelledby)
7. Testy (RTL + user interactions)

### Krok 10: ReportsView główny komponent (2h)
1. Utworzenie `src/components/admin/reports/ReportsView.tsx`
2. Integracja wszystkich podkomponentów:
   - ReportsFilters
   - ReportsTable
   - ReportDetailsModal
3. Użycie `useReports` hook
4. Statystyki w nagłówku (zliczanie z reports)
5. Toast notifications (useToast hook)
6. Loading states i error handling
7. Testy integracyjne

### Krok 11: Strona Astro (1h)
1. Implementacja `src/pages/admin/reports.astro`:
   - Layout: `AdminLayout.astro`
   - SSR: Sprawdzenie auth i roli (middleware)
   - Opcjonalnie: Pre-fetch danych dla SSR (getStaticProps equivalent)
   - Hydratacja komponentu `ReportsView` (client:load)
2. SEO meta tags
3. Breadcrumbs

### Krok 12: AdminLayout i nawigacja (0.5h)
1. Sprawdzenie `src/layouts/AdminLayout.astro`
2. Dodanie linku "Raporty" do `AdminSidebar.astro`
3. Ikona dla menu (np. document-report icon)
4. Active state dla `/admin/reports`

### Krok 13: Stylowanie Tailwind CSS (2h)
1. Stylowanie wszystkich komponentów z Tailwind utility classes
2. Responsywność (mobile, tablet, desktop):
   - Mobile: Tabela z przewijaniem poziomym lub lista kart
   - Tablet: Pełna tabela z mniejszymi kolumnami
   - Desktop: Pełna tabela
3. Dark mode support (jeśli aplikacja go obsługuje)
4. Hover states, focus states, transitions
5. Sprawdzenie kontrastu (WCAG AA)

### Krok 14: Accessibility audit (1h)
1. Uruchomienie axe DevTools na `/admin/reports`
2. Naprawa wszystkich critical i serious issues
3. Keyboard navigation testing:
   - Tab przez filtry, tabelę, modal
   - Sortowanie klawiaturą
   - Zamknięcie modalu ESC
4. Screen reader testing (NVDA lub JAWS)
5. ARIA labels i descriptions
6. Semantic HTML

### Krok 15: Testy End-to-End (2h)
1. Utworzenie `tests/e2e/admin-reports.spec.ts` (Playwright)
2. Scenariusze testowe:
   - Admin loguje się i wchodzi na /admin/reports
   - Filtrowanie raportów po statusie
   - Wyszukiwanie w opisie
   - Sortowanie kolumn
   - Otwieranie modalu szczegółów
   - Aktualizacja statusu raportu
   - Zapisanie notatek admina
   - Zamknięcie modalu ESC
   - Paginacja
3. Edge cases:
   - Brak raportów (empty state)
   - Błąd API (mock 500)
   - Przekroczenie limitu znaków w notatkach

### Krok 16: Optimalizacje performance (1h)
1. Code splitting:
   - Lazy load ReportDetailsModal (React.lazy + Suspense)
   - Lazy load ScreenshotViewer
2. Memoizacja:
   - useMemo dla sortowanych/filtrowanych danych
   - React.memo dla ReportsTableRow
3. Debounce dla search input (już zaimplementowane)
4. Wirtualizacja tabeli dla >50 elementów
5. Lighthouse audit (Performance > 90)

### Krok 17: Dokumentacja (0.5h)
1. Dodanie JSDoc comments do głównych funkcji i komponentów
2. README w `src/components/admin/reports/README.md`:
   - Opis architektury
   - Sposób użycia komponentów
   - Przykłady customizacji
3. Aktualizacja głównego README projektu (dodanie widoku Raporty)

### Krok 18: Code review i cleanup (1h)
1. Self code review:
   - Usunięcie console.logs
   - Sprawdzenie TODO comments
   - Formatowanie Prettier
   - Lint ESLint (0 errors, 0 warnings)
2. Refactoring duplicated code
3. Optymalizacja importów (tree shaking)
4. Sprawdzenie bundle size (webpack-bundle-analyzer)

### Krok 19: Deployment i testing na staging (1h)
1. Merge do branch'a `develop` lub `staging`
2. Deploy na staging environment (GCP Cloud Run lub GKE)
3. Smoke testing na staging:
   - Sprawdzenie wszystkich funkcji widoku
   - Weryfikacja integracji z prawdziwym API
   - Sprawdzenie logów błędów
4. Performance testing (Lighthouse na staging)
5. Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Krok 20: Finalizacja i merge do main (0.5h)
1. Utworzenie Pull Requesta z pełnym opisem zmian
2. Code review przez zespół (jeśli jest)
3. Naprawa uwag z review
4. Merge do branch'a `main`
5. Deploy na produkcję
6. Monitoring po wdrożeniu (sprawdzenie błędów w Sentry, metryki w Cloud Monitoring)

---

**Łączny szacowany czas implementacji: 27-30 godzin**

**Priorytet kroków:**
- P0 (Critical): Kroki 1-11 (Core functionality)
- P1 (High): Kroki 12-15 (UI polish, accessibility, testing)
- P2 (Medium): Kroki 16-18 (Optimization, docs, cleanup)
- P3 (Low): Kroki 19-20 (Deployment - zależne od procesów CI/CD)

**Możliwe równoległe wykonanie:**
- Kroki 4-8 mogą być wykonywane równolegle przez różnych developerów
- Krok 13 (styling) może być robiony równolegle z implementacją komponentów
- Krok 14 (a11y) i 15 (e2e) mogą być równoległe

**Zależności zewnętrzne:**
- API endpoints muszą być gotowe i działające (backend)
- Komponenty UI primitives (`Button`, `Modal`, `Select`, etc.)
- Axios client z interceptorami
- Middleware auth dla Astro
- Toast notification system (globalny)

**Ryzyka i mitygacje:**
- **Ryzyko:** API nie jest gotowe → **Mitygacja:** Użycie MSW (Mock Service Worker) dla development
- **Ryzyko:** Brak komponentów UI → **Mitygacja:** Implementacja w kroku 4 lub użycie biblioteki (Radix UI, Headless UI)
- **Ryzyko:** Performance issues przy dużej liczbie raportów → **Mitygacja:** Wirtualizacja (react-window) + paginacja server-side
- **Ryzyko:** Problemy z accessibility → **Mitygacja:** Wczesne testy z axe DevTools, focus na semantic HTML
