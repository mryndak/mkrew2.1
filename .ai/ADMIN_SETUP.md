# Konfiguracja Roli ADMIN - mkrew

## Przegląd

System mkrew obsługuje dwie role użytkowników:
- **USER** - Zwykły użytkownik (dawca krwi) - domyślna rola
- **ADMIN** - Administrator systemu z pełnym dostępem do panelu administracyjnego

## Migracje Bazy Danych

Struktura roli ADMIN została dodana przez następujące migracje Liquibase:

### Changeset 021: Dodanie kolumny `role`
- Dodano kolumnę `role` do tabeli `users`
- Wartości: 'USER' (domyślna) lub 'ADMIN'
- Check constraint dla walidacji wartości
- Indeks na kolumnie role

### Changeset 022: Utworzenie użytkownika admin
- Dodano inicjalnego użytkownika z rolą ADMIN
- Email: `admin@mkrew.pl`
- Hasło: `Admin123!` (⚠️ **ZMIEŃ NATYCHMIAST PO PIERWSZYM LOGOWANIU!**)

## Uruchomienie Migracji

### Sposób 1: Docker Compose (Zalecany)

```bash
cd db
docker-compose up -d postgres
docker-compose up liquibase
```

### Sposób 2: Przy starcie aplikacji Spring Boot

Aplikacja automatycznie wykona migracje przy starcie jeśli są skonfigurowane.

```bash
cd backend
./mvnw spring-boot:run
```

## Pierwsze Logowanie jako Admin

### 1. Zaloguj się na konto admin

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "admin@mkrew.pl",
  "password": "Admin123!"
}
```

**Przykład cURL:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mkrew.pl",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "...",
  "user": {
    "id": 1,
    "email": "admin@mkrew.pl",
    "firstName": "System",
    "lastName": "Administrator",
    "bloodGroup": null,
    "emailVerified": true,
    "role": "ADMIN"
  }
}
```

### 2. Weryfikuj token JWT

Token JWT zawiera claim `role` z wartością `ADMIN`:

```json
{
  "sub": "1",
  "email": "admin@mkrew.pl",
  "role": "ADMIN",
  "iat": 1704715200,
  "exp": 1704718800
}
```

### 3. Dostęp do Admin Endpoints

Wszystkie endpointy admin wymagają:
- Ważnego JWT tokenu (Bearer Token w header Authorization)
- Roli ADMIN

**Przykład żądania:**
```bash
curl -X GET http://localhost:8080/api/v1/admin/rckik \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Endpointy Admina

### `/api/v1/admin/rckik` - Zarządzanie centrami RCKiK
- `GET /api/v1/admin/rckik` - Lista wszystkich centrów (w tym nieaktywnych)
- `POST /api/v1/admin/rckik` - Utworzenie nowego centrum
- `PUT /api/v1/admin/rckik/{id}` - Aktualizacja centrum
- `DELETE /api/v1/admin/rckik/{id}` - Dezaktywacja centrum

### `/api/v1/admin/scraper` - Monitoring scrapera
- `GET /api/v1/admin/scraper/runs` - Historia wykonań scrapera
- `POST /api/v1/admin/scraper/runs` - Ręczne uruchomienie scrapera
- `GET /api/v1/admin/scraper/logs` - Logi scrapera

### `/api/v1/admin/reports` - Zarządzanie zgłoszeniami
- `GET /api/v1/admin/reports` - Lista zgłoszeń użytkowników
- `PATCH /api/v1/admin/reports/{id}` - Aktualizacja statusu zgłoszenia

### `/api/v1/admin/audit-logs` - Logi audytu
- `GET /api/v1/admin/audit-logs` - Historia operacji krytycznych

## Zmiana Hasła Admina

⚠️ **WAŻNE: Zmień domyślne hasło natychmiast po pierwszym logowaniu!**

### Sposób 1: Przez endpoint password reset

1. Request password reset dla `admin@mkrew.pl`
2. Sprawdź logi aplikacji dla tokenu resetu (w development)
3. Ustaw nowe hasło

### Sposób 2: Bezpośrednio w bazie danych

```sql
-- Wygeneruj BCrypt hash dla nowego hasła (użyj PasswordHashGenerator.java)
UPDATE users
SET password_hash = '$2a$12$NOWY_HASH_HASLA'
WHERE email = 'admin@mkrew.pl';
```

### Sposób 3: Użyj PasswordHashGenerator

```bash
cd backend
mvn exec:java -Dexec.mainClass="pl.mkrew.backend.util.PasswordHashGenerator"
```

Skopiuj wygenerowany hash i zaktualizuj w bazie danych.

## Bezpieczeństwo

### Spring Security Configuration

System używa:
- **JWT Tokens** - Stateless authentication
- **@PreAuthorize("hasRole('ADMIN')")** - Method-level security na kontrolerach admin
- **@EnableMethodSecurity** - Włączone w SecurityConfig

### Weryfikacja Roli

1. **Frontend Middleware** (Astro) - Pierwsza warstwa obrony
   - Sprawdza JWT token i rolę
   - Przekierowuje nieautoryzowanych użytkowników

2. **Spring Security Filter** (JwtAuthenticationFilter) - Druga warstwa
   - Parsuje JWT token
   - Ustawia `Authentication` z authorities `ROLE_ADMIN` lub `ROLE_USER`

3. **@PreAuthorize** - Trzecia warstwa
   - Weryfikuje rolę przed wykonaniem metody kontrolera
   - Zwraca 403 Forbidden jeśli brak uprawnień

## Tworzenie Nowych Adminów

### Opcja 1: Przez SQL (Development)

```sql
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  email_verified,
  role,
  consent_timestamp,
  consent_version
) VALUES (
  'nowy.admin@mkrew.pl',
  '$2a$12$HASH_HASLA',  -- Wygeneruj przez PasswordHashGenerator
  'Jan',
  'Kowalski',
  true,
  'ADMIN',
  CURRENT_TIMESTAMP,
  '1.0'
);
```

### Opcja 2: Przez Endpoint (Future Implementation)

**TODO:** Implement `POST /api/v1/admin/users` endpoint for creating admin users

## Testowanie

### Test 1: Logowanie jako Admin
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@mkrew.pl", "password": "Admin123!"}'
```

### Test 2: Dostęp do Admin Endpoint
```bash
TOKEN="YOUR_JWT_TOKEN"
curl -X GET http://localhost:8080/api/v1/admin/rckik \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Zwykły USER nie ma dostępu (403)
```bash
# Zaloguj się jako zwykły user
TOKEN_USER="USER_JWT_TOKEN"

# Próba dostępu do admin endpoint (powinno zwrócić 403)
curl -X GET http://localhost:8080/api/v1/admin/rckik \
  -H "Authorization: Bearer $TOKEN_USER"
```

## Troubleshooting

### Problem: Admin nie może się zalogować

**Rozwiązanie:**
1. Sprawdź czy migracja 022 została wykonana: `SELECT * FROM users WHERE email = 'admin@mkrew.pl';`
2. Sprawdź czy role jest ustawiona na 'ADMIN'
3. Sprawdź logi aplikacji dla błędów BCrypt

### Problem: 403 Forbidden na admin endpoints

**Rozwiązanie:**
1. Sprawdź JWT token - czy zawiera `"role": "ADMIN"`
2. Sprawdź SecurityConfig - czy `@EnableMethodSecurity` jest włączone
3. Sprawdź kontroler - czy ma adnotację `@PreAuthorize("hasRole('ADMIN')")`

### Problem: Token wygasł

**Rozwiązanie:**
1. Zaloguj się ponownie aby otrzymać nowy token
2. Domyślny TTL to 1 godzina (3600 sekund)

## Dokumentacja API

Pełna dokumentacja API dostępna pod:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Wsparcie

W razie problemów:
1. Sprawdź logi aplikacji Spring Boot
2. Sprawdź logi Liquibase
3. Sprawdź tabelę `databasechangelog` w PostgreSQL
4. Skontaktuj się z zespołem backend
