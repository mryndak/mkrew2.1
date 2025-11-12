# Plan implementacji widoku Lista RCKiK

## 1. Przegląd

Lista RCKiK to publiczny widok prezentujący wszystkie centra krwiodawstwa w Polsce wraz z aktualnymi stanami krwi. Głównym celem widoku jest umożliwienie użytkownikom (zarówno zalogowanym, jak i niezalogowanym) szybkiego znalezienia centrum krwiodawstwa i oceny jego stanu zapasów krwi. Widok obsługuje filtrowanie po mieście, wyszukiwanie, sortowanie oraz paginację. Jest to strona statyczna generowana podczas build time (SSG) z Incremental Static Regeneration (ISR) co 5 minut, co zapewnia świeże dane przy zachowaniu wysokiej wydajności.

## 2. Routing widoku

- **Ścieżka**: `/rckik`
- **Plik**: `src/pages/rckik/index.astro`
- **Typ renderowania**: Static Site Generation (SSG) z Incremental Static Regeneration (ISR, revalidate: 5 minut)
- **Dostępność**: Publiczna (nie wymaga uwierzytelnienia)
- **Query Parameters** (shareable URLs):
  - `page` (number, default: 0) - numer strony (zero-based)
  - `size` (number, default: 20) - rozmiar strony
  - `city` (string, optional) - filtr po mieście
  - `search` (string, optional) - wyszukiwanie po nazwie
  - `sortBy` (string, default: 'name') - pole sortowania
  - `sortOrder` (string, default: 'ASC') - kierunek sortowania

Przykład URL: `/rckik?city=Warszawa&page=1&sortBy=name&sortOrder=ASC`

## 3. Struktura komponentów

```
RckikListPage (src/pages/rckik/index.astro)
├── BaseLayout
│   ├── SEO (meta tags)
│   ├── Navbar
│   └── Footer
├── PageHeader
│   ├── H1: "Centra krwiodawstwa w Polsce"
│   └── Description
├── SearchAndFilters (React island, client:load)
│   ├── SearchBar
│   │   └── Input (debounced)
│   └── FiltersPanel
│       ├── CityFilter (Select/Dropdown)
│       ├── SortByFilter (Select)
│       └── ResetFiltersButton
├── ResultsInfo
│   └── TotalCount ("Znaleziono X centrów")
├── RckikList (conditional)
│   ├── If loading:
│   │   └── SkeletonList
│   │       └── RckikCardSkeleton × 10
│   ├── If error:
│   │   └── ErrorState
│   │       ├── ErrorMessage
│   │       └── RetryButton
│   ├── If empty (totalElements === 0):
│   │   └── EmptyState
│   │       ├── Icon
│   │       ├── Message: "Nie znaleziono centrów"
│   │       └── ResetFiltersButton
│   └── If results > 0:
│       ├── RckikCard × N
│       │   ├── RckikCardHeader
│       │   │   ├── Name (H2, link to /rckik/{id})
│       │   │   ├── Code + City
│       │   │   └── DataStatusBadge (if dataStatus !== 'OK')
│       │   ├── AddressSnippet
│       │   ├── BloodLevelsGrid
│       │   │   └── BloodLevelBadge × 8 (dla każdej grupy)
│       │   │       ├── Icon (accessibility)
│       │   │       ├── BloodGroup label (np. "A+")
│       │   │       ├── Percentage (np. "45.5%")
│       │   │       └── StatusIndicator (color + text)
│       │   └── LastUpdateTimestamp
│       └── Pagination
│           ├── PageNumbers
│           ├── PreviousButton
│           ├── NextButton
│           └── PageSizeSelector (10, 20, 50)
└── (Opcjonalnie) MapToggle
```

## 4. Szczegóły komponentów

### RckikListPage (src/pages/rckik/index.astro)

- **Opis komponentu**: Główna strona Astro renderowana jako SSG z ISR. Odpowiedzialna za strukturę całego widoku, SEO, i zarządzanie routing/query params. Serwer-side renderuje początkowy stan danych (pierwsza strona) i przekazuje do komponentów React jako props.

- **Główne elementy**:
  - `<BaseLayout>` - layout strony z nawigacją i footerem
  - `<SEO>` component z meta tags (title, description, OG tags)
  - `<PageHeader>` - nagłówek strony z H1
  - `<SearchAndFilters>` - React island (client:load) dla interaktywności
  - `<ResultsInfo>` - info o liczbie wyników
  - `<RckikList>` - główna lista (conditional rendering)
  - `<Pagination>` - paginacja

- **Obsługiwane interakcje**:
  - Server-side: parsowanie query params z URL
  - Client-side: nawigacja między stronami (update URL params)

- **Obsługiwana walidacja**:
  - Sanityzacja query params (page >= 0, size <= 100, city max 100 chars)
  - Fallback do default values dla invalid params

- **Typy**:
  - `RckikListApiResponse` (response z API)
  - `RckikSearchParams` (parsed query params)

- **Propsy**:
  ```typescript
  interface RckikListPageProps {
    initialData: RckikListApiResponse;
    initialParams: RckikSearchParams;
  }
  ```

### SearchBar (src/components/rckik/SearchBar.tsx)

- **Opis komponentu**: React component do wyszukiwania centrów po nazwie. Zawiera input z ikoną lupy, debounce mechanism (500ms), i clear button. Po wpisaniu tekstu automatycznie aktualizuje URL params i wywołuje re-fetch danych.

- **Główne elementy**:
  - `<div>` - container
  - `<input type="search">` - pole wyszukiwania
  - `<SearchIcon>` - ikona lupy (SVG)
  - `<ClearButton>` - przycisk X do czyszczenia (pokazany gdy input nie pusty)
  - `<label>` (visually hidden) - dla screen readers

- **Obsługiwane interakcje**:
  - `onChange` na input → debounce (500ms) → update URL param `search` → fetch
  - `onClick` na ClearButton → clear input → remove `search` param → fetch
  - `onKeyDown` Enter → skip debounce, immediate search

- **Obsługiwana walidacja**:
  - Max length: 100 znaków
  - Trim whitespace
  - Sanitizacja SQL injection (backend odpowiedzialny, ale frontend sanitize HTML)

- **Typy**:
  - `SearchBarProps`

- **Propsy**:
  ```typescript
  interface SearchBarProps {
    initialValue: string;
    onSearchChange: (searchTerm: string) => void;
    placeholder?: string;
  }
  ```

### FiltersPanel (src/components/rckik/FiltersPanel.tsx)

- **Opis komponentu**: React component zawierający wszystkie filtry (miasto, sortowanie). Na mobile renderowany jako drawer (slide-in), na desktop jako sidebar panel. Zawiera dropdown do wyboru miasta, dropdown sortowania, checkbox "Tylko aktywne", i przycisk reset filtrów.

- **Główne elementy**:
  - `<div>` lub `<aside>` - główny container (drawer na mobile, panel na desktop)
  - `<h3>` - "Filtry"
  - `<CityFilter>` - Select/Combobox z listą miast
  - `<SortByFilter>` - Select (name, city, code)
  - `<SortOrderToggle>` - Toggle button (ASC/DESC)
  - `<ResetFiltersButton>` - przycisk resetujący wszystkie filtry
  - `<CloseButton>` (mobile only) - X do zamknięcia drawera

- **Obsługiwane interakcje**:
  - `onChange` na CityFilter → update URL param `city` → fetch
  - `onChange` na SortByFilter → update URL params `sortBy` → fetch
  - `onClick` na SortOrderToggle → toggle ASC/DESC → fetch
  - `onClick` na ResetFiltersButton → clear all filters → fetch default
  - `onClick` na CloseButton → close drawer (mobile)

- **Obsługiwana walidacja**:
  - City: musi być z listy dostępnych miast (dropdown ogranicza wybór)
  - SortBy: enum validation ('name' | 'city' | 'code')
  - SortOrder: enum validation ('ASC' | 'DESC')

- **Typy**:
  - `FiltersParams`
  - `RckikFilters`

- **Propsy**:
  ```typescript
  interface FiltersPanelProps {
    initialFilters: RckikFilters;
    availableCities: string[]; // lista unikalnych miast z API
    onFiltersChange: (filters: RckikFilters) => void;
    isMobile: boolean;
    isOpen: boolean; // dla mobile drawer
    onClose: () => void; // zamknięcie drawera
  }
  ```

### CityFilter (src/components/rckik/CityFilter.tsx)

- **Opis komponentu**: Dropdown/Select component do wyboru miasta. Zawiera listę wszystkich unikalnych miast z bazy danych RCKiK. Opcja "Wszystkie miasta" jako default.

- **Główne elementy**:
  - `<label>` - "Miasto"
  - `<select>` lub custom combobox
  - `<option value="">Wszystkie miasta</option>`
  - `<option value="Warszawa">Warszawa</option>` × N

- **Obsługiwane interakcje**:
  - `onChange` → emit selected city → parent updates filters

- **Obsługiwana walidacja**:
  - Value musi być z listy `availableCities` lub empty string

- **Typy**:
  - `CityFilterProps`

- **Propsy**:
  ```typescript
  interface CityFilterProps {
    value: string | null;
    cities: string[];
    onChange: (city: string | null) => void;
  }
  ```

### RckikList (src/components/rckik/RckikList.tsx)

- **Opis komponentu**: Container dla listy kart RCKiK. Obsługuje conditional rendering: loading (skeletony), error, empty state, lub lista kart. Opcjonalnie może używać virtualizacji (react-window) dla wydajności przy dużej liczbie elementów (>50).

- **Główne elementy**:
  - `<div>` lub `<section>` - główny container
  - Conditional rendering:
    - Loading: `<SkeletonList>`
    - Error: `<ErrorState>`
    - Empty: `<EmptyState>`
    - Success: `<ul>` lub `<div>` grid z `<RckikCard>` × N

- **Obsługiwane interakcje**:
  - Click na RckikCard → nawigacja do `/rckik/{id}`
  - Keyboard navigation (Tab przez karty)

- **Obsługiwana walidacja**: Brak (prezentacja danych)

- **Typy**:
  - `RckikListProps`
  - `RckikListApiResponse`

- **Propsy**:
  ```typescript
  interface RckikListProps {
    data: RckikListApiResponse | null;
    loading: boolean;
    error: Error | null;
  }
  ```

### RckikCard (src/components/rckik/RckikCard.tsx)

- **Opis komponentu**: Karta pojedynczego centrum krwiodawstwa. Wyświetla nazwę, miasto, kod, adres, badge dla każdej grupy krwi, i timestamp ostatniej aktualizacji. Cała karta jest klikanym linkiem do `/rckik/{id}`. Zawiera DataStatusBadge jeśli dane są niekompletne.

- **Główne elementy**:
  - `<article>` lub `<div>` - główny container (card)
  - `<a>` wrapper (link do szczegółów)
  - `<header>` - RckikCardHeader
    - `<h2>` - nazwa centrum (link)
    - `<span>` - kod + miasto
    - `<DataStatusBadge>` (conditional, jeśli dataStatus !== 'OK')
  - `<address>` - adres
  - `<div>` - BloodLevelsGrid (grid 4×2 lub 2×4 na mobile)
    - `<BloodLevelBadge>` × 8
  - `<footer>` lub `<div>` - LastUpdateTimestamp
    - `<time datetime>` - "Ostatnia aktualizacja: {timestamp}"

- **Obsługiwane interakcje**:
  - `onClick` na card → nawigacja do `/rckik/{id}`
  - Hover effect (elevation/shadow)
  - Focus state (keyboard navigation)

- **Obsługiwana walidacja**: Brak (prezentacja danych)

- **Typy**:
  - `RckikCardProps`
  - `RckikSummary`

- **Propsy**:
  ```typescript
  interface RckikCardProps {
    rckik: RckikSummary;
  }
  ```

### BloodLevelBadge (src/components/rckik/BloodLevelBadge.tsx)

- **Opis komponentu**: Badge wyświetlający poziom konkretnej grupy krwi. Zawiera ikonę, nazwę grupy krwi (np. "A+"), procent (np. "45.5%"), i status (CRITICAL/IMPORTANT/OK). Używa kolorów + ikon + tekstu dla accessibility (nie tylko kolor).

- **Główne elementy**:
  - `<div>` - badge container
  - `<StatusIcon>` - ikona status (SVG):
    - CRITICAL: alert icon (red)
    - IMPORTANT: warning icon (orange)
    - OK: check icon (green)
  - `<span>` - bloodGroup label (np. "A+")
  - `<span>` - levelPercentage (np. "45.5%")
  - `<span>` (visually hidden lub tooltip) - status text ("Krytyczny", "Ważny", "OK") dla screen readers

- **Obsługiwane interakcje**:
  - Hover → tooltip z dodatkowymi info (optional)
  - No direct interaction (passive display)

- **Obsługiwana walidacja**: Brak (prezentacja danych)

- **Typy**:
  - `BloodLevelBadgeProps`
  - `BloodLevel`
  - `BloodLevelStatus`

- **Propsy**:
  ```typescript
  interface BloodLevelBadgeProps {
    bloodLevel: BloodLevel;
    size?: 'small' | 'medium' | 'large'; // optional size variant
  }
  ```

### DataStatusBadge (src/components/rckik/DataStatusBadge.tsx)

- **Opis komponentu**: Badge informujący o statusie danych (PARTIAL lub NO_DATA). Wyświetlany tylko gdy `dataStatus !== 'OK'`. Zawiera ikonę i tekst wyjaśniający problem.

- **Główne elementy**:
  - `<div>` - badge container (warning styling)
  - `<WarningIcon>` - ikona ostrzeżenia
  - `<span>` - status text:
    - PARTIAL: "Dane niekompletne"
    - NO_DATA: "Brak danych"

- **Obsługiwane interakcje**:
  - Hover → tooltip z dodatkowymi info (ostatnia udana aktualizacja)

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `DataStatusBadgeProps`
  - `DataStatus`

- **Propsy**:
  ```typescript
  interface DataStatusBadgeProps {
    dataStatus: DataStatus;
    lastUpdate?: string; // ISO 8601 timestamp
  }
  ```

### Pagination (src/components/rckik/Pagination.tsx)

- **Opis komponentu**: Kontrolki paginacji. Wyświetla numery stron, przyciski Previous/Next, i opcjonalnie page size selector. Aktualizuje URL params przy zmianie strony.

- **Główne elementy**:
  - `<nav aria-label="Pagination">` - główny container
  - `<ul>` - lista przycisków
    - `<li><button>` - Previous (disabled if first page)
    - `<li><button>` × N - page numbers (current page highlighted)
    - `<li><button>` - Next (disabled if last page)
  - `<select>` - page size selector (10, 20, 50)

- **Obsługiwane interakcje**:
  - `onClick` Previous → update URL param `page` (currentPage - 1) → fetch
  - `onClick` page number → update URL param `page` → fetch
  - `onClick` Next → update URL param `page` (currentPage + 1) → fetch
  - `onChange` page size → update URL param `size` → reset page to 0 → fetch

- **Obsługiwana walidacja**:
  - Page number: >= 0, <= totalPages - 1
  - Page size: 10, 20, 50 (preset values)

- **Typy**:
  - `PaginationProps`

- **Propsy**:
  ```typescript
  interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    isFirst: boolean;
    isLast: boolean;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  }
  ```

### EmptyState (src/components/common/EmptyState.tsx)

- **Opis komponentu**: Komponent wyświetlany gdy brak wyników wyszukiwania/filtrowania. Zawiera ikonę, message, i sugestie (reset filtrów, browse all).

- **Główne elementy**:
  - `<div>` - centered container
  - `<EmptyIcon>` - ikona (SVG, np. search icon z X)
  - `<h3>` - "Nie znaleziono centrów"
  - `<p>` - "Spróbuj zmienić filtry lub wyszukiwanie"
  - `<Button>` - "Resetuj filtry"
  - `<Link>` - "Przeglądaj wszystkie centra"

- **Obsługiwane interakcje**:
  - `onClick` Reset button → clear filters → fetch all
  - `onClick` Browse all link → navigate to `/rckik` (no params)

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `EmptyStateProps`

- **Propsy**:
  ```typescript
  interface EmptyStateProps {
    title?: string;
    message?: string;
    onReset: () => void;
  }
  ```

### SkeletonList (src/components/common/SkeletonList.tsx)

- **Opis komponentu**: Placeholder skeletons wyświetlane podczas ładowania danych. Symuluje układ RckikCard z animowanymi prostokątami (shimmer effect).

- **Główne elementy**:
  - `<div>` - grid container (jak RckikList)
  - `<RckikCardSkeleton>` × 10 (lub count prop)
    - Prostokąty z gradient animation dla: header, address, blood badges, footer

- **Obsługiwane interakcje**: Brak (pasywny placeholder)

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `SkeletonListProps`

- **Propsy**:
  ```typescript
  interface SkeletonListProps {
    count?: number; // liczba skeleton cards, default 10
  }
  ```

### ErrorState (src/components/common/ErrorState.tsx)

- **Opis komponentu**: Komponent wyświetlany przy błędzie API (network error, 500, timeout). Zawiera ikonę błędu, message, i przycisk retry.

- **Główne elementy**:
  - `<div>` - centered container
  - `<ErrorIcon>` - ikona błędu (SVG, alert/warning)
  - `<h3>` - "Wystąpił błąd"
  - `<p>` - error message (jeśli dostępny) lub generic "Nie udało się załadować danych"
  - `<Button>` - "Spróbuj ponownie"

- **Obsługiwane interakcje**:
  - `onClick` Retry button → re-fetch danych

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `ErrorStateProps`

- **Propsy**:
  ```typescript
  interface ErrorStateProps {
    error: Error;
    onRetry: () => void;
  }
  ```

## 5. Typy

Wszystkie typy zdefiniowane w `src/types/rckik.ts`:

```typescript
// ===== API Response Types (mapowane z backendu) =====

/**
 * Response z API dla listy RCKiK (paginowany)
 * Endpoint: GET /api/v1/rckik
 */
export interface RckikListApiResponse {
  content: RckikSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Podsumowanie pojedynczego centrum RCKiK
 * Używane w liście centrów
 */
export interface RckikSummary {
  id: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  bloodLevels: BloodLevel[];
  dataStatus: DataStatus;
  lastUpdate: string; // ISO 8601 timestamp
}

/**
 * Poziom krwi dla konkretnej grupy
 */
export interface BloodLevel {
  bloodGroup: BloodGroup;
  levelPercentage: number; // 0.00 - 100.00
  levelStatus: BloodLevelStatus;
  lastUpdate: string; // ISO 8601 timestamp
}

// ===== Enums and Literals =====

/**
 * Grupy krwi (8 typów)
 */
export type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

/**
 * Status poziomu krwi
 * - CRITICAL: < 20%
 * - IMPORTANT: 20-49%
 * - OK: >= 50%
 */
export type BloodLevelStatus = 'CRITICAL' | 'IMPORTANT' | 'OK';

/**
 * Status kompletności danych (US-020)
 * - OK: Dane kompletne
 * - PARTIAL: Dane częściowe (niektóre grupy krwi brakujące)
 * - NO_DATA: Brak danych
 */
export type DataStatus = 'OK' | 'PARTIAL' | 'NO_DATA';

// ===== UI State Types =====

/**
 * Filtry dla listy RCKiK
 */
export interface RckikFilters {
  city: string | null; // null = wszystkie miasta
  active: boolean; // pokazuj tylko aktywne centra
  sortBy: 'name' | 'city' | 'code';
  sortOrder: 'ASC' | 'DESC';
}

/**
 * Parametry wyszukiwania (filtry + paginacja + search)
 * Synchronizowane z URL query params
 */
export interface RckikSearchParams extends RckikFilters {
  page: number; // zero-based
  size: number; // 10, 20, 50, 100
  search: string; // wyszukiwanie po nazwie
}

/**
 * Stan hooka useRckikList
 */
export interface RckikListState {
  data: RckikListApiResponse | null;
  loading: boolean;
  error: Error | null;
  params: RckikSearchParams;
}

// ===== Component Props Types =====

/**
 * Props dla RckikCard component
 */
export interface RckikCardProps {
  rckik: RckikSummary;
}

/**
 * Props dla BloodLevelBadge component
 */
export interface BloodLevelBadgeProps {
  bloodLevel: BloodLevel;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Props dla DataStatusBadge component
 */
export interface DataStatusBadgeProps {
  dataStatus: DataStatus;
  lastUpdate?: string;
}

/**
 * Props dla FiltersPanel component
 */
export interface FiltersPanelProps {
  initialFilters: RckikFilters;
  availableCities: string[];
  onFiltersChange: (filters: RckikFilters) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props dla CityFilter component
 */
export interface CityFilterProps {
  value: string | null;
  cities: string[];
  onChange: (city: string | null) => void;
}

/**
 * Props dla SearchBar component
 */
export interface SearchBarProps {
  initialValue: string;
  onSearchChange: (searchTerm: string) => void;
  placeholder?: string;
}

/**
 * Props dla Pagination component
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * Props dla RckikList component
 */
export interface RckikListProps {
  data: RckikListApiResponse | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Props dla EmptyState component
 */
export interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset: () => void;
}

/**
 * Props dla ErrorState component
 */
export interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Props dla SkeletonList component
 */
export interface SkeletonListProps {
  count?: number;
}

// ===== Utility Types =====

/**
 * Mapy statusów do kolorów i ikon (dla BloodLevelBadge)
 */
export const BLOOD_LEVEL_STATUS_CONFIG: Record<BloodLevelStatus, {
  color: string; // Tailwind class
  icon: string; // nazwa ikony
  label: string; // tekst dla screen readers
}> = {
  CRITICAL: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: 'alert-circle',
    label: 'Krytyczny poziom'
  },
  IMPORTANT: {
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: 'alert-triangle',
    label: 'Ważny poziom'
  },
  OK: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: 'check-circle',
    label: 'Wystarczający poziom'
  }
};

/**
 * Default search params
 */
export const DEFAULT_RCKIK_SEARCH_PARAMS: RckikSearchParams = {
  page: 0,
  size: 20,
  search: '',
  city: null,
  active: true,
  sortBy: 'name',
  sortOrder: 'ASC'
};
```

## 6. Zarządzanie stanem

### 6.1 Strategia zarządzania stanem

Widok Lista RCKiK jest **publicznym widokiem statycznym (SSG z ISR)**, więc nie wymaga globalnego state managementu (Redux). Stan jest zarządzany lokalnie w komponentach React przy użyciu **React hooks** i synchronizowany z **URL query parameters** dla shareable URLs.

### 6.2 Stan lokalny (React hooks)

**Custom hook: useRckikList**

Główny hook zarządzający stanem listy RCKiK, fetchingiem danych, filtrowaniem, i paginacją.

Lokalizacja: `src/lib/hooks/useRckikList.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'; // lub Astro equivalent
import { fetchRckikList } from '@/lib/api/endpoints/rckik';
import type { RckikListState, RckikSearchParams } from '@/types/rckik';
import { DEFAULT_RCKIK_SEARCH_PARAMS } from '@/types/rckik';

/**
 * Hook do zarządzania listą RCKiK
 * Synchronizuje parametry z URL i wykonuje API calls
 */
export function useRckikList(initialData?: RckikListApiResponse) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse params z URL
  const params: RckikSearchParams = {
    page: parseInt(searchParams.get('page') || '0'),
    size: parseInt(searchParams.get('size') || '20'),
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || null,
    active: searchParams.get('active') !== 'false',
    sortBy: (searchParams.get('sortBy') as any) || 'name',
    sortOrder: (searchParams.get('sortOrder') as any) || 'ASC'
  };

  const [state, setState] = useState<RckikListState>({
    data: initialData || null,
    loading: !initialData,
    error: null,
    params
  });

  // Fetch data z API
  const fetchData = useCallback(async (params: RckikSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchRckikList(params);
      setState(prev => ({ ...prev, data, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error, loading: false }));
    }
  }, []);

  // Effect: fetch przy zmianie params
  useEffect(() => {
    fetchData(params);
  }, [params, fetchData]);

  // Update URL params i trigger fetch
  const updateParams = useCallback((newParams: Partial<RckikSearchParams>) => {
    const updated = { ...params, ...newParams };

    // Reset page do 0 przy zmianie filtrów (nie paginacji)
    if (newParams.city !== undefined || newParams.search !== undefined) {
      updated.page = 0;
    }

    // Update URL
    const urlParams = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== DEFAULT_RCKIK_SEARCH_PARAMS[key]) {
        urlParams.set(key, String(value));
      }
    });
    setSearchParams(urlParams);
  }, [params, setSearchParams]);

  return {
    ...state,
    updateParams,
    refetch: () => fetchData(params)
  };
}
```

**Custom hook: useDebounce**

Hook do debounce search inputu.

Lokalizacja: `src/lib/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

/**
 * Debounce hook dla search inputu
 * @param value - wartość do debounce
 * @param delay - opóźnienie w ms (default 500)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Custom hook: useMediaQuery**

Hook do wykrywania breakpointów (mobile/desktop).

Lokalizacja: `src/lib/hooks/useMediaQuery.ts`

```typescript
import { useState, useEffect } from 'react';

/**
 * Hook do wykrywania media queries
 * @param query - CSS media query string
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Helper dla typowych breakpointów
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
```

### 6.3 Server-side state (Astro page props)

W `src/pages/rckik/index.astro`, server-side fetch initial data dla SSG:

```typescript
---
// Astro component script
import { fetchRckikList } from '@/lib/api/endpoints/rckik';
import type { RckikSearchParams } from '@/types/rckik';

// Parse query params z URL (Astro.url.searchParams)
const searchParams = Astro.url.searchParams;
const params: RckikSearchParams = {
  page: parseInt(searchParams.get('page') || '0'),
  size: parseInt(searchParams.get('size') || '20'),
  search: searchParams.get('search') || '',
  city: searchParams.get('city') || null,
  active: searchParams.get('active') !== 'false',
  sortBy: (searchParams.get('sortBy') as any) || 'name',
  sortOrder: (searchParams.get('sortOrder') as any) || 'ASC'
};

// Fetch data server-side
let initialData = null;
let fetchError = null;
try {
  initialData = await fetchRckikList(params);
} catch (error) {
  fetchError = error;
}

// ISR config
export const prerender = true;
export const revalidate = 300; // 5 minut
---

<!-- HTML template -->
<RckikListView initialData={initialData} initialParams={params} />
```

### 6.4 Synchronizacja z URL

URL query parameters są **single source of truth** dla stanu filtrów/paginacji. Każda zmiana stanu aktualizuje URL, co:
- Umożliwia shareable URLs (użytkownik może skopiować link i podzielić się filtrowaną listą)
- Obsługuje browser back/forward buttons
- Automatycznie triggere re-fetch danych

### 6.5 Opcjonalnie: Redux (dla cache)

Jeśli chcemy cache'ować publiczne dane RCKiK globally (aby nie fetchować ponownie przy powrocie do strony), możemy użyć Redux slice:

```typescript
// src/lib/store/slices/rckikSlice.ts (opcjonalnie)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RckikListApiResponse } from '@/types/rckik';

interface RckikState {
  cache: Record<string, RckikListApiResponse>; // key: serialized params
  lastFetch: Record<string, number>; // timestamp
}

const initialState: RckikState = {
  cache: {},
  lastFetch: {}
};

const rckikSlice = createSlice({
  name: 'rckik',
  initialState,
  reducers: {
    cacheResults(state, action: PayloadAction<{ key: string; data: RckikListApiResponse }>) {
      state.cache[action.payload.key] = action.payload.data;
      state.lastFetch[action.payload.key] = Date.now();
    },
    clearCache(state) {
      state.cache = {};
      state.lastFetch = {};
    }
  }
});

export const { cacheResults, clearCache } = rckikSlice.actions;
export default rckikSlice.reducer;
```

Jednak dla MVP, **nie potrzebujemy Redux** - SSG z ISR + browser cache wystarczy.

## 7. Integracja API

### 7.1 Endpoint

**GET /api/v1/rckik**

Lista centrów krwiodawstwa z paginacją i filtrowaniem.

### 7.2 Request

**Query Parameters:**
- `page` (number, optional, default: 0) - numer strony (zero-based)
- `size` (number, optional, default: 20, max: 100) - rozmiar strony
- `city` (string, optional) - filtr po mieście
- `active` (boolean, optional, default: true) - tylko aktywne centra
- `sortBy` (string, optional, default: 'name') - pole sortowania ('name', 'city', 'code')
- `sortOrder` (string, optional, default: 'ASC') - kierunek sortowania ('ASC', 'DESC')

Przykład: `GET /api/v1/rckik?city=Warszawa&page=1&size=20&sortBy=name&sortOrder=ASC`

### 7.3 Response

**Success (200 OK):**

```json
{
  "content": [
    {
      "id": 1,
      "name": "Regionalne Centrum Krwiodawstwa i Krwiolecznictwa w Warszawie",
      "code": "RCKIK-WAW",
      "city": "Warszawa",
      "address": "ul. Kasprzaka 17, 01-211 Warszawa",
      "latitude": 52.2319,
      "longitude": 20.9728,
      "active": true,
      "bloodLevels": [
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
        // ... pozostałe 6 grup krwi
      ],
      "dataStatus": "OK",
      "lastUpdate": "2025-01-08T02:30:00"
    }
    // ... więcej elementów
  ],
  "page": 1,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3,
  "first": false,
  "last": false
}
```

**Error Responses:**
- `400 Bad Request` - invalid query params
- `500 Internal Server Error` - server error

### 7.4 API Client Implementation

Lokalizacja: `src/lib/api/endpoints/rckik.ts`

```typescript
import { apiClient } from '@/lib/api/client';
import type { RckikListApiResponse, RckikSearchParams } from '@/types/rckik';

/**
 * Fetch lista RCKiK z filtrowaniem i paginacją
 * Endpoint: GET /api/v1/rckik
 */
export async function fetchRckikList(params: RckikSearchParams): Promise<RckikListApiResponse> {
  const queryParams = new URLSearchParams();

  // Dodaj tylko non-default params
  if (params.page > 0) queryParams.set('page', String(params.page));
  if (params.size !== 20) queryParams.set('size', String(params.size));
  if (params.search) queryParams.set('search', params.search);
  if (params.city) queryParams.set('city', params.city);
  if (!params.active) queryParams.set('active', 'false');
  if (params.sortBy !== 'name') queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder !== 'ASC') queryParams.set('sortOrder', params.sortOrder);

  const response = await apiClient.get<RckikListApiResponse>(
    `/rckik?${queryParams.toString()}`
  );

  return response.data;
}

/**
 * Fetch unikalne miasta dla filtru
 * Opcjonalnie: endpoint GET /api/v1/rckik/cities lub derive z listy
 */
export async function fetchAvailableCities(): Promise<string[]> {
  // Opcja 1: dedykowany endpoint (jeśli istnieje)
  // const response = await apiClient.get<string[]>('/rckik/cities');
  // return response.data;

  // Opcja 2: fetch all i extract unique cities (dla MVP)
  const response = await apiClient.get<RckikListApiResponse>('/rckik?size=100');
  const cities = [...new Set(response.data.content.map(r => r.city))];
  return cities.sort();
}
```

### 7.5 Axios Client Configuration

Lokalizacja: `src/lib/api/client.ts`

```typescript
import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (opcjonalnie auth token)
apiClient.interceptors.request.use((config) => {
  // Dla publicznych endpoints nie trzeba tokenu
  return config;
});

// Response interceptor (error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      // Rate limit - show toast
      console.error('Rate limit exceeded');
    }
    return Promise.reject(error);
  }
);
```

## 8. Interakcje użytkownika

| Interakcja użytkownika | Akcja frontendowa | API Call | Oczekiwany wynik |
|------------------------|-------------------|----------|------------------|
| **Załadowanie strony `/rckik`** | - Parse URL params<br>- Fetch initial data (SSR) | `GET /api/v1/rckik?page=0&size=20` | Wyświetlenie pierwszej strony listy RCKiK (20 elementów), filtry ustawione na default |
| **Wpisanie tekstu w SearchBar** (np. "warszawa") | - onChange event<br>- Debounce 500ms<br>- Update URL param `search=warszawa`<br>- Reset `page=0` | `GET /api/v1/rckik?search=warszawa&page=0` | Lista przefiltrowana do centrów zawierających "warszawa" w nazwie, pokazana pierwsza strona |
| **Wybranie miasta z CityFilter** (np. "Kraków") | - onChange event<br>- Update URL param `city=Kraków`<br>- Reset `page=0` | `GET /api/v1/rckik?city=Kraków&page=0` | Lista przefiltrowana do centrów w Krakowie, pierwsza strona |
| **Zmiana sortowania** (SortBy: "city", SortOrder: "DESC") | - onChange events<br>- Update URL params `sortBy=city&sortOrder=DESC` | `GET /api/v1/rckik?sortBy=city&sortOrder=DESC&page=0` | Lista posortowana po mieście malejąco |
| **Kliknięcie przycisku "Next"** w paginacji | - onClick event<br>- Update URL param `page=1` | `GET /api/v1/rckik?page=1` | Wyświetlenie drugiej strony wyników (kolejne 20 elementów) |
| **Kliknięcie przycisku "Previous"** | - onClick event<br>- Update URL param `page=0` | `GET /api/v1/rckik?page=0` | Powrót do pierwszej strony |
| **Kliknięcie numeru strony** (np. "3") | - onClick event<br>- Update URL param `page=2` (zero-based) | `GET /api/v1/rckik?page=2` | Przejście do trzeciej strony |
| **Zmiana page size** (z 20 na 50) | - onChange event<br>- Update URL params `size=50&page=0` | `GET /api/v1/rckik?size=50&page=0` | Wyświetlenie 50 elementów na stronie, reset do pierwszej strony |
| **Kliknięcie "Resetuj filtry"** | - onClick event<br>- Clear all URL params<br>- Reset do default params | `GET /api/v1/rckik?page=0&size=20` | Wyświetlenie pełnej listy bez filtrów, pierwsza strona, sortowanie default (name ASC) |
| **Kliknięcie na RckikCard** | - onClick event (na link `<a>`)<br>- Client-side navigation | Brak API call (nawigacja) | Przejście do strony szczegółów centrum `/rckik/{id}` |
| **Hover nad BloodLevelBadge** | - onMouseEnter event<br>- Show tooltip | Brak API call | Wyświetlenie tooltipa z dodatkowymi info (optional) |
| **Scroll w dół strony** (lazy load, optional) | - IntersectionObserver trigger<br>- Load more items | `GET /api/v1/rckik?page=N` | Automatyczne załadowanie kolejnej strony (infinite scroll) - opcjonalnie zamiast paginacji |
| **Browser back button** | - URL change event<br>- Parse new URL params<br>- Fetch data | `GET /api/v1/rckik?{previous_params}` | Powrót do poprzedniego stanu listy (poprzednie filtry/strona) |
| **Share URL** (skopiowanie linku) | - User copies URL<br>- Inny użytkownik otwiera link | `GET /api/v1/rckik?{params_from_url}` | Odtworzenie dokładnie tego samego widoku z filtrami/stroną (shareable state) |
| **Retry po błędzie** | - onClick event na RetryButton<br>- Re-fetch z tymi samymi params | `GET /api/v1/rckik?{current_params}` | Ponowna próba załadowania danych |

## 9. Warunki i walidacja

### 9.1 Warunki API (z backend)

Zgodnie z API plan, endpoint `GET /api/v1/rckik` akceptuje następujące parametry z warunkami:

| Parametr | Typ | Warunki | Default | Walidacja backend |
|----------|-----|---------|---------|-------------------|
| `page` | integer | >= 0 | 0 | Musi być nieujemny |
| `size` | integer | 1-100 | 20 | Max 100, min 1 |
| `city` | string | max 100 chars | null | Opcjonalny |
| `active` | boolean | true/false | true | Opcjonalny |
| `sortBy` | enum | 'name', 'city', 'code' | 'name' | Musi być z listy |
| `sortOrder` | enum | 'ASC', 'DESC' | 'ASC' | Musi być ASC lub DESC |

### 9.2 Walidacja na poziomie frontend

**SearchBar component:**
- Max length: 100 znaków (input `maxLength={100}`)
- Trim whitespace przed wysłaniem
- Sanityzacja HTML (DOMPurify jeśli renderujemy user input, ale tutaj tylko wysyłamy do API)

**CityFilter component:**
- Wartość musi być z listy `availableCities` lub null (dropdown ogranicza wybór)
- Nie ma free text input, więc walidacja automatyczna przez UI

**Pagination component:**
- Page number: >= 0, <= totalPages - 1
- Disable Previous button jeśli `currentPage === 0`
- Disable Next button jeśli `currentPage === totalPages - 1`
- Page size: preset values (10, 20, 50) - dropdown ogranicza wybór

**FiltersPanel:**
- SortBy: enum validation ('name' | 'city' | 'code') - dropdown ogranicza
- SortOrder: enum validation ('ASC' | 'DESC') - toggle button ogranicza

### 9.3 Warunki renderowania UI

**RckikList conditional rendering:**

```typescript
if (loading) {
  return <SkeletonList count={10} />;
}

if (error) {
  return <ErrorState error={error} onRetry={refetch} />;
}

if (!data || data.totalElements === 0) {
  return <EmptyState onReset={resetFilters} />;
}

// Render lista
return (
  <div>
    {data.content.map(rckik => (
      <RckikCard key={rckik.id} rckik={rckik} />
    ))}
    <Pagination {...paginationProps} />
  </div>
);
```

**BloodLevelBadge conditional styling:**

```typescript
// Warunek: levelStatus określa kolor i ikonę
const config = BLOOD_LEVEL_STATUS_CONFIG[bloodLevel.levelStatus];

// CRITICAL (<20%): czerwony + alert icon
// IMPORTANT (20-49%): pomarańczowy + warning icon
// OK (>=50%): zielony + check icon
```

**DataStatusBadge conditional rendering:**

```typescript
// Renderuj tylko jeśli dataStatus !== 'OK'
{rckik.dataStatus !== 'OK' && (
  <DataStatusBadge
    dataStatus={rckik.dataStatus}
    lastUpdate={rckik.lastUpdate}
  />
)}
```

**Pagination buttons disabled states:**

```typescript
// Previous disabled jeśli first page
<button disabled={isFirst} onClick={handlePrevious}>Previous</button>

// Next disabled jeśli last page
<button disabled={isLast} onClick={handleNext}>Next</button>
```

### 9.4 Warunki biznesowe

**US-020: Obsługa braków danych**

Gdy `dataStatus === 'PARTIAL'` lub `dataStatus === 'NO_DATA'`:
- Wyświetl DataStatusBadge na RckikCard
- Tooltip wyjaśnia: "Dane niekompletne, ostatnia aktualizacja: {lastUpdate}"
- Nie blokuj wyświetlania karty, ale informuj użytkownika

**Filtrowanie po active:**

Domyślnie `active=true` (pokazuj tylko aktywne centra). Admin panel może wyświetlać nieaktywne, ale dla publicznego widoku filtrujemy.

**Empty results:**

Gdy `totalElements === 0`, wyświetl EmptyState z sugestiami:
- "Nie znaleziono centrów spełniających kryteria"
- "Spróbuj zmienić filtry lub wyszukiwanie"
- Przycisk "Resetuj filtry"

## 10. Obsługa błędów

### 10.1 Scenariusze błędów i obsługa

#### 1. Network Error (brak połączenia)

**Scenariusz:** Użytkownik nie ma internetu lub API jest niedostępne.

**Obsługa:**
- Catch error w `fetchRckikList`
- Wyświetl `<ErrorState>` component z message: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
- Przycisk "Spróbuj ponownie" → retry fetch
- Opcjonalnie: offline banner na górze strony (jeśli `navigator.onLine === false`)

**Implementacja:**
```typescript
try {
  const data = await fetchRckikList(params);
} catch (error) {
  if (error.message === 'Network Error') {
    setState({ error: new Error('Brak połączenia z internetem'), loading: false });
  }
}
```

#### 2. 500 Internal Server Error

**Scenariusz:** Błąd po stronie backendu (database down, exception).

**Obsługa:**
- Catch error z status 500
- Wyświetl `<ErrorState>` z generic message: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- Przycisk "Spróbuj ponownie"
- Report to Sentry (opcjonalnie dla monitoringu)

**Implementacja:**
```typescript
if (error.response?.status === 500) {
  setState({ error: new Error('Błąd serwera. Spróbuj ponownie później.'), loading: false });
  // Sentry.captureException(error);
}
```

#### 3. 400 Bad Request (invalid query params)

**Scenariusz:** Frontend wysłał nieprawidłowe parametry (np. page=-1, size=1000).

**Obsługa:**
- Sanityzacja params przed wysłaniem (validation frontend)
- Jeśli backend zwróci 400, reset params do default i retry
- Toast z message: "Nieprawidłowe parametry, resetuję do domyślnych"

**Implementacja:**
```typescript
if (error.response?.status === 400) {
  // Reset do default params
  updateParams(DEFAULT_RCKIK_SEARCH_PARAMS);
  toast.error('Nieprawidłowe parametry wyszukiwania');
}
```

#### 4. Empty Results (0 elementów)

**Scenariusz:** Filtrowanie zwróciło 0 wyników (np. city="XYZ" nie istnieje).

**Obsługa:**
- Nie traktuj jako error (to valid state)
- Wyświetl `<EmptyState>` component
- Sugestie:
  - "Nie znaleziono centrów w mieście XYZ"
  - "Spróbuj wyszukać w innym mieście"
  - Przycisk "Resetuj filtry" → clear params

**Implementacja:**
```typescript
if (data.totalElements === 0) {
  return (
    <EmptyState
      title="Nie znaleziono centrów"
      message="Spróbuj zmienić kryteria wyszukiwania"
      onReset={resetFilters}
    />
  );
}
```

#### 5. Timeout (API call przekroczył timeout)

**Scenariusz:** API nie odpowiedziało w ciągu 10 sekund (timeout z Axios config).

**Obsługa:**
- Catch timeout error
- Message: "Żądanie przekroczyło limit czasu. Spróbuj ponownie."
- Przycisk retry

**Implementacja:**
```typescript
if (error.code === 'ECONNABORTED') {
  setState({ error: new Error('Timeout - spróbuj ponownie'), loading: false });
}
```

#### 6. Incomplete Data (dataStatus !== 'OK')

**Scenariusz:** RCKiK ma `dataStatus: 'PARTIAL'` lub `'NO_DATA'` (scraping failed, dane niekompletne).

**Obsługa:**
- NIE traktuj jako error (dane częściowe są lepsze niż brak)
- Wyświetl kartę RckikCard normalnie
- Dodaj `<DataStatusBadge>` z ikoną ostrzeżenia
- Tooltip: "Dane niekompletne. Ostatnia aktualizacja: {lastUpdate}"
- User może kliknąć i zobaczyć szczegóły

**Implementacja:**
```typescript
// W RckikCard
{rckik.dataStatus !== 'OK' && (
  <DataStatusBadge
    dataStatus={rckik.dataStatus}
    lastUpdate={rckik.lastUpdate}
  />
)}
```

#### 7. Invalid URL params (user manipulated URL)

**Scenariusz:** Użytkownik ręcznie edytował URL i podał invalid params (np. `page=abc`, `size=-5`).

**Obsługa:**
- Parse i sanitize params w `useRckikList`
- Fallback do default values dla invalid params
- Nie crash, gracefully handle

**Implementacja:**
```typescript
// Sanitize params
const page = Math.max(0, parseInt(searchParams.get('page') || '0'));
const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20')));
```

#### 8. ISR cache miss (first request after 5 min)

**Scenariusz:** SSG cache wygasł, Astro musi re-generate page.

**Obsługa:**
- Nie error z perspektywy użytkownika
- Może być nieco wolniejsze pierwsze ładowanie
- Użytkownik nie zauważy różnicy (fallback SSR)

#### 9. Rate Limiting (429 Too Many Requests)

**Scenariusz:** Użytkownik wysłał zbyt wiele requestów (rate limit exceeded).

**Obsługa:**
- Catch 429 status
- Wyciągnij `Retry-After` header (sekundy)
- Wyświetl toast: "Zbyt wiele żądań. Spróbuj ponownie za {X} sekund."
- Disable retry button przez X sekund (countdown)

**Implementacja:**
```typescript
if (error.response?.status === 429) {
  const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
  toast.error(`Zbyt wiele żądań. Spróbuj za ${retryAfter} sekund.`);
  // Disable actions na retryAfter sekund
}
```

### 10.2 Error Boundaries (React)

Dla komponentów React, użyj ErrorBoundary do catch nieoczekiwanych błędów:

```typescript
// src/components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorState
          error={this.state.error!}
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
```

Użycie:
```tsx
<ErrorBoundary>
  <RckikList data={data} loading={loading} error={error} />
</ErrorBoundary>
```

### 10.3 Logging i monitoring

**Development:**
- Console.log/error dla debugging
- Wyświetlaj error details w UI (stack trace)

**Production:**
- Sentry integration dla error tracking
- Log critical errors (500, network failures)
- NO PII w logach (no user emails, names, etc.)
- Monitor error rate via Sentry dashboard

```typescript
// src/lib/utils/errorReporting.ts
export function reportError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    // Sentry.captureException(error, { contexts: { custom: context } });
  } else {
    console.error('Error:', error, context);
  }
}
```

## 11. Kroki implementacji

### Faza 1: Setup i typy (1 dzień)

#### Krok 1: Struktura katalogów

```bash
src/
├── components/
│   ├── rckik/
│   │   ├── RckikCard.tsx
│   │   ├── RckikList.tsx
│   │   ├── BloodLevelBadge.tsx
│   │   ├── DataStatusBadge.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FiltersPanel.tsx
│   │   ├── CityFilter.tsx
│   │   └── Pagination.tsx
│   ├── common/
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── SkeletonList.tsx
│   │   └── ErrorBoundary.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Select.tsx
│       └── Input.tsx
├── types/
│   └── rckik.ts
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints/
│   │       └── rckik.ts
│   ├── hooks/
│   │   ├── useRckikList.ts
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   └── utils/
│       └── errorReporting.ts
└── pages/
    └── rckik/
        └── index.astro
```

#### Krok 2: Definiowanie typów

Utwórz `src/types/rckik.ts` z wszystkimi typami (patrz sekcja 5).

#### Krok 3: API client setup

Utwórz `src/lib/api/client.ts` z Axios instance (patrz sekcja 7.5).

#### Krok 4: API endpoint functions

Utwórz `src/lib/api/endpoints/rckik.ts`:
- `fetchRckikList(params)` - main endpoint
- `fetchAvailableCities()` - dla filtru miast

#### Krok 5: Custom hooks

Utwórz w `src/lib/hooks/`:
- `useRckikList.ts` - główny hook
- `useDebounce.ts` - debounce search
- `useMediaQuery.ts` - responsive breakpoints

### Faza 2: Komponenty UI primitives (1-2 dni)

#### Krok 6: Button component

Jeśli nie istnieje, utwórz `src/components/ui/Button.tsx`:
- Variants: primary, secondary, outline, ghost
- Sizes: small, medium, large
- Loading state
- Disabled state
- Accessibility (aria-label, keyboard nav)

#### Krok 7: Input component

Utwórz `src/components/ui/Input.tsx`:
- Type: text, search
- States: default, focus, error, disabled
- Icons (leading/trailing)
- Accessibility

#### Krok 8: Select/Dropdown component

Utwórz `src/components/ui/Select.tsx`:
- Custom styled select lub natywny `<select>`
- Options z labeling
- Accessibility (keyboard nav, aria-labelledby)

### Faza 3: Komponenty domenowe RCKiK (2-3 dni)

#### Krok 9: BloodLevelBadge

Utwórz `src/components/rckik/BloodLevelBadge.tsx`:
- Props: `bloodLevel` (BloodLevel type)
- Conditional styling based on `levelStatus`
- Icon + color + text (accessibility)
- Tooltip (optional)
- Responsive sizing

#### Krok 10: DataStatusBadge

Utwórz `src/components/rckik/DataStatusBadge.tsx`:
- Props: `dataStatus`, `lastUpdate`
- Conditional rendering (tylko jeśli !== 'OK')
- Warning icon + message
- Tooltip z lastUpdate

#### Krok 11: RckikCard

Utwórz `src/components/rckik/RckikCard.tsx`:
- Props: `rckik` (RckikSummary type)
- Layout:
  - Header: name (H2), code + city
  - DataStatusBadge (conditional)
  - Address
  - BloodLevelsGrid: 8× BloodLevelBadge (grid 4×2)
  - Footer: lastUpdate timestamp
- Link wrapper (`<a href={`/rckik/${rckik.id}`}>`)
- Hover/focus states
- Accessibility (semantic HTML, ARIA)

#### Krok 12: SearchBar

Utwórz `src/components/rckik/SearchBar.tsx`:
- React component (client:load)
- Input z ikoną search
- useDebounce hook (500ms)
- Clear button (conditional)
- Callback: `onSearchChange(searchTerm)`
- Accessibility (label, placeholder)

#### Krok 13: CityFilter

Utwórz `src/components/rckik/CityFilter.tsx`:
- Select dropdown z listą miast
- Options: "Wszystkie miasta" + `availableCities`
- Callback: `onChange(city)`
- Accessible label

#### Krok 14: FiltersPanel

Utwórz `src/components/rckik/FiltersPanel.tsx`:
- Container: drawer (mobile) lub panel (desktop)
- useMediaQuery dla responsive behavior
- Children:
  - CityFilter
  - SortByFilter (select: name, city, code)
  - SortOrderToggle (button: ASC/DESC)
  - ResetFiltersButton
- Callbacks: `onFiltersChange(filters)`
- Mobile: drawer slide-in animation, close button

#### Krok 15: Pagination

Utwórz `src/components/rckik/Pagination.tsx`:
- Navigation component
- Previous/Next buttons (disabled states)
- Page numbers (current highlighted)
- Page size selector (dropdown: 10, 20, 50)
- Callbacks: `onPageChange`, `onPageSizeChange`
- Accessibility (nav, aria-label, keyboard)

### Faza 4: Layout i conditional components (1 dzień)

#### Krok 16: EmptyState

Utwórz `src/components/common/EmptyState.tsx`:
- Icon (SVG)
- Title (H3)
- Message (P)
- Reset button
- Link to browse all

#### Krok 17: ErrorState

Utwórz `src/components/common/ErrorState.tsx`:
- Error icon
- Title "Wystąpił błąd"
- Error message (from error prop)
- Retry button
- Callback: `onRetry()`

#### Krok 18: SkeletonList

Utwórz `src/components/common/SkeletonList.tsx`:
- Grid container (jak RckikList)
- N× RckikCardSkeleton (prostokąty z shimmer animation)
- Prop: `count` (default 10)

#### Krok 19: ErrorBoundary

Utwórz `src/components/common/ErrorBoundary.tsx`:
- React class component
- Catch unexpected errors
- Fallback: ErrorState z reload button

#### Krok 20: RckikList

Utwórz `src/components/rckik/RckikList.tsx`:
- Container component
- Conditional rendering:
  - Loading → SkeletonList
  - Error → ErrorState
  - Empty → EmptyState
  - Success → Grid z RckikCard × N
- Wrap w ErrorBoundary

### Faza 5: Główna strona Astro (1 dzień)

#### Krok 21: index.astro page

Utwórz `src/pages/rckik/index.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SEO from '@/components/SEO.astro';
import { fetchRckikList, fetchAvailableCities } from '@/lib/api/endpoints/rckik';
import type { RckikSearchParams } from '@/types/rckik';
import { DEFAULT_RCKIK_SEARCH_PARAMS } from '@/types/rckik';

// Parse query params
const searchParams = Astro.url.searchParams;
const params: RckikSearchParams = {
  page: Math.max(0, parseInt(searchParams.get('page') || '0')),
  size: Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20'))),
  search: searchParams.get('search') || '',
  city: searchParams.get('city') || null,
  active: searchParams.get('active') !== 'false',
  sortBy: (searchParams.get('sortBy') as any) || 'name',
  sortOrder: (searchParams.get('sortOrder') as any) || 'ASC'
};

// Fetch initial data (SSR)
let initialData = null;
let fetchError = null;
let availableCities: string[] = [];

try {
  [initialData, availableCities] = await Promise.all([
    fetchRckikList(params),
    fetchAvailableCities()
  ]);
} catch (error) {
  fetchError = error;
  console.error('Failed to fetch RCKiK list:', error);
}

// ISR config
export const prerender = true;
export const revalidate = 300; // 5 minutes
---

<BaseLayout>
  <SEO
    slot="head"
    title="Centra krwiodawstwa w Polsce - Aktualne stany krwi | mkrew"
    description="Przeglądaj listę centrów krwiodawstwa (RCKiK) w Polsce. Sprawdź aktualne stany zapasów krwi i znajdź najbliższe centrum."
    ogType="website"
  />

  <main class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <header class="mb-8">
      <h1 class="text-4xl font-bold mb-2">Centra krwiodawstwa w Polsce</h1>
      <p class="text-gray-600">
        Przeglądaj aktualne stany zapasów krwi we wszystkich centrach RCKiK w Polsce
      </p>
    </header>

    <!-- React islands (interactive components) -->
    <div id="rckik-list-app"
         data-initial-data={JSON.stringify(initialData)}
         data-initial-params={JSON.stringify(params)}
         data-available-cities={JSON.stringify(availableCities)}
         data-fetch-error={fetchError ? JSON.stringify(fetchError.message) : null}
    >
      <!-- React will hydrate here -->
    </div>

    <!-- Import React app -->
    <script>
      import RckikListApp from '@/components/rckik/RckikListApp';
    </script>
  </main>
</BaseLayout>
```

#### Krok 22: RckikListApp (React root)

Utwórz `src/components/rckik/RckikListApp.tsx`:

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SearchBar } from './SearchBar';
import { FiltersPanel } from './FiltersPanel';
import { RckikList } from './RckikList';
import { Pagination } from './Pagination';
import { useRckikList } from '@/lib/hooks/useRckikList';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

export default function RckikListApp() {
  const isMobile = useIsMobile();

  // Parse initial data z data attributes (hydration)
  const appElement = document.getElementById('rckik-list-app');
  const initialData = JSON.parse(appElement?.dataset.initialData || 'null');
  const initialParams = JSON.parse(appElement?.dataset.initialParams || '{}');
  const availableCities = JSON.parse(appElement?.dataset.availableCities || '[]');

  // Main hook
  const { data, loading, error, params, updateParams, refetch } = useRckikList(initialData);

  return (
    <ErrorBoundary>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters - Sidebar na desktop, drawer na mobile */}
        <aside className="lg:w-64">
          <FiltersPanel
            initialFilters={params}
            availableCities={availableCities}
            onFiltersChange={(filters) => updateParams(filters)}
            isMobile={isMobile}
            isOpen={false} // manage drawer state
            onClose={() => {}}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Search */}
          <div className="mb-6">
            <SearchBar
              initialValue={params.search}
              onSearchChange={(search) => updateParams({ search })}
              placeholder="Szukaj centrum po nazwie..."
            />
          </div>

          {/* Results info */}
          {data && !loading && (
            <div className="mb-4 text-gray-600">
              Znaleziono <strong>{data.totalElements}</strong> {data.totalElements === 1 ? 'centrum' : 'centrów'}
            </div>
          )}

          {/* List */}
          <RckikList data={data} loading={loading} error={error} />

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={params.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                isFirst={data.first}
                isLast={data.last}
                pageSize={params.size}
                onPageChange={(page) => updateParams({ page })}
                onPageSizeChange={(size) => updateParams({ size, page: 0 })}
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

### Faza 6: Stylowanie i responsywność (2 dni)

#### Krok 23: Tailwind CSS setup

- Skonfiguruj Tailwind w `tailwind.config.cjs`
- Zdefiniuj custom colors dla blood level statuses:
  ```js
  colors: {
    critical: { 100: '#fee2e2', 300: '#fca5a5', 800: '#991b1b' },
    important: { 100: '#ffedd5', 300: '#fdba74', 800: '#9a3412' },
    ok: { 100: '#dcfce7', 300: '#86efac', 800: '#166534' }
  }
  ```

#### Krok 24: Responsive design

- Mobile (<768px):
  - FiltersPanel jako drawer (slide-in)
  - BloodLevelsGrid: 2 kolumny
  - Pagination: uproszczona (tylko prev/next)
  - SearchBar: full width

- Tablet (768-1024px):
  - FiltersPanel jako sidebar (collapsible)
  - BloodLevelsGrid: 3-4 kolumny

- Desktop (>1024px):
  - FiltersPanel: fixed sidebar
  - BloodLevelsGrid: 4 kolumny
  - Full pagination z page numbers

#### Krok 25: Animacje i transitions

- Hover effects na RckikCard (elevation)
- Focus states widoczne (outline)
- Skeleton shimmer animation (gradient)
- Drawer slide-in animation (transform)
- Smooth scrolling

#### Krok 26: Dark mode (opcjonalnie)

Jeśli aplikacja wspiera dark mode:
- Dostosuj kolory dla dark theme
- Use Tailwind `dark:` variants
- Blood level colors dostosowane (kontrast)

### Faza 7: Accessibility i SEO (1 dzień)

#### Krok 27: Accessibility audit

- **Semantic HTML**: H1-H6 hierarchy, `<main>`, `<nav>`, `<section>`, `<article>`
- **ARIA labels**: dla interaktywnych elementów bez visible text
- **Keyboard navigation**: Tab order logiczny, focus indicators
- **Screen reader testing**: NVDA/JAWS/VoiceOver
- **Color contrast**: min 4.5:1 (WCAG AA)
- **Alt texts**: dla wszystkich ikon (jeśli decorative: `alt=""`)
- **Form labels**: visible lub aria-labelledby
- **Status messages**: aria-live dla toastów/errors
- Test z axe DevTools: 0 critical issues

#### Krok 28: SEO optimization

- **Meta tags**: title, description, OG tags (SEO component)
- **Structured data**: JSON-LD dla RCKiK (optional)
  ```json
  {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "RCKiK Warszawa",
    "address": "ul. Kasprzaka 17, Warszawa"
  }
  ```
- **Canonical URL**: `<link rel="canonical" href="https://mkrew.pl/rckik" />`
- **Robots.txt**: allow `/rckik`
- **Sitemap.xml**: include `/rckik` page
- **Open Graph**: image, title, description dla social sharing
- **Performance**: Lighthouse audit >90

#### Krok 29: Performance optimization

- **Image optimization**: WebP, lazy loading
- **Code splitting**: dynamic imports dla heavy components
- **Virtualization**: jeśli lista >50 elementów (react-window)
- **Debounce**: search input (500ms)
- **ISR cache**: 5 minut revalidation
- **Bundle size**: analyze z `vite-bundle-analyzer`
- **Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### Faza 8: Testowanie (2 dni)

#### Krok 30: Unit tests

Użyj Vitest + React Testing Library.

Testy dla komponentów:
- `BloodLevelBadge.test.tsx`: renderowanie z różnymi statusami
- `RckikCard.test.tsx`: renderowanie danych, conditional DataStatusBadge
- `SearchBar.test.tsx`: debounce, onChange callback
- `Pagination.test.tsx`: disabled states, callbacks

```typescript
// Example: BloodLevelBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { BloodLevelBadge } from './BloodLevelBadge';

describe('BloodLevelBadge', () => {
  it('renders critical status correctly', () => {
    const bloodLevel = {
      bloodGroup: 'A+',
      levelPercentage: 15.0,
      levelStatus: 'CRITICAL',
      lastUpdate: '2025-01-08T02:30:00'
    };

    render(<BloodLevelBadge bloodLevel={bloodLevel} />);

    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(screen.getByText('15.0%')).toBeInTheDocument();
    expect(screen.getByText('Krytyczny poziom')).toBeInTheDocument(); // visually hidden
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'alert-circle');
  });
});
```

#### Krok 31: Integration tests

Użyj MSW (Mock Service Worker) dla mock API.

Test scenariuszy:
- Fetch lista RCKiK → render cards
- Search → debounce → API call → update list
- Filter by city → API call → filtered list
- Pagination → API call → next page
- Error handling → render ErrorState

```typescript
// Example: RckikList.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import RckikListApp from './RckikListApp';

const server = setupServer(
  rest.get('/api/v1/rckik', (req, res, ctx) => {
    return res(ctx.json({
      content: [{ id: 1, name: 'RCKiK Warszawa', /* ... */ }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders RCKiK list and allows search', async () => {
  render(<RckikListApp />);

  await waitFor(() => {
    expect(screen.getByText('RCKiK Warszawa')).toBeInTheDocument();
  });

  const searchInput = screen.getByPlaceholderText('Szukaj...');
  await userEvent.type(searchInput, 'Kraków');

  // Debounce wait
  await waitFor(() => {
    expect(screen.getByText('Znaleziono 0 centrów')).toBeInTheDocument();
  }, { timeout: 1000 });
});
```

#### Krok 32: E2E tests

Użyj Playwright.

Test flows:
- User otwiera `/rckik` → widzi listę
- User wpisuje search → lista się filtruje
- User wybiera miasto z filtru → lista się filtruje
- User klika Next page → przechodzi na stronę 2
- User klika RckikCard → przechodzi do `/rckik/{id}`
- User resetuje filtry → wraca do pełnej listy

```typescript
// Example: rckik.spec.ts
import { test, expect } from '@playwright/test';

test('user can browse and filter RCKiK list', async ({ page }) => {
  await page.goto('/rckik');

  // Lista widoczna
  await expect(page.getByRole('heading', { name: 'Centra krwiodawstwa w Polsce' })).toBeVisible();

  // Wpisz w search
  await page.fill('input[placeholder*="Szukaj"]', 'Warszawa');
  await page.waitForTimeout(600); // debounce

  // Check URL updated
  await expect(page).toHaveURL(/search=Warszawa/);

  // Check filtered results
  await expect(page.getByText(/RCKiK Warszawa/)).toBeVisible();

  // Click na kartę
  await page.click('text=RCKiK Warszawa');
  await expect(page).toHaveURL(/\/rckik\/\d+/);
});
```

#### Krok 33: Visual regression tests

Użyj Chromatic lub Percy (opcjonalnie).

Capture screenshots dla:
- Lista RCKiK (default state)
- Lista z filtrem aktywnym
- Empty state
- Error state
- Loading skeletons
- Mobile vs Desktop views

#### Krok 34: Accessibility tests

Automated axe tests:

```typescript
import { axe } from 'jest-axe';

test('RckikList has no accessibility violations', async () => {
  const { container } = render(<RckikList data={mockData} loading={false} error={null} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Manual testing:
- Keyboard navigation (Tab through wszystkie elementy)
- Screen reader (NVDA: czyta wszystkie labels, blood levels, status)
- Zoom 200% (layout nie psuje się)

### Faza 9: Dokumentacja i code review (1 dzień)

#### Krok 35: Dokumentacja komponentów

Dodaj JSDoc komentarze do wszystkich komponentów:

```typescript
/**
 * Wyświetla badge dla poziomu konkretnej grupy krwi.
 * Używa kolorów, ikon i tekstu dla pełnej dostępności (WCAG 2.1 AA).
 *
 * @param bloodLevel - Obiekt z danymi poziomu krwi
 * @param size - Opcjonalny rozmiar badge ('small' | 'medium' | 'large')
 *
 * @example
 * <BloodLevelBadge
 *   bloodLevel={{ bloodGroup: 'A+', levelPercentage: 45.5, levelStatus: 'IMPORTANT', lastUpdate: '...' }}
 *   size="medium"
 * />
 */
export function BloodLevelBadge({ bloodLevel, size = 'medium' }: BloodLevelBadgeProps) {
  // ...
}
```

#### Krok 36: README

Utwórz `docs/rckik-list-view.md` z:
- Overview widoku
- Struktura komponentów
- API integration
- Instrukcje rozwoju (jak dodać nowy filtr, etc.)
- Troubleshooting

#### Krok 37: Code review

Checklist:
- TypeScript: brak `any`, wszystkie typy zdefiniowane
- Naming: consistent, descriptive
- Comments: tylko dla complex logic, nie oczywistości
- Accessibility: ARIA labels, semantic HTML
- Performance: debounce, virtualization, lazy loading
- Error handling: wszystkie fetch z try/catch
- Tests: coverage >80%
- Linting: ESLint passed, Prettier formatted

#### Krok 38: Performance audit

- Lighthouse audit: Performance, Accessibility, Best Practices, SEO
- Bundle size: analyze, optymalizuj jeśli >500KB
- Network: cache headers, compression
- Images: optimized (WebP, lazy load)

### Faza 10: Deployment (0.5 dnia)

#### Krok 39: Build production

```bash
npm run build
```

Verify:
- Build succeeds
- No TypeScript errors
- No ESLint errors
- Bundle size acceptable
- ISR config applied (revalidate: 300)

#### Krok 40: Deploy to staging

- Deploy na GCP staging environment
- Smoke test:
  - Otwórz `/rckik`
  - Verify lista renderuje się
  - Test filtry, search, pagination
  - Test mobile responsive
- Check Lighthouse audit na staging

#### Krok 41: Deploy to production

- Merge do main branch
- CI/CD pipeline automatycznie deploy
- Smoke test na production:
  - Verify wszystkie funkcjonalności działają
  - Check ISR cache działa (5 min revalidation)
  - Monitor error rate (Sentry)
- Komunikat do zespołu: "Lista RCKiK view deployed"

#### Krok 42: Post-deployment monitoring

Pierwsze 24h po deploy:
- Monitor error rate w Sentry (cel: <1%)
- Check performance metrics (LCP, FID, CLS)
- User feedback (jeśli dostępne)
- Fix critical bugs natychmiast

---

## Podsumowanie timeline

- **Faza 1**: Setup i typy (1 dzień)
- **Faza 2**: UI primitives (1-2 dni)
- **Faza 3**: Komponenty RCKiK (2-3 dni)
- **Faza 4**: Layout i conditional (1 dzień)
- **Faza 5**: Główna strona Astro (1 dzień)
- **Faza 6**: Stylowanie (2 dni)
- **Faza 7**: Accessibility + SEO (1 dzień)
- **Faza 8**: Testowanie (2 dni)
- **Faza 9**: Dokumentacja (1 dzień)
- **Faza 10**: Deployment (0.5 dnia)

**Całkowity szacowany czas: 12-14 dni roboczych** (2.5-3 tygodnie dla jednego dewelopera)

---

## Dodatkowe uwagi

### Performance best practices

- **ISR cache**: 5 minut dla świeżości danych vs performance
- **Debounce search**: 500ms (balance między responsiveness a API load)
- **Virtualization**: Implementuj jeśli regularne listy mają >50 elementów (dla MVP: pagination wystarczy)
- **Lazy loading**: Images, heavy components (chart libraries)
- **Code splitting**: Dynamic imports dla non-critical components

### Accessibility best practices

- **Color nie jedyne wskazanie**: Zawsze ikona + tekst obok koloru
- **Keyboard navigation**: Tab order logiczny, focus visible
- **Screen readers**: Wszystkie interactive elements z labels
- **ARIA live regions**: Dla dynamic content updates (search results, errors)
- **Skip links**: "Skip to main content" na początku strony

### Future enhancements (post-MVP)

1. **Map view**: Toggle między listą a mapą (Leaflet/Mapbox)
2. **Infinite scroll**: Alternatywa dla pagination
3. **Advanced filters**: Multi-select blood groups, distance radius
4. **Save filters**: Zapamiętaj preferencje użytkownika (localStorage)
5. **Export list**: CSV export filtered list
6. **Compare centers**: Multi-select dla porównania poziomów
7. **Real-time updates**: WebSocket dla live blood levels
8. **Geolocation**: "Find nearest RCKiK" (user's location)
