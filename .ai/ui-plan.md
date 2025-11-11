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

Dokument zapisany w `.ai/ui-plan.md`. Jeśli chcesz, mogę:
- wygenerować strukturę katalogów komponentów i szablonów (bez implementacji),
- przygotować checklistę z priorytetami do sprintu (MVP/backlog),
- wygenerować przykładowe mocki danych MSW dla krytycznych endpoints.
