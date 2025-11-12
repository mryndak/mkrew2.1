# Plan implementacji widoku Szczegóły RCKiK

## 1. Przegląd

Widok **Szczegóły RCKiK** prezentuje pełną informację o wybranym centrum krwiodawstwa, w tym:
- Podstawowe dane centrum (nazwa, adres, lokalizacja)
- Aktualne stany krwi dla wszystkich grup krwi z kolorowym oznaczeniem statusu
- Historyczne dane w formie wykresu trendu (ostatnie 30 dni)
- Tabelę snapshotów historycznych z możliwością paginacji
- Status scrapera (ostatnie udane pobranie, ewentualne błędy)
- Możliwość dodania/usunięcia centrum z ulubionych (dla zalogowanych użytkowników)

Widok jest **publiczny** (dostępny bez logowania) i wykorzystuje SSG (Static Site Generation) z ISR (Incremental Static Regeneration) co 5 minut dla aktualności danych.

**User Story:** US-008 - "Szczegóły RCKiK: Jako użytkownik chcę zobaczyć szczegóły konkretnego RCKiK, historię snapshotów i trend."

## 2. Routing widoku

**Ścieżka:** `/rckik/[id]`

**Przykłady:**
- `/rckik/1` - Szczegóły centrum o ID 1 (np. RCKiK Warszawa)
- `/rckik/15` - Szczegóły centrum o ID 15 (np. RCKiK Kraków)

**Strategia renderowania:**
- **SSG (Static Site Generation)** - strony generowane podczas build time dla wszystkich istniejących centrów
- **ISR (Incremental Static Regeneration)** - automatyczna rewalidacja co 5 minut (zgodnie z ui-plan.md)
- **404 handling** - dla nieistniejących ID przekierowanie na stronę błędu

## 3. Struktura komponentów

```
RckikDetailsPage (Astro page: /rckik/[id].astro)
├── DashboardLayout / BaseLayout (w zależności od stanu uwierzytelnienia)
│   ├── Navbar
│   ├── Breadcrumbs (Home > Lista RCKiK > [Nazwa centrum])
│   └── Main Content
│       ├── RckikHeader
│       │   ├── Title (Nazwa centrum + kod)
│       │   ├── Address & Location Info
│       │   ├── FavoriteButton (client:load - React Island)
│       │   └── ShareButton (opcjonalnie)
│       │
│       ├── CurrentBloodLevelsSection
│       │   ├── SectionTitle ("Aktualne stany krwi")
│       │   ├── LastUpdateInfo (timestamp ostatniej aktualizacji)
│       │   └── BloodLevelBadgesGrid
│       │       └── BloodLevelBadge × 8 (dla każdej grupy krwi)
│       │
│       ├── BloodLevelChartSection
│       │   ├── SectionTitle ("Trend poziomu krwi - ostatnie 30 dni")
│       │   ├── BloodGroupSelector (wybór grupy krwi do wykresu)
│       │   └── BloodLevelChart (client:visible - lazy load, Recharts)
│       │
│       ├── HistoryTableSection
│       │   ├── SectionTitle ("Historia snapshotów")
│       │   ├── FiltersBar (bloodGroup filter, date range)
│       │   ├── HistoryTable (sortable, paginated)
│       │   └── Pagination
│       │
│       └── ScraperStatusSection
│           ├── SectionTitle ("Status scrapera")
│           ├── ScraperStatus (ostatnie udane pobranie, błędy)
│           └── ReportIssueButton (link do formularza zgłoszenia - US-021)
│
└── Footer
```

## 4. Szczegóły komponentów

### 4.1. RckikHeader

**Opis komponentu:**
Nagłówek widoku prezentujący podstawowe informacje o centrum krwiodawstwa. Zawiera nazwę, kod, adres, współrzędne geograficzne oraz przycisk dodania do ulubionych (dla zalogowanych użytkowników).

**Główne elementy:**
- `<h1>` z nazwą centrum i kodem (np. "RCKiK Warszawa (RCKIK-WAW)")
- `<address>` semantyczny tag z pełnym adresem
- Link do mapy (Google Maps / OpenStreetMap) z współrzędnymi
- Przyciski akcji: FavoriteButton, ShareButton
- Badge "Aktywne" / "Nieaktywne" (status centrum)

**Obsługiwane interakcje:**
- Kliknięcie przycisku "Dodaj do ulubionych" (wymaga logowania) → wywołanie POST `/api/v1/users/me/favorites`
- Kliknięcie przycisku "Usuń z ulubionych" → wywołanie DELETE `/api/v1/users/me/favorites/{rckikId}`
- Kliknięcie na adres → otwarcie mapy w nowej karcie
- Kliknięcie "Udostępnij" → kopiowanie linku lub native share API

**Obsługiwana walidacja:**
- Brak (komponent prezentacyjny, dane z API są już zwalidowane)

**Typy:**
- `RckikDetailDto` - dane centrum z API
- `FavoriteButtonProps` - interface dla przycisku ulubionych

**Propsy:**
```typescript
interface RckikHeaderProps {
  rckik: RckikDetailDto;
  isFavorite: boolean;
  isAuthenticated: boolean;
  onToggleFavorite?: () => void;
}
```

---

### 4.2. BloodLevelBadge

**Opis komponentu:**
Komponent prezentujący poziom krwi dla konkretnej grupy krwi w formie karty/badge z kolorem odpowiadającym statusowi (CRITICAL - czerwony, IMPORTANT - pomarańczowy, OK - zielony). Zawiera ikonę, tekst i procent.

**Główne elementy:**
- Kontener z background color zależnym od `levelStatus`
- Ikona kropli krwi lub inna ikona statusu
- Nazwa grupy krwi (np. "A+", "0-")
- Procent poziomu (np. "45.5%")
- Tekst statusu (np. "Ważne", "Krytyczne", "OK")
- Timestamp ostatniej aktualizacji (opcjonalnie w tooltip)

**Obsługiwane interakcje:**
- Hover → pokazanie tooltipa z dokładnym timestampem aktualizacji
- Kliknięcie (opcjonalnie) → filtrowanie wykresu/tabeli do tej grupy krwi

**Obsługiwana walidacja:**
- Brak (komponent prezentacyjny)

**Typy:**
- `BloodLevelDto` - dane poziomu krwi z API

**Propsy:**
```typescript
interface BloodLevelBadgeProps {
  bloodGroup: string;          // "A+", "0-", etc.
  levelPercentage: number;     // 45.5
  levelStatus: 'CRITICAL' | 'IMPORTANT' | 'OK';
  lastUpdate: string;          // ISO timestamp
  onClick?: (bloodGroup: string) => void; // opcjonalne
}
```

---

### 4.3. BloodLevelChart

**Opis komponentu:**
Interaktywny wykres liniowy (line chart) prezentujący trend poziomu krwi dla wybranej grupy krwi w ciągu ostatnich 30 dni. Używa biblioteki **Recharts** i jest lazy-loadowany (`client:visible` w Astro).

**Główne elementy:**
- `<ResponsiveContainer>` z Recharts
- `<LineChart>` z danymi historycznymi
- `<Line>` z kolorem odpowiadającym statusowi
- `<XAxis>` z datami (format: "DD.MM")
- `<YAxis>` z procentami (0-100%)
- `<Tooltip>` z szczegółowymi informacjami
- `<Legend>`
- `<ReferenceLine>` dla progów (20% - krytyczny, 50% - ważny)
- Przycisk przełączania grupy krwi (dropdown lub taby)

**Obsługiwane interakcje:**
- Zmiana grupy krwi w selektorze → refetch danych i przeładowanie wykresu
- Hover nad punktem → tooltip z dokładnymi danymi
- Kliknięcie punktu (opcjonalnie) → pokazanie szczegółów snapshotu

**Obsługiwana walidacja:**
- Brak danych historycznych → pokazanie EmptyState z komunikatem "Brak danych dla tej grupy krwi"
- Błąd ładowania → pokazanie ErrorState z możliwością retry

**Typy:**
- `BloodLevelHistoryDto[]` - tablica snapshotów historycznych
- `ChartDataPoint` - przetworzony punkt na wykresie

**Propsy:**
```typescript
interface BloodLevelChartProps {
  rckikId: number;
  initialBloodGroup?: string;  // domyślna grupa krwi do pokazania
  historyData: BloodLevelHistoryDto[];
  onBloodGroupChange?: (bloodGroup: string) => void;
}

interface ChartDataPoint {
  date: string;              // "2025-01-08"
  percentage: number;        // 45.5
  status: string;            // "IMPORTANT"
  timestamp: string;         // pełny timestamp dla tooltip
}
```

---

### 4.4. HistoryTable

**Opis komponentu:**
Tabela z historycznymi snapshotami poziomów krwi. Umożliwia sortowanie, filtrowanie po grupie krwi i zakresie dat, oraz paginację.

**Główne elementy:**
- `<table>` z semantycznymi tagami (thead, tbody, tfoot)
- Kolumny:
  - Data snapshotu (snapshotDate)
  - Grupa krwi (bloodGroup)
  - Poziom % (levelPercentage) z kolorowym badge statusu
  - Status (levelStatus) - badge tekstowy
  - Czas pobrania (scrapedAt)
  - Źródło (isManual - "Ręczne" / "Automatyczne")
- Nagłówki z możliwością sortowania (strzałki ↑↓)
- Wiersz z danymi: hover effect, accessible keyboard navigation
- Paginacja na dole: Previous, numeracja stron, Next

**Obsługiwane interakcje:**
- Kliknięcie nagłówka kolumny → sortowanie ASC/DESC
- Zmiana filtrów (bloodGroup, dateRange) → refetch danych
- Kliknięcie numeru strony → zmiana strony
- Kliknięcie wiersza (opcjonalnie) → rozwinięcie szczegółów snapshotu

**Obsługiwana walidacja:**
- Brak wyników → EmptyState "Brak snapshotów dla wybranych filtrów"
- Błąd ładowania → ErrorState z retry button

**Typy:**
- `BloodLevelHistoryResponse` - response z API z paginacją
- `BloodLevelHistoryDto[]` - lista snapshotów
- `TableSortConfig` - konfiguracja sortowania
- `TableFilters` - filtry tabeli

**Propsy:**
```typescript
interface HistoryTableProps {
  rckikId: number;
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: HistoryTableFilters;
}

interface HistoryTableFilters {
  bloodGroup?: string;
  fromDate?: string;  // ISO date
  toDate?: string;    // ISO date
}

interface TableSortConfig {
  sortBy: 'snapshotDate' | 'bloodGroup' | 'levelPercentage';
  sortOrder: 'ASC' | 'DESC';
}
```

---

### 4.5. ScraperStatus

**Opis komponentu:**
Komponent prezentujący status ostatniego scrapingu dla danego centrum. Pokazuje czy dane są aktualne, kiedy było ostatnie udane pobranie oraz ewentualne błędy parsowania.

**Główne elementy:**
- Badge statusu: "OK" (zielony), "DEGRADED" (żółty), "FAILED" (czerwony), "UNKNOWN" (szary)
- Tekst: "Ostatnie udane pobranie: [timestamp]"
- W przypadku błędów: komunikat błędu i sugestia akcji
- Link do zgłoszenia problemu (US-021) - "Zgłoś problem z danymi"

**Obsługiwane interakcje:**
- Kliknięcie "Zgłoś problem" → przekierowanie do formularza reportu lub otwarcie modala

**Obsługiwana walidacja:**
- Brak (prezentacja statusu z API)

**Typy:**
- Pola z `RckikDetailDto`: `lastSuccessfulScrape`, `scrapingStatus`

**Propsy:**
```typescript
interface ScraperStatusProps {
  lastSuccessfulScrape: string | null;  // ISO timestamp
  scrapingStatus: 'OK' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
  errorMessage?: string;
}
```

---

### 4.6. FavoriteButton

**Opis komponentu:**
Interaktywny przycisk React (client:load) umożliwiający dodanie/usunięcie centrum z listy ulubionych użytkownika. Wymaga uwierzytelnienia.

**Główne elementy:**
- Button z ikoną serca (outline gdy nie ulubione, filled gdy ulubione)
- Tekst: "Dodaj do ulubionych" / "Usuń z ulubionych"
- Loading state podczas zapisywania
- Toast notification po akcji (sukces/błąd)

**Obsługiwane interakcje:**
- Kliknięcie gdy niezalogowany → redirect do `/login` z returnUrl
- Kliknięcie gdy zalogowany i nie ulubione → POST `/api/v1/users/me/favorites` + optimistic update
- Kliknięcie gdy zalogowany i ulubione → DELETE `/api/v1/users/me/favorites/{rckikId}` + optimistic update
- Błąd API → rollback optymistycznej zmiany + toast error

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik zalogowany (JWT z localStorage lub cookie)
- Walidacja odpowiedzi API (400, 404, 409)

**Typy:**
- `FavoriteRckikDto` - response po dodaniu
- `AuthState` - stan uwierzytelnienia z Redux

**Propsy:**
```typescript
interface FavoriteButtonProps {
  rckikId: number;
  initialIsFavorite: boolean;
  isAuthenticated: boolean;
  onAuthRequired?: () => void;  // callback do przekierowania na login
}
```

---

### 4.7. BloodGroupSelector

**Opis komponentu:**
Dropdown lub taby do wyboru grupy krwi dla wykresu trendu.

**Główne elementy:**
- 8 przycisków/tabów dla grup krwi: 0+, 0-, A+, A-, B+, B-, AB+, AB-
- Aktywny przycisk z wyróżnieniem (border, background)
- Tooltips z aktualnymi poziomami dla każdej grupy

**Obsługiwane interakcje:**
- Kliknięcie grupy krwi → zmiana wybranej grupy + callback do rodzica

**Obsługiwana walidacja:**
- Brak

**Typy:**
```typescript
interface BloodGroupSelectorProps {
  selectedBloodGroup: string;
  availableGroups: string[];  // grupy z dostępnymi danymi
  currentLevels?: BloodLevelDto[];  // dla tooltipów
  onChange: (bloodGroup: string) => void;
}
```

---

### 4.8. Breadcrumbs

**Opis komponentu:**
Nawigacja okruszkowa (breadcrumb navigation) dla ułatwienia powrotu do poprzednich widoków.

**Główne elementy:**
- Home (link do `/`)
- Lista RCKiK (link do `/rckik`)
- Nazwa centrum (aktualny widok, bez linku)

**Obsługiwane interakcje:**
- Kliknięcie linku → nawigacja do odpowiedniego widoku

**Obsługiwana walidacja:**
- Brak

**Propsy:**
```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;  // undefined dla aktualnego widoku
}
```

---

## 5. Typy

### 5.1. DTO z backendu (już istniejące)

**RckikDetailDto** (response z `GET /api/v1/rckik/{id}`):
```typescript
interface RckikDetailDto {
  id: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  aliases: string[];
  active: boolean;
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
  currentBloodLevels: BloodLevelDto[];
  lastSuccessfulScrape: string;  // ISO timestamp
  scrapingStatus: 'OK' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
}
```

**BloodLevelDto**:
```typescript
interface BloodLevelDto {
  bloodGroup: string;         // "A+", "0-", etc.
  levelPercentage: number;    // 45.50
  levelStatus: 'CRITICAL' | 'IMPORTANT' | 'OK';
  lastUpdate: string;         // ISO timestamp
}
```

**BloodLevelHistoryResponse** (response z `GET /api/v1/rckik/{id}/blood-levels`):
```typescript
interface BloodLevelHistoryResponse {
  rckikId: number;
  rckikName: string;
  snapshots: BloodLevelHistoryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
```

**BloodLevelHistoryDto**:
```typescript
interface BloodLevelHistoryDto {
  id: number;
  snapshotDate: string;       // ISO date "2025-01-08"
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: 'CRITICAL' | 'IMPORTANT' | 'OK';
  scrapedAt: string;          // ISO timestamp
  isManual: boolean;
}
```

**FavoriteRckikDto** (response z `POST /api/v1/users/me/favorites`):
```typescript
interface FavoriteRckikDto {
  id: number;              // favorite entry ID
  rckikId: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  active: boolean;
  priority: number | null;
  addedAt: string;         // ISO timestamp
  currentBloodLevels: BloodLevelDto[];
}
```

### 5.2. ViewModels i typy pomocnicze (do stworzenia)

**RckikDetailsPageProps** (props dla Astro page):
```typescript
interface RckikDetailsPageProps {
  rckik: RckikDetailDto;
  isFavorite: boolean;
  isAuthenticated: boolean;
}
```

**ChartDataPoint** (przetworzony punkt dla wykresu):
```typescript
interface ChartDataPoint {
  date: string;              // "08.01" formatted
  fullDate: string;          // "2025-01-08" dla referencji
  percentage: number;        // 45.5
  status: 'CRITICAL' | 'IMPORTANT' | 'OK';
  timestamp: string;         // pełny timestamp dla tooltip
}
```

**HistoryTableState** (stan tabeli z Redux lub local state):
```typescript
interface HistoryTableState {
  data: BloodLevelHistoryDto[];
  filters: {
    bloodGroup?: string;
    fromDate?: string;
    toDate?: string;
  };
  sort: {
    sortBy: 'snapshotDate' | 'bloodGroup' | 'levelPercentage';
    sortOrder: 'ASC' | 'DESC';
  };
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}
```

**BloodGroupOption** (opcje selectora grup krwi):
```typescript
interface BloodGroupOption {
  value: string;             // "A+"
  label: string;             // "A+ (45.5%)"
  currentLevel?: number;     // 45.5
  status?: 'CRITICAL' | 'IMPORTANT' | 'OK';
}
```

## 6. Zarządzanie stanem

### 6.1. Stan globalny (Redux Toolkit)

**rckikSlice** (cache danych centrum):
```typescript
interface RckikState {
  currentRckik: RckikDetailDto | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;  // timestamp dla cache invalidation
}

// Actions:
// - fetchRckikDetails(id) - async thunk
// - clearCurrentRckik()
```

**favoritesSlice** (zarządzanie ulubionymi):
```typescript
interface FavoritesState {
  favoriteIds: number[];     // lista ID ulubionych centrów
  favorites: FavoriteRckikDto[];
  loading: boolean;
  error: string | null;
}

// Actions:
// - addFavorite(rckikId, priority?) - async thunk, optimistic update
// - removeFavorite(rckikId) - async thunk, optimistic update
// - fetchFavorites() - async thunk
```

**authSlice** (stan uwierzytelnienia):
```typescript
interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
}
```

### 6.2. Stan lokalny komponentów

**BloodLevelChart** (local state):
- `selectedBloodGroup: string` - aktualnie wybrana grupa krwi
- `chartData: ChartDataPoint[]` - przetworzone dane dla wykresu
- `loading: boolean`
- `error: string | null`

**HistoryTable** (local state lub Redux):
- `HistoryTableState` (patrz sekcja 5.2)
- Preferowany local state + React Query dla cache'owania lub Redux jeśli dane współdzielone

**FavoriteButton** (local state):
- `isFavorite: boolean` - stan optimistic update
- `loading: boolean` - stan podczas zapisu
- Synchronizacja z Redux `favoritesSlice` po pomyślnym zapisie

### 6.3. Custom Hooks

**useRckikDetails** (fetch i cache danych centrum):
```typescript
function useRckikDetails(rckikId: number) {
  // Używa Redux lub React Query
  // Zwraca: { rckik, loading, error, refetch }
}
```

**useBloodLevelHistory** (fetch historii dla wykresu/tabeli):
```typescript
function useBloodLevelHistory(
  rckikId: number,
  filters: { bloodGroup?, fromDate?, toDate? },
  pagination: { page, size }
) {
  // Fetch z `/api/v1/rckik/{id}/blood-levels`
  // Zwraca: { history, loading, error, refetch }
}
```

**useFavoriteToggle** (dodawanie/usuwanie z ulubionych):
```typescript
function useFavoriteToggle(rckikId: number, initialIsFavorite: boolean) {
  // Obsługuje optimistic update, rollback, toast notifications
  // Zwraca: { isFavorite, toggleFavorite, loading }
}
```

**useAuth** (sprawdzanie uwierzytelnienia):
```typescript
function useAuth() {
  // Zwraca: { user, isAuthenticated, login, logout }
}
```

## 7. Integracja API

### 7.1. Endpointy wykorzystywane przez widok

#### GET /api/v1/rckik/{id}
**Opis:** Pobranie szczegółowych danych centrum.

**Request:**
- Method: `GET`
- Path: `/api/v1/rckik/{id}`
- Auth: None (public)
- Query params: brak

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Regionalne Centrum Krwiodawstwa i Krwiolecznictwa w Warszawie",
  "code": "RCKIK-WAW",
  "city": "Warszawa",
  "address": "ul. Kasprzaka 17, 01-211 Warszawa",
  "latitude": 52.2319,
  "longitude": 20.9728,
  "aliases": ["RCKiK Warszawa", "RCKIK WAW"],
  "active": true,
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2025-01-05T10:00:00",
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
  ],
  "lastSuccessfulScrape": "2025-01-08T02:30:00",
  "scrapingStatus": "OK"
}
```

**Error (404 Not Found):**
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "RCKiK not found",
  "path": "/api/v1/rckik/999"
}
```

**Użycie w widoku:**
- Wywołanie podczas SSG/ISR w `getStaticPaths()` i `getStaticProps()`
- Cache w Redux `rckikSlice`
- Revalidation co 5 minut (ISR)

---

#### GET /api/v1/rckik/{id}/blood-levels
**Opis:** Pobranie historycznych snapshotów poziomów krwi dla wykresu i tabeli.

**Request:**
- Method: `GET`
- Path: `/api/v1/rckik/{id}/blood-levels`
- Auth: None (public)
- Query params:
  - `bloodGroup` (optional): filtr grupy krwi (np. "A+")
  - `fromDate` (optional): data początkowa (ISO 8601, np. "2025-01-01")
  - `toDate` (optional): data końcowa (ISO 8601, np. "2025-01-31")
  - `page` (optional, default: 0): numer strony
  - `size` (optional, default: 30, max: 100): rozmiar strony

**Response (200 OK):**
```json
{
  "rckikId": 1,
  "rckikName": "RCKiK Warszawa",
  "snapshots": [
    {
      "id": 1001,
      "snapshotDate": "2025-01-08",
      "bloodGroup": "A+",
      "levelPercentage": 45.50,
      "levelStatus": "IMPORTANT",
      "scrapedAt": "2025-01-08T02:30:00",
      "isManual": false
    },
    {
      "id": 1000,
      "snapshotDate": "2025-01-07",
      "bloodGroup": "A+",
      "levelPercentage": 52.00,
      "levelStatus": "OK",
      "scrapedAt": "2025-01-07T02:30:00",
      "isManual": false
    }
  ],
  "page": 0,
  "size": 30,
  "totalElements": 240,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

**Użycie w widoku:**
- Wykres: fetch z `bloodGroup` filter dla wybranej grupy + `fromDate` (ostatnie 30 dni)
- Tabela: fetch z paginacją i opcjonalnymi filtrami (bloodGroup, dateRange)
- Cache client-side (React Query lub local state)

---

#### POST /api/v1/users/me/favorites
**Opis:** Dodanie centrum do ulubionych (wymaga uwierzytelnienia).

**Request:**
- Method: `POST`
- Path: `/api/v1/users/me/favorites`
- Auth: Required (JWT Bearer token)
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "rckikId": 1,
  "priority": 1
}
```

**Response (201 Created):**
```json
{
  "id": 10,
  "rckikId": 1,
  "name": "RCKiK Warszawa",
  "code": "RCKIK-WAW",
  "city": "Warszawa",
  "priority": 1,
  "addedAt": "2025-01-08T15:00:00"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**Error (409 Conflict):**
```json
{
  "error": "ALREADY_FAVORITED",
  "message": "This RCKiK is already in your favorites"
}
```

**Użycie w widoku:**
- FavoriteButton: optimistic update (natychmiast zmiana UI)
- Po pomyślnym zapisie: aktualizacja Redux `favoritesSlice`
- W przypadku błędu: rollback + toast error

---

#### DELETE /api/v1/users/me/favorites/{rckikId}
**Opis:** Usunięcie centrum z ulubionych (wymaga uwierzytelnienia).

**Request:**
- Method: `DELETE`
- Path: `/api/v1/users/me/favorites/{rckikId}`
- Auth: Required (JWT Bearer token)
- Headers: `Authorization: Bearer <token>`

**Response (204 No Content)**

**Error (404 Not Found):**
```json
{
  "error": "NOT_FOUND",
  "message": "Favorite not found"
}
```

**Użycie w widoku:**
- FavoriteButton: optimistic update
- Po pomyślnym usunięciu: aktualizacja Redux
- W przypadku błędu: rollback + toast error

---

### 7.2. Axios Client Configuration

**Interceptory:**
- Request interceptor: dodaje JWT token z localStorage/cookie
- Response interceptor: obsługa błędów 401 (redirect do login), 429 (rate limit toast)

**Przykład użycia:**
```typescript
// src/lib/api/endpoints/rckik.ts
import apiClient from '@/lib/api/client';

export async function fetchRckikDetails(id: number): Promise<RckikDetailDto> {
  const response = await apiClient.get<RckikDetailDto>(`/rckik/${id}`);
  return response.data;
}

export async function fetchBloodLevelHistory(
  id: number,
  params: {
    bloodGroup?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }
): Promise<BloodLevelHistoryResponse> {
  const response = await apiClient.get<BloodLevelHistoryResponse>(
    `/rckik/${id}/blood-levels`,
    { params }
  );
  return response.data;
}

export async function addFavorite(rckikId: number, priority?: number): Promise<FavoriteRckikDto> {
  const response = await apiClient.post<FavoriteRckikDto>('/users/me/favorites', {
    rckikId,
    priority,
  });
  return response.data;
}

export async function removeFavorite(rckikId: number): Promise<void> {
  await apiClient.delete(`/users/me/favorites/${rckikId}`);
}
```

## 8. Interakcje użytkownika

### 8.1. Scenariusz podstawowy (niezalogowany użytkownik)

1. Użytkownik klika centrum na liście `/rckik` → nawigacja do `/rckik/{id}`
2. Strona ładuje się (SSG/ISR) z aktualnymi danymi centrum
3. Użytkownik widzi:
   - Nazwę centrum, adres, status
   - 8 badge'ów z aktualnymi stanami krwi (kolory, procenty)
   - Wykres trendu (domyślnie dla pierwszej grupy krwi)
   - Tabelę historii snapshotów
   - Status scrapera
4. Użytkownik zmienia grupę krwi w selektorze → wykres aktualizuje się
5. Użytkownik klika nagłówek kolumny w tabeli → sortowanie zmienia się
6. Użytkownik klika numer strony → ładowanie kolejnej strony tabeli
7. Użytkownik klika adres → otwarcie mapy w nowej karcie
8. Użytkownik klika "Dodaj do ulubionych" → przekierowanie do `/login` z `returnUrl=/rckik/{id}`

### 8.2. Scenariusz zalogowanego użytkownika

1. Użytkownik (zalogowany) wchodzi na `/rckik/{id}`
2. FavoriteButton pokazuje aktualny stan (serce filled jeśli w ulubionych)
3. Użytkownik klika "Dodaj do ulubionych":
   - Optimistic update: serce zmienia się na filled
   - Request POST `/api/v1/users/me/favorites`
   - Sukces: toast "Dodano do ulubionych", Redux update
   - Błąd: rollback UI, toast error, pokazanie przyczyny (np. "Już w ulubionych")
4. Użytkownik klika "Usuń z ulubionych":
   - Optimistic update: serce zmienia się na outline
   - Request DELETE `/api/v1/users/me/favorites/{id}`
   - Sukces: toast "Usunięto z ulubionych", Redux update
   - Błąd: rollback UI, toast error

### 8.3. Scenariusz interakcji z wykresem

1. Użytkownik wybiera grupę krwi "0-" z selectora
2. Komponent BloodLevelChart:
   - Wywołuje `useBloodLevelHistory(rckikId, { bloodGroup: "0-", fromDate: "30 dni temu" })`
   - Pokazuje skeleton loader podczas ładowania
   - Renderuje wykres z danymi dla "0-"
3. Użytkownik najeżdża na punkt wykresu → tooltip z:
   - Data: "8 stycznia 2025"
   - Poziom: "15.0%"
   - Status: "Krytyczny"
4. Użytkownik klika punkt wykresu (opcjonalnie) → highlight odpowiadającego wiersza w tabeli

### 8.4. Scenariusz filtrowania tabeli

1. Użytkownik otwiera panel filtrów w HistoryTable
2. Wybiera grupę krwi "A+" i zakres dat "01.01.2025 - 08.01.2025"
3. Tabela:
   - Wywołuje refetch z nowymi parametrami
   - Pokazuje skeleton rows podczas ładowania
   - Renderuje przefiltrowane wyniki
4. Brak wyników → EmptyState "Brak snapshotów dla wybranych filtrów" + przycisk "Wyczyść filtry"

### 8.5. Scenariusz zgłoszenia błędu

1. Użytkownik zauważa błędne dane (np. poziom 10% wydaje się nieprawdopodobny)
2. Klika przycisk "Zgłoś problem z danymi" w sekcji ScraperStatus
3. Przekierowanie do formularza `/reports/new?rckikId={id}&snapshotId={id}` (US-021)
4. Użytkownik wypełnia formularz i wysyła zgłoszenie

## 9. Warunki i walidacja

### 9.1. Warunki wyświetlania elementów

| Element | Warunek | Akcja jeśli niespełniony |
|---------|---------|--------------------------|
| FavoriteButton (aktywny) | `isAuthenticated === true` | Przycisk nieaktywny lub przekierowanie do login |
| Badge "Aktywne" | `rckik.active === true` | Pokazanie badge "Nieaktywne" (szary) |
| currentBloodLevels | `rckik.currentBloodLevels.length > 0` | EmptyState "Brak aktualnych danych" |
| BloodLevelChart | `historyData.length > 0` | EmptyState "Brak danych historycznych" |
| HistoryTable | `snapshots.length > 0` | EmptyState "Brak snapshotów" |
| ScraperStatus (sukces) | `scrapingStatus === 'OK'` | Badge i komunikat zależnie od statusu |
| Mapa (link) | `latitude !== null && longitude !== null` | Link ukryty lub nieaktywny |

### 9.2. Walidacja danych z API

**RckikDetailDto:**
- `id` - must be positive integer
- `name`, `code`, `city` - must be non-empty strings
- `latitude` - must be in range -90 to 90 (jeśli nie null)
- `longitude` - must be in range -180 to 180 (jeśli nie null)
- `currentBloodLevels` - array może być pusty, ale jeśli niepusty to każdy element musi być valid BloodLevelDto
- `scrapingStatus` - must be one of: "OK", "DEGRADED", "FAILED", "UNKNOWN"

**BloodLevelDto:**
- `bloodGroup` - must be one of: "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"
- `levelPercentage` - must be number 0-100
- `levelStatus` - must be one of: "CRITICAL", "IMPORTANT", "OK"
- `lastUpdate` - must be valid ISO timestamp

**BloodLevelHistoryDto:**
- `snapshotDate` - must be valid ISO date, not future
- `levelPercentage` - must be 0-100
- `scrapedAt` - must be valid ISO timestamp

**Obsługa błędów walidacji:**
- Błędy wyświetlane w console.error (development)
- Fallback do bezpiecznych wartości domyślnych (np. levelPercentage = 0 jeśli invalid)
- Toast error jeśli dane krytyczne (np. brak ID centrum)

### 9.3. Warunki akcji użytkownika

**Dodanie do ulubionych (POST /favorites):**
- Warunek: `isAuthenticated === true`
- Warunek: centrum nie jest już w ulubionych (sprawdzane po stronie API, 409 Conflict)
- Jeśli niezalogowany: przekierowanie do `/login?returnUrl=/rckik/{id}`
- Jeśli już w ulubionych: toast "To centrum jest już w ulubionych"

**Usunięcie z ulubionych (DELETE /favorites):**
- Warunek: `isAuthenticated === true`
- Warunek: centrum jest w ulubionych (optimistic update zakłada że jest)
- Jeśli nie w ulubionych (404): toast "To centrum nie jest w ulubionych" + rollback UI

**Filtrowanie tabeli:**
- `fromDate` nie może być późniejsze niż `toDate` (walidacja client-side)
- Jeśli błędny zakres dat: komunikat walidacyjny pod inputem
- `bloodGroup` - opcjonalny, jeśli wybrany to musi być valid (kontrolowane przez select)

**Sortowanie tabeli:**
- Kliknięcie tego samego nagłówka → toggle ASC/DESC
- Kliknięcie innego nagłówka → sort według nowego pola ASC

**Paginacja:**
- Przycisk "Previous" disabled jeśli `page === 0`
- Przycisk "Next" disabled jeśli `page === totalPages - 1`
- Kliknięcie numeru strony > totalPages → fetch ostatniej strony

## 10. Obsługa błędów

### 10.1. Błędy sieciowe (Network Errors)

**Scenariusz:** Brak połączenia z internetem lub timeout.

**Obsługa:**
- Pokazanie ErrorState z komunikatem "Nie można połączyć się z serwerem"
- Przycisk "Spróbuj ponownie" → retry request
- W przypadku FavoriteButton: rollback optimistic update + toast error
- W przypadku tabeli/wykresu: zachowanie ostatnich pobranych danych (stale data) + banner "Błąd ładowania"

---

### 10.2. Błędy 404 (Not Found)

**Scenariusz:** `/rckik/999` - centrum o tym ID nie istnieje.

**Obsługa:**
- Redirect do dedykowanej strony 404: `/404` lub `/rckik/not-found`
- Komunikat: "Nie znaleziono centrum krwiodawstwa o podanym ID"
- Link powrotny: "Wróć do listy centrów" → `/rckik`
- SEO: meta tag `noindex, nofollow`

---

### 10.3. Błędy 401 (Unauthorized) - dla FavoriteButton

**Scenariusz:** Brak lub nieprawidłowy JWT token przy próbie dodania do ulubionych.

**Obsługa:**
- Rollback optimistic update
- Toast error: "Sesja wygasła. Zaloguj się ponownie."
- Redirect do `/login?returnUrl=/rckik/{id}`
- Axios interceptor może automatycznie obsłużyć refresh token (jeśli implementowane)

---

### 10.4. Błędy 409 (Conflict) - centrum już w ulubionych

**Scenariusz:** POST `/favorites` dla centrum już dodanego.

**Obsługa:**
- Rollback optimistic update (jeśli był)
- Toast info: "To centrum jest już w Twoich ulubionych"
- Zmiana UI: pokazanie przycisku "Usuń z ulubionych"
- Synchronizacja z Redux: dodanie do `favoriteIds` jeśli brakowało

---

### 10.5. Błędy 429 (Rate Limit Exceeded)

**Scenariusz:** Zbyt wiele requestów w krótkim czasie.

**Obsługa:**
- Toast warning: "Zbyt wiele żądań. Spróbuj ponownie za {retryAfter} sekund."
- Countdown timer w UI
- Wyłączenie przycisków akcji na czas blokady
- Odczyt `Retry-After` header z response

---

### 10.6. Błędy 500 (Internal Server Error)

**Scenariusz:** Błąd po stronie serwera (np. baza danych niedostępna).

**Obsługa:**
- ErrorState: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przycisk "Odśwież stronę"
- Logowanie błędu do Sentry/error tracking (jeśli zaimplementowane)
- Fallback do cache'owanych danych (jeśli dostępne)

---

### 10.7. Brak danych (Empty States)

**Scenariusz 1:** Centrum nie ma żadnych aktualnych stanów krwi (`currentBloodLevels = []`).

**Obsługa:**
- EmptyState w sekcji CurrentBloodLevelsSection:
  - Ikona informacyjna
  - Komunikat: "Brak aktualnych danych o stanach krwi"
  - Informacja: "Dane mogą być tymczasowo niedostępne. Sprawdź ponownie później."
  - Pokazanie ostatniego `lastSuccessfulScrape` jeśli dostępny

**Scenariusz 2:** Brak danych historycznych dla wybranej grupy krwi w wykresie.

**Obsługa:**
- EmptyState w BloodLevelChart:
  - Komunikat: "Brak danych historycznych dla grupy krwi {bloodGroup}"
  - Sugestia: "Wybierz inną grupę krwi lub sprawdź ponownie później"

**Scenariusz 3:** Brak snapshotów w tabeli (po filtrowaniu).

**Obsługa:**
- EmptyState w HistoryTable:
  - Komunikat: "Brak snapshotów dla wybranych filtrów"
  - Przycisk: "Wyczyść filtry" → reset filtrów do domyślnych

---

### 10.8. Błędy parsowania dat

**Scenariusz:** API zwraca nieprawidłowy format daty lub timestamp.

**Obsługa:**
- Walidacja po stronie klienta (try-catch przy `new Date()`)
- Fallback do placeholder: "—" lub "Data niedostępna"
- Console.error w development
- Raportowanie do error tracking w production

---

### 10.9. Błędy wykresu (Recharts)

**Scenariusz:** Recharts nie może zrenderować wykresu (np. błędne dane, brak biblioteki).

**Obsługa:**
- ErrorBoundary wokół BloodLevelChart
- Fallback: komunikat "Nie można wyświetlić wykresu" + tabela z surowymi danymi jako alternatywa
- Logowanie błędu do konsoli/error tracking

---

### 10.10. Timeout requestów

**Scenariusz:** Request przekracza timeout (np. 10s).

**Obsługa:**
- Axios timeout configuration: 10000ms
- Po timeout: retry automatyczny (1 próba) lub pokazanie ErrorState
- Toast: "Serwer nie odpowiada. Spróbuj ponownie."
- Przycisk retry w UI

---

## 11. Kroki implementacji

### Krok 1: Setup struktury plików
**Zadania:**
1. Utworzenie pliku Astro page: `src/pages/rckik/[id].astro`
2. Utworzenie folderów komponentów:
   - `src/components/rckik/` (komponenty domenowe)
   - `src/components/ui/` (komponenty UI primitives, jeśli nie istnieją)
3. Utworzenie plików typów:
   - `src/lib/types/rckik.ts` (ViewModels)
4. Utworzenie API client endpoints:
   - `src/lib/api/endpoints/rckik.ts`
   - `src/lib/api/endpoints/favorites.ts`

**Acceptance Criteria:**
- Struktura katalogów zgodna z `ui-plan.md` sekcja 11.1
- Wszystkie pliki stworzone z podstawowym boilerplate

---

### Krok 2: Implementacja typów TypeScript
**Zadania:**
1. Dodanie/aktualizacja typów DTO w `src/lib/types/api.ts`:
   - `RckikDetailDto`
   - `BloodLevelDto`
   - `BloodLevelHistoryResponse`
   - `BloodLevelHistoryDto`
   - `FavoriteRckikDto`
2. Dodanie ViewModels w `src/lib/types/rckik.ts`:
   - `RckikDetailsPageProps`
   - `ChartDataPoint`
   - `HistoryTableState`
   - `BloodGroupOption`
3. Dodanie interface'ów dla props komponentów

**Acceptance Criteria:**
- TypeScript kompiluje się bez błędów
- Wszystkie typy zgodne z DTO backendu (Java)
- ViewModels odpowiadają potrzebom komponentów

---

### Krok 3: Implementacja API client functions
**Zadania:**
1. `src/lib/api/endpoints/rckik.ts`:
   - `fetchRckikDetails(id): Promise<RckikDetailDto>`
   - `fetchBloodLevelHistory(id, params): Promise<BloodLevelHistoryResponse>`
2. `src/lib/api/endpoints/favorites.ts`:
   - `addFavorite(rckikId, priority?): Promise<FavoriteRckikDto>`
   - `removeFavorite(rckikId): Promise<void>`
   - `checkIsFavorite(rckikId): Promise<boolean>` (lub fetch z listy)
3. Konfiguracja Axios client w `src/lib/api/client.ts`:
   - Request interceptor (JWT token)
   - Response interceptor (error handling)

**Acceptance Criteria:**
- Funkcje API poprawnie typowane
- Interceptory działają (manual testing z Postman)
- Error handling dla 401, 404, 429, 500

---

### Krok 4: Implementacja Redux slices
**Zadania:**
1. `src/lib/store/slices/rckikSlice.ts`:
   - `RckikState` interface
   - Actions: `fetchRckikDetails`, `clearCurrentRckik`
   - Selectors: `selectCurrentRckik`, `selectRckikLoading`
2. `src/lib/store/slices/favoritesSlice.ts`:
   - `FavoritesState` interface
   - Actions: `addFavorite`, `removeFavorite`, `fetchFavorites`
   - Optimistic update logic
   - Selectors: `selectFavoriteIds`, `selectIsFavorite(rckikId)`
3. Integracja z głównym store w `src/lib/store/index.ts`

**Acceptance Criteria:**
- Slices poprawnie typowane
- Async thunks działają (manual testing)
- Optimistic updates działają z rollback

---

### Krok 5: Implementacja custom hooks
**Zadania:**
1. `src/lib/hooks/useRckikDetails.ts`:
   - Fetch danych centrum
   - Cache w Redux
   - Return: `{ rckik, loading, error, refetch }`
2. `src/lib/hooks/useBloodLevelHistory.ts`:
   - Fetch historii z parametrami (filters, pagination)
   - Local state lub React Query
   - Return: `{ history, loading, error, refetch }`
3. `src/lib/hooks/useFavoriteToggle.ts`:
   - Optimistic update logic
   - Toast notifications (integracja z `useToast`)
   - Return: `{ isFavorite, toggleFavorite, loading }`
4. `src/lib/hooks/useAuth.ts` (jeśli nie istnieje):
   - Check JWT token
   - Return: `{ user, isAuthenticated, login, logout }`

**Acceptance Criteria:**
- Hooki poprawnie typowane
- useRckikDetails cache'uje dane
- useFavoriteToggle wykonuje optimistic update
- useAuth zwraca aktualny stan uwierzytelnienia

---

### Krok 6: Implementacja UI primitives (jeśli nie istnieją)
**Zadania:**
1. `src/components/ui/Badge.tsx` - komponent badge z wariantami (critical, important, ok)
2. `src/components/ui/Button.tsx` - przycisk z loading state
3. `src/components/ui/EmptyState.tsx` - placeholder dla braku danych
4. `src/components/ui/ErrorState.tsx` - komunikat błędu z retry
5. `src/components/ui/Skeleton.tsx` - loader skeleton
6. `src/components/ui/Toast.tsx` - notifications (lub integracja z biblioteką)
7. `src/components/ui/Tooltip.tsx` - tooltip

**Acceptance Criteria:**
- Komponenty responsive (mobile, tablet, desktop)
- Accessibility (ARIA labels, keyboard navigation)
- Tailwind CSS styling
- Storybook stories (opcjonalnie)

---

### Krok 7: Implementacja komponentu RckikHeader
**Zadania:**
1. Utworzenie `src/components/rckik/RckikHeader.tsx`
2. Struktura HTML:
   - `<header>` z semantycznymi tagami
   - `<h1>` z nazwą i kodem centrum
   - `<address>` z adresem
   - Link do mapy (Google Maps URL z lat/lng)
   - FavoriteButton (placeholder na razie)
   - Badge statusu (active/inactive)
3. Styling z Tailwind CSS
4. Props: `RckikHeaderProps`

**Acceptance Criteria:**
- Komponent renderuje poprawnie dla przykładowych danych
- Responsive design (mobile-first)
- Accessibility (semantic HTML, ARIA gdzie konieczne)

---

### Krok 8: Implementacja komponentu BloodLevelBadge
**Zadania:**
1. Utworzenie `src/components/rckik/BloodLevelBadge.tsx`
2. Implementacja kolorów zależnych od statusu:
   - CRITICAL: `bg-red-500`, `text-white`
   - IMPORTANT: `bg-orange-500`, `text-white`
   - OK: `bg-green-500`, `text-white`
3. Ikona + tekst + procent
4. Tooltip z timestampem (Tooltip UI component)
5. Opcjonalny onClick handler

**Acceptance Criteria:**
- Kolory poprawnie mapowane do statusu
- Ikony widoczne (nie tylko kolory dla accessibility)
- Tooltip działa na hover
- Responsive (siatka 4 kolumny desktop, 2 kolumny mobile)

---

### Krok 9: Implementacja komponentu BloodGroupSelector
**Zadania:**
1. Utworzenie `src/components/rckik/BloodGroupSelector.tsx`
2. 8 przycisków dla grup krwi (0+, 0-, A+, A-, B+, B-, AB+, AB-)
3. Aktywny przycisk z wyróżnieniem (border, bg)
4. Tooltips z aktualnymi poziomami (opcjonalnie)
5. onChange callback do rodzica

**Acceptance Criteria:**
- Wszystkie 8 grup krwi widoczne
- Aktywny przycisk wyróżniony
- Accessibility (keyboard navigation z Tab, Enter)
- Responsive (scroll horizontal na mobile jeśli konieczne)

---

### Krok 10: Implementacja komponentu BloodLevelChart
**Zadania:**
1. Utworzenie `src/components/rckik/BloodLevelChart.tsx` (React component)
2. Integracja Recharts:
   - Instalacja: `npm install recharts`
   - Import: `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ReferenceLine`
3. Fetch danych historycznych z `useBloodLevelHistory`
4. Transformacja danych do `ChartDataPoint[]`
5. Renderowanie wykresu:
   - XAxis: daty (format "DD.MM")
   - YAxis: procenty (0-100%)
   - Line z kolorem zależnym od średniego statusu
   - ReferenceLine na 20% i 50% (progi)
   - Tooltip z szczegółami
6. Loading state (Skeleton)
7. Error state
8. EmptyState jeśli brak danych

**Acceptance Criteria:**
- Wykres renderuje poprawnie dla przykładowych danych
- Zmiana grupy krwi w selektorze → refetch + re-render
- Tooltip działa na hover
- Responsive (pełna szerokość, wysokość min 300px)
- Accessibility (aria-label na wykres)
- Lazy load (client:visible w Astro)

---

### Krok 11: Implementacja komponentu HistoryTable
**Zadania:**
1. Utworzenie `src/components/rckik/HistoryTable.tsx` (React component)
2. Fetch danych z `useBloodLevelHistory` (z paginacją)
3. Local state:
   - `filters: { bloodGroup?, fromDate?, toDate? }`
   - `sort: { sortBy, sortOrder }`
   - `pagination: { page, size }`
4. Struktura tabeli:
   - Kolumny: Data, Grupa krwi, Poziom %, Status, Czas pobrania, Źródło
   - Nagłówki z ikonami sortowania (strzałki)
   - Wiersze z danymi
5. FiltersBar:
   - Select dla grupy krwi (wszystkie + 8 opcji)
   - Date inputs dla fromDate/toDate
   - Przycisk "Zastosuj filtry", "Wyczyść filtry"
6. Pagination:
   - Previous, numery stron (max 5 widocznych), Next
   - Disabled states
7. Loading state (Skeleton rows)
8. EmptyState (brak wyników)

**Acceptance Criteria:**
- Tabela renderuje dane poprawnie
- Sortowanie działa (kliknięcie nagłówka → zmiana sort order)
- Filtry działają (zmiana filtrów → refetch)
- Paginacja działa (zmiana strony → refetch)
- Accessibility (semantic table, keyboard navigation)
- Responsive (horizontal scroll na mobile)

---

### Krok 12: Implementacja komponentu ScraperStatus
**Zadania:**
1. Utworzenie `src/components/rckik/ScraperStatus.tsx`
2. Badge statusu:
   - OK: zielony, "Dane aktualne"
   - DEGRADED: żółty, "Dane częściowo dostępne"
   - FAILED: czerwony, "Błąd pobierania danych"
   - UNKNOWN: szary, "Status nieznany"
3. Timestamp ostatniego udanego scrapingu (format: "8 stycznia 2025, 02:30")
4. Komunikat błędu (jeśli dostępny)
5. Link "Zgłoś problem z danymi" → `/reports/new?rckikId={id}`

**Acceptance Criteria:**
- Badge i komunikat odpowiadają statusowi
- Timestamp formatowany poprawnie (polska lokalizacja)
- Link do zgłoszenia działa
- Accessibility (ARIA labels)

---

### Krok 13: Implementacja komponentu FavoriteButton
**Zadania:**
1. Utworzenie `src/components/rckik/FavoriteButton.tsx` (React component, client:load)
2. Użycie `useFavoriteToggle(rckikId, initialIsFavorite)`
3. Ikona serca:
   - Outline jeśli nie w ulubionych
   - Filled jeśli w ulubionych
4. Loading state (spinner w przycisku)
5. onClick handler:
   - Jeśli niezalogowany → callback `onAuthRequired()` (redirect do login)
   - Jeśli zalogowany → `toggleFavorite()`
6. Optimistic update + toast notifications (sukces/błąd)

**Acceptance Criteria:**
- Przycisk renderuje poprawnie
- Optimistic update działa (natychmiastowa zmiana ikony)
- Rollback w przypadku błędu
- Toast notifications działają
- Redirect do login dla niezalogowanych
- Accessibility (aria-label, keyboard focus)

---

### Krok 14: Implementacja Breadcrumbs
**Zadania:**
1. Utworzenie `src/components/common/Breadcrumbs.astro` (jeśli nie istnieje)
2. Struktura:
   - Home (link do `/`)
   - Lista RCKiK (link do `/rckik`)
   - Nazwa centrum (bez linku, aria-current="page")
3. Separator: "/" lub ikona chevron
4. Styling z Tailwind

**Acceptance Criteria:**
- Breadcrumbs renderują poprawnie
- Linki działają
- Accessibility (semantic nav, aria-current)
- Responsive

---

### Krok 15: Implementacja Astro page `/rckik/[id].astro`
**Zadania:**
1. Konfiguracja `getStaticPaths()`:
   - Fetch listy wszystkich RCKiK z API
   - Return array `{ params: { id }, props: { rckik } }`
2. Konfiguracja SSG + ISR:
   - `export const prerender = true`
   - Revalidation: 5 minut (w astro.config.mjs)
3. Fetch danych w komponencie:
   - `rckik` z props (SSG)
   - Check `isFavorite` (jeśli zalogowany) - SSR lub client-side
4. Layout:
   - Użycie `BaseLayout.astro` (public) lub `DashboardLayout.astro` (jeśli zalogowany)
   - Breadcrumbs
   - Sekcje: Header, CurrentBloodLevels, Chart, HistoryTable, ScraperStatus
5. Hydratacja React islands:
   - BloodLevelChart: `client:visible`
   - FavoriteButton: `client:load`
   - HistoryTable: `client:idle`
6. Meta tags (SEO):
   - `<title>`: "[Nazwa centrum] - Stany krwi | mkrew"
   - `<meta name="description">`: opis centrum + aktualne stany
   - Open Graph tags

**Acceptance Criteria:**
- Strona renderuje poprawnie w trybie SSG
- ISR revalidation działa (5 min)
- React islands hydratują się poprawnie (DevTools: sprawdzenie)
- SEO: meta tags poprawne (sprawdzenie w źródle HTML)
- 404 dla nieistniejących ID

---

### Krok 16: Styling i responsywność
**Zadania:**
1. Layout responsywny:
   - Mobile: 1 kolumna, pełna szerokość
   - Tablet: 1-2 kolumny (grid)
   - Desktop: maksymalna szerokość 1200px, wyśrodkowanie
2. BloodLevelBadges grid:
   - Mobile: 2 kolumny
   - Tablet/Desktop: 4 kolumny
3. Chart i Table:
   - Pełna szerokość
   - Horizontal scroll na mobile (tabela)
4. Spacing:
   - Sekcje oddzielone (margin-bottom)
   - Padding w kontenerach
5. Kolory:
   - Zgodne z design system (Tailwind config)
   - Accessibility: kontrast min 4.5:1

**Acceptance Criteria:**
- Responsive design działa (test 375px, 768px, 1024px+)
- Layout nie pęka na małych ekranach
- Tekst czytelny
- Kontrast kolorów zgodny z WCAG 2.1 AA

---

### Krok 17: Accessibility (WCAG 2.1 AA)
**Zadania:**
1. Semantic HTML:
   - `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<aside>`, `<footer>`
   - `<h1>` - `<h6>` hierarchy
2. ARIA attributes:
   - `aria-label` dla przycisków bez tekstu (FavoriteButton)
   - `aria-current="page"` dla breadcrumbs
   - `aria-live="polite"` dla toast notifications
   - `aria-describedby` dla tooltipów
3. Keyboard navigation:
   - Wszystkie interaktywne elementy dostępne z klawiatury (Tab, Enter, Space)
   - Focus visible (outline)
   - Skip to main content link
4. Alt text:
   - Wszystkie obrazy mają alt (jeśli używane)
   - Ikony dekoracyjne: `aria-hidden="true"`
5. Screen reader testing:
   - Test z NVDA/JAWS (Windows) lub VoiceOver (Mac)

**Acceptance Criteria:**
- Lighthouse Accessibility score > 95
- axe DevTools: 0 critical issues
- Keyboard navigation działa bez myszy
- Screen reader odczytuje wszystkie elementy poprawnie

---

### Krok 18: Error handling i edge cases
**Zadania:**
1. 404 handling:
   - Redirect do strony 404 dla nieistniejących ID
   - Komunikat: "Nie znaleziono centrum"
   - Link powrotny do listy
2. EmptyStates:
   - Brak currentBloodLevels → EmptyState
   - Brak historyData → EmptyState w wykresie
   - Brak snapshots w tabeli → EmptyState
3. ErrorStates:
   - Network error → ErrorState z retry
   - 500 error → ErrorState z komunikatem
   - Timeout → ErrorState z retry
4. Loading states:
   - Skeleton dla wszystkich async komponentów
   - Loading spinner w przyciskach
5. Optimistic update rollback:
   - FavoriteButton rollback przy błędzie
   - Toast error z komunikatem

**Acceptance Criteria:**
- Wszystkie edge cases obsłużone (manual testing)
- EmptyStates i ErrorStates wyświetlają się poprawnie
- Retry buttons działają
- Rollback działa w FavoriteButton

---

### Krok 19: Testing
**Zadania:**
1. Unit tests (Vitest):
   - Utility functions (formatowanie dat, mapowanie statusów)
   - Custom hooks (useRckikDetails, useFavoriteToggle)
   - Redux slices (actions, reducers, selectors)
2. Component tests (React Testing Library):
   - BloodLevelBadge rendering
   - FavoriteButton interactions + optimistic update
   - BloodGroupSelector onChange
3. Integration tests:
   - FavoriteButton + API mock (MSW) → sukces i błąd
   - HistoryTable + filtrowanie + paginacja
4. E2E tests (Playwright):
   - User flow: wejście na /rckik/1 → zmiana grupy krwi w wykresie → filtrowanie tabeli → paginacja
   - User flow: dodanie do ulubionych (zalogowany) → sprawdzenie w /favorites
   - User flow: próba dodania do ulubionych (niezalogowany) → redirect do login

**Acceptance Criteria:**
- Coverage > 80% dla krytycznych funkcji
- Wszystkie component tests pass
- Integration tests pass (MSW mocks działają)
- E2E tests pass dla głównych scenariuszy

---

### Krok 20: Performance optimization
**Zadania:**
1. Code splitting:
   - Lazy load BloodLevelChart (client:visible)
   - Lazy load HistoryTable (client:idle)
2. Image optimization:
   - Ikony jako SVG inline lub z biblioteki (np. Heroicons)
   - Brak rasterowych obrazów (jeśli nie konieczne)
3. Bundle size:
   - Analiza z `astro build` + bundle analyzer
   - Tree-shaking niewykorzystanego kodu
4. Caching:
   - ISR revalidation: 5 min
   - Service Worker (opcjonalnie - PWA)
5. Prefetching:
   - `<link rel="prefetch">` dla prawdopodobnych nawigacji

**Acceptance Criteria:**
- Lighthouse Performance score > 90
- Bundle size < 500KB (initial load)
- Time to Interactive < 3s (3G connection)
- ISR cache działa (sprawdzenie headers w DevTools)

---

### Krok 21: Documentation
**Zadania:**
1. Code comments:
   - JSDoc dla wszystkich public functions
   - Komentarze dla złożonej logiki (optimistic update, transformacje danych)
2. README:
   - Opis widoku
   - User Stories realizowane
   - Kluczowe komponenty
   - API endpoints używane
3. Storybook (opcjonalnie):
   - Stories dla UI components
   - Examples z różnymi stanami (loading, error, empty)

**Acceptance Criteria:**
- Kod dobrze udokumentowany
- README aktualny
- Storybook stories dla kluczowych komponentów (jeśli używane)

---

### Krok 22: Code review i refactoring
**Zadania:**
1. Self code review:
   - Sprawdzenie DRY (Don't Repeat Yourself)
   - Sprawdzenie naming conventions
   - Sprawdzenie TypeScript strict mode
2. Peer code review:
   - PR w GitHub z opisem zmian
   - Review przez innego developera
3. Refactoring:
   - Wydzielenie wspólnych utility functions
   - Optymalizacja re-renderów (React.memo jeśli konieczne)
   - Cleanup console.logs

**Acceptance Criteria:**
- Code review pass (approvals w PR)
- TypeScript strict mode: 0 errors
- ESLint: 0 errors, 0 warnings
- Prettier: kod sformatowany

---

### Krok 23: Deployment i monitoring
**Zadania:**
1. Build production:
   - `npm run build`
   - Sprawdzenie build errors
   - Sprawdzenie bundle size
2. Deploy do staging (GCP):
   - Cloud Build trigger
   - Deploy na GKE/Cloud Run
   - Smoke test (sprawdzenie czy strona się ładuje)
3. Monitoring:
   - Cloud Logging: logi aplikacji
   - Cloud Monitoring: metryki (response time, error rate)
   - Error Reporting: tracking błędów JS
4. Lighthouse CI:
   - Automatyczne testy Lighthouse w CI/CD
   - Assert: Performance > 90, Accessibility > 95

**Acceptance Criteria:**
- Build production sukces
- Deployment na staging sukces
- Smoke tests pass
- Lighthouse CI pass
- Monitoring i logi działają

---

### Krok 24: Final QA i sign-off
**Zadania:**
1. Manual testing:
   - Test wszystkich user flows (niezalogowany, zalogowany)
   - Test na różnych urządzeniach (mobile, tablet, desktop)
   - Test w różnych przeglądarkach (Chrome, Firefox, Safari)
2. Accessibility testing:
   - Screen reader test (NVDA/VoiceOver)
   - Keyboard navigation test
   - axe DevTools scan
3. Performance testing:
   - Lighthouse (Performance, Accessibility, Best Practices, SEO)
   - WebPageTest (3G connection)
4. Security testing:
   - XSS prevention (sanitacja inputów)
   - CSRF tokens (jeśli używane)
   - Rate limiting (sprawdzenie 429 responses)
5. Sign-off:
   - Product owner approval
   - Stakeholder demo

**Acceptance Criteria:**
- Wszystkie user stories (US-008) zrealizowane
- Wszystkie acceptance criteria spełnione
- Manual testing pass na 3+ urządzeniach i 3+ przeglądarkach
- Lighthouse: Performance > 90, Accessibility > 95
- Product owner approval
- Gotowe do deploy na production

---

## Podsumowanie kroków

**Total kroków: 24**

**Szacowany czas (1 developer, full-time):**
- Kroki 1-5 (Setup + typy + API + Redux): 2 dni
- Kroki 6-8 (UI primitives + RckikHeader + Badge): 1 dzień
- Kroki 9-10 (Selector + Chart): 1 dzień
- Kroki 11-12 (Table + ScraperStatus): 1 dzień
- Kroki 13-14 (FavoriteButton + Breadcrumbs): 0.5 dnia
- Krok 15 (Astro page + SSG/ISR): 1 dzień
- Kroki 16-17 (Styling + Accessibility): 1 dzień
- Krok 18 (Error handling): 0.5 dnia
- Krok 19 (Testing): 1.5 dnia
- Kroki 20-24 (Performance + Docs + Deployment + QA): 1.5 dnia

**Total: ~11 dni roboczych (2.2 tygodnia)**

---

**Dependency graph:**
1. Setup (Krok 1) → wszystkie inne
2. Typy (Krok 2) → API client (Krok 3) → Redux (Krok 4) → Hooks (Krok 5)
3. UI primitives (Krok 6) → wszystkie komponenty domenowe (Kroki 7-13)
4. Wszystkie komponenty (Kroki 7-14) → Astro page (Krok 15)
5. Astro page (Krok 15) → Styling (Krok 16) → A11y (Krok 17) → Error handling (Krok 18)
6. Wszystkie poprzednie → Testing (Krok 19) → Performance (Krok 20)
7. Wszystkie poprzednie → Docs (Krok 21) → Code review (Krok 22) → Deployment (Krok 23) → QA (Krok 24)

---

**Priorytety (jeśli ograniczony czas):**
- **Must have (MVP):** Kroki 1-15, 18 (funkcjonalność podstawowa)
- **Should have:** Kroki 16-17, 19-20 (UX, accessibility, performance)
- **Nice to have:** Kroki 21-22 (dokumentacja, refactoring)
- **Critical before production:** Kroki 23-24 (deployment, QA)
