# Kompleksowy Plan Testów dla Projektu "mkrew"

**Wersja dokumentu:** 1.0
**Data utworzenia:** 15.10.2023
**Autor:** [Twoje Imię i Nazwisko], Starszy Inżynier QA

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

Proces testowania zostanie podzielony na następujące poziomy i typy:

| Poziom Testów | Typ Testów | Opis | Odpowiedzialność |
|---|---|---|---|
| **Testy Komponentów** | **Testy Jednostkowe** | Weryfikacja pojedynczych klas, metod i funkcji w izolacji (np. logika serwisów, hooki React, utils). | Deweloperzy |
| | **Testy Komponentów UI** | Testowanie komponentów React w izolacji, weryfikacja renderowania i interakcji. | Deweloperzy Frontend |
| **Testy Integracyjne** | **Integracja Komponentów** | Weryfikacja współpracy między komponentami (np. formularz z walidacją i przyciskiem submit). | Deweloperzy / QA |
| | **Integracja z Bazą Danych**| Testowanie warstwy repozytoriów Spring Data JPA z użyciem bazy danych w kontenerze (Testcontainers). | Deweloperzy Backend |
| | **Testy API** | Testowanie punktów końcowych REST API (black-box), weryfikacja kontraktów, walidacji i kodów odpowiedzi. | QA / Deweloperzy Backend |
| **Testy Systemowe**| **Testy E2E (End-to-End)**| Symulacja pełnych scenariuszy użytkownika w zintegrowanej aplikacji (UI -> API -> Baza Danych). | QA |
| | **Testy Bezpieczeństwa** | Weryfikacja mechanizmów autentykacji, autoryzacji i ochrony przed podstawowymi atakami (np. IDOR, XSS). | QA (z wsparciem dev) |
| | **Testy Wydajnościowe** | Pomiar czasu odpowiedzi kluczowych endpointów API i czasu ładowania stron pod obciążeniem. | QA |
| **Testy Akceptacyjne** | **Testy Użyteczności (UAT)** | Ręczne testy eksploracyjne, weryfikacja UX i zgodności z oczekiwaniami użytkownika. | QA / Product Owner |
| | **Testy Zgodności** | Sprawdzenie zgodności z RODO (np. usuwanie danych, zgody). | QA / Product Owner |
| | **Testy Responsywności (RWD)**| Weryfikacja poprawnego wyświetlania i działania UI na różnych rozmiarach ekranu. | QA / Deweloperzy Frontend |
| | **Testy Kompatybilności** | Sprawdzenie działania aplikacji na różnych przeglądarkach (Chrome, Firefox, Safari). | QA |
| | **Testy Regresji** | Automatyczne i manualne testy weryfikujące, czy nowe zmiany nie zepsuły istniejących funkcjonalności. | QA (automatyzacja) |

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

| Narzędzie | Zastosowanie |
|---|---|
| **JUnit 5 / Mockito** | Testy jednostkowe i integracyjne dla backendu Java/Spring Boot. |
| **Testcontainers** | Uruchamianie kontenera PostgreSQL na potrzeby testów integracyjnych backendu. |
| **Vitest / React Testing Library**| Testy jednostkowe i komponentowe dla frontendu React. |
| **Playwright / Cypress** | Testy E2E, symulacja interakcji użytkownika w przeglądarce. |
| **Postman / Newman** | Ręczne i automatyczne testy API, testy kontraktowe. |
| **JMeter / k6** | Testy wydajnościowe i obciążeniowe API. |
| **Axe DevTools** | Testy dostępności (WCAG) frontendu. |
| **Lighthouse** | Audyt wydajności, SEO i PWA dla frontendu. |
| **Jira / Xray / TestRail** | Zarządzanie przypadkami testowymi, planowanie i raportowanie. |
| **GitHub Actions** | Automatyzacja testów w procesie CI/CD. |

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

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Entry Criteria)
- Dostępna jest dokumentacja wymagań (PRD) i specyfikacja techniczna.
- Kod został wdrożony na odpowiednie środowisko testowe (Staging).
- Wszystkie testy jednostkowe i integracyjne w CI zakończyły się sukcesem.

### 8.2. Kryteria Zakończenia (Exit Criteria)
- **100%** zdefiniowanych przypadków testowych dla krytycznych ścieżek (P0) zostało wykonanych i zakończonych sukcesem.
- **95%** wszystkich przypadków testowych zostało wykonanych.
- **Brak otwartych błędów krytycznych (Blocker) i poważnych (Critical).**
- **Mniej niż 5** otwartych błędów o średnim priorytecie (Major), które nie blokują głównych funkcjonalności i mają zaplanowane rozwiązanie.
- Pokrycie kodu testami jednostkowymi na poziomie **min. 80%** dla logiki biznesowej (warstwa serwisów backend, hooki frontend).
- Wynik audytu Lighthouse: Performance > 90, Accessibility > 95.

---

## 9. Role i Odpowiedzialności w Procesie Testowania

| Rola | Odpowiedzialności |
|---|---|
| **Deweloperzy Backend** | - Pisanie testów jednostkowych i integracyjnych dla kodu backendu.<br>- Poprawianie błędów zgłoszonych przez QA.<br>- Wsparcie w analizie błędów wydajnościowych. |
| **Deweloperzy Frontend**| - Pisanie testów jednostkowych i komponentowych dla kodu frontendu.<br>- Poprawianie błędów UI zgłoszonych przez QA.<br>- Zapewnienie responsywności i dostępności. |
| **Inżynier QA** | - Tworzenie i utrzymanie planu testów oraz przypadków testowych.<br>- Przeprowadzanie testów manualnych (eksploracyjnych, UAT).<br>- Automatyzacja testów E2E i regresyjnych.<br>- Raportowanie i weryfikacja błędów.<br>- Przeprowadzanie testów wydajnościowych i bezpieczeństwa.<br>- Ostateczna akceptacja jakości produktu. |
| **Product Owner** | - Udział w testach akceptacyjnych (UAT).<br>- Definiowanie priorytetów dla zgłoszonych błędów.<br>- Ostateczne zatwierdzenie produktu do wdrożenia. |
| **DevOps** | - Utrzymanie i konfiguracja środowisk testowych (CI, Staging).<br>- Wsparcie w automatyzacji deploymentu i testów. |

---

## 10. Procedury Raportowania Błędów

Wszystkie błędy będą raportowane i śledzone w systemie Jira.

### 10.1. Szablon Zgłoszenia Błędu
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

### 10.2. Cykl Życia Błędu
1.  **Nowy (New):** Błąd został zgłoszony przez QA.
2.  **W Analizie (In Analysis):** Deweloper analizuje zgłoszenie.
3.  **Do Zrobienia (To Do):** Błąd został zaakceptowany i czeka na naprawę.
4.  **W Trakcie (In Progress):** Deweloper pracuje nad poprawką.
5.  **Do Weryfikacji (Ready for QA):** Poprawka została wdrożona na środowisko Staging.
6.  **Weryfikacja (In QA):** QA weryfikuje poprawkę.
7.  **Zamknięty (Closed):** Poprawka zweryfikowana pomyślnie.
8.  **Otwarty Ponownie (Reopened):** Poprawka nie zadziałała, błąd wraca do dewelopera.