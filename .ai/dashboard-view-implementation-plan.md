# Plan implementacji widoku Dashboard główny

## 1. Przegląd

Dashboard główny to centralna strona aplikacji dostępna po zalogowaniu użytkownika. Jego głównym celem jest prezentacja najważniejszych informacji dla dawcy krwi w jednym, czytelnym widoku. Dashboard zawiera podsumowanie statystyk donacji użytkownika, listę ulubionych centrów krwiodawstwa z aktualnymi stanami krwi, ostatnie powiadomienia in-app oraz szybkie akcje umożliwiające nawigację do innych sekcji aplikacji.

Widok Dashboard zapewnia użytkownikowi natychmiastowy wgląd w:
- Jego aktywność jako dawcy (liczba donacji, ilość oddanej krwi, seria donacji)
- Status krytycznych poziomów krwi w ulubionych centrach
- Ostatnie powiadomienia wymagające uwagi
- Datę kolejnej możliwej donacji (56 dni od ostatniej)

## 2. Routing widoku

Dashboard główny dostępny jest na ścieżce: **`/dashboard`**

Jest to chroniona ścieżka wymagająca:
- Uwierzytelnienia użytkownika (JWT token w Authorization header)
- Weryfikacji emaila (`emailVerified=true`)
- Aktywnego konta (`deletedAt IS NULL`)

Po pomyślnym zalogowaniu użytkownik zostaje automatycznie przekierowany na `/dashboard`.

Renderowanie: **SSR (Server-Side Rendering)** z React islands dla komponentów interaktywnych

## 3. Struktura komponentów

```
DashboardPage (Astro)
├── DashboardLayout (Astro)
│   ├── Sidebar (Astro)
│   └── Navbar (Astro)
│       └── NotificationBell (React, client:idle)
├── WelcomeSection (React)
├── StatsCardsGrid (React)
│   ├── StatsCard - Liczba donacji
│   ├── StatsCard - Całkowita ilość (ml)
│   ├── StatsCard - Ostatnia donacja
│   └── StatsCard - Następna możliwa donacja
├── FavoritesWidget (React, client:idle)
│   └── FavoriteCard[] - lista top 3 ulubionych
├── NotificationsWidget (React, client:idle)
│   └── NotificationItem[] - ostatnie 5 powiadomień
├── RecentDonationsTimeline (React, client:visible)
│   └── DonationTimelineItem[] - ostatnie 3 donacje
└── QuickActionsPanel (React)
    ├── QuickActionButton - Dodaj donację
    ├── QuickActionButton - Zobacz ulubione
    └── QuickActionButton - Szukaj centrum

```

## 4. Szczegóły komponentów

### 4.1 DashboardPage (Astro)

**Opis komponentu:**
Główny komponent strony Dashboard odpowiedzialny za:
- Weryfikację autoryzacji użytkownika (middleware auth)
- Pobieranie danych z API po stronie serwera (SSR)
- Kompozycję wszystkich sekcji widoku

**Główne elementy:**
- Layout wrapper (`DashboardLayout.astro`)
- Sekcje z danymi użytkownika
- Kontener grid dla kart i widgetów

**Obsługiwane zdarzenia:**
- Przekierowanie do `/login` jeśli brak autoryzacji
- Obsługa błędów ładowania danych (fallback UI)

**Warunki walidacji:**
- JWT token musi być ważny
- Użytkownik musi mieć `emailVerified=true`
- Endpoint `/api/v1/users/me` musi zwrócić 200 OK

**Typy:**
- `UserProfileResponse` (z API)
- `DashboardData` (ViewModel - agregat wszystkich danych)

**Propsy:**
Brak (strona top-level)

---

### 4.2 WelcomeSection (React)

**Opis komponentu:**
Sekcja powitalna wyświetlająca spersonalizowaną wiadomość dla użytkownika z jego imieniem oraz grupą krwi.

**Główne elementy:**
- `<section>` z klasami Tailwind
- `<h1>` z tekstem powitalnym: "Witaj, {firstName}!"
- `<p>` z informacją o grupie krwi: "Twoja grupa krwi: {bloodGroup}" (jeśli ustawiona)

**Obsługiwane interakcje:**
Brak (statyczny komponent prezentacyjny)

**Obsługiwana walidacja:**
- Jeśli `firstName` jest null/undefined, wyświetl "Witaj!"
- Jeśli `bloodGroup` jest null, nie wyświetlaj informacji o grupie krwi

**Typy:**
```typescript
interface WelcomeSectionProps {
  firstName: string | null;
  bloodGroup: string | null;
}
```

**Propsy:**
- `firstName: string | null` - Imię użytkownika
- `bloodGroup: string | null` - Grupa krwi użytkownika

---

### 4.3 StatsCardsGrid (React)

**Opis komponentu:**
Grid zawierający 4 karty ze statystykami donacji użytkownika. Komponenty wyświetlane w layoutcie 2x2 na desktop, 1 kolumna na mobile.

**Główne elementy:**
- `<div>` z CSS Grid (4 kolumny na desktop, 1 na mobile)
- 4x `<StatsCard>` z różnymi danymi

**Obsługiwane interakcje:**
- Kliknięcie w kartę może prowadzić do powiązanej strony (np. karta "Liczba donacji" → `/dashboard/donations`)

**Obsługiwana walidacja:**
- Jeśli brak donacji (`totalDonations === 0`), wyświetl wartości zerowe i komunikat zachęcający do dodania pierwszej donacji

**Typy:**
```typescript
interface StatsCardsGridProps {
  statistics: DonationStatisticsDto;
}

interface DonationStatisticsDto {
  totalDonations: number;
  totalQuantityMl: number;
  lastDonationDate: string | null; // ISO 8601
}
```

**Propsy:**
- `statistics: DonationStatisticsDto` - Statystyki donacji użytkownika

---

### 4.4 StatsCard (React)

**Opis komponentu:**
Pojedyncza karta statystyki wyświetlająca ikonę, wartość liczbową oraz opis. Komponent reużywalny.

**Główne elementy:**
- `<div>` wrapper z Tailwind Card styles
- `<div>` ikona (SVG lub icon component)
- `<div>` wartość numeryczna (duża czcionka)
- `<p>` opis/label
- Opcjonalnie: `<span>` z dodatkową informacją (np. trend, zmiana)

**Obsługiwane interakcje:**
- Opcjonalnie klikalne (jeśli przekazano `onClick` lub `linkTo`)
- Hover state

**Obsługiwana walidacja:**
- Jeśli `value` jest null/undefined, wyświetl "—" lub "Brak danych"

**Typy:**
```typescript
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  additionalInfo?: string;
  linkTo?: string;
  onClick?: () => void;
}
```

**Propsy:**
- `icon: React.ReactNode` - Ikona statystyki
- `label: string` - Opis statystyki
- `value: string | number` - Wartość do wyświetlenia
- `additionalInfo?: string` - Dodatkowa informacja (opcjonalna)
- `linkTo?: string` - Link do przekierowania (opcjonalny)
- `onClick?: () => void` - Handler kliknięcia (opcjonalny)

---

### 4.5 FavoritesWidget (React, client:idle)

**Opis komponentu:**
Widget wyświetlający top 3 ulubione centra krwiodawstwa użytkownika wraz z ich aktualnymi stanami krwi. Pokazuje krytyczne poziomy krwi jako alert.

**Główne elementy:**
- `<section>` wrapper
- `<h2>` nagłówek: "Twoje ulubione centra"
- Lista `<FavoriteCard>` (max 3)
- `<Link>` do `/dashboard/favorites` ("Zobacz wszystkie")
- EmptyState jeśli brak ulubionych

**Obsługiwane interakcje:**
- Kliknięcie w kartę ulubionego centrum → `/rckik/{id}`
- Kliknięcie "Zobacz wszystkie" → `/dashboard/favorites`

**Obsługiwana walidacja:**
- Jeśli użytkownik nie ma ulubionych, wyświetl EmptyState z CTA "Dodaj ulubione centrum"
- Sortuj ulubione według `priority` (jeśli ustawione) lub `addedAt` (najnowsze pierwsze)
- Wyświetl tylko top 3

**Typy:**
```typescript
interface FavoritesWidgetProps {
  favorites: FavoriteRckikDto[];
}

interface FavoriteRckikDto {
  id: number;
  rckikId: number;
  name: string;
  code: string;
  city: string;
  address: string;
  priority: number | null;
  addedAt: string; // ISO 8601
  currentBloodLevels: BloodLevelDto[];
}

interface BloodLevelDto {
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: 'CRITICAL' | 'IMPORTANT' | 'OK';
  lastUpdate: string; // ISO 8601
}
```

**Propsy:**
- `favorites: FavoriteRckikDto[]` - Lista ulubionych centrów (max 3)

---

### 4.6 FavoriteCard (React)

**Opis komponentu:**
Karta pojedynczego ulubionego centrum krwiodawstwa z wizualizacją aktualnych stanów krwi.

**Główne elementy:**
- `<div>` wrapper klikalne (card)
- `<h3>` nazwa centrum
- `<p>` miasto
- Lista `<BloodLevelBadge>` dla wszystkich grup krwi
- `<span>` timestamp ostatniej aktualizacji

**Obsługiwane interakcje:**
- Kliknięcie całej karty → `/rckik/{rckikId}`
- Hover state

**Obsługiwana walidacja:**
- Jeśli `currentBloodLevels` jest puste, wyświetl "Brak danych o stanach krwi"
- Wyróżnij poziomy CRITICAL kolorem czerwonym

**Typy:**
```typescript
interface FavoriteCardProps {
  favorite: FavoriteRckikDto;
  onClick: (rckikId: number) => void;
}
```

**Propsy:**
- `favorite: FavoriteRckikDto` - Dane centrum
- `onClick: (rckikId: number) => void` - Handler kliknięcia

---

### 4.7 NotificationsWidget (React, client:idle)

**Opis komponentu:**
Widget wyświetlający ostatnie 5 nieprzeczytanych powiadomień in-app. Jeśli brak nieprzeczytanych, pokazuje ostatnie 5 przeczytane.

**Główne elementy:**
- `<section>` wrapper
- `<h2>` nagłówek: "Powiadomienia"
- `<div>` badge z liczbą nieprzeczytanych
- Lista `<NotificationItem>` (max 5)
- `<Link>` do `/dashboard/notifications` ("Zobacz wszystkie")
- EmptyState jeśli brak powiadomień

**Obsługiwane interakcje:**
- Kliknięcie w powiadomienie → oznacz jako przeczytane + przekieruj do `linkUrl`
- Kliknięcie "Zobacz wszystkie" → `/dashboard/notifications`

**Obsługiwana walidacja:**
- Jeśli brak powiadomień, wyświetl EmptyState: "Brak nowych powiadomień"
- Najpierw wyświetl nieprzeczytane (`readAt === null`)
- Ogranicz do 5 najnowszych

**Typy:**
```typescript
interface NotificationsWidgetProps {
  notifications: InAppNotificationDto[];
  unreadCount: number;
}

interface InAppNotificationDto {
  id: number;
  type: string;
  rckik: { id: number; name: string } | null;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null; // ISO 8601
  expiresAt: string | null;
  createdAt: string; // ISO 8601
}
```

**Propsy:**
- `notifications: InAppNotificationDto[]` - Lista powiadomień (max 5)
- `unreadCount: number` - Liczba nieprzeczytanych powiadomień

---

### 4.8 NotificationItem (React)

**Opis komponentu:**
Pojedyncze powiadomienie in-app z tytułem, treścią i timestampem.

**Główne elementy:**
- `<div>` wrapper (klikalne jeśli `linkUrl` istnieje)
- `<div>` ikona według typu powiadomienia
- `<h4>` tytuł powiadomienia
- `<p>` treść (skrócona do 100 znaków)
- `<span>` timestamp (relatywny czas, np. "2 godziny temu")
- Badge "Nowe" jeśli `readAt === null`

**Obsługiwane interakcje:**
- Kliknięcie → wywołaj `onRead(notificationId)` + nawiguj do `linkUrl`
- Hover state

**Obsługiwana walidacja:**
- Jeśli `linkUrl` jest null, komponent nie jest klikalny
- Jeśli treść > 100 znaków, skróć i dodaj "..."

**Typy:**
```typescript
interface NotificationItemProps {
  notification: InAppNotificationDto;
  onRead: (notificationId: number) => void;
}
```

**Propsy:**
- `notification: InAppNotificationDto` - Dane powiadomienia
- `onRead: (notificationId: number) => void` - Handler oznaczenia jako przeczytane

---

### 4.9 RecentDonationsTimeline (React, client:visible)

**Opis komponentu:**
Oś czasu (timeline) pokazująca ostatnie 3 donacje użytkownika w formie wizualnej linii z punktami.

**Główne elementy:**
- `<section>` wrapper
- `<h2>` nagłówek: "Ostatnie donacje"
- Timeline container z pionową linią
- Lista `<DonationTimelineItem>` (max 3)
- `<Link>` do `/dashboard/donations` ("Zobacz wszystkie")
- EmptyState jeśli brak donacji

**Obsługiwane interakcje:**
- Kliknięcie w item → nawigacja do `/dashboard/donations` ze scrollem do konkretnej donacji (opcjonalne)
- Kliknięcie "Zobacz wszystkie" → `/dashboard/donations`

**Obsługiwana walidacja:**
- Jeśli brak donacji, wyświetl EmptyState z CTA "Dodaj swoją pierwszą donację"
- Sortuj według `donationDate` (najnowsze pierwsze)
- Wyświetl tylko ostatnie 3

**Typy:**
```typescript
interface RecentDonationsTimelineProps {
  donations: DonationResponse[];
}

interface DonationResponse {
  id: number;
  rckik: { id: number; name: string; code: string };
  donationDate: string; // ISO 8601 date
  quantityMl: number;
  donationType: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
  notes: string | null;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Propsy:**
- `donations: DonationResponse[]` - Lista ostatnich donacji (max 3)

---

### 4.10 DonationTimelineItem (React)

**Opis komponentu:**
Pojedynczy element osi czasu reprezentujący jedną donację.

**Główne elementy:**
- `<div>` wrapper z timeline dot (kółko)
- `<span>` data donacji (sformatowana: "5 stycznia 2025")
- `<p>` nazwa centrum
- `<p>` ilość oddanej krwi: "{quantityMl} ml"
- `<span>` typ donacji badge
- Ikona potwierdzenia jeśli `confirmed === true`

**Obsługiwane interakcje:**
- Hover state
- Opcjonalnie kliknięcie (jeśli przekazano `onClick`)

**Obsługiwana walidacja:**
- Wyświetl typ donacji w czytelnej formie (FULL_BLOOD → "Krew pełna")
- Jeśli nie potwierdzono (`confirmed === false`), wyświetl subtelny badge "Niepotwierdzona"

**Typy:**
```typescript
interface DonationTimelineItemProps {
  donation: DonationResponse;
  onClick?: (donationId: number) => void;
}
```

**Propsy:**
- `donation: DonationResponse` - Dane donacji
- `onClick?: (donationId: number) => void` - Handler kliknięcia (opcjonalny)

---

### 4.11 QuickActionsPanel (React)

**Opis komponentu:**
Panel z przyciskami szybkich akcji umożliwiających nawigację do najważniejszych funkcji aplikacji.

**Główne elementy:**
- `<section>` wrapper
- `<h2>` nagłówek: "Szybkie akcje"
- Grid z 3 `<QuickActionButton>`

**Obsługiwane interakcje:**
- Kliknięcie każdego przycisku → nawigacja do odpowiedniej strony

**Obsługiwana walidacja:**
Brak (statyczne linki)

**Typy:**
```typescript
interface QuickActionsPanelProps {
  // Brak dodatkowych propsów - statyczny komponent
}
```

**Propsy:**
Brak

---

### 4.12 QuickActionButton (React)

**Opis komponentu:**
Pojedynczy przycisk szybkiej akcji z ikoną i opisem.

**Główne elementy:**
- `<Link>` lub `<button>` wrapper
- `<div>` ikona (SVG)
- `<span>` label akcji

**Obsługiwane interakcje:**
- Kliknięcie → nawigacja do `href` lub wywołanie `onClick`
- Hover state
- Focus state (keyboard navigation)

**Obsługiwana walidacja:**
Brak

**Typy:**
```typescript
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}
```

**Propsy:**
- `icon: React.ReactNode` - Ikona akcji
- `label: string` - Opis akcji
- `href?: string` - Link do nawigacji (opcjonalny)
- `onClick?: () => void` - Handler kliknięcia (opcjonalny)
- `variant?: 'primary' | 'secondary'` - Wariant stylu (opcjonalny)

---

## 5. Typy

### 5.1 DTO z API (Backend)

```typescript
// Importowane z backend DTO

interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: string | null;
  emailVerified: boolean;
  consentTimestamp: string; // ISO 8601
  consentVersion: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface DonationStatisticsDto {
  totalDonations: number;
  totalQuantityMl: number;
  lastDonationDate: string | null; // ISO 8601 date
}

interface DonationResponse {
  id: number;
  rckik: RckikBasicDto;
  donationDate: string; // ISO 8601 date
  quantityMl: number;
  donationType: 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';
  notes: string | null;
  confirmed: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface RckikBasicDto {
  id: number;
  name: string;
  code: string;
  city?: string;
}

interface FavoriteRckikDto {
  id: number;
  rckikId: number;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  priority: number | null;
  addedAt: string; // ISO 8601
  currentBloodLevels: BloodLevelDto[];
}

interface BloodLevelDto {
  bloodGroup: string;
  levelPercentage: number;
  levelStatus: 'CRITICAL' | 'IMPORTANT' | 'OK';
  lastUpdate: string; // ISO 8601
}

interface InAppNotificationDto {
  id: number;
  type: string;
  rckik: { id: number; name: string } | null;
  title: string;
  message: string;
  linkUrl: string | null;
  readAt: string | null; // ISO 8601
  expiresAt: string | null; // ISO 8601
  createdAt: string; // ISO 8601
}

interface InAppNotificationsResponse {
  notifications: InAppNotificationDto[];
  page: number;
  size: number;
  totalElements: number;
  unreadCount: number;
}

interface DonationListResponse {
  donations: DonationResponse[];
  page: number;
  size: number;
  totalElements: number;
  statistics: DonationStatisticsDto;
}
```

### 5.2 ViewModels (Frontend)

```typescript
// Nowe typy specyficzne dla widoku Dashboard

interface DashboardData {
  user: UserProfileResponse;
  statistics: DonationStatisticsDto;
  recentDonations: DonationResponse[];
  favorites: FavoriteRckikDto[];
  notifications: InAppNotificationDto[];
  unreadNotificationsCount: number;
  nextEligibleDonationDate: string | null; // ISO 8601 date
}

interface NextDonationInfo {
  date: string | null; // ISO 8601 date
  daysRemaining: number | null;
  isEligible: boolean;
}

interface StatsCardData {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  additionalInfo?: string;
  linkTo?: string;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}
```

### 5.3 Formaty wyświetlania

```typescript
// Helper types dla formatowania

type DonationType = 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER';

const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  FULL_BLOOD: 'Krew pełna',
  PLASMA: 'Osocze',
  PLATELETS: 'Płytki krwi',
  OTHER: 'Inne',
};

type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

type NotificationType =
  | 'CRITICAL_BLOOD_LEVEL'
  | 'SYSTEM_ALERT'
  | 'DONATION_REMINDER'
  | 'OTHER';

const NOTIFICATION_TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  CRITICAL_BLOOD_LEVEL: <AlertTriangleIcon />,
  SYSTEM_ALERT: <InfoIcon />,
  DONATION_REMINDER: <BellIcon />,
  OTHER: <MessageIcon />,
};
```

## 6. Zarządzanie stanem

### 6.1 Redux Store Structure

Dashboard korzysta z kilku slice'ów Redux Toolkit:

```typescript
// Store structure
{
  auth: {
    user: UserProfileResponse | null;
    isAuthenticated: boolean;
    token: string | null;
  },
  donations: {
    items: DonationResponse[];
    statistics: DonationStatisticsDto | null;
    loading: boolean;
    error: string | null;
  },
  favorites: {
    items: FavoriteRckikDto[];
    loading: boolean;
    error: string | null;
  },
  notifications: {
    items: InAppNotificationDto[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
  }
}
```

### 6.2 Custom Hooks

**useDashboardData**
```typescript
function useDashboardData() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const statistics = useSelector((state) => state.donations.statistics);
  const favorites = useSelector((state) => state.favorites.items);
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  useEffect(() => {
    // Fetch all dashboard data on mount
    dispatch(fetchDonationStatistics());
    dispatch(fetchRecentDonations({ size: 3 }));
    dispatch(fetchFavorites());
    dispatch(fetchNotifications({ unreadOnly: false, size: 5 }));
  }, [dispatch]);

  const nextEligibleDate = calculateNextEligibleDate(
    statistics?.lastDonationDate
  );

  return {
    user,
    statistics,
    favorites: favorites.slice(0, 3),
    notifications: notifications.slice(0, 5),
    unreadCount,
    nextEligibleDate,
    loading: /* aggregate loading states */,
    error: /* aggregate error states */,
  };
}
```

**useNotificationActions**
```typescript
function useNotificationActions() {
  const dispatch = useDispatch();

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      dispatch(decrementUnreadCount());
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [dispatch]);

  return { markAsRead };
}
```

**useNextDonationInfo**
```typescript
function useNextDonationInfo(lastDonationDate: string | null): NextDonationInfo {
  return useMemo(() => {
    if (!lastDonationDate) {
      return {
        date: null,
        daysRemaining: null,
        isEligible: true,
      };
    }

    const lastDate = new Date(lastDonationDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 56); // 56 dni między donacjami pełnej krwi

    const today = new Date();
    const daysRemaining = Math.ceil(
      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      date: nextDate.toISOString().split('T')[0],
      daysRemaining: Math.max(0, daysRemaining),
      isEligible: daysRemaining <= 0,
    };
  }, [lastDonationDate]);
}
```

### 6.3 Nie wymagany custom hook dla Dashboard

Dashboard wykorzystuje głównie istniejące slice'y Redux i standardowe hooki (`useSelector`, `useDispatch`). Custom hook `useDashboardData` agreguje dane z różnych źródeł i jest rekomendowany, ale nie jest ściśle wymagany - można też bezpośrednio używać `useSelector` w komponencie głównym.

## 7. Integracja API

### 7.1 Endpoints używane przez Dashboard

| Endpoint | Method | Typ żądania | Typ odpowiedzi | Cel |
|----------|--------|-------------|----------------|-----|
| `/api/v1/users/me` | GET | - | `UserProfileResponse` | Pobranie profilu użytkownika |
| `/api/v1/users/me/donations` | GET | `?page=0&size=3&sortOrder=DESC` | `DonationListResponse` | Ostatnie 3 donacje + statystyki |
| `/api/v1/users/me/favorites` | GET | - | `{ favorites: FavoriteRckikDto[] }` | Lista ulubionych centrów (top 3) |
| `/api/v1/users/me/notifications` | GET | `?unreadOnly=false&size=5` | `InAppNotificationsResponse` | Ostatnie 5 powiadomień |
| `/api/v1/users/me/notifications/unread-count` | GET | - | `{ unreadCount: number }` | Liczba nieprzeczytanych powiadomień |
| `/api/v1/users/me/notifications/{id}` | PATCH | `{ readAt: string }` | `InAppNotificationDto` | Oznacz powiadomienie jako przeczytane |

### 7.2 Strategia ładowania danych

**Podczas renderowania SSR (Astro):**
```typescript
// src/pages/dashboard/index.astro
---
import { api } from '@/lib/api/client';

// Verify auth token from cookies
const token = Astro.cookies.get('accessToken')?.value;
if (!token) {
  return Astro.redirect('/login');
}

// Fetch dashboard data server-side
const [userRes, donationsRes, favoritesRes, notificationsRes] =
  await Promise.all([
    api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } }),
    api.get('/users/me/donations?size=3&sortOrder=DESC', { headers: { Authorization: `Bearer ${token}` } }),
    api.get('/users/me/favorites', { headers: { Authorization: `Bearer ${token}` } }),
    api.get('/users/me/notifications?size=5', { headers: { Authorization: `Bearer ${token}` } }),
  ]);

const dashboardData: DashboardData = {
  user: userRes.data,
  statistics: donationsRes.data.statistics,
  recentDonations: donationsRes.data.donations.slice(0, 3),
  favorites: favoritesRes.data.favorites.slice(0, 3),
  notifications: notificationsRes.data.notifications.slice(0, 5),
  unreadNotificationsCount: notificationsRes.data.unreadCount,
  nextEligibleDonationDate: calculateNextEligibleDate(donationsRes.data.statistics.lastDonationDate),
};
---

<DashboardLayout>
  <DashboardContent data={dashboardData} client:load />
</DashboardLayout>
```

**Dla interaktywnych komponentów (React islands):**
- Dane przekazywane jako props z poziomu SSR
- Akcje interaktywne (np. oznaczanie powiadomień) używają Redux thunks
- Optimistic updates dla lepszego UX

### 7.3 Obsługa błędów API

```typescript
// Error handling w Axios interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login, clear auth state
      window.location.href = '/login?expired=true';
    }

    if (error.response?.status === 403) {
      // Email not verified or insufficient permissions
      showToast('Zweryfikuj swój email, aby uzyskać dostęp', 'error');
    }

    if (error.response?.status >= 500) {
      // Server error
      showToast('Wystąpił błąd serwera. Spróbuj ponownie później.', 'error');
    }

    return Promise.reject(error);
  }
);
```

### 7.4 Cache i revalidation

- **SSR Data:** Fresh on every page load (no cache)
- **Client-side Redux Cache:**
  - Donations cache: 5 minutes
  - Favorites cache: 5 minutes
  - Notifications cache: 1 minute (poll every 30s for updates)

## 8. Interakcje użytkownika

### 8.1 Główne interakcje

| Akcja użytkownika | Komponent | Rezultat |
|-------------------|-----------|----------|
| Wejście na `/dashboard` | DashboardPage | Załadowanie i wyświetlenie danych użytkownika |
| Kliknięcie karty statystyki | StatsCard | Nawigacja do `/dashboard/donations` |
| Kliknięcie ulubionego centrum | FavoriteCard | Nawigacja do `/rckik/{rckikId}` |
| Kliknięcie "Zobacz wszystkie ulubione" | FavoritesWidget | Nawigacja do `/dashboard/favorites` |
| Kliknięcie powiadomienia | NotificationItem | Oznaczenie jako przeczytane + nawigacja do `linkUrl` |
| Kliknięcie "Zobacz wszystkie powiadomienia" | NotificationsWidget | Nawigacja do `/dashboard/notifications` |
| Kliknięcie "Zobacz wszystkie donacje" | RecentDonationsTimeline | Nawigacja do `/dashboard/donations` |
| Kliknięcie "Dodaj donację" | QuickActionButton | Nawigacja do `/dashboard/donations` z otwartym modalem dodawania |
| Kliknięcie "Zobacz ulubione" | QuickActionButton | Nawigacja do `/dashboard/favorites` |
| Kliknięcie "Szukaj centrum" | QuickActionButton | Nawigacja do `/rckik` |

### 8.2 Stany ładowania i błędów

**Ładowanie:**
- Podczas SSR: Serwer czeka na wszystkie API calls przed renderowaniem
- Jeśli API zwróci błąd podczas SSR: wyświetl error page z możliwością retry
- Client-side (React islands): pokazuj skeletony dla asynchronicznych akcji (np. oznaczanie powiadomień)

**Błędy:**
- **401 Unauthorized:** Automatyczne przekierowanie do `/login`
- **403 Forbidden (email not verified):** Banner z linkiem do resend verification email
- **404 Not Found:** Rzadko w Dashboard (dane zawsze istnieją dla zalogowanego użytkownika)
- **500 Server Error:** Wyświetl Toast z komunikatem błędu i opcją "Spróbuj ponownie"

**Empty States:**
- **Brak donacji:** Wyświetl ilustrację + CTA "Dodaj swoją pierwszą donację"
- **Brak ulubionych:** Wyświetl ilustrację + CTA "Dodaj ulubione centrum"
- **Brak powiadomień:** Wyświetl "Brak nowych powiadomień" z ikoną

### 8.3 Responsywność

**Desktop (≥1024px):**
- StatsCardsGrid: 2x2 grid
- Dwie kolumny: lewa (wider) z donacjami i statystykami, prawa (narrower) z ulubionymi i powiadomieniami

**Tablet (768px - 1023px):**
- StatsCardsGrid: 2x2 grid
- Single column layout dla widgets

**Mobile (<768px):**
- StatsCardsGrid: 1 kolumna (4 karty jedna pod drugą)
- Single column layout
- Bottom navigation bar dla szybkich akcji

## 9. Warunki i walidacja

### 9.1 Warunki dostępu

| Warunek | Weryfikacja | Akcja przy niepowodzeniu |
|---------|-------------|--------------------------|
| Użytkownik zalogowany | JWT token w cookies/localStorage | Redirect do `/login` |
| Token ważny | Weryfikacja signature i expiry | Redirect do `/login?expired=true` |
| Email zweryfikowany | `user.emailVerified === true` | Banner: "Zweryfikuj email" + disable niektóre akcje |
| Konto aktywne | `user.deletedAt === null` | Redirect do `/login` z komunikatem |

### 9.2 Warunki wyświetlania komponentów

**WelcomeSection:**
- Zawsze widoczna
- Jeśli `firstName` null → wyświetl "Witaj!"
- Jeśli `bloodGroup` null → ukryj informację o grupie krwi

**StatsCardsGrid:**
- Zawsze widoczna
- Jeśli `totalDonations === 0` → wyświetl zera i zachęcający komunikat

**FavoritesWidget:**
- Jeśli `favorites.length === 0` → wyświetl EmptyState
- Jeśli `favorites.length > 0` → wyświetl top 3

**NotificationsWidget:**
- Jeśli `notifications.length === 0` → wyświetl EmptyState
- Najpierw nieprzeczytane, potem przeczytane

**RecentDonationsTimeline:**
- Jeśli `recentDonations.length === 0` → wyświetl EmptyState
- Jeśli `recentDonations.length > 0` → wyświetl ostatnie 3

**NextDonationCard (w StatsCardsGrid):**
- Jeśli `lastDonationDate === null` → "Możesz oddać krew już teraz!"
- Jeśli `daysRemaining > 0` → "Następna donacja za {daysRemaining} dni"
- Jeśli `daysRemaining <= 0` → "Możesz oddać krew już teraz!" (zielony kolor)

### 9.3 Walidacja danych z API

**UserProfileResponse:**
- `email` musi być niepusty string
- `firstName` i `lastName` mogą być null (fallback do "Użytkownik")
- `bloodGroup` nullable (ukryj jeśli null)

**DonationStatisticsDto:**
- `totalDonations` >= 0 (domyślnie 0)
- `totalQuantityMl` >= 0 (domyślnie 0)
- `lastDonationDate` nullable (jeśli null → użytkownik nigdy nie dodał donacji)

**FavoriteRckikDto[]:**
- Może być pusta tablica
- `currentBloodLevels` może być pusta (wyświetl "Brak danych")

**InAppNotificationDto[]:**
- Może być pusta tablica
- `linkUrl` nullable (jeśli null → powiadomienie nie jest klikalne)
- `readAt` nullable (null = nieprzeczytane)

### 9.4 Business Rules

1. **Odstęp między donacjami pełnej krwi:** 56 dni
   - Oblicz `nextEligibleDate = lastDonationDate + 56 dni`
   - Jeśli `today >= nextEligibleDate` → użytkownik jest uprawniony

2. **Limity wyświetlania:**
   - Maksymalnie 3 ulubione centra
   - Maksymalnie 5 powiadomień
   - Maksymalnie 3 ostatnie donacje

3. **Priorytety ulubionych:**
   - Sortuj według `priority` (ascending) jeśli ustawione
   - Jeśli brak `priority`, sortuj według `addedAt` (najnowsze pierwsze)

4. **Status poziomów krwi:**
   - CRITICAL: `levelPercentage < 20%` → czerwony kolor, ikona alertu
   - IMPORTANT: `levelPercentage < 50%` → żółty/pomarańczowy kolor, ikona ostrzeżenia
   - OK: `levelPercentage >= 50%` → zielony kolor, ikona checkmark

## 10. Obsługa błędów

### 10.1 Błędy API

| Kod błędu | Opis | Obsługa w UI |
|-----------|------|--------------|
| 401 | Brak autoryzacji / token wygasł | Automatyczny redirect do `/login?expired=true` |
| 403 | Email nie zweryfikowany | Banner z CTA "Wyślij ponownie email weryfikacyjny" |
| 404 | Zasób nie znaleziony | Rzadkie na Dashboard; wyświetl Toast |
| 500 | Błąd serwera | Toast z komunikatem + przycisk "Odśwież stronę" |
| 503 | Serwis niedostępny | Pełnoekranowy error state z "Spróbuj ponownie" |

### 10.2 Błędy sieciowe

**Timeout:**
```typescript
// Axios config
const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000, // 10 sekund
});

// Obsługa timeout
if (error.code === 'ECONNABORTED') {
  showToast('Żądanie przekroczyło czas oczekiwania. Spróbuj ponownie.', 'error');
}
```

**Brak połączenia:**
```typescript
if (!navigator.onLine) {
  showBanner('Brak połączenia z internetem. Sprawdź swoje połączenie.', 'error');
}

window.addEventListener('online', () => {
  showToast('Połączenie przywrócone', 'success');
  // Optionally: retry failed requests
});
```

### 10.3 Przypadki brzegowe

**1. Użytkownik bez żadnych danych:**
- Nowe konto, brak donacji, brak ulubionych, brak powiadomień
- Rozwiązanie: Wyświetl onboarding UI z 3 krokami:
  1. "Dodaj swoje pierwsze ulubione centrum"
  2. "Zarejestruj swoją ostatnią donację"
  3. "Ustaw preferencje powiadomień"

**2. API zwraca niepełne dane:**
- Przykład: `statistics` null, ale `donations` array nie jest pusty
- Rozwiązanie: Oblicz statystyki client-side z dostępnych danych lub wyświetl komunikat "Ładowanie statystyk..."

**3. Stary token w localStorage:**
- Token jest wygasły ale jeszcze nie został usunięty
- Rozwiązanie: Axios interceptor automatycznie wykrywa 401 i czyści state + redirect

**4. Dane niespójne (race condition):**
- Użytkownik usuwa ulubione w innej karcie, ale Dashboard jeszcze nie odświeżony
- Rozwiązanie: Polling co 5 minut dla świeżych danych lub WebSocket (future)

**5. Bardzo długie nazwy centrów:**
- Nazwa centrum ma 100+ znaków
- Rozwiązanie: Obcięcie z ellipsis (`text-overflow: ellipsis`) + tooltip z pełną nazwą na hover

**6. Użytkownik ma 50+ ulubionych:**
- Dashboard pokazuje tylko top 3
- Rozwiązanie: Jasny link "Zobacz wszystkie ({total})" prowadzący do `/dashboard/favorites`

### 10.4 Rollback strategia dla optimistic updates

**Przykład: Oznaczanie powiadomienia jako przeczytane**

```typescript
async function handleNotificationClick(notification: InAppNotificationDto) {
  // 1. Optimistic update
  dispatch(markNotificationAsReadOptimistic(notification.id));
  dispatch(decrementUnreadCount());

  try {
    // 2. API call
    await api.patch(`/users/me/notifications/${notification.id}`, {
      readAt: new Date().toISOString(),
    });

    // 3. Success - navigate
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  } catch (error) {
    // 4. Rollback on error
    dispatch(rollbackNotificationRead(notification.id));
    dispatch(incrementUnreadCount());

    showToast('Nie udało się oznaczyć powiadomienia. Spróbuj ponownie.', 'error');
  }
}
```

## 11. Kroki implementacji

### Krok 1: Setup projektu i routing (1-2 godziny)
1. Utwórz plik `/src/pages/dashboard/index.astro`
2. Utwórz layout `DashboardLayout.astro` z sidebar i navbar
3. Skonfiguruj middleware auth dla chronionej ścieżki `/dashboard/*`
4. Dodaj redirect z `/login` do `/dashboard` po udanym logowaniu
5. Przetestuj dostęp: z tokenem → dashboard, bez tokena → redirect do login

### Krok 2: Integracja API i typy (2-3 godziny)
1. Utwórz typy TypeScript:
   - Skopiuj DTO z backendu do `src/lib/types/api.ts`
   - Utwórz ViewModels w `src/lib/types/dashboard.ts`
2. Utwórz API client endpoints:
   - `src/lib/api/endpoints/users.ts` (GET /users/me)
   - `src/lib/api/endpoints/donations.ts` (GET /users/me/donations)
   - `src/lib/api/endpoints/favorites.ts` (GET /users/me/favorites)
   - `src/lib/api/endpoints/notifications.ts` (GET /users/me/notifications)
3. Implementuj SSR fetching w `dashboard/index.astro`:
   - Fetch wszystkie dane równoległe (Promise.all)
   - Obsłuż błędy (401 → redirect, 500 → error page)
   - Przekaż dane jako props do głównego komponentu

### Krok 3: Redux store setup (2 godziny)
1. Utwórz slice'y Redux:
   - `authSlice.ts` (jeśli nie istnieje)
   - `donationsSlice.ts` z akcjami: fetchDonationStatistics, fetchRecentDonations
   - `favoritesSlice.ts` z akcjami: fetchFavorites
   - `notificationsSlice.ts` z akcjami: fetchNotifications, markNotificationAsRead
2. Skonfiguruj store w `src/lib/store/index.ts`
3. Dodaj Redux Provider w layout (jeśli nie istnieje)

### Krok 4: UI Primitives (2-3 godziny)
Jeśli nie istnieją, utwórz komponenty bazowe:
1. `src/components/ui/Card.tsx` - karta z padding i shadow
2. `src/components/ui/Badge.tsx` - badge dla statusów i typów
3. `src/components/ui/Skeleton.tsx` - placeholder podczas ładowania
4. `src/components/ui/Button.tsx` - przyciski (jeśli nie istnieją)
5. `src/components/ui/EmptyState.tsx` - komponent dla pustych list

### Krok 5: Komponenty Dashboard (8-10 godzin)

**5.1 WelcomeSection (30 min)**
1. Utwórz `src/components/dashboard/WelcomeSection.tsx`
2. Wyświetl imię użytkownika i grupę krwi
3. Dodaj walidację dla null values
4. Style z Tailwind (responsive)

**5.2 StatsCardsGrid i StatsCard (2 godz.)**
1. Utwórz `src/components/dashboard/StatsCard.tsx`:
   - Props: icon, label, value, additionalInfo, linkTo
   - Hover state, optional click handler
2. Utwórz `src/components/dashboard/StatsCardsGrid.tsx`:
   - 4 karty: liczba donacji, całkowita ilość, ostatnia donacja, następna możliwa
   - Oblicz nextEligibleDate client-side
   - Grid layout: 2x2 desktop, 1 kolumna mobile
3. Dodaj ikony (Lucide React lub Heroicons)

**5.3 FavoritesWidget i FavoriteCard (2-3 godz.)**
1. Utwórz `src/components/dashboard/FavoriteCard.tsx`:
   - Wyświetl nazwę, miasto, adres centrum
   - Lista BloodLevelBadge dla każdej grupy krwi
   - Klikalna karta → navigate to `/rckik/{id}`
   - Wyróżnij CRITICAL levels czerwonym kolorem
2. Utwórz `src/components/dashboard/FavoritesWidget.tsx`:
   - Wyświetl top 3 ulubione
   - EmptyState jeśli brak ulubionych
   - Link "Zobacz wszystkie" → `/dashboard/favorites`

**5.4 NotificationsWidget i NotificationItem (2 godz.)**
1. Utwórz `src/components/dashboard/NotificationItem.tsx`:
   - Wyświetl tytuł, treść (skróconą), timestamp
   - Ikona według typu powiadomienia
   - Badge "Nowe" jeśli nieprzeczytane
   - Kliknięcie → markAsRead + navigate to linkUrl
2. Utwórz `src/components/dashboard/NotificationsWidget.tsx`:
   - Wyświetl ostatnie 5 powiadomień
   - Badge z liczbą nieprzeczytanych
   - EmptyState jeśli brak powiadomień
   - Link "Zobacz wszystkie" → `/dashboard/notifications`

**5.5 RecentDonationsTimeline i DonationTimelineItem (2-3 godz.)**
1. Utwórz `src/components/dashboard/DonationTimelineItem.tsx`:
   - Timeline dot (kółko po lewej stronie)
   - Data donacji (sformatowana)
   - Nazwa centrum
   - Ilość + typ donacji
   - Ikona potwierdzenia jeśli confirmed
2. Utwórz `src/components/dashboard/RecentDonationsTimeline.tsx`:
   - Pionowa linia timeline
   - Lista 3 ostatnich donacji
   - EmptyState jeśli brak donacji
   - Link "Zobacz wszystkie" → `/dashboard/donations`

**5.6 QuickActionsPanel i QuickActionButton (1 godz.)**
1. Utwórz `src/components/dashboard/QuickActionButton.tsx`:
   - Przycisk z ikoną i labelem
   - Variants: primary, secondary
2. Utwórz `src/components/dashboard/QuickActionsPanel.tsx`:
   - 3 przyciski: Dodaj donację, Zobacz ulubione, Szukaj centrum
   - Grid layout

### Krok 6: Kompozycja Dashboard (1-2 godziny)
1. W `src/pages/dashboard/index.astro` skomponuj wszystkie komponenty:
   - Przekaż dane z SSR jako props
   - Hydratuj komponenty React z odpowiednimi strategiami:
     - WelcomeSection: `client:load` (natychmiastowa widoczność)
     - StatsCardsGrid: `client:load` (krytyczne dane)
     - FavoritesWidget: `client:idle` (lazy load)
     - NotificationsWidget: `client:idle`
     - RecentDonationsTimeline: `client:visible`
     - QuickActionsPanel: `client:load`
2. Dodaj layout grid dla desktop (2 kolumny) i mobile (1 kolumna)

### Krok 7: Custom Hooks (1-2 godziny)
1. Utwórz `src/lib/hooks/useDashboardData.ts`:
   - Agreguje dane z Redux store
   - Oblicza nextEligibleDate
   - Zwraca loading i error states
2. Utwórz `src/lib/hooks/useNotificationActions.ts`:
   - Handler markAsRead z optimistic update
   - Rollback przy błędzie
3. Utwórz `src/lib/hooks/useNextDonationInfo.ts`:
   - Oblicza nextEligibleDate, daysRemaining, isEligible
   - Memoizacja dla wydajności

### Krok 8: Formatowanie i helpers (1 godz.)
1. Utwórz `src/lib/utils/formatters.ts`:
   - `formatDate(date: string): string` - format "5 stycznia 2025"
   - `formatRelativeTime(date: string): string` - "2 godziny temu"
   - `formatBloodGroup(group: string): string` - format grup krwi
   - `formatDonationType(type: DonationType): string` - polskie nazwy
2. Utwórz `src/lib/utils/calculations.ts`:
   - `calculateNextEligibleDate(lastDate: string | null): string | null`
   - `getDaysRemaining(targetDate: string): number`

### Krok 9: Obsługa błędów i edge cases (2 godziny)
1. Dodaj error boundary w layout
2. Implementuj Toast notifications dla błędów
3. Dodaj fallback UI dla błędów API podczas SSR:
   - Error page z przyciskiem "Spróbuj ponownie"
4. Obsłuż empty states:
   - Brak donacji → EmptyState z CTA
   - Brak ulubionych → EmptyState z CTA
   - Brak powiadomień → EmptyState
5. Dodaj skeletony dla stanów ładowania (client-side actions)

### Krok 10: Styling i responsywność (2-3 godziny)
1. Dodaj Tailwind classes dla wszystkich komponentów
2. Przetestuj responsywność:
   - Desktop: 2-kolumnowy layout
   - Tablet: 1-kolumnowy layout
   - Mobile: 1-kolumnowy layout + bottom nav
3. Dodaj hover states, focus states
4. Dodaj animacje (opcjonalne):
   - Fade in dla kart
   - Slide in dla powiadomień
   - Skeleton pulse

### Krok 11: Accessibility (1-2 godziny)
1. Dodaj ARIA labels:
   - `aria-label` dla ikon bez tekstu
   - `aria-live` dla Toast notifications
   - `role="status"` dla loading states
2. Przetestuj keyboard navigation:
   - Tab przez wszystkie interaktywne elementy
   - Enter/Space dla kliknięć
3. Sprawdź kontrast kolorów (min 4.5:1)
4. Dodaj alt text dla obrazów/ikon
5. Przetestuj z screen readerem (NVDA / VoiceOver)

### Krok 12: Testing (2-3 godziny)
1. **Unit testy** (Vitest):
   - Testy dla custom hooks: `useDashboardData`, `useNextDonationInfo`
   - Testy dla utils: `formatters.ts`, `calculations.ts`
2. **Component testy** (React Testing Library):
   - Testy dla StatsCard, FavoriteCard, NotificationItem
   - Mockowanie Redux store
3. **Integration testy** (RTL + MSW):
   - Test pełnego flow: load Dashboard → render wszystkich sekcji
   - Test interakcji: click notification → markAsRead → navigate
4. **E2E test** (Playwright):
   - Login → Dashboard → verify wszystkie sekcje widoczne
   - Click "Dodaj donację" → redirect do `/dashboard/donations`

### Krok 13: Performance optimization (1-2 godziny)
1. Code splitting:
   - Lazy load komponentów z `client:visible`
2. Memoizacja:
   - `React.memo` dla komponentów prezentacyjnych
   - `useMemo` dla expensive calculations
3. Bundle size analysis:
   - Sprawdź rozmiar bundle (max 100KB dla Dashboard)
   - Lazy load chart libraries jeśli używane
4. Lighthouse audit:
   - Performance > 90
   - Accessibility > 95

### Krok 14: Dokumentacja i finalizacja (1 godz.)
1. Dodaj JSDoc comments do komponentów
2. Uaktualnij README z informacją o Dashboard
3. Dodaj screenshots do dokumentacji
4. Code review:
   - Sprawdź zgodność z konwencjami projektu
   - Sprawdź brak console.log, debugger
   - Sprawdź TypeScript errors (strict mode)

**Całkowity szacowany czas: 28-36 godzin**

---

## Podsumowanie kolejności kroków:

1. ✅ Setup routing i layout (1-2h)
2. ✅ Typy i API integration (2-3h)
3. ✅ Redux store (2h)
4. ✅ UI Primitives (2-3h)
5. ✅ Komponenty Dashboard (8-10h) - **najdłuższy krok**
6. ✅ Kompozycja strony (1-2h)
7. ✅ Custom hooks (1-2h)
8. ✅ Formatowanie i helpers (1h)
9. ✅ Obsługa błędów (2h)
10. ✅ Styling i responsywność (2-3h)
11. ✅ Accessibility (1-2h)
12. ✅ Testing (2-3h)
13. ✅ Performance (1-2h)
14. ✅ Dokumentacja (1h)

**Priorytet MVP:** Kroki 1-6 + 9 (setup, komponenty, błędy) = ~20h
**Pełna implementacja:** Wszystkie kroki = ~36h
