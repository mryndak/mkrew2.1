# Plan implementacji widoku Weryfikacji E-mail

## 1. Przegląd

Widok weryfikacji e-mail jest kluczowym elementem procesu rejestracji użytkownika w aplikacji mkrew. Po rejestracji użytkownik otrzymuje email z linkiem weryfikacyjnym zawierającym jednorazowy token. Kliknięcie linku prowadzi do strony weryfikacji, która automatycznie przetwarza token i aktywuje konto użytkownika. Widok obsługuje różne stany (loading, sukces, błędy) i zapewnia przyjazne UX dla użytkownika, w tym możliwość ponownego wysłania emaila weryfikacyjnego w przypadku wygaśnięcia tokenu.

**Główne cele:**
- Automatyczna weryfikacja adresu email przy użyciu tokenu z URL
- Aktywacja konta użytkownika (ustawienie `email_verified=true`)
- Obsługa różnych scenariuszy (sukces, błędy, wygasły token)
- Zapewnienie bezpieczeństwa (usunięcie tokenu z URL history)
- Umożliwienie ponownego wysłania emaila weryfikacyjnego
- Zgodność z US-002 z PRD

## 2. Routing widoku

**Ścieżka:** `/verify-email`

**Query Parameters:**
- `token` (wymagany) - token weryfikacyjny z emaila

**Przykładowy URL:** `https://mkrew.pl/verify-email?token=abc123def456...`

**Typ renderowania:** SSR (Server-Side Rendering)

**Layout:** `AuthLayout.astro` - dedykowany layout dla stron autentykacji

**Przekierowania:**
- Po sukcesie → `/login?verified=true`
- Po błędzie (token nieprawidłowy) → opcja powrotu do `/register`
- Jeśli już zweryfikowany → `/login`

## 3. Struktura komponentów

```
verify-email.astro (SSR page)
└── AuthLayout.astro
    └── VerificationStatus (React island, client:load)
        ├── LoadingState
        │   ├── Spinner
        │   └── Text ("Weryfikacja w toku...")
        ├── SuccessState
        │   ├── Icon (CheckCircleIcon)
        │   ├── Heading (sukces)
        │   ├── Message (komunikat + email)
        │   └── Button (przekierowanie do logowania)
        ├── ErrorState
        │   ├── Icon (XCircleIcon)
        │   ├── Heading (błąd)
        │   ├── Message (komunikat błędu)
        │   └── ActionButtons
        │       ├── ResendButton (warunkowo: jeśli token wygasł)
        │       └── Button (powrót do rejestracji)
        ├── AlreadyVerifiedState
        │   ├── Icon (InfoIcon)
        │   ├── Heading (info)
        │   ├── Message (już zweryfikowany)
        │   └── Button (przejdź do logowania)
        └── ExpiredState
            ├── Icon (ClockIcon)
            ├── Heading (token wygasł)
            ├── Message (instrukcje)
            └── ResendButton
```

## 4. Szczegóły komponentów

### VerificationStatus (główny komponent React)

**Opis komponentu:**
Główny komponent strony weryfikacji email, który obsługuje automatyczne wywołanie API weryfikacji, zarządza różnymi stanami procesu (loading, success, error, expired, already_verified) i wyświetla odpowiednie komunikaty oraz akcje dla użytkownika. Komponent jest hydratowany po stronie klienta (`client:load`) w celu obsługi interaktywności.

**Główne elementy HTML i komponenty dzieci:**
- Kontener główny `<div>` z `aria-live="polite"` dla accessibility
- Warunkowe renderowanie w zależności od stanu:
  - **LoadingState**: `<Spinner />` + tekst informacyjny
  - **SuccessState**: ikona sukcesu + nagłówek + komunikat + `<Button>` do logowania
  - **ErrorState**: ikona błędu + nagłówek + komunikat + akcje (ResendButton lub powrót)
  - **ExpiredState**: ikona zegara + nagłówek + komunikat + `<ResendButton>`
  - **AlreadyVerifiedState**: ikona info + nagłówek + komunikat + `<Button>` do logowania

**Obsługiwane zdarzenia:**
- `onMount` (useEffect): Automatyczne wywołanie API weryfikacji z tokenem z URL
- `onSuccessRedirect`: Przekierowanie do `/login?verified=true` po sukcesie (może być automatyczne po 3s lub przez przycisk)
- `onRetry`: Ponowne wywołanie API weryfikacji (w przypadku błędu sieci)
- `onClearToken`: Usunięcie tokenu z URL (window.history.replaceState) po przetworzeniu

**Obsługiwana walidacja:**
- Sprawdzenie obecności tokenu w URL query params (`?token=...`)
- Walidacja, że token nie jest pustym stringiem
- Timeout dla API call (15s) z opcją retry
- Rate limiting dla resend (lokalne: max 3 próby w 10 minut)

**Typy:**
- `VerificationState`: "loading" | "success" | "error" | "expired" | "already_verified" | "invalid"
- `VerifyEmailResponse`: z API (message: string, email: string)
- `ErrorResponse`: z API (standardowy format błędu)
- `VerificationViewModel`: {state, message, email?, canResend, redirectUrl?}

**Propsy:**
Brak - komponent pobiera dane bezpośrednio z URL query params i API

**Logika komponentu:**
1. Przy montowaniu (useEffect):
   - Wyciągnij token z URL: `new URLSearchParams(window.location.search).get("token")`
   - Jeśli brak tokenu → error state
   - Jeśli token istnieje → wywołaj `useEmailVerification(token)`
2. Po otrzymaniu response z API:
   - Sukces (200) → success state, zapisz email, usuń token z URL
   - Błąd 400 z "expired" → expired state, pokaż ResendButton
   - Błąd 400/404 inny → invalid state
   - Idempotency (już zweryfikowany) → already_verified state
3. Zarządzanie przekierowaniem:
   - Opcja A: Automatyczne przekierowanie po 3s (z countdownem)
   - Opcja B: Przycisk "Przejdź do logowania" (lepsze UX)

### ResendButton (komponent React)

**Opis komponentu:**
Przycisk do ponownego wysłania emaila weryfikacyjnego. Komponent obsługuje stan loading podczas wysyłania, rate limiting (wyłączenie po sukcesie na 60s), oraz wyświetla toast z komunikatem sukcesu lub błędu. Widoczny tylko w stanach "expired" lub "error" (dla wygasłego tokenu).

**Główne elementy HTML:**
- `<Button>` z wariantami: default/loading/disabled
- Ikona loading spinner (podczas wywołania API)
- Tekst przycisku: "Wyślij ponownie email weryfikacyjny"
- Countdown timer (jeśli wyłączony z powodu rate limit): "Spróbuj ponownie za {seconds}s"

**Obsługiwane zdarzenia:**
- `onClick`: Wywołanie API do resend weryfikacji
- Rate limit tracking: Zapisanie timestamp w sessionStorage po sukcesie

**Obsługiwana walidacja:**
- Rate limiting: Nie więcej niż 3 próby w ciągu 10 minut (lokalne, sessionStorage)
- Timeout: 60s cooldown po każdym sukcesie
- Email wymagany (jeśli nie jest dostępny z kontekstu, pokaż input)

**Typy:**
- `ResendButtonProps`: {email?: string, onSuccess?: () => void, onError?: (error: string) => void}
- `ResendVerificationRequest`: {email: string} (request body)
- `ResendVerificationResponse`: {message: string} (success response)

**Propsy:**
- `email?: string` - adres email użytkownika (opcjonalnie, jeśli dostępny z kontekstu błędu API)
- `onSuccess?: () => void` - callback po sukcesie (np. pokazanie toast)
- `onError?: (error: string) => void` - callback po błędzie

**Logika komponentu:**
1. Sprawdź rate limit przed wysłaniem (sessionStorage: `resend_attempts`, `last_resend_timestamp`)
2. Jeśli przekroczono limit → wyświetl komunikat i wyłącz przycisk
3. Przy kliknięciu:
   - Ustaw `isLoading = true`
   - Wywołaj API: `POST /api/v1/auth/resend-verification` (lub workaround endpoint)
   - Sukces → toast "Email wysłany ponownie", wyłącz przycisk na 60s, zapisz timestamp
   - Błąd → toast z komunikatem błędu, pozostaw przycisk aktywny (jeśli nie 429)
   - Błąd 429 → wyłącz przycisk na czas `retryAfter` z response

### LoadingState, SuccessState, ErrorState, ExpiredState, AlreadyVerifiedState

**Opis:**
Pomocnicze komponenty prezentacyjne dla różnych stanów weryfikacji. Każdy komponent zawiera ikonę, nagłówek, komunikat i odpowiednie akcje.

**Główne elementy:**
- Ikona (z biblioteki icons, np. Heroicons): CheckCircle, XCircle, Clock, Info
- Nagłówek `<h1>` z komunikatem stanu
- Paragraf `<p>` z szczegółowym opisem
- Przyciski akcji (Button component)

**Accessibility:**
- `role="status"` lub `role="alert"` w zależności od stanu
- `aria-live="polite"` dla komunikatów
- Ikony z `aria-hidden="true"` (duplikacja informacji w tekście)

## 5. Typy

### API DTO (Response Types z backendu)

```typescript
// Sukces weryfikacji
interface VerifyEmailResponse {
  message: string;      // "Email verified successfully. You can now log in."
  email: string;        // "user@example.com"
}

// Błąd weryfikacji (standardowy format)
interface ErrorResponse {
  timestamp: string;    // ISO 8601 datetime
  status: number;       // HTTP status code (400, 404)
  error: string;        // Error code: "INVALID_TOKEN", "TOKEN_EXPIRED", "TOKEN_NOT_FOUND"
  message: string;      // Human-readable error message
  path: string;         // "/api/v1/auth/verify-email"
  details?: ValidationError[] | null;
}

interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}
```

### Frontend ViewModels

```typescript
// Stan weryfikacji
type VerificationState =
  | "loading"           // Weryfikacja w toku
  | "success"           // Weryfikacja udana
  | "error"             // Ogólny błąd
  | "expired"           // Token wygasł (24h TTL)
  | "already_verified"  // Już zweryfikowany (idempotency)
  | "invalid"           // Token nieprawidłowy/nieistniejący
  | "missing_token";    // Brak tokenu w URL

// ViewModel dla VerificationStatus
interface VerificationViewModel {
  state: VerificationState;
  message: string;              // Komunikat do wyświetlenia
  email: string | null;         // Email użytkownika (jeśli dostępny)
  canResend: boolean;           // Czy można wysłać ponownie email
  redirectUrl: string | null;   // URL do przekierowania (zazwyczaj /login)
  error: ErrorResponse | null;  // Szczegóły błędu z API
}

// Props dla ResendButton
interface ResendButtonProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Local storage model dla rate limiting resend
interface ResendAttempts {
  timestamps: number[];  // Array of timestamps (epoch ms)
  lastAttempt: number;   // Last attempt timestamp
}
```

### Custom Hook Types

```typescript
// Hook useEmailVerification
interface UseEmailVerificationReturn {
  state: VerificationState;
  data: VerifyEmailResponse | null;
  error: ErrorResponse | null;
  isLoading: boolean;
  retry: () => void;
}

// Hook useResendVerification
interface UseResendVerificationReturn {
  resend: (email: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  canResend: boolean;
  nextAllowedTime: number | null; // Timestamp kiedy można ponownie wysłać
}
```

## 6. Zarządzanie stanem

### Stan lokalny w VerificationStatus (React useState)

```typescript
const [verificationState, setVerificationState] = useState<VerificationState>("loading");
const [message, setMessage] = useState<string>("");
const [email, setEmail] = useState<string | null>(null);
const [canResend, setCanResend] = useState<boolean>(false);
```

### Custom Hook: useEmailVerification

**Cel:** Enkapsulacja logiki wywołania API weryfikacji email i mapowania response na stan komponentu.

**Implementacja:**
```typescript
function useEmailVerification(token: string | null) {
  const [state, setState] = useState<VerificationState>("loading");
  const [data, setData] = useState<VerifyEmailResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const verify = useCallback(async () => {
    if (!token) {
      setState("missing_token");
      setError({
        timestamp: new Date().toISOString(),
        status: 400,
        error: "MISSING_TOKEN",
        message: "Brakuje tokenu weryfikacyjnego w URL",
        path: "/verify-email"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<VerifyEmailResponse>(
        `/api/v1/auth/verify-email`,
        { params: { token } }
      );

      setState("success");
      setData(response.data);
      setEmail(response.data.email);

      // Usuń token z URL dla bezpieczeństwa
      window.history.replaceState({}, '', '/verify-email');

    } catch (err: any) {
      const errorResponse: ErrorResponse = err.response?.data;
      setError(errorResponse);

      // Mapuj błędy API na stany
      if (errorResponse?.error === "INVALID_TOKEN") {
        if (errorResponse?.message?.toLowerCase().includes("expired")) {
          setState("expired");
        } else if (errorResponse?.message?.toLowerCase().includes("already verified")) {
          setState("already_verified");
        } else {
          setState("invalid");
        }
      } else if (errorResponse?.status === 404) {
        setState("invalid");
      } else {
        setState("error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  return { state, data, error, isLoading, retry: verify };
}
```

### Custom Hook: useResendVerification

**Cel:** Enkapsulacja logiki ponownego wysłania emaila weryfikacyjnego z rate limiting.

**Implementacja:**
```typescript
function useResendVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAllowedTime, setNextAllowedTime] = useState<number | null>(null);

  const checkRateLimit = (): boolean => {
    const stored = sessionStorage.getItem('resend_attempts');
    if (!stored) return true;

    const attempts: ResendAttempts = JSON.parse(stored);
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    // Filter attempts z ostatnich 10 minut
    const recentAttempts = attempts.timestamps.filter(t => t > tenMinutesAgo);

    if (recentAttempts.length >= 3) {
      const oldestAttempt = Math.min(...recentAttempts);
      const nextAllowed = oldestAttempt + 10 * 60 * 1000;
      setNextAllowedTime(nextAllowed);
      return false;
    }

    return true;
  };

  const recordAttempt = () => {
    const stored = sessionStorage.getItem('resend_attempts');
    const attempts: ResendAttempts = stored ? JSON.parse(stored) : { timestamps: [], lastAttempt: 0 };

    const now = Date.now();
    attempts.timestamps.push(now);
    attempts.lastAttempt = now;

    // Zachowaj tylko ostatnie 10 minut
    const tenMinutesAgo = now - 10 * 60 * 1000;
    attempts.timestamps = attempts.timestamps.filter(t => t > tenMinutesAgo);

    sessionStorage.setItem('resend_attempts', JSON.stringify(attempts));
  };

  const resend = async (email: string): Promise<boolean> => {
    if (!checkRateLimit()) {
      setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Zastąpić właściwym endpointem gdy będzie dostępny
      await apiClient.post('/api/v1/auth/resend-verification', { email });

      recordAttempt();
      return true;
    } catch (err: any) {
      const errorResponse: ErrorResponse = err.response?.data;

      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'];
        setError(`Zbyt wiele prób. Spróbuj ponownie za ${retryAfter} sekund.`);
        setNextAllowedTime(Date.now() + parseInt(retryAfter) * 1000);
      } else {
        setError(errorResponse?.message || "Nie udało się wysłać emaila. Spróbuj ponownie.");
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const canResend = !isLoading && (!nextAllowedTime || Date.now() >= nextAllowedTime);

  return { resend, isLoading, error, canResend, nextAllowedTime };
}
```

### SessionStorage dla rate limiting

**Klucz:** `resend_attempts`

**Struktura danych:**
```json
{
  "timestamps": [1704715200000, 1704715800000],
  "lastAttempt": 1704715800000
}
```

**Logika:**
- Zachowuj timestampy z ostatnich 10 minut
- Max 3 próby w 10 minut
- Oblicz `nextAllowedTime` dla UI (countdown)

## 7. Integracja API

### Endpoint 1: Weryfikacja Email

**Request:**
- **Method:** GET
- **Path:** `/api/v1/auth/verify-email`
- **Query Parameters:**
  - `token` (required) - token weryfikacyjny z emaila
- **Headers:** Brak (publiczny endpoint)
- **Authentication:** None

**Response Success (200 OK):**
```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "user@example.com"
}
```

**Response Error (400 Bad Request):**
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 400,
  "error": "INVALID_TOKEN",
  "message": "Verification token is invalid or has expired",
  "path": "/api/v1/auth/verify-email",
  "details": null
}
```

**Response Error (404 Not Found):**
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 404,
  "error": "TOKEN_NOT_FOUND",
  "message": "Verification token not found",
  "path": "/api/v1/auth/verify-email",
  "details": null
}
```

**Frontend Action Flow:**
1. Wyciągnij token z URL query params przy montowaniu komponentu
2. Wywołaj API: `apiClient.get('/api/v1/auth/verify-email', { params: { token } })`
3. Wyświetl loading state z spinner
4. Obsłuż response:
   - **Success (200)**: Wyświetl success state, zapisz email, usuń token z URL
   - **Error (400 z "expired")**: Wyświetl expired state, pokaż ResendButton
   - **Error (400/404 inny)**: Wyświetl invalid state
   - **Network error**: Wyświetl error state z opcją retry
5. Po 3 sekundach od sukcesu: Automatyczne przekierowanie do `/login?verified=true` (opcjonalne)
6. Usuń token z URL: `window.history.replaceState({}, '', '/verify-email')`

**Axios Interceptor Considerations:**
- Global error handler: łapie błędy sieci (timeout, connection refused)
- 401/403: nie dotyczy (publiczny endpoint)
- 429: obsłużone lokalnie dla resend

### Endpoint 2: Resend Verification Email (opcjonalny)

**Note:** Ten endpoint może nie istnieć w MVP. W takim przypadku, ResendButton może:
- Opcja A: Użyć endpointu password reset jako workaround (nie idealne)
- Opcja B: Pokazać komunikat "Skontaktuj się z pomocą techniczną"
- Opcja C: Poprosić backend o dodanie tego endpointu

**Request:**
- **Method:** POST
- **Path:** `/api/v1/auth/resend-verification` (do utworzenia)
- **Body:**
```json
{
  "email": "user@example.com"
}
```
- **Headers:** Content-Type: application/json
- **Authentication:** None (publiczny endpoint)

**Response Success (200 OK):**
```json
{
  "message": "Verification email has been sent. Please check your inbox."
}
```

**Response Error (429 Too Many Requests):**
```json
{
  "timestamp": "2025-01-08T17:35:00Z",
  "status": 429,
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many verification requests. Please try again later.",
  "path": "/api/v1/auth/resend-verification",
  "details": null
}
```

**Frontend Action Flow:**
1. Sprawdź rate limit lokalnie (sessionStorage)
2. Przy kliknięciu ResendButton:
   - Ustaw `isLoading = true` (button disabled z spinner)
   - Wywołaj API: `apiClient.post('/api/v1/auth/resend-verification', { email })`
3. Obsłuż response:
   - **Success (200)**: Toast "Email wysłany ponownie", zapisz timestamp w sessionStorage, wyłącz przycisk na 60s
   - **Error (429)**: Toast z komunikatem i retryAfter countdown
   - **Error (400)**: Toast z komunikatem błędu
4. Reset `isLoading = false`

## 8. Interakcje użytkownika

### Scenariusz 1: Sukces weryfikacji

**Kroki użytkownika:**
1. Użytkownik klika link weryfikacyjny z emaila: `https://mkrew.pl/verify-email?token=abc123...`
2. Strona się ładuje, pokazuje loading state (spinner + "Weryfikacja w toku...")
3. API zwraca sukces (200 OK)

**Wynik:**
- Wyświetla ikonę sukcesu (zielony checkmark)
- Nagłówek: "Email zweryfikowany pomyślnie!"
- Komunikat: "Twój adres email {email} został zweryfikowany. Możesz teraz zalogować się do swojego konta."
- Przycisk: "Przejdź do logowania" (primary button)
- Token usunięty z URL (URL pokazuje `/verify-email` bez query params)
- Opcjonalnie: Automatyczne przekierowanie do `/login?verified=true` po 3 sekundach (z countdownem)

**Interakcje:**
- Kliknięcie "Przejdź do logowania" → redirect do `/login?verified=true`

### Scenariusz 2: Token wygasł

**Kroki użytkownika:**
1. Użytkownik klika stary link weryfikacyjny (>24h)
2. Strona ładuje się, pokazuje loading
3. API zwraca błąd 400 z message zawierającym "expired"

**Wynik:**
- Wyświetla ikonę zegara (pomarańczowy/żółty clock icon)
- Nagłówek: "Token weryfikacyjny wygasł"
- Komunikat: "Link weryfikacyjny stracił ważność. Tokeny weryfikacyjne są ważne przez 24 godziny. Możesz wysłać nowy email weryfikacyjny."
- Przycisk: "Wyślij ponownie email weryfikacyjny" (ResendButton, primary button)

**Interakcje:**
- Kliknięcie "Wyślij ponownie" → wywołanie API resend
  - Success: Toast "Email wysłany ponownie. Sprawdź swoją skrzynkę odbiorczą."
  - Przycisk wyłączony na 60s z countdownem "Wysłano! Możesz wysłać ponownie za {countdown}s"
  - Error: Toast z komunikatem błędu

### Scenariusz 3: Token nieprawidłowy

**Kroki użytkownika:**
1. Użytkownik wpisuje/klika nieprawidłowy link (zmodyfikowany token, nieistniejący)
2. API zwraca 400/404

**Wynik:**
- Wyświetla ikonę błędu (czerwony X circle)
- Nagłówek: "Token weryfikacyjny jest nieprawidłowy"
- Komunikat: "Link weryfikacyjny, którego użyłeś, jest nieprawidłowy lub został już wykorzystany. Upewnij się, że skopiowałeś cały link z emaila."
- Przycisk: "Powrót do rejestracji" (secondary button) → redirect do `/register`

**Interakcje:**
- Kliknięcie "Powrót do rejestracji" → redirect do `/register`

### Scenariusz 4: Brak tokenu w URL

**Kroki użytkownika:**
1. Użytkownik wchodzi bezpośrednio na `/verify-email` bez query params

**Wynik:**
- Wyświetla ikonę błędu
- Nagłówek: "Brakuje tokenu weryfikacyjnego"
- Komunikat: "Nie znaleziono tokenu weryfikacyjnego w linku. Sprawdź link w swoim emailu lub zarejestruj się ponownie."
- Przycisk: "Powrót do rejestracji" → redirect do `/register`

### Scenariusz 5: Już zweryfikowany (idempotency)

**Kroki użytkownika:**
1. Użytkownik klika link weryfikacyjny, który był już użyty
2. API rozpoznaje, że konto jest już zweryfikowane i zwraca sukces (lub specjalny komunikat)

**Wynik:**
- Wyświetla ikonę info (niebieski info icon)
- Nagłówek: "Email już zweryfikowany"
- Komunikat: "Ten adres email został już zweryfikowany wcześniej. Możesz się zalogować do swojego konta."
- Przycisk: "Przejdź do logowania" → redirect do `/login`

### Scenariusz 6: Błąd sieci

**Kroki użytkownika:**
1. Użytkownik klika link, ale brak połączenia z internetem lub serwer nie odpowiada
2. Timeout lub connection error

**Wynik:**
- Wyświetla ikonę błędu
- Nagłówek: "Błąd połączenia"
- Komunikat: "Nie udało się połączyć z serwerem. Sprawdź swoje połączenie internetowe i spróbuj ponownie."
- Przycisk: "Spróbuj ponownie" (primary button) → ponowne wywołanie API

**Interakcje:**
- Kliknięcie "Spróbuj ponownie" → retry API call

### Scenariusz 7: Rate limit przy resend

**Kroki użytkownika:**
1. Użytkownik wielokrotnie klika "Wyślij ponownie" (>3 razy w 10 minut)
2. Lokalne rate limiting lub API zwraca 429

**Wynik:**
- Toast error: "Zbyt wiele prób. Możesz wysłać email ponownie za {time} minut."
- Przycisk ResendButton wyłączony z countdownem
- Tekst przycisku: "Spróbuj ponownie za {countdown}s"

## 9. Warunki i walidacja

### Walidacja Frontend (przed API call)

#### 1. Token musi być obecny w URL
- **Warunek:** Query parameter `token` musi istnieć w URL
- **Sprawdzenie:** `new URLSearchParams(window.location.search).get("token")`
- **Akcja jeśli nie:**
  - Ustaw state na "missing_token"
  - Wyświetl ErrorState z komunikatem "Brakuje tokenu weryfikacyjnego"
  - Pokaż przycisk "Powrót do rejestracji"

#### 2. Token nie może być pusty
- **Warunek:** Token nie może być pustym stringiem (`token !== ""`)
- **Akcja jeśli nie:** Traktuj jak brak tokenu (scenariusz powyżej)

#### 3. Timeout dla API call
- **Warunek:** API musi odpowiedzieć w ciągu 15 sekund
- **Implementacja:** Axios timeout config: `{ timeout: 15000 }`
- **Akcja jeśli timeout:**
  - Ustaw state na "error"
  - Wyświetl komunikat "Przekroczono czas oczekiwania. Spróbuj ponownie."
  - Pokaż przycisk "Spróbuj ponownie" (retry API call)

#### 4. Rate limiting dla resend (lokalne)
- **Warunek:** Max 3 próby resend w ciągu 10 minut
- **Implementacja:**
  - Zapisuj timestampy w sessionStorage (`resend_attempts`)
  - Filter timestampów z ostatnich 10 minut
  - Jeśli `count >= 3`, wyłącz przycisk
- **Akcja jeśli przekroczono:**
  - Wyłącz ResendButton
  - Wyświetl komunikat "Zbyt wiele prób. Spróbuj ponownie za {time} minut"
  - Pokaż countdown timer

### Walidacja Backend (z API)

#### 1. Token istnieje w bazie danych
- **Warunek:** Token musi być w tabeli `user_tokens`
- **Sprawdzenie:** Backend sprawdza `SELECT * FROM user_tokens WHERE token = ?`
- **Error jeśli nie:** 404 Not Found
- **Frontend handling:** Wyświetl "Token nieprawidłowy"

#### 2. Token nie wygasł
- **Warunek:** `expires_at > NOW()` (TTL 24h)
- **Error jeśli nie:** 400 Bad Request z `error: "INVALID_TOKEN"`, message zawiera "expired"
- **Frontend handling:** Wyświetl ExpiredState z ResendButton

#### 3. Token nie został użyty
- **Warunek:** `used_at IS NULL`
- **Error jeśli nie:** 400 Bad Request lub success (idempotency)
- **Frontend handling:**
  - Jeśli API zwraca sukces mimo użytego tokenu (idempotency) → AlreadyVerifiedState
  - Jeśli API zwraca błąd → InvalidState

#### 4. Token typu EMAIL_VERIFICATION
- **Warunek:** `token_type = 'EMAIL_VERIFICATION'`
- **Error jeśli nie:** 400 Bad Request
- **Frontend handling:** Wyświetl "Token nieprawidłowy"

#### 5. User konto istnieje i aktywne
- **Warunek:** `user_id` powiązany z tokenem istnieje i `deleted_at IS NULL`
- **Error jeśli nie:** 404 Not Found lub 400 Bad Request
- **Frontend handling:** Wyświetl "Token nieprawidłowy" lub "Konto nie istnieje"

### Warunki dla ResendButton

#### 1. Email dostępny
- **Warunek:** Email użytkownika musi być dostępny (z kontekstu błędu API lub input użytkownika)
- **Akcja jeśli nie:**
  - Opcja A: Pokaż input field dla emaila
  - Opcja B: Użyj emaila z error response (jeśli dostępny)

#### 2. Rate limit nie przekroczony
- **Warunek:** Sprawdzenie lokalnego rate limit (sessionStorage)
- **Akcja jeśli przekroczono:** Wyłącz przycisk, pokaż countdown

#### 3. API dostępny
- **Warunek:** Endpoint `/api/v1/auth/resend-verification` musi istnieć
- **Akcja jeśli nie:**
  - Pokaż komunikat "Funkcja niedostępna" lub
  - Użyj workaround endpoint (password reset)

## 10. Obsługa błędów

### Błąd 1: Token wygasł (400 Bad Request)

**Wykrywanie:**
- API zwraca status 400
- `errorResponse.error === "INVALID_TOKEN"`
- `errorResponse.message` zawiera słowo "expired" (case-insensitive)

**Obsługa:**
```typescript
if (error.response?.status === 400 &&
    error.response?.data?.message?.toLowerCase().includes("expired")) {
  setVerificationState("expired");
  setMessage("Link weryfikacyjny stracił ważność. Tokeny weryfikacyjne są ważne przez 24 godziny.");
  setCanResend(true);
}
```

**UI:**
- Wyświetl ExpiredState (ikona zegara, nagłówek, komunikat)
- Pokaż ResendButton z emailem (jeśli dostępny)
- Komunikat: "Możesz wysłać nowy email weryfikacyjny poniżej."

### Błąd 2: Token nieprawidłowy/nieistniejący (400/404)

**Wykrywanie:**
- API zwraca status 400 lub 404
- `errorResponse.error === "INVALID_TOKEN"` lub `"TOKEN_NOT_FOUND"`
- Message NIE zawiera "expired"

**Obsługa:**
```typescript
if ((error.response?.status === 400 || error.response?.status === 404) &&
    !error.response?.data?.message?.toLowerCase().includes("expired")) {
  setVerificationState("invalid");
  setMessage("Link weryfikacyjny jest nieprawidłowy lub został już wykorzystany.");
  setCanResend(false);
}
```

**UI:**
- Wyświetl ErrorState (ikona X, nagłówek, komunikat)
- Pokaż przycisk "Powrót do rejestracji" (redirect do `/register`)
- NIE pokazuj ResendButton (użytkownik musi przejść przez rejestrację ponownie)

### Błąd 3: Brak tokenu w URL

**Wykrywanie:**
- `new URLSearchParams(window.location.search).get("token") === null`

**Obsługa:**
```typescript
useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token || token.trim() === "") {
    setVerificationState("missing_token");
    setMessage("Nie znaleziono tokenu weryfikacyjnego w linku.");
    return; // Nie wywołuj API
  }
  // ... continue with verification
}, []);
```

**UI:**
- Wyświetl ErrorState
- Komunikat: "Sprawdź link w swoim emailu lub zarejestruj się ponownie."
- Przycisk "Powrót do rejestracji"

### Błąd 4: Błąd sieci (timeout, connection refused)

**Wykrywanie:**
- Axios interceptor łapie błąd bez `response` (np. `error.code === "ECONNABORTED"` dla timeout)
- Lub `error.message === "Network Error"`

**Obsługa:**
```typescript
catch (error: any) {
  if (!error.response) {
    // Network error
    setVerificationState("error");
    setMessage("Nie udało się połączyć z serwerem. Sprawdź swoje połączenie internetowe.");
  } else {
    // API error
    // ... handle specific errors
  }
}
```

**UI:**
- Wyświetl ErrorState (ikona błędu)
- Komunikat: "Sprawdź swoje połączenie internetowe i spróbuj ponownie."
- Przycisk "Spróbuj ponownie" (primary) → wywołuje `retry()` funkcję z hooka

### Błąd 5: Rate limit przy resend (429 Too Many Requests)

**Wykrywanie:**
- API zwraca status 429
- Response headers mogą zawierać `Retry-After` (czas w sekundach)

**Obsługa:**
```typescript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'] || 60;
  setNextAllowedTime(Date.now() + parseInt(retryAfter) * 1000);
  toast.error(`Zbyt wiele prób. Spróbuj ponownie za ${retryAfter} sekund.`);
}
```

**UI:**
- Toast error z komunikatem
- ResendButton wyłączony z countdownem
- Tekst przycisku: "Spróbuj ponownie za {countdown}s"
- Po upływie czasu: Przycisk ponownie aktywny

### Błąd 6: Błąd serwera (500, 503)

**Wykrywanie:**
- API zwraca status 5xx

**Obsługa:**
```typescript
if (error.response?.status >= 500) {
  setVerificationState("error");
  setMessage("Wystąpił błąd serwera. Spróbuj ponownie później.");
}
```

**UI:**
- Wyświetl ErrorState
- Komunikat: "Wystąpił problem z serwerem. Spróbuj ponownie za kilka minut."
- Przycisk "Spróbuj ponownie" lub "Powrót do strony głównej"

### Przypadek brzegowy 1: Już zweryfikowany (idempotency)

**Wykrywanie:**
- API zwraca 200 OK mimo że `user.email_verified = true` (idempotency)
- Lub API zwraca specjalny komunikat w `message`: "already verified"

**Obsługa:**
```typescript
if (response.data.message.toLowerCase().includes("already verified")) {
  setVerificationState("already_verified");
  setMessage("Ten email został już zweryfikowany wcześniej.");
}
```

**UI:**
- Wyświetl AlreadyVerifiedState (ikona info)
- Komunikat: "Możesz się zalogować do swojego konta."
- Przycisk "Przejdź do logowania"

### Przypadek brzegowy 2: Token w URL history

**Problem:** Token widoczny w URL może zostać przypadkowo udostępniony (historia, zakładki)

**Obsługa:**
```typescript
// Po otrzymaniu response (sukces lub błąd)
useEffect(() => {
  if (verificationState !== "loading") {
    // Usuń token z URL
    window.history.replaceState({}, '', '/verify-email');
  }
}, [verificationState]);
```

**Cel:** Zapobiec leakom tokenów przez historię przeglądarki

### Przypadek brzegowy 3: Użytkownik odświeża stronę

**Problem:** Po odświeżeniu strony bez tokenu w URL, strona pokazuje błąd

**Obsługa:**
```typescript
// Zapisz stan w sessionStorage po sukcesie
useEffect(() => {
  if (verificationState === "success" && email) {
    sessionStorage.setItem('email_verified', JSON.stringify({ email, timestamp: Date.now() }));
  }
}, [verificationState, email]);

// Przy montowaniu, sprawdź sessionStorage
useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) {
    const stored = sessionStorage.getItem('email_verified');
    if (stored) {
      const { email, timestamp } = JSON.parse(stored);
      // Jeśli weryfikacja była w ciągu ostatnich 5 minut
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        setVerificationState("already_verified");
        setEmail(email);
        return; // Nie wywołuj API
      }
    }
    setVerificationState("missing_token");
  }
  // ... continue with verification
}, []);
```

### Przypadek brzegowy 4: Resend endpoint nie istnieje

**Problem:** Endpoint `/api/v1/auth/resend-verification` może nie być zaimplementowany w MVP

**Opcje obsługi:**

**Opcja A: Workaround z password reset endpoint**
```typescript
// Użyj endpointu password reset
const resend = async (email: string) => {
  await apiClient.post('/api/v1/auth/password-reset/request', { email });
  toast.success("Email wysłany. Sprawdź swoją skrzynkę.");
};
```
- **Wada:** Użytkownik otrzyma email do resetu hasła, nie weryfikacji
- **Nie zalecane** - mylący UX

**Opcja B: Ukryj ResendButton**
```typescript
// Nie pokazuj ResendButton w stanie expired
if (verificationState === "expired") {
  return (
    <div>
      <p>Token wygasł.</p>
      <p>Skontaktuj się z pomocą techniczną lub zarejestruj się ponownie.</p>
      <Button href="/register">Powrót do rejestracji</Button>
    </div>
  );
}
```

**Opcja C: Pokaż komunikat o niedostępności**
```typescript
const ResendButton = () => {
  const handleClick = () => {
    toast.error("Funkcja ponownego wysyłania emaila jest tymczasowo niedostępna. Spróbuj zarejestrować się ponownie.");
  };
  return <Button onClick={handleClick} disabled>Wyślij ponownie (niedostępne)</Button>;
};
```

**Rekomendacja:** Opcja B (ukryj przycisk) + komunikat o kontakcie z pomocą lub ponownej rejestracji

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu
1. Utwórz plik strony: `src/pages/verify-email.astro`
2. Utwórz komponenty React:
   - `src/components/auth/VerificationStatus.tsx`
   - `src/components/auth/ResendButton.tsx`
   - `src/components/auth/LoadingState.tsx`
   - `src/components/auth/SuccessState.tsx`
   - `src/components/auth/ErrorState.tsx`
   - `src/components/auth/ExpiredState.tsx`
   - `src/components/auth/AlreadyVerifiedState.tsx`
3. Utwórz custom hooks:
   - `src/lib/hooks/useEmailVerification.ts`
   - `src/lib/hooks/useResendVerification.ts`
4. Utwórz typy:
   - `src/lib/types/auth.ts` (VerificationState, VerificationViewModel, etc.)

### Krok 2: Implementacja typów TypeScript
1. Zdefiniuj typy API responses (`VerifyEmailResponse`, `ErrorResponse`)
2. Zdefiniuj typy stanów (`VerificationState`)
3. Zdefiniuj ViewModels (`VerificationViewModel`)
4. Zdefiniuj Props interfaces dla komponentów

```typescript
// src/lib/types/auth.ts
export type VerificationState =
  | "loading"
  | "success"
  | "error"
  | "expired"
  | "already_verified"
  | "invalid"
  | "missing_token";

export interface VerifyEmailResponse {
  message: string;
  email: string;
}

export interface VerificationViewModel {
  state: VerificationState;
  message: string;
  email: string | null;
  canResend: boolean;
  redirectUrl: string | null;
}

export interface ResendButtonProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

### Krok 3: Implementacja custom hooks

**useEmailVerification.ts:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { VerificationState, VerifyEmailResponse } from '@/lib/types/auth';
import type { ErrorResponse } from '@/lib/types/api';

export function useEmailVerification(token: string | null) {
  const [state, setState] = useState<VerificationState>("loading");
  const [data, setData] = useState<VerifyEmailResponse | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const verify = useCallback(async () => {
    if (!token) {
      setState("missing_token");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<VerifyEmailResponse>(
        '/api/v1/auth/verify-email',
        { params: { token }, timeout: 15000 }
      );

      setState("success");
      setData(response.data);

      // Usuń token z URL
      window.history.replaceState({}, '', '/verify-email');

      // Zapisz w sessionStorage
      sessionStorage.setItem('email_verified', JSON.stringify({
        email: response.data.email,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      const errorResponse: ErrorResponse = err.response?.data;
      setError(errorResponse);

      if (!err.response) {
        setState("error");
      } else if (errorResponse?.error === "INVALID_TOKEN") {
        if (errorResponse.message?.toLowerCase().includes("expired")) {
          setState("expired");
        } else if (errorResponse.message?.toLowerCase().includes("already verified")) {
          setState("already_verified");
        } else {
          setState("invalid");
        }
      } else if (err.response.status === 404) {
        setState("invalid");
      } else {
        setState("error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  return { state, data, error, isLoading, retry: verify };
}
```

**useResendVerification.ts:**
```typescript
import { useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface ResendAttempts {
  timestamps: number[];
  lastAttempt: number;
}

export function useResendVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAllowedTime, setNextAllowedTime] = useState<number | null>(null);

  const checkRateLimit = (): boolean => {
    const stored = sessionStorage.getItem('resend_attempts');
    if (!stored) return true;

    const attempts: ResendAttempts = JSON.parse(stored);
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    const recentAttempts = attempts.timestamps.filter(t => t > tenMinutesAgo);

    if (recentAttempts.length >= 3) {
      const oldestAttempt = Math.min(...recentAttempts);
      setNextAllowedTime(oldestAttempt + 10 * 60 * 1000);
      return false;
    }

    return true;
  };

  const recordAttempt = () => {
    const stored = sessionStorage.getItem('resend_attempts');
    const attempts: ResendAttempts = stored
      ? JSON.parse(stored)
      : { timestamps: [], lastAttempt: 0 };

    const now = Date.now();
    attempts.timestamps.push(now);
    attempts.lastAttempt = now;

    const tenMinutesAgo = now - 10 * 60 * 1000;
    attempts.timestamps = attempts.timestamps.filter(t => t > tenMinutesAgo);

    sessionStorage.setItem('resend_attempts', JSON.stringify(attempts));
  };

  const resend = async (email: string): Promise<boolean> => {
    if (!checkRateLimit()) {
      setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/api/v1/auth/resend-verification', { email });
      recordAttempt();
      return true;
    } catch (err: any) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 60;
        setError(`Zbyt wiele prób. Spróbuj ponownie za ${retryAfter} sekund.`);
        setNextAllowedTime(Date.now() + parseInt(retryAfter) * 1000);
      } else {
        setError(err.response?.data?.message || "Nie udało się wysłać emaila.");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const canResend = !isLoading && (!nextAllowedTime || Date.now() >= nextAllowedTime);

  return { resend, isLoading, error, canResend, nextAllowedTime };
}
```

### Krok 4: Implementacja komponentów pomocniczych

Utwórz komponenty dla stanów (LoadingState, SuccessState, ErrorState, ExpiredState, AlreadyVerifiedState) jako proste komponenty prezentacyjne z odpowiednimi ikonami, nagłówkami i komunikatami.

**Przykład LoadingState.tsx:**
```typescript
import { Spinner } from '@/components/ui/Spinner';

export function LoadingState() {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <Spinner className="w-12 h-12 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Weryfikacja w toku...</h1>
      <p className="text-gray-600">Proszę czekać, weryfikujemy Twój adres email.</p>
    </div>
  );
}
```

**Przykład SuccessState.tsx:**
```typescript
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface SuccessStateProps {
  email: string;
  onRedirect: () => void;
}

export function SuccessState({ email, onRedirect }: SuccessStateProps) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
      <h1 className="text-2xl font-bold mb-2">Email zweryfikowany pomyślnie!</h1>
      <p className="text-gray-700 mb-1">
        Twój adres email <strong>{email}</strong> został zweryfikowany.
      </p>
      <p className="text-gray-600 mb-6">Możesz teraz zalogować się do swojego konta.</p>
      <Button onClick={onRedirect} variant="primary" size="lg">
        Przejdź do logowania
      </Button>
    </div>
  );
}
```

**Podobnie dla ErrorState, ExpiredState, AlreadyVerifiedState** - każdy z odpowiednią ikoną, komunikatem i akcjami.

### Krok 5: Implementacja ResendButton

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useResendVerification } from '@/lib/hooks/useResendVerification';
import { useToast } from '@/lib/hooks/useToast';
import type { ResendButtonProps } from '@/lib/types/auth';

export function ResendButton({ email, onSuccess, onError }: ResendButtonProps) {
  const { resend, isLoading, error, canResend, nextAllowedTime } = useResendVerification();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (nextAllowedTime) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((nextAllowedTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setCountdown(0);
          clearInterval(interval);
        } else {
          setCountdown(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [nextAllowedTime]);

  const handleClick = async () => {
    if (!email) {
      toast.error("Brak adresu email. Spróbuj zarejestrować się ponownie.");
      return;
    }

    const success = await resend(email);
    if (success) {
      toast.success("Email wysłany ponownie. Sprawdź swoją skrzynkę odbiorczą.");
      onSuccess?.();
    } else {
      toast.error(error || "Nie udało się wysłać emaila.");
      onError?.(error || "Unknown error");
    }
  };

  const buttonText = countdown > 0
    ? `Spróbuj ponownie za ${countdown}s`
    : "Wyślij ponownie email weryfikacyjny";

  return (
    <Button
      onClick={handleClick}
      disabled={!canResend || isLoading || countdown > 0}
      variant="primary"
      size="lg"
    >
      {isLoading && <Spinner className="w-4 h-4 mr-2" />}
      {buttonText}
    </Button>
  );
}
```

### Krok 6: Implementacja głównego komponentu VerificationStatus

```typescript
import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/hooks/useRouter'; // lub Next.js router
import { useEmailVerification } from '@/lib/hooks/useEmailVerification';
import { LoadingState } from './LoadingState';
import { SuccessState } from './SuccessState';
import { ErrorState } from './ErrorState';
import { ExpiredState } from './ExpiredState';
import { AlreadyVerifiedState } from './AlreadyVerifiedState';
import type { VerificationState } from '@/lib/types/auth';

export function VerificationStatus() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Sprawdź sessionStorage przed próbą weryfikacji
    const stored = sessionStorage.getItem('email_verified');
    if (stored) {
      const { email, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        // Weryfikacja była w ciągu ostatnich 5 minut
        setState("already_verified");
        setEmail(email);
        return;
      }
    }

    // Wyciągnij token z URL
    const urlToken = new URLSearchParams(window.location.search).get("token");
    setToken(urlToken);
  }, []);

  const { state, data, error, retry } = useEmailVerification(token);

  const handleRedirectToLogin = () => {
    router.push('/login?verified=true');
  };

  const handleRedirectToRegister = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {state === "loading" && <LoadingState />}

        {state === "success" && data && (
          <SuccessState email={data.email} onRedirect={handleRedirectToLogin} />
        )}

        {state === "expired" && (
          <ExpiredState email={error?.email} />
        )}

        {state === "invalid" && (
          <ErrorState
            title="Token nieprawidłowy"
            message="Link weryfikacyjny jest nieprawidłowy lub został już wykorzystany."
            actionText="Powrót do rejestracji"
            onAction={handleRedirectToRegister}
          />
        )}

        {state === "missing_token" && (
          <ErrorState
            title="Brakuje tokenu"
            message="Nie znaleziono tokenu weryfikacyjnego w linku."
            actionText="Powrót do rejestracji"
            onAction={handleRedirectToRegister}
          />
        )}

        {state === "already_verified" && (
          <AlreadyVerifiedState onRedirect={handleRedirectToLogin} />
        )}

        {state === "error" && (
          <ErrorState
            title="Błąd weryfikacji"
            message={error?.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."}
            actionText="Spróbuj ponownie"
            onAction={retry}
          />
        )}
      </div>
    </div>
  );
}
```

### Krok 7: Implementacja strony Astro

```astro
---
// src/pages/verify-email.astro
import AuthLayout from '@/layouts/AuthLayout.astro';
import { VerificationStatus } from '@/components/auth/VerificationStatus';

// SEO metadata
const title = "Weryfikacja Email - mkrew";
const description = "Weryfikuj swój adres email, aby aktywować konto w mkrew.";
---

<AuthLayout title={title} description={description}>
  <VerificationStatus client:load />
</AuthLayout>
```

### Krok 8: Implementacja AuthLayout (jeśli nie istnieje)

```astro
---
// src/layouts/AuthLayout.astro
import BaseLayout from './BaseLayout.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<BaseLayout title={title} description={description}>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
    <header class="py-6 px-4">
      <div class="max-w-7xl mx-auto">
        <a href="/" class="inline-block">
          <img src="/images/logo.svg" alt="mkrew logo" class="h-10" />
        </a>
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center px-4">
      <slot />
    </main>

    <footer class="py-6 text-center text-sm text-gray-600">
      <p>&copy; 2025 mkrew. Wszystkie prawa zastrzeżone.</p>
    </footer>
  </div>
</BaseLayout>
```

### Krok 9: Konfiguracja Axios interceptors (jeśli nie istnieje)

```typescript
// src/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor dla global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    if (!error.response) {
      console.error('Network error:', error);
    } else if (error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);
```

### Krok 10: Stylowanie z Tailwind CSS

Upewnij się, że wszystkie komponenty używają Tailwind CSS zgodnie z design system aplikacji:
- Kolory: Użyj palety kolorów z `tailwind.config.cjs`
- Ikony: Użyj biblioteki ikon (np. Heroicons)
- Spacing: Konsystentne marginesy i paddingi
- Typography: Hierarchia nagłówków i tekstów
- Buttons: Warianty primary, secondary, ghost
- Responsywność: Mobile-first approach

### Krok 11: Testy jednostkowe i integracyjne

**Test useEmailVerification hook (Vitest):**
```typescript
// src/lib/hooks/__tests__/useEmailVerification.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEmailVerification } from '../useEmailVerification';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client');

describe('useEmailVerification', () => {
  it('should verify email successfully', async () => {
    const mockResponse = { data: { message: 'Success', email: 'test@example.com' } };
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useEmailVerification('valid-token'));

    await waitFor(() => {
      expect(result.current.state).toBe('success');
      expect(result.current.data?.email).toBe('test@example.com');
    });
  });

  it('should handle expired token', async () => {
    const mockError = {
      response: {
        status: 400,
        data: { error: 'INVALID_TOKEN', message: 'Token has expired' }
      }
    };
    vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useEmailVerification('expired-token'));

    await waitFor(() => {
      expect(result.current.state).toBe('expired');
    });
  });

  it('should handle missing token', async () => {
    const { result } = renderHook(() => useEmailVerification(null));

    expect(result.current.state).toBe('missing_token');
  });
});
```

**Test VerificationStatus component (React Testing Library):**
```typescript
// src/components/auth/__tests__/VerificationStatus.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VerificationStatus } from '../VerificationStatus';
import * as hooks from '@/lib/hooks/useEmailVerification';

describe('VerificationStatus', () => {
  it('should show loading state initially', () => {
    vi.spyOn(hooks, 'useEmailVerification').mockReturnValue({
      state: 'loading',
      data: null,
      error: null,
      isLoading: true,
      retry: vi.fn()
    });

    render(<VerificationStatus />);
    expect(screen.getByText(/Weryfikacja w toku/i)).toBeInTheDocument();
  });

  it('should show success state on successful verification', async () => {
    vi.spyOn(hooks, 'useEmailVerification').mockReturnValue({
      state: 'success',
      data: { message: 'Success', email: 'test@example.com' },
      error: null,
      isLoading: false,
      retry: vi.fn()
    });

    render(<VerificationStatus />);
    await waitFor(() => {
      expect(screen.getByText(/Email zweryfikowany pomyślnie/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  it('should show expired state with resend button', async () => {
    vi.spyOn(hooks, 'useEmailVerification').mockReturnValue({
      state: 'expired',
      data: null,
      error: { /* ... */ },
      isLoading: false,
      retry: vi.fn()
    });

    render(<VerificationStatus />);
    await waitFor(() => {
      expect(screen.getByText(/Token weryfikacyjny wygasł/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Wyślij ponownie/i })).toBeInTheDocument();
    });
  });
});
```

### Krok 12: Testy E2E (Playwright)

```typescript
// tests/e2e/verify-email.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Email Verification Flow', () => {
  test('should verify email successfully with valid token', async ({ page }) => {
    await page.goto('/verify-email?token=valid-test-token');

    // Powinien pokazać loading
    await expect(page.getByText(/Weryfikacja w toku/i)).toBeVisible();

    // Po weryfikacji powinien pokazać sukces
    await expect(page.getByText(/Email zweryfikowany pomyślnie/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/test@example.com/i)).toBeVisible();

    // Powinien być przycisk do logowania
    const loginButton = page.getByRole('button', { name: /Przejdź do logowania/i });
    await expect(loginButton).toBeVisible();

    // Kliknięcie powinno przekierować do /login
    await loginButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle expired token', async ({ page }) => {
    await page.goto('/verify-email?token=expired-test-token');

    await expect(page.getByText(/Token weryfikacyjny wygasł/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Wyślij ponownie/i })).toBeVisible();
  });

  test('should handle missing token', async ({ page }) => {
    await page.goto('/verify-email');

    await expect(page.getByText(/Brakuje tokenu weryfikacyjnego/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Powrót do rejestracji/i })).toBeVisible();
  });

  test('should resend verification email', async ({ page }) => {
    await page.goto('/verify-email?token=expired-test-token');

    await expect(page.getByText(/Token weryfikacyjny wygasł/i)).toBeVisible({ timeout: 10000 });

    const resendButton = page.getByRole('button', { name: /Wyślij ponownie/i });
    await resendButton.click();

    // Powinien pokazać toast sukcesu
    await expect(page.getByText(/Email wysłany ponownie/i)).toBeVisible();

    // Przycisk powinien być wyłączony z countdownem
    await expect(resendButton).toBeDisabled();
  });
});
```

### Krok 13: Accessibility testing

1. **Testy z axe-core:**
```typescript
// tests/a11y/verify-email.a11y.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('verify-email page should have no accessibility violations', async ({ page }) => {
  await page.goto('/verify-email?token=valid-token');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

2. **Manual checks:**
   - Nawigacja klawiaturą (Tab, Enter, Space)
   - Screen reader testing (NVDA, JAWS, VoiceOver)
   - Focus states widoczne
   - ARIA attributes poprawne (`aria-live`, `role`, `aria-label`)
   - Contrast ratio (min 4.5:1 dla tekstu)

### Krok 14: Dokumentacja

1. **Dokumentuj komponenty (Storybook - opcjonalnie):**
```typescript
// src/components/auth/VerificationStatus.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { VerificationStatus } from './VerificationStatus';

const meta: Meta<typeof VerificationStatus> = {
  title: 'Auth/VerificationStatus',
  component: VerificationStatus,
};

export default meta;
type Story = StoryObj<typeof VerificationStatus>;

export const Loading: Story = {
  parameters: {
    mockData: {
      state: 'loading'
    }
  }
};

export const Success: Story = {
  parameters: {
    mockData: {
      state: 'success',
      email: 'user@example.com'
    }
  }
};

export const Expired: Story = {
  parameters: {
    mockData: {
      state: 'expired'
    }
  }
};
```

2. **README dla komponentu:**
```markdown
# VerificationStatus Component

## Opis
Komponent obsługujący weryfikację adresu email użytkownika po kliknięciu linku z emaila.

## Props
Brak (komponent pobiera token z URL)

## Stany
- `loading`: Weryfikacja w toku
- `success`: Weryfikacja udana
- `expired`: Token wygasł
- `invalid`: Token nieprawidłowy
- `missing_token`: Brak tokenu w URL
- `already_verified`: Już zweryfikowany
- `error`: Błąd sieci lub serwera

## Użycie
```tsx
<VerificationStatus client:load />
```

## API Integration
- Endpoint: `GET /api/v1/auth/verify-email?token={token}`
- Response: `{message: string, email: string}`
- Errors: 400, 404, 500

## Security
- Token usuwany z URL po przetworzeniu (`window.history.replaceState`)
- Rate limiting dla resend (max 3 w 10 minut)
- Timeout 15s dla API call

## Accessibility
- `aria-live="polite"` dla komunikatów
- Keyboard navigation
- Screen reader friendly
- Focus management
```

### Krok 15: Deployment i monitoring

1. **Environment variables:**
```env
# .env
PUBLIC_API_URL=https://api.mkrew.pl/api/v1
```

2. **Build i deploy:**
```bash
npm run build
npm run preview
# Deploy to GCP (Cloud Run, GKE, etc.)
```

3. **Monitoring (Google Cloud Logging):**
   - Loguj błędy weryfikacji
   - Trackuj success rate
   - Monitor rate limit violations
   - Alert na wysoką liczbę błędów 500

4. **Analytics (opcjonalnie):**
   - Track verification success rate
   - Track time to verification
   - Track resend usage

---

## Podsumowanie

Plan implementacji widoku weryfikacji e-mail obejmuje:
- ✅ Automatyczną weryfikację tokenu z URL
- ✅ Obsługę wszystkich stanów (loading, success, error, expired, etc.)
- ✅ Przyjazny UX z jasnymi komunikatami i akcjami
- ✅ Bezpieczeństwo (usunięcie tokenu z URL, rate limiting)
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Testy jednostkowe, integracyjne i E2E
- ✅ Dokumentację komponentów

Implementacja jest zgodna z PRD (US-002), UI Plan, API Plan i Tech Stack. Widok zapewnia bezpieczną i przyjazną weryfikację email dla użytkowników aplikacji mkrew.
