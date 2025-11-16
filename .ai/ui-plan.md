# Architektura UI dla mkrew

## 1. Przegląd struktury UI

Celem interfejsu użytkownika aplikacji mkrew jest umożliwienie dawców i administratorów wygodnej pracy z danymi o stanach krwi, zarządzanie donacjami, ulubionymi centrami oraz preferencjami powiadomień. UI łączy strony publiczne (SSG z ISR), strony autentykacji (SSR), chronione dashboardy (SSR + klient) oraz panel administracyjny (SSR z kontrolą roli).

W skrócie:
- Publiczne strony (SSG, revalidate/ISR = 5 min): `/`, `/rckik`, `/rckik/[id]`.
- Strony autentykacji (SSR): `/login`, `/register`, `/verify-email`, `/reset-password`.
- Chronione dashboardy (SSR + React islands): `/dashboard`, `/profile`, `/donations`, `/favorites`, `/notifications` (JWT auth wymagane).
- Panel admina (SSR + role check): `/admin/rckik`, `/admin/scraper`, `/admin/reports`.
- Layouty Astro: `BaseLayout.astro` (public), `AuthLayout.astro` (auth), `DashboardLayout.astro` (chronione).

Wymagane podejścia technologiczne (zgodnie z notatkami): Astro + React islands, Redux Toolkit, Axios z interceptorami, Tailwind CSS dla utility classes, React Hook Form + Zod dla walidacji, Recharts/Chart.js dla wykresów, Leaflet/Mapbox dla map.

### 1.1 Kluczowe wymagania wyciągnięte z PRD
- Prezentacja stanów krwi per RCKiK (lista + szczegóły + trend historyczny).
- Obsługa kont użytkowników: rejestracja (multi-step), weryfikacja email, logowanie, reset hasła.
- Zarządzanie donacjami użytkownika: lista, dodawanie, edycja, eksport danych.
- Ulubione RCKiK: dodawanie, reordering, priorytety, powiadomienia.
- System powiadomień in-app + preferencje e-mail/in-app.
- Panel administracyjny do CRUD RCKiK, monitoringu scrapera i raportów.
- Dostępność (WCAG 2.1 AA), responsywność (mobile-first), bezpieczeństwo (tokeny, XSS/CSRF).
- Optymalizacja wydajności: partial hydration, code splitting, ISR dla publicznych stron.

### 1.2 Główne punkty końcowe API (mapa i cele)
Poniższa lista to kluczowe endpointy wymagane przez UI (dokładna specyfikacja w `docs/`):
- `GET /api/v1/rckik` — lista centrów (filtrowanie, paginacja, statusy). Cel: źródło danych dla `/rckik` i mapy.
- `GET /api/v1/rckik/{id}` — szczegóły centrum, aktualne stany, historia (snapshoty). Cel: `/rckik/[id]`.
- `GET /api/v1/rckik/{id}/history?range=` — historyczne snapshoty (dla wykresów).
- `POST /api/v1/auth/register` — rejestracja (multi-step przesyłana etapami lub połączona).
- `POST /api/v1/auth/login` — logowanie, zwraca access + refresh token (lub backend ustawia httpOnly cookie).
- `GET /api/v1/auth/verify-email?token=` — weryfikacja email.
- `POST /api/v1/auth/password-reset/request` — żądanie resetu hasła.
- `POST /api/v1/auth/password-reset/confirm` — potwierdzenie nowego hasła.
- `GET /api/v1/users/me` — profil zalogowanego użytkownika.
- `PATCH /api/v1/users/me` — aktualizacja profilu.
- `GET /api/v1/users/me/notification-preferences` oraz `PUT /api/v1/users/me/notification-preferences` — pobierz/zapisz preferencje powiadomień.
- `GET /api/v1/users/me/favorites` / `POST /api/v1/users/me/favorites` / `PATCH /api/v1/users/me/favorites` / `DELETE /api/v1/users/me/favorites/{id}` — zarządzanie ulubionymi.
- `GET /api/v1/donations` / `POST /api/v1/donations` / `PATCH /api/v1/donations/{id}` / `DELETE /api/v1/donations/{id}` — zarządzanie donacjami użytkownika + eksport.
- `GET /api/v1/notifications` / `PATCH /api/v1/notifications/{id}/mark-read` — powiadomienia in-app.
- Admin: `GET/POST/PATCH/DELETE /api/v1/admin/rckik`, `/api/v1/admin/scraper/status`, `/api/v1/admin/reports` — CRUD i monitoring.
- Admin Blood Snapshots (US-028): `POST /api/v1/admin/blood-snapshots` — ręczne wprowadzanie stanów krwi, `GET /api/v1/admin/blood-snapshots` — listowanie z filtrowaniem (manual/scraped).
- Admin Parsers (US-029, US-030): `GET /api/v1/admin/parsers/configs` — lista konfiguracji parserów, `POST /api/v1/admin/parsers/configs` — tworzenie konfiguracji, `PUT /api/v1/admin/parsers/configs/{id}` — aktualizacja, `POST /api/v1/admin/parsers/configs/{id}/test` — dry-run test parsera.
- Token refresh: `POST /api/v1/auth/refresh` — odświeżanie tokena.

Mapowanie UI↔API: każdy widok chroniony odczytuje `users/me` + specyficzne zasoby (donations, favorites, notifications). Publiczne korzystają z `rckik` endpoints.

## 2. Lista widoków

Dla każdego widoku podaję: cel, kluczowe informacje, komponenty i wymagania UX/dostępności/bepieczeństwa.

### Publiczne strony (SSG)

#### Landing Page
- Ścieżka: `/`
- Główny cel: Wprowadzenie do usługi, CTA do rejestracji/logowania, SEO.
- Kluczowe informacje: Hero z value proposition, najważniejsze funkcjonalności, CTA, link do listy RCKiK, krótka instrukcja jak działa platforma.
- Kluczowe komponenty: Hero, FeaturesList, CTAButton, Testimonials, Footer.
- UX/dostępność/bezpieczeństwo: Semantyczne nagłówki H1..H3, alt dla obrazów, odpowiednia kolejność focus, brak formularzy przetwarzających dane.

#### Lista RCKiK
- Ścieżka: `/rckik`
- Główny cel: Szybkie znalezienie centrum i ocena jego stanu krwi.
- Kluczowe informacje: Lista kart RckikCard (nazwa, miasto, address snippet), badż dla każdego typu grupy z procentem, timestamp ostatniej aktualizacji, filtr/sort/search, liczba wyników.
- Kluczowe komponenty: SearchBar (debounce), FiltersPanel (mobile drawer), RckikList (virtualized dla >50), RckikCard, Pagination/LoadMore, Map toggle (opcjonalnie).
- UX/dostępność/bezpieczeństwo: Filtry synchronizowane z query params (shareable links), aria-labels dla filtrów, skeletons podczas ładowania, obsługa zero-results z sugestiami.

#### Szczegóły RCKiK
- Ścieżka: `/rckik/[id]`
- Główny cel: Prezentacja szczegółowych danych o centrum i trendów poziomów krwi.
- Kluczowe informacje: Nazwa, adres, status scrapera, lista badge'ów dla grup krwi z procentami, wykres trendu (ostatnie 30 dni), tabela snapshotów, przycisk dodaj do ulubionych, link do mapy/tras.
- Kluczowe komponenty: RckikHeader, BloodLevelChart (lazy-load client:visible), HistoryTable, ScraperStatus, FavoriteButton.
- UX/dostępność/bezpieczeństwo: Wykresy z aria-label, oznaczenia dodatkowe oprócz kolorów (ikony i tekst), fallback dla braku danych, cache ISR = 5 min.

### Strony autentykacji (SSR)

#### Logowanie
- Ścieżka: `/login`
- Główny cel: Uwierzytelnienie użytkownika.
- Kluczowe informacje: Formularz email + password, opcja "zapamiętaj mnie" (ostrożnie), linki do resetu hasła i rejestracji, rate-limit feedback.
- Kluczowe komponenty: LoginForm (react island client:load), Captcha (po próbach), RateLimitNotice, Toast.
- UX/dostępność/bezpieczeństwo: Focus management, ARIA dla błędów, blokada przy 5 nieudanych próbach (UI countdown), tokeny obsługiwane przez httpOnly cookie (zalecane).

#### Rejestracja (multi-step)
- Ścieżka: `/register`
- Główny cel: Zarejestrowanie nowego użytkownika i zebranie minimalnych danych + opcjonalne ulubione RCKiK.
- Kluczowe informacje: Krok 1: email, password, zgody; Krok 2: imię, nazwisko, grupa krwi; Krok 3: wybór ulubionych RCKiK (multi-select). ProgressBar na górze.
- Kluczowe komponenty: RegisterForm (multi-step), PasswordStrength, EmailUniquenessCheck (debounced), FavoritesPicker (map+list), SessionStorage draft.
- UX/dostępność/bezpieczeństwo: Hasło nie przechowywane w sessionStorage, inline validation, aria-live dla komunikatów walidacji, resend verification CTA po rejestracji.

#### Weryfikacja e-mail
- Ścieżka: `/verify-email`
- Główny cel: Obsługa tokenu weryfikacyjnego, komunikacja statusu.
- Kluczowe informacje: Loading → sukces/blad → redirect/CTA.
- Kluczowe komponenty: VerificationStatus (SSR), ResendButton.
- UX/dostępność/bezpieczeństwo: Brak leaków tokenów w URL history (redirect możliwy po przetworzeniu), jasne komunikaty o wygaśnięciu tokena.

#### Reset hasła
- Ścieżka: `/reset-password` (i `/reset-password/confirm?token=`)
- Główny cel: Umożliwić reset hasła z obsługą tokena.
- Kluczowe informacje: Request form, confirm form (password + confirm + strength), success message.
- Kluczowe komponenty: ResetRequestForm, ResetConfirmForm, PasswordRequirementsChecklist.
- UX/dostępność/bezpieczeństwo: Token expiry countdown, nieujawnianie istnienia konta przy request, walidacja silnego hasła.

### Chronione dashboardy (SSR + klient)

#### Dashboard główny
- Ścieżka: `/dashboard`
- Główny cel: Podsumowanie najważniejszych informacji dla użytkownika.
- Kluczowe informacje: Welcome, stats (total donations, total ml, streak), next eligible date countdown, top 3 favorites, mini-map krytycznych stanów, ostatnie powiadomienia, ostatnie donacje.
- Kluczowe komponenty: StatsCard, FavoritesWidget, NotificationsWidget (react island client:idle), MiniMap, RecentDonationsTimeline, QuickActions.
- UX/dostępność/bezpieczeństwo: Widgety dostępne klawiaturą, skeletony, kontrola widoczności akcji dla niezweryfikowanych użytkowników.

#### Profil
- Ścieżka: `/profile`
- Główny cel: Zarządzanie danymi osobowymi, preferencjami powiadomień i bezpieczeństwem konta.
- Kluczowe informacje: Dane osobowe (imię, nazwisko, grupa krwi), email (readonly), notification preferences, change password, GDPR actions (export, delete).
- Kluczowe komponenty: ProfileForm (auto-save debounce), NotificationPreferencesForm, PasswordChangeForm, GDPRTools.
- UX/dostępność/bezpieczeństwo: Confirm modals dla działań wrażliwych, aria-live dla success/error, wymaganie hasła do usunięcia konta.

#### Donacje
- Ścieżka: `/donations`
- Główny cel: Przegląd i zarządzanie historią donacji.
- Kluczowe informacje: Tabela/List (data, RCKiK, typ, ilość, status), filtry (date range, typ, centrum), add/edit modal, eksport CSV/JSON, statystyki header (total, total ml, last donation, next eligible).
- Kluczowe komponenty: DonationTable (sortable, virtualized), DonationForm (modal/slide-over), ExportDropdown, FiltersBar.
- UX/dostępność/bezpieczeństwo: Ochrona przed datami przyszłymi, walidacja odstępu 56 dni (warning), potwierdzenia przy usuwaniu.

#### Ulubione
- Ścieżka: `/favorites`
- Główny cel: Zarządzanie listą ulubionych RCKiK i priorytetami.
- Kluczowe informacje: Lista ulubionych z aktualnymi poziomami, drag-and-drop reordering, remove action, limit max (np. 10).
- Kluczowe komponenty: FavoritesList (dnd), FavoriteCard, SaveOrderButton (auto-save on drop), EmptyState.
- UX/dostępność/bezpieczeństwo: Rollback on API fail (optimistic updates), keyboard accessible reorder (alternatywa dla drag&drop).

#### Powiadomienia
- Ścieżka: `/notifications`
- Główny cel: Przegląd i zarządzanie powiadomieniami in-app.
- Kluczowe informacje: Tabs (All / Unread), powiadomienia z tytułem/treścią/timestamp, mark-as-read, link do akcji, grupowanie po dniu.
- Kluczowe komponenty: NotificationList, NotificationItem, Tabs, MarkAsReadButton.
- UX/dostępność/bezpieczeństwo: ARIA roles dla list, polling lub SSE/WS w przyszłości, opcja masowego oznaczania jako przeczytane.

### Panel admina (SSR z kontrolą roli)

#### Zarządzanie RCKiK
- Ścieżka: `/admin/rckik`
- Główny cel: CRUD dla centrów, manual override statusów.
- Kluczowe informacje: Tabela z centrami, filtry, formularz edycji/utworzenia, walidacja.
- Kluczowe komponenty: AdminTable, AdminForm, ConfirmModal, AuditTrail.
- UX/dostępność/bezpieczeństwo: Role-based UI (tylko ADMIN), audyt zmian, rate limits i throttle.

#### Scraper
- Ścieżka: `/admin/scraper`
- Główny cel: Monitorowanie i restart scrapera, przegląd logów.
- Kluczowe informacje: Status (OK/DEGRADED/FAILED), ostatnie runy, logi, przycisk restart.
- Kluczowe komponenty: ScraperStatus, LogViewer (paginated), AlertingPanel.
- UX/dostępność/bezpieczeństwo: Ograniczony dostęp, stream logs z paginacją.

#### Raporty
- Ścieżka: `/admin/reports`
- Główny cel: Zarządzanie raportami użytkowników i eksport danych.
- Kluczowe informacje: Lista raportów, szczegóły reportu, możliwość oznaczenia jako resolved.
- Kluczowe komponenty: ReportTable, ReportDetails, ExportTools.
- UX/dostępność/bezpieczeństwo: Immutable audit trail, dostęp admins only.

#### Ręczne wprowadzanie stanów krwi (US-028)
- Ścieżka: `/admin/blood-snapshots`
- Główny cel: Umożliwienie administratorowi ręcznego wprowadzania danych o stanach krwi dla RCKiK (w tym danych historycznych).
- Kluczowe informacje:
  - Formularz dodawania: wybór RCKiK (dropdown z wyszukiwaniem), data snapshotu (date picker z możliwością wyboru dat wstecznych), grupa krwi (select A+, A-, B+, B-, AB+, AB-, O+, O-), poziom procentowy (input 0-100% z walidacją).
  - Tabela snapshotów z filtrowaniem: kolumny (data, RCKiK, grupa krwi, poziom, źródło [manual/scraped], utworzone przez, timestamp), filtry (zakres dat, RCKiK, grupa krwi, źródło), sortowanie, paginacja.
  - Statystyki: liczba ręcznie wprowadzonych snapshotów dzisiaj/ten tydzień/ten miesiąc, ostatnio dodane snapshoty.
  - Toast notifications: sukces po zapisaniu, błędy walidacji, ostrzeżenie przy wprowadzaniu duplikatów (ta sama data + RCKiK + grupa krwi).
- Kluczowe komponenty:
  - ManualSnapshotForm (modal lub slide-over, React Hook Form + Zod),
  - BloodSnapshotTable (sortable, filterable),
  - RckikSearchSelect (typeahead dropdown),
  - DatePicker (z ograniczeniem: nie przyszłość),
  - BloodGroupSelect,
  - PercentageInput (0-100 z validacją),
  - SourceBadge (manual/scraped indicator),
  - StatsCards (mini dashboard z metrykami).
- UX/dostępność/bezpieczeństwo:
  - Walidacja inline: RCKiK exists and active, grupa krwi w dozwolonym zakresie, poziom 0-100%, data nie z przyszłości.
  - Confirm modal przy wprowadzaniu duplikatu (ta sama data + RCKiK + grupa krwi) z opcją kontynuowania lub anulowania.
  - Audit logging: każda operacja zapisywana w audit_log z userId, timestampem, szczegółami.
  - Keyboard accessible: focus management, ARIA labels, Enter to submit.
  - Oznaczenie "ręcznie wprowadzony" w tabeli i szczegółach RCKiK (badge + ikona).
  - Rate limiting feedback (max X snapshotów na godzinę).

#### Zarządzanie konfiguracją parserów (US-029, US-030)
- Ścieżka: `/admin/parsers`
- Główny cel: Zarządzanie konfiguracją parserów dla różnych centrów RCKiK i testowanie ich działania.
- Kluczowe informacje:
  - Lista konfiguracji parserów: tabela z kolumnami (RCKiK, parser type, source URL, status [active/inactive], last run status [success/failure], last run timestamp, actions [edit/test/delete]).
  - Formularz tworzenia/edycji konfiguracji: pola (wybór RCKiK, parser type [dropdown: rzeszow, warszawa, etc.], source URL [input z walidacją URL], selectors [JSON editor z syntax highlighting i validation], parser version [auto-generated lub input], is_active [toggle]).
  - Panel testowania (dry-run): przycisk "Test Parser" otwiera modal z:
    - Progress indicator (loading, parsowanie),
    - Preview wyników: tabela z wyekstraktowanymi danymi (grupa krwi, poziom),
    - Błędy parsowania (jeśli wystąpiły),
    - Opcja "Save to Database" lub "Discard" po udanym teście.
  - Historia zmian konfiguracji (audit trail): kto, kiedy, co zmienił (diff view).
  - Status parsowania: ostatni timestamp, success/failure rate (%), liczba błędów w ostatnim tygodniu.
- Kluczowe komponenty:
  - ParserConfigTable (sortable, filterable),
  - ParserConfigForm (modal, React Hook Form + Zod),
  - JsonEditor (Monaco Editor lub CodeMirror z syntax highlighting),
  - TestParserModal (dry-run interface),
  - ParseResultsPreview (tabela z wynikami testowania),
  - ParserStatusBadge (active/inactive, success/failure),
  - AuditTrailTimeline (historia zmian),
  - RckikSelect (dropdown z wyszukiwaniem),
  - UrlInput (z walidacją URL),
  - ToggleSwitch (active/inactive).
- UX/dostępność/bezpieczeństwo:
  - Walidacja JSON selectors: syntax check przed zapisem, podświetlanie błędów składni.
  - Walidacja URL: format check, opcjonalnie ping URL (check if accessible).
  - Dry-run testing: nie zapisuje do bazy, tylko pokazuje preview wyników.
  - Confirm modal przy dezaktywacji parsera (ostrzeżenie: scraping dla tego RCKiK będzie zatrzymane).
  - Audit logging: każda zmiana konfiguracji zapisywana w audit_log.
  - Role check: tylko ADMIN ma dostęp.
  - Loading states: skeleton dla tabeli, spinner dla test operation.
  - Error handling: toast notifications dla błędów API, friendly error messages przy błędach parsowania.
  - Breadcrumbs: Admin → Parsers → [Parser Config for RCKiK Name].

## 3. Mapa podróży użytkownika

Poniżej opisuję typowe scenariusze i krok po kroku główny przypadek użycia (Rejestracja → weryfikacja → dodanie ulubionego → obserwowanie powiadomień).

### Główny przypadek użycia — Nowy użytkownik (krok po kroku)
1. Użytkownik trafia na Landing `/` → czyta value proposition → klika CTA "Zarejestruj się".
2. Przeniesienie do `/register` (SSR) → krok 1 formularza (email, password, zgody). Walidacja inline; email uniqueness sprawdzane debounced.
3. Krok 2: dane osobowe; Krok 3 (opcjonalny): wybór ulubionych RCKiK (szybkie wyszukiwanie lub mapa + checkboxy). Draft zapisywany w sessionStorage (bez password).
4. Po submit rejestracji: redirect do `/verify-email-pending` z instrukcjami i CTA "Wyślij ponownie".
5. Użytkownik klika link w emailu: `/verify-email?token=` → SSR odpyta `GET /api/v1/auth/verify-email` → sukces → redirect do `/login?verified=true`.
6. Logowanie `/login` → po poprawnym logowaniu: otrzymanie sesji (httpOnly cookie) lub tokenów; fetch `GET /api/v1/users/me`.
7. Po zalogowaniu użytkownik widzi `/dashboard` ze statystykami i notyfikacjami. Może dodać ulubione, dodać donację, ustawić preferencje powiadomień.
8. Gdy poziom krwi w ulubionym centrum stanie się krytyczny → powiadomienie in-app i e-mail (zgodnie z preferencjami).

### Inne ścieżki
- Powracający użytkownik: `/login` → dashboard → donations/favorites/profile.
- Admin: `/login` (konto ADMIN) → `/admin/rckik` → edycja centra.
- Reset hasła: `/reset-password` → email link → `/reset-password/confirm?token=` → reset.

## 4. Układ i struktura nawigacji

Główne założenia:
- Navbar o zmiennej zawartości: dla publicznych stron (Home, Lista RCKiK, O aplikacji, Logowanie/Rejestracja), po zalogowaniu pokazuje: Dashboard, Szukaj centrum, Powiadomienia (icon + badge), Avatar z dropdown (Profil, Donacje, Ulubione, Wyloguj).
- Dashboard i panel admina używają sidebaru:
  - Dashboard sidebar: Dashboard, Moje ulubione, Donacje, Powiadomienia, Profil, Ustawienia.
  - Admin sidebar: RCKiK, Scraper, Raporty, Audyty.
- Mobile: hamburger menu dla publicznych linków; bottom navigation bar dla szybkich akcji po zalogowaniu (Dashboard, Szukaj, Dodaj donację, Ulubione, Profil).
- Breadcrumbs: na stronach szczegółowych `/rckik/[id]` i w panelu admina.
- Linki wewnętrzne i filtry synchronizowane z query string (shareable URLs): np. `/rckik?city=warszawa&status=critical`.

## 5. Kluczowe komponenty

Komponenty skategoryzowane wg Atomic Design i domeny:

### UI Primitives (components/ui/)
- Button — variants (primary, secondary, ghost), aria attributes, loading state.
- Input, Textarea, Select — accessible labels, error messages, helper text.
- Badge — semantic colors with icon fallback.
- Modal / SlideOver — focus trap, aria-modal, close with ESC.
- Toast — short messages (success/error/info/warning), aria-live.
- Skeleton — placeholder dla list i kart.

### Komponenty domenowe publiczne (components/rckik/)
- RckikCard — summary + badges + favorite button; keyboard actionable.
- RckikList — virtualized list + load more.
- BloodLevelBadge — color + icon + percent + accessible description.
- BloodLevelChart — line chart, threshold lines, aria labels.
- MapComponent — client:load island (Leaflet/Mapbox), clusters, popups.

### Komponenty chronione (components/dashboard/)
- StatsCard — key metrics, mini graphs.
- FavoritesWidget — top N favorites, quick actions.
- DonationTable & DonationForm — table with sorting, modal form.
- NotificationPanel — bell + dropdown (client:idle), mark as read.
- ProfileForm & NotificationPreferencesForm — debounced auto-save, confirmation.

### Komponenty admina (components/admin/)
- AdminTable — columns, filters, bulk actions.
- AdminForm — create/edit forms, audit trail.
- ScraperStatus & LogViewer — streaming/paginated logs.
- ManualSnapshotForm — formularz ręcznego wprowadzania snapshotów (US-028).
- BloodSnapshotTable — tabela snapshotów z filtrowaniem manual/scraped.
- RckikSearchSelect — typeahead dropdown do wyboru RCKiK.
- DatePicker — date picker z ograniczeniem (nie przyszłość).
- BloodGroupSelect — select dla grup krwi (A+, A-, B+, B-, AB+, AB-, O+, O-).
- PercentageInput — input z walidacją 0-100%.
- SourceBadge — badge oznaczający źródło (manual/scraped).
- ParserConfigTable — tabela konfiguracji parserów (US-029, US-030).
- ParserConfigForm — formularz tworzenia/edycji konfiguracji parsera.
- JsonEditor — edytor JSON z syntax highlighting (Monaco/CodeMirror).
- TestParserModal — modal do testowania parsera (dry-run).
- ParseResultsPreview — preview wyników parsowania.
- ParserStatusBadge — badge statusu parsera (active/inactive, success/failure).
- AuditTrailTimeline — timeline historii zmian konfiguracji.
- UrlInput — input z walidacją URL.

## 6. Zarządzanie stanem, bezpieczeństwo i dostępność (skrót)

Stan i auth:
- Redux Toolkit: `authSlice` (user, isAuthenticated, tokens/meta), `notificationsSlice`, `userPreferencesSlice`, `rckikSlice` (cache public data), `donationsSlice`.
- Persystencja: preferowane httpOnly cookie ustawione przez backend; jeśli MVP używa localStorage — użyć szyfrowania + krótki TTL i odświeżanie tokenu.
- Axios interceptors: dodawanie Authorization Bearer (gdzie konieczne), global error handling (401 → logout/refresh, 403 → toast), retry logic dla network errors.

Bezpieczeństwo frontendu:
- Nie logować PII do konsoli.
- CSP headers, sanitacja HTML (DOMPurify) jeśli konieczne.
- CSRF: preferuj httpOnly cookie + Origin/Referer checks; dla form SSR można użyć CSRF tokenów.
- Auto-logout po wygasłym tokenie z warning modalem.

Dostępność (WCAG 2.1 AA):
- Wszystkie komponenty z aria-labels, aria-live dla powiadomień błędów/sukcesów, keyboard navigation, widoczne focus states, kontrast kolorów, alternatywne ikony dla kolorów.

## 7. Mapowanie historyjek użytkownika z PRD na UI

Przykładowe mapowanie (pełna lista historyjek w PRD):
- Rejestracja multi-step → `RegisterForm` (kroki + progress bar) + `/verify-email-pending` → `/verify-email` handling.
- Logowanie + rate limit → `LoginForm` + `RateLimitNotice` + CAPTCHA.
- Wyświetlenie listy RCKiK → `RckikList` + `RckikCard` + `FiltersPanel`.
- Szczegóły centrum + wykresy → `Rckik/[id]` + `BloodLevelChart` + `HistoryTable`.
- Dodawanie do ulubionych → `FavoriteButton` (optimistic update) + `/favorites` page (dnd reorder).
- Dodawanie donacji → `DonationForm` modal + `DonationTable` z eksportem.
- Powiadomienia in-app → `NotificationBell` + `/notifications` page + preferences w `/profile`.
- Admin CRUD → `/admin/*` pages z `AdminTable` i `AdminForm`.

Każde user story wymaga przypisania endpointu API (patrz sekcja 1.2) i odpowiadających komponentów w sekcji 5.

## 8. Przypadki brzegowe i stany błędów (ważne)

- Brak danych historycznych dla RCKiK: pokaż informację i CTA "ZOBACZ INNE CENTRA".
- Token invalid/expired: w auth pages i interceptorach — redirect do `/login` z toastem; w flow reset hasła/verify — informacja o wygaśnięciu i opcja resend.
- Rate limit (429): toast z Retry-After countdown i blokada akcji.
- Sieć offline: banner "Jesteś offline" + tryb odczytu cache'owanych danych; wyłączenie akcji wymagających sieci.
- Błędy 500: pokazanie przyjaznego error page z opcją retry.
- Optimistic update fail: rollback i toast error z szczegółową instrukcją.
- Duża lista centrów (>50): użycie virtualized list i clustering na mapie.

## 9. Potencjalne punkty bólu użytkownika i rozwiązania UI

- Długi proces rejestracji → multi-step z zapisem draftu i jasnym postępem (progress bar). Opcjonalny skip wyboru ulubionych.
- Trudność w rozpoznaniu statusu krwi dla osób z daltonizmem → dodatkowe ikony i teksty obok kolorów.
- Wolne ładowanie map/wykresów → lazy-load komponentów (client:visible) i skeletony.
- Zbyt dużo powiadomień → preferencje powiadomień z częstotliwością i filtrowaniem.
- Problem z bezpieczeństwem tokenów w przeglądarce → rekomendacja httpOnly cookies; jeśli MVP używa localStorage — szyfrowanie + krótki TTL.

## 10. Wskazówki wdrożeniowe i dalsze kroki

- Implementacja minimalnego MVP: publiczne strony (SSG+ISR), auth SSR, dashboard skeleton + podstawowe slices Redux.
- Dodanie pełnej obsługi refresh tokenów i zabezpieczeń po stronie backendu (httpOnly cookies + SameSite).
- Testy: unit (Vitest), integration (RTL + MSW), E2E (Playwright/Cypress) dla kluczowych ścieżek (auth, donations, favorites).
- Monitoring performance: Lighthouse CI, Web Vitals, analiza bundle size.

---

## 11. Struktura katalogów komponentów i szablonów

### 11.1 Przegląd struktury projektu frontend

Projekt frontend wykorzystuje Astro z React islands dla interaktywnych komponentów. Struktura katalogów jest zorganizowana zgodnie z najlepszymi praktykami Astro i atomic design.

```
frontend/
├── public/                          # Pliki statyczne
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.jpg
│   │   └── icons/
│   ├── fonts/
│   └── favicon.ico
│
├── src/
│   ├── assets/                      # Asety procesowane przez Vite
│   │   ├── styles/
│   │   │   ├── global.css          # Style globalne
│   │   │   ├── variables.css       # CSS variables (kolory, spacing)
│   │   │   └── utilities.css       # Tailwind utilities
│   │   └── images/
│   │
│   ├── components/                  # Komponenty React i Astro
│   │   ├── ui/                     # Primitive UI components (atoms)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Radio.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── SlideOver.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── rckik/                  # Komponenty domenowe RCKiK (molecules/organisms)
│   │   │   ├── RckikCard.tsx       # Karta centrum krwi
│   │   │   ├── RckikList.tsx       # Lista centrów (virtualized)
│   │   │   ├── RckikHeader.tsx     # Nagłówek szczegółów centrum
│   │   │   ├── BloodLevelBadge.tsx # Badge dla poziomu krwi
│   │   │   ├── BloodLevelChart.tsx # Wykres trendu (client:visible)
│   │   │   ├── HistoryTable.tsx    # Tabela snapshotów
│   │   │   ├── ScraperStatus.tsx   # Status scrapera
│   │   │   ├── FavoriteButton.tsx  # Przycisk dodaj/usuń z ulubionych
│   │   │   ├── MapComponent.tsx    # Mapa z markerami (Leaflet/Mapbox)
│   │   │   ├── FiltersPanel.tsx    # Panel filtrów (drawer na mobile)
│   │   │   └── SearchBar.tsx       # Wyszukiwarka z debounce
│   │   │
│   │   ├── auth/                   # Komponenty autentykacji
│   │   │   ├── LoginForm.tsx       # Formularz logowania (client:load)
│   │   │   ├── RegisterForm.tsx    # Multi-step rejestracja
│   │   │   ├── VerificationStatus.tsx
│   │   │   ├── ResetRequestForm.tsx
│   │   │   ├── ResetConfirmForm.tsx
│   │   │   ├── PasswordStrength.tsx
│   │   │   ├── PasswordRequirementsChecklist.tsx
│   │   │   ├── EmailUniquenessCheck.tsx
│   │   │   ├── FavoritesPicker.tsx # Wybór ulubionych przy rejestracji
│   │   │   └── RateLimitNotice.tsx
│   │   │
│   │   ├── dashboard/              # Komponenty dashboard (protected)
│   │   │   ├── StatsCard.tsx       # Karta statystyk
│   │   │   ├── FavoritesWidget.tsx # Widget ulubionych
│   │   │   ├── NotificationsWidget.tsx # Widget powiadomień (client:idle)
│   │   │   ├── MiniMap.tsx         # Mini mapa krytycznych stanów
│   │   │   ├── RecentDonationsTimeline.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── DonationTable.tsx   # Tabela donacji (sortable)
│   │   │   ├── DonationForm.tsx    # Formularz donacji (modal)
│   │   │   ├── ExportDropdown.tsx
│   │   │   ├── FavoritesList.tsx   # Lista ulubionych (dnd)
│   │   │   ├── FavoriteCard.tsx
│   │   │   ├── NotificationList.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   ├── NotificationBell.tsx # Bell icon z badge
│   │   │   ├── ProfileForm.tsx     # Edycja profilu (auto-save)
│   │   │   ├── NotificationPreferencesForm.tsx
│   │   │   ├── PasswordChangeForm.tsx
│   │   │   └── GDPRTools.tsx       # Export/Delete data
│   │   │
│   │   ├── admin/                  # Komponenty admina
│   │   │   ├── AdminTable.tsx      # Uniwersalna tabela admin
│   │   │   ├── AdminForm.tsx       # Uniwersalny formularz CRUD
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── AuditTrail.tsx
│   │   │   ├── ScraperStatusPanel.tsx
│   │   │   ├── LogViewer.tsx       # Paginated logs
│   │   │   ├── AlertingPanel.tsx
│   │   │   ├── ReportTable.tsx
│   │   │   ├── ReportDetails.tsx
│   │   │   ├── ExportTools.tsx
│   │   │   ├── ManualSnapshotForm.tsx  # Formularz ręcznego wprowadzania (US-028)
│   │   │   ├── BloodSnapshotTable.tsx  # Tabela snapshotów z filtrowaniem
│   │   │   ├── RckikSearchSelect.tsx   # Typeahead dropdown RCKiK
│   │   │   ├── DatePicker.tsx          # Date picker z ograniczeniem
│   │   │   ├── BloodGroupSelect.tsx    # Select grup krwi
│   │   │   ├── PercentageInput.tsx     # Input 0-100%
│   │   │   ├── SourceBadge.tsx         # Badge manual/scraped
│   │   │   ├── ParserConfigTable.tsx   # Tabela konfiguracji parserów (US-029, US-030)
│   │   │   ├── ParserConfigForm.tsx    # Formularz config parsera
│   │   │   ├── JsonEditor.tsx          # JSON editor z syntax highlighting
│   │   │   ├── TestParserModal.tsx     # Modal dry-run testowania
│   │   │   ├── ParseResultsPreview.tsx # Preview wyników parsowania
│   │   │   ├── ParserStatusBadge.tsx   # Badge statusu parsera
│   │   │   ├── AuditTrailTimeline.tsx  # Timeline historii zmian
│   │   │   └── UrlInput.tsx            # Input z walidacją URL
│   │   │
│   │   ├── common/                 # Wspólne komponenty
│   │   │   ├── Navbar.astro        # Główna nawigacja
│   │   │   ├── Footer.astro
│   │   │   ├── Sidebar.astro       # Sidebar dla dashboard/admin
│   │   │   ├── MobileNav.astro     # Mobile hamburger menu
│   │   │   ├── Breadcrumbs.astro
│   │   │   ├── Hero.astro          # Landing page hero
│   │   │   ├── FeaturesList.astro
│   │   │   ├── Testimonials.astro
│   │   │   ├── CTAButton.astro
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   └── forms/                  # Komponenty formularzy (reusable)
│   │       ├── FormField.tsx       # Wrapper dla input z label/error
│   │       ├── FormGroup.tsx
│   │       ├── FormError.tsx
│   │       ├── FormHelper.tsx
│   │       └── MultiStepForm.tsx   # Wrapper dla multi-step
│   │
│   ├── layouts/                     # Layouty Astro
│   │   ├── BaseLayout.astro        # Podstawowy layout (public)
│   │   ├── AuthLayout.astro        # Layout dla stron auth
│   │   ├── DashboardLayout.astro   # Layout dla dashboard
│   │   └── AdminLayout.astro       # Layout dla panelu admina
│   │
│   ├── pages/                       # Strony Astro (file-based routing)
│   │   ├── index.astro             # Landing page (SSG)
│   │   │
│   │   ├── rckik/
│   │   │   ├── index.astro         # Lista RCKiK (SSG + ISR 5min)
│   │   │   └── [id].astro          # Szczegóły RCKiK (SSG + ISR 5min)
│   │   │
│   │   ├── login.astro             # Logowanie (SSR)
│   │   ├── register.astro          # Rejestracja (SSR)
│   │   ├── verify-email.astro      # Weryfikacja email (SSR)
│   │   ├── verify-email-pending.astro
│   │   ├── reset-password.astro    # Request reset (SSR)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── index.astro         # Dashboard główny (SSR + auth)
│   │   │   ├── profile.astro       # Profil użytkownika
│   │   │   ├── donations.astro     # Lista donacji
│   │   │   ├── favorites.astro     # Ulubione
│   │   │   └── notifications.astro # Powiadomienia in-app
│   │   │
│   │   └── admin/
│   │       ├── rckik.astro         # Zarządzanie RCKiK
│   │       ├── scraper.astro       # Monitoring scrapera
│   │       ├── reports.astro       # Raporty użytkowników
│   │       ├── blood-snapshots.astro  # Ręczne wprowadzanie stanów krwi (US-028)
│   │       └── parsers.astro       # Zarządzanie konfiguracją parserów (US-029, US-030)
│   │
│   ├── lib/                         # Biblioteki i utilities
│   │   ├── api/                    # API client
│   │   │   ├── client.ts           # Axios instance z interceptorami
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.ts         # Auth endpoints
│   │   │   │   ├── users.ts        # User endpoints
│   │   │   │   ├── rckik.ts        # RCKiK endpoints
│   │   │   │   ├── donations.ts
│   │   │   │   ├── favorites.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── admin.ts
│   │   │   │   ├── adminBloodSnapshots.ts  # US-028 endpoints
│   │   │   │   └── adminParsers.ts         # US-029, US-030 endpoints
│   │   │   └── types.ts            # API types
│   │   │
│   │   ├── store/                  # Redux Toolkit store
│   │   │   ├── index.ts            # Store configuration
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts    # Auth state
│   │   │   │   ├── userSlice.ts    # User profile
│   │   │   │   ├── rckikSlice.ts   # RCKiK cache
│   │   │   │   ├── donationsSlice.ts
│   │   │   │   ├── favoritesSlice.ts
│   │   │   │   ├── notificationsSlice.ts
│   │   │   │   └── preferencesSlice.ts
│   │   │   └── middleware/
│   │   │       ├── authMiddleware.ts
│   │   │       └── errorMiddleware.ts
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts          # Auth hook
│   │   │   ├── useApi.ts           # API call hook
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useInfiniteScroll.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useToast.ts
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── validation.ts       # Zod schemas
│   │   │   ├── formatting.ts       # Date/number formatters
│   │   │   ├── bloodLevels.ts      # Blood level calculations
│   │   │   ├── auth.ts             # Auth helpers (token, roles)
│   │   │   ├── storage.ts          # LocalStorage/SessionStorage helpers
│   │   │   ├── sanitize.ts         # DOMPurify wrapper
│   │   │   └── constants.ts        # App constants
│   │   │
│   │   └── types/                  # TypeScript types
│   │       ├── index.ts
│   │       ├── api.ts              # API response types
│   │       ├── models.ts           # Domain models
│   │       └── forms.ts            # Form types
│   │
│   ├── middleware/                  # Astro middleware
│   │   └── auth.ts                 # Auth middleware (SSR)
│   │
│   ├── env.d.ts                    # Environment types
│   └── config.ts                   # App configuration
│
├── tests/                           # Testy
│   ├── unit/                       # Unit tests (Vitest)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   ├── integration/                # Integration tests (RTL + MSW)
│   │   ├── auth.test.tsx
│   │   ├── donations.test.tsx
│   │   └── rckik.test.tsx
│   │
│   └── e2e/                        # End-to-end tests (Playwright)
│       ├── auth.spec.ts
│       ├── donations.spec.ts
│       └── admin.spec.ts
│
├── .vscode/                         # VSCode settings
├── astro.config.mjs                # Astro configuration
├── tsconfig.json                   # TypeScript config
├── tailwind.config.cjs             # Tailwind config
├── package.json
├── .env.example
└── README.md
```

### 11.2 Konwencje nazewnictwa

**Komponenty:**
- React komponenty: `PascalCase.tsx` (np. `RckikCard.tsx`)
- Astro komponenty: `PascalCase.astro` (np. `BaseLayout.astro`)
- Pliki utils: `camelCase.ts` (np. `bloodLevels.ts`)

**Strony:**
- File-based routing Astro: `kebab-case.astro` (np. `verify-email.astro`)
- Dynamic routes: `[param].astro` (np. `[id].astro`)

**Style:**
- Tailwind utility classes jako default
- CSS Modules dla custom styles: `Component.module.css`

**Typy:**
- Interfejsy: prefix `I` (np. `IUser`)
- Types: bez prefiksu (np. `UserRole`)
- Enums: `PascalCase` (np. `BloodGroup`)

### 11.3 Strategia hydratacji komponentów React

Zgodnie z Astro Islands architecture:

```typescript
// client:load - Natychmiastowa hydratacja (krytyczne interaktywne komponenty)
<LoginForm client:load />
<RegisterForm client:load />

// client:idle - Hydratacja gdy przeglądarka jest bezczynna
<NotificationsWidget client:idle />
<DonationTable client:idle />

// client:visible - Hydratacja gdy komponent wchodzi w viewport
<BloodLevelChart client:visible />
<MapComponent client:visible />

// client:media - Warunkowa hydratacja (responsywność)
<MobileNav client:media="(max-width: 768px)" />

// client:only - Render tylko po stronie klienta (no SSR)
<RealTimeNotifications client:only="react" />
```

### 11.4 Organizacja Redux Store

```typescript
// src/lib/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import rckikReducer from './slices/rckikSlice';
import donationsReducer from './slices/donationsSlice';
import favoritesReducer from './slices/favoritesSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    rckik: rckikReducer,
    donations: donationsReducer,
    favorites: favoritesReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authMiddleware, errorMiddleware),
});
```

### 11.5 Axios Client Configuration

```typescript
// src/lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodaj token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - try refresh or logout
    }
    if (error.response?.status === 429) {
      // Rate limit - show toast with retry-after
    }
    return Promise.reject(error);
  }
);
```

---

## 12. Checklista z priorytetami do sprintu (MVP vs Backlog)

### 12.1 Sprint 0: Inicjalizacja projektu i setup (Week 0)

**Priority: P0 (Blocker)**

- [ ] **ENV-001**: Setup repozytorium frontend (Astro init)
- [ ] **ENV-002**: Konfiguracja TypeScript, ESLint, Prettier
- [ ] **ENV-003**: Setup Tailwind CSS
- [ ] **ENV-004**: Konfiguracja Redux Toolkit
- [ ] **ENV-005**: Setup Axios client z interceptorami
- [ ] **ENV-006**: Konfiguracja environment variables (.env)
- [ ] **ENV-007**: Setup testing (Vitest, RTL, Playwright)
- [ ] **ENV-008**: Konfiguracja CI/CD (GitHub Actions / Cloud Build)
- [ ] **ENV-009**: Setup MSW (Mock Service Worker) dla dev
- [ ] **ENV-010**: Struktura katalogów zgodnie z sekcją 11.1

**Acceptance Criteria:**
- Projekt startuje lokalnie (`npm run dev`)
- TypeScript działa bez błędów
- Testy jednostkowe uruchamiają się (`npm run test`)

---

### 12.2 Sprint 1: Publiczne strony + Core UI Components (Week 1-2)

**Priority: P0 (MVP - Critical Path)**

#### UI Primitives (components/ui/)
- [ ] **UI-001**: Button component (variants, states, accessibility)
- [ ] **UI-002**: Input, Textarea, Select components
- [ ] **UI-003**: Badge component (blood levels)
- [ ] **UI-004**: Card component
- [ ] **UI-005**: Modal component (focus trap, ESC)
- [ ] **UI-006**: Toast/Alert component (aria-live)
- [ ] **UI-007**: Skeleton loaders
- [ ] **UI-008**: Spinner component

#### Layouts
- [ ] **LAY-001**: BaseLayout.astro (public pages)
- [ ] **LAY-002**: Navbar.astro (public variant)
- [ ] **LAY-003**: Footer.astro

#### Landing Page (/)
- [ ] **LP-001**: Hero section z CTA
- [ ] **LP-002**: Features list
- [ ] **LP-003**: Testimonials section (opcjonalnie)
- [ ] **LP-004**: Footer z linkami
- [ ] **LP-005**: SEO meta tags
- [ ] **LP-006**: Mobile responsive design

#### Lista RCKiK (/rckik)
- [ ] **RCKIK-001**: RckikCard component (SSG)
- [ ] **RCKIK-002**: RckikList component (virtualized dla >50 items)
- [ ] **RCKIK-003**: SearchBar z debounce (client:load)
- [ ] **RCKIK-004**: FiltersPanel (mobile drawer)
- [ ] **RCKIK-005**: BloodLevelBadge z accessibility (ikony + kolory)
- [ ] **RCKIK-006**: Pagination/LoadMore
- [ ] **RCKIK-007**: Empty state i skeletony
- [ ] **RCKIK-008**: ISR config (revalidate: 5 min)
- [ ] **RCKIK-009**: Query params sync (shareable URLs)

#### Szczegóły RCKiK (/rckik/[id])
- [ ] **RCKIK-010**: RckikHeader component
- [ ] **RCKIK-011**: BloodLevelChart (lazy-load client:visible, Recharts)
- [ ] **RCKIK-012**: HistoryTable component
- [ ] **RCKIK-013**: ScraperStatus component
- [ ] **RCKIK-014**: FavoriteButton (optimistic update - wymaga auth)
- [ ] **RCKIK-015**: Breadcrumbs navigation
- [ ] **RCKIK-016**: ISR config (revalidate: 5 min)

**Acceptance Criteria:**
- Publiczne strony działają bez JavaScript (SSG)
- Interaktywne komponenty hydratują się poprawnie
- Mobile responsive (tested on 375px+)
- Lighthouse score: Performance >90, Accessibility >95
- ISR cache działa (5 min revalidation)

---

### 12.3 Sprint 2: Autentykacja i Auth Pages (Week 2-3)

**Priority: P0 (MVP - Blocker dla protected routes)**

#### Auth Infrastructure
- [ ] **AUTH-001**: authSlice Redux (user, tokens, isAuthenticated)
- [ ] **AUTH-002**: Axios interceptor dla 401/403
- [ ] **AUTH-003**: Auth middleware Astro (protected routes)
- [ ] **AUTH-004**: Token refresh logic
- [ ] **AUTH-005**: Auto-logout na token expiry

#### Rejestracja (/register)
- [ ] **REG-001**: RegisterForm multi-step (3 kroki)
- [ ] **REG-002**: Krok 1: email, password, zgody (US-001)
- [ ] **REG-003**: PasswordStrength component
- [ ] **REG-004**: EmailUniquenessCheck (debounced)
- [ ] **REG-005**: Krok 2: imię, nazwisko, grupa krwi
- [ ] **REG-006**: Krok 3: FavoritesPicker (opcjonalny)
- [ ] **REG-007**: ProgressBar dla kroków
- [ ] **REG-008**: SessionStorage draft (bez hasła)
- [ ] **REG-009**: Zod validation schemas
- [ ] **REG-010**: Rate limiting UI feedback
- [ ] **REG-011**: AuthLayout.astro

#### Logowanie (/login)
- [ ] **LOGIN-001**: LoginForm component (client:load)
- [ ] **LOGIN-002**: Email + password fields
- [ ] **LOGIN-003**: Rate limit notice (5 attempts → 5 min lockout)
- [ ] **LOGIN-004**: CAPTCHA po 3 próbach (reCAPTCHA v3)
- [ ] **LOGIN-005**: "Zapamiętaj mnie" checkbox
- [ ] **LOGIN-006**: Linki do reset hasła i rejestracji
- [ ] **LOGIN-007**: Obsługa 401/403 errors
- [ ] **LOGIN-008**: Redirect do /dashboard po logowaniu

#### Weryfikacja email (/verify-email)
- [ ] **VER-001**: VerificationStatus component (US-002)
- [ ] **VER-002**: Loading → success/error states
- [ ] **VER-003**: ResendButton component
- [ ] **VER-004**: Redirect po weryfikacji
- [ ] **VER-005**: Token expiry handling

#### Reset hasła (/reset-password)
- [ ] **RESET-001**: ResetRequestForm (US-004)
- [ ] **RESET-002**: ResetConfirmForm (/reset-password/confirm?token=)
- [ ] **RESET-003**: PasswordRequirementsChecklist
- [ ] **RESET-004**: Token validation
- [ ] **RESET-005**: Success message i redirect

**Acceptance Criteria:**
- Użytkownik może się zarejestrować end-to-end (US-001)
- Email verification działa (US-002)
- Logowanie z rate limiting (US-003)
- Reset hasła flow kompletny (US-004)
- Wszystkie formularze z accessibility (keyboard nav, ARIA)
- Walidacja inline z Zod + React Hook Form

---

### 12.4 Sprint 3: Dashboard i Protected Routes (Week 3-4)

**Priority: P0 (MVP - Core Features)**

#### Dashboard Layout
- [ ] **DASH-LAY-001**: DashboardLayout.astro
- [ ] **DASH-LAY-002**: Sidebar.astro (desktop)
- [ ] **DASH-LAY-003**: MobileNav.astro (bottom nav)
- [ ] **DASH-LAY-004**: Navbar dla zalogowanych (avatar, dropdown)
- [ ] **DASH-LAY-005**: NotificationBell z badge

#### Dashboard główny (/dashboard)
- [ ] **DASH-001**: StatsCard component (donations, ml, streak)
- [ ] **DASH-002**: FavoritesWidget (top 3, quick links)
- [ ] **DASH-003**: NotificationsWidget (client:idle)
- [ ] **DASH-004**: RecentDonationsTimeline
- [ ] **DASH-005**: QuickActions panel
- [ ] **DASH-006**: Fetch GET /api/v1/users/me
- [ ] **DASH-007**: Skeleton loaders dla async data

#### Profil (/dashboard/profile)
- [ ] **PROF-001**: ProfileForm (auto-save debounce, US-005)
- [ ] **PROF-002**: NotificationPreferencesForm (US-006)
- [ ] **PROF-003**: PasswordChangeForm
- [ ] **PROF-004**: GDPRTools (export, delete account, US-016)
- [ ] **PROF-005**: Confirm modals dla wrażliwych akcji
- [ ] **PROF-006**: Toast notifications dla success/error

#### Donacje (/dashboard/donations)
- [ ] **DON-001**: DonationTable component (sortable, US-012)
- [ ] **DON-002**: DonationForm modal (add/edit, US-012, US-013)
- [ ] **DON-003**: ExportDropdown (CSV/JSON, US-014)
- [ ] **DON-004**: FiltersBar (date range, RCKiK)
- [ ] **DON-005**: Statistics header (total, ml, last, next eligible)
- [ ] **DON-006**: Pagination
- [ ] **DON-007**: Delete confirmation modal (US-013)
- [ ] **DON-008**: donationsSlice Redux

#### Ulubione (/dashboard/favorites)
- [ ] **FAV-001**: FavoritesList component (drag-and-drop, US-009)
- [ ] **FAV-002**: FavoriteCard z aktualnymi poziomami
- [ ] **FAV-003**: Remove action z confirm
- [ ] **FAV-004**: SaveOrderButton (auto-save on drop)
- [ ] **FAV-005**: EmptyState
- [ ] **FAV-006**: Optimistic updates z rollback
- [ ] **FAV-007**: Keyboard accessible reorder
- [ ] **FAV-008**: favoritesSlice Redux

#### Powiadomienia (/dashboard/notifications)
- [ ] **NOTIF-001**: NotificationList component (US-011)
- [ ] **NOTIF-002**: NotificationItem component
- [ ] **NOTIF-003**: Tabs (All / Unread)
- [ ] **NOTIF-004**: Mark-as-read button
- [ ] **NOTIF-005**: Grupowanie po dniu
- [ ] **NOTIF-006**: Link do akcji
- [ ] **NOTIF-007**: Polling lub SSE (MVP: polling co 30s)
- [ ] **NOTIF-008**: notificationsSlice Redux

**Acceptance Criteria:**
- Dashboard wyświetla dane użytkownika (US-005)
- Donacje: CRUD operations działa (US-012, US-013)
- Export donacji do CSV/JSON (US-014)
- Ulubione: dodawanie, usuwanie, reordering (US-009)
- Powiadomienia in-app widoczne (US-011)
- Wszystkie chronione routes wymagają auth
- Mobile responsive (bottom nav)

---

### 12.5 Sprint 4: Admin Panel (Week 4-5)

**Priority: P1 (MVP - Admin Operations)**

#### Admin Layout
- [ ] **ADM-LAY-001**: AdminLayout.astro (role check)
- [ ] **ADM-LAY-002**: Admin sidebar
- [ ] **ADM-LAY-003**: Role-based route guards

#### Zarządzanie RCKiK (/admin/rckik)
- [ ] **ADM-RCKIK-001**: AdminTable component (US-019)
- [ ] **ADM-RCKIK-002**: AdminForm (create/edit RCKiK)
- [ ] **ADM-RCKIK-003**: ConfirmModal dla delete
- [ ] **ADM-RCKIK-004**: AuditTrail display
- [ ] **ADM-RCKIK-005**: Filtry i search
- [ ] **ADM-RCKIK-006**: Pagination

#### Scraper Monitoring (/admin/scraper)
- [ ] **ADM-SCR-001**: ScraperStatusPanel (US-017, US-018)
- [ ] **ADM-SCR-002**: LogViewer (paginated)
- [ ] **ADM-SCR-003**: Manual trigger button
- [ ] **ADM-SCR-004**: AlertingPanel
- [ ] **ADM-SCR-005**: Status polling (auto-refresh)

#### Raporty (/admin/reports)
- [ ] **ADM-REP-001**: ReportTable (US-021)
- [ ] **ADM-REP-002**: ReportDetails modal
- [ ] **ADM-REP-003**: Status update form
- [ ] **ADM-REP-004**: ExportTools dla raportów

**Acceptance Criteria:**
- Admin może zarządzać RCKiK (CRUD, US-019)
- Scraper monitoring działa (US-017, US-018)
- Raporty użytkowników widoczne (US-021)
- Tylko role=ADMIN ma dostęp
- Audit logs dla krytycznych akcji (US-024)

---

### 12.6 Sprint 5: Polishing, Accessibility, Testing (Week 5-6)

**Priority: P0 (MVP Quality Gates)**

#### Accessibility (WCAG 2.1 AA)
- [ ] **A11Y-001**: Semantic HTML (h1-h6 hierarchy)
- [ ] **A11Y-002**: Alt text dla obrazów
- [ ] **A11Y-003**: ARIA labels dla interaktywnych komponentów
- [ ] **A11Y-004**: Keyboard navigation dla wszystkich akcji
- [ ] **A11Y-005**: Focus states widoczne
- [ ] **A11Y-006**: Kontrast kolorów (min 4.5:1)
- [ ] **A11Y-007**: Ikony + tekst dla blood levels (nie tylko kolory)
- [ ] **A11Y-008**: aria-live dla toastów i błędów
- [ ] **A11Y-009**: Screen reader testing
- [ ] **A11Y-010**: axe DevTools audit (0 critical issues)

#### Performance
- [ ] **PERF-001**: Lazy loading dla obrazów
- [ ] **PERF-002**: Code splitting per route
- [ ] **PERF-003**: Virtualized lists (>50 items)
- [ ] **PERF-004**: Debounce dla search/filters
- [ ] **PERF-005**: Optimistic updates
- [ ] **PERF-006**: ISR cache dla publicznych stron
- [ ] **PERF-007**: Bundle size analysis (<500KB initial)
- [ ] **PERF-008**: Lighthouse audit (Performance >90)

#### Security
- [ ] **SEC-001**: CSP headers
- [ ] **SEC-002**: DOMPurify dla user-generated content
- [ ] **SEC-003**: XSS prevention (escaped output)
- [ ] **SEC-004**: CSRF tokens (jeśli cookies)
- [ ] **SEC-005**: Rate limiting UI feedback
- [ ] **SEC-006**: Secure token storage (httpOnly cookies preferred)
- [ ] **SEC-007**: No PII w console.log
- [ ] **SEC-008**: HTTPS enforcement

#### Testing
- [ ] **TEST-001**: Unit tests dla utils (80% coverage)
- [ ] **TEST-002**: Component tests dla UI primitives
- [ ] **TEST-003**: Integration tests dla auth flow
- [ ] **TEST-004**: Integration tests dla donations CRUD
- [ ] **TEST-005**: E2E test: rejestracja → weryfikacja → login
- [ ] **TEST-006**: E2E test: dodanie donacji
- [ ] **TEST-007**: E2E test: admin CRUD RCKiK
- [ ] **TEST-008**: MSW mocks dla wszystkich endpoints

#### Edge Cases
- [ ] **EDGE-001**: Brak danych historycznych dla RCKiK
- [ ] **EDGE-002**: Token expired handling
- [ ] **EDGE-003**: Rate limit (429) handling
- [ ] **EDGE-004**: Offline mode banner
- [ ] **EDGE-005**: Błędy 500 → friendly error page
- [ ] **EDGE-006**: Optimistic update rollback
- [ ] **EDGE-007**: Zero results w wyszukiwaniu
- [ ] **EDGE-008**: Empty states dla list

**Acceptance Criteria:**
- WCAG 2.1 AA compliance (axe audit passed)
- Lighthouse: Performance >90, Accessibility >95, Best Practices >90
- Security audit passed (OWASP Top 10)
- E2E tests passed dla kluczowych ścieżek
- Wszystkie edge cases obsłużone z UX

---

### 12.6 Sprint 6: Nowe funkcjonalności admina - Manual Data Entry & Parsers (Week 6-7)

**Priority: P1 (High - Extended Admin Features)**

#### Ręczne wprowadzanie stanów krwi (US-028)
- [ ] **MANUAL-001**: Strona /admin/blood-snapshots.astro
- [ ] **MANUAL-002**: ManualSnapshotForm component (modal/slide-over)
- [ ] **MANUAL-003**: RckikSearchSelect (typeahead dropdown)
- [ ] **MANUAL-004**: DatePicker component (z ograniczeniem: nie przyszłość)
- [ ] **MANUAL-005**: BloodGroupSelect component (A+, A-, B+, B-, AB+, AB-, O+, O-)
- [ ] **MANUAL-006**: PercentageInput component (0-100% z walidacją)
- [ ] **MANUAL-007**: BloodSnapshotTable (sortable, filterable)
- [ ] **MANUAL-008**: SourceBadge component (manual/scraped indicator)
- [ ] **MANUAL-009**: Filtry: zakres dat, RCKiK, grupa krwi, źródło (manual/scraped)
- [ ] **MANUAL-010**: StatsCards (snapshoty dzisiaj/tydzień/miesiąc)
- [ ] **MANUAL-011**: Zod validation schema dla ManualSnapshotForm
- [ ] **MANUAL-012**: API endpoint: POST /api/v1/admin/blood-snapshots
- [ ] **MANUAL-013**: API endpoint: GET /api/v1/admin/blood-snapshots (z filtrowaniem)
- [ ] **MANUAL-014**: Walidacja inline (RCKiK exists, grupa krwi valid, poziom 0-100%, data nie przyszłość)
- [ ] **MANUAL-015**: Confirm modal przy duplikacie (ta sama data + RCKiK + grupa krwi)
- [ ] **MANUAL-016**: Audit logging dla operacji CREATE
- [ ] **MANUAL-017**: Toast notifications (sukces/błędy)
- [ ] **MANUAL-018**: Obsługa rate limiting (max X snapshotów/godzinę)
- [ ] **MANUAL-019**: Oznaczenie "ręcznie wprowadzony" w UI (badge + ikona)
- [ ] **MANUAL-020**: Keyboard navigation i ARIA labels

#### Zarządzanie konfiguracją parserów (US-029, US-030)
- [ ] **PARSER-001**: Strona /admin/parsers.astro
- [ ] **PARSER-002**: ParserConfigTable component (sortable, filterable)
- [ ] **PARSER-003**: ParserConfigForm component (create/edit modal)
- [ ] **PARSER-004**: JsonEditor component (Monaco Editor lub CodeMirror)
- [ ] **PARSER-005**: RckikSelect dropdown (dla wyboru RCKiK)
- [ ] **PARSER-006**: Parser type dropdown (rzeszow, warszawa, etc.)
- [ ] **PARSER-007**: UrlInput component (z walidacją URL)
- [ ] **PARSER-008**: ToggleSwitch component (active/inactive)
- [ ] **PARSER-009**: TestParserModal component (dry-run interface)
- [ ] **PARSER-010**: ParseResultsPreview component (tabela wyników)
- [ ] **PARSER-011**: ParserStatusBadge component (active/inactive, success/failure)
- [ ] **PARSER-012**: AuditTrailTimeline component (historia zmian)
- [ ] **PARSER-013**: Zod validation schema dla ParserConfigForm
- [ ] **PARSER-014**: API endpoint: GET /api/v1/admin/parsers/configs
- [ ] **PARSER-015**: API endpoint: POST /api/v1/admin/parsers/configs
- [ ] **PARSER-016**: API endpoint: PUT /api/v1/admin/parsers/configs/{id}
- [ ] **PARSER-017**: API endpoint: POST /api/v1/admin/parsers/configs/{id}/test (dry-run)
- [ ] **PARSER-018**: Walidacja JSON selectors (syntax check, highlighting errors)
- [ ] **PARSER-019**: Walidacja URL (format check, optional ping)
- [ ] **PARSER-020**: Dry-run testing logic (nie zapisuje do bazy, tylko preview)
- [ ] **PARSER-021**: Confirm modal przy dezaktywacji parsera
- [ ] **PARSER-022**: Audit logging dla zmian konfiguracji
- [ ] **PARSER-023**: Loading states (skeleton, spinner dla test)
- [ ] **PARSER-024**: Error handling (toast notifications, friendly error messages)
- [ ] **PARSER-025**: Breadcrumbs (Admin → Parsers → [Parser Config])
- [ ] **PARSER-026**: Status parsowania display (last run, success rate, błędy)
- [ ] **PARSER-027**: Diff view dla historii zmian konfiguracji

#### Integracja z istniejącym UI
- [ ] **INT-001**: Dodanie linków do sidebara admina (Blood Snapshots, Parsers)
- [ ] **INT-002**: Aktualizacja szczegółów RCKiK (/rckik/[id]) - badge "manual" dla ręcznych snapshotów
- [ ] **INT-003**: Aktualizacja AdminLayout.astro (nowe menu items)
- [ ] **INT-004**: Aktualizacja routing guards (role check dla nowych stron)
- [ ] **INT-005**: E2E tests dla ręcznego wprowadzania snapshotów
- [ ] **INT-006**: E2E tests dla zarządzania konfiguracją parserów
- [ ] **INT-007**: Integration tests dla dry-run testowania

**Acceptance Criteria:**
- Admin może ręcznie wprowadzać snapshoty krwi (US-028)
- Admin może dodawać snapshoty z datami wstecznymi
- Wszystkie snapshoty są walidowane i oznaczane flagą is_manual
- Audit log zapisuje wszystkie operacje ręcznego wprowadzania
- Admin może zarządzać konfiguracją parserów (US-029, US-030)
- JSON editor działa z syntax highlighting i walidacją
- Dry-run testing parserów działa bez zapisu do bazy
- Audit log zapisuje zmiany konfiguracji parserów
- Tylko role=ADMIN ma dostęp do nowych stron
- Mobile responsive design
- Accessibility (WCAG 2.1 AA compliance)
- E2E tests passed dla kluczowych scenariuszy

---

### 12.7 Backlog (Post-MVP Features)

**Priority: P2 (Nice to Have - Future Iterations)**

#### Zaawansowane Features
- [ ] **BACK-001**: MapComponent z clustering (Leaflet/Mapbox)
- [ ] **BACK-002**: Real-time notifications (WebSocket/SSE)
- [ ] **BACK-003**: Push notifications (Firebase)
- [ ] **BACK-004**: Dark mode toggle
- [ ] **BACK-005**: Multi-language support (i18n)
- [ ] **BACK-006**: Advanced filtering (multi-select, date ranges)
- [ ] **BACK-007**: Export danych użytkownika (GDPR)
- [ ] **BACK-008**: Donation streak gamification
- [ ] **BACK-009**: Social sharing dla donacji
- [ ] **BACK-010**: Calendar view dla donacji
- [ ] **BACK-011**: Donation reminders (56 dni)
- [ ] **BACK-012**: Analytics dashboard dla admina
- [ ] **BACK-013**: Email deliverability metrics (US-022)
- [ ] **BACK-014**: Audit logs viewer (/admin/audit-logs, US-024)
- [ ] **BACK-015**: User reports zgłaszanie (US-021 frontend)

#### UX Enhancements
- [ ] **UX-001**: Animations (Framer Motion / GSAP)
- [ ] **UX-002**: Skeleton screens for all async ops
- [ ] **UX-003**: Infinite scroll jako alternatywa dla pagination
- [ ] **UX-004**: Keyboard shortcuts (Cmd+K search)
- [ ] **UX-005**: Breadcrumbs na wszystkich stronach
- [ ] **UX-006**: "Back to top" button
- [ ] **UX-007**: Contextual help tooltips
- [ ] **UX-008**: Onboarding tour dla nowych użytkowników

#### Technical Debt & Optimization
- [ ] **TECH-001**: Service Worker dla offline support
- [ ] **TECH-002**: PWA manifest
- [ ] **TECH-003**: Sentry integration dla error tracking
- [ ] **TECH-004**: Analytics (Google Analytics / Plausible)
- [ ] **TECH-005**: Storybook dla component library
- [ ] **TECH-006**: Bundle size optimization (<300KB)
- [ ] **TECH-007**: CDN dla static assets
- [ ] **TECH-008**: Image optimization (WebP, srcset)

---

### 12.8 Definition of Done (DoD)

Każdy task jest "Done" gdy:
1. ✅ Kod zaimplementowany zgodnie z acceptance criteria
2. ✅ TypeScript bez błędów
3. ✅ ESLint/Prettier passed
4. ✅ Unit tests napisane i passed (gdzie applicable)
5. ✅ Accessibility checked (keyboard nav, ARIA)
6. ✅ Mobile responsive (tested 375px, 768px, 1024px+)
7. ✅ Code review passed
8. ✅ Merged do branch'a feature
9. ✅ Dokumentacja aktualizowana (jeśli API/konwencje)
10. ✅ Deployed do staging i tested

---

### 12.9 Sprint Velocity i Timeline

**Assumptions:**
- 1 developer full-time
- 5-day sprints
- ~8 tasks/day capacity

**Timeline (MVP - 6 weeks):**
- Sprint 0: Setup (1 week)
- Sprint 1: Public pages + UI (2 weeks)
- Sprint 2: Auth (1 week)
- Sprint 3: Dashboard (1.5 weeks)
- Sprint 4: Admin (0.5 weeks)
- Sprint 5: Polish + Testing (1 week)

**Total: ~6 weeks for MVP**

**Extended Timeline (with new admin features - 8 weeks):**
- Sprint 0-5: MVP (6 weeks)
- Sprint 6: Manual Data Entry & Parsers (US-028, US-029, US-030) (2 weeks)

**Total with Sprint 6: ~8 weeks**

**Backlog items**: Scheduled for post-MVP iterations (weeks 9-14)

---

Dokument zapisany w `.ai/ui-plan.md`. Struktura katalogów i checklista priorytetów zostały dodane jako sekcje 11 i 12.
