# Plan implementacji widoku Reset hasła

## 1. Przegląd

Widok Reset hasła umożliwia użytkownikom odzyskanie dostępu do konta w przypadku zapomnienia hasła. Proces składa się z dwóch kroków:

1. **Żądanie resetu** (`/reset-password`) - użytkownik podaje adres email, system wysyła link z tokenem
2. **Potwierdzenie resetu** (`/reset-password/confirm?token=xxx`) - użytkownik ustawia nowe hasło przy użyciu tokena z emaila

**Główne cele:**
- Umożliwienie bezpiecznego resetu hasła z wykorzystaniem jednorazowego tokena
- Wymuszenie silnych haseł zgodnie z polityką bezpieczeństwa
- Zapewnienie dobrego UX z wizualnym feedbackiem wymagań hasła
- Ochrona przed atakami typu email enumeration i brute force

**Wymagania bezpieczeństwa:**
- Token jednorazowy z czasem wygaśnięcia 1 godzina
- Rate limiting: 3 żądania na email na godzinę
- Nie ujawnianie informacji czy email istnieje w systemie
- Walidacja silnego hasła (min. 8 znaków, wielkie/małe litery, cyfra, znak specjalny)
- Unieważnienie wszystkich sesji użytkownika po resecie hasła

## 2. Routing widoku

Widok Reset hasła składa się z dwóch oddzielnych stron:

### 2.1 Strona żądania resetu
- **Ścieżka:** `/reset-password`
- **Typ:** SSR (Server-Side Rendering)
- **Layout:** AuthLayout.astro
- **Dostęp:** Publiczny (niezalogowani użytkownicy)

### 2.2 Strona potwierdzenia resetu
- **Ścieżka:** `/reset-password/confirm`
- **Query params:** `?token=<reset_token>`
- **Typ:** SSR (Server-Side Rendering)
- **Layout:** AuthLayout.astro
- **Dostęp:** Publiczny (wymaga ważnego tokena w URL)

## 3. Struktura komponentów

```
/reset-password
│
├── AuthLayout.astro
│   ├── Navbar.astro (public variant)
│   └── Footer.astro
│
└── ResetRequestForm.tsx (React island, client:load)
    ├── FormField (email)
    │   ├── Label
    │   ├── Input (type="email")
    │   └── ErrorMessage
    ├── Button (type="submit")
    └── Toast/Alert (success/error feedback)

/reset-password/confirm?token=xxx
│
├── AuthLayout.astro
│   ├── Navbar.astro (public variant)
│   └── Footer.astro
│
└── ResetConfirmForm.tsx (React island, client:load)
    ├── FormField (newPassword)
    │   ├── Label
    │   ├── Input (type="password")
    │   ├── ToggleVisibilityButton
    │   └── ErrorMessage
    ├── FormField (confirmPassword)
    │   ├── Label
    │   ├── Input (type="password")
    │   ├── ToggleVisibilityButton
    │   └── ErrorMessage
    ├── PasswordRequirementsChecklist
    │   └── RequirementItem (x5)
    │       ├── Icon (check/cross)
    │       └── Text
    ├── Button (type="submit")
    └── Toast/Alert (success/error feedback)
```

## 4. Szczegóły komponentów

### 4.1 ResetRequestForm

**Opis komponentu:**
Formularz pozwalający użytkownikowi zażądać resetu hasła poprzez podanie adresu email. Po wysłaniu formularza system wyśle email z linkiem resetującym (jeśli adres istnieje w bazie). Komponent nie ujawnia informacji czy podany email istnieje w systemie (security best practice).

**Główne elementy HTML i komponenty dzieci:**
- `<form>` - główny element formularza z obsługą onSubmit
- `<FormField>` - wrapper dla pola email zawierający:
  - `<Label>` - etykieta "Adres email"
  - `<Input type="email">` - pole tekstowe z walidacją email
  - `<ErrorMessage>` - komunikat błędu walidacji
- `<Button type="submit">` - przycisk "Wyślij link resetujący" z loading spinner
- `<Alert>` - komunikat sukcesu po wysłaniu żądania
- `<Toast>` - powiadomienia o błędach (rate limiting, network errors)

**Obsługiwane zdarzenia:**
- `onSubmit` - wysłanie formularza (wywołanie API POST /api/v1/auth/password-reset/request)
- `onChange` dla pola email - aktualizacja stanu, clear error on change
- `onBlur` dla pola email - inline walidacja formatu email

**Warunki walidacji:**
- **Email (client-side):**
  - Wymagane - nie może być puste
  - Poprawny format email (RFC 5322)
  - Maksymalnie 255 znaków
- **Email (server-side):**
  - Rate limiting: maksymalnie 3 żądania na email na godzinę
  - Format zgodny z backend validation (@Email annotation)

**Typy:**
- Request DTO: `PasswordResetRequestDto` (backend)
- Response DTO: `PasswordResetResponse` (backend)
- Form data: `ResetRequestFormData` (frontend)
- Zod schema: `resetRequestSchema`

**Propsy:**
```typescript
interface ResetRequestFormProps {
  className?: string; // Opcjonalne custom classes
}
```

### 4.2 ResetConfirmForm

**Opis komponentu:**
Formularz pozwalający użytkownikowi ustawić nowe hasło przy użyciu tokena otrzymanego w emailu. Token jest automatycznie wyciągany z parametrów URL. Komponent wyświetla listę wymagań hasła z real-time feedback oraz zapewnia, że oba pola hasła są identyczne.

**Główne elementy HTML i komponenty dzieci:**
- `<form>` - główny element formularza
- Hidden input z tokenem (z URL query params)
- `<FormField>` dla nowego hasła:
  - `<Label>` - etykieta "Nowe hasło"
  - `<Input type="password">` - pole hasła z możliwością pokazania
  - `<ToggleVisibilityButton>` - ikona oka do pokazania/ukrycia hasła
  - `<ErrorMessage>` - komunikat błędu
- `<FormField>` dla potwierdzenia hasła:
  - `<Label>` - etykieta "Potwierdź nowe hasło"
  - `<Input type="password">` - pole potwierdzenia
  - `<ToggleVisibilityButton>`
  - `<ErrorMessage>`
- `<PasswordRequirementsChecklist>` - lista wymagań hasła z wizualnym feedbackiem
- `<Button type="submit">` - przycisk "Zresetuj hasło" z loading state
- `<Alert>` - komunikaty sukcesu/błędu
- `<Toast>` - powiadomienia o błędach API

**Obsługiwane zdarzenia:**
- `onMount` - wyciągnięcie tokena z URL, opcjonalna walidacja tokena
- `onSubmit` - wysłanie formularza (API POST /api/v1/auth/password-reset/confirm)
- `onChange` dla newPassword - aktualizacja checklisty wymagań w czasie rzeczywistym
- `onChange` dla confirmPassword - sprawdzenie czy hasła są identyczne
- `onBlur` dla obu pól - inline walidacja
- `onToggleVisibility` - pokazanie/ukrycie hasła

**Warunki walidacji:**
- **Token (z URL):**
  - Wymagany - jeśli brak, przekierowanie do /reset-password z błędem
  - Sprawdzany po stronie serwera (istnienie, wygaśnięcie, użycie)
- **Nowe hasło (client-side):**
  - Minimum 8 znaków
  - Co najmniej jedna wielka litera (A-Z)
  - Co najmniej jedna mała litera (a-z)
  - Co najmniej jedna cyfra (0-9)
  - Co najmniej jeden znak specjalny (@$!%*?&#)
- **Potwierdzenie hasła:**
  - Musi być identyczne z polem "nowe hasło"
- **Server-side:**
  - Token musi istnieć w bazie
  - Token nie może być wygasły (TTL: 1 godzina)
  - Token nie może być już użyty
  - Hasło musi spełniać te same wymagania co w client-side

**Typy:**
- Request DTO: `PasswordResetConfirmDto` (backend)
- Response DTO: `PasswordResetResponse` (backend)
- Form data: `ResetConfirmFormData` (frontend)
- Zod schema: `resetConfirmSchema`

**Propsy:**
```typescript
interface ResetConfirmFormProps {
  className?: string;
}
```

### 4.3 PasswordRequirementsChecklist

**Opis komponentu:**
Komponent wyświetlający listę wymagań dotyczących hasła w formie checklisty. Każde wymaganie posiada wizualny indicator (✓ zielony gdy spełnione, ✗ czerwony gdy niespełnione) oraz opis tekstowy. Komponent aktualizuje się w czasie rzeczywistym w odpowiedzi na zmiany wartości hasła.

**Główne elementy HTML i komponenty dzieci:**
- `<div>` lub `<ul>` - kontener listy wymagań
- `<RequirementItem>` (x5) - pojedyncze wymaganie:
  - `<Icon>` - ikona check (✓) lub cross (✗) z odpowiednim kolorem
  - `<span>` - tekst opisujący wymaganie
  - Conditional styling: zielony gdy spełnione, czerwony/szary gdy nie

**Obsługiwane interakcje:**
- Brak bezpośrednich interakcji użytkownika
- Komponent jest reaktywny - reaguje na prop `password`

**Obsługiwana walidacja:**
Komponenet sprawdza następujące wymagania:
1. **Długość:** Co najmniej 8 znaków (`password.length >= 8`)
2. **Wielka litera:** Co najmniej jedna wielka litera (`/[A-Z]/.test(password)`)
3. **Mała litera:** Co najmniej jedna mała litera (`/[a-z]/.test(password)`)
4. **Cyfra:** Co najmniej jedna cyfra (`/\d/.test(password)`)
5. **Znak specjalny:** Co najmniej jeden znak specjalny (`/[@$!%*?&#]/.test(password)`)

**Typy:**
```typescript
interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  met?: boolean; // computed
}
```

**Propsy:**
```typescript
interface PasswordRequirementsChecklistProps {
  password: string; // Aktualna wartość hasła do walidacji
  className?: string; // Opcjonalne custom classes
}
```

### 4.4 ToggleVisibilityButton

**Opis komponentu:**
Mały przycisk ikony (oko) pozwalający użytkownikowi przełączać widoczność hasła między tekstem a kropkami. Ważny dla UX, szczególnie na urządzeniach mobilnych gdzie trudniej poprawić literówki.

**Główne elementy:**
- `<button type="button">` - przycisk bez submit
- `<Icon>` - ikona oka (open/closed) w zależności od stanu

**Obsługiwane zdarzenia:**
- `onClick` - przełączenie stanu visible/hidden

**Propsy:**
```typescript
interface ToggleVisibilityButtonProps {
  visible: boolean;
  onToggle: () => void;
  ariaLabel?: string;
}
```

### 4.5 FormField (reusable)

**Opis komponentu:**
Komponent wrapper dla pola formularza zawierający label, input, helper text i komunikat błędu. Zapewnia spójny układ i accessibility (powiązanie label z input, aria-describedby dla errorów).

**Główne elementy:**
- `<div>` - kontener
- `<Label htmlFor={id}>` - etykieta pola
- `<Input>` - pole input (przekazane jako children lub prop)
- `<HelperText>` - opcjonalny tekst pomocniczy
- `<ErrorMessage>` - komunikat błędu walidacji (pokazywany warunkowo)

**Propsy:**
```typescript
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode; // Input element
  required?: boolean;
}
```

## 5. Typy

### 5.1 Backend DTO (Java)

**PasswordResetRequestDto:**
```java
{
  email: String // @NotBlank, @Email, max 255 chars
}
```

**PasswordResetConfirmDto:**
```java
{
  token: String // @NotBlank
  newPassword: String // @NotBlank, @Size(min=8), @Pattern(regex)
}
```
Pattern regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$`

**PasswordResetResponse:**
```java
{
  message: String
}
```

**ErrorResponse:**
```java
{
  timestamp: String
  status: number
  error: String
  message: String
  path: String
  details?: Array<{
    field: String
    message: String
    rejectedValue?: any
  }>
}
```

### 5.2 Frontend Types (TypeScript)

**ResetRequestFormData:**
```typescript
interface ResetRequestFormData {
  email: string;
}
```

**ResetConfirmFormData:**
```typescript
interface ResetConfirmFormData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
```

**PasswordRequirement:**
```typescript
interface PasswordRequirement {
  id: string; // unikalne ID wymagania
  label: string; // tekst wyświetlany użytkownikowi
  test: (password: string) => boolean; // funkcja testująca
  met?: boolean; // czy wymaganie jest spełnione (computed)
}
```

**ResetRequestState:**
```typescript
interface ResetRequestState {
  email: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}
```

**ResetConfirmState:**
```typescript
interface ResetConfirmState {
  token: string;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}
```

**ApiErrorResponse:**
```typescript
interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: Array<{
    field: string;
    message: string;
    rejectedValue?: any;
  }>;
}
```

**PasswordValidationResult:**
```typescript
interface PasswordValidationResult {
  requirements: PasswordRequirement[];
  allMet: boolean;
  strength: 'weak' | 'medium' | 'strong';
}
```

### 5.3 Zod Schemas

**resetRequestSchema:**
```typescript
import { z } from 'zod';

export const resetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email')
    .max(255, 'Email jest za długi')
});
```

**resetConfirmSchema:**
```typescript
import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

export const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Token jest wymagany'),
  newPassword: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(passwordRegex, 'Hasło nie spełnia wymagań'),
  confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane')
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword']
  }
);
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny (React useState)

**ResetRequestForm:**
- `email: string` - wartość pola email
- `isSubmitting: boolean` - czy formularz jest w trakcie wysyłania
- `error: string | null` - komunikat błędu (jeśli wystąpił)
- `success: boolean` - czy żądanie zostało wysłane pomyślnie

**Zarządzanie stanem:**
```typescript
const [email, setEmail] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

**ResetConfirmForm:**
- `token: string` - token z URL (wyciągany przy montowaniu)
- `newPassword: string` - wartość nowego hasła
- `confirmPassword: string` - wartość potwierdzenia hasła
- `showPassword: boolean` - czy pokazać hasło (zamiast kropek)
- `showConfirmPassword: boolean` - czy pokazać potwierdzenie hasła
- `isSubmitting: boolean` - czy formularz jest wysyłany
- `error: string | null` - komunikat błędu
- `success: boolean` - czy reset hasła się powiódł

**Zarządzanie stanem:**
```typescript
const [token, setToken] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

### 6.2 Custom Hooki

**usePasswordValidation:**
Hook sprawdzający wymagania hasła i zwracający ich stan.

```typescript
function usePasswordValidation(password: string): PasswordValidationResult {
  return useMemo(() => {
    const requirements: PasswordRequirement[] = [
      {
        id: 'length',
        label: 'Co najmniej 8 znaków',
        test: (pwd) => pwd.length >= 8,
        met: password.length >= 8
      },
      {
        id: 'uppercase',
        label: 'Co najmniej jedna wielka litera',
        test: (pwd) => /[A-Z]/.test(pwd),
        met: /[A-Z]/.test(password)
      },
      {
        id: 'lowercase',
        label: 'Co najmniej jedna mała litera',
        test: (pwd) => /[a-z]/.test(pwd),
        met: /[a-z]/.test(password)
      },
      {
        id: 'digit',
        label: 'Co najmniej jedna cyfra',
        test: (pwd) => /\d/.test(pwd),
        met: /\d/.test(password)
      },
      {
        id: 'special',
        label: 'Co najmniej jeden znak specjalny (@$!%*?&#)',
        test: (pwd) => /[@$!%*?&#]/.test(pwd),
        met: /[@$!%*?&#]/.test(password)
      }
    ];

    const allMet = requirements.every(req => req.met);
    const metCount = requirements.filter(req => req.met).length;

    let strength: 'weak' | 'medium' | 'strong';
    if (metCount <= 2) strength = 'weak';
    else if (metCount <= 4) strength = 'medium';
    else strength = 'strong';

    return { requirements, allMet, strength };
  }, [password]);
}
```

**useUrlToken:**
Hook wyciągający token z URL query parameters.

```typescript
function useUrlToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  return token;
}
```

### 6.3 Redux (opcjonalnie)

Dla widoku Reset hasła nie jest wymagany globalny stan Redux, ponieważ:
- Proces jest standalone i nie wymaga współdzielenia stanu między komponentami
- Stan jest efemeryczny (trwa tylko podczas procesu resetu)
- Po zakończeniu procesu użytkownik jest przekierowany do logowania

Jednak jeśli aplikacja używa Redux dla auth flow, można rozważyć dodanie:
- `authSlice.resetPassword` - action do trackowania stanu resetu
- Toast notifications w globalnym stanie

## 7. Integracja API

### 7.1 Endpoint: Request Password Reset

**URL:** `POST /api/v1/auth/password-reset/request`

**Request:**
```typescript
interface RequestPasswordResetPayload {
  email: string;
}
```

**Request example:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```typescript
interface PasswordResetResponse {
  message: string;
}
```

**Response example:**
```json
{
  "message": "If the email exists, a password reset link has been sent."
}
```

**Error Responses:**
- **400 Bad Request** - Validation error
  ```json
  {
    "timestamp": "2025-01-08T17:30:00Z",
    "status": 400,
    "error": "BAD_REQUEST",
    "message": "Validation failed",
    "path": "/api/v1/auth/password-reset/request",
    "details": [
      {
        "field": "email",
        "message": "Email must be valid"
      }
    ]
  }
  ```

- **429 Too Many Requests** - Rate limit exceeded
  ```json
  {
    "timestamp": "2025-01-08T17:30:00Z",
    "status": 429,
    "error": "TOO_MANY_REQUESTS",
    "message": "Too many reset requests. Please try again in 15 minutes.",
    "retryAfter": 900
  }
  ```

**Frontend implementation:**
```typescript
import axios from 'axios';

async function requestPasswordReset(email: string): Promise<void> {
  try {
    const response = await axios.post('/api/v1/auth/password-reset/request', {
      email
    });

    // Zawsze pokazuj success message (security - nie ujawniaj czy email istnieje)
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 429) {
        throw new Error(data.message || 'Zbyt wiele żądań. Spróbuj ponownie później.');
      }

      if (status === 400) {
        const fieldError = data.details?.[0]?.message;
        throw new Error(fieldError || data.message || 'Nieprawidłowe dane');
      }

      throw new Error('Wystąpił błąd. Spróbuj ponownie później.');
    }

    throw error;
  }
}
```

### 7.2 Endpoint: Confirm Password Reset

**URL:** `POST /api/v1/auth/password-reset/confirm`

**Request:**
```typescript
interface ConfirmPasswordResetPayload {
  token: string;
  newPassword: string;
}
```

**Request example:**
```json
{
  "token": "a1b2c3d4e5f6g7h8",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200 OK):**
```typescript
interface PasswordResetResponse {
  message: string;
}
```

**Response example:**
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
- **400 Bad Request** - Invalid/expired token lub słabe hasło
  ```json
  {
    "timestamp": "2025-01-08T17:30:00Z",
    "status": 400,
    "error": "INVALID_TOKEN",
    "message": "Reset token is invalid or has expired"
  }
  ```
  lub
  ```json
  {
    "status": 400,
    "error": "VALIDATION_ERROR",
    "message": "Password does not meet requirements",
    "details": [
      {
        "field": "newPassword",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  }
  ```

- **404 Not Found** - Token nie znaleziony
  ```json
  {
    "status": 404,
    "error": "NOT_FOUND",
    "message": "Reset token not found"
  }
  ```

**Frontend implementation:**
```typescript
import axios from 'axios';

async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<void> {
  try {
    const response = await axios.post('/api/v1/auth/password-reset/confirm', {
      token,
      newPassword
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 400) {
        if (data.error === 'INVALID_TOKEN') {
          throw new Error('Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy link.');
        }

        const fieldError = data.details?.[0]?.message;
        throw new Error(fieldError || data.message || 'Hasło nie spełnia wymagań');
      }

      if (status === 404) {
        throw new Error('Link resetujący nie został znaleziony. Poproś o nowy link.');
      }

      throw new Error('Wystąpił błąd. Spróbuj ponownie później.');
    }

    throw error;
  }
}
```

### 7.3 Axios Client Configuration

**API client setup:**
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

// Response interceptor dla globalnej obsługi błędów
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logging errors (bez PII)
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      error: error.response?.data?.error
    });

    return Promise.reject(error);
  }
);
```

## 8. Interakcje użytkownika

### 8.1 Scenariusz 1: Request Password Reset (Happy Path)

**Krok 1:** Użytkownik wchodzi na stronę `/reset-password`
- **Wynik:** Widzi formularz z polem email i przyciskiem "Wyślij link resetujący"

**Krok 2:** Użytkownik wprowadza adres email i klika przycisk
- **Wynik:**
  - Przycisk pokazuje spinner i jest disabled
  - Formularz wysyła żądanie do API
  - Po sukcesie: Wyświetla się komunikat sukcesu z alert/toast
  - Komunikat: "Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetu hasła. Sprawdź swoją skrzynkę pocztową."

**Krok 3:** Użytkownik otwiera email i klika w link
- **Wynik:** Przekierowanie do `/reset-password/confirm?token=xxx`

### 8.2 Scenariusz 2: Confirm Password Reset (Happy Path)

**Krok 1:** Użytkownik klika link w emailu
- **Wynik:**
  - Przekierowanie do `/reset-password/confirm?token=xxx`
  - Widzi formularz z dwoma polami hasła i checklistą wymagań
  - Wszystkie wymagania są czerwone/niespełnione

**Krok 2:** Użytkownik zaczyna wpisywać nowe hasło
- **Wynik:**
  - PasswordRequirementsChecklist aktualizuje się w czasie rzeczywistym
  - Spełnione wymagania zmieniają kolor na zielony z checkmarkiem
  - Niespełnione pozostają czerwone z krzyżykiem

**Krok 3:** Użytkownik wpisuje wszystkie znaki spełniające wymagania
- **Wynik:** Wszystkie pozycje w checkliście są zielone

**Krok 4:** Użytkownik wpisuje to samo hasło w polu "Potwierdź hasło"
- **Wynik:**
  - Jeśli hasła się różnią → czerwony error message "Hasła muszą być identyczne"
  - Jeśli hasła są takie same → brak błędu

**Krok 5:** Użytkownik klika "Zresetuj hasło"
- **Wynik:**
  - Przycisk pokazuje spinner i jest disabled
  - Wysyłane jest żądanie do API
  - Po sukcesie:
    - Wyświetla się komunikat sukcesu "Hasło zostało pomyślnie zresetowane!"
    - Po 2 sekundach automatyczne przekierowanie do `/login`
    - Toast: "Możesz teraz zalogować się używając nowego hasła"

### 8.3 Scenariusz 3: Expired Token

**Krok 1:** Użytkownik klika stary link (>1h od wygenerowania)
- **Wynik:** Przekierowanie do `/reset-password/confirm?token=xxx`

**Krok 2:** Użytkownik wypełnia formularz i klika submit
- **Wynik:**
  - API zwraca error 400 "Token has expired"
  - Wyświetla się error message: "Link resetujący wygasł. Linki są ważne przez 1 godzinę."
  - Pod komunikatem przycisk/link: "Poproś o nowy link" → przekierowanie do `/reset-password`

### 8.4 Scenariusz 4: Słabe hasło (nie spełnia wymagań)

**Krok 1:** Użytkownik wpisuje hasło "password123"
- **Wynik:**
  - Checklist pokazuje:
    - ✓ Zielone: Co najmniej 8 znaków
    - ✓ Zielone: Co najmniej jedna mała litera
    - ✓ Zielone: Co najmniej jedna cyfra
    - ✗ Czerwone: Co najmniej jedna wielka litera
    - ✗ Czerwone: Co najmniej jeden znak specjalny
  - Przycisk submit jest disabled (opcjonalnie) lub pokazuje error po kliknięciu

**Krok 2:** Użytkownik próbuje submit
- **Wynik:**
  - Client-side validation error: "Hasło musi spełniać wszystkie wymagania"
  - Fokus wraca na pole hasła
  - Niespełnione wymagania pulsują (opcjonalna animacja)

### 8.5 Scenariusz 5: Rate Limiting

**Krok 1:** Użytkownik wysyła 4 żądania resetu w ciągu godziny
- **Wynik:**
  - API zwraca 429 Too Many Requests
  - Error toast: "Zbyt wiele prób. Możesz wysłać kolejne żądanie za 15 minut."
  - Przycisk submit disabled
  - Countdown timer pokazujący pozostały czas (opcjonalnie)

### 8.6 Scenariusz 6: Brak tokena w URL

**Krok 1:** Użytkownik próbuje wejść na `/reset-password/confirm` bez ?token=
- **Wynik:**
  - Automatyczne przekierowanie do `/reset-password`
  - Toast error: "Nieprawidłowy link resetujący. Poproś o nowy link."

### 8.7 Scenariusz 7: Toggle Password Visibility

**Krok 1:** Użytkownik klika ikonę oka przy polu hasła
- **Wynik:**
  - Pole zmienia type z "password" na "text"
  - Hasło jest widoczne w plain text
  - Ikona oka zmienia się na "oko przekreślone"

**Krok 2:** Użytkownik klika ponownie
- **Wynik:**
  - Pole wraca do type="password"
  - Hasło jest ukryte kropkami
  - Ikona wraca do normalnego oka

## 9. Warunki i walidacja

### 9.1 Walidacja strony Request (/reset-password)

#### Email - walidacja client-side:

**Warunek 1: Email jest wymagany**
- **Weryfikacja:** `email.length > 0`
- **Kiedy:** onBlur, onSubmit
- **Komunikat:** "Email jest wymagany"
- **Wpływ na UI:** Czerwone obramowanie inputa, error message pod polem, submit disabled

**Warunek 2: Email ma poprawny format**
- **Weryfikacja:** Zod `.email()` lub regex RFC 5322
- **Kiedy:** onBlur, onSubmit
- **Komunikat:** "Nieprawidłowy format adresu email"
- **Wpływ na UI:** Czerwone obramowanie, error message, submit disabled

**Warunek 3: Email nie przekracza 255 znaków**
- **Weryfikacja:** `email.length <= 255`
- **Kiedy:** onChange (prevent typing), onSubmit
- **Komunikat:** "Email jest za długi (max 255 znaków)"
- **Wpływ na UI:** Error message, submit disabled

#### Rate Limiting - walidacja server-side:

**Warunek: Maksymalnie 3 żądania na email w ciągu godziny**
- **Weryfikacja:** Backend sprawdza historię żądań
- **Kiedy:** onSubmit (po wywołaniu API)
- **Komunikat:** "Zbyt wiele prób. Możesz wysłać kolejne żądanie za X minut."
- **Wpływ na UI:**
  - Toast error z czerwonym tłem
  - Submit button disabled
  - Countdown timer (opcjonalnie)
  - Retry-After header z API → oblicz czas oczekiwania

### 9.2 Walidacja strony Confirm (/reset-password/confirm)

#### Token - walidacja:

**Warunek 1: Token jest obecny w URL**
- **Weryfikacja:** `URLSearchParams.get('token') !== null`
- **Kiedy:** useEffect przy montowaniu komponentu
- **Komunikat:** "Nieprawidłowy link resetujący"
- **Wpływ na UI:** Przekierowanie do `/reset-password` z toast error

**Warunek 2: Token jest valid (server-side)**
- **Weryfikacja:** Backend sprawdza czy token istnieje w DB
- **Kiedy:** onSubmit
- **Komunikat:** "Link resetujący nie został znaleziony"
- **Wpływ na UI:** Error alert, przycisk "Poproś o nowy link"

**Warunek 3: Token nie wygasł (server-side)**
- **Weryfikacja:** Backend sprawdza `expires_at > NOW()`
- **Kiedy:** onSubmit
- **Komunikat:** "Link resetujący wygasł. Linki są ważne przez 1 godzinę."
- **Wpływ na UI:** Error alert z wyjaśnieniem, przycisk "Poproś o nowy link"

**Warunek 4: Token nie był użyty (server-side)**
- **Weryfikacja:** Backend sprawdza `used_at IS NULL`
- **Kiedy:** onSubmit
- **Komunikat:** "Ten link został już użyty"
- **Wpływ na UI:** Error alert, przycisk "Poproś o nowy link"

#### Nowe hasło - walidacja client-side:

**Warunek 1: Hasło nie jest puste**
- **Weryfikacja:** `newPassword.length > 0`
- **Kiedy:** onSubmit
- **Komunikat:** "Hasło jest wymagane"
- **Wpływ na UI:** Error message pod polem, czerwone obramowanie

**Warunek 2: Hasło ma minimum 8 znaków**
- **Weryfikacja:** `newPassword.length >= 8`
- **Kiedy:** onChange (real-time), onSubmit
- **Komunikat:** "Hasło musi mieć co najmniej 8 znaków"
- **Wpływ na UI:**
  - W checkliście: ✗ czerwone → ✓ zielone gdy spełnione
  - Error message przy onSubmit jeśli nie spełnione

**Warunek 3: Hasło zawiera wielką literę**
- **Weryfikacja:** `/[A-Z]/.test(newPassword)`
- **Kiedy:** onChange (real-time), onSubmit
- **Komunikat:** "Hasło musi zawierać co najmniej jedną wielką literę"
- **Wpływ na UI:** Checklist item: ✗ → ✓, error przy submit

**Warunek 4: Hasło zawiera małą literę**
- **Weryfikacja:** `/[a-z]/.test(newPassword)`
- **Kiedy:** onChange (real-time), onSubmit
- **Komunikat:** "Hasło musi zawierać co najmniej jedną małą literę"
- **Wpływ na UI:** Checklist item: ✗ → ✓

**Warunek 5: Hasło zawiera cyfrę**
- **Weryfikacja:** `/\d/.test(newPassword)`
- **Kiedy:** onChange (real-time), onSubmit
- **Komunikat:** "Hasło musi zawierać co najmniej jedną cyfrę"
- **Wpływ na UI:** Checklist item: ✗ → ✓

**Warunek 6: Hasło zawiera znak specjalny**
- **Weryfikacja:** `/[@$!%*?&#]/.test(newPassword)`
- **Kiedy:** onChange (real-time), onSubmit
- **Komunikat:** "Hasło musi zawierać co najmniej jeden znak specjalny (@$!%*?&#)"
- **Wpływ na UI:** Checklist item: ✗ → ✓

#### Potwierdzenie hasła - walidacja client-side:

**Warunek 1: Potwierdzenie nie jest puste**
- **Weryfikacja:** `confirmPassword.length > 0`
- **Kiedy:** onSubmit
- **Komunikat:** "Potwierdzenie hasła jest wymagane"
- **Wpływ na UI:** Error message, czerwone obramowanie

**Warunek 2: Hasła są identyczne**
- **Weryfikacja:** `newPassword === confirmPassword`
- **Kiedy:** onBlur (confirmPassword), onSubmit
- **Komunikat:** "Hasła muszą być identyczne"
- **Wpływ na UI:**
  - Error message pod polem confirmPassword
  - Czerwone obramowanie obu pól
  - Submit disabled (opcjonalnie)

### 9.3 Podsumowanie warunków per komponent

**ResetRequestForm:**
- Email: required, valid format, max 255 chars
- Rate limiting: max 3 requests/hour per email (server-side)

**ResetConfirmForm:**
- Token: required (z URL), valid, not expired, not used (server-side)
- NewPassword: required, min 8 chars, uppercase, lowercase, digit, special char
- ConfirmPassword: required, must match newPassword

**PasswordRequirementsChecklist:**
- Walidacja read-only (display only)
- Pokazuje stan 5 wymagań hasła w real-time

## 10. Obsługa błędów

### 10.1 Błędy walidacji (Client-side)

#### Email - nieprawidłowy format
**Trigger:** User wprowadza "notanemail" i klika submit lub opuszcza pole (onBlur)
**Obsługa:**
- Wywołaj Zod validation
- Wyświetl error message pod polem: "Nieprawidłowy format adresu email"
- Dodaj czerwone obramowanie do inputa (`border-red-500`)
- Prevent submit (return early lub disable button)
- Fokus pozostaje na polu email

**Implementacja:**
```typescript
const handleBlur = () => {
  const result = resetRequestSchema.safeParse({ email });
  if (!result.success) {
    const emailError = result.error.issues.find(i => i.path[0] === 'email');
    setError(emailError?.message || null);
  }
};
```

#### Hasła nie pasują
**Trigger:** User wprowadza różne wartości w newPassword i confirmPassword
**Obsługa:**
- Wyświetl error pod confirmPassword: "Hasła muszą być identyczne"
- Czerwone obramowanie na obu polach hasła
- Submit disabled lub error przy próbie submit
- Clear error gdy user zaczyna pisać w którymkolwiek polu

**Implementacja:**
```typescript
const handleConfirmPasswordBlur = () => {
  if (confirmPassword && newPassword !== confirmPassword) {
    setError('Hasła muszą być identyczne');
  }
};

const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setNewPassword(e.target.value);
  if (error) setError(null); // Clear error on change
};
```

#### Hasło nie spełnia wymagań
**Trigger:** User próbuje submit formularza z hasłem nie spełniającym wymagań
**Obsługa:**
- PasswordRequirementsChecklist pokazuje które wymagania nie są spełnione (czerwone ✗)
- Error message nad checklistą: "Hasło musi spełniać wszystkie wymagania"
- Focus wraca na pole newPassword
- Submit disabled (opcjonalnie) lub prevent submit

**Implementacja:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const validation = usePasswordValidation(newPassword);
  if (!validation.allMet) {
    setError('Hasło musi spełniać wszystkie wymagania');
    return;
  }

  // Proceed with API call...
};
```

### 10.2 Błędy API (Server-side)

#### Rate Limiting (429 Too Many Requests)
**Trigger:** User wysyła więcej niż 3 żądania resetu w ciągu godziny
**Response:**
```json
{
  "status": 429,
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many reset requests. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

**Obsługa:**
- Wyświetl Toast error z czerwonym tłem
- Komunikat: "Zbyt wiele prób. Możesz wysłać kolejne żądanie za 15 minut."
- Disable submit button
- Opcjonalnie: countdown timer pokazujący pozostały czas
- Po upływie czasu enable button

**Implementacja:**
```typescript
const handleRequestReset = async () => {
  try {
    await requestPasswordReset(email);
    setSuccess(true);
  } catch (error: any) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data.retryAfter; // seconds
      setError(`Zbyt wiele prób. Spróbuj ponownie za ${Math.ceil(retryAfter / 60)} minut.`);
      setSubmitDisabled(true);

      // Opcjonalnie: countdown
      setTimeout(() => setSubmitDisabled(false), retryAfter * 1000);
    } else {
      setError('Wystąpił błąd. Spróbuj ponownie później.');
    }
  }
};
```

#### Token wygasł (400 Bad Request)
**Trigger:** User klika link starszy niż 1 godzina
**Response:**
```json
{
  "status": 400,
  "error": "INVALID_TOKEN",
  "message": "Reset token is invalid or has expired"
}
```

**Obsługa:**
- Wyświetl Alert error na stronie confirm
- Komunikat: "Link resetujący wygasł. Linki są ważne przez 1 godzinę."
- Dodatkowy tekst: "Poproś o nowy link, aby zresetować hasło."
- Przycisk: "Poproś o nowy link" → przekierowanie do `/reset-password`
- Disable submit button na formularzu

**Implementacja:**
```typescript
const handleConfirmReset = async () => {
  try {
    await confirmPasswordReset(token, newPassword);
    setSuccess(true);
    setTimeout(() => navigate('/login'), 2000);
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errorCode = error.response.data.error;

      if (errorCode === 'INVALID_TOKEN') {
        setError('Link resetujący wygasł lub jest nieprawidłowy.');
        setShowRequestNewLink(true);
      } else {
        setError(error.response.data.message || 'Hasło nie spełnia wymagań');
      }
    } else {
      setError('Wystąpił błąd. Spróbuj ponownie później.');
    }
  }
};
```

#### Token już użyty (400 Bad Request)
**Trigger:** User klika ten sam link drugi raz
**Response:**
```json
{
  "status": 400,
  "error": "TOKEN_ALREADY_USED",
  "message": "This reset link has already been used"
}
```

**Obsługa:**
- Wyświetl Alert error
- Komunikat: "Ten link został już użyty."
- Wyjaśnienie: "Jeśli nadal chcesz zmienić hasło, poproś o nowy link."
- Przycisk: "Poproś o nowy link" → `/reset-password`

#### Token nie znaleziony (404 Not Found)
**Trigger:** User używa nieprawidłowego tokena (zmienionego, nieistniejącego)
**Response:**
```json
{
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Reset token not found"
}
```

**Obsługa:**
- Alert error: "Link resetujący nie został znaleziony."
- Tekst: "Upewnij się, że skopiowałeś cały link z emaila lub poproś o nowy."
- Przycisk: "Poproś o nowy link"

### 10.3 Błędy sieciowe (Network Errors)

#### Brak połączenia z internetem
**Trigger:** User jest offline lub serwer nie odpowiada
**Obsługa:**
- Toast error: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Enable retry button
- Offline indicator (opcjonalnie)

**Implementacja:**
```typescript
try {
  await requestPasswordReset(email);
} catch (error: any) {
  if (!navigator.onLine) {
    setError('Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.');
  } else if (error.code === 'ECONNABORTED') {
    setError('Przekroczono limit czasu. Spróbuj ponownie.');
  } else {
    setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
  }
}
```

#### Timeout (request timeout)
**Trigger:** Request trwa dłużej niż 10 sekund (axios timeout)
**Obsługa:**
- Toast error: "Przekroczono limit czasu. Spróbuj ponownie."
- Enable retry button

#### Server Error (500 Internal Server Error)
**Trigger:** Backend error (uncaught exception, database error, etc.)
**Obsługa:**
- Toast error: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- Jeśli błąd persystuje → show message: "Jeśli problem się powtarza, skontaktuj się z pomocą techniczną."
- Enable retry button

### 10.4 Edge Cases

#### User odświeża stronę confirm
**Scenario:** User jest na `/reset-password/confirm?token=xxx` i odświeża stronę (F5)
**Obsługa:**
- Token jest nadal w URL → form reloads z tokenem
- Jeśli user już wcześniej submit → API zwróci "token already used"
- Wyświetl odpowiedni error (patrz wyżej)

#### User kopiuje link i używa na innym urządzeniu
**Scenario:** User otwiera link na innym urządzeniu/przeglądarce
**Obsługa:**
- Działa normalnie jeśli token jest valid
- Jeśli token wygasł/użyty → standardowy error handling

#### Wiele zakładek/okien
**Scenario:** User otwiera link w dwóch zakładkach i submittuje w obu
**Obsługa:**
- Pierwszy submit succeed → token marked as used
- Drugi submit fail → "Token already used" error
- Wyświetl error message i przycisk "Request new link"

#### Brak tokena w URL
**Scenario:** User wchodzi na `/reset-password/confirm` bez ?token=
**Obsługa:**
- useEffect przy montowaniu sprawdza obecność tokena
- Jeśli brak → redirect do `/reset-password`
- Toast error: "Nieprawidłowy link resetujący. Poproś o nowy link."

**Implementacja:**
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get('token');

  if (!tokenParam) {
    navigate('/reset-password');
    showToast('Nieprawidłowy link resetujący. Poproś o nowy link.', 'error');
    return;
  }

  setToken(tokenParam);
}, []);
```

### 10.5 Accessibility dla błędów

#### Aria-live dla komunikatów błędów
**Implementacja:**
- Error messages w `<div role="alert" aria-live="assertive">`
- Screen reader ogłasza błędy natychmiast

#### Aria-describedby dla pól z błędami
**Implementacja:**
```tsx
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <div id="email-error" role="alert" className="text-red-600">
    {error}
  </div>
)}
```

#### Focus management
- Po błędzie walidacji → focus wraca na pierwsze pole z błędem
- Po submit error → focus na error message lub pierwsze błędne pole

## 11. Kroki implementacji

### Faza 1: Setup i struktura (1-2 godziny)

**Krok 1.1: Utworzenie stron Astro**
- Utwórz `src/pages/reset-password.astro`
  - Użyj AuthLayout.astro jako layout
  - Dodaj meta tags (title, description)
  - Import ResetRequestForm jako React island z `client:load`
- Utwórz `src/pages/reset-password/confirm.astro`
  - Użyj AuthLayout.astro jako layout
  - Import ResetConfirmForm jako React island z `client:load`

**Przykład reset-password.astro:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import ResetRequestForm from '@/components/auth/ResetRequestForm';
---

<AuthLayout title="Reset hasła - mkrew">
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Zresetuj hasło
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Podaj swój adres email, a wyślemy Ci link do resetu hasła.
        </p>
      </div>
      <ResetRequestForm client:load />
    </div>
  </div>
</AuthLayout>
```

**Krok 1.2: Utworzenie katalogu komponentów**
- Utwórz `src/components/auth/` jeśli nie istnieje
- Przygotuj strukturę plików:
  ```
  src/components/auth/
  ├── ResetRequestForm.tsx
  ├── ResetConfirmForm.tsx
  ├── PasswordRequirementsChecklist.tsx
  └── ToggleVisibilityButton.tsx
  ```

**Krok 1.3: Konfiguracja API client**
- Upewnij się, że `src/lib/api/client.ts` istnieje z axios instance
- Dodaj helper functions do `src/lib/api/endpoints/auth.ts`:
  - `requestPasswordReset(email: string)`
  - `confirmPasswordReset(token: string, newPassword: string)`

### Faza 2: Typy i schematy walidacji (30 minut)

**Krok 2.1: Zdefiniowanie typów TypeScript**
- Utwórz `src/lib/types/auth.ts` lub dodaj do istniejącego pliku:
  ```typescript
  export interface ResetRequestFormData {
    email: string;
  }

  export interface ResetConfirmFormData {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }

  export interface PasswordRequirement {
    id: string;
    label: string;
    test: (password: string) => boolean;
    met?: boolean;
  }

  export interface PasswordValidationResult {
    requirements: PasswordRequirement[];
    allMet: boolean;
    strength: 'weak' | 'medium' | 'strong';
  }
  ```

**Krok 2.2: Utworzenie schematów Zod**
- Utwórz `src/lib/validation/auth.ts` lub dodaj do istniejącego:
  ```typescript
  import { z } from 'zod';

  export const resetRequestSchema = z.object({
    email: z
      .string()
      .min(1, 'Email jest wymagany')
      .email('Nieprawidłowy format email')
      .max(255, 'Email jest za długi')
  });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

  export const resetConfirmSchema = z.object({
    token: z.string().min(1, 'Token jest wymagany'),
    newPassword: z
      .string()
      .min(8, 'Hasło musi mieć co najmniej 8 znaków')
      .regex(passwordRegex, 'Hasło nie spełnia wymagań'),
    confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane')
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Hasła muszą być identyczne',
      path: ['confirmPassword']
    }
  );
  ```

### Faza 3: Custom hooki (45 minut)

**Krok 3.1: usePasswordValidation hook**
- Utwórz `src/lib/hooks/usePasswordValidation.ts`:
  ```typescript
  import { useMemo } from 'react';
  import type { PasswordRequirement, PasswordValidationResult } from '@/lib/types/auth';

  export function usePasswordValidation(password: string): PasswordValidationResult {
    return useMemo(() => {
      const requirements: PasswordRequirement[] = [
        {
          id: 'length',
          label: 'Co najmniej 8 znaków',
          test: (pwd) => pwd.length >= 8,
          met: password.length >= 8
        },
        {
          id: 'uppercase',
          label: 'Co najmniej jedna wielka litera (A-Z)',
          test: (pwd) => /[A-Z]/.test(pwd),
          met: /[A-Z]/.test(password)
        },
        {
          id: 'lowercase',
          label: 'Co najmniej jedna mała litera (a-z)',
          test: (pwd) => /[a-z]/.test(pwd),
          met: /[a-z]/.test(password)
        },
        {
          id: 'digit',
          label: 'Co najmniej jedna cyfra (0-9)',
          test: (pwd) => /\d/.test(pwd),
          met: /\d/.test(password)
        },
        {
          id: 'special',
          label: 'Co najmniej jeden znak specjalny (@$!%*?&#)',
          test: (pwd) => /[@$!%*?&#]/.test(pwd),
          met: /[@$!%*?&#]/.test(password)
        }
      ];

      const allMet = requirements.every(req => req.met);
      const metCount = requirements.filter(req => req.met).length;

      let strength: 'weak' | 'medium' | 'strong';
      if (metCount <= 2) strength = 'weak';
      else if (metCount <= 4) strength = 'medium';
      else strength = 'strong';

      return { requirements, allMet, strength };
    }, [password]);
  }
  ```

**Krok 3.2: useUrlToken hook**
- Utwórz `src/lib/hooks/useUrlToken.ts`:
  ```typescript
  import { useState, useEffect } from 'react';

  export function useUrlToken(): string | null {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      setToken(tokenParam);
    }, []);

    return token;
  }
  ```

### Faza 4: Komponenty UI primitives (1 godzina)

**Krok 4.1: ToggleVisibilityButton**
- Utwórz `src/components/auth/ToggleVisibilityButton.tsx`:
  ```typescript
  import React from 'react';
  import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // lub inna biblioteka ikon

  interface ToggleVisibilityButtonProps {
    visible: boolean;
    onToggle: () => void;
    ariaLabel?: string;
  }

  export default function ToggleVisibilityButton({
    visible,
    onToggle,
    ariaLabel = 'Toggle password visibility'
  }: ToggleVisibilityButtonProps) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        aria-label={ariaLabel}
      >
        {visible ? (
          <EyeSlashIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
    );
  }
  ```

**Krok 4.2: PasswordRequirementsChecklist**
- Utwórz `src/components/auth/PasswordRequirementsChecklist.tsx`:
  ```typescript
  import React from 'react';
  import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
  import { usePasswordValidation } from '@/lib/hooks/usePasswordValidation';

  interface PasswordRequirementsChecklistProps {
    password: string;
    className?: string;
  }

  export default function PasswordRequirementsChecklist({
    password,
    className = ''
  }: PasswordRequirementsChecklistProps) {
    const { requirements } = usePasswordValidation(password);

    return (
      <div className={`mt-4 ${className}`}>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Hasło musi spełniać następujące wymagania:
        </p>
        <ul className="space-y-2">
          {requirements.map((requirement) => (
            <li
              key={requirement.id}
              className="flex items-start space-x-2 text-sm"
            >
              {requirement.met ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <span className={requirement.met ? 'text-green-700' : 'text-gray-600'}>
                {requirement.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  ```

### Faza 5: ResetRequestForm (1.5 godziny)

**Krok 5.1: Struktura komponentu**
- Utwórz `src/components/auth/ResetRequestForm.tsx`:
  ```typescript
  import React, { useState } from 'react';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { useForm } from 'react-hook-form';
  import { resetRequestSchema } from '@/lib/validation/auth';
  import { requestPasswordReset } from '@/lib/api/endpoints/auth';
  import type { ResetRequestFormData } from '@/lib/types/auth';

  export default function ResetRequestForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
      register,
      handleSubmit,
      formState: { errors }
    } = useForm<ResetRequestFormData>({
      resolver: zodResolver(resetRequestSchema)
    });

    const onSubmit = async (data: ResetRequestFormData) => {
      // Implementacja w kolejnym kroku
    };

    if (success) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Sprawdź swoją skrzynkę pocztową
          </h3>
          <p className="text-sm text-green-700">
            Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link do resetu hasła.
            Sprawdź swoją skrzynkę pocztową (w tym folder spam).
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        {/* Pola formularza - następny krok */}
      </form>
    );
  }
  ```

**Krok 5.2: Dodanie pól formularza i logiki submit**
- Implementacja pełnego formularza z obsługą błędów
- Integracja z API
- Loading states i feedback

**Krok 5.3: Testowanie manualne**
- Test happy path (prawidłowy email)
- Test błędów walidacji (nieprawidłowy format, puste pole)
- Test rate limiting (symulacja wielokrotnych requestów)

### Faza 6: ResetConfirmForm (2 godziny)

**Krok 6.1: Struktura komponentu**
- Utwórz `src/components/auth/ResetConfirmForm.tsx`
- Implementacja stanu, form hooks, extracting token z URL

**Krok 6.2: Integracja PasswordRequirementsChecklist**
- Dodanie komponentu do formularza
- Real-time update na onChange

**Krok 6.3: Toggle visibility dla haseł**
- Dodanie ToggleVisibilityButton do obu pól
- Zarządzanie stanem showPassword/showConfirmPassword

**Krok 6.4: Submit logic i API integration**
- Implementacja onSubmit
- Obsługa sukcesu (redirect do /login po 2s)
- Obsługa błędów (expired token, weak password, etc.)

**Krok 6.5: Edge cases**
- Brak tokena w URL → redirect
- Token validation errors
- Success/error states

### Faza 7: API Integration (1 godzina)

**Krok 7.1: Utworzenie endpoint functions**
- Utwórz/zaktualizuj `src/lib/api/endpoints/auth.ts`:
  ```typescript
  import { apiClient } from '../client';
  import type { ResetRequestFormData, ResetConfirmFormData } from '@/lib/types/auth';

  export async function requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/password-reset/request', { email });
    return response.data;
  }

  export async function confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/password-reset/confirm', {
      token,
      newPassword
    });
    return response.data;
  }
  ```

**Krok 7.2: Error handling utils**
- Utwórz `src/lib/utils/errorMessages.ts` z mapowaniem błędów:
  ```typescript
  export const ERROR_MESSAGES: Record<string, string> = {
    'INVALID_TOKEN': 'Link resetujący wygasł lub jest nieprawidłowy',
    'TOKEN_ALREADY_USED': 'Ten link został już użyty',
    'TOO_MANY_REQUESTS': 'Zbyt wiele prób. Spróbuj ponownie później',
    'WEAK_PASSWORD': 'Hasło nie spełnia wymagań bezpieczeństwa',
    'NETWORK_ERROR': 'Błąd połączenia. Sprawdź internet i spróbuj ponownie',
    'SERVER_ERROR': 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę'
  };

  export function getErrorMessage(error: any): string {
    const errorCode = error.response?.data?.error;
    return ERROR_MESSAGES[errorCode] || error.message || ERROR_MESSAGES.SERVER_ERROR;
  }
  ```

### Faza 8: Styling i responsywność (1 godzina)

**Krok 8.1: Tailwind classes dla formularzy**
- Stylowanie inputów, buttonów, error messages
- Responsive design (mobile-first)
- Focus states, hover states

**Krok 8.2: Accessibility**
- ARIA labels i descriptions
- Focus management
- Keyboard navigation
- aria-live dla error messages

**Krok 8.3: Loading states**
- Spinner na przycisku podczas submit
- Disable form podczas submitu
- Skeleton screens (opcjonalnie)

### Faza 9: Testing (1.5 godziny)

**Krok 9.1: Manual testing**
- Test całego flow end-to-end:
  1. Request reset → check email placeholder (jeśli dev bez email)
  2. Confirm z valid token → success
  3. Expired token → proper error
  4. Used token → proper error
  5. Weak password → validation errors
  6. Rate limiting → proper handling

**Krok 9.2: Edge cases testing**
- Brak tokena w URL
- Refresh strony
- Wiele zakładek
- Network errors (offline testing)
- Mobile responsiveness

**Krok 9.3: Accessibility testing**
- Keyboard navigation (tab through all fields)
- Screen reader testing (z NVDA/JAWS/VoiceOver)
- Focus indicators visible
- Error announcements

### Faza 10: Dokumentacja i finalizacja (30 minut)

**Krok 10.1: Komentarze w kodzie**
- JSDoc comments dla funkcji i komponentów
- Inline comments dla złożonej logiki

**Krok 10.2: README/dokumentacja**
- Dodanie sekcji o Password Reset do dokumentacji
- Screenshots (opcjonalnie)
- Known issues/limitations

**Krok 10.3: Code cleanup**
- Usunięcie console.logs
- Formatting (Prettier)
- Linting (ESLint)
- Remove unused imports

### Podsumowanie czasów:
- **Faza 1:** Setup - 1-2h
- **Faza 2:** Typy i walidacja - 0.5h
- **Faza 3:** Custom hooki - 0.75h
- **Faza 4:** UI primitives - 1h
- **Faza 5:** ResetRequestForm - 1.5h
- **Faza 6:** ResetConfirmForm - 2h
- **Faza 7:** API Integration - 1h
- **Faza 8:** Styling i a11y - 1h
- **Faza 9:** Testing - 1.5h
- **Faza 10:** Dokumentacja - 0.5h

**Łączny czas:** ~10-11 godzin

### Uwagi końcowe:
1. **Priorytet bezpieczeństwa:** Zawsze waliduj po stronie serwera, client-side jest tylko dla UX
2. **Nie leakuj informacji:** Nie ujawniaj czy email istnieje w systemie
3. **Accessibility first:** Testuj z keyboard i screen readerem
4. **Error handling:** Każdy error case musi mieć jasny komunikat dla użytkownika
5. **Mobile UX:** Password visibility toggle jest kluczowy na mobile
6. **Testing:** Testuj wszystkie edge cases przed deployem
