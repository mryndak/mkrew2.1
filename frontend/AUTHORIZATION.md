# System Autoryzacji i Autentykacji - mkrew Frontend

## Przegląd

Aplikacja mkrew wykorzystuje JWT (JSON Web Tokens) do autentykacji i autoryzacji użytkowników. System obsługuje dwie role użytkowników:
- **USER** - zwykły użytkownik (dawca krwi)
- **ADMIN** - administrator systemu

## Struktura JWT Token

Token JWT zawiera następujące pola w payload:

```typescript
{
  sub: string;      // User ID
  email: string;    // User email
  role: UserRole;   // 'USER' | 'ADMIN'
  iat: number;      // Issued at (timestamp w sekundach)
  exp: number;      // Expiration (timestamp w sekundach)
}
```

## Przechowywanie tokenu

Token JWT jest przechowywany w **HTTP-only cookie** o nazwie `accessToken`. To zapewnia:
- Bezpieczeństwo przed atakami XSS (JavaScript nie ma dostępu do cookie)
- Automatyczne wysyłanie tokenu z każdym requestem do backendu
- Obsługę przez Astro SSR i middleware

## Architektura zabezpieczeń

### 1. Middleware (`src/middleware.ts`)

Middleware Astro działa przed każdym requestem i weryfikuje:
1. Czy użytkownik jest zalogowany (ma ważny token)
2. Czy użytkownik ma odpowiednią rolę dla chronionego zasobu

**Chronione ścieżki:**
- `/admin/*` - Wymaga roli ADMIN
- `/dashboard/*` - Wymaga autentykacji (USER lub ADMIN)
- `/profile` - Wymaga autentykacji (USER lub ADMIN)

**Publiczne ścieżki:**
- `/` - Strona główna
- `/login` - Logowanie
- `/register` - Rejestracja
- `/rckik` - Lista centrów RCKiK
- `/rckik/[id]` - Szczegóły centrum
- `/verify-email` - Weryfikacja emaila
- `/password-reset/*` - Reset hasła

### 2. AdminLayout (`src/layouts/AdminLayout.astro`)

Dodatkowa warstwa zabezpieczeń na poziomie layoutu:
1. Sprawdza czy token istnieje
2. Sprawdza czy token jest ważny (nie wygasł)
3. Sprawdza czy użytkownik ma rolę ADMIN
4. Przekierowuje na odpowiednią stronę w przypadku błędu

**Diagram przepływu:**
```
Request → Middleware → AdminLayout → Content
   ↓           ↓            ↓
No token?  No ADMIN?   No ADMIN?
   ↓           ↓            ↓
/login    /unauthorized  /unauthorized
```

### 3. JWT Utilities (`src/lib/auth/jwt.ts`)

Zestaw funkcji pomocniczych do pracy z JWT:

#### `decodeJWT(token: string): JWTPayload | null`
Dekoduje token JWT (Base64) i zwraca payload.
**UWAGA:** Tylko dekoduje, NIE weryfikuje podpisu! Weryfikacja musi być wykonana na backendzie.

#### `isTokenExpired(token: string | JWTPayload): boolean`
Sprawdza czy token wygasł.

#### `getRoleFromToken(token: string): UserRole | null`
Zwraca rolę użytkownika z tokenu.

#### `isAdmin(token: string): boolean`
Sprawdza czy użytkownik ma rolę ADMIN.

#### `isAuthenticated(token: string | null): boolean`
Sprawdza czy użytkownik jest zalogowany (ma ważny, niewygasły token).

#### `getUserIdFromToken(token: string): string | null`
Zwraca ID użytkownika z tokenu.

#### `getEmailFromToken(token: string): string | null`
Zwraca email użytkownika z tokenu.

#### `getTokenExpiration(token: string): number | null`
Zwraca timestamp wygaśnięcia tokenu (w milisekundach).

#### `getTimeUntilExpiration(token: string): number | null`
Zwraca czas do wygaśnięcia tokenu (w milisekundach).

## Przepływ autentykacji

### Logowanie

1. Użytkownik wypełnia formularz logowania (`/login`)
2. Frontend wysyła POST `/api/v1/auth/login` do backendu
3. Backend weryfikuje dane i zwraca JWT token
4. Frontend zapisuje token w HTTP-only cookie
5. Użytkownik jest przekierowywany na dashboard

### Dostęp do zasobów chronionych

1. Użytkownik próbuje otworzyć `/admin`
2. **Middleware** sprawdza:
   - Czy token istnieje w cookies
   - Czy token nie wygasł
   - Czy użytkownik ma rolę ADMIN
3. **AdminLayout** ponownie weryfikuje (defense in depth):
   - Czy token jest ważny
   - Czy użytkownik ma rolę ADMIN
4. Jeśli wszystko OK → wyświetl stronę
5. Jeśli błąd → przekieruj na:
   - `/login` - brak tokenu lub token wygasł
   - `/unauthorized` - brak roli ADMIN

### Wylogowanie

1. Użytkownik klika "Wyloguj"
2. Frontend wywołuje POST `/api/v1/auth/logout`
3. Backend invaliduje token (jeśli używa blacklist/sessions)
4. Frontend usuwa cookie z tokenem
5. Użytkownik jest przekierowywany na stronę główną

## Bezpieczeństwo

### Defense in Depth (Obrona wielowarstwowa)

System implementuje **wielowarstwową obronę**:
1. **Middleware** - pierwsza warstwa, blokuje nieautoryzowane requesty
2. **Layout** - druga warstwa, dodatkowa weryfikacja
3. **Backend API** - trzecia warstwa, finalna weryfikacja (najważniejsza!)

**Dlaczego to ważne?**
- Middleware może być ominięty przez bezpośredni dostęp do API
- Layout może być ominięty przez błędy w routing
- Backend zawsze weryfikuje token i rolę

### Ważne zasady bezpieczeństwa

1. **Nigdy nie ufaj frontendowi** - Frontend zawsze może być zmanipulowany. Backend musi weryfikować wszystko.

2. **JWT nie jest szyfrowany** - Token można zdekodować bez klucza. Nie przechowuj wrażliwych danych w payload.

3. **HTTP-only cookies** - Zabezpieczają przed XSS. JavaScript nie ma dostępu do tokenu.

4. **Krótki TTL** - Token wygasa po 1 godzinie. Wymusza ponowne logowanie.

5. **Brak przechowywania hasła** - Hasła nigdy nie są przechowywane w frontend (localStorage, sessionStorage, pamięci).

6. **Logging prób nieautoryzowanego dostępu** - System loguje wszystkie próby dostępu do panelu admin przez użytkowników bez uprawnień.

## Obsługa błędów

### Token wygasł
```
Request → Middleware → /login?redirect=/admin&session_expired=true
```
Użytkownik widzi komunikat: "Sesja wygasła. Zaloguj się ponownie."

### Brak roli ADMIN
```
Request → Middleware → /unauthorized?message=...&returnUrl=/
```
Użytkownik widzi stronę 403 z komunikatem o braku uprawnień.

### Nieprawidłowy token
```
Request → AdminLayout → /login?redirect=/admin
```
Token jest invalid/corrupted → przekierowanie na login.

## Testowanie

### Jak przetestować zabezpieczenia?

1. **Test 1: Dostęp bez logowania**
   - Otwórz `/admin` bez logowania
   - Oczekiwany rezultat: Przekierowanie na `/login?redirect=/admin`

2. **Test 2: Dostęp jako USER**
   - Zaloguj się jako zwykły użytkownik (rola USER)
   - Spróbuj otworzyć `/admin`
   - Oczekiwany rezultat: Przekierowanie na `/unauthorized`

3. **Test 3: Dostęp jako ADMIN**
   - Zaloguj się jako administrator (rola ADMIN)
   - Otwórz `/admin`
   - Oczekiwany rezultat: Wyświetlenie panelu administracyjnego

4. **Test 4: Token wygasł**
   - Zaloguj się i poczekaj 1 godzinę (lub zmień exp w tokenie)
   - Odśwież stronę `/admin`
   - Oczekiwany rezultat: Przekierowanie na `/login?session_expired=true`

### Debug

Włącz console logging w `src/lib/auth/jwt.ts`:
```typescript
console.log('Decoded JWT:', payload);
console.log('Is Admin:', isAdmin);
```

Sprawdź logi middleware w konsoli serwera Astro.

## Przyszłe rozszerzenia

- **Refresh tokens** - Automatyczne odświeżanie tokenu przed wygaśnięciem
- **Token blacklist** - Lista unieważnionych tokenów (po wylogowaniu)
- **Multi-factor authentication (MFA)** - Dwuskładnikowa autentykacja
- **Role-based access control (RBAC)** - Więcej ról (np. MODERATOR, EDITOR)
- **Session management** - Aktywne sesje użytkownika, wylogowanie na wszystkich urządzeniach
- **Rate limiting** - Ochrona przed brute-force attacks
- **CAPTCHA** - Po wielu nieudanych próbach logowania

## Kontakt

W razie pytań lub problemów z autoryzacją, skontaktuj się z zespołem backend.
