# E2E Tests - Playwright

Ten katalog zawiera testy end-to-end napisane w Playwright.

## Struktura

```
e2e/
├── tests/                  # Test files (*.spec.ts)
│   ├── homepage.spec.ts
│   └── accessibility.spec.ts
├── page-objects/          # Page Object Model
│   ├── BasePage.ts
│   └── HomePage.ts
├── fixtures/              # Test data and fixtures
│   └── test-data.ts
└── utils/                 # Test utilities
```

## Uruchamianie testów

```bash
# Z poziomu głównego katalogu projektu
npm run test:e2e

# UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Raport
npm run test:e2e:report
```

## Tworzenie nowych testów

1. Utwórz Page Object w `page-objects/`
2. Dodaj test data w `fixtures/test-data.ts`
3. Napisz test w `tests/nazwa.spec.ts`

### Przykład

```typescript
// page-objects/LoginPage.ts
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickButton(this.loginButton);
  }
}

// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto('/login');
  await loginPage.login('test@example.com', 'password');

  await expect(page).toHaveURL('/dashboard');
});
```

## Best Practices

✅ Używaj Page Object Model
✅ Izoluj testy (każdy test niezależny)
✅ Używaj semantic selectors (role, label)
✅ Preferuj auto-waiting nad manual sleep
✅ Dodawaj data-testid tylko gdy konieczne
✅ Mockuj zewnętrzne API
✅ Wykorzystuj fixtures do reużywalnych danych

❌ Nie używaj hardcoded delays
❌ Nie testuj implementacji, testuj behavior
❌ Nie duplikuj kodu - używaj POM
❌ Nie commituj credentials
