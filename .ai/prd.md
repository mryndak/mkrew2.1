# Dokument wymagań produktu (PRD) - mkrew
## 1. Przegląd produktu
mkrew to webowa aplikacja dla dawców krwi w Polsce, której celem jest:
- zbieranie i prezentowanie codziennych stanów krwi z RCKiK (web scraping),
- umożliwienie użytkownikom rejestracji i prowadzenia dziennika własnych donacji,
- informowanie użytkowników o potrzebie oddania krwi (powiadomienia e‑mail i in‑app),
- przygotowywanie przyszłych iteracji z modułem prognozowania zapotrzebowania (po MVP).

PoC/MVP ma działać jako minimalne, testowalne wdrożenie (4–6 tygodni) zawierające stabilny scraper, bazę danych PostgreSQL, podstawowy system auth, prosty dashboard i mechanizm powiadomień e‑mail.

## 2. Problem użytkownika
- Braki zapasów krwi w RCKiK i niewystarczająca komunikacja do potencjalnych dawców utrudniają szybkie uzupełnianie zasobów.
- Brak jednego, łatwo dostępnego, czytelnego widoku aktualnych stanów zapasów dla dawców.
- Brak prostego mechanizmu śledzenia własnych donacji i otrzymywania powiadomień o pilnej potrzebie krwi.

Użytkownicy (priorytetowo: dawcy krwi) potrzebują rzetelnej informacji o stanach krwi, prostego sposobu na zapisywanie donacji oraz pewnych powiadomień, które pomogą im podjąć decyzję o oddaniu krwi.

## 3. Wymagania funkcjonalne
3.1. Źródła danych i scraping
- Scraper wykonuje scraping publicznych stron RCKiK raz dziennie według ustalonego harmonogramu (np. 02:00 CET).
- Scraper zapisuje codzienny snapshot z metadanymi: timestamp pobrania, URL źródła, wersja parsera.
- Dane zapisywane są w kanonicznej strukturze powiązanej z tabelą RCKiK (unikalne ID).
- System rejestruje błędy parsowania i wysyła alerty do zespołu technicznego.

3.2. Baza danych
- PostgreSQL jako główne repozytorium.
- Kluczowe tabele: users, rckik (kanoniczna lista), blood_snapshots, donations, notification_preferences, scraper_logs.

3.3. Uwierzytelnianie i bezpieczeństwo
- Rejestracja konta: imię, nazwisko, email, hasło, grupa krwi, ulubione RCKiK (opcjonalne).
- Weryfikacja e‑mail wymagana przy rejestracji.
- Reset hasła za pomocą jednorazowego tokenu wysyłanego na e‑mail.
- Hasła hashowane za pomocą Argon2 (preferowane) lub bcrypt.
- Transport TLS; PII i grupa krwi szyfrowane w spoczynku.
- Mechanizmy rate‑limit i blokady po zbyt wielu nieudanych próbach logowania.
- Jasna zgoda opt‑in na przetwarzanie danych wrażliwych (grupa krwi) i zapis tej zgody w DB.

3.4. Dziennik donacji
- Użytkownik może dodać wpis donacji: data, rckik_id, ilość_ml, typ donacji (np. krew pełna, osocze), notatka.
- Możliwość edycji i usuwania własnych wpisów.
- Eksport dziennika do CSV/JSON.

3.5. Dashboard i widoki
- Lista RCKiK z aktualnymi stanami (grupy krwi i poziomy).
- Widok szczegółowy RCKiK: historia snapshotów, trend (proste wykresy) i informacja o ostatnim pobraniu.
- Panel użytkownika: profil, preferencje powiadomień, lista donacji.

3.6. Powiadomienia
- Powiadomienia e‑mail oraz powiadomienia in‑app po zalogowaniu (MVP: e‑mail + in‑app).
- Możliwość ustawienia ulubionych RCKiK; alerty wysyłane w oparciu o progi krytyczne (konfigurowane globalnie lub per RCKiK).
- Preferencje powiadomień (opt‑in, daily/only critical/in‑app only).
- W PoC użycie dostawcy e‑mail (np. MailerSend/Mailgun) oraz konfiguracja SPF/DKIM/DMARC.

3.7. Operacje administracyjne
- Panel admina (PoC: prosty UI) do: przeglądu scraper_logs, ręcznej korekty danych, ponownego parsowania pojedynczych stron, zarządzania listą RCKiK (kanoniczne mapowanie).
- Backup DB i procedury restore.

3.8. Prywatność i zgodność
- Rejestr czynności przetwarzania.
- Procedura usunięcia danych na żądanie (right to be forgotten) i polityka retencji (do ustalenia, np. 2 lata jeżeli nie ma potrzeby dłuższego przechowywania).
- Rozważenie przeprowadzenia DPIA przed pełnym wdrożeniem.

## 4. Granice produktu
- MVP nie obejmuje automatycznej integracji z systemami RCKiK (brak oficjalnego API). Dane pozyskiwane wyłącznie przez scraping publicznych stron.
- MVP nie obejmuje modułu prognozowania – przewidywania zapotrzebowania zaplanowane są w kolejnych iteracjach.
- Brak natychmiastowych powiadomień push/SMS w MVP (możliwa rozbudowa po PoC).
- Nieobsługiwane role: w MVP brak rozbudowanej administracji centralnej RCKiK z SSO; panel admina ograniczony do podstawowych działań korekcyjnych.

## 5. Historyjki użytkowników
Wszystkie historyjki zawierają ID, tytuł, opis i kryteria akceptacji; są testowalne i obejmują scenariusze podstawowe, alternatywne i skrajne.

US-001
Tytuł: Rejestracja nowego użytkownika
Opis: Jako potencjalny dawca chcę założyć konto, aby otrzymywać powiadomienia i prowadzić dziennik donacji.
Kryteria akceptacji:
- Formularz rejestracji zawiera pola: imię, nazwisko, email, hasło, grupa krwi, możliwość wyboru ulubionych RCKiK.
- Po wysłaniu formularza system tworzy konto w stanie "niezweryfikowane" i wysyła e‑mail z tokenem weryfikacyjnym.
- Link weryfikacyjny aktywuje konto i ustawia flagę email_verified = true.
- Hasło zapisane jest w DB jedynie w postaci hashowanej.

US-002
Tytuł: Weryfikacja e‑mail
Opis: Jako nowy użytkownik chcę potwierdzić mój adres e‑mail, aby aktywować konto.
Kryteria akceptacji:
- Po kliknięciu linku z e‑maila: konto przechodzi do stanu aktywnego, użytkownik może się zalogować.
- Token weryfikacyjny wygasa po skonfigurowanym czasie (np. 24h) i nie może być użyty po tym czasie.

US-003
Tytuł: Logowanie
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby zobaczyć swój dashboard i powiadomienia.
Kryteria akceptacji:
- Udane logowanie zwraca sesję lub token JWT z TTL.
- Nieudane logowanie po 5 próbach powoduje tymczasową blokadę konta lub konieczność CAPTCHA.
- Wszystkie połączenia odbywają się przez TLS.

US-004
Tytuł: Reset hasła
Opis: Jako użytkownik chcę odzyskać dostęp do konta, jeśli zapomnę hasła.
Kryteria akceptacji:
- System wysyła jednorazowy token resetu na zarejestrowany e‑mail.
- Token ważny krótko (np. 1 godz.) i może być użyty tylko raz.
- Po poprawnym zresetowaniu hasła poprzedni token jest unieważniany.

US-005
Tytuł: Edycja profilu użytkownika
Opis: Jako zalogowany użytkownik chcę edytować mój profil (imię, nazwisko, ulubione RCKiK, preferencje powiadomień).
Kryteria akceptacji:
- Użytkownik może zmienić pola profilu poza adresem e‑mail (zmiana e‑mail wymaga weryfikacji nowego adresu).
- Zmiany są zapisywane w DB i widoczne natychmiast w UI.

US-006
Tytuł: Ustawienia powiadomień
Opis: Jako użytkownik chcę skonfigurować preferencje powiadomień (email daily/only critical/in‑app only) i mieć możliwość opt‑out.
Kryteria akceptacji:
- Panel preferencji umożliwia wybór trybu powiadomień i zapisu zmian.
- Użytkownik, który wyłączył e‑maile, nie otrzymuje komunikatów e‑mail, ale nadal może otrzymać in‑app alerty.

US-007
Tytuł: Przegląd listy RCKiK i stanów krwi
Opis: Jako zalogowany (lub niezalogowany) użytkownik chcę zobaczyć listę RCKiK z aktualnymi stanami krwi.
Kryteria akceptacji:
- Widok listy pokazuje nazwy RCKiK, lokalizację i podsumowanie stanów (kolor/ikonka dla stanów: OK/WAŻNE/KRYTYCZNE).
- Dane pochodzą z ostatniego daily snapshot i zawierają timestamp pobrania.

US-008
Tytuł: Szczegóły RCKiK
Opis: Jako użytkownik chcę zobaczyć szczegóły konkretnego RCKiK, historię snapshotów i trend.
Kryteria akceptacji:
- Widok pokazuje listę ostatnich snapshotów z datami, wartościami poziomów i prostym wykresem trendu.
- Widok zawiera informację o ostatnim udanym pobraniu i o ewentualnych błędach parsowania.

US-009
Tytuł: Oznaczanie ulubionych RCKiK
Opis: Jako użytkownik chcę dodać/usunąć RCKiK do moich ulubionych, aby otrzymywać skupione powiadomienia.
Kryteria akceptacji:
- Użytkownik może zaznaczyć dowolną liczbę RCKiK jako ulubione na stronie RCKiK lub w profilu.
- Zmiana ulubionych wpływa na zakres wysyłanych alertów.

US-010
Tytuł: Otrzymywanie powiadomień e‑mail o niskich stanach
Opis: Jako użytkownik chcę otrzymać e‑mail, gdy jeden z moich ulubionych RCKiK osiągnie próg krytyczny.
Kryteria akceptacji:
- Powiadomienie jest wysyłane tylko do użytkowników, którzy wyrazili zgodę i mają skonfigurowane ulubione RCKiK.
- E‑mail zawiera nazwę RCKiK, grupy krwi w krytycznym stanie, timestamp snapshotu i sugestię akcji.

US-011
Tytuł: Powiadomienie in‑app
Opis: Jako zalogowany użytkownik chcę zobaczyć alert w aplikacji przy następnym logowaniu, jeśli został wygenerowany krytyczny stan.
Kryteria akceptacji:
- Po zalogowaniu użytkownik widzi banner/alert w sekcji powiadomień z informacją o krytycznym stanie i linkiem do RCKiK.

US-012
Tytuł: Dodanie wpisu donacji do dziennika
Opis: Jako użytkownik chcę zapisać moją donację do mojego dziennika.
Kryteria akceptacji:
- Formularz pozwala zapisać: data, rckik_id, ilość_ml, typ donacji, notatka.
- Po zapisaniu rekord jest przypisany do użytkownika i widoczny w jego historii donacji.
- Walidacja wartości ilości_ml (zakresy konfigurowalne, np. 50–1000 ml).

US-013
Tytuł: Edycja/usuwanie wpisów donacji
Opis: Jako użytkownik chcę mieć możliwość korekty błędnie dodanych wpisów donacji.
Kryteria akceptacji:
- Użytkownik może edytować lub usunąć własne wpisy.
- Usunięcie wymaga potwierdzenia i jest zapisywane w logu operacji (audit trail).

US-014
Tytuł: Eksport dziennika donacji
Opis: Jako użytkownik chcę wyeksportować mój dziennik donacji do CSV/JSON.
Kryteria akceptacji:
- Eksport zawiera wszystkie pola rekordu donacji i metadane właściciela (ograniczone pola PII).
- Plik eksportu generowany jest asynchronicznie i dostępny do pobrania przez link ważny krótko.

US-015
Tytuł: Zgoda na przetwarzanie danych i polityka prywatności
Opis: Jako użytkownik chcę wyrazić świadomą zgodę na przetwarzanie moich danych (w tym grupy krwi) i móc przeczytać politykę prywatności.
Kryteria akceptacji:
- Formularz rejestracji zawiera widoczne checkboxy z opisem celu przetwarzania i wymaganymi zgodami.
- Zgoda jest zapisywana z timestampem i wersją polityki.

US-016
Tytuł: Żądanie usunięcia danych (right to be forgotten)
Opis: Jako użytkownik chcę mieć możliwość zażądania usunięcia mojego konta i danych.
Kryteria akceptacji:
- Użytkownik może zainicjować proces usunięcia konta z poziomu ustawień.
- System rozpoczyna proces usunięcia/pseudonimizacji danych i informuje użytkownika o statusie (email + in‑app).
- Operacja jest zapisywana w rejestrze działań i zgodna z polityką retencji.

US-017
Tytuł: Manualne uruchomienie parsowania / ponowne pobranie
Opis: Jako admin systemu chcę móc ręcznie uruchomić ponowne parsowanie danego URL, aby naprawić błędne dane.
Kryteria akceptacji:
- Panel admina pozwala uruchomić parsowanie pojedynczego URL i pokazuje wynik operacji.
- Operacja tworzy nowy snapshot z odpowiednim flagowaniem manualnego uruchomienia.

US-018
Tytuł: Monitorowanie i alertowanie błędów scraperów
Opis: Jako właściciel techniczny chcę otrzymywać alerty, gdy scraper przestanie prawidłowo działać.
Kryteria akceptacji:
- System wysyła alert (e‑mail/alert w narzędziu monitorującym) po wykryciu X kolejnych nieudanych parsowań lub gdy schemat danych się zmienia.
- Logi błędów są dostępne w panelu admina z możliwością eksportu.

US-019
Tytuł: Zarządzanie kanoniczną listą RCKiK
Opis: Jako admin chcę tworzyć i edytować kanoniczną listę RCKiK (unikalne ID, aliasy, lokalizacja), aby mapować dane ze stron źródłowych.
Kryteria akceptacji:
- Panel admina pozwala dodać/edytować/usuwać rekord RCKiK z unikalnym ID, listą aliasów i lokalizacją (adres, współrzędne opcjonalnie).
- Zmiana mapowania powoduje aktualizację powiązań istniejących snapshotów i jest odnotowana w logu.

US-020
Tytuł: Obsługa braku danych / niekompletnych snapshotów
Opis: Jako użytkownik chcę, aby system komunikował, gdy dane dla danego RCKiK są niekompletne lub brakujące.
Kryteria akceptacji:
- Widok RCKiK wyświetla stan danych: OK / częściowo / brak danych oraz informację o ostatnim udanym pobraniu.
- System nie pokazuje błędnych wartości bez oznaczenia ich stanu.

US-021
Tytuł: Zgłaszanie problemu z danymi
Opis: Jako użytkownik chcę zgłosić błąd w danych RCKiK, aby admin mógł to zweryfikować.
Kryteria akceptacji:
- Formularz zgłoszeniowy pozwala wysłać opis i opcjonalny screenshot/link.
- Zgłoszenie tworzy ticket w systemie admina z referencją do konkretnego snapshotu.

US-022
Tytuł: Widok statusu powiadomień e‑mail (deliverability)
Opis: Jako właściciel produktu chcę monitorować wskaźniki deliverability (bounce/open) e‑mail, aby ocenić skuteczność powiadomień.
Kryteria akceptacji:
- Panel produktu pokazuje liczbę wysłanych e‑maili, bounce rate i open rate za wybrany okres.
- Możliwość filtrowania po typie powiadomienia i RCKiK.

US-023
Tytuł: Zabezpieczenie API i rate limiting
Opis: Jako operator chcę ograniczyć liczbę żądań do API, aby chronić system przed nadużyciami.
Kryteria akceptacji:
- Endpointy API mają rate limiting na poziomie per‑IP i per‑user.
- Nadmierne żądania są blokowane i logowane.

US-024
Tytuł: Rejestr audytu operacji krytycznych
Opis: Jako administrator systemu chcę mieć audyt logów krytycznych operacji (usuwanie konta, edycje RCKiK), aby zapewnić odpowiedzialność.
Kryteria akceptacji:
- Operacje krytyczne zapisują: actor_id, action, target_id, timestamp, dodatkowe metadane.
- Audyt dostępny w panelu admina i eksportowalny.

US-025
Tytuł: Tryb skrajny: brak dostępu do stron RCKiK
Opis: Jako właściciel produktu chcę, aby system radził sobie, gdy scraper nie może pobrać żadnych stron (np. zmian polityki/ban), aby nie pozostawić użytkowników bez informacji.
Kryteria akceptacji:
- System wskazuje globalny status scrape (OK / degraded / failed) oraz ostatni udany timestamp.
- W przypadku prolonged failure: wysyłane są powiadomienia do właścicieli produktu i adminów z instrukcjami manualnego importu danych.

US-026
Tytuł: Anonimizacja danych przy eksporcie/raportach
Opis: Jako właściciel prywatności chcę, aby eksporty raportów agregowały dane bez ujawniania PII.
Kryteria akceptacji:
- Eksportowane raporty agregują poziomy (np. liczba donacji) i nie zawierają pełnych danych osobowych bez wyraźnej zgody.

US-027
Tytuł: Potwierdzenie donacji z powiadomienia (konwersja)
Opis: Jako użytkownik chcę potwierdzić w jednym kliknięciu, że dokonałem donacji po otrzymanym e‑mailu, aby poprawić pomiar konwersji.
Kryteria akceptacji:
- E‑mail zawiera bezpieczny link jednorazowy, który po kliknięciu otwiera ekran potwierdzenia i dodaje wpis do dziennika lub oznacza istniejącą donację jako potwierdzoną.
- Link wygasa po jednorazowym użyciu lub po krótkim czasie.

US-028
Tytuł: Ręczne wprowadzanie stanów krwi przez administratora
Opis: Jako administrator systemu chcę mieć możliwość ręcznego wprowadzenia danych o stanie krwi dla danego RCKiK (w tym danych wstecz), aby zapewnić ciągłość danych w przypadku awarii scrapera lub braku dostępu do źródłowych stron RCKiK.
Kryteria akceptacji:
- Panel admina zawiera formularz do ręcznego wprowadzenia snapshotu krwi z polami: RCKiK (wybór z listy), data snapshotu (może być data wsteczna), grupa krwi, poziom procentowy.
- System waliduje wprowadzone dane: RCKiK musi istnieć i być aktywny, grupa krwi musi być poprawna (A+, A-, B+, B-, AB+, AB-, O+, O-), poziom musi być w zakresie 0–100%, data nie może być z przyszłości.
- Ręcznie wprowadzony snapshot jest oznaczany flagą is_manual = true i nie zawiera source_url ani parser_version.
- System zapisuje audit log z informacją o administratorze, który wprowadził dane (triggered_by), timestampem i szczegółami operacji.
- Po zapisaniu snapshot jest widoczny w historii RCKiK i oznaczony jako "ręcznie wprowadzony" w UI.
- Administrator może wprowadzić wiele snapshotów dla różnych grup krwi dla tego samego RCKiK i tej samej daty.
- System umożliwia wprowadzenie danych historycznych (data wstecz) w celu uzupełnienia luk w danych.

US-029
Tytuł: Implementacja parsera dla RCKiK Rzeszów
Opis: Jako właściciel produktu chcę, aby system automatycznie pobierał i parsował dane o stanach krwi z publicznej strony RCKiK w Rzeszowie, aby użytkownicy otrzymywali aktualne informacje bez konieczności ręcznego wprowadzania.
Kryteria akceptacji:
- System zawiera dedykowany parser dla strony RCKiK w Rzeszowie z konfiguracją URL źródłowego i specyficznych selektorów HTML.
- Parser poprawnie ekstraktuje dane dla wszystkich grup krwi (A+, A-, B+, B-, AB+, AB-, O+, O-) i poziomów procentowych.
- Parser obsługuje błędy parsowania (zmiana struktury HTML, brak danych) i loguje szczegóły błędów do scraper_logs.
- Po udanym parsowaniu system tworzy snapshoty z flagą is_manual = false, wypełnionymi polami source_url i parser_version.
- Parser jest identyfikowany unikalną nazwą i wersją (np. "rzeszow_v1") zapisywaną w polu parser_version.
- System umożliwia testowanie parsera w trybie dry-run (bez zapisu do bazy) w celu weryfikacji poprawności ekstrakcji.
- Parser integruje się z istniejącym mechanizmem schedulowania (daily scraping) i może być uruchamiany ręcznie przez administratora.

US-030
Tytuł: Zarządzanie konfiguracją parserów dla RCKiK
Opis: Jako administrator systemu chcę zarządzać konfiguracją parserów dla różnych centrów RCKiK, aby móc łatwo dodawać nowe centra, aktualizować URL-e i selektory bez konieczności modyfikacji kodu.
Kryteria akceptacji:
- Tabela scraper_config zawiera konfiguracje dla każdego RCKiK: rckik_id, parser_type (np. "rzeszow", "warszawa"), source_url, selectors (JSON z selektorami CSS/XPath), parser_version, is_active.
- Panel admina umożliwia przeglądanie, dodawanie i edycję konfiguracji parserów.
- Przy edycji konfiguracji system zapisuje historię zmian (audit log) z informacją o administratorze i timestampem.
- System waliduje poprawność JSON z selektorami i URL źródłowego przed zapisem.
- Administrator może dezaktywować parser dla danego RCKiK (is_active = false), co powoduje pominięcie tego centrum podczas automatycznego scrapingu.
- System pokazuje ostatni status parsowania dla każdej konfiguracji (success/failure, timestamp, error message).
- Możliwość testowania konfiguracji parsera w trybie dry-run bezpośrednio z panelu admina.

(End of user stories)

## 6. Metryki sukcesu
- Adopcja i aktywność:
  - Liczba zarejestrowanych użytkowników (cel PoC: X — ustalić docelowo), liczba aktywnych użytkowników (DAU/MAU).
  - Liczba użytkowników korzystających z dziennika donacji.
- Efekt na zapasy:
  - Redukcja % dni z niedoborem zapasów według zdefiniowanego progu (baseline + porównanie kwartalne).
  - Konwersja powiadomień: % powiadomień, które doprowadziły do self‑reported donacji.
- Stabilność i jakość danych:
  - Odsetek udanych daily snapshotów (cel: > 95%).
  - Liczba błędów parsowania na tydzień.
- Powiadomienia i deliverability:
  - Bounce rate < 1–2% (docelowo), open rate monitorowany.
  - Czas od wykrycia krytycznego stanu do wysłania powiadomień < 60 minut od snapshotu (dla in‑app i e‑mail w PoC: batch daily).
- Operacyjne:
  - Czas reakcji na krytyczny alert scraper (SLA dla PoC/early: 24h dla akcji manualnej).

Kontrola zgodności z listą kontrolną:
- Wszystkie historyjki można przetestować (mają konkretne kryteria akceptacji).
- Kryteria akceptacji są konkretne i mierzalne.
- Zawartość obejmuje wymagania uwierzytelniania i autoryzacji.
- Zakres historyjek jest wystarczający, aby zbudować funkcjonalne MVP opisane w PoC.

Najbliższe kroki:
- Zatwierdzenie PRD przez interesariuszy.
- Uzyskanie opinii prawnej i (jeśli możliwe) pisemnych zgód od właścicieli stron RCKiK.
- Implementacja PoC według priorytetów: scraper i DB -> auth i rejestracja -> dashboard i donacje -> powiadomienia -> panel admina.

## 7. Plan implementacji nowych funkcjonalności (US-028, US-029, US-030)

### 7.1. Architektura rozwiązania

**Komponenty backendowe:**
1. **BloodSnapshotService** - nowy serwis do zarządzania snapshotami (ręczne wprowadzanie, listowanie)
2. **ParserService** - serwis do zarządzania parserami i ich konfiguracją
3. **RzeszowParser** - implementacja parsera dla RCKiK Rzeszów
4. **AdminBloodSnapshotController** - kontroler API dla admina do ręcznego wprowadzania
5. **AdminParserController** - kontroler API do zarządzania konfiguracją parserów

**Modele danych:**
- BloodSnapshot - istniejąca encja, wykorzystanie pola `is_manual`
- ScraperConfig - istniejąca tabela, rozszerzenie o pola `selectors` (JSONB), `parser_type`
- AuditLog - istniejąca tabela, logowanie operacji manualnych

**Architektura parserów:**
```
ParserInterface (interface)
  ├── parseBloodLevels(url: String): List<BloodLevelData>
  ├── getParserType(): String
  └── getParserVersion(): String

RzeszowParser implements ParserInterface
  - Specyficzna logika parsowania dla Rzeszowa
  - Konfiguracja selektorów HTML/CSS
  - Walidacja i transformacja danych
```

### 7.2. Plan implementacji etapami

**Etap 1: Ręczne wprowadzanie danych (US-028)**
Priorytet: WYSOKI | Czas: 3-5 dni

Backend:
1. Utworzenie DTO:
   - CreateBloodSnapshotRequest (rckikId, snapshotDate, bloodGroup, levelPercentage)
   - BloodSnapshotResponse (z flagą isManual)
2. Utworzenie BloodSnapshotService z metodami:
   - createManualSnapshot(request, userId) - walidacja i zapis
   - validateBloodSnapshot(request) - walidacja danych
   - listSnapshots(rckikId, filters) - listowanie z filtrowaniem
3. Utworzenie AdminBloodSnapshotController z endpointami:
   - POST /api/v1/admin/blood-snapshots - tworzenie manualnego snapshotu
   - GET /api/v1/admin/blood-snapshots - listowanie z filtrowaniem (manual/scraped)
4. Dodanie walidacji:
   - Grupa krwi: enum validation (A+, A-, B+, B-, AB+, AB-, O+, O-)
   - Poziom: 0-100%
   - Data: nie z przyszłości
   - RCKiK: exists and active
5. Audit logging:
   - Wykorzystanie AuditLogService do logowania operacji CREATE
   - Zapisanie userId, action, targetId, timestamp

Frontend (Astro + React/Vue):
1. Dodanie komponentu formularza w panelu admina
2. Implementacja walidacji po stronie klienta
3. Obsługa błędów i komunikatów sukcesu
4. Wyświetlanie historii snapshotów z oznaczeniem "manual"

**Etap 2: Infrastruktura parserów (US-030)**
Priorytet: WYSOKI | Czas: 3-4 dni

Backend:
1. Utworzenie interfejsu ParserInterface (Parser.java):
   ```java
   public interface Parser {
       List<BloodLevelData> parseBloodLevels(String htmlContent) throws ParsingException;
       String getParserType();
       String getParserVersion();
   }
   ```
2. Utworzenie modelu BloodLevelData (DTO dla wyników parsowania):
   - bloodGroup, levelPercentage
3. Aktualizacja encji ScraperConfig:
   - Dodanie pola `selectors` (JSON/JSONB)
   - Dodanie pola `parser_type` (String)
4. Utworzenie ScraperConfigService:
   - getConfigForRckik(rckikId)
   - createConfig(config)
   - updateConfig(id, config)
   - testParserDryRun(configId) - testowanie bez zapisu do DB
5. Utworzenie AdminParserController:
   - GET /api/v1/admin/parsers/configs - lista konfiguracji
   - POST /api/v1/admin/parsers/configs - tworzenie konfiguracji
   - PUT /api/v1/admin/parsers/configs/{id} - aktualizacja
   - POST /api/v1/admin/parsers/configs/{id}/test - dry-run test
6. Utworzenie ParserFactory:
   - Wzorzec Factory do tworzenia instancji parserów na podstawie parser_type
   - Rejestracja dostępnych parserów

**Etap 3: Parser dla RCKiK Rzeszów (US-029)**
Priorytet: WYSOKI | Czas: 4-6 dni

Backend:
1. Analiza strony RCKiK Rzeszów:
   - Określenie URL źródłowego
   - Identyfikacja selektorów CSS/XPath dla grup krwi i poziomów
   - Obsługa edge cases (brak danych, niepoprawny format)
2. Implementacja RzeszowParser implements Parser:
   - Parsowanie HTML za pomocą Jsoup
   - Ekstrakcja danych dla wszystkich grup krwi
   - Walidacja i transformacja danych
   - Obsługa błędów parsowania
3. Utworzenie konfiguracji w scraper_config:
   - INSERT dla RCKiK Rzeszów z URL i selektorami
4. Integracja z ScraperService:
   - Aktualizacja triggerManualScraping() do używania ParserFactory
   - Implementacja faktycznej logiki scrapingu (obecnie TODO)
5. Testy jednostkowe:
   - Test parsowania przykładowego HTML
   - Test obsługi błędów
   - Test walidacji danych
6. Testy integracyjne:
   - Test end-to-end scrapingu dla Rzeszowa
   - Weryfikacja zapisu snapshotów z is_manual = false

Monitoring i logowanie:
1. Szczegółowe logowanie błędów parsowania
2. Metryki sukcesu/failure dla parsera
3. Alerty przy konsekutywnych błędach

**Etap 4: Frontend dla zarządzania parserami**
Priorytet: ŚREDNI | Czas: 3-4 dni

1. Panel admina - zarządzanie konfiguracją parserów
2. Formularz edycji selektorów (JSON editor)
3. Przycisk testowania parsera (dry-run)
4. Wyświetlanie statusu i błędów parsowania

### 7.3. Zależności techniczne

**Backend (Java/Spring Boot):**
- Jsoup - parsowanie HTML (już w projekcie)
- Jackson - parsowanie JSON dla konfiguracji selektorów
- Spring Validation - walidacja DTO

**Baza danych:**
- PostgreSQL JSONB - dla pola `selectors` w scraper_config
- Liquibase - migracje dla nowych pól w scraper_config

### 7.4. Priorytety i timeline

**Sprint 1 (7 dni):** US-028 + US-030 (infrastruktura)
- Ręczne wprowadzanie danych
- Podstawowa infrastruktura parserów
- Testy jednostkowe i integracyjne

**Sprint 2 (5 dni):** US-029 (RCKiK Rzeszów)
- Implementacja parsera Rzeszów
- Integracja z schedulingiem
- Testy end-to-end

**Sprint 3 (3 dni):** Frontend i dopracowanie
- Panel admina - formularz ręcznego wprowadzania
- Panel admina - zarządzanie parserami
- Dokumentacja i testy akceptacyjne

**Całkowity czas: ~15 dni roboczych (3 tygodnie)**

### 7.5. Ryzyka i mitygacja

**Ryzyko 1:** Zmiana struktury HTML strony RCKiK Rzeszów
- Mitygacja: System konfiguracji parserów umożliwia szybką aktualizację selektorów bez zmiany kodu
- Mitygacja: Alerty przy błędach parsowania + ręczne wprowadzanie danych jako backup

**Ryzyko 2:** Blokowanie scrapingu przez RCKiK (rate limiting, CAPTCHA)
- Mitygacja: User-Agent rotation, delays między requestami
- Mitygacja: Ręczne wprowadzanie danych jako fallback

**Ryzyko 3:** Niepoprawne dane na stronie źródłowej
- Mitygacja: Walidacja parsowanych danych (zakres 0-100%, poprawne grupy krwi)
- Mitygacja: Logowanie szczegółów błędów dla analizy

### 7.6. Metryki sukcesu dla nowych funkcjonalności

**US-028 (Ręczne wprowadzanie):**
- Liczba ręcznie wprowadzonych snapshotów / tydzień
- Czas wypełnienia luk w danych po awarii scrapera
- % dni z kompletnymi danymi (scraped + manual)

**US-029 (Parser Rzeszów):**
- Success rate parsowania dla Rzeszowa (cel: >95%)
- Średni czas parsowania pojedynczego RCKiK (<5s)
- Liczba błędów parsowania / miesiąc (cel: <5)

**US-030 (Zarządzanie parserami):**
- Liczba skonfigurowanych parserów dla różnych RCKiK
- Czas potrzebny na dodanie nowego parsera (cel: <1h)
- Liczba użyć dry-run testów / tydzień


