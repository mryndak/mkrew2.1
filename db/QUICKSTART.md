# Szybki start - Baza danych mkrew

## Krok 1: Uruchom bazę danych

```bash
cd db
docker-compose up -d
```

Poczekaj chwilę, aż wszystkie usługi się uruchomią.

## Krok 2: Sprawdź logi Liquibase

```bash
docker-compose logs liquibase
```

Powinieneś zobaczyć:
```
liquibase  | Liquibase command 'update' was executed successfully.
```

## Krok 3: Weryfikuj schemat

```bash
# Połącz się z bazą danych
docker exec -it mkrew-postgres psql -U mkrew_user -d mkrew
```

W konsoli PostgreSQL wykonaj:

```sql
-- Lista wszystkich tabel
\dt

-- Powinieneś zobaczyć:
--  audit_logs
--  blood_snapshots
--  databasechangelog
--  databasechangeloglock
--  donations
--  email_logs
--  in_app_notifications
--  notification_preferences
--  rckik
--  scraper_configs
--  scraper_logs
--  scraper_runs
--  user_favorite_rckik
--  user_reports
--  user_sessions
--  user_tokens
--  users

-- Sprawdź materialized view
\dm

-- Powinieneś zobaczyć:
--  mv_latest_blood_levels

-- Historia migracji
SELECT id, author, filename, orderexecuted
FROM databasechangelog
ORDER BY orderexecuted;

-- Wyjdź
\q
```

## Krok 4: Otwórz pgAdmin (opcjonalnie)

1. Otwórz przeglądarkę: http://localhost:5050
2. Zaloguj się:
   - Email: `admin@mkrew.pl`
   - Hasło: `admin`
3. Dodaj serwer:
   - Name: `mkrew-local`
   - Host: `postgres` (nazwa kontenera w sieci Docker)
   - Port: `5432`
   - Database: `mkrew`
   - Username: `mkrew_user`
   - Password: `mkrew_password`

## Krok 5: Testuj bazę (opcjonalnie)

```bash
docker exec -it mkrew-postgres psql -U mkrew_user -d mkrew
```

```sql
-- Dodaj testowe RCKiK
INSERT INTO rckik (name, code, city, active)
VALUES ('RCKiK Warszawa', 'WAW', 'Warszawa', true);

-- Sprawdź
SELECT * FROM rckik;

-- Dodaj testowy snapshot
INSERT INTO blood_snapshots (rckik_id, snapshot_date, blood_group, level_percentage)
VALUES (1, CURRENT_DATE, 'A+', 75.5);

-- Sprawdź
SELECT * FROM blood_snapshots;

-- Sprawdź materialized view
SELECT * FROM mv_latest_blood_levels;

-- Odśwież materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_blood_levels;

-- Wyjdź
\q
```

## Rozwiązywanie problemów

### Problem: Liquibase nie uruchomił się

```bash
# Sprawdź logi
docker-compose logs liquibase

# Uruchom ponownie
docker-compose up liquibase
```

### Problem: PostgreSQL nie jest gotowy

```bash
# Sprawdź status
docker-compose ps

# Sprawdź logi PostgreSQL
docker-compose logs postgres

# Restart wszystkiego
docker-compose down
docker-compose up -d
```

### Problem: Chcę zacząć od nowa

```bash
# UWAGA: To usunie wszystkie dane!
docker-compose down -v
docker-compose up -d
```

## Zatrzymanie

```bash
# Zatrzymaj bez usuwania danych
docker-compose down

# Zatrzymaj i usuń WSZYSTKIE dane
docker-compose down -v
```

## Status usług

```bash
# Sprawdź status kontenerów
docker-compose ps

# Sprawdź logi wszystkich usług
docker-compose logs

# Sprawdź logi konkretnej usługi
docker-compose logs postgres
docker-compose logs liquibase
docker-compose logs pgadmin
```

## Co dalej?

1. Skonfiguruj aplikację Spring Boot do używania tej bazy
2. Dodaj dane testowe (RCKiK, użytkownicy)
3. Zaimplementuj scraper
4. Zobacz pełną dokumentację w `README.md`
