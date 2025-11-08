# mkrew Database Setup

## Struktura katalogów

```
db/
├── docker-compose.yml          # Docker Compose dla PostgreSQL i pgAdmin
├── changelog/
│   ├── db.changelog-master.yaml  # Główny plik Liquibase
│   └── changesets/               # Poszczególne changesets
│       ├── 001-create-users-table.yaml
│       ├── 002-create-rckik-table.yaml
│       ├── 003-create-blood-snapshots-table.yaml
│       ├── 004-create-user-favorite-rckik-table.yaml
│       ├── 005-create-donations-table.yaml
│       ├── 006-create-notification-preferences-table.yaml
│       ├── 007-create-in-app-notifications-table.yaml
│       ├── 008-create-email-logs-table.yaml
│       ├── 009-create-user-tokens-table.yaml
│       ├── 010-create-user-sessions-table.yaml
│       ├── 011-create-scraper-runs-table.yaml
│       ├── 012-create-scraper-logs-table.yaml
│       ├── 013-create-scraper-configs-table.yaml
│       ├── 014-create-user-reports-table.yaml
│       ├── 015-create-audit-logs-table.yaml
│       ├── 016-create-indexes.yaml
│       └── 017-create-materialized-view.yaml
├── erd-diagram.drawio          # Diagram ERD (Draw.io)
└── README.md                   # Ten plik
```

## Uruchomienie bazy danych

### 1. Uruchomienie PostgreSQL, Liquibase i pgAdmin

```bash
cd db
docker-compose up -d
```

**Automatyczna inicjalizacja:**
Po uruchomieniu docker-compose:
1. PostgreSQL wystartuje i utworzy bazę danych `mkrew`
2. Liquibase automatycznie wykona wszystkie migracje z `changelog/`
3. Schemat bazy danych zostanie w pełni zainicjalizowany

Sprawdzenie statusu migracji:
```bash
# Logi Liquibase
docker-compose logs liquibase

# Status kontenera (powinien zakończyć się sukcesem)
docker-compose ps liquibase
```

Usługi:
- **PostgreSQL**: `localhost:5432`
  - Database: `mkrew`
  - User: `mkrew_user`
  - Password: `mkrew_password`
  - **Volume**: `postgres_data` (dane persystowane lokalnie)
- **Liquibase**: Kontener jednorazowy (uruchamia migracje i kończy)
- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@mkrew.pl`
  - Password: `admin`

### 2. Weryfikacja schematu bazy danych

```bash
# Połącz się z bazą danych
docker exec -it mkrew-postgres psql -U mkrew_user -d mkrew

# Sprawdź listę tabel
\dt

# Sprawdź historię migracji Liquibase
SELECT id, author, filename, dateexecuted, orderexecuted
FROM databasechangelog
ORDER BY orderexecuted DESC;

# Wyjście z psql
\q
```

### 3. Ponowne uruchomienie migracji

Jeśli chcesz ponownie uruchomić Liquibase (np. po dodaniu nowego changeset):

```bash
docker-compose up liquibase
```

### 4. Zatrzymanie usług

```bash
docker-compose down
```

**Uwaga:** To zatrzyma kontenery, ale **nie usunie danych**. Dane są przechowywane w volume `postgres_data`.

### 5. Zatrzymanie i usunięcie WSZYSTKICH danych

```bash
docker-compose down -v
```

**UWAGA:** Flaga `-v` usunie volume z danymi. Baza danych zostanie całkowicie wyczyszczona!

## Migracje Liquibase

### Uruchomienie migracji z poziomu aplikacji Spring Boot

W pliku `application.yml` dodaj konfigurację:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mkrew
    username: mkrew_user
    password: mkrew_password
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.yaml
    enabled: true
```

### Uruchomienie migracji z CLI Liquibase

1. Utwórz plik `liquibase.properties`:

```properties
changeLogFile=changelog/db.changelog-master.yaml
url=jdbc:postgresql://localhost:5432/mkrew
username=mkrew_user
password=mkrew_password
driver=org.postgresql.Driver
```

2. Uruchom migracje:

```bash
liquibase update
```

### Rollback migracji

```bash
liquibase rollback-count 1
```

## Struktura bazy danych

### Tabele główne

1. **users** - Konta użytkowników
   - Przechowuje dane osobowe, grupę krwi (niezaszyfrowaną), zgody
   - Soft delete (`deleted_at`)

2. **rckik** - Centra krwiodawstwa
   - Kanoniczna lista RCKiK
   - Współrzędne geograficzne dla przyszłych funkcji
   - Aliasy w formacie array

3. **blood_snapshots** - Snapshoty stanów krwi
   - Poziom krwi w % (0-100)
   - Metadane scrapingu
   - Możliwość partycjonowania po dacie

### Tabele relacyjne

4. **user_favorite_rckik** - Ulubione centra użytkowników (M2M)
5. **donations** - Dziennik donacji użytkowników
6. **notification_preferences** - Preferencje powiadomień
7. **in_app_notifications** - Powiadomienia in-app
8. **email_logs** - Tracking wysyłki e-maili
9. **user_tokens** - Tokeny weryfikacji/resetu hasła
10. **user_sessions** - Sesje użytkowników (JWT tracking)

### Tabele scrapingu

11. **scraper_runs** - Batch runs scrapingu
12. **scraper_logs** - Logi pojedynczych operacji
13. **scraper_configs** - Konfiguracja scraperów (CSS selectors w JSONB)

### Tabele audytu

14. **user_reports** - Zgłoszenia problemów z danymi
15. **audit_logs** - Immutable audit trail
    - Trigger blokujący UPDATE/DELETE

### Widoki materializowane

16. **mv_latest_blood_levels** - Najnowsze stany krwi dla dashboardu
    - Odświeżanie: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_blood_levels;`
    - Powinno być uruchamiane po każdym scrapingu

## Diagram ERD

Plik `erd-diagram.drawio` można otworzyć w:
- **Draw.io Desktop**: https://github.com/jgraph/drawio-desktop/releases
- **Draw.io Online**: https://app.diagrams.net/

## Optymalizacje wydajności

### Indeksy

- Composite indexes dla często używanych zapytań
- Partial indexes dla aktywnych użytkowników i nieprzeczytanych powiadomień
- GIN indexes dla JSONB i array columns

### Partycjonowanie (do rozważenia w przyszłości)

Tabele kandydujące do partycjonowania:
- `blood_snapshots` - po `snapshot_date` (miesięczne)
- `scraper_logs` - po `created_at` (tygodniowe/miesięczne)
- `audit_logs` - po `created_at` (kwartalne)
- `email_logs` - po `sent_at` (miesięczne)

### Materialized views

- `mv_latest_blood_levels` - automatyczne odświeżanie po scrapingu
- CONCURRENTLY refresh pozwala na odświeżanie bez blokowania odczytów

## Zarządzanie Volume i danymi

### Lokalizacja Volume

Docker volume `postgres_data` przechowuje wszystkie dane PostgreSQL. Lokalizacja zależy od systemu operacyjnego:

**Windows (WSL2):**
```bash
\\wsl$\docker-desktop-data\data\docker\volumes\db_postgres_data\_data
```

**Linux:**
```bash
/var/lib/docker/volumes/db_postgres_data/_data
```

**macOS:**
```bash
~/Library/Containers/com.docker.docker/Data/vms/0/data/docker/volumes/db_postgres_data/_data
```

### Sprawdzenie Volume

```bash
# Lista volumes
docker volume ls

# Szczegóły volume postgres_data
docker volume inspect db_postgres_data

# Rozmiar volume
docker system df -v | grep postgres_data
```

### Backup Volume

```bash
# Backup całego volume do tar.gz
docker run --rm \
  -v db_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data_backup_$(date +%Y%m%d).tar.gz -C /data .

# Restore z backup
docker run --rm \
  -v db_postgres_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres_data_backup_20250108.tar.gz"
```

### Czyszczenie i reset

```bash
# Zatrzymaj wszystko i usuń volume (UWAGA: dane zostaną usunięte!)
docker-compose down -v

# Usuń tylko volume postgres_data
docker volume rm db_postgres_data

# Usuń nieużywane volumes
docker volume prune
```

## Bezpieczeństwo

### Row Level Security (RLS)

W przyszłych iteracjach można włączyć RLS dla:
- `users` - użytkownicy widzą tylko swoje dane
- `donations` - użytkownicy widzą tylko swoje donacje
- `user_favorite_rckik` - użytkownicy zarządzają tylko swoimi ulubionymi

Przykład polityki:

```sql
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY donations_user_policy ON donations
    FOR ALL
    TO authenticated_user
    USING (user_id = current_setting('app.current_user_id')::bigint);
```

### Immutability

- `audit_logs` - trigger blokujący modyfikacje
- Wszystkie operacje tylko INSERT

## Retencja danych

- `scraper_logs`: 90 dni
- `email_logs`: 90 dni (szczegóły), agregacje na stałe
- `in_app_notifications`: auto-czyszczenie przeczytanych (>30 dni)
- `user_tokens`: auto-czyszczenie wygasłych tokenów

## Backup i restore

### Backup

```bash
docker exec mkrew-postgres pg_dump -U mkrew_user mkrew > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
docker exec -i mkrew-postgres psql -U mkrew_user mkrew < backup_20250108.sql
```

## Monitoring

### Przydatne zapytania

Sprawdzenie rozmiaru tabel:

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

Sprawdzenie wykorzystania indeksów:

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Wsparcie

W razie problemów sprawdź:
1. Logi PostgreSQL: `docker-compose logs postgres`
2. Status migracji Liquibase: tabela `databasechangelog`
3. Połączenie z bazą: `docker exec -it mkrew-postgres psql -U mkrew_user -d mkrew`
