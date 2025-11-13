# Notifications View - Widok Powiadomień

Kompletny widok powiadomień in-app dla platformy mkrew, umożliwiający użytkownikom przeglądanie, zarządzanie i oznaczanie jako przeczytane powiadomień systemowych, w tym alertów o krytycznych stanach krwi w RCKiK.

## 📋 Spis treści

- [User Stories](#user-stories)
- [Funkcjonalności](#funkcjonalności)
- [Struktura komponentów](#struktura-komponentów)
- [API Integration](#api-integration)
- [Użycie](#użycie)
- [Typy](#typy)
- [Stylowanie](#stylowanie)
- [Accessibility](#accessibility)

---

## User Stories

**US-011: Powiadomienie in-app**
> Jako zalogowany użytkownik chcę zobaczyć alert w aplikacji przy następnym logowaniu, jeśli został wygenerowany krytyczny stan krwi w moich ulubionych centrach.

**US-010: Otrzymywanie powiadomień e-mail**
> Powiązane - powiadomienia in-app jako uzupełnienie powiadomień email.

**US-006: Ustawienia powiadomień**
> Zarządzanie preferencjami powiadomień (gotowe do integracji).

---

## Funkcjonalności

### ✅ Zarządzanie powiadomieniami
- Pobieranie listy powiadomień z paginacją
- Filtrowanie: Wszystkie / Nieprzeczytane
- Oznaczanie jako przeczytane (pojedynczo i masowo)
- **Optimistic updates** z rollback przy błędach
- Automatyczne odświeżanie licznika (polling co 30s)
- Toast notifications dla feedbacku użytkownika

### 🎨 UI/UX
- Grupowanie powiadomień po dniach (Dzisiaj, Wczoraj, data pełna)
- Relative timestamps po polsku ("5 minut temu", "2 godziny temu")
- Wizualne wyróżnienie nieprzeczytanych (bold, colored border, background)
- 4 typy ikon powiadomień z kolorami:
  - **CRITICAL_BLOOD_LEVEL** → Alert (red)
  - **DONATION_REMINDER** → Calendar (blue)
  - **SYSTEM_ALERT** → Info (yellow)
  - **OTHER** → Bell (gray)
- Link do akcji (linkUrl) z automatycznym mark-as-read
- Badge w navbar z licznikiem nieprzeczytanych
- Loading skeletons
- Empty states z kontekstowymi komunikatami

### 🔄 Real-time
- Polling w NotificationBell (odświeżanie co 30s)
- Refresh przy powrocie do zakładki (window focus event)
- Animacja pulse dla nowych powiadomień

### ♿ Accessibility
- Semantic HTML (`<time>`, `<nav>`, role attributes)
- ARIA labels i descriptions
- Keyboard navigation
- Screen reader support

### 📱 Responsywność
- Mobile-first design
- Desktop: badge w navbar
- Mobile: link "Powiadomienia" w menu mobilnym
- Responsive typography i spacing

---

## Struktura komponentów

```
NotificationsPage.astro (Routing)
└── NotificationsView.tsx (Main Container)
    ├── NotificationTabs.tsx (All/Unread)
    ├── MarkAllAsReadButton.tsx (Masowe oznaczanie)
    ├── NotificationList.tsx (Lista z grupowaniem)
    │   └── NotificationGroup.tsx[] (Grupa po dniu)
    │       └── NotificationItem.tsx[] (Pojedyncze powiadomienie)
    │           ├── NotificationIcon.tsx
    │           ├── NotificationTimestamp.tsx
    │           └── MarkAsReadButton.tsx
    ├── LoadMoreButton.tsx (Paginacja)
    └── EmptyState.tsx (Pusty stan)

Navbar.astro
└── NotificationBell.tsx (Badge w navbar)
```

### Komponenty

| Komponent | Opis | Props |
|-----------|------|-------|
| **NotificationsView** | Główny kontener, state management | - |
| **NotificationTabs** | Taby All/Unread z badge | `activeTab`, `unreadCount`, `onTabChange` |
| **NotificationList** | Lista z grupowaniem po dniach | `notifications`, `onMarkAsRead`, `isLoading` |
| **NotificationGroup** | Grupa powiadomień z dnia | `date`, `label`, `notifications`, `onMarkAsRead` |
| **NotificationItem** | Pojedyncze powiadomienie | `notification`, `onMarkAsRead` |
| **NotificationIcon** | Ikona typu powiadomienia | `type` |
| **NotificationTimestamp** | Relative time | `timestamp` |
| **MarkAsReadButton** | Przycisk pojedynczy | `notificationId`, `isRead`, `onMarkAsRead`, `isLoading` |
| **MarkAllAsReadButton** | Przycisk masowy | `unreadCount`, `onMarkAllAsRead` |
| **LoadMoreButton** | Paginacja | `onLoadMore`, `hasMore`, `isLoading` |
| **EmptyState** | Pusty stan | `message`, `description` |
| **NotificationBell** | Badge w navbar | `initialUnreadCount` |

---

## API Integration

### Endpointy

```typescript
// GET /api/v1/users/me/notifications
getUserNotifications({
  unreadOnly?: boolean,  // default: false
  page?: number,         // default: 0
  size?: number,         // default: 20
})

// GET /api/v1/users/me/notifications/unread-count
getUnreadNotificationsCount()

// PATCH /api/v1/users/me/notifications/{id}
markNotificationAsRead(notificationId: number)

// PATCH /api/v1/users/me/notifications/mark-all-read
markAllNotificationsAsRead()
```

### Lokalizacja
`frontend/src/lib/api/endpoints/notifications.ts`

---

## Użycie

### Strona Notifications

```astro
---
// frontend/src/pages/dashboard/notifications.astro
import DashboardLayout from '@/layouts/DashboardLayout.astro';
import { ReduxProvider } from '@/components/common/ReduxProvider';
import { NotificationsView } from '@/components/dashboard/notifications';
---

<DashboardLayout title="Powiadomienia | mkrew">
  <ReduxProvider client:only="react">
    <NotificationsView client:only="react" />
  </ReduxProvider>
</DashboardLayout>
```

### NotificationBell w Navbar

```astro
---
// frontend/src/components/layout/Navbar.astro
import { NotificationBell } from '@/components/layout/NotificationBell';

const accessToken = Astro.cookies.get('accessToken')?.value;
const isAuthenticated = !!accessToken;
---

{isAuthenticated && (
  <NotificationBell client:idle />
)}
```

### Import komponentów

```tsx
// Pojedyncze importy
import { NotificationsView } from '@/components/dashboard/notifications/NotificationsView';

// Lub barrel export
import {
  NotificationsView,
  NotificationItem,
  NotificationIcon
} from '@/components/dashboard/notifications';
```

---

## Typy

### Backend DTO (Java → TypeScript)

```typescript
interface InAppNotificationDto {
  id: number;
  type: NotificationType;
  rckik: { id: number; name: string } | null;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null;      // ISO 8601
  expiresAt: string | null;    // ISO 8601
  createdAt: string;           // ISO 8601
}

interface InAppNotificationsResponse {
  notifications: InAppNotificationDto[];
  page: number;
  size: number;
  totalElements: number;
  unreadCount: number;
}

interface UnreadCountResponse {
  unreadCount: number;
}

type NotificationType =
  | 'CRITICAL_BLOOD_LEVEL'
  | 'DONATION_REMINDER'
  | 'SYSTEM_ALERT'
  | 'OTHER';
```

**Lokalizacja:** `frontend/src/types/dashboard.ts`

---

## Stylowanie

### Tailwind CSS Classes

Widok używa Tailwind CSS z następującymi głównymi klasami:

- **Nieprzeczytane:** `border-l-4 border-l-red-500 bg-red-50/30`
- **Przeczytane:** `border-gray-200`
- **Badge:** `bg-red-600 text-white` (nieprzeczytane)
- **Ikony:** `bg-{color}-100 text-{color}-600` (red, blue, yellow, gray)

### Animacje

- **Pulse:** `animate-pulse` dla badge z nowymi powiadomieniami
- **Spinner:** `animate-spin` dla loading states
- **Transitions:** `transition-colors duration-200`

---

## Accessibility

### ARIA Labels

```tsx
// NotificationItem
<div role="listitem" aria-label={`Powiadomienie: ${notification.title}`}>

// NotificationTabs
<div role="tablist" aria-label="Filtrowanie powiadomień">
  <button role="tab" aria-selected={active}>

// NotificationBell
<a aria-label={`Powiadomienia - ${unreadCount} nieprzeczytanych`}>
```

### Keyboard Navigation

- **Tab:** Nawigacja między elementami
- **Enter/Space:** Aktywacja przycisków
- **Focus rings:** `focus:ring-2 focus:ring-red-500`

### Semantic HTML

```tsx
<time dateTime={isoString}>        // Timestamp
<nav aria-label="Tabs">            // Navigation
<article role="listitem">          // Notification item
```

---

## Utility Functions

### dateUtils.ts

```typescript
// Formatowanie czasu względnego
formatRelativeTime(timestamp: string): string
// "Przed chwilą", "5 minut temu", "2 godziny temu", "5 stycznia 2025"

// Formatowanie pełnej daty
formatFullDateTime(timestamp: string): string
// "5 stycznia 2025, 14:30"

// Sprawdzanie wygaśnięcia
isNotificationExpired(expiresAt: string | null): boolean

// Polskie formy liczby mnogiej
getPluralForm(count: number, one: string, few: string, many: string): string
// 1 minuta, 2 minuty, 5 minut
```

**Lokalizacja:** `frontend/src/lib/utils/dateUtils.ts`

---

## Performance

### Optimizations

- **Hydration:** `client:idle` dla NotificationBell, `client:only` dla NotificationsView
- **Memoization:** `useMemo` w NotificationList dla grupowania
- **Lazy loading:** Load More button zamiast infinite scroll
- **Optimistic updates:** Natychmiastowy feedback w UI przed API response

### Polling Strategy

```typescript
// NotificationBell - automatyczne odświeżanie
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchUnreadCount();
  }, 30000); // 30 seconds

  return () => clearInterval(intervalId);
}, []);
```

---

## Testing

### Przykładowe testy (TODO)

```typescript
// NotificationItem.test.tsx
describe('NotificationItem', () => {
  it('displays unread notification with bold title', () => {
    // ...
  });

  it('calls onMarkAsRead when button clicked', () => {
    // ...
  });
});

// dateUtils.test.ts
describe('formatRelativeTime', () => {
  it('returns "Przed chwilą" for timestamps < 1 minute ago', () => {
    // ...
  });
});
```

---

## Roadmap (Nice-to-have)

- [ ] Dropdown quick preview w navbar (top 3-5 powiadomień)
- [ ] SSE/WebSocket dla real-time updates (zamiast polling)
- [ ] Animacje fade-in/out przy przełączaniu tabów
- [ ] Filtrowanie po typie powiadomienia
- [ ] Archiwizacja starych powiadomień
- [ ] Bulk actions (zaznacz kilka → usuń/oznacz)
- [ ] Testy jednostkowe (Jest/Vitest)
- [ ] Testy E2E (Playwright)

---

## Autor

Implementacja zgodna z:
- User Story: **US-011** (Powiadomienia in-app)
- Plan: `.ai/notifications-view-implementation-plan.md`
- Branch: `claude/implement-notifications-view-011CV5v8JhfcjoRwGKVj3m6X`

## Licencja

Część projektu mkrew - platforma wspierająca krwiodawstwo w Polsce 🩸
