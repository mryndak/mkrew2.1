# Stan Implementacji Widoków RCKiK - Dokumentacja E2E

**Data aktualizacji:** 2025-11-16
**Status:** Widoki częściowo zaimplementowane

## 📋 Przegląd

Niniejszy dokument opisuje faktyczny stan implementacji widoków RCKiK (Lista i Szczegóły) w projekcie mkrew, oraz dostosowanie testów E2E do obecnej struktury.

## 🏗️ Widok Listy RCKiK (`/rckik`)

### Struktura Strony (index.astro)

**Plik:** `frontend/src/pages/rckik/index.astro`

```astro
<Layout>
  <header>
    <h1>Centra krwiodawstwa w Polsce</h1>
    <p>Przeglądaj aktualne stany zapasów krwi...</p>
  </header>

  <RckikListApp
    client:load
    initialData={...}
    initialParams={...}
    availableCities={...}
  />
</Layout>
```

### Komponenty Zaimplementowane

#### 1. **RckikListApp** (React Component)
- **Lokalizacja:** `frontend/src/components/rckik/RckikListApp.tsx`
- **Odpowiedzialność:** Główny kontener, zarządza stanem, integruje wszystkie podkomponenty
- **Hook:** `useRckikList()` - zarządza stanem listy, fetching, URL sync

#### 2. **SearchBar**
- **Lokalizacja:** `frontend/src/components/rckik/SearchBar.tsx`
- **Elementy:**
  - `input#rckik-search` - pole wyszukiwania
  - `button[aria-label="Wyczyść wyszukiwanie"]` - przycisk clear (warunkowy)
  - `p:has-text("Wyszukiwanie...")` - indicator loadingu (debounce 500ms)
- **Funkcjonalność:**
  - Debounce 500ms
  - Clear button (pokazywany gdy input niepusty)
  - Enter key skip debounce

#### 3. **FiltersPanel**
- **Lokalizacja:** `frontend/src/components/rckik/FiltersPanel.tsx`
- **Elementy:**
  - `aside[aria-label="Filtry listy centrów"]` - panel/drawer
  - `select` - sortowanie według (Nazwa/Miasto/Kod)
  - `button[aria-label*="Sortowanie"]` - toggle ASC/DESC
  - `button:has-text("Resetuj filtry")` - reset filtrów
- **Tryby:**
  - **Desktop:** Sidebar panel
  - **Mobile:** Drawer z overlay
- **Brak:** Filtr miasta (city filter) - nie zaimplementowany

#### 4. **RckikList**
- **Lokalizacja:** `frontend/src/components/rckik/RckikList.tsx`
- **Conditional Rendering:**
  - **Loading:** `<SkeletonList count={10} />`
  - **Error:** `<ErrorState />` z przyciskiem retry
  - **Empty:** `<EmptyState />` - "Nie znaleziono centrów"
  - **Success:** Grid z kartami `<RckikCard />`

#### 5. **RckikCard**
- **Lokalizacja:** `frontend/src/components/rckik/RckikCard.tsx`
- **Struktura:**
  ```html
  <article class="card">
    <a href="/rckik/{id}">
      <header>
        <h2>{nazwa centrum}</h2>
        <DataStatusBadge /> <!-- warunkowy -->
        <span>{kod}</span>
        <span>{miasto}</span>
      </header>

      <address>{adres}</address>

      <div class="grid grid-cols-2 sm:grid-cols-4">
        <BloodLevelBadge /> × 8
      </div>

      <footer>
        <time>{lastUpdate}</time>
      </footer>
    </a>
  </article>
  ```

#### 6. **Pagination**
- **Lokalizacja:** `frontend/src/components/rckik/Pagination.tsx`
- **Elementy:**
  - `nav[aria-label*="Paginacja"]` - kontener
  - `button[aria-label="Poprzednia strona"]` - Previous
  - `button[aria-label="Następna strona"]` - Next
  - `button[aria-label*="Strona"]` - Numery stron
  - `select#page-size` - Rozmiar strony (10/20/50)
  - `div.text-sm` - Info o wynikach ("Wyświetlanie 1-20 z 45 centrów")

### Routing i URL Params

Widok synchronizuje parametry z URL:
- `?search={query}` - wyszukiwanie
- `?sortBy={name|city|code}` - sortowanie według
- `?sortOrder={ASC|DESC}` - kierunek sortowania
- `?page={number}` - numer strony (0-indexed)
- `?size={number}` - rozmiar strony
- `?active={true|false}` - tylko aktywne centra

**Brak:** Filtr `city` w URL (nie zaimplementowany)

---

## 🔍 Widok Szczegółów RCKiK (`/rckik/[id]`)

### Struktura Strony ([id].astro)

**Plik:** `frontend/src/pages/rckik/[id].astro`

```astro
<Layout>
  <main>
    <!-- Breadcrumbs -->
    <Breadcrumbs items={[...]} />

    <!-- Header -->
    <RckikHeader
      rckik={...}
      isFavorite={...}
      isAuthenticated={...}
      client:load
    />

    <!-- Sekcja 1: Aktualne Stany Krwi -->
    <section>
      <h2>Aktualne stany krwi</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <BloodLevelBadge size="large" /> × 8
      </div>
      <p>Ostatnia aktualizacja: {timestamp}</p>
    </section>

    <!-- Sekcja 2: Wykres Trendu -->
    <section>
      <BloodLevelChart
        rckikId={...}
        initialBloodGroup="0+"
        client:visible
      />
    </section>

    <!-- Sekcja 3: Tabela Historii -->
    <section>
      <HistoryTable
        rckikId={...}
        initialPage={0}
        initialPageSize={20}
        client:idle
      />
    </section>

    <!-- Sekcja 4: Status Scrapera -->
    <section>
      <ScraperStatus
        lastSuccessfulScrape={...}
        scrapingStatus={...}
      />
    </section>
  </main>
</Layout>
```

### Komponenty Zaimplementowane

#### 1. **Breadcrumbs**
- **Lokalizacja:** `frontend/src/components/common/Breadcrumbs.astro`
- **Elementy:**
  - `nav` - kontener (pierwszy nav na stronie)
  - `a:has-text("Lista RCKiK")` - link do listy
  - `a:has-text("Strona główna")` - link do home

#### 2. **RckikHeader** (React Component)
- **Lokalizacja:** `frontend/src/components/rckik/details/RckikHeader.tsx`
- **Elementy:**
  - `h1` - nazwa centrum
  - `p:has-text("Kod:")` - kod centrum
  - `address` - adres centrum
  - `a[href*="google.com/maps"]` - link do mapy (Google Maps)
  - `span:has-text("Aktywne")` lub `span:has-text("Nieaktywne")` - Badge statusu
  - `button[aria-label*="ulubiony"]` - FavoriteButton
- **Funkcjonalność:**
  - FavoriteButton: przekierowanie do login gdy niezalogowany
  - Link do mapy: opens in new tab

#### 3. **Current Blood Levels Section** (Static Astro)
- **Elementy:**
  - `h2:has-text("Aktualne stany krwi")` - nagłówek sekcji
  - `.grid` - grid z badge'ami
  - `> div` - BloodLevelBadge × 8 (size="large")
  - `p:has-text("Ostatnia aktualizacja")` - timestamp
  - `p:has-text("Brak aktualnych danych")` - empty state (warunkowy)

#### 4. **BloodLevelChart** (React Component)
- **Lokalizacja:** `frontend/src/components/rckik/details/BloodLevelChart.tsx`
- **Elementy:**
  - `h2` - nagłówek "Trend poziomów krwi" lub podobny
  - `[role="group"]` - BloodGroupSelector (przyciski grup krwi)
  - `button` × 8 - przyciski grup krwi (0+, 0-, A+, A-, B+, B-, AB+, AB-)
  - `.recharts-wrapper` - wykres (Recharts LineChart)
  - Empty/Error states
- **Funkcjonalność:**
  - Wybór grupy krwi → fetching danych → update wykresu
  - Ostatnie 30 dni danych
  - Reference lines dla progów (20% krytyczny, 50% ważny)

#### 5. **HistoryTable** (React Component)
- **Lokalizacja:** `frontend/src/components/rckik/details/HistoryTable.tsx`
- **Elementy:**
  - `h2` - nagłówek "Historia snapshotów" lub podobny
  - **Filtry:**
    - `select:has(option:has-text("A+"))` - filtr grupy krwi
    - `input[type="date"]` × 2 - zakres dat (from, to)
    - `button:has-text("Wyczyść")` - clear filters
  - `table` - tabela historii
  - `tbody tr` - wiersze danych
  - `nav[aria-label*="Paginacja"]` - paginacja tabeli
  - Empty state: `text="Brak danych historycznych"`
- **Kolumny:**
  - Data snapshotu
  - Grupa krwi
  - Poziom % (z badge statusu)
  - Status (badge tekstowy)
  - Czas pobrania
  - Źródło (Ręczne/Automatyczne)

#### 6. **ScraperStatus** (React Component)
- **Lokalizacja:** `frontend/src/components/rckik/details/ScraperStatus.tsx`
- **Elementy:**
  - `span` - Badge ze statusem (OK/DEGRADED/FAILED/UNKNOWN)
  - Timestamp ostatniego udanego scrapingu
  - Komunikat błędu (warunkowy)
  - Link do zgłoszenia problemu (warunkowy)
- **Warianty Badge:**
  - `OK` → success (green)
  - `DEGRADED` → warning (yellow)
  - `FAILED` → error (red)
  - `UNKNOWN` → neutral (gray)

### Renderowanie

- **SSG (Static Site Generation):** `prerender = true`
- **getStaticPaths():** Generuje strony dla wszystkich RCKiK (max 100)
- **Client-side Hydration:**
  - `RckikHeader` - `client:load`
  - `BloodLevelChart` - `client:visible`
  - `HistoryTable` - `client:idle`
  - `ScraperStatus` - `client:idle`

---

## ❌ Nieobecne Funkcjonalności

### Widok Listy
1. **Filtr miasta (city filter)** - nie zaimplementowany
   - FiltersPanel nie zawiera selecta dla miasta
   - Brak parametru `?city=` w URL
   - Tests założyły obecność filtru - muszą zostać pominięte lub usunięte

2. **Data-testid attributes** - brak dedykowanych atrybutów testowych
   - Testy polegają na aria-labels, semantic HTML, text selectors

### Widok Szczegółów
1. **Brak** dedykowanych data-testid attributes
2. **ShareButton** - nie zaimplementowany (założony w planach)

---

## 🔧 Dostosowanie Testów E2E

### Page Objects

#### RckikListPage - Zaktualizowane Lokatory
```typescript
// ✅ Zaimplementowane
searchInput = page.locator('input#rckik-search')
searchClearButton = page.locator('button[aria-label="Wyczyść wyszukiwanie"]')
sortByFilter = page.locator('select').first()
sortOrderToggle = page.locator('button[aria-label*="Sortowanie"]')
resetFiltersButton = page.locator('button:has-text("Resetuj filtry")')
rckikCards = page.locator('article.card')
paginationNext = page.locator('button[aria-label="Następna strona"]')
pageSizeSelector = page.locator('select#page-size')

// ❌ Nie zaimplementowane (usunięte z Page Object)
cityFilter - REMOVED
```

#### RckikDetailsPage - Zaktualizowane Lokatory
```typescript
// ✅ Zaimplementowane
pageHeading = page.locator('h1').first()
rckikCode = page.locator('p:has-text("Kod:")')
rckikAddress = page.locator('address').first()
bloodLevelBadges = page.locator('.grid').first().locator('> div')
bloodGroupButtons = page.locator('[role="group"]').locator('button')
bloodLevelChart = page.locator('.recharts-wrapper')
historyTable = page.locator('table')
scraperStatusBadge = page.locator('section').nth(4).locator('span').first()

// ❌ Nie zaimplementowane
shareButton - REMOVED
```

### Testy Do Aktualizacji

#### Testy do pominięcia (`.skip()`)
- `TC-RCKIK-LIST-08` - Filtr miasta (nie zaimplementowany)
- `TC-RCKIK-LIST-09` - Reset filtrów (wymaga aktualizacji - tylko search i sort)

#### Testy do dostosowania
- `TC-RCKIK-LIST-01` - ✅ Usunąć weryfikację cityFilter
- `TC-RCKIK-LIST-07` - ✅ EmptyState selector zaktualizowany
- `TC-RCKIK-LIST-19` - ✅ Usunąć parametr city z URL
- `TC-RCKIK-DETAILS-20` - ✅ ShareButton usunięty

---

## 🎯 Rekomendacje

### Dla Rozwoju
1. **Dodać data-testid attributes** podczas implementacji nowych feature'ów
2. **Implementować filtr miasta** w FiltersPanel (US-025)
3. **Dodać ShareButton** do RckikHeader (nice-to-have)

### Dla Testów
1. **Uruchamiać z `--workers=1`** aby uniknąć Rate Limiting (429)
2. **Unikać równoległego wykonywania testów** które wywołują wiele API requests
3. **Mockować API** dla stabilności testów CI/CD
4. **Pominąć testy** nieobecnych funkcjonalności do czasu implementacji

---

## 📝 Changelog

### 2025-11-16
- ✅ Zaktualizowano `RckikListPage.ts` - usunięto cityFilter
- ✅ Zaktualizowano `RckikDetailsPage.ts` - poprawione lokatory
- ✅ Dostosowano selektory do faktycznej struktury HTML
- ✅ Dodano komentarze o brakujących funkcjonalnościach
- ⏳ Oczekuje: Aktualizacja testów (.spec.ts files)

---

## 🔗 Powiązane Pliki

### Page Objects
- `e2e/page-objects/RckikListPage.ts`
- `e2e/page-objects/RckikDetailsPage.ts`
- `e2e/page-objects/BasePage.ts`

### Testy
- `e2e/tests/rckik-list.spec.ts` - 20 testów listy
- `e2e/tests/rckik-details.spec.ts` - 25 testów szczegółów
- `e2e/tests/rckik-flow.spec.ts` - 10 testów flow

### Komponenty
- `frontend/src/components/rckik/*.tsx`
- `frontend/src/components/rckik/details/*.tsx`
- `frontend/src/pages/rckik/index.astro`
- `frontend/src/pages/rckik/[id].astro`

### Hooks
- `frontend/src/lib/hooks/useRckikList.ts`
- `frontend/src/lib/hooks/useRckikDetails.ts`
- `frontend/src/lib/hooks/useBloodLevelHistory.ts`
