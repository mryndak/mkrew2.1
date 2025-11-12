# Plan implementacji widoku Powiadomienia

## 1. Przegląd

Widok Powiadomienia to chroniony obszar aplikacji umożliwiający użytkownikom przeglądanie, zarządzanie i oznaczanie jako przeczytane powiadomień in-app. Widok wspiera system alertów o krytycznych stanach krwi w RCKiK oraz innych komunikatów systemowych, które pomagają użytkownikom podejmować świadome decyzje o oddaniu krwi.

**Główne cele widoku:**
- Prezentacja listy powiadomień in-app z podziałem na wszystkie/nieprzeczytane
- Umożliwienie oznaczania powiadomień jako przeczytane
- Wyświetlanie licznika nieprzeczytanych powiadomień (badge)
- Linkowanie do odpowiednich akcji (np. szczegółów RCKiK)
- Grupowanie powiadomień po dniach dla lepszej czytelności
- Wsparcie dla różnych typów powiadomień (krytyczny stan krwi, przypomnienia o donacji, alerty systemowe)

**Powiązane User Stories:**
- **US-011**: Powiadomienie in-app - jako zalogowany użytkownik chcę zobaczyć alert w aplikacji przy następnym logowaniu, jeśli został wygenerowany krytyczny stan
- **US-010**: Otrzymywanie powiadomień e-mail o niskich stanach - związek z powiadomieniami in-app jako alternatywa/uzupełnienie
- **US-006**: Ustawienia powiadomień - zarządzanie preferencjami powiadomień

## 2. Routing widoku

**Ścieżka główna:** `/dashboard/notifications`

**Typ renderowania:** SSR (Server-Side Rendering) z React islands dla interaktywnych elementów

**Wymagana autoryzacja:** Tak - użytkownik musi być zalogowany (JWT token)

**Alternatywne ścieżki:**
- Badge z liczbą nieprzeczytanych pojawia się również w głównej nawigacji (DashboardLayout)
- Dropdown z szybkim podglądem może być dostępny w navbarze (opcjonalnie)

## 3. Struktura komponentów

```
NotificationsPage (Astro SSR)
├── DashboardLayout.astro
│   ├── Sidebar.astro
│   └── NotificationBell.tsx (client:idle) - Badge w navbar
│
└── NotificationsView.tsx (client:load)
    ├── NotificationTabs.tsx
    │   ├── TabButton ("Wszystkie")
    │   └── TabButton ("Nieprzeczytane")
    │
    ├── NotificationList.tsx
    │   ├── NotificationGroup.tsx (grupowanie po dniu)
    │   │   ├── GroupHeader (data)
    │   │   └── NotificationItem.tsx (x N)
    │   │       ├── NotificationIcon.tsx
    │   │       ├── NotificationContent.tsx
    │   │       ├── NotificationTimestamp.tsx
    │   │       └── MarkAsReadButton.tsx
    │   │
    │   └── LoadMoreButton.tsx (paginacja)
    │
    ├── EmptyState.tsx (gdy brak powiadomień)
    │
    └── MarkAllAsReadButton.tsx (akcja masowa)
```

**Hierarchia komponentów (drzewo):**
```
DashboardLayout
  └─ NotificationsPage (/dashboard/notifications)
       └─ NotificationsView (główny kontener)
            ├─ NotificationTabs (przełączanie widoków)
            ├─ MarkAllAsReadButton (opcjonalnie na górze)
            ├─ NotificationList (lista z grupowaniem)
            │    └─ NotificationGroup[] (grupowane po dniach)
            │         └─ NotificationItem[] (pojedyncze powiadomienia)
            │              ├─ NotificationIcon
            │              ├─ NotificationContent
            │              ├─ NotificationTimestamp
            │              └─ MarkAsReadButton
            ├─ LoadMoreButton (paginacja)
            └─ EmptyState (fallback)
```

## 4. Szczegóły komponentów

### NotificationsPage.astro
**Opis komponentu:**
Główna strona Astro obsługująca routing `/dashboard/notifications`. Odpowiada za SSR, weryfikację autoryzacji i przekazanie początkowych danych do komponentów React.

**Główne elementy:**
- Layout: `DashboardLayout.astro`
- SEO meta tags (tytuł: "Powiadomienia | mkrew")
- Breadcrumbs: Dashboard > Powiadomienia
- Hydratowany komponent React: `<NotificationsView client:load />`

**Obsługiwane interakcje:**
- Weryfikacja JWT przy wejściu na stronę (middleware auth)
- Przekierowanie do `/login` jeśli brak autoryzacji

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik jest zalogowany (middleware)
- Przekazanie user ID z JWT do komponentów

**Typy:**
- `Astro.locals.user` - obiekt użytkownika z JWT

**Propsy:**
Brak (strona Astro)

---

### NotificationsView.tsx
**Opis komponentu:**
Główny kontener React odpowiedzialny za zarządzanie stanem widoku powiadomień, obsługę tabów, pobieranie danych z API oraz delegowanie renderowania do komponentów potomnych.

**Główne elementy:**
- `<div className="notifications-view">` - główny kontener
- `<NotificationTabs />` - przełączanie All/Unread
- `<MarkAllAsReadButton />` - opcjonalny przycisk masowego oznaczania
- `<NotificationList />` - lista powiadomień z grupowaniem
- `<LoadMoreButton />` - paginacja
- `<EmptyState />` - fallback gdy brak powiadomień
- `<Skeleton />` - loading state

**Obsługiwane interakcje:**
- Przełączanie tabów (All/Unread)
- Ładowanie kolejnych stron (Load More)
- Masowe oznaczanie jako przeczytane (wszystkie na liście)
- Refresh listy po oznaczeniu jako przeczytane

**Obsługiwana walidacja:**
- Sprawdzenie czy lista jest pusta (wyświetlenie EmptyState)
- Obsługa błędów API (toast z komunikatem)

**Typy:**
- `NotificationsViewProps` - propsy komponentu
- `InAppNotificationsResponse` - odpowiedź API
- `TabType: 'all' | 'unread'` - typ aktywnego taba

**Propsy:**
```typescript
interface NotificationsViewProps {
  initialNotifications?: InAppNotificationsResponse;
  userId: number;
}
```

---

### NotificationTabs.tsx
**Opis komponentu:**
Komponent nawigacyjny umożliwiający przełączanie między widokami "Wszystkie" i "Nieprzeczytane" powiadomienia. Wyświetla również licznik nieprzeczytanych powiadomień przy tabie "Nieprzeczytane".

**Główne elementy:**
- `<div className="tabs">` - kontener tabów
- `<button className="tab-button">` (x2) - przyciski tabów
- `<Badge />` - licznik nieprzeczytanych przy tabie "Nieprzeczytane"
- Aktywny tab wyróżniony klasą `active`

**Obsługiwane interakcje:**
- Kliknięcie na tab przełącza widok
- Keyboard navigation (Tab, Enter, Space)

**Obsługiwana walidacja:**
Brak (komponent prezentacyjny)

**Typy:**
- `TabType: 'all' | 'unread'`
- `NotificationTabsProps`

**Propsy:**
```typescript
interface NotificationTabsProps {
  activeTab: TabType;
  unreadCount: number;
  onTabChange: (tab: TabType) => void;
}
```

---

### NotificationList.tsx
**Opis komponentu:**
Komponent odpowiedzialny za renderowanie listy powiadomień zgrupowanych po dniach. Obsługuje virtualizację dla dużych list oraz loading states.

**Główne elementy:**
- `<div className="notification-list">` - kontener listy
- `<NotificationGroup />[]` - grupy powiadomień po dniach
- `<Skeleton />` - loading state podczas ładowania

**Obsługiwane interakcje:**
- Scroll do bottom (trigger dla load more)
- Kliknięcie na powiadomienie (nawigacja do linkUrl)

**Obsługiwana walidacja:**
- Filtrowanie powiadomień według aktywnego taba
- Sprawdzenie czy lista nie jest pusta

**Typy:**
- `InAppNotificationDto[]` - lista powiadomień
- `GroupedNotifications: Record<string, InAppNotificationDto[]>` - powiadomienia zgrupowane po dniach

**Propsy:**
```typescript
interface NotificationListProps {
  notifications: InAppNotificationDto[];
  onMarkAsRead: (notificationId: number) => Promise<void>;
  isLoading: boolean;
}
```

---

### NotificationGroup.tsx
**Opis komponentu:**
Komponent grupujący powiadomienia z tego samego dnia. Wyświetla nagłówek z datą oraz listę powiadomień z danego dnia.

**Główne elementy:**
- `<div className="notification-group">`
- `<div className="group-header">` - nagłówek z datą (np. "Dzisiaj", "Wczoraj", "5 stycznia 2025")
- `<div className="group-items">` - kontener dla powiadomień
- `<NotificationItem />[]` - pojedyncze powiadomienia

**Obsługivane interakcje:**
Brak (komponent prezentacyjny)

**Obsługiwana walidacja:**
- Formatowanie daty nagłówka (relative dla dzisiaj/wczoraj)

**Typy:**
- `InAppNotificationDto[]`
- `NotificationGroupProps`

**Propsy:**
```typescript
interface NotificationGroupProps {
  date: string; // ISO date string
  notifications: InAppNotificationDto[];
  onMarkAsRead: (notificationId: number) => Promise<void>;
}
```

---

### NotificationItem.tsx
**Opis komponentu:**
Pojedyncze powiadomienie na liście. Wyświetla ikonę (zależną od typu), tytuł, treść, timestamp oraz przycisk "Oznacz jako przeczytane". Nieprzeczytane powiadomienia są wizualnie wyróżnione (np. pogrubiony tekst, background color).

**Główne elementy:**
- `<div className="notification-item">` - główny kontener (klasa `unread` jeśli nieprzeczytane)
- `<NotificationIcon />` - ikona typu powiadomienia
- `<div className="notification-content">` - kontener treści
  - `<h4 className="notification-title">` - tytuł
  - `<p className="notification-message">` - treść
  - `<NotificationTimestamp />` - timestamp
- `<MarkAsReadButton />` - przycisk oznaczania jako przeczytane (jeśli readAt === null)
- Opcjonalnie: link do akcji (jeśli linkUrl !== null)

**Obsługiwane interakcje:**
- Kliknięcie na powiadomienie (jeśli linkUrl) - nawigacja do celu
- Kliknięcie na "Oznacz jako przeczytane"
- Hover state

**Obsługiwana walidacja:**
- Sprawdzenie czy powiadomienie jest przeczytane (readAt !== null)
- Sprawdzenie czy powiadomienie wygasło (expiresAt < now) - opcjonalne styling

**Typy:**
- `InAppNotificationDto`
- `NotificationItemProps`

**Propsy:**
```typescript
interface NotificationItemProps {
  notification: InAppNotificationDto;
  onMarkAsRead: (notificationId: number) => Promise<void>;
}
```

---

### NotificationIcon.tsx
**Opis komponentu:**
Ikona reprezentująca typ powiadomienia. Zwraca odpowiednią ikonę (SVG lub z biblioteki ikon) oraz kolor zależny od typu.

**Główne elementy:**
- `<div className="notification-icon">` - kontener ikony z kolorem tła
- `<svg>` lub komponent ikony

**Obsługiwane interakcje:**
Brak (komponent prezentacyjny)

**Obsługiwana walidacja:**
- Mapowanie typu powiadomienia na odpowiednią ikonę

**Typy:**
- `NotificationIconProps`
- `NotificationType: 'CRITICAL_BLOOD_LEVEL' | 'DONATION_REMINDER' | 'SYSTEM_ALERT' | 'OTHER'`

**Propsy:**
```typescript
interface NotificationIconProps {
  type: string; // NotificationType from backend
}
```

**Mapowanie typów na ikony:**
- `CRITICAL_BLOOD_LEVEL` → Alert icon (red/warning)
- `DONATION_REMINDER` → Calendar icon (blue/info)
- `SYSTEM_ALERT` → Info icon (yellow/warning)
- `OTHER` → Bell icon (gray/neutral)

---

### NotificationContent.tsx
**Opis komponentu:**
Treść powiadomienia - tytuł i wiadomość. Obsługuje długie teksty z możliwością expand/collapse.

**Główne elementy:**
- `<h4 className="notification-title">` - tytuł
- `<p className="notification-message">` - treść (max 2 linie z ellipsis, expand on click)
- Opcjonalnie: `<button className="expand-button">` jeśli tekst > 2 linie

**Obsługiwane interakcje:**
- Expand/collapse długiego tekstu

**Obsługiwana walidacja:**
- Sprawdzenie długości tekstu (czy potrzebny expand button)

**Typy:**
- `NotificationContentProps`

**Propsy:**
```typescript
interface NotificationContentProps {
  title: string;
  message: string;
}
```

---

### NotificationTimestamp.tsx
**Opis komponentu:**
Wyświetla timestamp powiadomienia w formacie względnym (np. "5 minut temu", "2 godziny temu", "wczoraj o 14:30").

**Główne elementy:**
- `<time className="notification-timestamp" dateTime={isoString}>` - semantic HTML

**Obsługiwane interakcje:**
- Hover wyświetla pełną datę (tooltip)

**Obsługiwana walidacja:**
Brak (komponent prezentacyjny)

**Typy:**
- `NotificationTimestampProps`

**Propsy:**
```typescript
interface NotificationTimestampProps {
  timestamp: string; // ISO 8601 string
}
```

---

### MarkAsReadButton.tsx
**Opis komponentu:**
Przycisk umożliwiający oznaczenie powiadomienia jako przeczytane. Wyświetla loading state podczas żądania API.

**Główne elementy:**
- `<button className="mark-as-read-button">` - przycisk
- `<Spinner />` - loading state
- Ikona (checkmark) lub tekst "Oznacz jako przeczytane"

**Obsługiwane interakcje:**
- Kliknięcie wywołuje callback `onMarkAsRead(notificationId)`
- Disabled state podczas ładowania

**Obsługiwana walidacja:**
- Disabled jeśli już przeczytane (readAt !== null)

**Typy:**
- `MarkAsReadButtonProps`

**Propsy:**
```typescript
interface MarkAsReadButtonProps {
  notificationId: number;
  isRead: boolean;
  onMarkAsRead: (id: number) => Promise<void>;
  isLoading?: boolean;
}
```

---

### MarkAllAsReadButton.tsx
**Opis komponentu:**
Przycisk masowego oznaczania wszystkich widocznych powiadomień jako przeczytane. Opcjonalny komponent (nice-to-have).

**Główne elementy:**
- `<button className="mark-all-as-read-button">` - przycisk
- Ikona (double checkmark) + tekst "Oznacz wszystkie jako przeczytane"
- Loading state

**Obsługiwane interakcje:**
- Kliknięcie wywołuje callback dla wszystkich nieprzeczytanych powiadomień
- Confirmation modal (opcjonalnie)

**Obsługiwana walidacja:**
- Disabled jeśli brak nieprzeczytanych powiadomień

**Typy:**
- `MarkAllAsReadButtonProps`

**Propsy:**
```typescript
interface MarkAllAsReadButtonProps {
  unreadNotifications: InAppNotificationDto[];
  onMarkAllAsRead: (ids: number[]) => Promise<void>;
}
```

---

### LoadMoreButton.tsx
**Opis komponentu:**
Przycisk ładowania kolejnych stron powiadomień. Wyświetlany na dole listy jeśli są dostępne kolejne strony.

**Główne elementy:**
- `<button className="load-more-button">` - przycisk
- `<Spinner />` - loading state
- Tekst "Załaduj więcej"

**Obsługiwane interakcje:**
- Kliknięcie ładuje kolejną stronę (page + 1)

**Obsługiwana walidacja:**
- Ukryty jeśli `page >= totalPages - 1`

**Typy:**
- `LoadMoreButtonProps`

**Propsy:**
```typescript
interface LoadMoreButtonProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}
```

---

### NotificationBell.tsx (w DashboardLayout)
**Opis komponentu:**
Ikona dzwonka w głównej nawigacji z badge pokazującym liczbę nieprzeczytanych powiadomień. Opcjonalnie z dropdown quick preview (nice-to-have).

**Główne elementy:**
- `<button className="notification-bell">` - przycisk ikony
- `<BellIcon />` - ikona dzwonka
- `<Badge count={unreadCount} />` - licznik nieprzeczytanych
- Opcjonalnie: `<Dropdown />` z quick preview (top 3-5 powiadomień)

**Obsługiwane interakcje:**
- Kliknięcie nawiguje do `/dashboard/notifications`
- Opcjonalnie: kliknięcie otwiera dropdown z quick preview

**Obsługiwana walidacja:**
- Badge ukryty jeśli unreadCount === 0

**Typy:**
- `NotificationBellProps`

**Propsy:**
```typescript
interface NotificationBellProps {
  unreadCount: number;
  // Opcjonalnie dla dropdown:
  recentNotifications?: InAppNotificationDto[];
}
```

---

### EmptyState.tsx
**Opis komponentu:**
Wyświetlany gdy brak powiadomień do pokazania (pusta lista lub wszystkie przeczytane w trybie "Nieprzeczytane").

**Główne elementy:**
- `<div className="empty-state">` - kontener
- Ilustracja/ikona (np. dzwonek przekreślony)
- `<h3>` - nagłówek (np. "Brak powiadomień")
- `<p>` - opis (np. "Nie masz żadnych nowych powiadomień")

**Obsługiwane interakcje:**
Brak (komponent prezentacyjny)

**Obsługiwana walidacja:**
Brak

**Typy:**
- `EmptyStateProps`

**Propsy:**
```typescript
interface EmptyStateProps {
  message: string;
  description?: string;
}
```

## 5. Typy

### Backend DTO (z Java → TypeScript mapping)

```typescript
// Odpowiada: InAppNotificationsResponse.java
interface InAppNotificationsResponse {
  notifications: InAppNotificationDto[];
  page: number;
  size: number;
  totalElements: number;
  unreadCount: number;
}

// Odpowiada: InAppNotificationDto.java
interface InAppNotificationDto {
  id: number;
  type: NotificationType;
  rckik: {
    id: number;
    name: string;
  } | null;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null; // ISO 8601 datetime
  expiresAt: string | null; // ISO 8601 datetime
  createdAt: string; // ISO 8601 datetime
}

// Typy powiadomień z backendu
type NotificationType =
  | 'CRITICAL_BLOOD_LEVEL'
  | 'DONATION_REMINDER'
  | 'SYSTEM_ALERT'
  | 'OTHER';

// Odpowiada: UnreadCountResponse.java
interface UnreadCountResponse {
  unreadCount: number;
}

// Odpowiada: MarkNotificationAsReadRequest.java (request)
interface MarkNotificationAsReadRequest {
  readAt: string; // ISO 8601 datetime
}

// Response po oznaczeniu jako przeczytane
interface MarkNotificationAsReadResponse {
  id: number;
  type: string;
  title: string;
  readAt: string;
}
```

### Frontend ViewModels

```typescript
// Typ taba
type TabType = 'all' | 'unread';

// Stan widoku
interface NotificationsViewState {
  notifications: InAppNotificationDto[];
  activeTab: TabType;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// Powiadomienia zgrupowane po dniach
interface GroupedNotifications {
  [date: string]: InAppNotificationDto[]; // key: YYYY-MM-DD
}

// Opcje filtrowania
interface NotificationFilters {
  unreadOnly: boolean;
  page: number;
  size: number;
}

// Propsy głównego widoku
interface NotificationsViewProps {
  initialNotifications?: InAppNotificationsResponse;
  userId: number;
}

// Propsy listy
interface NotificationListProps {
  notifications: InAppNotificationDto[];
  onMarkAsRead: (notificationId: number) => Promise<void>;
  isLoading: boolean;
}

// Propsy grupy
interface NotificationGroupProps {
  date: string;
  notifications: InAppNotificationDto[];
  onMarkAsRead: (notificationId: number) => Promise<void>;
}

// Propsy pojedynczego powiadomienia
interface NotificationItemProps {
  notification: InAppNotificationDto;
  onMarkAsRead: (notificationId: number) => Promise<void>;
}

// Propsy tabów
interface NotificationTabsProps {
  activeTab: TabType;
  unreadCount: number;
  onTabChange: (tab: TabType) => void;
}

// Propsy ikony
interface NotificationIconProps {
  type: NotificationType;
}

// Propsy przycisku mark as read
interface MarkAsReadButtonProps {
  notificationId: number;
  isRead: boolean;
  onMarkAsRead: (id: number) => Promise<void>;
  isLoading?: boolean;
}

// Propsy load more
interface LoadMoreButtonProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

// Propsy dzwonka w navbar
interface NotificationBellProps {
  unreadCount: number;
  recentNotifications?: InAppNotificationDto[];
}
```

### Utility Types

```typescript
// Typ dla formatowania czasu
interface RelativeTimeFormat {
  value: string;
  fullDate: string;
}

// Typ dla grupowania po dniach
interface DateGroup {
  label: string; // "Dzisiaj", "Wczoraj", "5 stycznia 2025"
  date: string; // YYYY-MM-DD
  notifications: InAppNotificationDto[];
}
```

## 6. Zarządzanie stanem

### Redux Slice: `notificationsSlice.ts`

Widok Powiadomienia wymaga dedykowanego Redux slice do zarządzania stanem powiadomień in-app, pollingiem oraz cache'owaniem danych.

**Stan slice:**
```typescript
interface NotificationsState {
  // Lista powiadomień
  notifications: InAppNotificationDto[];

  // Metadata paginacji
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;

  // Liczniki
  unreadCount: number;

  // UI state
  activeTab: TabType;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Cache timestamp dla polling
  lastFetchTimestamp: number | null;

  // Optimistic updates tracking
  pendingUpdates: Record<number, boolean>; // notificationId -> isPending
}
```

**Actions:**
```typescript
// Async thunks (RTK Query lub createAsyncThunk)
fetchNotifications(filters: NotificationFilters): Promise<InAppNotificationsResponse>
fetchUnreadCount(): Promise<UnreadCountResponse>
markAsRead(notificationId: number): Promise<void>
markMultipleAsRead(notificationIds: number[]): Promise<void>
loadMoreNotifications(page: number): Promise<InAppNotificationsResponse>

// Synchroniczne akcje
setActiveTab(tab: TabType): void
clearError(): void
addNotification(notification: InAppNotificationDto): void // dla real-time
updateNotificationOptimistic(notificationId: number): void // optimistic update
```

**Selectors:**
```typescript
selectAllNotifications: (state) => InAppNotificationDto[]
selectUnreadNotifications: (state) => InAppNotificationDto[]
selectNotificationsByTab: (state, tab: TabType) => InAppNotificationDto[]
selectUnreadCount: (state) => number
selectIsLoading: (state) => boolean
selectError: (state) => string | null
selectHasMorePages: (state) => boolean
selectGroupedNotifications: (state, tab: TabType) => GroupedNotifications
```

**Initial State:**
```typescript
const initialState: NotificationsState = {
  notifications: [],
  currentPage: 0,
  pageSize: 20,
  totalElements: 0,
  totalPages: 0,
  unreadCount: 0,
  activeTab: 'all',
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetchTimestamp: null,
  pendingUpdates: {},
};
```

### Custom Hook: `useNotifications.ts`

Hook zapewniający interfejs do zarządzania powiadomieniami w komponentach React.

```typescript
interface UseNotificationsReturn {
  // Dane
  notifications: InAppNotificationDto[];
  unreadCount: number;
  groupedNotifications: GroupedNotifications;

  // Stan UI
  activeTab: TabType;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;

  // Akcje
  setActiveTab: (tab: TabType) => void;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

function useNotifications(): UseNotificationsReturn {
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const activeTab = useSelector((state) => state.notifications.activeTab);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const hasMore = useSelector(selectHasMorePages);

  // Filtrowanie według taba
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter(n => n.readAt === null);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Grupowanie po dniach
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  // Akcje
  const setActiveTab = useCallback((tab: TabType) => {
    dispatch(notificationsSlice.actions.setActiveTab(tab));
  }, [dispatch]);

  const markAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update
    dispatch(notificationsSlice.actions.updateNotificationOptimistic(notificationId));

    try {
      await dispatch(markAsReadThunk(notificationId)).unwrap();
    } catch (error) {
      // Rollback on error
      toast.error('Nie udało się oznaczyć powiadomienia jako przeczytane');
    }
  }, [dispatch]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter(n => n.readAt === null)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    try {
      await dispatch(markMultipleAsReadThunk(unreadIds)).unwrap();
      toast.success('Wszystkie powiadomienia oznaczone jako przeczytane');
    } catch (error) {
      toast.error('Nie udało się oznaczyć powiadomień');
    }
  }, [notifications, dispatch]);

  const loadMore = useCallback(async () => {
    const nextPage = Math.floor(notifications.length / 20);
    await dispatch(loadMoreNotificationsThunk(nextPage));
  }, [notifications.length, dispatch]);

  const refresh = useCallback(async () => {
    await dispatch(fetchNotificationsThunk({ unreadOnly: activeTab === 'unread', page: 0, size: 20 }));
  }, [activeTab, dispatch]);

  return {
    notifications: filteredNotifications,
    unreadCount,
    groupedNotifications,
    activeTab,
    isLoading,
    isLoadingMore: false, // TODO: add to state
    error,
    hasMore,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
  };
}
```

### Polling Strategy (Opcjonalnie dla MVP)

Dla MVP możemy użyć prostego pollingu co 30s aby odświeżać listę powiadomień i licznik nieprzeczytanych.

```typescript
// useNotificationPolling.ts
function useNotificationPolling(intervalMs: number = 30000) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      dispatch(fetchUnreadCountThunk());
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, intervalMs, dispatch]);
}
```

**Post-MVP:** Użycie Server-Sent Events (SSE) lub WebSocket dla real-time powiadomień.

## 7. Integracja API

### Endpointy API

Widok Powiadomienia korzysta z następujących endpointów zdefiniowanych w API Plan:

#### 1. Pobierz listę powiadomień
**Endpoint:** `GET /api/v1/users/me/notifications`

**Query Parameters:**
- `unreadOnly` (boolean, optional, default: false) - filtr tylko nieprzeczytanych
- `page` (number, optional, default: 0) - numer strony (zero-indexed)
- `size` (number, optional, default: 20, max: 100) - rozmiar strony

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```typescript
{
  notifications: InAppNotificationDto[];
  page: number;
  size: number;
  totalElements: number;
  unreadCount: number;
}
```

**Response Type:** `InAppNotificationsResponse`

**Error Responses:**
- `401 Unauthorized` - brak lub nieprawidłowy token
- `500 Internal Server Error` - błąd serwera

**Użycie w komponencie:**
- Wywołanie przy montowaniu `NotificationsView`
- Wywołanie przy zmianie taba (all/unread)
- Wywołanie przy load more (page++)

---

#### 2. Pobierz licznik nieprzeczytanych
**Endpoint:** `GET /api/v1/users/me/notifications/unread-count`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```typescript
{
  unreadCount: number;
}
```

**Response Type:** `UnreadCountResponse`

**Użycie w komponencie:**
- Wywołanie przy montowaniu `NotificationBell` w DashboardLayout
- Polling co 30s (opcjonalnie)
- Refresh po oznaczeniu jako przeczytane

---

#### 3. Oznacz powiadomienie jako przeczytane
**Endpoint:** `PATCH /api/v1/users/me/notifications/{id}`

**Path Parameters:**
- `id` (number) - ID powiadomienia

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  readAt: string; // ISO 8601 datetime, np. "2025-01-08T17:00:00Z"
}
```

**Request Type:** `MarkNotificationAsReadRequest`

**Response (200 OK):**
```typescript
{
  id: number;
  type: string;
  title: string;
  readAt: string;
}
```

**Response Type:** `MarkNotificationAsReadResponse`

**Error Responses:**
- `401 Unauthorized` - brak lub nieprawidłowy token
- `403 Forbidden` - użytkownik nie jest właścicielem powiadomienia
- `404 Not Found` - powiadomienie nie istnieje

**Użycie w komponencie:**
- Kliknięcie przycisku "Oznacz jako przeczytane" w `NotificationItem`
- Optimistic update w UI przed wysłaniem żądania
- Rollback jeśli żądanie się nie powiedzie

---

### API Client Implementation

**Axios Configuration (src/lib/api/client.ts):**
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodaj JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - obsługa błędów
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Notifications API Module (src/lib/api/endpoints/notifications.ts):**
```typescript
import apiClient from '../client';
import type {
  InAppNotificationsResponse,
  UnreadCountResponse,
  MarkNotificationAsReadRequest,
  MarkNotificationAsReadResponse,
} from '../types';

export const notificationsApi = {
  /**
   * Fetch user's in-app notifications
   */
  async getNotifications(params: {
    unreadOnly?: boolean;
    page?: number;
    size?: number;
  }): Promise<InAppNotificationsResponse> {
    const response = await apiClient.get<InAppNotificationsResponse>(
      '/users/me/notifications',
      { params }
    );
    return response.data;
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      '/users/me/notifications/unread-count'
    );
    return response.data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: number,
    readAt: string
  ): Promise<MarkNotificationAsReadResponse> {
    const response = await apiClient.patch<MarkNotificationAsReadResponse>(
      `/users/me/notifications/${notificationId}`,
      { readAt } as MarkNotificationAsReadRequest
    );
    return response.data;
  },

  /**
   * Mark multiple notifications as read (batch operation)
   * Note: API doesn't have a batch endpoint, so we call individual endpoints
   */
  async markMultipleAsRead(notificationIds: number[]): Promise<void> {
    const readAt = new Date().toISOString();
    const promises = notificationIds.map((id) =>
      this.markAsRead(id, readAt)
    );
    await Promise.all(promises);
  },
};
```

**Redux Async Thunks (src/lib/store/slices/notificationsSlice.ts):**
```typescript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationsApi } from '../../api/endpoints/notifications';
import type { NotificationsState, NotificationFilters } from './types';

// Fetch notifications
export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchNotifications',
  async (filters: NotificationFilters) => {
    return await notificationsApi.getNotifications({
      unreadOnly: filters.unreadOnly,
      page: filters.page,
      size: filters.size,
    });
  }
);

// Fetch unread count
export const fetchUnreadCountThunk = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    return await notificationsApi.getUnreadCount();
  }
);

// Mark as read
export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number) => {
    const readAt = new Date().toISOString();
    return await notificationsApi.markAsRead(notificationId, readAt);
  }
);

// Mark multiple as read
export const markMultipleAsReadThunk = createAsyncThunk(
  'notifications/markMultipleAsRead',
  async (notificationIds: number[]) => {
    await notificationsApi.markMultipleAsRead(notificationIds);
    return notificationIds;
  }
);

// Load more (pagination)
export const loadMoreNotificationsThunk = createAsyncThunk(
  'notifications/loadMore',
  async ({ page, unreadOnly }: { page: number; unreadOnly: boolean }) => {
    return await notificationsApi.getNotifications({
      page,
      size: 20,
      unreadOnly,
    });
  }
);
```

## 8. Interakcje użytkownika

### 8.1 Podstawowe interakcje

#### Wyświetlenie listy powiadomień
**Flow:**
1. Użytkownik zalogowany klika na ikonę dzwonka w navbarze lub przechodzi do `/dashboard/notifications`
2. SSR renderuje stronę z `DashboardLayout`
3. Komponent `NotificationsView` montuje się (client:load)
4. Hook `useNotifications` wywołuje `fetchNotifications` z `unreadOnly: false`
5. API zwraca listę powiadomień z paginacją
6. Lista renderuje się z grupowaniem po dniach
7. Licznik nieprzeczytanych wyświetla się w tabie "Nieprzeczytane"

**Szczegóły UX:**
- Loading skeleton podczas ładowania danych
- Jeśli lista pusta → wyświetl `EmptyState` z komunikatem "Brak powiadomień"
- Powiadomienia nieprzeczytane wyróżnione wizualnie (bold title, colored background)

---

#### Przełączanie między tabami All/Unread
**Flow:**
1. Użytkownik klika na tab "Nieprzeczytane"
2. `setActiveTab('unread')` aktualizuje Redux state
3. Selector `selectNotificationsByTab` filtruje listę (readAt === null)
4. Lista się re-renderuje z tylko nieprzeczytanymi powiadomieniami
5. Jeśli brak nieprzeczytanych → `EmptyState` z komunikatem "Wszystkie powiadomienia przeczytane"

**Szczegóły UX:**
- Płynna animacja przełączania (fade in/out)
- Aktywny tab wyróżniony (border-bottom, color)
- Badge z liczbą nieprzeczytanych przy tabie "Nieprzeczytane"

---

#### Oznaczanie powiadomienia jako przeczytane
**Flow:**
1. Użytkownik klika przycisk "Oznacz jako przeczytane" przy powiadomieniu
2. **Optimistic update:** UI natychmiast oznacza powiadomienie jako przeczytane
   - `readAt` ustawione na aktualny czas
   - Wizualne wyróżnienie usunięte (normal font, white background)
   - Przycisk "Oznacz jako przeczytane" ukryty
3. Wywołanie API `PATCH /api/v1/users/me/notifications/{id}` z `readAt` timestamp
4. **Sukces:** Redux state aktualizowany, unreadCount dekrementowany
5. **Błąd:** Rollback optimistic update, wyświetl toast error

**Szczegóły UX:**
- Optimistic update dla natychmiastowego feedbacku
- Spinner w przycisku podczas ładowania (jeśli brak optimistic update)
- Toast success (opcjonalnie): "Powiadomienie oznaczone jako przeczytane"
- Toast error przy niepowodzeniu: "Nie udało się oznaczyć powiadomienia"

---

#### Kliknięcie na powiadomienie (nawigacja)
**Flow:**
1. Użytkownik klika na powiadomienie z `linkUrl !== null`
2. Jeśli powiadomienie nieprzeczytane → automatycznie oznacz jako przeczytane
3. Nawigacja do `linkUrl` (np. `/rckik/1` dla CRITICAL_BLOOD_LEVEL)

**Szczegóły UX:**
- Kursor pointer na powiadomieniach z linkiem
- Hover state (light background)
- Smooth navigation (Astro page transition)

---

#### Ładowanie kolejnych stron (Load More)
**Flow:**
1. Użytkownik scrolluje do końca listy
2. Widoczny przycisk "Załaduj więcej" (jeśli `hasMore === true`)
3. Kliknięcie wywołuje `loadMore()`
4. API request `GET /api/v1/users/me/notifications?page={nextPage}`
5. Nowe powiadomienia appendowane do istniejącej listy
6. Button ukryty jeśli brak kolejnych stron

**Szczegóły UX:**
- Loading spinner w przycisku podczas ładowania
- Smooth scroll do nowo załadowanych powiadomień (opcjonalnie)
- Disabled state przycisku podczas ładowania

---

#### Masowe oznaczanie jako przeczytane (Nice-to-have)
**Flow:**
1. Użytkownik klika "Oznacz wszystkie jako przeczytane" na górze listy
2. Opcjonalnie: confirmation modal "Czy na pewno oznaczyć wszystkie jako przeczytane?"
3. Wywołanie `markAllAsRead()` → batch API calls dla wszystkich nieprzeczytanych
4. Optimistic update: wszystkie powiadomienia oznaczone jako przeczytane w UI
5. Sukces: Toast "Wszystkie powiadomienia oznaczone jako przeczytane"
6. Błąd: Rollback, toast error

**Szczegóły UX:**
- Przycisk disabled jeśli `unreadCount === 0`
- Confirmation modal (opcjonalnie)
- Progress indicator jeśli dużo powiadomień (batch operations)

---

### 8.2 Keyboard Navigation

Widok musi być w pełni dostępny z klawiatury:

- **Tab:** Przechodzenie między elementami interaktywnymi (taby, przyciski, powiadomienia z linkami)
- **Enter/Space:** Aktywacja przycisków i linków
- **Arrow Keys:** Nawigacja między powiadomieniami (opcjonalnie)
- **Shift+Tab:** Cofanie w nawigacji

**Implementacja:**
- Wszystkie interaktywne elementy mają `tabindex="0"`
- Focus states wyraźnie widoczne (outline, box-shadow)
- Logiczna kolejność tabulacji (top-to-bottom, left-to-right)

---

### 8.3 Screen Reader Support

**ARIA Labels:**
- Lista powiadomień: `<ul role="list" aria-label="Lista powiadomień">`
- Pojedyncze powiadomienie: `<li role="listitem">`
- Przycisk mark as read: `aria-label="Oznacz powiadomienie jako przeczytane"`
- Badge z liczbą: `aria-label="{count} nieprzeczytanych powiadomień"`
- Notification icon: `aria-hidden="true"` (dekoracyjny)

**Live Regions:**
- Toast notifications: `<div role="alert" aria-live="assertive">`
- Dynamiczne zmiany licznika: `aria-live="polite"`

## 9. Warunki i walidacja

### 9.1 Warunki wyświetlania komponentów

#### NotificationList
**Warunki:**
- Wyświetlany gdy `notifications.length > 0`
- Ukryty gdy lista pusta → wyświetl `EmptyState`

**Logika:**
```typescript
{notifications.length > 0 ? (
  <NotificationList notifications={notifications} />
) : (
  <EmptyState message="Brak powiadomień" />
)}
```

---

#### NotificationItem - Przycisk "Oznacz jako przeczytane"
**Warunki:**
- Wyświetlany tylko gdy `notification.readAt === null` (nieprzeczytane)
- Ukryty gdy powiadomienie już przeczytane

**Logika:**
```typescript
{notification.readAt === null && (
  <MarkAsReadButton notificationId={notification.id} />
)}
```

---

#### LoadMoreButton
**Warunki:**
- Wyświetlany gdy `currentPage < totalPages - 1` (są kolejne strony)
- Ukryty gdy brak kolejnych stron
- Disabled podczas ładowania (`isLoading === true`)

**Logika:**
```typescript
{hasMore && (
  <LoadMoreButton
    onLoadMore={loadMore}
    hasMore={hasMore}
    isLoading={isLoadingMore}
  />
)}
```

---

#### EmptyState
**Warunki:**
- **Tab "Wszystkie":** Wyświetlany gdy `notifications.length === 0`
  - Komunikat: "Brak powiadomień"
- **Tab "Nieprzeczytane":** Wyświetlany gdy `unreadNotifications.length === 0` (ale `notifications.length > 0`)
  - Komunikat: "Wszystkie powiadomienia przeczytane"

**Logika:**
```typescript
{notifications.length === 0 ? (
  <EmptyState
    message={activeTab === 'unread'
      ? 'Wszystkie powiadomienia przeczytane'
      : 'Brak powiadomień'}
  />
) : (
  <NotificationList notifications={notifications} />
)}
```

---

#### NotificationBell Badge
**Warunki:**
- Badge wyświetlany gdy `unreadCount > 0`
- Ukryty gdy brak nieprzeczytanych
- Maksymalna wyświetlana liczba: 99 (jeśli > 99 → wyświetl "99+")

**Logika:**
```typescript
{unreadCount > 0 && (
  <Badge count={unreadCount > 99 ? '99+' : unreadCount} />
)}
```

---

### 9.2 Walidacja danych API

#### Walidacja odpowiedzi API
**Sprawdzenia:**
1. `notifications` jest tablicą (nie null/undefined)
2. Każde powiadomienie ma wymagane pola: `id`, `type`, `title`, `message`, `createdAt`
3. `page`, `size`, `totalElements` są liczbami
4. `unreadCount >= 0`

**Implementacja (w API client):**
```typescript
function validateNotificationsResponse(
  data: InAppNotificationsResponse
): boolean {
  if (!Array.isArray(data.notifications)) return false;
  if (typeof data.page !== 'number') return false;
  if (typeof data.totalElements !== 'number') return false;
  if (typeof data.unreadCount !== 'number' || data.unreadCount < 0) return false;

  return data.notifications.every((n) =>
    typeof n.id === 'number' &&
    typeof n.type === 'string' &&
    typeof n.title === 'string' &&
    typeof n.message === 'string' &&
    typeof n.createdAt === 'string'
  );
}
```

---

#### Walidacja przed wysłaniem żądania "Mark as Read"
**Sprawdzenia:**
1. `notificationId` jest liczbą dodatnią
2. `readAt` jest poprawnym ISO 8601 string
3. Powiadomienie nie jest już oznaczone jako przeczytane (frontendowa optymalizacja)

**Implementacja:**
```typescript
async function markAsRead(notificationId: number) {
  // Walidacja
  if (!notificationId || notificationId <= 0) {
    throw new Error('Invalid notification ID');
  }

  const notification = notifications.find(n => n.id === notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.readAt !== null) {
    // Already read, skip API call
    return;
  }

  const readAt = new Date().toISOString();
  await notificationsApi.markAsRead(notificationId, readAt);
}
```

---

### 9.3 Warunki dostępu (Authorization)

#### Dostęp do widoku
**Warunki:**
- Użytkownik musi być zalogowany (JWT token w localStorage lub httpOnly cookie)
- Token nie może być wygasły
- Middleware Astro weryfikuje autentykację przed renderowaniem strony

**Implementacja (Astro middleware):**
```typescript
// src/middleware/auth.ts
export async function onRequest(context, next) {
  const token = context.cookies.get('accessToken');

  if (!token) {
    return context.redirect('/login');
  }

  try {
    const user = await verifyToken(token);
    context.locals.user = user;
    return next();
  } catch (error) {
    return context.redirect('/login');
  }
}
```

---

#### Resource-level authorization
**Warunki:**
- Użytkownik może przeglądać tylko **własne** powiadomienia
- Backend filtruje powiadomienia po `user_id` z JWT
- Frontend nie musi dodatkowo weryfikować (backend enforcement)

---

### 9.4 Walidacja UI State

#### Sprawdzenie przed renderowaniem grupowania po dniach
**Warunki:**
- `notifications` nie jest pustą tablicą
- Każde powiadomienie ma poprawny `createdAt` timestamp

**Implementacja:**
```typescript
function groupNotificationsByDate(
  notifications: InAppNotificationDto[]
): GroupedNotifications {
  if (!notifications || notifications.length === 0) {
    return {};
  }

  return notifications.reduce((groups, notification) => {
    try {
      const date = new Date(notification.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    } catch (error) {
      console.error('Invalid createdAt timestamp:', notification.createdAt);
    }
    return groups;
  }, {} as GroupedNotifications);
}
```

---

### 9.5 Edge Cases i Obsługa Błędów

#### Brak powiadomień
- **Warunek:** `notifications.length === 0`
- **Akcja:** Wyświetl `EmptyState` z odpowiednim komunikatem
- **UX:** Przyjazna ikona i tekst zachęcający (np. "Wróć wkrótce, aby sprawdzić nowe powiadomienia")

---

#### Wszystkie powiadomienia przeczytane (tab Unread)
- **Warunek:** `activeTab === 'unread' && unreadCount === 0`
- **Akcja:** Wyświetl `EmptyState` z komunikatem "Wszystkie powiadomienia przeczytane"
- **UX:** Ikona checkmark, pozytywny komunikat

---

#### Błąd API (500, network error)
- **Warunek:** API request fails
- **Akcja:**
  1. Wyświetl toast error z komunikatem "Nie udało się załadować powiadomień"
  2. Przycisk "Spróbuj ponownie" w `EmptyState`
  3. Rollback optimistic updates jeśli dotyczy
- **UX:** Nie blokuj całego widoku - pokaż ostatnio załadowane dane z cache'a (jeśli dostępne)

---

#### Token wygasły (401)
- **Warunek:** API zwraca 401 Unauthorized
- **Akcja:**
  1. Axios interceptor łapie 401
  2. Próba odświeżenia tokena (`POST /api/v1/auth/refresh`)
  3. Jeśli refresh fail → redirect do `/login`
- **UX:** Auto-logout z informacją "Sesja wygasła. Zaloguj się ponownie."

---

#### Rate limiting (429)
- **Warunek:** API zwraca 429 Too Many Requests
- **Akcja:**
  1. Wyświetl toast warning z `Retry-After` countdown
  2. Zablokuj przyciski akcji przez czas `Retry-After`
- **UX:** "Zbyt wiele żądań. Spróbuj ponownie za {countdown} sekund."

---

#### Optimistic update rollback
- **Warunek:** API call dla `markAsRead` fails po optimistic update
- **Akcja:**
  1. Przywróć `readAt = null` w Redux state
  2. Przywróć wizualne wyróżnienie powiadomienia
  3. Wyświetl toast error
- **UX:** Płynny rollback bez błysków UI

---

#### Powiadomienie wygasłe
- **Warunek:** `notification.expiresAt !== null && new Date(notification.expiresAt) < new Date()`
- **Akcja:** Opcjonalne styling (np. opacity: 0.6, strikethrough title)
- **UX:** Wyraźnie oznacz wygasłe powiadomienia, ale nadal pozwól je przeglądać

---

#### Długi tekst powiadomienia
- **Warunek:** `notification.message.length > 200`
- **Akcja:** Wyświetl tylko pierwsze 2 linie z ellipsis (`...`), dodaj przycisk "Pokaż więcej"
- **UX:** Expand/collapse na kliknięcie

## 10. Obsługa błędów

### 10.1 Błędy API

#### Błąd 401 Unauthorized
**Przyczyna:** Token JWT wygasły lub nieprawidłowy

**Obsługa:**
1. Axios interceptor łapie 401
2. Próba automatycznego odświeżenia tokena:
   ```typescript
   if (error.response.status === 401) {
     try {
       const newToken = await refreshAccessToken();
       // Retry original request
       return apiClient.request(originalRequest);
     } catch (refreshError) {
       // Redirect to login
       window.location.href = '/login?session_expired=true';
     }
   }
   ```
3. Jeśli refresh nie powiedzie się → redirect do `/login` z parametrem `?session_expired=true`
4. Wyświetl toast: "Sesja wygasła. Zaloguj się ponownie."

**UX Impact:**
- Użytkownik widzi toast error
- Auto-redirect do login page
- Po zalogowaniu wraca do poprzedniej strony (store `returnUrl` w sessionStorage)

---

#### Błąd 403 Forbidden
**Przyczyna:** Użytkownik próbuje oznaczyć cudze powiadomienie jako przeczytane (edge case - nie powinno wystąpić w normalnym flow)

**Obsługa:**
1. Wyświetl toast error: "Brak uprawnień do wykonania tej akcji"
2. Rollback optimistic update
3. Log do Sentry/monitoring (podejrzana aktywność)

**UX Impact:**
- Toast error
- Brak zmian w UI (rollback)

---

#### Błąd 404 Not Found
**Przyczyna:** Powiadomienie zostało usunięte między czasem fetch a czasem akcji

**Obsługa:**
1. Usuń powiadomienie z Redux state (już nie istnieje)
2. Wyświetl toast info: "Powiadomienie już nie istnieje"
3. Refresh listy

**UX Impact:**
- Powiadomienie znika z listy
- Toast informacyjny

---

#### Błąd 429 Too Many Requests
**Przyczyna:** Rate limit exceeded (zbyt wiele żądań w krótkim czasie)

**Obsługa:**
1. Parsuj header `Retry-After` (sekundy do odczekania)
2. Wyświetl toast warning z countdownem: "Zbyt wiele żądań. Spróbuj za {countdown}s"
3. Zablokuj przyciski akcji (disabled state) na czas `Retry-After`
4. Auto-retry po upływie czasu (opcjonalnie)

**UX Impact:**
- Toast z countdownem
- Disabled buttons przez {Retry-After} sekund
- Auto-retry po czasie (opcjonalnie)

---

#### Błąd 500 Internal Server Error
**Przyczyna:** Błąd serwera (bug, database down, etc.)

**Obsługa:**
1. Wyświetl toast error: "Wystąpił błąd serwera. Spróbuj ponownie."
2. Przycisk "Spróbuj ponownie" w EmptyState (jeśli lista pusta)
3. Zachowaj ostatnio załadowane dane z cache'a (jeśli dostępne)
4. Log do Sentry z pełnym stack trace

**UX Impact:**
- Toast error z przyciskiem retry
- Graceful degradation (pokaż cached data jeśli dostępne)
- Nie blokuj całego widoku

---

#### Błąd Network Error (offline)
**Przyczyna:** Brak połączenia internetowego

**Obsługa:**
1. Axios timeout error lub network error
2. Wyświetl banner na górze strony: "Jesteś offline. Niektóre funkcje mogą nie działać."
3. Disable przyciski akcji (mark as read, load more)
4. Pokaż ostatnio załadowane dane z Redux cache
5. Auto-retry po wykryciu ponownego połączenia (`window.online` event)

**UX Impact:**
- Persistent banner "Offline mode"
- Disabled actions
- Cached data nadal widoczne
- Auto-refresh po powrocie online

---

### 10.2 Błędy walidacji danych

#### Nieprawidłowy format daty (createdAt, readAt, expiresAt)
**Przyczyna:** Backend zwrócił nieprawidłowy ISO 8601 timestamp

**Obsługa:**
1. Try-catch przy parsowaniu dat:
   ```typescript
   try {
     const date = new Date(notification.createdAt);
     if (isNaN(date.getTime())) throw new Error('Invalid date');
   } catch (error) {
     console.error('Invalid timestamp:', notification.createdAt);
     // Fallback: użyj current date lub ukryj timestamp
   }
   ```
2. Fallback: Wyświetl "Data nieznana" jeśli parsowanie się nie powiedzie
3. Log do Sentry (data quality issue)

**UX Impact:**
- Powiadomienie wyświetla "Data nieznana" zamiast timestamp
- Reszta powiadomienia renderuje się poprawnie

---

#### Brakujące wymagane pola w NotificationDto
**Przyczyna:** Backend zwrócił niepełne dane (bug w API)

**Obsługa:**
1. Walidacja przy fetch:
   ```typescript
   const isValid = notification.id && notification.title && notification.message;
   if (!isValid) {
     console.error('Invalid notification data:', notification);
     return; // Skip this notification
   }
   ```
2. Pomiń nieprawidłowe powiadomienia (nie renderuj)
3. Log do Sentry

**UX Impact:**
- Nieprawidłowe powiadomienia nie wyświetlają się
- Lista może być krótsza niż `size` parametr (ale to edge case)

---

### 10.3 Błędy stanu aplikacji

#### Redux state corruption
**Przyczyna:** Błąd w reducerze lub deserializacji z localStorage

**Obsługa:**
1. Error boundary w React:
   ```typescript
   class NotificationsErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       console.error('Notifications error:', error, errorInfo);
       // Reset Redux state
       store.dispatch(notificationsSlice.actions.reset());
       // Show error UI
       this.setState({ hasError: true });
     }
   }
   ```
2. Fallback UI: "Wystąpił błąd. Odśwież stronę."
3. Przycisk "Odśwież" resetuje state i refetch data

**UX Impact:**
- Graceful error UI z opcją recovery
- Dane mogą być stracone (wymaga refetch)

---

#### Race condition w optimistic updates
**Przyczyna:** Użytkownik kliknął "mark as read" dwukrotnie szybko

**Obsługa:**
1. Debounce kliknięć (ignore double-clicks < 300ms)
2. Disable przycisk podczas pending API call
3. Track pending updates w Redux:
   ```typescript
   pendingUpdates: Record<number, boolean>; // notificationId -> isPending
   ```
4. Ignore kolejne kliknięcia jeśli `pendingUpdates[id] === true`

**UX Impact:**
- Przycisk disabled podczas API call
- Brak możliwości double-submit

---

### 10.4 Error Boundaries

**Root Error Boundary dla całego widoku:**
```typescript
// NotificationsErrorBoundary.tsx
class NotificationsErrorBoundary extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    console.error('Notifications view error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <h2>Coś poszło nie tak</h2>
          <p>Przepraszamy, wystąpił błąd podczas ładowania powiadomień.</p>
          <button onClick={() => window.location.reload()}>
            Odśwież stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Użycie:**
```tsx
<NotificationsErrorBoundary>
  <NotificationsView {...props} />
</NotificationsErrorBoundary>
```

---

### 10.5 Toast Notifications dla błędów

**Implementacja (useToast hook):**
```typescript
import { toast } from 'react-toastify'; // lub custom implementation

export const errorMessages = {
  FETCH_FAILED: 'Nie udało się załadować powiadomień',
  MARK_AS_READ_FAILED: 'Nie udało się oznaczyć powiadomienia',
  NETWORK_ERROR: 'Brak połączenia z internetem',
  UNAUTHORIZED: 'Sesja wygasła. Zaloguj się ponownie.',
  RATE_LIMIT: 'Zbyt wiele żądań. Spróbuj ponownie za moment.',
  UNKNOWN_ERROR: 'Wystąpił nieoczekiwany błąd',
};

export function showErrorToast(error: any) {
  const status = error.response?.status;

  let message = errorMessages.UNKNOWN_ERROR;

  if (status === 401) {
    message = errorMessages.UNAUTHORIZED;
  } else if (status === 429) {
    const retryAfter = error.response?.headers['retry-after'];
    message = `${errorMessages.RATE_LIMIT}${retryAfter ? ` (${retryAfter}s)` : ''}`;
  } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    message = errorMessages.NETWORK_ERROR;
  } else if (error.response?.data?.message) {
    message = error.response.data.message;
  }

  toast.error(message, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
  });
}
```

---

### 10.6 Monitoring i Logging

**Integracja z Sentry (opcjonalnie):**
```typescript
import * as Sentry from '@sentry/react';

// Log błędu API do Sentry
function logApiError(error: any, context: any) {
  Sentry.captureException(error, {
    tags: {
      component: 'NotificationsView',
      api_endpoint: context.endpoint,
    },
    extra: {
      userId: context.userId,
      requestData: context.requestData,
    },
  });
}

// Użycie w thunk
export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetch',
  async (filters, { rejectWithValue }) => {
    try {
      return await notificationsApi.getNotifications(filters);
    } catch (error) {
      logApiError(error, {
        endpoint: '/users/me/notifications',
        userId: filters.userId,
        requestData: filters,
      });
      return rejectWithValue(error.response?.data);
    }
  }
);
```

## 11. Kroki implementacji

### Faza 1: Setup i Infrastruktura (Sprint 5, Tydzień 1)

#### Krok 1.1: Utworzenie struktury plików
**Czas:** 30 min

**Zadania:**
1. Utworzyć katalogi:
   ```
   src/pages/dashboard/notifications.astro
   src/components/dashboard/NotificationsView.tsx
   src/components/dashboard/NotificationList.tsx
   src/components/dashboard/NotificationItem.tsx
   src/components/dashboard/NotificationTabs.tsx
   src/components/dashboard/NotificationBell.tsx
   src/lib/store/slices/notificationsSlice.ts
   src/lib/api/endpoints/notifications.ts
   src/lib/hooks/useNotifications.ts
   src/lib/utils/notificationHelpers.ts
   ```

2. Utworzyć pliki typów:
   ```
   src/lib/types/notifications.ts
   ```

**Kryteria akceptacji:**
- Wszystkie pliki utworzone z podstawowym boilerplate
- TypeScript bez błędów kompilacji
- Struktura zgodna z sekcją 11.1 UI Plan

---

#### Krok 1.2: Definicja typów TypeScript
**Czas:** 1h

**Zadania:**
1. W `src/lib/types/notifications.ts` zdefiniować wszystkie typy z sekcji 5 tego planu:
   - `InAppNotificationDto`
   - `InAppNotificationsResponse`
   - `NotificationType`
   - `TabType`
   - `NotificationsViewState`
   - `GroupedNotifications`
   - Wszystkie props interfaces

2. Export typów do użycia w komponentach

3. Zaimportować do `src/lib/types/index.ts` (central export)

**Kryteria akceptacji:**
- Wszystkie typy zdefiniowane zgodnie z API Plan
- Brak błędów TypeScript
- Typy dostępne globalnie przez central export

---

#### Krok 1.3: API Client - Notifications Endpoint
**Czas:** 2h

**Zadania:**
1. W `src/lib/api/endpoints/notifications.ts` zaimplementować:
   - `getNotifications(params)` - GET /users/me/notifications
   - `getUnreadCount()` - GET /users/me/notifications/unread-count
   - `markAsRead(id, readAt)` - PATCH /users/me/notifications/{id}
   - `markMultipleAsRead(ids)` - batch operation (loop individual calls)

2. Dodać error handling i type safety

3. Dodać JSDoc comments dla każdej funkcji

**Kryteria akceptacji:**
- Wszystkie funkcje API zaimplementowane
- TypeScript typy zgodne z backend DTO
- Error handling dla 401, 403, 404, 429, 500
- Axios interceptors działają poprawnie
- Unit testy dla API client (opcjonalnie)

---

#### Krok 1.4: Redux Slice - notificationsSlice
**Czas:** 3h

**Zadania:**
1. W `src/lib/store/slices/notificationsSlice.ts` zaimplementować:
   - Initial state
   - Async thunks:
     - `fetchNotificationsThunk`
     - `fetchUnreadCountThunk`
     - `markAsReadThunk`
     - `markMultipleAsReadThunk`
     - `loadMoreNotificationsThunk`
   - Reducers:
     - `setActiveTab`
     - `updateNotificationOptimistic`
     - `clearError`
     - `reset`
   - Selectors:
     - `selectAllNotifications`
     - `selectUnreadNotifications`
     - `selectNotificationsByTab`
     - `selectUnreadCount`
     - `selectIsLoading`
     - `selectHasMorePages`

2. Dodać slice do root store (`src/lib/store/index.ts`)

3. Testy jednostkowe dla reducers i selectors

**Kryteria akceptacji:**
- Redux slice kompletny z thunks, reducers, selectors
- State management działa poprawnie (testowane w Redux DevTools)
- Optimistic updates zaimplementowane
- Rollback mechanizm dla błędów API
- Unit testy passed (80%+ coverage)

---

#### Krok 1.5: Custom Hook - useNotifications
**Czas:** 2h

**Zadania:**
1. W `src/lib/hooks/useNotifications.ts` zaimplementować hook:
   - Inicjalizacja: fetch notifications on mount
   - Expose state: notifications, unreadCount, activeTab, isLoading, error
   - Expose actions: setActiveTab, markAsRead, markAllAsRead, loadMore, refresh
   - Memoized selectors dla performance
   - Grouped notifications logic

2. Dodać JSDoc comments

**Kryteria akceptacji:**
- Hook działa poprawnie w komponentach
- Optimized with useMemo/useCallback
- No infinite re-render loops
- Easy to use API

---

### Faza 2: UI Components - Primitive (Sprint 5, Tydzień 1)

#### Krok 2.1: EmptyState Component
**Czas:** 1h

**Zadania:**
1. Utworzyć `src/components/common/EmptyState.tsx`:
   - Props: `message`, `description`, `icon`
   - Styling: centered layout, ikona, tekst
   - Accessibility: semantic HTML

2. Dodać do Storybook (opcjonalnie)

**Kryteria akceptacji:**
- Komponent renderuje się poprawnie
- Responsive (mobile + desktop)
- Accessible (ARIA labels)

---

#### Krok 2.2: Badge Component (jeśli nie istnieje)
**Czas:** 1h

**Zadania:**
1. Sprawdzić czy Badge istnieje w `src/components/ui/Badge.tsx`
2. Jeśli nie - utworzyć:
   - Props: `count`, `variant` (primary, danger, success)
   - Max count: 99+ dla liczb > 99
   - Small size dla notification bell

**Kryteria akceptacji:**
- Badge działa dla licznika nieprzeczytanych
- Poprawne kolory i rozmiary
- Hidden gdy count === 0

---

#### Krok 2.3: Skeleton Loaders
**Czas:** 1h

**Zadania:**
1. Sprawdzić czy Skeleton istnieje w `src/components/ui/Skeleton.tsx`
2. Utworzyć `NotificationListSkeleton.tsx`:
   - 5-8 skeleton items (mimicking NotificationItem)
   - Pulsing animation

**Kryteria akceptacji:**
- Skeleton pokazuje się podczas loading
- Animacja smooth
- Layout matches final notification items

---

### Faza 3: Core Notification Components (Sprint 5, Tydzień 2)

#### Krok 3.1: NotificationIcon Component
**Czas:** 1h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationIcon.tsx`:
   - Mapowanie `NotificationType` → ikona + kolor
   - CRITICAL_BLOOD_LEVEL → Alert icon (red)
   - DONATION_REMINDER → Calendar icon (blue)
   - SYSTEM_ALERT → Info icon (yellow)
   - OTHER → Bell icon (gray)

2. Użyć ikon z biblioteki (np. Heroicons, Lucide)

**Kryteria akceptacji:**
- Wszystkie typy mają odpowiednie ikony
- Kolory semantic (red=danger, blue=info, etc.)
- Accessible (aria-hidden on decorative icons)

---

#### Krok 3.2: NotificationTimestamp Component
**Czas:** 1h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationTimestamp.tsx`:
   - Formatowanie relative time: "5 minut temu", "2 godziny temu", "wczoraj o 14:30"
   - Tooltip z pełną datą on hover
   - Użyć biblioteki: `date-fns` lub `dayjs`

2. Helper functions w `src/lib/utils/dateHelpers.ts`:
   - `formatRelativeTime(date: string): string`
   - `formatFullDate(date: string): string`

**Kryteria akceptacji:**
- Relative time działa poprawnie (różne case'y)
- Tooltip pokazuje pełną datę
- Semantic HTML (`<time dateTime={iso}>`)

---

#### Krok 3.3: NotificationContent Component
**Czas:** 2h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationContent.tsx`:
   - Render title + message
   - Truncate message do 2 linii z ellipsis
   - Przycisk "Pokaż więcej" jeśli tekst > 150 znaków
   - Expand/collapse na kliknięcie

2. State management: `useState` dla expanded state

**Kryteria akceptacji:**
- Długie teksty truncated
- Expand/collapse działa płynnie
- Keyboard accessible (Enter/Space)

---

#### Krok 3.4: MarkAsReadButton Component
**Czas:** 1h

**Zadania:**
1. Utworzyć `src/components/dashboard/MarkAsReadButton.tsx`:
   - Props: `notificationId`, `isRead`, `onMarkAsRead`, `isLoading`
   - Disabled jeśli `isRead === true`
   - Loading spinner podczas API call
   - Ikona checkmark + tekst "Oznacz jako przeczytane"

**Kryteria akceptacji:**
- Button disabled gdy already read
- Loading state podczas API call
- Accessible (aria-label, disabled state)
- Keyboard navigation

---

#### Krok 3.5: NotificationItem Component
**Czas:** 3h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationItem.tsx`:
   - Layout: icon + content + timestamp + button
   - Conditional styling: unread vs read (bold, background)
   - Clickable jeśli `linkUrl !== null` → navigate
   - Auto mark as read on click (jeśli unread)
   - Hover state

2. Integration z sub-components:
   - `<NotificationIcon type={notification.type} />`
   - `<NotificationContent title={...} message={...} />`
   - `<NotificationTimestamp timestamp={...} />`
   - `<MarkAsReadButton ... />`

**Kryteria akceptacji:**
- Wszystkie sub-componenty renderują się
- Unread notifications wyróżnione wizualnie
- Kliknięcie nawiguje (jeśli linkUrl)
- Auto mark as read działa
- Responsive layout
- Accessible (keyboard, screen reader)

---

#### Krok 3.6: NotificationGroup Component
**Czas:** 2h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationGroup.tsx`:
   - Props: `date`, `notifications[]`, `onMarkAsRead`
   - Group header z formatted date:
     - "Dzisiaj" jeśli date === today
     - "Wczoraj" jeśli date === yesterday
     - "5 stycznia 2025" dla starszych dat
   - Lista `NotificationItem[]` w grupie

2. Helper w `src/lib/utils/notificationHelpers.ts`:
   - `formatGroupDate(date: string): string`

**Kryteria akceptacji:**
- Grupowanie po dniu działa
- Date labels poprawne (Dzisiaj, Wczoraj, pełna data)
- NotificationItem renderowane poprawnie

---

#### Krok 3.7: NotificationList Component
**Czas:** 2h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationList.tsx`:
   - Props: `notifications[]`, `onMarkAsRead`, `isLoading`
   - Grupowanie powiadomień po dniach
   - Renderowanie `NotificationGroup[]`
   - Loading skeleton podczas ładowania
   - Empty state jeśli lista pusta

2. Helper function:
   - `groupNotificationsByDate(notifications): GroupedNotifications`

**Kryteria akceptacji:**
- Lista grupowana po dniach
- Skeleton podczas loading
- Empty state działa
- Performance OK dla 100+ notifications (virtualization opcjonalnie)

---

#### Krok 3.8: NotificationTabs Component
**Czas:** 1h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationTabs.tsx`:
   - Props: `activeTab`, `unreadCount`, `onTabChange`
   - 2 przyciski: "Wszystkie" i "Nieprzeczytane"
   - Badge z `unreadCount` przy tabie Nieprzeczytane
   - Aktywny tab wyróżniony (border-bottom, color)
   - Keyboard navigation (arrow keys)

**Kryteria akceptacji:**
- Przełączanie tabów działa
- Badge pokazuje unreadCount
- Aktywny tab wyróżniony
- Accessible (ARIA roles, keyboard)

---

### Faza 4: Main View i Integration (Sprint 5, Tydzień 2)

#### Krok 4.1: NotificationsView Component (Main Container)
**Czas:** 4h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationsView.tsx`:
   - Props: `initialNotifications`, `userId`
   - Use `useNotifications()` hook
   - Layout:
     - `<NotificationTabs />`
     - `<NotificationList />` lub `<EmptyState />`
     - `<LoadMoreButton />` (jeśli hasMore)
   - Error handling (Error Boundary)
   - Loading states

2. Integracja z Redux store

3. Obsługa tabów (filtrowanie all/unread)

**Kryteria akceptacji:**
- Wszystkie sub-komponenty zintegrowane
- Dane ładują się z API
- Taby przełączają widoki
- Loading states działają
- Error handling działa
- Responsive layout

---

#### Krok 4.2: LoadMoreButton Component
**Czas:** 1h

**Zadania:**
1. Utworzyć `src/components/dashboard/LoadMoreButton.tsx`:
   - Props: `onLoadMore`, `hasMore`, `isLoading`
   - Button disabled podczas loading
   - Spinner podczas loading
   - Ukryty jeśli `hasMore === false`

**Kryteria akceptacji:**
- Load more działa (appenduje nowe powiadomienia)
- Loading state podczas fetch
- Hidden gdy brak kolejnych stron

---

#### Krok 4.3: MarkAllAsReadButton (Optional)
**Czas:** 2h

**Zadania:**
1. Utworzyć `src/components/dashboard/MarkAllAsReadButton.tsx`:
   - Props: `unreadNotifications[]`, `onMarkAllAsRead`
   - Confirmation modal (opcjonalnie)
   - Batch API calls
   - Progress indicator

**Kryteria akceptacji:**
- Masowe oznaczanie działa
- Confirmation modal (opcjonalnie)
- Disabled gdy brak unprzeczytanych
- Loading state

---

#### Krok 4.4: NotificationsPage Astro
**Czas:** 2h

**Zadania:**
1. Utworzyć `src/pages/dashboard/notifications.astro`:
   - Layout: `DashboardLayout`
   - SEO: title, description
   - Breadcrumbs: Dashboard > Powiadomienia
   - Auth middleware check
   - Hydrate `<NotificationsView client:load />`
   - Pass `userId` z `Astro.locals.user`

**Kryteria akceptacji:**
- Strona renderuje się (SSR)
- Auth middleware działa (redirect jeśli not logged in)
- NotificationsView hydratuje się na kliencie
- SEO meta tags poprawne

---

### Faza 5: Navigation Integration (Sprint 5, Tydzień 2)

#### Krok 5.1: NotificationBell Component (Navbar)
**Czas:** 3h

**Zadania:**
1. Utworzyć `src/components/dashboard/NotificationBell.tsx`:
   - Props: `unreadCount`, `recentNotifications` (opcjonalnie)
   - Ikona dzwonka
   - Badge z `unreadCount`
   - Kliknięcie → navigate to `/dashboard/notifications`
   - Opcjonalnie: Dropdown z quick preview (top 5 notifications)

2. Dodać do `DashboardLayout.astro` navbar

3. Polling: `useNotificationPolling()` hook w layout

**Kryteria akceptacji:**
- Bell icon w navbar
- Badge pokazuje unreadCount
- Kliknięcie nawiguje do notifications page
- Polling działa (refresh count co 30s)
- Dropdown quick preview (opcjonalnie)

---

#### Krok 5.2: Sidebar Link
**Czas:** 30 min

**Zadania:**
1. Dodać link "Powiadomienia" w `Sidebar.astro`:
   - Link: `/dashboard/notifications`
   - Ikona: Bell
   - Badge z `unreadCount`
   - Active state jeśli current page

**Kryteria akceptacji:**
- Link działa
- Badge pokazuje count
- Active state poprawny

---

### Faza 6: Styling i UX Polish (Sprint 5, Tydzień 3)

#### Krok 6.1: Tailwind CSS Styling
**Czas:** 4h

**Zadania:**
1. Stylowanie wszystkich komponentów:
   - NotificationItem: card layout, unread state, hover
   - NotificationTabs: border-bottom, active state
   - NotificationList: spacing, grouping
   - Buttons: primary, secondary, disabled states
   - Empty state: centered layout, ikona

2. Responsive design (mobile, tablet, desktop)

3. Dark mode support (opcjonalnie)

**Kryteria akceptacji:**
- Wszystkie komponenty wyglądają zgodnie z design system
- Responsive na wszystkich breakpointach (375px, 768px, 1024px+)
- Colors semantic (success, danger, info, warning)
- Accessibility contrast ratio (WCAG AA)

---

#### Krok 6.2: Animations i Transitions
**Czas:** 2h

**Zadania:**
1. Dodać animacje:
   - Fade in dla nowych powiadomień
   - Slide out dla oznaczonych jako przeczytane
   - Tab switching animation
   - Skeleton loading pulse
   - Hover states (scale, shadow)

2. Użyć Tailwind transitions lub Framer Motion

**Kryteria akceptacji:**
- Animacje płynne (60fps)
- Brak layout shifts
- Prefers-reduced-motion respected

---

#### Krok 6.3: Loading States i Skeletons
**Czas:** 2h

**Zadania:**
1. Dopracować loading states:
   - Initial load: skeleton list
   - Load more: spinner w przycisku
   - Mark as read: spinner w przycisku (lub optimistic update)
   - Tab switch: smooth transition (no blink)

**Kryteria akceptacji:**
- Wszystkie loading states zaimplementowane
- Brak białych ekranów (flash of unstyled content)
- Optimistic updates dla lepszego UX

---

### Faza 7: Accessibility (Sprint 5, Tydzień 3)

#### Krok 7.1: ARIA Labels i Semantic HTML
**Czas:** 3h

**Zadania:**
1. Dodać ARIA labels:
   - Lista: `<ul role="list" aria-label="Lista powiadomień">`
   - Notification item: `<li role="listitem">`
   - Buttons: `aria-label="Oznacz jako przeczytane"`
   - Badge: `aria-label="{count} nieprzeczytanych powiadomień"`
   - Icons: `aria-hidden="true"` (decorative)

2. Semantic HTML:
   - `<time dateTime={iso}>` dla timestampów
   - `<button>` zamiast `<div onclick>`
   - `<nav>` dla tabs

3. Live regions dla toastów:
   - `<div role="alert" aria-live="assertive">`

**Kryteria akceptacji:**
- Wszystkie interaktywne elementy mają ARIA labels
- Semantic HTML używane wszędzie
- Screen reader testing passed (NVDA/JAWS)
- axe DevTools 0 critical issues

---

#### Krok 7.2: Keyboard Navigation
**Czas:** 2h

**Zadania:**
1. Implementacja keyboard navigation:
   - Tab: przechodzenie między elementami
   - Enter/Space: aktywacja przycisków
   - Arrow keys: nawigacja między powiadomieniami (opcjonalnie)
   - Shift+Tab: cofanie

2. Focus management:
   - Visible focus states (outline, box-shadow)
   - Focus trap w modals (jeśli używane)
   - Skip link (opcjonalnie)

**Kryteria akceptacji:**
- Wszystko dostępne z klawiatury (bez myszy)
- Focus states wyraźnie widoczne
- Logiczna kolejność tabulacji
- Keyboard shortcuts (opcjonalnie): "m" = mark as read

---

#### Krok 7.3: Screen Reader Testing
**Czas:** 2h

**Zadania:**
1. Testowanie z screen readerami:
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (Mac/iOS)
   - TalkBack (Android)

2. Sprawdzić:
   - Odczytywanie wszystkich tekstów
   - Oznajmianie statusów (unread/read)
   - Live regions dla toastów
   - Skip links

3. Poprawki na podstawie testów

**Kryteria akceptacji:**
- Screen reader odczytuje wszystkie istotne informacje
- Brak zagubienia kontekstu podczas nawigacji
- Live regions działają poprawnie

---

### Faza 8: Testing (Sprint 5, Tydzień 3)

#### Krok 8.1: Unit Tests
**Czas:** 4h

**Zadania:**
1. Unit testy dla:
   - Redux slice (reducers, selectors)
   - API client functions
   - Utility functions (groupNotificationsByDate, formatRelativeTime)
   - Custom hooks (useNotifications)

2. Framework: Vitest + React Testing Library

3. Cel: 80%+ code coverage

**Kryteria akceptacji:**
- Wszystkie funkcje utility przetestowane
- Redux slice covered (actions, reducers, selectors)
- Tests passed (npm run test)

---

#### Krok 8.2: Component Tests
**Czas:** 4h

**Zadania:**
1. Component testy dla:
   - NotificationItem (render, interactions, mark as read)
   - NotificationList (grouping, empty state)
   - NotificationTabs (switching, badge)
   - NotificationsView (integration)

2. Mock API responses z MSW (Mock Service Worker)

3. Test user interactions (click, keyboard)

**Kryteria akceptacji:**
- Kluczowe komponenty mają testy
- User interactions przetestowane
- Snapshots (opcjonalnie)
- Tests passed

---

#### Krok 8.3: Integration Tests
**Czas:** 3h

**Zadania:**
1. Integration testy end-to-end flow:
   - Fetch notifications → render list
   - Mark as read → update UI
   - Tab switch → filter list
   - Load more → append notifications

2. Mock API z MSW

3. Test error scenarios (401, 500, network error)

**Kryteria akceptacji:**
- Główne flows przetestowane
- Error handling przetestowane
- Tests passed

---

#### Krok 8.4: E2E Tests (Opcjonalnie)
**Czas:** 4h

**Zadania:**
1. E2E testy z Playwright:
   - User login → navigate to notifications
   - View notifications list
   - Mark as read
   - Switch tabs
   - Load more

2. Test na różnych browserach (Chrome, Firefox, Safari)

3. Test responsywności (mobile, desktop)

**Kryteria akceptacji:**
- Kluczowe user flows działają E2E
- Cross-browser compatibility
- Mobile + desktop tested

---

### Faza 9: Performance Optimization (Sprint 5, Tydzień 4)

#### Krok 9.1: Code Splitting i Lazy Loading
**Czas:** 2h

**Zadania:**
1. Lazy load components:
   - NotificationsView (client:load)
   - NotificationBell (client:idle)
   - Heavy components (charts, maps - jeśli używane)

2. Dynamic imports dla modals (jeśli używane)

3. Analyze bundle size: `npm run build && npm run analyze`

**Kryteria akceptacji:**
- Bundle size notifications view < 100KB (gzipped)
- Initial page load < 2s (3G network)
- Lighthouse Performance > 90

---

#### Krok 9.2: Memoization i Optimization
**Czas:** 2h

**Zadania:**
1. Optimize React:
   - `useMemo` dla expensive computations (grouping, filtering)
   - `useCallback` dla callback functions
   - `React.memo` dla pure components (NotificationItem)

2. Redux selectors memoization (reselect)

3. Debounce/throttle dla scroll events (jeśli używane)

**Kryteria akceptacji:**
- Brak niepotrzebnych re-renderów (React DevTools Profiler)
- Smooth 60fps scrolling
- Memory leaks fixed

---

#### Krok 9.3: Caching Strategy
**Czas:** 2h

**Zadania:**
1. Implement caching:
   - Redux persist dla notifications state (opcjonalnie)
   - Cache API responses (5 min TTL)
   - Optimistic updates dla lepszego perceived performance

2. Invalidation strategy:
   - Po mark as read → update cache
   - Po polling → refresh cache jeśli stale

**Kryteria akceptacji:**
- Offline support (cached data dostępne)
- Faster subsequent loads (cache hit)
- Cache invalidation działa poprawnie

---

### Faza 10: Documentation i Deployment (Sprint 5, Tydzień 4)

#### Krok 10.1: Code Documentation
**Czas:** 2h

**Zadania:**
1. JSDoc comments dla:
   - Wszystkich public functions
   - Interfaces i types
   - Complex logic

2. README dla folderu `/dashboard`:
   - Opis struktury komponentów
   - Jak dodać nowy typ powiadomienia
   - Troubleshooting

**Kryteria akceptacji:**
- Wszystkie public API mają JSDoc
- README aktualny i pomocny

---

#### Krok 10.2: Storybook (Opcjonalnie)
**Czas:** 3h

**Zadania:**
1. Storybook stories dla:
   - NotificationItem (różne stany)
   - NotificationList (różne scenariusze)
   - NotificationTabs
   - Empty states

2. Interactive controls (Storybook addons)

**Kryteria akceptacji:**
- Główne komponenty w Storybook
- Wszystkie stany wizualne przetestowane
- Storybook działa lokalnie i na stagingu

---

#### Krok 10.3: Final Testing i Bug Fixes
**Czas:** 4h

**Zadania:**
1. Manual testing:
   - Wszystkie user flows
   - Edge cases
   - Error scenarios
   - Cross-browser (Chrome, Firefox, Safari, Edge)
   - Mobile (iOS, Android)

2. Bug fixes na podstawie testów

3. Performance testing (Lighthouse, WebPageTest)

**Kryteria akceptacji:**
- Wszystkie krytyczne bugi fixed
- Lighthouse scores: Performance > 90, Accessibility > 95
- Cross-browser compatibility OK
- Mobile responsive OK

---

#### Krok 10.4: Deployment do Staging
**Czas:** 2h

**Zadania:**
1. Merge feature branch do `develop`:
   ```bash
   git checkout develop
   git merge feature/notifications-view
   ```

2. Deploy do staging environment (GCP)

3. Smoke testing na staging:
   - Login works
   - Notifications load
   - All interactions work
   - No console errors

4. Monitoring:
   - Check Cloud Logging dla błędów
   - Check Performance metrics

**Kryteria akceptacji:**
- Deployed to staging
- All smoke tests passed
- No critical errors in logs
- Performance OK

---

#### Krok 10.5: Production Deployment
**Czas:** 1h

**Zadania:**
1. Code review (Pull Request)
2. Approval od team lead
3. Merge do `main` branch
4. Deploy do production (GCP)
5. Post-deployment monitoring (24h)
6. Hotfix plan (rollback strategy)

**Kryteria akceptacji:**
- PR approved
- Deployed to production
- No critical issues in first 24h
- User feedback positive

---

## Podsumowanie Timeline

| Faza | Czas (Tygodnie) | Czas (Godziny) |
|------|-----------------|----------------|
| Faza 1: Setup i Infrastruktura | 0.5 | 8.5h |
| Faza 2: UI Components - Primitive | 0.5 | 3h |
| Faza 3: Core Notification Components | 1.0 | 14h |
| Faza 4: Main View i Integration | 1.0 | 9h |
| Faza 5: Navigation Integration | 0.5 | 3.5h |
| Faza 6: Styling i UX Polish | 0.5 | 8h |
| Faza 7: Accessibility | 0.5 | 7h |
| Faza 8: Testing | 1.0 | 15h |
| Faza 9: Performance Optimization | 0.5 | 6h |
| Faza 10: Documentation i Deployment | 0.5 | 12h |
| **TOTAL** | **~6 tygodni** | **~86h** |

**Założenia:**
- 1 developer full-time
- 8h/dzień efektywnej pracy
- ~11 dni roboczych (2.2 tygodnie)

**Realistic Timeline z buforem:** 3-4 tygodnie (1 sprint)

---

## Checklist MVP

### Must-Have (P0)
- [x] Fetch i wyświetlenie listy powiadomień
- [x] Przełączanie tabów (All/Unread)
- [x] Oznaczanie pojedynczego powiadomienia jako przeczytane
- [x] Grupowanie powiadomień po dniach
- [x] Badge z licznikiem nieprzeczytanych w navbar
- [x] Empty state dla pustej listy
- [x] Loading states (skeleton)
- [x] Error handling (toast notifications)
- [x] Responsive design (mobile + desktop)
- [x] Accessibility (keyboard navigation, ARIA labels)
- [x] Paginacja (Load More)

### Should-Have (P1)
- [ ] Masowe oznaczanie jako przeczytane (Mark All as Read)
- [ ] Polling (refresh count co 30s)
- [ ] Dropdown quick preview w navbar
- [ ] Animations i transitions
- [ ] Optimistic updates z rollback
- [ ] Unit i integration tests (80%+ coverage)

### Nice-to-Have (P2)
- [ ] E2E tests (Playwright)
- [ ] Storybook dla komponentów
- [ ] Dark mode support
- [ ] Infinite scroll (zamiast Load More)
- [ ] Real-time notifications (WebSocket/SSE)
- [ ] Push notifications (Firebase)
- [ ] Advanced filtering (by type, by date range)
- [ ] Search w powiadomieniach

---

## Zależności zewnętrzne

### NPM Packages
```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0", // lub dayjs
    "react-toastify": "^10.0.0", // lub custom toast
    "clsx": "^2.0.0" // utility dla conditional classes
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^1.0.0",
    "msw": "^2.0.0", // Mock Service Worker
    "@playwright/test": "^1.40.0" // E2E testing
  }
}
```

### Backend API
- Endpoint `/api/v1/users/me/notifications` musi być zaimplementowany
- Endpoint `/api/v1/users/me/notifications/unread-count` musi być zaimplementowany
- Endpoint `/api/v1/users/me/notifications/{id}` (PATCH) musi być zaimplementowany
- JWT authentication musi działać
- CORS configured dla frontend domain

### Infrastructure
- GCP Cloud SQL (PostgreSQL) dla persistence
- GCP Cloud Storage dla backupów (opcjonalnie)
- Cloud Logging dla monitoringu
- Cloud Run/GKE dla deployment

---

**Dokument Status:** Gotowy do implementacji
**Ostatnia aktualizacja:** 2025-01-12
**Wersja:** 1.0
