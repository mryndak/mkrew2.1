# Favorites View Components

Komponenty widoku Ulubione - zarządzanie ulubionymi centrami krwiodawstwa.

## Struktura komponentów

```
FavoritesView (główny kontener)
│
├── FavoritesHeader
│   ├── Tytuł i licznik ulubionych
│   └── Przycisk "Dodaj centrum"
│
├── FavoritesList (z drag-and-drop)
│   └── FavoriteCardItem (x N)
│       ├── Drag Handle
│       ├── Informacje o centrum
│       ├── BloodLevelBadge (x 8)
│       ├── Przycisk "Zobacz szczegóły"
│       └── Przycisk "Usuń" → ConfirmModal
│
├── EmptyState
│   ├── Ikona
│   ├── Komunikat
│   ├── Lista korzyści
│   └── CTA button
│
└── Toaster (sonner notifications)
```

## Komponenty

### FavoritesView
Główny kontener widoku ulubionych.

**Features:**
- Automatyczne pobieranie z Redux (`fetchFavorites`)
- Loading skeleton
- Error state z retry
- Warunkowe renderowanie (EmptyState vs FavoritesList)
- Toast notifications

**Props:** Brak

### FavoritesHeader
Nagłówek z tytułem i przyciskiem dodawania.

**Props:**
- `favoritesCount: number` - liczba ulubionych
- `maxLimit?: number` - limit maksymalny (default: 10)

### FavoritesList
Lista ulubionych z drag-and-drop (@dnd-kit).

**Features:**
- Drag-and-drop (mouse, touch, keyboard)
- Grid layout responsywny (1/2/3 kolumny)
- Optimistic updates z rollback
- Auto-save po upuszczeniu
- DragOverlay

**Props:**
- `favorites: FavoriteRckikDto[]` - lista ulubionych

### FavoriteCardItem
Karta pojedynczego ulubionego centrum.

**Features:**
- Sortable (useSortable)
- Drag handle z ikoną
- Informacje: nazwa, miasto, kod, adres, priorytet
- BloodLevelBadge x 8 (grupy krwi)
- Alert dla krytycznych poziomów
- Przycisk "Zobacz szczegóły" → `/rckik/[id]`
- Przycisk "Usuń" z modalem
- Optimistic update przy usuwaniu

**Props:**
- `favorite: FavoriteRckikDto` - dane centrum
- `index: number` - pozycja na liście

### EmptyState
Stan pusty dla użytkowników bez ulubionych.

**Features:**
- Ikona serca
- Komunikat zachęcający
- Lista 4 korzyści
- CTA button → `/rckik`

**Props:** Brak

### ConfirmModal
Uniwersalny modal potwierdzenia.

**Features:**
- Backdrop z kliknięciem
- ESC key zamknięcie
- Destructive mode (czerwony przycisk)
- Animacje
- Focus trap
- ARIA accessibility

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `onConfirm: () => void`
- `title: string`
- `message: string`
- `confirmText?: string` (default: "Potwierdź")
- `cancelText?: string` (default: "Anuluj")
- `isDestructive?: boolean` (default: false)

## Użycie

### Import
```tsx
import { FavoritesView } from '@/components/dashboard/favorites';
// lub
import { FavoritesView } from '@/components/dashboard/favorites/FavoritesView';
```

### W Astro
```astro
---
import { FavoritesView } from '@/components/dashboard/favorites/FavoritesView';
import { ReduxProvider } from '@/components/common/ReduxProvider';
---

<ReduxProvider client:only="react">
  <FavoritesView client:only="react" />
</ReduxProvider>
```

## Zależności

- `@dnd-kit/core` - drag-and-drop core
- `@dnd-kit/sortable` - sortable functionality
- `@dnd-kit/utilities` - utility functions
- `sonner` - toast notifications
- `@reduxjs/toolkit` - state management
- `react-redux` - Redux bindings

## Redux Integration

### Slice: `favoritesSlice`

**Selectors:**
- `selectFavorites` - lista ulubionych
- `selectFavoritesLoading` - status ładowania
- `selectFavoritesError` - błędy

**Thunks:**
- `fetchFavorites()` - pobierz listę
- `updateFavoritesOrder(newOrder)` - zapisz kolejność
- `removeFavorite(rckikId)` - usuń z ulubionych

**Actions:**
- `reorderFavoritesOptimistic(newOrder)` - optimistic reorder
- `rollbackReorder(previousOrder)` - rollback reorder
- `optimisticRemoveFavorite(rckikId)` - optimistic remove
- `rollbackOptimisticUpdate({ rckikId, wasAdded })` - rollback remove

## API Endpoints

- `GET /api/v1/users/me/favorites` - pobierz ulubione
- `PATCH /api/v1/users/me/favorites` - aktualizuj kolejność
- `DELETE /api/v1/users/me/favorites/{rckikId}` - usuń z ulubionych

## Accessibility

- Keyboard navigation dla drag-and-drop (Space/Enter + Arrow keys)
- ARIA labels na wszystkich interaktywnych elementach
- Focus states i focus trap w modalu
- Screen reader friendly

## Mobile Support

- Touch events dla drag-and-drop
- Responsywny grid layout
- Optimized dla małych ekranów
- Swipe gestures (via @dnd-kit TouchSensor)

## Performance

- Optimistic updates (brak czekania na API)
- Memoization w przyszłości (jeśli potrzebne)
- Lazy loading (via Astro client:only)
- Debouncing reorder API calls (auto-save)
