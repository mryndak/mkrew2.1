# Plan implementacji widoku: Ręczne wprowadzanie stanów krwi

## 1. Przegląd

Widok "Ręczne wprowadzanie stanów krwi" umożliwia administratorom systemu ręczne dodawanie danych o poziomach krwi dla poszczególnych centrów RCKiK. Jest to kluczowa funkcjonalność zapewniająca ciągłość danych w przypadku awarii scrapera lub braku dostępu do źródłowych stron RCKiK.

**Główne cele widoku:**
- Umożliwienie ręcznego wprowadzania snapshotów krwi (w tym danych historycznych/wstecznych)
- Przeglądanie i filtrowanie istniejących snapshotów z rozróżnieniem źródła (manual/scraped)
- Edycja i usuwanie ręcznie wprowadzonych snapshotów
- Monitoring statystyk ręcznie wprowadzonych danych
- Pełny audit trail wszystkich operacji

**User Story (US-028):**
Jako administrator systemu chcę mieć możliwość ręcznego wprowadzenia danych o stanie krwi dla danego RCKiK (w tym danych wstecz), aby zapewnić ciągłość danych w przypadku awarii scrapera lub braku dostępu do źródłowych stron RCKiK.

## 2. Routing widoku

**Ścieżka:** `/admin/blood-snapshots`

**Wymagania dostępu:**
- Autentykacja: wymagana (JWT token)
- Autoryzacja: wymagana rola `ADMIN`
- Layout: `AdminLayout.astro`
- Rendering: SSR (Server-Side Rendering)

**Integracja z nawigacją:**
- Dodanie linku w sidebarze admina: "Stany krwi" → `/admin/blood-snapshots`
- Breadcrumbs: Admin → Stany krwi
- Pozycja w menu: między "RCKiK" a "Scraper"

## 3. Struktura komponentów

```
BloodSnapshotsAdminPage (Astro SSR)
├── AdminLayout.astro
│   ├── AdminSidebar
│   └── AdminHeader
└── BloodSnapshotsView (React island, client:load)
    ├── StatsCards
    │   ├── StatCard (Dzisiaj)
    │   ├── StatCard (Ten tydzień)
    │   └── StatCard (Ten miesiąc)
    ├── ActionBar
    │   ├── Button (Dodaj snapshot)
    │   └── FilterToggle
    ├── FiltersPanel
    │   ├── DateRangePicker
    │   ├── RckikSelect
    │   ├── BloodGroupSelect
    │   └── SourceFilter (manual/scraped/all)
    ├── BloodSnapshotTable
    │   ├── TableHeader (sortable columns)
    │   ├── TableBody
    │   │   └── BloodSnapshotRow[]
    │   │       ├── SourceBadge
    │   │       ├── BloodGroupBadge
    │   │       ├── LevelStatusBadge
    │   │       └── ActionButtons (Edit/Delete)
    │   └── TablePagination
    └── ManualSnapshotModal (conditional)
        └── ManualSnapshotForm
            ├── RckikSearchSelect
            ├── DatePicker
            ├── BloodGroupSelect
            ├── PercentageInput
            ├── NotesTextarea
            └── FormActions (Cancel/Submit)
```

## 4. Szczegóły komponentów

### 4.1 BloodSnapshotsView (główny kontener)

**Opis:** Główny komponent widoku zarządzający stanem, logiką biznesową i kompozycją wszystkich podkomponentów.

**Główne elementy:**
- `<div>` kontener z układem grid (stats → filters → table)
- Warunkowe renderowanie `ManualSnapshotModal`
- Toast notifications dla komunikatów

**Obsługiwane zdarzenia:**
- `onOpenCreateModal()` - otwiera modal dodawania snapshotu
- `onOpenEditModal(snapshotId)` - otwiera modal edycji snapshotu
- `onDeleteSnapshot(snapshotId)` - usuwa snapshot z potwierdzeniem
- `onFilterChange(filters)` - aktualizuje filtry i odświeża tabelę
- `onPageChange(page)` - zmienia stronę w tabeli

**Warunki walidacji:**
- Sprawdzenie roli ADMIN przy montowaniu komponentu
- Walidacja dostępu do akcji (tylko manual snapshoty można edytować/usuwać)

**Typy:**
- `BloodSnapshotResponse[]` - lista snapshotów
- `SnapshotFilters` - obiekt filtrów
- `PaginationState` - stan paginacji

**Propsy:**
- `initialData?: BloodSnapshotResponse[]` - opcjonalne dane z SSR

### 4.2 StatsCards

**Opis:** Trzy karty wyświetlające statystyki ręcznie wprowadzonych snapshotów.

**Główne elementy:**
- 3x `<Card>` z ikoną, liczbą i opisem
- Skeleton loader podczas ładowania danych

**Obsługiwane zdarzenia:** brak (komponent tylko do odczytu)

**Warunki walidacji:** brak

**Typy:**
- `StatsData: { today: number, thisWeek: number, thisMonth: number }`

**Propsy:**
- `stats: StatsData` - dane statystyk
- `isLoading: boolean` - stan ładowania

### 4.3 ManualSnapshotForm

**Opis:** Formularz dodawania/edycji ręcznego snapshotu krwi. Wykorzystuje React Hook Form + Zod do walidacji.

**Główne elementy:**
- `<form>` z obsługą `onSubmit`
- `RckikSearchSelect` - typeahead dropdown dla wyboru RCKiK
- `DatePicker` - kalendarz wyboru daty (z ograniczeniem: nie przyszłość, max 2 lata wstecz)
- `BloodGroupSelect` - dropdown grup krwi (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `PercentageInput` - input numeryczny 0-100 z 2 miejscami po przecinku
- `NotesTextarea` - opcjonalne notatki (max 500 znaków)
- `FormActions` - przyciski Anuluj i Zapisz

**Obsługiwane zdarzenia:**
- `onSubmit(data)` - wysyła dane do API
- `onCancel()` - zamyka modal i resetuje formularz
- `onRckikSearch(query)` - wyszukuje RCKiK (debounced)

**Warunki walidacji:**
- **RCKiK:** musi istnieć i być aktywny (walidacja async)
- **Data:** nie może być z przyszłości, max 2 lata wstecz
- **Grupa krwi:** enum validation (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Poziom:** 0.00-100.00, max 2 miejsca po przecinku
- **Notatki:** max 500 znaków

**Typy:**
- `CreateBloodSnapshotRequest` (backend DTO)
- `ManualSnapshotFormData` (ViewModel)

**Propsy:**
- `mode: 'create' | 'edit'` - tryb formularza
- `initialData?: BloodSnapshotResponse` - dane do edycji
- `onSuccess: () => void` - callback po sukcesie
- `onCancel: () => void` - callback anulowania

### 4.4 RckikSearchSelect

**Opis:** Komponent typeahead dropdown z wyszukiwaniem RCKiK po nazwie lub kodzie.

**Główne elementy:**
- `<Combobox>` lub `<Select>` z funkcją search
- Lista wyników z podświetleniem dopasowania
- Skeleton podczas wyszukiwania

**Obsługiwane zdarzenia:**
- `onChange(rckikId)` - zmiana wyboru
- `onSearch(query)` - wyszukiwanie (debounced 300ms)

**Warunki walidacji:**
- Wybrany RCKiK musi istnieć
- Tylko aktywne RCKiK na liście

**Typy:**
- `RckikBasicDto` - uproszczone DTO z id, name, code

**Propsy:**
- `value: number | null` - wybrane RCKiK ID
- `onChange: (id: number | null) => void` - zmiana wartości
- `error?: string` - komunikat błędu walidacji
- `disabled?: boolean` - wyłączenie komponentu

### 4.5 DatePicker

**Opis:** Kalendarz wyboru daty z ograniczeniami.

**Główne elementy:**
- Input tekstowy z ikoną kalendarza
- Popup z kalendarzem (react-datepicker lub headlessui)
- Oznaczenie dni niedostępnych (przyszłość, >2 lata wstecz)

**Obsługiwane zdarzenia:**
- `onChange(date)` - zmiana daty
- `onBlur()` - walidacja przy utracie focusu

**Warunki walidacji:**
- Data nie może być z przyszłości
- Data nie może być starsza niż 2 lata od dzisiaj
- Format: ISO 8601 (YYYY-MM-DD)

**Typy:**
- `Date | null` - wybrana data

**Propsy:**
- `value: Date | null` - wybrana data
- `onChange: (date: Date | null) => void` - zmiana wartości
- `minDate?: Date` - minimalna data (dziś - 2 lata)
- `maxDate?: Date` - maksymalna data (dziś)
- `error?: string` - komunikat błędu

### 4.6 BloodGroupSelect

**Opis:** Dropdown wyboru grupy krwi.

**Główne elementy:**
- `<select>` z 8 opcjami grup krwi
- Ikony grup krwi obok tekstu (opcjonalnie)

**Obsługiwane zdarzenia:**
- `onChange(bloodGroup)` - zmiana grupy

**Warunki walidacji:**
- Wartość musi być z listy: A+, A-, B+, B-, AB+, AB-, O+, O-

**Typy:**
- `BloodGroup` enum

**Propsy:**
- `value: string` - wybrana grupa
- `onChange: (group: string) => void` - zmiana wartości
- `error?: string` - komunikat błędu

### 4.7 PercentageInput

**Opis:** Input numeryczny dla poziomu procentowego z walidacją zakresu.

**Główne elementy:**
- `<input type="number">` z symbolem % jako suffix
- Step: 0.01 (2 miejsca po przecinku)
- Visual feedback przy błędnej wartości

**Obsługiwane zdarzenia:**
- `onChange(value)` - zmiana wartości
- `onBlur()` - walidacja przy utracie focusu

**Warunki walidacji:**
- Zakres: 0.00 - 100.00
- Max 3 cyfry przed przecinkiem, 2 po przecinku
- Wymagane pole

**Typy:**
- `number` - wartość procentowa

**Propsy:**
- `value: number` - wartość
- `onChange: (value: number) => void` - zmiana wartości
- `error?: string` - komunikat błędu
- `disabled?: boolean` - wyłączenie pola

### 4.8 BloodSnapshotTable

**Opis:** Tabela ze wszystkimi snapshotami (manual i scraped) z możliwością sortowania, filtrowania i paginacji.

**Główne elementy:**
- `<table>` z nagłówkami sortowalnymi
- Kolumny: Data | RCKiK | Grupa krwi | Poziom | Status | Źródło | Utworzone przez | Akcje
- Wiersze z danymi snapshotów
- Pagination na dole tabeli

**Obsługiwane zdarzenia:**
- `onSort(column, direction)` - sortowanie kolumny
- `onEdit(snapshotId)` - edycja snapshotu (tylko manual)
- `onDelete(snapshotId)` - usunięcie snapshotu (tylko manual)
- `onPageChange(page)` - zmiana strony

**Warunki walidacji:**
- Akcje Edit/Delete dostępne tylko dla snapshotów z `isManual=true`
- Potwierdzenie przed usunięciem

**Typy:**
- `BloodSnapshotResponse[]` - lista snapshotów
- `SortConfig: { column: string, direction: 'asc' | 'desc' }`

**Propsy:**
- `snapshots: BloodSnapshotResponse[]` - dane do wyświetlenia
- `isLoading: boolean` - stan ładowania
- `onEdit: (id: number) => void` - callback edycji
- `onDelete: (id: number) => void` - callback usunięcia
- `pagination: PaginationState` - dane paginacji
- `onPageChange: (page: number) => void` - zmiana strony

### 4.9 SourceBadge

**Opis:** Badge oznaczający źródło snapshotu (manual/scraped).

**Główne elementy:**
- `<span>` z klasami CSS dla koloru i ikony
- Ikona: ręka dla manual, robot dla scraped
- Tekst: "Ręcznie" / "Automatycznie"

**Obsługiwane zdarzenia:** brak

**Warunki walidacji:** brak

**Typy:**
- `source: 'manual' | 'scraped'`

**Propsy:**
- `isManual: boolean` - czy snapshot jest ręczny
- `className?: string` - dodatkowe klasy CSS

### 4.10 FiltersPanel

**Opis:** Panel filtrów dla tabeli snapshotów.

**Główne elementy:**
- `DateRangePicker` - zakres dat (od-do)
- `RckikSelect` - filtr po RCKiK
- `BloodGroupSelect` - filtr po grupie krwi
- `SourceFilter` - radio buttons (All/Manual/Scraped)
- Przycisk "Resetuj filtry"

**Obsługiwane zdarzenia:**
- `onFilterChange(filters)` - zmiana dowolnego filtra
- `onReset()` - reset wszystkich filtrów

**Warunki walidacji:**
- Data "od" nie może być późniejsza niż "do"

**Typy:**
- `SnapshotFilters` - obiekt filtrów

**Propsy:**
- `filters: SnapshotFilters` - aktualne filtry
- `onChange: (filters: SnapshotFilters) => void` - zmiana filtrów
- `onReset: () => void` - reset filtrów

## 5. Typy

### 5.1 Backend DTO (istniejące)

```typescript
// CreateBloodSnapshotRequest - request dodawania snapshotu
interface CreateBloodSnapshotRequest {
  rckikId: number;
  snapshotDate: string; // ISO 8601: YYYY-MM-DD
  bloodGroup: BloodGroup;
  levelPercentage: number; // 0.00-100.00, max 2 miejsca po przecinku
  notes?: string; // max 500 znaków
}

// UpdateBloodSnapshotRequest - request edycji snapshotu
interface UpdateBloodSnapshotRequest {
  levelPercentage: number; // 0.00-100.00
  notes?: string; // max 500 znaków
}

// BloodSnapshotResponse - response z danymi snapshotu
interface BloodSnapshotResponse {
  id: number;
  rckikId: number;
  rckikName: string;
  rckikCode: string;
  snapshotDate: string; // ISO 8601
  bloodGroup: BloodGroup;
  levelPercentage: number;
  levelStatus: LevelStatus; // "CRITICAL" | "IMPORTANT" | "OK"
  sourceUrl: string | null;
  parserVersion: string | null;
  scrapedAt: string; // ISO 8601 datetime
  isManual: boolean;
  createdBy: string | null; // email admina lub null
  createdAt: string; // ISO 8601 datetime
  auditTrail?: {
    notes?: string;
  };
}

// Typ enum dla grup krwi
type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

// Typ enum dla statusu poziomu
type LevelStatus = "CRITICAL" | "IMPORTANT" | "OK" | "UNKNOWN";
```

### 5.2 ViewModel Types (nowe typy dla frontendu)

```typescript
// ManualSnapshotFormData - dane formularza (przed wysłaniem)
interface ManualSnapshotFormData {
  rckikId: number | null;
  snapshotDate: Date | null;
  bloodGroup: BloodGroup | "";
  levelPercentage: string; // string w formularzu, konwersja do number przed submit
  notes: string;
}

// SnapshotFilters - filtry dla tabeli
interface SnapshotFilters {
  rckikId?: number | null;
  bloodGroup?: BloodGroup | null;
  fromDate?: string | null; // ISO 8601
  toDate?: string | null; // ISO 8601
  source?: "all" | "manual" | "scraped";
  createdBy?: string | null;
}

// PaginationState - stan paginacji
interface PaginationState {
  page: number; // 0-indexed
  size: number; // elementy na stronę (default: 50)
  totalElements: number;
  totalPages: number;
}

// StatsData - statystyki ręcznych snapshotów
interface StatsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

// SortConfig - konfiguracja sortowania
interface SortConfig {
  column: keyof BloodSnapshotResponse;
  direction: "asc" | "desc";
}

// RckikBasicDto - uproszczone DTO dla dropdown
interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
  isActive: boolean;
}

// ApiError - typ błędu z API
interface ApiError {
  error: string;
  message: string;
  violations?: Array<{
    field: string;
    message: string;
  }>;
  existingSnapshotId?: number; // dla konfliktów duplikatów
}
```

### 5.3 Zod Schemas (walidacja formularza)

```typescript
import { z } from "zod";

const bloodGroupEnum = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

const manualSnapshotSchema = z.object({
  rckikId: z.number().positive("RCKiK jest wymagany"),
  snapshotDate: z.date()
    .max(new Date(), "Data nie może być z przyszłości")
    .refine(
      (date) => {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return date >= twoYearsAgo;
      },
      "Data nie może być starsza niż 2 lata"
    ),
  bloodGroup: bloodGroupEnum,
  levelPercentage: z.number()
    .min(0, "Poziom musi być co najmniej 0%")
    .max(100, "Poziom nie może przekroczyć 100%")
    .refine(
      (val) => /^\d{1,3}(\.\d{1,2})?$/.test(val.toString()),
      "Poziom może mieć max 2 miejsca po przecinku"
    ),
  notes: z.string().max(500, "Notatki nie mogą przekroczyć 500 znaków").optional()
});

type ManualSnapshotFormSchema = z.infer<typeof manualSnapshotSchema>;
```

## 6. Zarządzanie stanem

### 6.1 Lokalny stan komponentu (React useState)

Widok wykorzystuje lokalny stan zarządzany w głównym komponencie `BloodSnapshotsView`:

```typescript
// Stan snapshotów i ładowania
const [snapshots, setSnapshots] = useState<BloodSnapshotResponse[]>([]);
const [isLoading, setIsLoading] = useState(false);

// Stan modalu
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
const [editingSnapshot, setEditingSnapshot] = useState<BloodSnapshotResponse | null>(null);

// Stan filtrów
const [filters, setFilters] = useState<SnapshotFilters>({
  source: 'all',
  rckikId: null,
  bloodGroup: null,
  fromDate: null,
  toDate: null
});

// Stan paginacji
const [pagination, setPagination] = useState<PaginationState>({
  page: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0
});

// Stan sortowania
const [sortConfig, setSortConfig] = useState<SortConfig>({
  column: 'snapshotDate',
  direction: 'desc'
});

// Stan statystyk
const [stats, setStats] = useState<StatsData>({
  today: 0,
  thisWeek: 0,
  thisMonth: 0
});
```

### 6.2 Custom Hook: useBloodSnapshots

Opcjonalnie można utworzyć custom hook dla enkapsulacji logiki:

```typescript
function useBloodSnapshots() {
  const [snapshots, setSnapshots] = useState<BloodSnapshotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SnapshotFilters>({ source: 'all' });
  const [pagination, setPagination] = useState<PaginationState>({...});

  // Fetch snapshots z API
  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminBloodSnapshotsApi.listSnapshots({
        ...filters,
        page: pagination.page,
        size: pagination.size
      });
      setSnapshots(response.content);
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.size]);

  // Create snapshot
  const createSnapshot = async (data: CreateBloodSnapshotRequest) => {
    const response = await adminBloodSnapshotsApi.createSnapshot(data);
    await fetchSnapshots(); // Odśwież listę
    return response;
  };

  // Update snapshot
  const updateSnapshot = async (id: number, data: UpdateBloodSnapshotRequest) => {
    const response = await adminBloodSnapshotsApi.updateSnapshot(id, data);
    await fetchSnapshots();
    return response;
  };

  // Delete snapshot
  const deleteSnapshot = async (id: number) => {
    await adminBloodSnapshotsApi.deleteSnapshot(id);
    await fetchSnapshots();
  };

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    snapshots,
    isLoading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    refetch: fetchSnapshots
  };
}
```

### 6.3 Redux (opcjonalnie - nie wymagane dla MVP)

Jeśli widok ma być częścią większego state management, można dodać slice Redux:

```typescript
// adminBloodSnapshotsSlice.ts
const adminBloodSnapshotsSlice = createSlice({
  name: 'adminBloodSnapshots',
  initialState: {
    snapshots: [],
    stats: { today: 0, thisWeek: 0, thisMonth: 0 },
    isLoading: false,
    error: null
  },
  reducers: {
    // reducers...
  }
});
```

**Rekomendacja dla MVP:** Użycie lokalnego stanu + custom hook `useBloodSnapshots` jest wystarczające i prostsze w utrzymaniu.

## 7. Integracja API

### 7.1 Endpoints API

Widok komunikuje się z następującymi endpointami:

#### POST /api/v1/admin/blood-snapshots
**Opis:** Tworzenie nowego ręcznego snapshotu

**Request:**
```typescript
POST /api/v1/admin/blood-snapshots
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "rckikId": 1,
  "snapshotDate": "2025-01-08",
  "bloodGroup": "A+",
  "levelPercentage": 45.50,
  "notes": "Ręczne uzupełnienie danych historycznych"
}
```

**Response (201 Created):**
```typescript
{
  "id": 5001,
  "rckikId": 1,
  "rckikName": "RCKiK Warszawa",
  "rckikCode": "WAW",
  "snapshotDate": "2025-01-08",
  "bloodGroup": "A+",
  "levelPercentage": 45.50,
  "levelStatus": "IMPORTANT",
  "sourceUrl": null,
  "parserVersion": null,
  "scrapedAt": "2025-01-08T19:00:00Z",
  "isManual": true,
  "createdBy": "admin@mkrew.pl",
  "createdAt": "2025-01-08T19:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - błędy walidacji
- `404 Not Found` - RCKiK nie znaleziony
- `409 Conflict` - duplikat snapshotu dla tej daty i grupy

#### GET /api/v1/admin/blood-snapshots
**Opis:** Listowanie snapshotów z filtrowaniem i paginacją

**Request:**
```typescript
GET /api/v1/admin/blood-snapshots?rckikId=1&bloodGroup=A+&fromDate=2025-01-01&toDate=2025-01-31&manualOnly=true&page=0&size=50
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `rckikId` (optional): filtr po RCKiK
- `bloodGroup` (optional): filtr po grupie krwi
- `fromDate` (optional): data początkowa (ISO 8601)
- `toDate` (optional): data końcowa (ISO 8601)
- `manualOnly` (optional, default: true): tylko ręczne snapshoty
- `createdBy` (optional): filtr po emailu admina
- `page` (optional, default: 0): numer strony
- `size` (optional, default: 50, max: 100): rozmiar strony

**Response (200 OK):**
```typescript
{
  "content": [
    {
      "id": 5001,
      "rckikId": 1,
      "rckikName": "RCKiK Warszawa",
      "rckikCode": "WAW",
      "snapshotDate": "2025-01-08",
      "bloodGroup": "A+",
      "levelPercentage": 45.50,
      "levelStatus": "IMPORTANT",
      "sourceUrl": null,
      "parserVersion": null,
      "scrapedAt": "2025-01-08T19:00:00Z",
      "isManual": true,
      "createdBy": "admin@mkrew.pl",
      "createdAt": "2025-01-08T19:00:00Z"
    }
  ],
  "page": 0,
  "size": 50,
  "totalElements": 125,
  "totalPages": 3
}
```

#### PUT /api/v1/admin/blood-snapshots/{id}
**Opis:** Aktualizacja ręcznego snapshotu

**Request:**
```typescript
PUT /api/v1/admin/blood-snapshots/5001
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "levelPercentage": 50.00,
  "notes": "Korekta wartości po weryfikacji z RCKiK"
}
```

**Response (200 OK):** BloodSnapshotResponse

**Error Responses:**
- `400 Bad Request` - błędy walidacji
- `403 Forbidden` - próba edycji automatycznego snapshotu
- `404 Not Found` - snapshot nie znaleziony

#### DELETE /api/v1/admin/blood-snapshots/{id}
**Opis:** Usunięcie ręcznego snapshotu

**Request:**
```typescript
DELETE /api/v1/admin/blood-snapshots/5001
Authorization: Bearer {JWT_TOKEN}
```

**Response (204 No Content)**

**Error Responses:**
- `403 Forbidden` - próba usunięcia automatycznego snapshotu
- `404 Not Found` - snapshot nie znaleziony

#### GET /api/v1/admin/blood-snapshots/{id}
**Opis:** Szczegóły snapshotu z audit trail

**Request:**
```typescript
GET /api/v1/admin/blood-snapshots/5001
Authorization: Bearer {JWT_TOKEN}
```

**Response (200 OK):** BloodSnapshotResponse z rozszerzonym `auditTrail`

### 7.2 API Client Implementation

```typescript
// src/lib/api/endpoints/adminBloodSnapshots.ts
import { apiClient } from '../client';
import type {
  CreateBloodSnapshotRequest,
  UpdateBloodSnapshotRequest,
  BloodSnapshotResponse,
  SnapshotFilters,
  PaginationState
} from '@/lib/types';

export const adminBloodSnapshotsApi = {
  // Tworzenie snapshotu
  async createSnapshot(data: CreateBloodSnapshotRequest): Promise<BloodSnapshotResponse> {
    const response = await apiClient.post('/admin/blood-snapshots', data);
    return response.data;
  },

  // Listowanie snapshotów
  async listSnapshots(params: SnapshotFilters & { page?: number; size?: number }) {
    const response = await apiClient.get('/admin/blood-snapshots', { params });
    return response.data;
  },

  // Pobieranie szczegółów snapshotu
  async getSnapshot(id: number): Promise<BloodSnapshotResponse> {
    const response = await apiClient.get(`/admin/blood-snapshots/${id}`);
    return response.data;
  },

  // Aktualizacja snapshotu
  async updateSnapshot(id: number, data: UpdateBloodSnapshotRequest): Promise<BloodSnapshotResponse> {
    const response = await apiClient.put(`/admin/blood-snapshots/${id}`, data);
    return response.data;
  },

  // Usuwanie snapshotu
  async deleteSnapshot(id: number): Promise<void> {
    await apiClient.delete(`/admin/blood-snapshots/${id}`);
  },

  // Statystyki (custom endpoint lub obliczanie po stronie frontendu)
  async getStats(): Promise<StatsData> {
    // Opcja 1: dedykowany endpoint (jeśli backend go dostarcza)
    // const response = await apiClient.get('/admin/blood-snapshots/stats');
    // return response.data;

    // Opcja 2: obliczanie na podstawie list z filtrami dat
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [todayData, weekData, monthData] = await Promise.all([
      this.listSnapshots({ fromDate: today, toDate: today, manualOnly: true, size: 1 }),
      this.listSnapshots({ fromDate: weekAgo, toDate: today, manualOnly: true, size: 1 }),
      this.listSnapshots({ fromDate: monthAgo, toDate: today, manualOnly: true, size: 1 })
    ]);

    return {
      today: todayData.totalElements,
      thisWeek: weekData.totalElements,
      thisMonth: monthData.totalElements
    };
  }
};
```

### 7.3 Error Handling w API Calls

```typescript
// Wrapper z obsługą błędów
async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;

      // Obsługa specyficznych kodów błędów
      if (error.response?.status === 409) {
        throw new Error(`Snapshot już istnieje (ID: ${apiError.existingSnapshotId})`);
      }

      if (error.response?.status === 403) {
        throw new Error('Brak uprawnień do tej operacji');
      }

      if (error.response?.status === 404) {
        throw new Error('Zasób nie został znaleziony');
      }

      // Błędy walidacji
      if (error.response?.status === 400 && apiError.violations) {
        const messages = apiError.violations.map(v => v.message).join(', ');
        throw new Error(`Błędy walidacji: ${messages}`);
      }

      throw new Error(apiError.message || `Błąd podczas ${errorContext}`);
    }
    throw error;
  }
}
```

## 8. Interakcje użytkownika

### 8.1 Dodawanie nowego snapshotu

**Scenariusz:**
1. Administrator klika przycisk "Dodaj snapshot" w ActionBar
2. Otwiera się modal z formularzem ManualSnapshotForm
3. Administrator wypełnia formularz:
   - Wyszukuje i wybiera RCKiK (typeahead z debounce 300ms)
   - Wybiera datę z kalendarza (domyślnie: dzisiaj)
   - Wybiera grupę krwi z dropdown
   - Wpisuje poziom procentowy (z walidacją inline)
   - Opcjonalnie dodaje notatki
4. Podczas wypełniania formularza:
   - Walidacja inline pokazuje błędy pod polami
   - Przycisk "Zapisz" jest disabled dopóki formularz nie jest poprawny
5. Administrator klika "Zapisz"
6. Jeśli sukces:
   - Modal się zamyka
   - Toast notification: "Snapshot został dodany"
   - Tabela odświeża się automatycznie
   - Nowy snapshot pojawia się na górze listy (jeśli pasuje do filtrów)
7. Jeśli błąd walidacji:
   - Błędy pokazują się pod polami
   - Toast notification: "Popraw błędy formularza"
8. Jeśli konflikt (duplikat):
   - Modal pokazuje ostrzeżenie z ID istniejącego snapshotu
   - Opcje: "Anuluj" lub "Zobacz istniejący"
9. Jeśli błąd sieciowy:
   - Toast notification: "Błąd połączenia. Spróbuj ponownie."
   - Modal pozostaje otwarty z danymi

**Klawisze skrótów:**
- `Esc` - zamyka modal
- `Enter` w formularzu - submit (jeśli formularz valid)
- `Tab` - nawigacja między polami

### 8.2 Edycja istniejącego snapshotu

**Scenariusz:**
1. Administrator klika ikonę "Edytuj" w wierszu tabeli (tylko dla manual snapshots)
2. Modal otwiera się z wypełnionymi danymi snapshotu
3. Pola RCKiK, data i grupa krwi są DISABLED (niezmienne)
4. Administrator może edytować tylko:
   - Poziom procentowy
   - Notatki
5. Po kliknięciu "Zapisz":
   - Request PUT do API
   - Toast notification: "Snapshot zaktualizowany"
   - Wiersz w tabeli odświeża się
6. Jeśli błąd:
   - Toast z komunikatem błędu
   - Modal pozostaje otwarty

### 8.3 Usuwanie snapshotu

**Scenariusz:**
1. Administrator klika ikonę "Usuń" w wierszu (tylko dla manual snapshots)
2. Pokazuje się modal potwierdzenia:
   - Tytuł: "Czy na pewno chcesz usunąć ten snapshot?"
   - Komunikat: "Ta operacja jest nieodwracalna i usunie snapshot na zawsze."
   - Szczegóły: RCKiK, data, grupa krwi, poziom
   - Przyciski: "Anuluj" | "Usuń"
3. Po kliknięciu "Usuń":
   - Request DELETE do API
   - Modal się zamyka
   - Toast notification: "Snapshot został usunięty"
   - Wiersz znika z tabeli
4. Jeśli błąd:
   - Toast: komunikat błędu
   - Modal potwierdzenia się zamyka

### 8.4 Filtrowanie snapshotów

**Scenariusz:**
1. Administrator otwiera panel filtrów (domyślnie rozwinięty)
2. Ustawia filtry:
   - Zakres dat (od - do)
   - RCKiK (dropdown z wyszukiwaniem)
   - Grupa krwi
   - Źródło (All / Manual / Scraped)
3. Przy każdej zmianie filtra:
   - Debounce 500ms
   - Request do API z nowymi parametrami
   - Tabela pokazuje skeleton loading
   - Po załadowaniu: nowe wyniki
4. Przycisk "Resetuj filtry":
   - Czyści wszystkie filtry
   - Przywraca domyślny widok (wszystkie manual snapshoty)

### 8.5 Paginacja i sortowanie

**Scenariusz paginacji:**
1. Administrator widzi pagination controls pod tabelą
2. Informacja: "Pokazuję 1-50 z 125 wyników"
3. Przyciski: Poprzednia | 1 2 [3] 4 5 | Następna
4. Po kliknięciu strony:
   - Request do API z parametrem `page`
   - Skeleton loading w tabeli
   - Scroll do góry tabeli

**Scenariusz sortowania:**
1. Administrator klika nagłówek kolumny (np. "Data")
2. Ikona strzałki zmienia się (asc ↑ / desc ↓)
3. Tabela sortuje się lokalnie (jeśli wszystkie dane załadowane)
   LUB request do API z parametrami sortowania
4. Kierunek sortowania toggle: asc → desc → brak → asc

### 8.6 Responsywność mobile

**Mobile (<768px):**
- Tabela zamienia się w karty (card view)
- Filtry w drawer (slide-in z boku)
- Modal zajmuje full screen
- Stats cards w kolumnie pionowej
- Pagination uproszczona (tylko Poprzednia/Następna)

## 9. Warunki i walidacja

### 9.1 Warunki walidacji formularza

#### RCKiK (rckikId)
**Warunki:**
- Pole wymagane
- RCKiK musi istnieć w bazie danych
- RCKiK musi być aktywny (is_active=true)

**Walidacja:**
- Frontend: async validation podczas wyboru z dropdown
- Backend: sprawdzenie w bazie przed zapisem
- Komunikat błędu: "RCKiK jest wymagany" / "Wybrany RCKiK nie istnieje lub jest nieaktywny"

#### Data snapshotu (snapshotDate)
**Warunki:**
- Pole wymagane
- Data nie może być z przyszłości (max: dzisiaj)
- Data nie może być starsza niż 2 lata od dzisiaj
- Format: ISO 8601 (YYYY-MM-DD)

**Walidacja:**
- Frontend: DatePicker z disabled przyszłymi datami
- Zod schema: `.max(new Date())` + custom refine dla 2 lat
- Backend: walidacja @PastOrPresent + custom constraint
- Komunikat błędu: "Data nie może być z przyszłości" / "Data nie może być starsza niż 2 lata"

#### Grupa krwi (bloodGroup)
**Warunki:**
- Pole wymagane
- Wartość musi być z listy: A+, A-, B+, B-, AB+, AB-, O+, O-
- Uwaga: backend używa notacji "0+" zamiast "O+" (normalizacja)

**Walidacja:**
- Frontend: dropdown z ustalonymi opcjami
- Zod enum validation
- Backend: @Pattern regex validation
- Komunikat błędu: "Grupa krwi jest wymagana" / "Nieprawidłowa grupa krwi"

#### Poziom procentowy (levelPercentage)
**Warunki:**
- Pole wymagane
- Zakres: 0.00 - 100.00
- Max 3 cyfry przed przecinkiem
- Max 2 cyfry po przecinku
- Typ: liczba zmiennoprzecinkowa

**Walidacja:**
- Frontend: input type="number" step="0.01" min="0" max="100"
- Zod: `.min(0).max(100)` + regex dla miejsc po przecinku
- Backend: @DecimalMin("0.00"), @DecimalMax("100.00"), @Digits(integer=3, fraction=2)
- Komunikat błędu: "Poziom musi być między 0 a 100" / "Max 2 miejsca po przecinku"

#### Notatki (notes)
**Warunki:**
- Pole opcjonalne
- Max 500 znaków

**Walidacja:**
- Frontend: textarea z licznikiem znaków (500 - current)
- Zod: `.max(500).optional()`
- Backend: @Size(max=500)
- Komunikat błędu: "Notatki nie mogą przekroczyć 500 znaków (aktualne: X)"

### 9.2 Warunki uprawnień i dostępu

#### Dostęp do widoku
**Warunki:**
- Użytkownik musi być zalogowany
- Użytkownik musi mieć rolę ADMIN

**Walidacja:**
- Middleware Astro: sprawdzenie JWT i roli przed renderowaniem strony
- Redirect do /login jeśli nie zalogowany
- Error 403 jeśli zalogowany ale nie ADMIN

#### Akcje na snapshotach
**Warunki edycji/usuwania:**
- Snapshot musi mieć `isManual=true`
- Tylko ręcznie utworzone snapshoty można edytować/usuwać
- Automatyczne snapshoty (ze scrapera) są read-only

**Walidacja:**
- Frontend: przyciski Edit/Delete disabled dla `isManual=false`
- Backend: walidacja w serwisie przed operacją
- Komunikat błędu: "Nie można edytować/usunąć automatycznego snapshotu"

### 9.3 Warunki biznesowe

#### Duplikaty snapshotów
**Warunki:**
- System pozwala na wiele snapshotów tego samego RCKiK i daty
- OSTRZEŻENIE przy duplikacie: ta sama data + RCKiK + grupa krwi

**Walidacja:**
- Backend: soft validation (409 Conflict z informacją o istniejącym ID)
- Frontend: modal ostrzeżenia z opcją kontynuowania lub anulowania
- Komunikat: "Snapshot dla tego RCKiK, daty i grupy krwi już istnieje. Czy chcesz utworzyć kolejny?"

#### Poziomy krytyczne
**Warunki:**
- Automatyczne wyliczanie statusu:
  - CRITICAL: <20%
  - IMPORTANT: 20-49.99%
  - OK: ≥50%

**Walidacja:**
- Backend: automatyczne ustawienie pola `levelStatus`
- Frontend: badge z odpowiednim kolorem i ikoną
- Potencjalnie trigger powiadomień dla użytkowników obserwujących dane RCKiK

### 9.4 Warunki UI/UX

#### Loading states
**Warunki:**
- Skeleton/spinner podczas ładowania danych
- Disabled state przycisków podczas submitu
- Optimistic updates z rollback przy błędzie

#### Error states
**Warunki:**
- Inline errors pod polami formularza
- Toast notifications dla błędów globalnych
- Friendly error messages (nie techniczne komunikaty)

#### Empty states
**Warunki:**
- Komunikat gdy brak snapshotów pasujących do filtrów
- Sugestie akcji (np. "Dodaj pierwszy snapshot" lub "Zmień filtry")

## 10. Obsługa błędów

### 10.1 Błędy walidacji (400 Bad Request)

**Scenariusz:**
- Backend zwraca 400 z listą błędów walidacji

**Obsługa:**
```typescript
if (error.response?.status === 400 && apiError.violations) {
  // Mapowanie błędów na pola formularza
  const fieldErrors = apiError.violations.reduce((acc, violation) => {
    acc[violation.field] = violation.message;
    return acc;
  }, {});

  // Ustawienie błędów w React Hook Form
  Object.entries(fieldErrors).forEach(([field, message]) => {
    form.setError(field, { type: 'manual', message });
  });

  // Toast notification
  toast.error('Popraw błędy formularza');
}
```

**UI feedback:**
- Czerwone obramowanie pól z błędami
- Komunikaty błędów pod polami
- Toast: "Popraw błędy formularza"
- Przycisk "Zapisz" pozostaje aktywny (możliwość poprawy)

### 10.2 Błąd konfliktu - duplikat (409 Conflict)

**Scenariusz:**
- Snapshot dla tej daty, RCKiK i grupy krwi już istnieje

**Obsługa:**
```typescript
if (error.response?.status === 409) {
  const existingId = apiError.existingSnapshotId;

  // Pokazanie modal ostrzeżenia
  showConfirmModal({
    title: 'Snapshot już istnieje',
    message: `Snapshot dla tego RCKiK, daty i grupy krwi już istnieje (ID: ${existingId}).
              Czy chcesz utworzyć kolejny?`,
    actions: [
      { label: 'Anuluj', variant: 'secondary', onClick: closeModal },
      { label: 'Zobacz istniejący', variant: 'secondary', onClick: () => viewSnapshot(existingId) },
      { label: 'Utwórz mimo to', variant: 'primary', onClick: () => createAnyway() }
    ]
  });
}
```

**UI feedback:**
- Modal z ostrzeżeniem i szczegółami
- Opcje: Anuluj | Zobacz istniejący | Utwórz mimo to
- Toast: "Uwaga: duplikat snapshotu"

### 10.3 Błąd uprawnień (403 Forbidden)

**Scenariusz:**
- Próba edycji/usunięcia automatycznego snapshotu
- Brak roli ADMIN

**Obsługa:**
```typescript
if (error.response?.status === 403) {
  toast.error(apiError.message || 'Brak uprawnień do tej operacji');

  // Jeśli cała strona wymaga ADMIN a user nie ma roli
  if (apiError.error === 'INSUFFICIENT_PERMISSIONS') {
    router.push('/admin'); // Redirect do dashboard admina
  }
}
```

**UI feedback:**
- Toast: "Brak uprawnień" z wyjaśnieniem
- Przyciski Edit/Delete disabled dla automatycznych snapshotów (prewencja)

### 10.4 Błąd not found (404 Not Found)

**Scenariusz:**
- RCKiK nie istnieje
- Snapshot nie istnieje (przy edycji/usuwaniu)

**Obsługa:**
```typescript
if (error.response?.status === 404) {
  toast.error('Zasób nie został znaleziony');

  // Zamknięcie modalu jeśli snapshot nie istnieje
  if (isEditMode) {
    closeModal();
    refetchSnapshots(); // Odświeżenie listy
  }
}
```

**UI feedback:**
- Toast: "Zasób nie został znaleziony"
- Modal się zamyka (jeśli dotyczy edycji)
- Tabela odświeża się

### 10.5 Błędy sieciowe i timeout

**Scenariusz:**
- Brak połączenia z internetem
- Timeout requestu (>10s)
- Błąd serwera (500, 502, 503)

**Obsługa:**
```typescript
if (!navigator.onLine) {
  toast.error('Brak połączenia z internetem');
  return;
}

if (error.code === 'ECONNABORTED') {
  toast.error('Przekroczono czas oczekiwania. Spróbuj ponownie.');
}

if (error.response?.status >= 500) {
  toast.error('Błąd serwera. Spróbuj ponownie za chwilę.');

  // Opcjonalnie: retry logic z exponential backoff
  if (retryCount < 3) {
    setTimeout(() => retryRequest(), 2 ** retryCount * 1000);
  }
}
```

**UI feedback:**
- Toast z komunikatem błędu i sugestią akcji
- Przycisk "Spróbuj ponownie" w toaście
- Modal pozostaje otwarty z danymi (nie traci się pracy)
- Offline banner jeśli brak sieci

### 10.6 Rate limiting (429 Too Many Requests)

**Scenariusz:**
- Przekroczenie limitu 50 requestów/godzinę dla admina

**Obsługa:**
```typescript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after']; // sekundy
  const minutes = Math.ceil(retryAfter / 60);

  toast.error(`Przekroczono limit requestów. Spróbuj ponownie za ${minutes} minut.`);

  // Disabled state dla formularza przez czas retryAfter
  setRateLimited(true);
  setTimeout(() => setRateLimited(false), retryAfter * 1000);
}
```

**UI feedback:**
- Toast z countdown timera
- Formularz disabled przez czas rate limit
- Informacja w UI: "Zbyt wiele requestów (X/50 na godzinę)"

### 10.7 Błędy nieoczekiwane

**Scenariusz:**
- Nieznany błąd, niespodziewana odpowiedź API

**Obsługa:**
```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Unexpected error:', error, errorInfo);

    // Logowanie do systemu monitoringu (np. Sentry)
    if (window.Sentry) {
      Sentry.captureException(error, { extra: errorInfo });
    }

    // Pokazanie friendly error message
    this.setState({ hasError: true, errorMessage: 'Coś poszło nie tak. Odśwież stronę.' });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback message={this.state.errorMessage} onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

**UI feedback:**
- Error boundary z friendly message
- Przycisk "Odśwież stronę" lub "Zgłoś problem"
- Nie pokazuj stack trace użytkownikowi (tylko w konsoli dev)

### 10.8 Walidacja po stronie klienta (prewencja)

**Strategia:**
- Maksymalna walidacja po stronie frontendu przed wysłaniem do API
- Zod schema + React Hook Form dla inline validation
- Disabled submit button dopóki formularz nie jest valid
- Debounced async validation dla RCKiK (sprawdzenie czy istnieje)

**Efekt:**
- Minimalizacja błędów 400 z API
- Lepsza UX (szybszy feedback)
- Mniej requestów do backendu

## 11. Kroki implementacji

### Krok 1: Setup struktury projektu
**Czas: 1 dzień**

1. Utworzenie strony Astro:
   - `frontend/src/pages/admin/blood-snapshots.astro`
   - Import AdminLayout
   - SSR z sprawdzeniem auth i roli ADMIN

2. Utworzenie katalogu komponentów:
   - `frontend/src/components/admin/blood-snapshots/`
   - Struktura zgodnie z sekcją 3

3. Dodanie typów:
   - `frontend/src/lib/types/bloodSnapshots.ts`
   - Importy DTO z backendu
   - ViewModel types

4. Setup API client:
   - `frontend/src/lib/api/endpoints/adminBloodSnapshots.ts`
   - Implementacja wszystkich 5 endpointów

### Krok 2: Implementacja UI primitives
**Czas: 2 dni**

1. DatePicker component:
   - Użycie `react-datepicker` lub headlessui
   - Konfiguracja min/max dates
   - Styling zgodnie z designem

2. BloodGroupSelect:
   - Dropdown z 8 opcjami
   - Ikony grup krwi (opcjonalnie)

3. PercentageInput:
   - Input number z walidacją
   - Suffix "%" symbol
   - Visual feedback dla błędów

4. SourceBadge:
   - Komponent Badge z wariantami
   - Ikony (ręka dla manual, robot dla scraped)

5. RckikSearchSelect:
   - Typeahead/combobox z debounce
   - API call do listy RCKiK
   - Highlight dopasowań

### Krok 3: Formularz dodawania/edycji snapshotu
**Czas: 3 dni**

1. ManualSnapshotForm component:
   - Setup React Hook Form
   - Zod schema validation
   - Kompozycja wszystkich pól
   - Submit logic

2. ManualSnapshotModal:
   - Modal z focus trap
   - Escape key handling
   - Overlay click to close

3. Integracja z API:
   - POST /admin/blood-snapshots (create)
   - PUT /admin/blood-snapshots/{id} (update)
   - Error handling i toast notifications

4. Testy:
   - Unit testy dla walidacji Zod
   - Integration testy formularza (RTL + MSW)

### Krok 4: Tabela snapshotów
**Czas: 3 dni**

1. BloodSnapshotTable component:
   - Struktura tabeli z nagłówkami
   - Sortowanie kolumn
   - Responsive design (card view na mobile)

2. BloodSnapshotRow:
   - Formatowanie danych
   - Badges dla statusów
   - Action buttons (Edit/Delete) z warunkami

3. Pagination:
   - Controls i logika
   - Integration z API

4. Loading states:
   - Skeleton loader dla tabeli
   - Spinner dla action buttons

### Krok 5: Filtry i wyszukiwanie
**Czas: 2 dni**

1. FiltersPanel component:
   - DateRangePicker
   - RckikSelect
   - BloodGroupSelect
   - SourceFilter (radio buttons)

2. Logika filtrowania:
   - State management dla filtrów
   - Debounce dla zmian
   - Synchronizacja z query params (optional)

3. Reset filters:
   - Przycisk reset
   - Przywrócenie default state

### Krok 6: Statystyki i monitoring
**Czas: 1 dzień**

1. StatsCards component:
   - 3 karty z liczbami
   - API call dla stats
   - Skeleton loading

2. Integration z custom hook:
   - useBloodSnapshots hook
   - Fetch stats przy montowaniu

### Krok 7: State management i custom hooks
**Czas: 2 dni**

1. useBloodSnapshots hook:
   - Enkapsulacja logiki fetch/create/update/delete
   - State dla snapshots, filters, pagination
   - Error handling

2. useDebounce hook (jeśli nie istnieje):
   - Debouncing dla search i filters

3. useConfirm hook:
   - Modal potwierdzenia dla delete

### Krok 8: Error handling i edge cases
**Czas: 2 dni**

1. Implementacja wszystkich scenariuszy błędów (sekcja 10):
   - 400, 403, 404, 409, 429, 5xx
   - Network errors i timeout
   - Rate limiting

2. Toast notifications:
   - Setup toast library (react-hot-toast lub sonner)
   - Success/error/warning variants

3. Confirm modals:
   - Delete confirmation
   - Duplicate warning

4. Empty states:
   - Brak snapshotów
   - Brak wyników filtrowania

### Krok 9: Accessibility i UX polish
**Czas: 2 dni**

1. ARIA attributes:
   - Labels dla wszystkich interaktywnych elementów
   - aria-live dla toastów
   - aria-describedby dla błędów walidacji

2. Keyboard navigation:
   - Tab order
   - Escape dla modali
   - Enter dla submitów

3. Focus management:
   - Auto-focus pierwszego pola w modalu
   - Return focus po zamknięciu modalu
   - Visible focus states

4. Responsive design:
   - Mobile card view dla tabeli
   - Touch-friendly buttons
   - Drawer dla filtrów na mobile

### Krok 10: Integracja z Admin Layout i routing
**Czas: 1 dzień**

1. Aktualizacja AdminLayout.astro:
   - Dodanie linku "Stany krwi" w sidebar
   - Breadcrumbs configuration

2. Middleware auth check:
   - Sprawdzenie JWT
   - Sprawdzenie roli ADMIN
   - Redirect jeśli unauthorized

3. Aktualizacja AdminSidebar:
   - Aktywny stan dla /admin/blood-snapshots
   - Ikona dla menu item

### Krok 11: Testy
**Czas: 3 dni**

1. Unit tests:
   - Walidacja Zod schemas
   - Utility functions (formatowanie dat, liczb)
   - API client functions

2. Component tests (RTL):
   - ManualSnapshotForm
   - BloodSnapshotTable
   - FiltersPanel
   - Wszystkie UI primitives

3. Integration tests (RTL + MSW):
   - Całościowy flow dodawania snapshotu
   - Edycja i usuwanie
   - Filtrowanie i paginacja
   - Error handling scenarios

4. E2E tests (Playwright):
   - Login jako ADMIN → dodanie snapshotu → weryfikacja w tabeli
   - Edycja snapshotu
   - Usunięcie snapshotu z potwierdzeniem
   - Filtrowanie i sprawdzenie wyników

### Krok 12: Dokumentacja i finalizacja
**Czas: 1 dzień**

1. Dokumentacja komponentów:
   - JSDoc dla publicznych funkcji
   - Props documentation
   - Usage examples

2. README dla widoku:
   - Opis funkcjonalności
   - Screenshoty (opcjonalnie)
   - Known issues

3. Code review i refactoring:
   - Sprawdzenie zgodności z konwencjami
   - Optymalizacja performance
   - Usunięcie console.logs

4. Deployment checklist:
   - Environment variables
   - API endpoints configuration
   - Build i deploy do staging

---

**Całkowity szacowany czas implementacji: 23 dni robocze (~4.5 tygodnia)**

**Podział:**
- Setup i infrastruktura: 3 dni
- UI components: 11 dni
- State management i logika: 4 dni
- Testing: 3 dni
- Polish i dokumentacja: 2 dni

**Zależności:**
- Backend API musi być gotowe i przetestowane (US-028 zaimplementowane)
- Komponenty UI primitives (Button, Modal, Toast) muszą istnieć
- Admin layout i auth middleware muszą być skonfigurowane
- API client z interceptorami musi być gotowy

**Ryzyka:**
- Zmiana wymagań API (mitygacja: wczesna weryfikacja z backendem)
- Problemy z wydajnością przy dużej liczbie snapshotów (mitygacja: wirtualizacja tabeli)
- Edge cases nie ujęte w spec (mitygacja: szczegółowe testy)
