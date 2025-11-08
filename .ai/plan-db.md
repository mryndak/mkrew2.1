# Plan Bazy Danych - mkrew MVP

## Status: ✅ Zaimplementowano

Data utworzenia: 2025-11-08
Wersja: 1.0
Baza danych: PostgreSQL 16

---

## 1. Przegląd Architektury

### Technologie
- **DBMS**: PostgreSQL 16 (Alpine)
- **Migracje**: Liquibase 4.25 (Open Source)
- **Orkiestracja**: Docker Compose
- **Deployment**: Google Cloud Platform (Cloud SQL for PostgreSQL)

### Struktura Projektu
```
db/
├── docker-compose.yml              # Konfiguracja środowiska lokalnego
├── Dockerfile                      # Obraz Liquibase
├── changelog/
│   ├── db.changelog-master.yaml    # Główny plik migracji
│   └── changesets/                 # 17 changesetów (001-017)
├── erd-diagram.drawio              # Diagram ERD
├── README.md                       # Dokumentacja techniczna
└── QUICKSTART.md                   # Szybki start
```

---

## 2. Schemat Bazy Danych

### 2.1 Tabele Główne (Core Tables)

#### **users** - Konta użytkowników
**Plik**: `001-create-users-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Adres email (login) |
| password_hash | VARCHAR(255) | NOT NULL | Hash hasła (Argon2/BCrypt) |
| first_name | VARCHAR(100) | NOT NULL | Imię |
| last_name | VARCHAR(100) | NOT NULL | Nazwisko |
| blood_group | VARCHAR(5) | NULL | Grupa krwi (0+, 0-, A+, A-, B+, B-, AB+, AB-) |
| email_verified | BOOLEAN | NOT NULL, DEFAULT false | Status weryfikacji email |
| consent_timestamp | TIMESTAMP | NULL | Timestamp zgody RODO |
| consent_version | VARCHAR(20) | NULL | Wersja polityki prywatności |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

**Constraints:**
- `chk_users_blood_group`: Walidacja grupy krwi (IN clause)

**Indeksy:**
- `idx_users_email`: (email)
- `idx_users_deleted_at`: WHERE deleted_at IS NULL (partial)
- `idx_users_active`: (id, email) WHERE deleted_at IS NULL (partial)
- `idx_users_verified`: (id) WHERE email_verified = true AND deleted_at IS NULL (partial)
- `idx_users_blood_group`: (blood_group)

**Zgodność z PRD:** ✅
- US-001: Rejestracja nowego użytkownika
- US-005: Edycja profilu użytkownika
- US-015: Zgoda na przetwarzanie danych

---

#### **rckik** - Centra Krwiodawstwa (Kanoniczna Lista)
**Plik**: `002-create-rckik-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| name | VARCHAR(255) | NOT NULL | Pełna nazwa centrum |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Unikalny kod centrum |
| city | VARCHAR(100) | NOT NULL | Miasto |
| address | TEXT | NULL | Pełny adres |
| latitude | NUMERIC(9,6) | NULL | Szerokość geograficzna |
| longitude | NUMERIC(9,6) | NULL | Długość geograficzna |
| aliases | TEXT[] | NULL | Aliasy nazw (array) |
| active | BOOLEAN | NOT NULL, DEFAULT true | Czy centrum jest aktywne |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data aktualizacji |

**Indeksy:**
- `idx_rckik_code`: (code)
- `idx_rckik_active`: (active)
- `idx_rckik_aliases`: GIN index na aliases (array search)

**Zgodność z PRD:** ✅
- US-007: Przegląd listy RCKiK
- US-019: Zarządzanie kanoniczną listą RCKiK
- Przygotowanie na przyszłe funkcje geolokalizacji

---

#### **blood_snapshots** - Snapshoty Stanów Krwi
**Plik**: `003-create-blood-snapshots-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| rckik_id | BIGINT | FK → rckik(id), NOT NULL | Centrum krwiodawstwa |
| snapshot_date | DATE | NOT NULL | Data snapshotu |
| blood_group | VARCHAR(5) | NOT NULL | Grupa krwi |
| level_percentage | NUMERIC(5,2) | NOT NULL, CHECK (0-100) | Poziom krwi w % |
| source_url | TEXT | NULL | URL źródła danych |
| parser_version | VARCHAR(50) | NULL | Wersja parsera |
| scraped_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Timestamp pobrania |
| is_manual | BOOLEAN | NOT NULL, DEFAULT false | Czy wprowadzono ręcznie |

**Constraints:**
- `chk_blood_snapshots_blood_group`: Walidacja grupy krwi
- `chk_blood_snapshots_level_percentage`: Poziom 0-100%

**Indeksy:**
- `idx_blood_snapshots_rckik_date_group`: (rckik_id, snapshot_date DESC, blood_group)
- `idx_blood_snapshots_date_level`: (snapshot_date, level_percentage)
- `idx_blood_snapshots_scraped_at`: (scraped_at DESC)

**Partycjonowanie (future):**
- Rekomendacja: Range partitioning po `snapshot_date` (miesięczne)
- Retencja: Do ustalenia (np. 24 miesiące)

**Zgodność z PRD:** ✅
- US-007: Prezentacja stanów krwi
- US-008: Szczegóły RCKiK i historia
- 3.1: Web scraping i snapshoty

---

### 2.2 Tabele Relacyjne

#### **user_favorite_rckik** - Ulubione Centra Użytkowników
**Plik**: `004-create-user-favorite-rckik-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NOT NULL, ON DELETE CASCADE | Użytkownik |
| rckik_id | BIGINT | FK → rckik(id), NOT NULL, ON DELETE CASCADE | Centrum |
| priority | INTEGER | NULL | Priorytet (opcjonalnie) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data dodania |

**Constraints:**
- `uk_user_favorite_rckik`: UNIQUE (user_id, rckik_id)

**Indeksy:**
- `idx_user_favorite_rckik_user`: (user_id)
- `idx_user_favorite_rckik_rckik`: (rckik_id)

**Relacja:** Many-to-Many (users ↔ rckik)

**Zgodność z PRD:** ✅
- US-009: Oznaczanie ulubionych RCKiK
- US-010: Powiadomienia o niskich stanach

---

#### **donations** - Dziennik Donacji
**Plik**: `005-create-donations-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NOT NULL, ON DELETE CASCADE | Użytkownik |
| rckik_id | BIGINT | FK → rckik(id), NOT NULL | Centrum |
| donation_date | DATE | NOT NULL | Data donacji |
| quantity_ml | INTEGER | NOT NULL, CHECK (50-1000) | Ilość w ml |
| donation_type | VARCHAR(50) | NOT NULL | Typ donacji |
| notes | TEXT | NULL | Notatki użytkownika |
| confirmed | BOOLEAN | NOT NULL, DEFAULT false | Czy potwierdzona (US-027) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data aktualizacji |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Constraints:**
- `chk_donations_quantity_ml`: Ilość 50-1000 ml
- `chk_donations_type`: IN ('FULL_BLOOD', 'PLASMA', 'PLATELETS', 'OTHER')

**Indeksy:**
- `idx_donations_user_date`: (user_id, donation_date DESC, deleted_at)
- `idx_donations_rckik_date`: (rckik_id, donation_date DESC)

**Zgodność z PRD:** ✅
- US-012: Dodanie wpisu donacji
- US-013: Edycja/usuwanie wpisów
- US-014: Eksport dziennika donacji
- US-027: Potwierdzenie donacji z powiadomienia

---

### 2.3 Tabele Powiadomień

#### **notification_preferences** - Preferencje Powiadomień
**Plik**: `006-create-notification-preferences-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), UNIQUE, NOT NULL, ON DELETE CASCADE | Użytkownik |
| email_enabled | BOOLEAN | NOT NULL, DEFAULT true | Email włączone |
| email_frequency | VARCHAR(50) | NOT NULL, DEFAULT 'ONLY_CRITICAL' | Częstotliwość email |
| in_app_enabled | BOOLEAN | NOT NULL, DEFAULT true | In-app włączone |
| in_app_frequency | VARCHAR(50) | NOT NULL, DEFAULT 'IMMEDIATE' | Częstotliwość in-app |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data aktualizacji |

**Constraints:**
- `chk_notification_preferences_email_frequency`: IN ('DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE')
- `chk_notification_preferences_in_app_frequency`: IN ('DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE')

**Indeksy:**
- `idx_notification_preferences_user`: (user_id)
- `idx_notification_preferences_email_enabled`: (email_enabled, email_frequency)

**Relacja:** One-to-One z users

**Zgodność z PRD:** ✅
- US-006: Ustawienia powiadomień
- 3.6: Powiadomienia e-mail i in-app

---

#### **in_app_notifications** - Powiadomienia In-App
**Plik**: `007-create-in-app-notifications-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NOT NULL, ON DELETE CASCADE | Użytkownik |
| notification_type | VARCHAR(50) | NOT NULL | Typ powiadomienia |
| rckik_id | BIGINT | FK → rckik(id), NULL | Powiązane centrum |
| title | VARCHAR(255) | NOT NULL | Tytuł |
| message | TEXT | NOT NULL | Treść |
| link_url | TEXT | NULL | Link do szczegółów |
| read_at | TIMESTAMP | NULL | Timestamp przeczytania |
| expires_at | TIMESTAMP | NULL | Timestamp wygaśnięcia |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |

**Constraints:**
- `chk_in_app_notifications_type`: IN ('CRITICAL_BLOOD_LEVEL', 'SYSTEM_ALERT', 'DONATION_REMINDER', 'OTHER')

**Indeksy:**
- `idx_in_app_notifications_unread`: (user_id, created_at DESC) WHERE read_at IS NULL (partial)
- `idx_in_app_notifications_user_created`: (user_id, created_at DESC)

**Retencja:**
- Auto-czyszczenie przeczytanych > 30 dni (do zaimplementowania w aplikacji)

**Zgodność z PRD:** ✅
- US-011: Powiadomienie in-app
- 3.6: System powiadomień

---

#### **email_logs** - Logi Wysyłki Email
**Plik**: `008-create-email-logs-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NULL, ON DELETE CASCADE | Użytkownik (jeśli dotyczy) |
| notification_type | VARCHAR(50) | NOT NULL | Typ powiadomienia |
| rckik_id | BIGINT | FK → rckik(id), NULL | Powiązane centrum |
| recipient_email | VARCHAR(255) | NOT NULL | Email odbiorcy |
| subject | VARCHAR(500) | NOT NULL | Temat |
| sent_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data wysłania |
| delivered_at | TIMESTAMP | NULL | Data dostarczenia |
| opened_at | TIMESTAMP | NULL | Data otwarcia |
| bounced_at | TIMESTAMP | NULL | Data bounce |
| bounce_type | VARCHAR(20) | NULL | Typ bounce (HARD/SOFT) |
| external_id | VARCHAR(255) | NULL | ID z SendGrid/Mailgun |
| metadata | JSONB | NULL | Dodatkowe dane |

**Constraints:**
- `chk_email_logs_notification_type`: IN ('CRITICAL_ALERT', 'DAILY_SUMMARY', 'VERIFICATION', 'PASSWORD_RESET', 'OTHER')
- `chk_email_logs_bounce_type`: IN ('HARD', 'SOFT') OR NULL

**Indeksy:**
- `idx_email_logs_sent_at`: (sent_at DESC)
- `idx_email_logs_user_sent`: (user_id, sent_at DESC)
- `idx_email_logs_notification_type_sent`: (notification_type, sent_at DESC)
- `idx_email_logs_external_id`: (external_id)

**Partycjonowanie (future):**
- Range partitioning po `sent_at` (miesięczne)
- Retencja: 90 dni (szczegóły), agregacje na stałe

**Zgodność z PRD:** ✅
- US-010: Powiadomienia email
- US-022: Widok statusu deliverability
- 3.6: Tracking powiadomień

---

### 2.4 Tabele Autentykacji i Sesji

#### **user_tokens** - Tokeny Weryfikacji i Resetu
**Plik**: `009-create-user-tokens-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NOT NULL, ON DELETE CASCADE | Użytkownik |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Token (zahashowany) |
| token_type | VARCHAR(50) | NOT NULL | Typ tokenu |
| expires_at | TIMESTAMP | NOT NULL | Data wygaśnięcia |
| used_at | TIMESTAMP | NULL | Data użycia |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| metadata | JSONB | NULL | Dodatkowe dane |

**Constraints:**
- `chk_user_tokens_type`: IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'DONATION_CONFIRMATION')

**Indeksy:**
- `idx_user_tokens_token_type_expires`: (token, token_type, expires_at)
- `idx_user_tokens_user_type`: (user_id, token_type)
- `idx_user_tokens_expires_at`: (expires_at) - dla czyszczenia wygasłych

**TTL:**
- EMAIL_VERIFICATION: 24h
- PASSWORD_RESET: 1h
- DONATION_CONFIRMATION: Jednorazowe

**Zgodność z PRD:** ✅
- US-002: Weryfikacja email
- US-004: Reset hasła
- US-027: Potwierdzenie donacji

---

#### **user_sessions** - Sesje Użytkowników
**Plik**: `010-create-user-sessions-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NOT NULL, ON DELETE CASCADE | Użytkownik |
| token_hash | VARCHAR(64) | UNIQUE, NOT NULL | Hash tokenu JWT (SHA256) |
| ip_address | VARCHAR(45) | NULL | Adres IP |
| user_agent | TEXT | NULL | User agent |
| expires_at | TIMESTAMP | NOT NULL | Data wygaśnięcia |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| last_activity_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Ostatnia aktywność |
| revoked | BOOLEAN | NOT NULL, DEFAULT false | Czy unieważniona |

**Indeksy:**
- `idx_user_sessions_user_expires`: (user_id, expires_at) WHERE revoked = false (partial)
- `idx_user_sessions_expires_at`: (expires_at)

**Opcjonalność:**
- Tabela opcjonalna dla MVP (JWT może być stateless)
- Użyteczna dla wymuszenia wylogowania i śledzenia sesji

**Zgodność z PRD:** ✅
- US-003: Logowanie
- Bezpieczeństwo: Śledzenie aktywnych sesji

---

### 2.5 Tabele Web Scrapingu

#### **scraper_runs** - Przebiegi Scrapingu
**Plik**: `011-create-scraper-runs-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| run_type | VARCHAR(50) | NOT NULL | Typ uruchomienia |
| started_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Start |
| completed_at | TIMESTAMP | NULL | Koniec |
| total_rckiks | INTEGER | NULL | Liczba centrów |
| successful_count | INTEGER | NOT NULL, DEFAULT 0 | Sukces |
| failed_count | INTEGER | NOT NULL, DEFAULT 0 | Błędy |
| duration_seconds | INTEGER | NULL | Czas trwania |
| triggered_by | VARCHAR(100) | NOT NULL | Kto uruchomił |
| status | VARCHAR(50) | NOT NULL | Status |
| error_summary | TEXT | NULL | Podsumowanie błędów |

**Constraints:**
- `chk_scraper_runs_run_type`: IN ('SCHEDULED', 'MANUAL')
- `chk_scraper_runs_status`: IN ('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL')

**Indeksy:**
- `idx_scraper_runs_started_at`: (started_at DESC)
- `idx_scraper_runs_status_started`: (status, started_at DESC)
- `idx_scraper_runs_run_type`: (run_type)

**Zgodność z PRD:** ✅
- US-017: Manualne uruchomienie parsowania
- US-018: Monitorowanie błędów scraperów
- 3.1: Daily scraping schedule

---

#### **scraper_logs** - Logi Pojedynczych Operacji
**Plik**: `012-create-scraper-logs-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| scraper_run_id | BIGINT | FK → scraper_runs(id), NULL, ON DELETE CASCADE | Przebieg |
| rckik_id | BIGINT | FK → rckik(id), NULL | Centrum |
| url | TEXT | NOT NULL | URL źródła |
| status | VARCHAR(50) | NOT NULL | Status |
| error_message | TEXT | NULL | Komunikat błędu |
| parser_version | VARCHAR(50) | NULL | Wersja parsera |
| response_time_ms | INTEGER | NULL | Czas odpowiedzi |
| http_status_code | INTEGER | NULL | Kod HTTP |
| records_parsed | INTEGER | NULL | Liczba sparsowanych |
| records_failed | INTEGER | NULL | Liczba błędnych |
| metadata | JSONB | NULL | Dodatkowe dane |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |

**Constraints:**
- `chk_scraper_logs_status`: IN ('SUCCESS', 'PARTIAL', 'FAILED')

**Indeksy:**
- `idx_scraper_logs_rckik_created`: (rckik_id, created_at DESC)
- `idx_scraper_logs_status_created`: (status, created_at DESC)
- `idx_scraper_logs_run_id`: (scraper_run_id)

**Partycjonowanie (future):**
- Range partitioning po `created_at` (tygodniowe/miesięczne)
- Retencja: 90 dni

**Zgodność z PRD:** ✅
- US-018: Alertowanie błędów scraperów
- US-020: Obsługa braku danych
- 3.1: Logging i metadane

---

#### **scraper_configs** - Konfiguracje Scraperów
**Plik**: `013-create-scraper-configs-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| rckik_id | BIGINT | FK → rckik(id), NOT NULL, ON DELETE CASCADE | Centrum |
| source_url | TEXT | NOT NULL | URL źródła |
| parser_type | VARCHAR(50) | NOT NULL | Typ parsera |
| css_selectors | JSONB | NULL | Selektory CSS |
| active | BOOLEAN | NOT NULL, DEFAULT true | Czy aktywny |
| schedule_cron | VARCHAR(100) | NULL | Harmonogram cron |
| timeout_seconds | INTEGER | NOT NULL, DEFAULT 30 | Timeout |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data aktualizacji |

**Constraints:**
- `chk_scraper_configs_parser_type`: IN ('JSOUP', 'SELENIUM', 'CUSTOM')

**Indeksy:**
- `idx_scraper_configs_rckik_active`: (rckik_id, active)
- `idx_scraper_configs_active`: (active)

**Zgodność z PRD:** ✅
- US-017: Manualne parsowanie
- 3.1: Konfigurowalne scrapery
- Elastyczność: Zmiana bez redeployu

---

### 2.6 Tabele Administracyjne i Audytu

#### **user_reports** - Zgłoszenia Problemów
**Plik**: `014-create-user-reports-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| user_id | BIGINT | FK → users(id), NOT NULL, ON DELETE CASCADE | Zgłaszający |
| blood_snapshot_id | BIGINT | FK → blood_snapshots(id), NULL | Snapshot |
| rckik_id | BIGINT | FK → rckik(id), NOT NULL | Centrum |
| description | TEXT | NOT NULL | Opis problemu |
| screenshot_url | TEXT | NULL | URL screenshota (Cloud Storage) |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'NEW' | Status |
| admin_notes | TEXT | NULL | Notatki admina |
| resolved_by | BIGINT | FK → users(id), NULL | Kto rozwiązał |
| resolved_at | TIMESTAMP | NULL | Data rozwiązania |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data utworzenia |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data aktualizacji |

**Constraints:**
- `chk_user_reports_status`: IN ('NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED')

**Indeksy:**
- `idx_user_reports_status_created`: (status, created_at DESC)
- `idx_user_reports_blood_snapshot`: (blood_snapshot_id)
- `idx_user_reports_user_created`: (user_id, created_at DESC)

**Zgodność z PRD:** ✅
- US-021: Zgłaszanie problemu z danymi

---

#### **audit_logs** - Dziennik Audytu (Immutable)
**Plik**: `015-create-audit-logs-table.yaml`

| Kolumna | Typ | Constraints | Opis |
|---------|-----|-------------|------|
| id | BIGSERIAL | PK | Unikalny identyfikator |
| actor_id | VARCHAR(100) | NOT NULL | Kto wykonał (user_id lub 'SYSTEM') |
| action | VARCHAR(100) | NOT NULL | Akcja |
| target_type | VARCHAR(100) | NOT NULL | Typ encji |
| target_id | BIGINT | NULL | ID encji |
| metadata | JSONB | NULL | Dodatkowe dane |
| ip_address | VARCHAR(45) | NULL | Adres IP |
| user_agent | TEXT | NULL | User agent |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data wykonania |

**Indeksy:**
- `idx_audit_logs_actor_created`: (actor_id, created_at DESC)
- `idx_audit_logs_target_created`: (target_type, target_id, created_at DESC)
- `idx_audit_logs_action`: (action)
- `idx_audit_logs_metadata`: GIN index na metadata (JSONB search)

**Immutability:**
- Trigger `trg_prevent_audit_logs_update`: Blokuje UPDATE
- Trigger `trg_prevent_audit_logs_delete`: Blokuje DELETE
- Funkcja: `prevent_audit_logs_update_delete()`

**Partycjonowanie (future):**
- Range partitioning po `created_at` (kwartalne)

**Zgodność z PRD:** ✅
- US-024: Rejestr audytu operacji krytycznych
- US-013: Audit trail dla usuwania donacji
- 3.8: Zgodność z RODO

---

### 2.7 Widoki Materializowane

#### **mv_latest_blood_levels** - Najnowsze Stany Krwi
**Plik**: `017-create-materialized-view.yaml`

**Definicja:**
```sql
SELECT DISTINCT ON (bs.rckik_id, bs.blood_group)
    bs.id,
    bs.rckik_id,
    bs.blood_group,
    bs.level_percentage,
    bs.snapshot_date,
    bs.scraped_at,
    bs.is_manual,
    r.name as rckik_name,
    r.code as rckik_code,
    r.city as rckik_city,
    r.active as rckik_active,
    CASE
        WHEN bs.level_percentage < 20 THEN 'CRITICAL'
        WHEN bs.level_percentage < 50 THEN 'IMPORTANT'
        ELSE 'OK'
    END as level_status
FROM blood_snapshots bs
INNER JOIN rckik r ON bs.rckik_id = r.id
ORDER BY bs.rckik_id, bs.blood_group, bs.snapshot_date DESC, bs.scraped_at DESC;
```

**Indeksy:**
- Unique: `idx_mv_latest_blood_levels_rckik_group` (rckik_id, blood_group)
- `idx_mv_latest_blood_levels_level_status`: (level_status, level_percentage)
- `idx_mv_latest_blood_levels_snapshot_date`: (snapshot_date DESC)

**Odświeżanie:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_blood_levels;
```
- Harmonogram: Po każdym scrapingu
- Concurrent: Nie blokuje odczytów

**Zgodność z PRD:** ✅
- US-007: Dashboard z listą RCKiK
- US-008: Widok szczegółowy
- Optymalizacja: Szybki dostęp do aktualnych stanów

---

## 3. Indeksowanie i Wydajność

### 3.1 Typy Indeksów

| Typ | Zastosowanie | Przykłady |
|-----|--------------|-----------|
| B-tree (standard) | Większość kolumn | id, email, created_at |
| GIN | JSONB, arrays | metadata, aliases |
| Partial | Filtrowane | WHERE deleted_at IS NULL |
| Composite | Złożone zapytania | (user_id, created_at DESC) |

### 3.2 Partial Indexes (Optymalizacja)

**users:**
- `idx_users_deleted_at`: Tylko aktywni użytkownicy
- `idx_users_active`: (id, email) dla aktywnych
- `idx_users_verified`: Tylko zweryfikowani

**in_app_notifications:**
- `idx_in_app_notifications_unread`: Tylko nieprzeczytane

**user_sessions:**
- `idx_user_sessions_user_expires`: Tylko aktywne sesje

### 3.3 Strategie Partycjonowania (Future)

**Tabele do partycjonowania:**

1. **blood_snapshots** - Range by `snapshot_date` (miesięczne)
   - Retencja: 24 miesiące
   - Przyrost: ~8 grup × ~20 centrów × 365 dni = ~58k rekordów/rok

2. **scraper_logs** - Range by `created_at` (tygodniowe)
   - Retencja: 90 dni
   - Auto-drop starych partycji

3. **email_logs** - Range by `sent_at` (miesięczne)
   - Retencja: 90 dni (szczegóły)
   - Agregacje archiwalne na stałe

4. **audit_logs** - Range by `created_at` (kwartalne)
   - Retencja: Zgodnie z polityką RODO

---

## 4. Bezpieczeństwo

### 4.1 Wrażliwe Dane

**Niezaszyfrowane (MVP):**
- `users.blood_group`: Varchar bez szyfrowania (zgodnie z decyzją)
- Możliwe do dodania później: pgcrypto encryption at rest

**Hashowane:**
- `users.password_hash`: Argon2/BCrypt (aplikacja)
- `user_tokens.token`: SHA256 (aplikacja przed zapisem)
- `user_sessions.token_hash`: SHA256

### 4.2 Row Level Security (RLS) - Future

**Rekomendowane polityki:**

```sql
-- users: Użytkownicy widzą tylko swoje dane
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_own_data ON users
    FOR ALL TO authenticated_user
    USING (id = current_setting('app.current_user_id')::bigint);

-- donations: Użytkownicy zarządzają tylko swoimi donacjami
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY donations_own_data ON donations
    FOR ALL TO authenticated_user
    USING (user_id = current_setting('app.current_user_id')::bigint);

-- blood_snapshots i rckik: Publiczny dostęp do odczytu
-- (bez RLS lub polityka USING (true) dla SELECT)
```

### 4.3 Triggers i Constraints

**Immutability:**
- `audit_logs`: Blokada UPDATE/DELETE przez trigger

**Soft Delete:**
- `users.deleted_at`
- `donations.deleted_at`

**Timestamps:**
- `created_at`: Automatyczne (DEFAULT NOW())
- `updated_at`: Automatyczne (aplikacja/trigger)

---

## 5. Migracje i Wersjonowanie

### 5.1 Liquibase Changesets

**17 changesetów:**
1. users
2. rckik
3. blood_snapshots
4. user_favorite_rckik
5. donations
6. notification_preferences
7. in_app_notifications
8. email_logs
9. user_tokens
10. user_sessions
11. scraper_runs
12. scraper_logs
13. scraper_configs
14. user_reports
15. audit_logs
16. Dodatkowe indeksy
17. Materialized view

**Historia migracji:**
- Tabela: `databasechangelog`
- Lock: `databasechangeloglock`

### 5.2 Rollback Strategy

Każdy changeset zawiera sekcję `rollback`:
- DROP TABLE
- DROP INDEX
- DROP TRIGGER
- DROP FUNCTION

**Wykonanie rollback:**
```bash
liquibase rollback-count 1
```

---

## 6. Monitoring i Obserwability

### 6.1 Kluczowe Metryki

**Wydajność:**
- Rozmiar tabel i indeksów
- Query execution time
- Index usage statistics
- Connection pool metrics

**Zapytania diagnostyczne:**

```sql
-- Rozmiar tabel
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Wykorzystanie indeksów
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Niewykorzystywane indeksy
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';
```

### 6.2 GCP Cloud Monitoring

**Konfiguracja:**
- Cloud Logging: Agregacja logów PostgreSQL
- Cloud Monitoring: Metryki CPU, RAM, IOPS
- Cloud Trace: Distributed tracing zapytań
- Error Reporting: Błędy aplikacji

---

## 7. Backup i Restore

### 7.1 Strategie Backup

**GCP Cloud SQL:**
- Automatyczne backupy: Codziennie
- Point-in-time recovery: Włączone
- Retencja: 7 dni (configurable)

**Manualne backupy (lokalne):**
```bash
# Full backup
docker exec mkrew-postgres pg_dump -U mkrew_user mkrew > backup_$(date +%Y%m%d).sql

# Schema only
docker exec mkrew-postgres pg_dump -U mkrew_user --schema-only mkrew > schema_$(date +%Y%m%d).sql

# Data only
docker exec mkrew-postgres pg_dump -U mkrew_user --data-only mkrew > data_$(date +%Y%m%d).sql
```

### 7.2 Restore

```bash
# Restore z backup
docker exec -i mkrew-postgres psql -U mkrew_user mkrew < backup_20250108.sql

# Restore volume
docker run --rm \
  -v db_postgres_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres_data_backup_20250108.tar.gz"
```

---

## 8. Zgodność z PRD

### 8.1 Wymagania Funkcjonalne

✅ **3.1 Źródła danych i scraping**
- blood_snapshots, scraper_runs, scraper_logs, scraper_configs
- Metadane: timestamp, URL, parser version

✅ **3.2 Baza danych**
- PostgreSQL z wszystkimi kluczowymi tabelami

✅ **3.3 Uwierzytelnianie i bezpieczeństwo**
- users, user_tokens, user_sessions
- Hasła hashowane (aplikacja)
- TLS (infrastruktura)

✅ **3.4 Dziennik donacji**
- donations z pełną funkcjonalnością
- Soft delete, export ready

✅ **3.5 Dashboard i widoki**
- mv_latest_blood_levels
- blood_snapshots z historią

✅ **3.6 Powiadomienia**
- notification_preferences
- in_app_notifications
- email_logs (tracking)

✅ **3.7 Operacje administracyjne**
- scraper_logs, user_reports
- audit_logs dla krytycznych operacji

✅ **3.8 Prywatność i zgodność**
- Zgody: users.consent_timestamp
- Audit trail: audit_logs (immutable)
- Soft delete dla "right to be forgotten"

### 8.2 User Stories Coverage

| US ID | Tytuł | Tabele |
|-------|-------|--------|
| US-001 | Rejestracja | users, user_tokens |
| US-002 | Weryfikacja email | user_tokens |
| US-003 | Logowanie | users, user_sessions |
| US-004 | Reset hasła | user_tokens |
| US-005 | Edycja profilu | users |
| US-006 | Preferencje powiadomień | notification_preferences |
| US-007 | Lista RCKiK | rckik, mv_latest_blood_levels |
| US-008 | Szczegóły RCKiK | blood_snapshots, scraper_logs |
| US-009 | Ulubione RCKiK | user_favorite_rckik |
| US-010 | Email o niskich stanach | email_logs, notification_preferences |
| US-011 | Powiadomienia in-app | in_app_notifications |
| US-012 | Dodanie donacji | donations |
| US-013 | Edycja/usuwanie donacji | donations, audit_logs |
| US-014 | Eksport dziennika | donations |
| US-015 | Zgoda RODO | users |
| US-016 | Usunięcie danych | users (soft delete), audit_logs |
| US-017 | Manualne parsowanie | scraper_runs, scraper_configs |
| US-018 | Monitoring błędów | scraper_logs, scraper_runs |
| US-019 | Zarządzanie RCKiK | rckik, audit_logs |
| US-020 | Obsługa braku danych | blood_snapshots.is_manual |
| US-021 | Zgłaszanie problemów | user_reports |
| US-022 | Deliverability | email_logs |
| US-023 | Rate limiting | Aplikacja (Bucket4j) |
| US-024 | Audyt | audit_logs |
| US-027 | Potwierdzenie donacji | user_tokens, donations |

---

## 9. Diagram ERD

### 9.1 Lokalizacja
`db/erd-diagram.drawio`

### 9.2 Główne Relacje

**Users → Donations (One-to-Many)**
- users.id → donations.user_id
- ON DELETE CASCADE

**Users → Favorites → RCKiK (Many-to-Many)**
- users.id → user_favorite_rckik.user_id
- rckik.id → user_favorite_rckik.rckik_id
- ON DELETE CASCADE

**RCKiK → Blood Snapshots (One-to-Many)**
- rckik.id → blood_snapshots.rckik_id

**Users → Notifications (One-to-Many)**
- users.id → in_app_notifications.user_id
- users.id → email_logs.user_id
- ON DELETE CASCADE

**Scraper Runs → Scraper Logs (One-to-Many)**
- scraper_runs.id → scraper_logs.scraper_run_id
- ON DELETE CASCADE

### 9.3 Weryfikacja Diagramu

✅ **Poprawność struktury:**
- Wszystkie 15 tabel biznesowych zaimplementowane
- Klucze obce zgodne z changesetami
- ON DELETE CASCADE dla zależnych rekordów
- Materialized view dla wydajności

✅ **Zgodność z implementacją:**
- Typy danych
- Constraints
- Indeksy
- Relacje FK

---

## 10. Deployment

### 10.1 Środowisko Lokalne

```bash
cd db
docker-compose up -d
```

**Weryfikacja:**
```bash
docker-compose logs liquibase
docker exec mkrew-postgres psql -U mkrew_user -d mkrew -c "\dt"
```

### 10.2 Google Cloud Platform

**Cloud SQL for PostgreSQL:**
- Wersja: PostgreSQL 16
- Tier: db-custom-2-8192 (2 vCPU, 8GB RAM) - do optymalizacji
- Storage: SSD, auto-scaling
- Backups: Automatyczne, codziennie, retencja 7 dni
- HA: Włączone (staging/prod)
- Networking: Private IP (VPC)

**Migracje:**
- Cloud Build: Automatyczne wykonanie Liquibase przy deploy
- Artifact Registry: Przechowywanie obrazów Liquibase

**Terraform (Infrastructure as Code):**
```hcl
resource "google_sql_database_instance" "mkrew" {
  name             = "mkrew-postgres-${var.environment}"
  database_version = "POSTGRES_16"
  region           = "europe-central2"

  settings {
    tier = "db-custom-2-8192"

    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_network_id
    }
  }
}
```

---

## 11. Następne Kroki (Post-MVP)

### 11.1 Optymalizacje

1. **Partycjonowanie**
   - blood_snapshots (miesięczne)
   - scraper_logs (tygodniowe)
   - email_logs (miesięczne)

2. **Archiwizacja**
   - Automatyczne przenoszenie starych danych
   - Cloud Storage dla długoterminowego przechowywania

3. **Read Replicas**
   - Cloud SQL read replica dla raportów
   - Rozdzielenie OLTP/OLAP

### 11.2 Nowe Funkcje

1. **PostGIS**
   - Geolokalizacja najbliższych centrów
   - Spatial queries

2. **Full-Text Search**
   - pg_trgm dla fuzzy search
   - tsvector dla wyszukiwania w notatkach donacji

3. **TimescaleDB**
   - Rozszerzenie dla time-series (snapshoty)
   - Continuous aggregates

### 11.3 Skalowanie

- Connection pooling: PgBouncer
- Query optimization: pg_stat_statements
- Caching: Application-level (Spring Cache)

---

## 12. Changelog

| Data | Wersja | Zmiany |
|------|--------|--------|
| 2025-11-08 | 1.0 | Inicjalna wersja - 17 changesetów zaimplementowanych |

---

## 13. Kontakt i Wsparcie

**Dokumentacja:**
- README: `db/README.md`
- Quickstart: `db/QUICKSTART.md`
- Tech Stack: `.ai/tech-stack.md`
- PRD: `.ai/prd.md`

**Repositorium:**
- GitHub: TBD
- Changesets: `db/changelog/changesets/`

---

**Status: ✅ READY FOR MVP DEVELOPMENT**

Baza danych została w pełni zaimplementowana i przetestowana. Wszystkie 17 changesetów wykonane pomyślnie. Schemat zgodny z PRD i wymaganiami funkcjonalnymi.
