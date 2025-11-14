# Widok Szczegółów RCKiK

Widok prezentujący pełne informacje o wybranym centrum krwiodawstwa.

## 📍 Routing

**Ścieżka:** `/rckik/[id]`

**Przykłady:**
- `/rckik/1` - Szczegóły RCKiK Warszawa
- `/rckik/15` - Szczegóły RCKiK Kraków

## 🎯 User Story

**US-008:** "Szczegóły RCKiK: Jako użytkownik chcę zobaczyć szczegóły konkretnego RCKiK, historię snapshotów i trend."

## 📦 Komponenty

### Główna strona
- **Plik:** `[id].astro`
- **Typ:** SSG (Static Site Generation) z ISR
- **Dostęp:** Publiczny (bez wymaganego logowania)

### Komponenty React (client islands)

1. **RckikHeader** (`client:load`)
   - Nagłówek z nazwą, adresem, kodem
   - Przycisk "Dodaj do ulubionych"
   - Link do mapy Google Maps

2. **BloodLevelBadge** (używane w grid)
   - 8 badge'ów dla grup krwi (0+, 0-, A+, A-, B+, B-, AB+, AB-)
   - Kolorowe oznaczenie statusu (CRITICAL, IMPORTANT, OK)

3. **BloodLevelChart** (`client:visible`)
   - Wykres trendu dla wybranej grupy krwi
   - Selector grup krwi
   - Dane z ostatnich 30 dni
   - Biblioteka: Recharts

4. **HistoryTable** (`client:idle`)
   - Tabela historycznych snapshotów
   - Filtry: grupa krwi, zakres dat
   - Sortowanie i paginacja

5. **ScraperStatus** (`client:load`)
   - Status ostatniego scrapingu
   - Link do zgłaszania problemów

## 🔄 Strategia renderowania

### SSG (Static Site Generation)
- Strony generowane podczas build time
- `getStaticPaths()` pobiera listę wszystkich centrów z API
- Fallback na hardcoded IDs jeśli backend niedostępny

### ISR (Incremental Static Regeneration)
- **Konfiguracja:** `export const prerender = true`
- **Wymaga:** Adapter (@astrojs/node lub @astrojs/vercel)
- **Rewalidacja:** Co 5 minut (gdy adapter skonfigurowany)
- **Aktualnie:** Static generation bez rewalidacji

## 🔌 Integracja API

### Endpoints używane

1. **GET /api/v1/rckik/{id}**
   - Pobiera szczegóły centrum
   - Zawiera: dane podstawowe, aktualne poziomy krwi, status scrapera

2. **GET /api/v1/rckik/{id}/blood-levels**
   - Pobiera historyczne snapshoty
   - Parametry: bloodGroup, fromDate, toDate, page, size

3. **GET /api/v1/users/me/favorites** (dla zalogowanych)
   - Sprawdza czy centrum jest w ulubionych

4. **POST /api/v1/users/me/favorites** (dla zalogowanych)
   - Dodaje centrum do ulubionych

5. **DELETE /api/v1/users/me/favorites/{rckikId}** (dla zalogowanych)
   - Usuwa centrum z ulubionych

## 🔐 Autentykacja

- **Sprawdzanie:** Przez cookies (`accessToken`)
- **Opcjonalne:** Widok dostępny publicznie
- **Funkcje dla zalogowanych:**
  - Dodawanie/usuwanie z ulubionych
  - Sprawdzanie czy centrum w ulubionych

## 📊 Stan i dane

### Redux State
- **authSlice:** Stan uwierzytelnienia
- **favoritesSlice:** Lista ulubionych centrów (optimistic updates)

### Local State (React hooks)
- **useBloodLevelHistory:** Fetch historii z API
- **useFavoriteToggle:** Toggle ulubionych z optimistic update
- **useAuth:** Stan uwierzytelnienia

## 🎨 Stylowanie

- **Framework:** Tailwind CSS
- **Responsywność:**
  - Mobile: 1 kolumna, grid 2x4 dla badge'ów
  - Tablet/Desktop: Grid 4x2 dla badge'ów
- **Dark mode:** Nie zaimplementowany (future)

## ♿ Accessibility

- **Semantic HTML:** `<header>`, `<main>`, `<section>`, `<address>`
- **ARIA labels:** Na przyciskach bez tekstu
- **Keyboard navigation:** Focus visible, Tab navigation
- **Screen readers:** Proper labels i live regions

## 🧪 Testowanie

### Obsługiwane stany

1. **Loading states:**
   - Skeleton dla wykresu
   - Skeleton rows dla tabeli
   - Spinner w przyciskach

2. **Error states:**
   - Network error z retry button
   - 404 dla nieistniejących centrów
   - API errors z komunikatami

3. **Empty states:**
   - Brak danych historycznych
   - Brak snapshotów w tabeli
   - Brak aktualnych poziomów krwi

### Edge cases

- ID nieprawidłowe (redirect 404)
- Backend niedostępny (fallback na mock)
- Brak danych dla grupy krwi (empty state)
- Niezalogowany użytkownik (redirect do login)
- Błąd podczas dodawania do ulubionych (rollback)

## 📝 Przykład użycia

```typescript
// W Astro page
---
import { RckikHeader } from '@/components/rckik/details/RckikHeader';
import { BloodLevelChart } from '@/components/rckik/details/BloodLevelChart';

const rckik = await fetchRckikDetails(id);
const isAuthenticated = !!Astro.cookies.get('accessToken')?.value;
---

<RckikHeader
  rckik={rckik}
  isAuthenticated={isAuthenticated}
  client:load
/>

<BloodLevelChart
  rckikId={rckik.id}
  initialBloodGroup="0+"
  client:visible
/>
```

## 🚀 Deployment

### Development
```bash
npm run dev
# Odwiedź http://localhost:4321/rckik/1
```

### Production Build
```bash
npm run build
# Generuje static pages dla wszystkich centrów
```

### Wymagania dla ISR
1. Zainstaluj adapter: `npm install @astrojs/node`
2. Skonfiguruj w `astro.config.mjs`:
   ```js
   import node from '@astrojs/node';

   export default defineConfig({
     output: 'hybrid',
     adapter: node({ mode: 'standalone' }),
   });
   ```
3. Deploy na platformie wspierającej Node.js

## 📚 Dokumentacja

- **Plan implementacji:** `.ai/rckik-details-view-implementation-plan.md`
- **Szczegóły komponentów:** `frontend/src/components/rckik/details/README.md`
- **Typy:** `frontend/src/types/rckik.ts`
- **API endpoints:** `frontend/src/lib/api/endpoints/rckik.ts`

## ✅ Checklist implementacji

- [x] Struktura plików
- [x] Typy TypeScript
- [x] API client functions
- [x] Redux slices (auth, favorites)
- [x] Custom hooks
- [x] UI components (Badge, Button, etc.)
- [x] RckikHeader
- [x] BloodLevelBadge
- [x] BloodGroupSelector
- [x] BloodLevelChart
- [x] HistoryTable
- [x] ScraperStatus
- [x] FavoriteButton
- [x] Breadcrumbs
- [x] Astro page z SSG
- [x] Integracja API
- [x] Autentykacja
- [x] Error handling
- [x] Loading states
- [x] Responsive design
- [x] Accessibility
- [ ] ISR z adapterem (wymaga konfiguracji)
- [ ] Testy jednostkowe
- [ ] E2E testy
- [ ] Toast notifications (wymaga biblioteki)

## 🐛 Znane ograniczenia

1. **ISR:** Wymaga adaptera, obecnie tylko SSG
2. **Toast notifications:** Console.log fallback, wymaga react-hot-toast
3. **Mock data:** Używane gdy backend niedostępny w development

## 🔮 Future improvements

- [ ] Dodać adapter dla pełnego ISR
- [ ] Zintegrować react-hot-toast
- [ ] Dodać testy jednostkowe
- [ ] Dodać E2E testy (Playwright)
- [ ] Dark mode support
- [ ] PWA support
- [ ] Offline mode
- [ ] Cache strategia (Service Worker)
