# Page Objects - E2E Tests

Ten katalog zawiera implementacje Page Object Model dla testów e2e Playwright.

## Struktura

```
page-objects/
├── BasePage.ts                    # Bazowa klasa z wspólnymi metodami
├── HomePage.ts                    # Strona główna aplikacji
├── admin/                         # Page Objects panelu administracyjnego
│   ├── AdminLoginPage.ts          # Logowanie administratora
│   ├── AdminRckikManagementPage.ts # Zarządzanie RCKiK (US-019)
│   ├── AdminScraperPage.ts        # Manualne parsowanie (US-017)
│   ├── AdminReportsPage.ts        # Zgłoszenia użytkowników (US-021)
│   └── index.ts                   # Eksport wszystkich admin page objects
├── index.ts                       # Main export file
└── README.md                      # Ten plik
```

## Użycie

### Import Page Objects

```typescript
// Import pojedynczego Page Object
import { AdminRckikManagementPage } from '@/e2e/page-objects/admin';

// Import wszystkich Page Objects
import { BasePage, HomePage, AdminLoginPage } from '@/e2e/page-objects';
```

### Przykład testu

```typescript
import { test, expect } from '@playwright/test';
import { AdminLoginPage, AdminRckikManagementPage } from '@/e2e/page-objects';

test.describe('Admin RCKiK Management', () => {
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

### AdminRckikManagementPage

Page Object dla zarządzania centrami RCKiK (US-019).

**Kluczowe metody:**
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

### AdminScraperPage

Page Object dla manualnego uruchamiania scrapera (US-017).

**Kluczowe metody:**
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

### AdminReportsPage

Page Object dla zarządzania zgłoszeniami (US-021).

**Kluczowe metody:**
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

## Konwencje nazewnictwa

- **Klasy**: PascalCase z suffixem `Page` (np. `AdminLoginPage`)
- **Metody**: camelCase, opisowe nazwy (np. `clickAddButton()`, `fillRckikForm()`)
- **Locatory**: camelCase z suffixem typu (np. `submitButton`, `emailInput`, `confirmModal`)
- **Parametry**: camelCase, opisowe (np. `reportId`, `rckikNames`)

## Testowanie

Przykłady testów używających Page Objects znajdują się w katalogu `e2e/tests/`.

```typescript
// e2e/tests/admin/rckik-management.spec.ts
import { test, expect } from '@playwright/test';
import { AdminRckikManagementPage } from '@/e2e/page-objects';

test.describe('Admin RCKiK Management', () => {
  // ... testy
});
```

## Wsparcie

W razie pytań lub problemów:
1. Sprawdź dokumentację Playwright: https://playwright.dev/docs/pom
2. Przeczytaj `.ai/playwright-e2e-testing.mdc` - wewnętrzne guidelines
3. Zobacz przykładowe testy w `e2e/tests/`
