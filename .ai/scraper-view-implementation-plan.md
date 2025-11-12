# Plan implementacji widoku Scraper

## 1. Przegląd

Widok Scraper to panel administracyjny umożliwiający monitorowanie i zarządzanie systemem web scrapingu, który pobiera dane o stanach krwi z publicznych stron RCKiK. Widok dostępny jest wyłącznie dla użytkowników z rolą ADMIN.

### Główne cele widoku:
- Monitorowanie statusu systemu scrapingu (globalny stan zdrowia)
- Przegląd historii uruchomień scrapera (scheduled i manual)
- Analiza szczegółowych logów dla poszczególnych uruchomień
- Ręczne uruchamianie scrapingu dla wybranych centrów lub wszystkich
- Wykrywanie i diagnozowanie problemów z pobieraniem danych
- Dostarczanie alertów o długotrwałych awariach systemu

### User Stories obsługiwane przez widok:
- **US-017**: Manualne uruchomienie parsowania / ponowne pobranie
- **US-018**: Monitorowanie i alertowanie błędów scraperów
- **US-025**: Tryb skrajny - brak dostępu do stron RCKiK

## 2. Routing widoku

**Ścieżka:** `/admin/scraper`

**Wymagania dostępu:**
- Autentykacja: Wymagana (JWT token)
- Autoryzacja: Rola ADMIN
- Middleware: `auth.ts` z weryfikacją roli
- Redirect: Użytkownicy bez roli ADMIN są przekierowywani do `/dashboard`

**Layout:** `AdminLayout.astro`

## 3. Struktura komponentów

```
/admin/scraper (AdminLayout)
│
├── ScraperHeader
│   ├── PageTitle
│   └── GlobalStatusBadge
│
├── ScraperGlobalStatus (główny komponent statusu)
│   ├── StatusCard (OK/DEGRADED/FAILED)
│   ├── LastSuccessfulRun (timestamp)
│   ├── ConsecutiveFailuresCounter
│   └── AlertIndicator
│
├── ScraperControls
│   ├── ManualTriggerButton
│   └── ManualTriggerModal
│       ├── RckikSelector (opcjonalny wybór centrum)
│       ├── CustomUrlInput (opcjonalny custom URL)
│       └── TriggerConfirmButton
│
├── ScraperRunsList (lista uruchomień z paginacją)
│   ├── FiltersBar
│   │   ├── RunTypeFilter (SCHEDULED/MANUAL)
│   │   ├── StatusFilter (RUNNING/COMPLETED/FAILED/PARTIAL)
│   │   └── DateRangeFilter
│   │
│   ├── RunsTable (client:idle)
│   │   └── RunRow (dla każdego uruchomienia)
│   │       ├── RunId
│   │       ├── RunType badge
│   │       ├── StartedAt timestamp
│   │       ├── Duration
│   │       ├── SuccessRate (successfulCount/totalRckiks)
│   │       ├── Status badge
│   │       └── ViewDetailsButton
│   │
│   └── Pagination
│
└── RunDetailsModal (client:load)
    ├── RunDetailsHeader
    │   ├── RunId
    │   ├── RunType
    │   ├── TriggeredBy
    │   └── CloseButton
    │
    ├── RunSummary
    │   ├── StartedAt
    │   ├── CompletedAt
    │   ├── Duration
    │   ├── TotalRckiks
    │   ├── SuccessfulCount
    │   ├── FailedCount
    │   └── ErrorSummary
    │
    └── LogsTable (virtualized)
        └── LogRow (dla każdego logu)
            ├── RckikName
            ├── Url
            ├── Status badge
            ├── ResponseTime
            ├── HttpStatusCode
            ├── RecordsParsed/Failed
            ├── ErrorMessage (jeśli jest)
            └── ParserVersion
```

## 4. Szczegóły komponentów

### ScraperHeader
**Opis:** Nagłówek strony z tytułem i globalnym statusem scrapera.

**Główne elementy:**
- `<h1>` z tytułem "Scraper Monitoring"
- `GlobalStatusBadge` z kolorowym wskaźnikiem (zielony/żółty/czerwony)

**Obsługiwane interakcje:**
- Brak (komponent czysto prezentacyjny)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak własnych propsów (wykorzystuje dane z contextu)

**Propsy:**
- Brak (komponent Astro, dane pobierane z API na serwerze)

---

### ScraperGlobalStatus
**Opis:** Komponent prezentujący ogólny stan zdrowia systemu scrapingu z kluczowymi metrykami.

**Główne elementy:**
- `StatusCard` - duża karta z status badge (OK/DEGRADED/FAILED)
- Grid z metrykami:
  - Last Successful Run (timestamp z relative time)
  - Consecutive Failures (licznik z ostrzeżeniem jeśli >0)
  - Recent Runs Summary (ostatnie 5 runów)
- `Alert` banner jeśli `requiresAdminAlert === true`
- `message` - opisowa wiadomość o statusie

**Obsługiwane interakcje:**
- Auto-refresh co 30 sekund (polling)
- Możliwość ręcznego odświeżenia (refresh button)

**Obsługiwana walidacja:**
- Sprawdzenie czy dane są aktualne (max 5 min od ostatniego pobrania)

**Typy:**
- `ScraperGlobalStatusDto` (z backendu)

**Propsy:**
```typescript
interface ScraperGlobalStatusProps {
  initialData: ScraperGlobalStatusDto;
  autoRefresh?: boolean; // default: true
  refreshInterval?: number; // default: 30000 (30s)
}
```

---

### ManualTriggerButton + ManualTriggerModal
**Opis:** Przycisk i modal umożliwiający ręczne uruchomienie scrapera dla wybranego centrum lub wszystkich centrów.

**Główne elementy:**
- `Button` primary z ikoną play "Uruchom Scraper"
- `Modal` z formularzem:
  - `Select` - wybór centrum (opcjonalny, domyślnie "Wszystkie centra")
  - `Input` - custom URL (opcjonalny, do manual override)
  - `Checkbox` - potwierdzenie ("Rozumiem, że to uruchomi scraping")
  - Przyciski: "Anuluj" i "Uruchom"

**Obsługiwane interakcje:**
- Kliknięcie przycisku otwiera modal
- Submit formularza wysyła POST `/api/v1/admin/scraper/runs`
- Po sukcesie: toast z informacją + redirect do szczegółów runa
- Zamknięcie modalu (ESC, kliknięcie poza, przycisk X)

**Obsługiwana walidacja:**
- `url`: jeśli podany, musi być prawidłowym URL (regex: `^https?://.*`)
- `rckikId`: jeśli podany, musi istnieć w systemie (walidacja po stronie API)
- Potwierdzenie musi być zaznaczone przed submitem

**Typy:**
- `TriggerScraperRequest` (request)
- `ScraperRunResponse` (response)

**Propsy:**
```typescript
interface ManualTriggerModalProps {
  rckikOptions: RckikBasicDto[]; // lista centrów do wyboru
  onSuccess: (runId: number) => void;
  onCancel: () => void;
}
```

---

### ScraperRunsList + RunsTable
**Opis:** Lista historycznych uruchomień scrapera z filtrowaniem, sortowaniem i paginacją.

**Główne elementy:**
- `FiltersBar` z trzema filtrami:
  - Run Type (radio: All / Scheduled / Manual)
  - Status (checkbox: Running / Completed / Failed / Partial)
  - Date Range (date picker: from/to)
- `Table` z kolumnami:
  - ID
  - Type (badge)
  - Started At (timestamp + relative time)
  - Duration (w sekundach lub mm:ss)
  - Success Rate (progress bar: successful/total)
  - Status (badge z kolorami)
  - Actions (przycisk "Szczegóły")
- `Pagination` (page, size, totalPages)

**Obsługiwane interakcje:**
- Zmiana filtrów → fetch nowych danych z API
- Kliknięcie "Szczegóły" → otwarcie `RunDetailsModal`
- Sortowanie kolumn (kliknięcie nagłówka)
- Zmiana strony → fetch nowych danych
- Auto-refresh jeśli jest running run (polling co 10s)

**Obsługiwana walidacja:**
- Date range: `fromDate` nie może być późniejsza niż `toDate`
- Page i size: muszą być liczbami całkowitymi > 0

**Typy:**
- `ScraperRunDto[]` (lista)
- Filtry: `RunsFilters` (custom interface)

**Propsy:**
```typescript
interface ScraperRunsListProps {
  initialRuns: ScraperRunDto[];
  initialPage: number;
  initialTotalPages: number;
  initialFilters: RunsFilters;
}

interface RunsFilters {
  runType?: 'SCHEDULED' | 'MANUAL';
  status?: ('RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL')[];
  fromDate?: string; // ISO 8601
  toDate?: string; // ISO 8601
}
```

---

### RunDetailsModal + LogsTable
**Opis:** Modal wyświetlający szczegóły wybranego uruchomienia scrapera wraz z logami dla każdego centrum.

**Główne elementy:**
- Header modalu:
  - Tytuł: "Run Details #1001"
  - Run type badge
  - Triggered by (user email lub "SYSTEM")
  - Close button
- Summary section (grid):
  - Started At
  - Completed At (lub "In Progress")
  - Duration
  - Total RCKiK
  - Successful Count (zielony)
  - Failed Count (czerwony)
  - Error Summary (jeśli jest)
- Logs Table (virtualized dla >50 wpisów):
  - Kolumny: RCKiK Name, URL, Status, Response Time, HTTP Code, Parsed/Failed Records, Error Message
  - Sortowanie po status (FAILED na górze)
  - Filter: pokaż tylko failed (checkbox)

**Obsługiwane interakcje:**
- Otwarcie modalu → fetch szczegółów GET `/api/v1/admin/scraper/runs/{id}`
- Zamknięcie modalu (ESC, kliknięcie poza, X button)
- Sortowanie logów
- Filter logów (tylko failed)
- Kopiowanie URL do schowka (kliknięcie na URL)
- Kopiowanie error message (kliknięcie na error)

**Obsługiwana walidacja:**
- Brak (dane tylko do odczytu)

**Typy:**
- `ScraperRunDetailsDto` (zawiera `ScraperLogDto[]`)

**Propsy:**
```typescript
interface RunDetailsModalProps {
  runId: number;
  isOpen: boolean;
  onClose: () => void;
}
```

---

### StatusBadge (reusable)
**Opis:** Komponent wyświetlający kolorowy badge dla statusu (run status, log status, global status).

**Główne elementy:**
- `<span>` z klasami Tailwind
- Ikona (opcjonalna)
- Tekst statusu

**Obsługiwane interakcje:**
- Brak (prezentacyjny)

**Typy:**
```typescript
type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
type LogStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';
type GlobalStatus = 'OK' | 'DEGRADED' | 'FAILED';

interface StatusBadgeProps {
  status: RunStatus | LogStatus | GlobalStatus;
  size?: 'sm' | 'md' | 'lg';
}
```

**Mapowanie kolorów:**
- RUNNING / OK: zielony (bg-green-100, text-green-800)
- COMPLETED: niebieski (bg-blue-100, text-blue-800)
- PARTIAL / DEGRADED: żółty (bg-yellow-100, text-yellow-800)
- FAILED: czerwony (bg-red-100, text-red-800)

---

## 5. Typy

### Typy importowane z backendu (DTO):

```typescript
// Importowane bezpośrednio z API responses

interface ScraperGlobalStatusDto {
  globalStatus: 'OK' | 'DEGRADED' | 'FAILED';
  lastSuccessfulTimestamp: string; // ISO 8601
  consecutiveFailures: number;
  totalRecentRuns: number;
  successfulRecentRuns: number;
  failedRecentRuns: number;
  message: string;
  requiresAdminAlert: boolean;
}

interface ScraperRunDto {
  id: number;
  runType: 'SCHEDULED' | 'MANUAL';
  startedAt: string; // ISO 8601
  completedAt: string | null; // null jeśli RUNNING
  totalRckiks: number;
  successfulCount: number;
  failedCount: number;
  durationSeconds: number | null;
  triggeredBy: string; // email lub "SYSTEM"
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  errorSummary: string | null;
}

interface ScraperRunDetailsDto {
  id: number;
  runType: 'SCHEDULED' | 'MANUAL';
  startedAt: string;
  completedAt: string | null;
  totalRckiks: number;
  successfulCount: number;
  failedCount: number;
  durationSeconds: number | null;
  triggeredBy: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  errorSummary: string | null;
  logs: ScraperLogDto[];
}

interface ScraperLogDto {
  id: number;
  scraperRunId: number;
  rckikId: number;
  rckikName: string;
  url: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorMessage: string | null;
  parserVersion: string;
  responseTimeMs: number;
  httpStatusCode: number | null;
  recordsParsed: number;
  recordsFailed: number;
  createdAt: string;
}

interface TriggerScraperRequest {
  rckikId?: number; // opcjonalny
  url?: string; // opcjonalny
}

interface ScraperRunResponse {
  scraperId: number;
  runType: 'MANUAL' | 'SCHEDULED';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  triggeredBy: string;
  startedAt: string;
  statusUrl: string;
}
```

### Typy ViewModel (custom dla widoku):

```typescript
// Typy pomocnicze dla UI

interface RunsFilters {
  runType?: 'SCHEDULED' | 'MANUAL' | null;
  status?: RunStatus[];
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
}

interface PaginationParams {
  page: number; // 0-indexed
  size: number; // default: 20
}

interface RunsListResponse {
  runs: ScraperRunDto[];
  page: number;
  totalElements: number;
  totalPages: number;
}

interface ManualTriggerFormData {
  rckikId: number | null;
  customUrl: string;
  confirmed: boolean;
}

// Pomocnicze typy dla komponentów
type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
type LogStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';
type GlobalStatus = 'OK' | 'DEGRADED' | 'FAILED';

interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}
```

### Zod schemas dla walidacji:

```typescript
import { z } from 'zod';

// Walidacja formularza ręcznego triggerowania
export const manualTriggerSchema = z.object({
  rckikId: z.number().positive().optional(),
  customUrl: z.string()
    .url('Nieprawidłowy format URL')
    .regex(/^https?:\/\/.*/, 'URL musi zaczynać się od http:// lub https://')
    .optional()
    .or(z.literal('')),
  confirmed: z.boolean().refine(val => val === true, {
    message: 'Musisz potwierdzić uruchomienie scrapera'
  })
});

// Walidacja filtrów
export const runsFiltersSchema = z.object({
  runType: z.enum(['SCHEDULED', 'MANUAL']).optional(),
  status: z.array(z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'])).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
}).refine(data => {
  if (data.fromDate && data.toDate) {
    return new Date(data.fromDate) <= new Date(data.toDate);
  }
  return true;
}, {
  message: 'Data początkowa nie może być późniejsza niż data końcowa',
  path: ['fromDate']
});
```

## 6. Zarządzanie stanem

### Strategia zarządzania stanem:

**Poziom 1: Server State (SSR - Astro)**
- Początkowe dane pobierane na serwerze przy renderowaniu strony
- `GET /api/v1/admin/scraper/status` → globalny status
- `GET /api/v1/admin/scraper/runs?page=0&size=20` → lista runów

**Poziom 2: Client State (React + Custom Hooks)**
- Zarządzanie stanem interaktywnych komponentów (modals, filters, pagination)
- Polling dla auto-refresh
- Cache dla szczegółów runów (unikanie duplikacji zapytań)

### Custom hooks:

#### `useScraperGlobalStatus`
```typescript
// Hook do zarządzania globalnym statusem z auto-refresh
function useScraperGlobalStatus(
  initialData: ScraperGlobalStatusDto,
  options?: { autoRefresh?: boolean; refreshInterval?: number }
) {
  const [status, setStatus] = useState<ScraperGlobalStatusDto>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Auto-refresh co 30s
  useEffect(() => {
    if (!options?.autoRefresh) return;

    const interval = setInterval(async () => {
      await fetchStatus();
    }, options.refreshInterval || 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiClient.get('/admin/scraper/status');
      setStatus(response.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { status, isRefreshing, error, refetch: fetchStatus };
}
```

#### `useScraperRuns`
```typescript
// Hook do zarządzania listą runów z filtrowaniem i paginacją
function useScraperRuns(
  initialData: RunsListResponse,
  initialFilters: RunsFilters
) {
  const [runs, setRuns] = useState<ScraperRunDto[]>(initialData.runs);
  const [filters, setFilters] = useState<RunsFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: initialData.page,
    size: 20
  });
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRunningRun, setHasRunningRun] = useState(
    runs.some(run => run.status === 'RUNNING')
  );

  // Auto-refresh jeśli jest running run
  useEffect(() => {
    if (!hasRunningRun) return;

    const interval = setInterval(async () => {
      await fetchRuns();
    }, 10000); // co 10s

    return () => clearInterval(interval);
  }, [hasRunningRun, filters, pagination]);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        size: pagination.size
      };
      const response = await apiClient.get('/admin/scraper/runs', { params });
      setRuns(response.data.runs);
      setTotalPages(response.data.totalPages);
      setHasRunningRun(response.data.runs.some(run => run.status === 'RUNNING'));
    } catch (err) {
      console.error('Error fetching runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<RunsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 0 })); // reset page
  };

  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return {
    runs,
    filters,
    pagination,
    totalPages,
    isLoading,
    hasRunningRun,
    updateFilters,
    changePage,
    refetch: fetchRuns
  };
}
```

#### `useScraperRunDetails`
```typescript
// Hook do pobierania szczegółów runa (dla modalu)
function useScraperRunDetails(runId: number | null) {
  const [details, setDetails] = useState<ScraperRunDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!runId) return;

    fetchDetails();
  }, [runId]);

  const fetchDetails = async () => {
    if (!runId) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get(`/admin/scraper/runs/${runId}`);
      setDetails(response.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { details, isLoading, error, refetch: fetchDetails };
}
```

#### `useManualTrigger`
```typescript
// Hook do ręcznego uruchamiania scrapera
function useManualTrigger() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const triggerScraper = async (data: TriggerScraperRequest) => {
    setIsTriggering(true);
    setError(null);

    try {
      const response = await apiClient.post<ScraperRunResponse>(
        '/admin/scraper/runs',
        data
      );

      // Pokaż toast sukcesu
      toast.success(`Scraper uruchomiony! Run ID: ${response.data.scraperId}`);

      return response.data;
    } catch (err) {
      setError(err);
      toast.error('Nie udało się uruchomić scrapera');
      throw err;
    } finally {
      setIsTriggering(false);
    }
  };

  return { triggerScraper, isTriggering, error };
}
```

### Nie używamy Redux:
Widok Scraper jest izolowany i nie wymaga globalnego stanu. Wszystkie dane są zarządzane lokalnie w komponentach za pomocą custom hooks i React state.

## 7. Integracja API

### Endpointy wykorzystywane przez widok:

#### 1. Pobierz globalny status scrapera
```typescript
GET /api/v1/admin/scraper/status

Headers:
  Authorization: Bearer <jwt_token>

Response: 200 OK
{
  "globalStatus": "OK",
  "lastSuccessfulTimestamp": "2025-01-08T02:30:00Z",
  "consecutiveFailures": 0,
  "totalRecentRuns": 5,
  "successfulRecentRuns": 5,
  "failedRecentRuns": 0,
  "message": "System scrapingu działa prawidłowo",
  "requiresAdminAlert": false
}

Typ żądania: brak (GET)
Typ odpowiedzi: ScraperGlobalStatusDto
```

#### 2. Lista uruchomień scrapera
```typescript
GET /api/v1/admin/scraper/runs

Headers:
  Authorization: Bearer <jwt_token>

Query Parameters:
  - status?: string (RUNNING | COMPLETED | FAILED | PARTIAL)
  - runType?: string (SCHEDULED | MANUAL)
  - fromDate?: string (ISO 8601)
  - toDate?: string (ISO 8601)
  - page?: number (default: 0)
  - size?: number (default: 20, max: 100)

Response: 200 OK
{
  "runs": [
    {
      "id": 1001,
      "runType": "SCHEDULED",
      "startedAt": "2025-01-08T02:00:00Z",
      "completedAt": "2025-01-08T02:15:30Z",
      "totalRckiks": 52,
      "successfulCount": 50,
      "failedCount": 2,
      "durationSeconds": 930,
      "triggeredBy": "SYSTEM",
      "status": "COMPLETED",
      "errorSummary": "2 centra nie odpowiedziały (timeout)"
    }
  ],
  "page": 0,
  "totalElements": 245,
  "totalPages": 13
}

Typ żądania: brak (GET z query params)
Typ odpowiedzi: { runs: ScraperRunDto[], page: number, totalElements: number, totalPages: number }
```

#### 3. Szczegóły uruchomienia scrapera
```typescript
GET /api/v1/admin/scraper/runs/{id}

Headers:
  Authorization: Bearer <jwt_token>

Path Parameters:
  - id: number (ID uruchomienia)

Response: 200 OK
{
  "id": 1001,
  "runType": "SCHEDULED",
  "startedAt": "2025-01-08T02:00:00Z",
  "completedAt": "2025-01-08T02:15:30Z",
  "totalRckiks": 52,
  "successfulCount": 50,
  "failedCount": 2,
  "durationSeconds": 930,
  "triggeredBy": "SYSTEM",
  "status": "COMPLETED",
  "errorSummary": "2 centra nie odpowiedziały",
  "logs": [
    {
      "id": 10001,
      "scraperRunId": 1001,
      "rckikId": 1,
      "rckikName": "RCKiK Warszawa",
      "url": "https://rckik.warszawa.pl/stany-krwi",
      "status": "SUCCESS",
      "errorMessage": null,
      "parserVersion": "1.2.0",
      "responseTimeMs": 1200,
      "httpStatusCode": 200,
      "recordsParsed": 8,
      "recordsFailed": 0,
      "createdAt": "2025-01-08T02:05:00Z"
    }
  ]
}

Typ żądania: brak (GET)
Typ odpowiedzi: ScraperRunDetailsDto

Error Responses:
  - 404: Run nie znaleziony
  - 403: Brak uprawnień ADMIN
```

#### 4. Uruchom scraper ręcznie
```typescript
POST /api/v1/admin/scraper/runs

Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json

Request Body (TriggerScraperRequest):
{
  "rckikId": 1,          // opcjonalny, jeśli pominięty - scrape wszystkich
  "url": "https://..."   // opcjonalny, custom URL override
}

Response: 202 Accepted
{
  "scraperId": 1002,
  "runType": "MANUAL",
  "status": "RUNNING",
  "triggeredBy": "admin@mkrew.pl",
  "startedAt": "2025-01-08T18:30:00Z",
  "statusUrl": "/api/v1/admin/scraper/runs/1002"
}

Typ żądania: TriggerScraperRequest
Typ odpowiedzi: ScraperRunResponse

Error Responses:
  - 400: Nieprawidłowe dane (np. zły format URL)
  - 403: Brak uprawnień ADMIN
  - 404: RCKiK nie znaleziony (jeśli podano rckikId)
```

#### 5. Lista centrów (dla selectora)
```typescript
GET /api/v1/rckik?active=true&size=100

Headers:
  Authorization: Bearer <jwt_token> (opcjonalny dla tego endpointu, ale dostępny)

Response: 200 OK
{
  "content": [
    {
      "id": 1,
      "name": "RCKiK Warszawa",
      "code": "RCKIK-WAW",
      "city": "Warszawa",
      ...
    }
  ]
}

Typ odpowiedzi: Lista RckikBasicDto (tylko id, name, code, city potrzebne)
```

### Axios client configuration:

```typescript
// src/lib/api/endpoints/scraper.ts

import { apiClient } from '../client';
import type {
  ScraperGlobalStatusDto,
  ScraperRunDto,
  ScraperRunDetailsDto,
  TriggerScraperRequest,
  ScraperRunResponse,
  RunsFilters,
  PaginationParams
} from '@/lib/types';

export const scraperApi = {
  // Pobierz globalny status
  getGlobalStatus: async (): Promise<ScraperGlobalStatusDto> => {
    const response = await apiClient.get('/admin/scraper/status');
    return response.data;
  },

  // Pobierz listę runów z filtrowaniem
  getRuns: async (
    filters: RunsFilters,
    pagination: PaginationParams
  ): Promise<{
    runs: ScraperRunDto[];
    page: number;
    totalElements: number;
    totalPages: number;
  }> => {
    const params = {
      ...filters,
      status: filters.status?.join(','), // array to comma-separated
      page: pagination.page,
      size: pagination.size
    };
    const response = await apiClient.get('/admin/scraper/runs', { params });
    return response.data;
  },

  // Pobierz szczegóły runa
  getRunDetails: async (runId: number): Promise<ScraperRunDetailsDto> => {
    const response = await apiClient.get(`/admin/scraper/runs/${runId}`);
    return response.data;
  },

  // Uruchom scraper ręcznie
  triggerScraper: async (
    data: TriggerScraperRequest
  ): Promise<ScraperRunResponse> => {
    const response = await apiClient.post('/admin/scraper/runs', data);
    return response.data;
  }
};
```

### Obsługa błędów w Axios interceptorze:

```typescript
// src/lib/api/client.ts

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      // Brak uprawnień ADMIN - redirect
      toast.error('Brak uprawnień dostępu do panelu administratora');
      window.location.href = '/dashboard';
    }

    if (error.response?.status === 404) {
      toast.error('Nie znaleziono zasobu');
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      toast.error(`Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter}s`);
    }

    return Promise.reject(error);
  }
);
```

## 8. Interakcje użytkownika

### Kluczowe interakcje:

#### 1. Przeglądanie statusu globalnego
**Trigger:** Wejście na stronę `/admin/scraper`
**Akcja:** Wyświetlenie `ScraperGlobalStatus` z danymi z SSR
**Auto-refresh:** Co 30 sekund pobierane są nowe dane (polling)
**Feedback:** Spinner podczas odświeżania, timestamp "Ostatnia aktualizacja"

#### 2. Ręczne uruchomienie scrapera
**Trigger:** Kliknięcie przycisku "Uruchom Scraper"
**Akcja:**
1. Otwarcie modalu `ManualTriggerModal`
2. Użytkownik wybiera centrum (opcjonalnie) lub pozostawia "Wszystkie"
3. Użytkownik może podać custom URL (opcjonalnie)
4. Użytkownik zaznacza checkbox potwierdzenia
5. Kliknięcie "Uruchom"
6. POST `/api/v1/admin/scraper/runs` z danymi formularza
7. Po sukcesie (202):
   - Toast sukcesu: "Scraper uruchomiony! Run ID: 1002"
   - Zamknięcie modalu
   - Auto-scroll do góry listy runów
   - Nowy run pojawia się na liście (RUNNING status)
8. Po błędzie:
   - Toast error z komunikatem błędu
   - Formularz pozostaje otwarty (możliwość korekty)

**Walidacja:**
- URL: jeśli podany, musi być prawidłowy (regex)
- Checkbox: musi być zaznaczony przed submitem
- Button "Uruchom" disabled podczas wysyłania (loading state)

**Feedback:** Loading spinner na przycisku, disabled state, toast notifications

#### 3. Filtrowanie listy runów
**Trigger:** Zmiana wartości w `FiltersBar`
**Akcja:**
1. Użytkownik zmienia Run Type / Status / Date Range
2. Debounce 500ms (dla dat)
3. GET `/api/v1/admin/scraper/runs` z nowymi parametrami
4. Aktualizacja listy + reset paginacji do strony 0
5. Wyświetlenie skeletonu podczas ładowania

**Feedback:** Skeleton loaders w tabeli, liczba wyników

#### 4. Paginacja
**Trigger:** Kliknięcie przycisku strony (Next, Previous, numer)
**Akcja:**
1. Zmiana parametru `page`
2. GET `/api/v1/admin/scraper/runs?page={newPage}`
3. Aktualizacja listy runów
4. Scroll do góry tabeli

**Feedback:** Loading state na tabeli, disabled buttons podczas ładowania

#### 5. Wyświetlenie szczegółów runa
**Trigger:** Kliknięcie "Szczegóły" przy runie w tabeli
**Akcja:**
1. Otwarcie modalu `RunDetailsModal`
2. GET `/api/v1/admin/scraper/runs/{id}`
3. Wyświetlenie szczegółów + tabela logów
4. Możliwość filtrowania logów (tylko failed)
5. Możliwość sortowania logów (po status, response time)

**Feedback:** Loading spinner w modalu, skeleton dla logów

#### 6. Kopiowanie do schowka
**Trigger:** Kliknięcie na URL lub error message w logu
**Akcja:**
1. Kopiowanie tekstu do schowka (navigator.clipboard)
2. Toast informacyjny: "Skopiowano do schowka"
3. Wizualna zmiana (ikona ✓ przez 2 sekundy)

**Feedback:** Toast notification, zmiana ikony

#### 7. Auto-refresh dla running runs
**Trigger:** Wykrycie runa ze statusem RUNNING
**Akcja:**
1. Włączenie pollingu co 10 sekund
2. GET `/api/v1/admin/scraper/runs` z aktualnymi filtrami
3. Aktualizacja statusu runów w tle
4. Jeśli run zmieni status na COMPLETED/FAILED → toast notification

**Feedback:** Pulsujący badge "RUNNING", ikona refresh

## 9. Warunki i walidacja

### Walidacja formularza Manual Trigger:

#### Custom URL
**Warunek:** Jeśli pole nie jest puste
**Walidacja:**
- Format: Musi zaczynać się od `http://` lub `https://`
- Regex: `^https?://.*`
- Maksymalna długość: 2048 znaków
- Przykłady poprawnych URL:
  - `https://rckik.warszawa.pl/stany-krwi`
  - `http://localhost:8080/test`
- Przykłady niepoprawnych:
  - `ftp://example.com` (zły protokół)
  - `www.example.com` (brak protokołu)

**Komunikat błędu:** "Nieprawidłowy format URL. URL musi zaczynać się od http:// lub https://"

**Wpływ na UI:**
- Czerwona ramka wokół inputa
- Komunikat błędu pod polem
- Przycisk "Uruchom" disabled

#### RCKiK ID
**Warunek:** Jeśli wybrano konkretne centrum (nie "Wszystkie")
**Walidacja:**
- Musi być liczbą całkowitą > 0
- Musi istnieć w bazie (walidacja po stronie API)

**Komunikat błędu:** "Wybrane centrum nie istnieje" (z API)

#### Checkbox potwierdzenia
**Warunek:** Zawsze wymagany
**Walidacja:**
- Musi być zaznaczony (`checked === true`)

**Komunikat błędu:** "Musisz potwierdzić uruchomienie scrapera"

**Wpływ na UI:**
- Przycisk "Uruchom" disabled jeśli nie zaznaczony
- Pulsujący border wokół checkboxa przy próbie submitu

---

### Walidacja filtrów Date Range:

#### fromDate i toDate
**Warunek:** Jeśli oba pola są wypełnione
**Walidacja:**
- `fromDate` nie może być późniejsza niż `toDate`
- Obie daty muszą być w formacie ISO 8601
- Daty nie mogą być w przyszłości
- Zakres nie może przekraczać 1 roku

**Komunikaty błędów:**
- "Data początkowa nie może być późniejsza niż data końcowa"
- "Daty nie mogą być w przyszłości"
- "Zakres dat nie może przekraczać 1 roku"

**Wpływ na UI:**
- Czerwona ramka wokół niepoprawnego pola
- Komunikat błędu pod polem
- Wyniki nie są pobierane (brak zapytania do API)

---

### Warunki dostępu do widoku:

#### Autentykacja
**Warunek:** Użytkownik musi być zalogowany
**Walidacja:** Sprawdzenie JWT token w cookie/localStorage
**Akcja przy braku:** Redirect do `/login?redirect=/admin/scraper`

#### Autoryzacja
**Warunek:** Użytkownik musi mieć rolę ADMIN
**Walidacja:**
1. Sprawdzenie roli w JWT claims (`role === 'ADMIN'`)
2. Middleware Astro `auth.ts` weryfikuje rolę przy SSR
3. API zwraca 403 jeśli brak uprawnień

**Akcja przy braku:**
- Toast error: "Brak uprawnień dostępu"
- Redirect do `/dashboard`

---

### Warunki widoczności elementów:

#### Przycisk "Uruchom Scraper"
**Widoczny gdy:** Zawsze (dla ADMIN)
**Disabled gdy:**
- Trwa inne ręczne uruchomienie (loading state)
- Globalny status = FAILED i `requiresAdminAlert = true` (ostrzeżenie w tooltipie)

#### Alert banner "Prolonged Failure"
**Widoczny gdy:** `requiresAdminAlert === true` w `ScraperGlobalStatusDto`
**Zawartość:** Czerwony alert z komunikatem i sugestiami akcji

#### Auto-refresh indicator
**Widoczny gdy:** Jest co najmniej jeden run ze statusem RUNNING
**Zawartość:** Pulsująca ikona ↻ z tekstem "Auto-odświeżanie co 10s"

#### Filter "Show only failed logs"
**Widoczny gdy:** W szczegółach runa są logi ze statusem FAILED
**Akcja:** Filtruje tabelę logów tylko do FAILED

---

### Warunki dla stanów komponentów:

#### StatusBadge
**Mapowanie kolorów i ikon:**
- `RUNNING` / `OK`: zielony + ikona ▶
- `COMPLETED` / `SUCCESS`: niebieski + ikona ✓
- `PARTIAL` / `DEGRADED`: żółty + ikona ⚠
- `FAILED`: czerwony + ikona ✗

#### Progress bar dla Success Rate
**Kolor:**
- >= 95%: zielony
- 80-94%: żółty
- < 80%: czerwony

#### Error Summary
**Widoczny gdy:** `errorSummary !== null && errorSummary !== ""`
**Truncate:** Maksymalnie 100 znaków z "..." (pełna treść w tooltipie)

## 10. Obsługa błędów

### Scenariusze błędów i ich obsługa:

#### 1. Błąd pobierania globalnego statusu (GET /admin/scraper/status)

**Przyczyny:**
- Sieć niedostępna (offline)
- Timeout (>10s)
- Błąd serwera (500)
- Brak uprawnień (403)

**Obsługa:**
```typescript
try {
  const status = await scraperApi.getGlobalStatus();
  setStatus(status);
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    // Timeout
    toast.error('Przekroczono limit czasu połączenia. Sprawdź połączenie sieciowe.');
  } else if (error.response?.status === 403) {
    // Brak uprawnień
    toast.error('Brak uprawnień dostępu');
    window.location.href = '/dashboard';
  } else if (error.response?.status >= 500) {
    // Błąd serwera
    toast.error('Błąd serwera. Spróbuj ponownie później.');
  } else {
    // Ogólny błąd
    toast.error('Nie udało się pobrać statusu scrapera');
  }

  // Wyświetl ostatnie znane dane (stale state)
  // Wyświetl error state w komponencie
}
```

**UI Feedback:**
- Toast notification z konkretnym komunikatem
- Error state w `ScraperGlobalStatus`: czerwony banner "Nie udało się pobrać danych" + przycisk "Spróbuj ponownie"
- Ostatnie znane dane pozostają widoczne (stale state)

---

#### 2. Błąd uruchamiania scrapera (POST /admin/scraper/runs)

**Przyczyny:**
- Nieprawidłowy URL (400)
- RCKiK nie istnieje (404)
- Brak uprawnień (403)
- Serwer zajęty (503)

**Obsługa:**
```typescript
try {
  const result = await scraperApi.triggerScraper(formData);
  toast.success(`Scraper uruchomiony! Run ID: ${result.scraperId}`);
  onClose();
  refetchRuns();
} catch (error) {
  if (error.response?.status === 400) {
    // Walidacja
    const details = error.response.data.details;
    if (details?.find(d => d.field === 'url')) {
      setFieldError('customUrl', 'Nieprawidłowy format URL');
    }
    toast.error('Nieprawidłowe dane formularza');
  } else if (error.response?.status === 404) {
    toast.error('Wybrane centrum nie istnieje');
    setFieldError('rckikId', 'Centrum nie znalezione');
  } else if (error.response?.status === 503) {
    toast.error('Serwer jest obecnie przeciążony. Spróbuj ponownie za chwilę.');
  } else {
    toast.error('Nie udało się uruchomić scrapera');
  }

  // Modal pozostaje otwarty dla korekty
}
```

**UI Feedback:**
- Toast error z konkretnym komunikatem
- Inline errors w formularzu (czerwone ramki + teksty)
- Przycisk "Uruchom" wraca do stanu aktywnego (nie zamykaj modalu)

---

#### 3. Błąd pobierania listy runów (GET /admin/scraper/runs)

**Przyczyny:**
- Nieprawidłowe parametry filtrów (400)
- Timeout
- Błąd serwera (500)

**Obsługa:**
```typescript
try {
  const data = await scraperApi.getRuns(filters, pagination);
  setRuns(data.runs);
} catch (error) {
  if (error.response?.status === 400) {
    // Reset filtrów do domyślnych
    toast.warning('Nieprawidłowe filtry. Zresetowano do domyślnych.');
    resetFilters();
  } else {
    toast.error('Nie udało się pobrać listy uruchomień');
  }

  // Wyświetl empty state z error message
  setRuns([]);
}
```

**UI Feedback:**
- Toast notification
- Empty state w tabeli: "Nie udało się pobrać danych" + przycisk "Odśwież"
- Filtry resetowane do domyślnych wartości

---

#### 4. Błąd pobierania szczegółów runa (GET /admin/scraper/runs/{id})

**Przyczyny:**
- Run nie istnieje (404)
- Timeout
- Błąd serwera (500)

**Obsługa:**
```typescript
try {
  const details = await scraperApi.getRunDetails(runId);
  setDetails(details);
} catch (error) {
  if (error.response?.status === 404) {
    toast.error('Uruchomienie scrapera nie znalezione');
    onClose(); // Zamknij modal
  } else {
    // Wyświetl error state w modalu
    setError(error);
  }
}
```

**UI Feedback:**
- Toast error
- Error state w modalu: "Nie udało się pobrać szczegółów" + przycisk "Spróbuj ponownie"
- Jeśli 404: automatyczne zamknięcie modalu

---

#### 5. Brak danych historycznych (empty state)

**Warunek:** `runs.length === 0` po pobraniu listy

**UI:**
```tsx
<EmptyState
  icon={<DatabaseIcon />}
  title="Brak uruchomień scrapera"
  description="Nie znaleziono żadnych uruchomień scrapera pasujących do wybranych filtrów."
  action={
    filters ? (
      <Button onClick={resetFilters}>Wyczyść filtry</Button>
    ) : (
      <Button onClick={triggerManualScrape}>Uruchom scraper</Button>
    )
  }
/>
```

---

#### 6. Prolonged failure (US-025)

**Warunek:** `globalStatus === 'FAILED' && requiresAdminAlert === true`

**UI:**
```tsx
<Alert variant="error" icon={<AlertTriangleIcon />}>
  <AlertTitle>Długotrwała awaria scrapera</AlertTitle>
  <AlertDescription>
    System scrapingu nie działa prawidłowo od {formatDuration(lastSuccessfulTimestamp)}.
    Liczba kolejnych niepowodzeń: {consecutiveFailures}.

    <strong>Sugerowane działania:</strong>
    <ul>
      <li>Sprawdź dostępność stron RCKiK</li>
      <li>Zweryfikuj logi błędów w ostatnich uruchomieniach</li>
      <li>Rozważ ręczne pobranie danych i import</li>
      <li>Skontaktuj się z zespołem technicznym</li>
    </ul>
  </AlertDescription>
  <AlertActions>
    <Button onClick={() => navigate('/admin/scraper/logs')}>
      Zobacz logi
    </Button>
    <Button variant="secondary" onClick={checkRckikAvailability}>
      Sprawdź dostępność RCKiK
    </Button>
  </AlertActions>
</Alert>
```

---

#### 7. Timeout podczas auto-refresh

**Obsługa:**
- Ciche niepowodzenie (brak toasta)
- Log do console dla debugowania
- Ikona warning przy auto-refresh indicator
- Tooltip: "Ostatnia próba odświeżenia nie powiodła się"
- Kolejna próba za standardowy interval

---

#### 8. Brak połączenia sieciowego (offline)

**Detekcja:** `navigator.onLine === false`

**UI:**
```tsx
<Banner variant="warning">
  <WifiOffIcon />
  Jesteś offline. Dane mogą być nieaktualne.
  <Button onClick={retryConnection}>Spróbuj ponownie</Button>
</Banner>
```

**Zachowanie:**
- Wyłączenie auto-refresh
- Wyświetlenie ostatnich pobranych danych
- Disabled buttons akcji (Manual Trigger)
- Tooltip na przyciskach: "Brak połączenia sieciowego"

---

#### 9. Rate limiting (429)

**Obsługa:**
```typescript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'] || 60;
  toast.error(
    `Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter} sekund.`,
    { duration: retryAfter * 1000 }
  );

  // Wyłącz auto-refresh na czas retryAfter
  disableAutoRefreshFor(retryAfter * 1000);
}
```

**UI Feedback:**
- Toast z countdown
- Disabled buttons na czas rate limit
- Progress bar countdown

---

### Strategia ogólna:

1. **Graceful degradation**: Zawsze wyświetl ostatnie znane dane
2. **User feedback**: Jasne komunikaty błędów z sugerowanymi akcjami
3. **Retry mechanisms**: Przyciski "Spróbuj ponownie" dla recoverable errors
4. **Logging**: Console errors dla błędów sieciowych (dev debugging)
5. **Fallbacks**: Empty states z akcjami zamiast pustych ekranów

## 11. Kroki implementacji

### Faza 1: Setup i struktura (1-2 dni)

**Krok 1.1: Utworzenie struktury plików**
```bash
# Strona główna widoku
mkdir -p src/pages/admin
touch src/pages/admin/scraper.astro

# Layout admina (jeśli nie istnieje)
touch src/layouts/AdminLayout.astro

# Komponenty domenowe scraper
mkdir -p src/components/admin/scraper
touch src/components/admin/scraper/ScraperHeader.astro
touch src/components/admin/scraper/ScraperGlobalStatus.tsx
touch src/components/admin/scraper/ManualTriggerButton.tsx
touch src/components/admin/scraper/ManualTriggerModal.tsx
touch src/components/admin/scraper/ScraperRunsList.tsx
touch src/components/admin/scraper/RunsTable.tsx
touch src/components/admin/scraper/RunDetailsModal.tsx
touch src/components/admin/scraper/LogsTable.tsx
touch src/components/admin/scraper/StatusBadge.tsx
touch src/components/admin/scraper/FiltersBar.tsx

# Typy
touch src/lib/types/scraper.ts

# API endpoints
touch src/lib/api/endpoints/scraper.ts

# Custom hooks
mkdir -p src/lib/hooks/scraper
touch src/lib/hooks/scraper/useScraperGlobalStatus.ts
touch src/lib/hooks/scraper/useScraperRuns.ts
touch src/lib/hooks/scraper/useScraperRunDetails.ts
touch src/lib/hooks/scraper/useManualTrigger.ts

# Utilities
touch src/lib/utils/scraperHelpers.ts
```

**Krok 1.2: Zdefiniowanie typów TypeScript**
- Skopiuj interfejsy z DTOs backendu do `src/lib/types/scraper.ts`
- Dodaj typy ViewModel (RunsFilters, PaginationParams, etc.)
- Dodaj Zod schemas dla walidacji formularzy

**Krok 1.3: Konfiguracja API client**
- Dodaj endpoint functions w `src/lib/api/endpoints/scraper.ts`
- Skonfiguruj interceptory dla błędów 403 (redirect do dashboard)

---

### Faza 2: Layout i routing (pół dnia)

**Krok 2.1: AdminLayout.astro**
```astro
---
// src/layouts/AdminLayout.astro
import BaseLayout from './BaseLayout.astro';
import Sidebar from '@/components/common/Sidebar.astro';
import { checkAuth, checkRole } from '@/lib/utils/auth';

// Sprawdź autentykację i rolę ADMIN
const user = await checkAuth(Astro.request);
if (!user) {
  return Astro.redirect('/login?redirect=' + Astro.url.pathname);
}
if (user.role !== 'ADMIN') {
  return Astro.redirect('/dashboard');
}
---

<BaseLayout title={Astro.props.title}>
  <div class="admin-layout">
    <Sidebar type="admin" />
    <main class="admin-content">
      <slot />
    </main>
  </div>
</BaseLayout>
```

**Krok 2.2: Strona główna scraper**
```astro
---
// src/pages/admin/scraper.astro
import AdminLayout from '@/layouts/AdminLayout.astro';
import ScraperHeader from '@/components/admin/scraper/ScraperHeader.astro';
import ScraperGlobalStatus from '@/components/admin/scraper/ScraperGlobalStatus';
import ScraperRunsList from '@/components/admin/scraper/ScraperRunsList';
import { scraperApi } from '@/lib/api/endpoints/scraper';

// SSR: Pobierz początkowe dane
const [globalStatus, runsData] = await Promise.all([
  scraperApi.getGlobalStatus(),
  scraperApi.getRuns({}, { page: 0, size: 20 })
]);
---

<AdminLayout title="Scraper Monitoring">
  <ScraperHeader />

  <ScraperGlobalStatus
    initialData={globalStatus}
    autoRefresh={true}
    client:load
  />

  <ScraperRunsList
    initialRuns={runsData.runs}
    initialPage={runsData.page}
    initialTotalPages={runsData.totalPages}
    initialFilters={{}}
    client:idle
  />
</AdminLayout>
```

---

### Faza 3: Komponenty prezentacyjne (1 dzień)

**Krok 3.1: ScraperHeader (Astro - statyczny)**
```astro
---
// src/components/admin/scraper/ScraperHeader.astro
---
<header class="scraper-header">
  <h1 class="text-3xl font-bold">Scraper Monitoring</h1>
  <p class="text-gray-600">
    Monitorowanie i zarządzanie systemem web scrapingu
  </p>
</header>
```

**Krok 3.2: StatusBadge (React - reusable)**
```tsx
// src/components/admin/scraper/StatusBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import type { RunStatus, LogStatus, GlobalStatus } from '@/lib/types/scraper';

const statusConfig = {
  // Global Status
  'OK': { color: 'green', icon: '✓', label: 'OK' },
  'DEGRADED': { color: 'yellow', icon: '⚠', label: 'Zdegradowany' },
  'FAILED': { color: 'red', icon: '✗', label: 'Awaria' },

  // Run Status
  'RUNNING': { color: 'green', icon: '▶', label: 'W trakcie' },
  'COMPLETED': { color: 'blue', icon: '✓', label: 'Zakończony' },
  'PARTIAL': { color: 'yellow', icon: '⚠', label: 'Częściowy' },

  // Log Status
  'SUCCESS': { color: 'green', icon: '✓', label: 'Sukces' },
};

interface StatusBadgeProps {
  status: RunStatus | LogStatus | GlobalStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.color} size={size}>
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}
```

---

### Faza 4: Custom hooks (1 dzień)

**Krok 4.1: useScraperGlobalStatus**
- Implementuj hook zgodnie z sekcją 6 (Zarządzanie stanem)
- Dodaj auto-refresh z intervalem 30s
- Dodaj error handling

**Krok 4.2: useScraperRuns**
- Implementuj hook z filtrowaniem i paginacją
- Dodaj auto-refresh dla running runs (10s)
- Dodaj debounce dla filtrów (500ms)

**Krok 4.3: useScraperRunDetails**
- Implementuj lazy loading dla szczegółów runa
- Cache szczegółów (nie pobieraj ponownie tego samego runa)

**Krok 4.4: useManualTrigger**
- Implementuj hook do POST `/admin/scraper/runs`
- Dodaj error handling z toast notifications

---

### Faza 5: ScraperGlobalStatus (pół dnia)

**Krok 5.1: Komponent główny**
```tsx
// src/components/admin/scraper/ScraperGlobalStatus.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from './StatusBadge';
import { useScraperGlobalStatus } from '@/lib/hooks/scraper/useScraperGlobalStatus';
import type { ScraperGlobalStatusDto } from '@/lib/types/scraper';

interface Props {
  initialData: ScraperGlobalStatusDto;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ScraperGlobalStatus({
  initialData,
  autoRefresh = true,
  refreshInterval = 30000
}: Props) {
  const { status, isRefreshing, error, refetch } = useScraperGlobalStatus(
    initialData,
    { autoRefresh, refreshInterval }
  );

  return (
    <section className="scraper-global-status">
      {/* Alert banner jeśli prolonged failure */}
      {status.requiresAdminAlert && (
        <Alert variant="error">
          <AlertTitle>Długotrwała awaria scrapera</AlertTitle>
          <AlertDescription>
            {status.message}
            <p>Liczba kolejnych niepowodzeń: {status.consecutiveFailures}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Status globalny</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={status.globalStatus} size="lg" />
            <p className="text-sm text-gray-600 mt-2">{status.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ostatnie udane uruchomienie</CardTitle>
          </CardHeader>
          <CardContent>
            <time className="text-lg">
              {formatDistanceToNow(status.lastSuccessfulTimestamp)} temu
            </time>
            <p className="text-xs text-gray-500">
              {format(status.lastSuccessfulTimestamp, 'PPpp')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ostatnie uruchomienia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="text-green-600">
                ✓ {status.successfulRecentRuns}
              </div>
              <div className="text-red-600">
                ✗ {status.failedRecentRuns}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="text-sm text-gray-500 mt-2">
          Odświeżanie...
        </div>
      )}
    </section>
  );
}
```

---

### Faza 6: ManualTrigger (1 dzień)

**Krok 6.1: ManualTriggerButton**
```tsx
// src/components/admin/scraper/ManualTriggerButton.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ManualTriggerModal } from './ManualTriggerModal';

export function ManualTriggerButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
      >
        <PlayIcon /> Uruchom Scraper
      </Button>

      <ManualTriggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

**Krok 6.2: ManualTriggerModal z formularzem**
```tsx
// src/components/admin/scraper/ManualTriggerModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useManualTrigger } from '@/lib/hooks/scraper/useManualTrigger';
import { manualTriggerSchema } from '@/lib/utils/validation';
import type { ManualTriggerFormData } from '@/lib/types/scraper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ManualTriggerModal({ isOpen, onClose }: Props) {
  const { triggerScraper, isTriggering } = useManualTrigger();
  const { register, handleSubmit, formState: { errors } } = useForm<ManualTriggerFormData>({
    resolver: zodResolver(manualTriggerSchema)
  });

  const onSubmit = async (data: ManualTriggerFormData) => {
    try {
      await triggerScraper({
        rckikId: data.rckikId || undefined,
        url: data.customUrl || undefined
      });
      onClose();
    } catch (error) {
      // Error handled by hook (toast)
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Uruchom scraper ręcznie">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Centrum krwi (opcjonalnie)"
          {...register('rckikId')}
          error={errors.rckikId?.message}
        >
          <option value="">Wszystkie centra</option>
          {/* Opcje RCKiK */}
        </Select>

        <Input
          label="Custom URL (opcjonalnie)"
          placeholder="https://..."
          {...register('customUrl')}
          error={errors.customUrl?.message}
        />

        <Checkbox
          label="Rozumiem, że to uruchomi scraping"
          {...register('confirmed')}
          error={errors.confirmed?.message}
        />

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isTriggering}>
            {isTriggering ? 'Uruchamianie...' : 'Uruchom'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

### Faza 7: ScraperRunsList i RunsTable (2 dni)

**Krok 7.1: FiltersBar**
- Implementuj radio buttons dla Run Type
- Implementuj checkboxy dla Status
- Implementuj date range picker
- Dodaj debounce dla dat (500ms)
- Callback `onFiltersChange`

**Krok 7.2: RunsTable**
- Tabelka z kolumnami: ID, Type, Started, Duration, Success Rate, Status, Actions
- Sortowanie po kliknięciu nagłówka
- Virtualization dla >50 wierszy (react-window lub react-virtual)
- Loading skeletons
- Empty state z komunikatem

**Krok 7.3: Pagination**
- Przyciski Previous, Next, numery stron
- Disabled states
- Scroll to top po zmianie strony

**Krok 7.4: Połączenie z hookiem useScraperRuns**
```tsx
// src/components/admin/scraper/ScraperRunsList.tsx
import React from 'react';
import { FiltersBar } from './FiltersBar';
import { RunsTable } from './RunsTable';
import { Pagination } from '@/components/ui/Pagination';
import { useScraperRuns } from '@/lib/hooks/scraper/useScraperRuns';
import type { ScraperRunDto, RunsFilters } from '@/lib/types/scraper';

interface Props {
  initialRuns: ScraperRunDto[];
  initialPage: number;
  initialTotalPages: number;
  initialFilters: RunsFilters;
}

export function ScraperRunsList({
  initialRuns,
  initialPage,
  initialTotalPages,
  initialFilters
}: Props) {
  const {
    runs,
    filters,
    pagination,
    totalPages,
    isLoading,
    hasRunningRun,
    updateFilters,
    changePage
  } = useScraperRuns(
    { runs: initialRuns, page: initialPage, totalPages: initialTotalPages },
    initialFilters
  );

  return (
    <section className="scraper-runs-list">
      {hasRunningRun && (
        <div className="auto-refresh-indicator">
          <RefreshIcon className="animate-spin" />
          Auto-odświeżanie co 10s
        </div>
      )}

      <FiltersBar
        filters={filters}
        onFiltersChange={updateFilters}
      />

      <RunsTable
        runs={runs}
        isLoading={isLoading}
        onViewDetails={(runId) => setSelectedRunId(runId)}
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={totalPages}
        onPageChange={changePage}
      />
    </section>
  );
}
```

---

### Faza 8: RunDetailsModal i LogsTable (1-2 dni)

**Krok 8.1: RunDetailsModal**
- Header z Run ID, Type, Triggered By
- Summary section z metrykami
- LogsTable embedded
- Loading state
- Error state z retry button

**Krok 8.2: LogsTable**
- Kolumny: RCKiK Name, URL, Status, Response Time, HTTP Code, Records, Error
- Virtualization (react-window)
- Sortowanie po status (FAILED na górze)
- Filter checkbox "Show only failed"
- Kopiowanie URL i error do schowka

**Krok 8.3: Połączenie z hookiem**
```tsx
// src/components/admin/scraper/RunDetailsModal.tsx
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LogsTable } from './LogsTable';
import { useScraperRunDetails } from '@/lib/hooks/scraper/useScraperRunDetails';

interface Props {
  runId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RunDetailsModal({ runId, isOpen, onClose }: Props) {
  const { details, isLoading, error } = useScraperRunDetails(runId);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);

  if (!isOpen) return null;

  const filteredLogs = showOnlyFailed
    ? details?.logs.filter(log => log.status === 'FAILED')
    : details?.logs;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        <h2>Run Details #{runId}</h2>
        {details && <StatusBadge status={details.status} />}
      </Modal.Header>

      <Modal.Body>
        {isLoading && <Spinner />}

        {error && (
          <Alert variant="error">
            Nie udało się pobrać szczegółów
          </Alert>
        )}

        {details && (
          <>
            {/* Summary section */}
            <div className="run-summary">
              <dl>
                <dt>Rozpoczęty</dt>
                <dd>{format(details.startedAt, 'PPpp')}</dd>

                <dt>Zakończony</dt>
                <dd>{details.completedAt ? format(details.completedAt, 'PPpp') : 'W trakcie'}</dd>

                <dt>Czas trwania</dt>
                <dd>{details.durationSeconds}s</dd>

                <dt>Sukces / Wszystkie</dt>
                <dd>{details.successfulCount} / {details.totalRckiks}</dd>
              </dl>
            </div>

            {/* Logs table */}
            <div className="logs-section">
              <div className="flex justify-between items-center mb-4">
                <h3>Logi</h3>
                <Checkbox
                  label="Pokaż tylko błędy"
                  checked={showOnlyFailed}
                  onChange={(e) => setShowOnlyFailed(e.target.checked)}
                />
              </div>

              <LogsTable logs={filteredLogs || []} />
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
```

---

### Faza 9: Testy i accessibility (1 dzień)

**Krok 9.1: Unit tests (Vitest + RTL)**
- Test hooks (useScraperGlobalStatus, useScraperRuns, etc.)
- Test utils (formatters, helpers)
- Mock API calls z MSW

**Krok 9.2: Component tests**
- Test StatusBadge (wszystkie statusy)
- Test ManualTriggerModal (walidacja, submit)
- Test FiltersBar (zmiana filtrów)

**Krok 9.3: Accessibility**
- ARIA labels dla wszystkich interaktywnych elementów
- Keyboard navigation (Tab, Enter, Escape)
- Focus management w modalach
- Screen reader testing (NVDA/JAWS)
- Kontrast kolorów (WCAG AA)

**Krok 9.4: E2E test (Playwright)**
```typescript
// tests/e2e/admin-scraper.spec.ts
test('Admin może uruchomić scraper ręcznie', async ({ page }) => {
  // Login jako admin
  await loginAsAdmin(page);

  // Przejdź do /admin/scraper
  await page.goto('/admin/scraper');

  // Kliknij "Uruchom Scraper"
  await page.click('button:has-text("Uruchom Scraper")');

  // Wypełnij formularz
  await page.selectOption('select[name="rckikId"]', '1');
  await page.check('input[name="confirmed"]');

  // Submit
  await page.click('button[type="submit"]');

  // Sprawdź toast sukcesu
  await expect(page.locator('.toast')).toContainText('Scraper uruchomiony');

  // Sprawdź czy nowy run pojawił się w tabeli
  await expect(page.locator('table tbody tr').first()).toContainText('RUNNING');
});
```

---

### Faza 10: Optymalizacja i polish (1 dzień)

**Krok 10.1: Performance**
- Code splitting per route (lazy load)
- Virtualization dla długich list (react-window)
- Debounce dla filtrów i search
- Memoization komponentów (React.memo)
- Optymalizacja bundle size

**Krok 10.2: UX improvements**
- Loading skeletons dla wszystkich async operacji
- Smooth animations (Framer Motion)
- Toast notifications z ikonami
- Keyboard shortcuts (Cmd+K dla search)
- Tooltips dla skróconych tekstów

**Krok 10.3: Error boundaries**
```tsx
// src/components/admin/scraper/ScraperErrorBoundary.tsx
import React from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function ScraperErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-state">
          <h2>Coś poszło nie tak</h2>
          <p>Nie udało się załadować widoku Scraper</p>
          <Button onClick={() => window.location.reload()}>
            Odśwież stronę
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

### Faza 11: Dokumentacja i deployment (pół dnia)

**Krok 11.1: Dokumentacja**
- Komentarze JSDoc dla funkcji publicznych
- README w `/admin/scraper` z opisem komponentów
- Storybook stories dla reusable components (StatusBadge, etc.)

**Krok 11.2: Deploy**
- Build projektu (`npm run build`)
- Test na staging environment
- Smoke test wszystkich funkcji
- Deploy do produkcji

---

### Podsumowanie timeline:
- **Faza 1**: Setup (1-2 dni)
- **Faza 2**: Layout i routing (0.5 dnia)
- **Faza 3**: Komponenty prezentacyjne (1 dzień)
- **Faza 4**: Custom hooks (1 dzień)
- **Faza 5**: ScraperGlobalStatus (0.5 dnia)
- **Faza 6**: ManualTrigger (1 dzień)
- **Faza 7**: ScraperRunsList (2 dni)
- **Faza 8**: RunDetailsModal (1-2 dni)
- **Faza 9**: Testy i accessibility (1 dzień)
- **Faza 10**: Optymalizacja (1 dzień)
- **Faza 11**: Dokumentacja i deployment (0.5 dnia)

**Całkowity czas: 10-12 dni roboczych**

---

## Checklist przed ukończeniem:

### Funkcjonalność
- [ ] Globalny status scrapera wyświetla się poprawnie
- [ ] Auto-refresh globalnego statusu działa (30s)
- [ ] Lista runów wyświetla się z paginacją
- [ ] Filtry działają poprawnie (Run Type, Status, Date Range)
- [ ] Sortowanie tabeli runów działa
- [ ] Auto-refresh dla running runs działa (10s)
- [ ] Modal szczegółów runa otwiera się i pobiera dane
- [ ] Logi w szczegółach są wyświetlane poprawnie
- [ ] Filter "Show only failed logs" działa
- [ ] Ręczne uruchomienie scrapera działa (POST)
- [ ] Walidacja formularza Manual Trigger działa
- [ ] Toast notifications wyświetlają się dla success/error
- [ ] Kopiowanie URL/error do schowka działa
- [ ] Prolonged failure alert wyświetla się gdy `requiresAdminAlert = true`

### Security & Auth
- [ ] Widok wymaga autentykacji JWT
- [ ] Widok wymaga roli ADMIN
- [ ] Użytkownicy bez roli ADMIN są przekierowywani
- [ ] 403 errors są obsługiwane (redirect + toast)
- [ ] Tokeny JWT są dodawane do wszystkich requestów

### UX & Accessibility
- [ ] Wszystkie interaktywne elementy mają ARIA labels
- [ ] Keyboard navigation działa (Tab, Enter, Escape)
- [ ] Focus management w modalach działa
- [ ] Screen reader friendly (testowane z NVDA)
- [ ] Kontrast kolorów spełnia WCAG AA
- [ ] Loading states wyświetlają się (skeletons/spinners)
- [ ] Error states są user-friendly z akcjami
- [ ] Empty states mają jasne komunikaty
- [ ] Tooltips dla skróconych tekstów

### Performance
- [ ] Virtualization dla długich list (>50 items)
- [ ] Debounce dla filtrów (500ms)
- [ ] Code splitting (lazy load modali)
- [ ] Bundle size < 150KB (gzipped dla widoku)
- [ ] Lighthouse score: Performance >90

### Testing
- [ ] Unit tests dla wszystkich custom hooks (>80% coverage)
- [ ] Component tests dla kluczowych komponentów
- [ ] E2E test dla głównego flow (manual trigger)
- [ ] MSW mocks dla wszystkich API endpoints

### Dokumentacja
- [ ] JSDoc dla funkcji publicznych
- [ ] README w katalogu `/admin/scraper`
- [ ] Komentarze dla skomplikowanej logiki
- [ ] Storybook stories dla reusable components

---

## Notatki implementacyjne:

### Uwagi dotyczące API:
1. Endpoint `GET /admin/scraper/status` nie jest jeszcze zdefiniowany w API Plan - wymaga dodania
2. Zakładamy że endpoint zwraca `ScraperGlobalStatusDto` zgodnie z DTO
3. Dla filtrów statusu używamy comma-separated values w query params

### Optymalizacje:
1. Cache szczegółów runów w memory (Map) aby uniknąć duplikacji requestów
2. Użyj SWR lub React Query dla lepszego cache management (opcjonalnie)
3. Virtualizacja tabeli logów dla runów z >100 logami

### Accessibility:
1. Użyj `aria-live="polite"` dla auto-refresh indicators
2. `role="status"` dla toast notifications
3. `aria-busy="true"` podczas ładowania danych
4. `aria-expanded` dla collapsible sections

### Bezpieczeństwo:
1. Wszystkie requesty do `/admin/*` muszą mieć token JWT
2. Role check zarówno w middleware SSR jak i w API
3. XSS prevention: sanitizacja URL i error messages przed wyświetleniem
4. Rate limiting dla manual trigger (max 5 requestów na 5 minut per user)
