# Kompleksowy Plan Testów dla Projektu "mkrew"

**Wersja dokumentu:** 2.0
**Data ostatniej aktualizacji:** 15.11.2025
**Autor:** Zespół QA - mkrew

---

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie
Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji webowej "mkrew", platformy dedykowanej dawcom krwi w Polsce. Projekt składa się z trzech głównych komponentów: backendu opartego na Java Spring Boot, bazy danych PostgreSQL zarządzanej przez Liquibase oraz frontendu zbudowanego w technologii Astro z interaktywnymi komponentami React.

Plan ten ma na celu zapewnienie, że finalny produkt będzie stabilny, bezpieczny, wydajny i zgodny z wymaganiami funkcjonalnymi oraz niefunkcjonalnymi określonymi w dokumentacji projektu (PRD).

### 1.2. Cele Testowania
Główne cele procesu testowego to:
- **Weryfikacja funkcjonalności:** Zapewnienie, że wszystkie zaimplementowane historyjki użytkownika (User Stories) działają zgodnie z kryteriami akceptacji.
- **Zapewnienie jakości i stabilności:** Identyfikacja i eliminacja błędów, które mogłyby negatywnie wpłynąć na doświadczenie użytkownika lub stabilność systemu.
- **Weryfikacja bezpieczeństwa:** Sprawdzenie odporności aplikacji na podstawowe zagrożenia, w szczególności w obszarze autentykacji, autoryzacji i ochrony danych osobowych.
- **Ocena wydajności:** Upewnienie się, że aplikacja działa responsywnie pod oczekiwanym obciążeniem.
- **Sprawdzenie użyteczności i UX:** Weryfikacja, czy interfejs jest intuicyjny, spójny i dostępny dla szerokiego grona użytkowników.
- **Walidacja zgodności:** Potwierdzenie, że system spełnia wymagania biznesowe i prawne (np. RODO/GDPR).

---

## 2. Zakres Testów

### 2.1. Funkcjonalności w Zakresie Testów (In-Scope)
- **Moduł Uwierzytelniania i Autoryzacji:** Rejestracja, weryfikacja e-mail, logowanie, reset hasła, obsługa ról (USER, ADMIN).
- **Publiczny Interfejs Użytkownika:** Strona główna, lista centrów RCKiK, szczegóły centrum RCKiK.
- **Panel Użytkownika (Dashboard):** Statystyki donacji, zarządzanie ulubionymi centrami, dziennik donacji (CRUD), powiadomienia in-app.
- **Panel Administracyjny:** Zarządzanie centrami RCKiK (CRUD), monitoring systemu scrapingu, zarządzanie zgłoszeniami użytkowników, przeglądanie logów audytowych.
- **System Powiadomień:** Logika wysyłania powiadomień e-mail o krytycznych stanach krwi.
- **API Backendu:** Wszystkie publiczne i chronione punkty końcowe REST API.
- **Integracja Frontend-Backend:** Poprawność komunikacji i obsługi danych między warstwami.
- **Responsywność (RWD):** Działanie aplikacji na urządzeniach mobilnych, tabletach i desktopach.

### 2.2. Funkcjonalności Poza Zakresem Testów (Out-of-Scope)
- **Web Scraper:** Sam mechanizm scrapingu nie jest testowany w ramach tego planu (traktowany jako zewnętrzne źródło danych). Testowany jest natomiast moduł backendu, który go obsługuje (np. ręczne uruchamianie, logi).
- **Testy penetracyjne:** Formalne testy penetracyjne przeprowadzane przez zewnętrzną firmę są poza zakresem tego dokumentu.
- **Testy obciążeniowe na dużą skalę:** Symulacja tysięcy jednoczesnych użytkowników. W tej fazie skupiamy się na testach wydajnościowych pod oczekiwanym, umiarkowanym obciążeniem.
- **Infrastruktura Cloud (GCP):** Konfiguracja i bezpieczeństwo infrastruktury chmurowej (poza poprawnością deploymentu aplikacji).

---

## 3. Typy Testów do Przeprowadzenia

Proces testowania zostanie podzielony na następujące poziomy i typy, zgodnie z najnowszymi praktykami Testing Trophy/Pyramid:

| Poziom Testów | Typ Testów | Opis | Odpowiedzialność | Pokrycie docelowe |
|---|---|---|---|---|
| **Testy Komponentów** | **Testy Jednostkowe** | Weryfikacja pojedynczych klas, metod i funkcji w izolacji (np. logika serwisów, hooki React, utils). | Deweloperzy | 80%+ logiki biznesowej |
| | **Testy Komponentów UI** | Testowanie komponentów React/Astro w izolacji z React Testing Library, weryfikacja renderowania, interakcji i accessibility. | Deweloperzy Frontend | 70%+ komponentów |
| | **Testy Snapshot** | Weryfikacja stabilności struktury UI komponentów (Vitest snapshots). | Deweloperzy Frontend | Kluczowe komponenty |
| **Testy Integracyjne** | **Integracja Komponentów** | Weryfikacja współpracy między komponentami (np. formularz z walidacją i przyciskiem submit). | Deweloperzy / QA | Krytyczne ścieżki |
| | **Integracja z Bazą Danych**| Testowanie warstwy repozytoriów Spring Data JPA z użyciem Testcontainers (PostgreSQL). | Deweloperzy Backend | Wszystkie repozytoria |
| | **Testy API** | Testowanie punktów końcowych REST API, weryfikacja kontraktów, walidacji i kodów odpowiedzi. | QA / Deweloperzy Backend | 100% endpointów |
| | **Testy Kontraktowe API** | Weryfikacja zgodności kontraktów API między producentem a konsumentem (Consumer-Driven Contract Testing). | QA / Deweloperzy | Krytyczne integracje |
| **Testy Systemowe**| **Testy E2E (End-to-End)**| Symulacja pełnych scenariuszy użytkownika przy użyciu **Playwright** (UI -> API -> Baza Danych). | QA | Happy paths + krytyczne ścieżki |
| | **Component Testing (Playwright)**| Testowanie komponentów w izolacji bezpośrednio w przeglądarce z Playwright Component Testing. | QA / Deweloperzy Frontend | Złożone komponenty |
| | **Visual Regression Testing** | Automatyczne wykrywanie niezamierzonych zmian wizualnych UI poprzez porównanie screenshotów (Playwright screenshots). | QA | Kluczowe widoki |
| | **Testy Bezpieczeństwa** | Weryfikacja mechanizmów autentykacji, autoryzacji i ochrony przed OWASP Top 10 (IDOR, XSS, CSRF, SQL Injection). | QA (z wsparciem Security) | Krytyczne funkcje |
| | **Testy Wydajnościowe** | Pomiar Web Vitals (LCP, FID, CLS), czasu odpowiedzi API i obciążenia przy użyciu k6. | QA / Performance Engineer | Kluczowe ścieżki |
| **Testy Akceptacyjne** | **Testy Użyteczności (UAT)** | Ręczne testy eksploracyjne, weryfikacja UX i zgodności z oczekiwaniami użytkownika. | QA / Product Owner | Pełna funkcjonalność |
| | **Testy Zgodności** | Sprawdzenie zgodności z RODO/GDPR (np. usuwanie danych, zgody, prawo do bycia zapomnianym). | QA / Legal / Product Owner | Wymagania prawne |
| | **Testy Dostępności (A11y)**| Weryfikacja zgodności z WCAG 2.1 AA przy użyciu Axe DevTools i Lighthouse. | QA / Deweloperzy Frontend | WCAG 2.1 AA |
| | **Testy Responsywności (RWD)**| Weryfikacja poprawnego wyświetlania na różnych urządzeniach i viewport (mobile-first). | QA / Deweloperzy Frontend | Wszystkie widoki |
| | **Testy Kompatybilności** | Sprawdzenie działania na różnych przeglądarkach (Chrome, Firefox, Safari, Edge) i systemach (Windows, macOS, Linux, iOS, Android). | QA | Top 5 przeglądarek |
| | **Testy Regresji** | Automatyczne testy weryfikujące, czy nowe zmiany nie zepsuły istniejących funkcjonalności (CI/CD integration). | QA (automatyzacja) | 90%+ automatyzacji |

### 3.1. Strategia Testowania - Testing Trophy

Projekt przyjmuje strategię **Testing Trophy** (zamiast tradycyjnej piramidy):
- **70% Integration Tests** - główny nacisk na testy integracyjne (API + Database)
- **20% Unit Tests** - testy jednostkowe dla logiki biznesowej
- **10% E2E Tests** - testy end-to-end dla krytycznych ścieżek użytkownika
- **Static Analysis** - TypeScript, ESLint, SonarQube jako fundament

### 3.2. Shift-Left Testing

- Testy są pisane równolegle z kodem (TDD/BDD dla kluczowych funkcjonalności)
- Deweloperzy uruchamiają pełny suite testów lokalnie przed push
- CI/CD wykonuje wszystkie testy automatycznie przy każdym PR
- Code review obejmuje również review testów

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej znajdują się przykładowe, wysoko-poziomowe scenariusze testowe. Szczegółowe przypadki testowe będą tworzone w systemie do zarządzania testami (np. TestRail, Jira/Xray).

### 4.1. Rejestracja i Autentykacja (US-001, US-002, US-003, US-004)
- **TC-AUTH-01 (Happy Path):** Pomyślna rejestracja użytkownika, weryfikacja e-mail, logowanie i wylogowanie.
- **TC-AUTH-02 (Walidacja):** Próba rejestracji z niepoprawnymi danymi (słabe hasło, nieprawidłowy e-mail, zajęty e-mail).
- **TC-AUTH-03 (Tokeny):** Weryfikacja wygasania tokenu weryfikacyjnego i resetu hasła.
- **TC-AUTH-04 (Rate Limiting):** Próba logowania z błędnym hasłem 5 razy i weryfikacja blokady konta.
- **TC-AUTH-05 (Autoryzacja):** Próba dostępu do `/dashboard` bez logowania (oczekiwane przekierowanie na `/login`).

### 4.2. Zarządzanie Donacjami (US-012, US-013, US-014)
- **TC-DON-01 (CRUD):** Dodanie, edycja i usunięcie wpisu o donacji w dzienniku.
- **TC-DON-02 (Walidacja):** Próba dodania donacji z datą w przyszłości lub niepoprawną ilością krwi.
- **TC-DON-03 (Eksport):** Wygenerowanie i weryfikacja poprawności eksportu danych do formatu CSV i JSON.
- **TC-DON-04 (Statystyki):** Weryfikacja, czy statystyki (liczba donacji, suma ml) aktualizują się po dodaniu/usunięciu donacji.

### 4.3. Panel Administracyjny (US-019, US-017, US-021)
- **TC-ADMIN-01 (Dostęp):** Weryfikacja, czy tylko użytkownik z rolą `ADMIN` ma dostęp do ścieżek `/admin/*`.
- **TC-ADMIN-02 (CRUD RCKiK):** Dodanie, edycja i dezaktywacja centrum RCKiK; weryfikacja zapisu w logu audytowym.
- **TC-ADMIN-03 (Scraper):** Ręczne uruchomienie scrapera i weryfikacja utworzenia nowego rekordu w `scraper_runs`.
- **TC-ADMIN-04 (Raporty):** Przeglądanie zgłoszeń, zmiana statusu i dodawanie notatek.

### 4.4. System Powiadomień (US-010, US-011)
- **TC-NOTIF-01 (Warunki):** Symulacja krytycznego stanu krwi i weryfikacja, czy powiadomienie (e-mail/in-app) jest wysyłane tylko do użytkowników, którzy mają dane centrum w ulubionych i włączone powiadomienia.
- **TC-NOTIF-02 (Preferencje):** Zmiana preferencji powiadomień i weryfikacja, czy system respektuje nowe ustawienia.
- **TC-NOTIF-03 (Powiadomienia in-app):** Sprawdzenie, czy nieprzeczytane powiadomienia są poprawnie wyświetlane i oznaczane jako przeczytane po interakcji.

---

## 5. Środowisko Testowe

| Środowisko | Cel | URL Aplikacji | URL API | Baza Danych | Opis |
|---|---|---|---|---|---|
| **Lokalne (Local)**| Rozwój i testy jednostkowe/integracyjne | `http://localhost:4321` | `http://localhost:8080` | PostgreSQL (Docker) | Środowisko deweloperskie uruchamiane przez `docker-compose`. Używane do developmentu i podstawowych testów. |
| **CI (Continuous Integration)** | Automatyczne testy (jednostkowe, integracyjne, E2E) | - | - | Testcontainers / H2 | Środowisko uruchamiane w ramach pipeline'u CI (np. GitHub Actions) po każdym pushu. |
| **Staging** | Testy akceptacyjne, regresyjne, wydajnościowe | `https://staging.mkrew.pl` | `https://api-staging.mkrew.pl` | Cloud SQL (kopia prod) | Odizolowane środowisko na GCP, odzwierciedlające produkcję. Służy do pełnych testów E2E i UAT. |
| **Produkcyjne (Production)**| Testy typu "smoke test" po wdrożeniu | `https://mkrew.pl` | `https://api.mkrew.pl` | Cloud SQL (produkcja) | Środowisko produkcyjne. Wykonywane są na nim tylko podstawowe testy weryfikujące poprawność wdrożenia. |

---

## 6. Narzędzia do Testowania

### 6.1. Backend Testing Stack

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **JUnit 5** | 5.10+ | Framework do testów jednostkowych i integracyjnych Java. | [docs.junit.org](https://junit.org/junit5/) |
| **Mockito** | 5.x | Mockowanie zależności w testach jednostkowych. | [site.mockito.org](https://site.mockito.org/) |
| **AssertJ** | 3.25+ | Fluent assertions dla czytelniejszych asercji. | [assertj.github.io](https://assertj.github.io/doc/) |
| **Testcontainers** | 1.19+ | Kontenery PostgreSQL, Redis dla testów integracyjnych z prawdziwą bazą danych. | [testcontainers.com](https://www.testcontainers.org/) |
| **REST Assured** | 5.4+ | Testowanie REST API z wygodnym DSL. | [rest-assured.io](https://rest-assured.io/) |
| **Spring Boot Test** | 3.x | Integracja testów ze Spring Boot (MockMvc, WebTestClient). | [spring.io](https://spring.io/guides/gs/testing-web) |
| **WireMock** | 3.x | Mockowanie zewnętrznych API i usług HTTP. | [wiremock.org](https://wiremock.org/) |
| **ArchUnit** | 1.2+ | Testy architektury - weryfikacja layered architecture, naming conventions. | [archunit.org](https://www.archunit.org/) |

### 6.2. Frontend Testing Stack

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **Vitest** | 1.5+ | Blazingly fast unit test framework dla TypeScript/JavaScript (kompatybilny z Vite/Astro). | [vitest.dev](https://vitest.dev/) |
| **React Testing Library** | 14.x | Testowanie komponentów React z naciskiem na user behavior. | [testing-library.com](https://testing-library.com/react) |
| **@testing-library/user-event** | 14.x | Symulacja realistycznych interakcji użytkownika. | [testing-library.com](https://testing-library.com/docs/user-event/intro) |
| **@vitest/ui** | 1.5+ | Web UI do przeglądania wyników testów Vitest. | [vitest.dev/guide/ui](https://vitest.dev/guide/ui.html) |
| **happy-dom / jsdom** | Latest | Lightweight DOM implementation dla testów jednostkowych. | [github.com/capricorn86/happy-dom](https://github.com/capricorn86/happy-dom) |

### 6.3. E2E & Visual Testing Stack

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **Playwright** | 1.42+ | **Podstawowe narzędzie do testów E2E** - wspiera Chrome, Firefox, Safari, Edge. Auto-waiting, parallel execution, tracing. | [playwright.dev](https://playwright.dev/) |
| **@playwright/test** | 1.42+ | Test runner z built-in assertions, fixtures, parallelization. | [playwright.dev](https://playwright.dev/docs/api/class-test) |
| **Playwright Component Testing** | 1.42+ | Testowanie komponentów React/Vue/Svelte bezpośrednio w przeglądarce. | [playwright.dev/docs/test-components](https://playwright.dev/docs/test-components) |
| **Playwright Trace Viewer** | Built-in | Debugowanie failed testów z timeline, screenshots, network logs. | [playwright.dev/docs/trace-viewer](https://playwright.dev/docs/trace-viewer) |
| **Playwright Codegen** | Built-in | Automatyczne generowanie testów poprzez nagrywanie interakcji. | [playwright.dev/docs/codegen](https://playwright.dev/docs/codegen) |
| **Playwright Visual Comparisons** | Built-in | Visual regression testing poprzez porównanie screenshotów (pixel-by-pixel lub threshold-based). | [playwright.dev/docs/test-snapshots](https://playwright.dev/docs/test-snapshots) |
| **Playwright HTML Reporter** | Built-in | Szczegółowe raporty HTML z screenshots i trace files. | [playwright.dev/docs/test-reporters](https://playwright.dev/docs/test-reporters) |

**Dlaczego Playwright (nie Cypress)?**
- ✅ Natywne wsparcie dla wielu przeglądarek (Chrome, Firefox, Safari, Edge)
- ✅ True parallelization - szybsze wykonanie testów
- ✅ Auto-waiting - eliminacja flaky tests
- ✅ Network interception i mockowanie
- ✅ Built-in visual regression testing
- ✅ Component testing bez dodatkowych narzędzi
- ✅ Lepsze wsparcie dla authentication flows (storage state)
- ✅ Trace viewer do debugowania
- ✅ Łatwiejsza integracja CI/CD (mniej configuration overhead)

### 6.4. API Testing & Contract Testing

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **Playwright API Testing** | 1.42+ | Testowanie REST API bez UI (szybsze niż pełny E2E). | [playwright.dev/docs/api-testing](https://playwright.dev/docs/api-testing) |
| **Pact** | 1.x | Consumer-Driven Contract Testing dla API. | [pact.io](https://pact.io/) |
| **OpenAPI Schema Validator** | Latest | Walidacja odpowiedzi API względem OpenAPI/Swagger spec. | [github.com/openapi-library](https://github.com/openapi-library) |

### 6.5. Performance & Load Testing

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **k6** | 0.50+ | Nowoczesne narzędzie do load testingu (JavaScript API, cloud integration). | [k6.io](https://k6.io/) |
| **Lighthouse CI** | 0.13+ | Continuous integration dla Lighthouse - automatyczne audyty performance w CI/CD. | [github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) |
| **Web Vitals** | 3.x | Biblioteka do mierzenia Core Web Vitals (LCP, FID, CLS). | [web.dev/vitals](https://web.dev/vitals/) |
| **Playwright Performance Testing** | Built-in | Pomiar performance metrics bezpośrednio w testach E2E. | [playwright.dev/docs/test-webserver](https://playwright.dev/docs/api/class-browsercontext#browser-context-add-init-script) |

### 6.6. Security Testing

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **OWASP ZAP** | 2.14+ | Dynamic Application Security Testing (DAST) - skanowanie podatności. | [zaproxy.org](https://www.zaproxy.org/) |
| **Snyk** | Latest | Skanowanie zależności (npm, Maven) pod kątem znanych podatności. | [snyk.io](https://snyk.io/) |
| **SonarQube** | 10.x | Static Application Security Testing (SAST) + code quality analysis. | [sonarqube.org](https://www.sonarqube.org/) |
| **npm audit / Dependabot** | Built-in | Automatyczne wykrywanie podatności w zależnościach. | [docs.github.com/dependabot](https://docs.github.com/en/code-security/dependabot) |

### 6.7. Accessibility Testing

| Narzędzie | Wersja | Zastosowanie | Dokumentacja |
|---|---|---|---|
| **axe-core** | 4.8+ | Silnik do automatycznego testowania accessibility (WCAG 2.1). | [github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core) |
| **@axe-core/playwright** | Latest | Integracja axe z Playwright dla automatycznych testów a11y w E2E. | [github.com/dequelabs/axe-core-npm](https://github.com/dequelabs/axe-core-npm) |
| **Lighthouse** | 11.x | Audyt accessibility jako część ogólnego audytu. | [github.com/GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) |
| **pa11y** | 7.x | Command-line accessibility testing tool. | [pa11y.org](https://pa11y.org/) |

### 6.8. Test Management & Reporting

| Narzędzie | Zastosowanie |
|---|---|
| **Allure Report** | Piękne, interaktywne raporty testowe z historią, trendami, kategoryzacją błędów. |
| **Playwright HTML Reporter** | Built-in reporter z screenshots, traces, video recordings. |
| **GitHub Actions** | CI/CD - automatyczne uruchamianie testów przy PR, merge, deploy. |
| **Codecov / Coveralls** | Tracking code coverage i integracja z GitHub. |
| **TestRail / Xray** | (Opcjonalnie) Zarządzanie test cases i test plans. |

### 6.9. Development & Debugging Tools

| Narzędzie | Zastosowanie |
|---|---|
| **Playwright Inspector** | Step-by-step debugging testów E2E z podglądem DOM. |
| **Playwright Trace Viewer** | Post-mortem analysis failed testów (timeline, screenshots, network). |
| **VS Code Playwright Extension** | Uruchamianie i debugowanie testów bezpośrednio w VS Code. |
| **Chrome DevTools** | Analiza performance, network, accessibility bezpośrednio w przeglądarce. |

### 6.10. Test Data Management

| Narzędzie | Zastosowanie |
|---|---|
| **Faker.js / @faker-js/faker** | Generowanie realistycznych danych testowych (imiona, adresy, email). |
| **Liquibase** | Przygotowanie środowiska bazodanowego dla testów (seed data). |
| **Testcontainers** | Izolowane kontenery z czystą bazą danych dla każdego test suite. |
| **Factory Pattern** | Custom test data factories dla obiektów domenowych (Java, TypeScript). |

---

## 7. Harmonogram Testów

Proces testowania będzie prowadzony równolegle z developmentem, zgodnie z harmonogramem sprintów.

| Faza | Czas trwania | Kluczowe Aktywności |
|---|---|---|
| **Sprint 1: Core & Public UI** | Tydzień 1-2 | - Testy jednostkowe i integracyjne dla API RCKiK.<br>- Testy komponentów UI (karty, filtry).<br>- Przygotowanie testów E2E dla widoków publicznych. |
| **Sprint 2: Autentykacja** | Tydzień 2-3 | - Testy API dla rejestracji, logowania, resetu hasła.<br>- Testy bezpieczeństwa dla endpointów autoryzacji.<br>- Testy E2E dla pełnego flow rejestracji i logowania. |
| **Sprint 3: Dashboard** | Tydzień 3-4 | - Testy API dla donacji, ulubionych, powiadomień.<br>- Testy komponentów i logiki Redux.<br>- Testy E2E dla CRUD donacji i zarządzania ulubionymi. |
| **Sprint 4: Panel Admina** | Tydzień 4-5 | - Testy API dla endpointów admina.<br>- Testy E2E dla zarządzania RCKiK i monitoringu scrapera. |
| **Faza Stabilizacji i Regresji**| Tydzień 5-6 | - Pełne testy regresyjne (automatyczne i manualne).<br>- Testy wydajnościowe i UAT na środowisku Staging.<br>- Finalne testy kompatybilności i responsywności. |
| **Testy po wdrożeniu**| Po każdym wdrożeniu | - Smoke testy na środowisku produkcyjnym. |

---

## 8. CI/CD Integration i Automatyzacja Testów

### 8.1. GitHub Actions Pipeline

Wszystkie testy są zautomatyzowane i uruchamiane w ramach GitHub Actions przy każdym pull request i merge do głównej gałęzi.

#### Pipeline Stages

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  unit-tests-backend:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Java 17
      - Run unit tests (JUnit 5)
      - Generate coverage report (JaCoCo)
      - Upload coverage to Codecov

  integration-tests-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - Checkout code
      - Setup Java 17
      - Run integration tests (Testcontainers)
      - Run API tests (REST Assured)

  unit-tests-frontend:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install dependencies
      - Run unit tests (Vitest)
      - Run component tests (React Testing Library)
      - Generate coverage report
      - Upload coverage to Codecov

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install Playwright browsers
      - Build application
      - Start application (docker-compose)
      - Run E2E tests (Playwright)
      - Upload test results and traces
      - Generate HTML report
    timeout-minutes: 30

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install Playwright
      - Run visual regression tests
      - Compare screenshots with baseline
      - Upload diff images if failed

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Run Lighthouse CI
      - Run axe-core tests via Playwright
      - Fail if WCAG AA violations found

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run npm audit
      - Run Snyk scan
      - Run OWASP Dependency Check
      - Upload results to GitHub Security tab

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - Checkout code
      - Setup k6
      - Run load tests against staging
      - Generate performance report
      - Fail if response time > threshold
```

### 8.2. Pre-commit Hooks (Husky + lint-staged)

Lokalne testy uruchamiane przed każdym commitem:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit && npm run test:integration"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.java": [
      "spotless:apply",
      "./gradlew test --tests"
    ]
  }
}
```

### 8.3. Test Execution Strategy

| Typ testów | Kiedy uruchamiać | Czas wykonania | Parallel | Retry |
|---|---|---|---|---|
| **Unit Tests** | Przy każdym commit (pre-commit hook) | < 2 min | ✅ | ❌ |
| **Component Tests** | Przy każdym commit (pre-commit hook) | < 3 min | ✅ | ❌ |
| **Integration Tests** | Przy każdym PR | < 5 min | ✅ | 1x |
| **API Tests** | Przy każdym PR | < 3 min | ✅ | 1x |
| **E2E Tests (Critical)** | Przy każdym PR | < 10 min | ✅ (3 workers) | 2x |
| **E2E Tests (Full)** | Przed merge do main | < 20 min | ✅ (6 workers) | 2x |
| **Visual Regression** | Przy każdym PR (na zmianach UI) | < 5 min | ✅ | ❌ |
| **Performance Tests** | Po merge do main / przed deploy | < 15 min | ❌ | ❌ |
| **Security Scans** | Codziennie (scheduled) + przy każdym PR | < 5 min | ✅ | ❌ |
| **Accessibility Tests** | Przy każdym PR (na zmianach UI) | < 3 min | ✅ | ❌ |

### 8.4. Playwright Configuration Best Practices

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 3 : undefined, // 3 workers in CI, max available locally

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
    ['github'], // GitHub Actions annotations
  ],

  // Shared settings
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:4321',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',

    // Trace on first retry
    trace: 'on-first-retry',

    // Locale and timezone
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
  },

  // Projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Webserver (auto-start application before tests)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 8.5. Test Organization Structure

```
mkrew2/
├── backend/
│   └── src/
│       ├── main/java/...
│       └── test/java/
│           ├── unit/              # Testy jednostkowe
│           ├── integration/       # Testy integracyjne (Testcontainers)
│           ├── api/               # Testy API (REST Assured)
│           └── architecture/      # Testy architektury (ArchUnit)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── Button/
│       │       ├── Button.tsx
│       │       └── Button.test.tsx  # Component tests
│       └── utils/
│           ├── formatDate.ts
│           └── formatDate.test.ts   # Unit tests
│
├── e2e/
│   ├── fixtures/                  # Playwright fixtures
│   │   ├── auth.fixture.ts
│   │   └── data.fixture.ts
│   ├── page-objects/              # Page Object Model
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── RCKiKListPage.ts
│   ├── tests/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── registration.spec.ts
│   │   │   └── password-reset.spec.ts
│   │   ├── dashboard/
│   │   │   ├── donations.spec.ts
│   │   │   └── favorites.spec.ts
│   │   ├── admin/
│   │   │   └── rckik-management.spec.ts
│   │   └── visual/
│   │       └── homepage.visual.spec.ts
│   ├── utils/                     # Test utilities
│   │   ├── testData.ts
│   │   └── apiHelpers.ts
│   └── playwright.config.ts
│
├── performance/
│   └── k6/
│       ├── load-test.js
│       └── stress-test.js
│
└── .github/
    └── workflows/
        ├── test.yml
        ├── e2e.yml
        └── performance.yml
```

### 8.6. Flaky Tests Prevention

Strategie zapobiegania niestabilnym testom (flaky tests):

1. **Auto-waiting (Playwright)** - automatyczne czekanie na elementy
2. **Explicit waits** - używanie `waitForSelector()`, `waitForResponse()`
3. **Test isolation** - każdy test jest niezależny, własne dane testowe
4. **Database reset** - czyszczenie bazy danych między testami (Testcontainers)
5. **Mock external APIs** - mockowanie zewnętrznych serwisów (WireMock)
6. **Retry mechanism** - automatyczne ponowne uruchamianie failed testów (max 2x)
7. **Parallel execution safeguards** - izolacja danych testowych (user per test)
8. **Network interception** - kontrola nad network requests w Playwright
9. **Storage state** - zapisywanie authentication state między testami
10. **Timeouts configuration** - odpowiednie timeouty dla różnych operacji

### 8.7. Test Data Management Strategy

#### Backend Test Data (Java)

```java
// Test Data Factory Pattern
public class DonationTestFactory {
    public static Donation createValidDonation(User user, RCKiK rckik) {
        return Donation.builder()
            .user(user)
            .rckik(rckik)
            .donationDate(LocalDate.now().minusDays(30))
            .volumeMl(450)
            .donationType(DonationType.WHOLE_BLOOD)
            .build();
    }
}

// Usage in tests with Testcontainers
@Testcontainers
class DonationServiceTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @BeforeEach
    void setUp() {
        // Clean database
        donationRepository.deleteAll();
        userRepository.deleteAll();
    }
}
```

#### Frontend Test Data (TypeScript)

```typescript
// test-utils/factories.ts
import { faker } from '@faker-js/faker/locale/pl';

export const createMockUser = () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']),
});

export const createMockDonation = () => ({
  id: faker.string.uuid(),
  date: faker.date.past().toISOString(),
  volumeMl: 450,
  type: 'WHOLE_BLOOD',
});
```

#### E2E Test Data (Playwright)

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

// Authenticated user fixture
export const test = base.extend<{ authenticatedUser: { email: string; password: string } }>({
  authenticatedUser: async ({ page }, use) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'Test123!@#';

    // Register and login
    await page.goto('/register');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', password);
    await page.click('button[type="submit"]');

    // Save storage state for reuse
    await page.context().storageState({ path: `auth-${Date.now()}.json` });

    await use({ email, password });
  },
});
```

### 8.8. Monitoring Test Quality

**Metryki do śledzenia:**

- **Test Coverage** - Code coverage (80%+ cel dla logiki biznesowej)
- **Test Execution Time** - Czas wykonania testów (tracking trend)
- **Flaky Test Rate** - % testów, które przechodzą/nie przechodzą niestabilnie
- **Test Pass Rate** - % testów zakończonych sukcesem
- **Mean Time to Detect (MTTD)** - Czas wykrycia błędu
- **Mean Time to Repair (MTTR)** - Czas naprawy błędu
- **Defect Escape Rate** - % błędów wykrytych na produkcji
- **Deployment Frequency** - Jak często wdrażamy (cel: daily)
- **Change Failure Rate** - % deploymentów powodujących rollback

**Narzędzia do monitorowania:**
- **Codecov/Coveralls** - code coverage tracking
- **Allure Report** - historyczne raporty testowe z trendami
- **GitHub Insights** - CI/CD success rate, deployment frequency
- **Datadog/Grafana** - monitoring testów E2E, performance metrics

---

## 9. Kryteria Akceptacji Testów

### 9.1. Kryteria Wejścia (Entry Criteria)
- Dostępna jest dokumentacja wymagań (PRD) i specyfikacja techniczna.
- Kod został wdrożony na odpowiednie środowisko testowe (Staging).
- Wszystkie testy jednostkowe i integracyjne w CI zakończyły się sukcesem.

### 9.2. Kryteria Zakończenia (Exit Criteria)

**Kryteria obowiązkowe (MUST HAVE):**
- **100%** zdefiniowanych przypadków testowych dla krytycznych ścieżek (P0) zostało wykonanych i zakończonych sukcesem.
- **95%** wszystkich przypadków testowych zostało wykonanych.
- **Brak otwartych błędów krytycznych (Blocker) i poważnych (Critical).**
- **Mniej niż 5** otwartych błędów o średnim priorytecie (Major), które nie blokują głównych funkcjonalności i mają zaplanowane rozwiązanie.
- Pokrycie kodu testami jednostkowymi na poziomie **min. 80%** dla logiki biznesowej (warstwa serwisów backend, hooki frontend).
- Wszystkie testy E2E (Playwright) przechodzą na 3 przeglądarkach (Chrome, Firefox, Safari).
- Brak wykrytych podatności **Critical** i **High** w skanach bezpieczeństwa (Snyk, OWASP ZAP).

**Kryteria jakościowe (QUALITY GATES):**
- Wynik audytu Lighthouse: Performance > 90, Accessibility > 95, Best Practices > 90.
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1.
- API response time (p95) < 500ms dla kluczowych endpointów.
- Zero flaky tests w ostatnich 10 uruchomieniach CI/CD.
- Visual regression tests pass rate > 99%.

**Kryteria dokumentacji:**
- Wszystkie test cases udokumentowane z krokami i oczekiwanymi rezultatami.
- Known issues i limitations udokumentowane w Release Notes.
- Test summary report wygenerowany i zaakceptowany przez Product Owner.

---

## 10. Role i Odpowiedzialności w Procesie Testowania

| Rola | Odpowiedzialności | Narzędzia |
|---|---|---|
| **Deweloperzy Backend** | - Pisanie testów jednostkowych (JUnit 5) i integracyjnych (Testcontainers) dla kodu backendu.<br>- TDD/BDD dla krytycznej logiki biznesowej.<br>- Testy API (REST Assured).<br>- Code review testów innych deweloperów.<br>- Poprawianie błędów zgłoszonych przez QA.<br>- Pisanie testów architektury (ArchUnit).<br>- Monitoring code coverage (min. 80%). | JUnit 5, Mockito, Testcontainers, REST Assured, AssertJ, ArchUnit |
| **Deweloperzy Frontend** | - Pisanie testów jednostkowych (Vitest) i komponentowych (React Testing Library).<br>- Component testing z Playwright.<br>- Snapshot testing dla UI stabilności.<br>- Zapewnienie accessibility (axe-core integration).<br>- Poprawianie błędów UI i visual regression issues.<br>- Monitoring Web Vitals i Lighthouse scores. | Vitest, React Testing Library, Playwright, axe-core, Lighthouse |
| **QA Engineer / SDET** | - Tworzenie i utrzymanie strategii testowania.<br>- Automatyzacja testów E2E (Playwright).<br>- Visual regression testing.<br>- API contract testing (Pact).<br>- Testy wydajnościowe (k6) i obciążeniowe.<br>- Testy bezpieczeństwa (OWASP ZAP, Snyk).<br>- Testy akceptacyjne (UAT).<br>- Raportowanie i śledzenie metryk jakości.<br>- Analiza flaky tests i optymalizacja test suite.<br>- Code review testów automatycznych. | Playwright, k6, OWASP ZAP, Pact, Allure, Lighthouse CI |
| **Product Owner** | - Definiowanie acceptance criteria dla User Stories.<br>- Udział w testach akceptacyjnych (UAT).<br>- Priorytetyzacja błędów i technical debt.<br>- Ostateczne zatwierdzenie produktu do release.<br>- Review test summary reports. | TestRail/Xray (opcjonalnie) |
| **DevOps / SRE** | - Konfiguracja i utrzymanie środowisk testowych (CI/CD, Staging).<br>- Setup GitHub Actions workflows dla testów.<br>- Monitoring infrastruktury testowej (Testcontainers, browsers).<br>- Optymalizacja czasu wykonania testów w CI/CD.<br>- Konfiguracja Playwright w kontenerach Docker.<br>- Setup monitoring i alerting dla testów. | GitHub Actions, Docker, Kubernetes, Terraform, Datadog/Grafana |
| **Security Engineer** | - Review testów bezpieczeństwa.<br>- Konfiguracja SAST/DAST tools (SonarQube, OWASP ZAP).<br>- Analiza wykrytych podatności.<br>- Wsparcie w testach penetracyjnych.<br>- Review security-related test cases. | SonarQube, OWASP ZAP, Snyk, Dependabot |

### 10.1. Test Ownership Matrix

| Typ testu | Owner | Reviewer | Frequency |
|---|---|---|---|
| Unit Tests (Backend) | Backend Dev | Backend Dev | Każdy commit |
| Unit Tests (Frontend) | Frontend Dev | Frontend Dev | Każdy commit |
| Integration Tests | Backend Dev | QA Engineer | Każdy PR |
| Component Tests | Frontend Dev | QA Engineer | Każdy PR |
| API Tests | QA Engineer / Backend Dev | QA Engineer | Każdy PR |
| E2E Tests | QA Engineer | QA Lead | Każdy PR |
| Visual Regression | QA Engineer / Frontend Dev | QA Engineer | Każdy PR (UI changes) |
| Performance Tests | QA Engineer / DevOps | QA Lead | Pre-release |
| Security Tests | Security Engineer / QA | Security Lead | Daily (scheduled) |
| Accessibility Tests | Frontend Dev / QA | QA Engineer | Każdy PR (UI changes) |

---

## 11. Procedury Raportowania Błędów

Wszystkie błędy będą raportowane i śledzone w systemie GitHub Issues (integracja z projektem).

### 11.1. Szablon Zgłoszenia Błędu (GitHub Issue Template)
- **Tytuł:** Krótki, zwięzły opis problemu (np. "Błąd 500 przy próbie usunięcia donacji").
- **Projekt:** mkrew
- **Typ zgłoszenia:** Błąd (Bug)
- **Komponent:** (np. Backend-API, Frontend-Dashboard, Baza Danych)
- **Środowisko:** (np. Staging, Lokalny)
- **Priorytet:**
  - **Blocker:** Uniemożliwia dalsze testy lub działanie kluczowej funkcjonalności.
  - **Critical:** Poważny błąd w kluczowej funkcjonalności, ale istnieje obejście.
  - **Major:** Błąd w istotnej funkcjonaljonalności.
  - **Minor:** Drobny błąd UI lub literówka.
  - **Trivial:** Sugestia poprawy, błąd estetyczny.
- **Kroki do odtworzenia:** Numerowana lista kroków potrzebnych do zreprodukowania błędu.
- **Oczekiwany rezultat:** Co powinno się wydarzyć.
- **Rzeczywisty rezultat:** Co się wydarzyło.
- **Załączniki:** Screenshoty, nagrania wideo, logi z konsoli przeglądarki i sieci.
- **Dodatkowe informacje:** Wersja przeglądarki, system operacyjny, dane testowe.

### 11.2. Cykl Życia Błędu (Bug Lifecycle)
1.  **Nowy (New):** Błąd został zgłoszony przez QA.
2.  **W Analizie (In Analysis):** Deweloper analizuje zgłoszenie.
3.  **Do Zrobienia (To Do):** Błąd został zaakceptowany i czeka na naprawę.
4.  **W Trakcie (In Progress):** Deweloper pracuje nad poprawką.
5.  **Do Weryfikacji (Ready for QA):** Poprawka została wdrożona na środowisko Staging.
6.  **Weryfikacja (In QA):** QA weryfikuje poprawkę.
7.  **Zamknięty (Closed):** Poprawka zweryfikowana pomyślnie.
8.  **Otwarty Ponownie (Reopened):** Poprawka nie zadziałała, błąd wraca do dewelopera.

---

## 12. Przykłady Testów E2E z Playwright - Best Practices

### 12.1. Page Object Model (POM) Pattern

```typescript
// e2e/page-objects/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
```

### 12.2. Przykładowy Test E2E - Rejestracja i Logowanie

```typescript
// e2e/tests/auth/registration.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker/locale/pl';
import { RegistrationPage } from '../../page-objects/RegistrationPage';
import { DashboardPage } from '../../page-objects/DashboardPage';

test.describe('User Registration Flow', () => {
  test('should successfully register a new user and redirect to dashboard', async ({ page }) => {
    // Arrange - Prepare test data
    const testUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: `test-${Date.now()}@example.com`,
      password: 'SecureP@ssw0rd123!',
      bloodType: 'A+',
    };

    const registrationPage = new RegistrationPage(page);
    const dashboardPage = new DashboardPage(page);

    // Act - Navigate and fill registration form
    await registrationPage.goto();
    await registrationPage.fillRegistrationForm(testUser);
    await registrationPage.submitForm();

    // Assert - Verify successful registration
    await expect(page).toHaveURL(/\/weryfikacja-email/);
    await expect(page.locator('h1')).toContainText('Sprawdź swoją skrzynkę e-mail');

    // Mock email verification (for E2E testing)
    const verificationToken = await page.evaluate(() => {
      return localStorage.getItem('verificationToken');
    });
    await page.goto(`/verify-email?token=${verificationToken}`);

    // Assert - Verify redirect to dashboard after verification
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(dashboardPage.welcomeMessage).toContainText(testUser.firstName);
  });

  test('should show validation errors for invalid registration data', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);

    await registrationPage.goto();

    // Test weak password
    await registrationPage.emailInput.fill('test@example.com');
    await registrationPage.passwordInput.fill('weak');
    await registrationPage.submitButton.click();

    await expect(registrationPage.passwordError).toContainText(
      'Hasło musi zawierać minimum 8 znaków'
    );

    // Test invalid email
    await registrationPage.emailInput.fill('invalid-email');
    await registrationPage.emailInput.blur();

    await expect(registrationPage.emailError).toContainText('Nieprawidłowy adres e-mail');
  });

  test('should prevent duplicate email registration', async ({ page, request }) => {
    const existingEmail = 'existing@example.com';

    // Pre-condition: Create user via API
    await request.post('/api/auth/register', {
      data: {
        email: existingEmail,
        password: 'SecureP@ss123!',
        firstName: 'John',
        lastName: 'Doe',
        bloodType: 'O+',
      },
    });

    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();

    await registrationPage.emailInput.fill(existingEmail);
    await registrationPage.passwordInput.fill('SecureP@ss123!');
    await registrationPage.firstNameInput.fill('Jane');
    await registrationPage.lastNameInput.fill('Smith');
    await registrationPage.submitButton.click();

    await expect(registrationPage.errorMessage).toContainText(
      'Użytkownik z tym adresem e-mail już istnieje'
    );
  });
});
```

### 12.3. Przykładowy Test E2E - CRUD Donacji

```typescript
// e2e/tests/dashboard/donations.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../page-objects/DashboardPage';
import { authenticatedUser } from '../../fixtures/auth.fixture';

test.describe('Donations Management', () => {
  test.use({ storageState: 'auth-state.json' }); // Reuse authenticated session

  test('should add a new donation entry', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.navigateToDonations();

    // Click "Add Donation" button
    await page.click('[data-testid="add-donation-button"]');

    // Fill donation form
    await page.fill('[name="date"]', '2025-11-10');
    await page.selectOption('[name="rckikId"]', { label: 'RCKiK Warszawa' });
    await page.fill('[name="volumeMl"]', '450');
    await page.selectOption('[name="donationType"]', 'WHOLE_BLOOD');
    await page.fill('[name="notes"]', 'Regular donation');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for API response
    await page.waitForResponse(resp => resp.url().includes('/api/donations') && resp.status() === 201);

    // Assert - Verify donation appears in the list
    const donationRow = page.locator('[data-testid="donation-row"]').first();
    await expect(donationRow).toContainText('2025-11-10');
    await expect(donationRow).toContainText('450 ml');
    await expect(donationRow).toContainText('RCKiK Warszawa');

    // Assert - Verify statistics updated
    await expect(page.locator('[data-testid="total-donations"]')).toHaveText('1');
  });

  test('should edit an existing donation', async ({ page }) => {
    // Pre-condition: Create donation via API
    await page.request.post('/api/donations', {
      data: {
        date: '2025-11-01',
        rckikId: 1,
        volumeMl: 450,
        donationType: 'WHOLE_BLOOD',
      },
    });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.navigateToDonations();

    // Click edit button
    await page.click('[data-testid="edit-donation-button"]');

    // Update volume
    await page.fill('[name="volumeMl"]', '500');
    await page.click('button[type="submit"]');

    // Assert
    await page.waitForResponse(resp => resp.url().includes('/api/donations') && resp.status() === 200);
    const donationRow = page.locator('[data-testid="donation-row"]').first();
    await expect(donationRow).toContainText('500 ml');
  });

  test('should delete a donation with confirmation', async ({ page }) => {
    // Pre-condition: Create donation via API
    const response = await page.request.post('/api/donations', {
      data: {
        date: '2025-11-01',
        rckikId: 1,
        volumeMl: 450,
        donationType: 'WHOLE_BLOOD',
      },
    });
    const donation = await response.json();

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.navigateToDonations();

    // Click delete button
    await page.click('[data-testid="delete-donation-button"]');

    // Confirm deletion in modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Potwierdź")');

    // Wait for delete API call
    await page.waitForResponse(
      resp => resp.url().includes(`/api/donations/${donation.id}`) && resp.status() === 204
    );

    // Assert - Donation removed from list
    await expect(page.locator('[data-testid="donation-row"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });
});
```

### 12.4. Visual Regression Testing

```typescript
// e2e/tests/visual/homepage.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage should match visual snapshot', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test('RCKiK list should match visual snapshot', async ({ page }) => {
    await page.goto('/rckik');
    await page.waitForLoadState('networkidle');

    // Hide dynamic elements (dates, etc.)
    await page.addStyleTag({
      content: '[data-testid="timestamp"] { visibility: hidden; }',
    });

    await expect(page).toHaveScreenshot('rckik-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('dark mode should render correctly', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    });
  });
});
```

### 12.5. API Testing z Playwright

```typescript
// e2e/tests/api/rckik-api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('RCKiK API Tests', () => {
  test('GET /api/rckik should return list of blood centers', async ({ request }) => {
    const response = await request.get('/api/rckik');

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Validate schema
    expect(data[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      city: expect.any(String),
      address: expect.any(String),
    });
  });

  test('GET /api/rckik/:id should return blood center details', async ({ request }) => {
    const response = await request.get('/api/rckik/1');

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toMatchObject({
      id: 1,
      name: expect.any(String),
      bloodStocks: expect.any(Array),
    });
  });

  test('GET /api/rckik/999 should return 404 for non-existent center', async ({ request }) => {
    const response = await request.get('/api/rckik/999');
    expect(response.status()).toBe(404);
  });

  test('POST /api/donations should create donation (authenticated)', async ({ request }) => {
    // Login first to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'SecureP@ss123!',
      },
    });
    const { token } = await loginResponse.json();

    // Create donation
    const response = await request.post('/api/donations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        date: '2025-11-10',
        rckikId: 1,
        volumeMl: 450,
        donationType: 'WHOLE_BLOOD',
      },
    });

    expect(response.status()).toBe(201);
    const donation = await response.json();

    expect(donation).toMatchObject({
      id: expect.any(Number),
      date: '2025-11-10',
      volumeMl: 450,
    });
  });
});
```

### 12.6. Accessibility Testing z Playwright

```typescript
// e2e/tests/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests (WCAG 2.1 AA)', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login form should be accessible', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Additional manual checks
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('aria-label');
    await expect(emailInput).toHaveAttribute('id');

    const label = page.locator('label[for="email"]');
    await expect(label).toBeVisible();
  });

  test('dashboard should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    // Login first
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecureP@ss123!');
    await page.press('[name="password"]', 'Enter');

    await page.waitForURL('/dashboard');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(firstFocusedElement).toBeTruthy();

    // Ensure all interactive elements are reachable via keyboard
    const interactiveElements = await page.locator('button, a, input, select').count();
    let tabCount = 0;
    const maxTabs = interactiveElements + 10;

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
    }

    expect(tabCount).toBeGreaterThan(0);
  });
});
```

### 12.7. Performance Testing z Playwright

```typescript
// e2e/tests/performance/web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests - Web Vitals', () => {
  test('homepage should load within performance budget', async ({ page }) => {
    await page.goto('/');

    const performanceMetrics = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const vitals = {
            LCP: 0,
            FID: 0,
            CLS: 0,
          };

          entries.forEach(entry => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.renderTime || entry.loadTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.FID = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              vitals.CLS += entry.value;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });

    // Assert Web Vitals thresholds
    expect(performanceMetrics.LCP).toBeLessThan(2500); // Good: < 2.5s
    expect(performanceMetrics.FID).toBeLessThan(100); // Good: < 100ms
    expect(performanceMetrics.CLS).toBeLessThan(0.1); // Good: < 0.1
  });

  test('API endpoints should respond within SLA', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.get('/api/rckik');

    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(500); // < 500ms
  });
});
```

### 12.8. Best Practices Summary

**✅ DO:**
- Używaj Page Object Model dla reużywalności
- Izoluj testy - każdy test niezależny
- Używaj fixtures dla wspólnego setup (auth, data)
- Preferuj data-testid dla selektorów (stabilniejsze niż CSS classes)
- Mockuj zewnętrzne API (WireMock, MSW)
- Używaj auto-waiting Playwright (unikaj manual sleep)
- Zapisuj storage state dla authenticated sessions
- Używaj parallelization (workers)
- Retry flaky tests (max 2x)
- Zbieraj traces i screenshots on failure

**❌ DON'T:**
- Nie używaj hardcoded delays (sleep, setTimeout)
- Nie używaj niestabilnych selektorów (nth-child, classes CSS)
- Nie testuj implementacji, testuj behavior
- Nie duplikuj kodu - używaj POM i fixtures
- Nie testuj wszystkiego E2E - preferuj testy jednostkowe dla logiki
- Nie ignoruj flaky tests - napraw je
- Nie commituj auth credentials - używaj env variables
- Nie uruchamiaj wszystkich testów lokalnie - używaj CI/CD

---

## 13. Podsumowanie i Następne Kroki

### 13.1. Kluczowe Ulepszenia w Wersji 2.0

Ten zaktualizowany plan testów wprowadza następujące nowoczesne praktyki:

1. **Playwright jako jedyne narzędzie E2E** - eliminacja Cypress, pełna funkcjonalność w jednym narzędziu
2. **Testing Trophy strategy** - 70% integration, 20% unit, 10% E2E
3. **Visual Regression Testing** - automatyczne wykrywanie zmian UI
4. **Component Testing** - testowanie komponentów w prawdziwej przeglądarce
5. **API Contract Testing** - weryfikacja kontraktów między serwisami
6. **Shift-Left Testing** - testy równolegle z kodem, pre-commit hooks
7. **Advanced CI/CD** - pełna automatyzacja, parallel execution, retry strategy
8. **Performance Testing** - Web Vitals, k6 load testing, Lighthouse CI
9. **Security Testing** - SAST/DAST, dependency scanning, OWASP ZAP
10. **Accessibility Testing** - axe-core integration, WCAG 2.1 AA compliance
11. **Test Data Management** - factories, Faker.js, Testcontainers
12. **Flaky Tests Prevention** - auto-waiting, isolation, retry mechanism
13. **Quality Metrics** - coverage, MTTD, MTTR, deployment frequency

### 13.2. Roadmap Implementacji

**Faza 1 (Miesiąc 1): Fundament**
- [ ] Setup Playwright w projekcie (config, browsers, CI/CD)
- [ ] Implementacja Page Object Model dla kluczowych widoków
- [ ] Migracja lub utworzenie fixtures (auth, test data)
- [ ] Setup Vitest dla testów jednostkowych frontend
- [ ] Setup Testcontainers dla testów backend

**Faza 2 (Miesiąc 2): Automatyzacja E2E**
- [ ] Implementacja testów E2E dla krytycznych ścieżek (login, registration, donations)
- [ ] Visual regression testing setup (baselines screenshots)
- [ ] API testing z Playwright
- [ ] Accessibility testing z axe-core

**Faza 3 (Miesiąc 3): CI/CD i Quality Gates**
- [ ] GitHub Actions workflows (testy przy każdym PR)
- [ ] Parallel execution optimization
- [ ] Lighthouse CI setup
- [ ] Code coverage tracking (Codecov)
- [ ] Allure reporting

**Faza 4 (Miesiąc 4): Performance i Security**
- [ ] k6 load testing implementation
- [ ] OWASP ZAP security scanning
- [ ] Snyk dependency scanning
- [ ] Performance budgets i monitoring

**Faza 5 (Continuous): Maintenance**
- [ ] Regular test maintenance i refactoring
- [ ] Flaky tests analysis i fixes
- [ ] Test coverage improvements
- [ ] Quality metrics monitoring

### 13.3. Metryki Sukcesu

Projekt będzie uznany za sukces, jeśli osiągnie:
- **80%+ code coverage** dla logiki biznesowej
- **< 5% flaky test rate**
- **< 20 min** czas wykonania pełnego test suite w CI/CD
- **Zero critical/high security vulnerabilities**
- **Lighthouse scores: 90+ Performance, 95+ Accessibility**
- **< 2.5s LCP, < 100ms FID, < 0.1 CLS** (Core Web Vitals)
- **Daily deployments** do staging
- **< 5% change failure rate**

---

**Koniec dokumentu**

*Ten plan testów jest dokumentem żywym i będzie aktualizowany wraz z ewolucją projektu i pojawianiem się nowych best practices w świecie testowania.*