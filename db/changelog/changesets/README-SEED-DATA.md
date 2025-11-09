# Seed Data Changesets

## Changesets 018-019: Initial RCKiK Data

Utworzono: 2025-11-09

### Changeset 018: Dane RCKiK (seed-rckik-data.yaml)

Dodaje dane inicjalne dla wszystkich 21 Regionalnych Centrów Krwiodawstwa i Krwiolecznictwa w Polsce.

**Zawartość:**
- 21 rekordów w tabeli `rckik`
- Pełne dane geograficzne (szerokość/długość geograficzna)
- Adresy i dane kontaktowe
- Aliasy dla ułatwienia wyszukiwania

**Lista centrów:**
1. Warszawa (RCKIK-WAW)
2. Kraków (RCKIK-KRK)
3. Wrocław (RCKIK-WRO)
4. Poznań (RCKIK-POZ)
5. Gdańsk (RCKIK-GDA)
6. Katowice (RCKIK-KAT)
7. Łódź (RCKIK-LOD)
8. Lublin (RCKIK-LUB)
9. Białystok (RCKIK-BIA)
10. Szczecin (RCKIK-SZC)
11. Kielce (RCKIK-KIE)
12. Rzeszów (RCKIK-RZE)
13. Bydgoszcz (RCKIK-BYD)
14. Olsztyn (RCKIK-OLS)
15. Zielona Góra (RCKIK-ZGO)
16. Kalisz (RCKIK-KAL)
17. Radom (RCKIK-RAD)
18. Opole (RCKIK-OPO)
19. Słupsk (RCKIK-SLU)
20. Wałbrzych (RCKIK-WAL)
21. Racibórz (RCKIK-RAC)

**Struktura danych:**
```yaml
- name: Pełna nazwa centrum
- code: Unikalny kod (RCKIK-XXX)
- city: Miasto
- address: Pełny adres
- latitude: Szerokość geograficzna
- longitude: Długość geograficzna
- aliases: Array alternatywnych nazw
- active: true (wszystkie aktywne)
```

### Changeset 019: Konfiguracje Scraperów (seed-scraper-configs.yaml)

Dodaje konfiguracje scraperów dla wszystkich centrów RCKiK do tabeli `scraper_configs`.

**Zawartość:**
- 21 rekordów konfiguracji scraperów
- URL-e stron źródłowych
- Selektory CSS dla parsowania (przykładowe)
- Status aktywności

**Status konfiguracji:**
- **Aktywne** (5 głównych centrów z przykładowymi selektorami):
  - Warszawa
  - Kraków
  - Wrocław
  - Poznań
  - Gdańsk

- **Nieaktywne** (16 centrów - do weryfikacji URL-i):
  - Pozostałe centra mają podstawowe URL-e, ale wymagają weryfikacji
  - Konfiguracje można aktywować po potwierdzeniu poprawności URL-i i selektorów CSS

**Uwaga:**
CSS selektory są przykładowe i wymagają dostosowania do rzeczywistej struktury stron internetowych każdego RCKiK.

### Uruchomienie migracji

```bash
cd db
docker compose up -d
```

Liquibase automatycznie wykona nowe changesets po uruchomieniu.

### Weryfikacja danych

```sql
-- Sprawdź liczbę centrów RCKiK
SELECT COUNT(*) FROM rckik;
-- Powinno zwrócić: 21

-- Sprawdź konfiguracje scraperów
SELECT r.name, r.code, sc.source_url, sc.active
FROM rckik r
LEFT JOIN scraper_configs sc ON r.id = sc.rckik_id
ORDER BY r.city;

-- Sprawdź aktywne konfiguracje
SELECT COUNT(*) FROM scraper_configs WHERE active = true;
-- Powinno zwrócić: 5
```

### Rollback

W razie potrzeby cofnięcia zmian:

```bash
cd db
docker compose run liquibase rollback-count 2
```

### Następne kroki

1. **Weryfikacja URL-i** - Sprawdź czy strony RCKiK rzeczywiście istnieją pod podanymi adresami
2. **Dostosowanie selektorów CSS** - Przeanalizuj strukturę HTML każdej strony i zaktualizuj selektory
3. **Aktywacja scraperów** - Po weryfikacji ustaw `active=true` dla pozostałych centrów
4. **Testowanie scraperów** - Przeprowadź testy pobierania danych dla każdego centrum
5. **Dodanie danych kontaktowych** - Rozważ rozszerzenie tabeli rckik o pola: telefon, email, strona WWW

### Źródła danych

Dane geograficzne i adresy zostały zebrane z publicznych źródeł:
- Oficjalne strony internetowe RCKiK
- Dane geolokalizacyjne (OpenStreetMap/Google Maps)
- Lista RCKiK według NFZ

### Zgodność z PRD

Te changesets wspierają następujące User Stories:
- **US-007**: Przegląd listy RCKiK i stanów krwi
- **US-008**: Szczegóły RCKiK
- **US-009**: Oznaczanie ulubionych RCKiK
- **US-017**: Manualne uruchomienie parsowania
- **US-019**: Zarządzanie kanoniczną listą RCKiK
