# Testing Setup Guide - mkrew

Dokument opisuje konfigurację środowiska testowego dla projektu mkrew.

## 📋 Spis treści

- [Przegląd](#przegląd)
- [Stos technologiczny](#stos-technologiczny)
- [Frontend - Testy jednostkowe (Vitest)](#frontend---testy-jednostkowe-vitest)
- [Frontend/Backend - Testy E2E (Playwright)](#frontendbackend---testy-e2e-playwright)
- [Backend - Testy jednostkowe i integracyjne (JUnit 5)](#backend---testy-jednostkowe-i-integracyjne-junit-5)
- [Uruchamianie testów](#uruchamianie-testów)
- [Struktura projektu](#struktura-projektu)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## 🎯 Przegląd

Projekt wykorzystuje strategię **Testing Trophy**:
- **70% Integration Tests** - testy integracyjne (API + Database)
- **20% Unit Tests** - testy jednostkowe dla logiki biznesowej
- **10% E2E Tests** - testy end-to-end dla krytycznych ścieżek
- **Static Analysis** - TypeScript, ESLint jako fundament

### Cele testowania

✅ Zapewnienie jakości kodu i stabilności aplikacji
✅ Automatyzacja regresji
✅ Pokrycie kodu testami na poziomie min. 80%
✅ Weryfikacja zgodności z WCAG 2.1 AA
✅ Performance testing (Web Vitals)

---

## 🛠 Stos technologiczny

### Frontend Testing Stack

| Narzędzie | Wersja | Zastosowanie |
|---|---|---|
| **Vitest** | 4.0+ | Testy jednostkowe i komponentowe |
| **React Testing Library** | 16.3+ | Testowanie komponentów React |
| **@testing-library/user-event** | 14.6+ | Symulacja interakcji użytkownika |
| **happy-dom** | Latest | Lightweight DOM implementation |
| **@vitest/ui** | 4.0+ | Web UI do przeglądania testów |
| **@vitest/coverage-v8** | 4.0+ | Code coverage |

### E2E Testing Stack

| Narzędzie | Wersja | Zastosowanie |
|---|---|---|
| **Playwright** | 1.56+ | Testy E2E w prawdziwej przeglądarce |
| **@axe-core/playwright** | 4.11+ | Testy accessibility (WCAG) |

### Backend Testing Stack

| Narzędzie | Wersja | Zastosowanie |
|---|---|---|
| **JUnit 5** | 5.10+ | Framework do testów jednostkowych |
| **Mockito** | 5.x | Mockowanie zależności |
| **AssertJ** | 3.25+ | Fluent assertions |
| **Testcontainers** | 1.19+ | Kontenery PostgreSQL dla testów |
| **REST Assured** | 5.4+ | Testowanie REST API |
| **WireMock** | 3.3+ | Mockowanie HTTP services |
| **ArchUnit** | 1.2+ | Testy architektury |
| **JaCoCo** | 0.8.11 | Code coverage |

---

## 🎨 Frontend - Testy jednostkowe (Vitest)

### Instalacja

Wszystkie zależności są już zainstalowane. Jeśli potrzebujesz je przywrócić:

```bash
cd frontend
npm install
```

### Konfiguracja

Konfiguracja znajduje się w `frontend/vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### Uruchamianie testów jednostkowych

```bash
# Watch mode (rozwój)
npm test

# UI mode (interaktywny)
npm run test:ui

# Jednorazowe uruchomienie
npm run test:run

# Z pokryciem kodu
npm run test:coverage
```

### Przykład testu jednostkowego

```typescript
// src/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';

describe('formatDate', () => {
  it('should format date to Polish locale', () => {
    const date = new Date('2025-11-15');
    const result = formatDate(date);
    expect(result).toBe('15.11.2025');
  });
});
```

### Przykład testu komponentu

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../test/test-utils';

describe('Button Component', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🌐 Frontend/Backend - Testy E2E (Playwright)

### Instalacja Playwright

```bash
# Instalacja Playwright i przeglądarek
npm run playwright:install
```

### Konfiguracja

Konfiguracja znajduje się w `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4321',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

### Uruchamianie testów E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# UI mode (interaktywny)
npm run test:e2e:ui

# Tryb headed (widoczna przeglądarka)
npm run test:e2e:headed

# Tryb debug
npm run test:e2e:debug

# Raport HTML
npm run test:e2e:report
```

### Przykład testu E2E z Page Object Model

```typescript
// e2e/tests/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';

test('should navigate to login page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.navigateToLogin();

  await expect(page).toHaveURL(/\/login/);
});
```

### Przykład testu accessibility

```typescript
// e2e/tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should not have a11y violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

---

## ☕ Backend - Testy jednostkowe i integracyjne (JUnit 5)

### Uruchamianie testów backend

```bash
cd backend

# Wszystkie testy
./gradlew test

# Tylko testy jednostkowe
./gradlew test --tests "pl.mkrew.unit.*"

# Tylko testy integracyjne
./gradlew test --tests "pl.mkrew.integration.*"

# Z raportem pokrycia kodu
./gradlew test jacocoTestReport

# Weryfikacja progu pokrycia (80%)
./gradlew jacocoTestCoverageVerification
```

### Przykład testu jednostkowego (JUnit 5 + AssertJ)

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("User Service Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Arrange
        User user = new User("test@example.com", "Jan", "Kowalski");
        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(Optional.of(user));

        // Act
        Optional<User> result = userService.findByEmail("test@example.com");

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("test@example.com");
    }
}
```

### Przykład testu integracyjnego (Testcontainers)

```java
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldSaveAndRetrieveUser() {
        // Arrange
        User user = new User("test@example.com", "Jan", "Kowalski");

        // Act
        User saved = userRepository.save(user);
        User found = userRepository.findById(saved.getId()).orElseThrow();

        // Assert
        assertThat(found.getEmail()).isEqualTo("test@example.com");
    }
}
```

### Przykład testu API (REST Assured)

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class AuthApiTest {

    @LocalServerPort
    private Integer port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Test
    void shouldRegisterNewUser() {
        String requestBody = """
            {
                "email": "test@example.com",
                "password": "SecureP@ssw0rd123!",
                "firstName": "Jan",
                "lastName": "Kowalski"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(requestBody)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(201)
            .body("email", equalTo("test@example.com"));
    }
}
```

---

## 🚀 Uruchamianie testów

### Wszystkie testy (Frontend + Backend + E2E)

```bash
# Frontend unit tests
cd frontend && npm run test:run

# Backend tests
cd backend && ./gradlew test

# E2E tests
cd frontend && npm run test:e2e
```

### Szybkie testy (tylko jednostkowe)

```bash
# Frontend
cd frontend && npm run test:run

# Backend
cd backend && ./gradlew test --tests "pl.mkrew.unit.*"
```

### Testy przed commitem (pre-commit)

Zalecane uruchomienie przed każdym commitem:

```bash
# Frontend
npm run test:run

# Backend (szybkie testy)
./gradlew test --tests "pl.mkrew.unit.*"
```

---

## 📁 Struktura projektu

```
mkrew2.1/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Button.test.tsx          # Component tests
│   │   ├── utils/
│   │   │   └── formatDate.test.ts       # Unit tests
│   │   └── test/
│   │       ├── setup.ts                 # Vitest setup
│   │       └── test-utils.tsx           # Test utilities
│   ├── vitest.config.ts                 # Vitest configuration
│   └── package.json                     # npm scripts
│
├── backend/
│   └── src/
│       └── test/
│           ├── java/pl/mkrew/
│           │   ├── unit/                # Unit tests
│           │   ├── integration/         # Integration tests (Testcontainers)
│           │   ├── api/                 # API tests (REST Assured)
│           │   └── architecture/        # Architecture tests (ArchUnit)
│           └── resources/
│               └── application-test.properties
│
├── e2e/
│   ├── tests/
│   │   ├── homepage.spec.ts             # E2E tests
│   │   └── accessibility.spec.ts        # A11y tests
│   ├── page-objects/
│   │   ├── BasePage.ts                  # Base POM
│   │   └── HomePage.ts                  # Page Objects
│   ├── fixtures/
│   │   └── test-data.ts                 # Test data
│   └── utils/                           # Test utilities
│
└── playwright.config.ts                 # Playwright configuration
```

---

## ✅ Best Practices

### Frontend (Vitest + React Testing Library)

1. **Testuj behavior, nie implementację**
   ```typescript
   // ✅ Good
   await user.click(screen.getByRole('button', { name: /login/i }));

   // ❌ Bad
   await user.click(screen.getByClassName('login-btn'));
   ```

2. **Używaj data-testid tylko gdy konieczne**
   ```typescript
   // ✅ Good - semantic queries
   screen.getByRole('button', { name: /submit/i })
   screen.getByLabelText(/email/i)

   // ⚠️ OK - gdy nie ma lepszej opcji
   screen.getByTestId('custom-component')
   ```

3. **Mock tylko co konieczne**
   ```typescript
   // ✅ Good - mock external dependencies
   vi.mock('axios');

   // ❌ Bad - don't mock what you're testing
   vi.mock('../components/Button');
   ```

### E2E (Playwright)

1. **Używaj Page Object Model**
   ```typescript
   // ✅ Good
   const homePage = new HomePage(page);
   await homePage.goto();
   await homePage.navigateToLogin();

   // ❌ Bad
   await page.goto('/');
   await page.click('a[href="/login"]');
   ```

2. **Auto-waiting (nie używaj manual sleep)**
   ```typescript
   // ✅ Good - Playwright czeka automatycznie
   await page.click('button');

   // ❌ Bad
   await page.waitForTimeout(5000);
   await page.click('button');
   ```

3. **Izoluj testy**
   ```typescript
   // ✅ Good - każdy test niezależny
   test.beforeEach(async ({ page }) => {
     await page.goto('/');
   });
   ```

### Backend (JUnit 5)

1. **AAA Pattern (Arrange, Act, Assert)**
   ```java
   @Test
   void shouldCalculateTotal() {
       // Arrange
       Order order = new Order(Arrays.asList(item1, item2));

       // Act
       BigDecimal total = order.calculateTotal();

       // Assert
       assertThat(total).isEqualTo(new BigDecimal("100.00"));
   }
   ```

2. **Używaj AssertJ fluent assertions**
   ```java
   // ✅ Good
   assertThat(user.getEmail())
       .isNotNull()
       .contains("@")
       .endsWith("example.com");

   // ❌ Bad
   assertTrue(user.getEmail() != null);
   assertTrue(user.getEmail().contains("@"));
   ```

3. **Testcontainers dla testów integracyjnych**
   ```java
   // ✅ Good - real database
   @Container
   static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

   // ❌ Bad - in-memory H2 (może się różnić od PostgreSQL)
   ```

---

## 🔄 CI/CD Integration

### GitHub Actions

Przykładowy workflow (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on: [pull_request, push]

jobs:
  unit-tests-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test:run
      - run: cd frontend && npm run test:coverage

  unit-tests-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
      - run: cd backend && ./gradlew test jacocoTestReport

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm run playwright:install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 Metryki jakości

### Cele

- **Code Coverage**: min. 80% dla logiki biznesowej
- **Test Execution Time**: < 20 min dla pełnego suite
- **Flaky Test Rate**: < 5%
- **Deployment Frequency**: Daily (dziennie)
- **Change Failure Rate**: < 5%

### Monitoring

- **Codecov** - code coverage tracking
- **Allure Report** - historyczne raporty testowe
- **GitHub Insights** - CI/CD success rate

---

## 🆘 Troubleshooting

### Problem: Vitest nie znajduje modułów

**Rozwiązanie:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problem: Playwright browsers nie są zainstalowane

**Rozwiązanie:**
```bash
npm run playwright:install
```

### Problem: Testcontainers timeout

**Rozwiązanie:**
```bash
# Sprawdź czy Docker działa
docker ps

# Zwiększ timeout w teście
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
    .withStartupTimeout(Duration.ofMinutes(5));
```

---

## 📚 Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Testcontainers Documentation](https://www.testcontainers.org/)
- [REST Assured Documentation](https://rest-assured.io/)

---

**Autor:** Zespół mkrew
**Ostatnia aktualizacja:** 15.11.2025
**Wersja:** 1.0
