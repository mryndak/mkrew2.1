# Page Objects - E2E Testing

Ten katalog zawiera klasy Page Object dla testów E2E Playwright.

## Struktura

```
page-objects/
├── BasePage.ts                      # Bazowa klasa z wspólną funkcjonalnością
├── HomePage.ts                      # Strona główna/landing page
├── LoginPage.ts                     # Strona logowania
├── RegisterPage.ts                  # Strona rejestracji
├── ResetPasswordRequestPage.ts      # Reset hasła
├── VerificationPage.ts              # Weryfikacja email
├── NotificationsPage.ts             # Strona powiadomień (US-011)
├── NotificationPreferencesPage.ts   # Ustawienia powiadomień (US-006, US-010)
├── admin/                           # Page Objects panelu administracyjnego
│   ├── AdminLoginPage.ts            # Logowanie administratora
│   ├── AdminRckikManagementPage.ts  # Zarządzanie RCKiK (US-019)
│   ├── AdminScraperPage.ts          # Manualne parsowanie (US-017)
│   ├── AdminReportsPage.ts          # Zgłoszenia użytkowników (US-021)
│   └── index.ts                     # Eksport wszystkich admin page objects
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
- Klasy: `PascalCase` zakończone na `Page` (np. `NotificationsPage`, `AdminRckikManagementPage`)
- Metody: `camelCase` - czasowniki (np. `markAsRead()`, `switchToUnreadTab()`, `clickAddButton()`)
- Lokatory: `camelCase` - rzeczowniki (np. `notificationList`, `tabAll`, `submitButton`)

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
import { AdminRckikManagementPage } from '../page-objects/admin';

// Import wielu klas (barrel export)
import { NotificationsPage, NotificationPreferencesPage, AdminLoginPage } from '../page-objects';
```

### Przykładowy test - Notifications

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

### Przykładowy test - Admin RCKiK Management

```typescript
import { test, expect } from '@playwright/test';
import { AdminLoginPage, AdminRckikManagementPage } from '../page-objects';

test.describe('Admin RCKiK Management - US-019', () => {
  test('should add new RCKiK center', async ({ page }) => {
    // Arrange - Login as admin
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@example.com', 'admin123');
    await loginPage.waitForLoginSuccess('/admin');

    // Navigate to RCKiK management
    const rckikPage = new AdminRckikManagementPage(page);
    await rckikPage.goto();

    // Act - Add new center
    await rckikPage.clickAddButton();
    await rckikPage.fillRckikForm({
      name: 'RCKiK Gdańsk',
      code: 'RCKIK-GDA',
      city: 'Gdańsk',
      address: 'ul. Przykładowa 10',
      active: true,
    });
    await rckikPage.submitForm();

    // Assert - Verify center was added
    const exists = await rckikPage.rckikExists('RCKiK Gdańsk');
    expect(exists).toBeTruthy();

    const status = await rckikPage.getRckikStatus('RCKiK Gdańsk');
    expect(status).toBe('active');
  });
});
```

## Page Objects - Szczegóły

### BasePage

Bazowa klasa zawierająca wspólne metody używane przez wszystkie Page Objects.

**Kluczowe metody:**
- `goto(path)` - nawigacja do strony
- `waitForPageLoad()` - czekanie na załadowanie strony
- `getByTestId(testId)` - lokalizowanie elementów po `data-testid`
- `fillInput(locator, value)` - wypełnianie pól input
- `clickButton(locator)` - klikanie przycisków z czekaniem

---

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

---

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

---

### AdminRckikManagementPage

**Lokalizacja:** `/admin/rckik`

**Scenariusze testowe:** US-019

**Główne metody:**
- `clickAddButton()` - otwiera modal dodawania centrum
- `fillRckikForm(data)` - wypełnia formularz centrum
- `submitForm()` - zapisuje formularz
- `searchRckik(query)` - wyszukuje centrum
- `filterByCity(city)` - filtruje po mieście
- `filterByStatus(status)` - filtruje po statusie
- `clickEditButton(name)` - edytuje centrum
- `clickDeleteButton(name)` - dezaktywuje centrum
- `rckikExists(name)` - sprawdza czy centrum istnieje
- `getRckikStatus(name)` - pobiera status centrum

---

### AdminScraperPage

**Lokalizacja:** `/admin/scraper`

**Scenariusze testowe:** US-017

**Główne metody:**
- `clickManualTriggerButton()` - otwiera modal manualnego uruchomienia
- `selectRckiks(names)` - wybiera centra do parsowania
- `setCustomUrl(url)` - ustawia custom URL
- `checkConfirmation()` - potwierdza uruchomienie
- `submitManualTrigger()` - uruchamia scraper
- `triggerAllCenters()` - uruchamia scraper dla wszystkich
- `triggerSpecificCenters(names)` - uruchamia dla wybranych
- `filterByRunType(type)` - filtruje po typie uruchomienia
- `filterByStatus(statuses)` - filtruje po statusie
- `filterByDateRange(from, to)` - filtruje po dacie
- `clickViewDetails(runId)` - otwiera szczegóły uruchomienia
- `waitForRunCompletion(runId)` - czeka na zakończenie

---

### AdminReportsPage

**Lokalizacja:** `/admin/reports`

**Scenariusze testowe:** US-021

**Główne metody:**
- `filterByStatus(status)` - filtruje po statusie
- `filterByRckik(rckikId)` - filtruje po centrum
- `filterByDateRange(from, to)` - filtruje po dacie
- `clickViewDetails(reportId)` - otwiera szczegóły zgłoszenia
- `setAdminNotes(notes)` - ustawia notatki admina
- `changeStatus(status)` - zmienia status
- `clickResolve()` - rozwiązuje zgłoszenie (quick action)
- `clickReject()` - odrzuca zgłoszenie (quick action)
- `saveChanges()` - zapisuje zmiany
- `resolveReport(reportId, notes)` - pełny flow rozwiązania
- `rejectReport(reportId, notes)` - pełny flow odrzucenia
- `updateReport(reportId, status, notes)` - aktualizacja ze statusem

---

## Zasady tworzenia Page Objects

### 1. Dziedziczenie z BasePage

Wszystkie Page Objects dziedziczą po `BasePage`:

```typescript
export class MyPage extends BasePage {
  constructor(page: Page) {
    super(page);
    // Initialize locators
  }
}
```

### 2. Lokalizatory jako readonly pola

Definiuj lokalizatory jako `readonly` pola klasy:

```typescript
readonly submitButton: Locator;
readonly emailInput: Locator;

constructor(page: Page) {
  super(page);
  this.submitButton = this.getByTestId('submit-button');
  this.emailInput = this.getByTestId('email-input');
}
```

### 3. Używaj data-testid

Preferuj `data-testid` do lokalizowania elementów:

```typescript
// Good
this.getByTestId('login-button')

// Avoid (unless necessary)
page.locator('button.login')
```

### 4. Metody opisowe

Twórz metody o opisowych nazwach odzwierciedlających akcje użytkownika:

```typescript
// Good
async clickAddButton() { ... }
async fillRckikForm(data) { ... }

// Avoid
async doAction() { ... }
async click() { ... }
```

### 5. Async/await

Wszystkie metody interakcji powinny być asynchroniczne:

```typescript
async login(email: string, password: string) {
  await this.fillInput(this.emailInput, email);
  await this.fillInput(this.passwordInput, password);
  await this.clickButton(this.loginButton);
}
```

### 6. Oczekiwanie na zmiany stanu

Czekaj na zmiany stanu po akcjach:

```typescript
async submitForm() {
  await this.clickButton(this.submitButton);
  await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
}
```

### 7. Dokumentacja

Dodawaj JSDoc do klas i publicznych metod:

```typescript
/**
 * Navigate to login page
 */
async goto() {
  await super.goto('/login');
  await this.waitForPageLoad();
}
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

- **Scenariusze testowe**: `/.ai/test-plan.md`
- **Reguły Playwright**: `/.ai/playwright-e2e-testing.mdc`
- **US-010**: Email Notifications - `/backend/docs/API-EMAIL-NOTIFICATIONS.md`
- **US-011**: In-App Notifications - `/frontend/src/components/dashboard/notifications/README.md`
- **US-006**: Notification Preferences - `/backend/docs/API-NOTIFICATION-PREFERENCES.md`
- **US-017**: Manualne parsowanie - `/frontend/src/pages/admin/scraper.astro`
- **US-019**: Zarządzanie RCKiK - `/frontend/src/pages/admin/rckik.astro`
- **US-021**: Zgłoszenia problemów - `/frontend/src/pages/admin/reports.astro`

## Wsparcie

W razie pytań lub problemów:
1. Sprawdź dokumentację Playwright: https://playwright.dev/docs/pom
2. Przeczytaj `.ai/playwright-e2e-testing.mdc` - wewnętrzne guidelines
3. Zobacz przykładowe testy w `e2e/tests/`
