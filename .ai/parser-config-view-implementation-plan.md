# Plan implementacji widoku Zarządzanie konfiguracją parserów

## 1. Przegląd

Widok zarządzania konfiguracją parserów umożliwia administratorowi systemu zarządzanie konfiguracją parserów dla różnych centrów RCKiK oraz testowanie ich działania. Widok służy do realizacji User Stories US-029 (Implementacja parsera dla RCKiK Rzeszów) i US-030 (Zarządzanie konfiguracją parserów dla RCKiK).

**Główne funkcjonalności:**
- Przeglądanie listy konfiguracji parserów dla wszystkich centrów RCKiK
- Tworzenie nowych konfiguracji parserów
- Edycja istniejących konfiguracji (URL źródłowy, selektory CSS, harmonogram)
- Testowanie parserów w trybie dry-run (bez zapisu do bazy)
- Aktywacja/dezaktywacja parserów
- Podgląd historii zmian konfiguracji (audit trail)
- Monitoring statusu parsowania (ostatnie uruchomienia, success rate, błędy)

## 2. Routing widoku

**Ścieżka:** `/admin/parsers`

**Dostęp:** Wymagana autentykacja + rola ADMIN (SSR + role check w middleware)

**Layout:** `AdminLayout.astro` z sidebar'em admina i breadcrumbs

## 3. Struktura komponentów

```
/admin/parsers (strona Astro)
├── ParserConfigHeader (React)
│   ├── PageTitle
│   ├── Breadcrumbs
│   └── CreateParserButton (otwiera modal)
│
├── ParserConfigFilters (React, client:load)
│   ├── RckikFilter (dropdown z wyszukiwaniem)
│   ├── ParserTypeFilter (dropdown: JSOUP, SELENIUM, CUSTOM)
│   ├── ActiveStatusFilter (toggle: wszystkie/aktywne/nieaktywne)
│   └── ClearFiltersButton
│
├── ParserConfigTable (React, client:idle)
│   ├── TableHeader (sortowalne kolumny)
│   ├── ParserConfigRow[] (wiele wierszy)
│   │   ├── RckikNameCell
│   │   ├── ParserTypeCell
│   │   ├── SourceUrlCell (skrócony z tooltip)
│   │   ├── StatusCell (ParserStatusBadge)
│   │   ├── LastRunCell (timestamp + status)
│   │   └── ActionsCell
│   │       ├── EditButton (otwiera modal)
│   │       ├── TestButton (otwiera TestParserModal)
│   │       └── DeleteButton (soft delete z confirm)
│   └── Pagination
│
├── ParserConfigFormModal (React, client:load)
│   ├── ModalHeader (tytuł: Create/Edit)
│   ├── ParserConfigForm
│   │   ├── RckikSelect (typeahead dropdown)
│   │   ├── ParserTypeSelect (JSOUP/SELENIUM/CUSTOM)
│   │   ├── UrlInput (z walidacją HTTPS)
│   │   ├── JsonEditor (Monaco Editor dla CSS selectors)
│   │   ├── ScheduleCronInput (z walidacją cron expression)
│   │   ├── TimeoutSecondsInput (10-120s)
│   │   ├── ActiveToggle (checkbox)
│   │   └── NotesTextarea
│   └── ModalFooter
│       ├── CancelButton
│       ├── SaveButton
│       └── TestAndSaveButton (test dry-run przed zapisem)
│
├── TestParserModal (React, client:load)
│   ├── ModalHeader
│   ├── TestParserForm
│   │   └── TestUrlInput (opcjonalny override URL)
│   ├── TestProgressIndicator (podczas testowania)
│   ├── ParseResultsPreview (tabela z wynikami)
│   │   ├── ResultsTable
│   │   │   ├── BloodGroupCell
│   │   │   ├── LevelPercentageCell
│   │   │   ├── LevelStatusCell (badge OK/IMPORTANT/CRITICAL)
│   │   │   └── SourceInfoCell (selector + raw text)
│   │   ├── WarningsList (ostrzeżenia)
│   │   └── ErrorsList (błędy parsowania)
│   ├── TestSummaryCard
│   │   ├── ExecutionTimeMetric
│   │   ├── HttpStatusCodeMetric
│   │   ├── GroupsFoundMetric (7/8)
│   │   └── SuccessRateMetric
│   └── ModalFooter
│       ├── CloseButton
│       └── SaveResultsButton (tylko jeśli test SUCCESS)
│
└── ParserDetailsPanel (React, client:visible)
    ├── RecentRunsTimeline (ostatnie 10 uruchomień)
    │   └── RunStatusItem[] (timestamp, status, metrics)
    ├── AuditTrailTimeline (historia zmian)
    │   └── AuditTrailEntry[]
    │       ├── ActionBadge (CREATED/UPDATED/DELETED)
    │       ├── ActorInfo (admin email)
    │       ├── TimestampInfo
    │       └── ChangesDiffView (before/after dla zmian)
    └── ParserStatsCard (statystyki)
        ├── SuccessRateChart (ostatnie 30 dni)
        ├── AverageExecutionTimeMetric
        └── ErrorCountMetric
```

## 4. Szczegóły komponentów

### ParserConfigHeader
**Opis:** Nagłówek strony z breadcrumbs i przyciskiem utworzenia nowej konfiguracji.

**Główne elementy:**
- `<Breadcrumbs>` z ścieżką: Admin → Parsers
- `<h1>` tytuł: "Zarządzanie konfiguracją parserów"
- `<Button variant="primary">` "Dodaj konfigurację parsera" (otwiera ParserConfigFormModal w trybie create)

**Obsługiwane interakcje:**
- Kliknięcie "Dodaj konfigurację" → otwiera modal z pustym formularzem

**Obsługiwana walidacja:** Brak

**Typy:** Brak specyficznych

**Propsy:** Brak (statyczny komponent)

---

### ParserConfigFilters
**Opis:** Panel filtrów do zawężania listy konfiguracji parserów. Filtry synchronizowane z query params (shareable URLs).

**Główne elementy:**
- `<Select>` RckikFilter - dropdown z wyszukiwaniem (typeahead) wszystkich RCKiK
- `<Select>` ParserTypeFilter - dropdown: JSOUP, SELENIUM, CUSTOM, Wszystkie
- `<ToggleGroup>` ActiveStatusFilter - toggle: Wszystkie / Aktywne / Nieaktywne
- `<Button variant="ghost">` ClearFiltersButton - resetuje wszystkie filtry

**Obsługiwane interakcje:**
- Wybór RCKiK → filtruje tabelę (GET /api/v1/admin/parsers/configs?rckikId=X)
- Wybór typu parsera → filtruje tabelę (GET /api/v1/admin/parsers/configs?parserType=X)
- Toggle statusu → filtruje tabelę (GET /api/v1/admin/parsers/configs?active=true/false)
- Kliknięcie "Wyczyść filtry" → usuwa wszystkie query params i resetuje tabelę

**Obsługiwana walidacja:**
- Brak - filtry są opcjonalne

**Typy:**
- `ParserConfigFiltersState` (lokalny stan)
  - `rckikId?: number | null`
  - `parserType?: 'JSOUP' | 'SELENIUM' | 'CUSTOM' | null`
  - `active?: boolean | null`

**Propsy:**
```typescript
interface ParserConfigFiltersProps {
  onFiltersChange: (filters: ParserConfigFiltersState) => void;
  initialFilters?: ParserConfigFiltersState;
}
```

---

### ParserConfigTable
**Opis:** Tabela z listą wszystkich konfiguracji parserów. Sortowalna, paginowana, z akcjami CRUD.

**Główne elementy:**
- `<table>` z nagłówkami: RCKiK, Typ parsera, URL źródłowy, Status, Ostatnie uruchomienie, Akcje
- `<thead>` z sortowalnymi kolumnami (kliknięcie nagłówka sortuje)
- `<tbody>` z wierszami ParserConfigRow
- `<Pagination>` na dole tabeli

**Obsługiwane interakcje:**
- Sortowanie kolumn → zmiana query param `sort=rckikName,asc`
- Kliknięcie Edit → otwiera ParserConfigFormModal z wypełnionymi danymi
- Kliknięcie Test → otwiera TestParserModal
- Kliknięcie Delete → pokazuje ConfirmModal, następnie soft delete (active=false)
- Zmiana strony → GET /api/v1/admin/parsers/configs?page=X

**Obsługiwana walidacja:**
- Brak - walidacja tylko w formularzu edycji

**Typy:**
- `ParserConfigDto` (z API - ParserConfigResponse z backendu)
- `PaginatedResponse<ParserConfigDto>`

**Propsy:**
```typescript
interface ParserConfigTableProps {
  configs: ParserConfigDto[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onEdit: (configId: number) => void;
  onTest: (configId: number) => void;
  onDelete: (configId: number) => void;
}
```

---

### ParserConfigFormModal
**Opis:** Modal z formularzem do tworzenia i edycji konfiguracji parsera. Walidacja za pomocą React Hook Form + Zod.

**Główne elementy:**
- `<Modal>` z focus trap i obsługą ESC
- `<form>` z polami:
  - `<RckikSelect>` - typeahead dropdown z wyszukiwaniem RCKiK (tylko przy create, disabled przy edit)
  - `<Select>` ParserTypeSelect - JSOUP, SELENIUM, CUSTOM (tylko przy create, disabled przy edit)
  - `<Input>` UrlInput - URL źródłowy z walidacją HTTPS
  - `<JsonEditor>` - Monaco Editor dla CSS selectors z syntax highlighting
  - `<Input>` ScheduleCronInput - cron expression z walidacją
  - `<Input>` TimeoutSecondsInput - timeout 10-120s
  - `<Checkbox>` ActiveToggle - aktywny/nieaktywny
  - `<Textarea>` NotesTextarea - notatki (max 500 znaków)
- `<div>` ModalFooter z przyciskami Anuluj, Zapisz, Test i zapisz

**Obsługiwane interakcje:**
- Wybór RCKiK → sprawdza czy RCKiK już ma aktywną konfigurację (konflikt)
- Edycja JSON selectors → live syntax validation
- Kliknięcie "Zapisz" → walidacja + POST/PUT /api/v1/admin/parsers/configs
- Kliknięcie "Test i zapisz" → najpierw dry-run test, jeśli SUCCESS → zapis
- Kliknięcie "Anuluj" → zamyka modal (z confirm jeśli są niezapisane zmiany)

**Obsługiwana walidacja:**
- `rckikId`: Required (tylko create), must exist, nie może mieć już aktywnej konfiguracji
- `parserType`: Required (tylko create), one of: JSOUP, SELENIUM, CUSTOM
- `sourceUrl`: Required, valid HTTPS URL, max 2000 chars
- `cssSelectors`: Required jeśli parserType=CUSTOM, valid JSON z wymaganymi kluczami:
  - Required keys: `bloodGroupRow`, `bloodGroupName`, `levelPercentage`
  - Optional keys: `container`, `dateSelector`, `customFields`
- `scheduleCron`: Valid cron expression, default "0 2 * * *"
- `timeoutSeconds`: Integer 10-120, default 30
- `notes`: Optional, max 500 chars

**Typy:**
- `ParserConfigFormData` (typ formularza)
```typescript
interface ParserConfigFormData {
  rckikId: number;
  parserType: 'JSOUP' | 'SELENIUM' | 'CUSTOM';
  sourceUrl: string;
  cssSelectors: CssSelectorConfig;
  scheduleCron: string;
  timeoutSeconds: number;
  active: boolean;
  notes?: string;
}

interface CssSelectorConfig {
  container?: string;
  bloodGroupRow: string;
  bloodGroupName: string;
  levelPercentage: string;
  dateSelector?: string;
  customFields?: Record<string, string>;
}
```

**Propsy:**
```typescript
interface ParserConfigFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ParserConfigDto;
  onClose: () => void;
  onSave: (data: ParserConfigFormData) => Promise<void>;
  onTestAndSave: (data: ParserConfigFormData) => Promise<void>;
}
```

---

### JsonEditor
**Opis:** Edytor JSON z syntax highlighting do edycji CSS selectors. Wykorzystuje Monaco Editor lub CodeMirror.

**Główne elementy:**
- `<div>` kontener dla Monaco Editor
- Syntax highlighting dla JSON
- Line numbers
- Error highlighting dla błędów składni

**Obsługiwane interakcje:**
- Edycja tekstu → live validation składni JSON
- Ctrl+Space → autocomplete dla kluczy (bloodGroupRow, bloodGroupName, etc.)

**Obsługiwana walidacja:**
- Valid JSON syntax
- Presence of required keys (bloodGroupRow, bloodGroupName, levelPercentage)

**Typy:**
- `CssSelectorConfig` (patrz wyżej)

**Propsy:**
```typescript
interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean, errors?: string[]) => void;
  height?: string; // default: "300px"
  readOnly?: boolean;
}
```

---

### TestParserModal
**Opis:** Modal do testowania konfiguracji parsera w trybie dry-run. Pokazuje preview wyników parsowania bez zapisu do bazy.

**Główne elementy:**
- `<Modal>` z focus trap
- `<form>` z opcjonalnym polem TestUrlInput (override URL)
- `<Button>` "Uruchom test" → wywołuje POST /api/v1/admin/parsers/configs/{id}/test
- `<ProgressIndicator>` podczas testowania (spinner + "Parsowanie w toku...")
- `<ParseResultsPreview>` - tabela z wynikami:
  - Kolumny: Grupa krwi, Poziom (%), Status, Selektor, Raw text
  - Wiersze dla każdej sparsowanej grupy krwi
- `<Alert>` WarningsList - ostrzeżenia (np. "Blood group AB+ not found")
- `<Alert>` ErrorsList - błędy parsowania
- `<Card>` TestSummaryCard z metrykami:
  - Execution time (ms)
  - HTTP status code
  - Groups found (7/8)
  - Success rate (87.5%)
- `<Button>` "Zapisz wyniki do bazy" (tylko jeśli status=SUCCESS i saveResults=false)

**Obsługiwane interakcje:**
- Kliknięcie "Uruchom test" → POST /api/v1/admin/parsers/configs/{id}/test
- Kliknięcie "Zapisz wyniki" → POST /api/v1/admin/parsers/configs/{id}/test?saveResults=true
- Kliknięcie "Zamknij" → zamyka modal

**Obsługiwana walidacja:**
- `testUrl`: Optional, valid HTTPS URL jeśli podany

**Typy:**
- `ParserTestResponse` (z API)
```typescript
interface ParserTestResponse {
  testId: string;
  configId: number;
  rckikId: number;
  rckikName: string;
  testUrl: string;
  parserType: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  executionTimeMs: number;
  httpStatusCode: number;
  parsedData: ParsedDataEntry[];
  warnings: string[];
  errors: string[];
  summary: TestSummary;
}

interface ParsedDataEntry {
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: 'OK' | 'IMPORTANT' | 'CRITICAL';
  source: {
    selector: string;
    rawText: string;
  };
}

interface TestSummary {
  totalGroupsExpected: number;
  totalGroupsFound: number;
  successfulParses: number;
  failedParses: number;
  saved: boolean;
}
```

**Propsy:**
```typescript
interface TestParserModalProps {
  isOpen: boolean;
  configId: number;
  onClose: () => void;
  onSaveResults?: (testId: string) => Promise<void>;
}
```

---

### ParseResultsPreview
**Opis:** Komponent do wyświetlania preview wyników parsowania z testu dry-run.

**Główne elementy:**
- `<table>` ResultsTable z kolumnami:
  - Grupa krwi (BloodGroupCell)
  - Poziom (%) (LevelPercentageCell)
  - Status (LevelStatusCell z badge)
  - Selektor (SourceInfoCell - collapsible z raw text)
- `<Alert variant="warning">` WarningsList
- `<Alert variant="error">` ErrorsList

**Obsługiwane interakcje:**
- Rozwinięcie SourceInfoCell → pokazuje raw text i selektor

**Obsługiwana walidacja:** Brak

**Typy:**
- `ParsedDataEntry[]` (z ParserTestResponse)

**Propsy:**
```typescript
interface ParseResultsPreviewProps {
  parsedData: ParsedDataEntry[];
  warnings: string[];
  errors: string[];
}
```

---

### ParserStatusBadge
**Opis:** Badge pokazujący status parsera (aktywny/nieaktywny + ostatni status uruchomienia).

**Główne elementy:**
- `<Badge>` z kolorem zależnym od statusu:
  - Aktywny + SUCCESS → zielony "Aktywny"
  - Aktywny + FAILED → czerwony "Błąd parsowania"
  - Nieaktywny → szary "Nieaktywny"

**Obsługiwane interakcje:** Brak (statyczny)

**Obsługiwana walidacja:** Brak

**Typy:**
```typescript
interface ParserStatusBadgeProps {
  active: boolean;
  lastRunStatus: 'SUCCESS' | 'FAILED' | null;
}
```

**Propsy:** Patrz typy wyżej

---

### AuditTrailTimeline
**Opis:** Timeline pokazujący historię zmian konfiguracji parsera (audit trail).

**Główne elementy:**
- `<div>` timeline container
- `<AuditTrailEntry>[]` - lista wpisów:
  - ActionBadge (CREATED/UPDATED/DELETED)
  - Actor info (admin email)
  - Timestamp
  - ChangesDiffView (before/after dla zmian w formacie diff)

**Obsługiwane interakcje:**
- Rozwinięcie ChangesDiffView → pokazuje szczegółowy diff zmian

**Obsługiwana walidacja:** Brak

**Typy:**
- `AuditTrailEntry` (z ParserConfigResponse)
```typescript
interface AuditTrailEntry {
  action: 'PARSER_CONFIG_CREATED' | 'PARSER_CONFIG_UPDATED' | 'PARSER_CONFIG_DELETED';
  actorId: string;
  timestamp: string;
  metadata: {
    changes?: Record<string, { old: any; new: any }>;
    notes?: string;
  };
}
```

**Propsy:**
```typescript
interface AuditTrailTimelineProps {
  auditTrail: AuditTrailEntry[];
}
```

---

### RckikSelect
**Opis:** Typeahead dropdown do wyboru RCKiK z wyszukiwaniem.

**Główne elementy:**
- `<input>` z autocomplete
- `<ul>` dropdown z wynikami wyszukiwania
- Debounced search (300ms)

**Obsługiwane interakcje:**
- Wpisywanie tekstu → filtruje listę RCKiK po nazwie/kodzie
- Wybór z listy → ustawia wartość

**Obsługiwana walidacja:**
- Required (przy tworzeniu konfiguracji)
- RCKiK musi istnieć

**Typy:**
- `RckikBasicDto` (z API)
```typescript
interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city: string;
}
```

**Propsy:**
```typescript
interface RckikSelectProps {
  value: number | null;
  onChange: (rckikId: number) => void;
  disabled?: boolean;
  error?: string;
}
```

---

### UrlInput
**Opis:** Input z walidacją URL (musi zaczynać się od https://).

**Główne elementy:**
- `<input type="url">`
- Ikona HTTPS na początku
- Error message pod inputem

**Obsługiwane interakcje:**
- Blur → walidacja URL

**Obsługiwana walidacja:**
- Required
- Valid URL format
- Must start with https://
- Max 2000 characters

**Typy:** `string`

**Propsy:**
```typescript
interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}
```

## 5. Typy

### DTO (z backendu - używane przez frontend)

```typescript
// ParserConfigResponse - odpowiedź GET /api/v1/admin/parsers/configs
interface ParserConfigResponse {
  configs: ParserConfigDto[];
  page: number;
  size: number;
  totalElements: number;
}

interface ParserConfigDto {
  id: number;
  rckikId: number;
  rckikName: string;
  rckikCode: string;
  sourceUrl: string;
  parserType: 'JSOUP' | 'SELENIUM' | 'CUSTOM';
  cssSelectors: JsonNode; // JSON object
  active: boolean;
  scheduleCron: string;
  timeoutSeconds: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastSuccessfulRun: string | null; // ISO 8601
  lastRunStatus: 'SUCCESS' | 'FAILED' | null;
  recentRuns?: RecentRunDto[];
  auditTrail?: AuditTrailEntryDto[];
}

interface RecentRunDto {
  runId: number;
  startedAt: string; // ISO 8601
  status: 'SUCCESS' | 'FAILED';
  recordsParsed: number;
  recordsFailed: number;
  responseTimeMs: number;
}

interface AuditTrailEntryDto {
  action: string;
  actorId: string;
  timestamp: string; // ISO 8601
  metadata: any;
}

// ParserConfigRequest - request POST/PUT /api/v1/admin/parsers/configs
interface ParserConfigRequest {
  rckikId: number;
  sourceUrl: string;
  parserType: 'JSOUP' | 'SELENIUM' | 'CUSTOM';
  cssSelectors: string; // JSON string
  active?: boolean;
  scheduleCron?: string;
  timeoutSeconds?: number;
  notes?: string;
}

// ParserTestResponse - odpowiedź POST /api/v1/admin/parsers/configs/{id}/test
interface ParserTestResponse {
  testId: string;
  configId: number;
  rckikId: number;
  rckikName: string;
  testUrl: string;
  parserType: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  executionTimeMs: number;
  httpStatusCode: number;
  parsedData: ParsedDataEntry[];
  warnings: string[];
  errors: string[];
  summary: TestSummary;
}

interface ParsedDataEntry {
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: 'OK' | 'IMPORTANT' | 'CRITICAL';
  source: SourceInfo;
}

interface SourceInfo {
  selector: string;
  rawText: string;
}

interface TestSummary {
  totalGroupsExpected: number;
  totalGroupsFound: number;
  successfulParses: number;
  failedParses: number;
  saved: boolean;
}

// ParserTestRequest - request POST /api/v1/admin/parsers/configs/{id}/test
interface ParserTestRequest {
  testUrl?: string; // Optional override URL
}
```

### ViewModel (typy specyficzne dla frontendu)

```typescript
// Stan formularza konfiguracji parsera
interface ParserConfigFormData {
  rckikId: number;
  parserType: 'JSOUP' | 'SELENIUM' | 'CUSTOM';
  sourceUrl: string;
  cssSelectors: CssSelectorConfig;
  scheduleCron: string;
  timeoutSeconds: number;
  active: boolean;
  notes?: string;
}

interface CssSelectorConfig {
  container?: string;
  bloodGroupRow: string;
  bloodGroupName: string;
  levelPercentage: string;
  dateSelector?: string;
  customFields?: Record<string, string>;
}

// Stan filtrów
interface ParserConfigFiltersState {
  rckikId?: number | null;
  parserType?: 'JSOUP' | 'SELENIUM' | 'CUSTOM' | null;
  active?: boolean | null;
}

// Stan tabeli z sortowaniem i paginacją
interface ParserConfigTableState {
  configs: ParserConfigDto[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: ParserConfigFiltersState;
  loading: boolean;
  error: string | null;
}

// Stan modalu testowania
interface TestParserModalState {
  isOpen: boolean;
  configId: number | null;
  testUrl: string;
  testResult: ParserTestResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Stan modalu formularza
interface ParserConfigFormModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  configId: number | null;
  initialData: ParserConfigDto | null;
  isDirty: boolean;
}
```

## 6. Zarządzanie stanem

**Strategia:** Redux Toolkit dla globalnego stanu + React Hook Form dla formularzy + lokalny useState dla UI state.

### Redux Slices

```typescript
// parserConfigSlice.ts
interface ParserConfigState {
  configs: ParserConfigDto[];
  selectedConfig: ParserConfigDto | null;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: ParserConfigFiltersState;
  loading: boolean;
  error: string | null;
}

// Actions:
// - fetchParserConfigs(filters, page, size, sort)
// - fetchParserConfigDetails(id)
// - createParserConfig(data)
// - updateParserConfig(id, data)
// - deleteParserConfig(id)
// - setFilters(filters)
// - setPage(page)
// - setSort(column, direction)
```

### Custom Hooks

```typescript
// useParserConfigs.ts
function useParserConfigs() {
  const dispatch = useDispatch();
  const { configs, loading, error, filters, currentPage } = useSelector(
    (state: RootState) => state.parserConfig
  );

  const loadConfigs = useCallback((filters, page) => {
    dispatch(fetchParserConfigs(filters, page));
  }, [dispatch]);

  const createConfig = useCallback(async (data) => {
    await dispatch(createParserConfig(data));
  }, [dispatch]);

  // ... inne metody

  return {
    configs,
    loading,
    error,
    filters,
    currentPage,
    loadConfigs,
    createConfig,
    // ...
  };
}

// useParserTest.ts
function useParserTest(configId: number) {
  const [testResult, setTestResult] = useState<ParserTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(async (testUrl?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(
        `/api/v1/admin/parsers/configs/${configId}/test`,
        { testUrl }
      );
      setTestResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  const saveResults = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.post(
        `/api/v1/admin/parsers/configs/${configId}/test?saveResults=true`,
        { testUrl: testResult?.testUrl }
      );
      toast.success('Wyniki zapisane do bazy danych');
    } catch (err) {
      setError(err.message);
      toast.error('Błąd zapisu wyników');
    } finally {
      setIsLoading(false);
    }
  }, [configId, testResult]);

  return { testResult, isLoading, error, runTest, saveResults };
}
```

### Formularz z React Hook Form + Zod

```typescript
// parserConfigSchema.ts
import { z } from 'zod';

const cssSelectorConfigSchema = z.object({
  container: z.string().optional(),
  bloodGroupRow: z.string().min(1, 'Pole wymagane'),
  bloodGroupName: z.string().min(1, 'Pole wymagane'),
  levelPercentage: z.string().min(1, 'Pole wymagane'),
  dateSelector: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

const parserConfigFormSchema = z.object({
  rckikId: z.number().positive('Wybierz centrum RCKiK'),
  parserType: z.enum(['JSOUP', 'SELENIUM', 'CUSTOM']),
  sourceUrl: z
    .string()
    .url('Nieprawidłowy format URL')
    .startsWith('https://', 'URL musi zaczynać się od https://')
    .max(2000, 'URL nie może przekraczać 2000 znaków'),
  cssSelectors: cssSelectorConfigSchema,
  scheduleCron: z.string().regex(
    /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ){4}((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*))$/,
    'Nieprawidłowe wyrażenie cron'
  ),
  timeoutSeconds: z
    .number()
    .int()
    .min(10, 'Timeout musi wynosić co najmniej 10 sekund')
    .max(120, 'Timeout nie może przekraczać 120 sekund'),
  active: z.boolean(),
  notes: z.string().max(500, 'Notatki nie mogą przekraczać 500 znaków').optional(),
});

export type ParserConfigFormData = z.infer<typeof parserConfigFormSchema>;
export { parserConfigFormSchema };
```

## 7. Integracja API

### Endpointy

**1. Lista konfiguracji parserów:**
- **Method:** GET
- **Path:** `/api/v1/admin/parsers/configs`
- **Query params:** `rckikId`, `parserType`, `active`, `page`, `size`
- **Request type:** Brak body
- **Response type:** `ParserConfigResponse` (zawiera `ParserConfigDto[]` + pagination)
- **Użycie:** Ładowanie listy w tabeli, filtrowanie, paginacja

**2. Szczegóły konfiguracji:**
- **Method:** GET
- **Path:** `/api/v1/admin/parsers/configs/{id}`
- **Request type:** Brak body
- **Response type:** `ParserConfigDto` (z `recentRuns[]` i `auditTrail[]`)
- **Użycie:** Ładowanie szczegółów do edycji, podgląd audit trail

**3. Tworzenie konfiguracji:**
- **Method:** POST
- **Path:** `/api/v1/admin/parsers/configs`
- **Request type:** `ParserConfigRequest`
- **Response type:** `ParserConfigDto`
- **Użycie:** Zapisanie nowej konfiguracji z formularza

**4. Aktualizacja konfiguracji:**
- **Method:** PUT
- **Path:** `/api/v1/admin/parsers/configs/{id}`
- **Request type:** `ParserConfigRequest` (partial update)
- **Response type:** `ParserConfigDto`
- **Użycie:** Zapisanie zmian z formularza edycji

**5. Usuwanie konfiguracji:**
- **Method:** DELETE
- **Path:** `/api/v1/admin/parsers/configs/{id}`
- **Request type:** Brak body
- **Response type:** 204 No Content
- **Użycie:** Soft delete (ustawia active=false)

**6. Testowanie parsera (dry-run):**
- **Method:** POST
- **Path:** `/api/v1/admin/parsers/configs/{id}/test`
- **Query params:** `saveResults` (optional, default: false)
- **Request type:** `ParserTestRequest` (zawiera opcjonalny `testUrl`)
- **Response type:** `ParserTestResponse` (zawiera `parsedData[]`, `warnings[]`, `errors[]`, `summary`)
- **Użycie:** Testowanie parsera przed zapisem, preview wyników

### API Client

```typescript
// lib/api/endpoints/adminParsers.ts
import { apiClient } from '../client';
import type {
  ParserConfigResponse,
  ParserConfigDto,
  ParserConfigRequest,
  ParserTestRequest,
  ParserTestResponse,
} from '../types';

export const adminParsersApi = {
  // Lista konfiguracji
  getConfigs: async (params: {
    rckikId?: number;
    parserType?: string;
    active?: boolean;
    page?: number;
    size?: number;
  }): Promise<ParserConfigResponse> => {
    const response = await apiClient.get('/api/v1/admin/parsers/configs', { params });
    return response.data;
  },

  // Szczegóły konfiguracji
  getConfigDetails: async (id: number): Promise<ParserConfigDto> => {
    const response = await apiClient.get(`/api/v1/admin/parsers/configs/${id}`);
    return response.data;
  },

  // Tworzenie konfiguracji
  createConfig: async (data: ParserConfigRequest): Promise<ParserConfigDto> => {
    const response = await apiClient.post('/api/v1/admin/parsers/configs', data);
    return response.data;
  },

  // Aktualizacja konfiguracji
  updateConfig: async (id: number, data: Partial<ParserConfigRequest>): Promise<ParserConfigDto> => {
    const response = await apiClient.put(`/api/v1/admin/parsers/configs/${id}`, data);
    return response.data;
  },

  // Usuwanie konfiguracji (soft delete)
  deleteConfig: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/parsers/configs/${id}`);
  },

  // Testowanie parsera (dry-run)
  testParser: async (
    id: number,
    request: ParserTestRequest,
    saveResults = false
  ): Promise<ParserTestResponse> => {
    const response = await apiClient.post(
      `/api/v1/admin/parsers/configs/${id}/test`,
      request,
      { params: { saveResults } }
    );
    return response.data;
  },
};
```

## 8. Interakcje użytkownika

### Scenariusz 1: Przeglądanie listy konfiguracji parserów
1. Admin wchodzi na `/admin/parsers`
2. Strona ładuje się z SSR (AdminLayout + breadcrumbs)
3. Po hydratacji, ParserConfigTable (client:idle) wysyła GET `/api/v1/admin/parsers/configs?page=0&size=50`
4. Tabela wyświetla listę konfiguracji z kolumnami: RCKiK, Typ, URL, Status, Ostatnie uruchomienie, Akcje
5. Admin może sortować kolumny (kliknięcie nagłówka)
6. Admin może filtrować (wybór RCKiK, typ parsera, status aktywności)
7. Filtry synchronizują się z query params → shareable URL

### Scenariusz 2: Tworzenie nowej konfiguracji parsera
1. Admin klika "Dodaj konfigurację parsera" w nagłówku
2. Otwiera się ParserConfigFormModal w trybie create
3. Admin wypełnia formularz:
   - Wybiera RCKiK z typeahead dropdown
   - Wybiera typ parsera (CUSTOM dla Rzeszowa)
   - Wpisuje URL źródłowy: `https://rckik.rzeszow.pl/zapasy-krwi`
   - Edytuje JSON selectors w Monaco Editor:
     ```json
     {
       "container": ".blood-levels-container",
       "bloodGroupRow": "tr.blood-row",
       "bloodGroupName": "td:nth-child(1)",
       "levelPercentage": "td:nth-child(2) .percentage"
     }
     ```
   - Ustawia cron schedule: `0 2 * * *`
   - Ustawia timeout: 30s
   - Zaznacza "Aktywny"
   - Wpisuje notatki
4. Admin klika "Test i zapisz"
5. Frontend wywołuje POST `/api/v1/admin/parsers/configs/{id}/test` (dry-run)
6. Otwiera się TestParserModal z wynikami testu
7. Jeśli test SUCCESS → admin klika "Zapisz wyniki" → POST `/api/v1/admin/parsers/configs` (utworzenie konfiguracji)
8. Toast notification: "Konfiguracja parsera została utworzona"
9. Modal zamyka się, tabela odświeża listę

### Scenariusz 3: Edycja istniejącej konfiguracji
1. Admin klika ikonę "Edit" w wierszu tabeli
2. Otwiera się ParserConfigFormModal w trybie edit
3. Formularz jest wypełniony aktualnymi wartościami (GET `/api/v1/admin/parsers/configs/{id}`)
4. Pola `rckikId` i `parserType` są disabled (immutable)
5. Admin zmienia selektor CSS z `.percentage` na `.percentage-value`
6. Admin wpisuje notatki: "Zaktualizowano selektor po zmianie struktury strony"
7. Admin klika "Zapisz"
8. Frontend wywołuje PUT `/api/v1/admin/parsers/configs/{id}`
9. Backend tworzy audit log entry z before/after values
10. Toast notification: "Konfiguracja zaktualizowana"
11. Modal zamyka się, tabela odświeża wiersz

### Scenariusz 4: Testowanie parsera (dry-run)
1. Admin klika ikonę "Test" w wierszu tabeli
2. Otwiera się TestParserModal
3. Pole testUrl jest puste (użyje URL z konfiguracji)
4. Admin klika "Uruchom test"
5. Frontend wywołuje POST `/api/v1/admin/parsers/configs/{id}/test`
6. Progress indicator pokazuje "Parsowanie w toku..."
7. Po 1.8s pojawia się ParseResultsPreview z wynikami:
   - Tabela z 7 grupami krwi (0+, 0-, A+, A-, B+, B-, AB-)
   - Każdy wiersz pokazuje: grupa, poziom (%), status (badge), selektor, raw text
   - Warning: "Blood group AB+ not found - expected 8 groups, found 7"
   - Summary: 87.5% success rate, 1850ms execution time
8. Admin widzi, że brakuje AB+ → klika "Zamknij"
9. Admin wraca do edycji konfiguracji, poprawia selektory
10. Powtarza test → tym razem 8/8 grup, status SUCCESS
11. Admin klika "Zapisz wyniki do bazy" → dane zapisywane z `is_manual=false`

### Scenariusz 5: Dezaktywacja parsera
1. Admin klika ikonę "Delete" w wierszu tabeli
2. Pojawia się ConfirmModal:
   - Tytuł: "Dezaktywować parser?"
   - Treść: "Parser zostanie dezaktywowany (soft delete). Istniejące snapshoty pozostaną w bazie. Scraping dla tego RCKiK będzie zatrzymany."
   - Przyciski: "Anuluj", "Dezaktywuj"
3. Admin klika "Dezaktywuj"
4. Frontend wywołuje DELETE `/api/v1/admin/parsers/configs/{id}`
5. Backend ustawia `active=false` i tworzy audit log entry
6. Toast notification: "Parser został dezaktywowany"
7. Wiersz w tabeli zmienia status na "Nieaktywny" (szary badge)

### Scenariusz 6: Podgląd historii zmian (audit trail)
1. Admin klika wiersz w tabeli (rozwinięcie szczegółów)
2. Pod wierszem rozwija się ParserDetailsPanel
3. Panel zawiera 3 sekcje:
   - RecentRunsTimeline: 10 ostatnich uruchomień (timestamp, status, metryki)
   - AuditTrailTimeline: historia zmian konfiguracji
   - ParserStatsCard: wykresy i statystyki (success rate, avg execution time)
4. W AuditTrailTimeline admin widzi:
   - Entry 1: PARSER_CONFIG_UPDATED, admin@mkrew.pl, 2025-01-08 14:30
     - Changes diff: `cssSelectors.levelPercentage: "td:nth-child(2) span" → "td:nth-child(2) .percentage"`
     - Notes: "Zaktualizowano selektor po zmianie struktury strony"
   - Entry 2: PARSER_CONFIG_CREATED, admin@mkrew.pl, 2025-01-07 10:00
     - Notes: "Nowa konfiguracja parsera dla RCKiK Rzeszów"

## 9. Warunki i walidacja

### Warunki weryfikowane przez interfejs

**1. Walidacja formularza konfiguracji (ParserConfigFormModal):**

| Pole | Warunki | Komponent | Wpływ na UI |
|------|---------|-----------|-------------|
| rckikId | Required, must exist, nie może mieć już aktywnej konfiguracji | RckikSelect | Error message pod polem: "RCKiK już posiada aktywną konfigurację". Przycisk "Zapisz" disabled. |
| parserType | Required, one of: JSOUP, SELENIUM, CUSTOM | Select | Error message: "Wybierz typ parsera". Przycisk disabled. |
| sourceUrl | Required, valid HTTPS URL, max 2000 chars | UrlInput | Error message: "URL musi zaczynać się od https://" lub "URL zbyt długi". Przycisk disabled. |
| cssSelectors | Required (jeśli CUSTOM), valid JSON, required keys present | JsonEditor | Red highlight błędów składni. Error message: "Brak wymaganego klucza: bloodGroupRow". Przycisk disabled. |
| scheduleCron | Valid cron expression | Input | Error message: "Nieprawidłowe wyrażenie cron". Tooltip z przykładami. Przycisk disabled. |
| timeoutSeconds | Integer 10-120 | Input | Error message: "Timeout musi wynosić 10-120 sekund". Przycisk disabled. |
| notes | Max 500 chars | Textarea | Character counter: "450/500". Warning przy >450: "Zbliżasz się do limitu". |

**2. Walidacja podczas testowania parsera (TestParserModal):**

| Warunek | Weryfikacja | Wpływ na UI |
|---------|-------------|-------------|
| testUrl valid | Optional, valid HTTPS URL | Error message pod polem: "Nieprawidłowy URL". Przycisk "Uruchom test" disabled. |
| HTTP timeout | Backend timeout po 30s | Error message: "Przekroczono limit czasu (30s)". Status: FAILED. |
| HTTP status != 200 | Backend sprawdza | Warning: "HTTP status: 404 - strona nie znaleziona". Status: FAILED. |
| Missing blood groups | Sprawdzenie czy znaleziono 8 grup | Warning: "Blood group AB+ not found - expected 8, found 7". Status: PARTIAL. |
| Invalid percentage | Backend waliduje 0-100 | Error: "Invalid percentage value: 120% - must be 0-100". Status: PARTIAL. |

**3. Warunki biznesowe:**

| Warunek | Weryfikacja | Wpływ na UI |
|---------|-------------|-------------|
| Duplicate active config | Backend sprawdza przy POST | Error modal: "RCKiK już posiada aktywną konfigurację (ID: 9)". Link do istniejącej konfiguracji. |
| Immutable fields | Frontend disabled, backend reject | Pola `rckikId` i `parserType` disabled w trybie edit. |
| Dry-run nie zapisuje | Backend nie tworzy snapshotów jeśli `saveResults=false` | Summary pokazuje `saved: false`. Przycisk "Zapisz wyniki" widoczny tylko jeśli test SUCCESS. |
| Soft delete | Backend ustawia `active=false` zamiast DELETE | Confirm modal informuje: "Soft delete - snapshoty pozostaną". Wiersz zmienia status na "Nieaktywny". |

## 10. Obsługa błędów

### Scenariusze błędów i ich obsługa

**1. Błąd sieci (Network Error):**
- **Przyczyna:** Brak połączenia z API
- **Obsługa:**
  - Axios interceptor wyłapuje błąd
  - Toast error: "Błąd połączenia z serwerem. Sprawdź połączenie internetowe."
  - Retry button w table/modal
  - Skeleton loaders zastąpione error state z przyciskiem "Spróbuj ponownie"

**2. Błąd 401 Unauthorized:**
- **Przyczyna:** Token wygasł lub nieprawidłowy
- **Obsługa:**
  - Axios interceptor wyłapuje 401
  - Próba refresh tokenu
  - Jeśli refresh fail → redirect do `/login` z toast: "Sesja wygasła. Zaloguj się ponownie."

**3. Błąd 403 Forbidden:**
- **Przyczyna:** Brak uprawnień ADMIN
- **Obsługa:**
  - SSR middleware blokuje dostęp do `/admin/parsers`
  - Redirect do `/dashboard` z toast error: "Brak uprawnień administratora"

**4. Błąd 404 Not Found:**
- **Przyczyna:** Parser config nie istnieje
- **Obsługa:**
  - W modal edit: Toast error: "Konfiguracja nie została znaleziona", zamknięcie modalu
  - W table: Usunięcie wiersza z listy (optimistic update rollback)

**5. Błąd 409 Conflict (Duplicate Config):**
- **Przyczyna:** RCKiK już ma aktywną konfigurację
- **Obsługa:**
  - Toast error: "RCKiK już posiada aktywną konfigurację"
  - Error modal z linkiem: "Zobacz istniejącą konfigurację (ID: 9)" → kliknięcie otwiera modal edit z ID=9

**6. Błąd 400 Bad Request (Validation Error):**
- **Przyczyna:** Nieprawidłowe dane w formularzu
- **Obsługa:**
  - Backend zwraca `{ error: "VALIDATION_ERROR", details: [{ field, message }] }`
  - Frontend mapuje błędy do pól formularza:
    ```typescript
    errors.forEach(({ field, message }) => {
      setError(field, { message });
    });
    ```
  - Czerwone ramki wokół błędnych pól
  - Error messages pod polami

**7. Błąd parsowania (Test Parser Failed):**
- **Przyczyna:** Zmiana struktury HTML strony źródłowej
- **Obsługa:**
  - TestParserModal pokazuje status: FAILED lub PARTIAL
  - ErrorsList wyświetla szczegółowe błędy:
    ```
    - Container not found: .blood-levels-container
    - Selector returned empty: td:nth-child(2) .percentage
    ```
  - Sugestie naprawy w tooltip: "Sprawdź czy struktura strony się zmieniła. Użyj DevTools do inspekcji selektorów."
  - Przycisk "Otwórz URL w nowej karcie" → otwiera sourceUrl w nowym oknie do debugowania

**8. Błąd timeout (Parser Test Timeout):**
- **Przyczyna:** Strona ładuje się dłużej niż timeout (30s)
- **Obsługa:**
  - TestParserModal pokazuje status: FAILED
  - Error message: "Przekroczono limit czasu (30s). Strona nie odpowiada."
  - Sugestia: "Zwiększ timeout w konfiguracji lub sprawdź dostępność strony."

**9. Błąd JSON parsing (Invalid Selectors):**
- **Przyczyna:** Błąd składni JSON w JsonEditor
- **Obsługa:**
  - Monaco Editor podświetla błąd na czerwono
  - Error message pod editorem: "Invalid JSON syntax at line 5, column 12"
  - Przycisk "Zapisz" disabled dopóki JSON nie jest poprawny

**10. Brak danych (Empty State):**
- **Przyczyna:** Brak konfiguracji parserów w systemie
- **Obsługa:**
  - Tabela pokazuje EmptyState component:
    ```
    Ilustracja + tekst: "Brak konfiguracji parserów"
    Podtekst: "Dodaj pierwszą konfigurację, aby rozpocząć scraping danych RCKiK"
    CTA Button: "Dodaj konfigurację"
    ```

**11. Concurrent modification (Optimistic Update Rollback):**
- **Przyczyna:** Inny admin zmienił konfigurację w między czasie
- **Obsługa:**
  - Frontend wykonuje optimistic update (natychmiastowa zmiana UI)
  - Jeśli API zwróci błąd → rollback optimistic update
  - Toast error: "Konfiguracja została zmieniona przez innego administratora. Odśwież stronę."
  - Przycisk "Odśwież" w toast → reload danych

## 11. Kroki implementacji

### Faza 1: Setup i infrastruktura (Dzień 1)
1. ✅ Utworzenie struktury katalogów zgodnie z sekcją 11.1 z ui-plan.md
2. ✅ Dodanie typów TypeScript:
   - `lib/types/api.ts` - typy DTO z backendu (ParserConfigDto, ParserTestResponse, etc.)
   - `lib/types/models.ts` - typy ViewModel (ParserConfigFormData, ParserConfigTableState, etc.)
3. ✅ Utworzenie API client:
   - `lib/api/endpoints/adminParsers.ts` - funkcje do komunikacji z API
4. ✅ Utworzenie Redux slice:
   - `lib/store/slices/parserConfigSlice.ts` - stan globalny dla konfiguracji parserów
5. ✅ Utworzenie custom hooks:
   - `lib/hooks/useParserConfigs.ts` - hook do zarządzania konfiguracjami
   - `lib/hooks/useParserTest.ts` - hook do testowania parserów
6. ✅ Utworzenie Zod schema:
   - `lib/utils/validation.ts` - schema dla formularza ParserConfigFormData

### Faza 2: UI Primitives (Dzień 1-2)
7. ✅ Implementacja komponentów UI (jeśli nie istnieją):
   - `components/ui/Modal.tsx` - modal z focus trap
   - `components/ui/Table.tsx` - tabela z sortowaniem
   - `components/ui/Badge.tsx` - badge dla statusów
   - `components/ui/Alert.tsx` - alerty dla warnings/errors
   - `components/ui/ProgressBar.tsx` - progress indicator
8. ✅ Implementacja komponentów admin:
   - `components/admin/ConfirmModal.tsx` - modal potwierdzenia
   - `components/admin/EmptyState.tsx` - empty state dla tabeli

### Faza 3: Komponenty specyficzne dla widoku (Dzień 2-4)
9. ✅ `components/admin/UrlInput.tsx` - input z walidacją HTTPS URL
10. ✅ `components/admin/RckikSelect.tsx` - typeahead dropdown dla RCKiK
11. ✅ `components/admin/JsonEditor.tsx` - Monaco Editor dla CSS selectors
12. ✅ `components/admin/ParserStatusBadge.tsx` - badge statusu parsera
13. ✅ `components/admin/ParserConfigFilters.tsx` - panel filtrów
14. ✅ `components/admin/ParserConfigTable.tsx` - tabela konfiguracji
15. ✅ `components/admin/ParserConfigFormModal.tsx` - formularz create/edit
16. ✅ `components/admin/TestParserModal.tsx` - modal testowania parsera
17. ✅ `components/admin/ParseResultsPreview.tsx` - preview wyników testu
18. ✅ `components/admin/AuditTrailTimeline.tsx` - timeline historii zmian
19. ✅ `components/admin/ParserDetailsPanel.tsx` - panel szczegółów (rozwijany pod wierszem tabeli)

### Faza 4: Strona i integracja (Dzień 4-5)
20. ✅ Utworzenie strony Astro:
    - `pages/admin/parsers.astro` - główna strona widoku
21. ✅ Dodanie routing guards:
    - `middleware/auth.ts` - sprawdzenie role=ADMIN
22. ✅ Integracja z AdminLayout:
    - Dodanie linku "Parsers" w sidebar admina
    - Breadcrumbs: Admin → Parsers
23. ✅ Implementacja logiki biznesowej:
    - Fetch konfiguracji parserów przy load strony (SSR data)
    - Filtrowanie i sortowanie
    - CRUD operations (create, update, delete)
    - Testowanie parsera (dry-run)
24. ✅ Implementacja obsługi błędów:
    - Toast notifications dla wszystkich operacji
    - Error states w komponentach
    - Retry logic dla network errors

### Faza 5: Walidacja i UX (Dzień 5-6)
25. ✅ Implementacja walidacji formularza:
    - React Hook Form + Zod schema
    - Inline validation (onChange, onBlur)
    - Error messages pod polami
26. ✅ Implementacja walidacji JSON selectors:
    - Monaco Editor syntax highlighting
    - Validation required keys (bloodGroupRow, bloodGroupName, levelPercentage)
27. ✅ Implementacja optimistic updates:
    - Natychmiastowa zmiana UI po akcji (create, update, delete)
    - Rollback jeśli API zwróci błąd
28. ✅ Implementacja loading states:
    - Skeleton loaders dla tabeli
    - Spinner podczas testowania parsera
    - Progress indicator dla długich operacji
29. ✅ Implementacja empty states:
    - EmptyState dla pustej tabeli
    - Brak wyników filtrowania

### Faza 6: Accessibility i responsywność (Dzień 6)
30. ✅ Accessibility:
    - Keyboard navigation (Tab, Enter, ESC)
    - ARIA labels dla wszystkich interaktywnych elementów
    - Focus management w modalach (focus trap)
    - Screen reader support
31. ✅ Responsywność:
    - Mobile-friendly tabela (horizontal scroll lub card view)
    - Mobile-friendly modals (full screen na mobile)
    - Filtry w drawer na mobile

### Faza 7: Testy i dopracowanie (Dzień 7)
32. ✅ Unit tests:
    - Testy komponentów (React Testing Library)
    - Testy custom hooks
    - Testy Zod schema
33. ✅ Integration tests:
    - Test całego flow: create → test → save
    - Test edycji konfiguracji
    - Test filtrowania i sortowania
34. ✅ E2E tests (Playwright):
    - Test scenariusza: admin tworzy konfigurację dla RCKiK Rzeszów
    - Test scenariusza: admin testuje parser (dry-run)
    - Test scenariusza: admin edytuje selektory po zmianie struktury strony
35. ✅ Code review i refactoring
36. ✅ Dokumentacja:
    - JSDoc dla komponentów
    - README z instrukcjami użycia
37. ✅ Deployment:
    - Merge do branch'a feature
    - Deploy do staging
    - Smoke tests na staging

### Kolejność implementacji (priorytet)
**Must-have (MVP):**
- ParserConfigTable (przeglądanie listy)
- ParserConfigFormModal (create/edit)
- TestParserModal (dry-run testowanie)
- Podstawowa walidacja formularza
- CRUD operations

**Should-have (Extended):**
- ParserDetailsPanel (audit trail, recent runs)
- Zaawansowane filtry
- Sortowanie kolumn
- Optimistic updates

**Nice-to-have (Future):**
- ParserStatsCard (wykresy)
- Bulk operations (multi-select)
- Export konfiguracji do JSON
- Import konfiguracji z JSON

### Szacowany czas implementacji
- **Faza 1-2:** 2 dni (setup + UI primitives)
- **Faza 3:** 2 dni (komponenty specyficzne)
- **Faza 4:** 1 dzień (strona i integracja)
- **Faza 5:** 1 dzień (walidacja i UX)
- **Faza 6:** 0.5 dnia (accessibility i responsywność)
- **Faza 7:** 0.5 dnia (testy i dopracowanie)

**Całkowity czas: ~7 dni roboczych**

## Podsumowanie

Ten plan dostarcza szczegółowy przewodnik implementacji widoku zarządzania konfiguracją parserów dla administratorów systemu mkrew. Widok umożliwia pełne zarządzanie konfiguracjami parserów dla centrów RCKiK, testowanie ich działania oraz monitoring historii zmian.

**Kluczowe elementy implementacji:**
- Architektura oparta na Astro + React islands (optymalna hydratacja)
- Redux Toolkit dla globalnego stanu + React Hook Form dla formularzy
- Walidacja za pomocą Zod (type-safe)
- Monaco Editor dla edycji JSON selectors
- Dry-run testing parserów bez zapisu do bazy
- Szczegółowy audit trail dla wszystkich zmian
- Obsługa błędów na każdym poziomie
- Accessibility (WCAG 2.1 AA)
- Mobile responsive design

Plan jest zgodny z wymaganiami PRD (US-029, US-030), UI plan oraz API plan.
