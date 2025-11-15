# Page Objects - E2E Testing

Ten katalog zawiera klasy Page Object dla testów E2E Playwright.

## Struktura

```
page-objects/
├── BasePage.ts                      # Bazowa klasa z wspólną funkcjonalnością
├── HomePage.ts                      # Strona główna/landing page
├── NotificationsPage.ts             # Strona powiadomień (US-011)
├── NotificationPreferencesPage.ts   # Ustawienia powiadomień (US-006, US-010)
├── index.ts                         # Barrel export
└── README.md                        # Ta dokumentacja
```

## Wzorzec Page Object Model (POM)

Zgodnie z najlepszymi praktykami Playwright, stosujemy wzorzec Page Object Model dla:
- **Reużywalności** - DRY (Don't Repeat Yourself)
- **Czytelności** - Testy są bardziej deklaratywne
- **Łatwości utrzymania** - Zmiany w UI wymagają modyfikacji tylko Page Object
- **Enkapsulacji** - Logika interakcji z elementami jest ukryta w Page Object

## Konwencje

### Lokatory
- **Preferowane**: `data-testid` - najbardziej stabilne
- Używamy metody `getByTestId()` z `BasePage`
- Unikamy selektorów CSS/XPath (niestabilne przy zmianach UI)

### Nazewnictwo
- Klasy: `PascalCase` zakończone na `Page` (np. `NotificationsPage`)
- Metody: `camelCase` - czasowniki (np. `markAsRead()`, `switchToUnreadTab()`)
- Lokatory: `camelCase` - rzeczowniki (np. `notificationList`, `tabAll`)

### Struktura klasy
1. **Lokatory** - deklaracja wszystkich elementów w konstruktorze
2. **Metody nawigacyjne** - `goto()`, `waitFor...()`, etc.
3. **Gettery** - pobieranie danych z elementów
4. **Akcje** - interakcje użytkownika (klik, wypełnianie pól)
5. **Weryfikacje** - metody `verify...()` używające `expect()`

## Przykłady użycia

### Import

```typescript
// Import pojedynczej klasy
import { NotificationsPage } from '../page-objects/NotificationsPage';

// Import wielu klas (barrel export)
import { NotificationsPage, NotificationPreferencesPage } from '../page-objects';
```

### Przykładowy test

```typescript
import { test, expect } from '@playwright/test';
import { NotificationsPage } from '../page-objects';

test.describe('Notifications - US-011', () => {
  let notificationsPage: NotificationsPage;

  test.beforeEach(async ({ page }) => {
    notificationsPage = new NotificationsPage(page);
    await notificationsPage.goto();
  });

  test('TC-NOTIF-03: Display and mark notifications as read', async () => {
    // Verify page loaded
    await notificationsPage.verifyPageLoaded();

    // Get unread count
    const unreadCount = await notificationsPage.getUnreadCount();
    expect(unreadCount).toBeGreaterThan(0);

    // Mark first notification as read
    await notificationsPage.markNotificationAsReadByIndex(0);

    // Verify notification is now read
    await notificationsPage.verifyNotificationIsRead(0);

    // Verify unread count decreased
    const newUnreadCount = await notificationsPage.getUnreadCount();
    expect(newUnreadCount).toBe(unreadCount - 1);
  });
});
```

## Page Objects dla Systemu Powiadomień

### NotificationsPage

**Lokalizacja:** `/dashboard/notifications`

**Scenariusze testowe:**
- **TC-NOTIF-03**: Sprawdzenie wyświetlania i oznaczania powiadomień in-app

**Główne metody:**
- `goto()` - Nawigacja do strony powiadomień
- `getUnreadCount()` - Pobierz liczbę nieprzeczytanych
- `switchToAllTab()` / `switchToUnreadTab()` - Przełączanie tabów
- `markNotificationAsReadByIndex(index)` - Oznacz pojedyncze jako przeczytane
- `markAllAsRead()` - Oznacz wszystkie jako przeczytane
- `verifyNotificationIsUnread(index)` - Weryfikacja nieprzeczytanego
- `verifyNotificationIsRead(index)` - Weryfikacja przeczytanego

**Przykład:**
```typescript
const notificationsPage = new NotificationsPage(page);
await notificationsPage.goto();
await notificationsPage.verifyPageLoaded();
await notificationsPage.switchToUnreadTab();
await notificationsPage.markNotificationAsReadByIndex(0);
```

### NotificationPreferencesPage

**Lokalizacja:** `/dashboard/profil` (sekcja NotificationPreferencesForm)

**Scenariusze testowe:**
- **TC-NOTIF-02**: Zmiana preferencji powiadomień

**Główne metody:**
- `goto()` - Nawigacja do profilu
- `enableEmailNotifications()` / `disableEmailNotifications()`
- `enableInAppNotifications()` / `disableInAppNotifications()`
- `setEmailFrequency(frequency)` - Ustaw częstotliwość email
- `setInAppFrequency(frequency)` - Ustaw częstotliwość in-app
- `savePreferences()` - Zapisz zmiany
- `verifyEmailSettings(enabled, frequency)` - Weryfikacja ustawień email
- `verifyInAppSettings(enabled, frequency)` - Weryfikacja ustawień in-app

**Częstotliwości:**
- `'DISABLED'` - Wyłączone
- `'ONLY_CRITICAL'` - Tylko krytyczne
- `'DAILY'` - Codziennie
- `'IMMEDIATE'` - Natychmiast

**Przykład:**
```typescript
const preferencesPage = new NotificationPreferencesPage(page);
await preferencesPage.goto();
await preferencesPage.verifyFormLoaded();

// Włącz tylko krytyczne powiadomienia
await preferencesPage.enableOnlyCriticalNotifications();

// Weryfikuj ustawienia
await preferencesPage.verifyEmailSettings(true, 'ONLY_CRITICAL');
await preferencesPage.verifyInAppSettings(true, 'ONLY_CRITICAL');
```

## Najlepsze praktyki

### ✅ DO:
- Używaj `data-testid` dla selektorów
- Hermetyzuj logikę w metodach Page Object
- Dodawaj metody weryfikacyjne (`verify...()`)
- Używaj `async/await` konsekwentnie
- Dodawaj komentarze JSDoc dla metod publicznych
- Grupuj powiązane metody razem
- Używaj opisowych nazw metod

### ❌ DON'T:
- Nie używaj selektorów CSS/XPath bez potrzeby
- Nie kopiuj kodu - twórz metody pomocnicze
- Nie testuj implementacji - testuj behavior
- Nie hardcoduj delays (`waitForTimeout`) bez powodu
- Nie duplikuj logiki między Page Objects

## Debugowanie

### Playwright Inspector
```bash
PWDEBUG=1 npx playwright test notifications.spec.ts
```

### Trace Viewer
```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',
}
```

Potem:
```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure
```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
}
```

## Związane dokumenty

- **Scenariusze testowe**: `/.ai/test-plan.md` (sekcja 4.4)
- **Reguły Playwright**: `/.ai/playwright-e2e-testing.mdc`
- **US-010**: Email Notifications - `/backend/docs/API-EMAIL-NOTIFICATIONS.md`
- **US-011**: In-App Notifications - `/frontend/src/components/dashboard/notifications/README.md`
- **US-006**: Notification Preferences - `/backend/docs/API-NOTIFICATION-PREFERENCES.md`

## Autorzy

- Branch: `claude/page-objects-notifications-01QtUwbT9DiZN8jhNDXnHBSs`
- Data: 2025-11-15
