# E2E Testing Guide - mkrew

## 📋 Spis treści

1. [Przegląd](#przegląd)
2. [Konfiguracja](#konfiguracja)
3. [Uruchamianie testów](#uruchamianie-testów)
4. [Rozwiązywanie problemów](#rozwiązywanie-problemów)
5. [CI/CD](#cicd)

---

## 🎯 Przegląd

Testy E2E w projekcie mkrew używają **Playwright** i są uruchamiane przeciwko **lokalnemu backendowi** z **wyłączonym rate limiting**.

### ⚠️ WAŻNE: Nie testuj przeciwko produkcji!

**NIGDY nie uruchamiaj testów E2E przeciwko produkcyjnemu API (`api.mkrew.pl`)!**

Powody:
- ❌ Rate limiting blokuje testy
- ❌ Zaśmiecenie produkcyjnej bazy danych testowymi kontami
- ❌ Modyfikacja rzeczywistych danych użytkowników
- ❌ Niestabilność testów (zależność od produkcji)

### ✅ Bezpieczna konfiguracja testowa

Testy używają:
- **Lokalny backend**: `http://localhost:8080`
- **Rate limiting**: WYŁĄCZONY (`RATE_LIMIT_ENABLED=false`)
- **Testowa baza danych**: PostgreSQL na porcie `5434`
- **Konfiguracja**: `.env.test`

---

## 🔧 Konfiguracja

### Wymagania

- Docker i Docker Compose
- Node.js 18+
- npm/pnpm/yarn

### Instalacja zależności

```bash
cd frontend
npm install
npm run playwright:install
```

---

## 🚀 Uruchamianie testów

### Opcja 1: Automatyczne uruchomienie (Recommended) ⭐

**Najłatwiejszy sposób** - automatycznie uruchamia backend, wykonuje testy i zatrzymuje backend:

```bash
cd frontend
npm run test:e2e:full
```

**Co się dzieje:**
1. Uruchamia backend testowy via docker-compose
2. Czeka 15 sekund na inicjalizację
3. Wykonuje testy Playwright
4. Zatrzymuje backend (nawet jeśli testy failują)

---

### Opcja 2: Manualne uruchomienie

**Krok 1: Uruchom backend testowy**

```bash
# Z katalogu frontend
npm run test:e2e:backend:start

# Lub bezpośrednio z głównego katalogu
docker-compose -f docker-compose.test.yml up -d
```

**Krok 2: Sprawdź status backendu**

```bash
# Sprawdź logi
npm run test:e2e:backend:logs

# Lub
docker logs -f mkrew-test-backend
```

Poczekaj na:
```
Started BackendApplication in X.XXX seconds
```

**Krok 3: Uruchom testy**

```bash
cd frontend

# Wszystkie testy
npm run test:e2e

# UI mode (interaktywny)
npm run test:e2e:ui

# Z widoczną przeglądarką
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

**Krok 4: Zatrzymaj backend**

```bash
npm run test:e2e:backend:stop
```

---

### Opcja 3: Czyszczenie środowiska testowego

Jeśli coś poszło nie tak i chcesz zacząć od nowa:

```bash
# Zatrzymaj i usuń wszystko (łącznie z wolumenami bazy danych)
npm run test:e2e:backend:clean

# Lub
docker-compose -f docker-compose.test.yml down -v
```

---

## 📊 Dostępne komendy

| Komenda | Opis |
|---------|------|
| `npm run test:e2e` | Uruchom wszystkie testy E2E |
| `npm run test:e2e:ui` | Uruchom w trybie UI (interaktywny) |
| `npm run test:e2e:headed` | Uruchom z widoczną przeglądarką |
| `npm run test:e2e:debug` | Uruchom w trybie debug |
| `npm run test:e2e:report` | Pokaż raport z ostatnich testów |
| `npm run test:e2e:full` | **Automatyczne** - backend + testy + cleanup |
| `npm run test:e2e:backend:start` | Uruchom backend testowy |
| `npm run test:e2e:backend:stop` | Zatrzymaj backend testowy |
| `npm run test:e2e:backend:logs` | Pokaż logi backendu |
| `npm run test:e2e:backend:clean` | Wyczyść wszystko (włącznie z DB) |

---

## 🐛 Rozwiązywanie problemów

### Problem: Testy failują z błędem "Connection refused"

**Przyczyna:** Backend nie jest uruchomiony lub jeszcze się nie zainicjalizował.

**Rozwiązanie:**
```bash
# Sprawdź czy backend działa
docker ps | grep mkrew-test-backend

# Sprawdź logi
npm run test:e2e:backend:logs

# Restartuj backend
npm run test:e2e:backend:stop
npm run test:e2e:backend:start
```

---

### Problem: Backend nie startuje - błąd portu

**Przyczyna:** Port 8080 lub 5434 jest już zajęty.

**Rozwiązanie:**
```bash
# Sprawdź co używa portu 8080
lsof -i :8080

# Lub dla PostgreSQL (5434)
lsof -i :5434

# Zatrzymaj istniejący backend
docker-compose -f backend/docker-compose.yml down
```

---

### Problem: "Rate limit exceeded" w testach

**Przyczyna:** Używasz produkcyjnego API zamiast lokalnego backendu!

**Rozwiązanie:**
1. Sprawdź czy `.env.test` istnieje i ma `PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`
2. Sprawdź czy backend testowy jest uruchomiony z `RATE_LIMIT_ENABLED=false`
3. Zrestartuj testy

---

### Problem: Baza danych ma stare dane

**Przyczyna:** Wolumen PostgreSQL zachowuje dane między uruchomieniami.

**Rozwiązanie:**
```bash
# Wyczyść wszystko (UWAGA: usuwa dane testowe!)
npm run test:e2e:backend:clean

# Następnie uruchom ponownie
npm run test:e2e:backend:start
```

---

### Problem: Playwright browsers nie są zainstalowane

**Rozwiązanie:**
```bash
cd frontend
npm run playwright:install
```

---

## 🔍 Weryfikacja konfiguracji

### 1. Sprawdź czy backend testowy używa lokalnego API

```bash
# Powinno zwrócić: http://localhost:8080/api/v1
grep PUBLIC_API_BASE_URL frontend/.env.test
```

### 2. Sprawdź czy rate limiting jest wyłączony

```bash
# Powinno pokazać: RATE_LIMIT_ENABLED=false
docker-compose -f docker-compose.test.yml config | grep RATE_LIMIT_ENABLED
```

### 3. Sprawdź czy backend jest healthy

```bash
curl http://localhost:8080/actuator/health
# Powinno zwrócić: {"status":"UP"}
```

### 4. Sprawdź dostępność API

```bash
curl http://localhost:8080/api/v1/public/rckik
# Powinno zwrócić listę centrów krwiodawstwa (JSON)
```

---

## 🏗️ Architektura środowiska testowego

```
┌─────────────────────────────────────────────────┐
│         Playwright E2E Tests                    │
│         (frontend/e2e/tests/*.spec.ts)         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTP requests
                  ↓
┌─────────────────────────────────────────────────┐
│         Frontend Dev Server                     │
│         http://localhost:4321                   │
│         (.env.test config)                      │
└─────────────────┬───────────────────────────────┘
                  │
                  │ API calls
                  ↓
┌─────────────────────────────────────────────────┐
│         Backend Test (Docker)                   │
│         http://localhost:8080                   │
│         RATE_LIMIT_ENABLED=false ⚠️             │
└─────────────────┬───────────────────────────────┘
                  │
                  │ SQL queries
                  ↓
┌─────────────────────────────────────────────────┐
│         PostgreSQL Test DB (Docker)             │
│         localhost:5434                          │
│         Database: mkrew_test                    │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Konfiguracja środowiskowa

### Backend testowy (`docker-compose.test.yml`)

```yaml
environment:
  RATE_LIMIT_ENABLED: "false"  # ⚠️ WYŁĄCZONE dla testów
  EMAIL_ENABLED: "false"       # ⚠️ WYŁĄCZONE dla testów
  DB_NAME: mkrew_test          # Oddzielna baza testowa
  LIQUIBASE_CONTEXTS: test     # Ładuje dane testowe
```

### Frontend testowy (`.env.test`)

```bash
PUBLIC_API_BASE_URL=http://localhost:8080/api/v1  # Lokalny backend
PUBLIC_ENABLE_ANALYTICS=false                      # Wyłączona analityka
PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZ...     # Test key (Google test key - zawsze passes)
```

### Dane testowe (Seed Data)

Backend testowy automatycznie ładuje dane:

**RCKiK Centra** (wszystkie regiony Polski):
- Warszawa, Kraków, Wrocław, Poznań, Gdańsk, itd.
- Źródło: `db/changelog/changesets/018-seed-rckik-data.yaml`

**Blood Snapshots** (tylko dla testów E2E):
- Snapshoty dla Warszawy (wszystkie 8 grup krwi) z różnymi poziomami
- Snapshoty dla Krakowa (wybrane grupy)
- Różne statusy: OPTIMAL, SUFFICIENT, LOW, CRITICAL
- Źródło: `db/changelog/changesets/023-seed-test-data-e2e.yaml` (context: test)

**Użytkownicy testowi**:
- Test User: `test.e2e@mkrew.pl` / `TestE2E123!`
- Admin: (z seed: 022-seed-admin-user.yaml)

**Konfiguracje scraperów**:
- Źródło: `db/changelog/changesets/019-seed-scraper-configs.yaml`

---

## 🚦 CI/CD

### ✅ GitHub Actions - Automatyczna konfiguracja

**Testy E2E są już skonfigurowane w GitHub Actions!**

Workflow `.github/workflows/test.yml` automatycznie:
1. ✅ Buduje backend (Java + Gradle)
2. ✅ Uruchamia `docker-compose.test.yml` (PostgreSQL + Backend + Liquibase)
3. ✅ Ładuje dane testowe (seed data via Liquibase context: test)
4. ✅ Czeka na backend health check (max 60s)
5. ✅ Uruchamia testy Playwright
6. ✅ Zatrzymuje backend po testach
7. ✅ Uploaduje raporty jako artifacts

### Jak to działa w CI?

**Workflow uruchamia się automatycznie przy:**
- Pull Requestach
- Push do `main` lub `develop`

**Logi i raporty:**
- Logi backendu: dostępne w przypadku błędów
- Playwright report: artifact `playwright-report`
- Test results: artifact `test-results`

### Co jest testowane?

- **E2E Tests**: Pełne testy end-to-end (wszystkie specyfikacje)
- **Accessibility Tests**: Osobny job dla testów axe-core

### Dane testowe w CI

Backend w CI automatycznie ładuje:
- ✅ **Wszystkie RCKiK centra** (seed: 018-seed-rckik-data.yaml)
- ✅ **Blood snapshots dla testów** (seed: 023-seed-test-data-e2e.yaml - tylko context:test)
- ✅ **Testowy użytkownik**: `test.e2e@mkrew.pl` / `TestE2E123!`
- ✅ **Admin użytkownik** (seed: 022-seed-admin-user.yaml)

### Przykładowy workflow (już zaimplementowany)

```yaml
jobs:
  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js & Java
        # ... (konfiguracja Node 20 + Java 21)

      - name: Build backend
        run: ./gradlew build -x test

      - name: Start test backend and database
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for backend health check
        # Sprawdza http://localhost:8080/actuator/health
        # Maksymalnie 30 prób (60 sekund)

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload reports
        # Playwright report + test results

      - name: Stop test backend
        if: always()
        run: docker-compose -f docker-compose.test.yml down -v
```

---

## 📚 Dodatkowe zasoby

- [Playwright Documentation](https://playwright.dev/)
- [E2E Test Plan](.ai/test-plan.md)
- [Playwright Best Practices](.ai/playwright-e2e-testing.mdc)
- [Backend API Docs](backend/docs/)

---

## 🆘 Pomoc

Jeśli masz problemy z testami E2E:

1. ✅ Sprawdź [sekcję rozwiązywania problemów](#rozwiązywanie-problemów)
2. ✅ Sprawdź logi backendu: `npm run test:e2e:backend:logs`
3. ✅ Wyczyść środowisko: `npm run test:e2e:backend:clean`
4. ✅ Zgłoś issue na GitHubie z logami i opisem problemu

---

**Ostatnia aktualizacja:** 2025-11-16
**Wersja:** 2.1.0
