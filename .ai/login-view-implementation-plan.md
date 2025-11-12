# Plan implementacji widoku Logowania

## 1. Przegląd

Widok logowania to strona uwierzytelniania umożliwiająca zalogowanym użytkownikom dostęp do chronionej części aplikacji. Głównym celem jest bezpieczna weryfikacja tożsamości użytkownika poprzez formularz email + hasło, z dodatkową ochroną przed atakami brute-force w postaci rate limitingu i opcjonalnego CAPTCHA. Widok jest renderowany server-side (SSR) dla lepszej wydajności i SEO, z interaktywnymi elementami formularza jako React islands. Po pomyślnym zalogowaniu użytkownik otrzymuje token JWT i jest przekierowywany do dashboardu.

## 2. Routing widoku

- **Ścieżka**: `/login`
- **Plik**: `src/pages/login.astro`
- **Typ renderowania**: Server-Side Rendering (SSR)
- **Dostępność**: Publiczna (niezalogowani użytkownicy)
- **Query Parameters**:
  - `redirect` (optional) - URL przekierowania po zalogowaniu (default: `/dashboard`)
  - `verified` (optional, boolean) - flag informujący o pomyślnej weryfikacji email (wyświetl success message)
- **Redirect logic**:
  - Jeśli użytkownik jest już zalogowany → redirect do `/dashboard`
  - Po pomyślnym logowaniu → redirect do `redirect` param lub `/dashboard`

Przykład URL: `/login?redirect=/favorites&verified=true`

## 3. Struktura komponentów

```
LoginPage (src/pages/login.astro)
├── AuthLayout
│   ├── SEO (meta tags)
│   └── Navbar (minimal, logo + link do home)
├── Main Container
│   ├── VerificationSuccessMessage (conditional, if verified=true)
│   ├── LoginFormContainer
│   │   ├── Header
│   │   │   ├── H1: "Zaloguj się"
│   │   │   └── Description
│   │   ├── LoginForm (React island, client:load)
│   │   │   ├── Form element
│   │   │   ├── ErrorMessage (conditional, global form error)
│   │   │   ├── RateLimitNotice (conditional, if locked)
│   │   │   ├── EmailInput
│   │   │   │   ├── Label
│   │   │   │   ├── Input (type="email")
│   │   │   │   └── FieldError (conditional)
│   │   │   ├── PasswordInput
│   │   │   │   ├── Label
│   │   │   │   ├── Input (type="password")
│   │   │   │   ├── ToggleVisibilityButton (show/hide password)
│   │   │   │   └── FieldError (conditional)
│   │   │   ├── RememberMeCheckbox (optional, z warning)
│   │   │   ├── Captcha (conditional, after 3 failed attempts)
│   │   │   └── SubmitButton (with loading state)
│   │   ├── LinksSection
│   │   │   ├── ForgotPasswordLink → `/reset-password`
│   │   │   └── RegisterLink → `/register`
│   │   └── SecurityNotice
│   └── Footer (AuthLayout footer)
```

## 4. Szczegóły komponentów

### LoginPage (src/pages/login.astro)

- **Opis komponentu**: Główna strona Astro renderowana jako SSR. Odpowiedzialna za strukturę całego widoku, SEO, sprawdzenie czy użytkownik jest już zalogowany (middleware), i przekazanie query params do komponentów React.

- **Główne elementy**:
  - `<AuthLayout>` - layout strony z minimalną nawigacją
  - `<SEO>` component z meta tags
  - `<main>` container z centered layout
  - `<VerificationSuccessMessage>` (conditional)
  - `<LoginForm>` - React island (client:load)
  - `<LinksSection>` - linki do reset password i rejestracji

- **Obsługiwane interakcje**:
  - Server-side: parsowanie query params (`verified`, `redirect`)
  - Server-side: sprawdzenie auth state (middleware)
  - Client-side: hydration React island

- **Obsługiwana walidacja**:
  - Middleware: jeśli użytkownik już zalogowany → redirect do `/dashboard`
  - Sanityzacja `redirect` param (prevent open redirect attacks)

- **Typy**:
  - `LoginPageProps` (page props)

- **Propsy**:
  ```typescript
  interface LoginPageProps {
    verified?: boolean;
    redirectUrl?: string;
  }
  ```

### LoginForm (src/components/auth/LoginForm.tsx)

- **Opis komponentu**: Główny formularz logowania. React component (client:load island) zarządzający stanem formularza, walidacją, submitem do API, rate limitingiem, i CAPTCHA. Używa React Hook Form dla zarządzania formularzem i Zod dla walidacji schematu.

- **Główne elementy**:
  - `<form onSubmit={handleSubmit}>` - główny element formularza
  - `<ErrorMessage>` - global error (conditional)
  - `<RateLimitNotice>` (conditional, if locked)
  - `<EmailInput>` - pole email
  - `<PasswordInput>` - pole hasła
  - `<RememberMeCheckbox>` (optional)
  - `<Captcha>` (conditional, after 3 attempts)
  - `<SubmitButton>` - przycisk submit z loading state

- **Obsługiwane interakcje**:
  - `onSubmit` → walidacja → API call → handle response
  - `onChange` na inputach → update form state
  - Click na "Show/Hide password" → toggle password visibility
  - Rate limit tracking: increment attemptCount in localStorage
  - Lockout: disable form for 5 minutes after 5 failed attempts
  - CAPTCHA: show after 3 failed attempts, verify token before submit

- **Obsługiwana walidacja**:
  - **Email**:
    - Required: "Email jest wymagany"
    - Valid format: "Wprowadź prawidłowy adres email"
    - Max length 255: "Email jest zbyt długi"
  - **Password**:
    - Required: "Hasło jest wymagane"
    - (Brak minimalnej długości dla logowania - backend weryfikuje)
  - **CAPTCHA** (if shown):
    - Required: "Potwierdź, że nie jesteś robotem"

- **Typy**:
  - `LoginFormProps`
  - `LoginFormData`
  - `LoginFormState`

- **Propsy**:
  ```typescript
  interface LoginFormProps {
    redirectUrl?: string; // URL przekierowania po logowaniu
    onSuccess?: (user: User) => void; // callback po sukcesie
  }
  ```

### EmailInput (src/components/forms/EmailInput.tsx)

- **Opis komponentu**: Komponent pola email z labelem, inputem, i wyświetlaniem błędów walidacji. Reusable form field component używający React Hook Form integration.

- **Główne elementy**:
  - `<div>` - field container
  - `<label htmlFor="email">` - accessible label "Adres email"
  - `<input type="email" id="email">` - pole inputu
  - `<FieldError>` (conditional) - komunikat błędu

- **Obsługiwane interakcje**:
  - `onChange` → update form state (React Hook Form)
  - `onBlur` → trigger validation
  - Focus state

- **Obsługiwana walidacja**:
  - Required
  - Valid email format (HTML5 + Zod)
  - Max length 255 chars

- **Typy**:
  - `EmailInputProps` (extends React Hook Form field props)

- **Propsy**:
  ```typescript
  interface EmailInputProps {
    error?: string; // error message from validation
    disabled?: boolean; // disabled state (during submit or lockout)
  }
  ```

### PasswordInput (src/components/forms/PasswordInput.tsx)

- **Opis komponentu**: Komponent pola hasła z labelem, inputem, przyciskiem toggle visibility (show/hide), i wyświetlaniem błędów. Wspiera pokazywanie/ukrywanie hasła dla lepszej UX.

- **Główne elementy**:
  - `<div>` - field container
  - `<label htmlFor="password">` - accessible label "Hasło"
  - `<div>` - input wrapper (relative positioning)
    - `<input type="password" | "text" id="password">` - pole inputu
    - `<button type="button">` - toggle visibility icon (eye/eye-off)
  - `<FieldError>` (conditional) - komunikat błędu

- **Obsługiwane interakcje**:
  - `onChange` → update form state
  - `onBlur` → trigger validation
  - Click na toggle button → switch between type="password" and type="text"
  - Focus state

- **Obsługiwana walidacja**:
  - Required

- **Typy**:
  - `PasswordInputProps`

- **Propsy**:
  ```typescript
  interface PasswordInputProps {
    error?: string;
    disabled?: boolean;
  }
  ```

### RememberMeCheckbox (src/components/forms/RememberMeCheckbox.tsx)

- **Opis komponentu**: Checkbox "Zapamiętaj mnie" z tooltipem ostrzegającym o security implications. Opcjonalny element, kontroluje czy użytkownik chce dłuższą sesję (może wpływać na token TTL).

- **Główne elementy**:
  - `<div>` - checkbox container
  - `<input type="checkbox" id="rememberMe">` - checkbox
  - `<label htmlFor="rememberMe">` - label "Zapamiętaj mnie"
  - `<TooltipIcon>` - ikona "i" z tooltipem:
    - "Nie zaznaczaj tej opcji na urządzeniach publicznych"

- **Obsługiwane interakcje**:
  - `onChange` → update form state (rememberMe boolean)
  - Hover na tooltip icon → show tooltip

- **Obsługiwana walidacja**: Brak (optional checkbox)

- **Typy**:
  - `RememberMeCheckboxProps`

- **Propsy**:
  ```typescript
  interface RememberMeCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }
  ```

### RateLimitNotice (src/components/auth/RateLimitNotice.tsx)

- **Opis komponentu**: Alert/notice wyświetlany gdy użytkownik przekroczył limit prób logowania (5 prób). Pokazuje countdown do momentu odblokowania (5 minut). Blokuje formularz podczas lockoutu.

- **Główne elementy**:
  - `<div role="alert">` - alert container (red/warning styling)
  - `<AlertIcon>` - ikona ostrzeżenia
  - `<div>` - message container
    - `<strong>` - "Konto tymczasowo zablokowane"
    - `<p>` - "Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za {countdown}."
  - `<Countdown>` - live countdown timer (MM:SS)

- **Obsługiwane interakcje**:
  - Live countdown: useEffect z setInterval, update co 1s
  - Po zakończeniu countdown → auto unlock (clear lockout state)

- **Obsługiwana walidacja**: Brak (informacyjny komponent)

- **Typy**:
  - `RateLimitNoticeProps`

- **Propsy**:
  ```typescript
  interface RateLimitNoticeProps {
    lockedUntil: number; // timestamp (Date.now() + 5 min)
    onUnlock: () => void; // callback when countdown ends
  }
  ```

### Captcha (src/components/auth/Captcha.tsx)

- **Opis komponentu**: CAPTCHA widget (Google reCAPTCHA v2 lub v3, lub hCaptcha). Wyświetlany po 3 nieudanych próbach logowania. Wymaga rozwiązania przed możliwością ponownego submitu formularza.

- **Główne elementy**:
  - `<div>` - captcha container
  - `<ReCAPTCHA>` (z biblioteki react-google-recaptcha) - widget CAPTCHA
  - `<FieldError>` (conditional) - error jeśli captcha nie została rozwiązana

- **Obsługiwane interakcje**:
  - User solves CAPTCHA → callback z tokenem
  - onChange → update form state (captchaToken)
  - onExpired → reset captchaToken

- **Obsługiwana walidacja**:
  - Required (when shown): "Potwierdź, że nie jesteś robotem"
  - Token validation przez backend podczas logowania

- **Typy**:
  - `CaptchaProps`

- **Propsy**:
  ```typescript
  interface CaptchaProps {
    siteKey: string; // reCAPTCHA site key z env
    onChange: (token: string | null) => void;
    error?: string;
  }
  ```

### SubmitButton (src/components/forms/SubmitButton.tsx)

- **Opis komponentu**: Przycisk submit formularza z loading state (spinner) i disabled state. Wyświetla "Zaloguj się" normalnie, "Logowanie..." podczas submitu.

- **Główne elementy**:
  - `<button type="submit">` - submit button
  - `<Spinner>` (conditional, when loading) - loading spinner icon
  - `<span>` - button text ("Zaloguj się" | "Logowanie...")

- **Obsługiwane interakcje**:
  - Click → trigger form submit (handled by form onSubmit)
  - Keyboard: Enter → submit
  - Disabled during: submitting, rate limit lockout

- **Obsługiwana walidacja**: Brak (trigger validation jest w formie)

- **Typy**:
  - `SubmitButtonProps`

- **Propsy**:
  ```typescript
  interface SubmitButtonProps {
    loading: boolean;
    disabled: boolean;
  }
  ```

### ErrorMessage (src/components/forms/ErrorMessage.tsx)

- **Opis komponentu**: Global error message wyświetlany na górze formularza dla błędów API (401, 403, 429, network errors). Używa `role="alert"` dla accessibility.

- **Główne elementy**:
  - `<div role="alert" aria-live="assertive">` - alert container
  - `<ErrorIcon>` - ikona błędu
  - `<p>` - error message text

- **Obsługiwane interakcje**:
  - Auto-focus na pojawienie się (dla screen readers)
  - Może zawierać link (np. "Zweryfikuj email" dla 403 error)

- **Obsługiwana walidacja**: Brak (display only)

- **Typy**:
  - `ErrorMessageProps`

- **Propsy**:
  ```typescript
  interface ErrorMessageProps {
    message: string;
    type?: 'error' | 'warning' | 'info'; // styling variant
  }
  ```

### VerificationSuccessMessage (src/components/auth/VerificationSuccessMessage.tsx)

- **Opis komponentu**: Success banner wyświetlany na górze strony jeśli query param `verified=true`. Informuje użytkownika o pomyślnej weryfikacji email i zachęca do zalogowania.

- **Główne elementy**:
  - `<div role="status">` - success banner (green background)
  - `<SuccessIcon>` - check icon
  - `<p>` - "Email został pomyślnie zweryfikowany! Możesz się teraz zalogować."

- **Obsługiwane interakcje**:
  - Auto-dismiss po 10 sekundach (optional)
  - Close button (X) do manualnego zamknięcia

- **Obsługiwana walidacja**: Brak

- **Typy**:
  - `VerificationSuccessMessageProps`

- **Propsy**:
  ```typescript
  interface VerificationSuccessMessageProps {
    onClose?: () => void;
  }
  ```

## 5. Typy

Wszystkie typy zdefiniowane w `src/types/auth.ts`:

```typescript
// ===== API Request/Response Types (mapowane z backendu) =====

/**
 * Request body dla POST /api/v1/auth/login
 * Backend: LoginRequest.java
 */
export interface LoginRequest {
  email: string; // Required, valid email format
  password: string; // Required
}

/**
 * Response body z POST /api/v1/auth/login
 * Backend: LoginResponse.java
 */
export interface LoginResponse {
  accessToken: string; // JWT token
  tokenType: string; // "Bearer"
  expiresIn: number; // Token TTL in seconds (3600 = 1 hour)
  refreshToken: string; // Refresh token for token renewal
  user: User; // User data
}

/**
 * User data DTO
 * Backend: UserDto.java
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: string | null; // "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-" lub null
  emailVerified: boolean;
  role: UserRole; // "USER" | "ADMIN"
}

/**
 * User role enum
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * Error response z API
 * Backend: ErrorResponse.java
 */
export interface ErrorResponse {
  timestamp: string; // ISO 8601
  status: number; // HTTP status code
  error: string; // Error type (e.g., "INVALID_CREDENTIALS")
  message: string; // Human-readable error message
  path: string; // Request path
  details?: ValidationError[]; // Validation errors (optional)
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string; // Field name (e.g., "email")
  message: string; // Error message
  rejectedValue?: any; // Rejected value (optional)
}

// ===== Form Types =====

/**
 * Form data dla LoginForm
 * Extends LoginRequest z dodatkowymi UI fields
 */
export interface LoginFormData extends LoginRequest {
  rememberMe?: boolean; // Optional "remember me" checkbox
  captchaToken?: string | null; // CAPTCHA token (required after 3 failed attempts)
}

/**
 * Validation schema dla LoginForm (Zod)
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Wprowadź prawidłowy adres email')
    .max(255, 'Email jest zbyt długi'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane'),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().nullable().optional()
});

export type LoginFormSchema = z.infer<typeof loginSchema>;

// ===== Component State Types =====

/**
 * State hooka useLoginForm
 */
export interface LoginFormState {
  formData: LoginFormData;
  isSubmitting: boolean;
  error: LoginError | null;
  attemptCount: number; // Number of failed login attempts (stored in localStorage)
  isLocked: boolean; // Whether user is locked out due to rate limiting
  lockedUntil: number | null; // Timestamp when lockout ends (Date.now() + 5 min)
  showCaptcha: boolean; // Show CAPTCHA after 3 failed attempts
}

/**
 * Login error type
 */
export interface LoginError {
  type: LoginErrorType;
  message: string;
  retryAfter?: number; // Seconds to wait before retry (for 429 errors)
}

/**
 * Login error types
 */
export type LoginErrorType =
  | 'INVALID_CREDENTIALS' // 401: Wrong email/password
  | 'EMAIL_NOT_VERIFIED' // 403: Email not verified
  | 'TOO_MANY_ATTEMPTS' // 429: Rate limit exceeded
  | 'NETWORK_ERROR' // Network/connection error
  | 'SERVER_ERROR' // 500: Server error
  | 'UNKNOWN_ERROR'; // Other errors

// ===== Rate Limiting Types =====

/**
 * Rate limit info (stored in localStorage)
 */
export interface RateLimitInfo {
  attemptCount: number; // Failed login attempts
  lockedUntil: number | null; // Timestamp when lockout ends
  lastAttemptTimestamp: number; // Timestamp of last attempt
}

/**
 * Rate limit constants
 */
export const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5, // Max failed attempts before lockout
  LOCKOUT_DURATION_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
  SHOW_CAPTCHA_AFTER: 3, // Show CAPTCHA after N failed attempts
  STORAGE_KEY: 'login_rate_limit', // localStorage key
} as const;

// ===== Auth State (Redux) =====

/**
 * Auth slice state (Redux)
 */
export interface AuthState {
  user: User | null; // Current authenticated user
  accessToken: string | null; // JWT access token
  refreshToken: string | null; // Refresh token
  expiresAt: number | null; // Token expiration timestamp (Date.now() + expiresIn)
  isAuthenticated: boolean; // Whether user is authenticated
  isLoading: boolean; // Loading state (checking token, refreshing)
}

// ===== Component Props Types =====

/**
 * Props dla LoginPage
 */
export interface LoginPageProps {
  verified?: boolean; // Whether user just verified email
  redirectUrl?: string; // URL to redirect after login (default: /dashboard)
}

/**
 * Props dla LoginForm
 */
export interface LoginFormProps {
  redirectUrl?: string;
  onSuccess?: (user: User) => void;
}

/**
 * Props dla EmailInput
 */
export interface EmailInputProps {
  error?: string;
  disabled?: boolean;
}

/**
 * Props dla PasswordInput
 */
export interface PasswordInputProps {
  error?: string;
  disabled?: boolean;
}

/**
 * Props dla RememberMeCheckbox
 */
export interface RememberMeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Props dla RateLimitNotice
 */
export interface RateLimitNoticeProps {
  lockedUntil: number;
  onUnlock: () => void;
}

/**
 * Props dla Captcha
 */
export interface CaptchaProps {
  siteKey: string;
  onChange: (token: string | null) => void;
  error?: string;
}

/**
 * Props dla SubmitButton
 */
export interface SubmitButtonProps {
  loading: boolean;
  disabled: boolean;
}

/**
 * Props dla ErrorMessage
 */
export interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

/**
 * Props dla VerificationSuccessMessage
 */
export interface VerificationSuccessMessageProps {
  onClose?: () => void;
}

// ===== Utility Types =====

/**
 * Error message mapping dla różnych typów błędów
 */
export const LOGIN_ERROR_MESSAGES: Record<LoginErrorType, string> = {
  INVALID_CREDENTIALS: 'Nieprawidłowy email lub hasło',
  EMAIL_NOT_VERIFIED: 'Email nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową.',
  TOO_MANY_ATTEMPTS: 'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za {time}.',
  NETWORK_ERROR: 'Problem z połączeniem. Sprawdź swoje połączenie internetowe.',
  SERVER_ERROR: 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.',
  UNKNOWN_ERROR: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
};

/**
 * Helper function: Map API error to LoginError
 */
export function mapApiErrorToLoginError(error: any): LoginError {
  if (error.response) {
    const status = error.response.status;
    const errorData: ErrorResponse = error.response.data;

    switch (status) {
      case 401:
        return {
          type: 'INVALID_CREDENTIALS',
          message: LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      case 403:
        return {
          type: 'EMAIL_NOT_VERIFIED',
          message: LOGIN_ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
        };
      case 429:
        const retryAfter = parseInt(error.response.headers['retry-after'] || '300');
        return {
          type: 'TOO_MANY_ATTEMPTS',
          message: LOGIN_ERROR_MESSAGES.TOO_MANY_ATTEMPTS.replace(
            '{time}',
            formatRetryAfter(retryAfter)
          ),
          retryAfter,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: 'SERVER_ERROR',
          message: LOGIN_ERROR_MESSAGES.SERVER_ERROR,
        };
      default:
        return {
          type: 'UNKNOWN_ERROR',
          message: errorData.message || LOGIN_ERROR_MESSAGES.UNKNOWN_ERROR,
        };
    }
  }

  if (error.request) {
    return {
      type: 'NETWORK_ERROR',
      message: LOGIN_ERROR_MESSAGES.NETWORK_ERROR,
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: LOGIN_ERROR_MESSAGES.UNKNOWN_ERROR,
  };
}

/**
 * Helper: Format retry-after seconds to human-readable string
 */
function formatRetryAfter(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minutę' : 'minut'}`;
  }
  return `${secs} sekund`;
}
```

## 6. Zarządzanie stanem

### 6.1 Strategia zarządzania stanem

Widok logowania wymaga zarządzania zarówno **lokalnym stanem formularza** (React hooks), jak i **globalnym stanem autentykacji** (Redux Toolkit).

### 6.2 Stan lokalny (React hooks)

**Custom hook: useLoginForm**

Główny hook zarządzający stanem formularza, walidacją, rate limitingiem, i submitem.

Lokalizacja: `src/lib/hooks/useLoginForm.ts`

```typescript
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation'; // lub Astro equivalent
import { useAppDispatch } from '@/lib/store';
import { login } from '@/lib/store/slices/authSlice';
import { loginUser } from '@/lib/api/endpoints/auth';
import { useRateLimit } from './useRateLimit';
import type {
  LoginFormData,
  LoginFormState,
  LoginError,
  LoginFormSchema,
} from '@/types/auth';
import { loginSchema, mapApiErrorToLoginError } from '@/types/auth';

export function useLoginForm(redirectUrl: string = '/dashboard') {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      captchaToken: null,
    },
  });

  // Rate limit hook
  const {
    attemptCount,
    isLocked,
    lockedUntil,
    incrementAttempt,
    resetAttempts,
    checkLockStatus,
  } = useRateLimit();

  // Local state
  const [globalError, setGlobalError] = useState<LoginError | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(attemptCount >= 3);

  // Check lock status on mount and interval
  useEffect(() => {
    checkLockStatus();
    const interval = setInterval(checkLockStatus, 1000);
    return () => clearInterval(interval);
  }, [checkLockStatus]);

  // Update showCaptcha when attemptCount changes
  useEffect(() => {
    setShowCaptcha(attemptCount >= 3);
  }, [attemptCount]);

  // Submit handler
  const onSubmit = async (data: LoginFormSchema) => {
    // Reset errors
    setGlobalError(null);

    // Check if locked
    if (isLocked) {
      setGlobalError({
        type: 'TOO_MANY_ATTEMPTS',
        message: 'Konto tymczasowo zablokowane. Spróbuj ponownie za kilka minut.',
      });
      return;
    }

    // Validate CAPTCHA if shown
    if (showCaptcha && !data.captchaToken) {
      setError('captchaToken', {
        type: 'required',
        message: 'Potwierdź, że nie jesteś robotem',
      });
      return;
    }

    try {
      // API call
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      // Success: dispatch to Redux, reset rate limit, redirect
      dispatch(login(response));
      resetAttempts();

      // Optional: Store rememberMe preference (for longer session)
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirect
      router.push(redirectUrl);
    } catch (error) {
      // Map error to LoginError
      const loginError = mapApiErrorToLoginError(error);
      setGlobalError(loginError);

      // Increment attempt count on auth errors (not network/server errors)
      if (
        loginError.type === 'INVALID_CREDENTIALS' ||
        loginError.type === 'EMAIL_NOT_VERIFIED'
      ) {
        incrementAttempt();
      }

      // Focus first field with error for accessibility
      // (React Hook Form handles this automatically)
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    globalError,
    attemptCount,
    isLocked,
    lockedUntil,
    showCaptcha,
  };
}
```

**Custom hook: useRateLimit**

Hook zarządzający rate limitingiem - tracking prób logowania i lockout.

Lokalizacja: `src/lib/hooks/useRateLimit.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { RateLimitInfo } from '@/types/auth';
import { RATE_LIMIT_CONFIG } from '@/types/auth';

const STORAGE_KEY = RATE_LIMIT_CONFIG.STORAGE_KEY;

/**
 * Hook do zarządzania rate limitingiem logowania
 * Trackuje failed attempts w localStorage
 */
export function useRateLimit() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { attemptCount: 0, lockedUntil: null, lastAttemptTimestamp: 0 };
      }
    }
    return { attemptCount: 0, lockedUntil: null, lastAttemptTimestamp: 0 };
  });

  // Derived state
  const isLocked = rateLimitInfo.lockedUntil && rateLimitInfo.lockedUntil > Date.now();
  const lockedUntil = rateLimitInfo.lockedUntil;
  const attemptCount = rateLimitInfo.attemptCount;

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rateLimitInfo));
  }, [rateLimitInfo]);

  // Increment attempt count
  const incrementAttempt = useCallback(() => {
    setRateLimitInfo((prev) => {
      const newCount = prev.attemptCount + 1;
      const newInfo: RateLimitInfo = {
        attemptCount: newCount,
        lockedUntil: prev.lockedUntil,
        lastAttemptTimestamp: Date.now(),
      };

      // Lock if reached max attempts
      if (newCount >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
        newInfo.lockedUntil = Date.now() + RATE_LIMIT_CONFIG.LOCKOUT_DURATION_MS;
      }

      return newInfo;
    });
  }, []);

  // Reset attempts (after successful login)
  const resetAttempts = useCallback(() => {
    setRateLimitInfo({
      attemptCount: 0,
      lockedUntil: null,
      lastAttemptTimestamp: 0,
    });
  }, []);

  // Check lock status (call periodically to update isLocked)
  const checkLockStatus = useCallback(() => {
    setRateLimitInfo((prev) => {
      // If locked but time expired, unlock
      if (prev.lockedUntil && prev.lockedUntil <= Date.now()) {
        return {
          attemptCount: 0,
          lockedUntil: null,
          lastAttemptTimestamp: 0,
        };
      }
      return prev;
    });
  }, []);

  return {
    attemptCount,
    isLocked: !!isLocked,
    lockedUntil,
    incrementAttempt,
    resetAttempts,
    checkLockStatus,
  };
}
```

### 6.3 Stan globalny (Redux Toolkit)

**Auth slice (Redux)**

Lokalizacja: `src/lib/store/slices/authSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginResponse, User } from '@/types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<LoginResponse>) {
      const { accessToken, refreshToken, expiresIn, user } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.expiresAt = Date.now() + expiresIn * 1000;
      state.isAuthenticated = true;
      state.isLoading = false;

      // Store token in localStorage (or httpOnly cookie preferred)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      state.isLoading = false;

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
```

### 6.4 Integracja Redux w LoginForm

W `LoginForm.tsx`, używamy `useAppDispatch` do dispatch login action po pomyślnym logowaniu:

```typescript
import { useAppDispatch } from '@/lib/store';
import { login } from '@/lib/store/slices/authSlice';

// ...w onSubmit:
const response = await loginUser({ email, password });
dispatch(login(response)); // Save to Redux
```

## 7. Integracja API

### 7.1 Endpoint

**POST /api/v1/auth/login**

Uwierzytelnienie użytkownika i otrzymanie JWT tokenu.

### 7.2 Request

**Method**: POST

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Type**: `LoginRequest`

```typescript
interface LoginRequest {
  email: string; // Required, valid email format
  password: string; // Required
}
```

### 7.3 Response

**Success (200 OK)**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "refreshToken": "refresh_token_here",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "bloodGroup": "A+",
    "emailVerified": true,
    "role": "USER"
  }
}
```

**Response Type**: `LoginResponse`

### 7.4 Error Responses

**401 Unauthorized** (Invalid credentials):
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 401,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "path": "/api/v1/auth/login"
}
```

**403 Forbidden** (Email not verified):
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 403,
  "error": "EMAIL_NOT_VERIFIED",
  "message": "Please verify your email before logging in",
  "path": "/api/v1/auth/login"
}
```

**429 Too Many Requests** (Rate limit):
```json
{
  "timestamp": "2025-01-08T17:30:00Z",
  "status": 429,
  "error": "TOO_MANY_ATTEMPTS",
  "message": "Account temporarily locked. Please try again in 5 minutes.",
  "path": "/api/v1/auth/login"
}
```

**Response Header** (dla 429):
- `Retry-After: 300` (seconds)

### 7.5 API Client Implementation

Lokalizacja: `src/lib/api/endpoints/auth.ts`

```typescript
import { apiClient } from '@/lib/api/client';
import type { LoginRequest, LoginResponse } from '@/types/auth';

/**
 * Login user
 * Endpoint: POST /api/v1/auth/login
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}
```

### 7.6 Axios Client Configuration

Lokalizacja: `src/lib/api/client.ts`

```typescript
import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor (error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log error (development only)
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message);
    }

    // Do NOT log passwords or sensitive data
    return Promise.reject(error);
  }
);
```

### 7.7 Security Considerations

**Token Storage**:
- **Preferred**: Backend sets httpOnly cookies (more secure)
- **Alternative**: Store accessToken in localStorage (less secure, vulnerable to XSS)
- **Never**: Store tokens in sessionStorage dla "remember me" (prefer longer token TTL instead)

**HTTPS Only**:
- All requests must be over HTTPS in production
- Dev environment może używać HTTP (localhost)

**CAPTCHA Verification**:
- Frontend sends captchaToken w request body (jeśli widoczny CAPTCHA)
- Backend weryfikuje token z Google reCAPTCHA API
- Jeśli invalid → 400 Bad Request

## 8. Interakcje użytkownika

| Interakcja użytkownika | Akcja frontendowa | API Call | Oczekiwany wynik |
|------------------------|-------------------|----------|------------------|
| **Załadowanie strony `/login`** | - SSR render page<br>- Parse query params (`verified`, `redirect`)<br>- Check if already logged in (middleware) | Brak (jeśli niezalogowany) | Wyświetlenie formularza logowania. Jeśli `verified=true`, show success banner. Jeśli już zalogowany → redirect do `/dashboard`. |
| **Wpisanie email w pole "Email"** | - onChange event<br>- Update form state<br>- Clear field error (if any) | Brak | Aktualizacja stanu formularza, usunięcie błędu walidacji (jeśli był). |
| **Wpisanie hasła w pole "Password"** | - onChange event<br>- Update form state<br>- Clear field error | Brak | Aktualizacja stanu, usunięcie błędu walidacji. |
| **Click na "Show/Hide password" icon** | - onClick event<br>- Toggle input type (password ↔ text) | Brak | Hasło staje się widoczne/ukryte. |
| **Zaznaczenie "Zapamiętaj mnie"** | - onChange event<br>- Update form state (rememberMe: true) | Brak | Checkbox zaznaczony, wartość zapisana w formie. |
| **Hover nad tooltip ikoną "Zapamiętaj mnie"** | - onMouseEnter event<br>- Show tooltip | Brak | Tooltip z ostrzeżeniem: "Nie zaznaczaj na urządzeniach publicznych". |
| **Kliknięcie "Zaloguj się" (submit)** | - onClick/onSubmit event<br>- Validate form (Zod schema)<br>- If valid: disable form, show loading<br>- Check rate limit<br>- Check CAPTCHA (if shown) | `POST /api/v1/auth/login` | **Sukces**: Redirect do `/dashboard` (lub `redirect` param), token zapisany, user w Redux.<br>**Błąd**: Wyświetlenie error message, increment attempt count. |
| **Submit z invalid email** | - Validation error<br>- Show field error: "Wprowadź prawidłowy adres email"<br>- Focus email field | Brak API call | Error message pod polem email, focus na polu. |
| **Submit z pustym hasłem** | - Validation error<br>- Show field error: "Hasło jest wymagane"<br>- Focus password field | Brak API call | Error message pod polem hasła, focus. |
| **API zwraca 401 (invalid credentials)** | - Catch error<br>- Map to LoginError<br>- Show global error: "Nieprawidłowy email lub hasło"<br>- Increment attempt count<br>- Show CAPTCHA (if attemptCount >= 3) | N/A | Global error message, attempt count++, CAPTCHA pokazany (jeśli 3+ prób). |
| **API zwraca 403 (email not verified)** | - Map to LoginError<br>- Show error: "Email nie został zweryfikowany. Sprawdź skrzynkę."<br>- Increment attempt count | N/A | Error message z linkiem do resend verification (opcjonalnie). |
| **API zwraca 429 (rate limit)** | - Map to LoginError<br>- Extract Retry-After header<br>- Show error: "Zbyt wiele prób. Spróbuj za X minut."<br>- Set lockout state (disable form) | N/A | Error message z countdown, formularz zablokowany. |
| **Rate limit lockout aktywny** | - useRateLimit hook checks localStorage<br>- Disable form<br>- Show RateLimitNotice with countdown | Brak | Formularz disabled, countdown timer pokazany, auto-unlock po 5 min. |
| **Countdown kończy się (unlock)** | - useRateLimit checkLockStatus detects unlock<br>- Reset lockout state<br>- Enable form<br>- Hide RateLimitNotice | Brak | Formularz znowu aktywny, user może spróbować ponownie. |
| **Rozwiązanie CAPTCHA** | - CAPTCHA onChange callback<br>- Update form state (captchaToken: "token...")<br>- Clear captcha error | Brak | CAPTCHA token zapisany, error usunięty, submit możliwy. |
| **Network error (brak internetu)** | - Catch error<br>- Map to LoginError (NETWORK_ERROR)<br>- Show error: "Problem z połączeniem. Sprawdź internet." | N/A | Error message, no attempt count increment (not auth error). |
| **Click na "Nie pamiętasz hasła?"** | - Link click<br>- Navigate to `/reset-password` | Brak API call | Redirect do strony resetu hasła. |
| **Click na "Zarejestruj się"** | - Link click<br>- Navigate to `/register` | Brak API call | Redirect do strony rejestracji. |
| **Successful login** | - API success<br>- Dispatch login(response) to Redux<br>- Reset rate limit attempts<br>- localStorage.setItem('accessToken')<br>- router.push(redirectUrl) | N/A | User zalogowany, token w Redux i localStorage, redirect do dashboard. |
| **Close verification success banner** | - onClick close button<br>- Hide banner (setState) | Brak | Banner znika. |

## 9. Warunki i walidacja

### 9.1 Warunki API (z backend)

Zgodnie z API plan i DTO:

| Pole | Typ | Warunki backend | Walidacja frontend |
|------|-----|-----------------|-------------------|
| `email` | string | Required, valid email format, max 255 chars | Required, email format (HTML5 + Zod), max 255 |
| `password` | string | Required (no min length check for login, tylko verification że istnieje) | Required |

### 9.2 Walidacja na poziomie frontend (Zod schema)

```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Wprowadź prawidłowy adres email')
    .max(255, 'Email jest zbyt długi'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane'),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().nullable().optional()
});
```

**Warunki walidacji**:

1. **Email**:
   - `min(1)`: Pole nie może być puste
   - `email()`: Musi być prawidłowy format email (RFC 5322)
   - `max(255)`: Maksymalnie 255 znaków

2. **Password**:
   - `min(1)`: Pole nie może być puste
   - (Brak sprawdzania complexity - backend sprawdza hash)

3. **CAPTCHA** (conditional):
   - Jeśli `showCaptcha === true` (attemptCount >= 3):
     - `captchaToken` musi być wypełniony (not null)
     - Dodatkowa walidacja w `onSubmit` przed API call

### 9.3 Warunki renderowania UI

**LoginForm - Form disabled state**:
```typescript
const isFormDisabled = isSubmitting || isLocked;
// Wszystkie inputy i submit button disabled gdy:
// - Form jest w trakcie submitu (isSubmitting)
// - User jest w lockoucie (isLocked)
```

**RateLimitNotice - Conditional rendering**:
```typescript
{isLocked && lockedUntil && (
  <RateLimitNotice
    lockedUntil={lockedUntil}
    onUnlock={() => checkLockStatus()}
  />
)}
// Pokazuj tylko gdy isLocked === true
```

**Captcha - Conditional rendering**:
```typescript
{showCaptcha && (
  <Captcha
    siteKey={RECAPTCHA_SITE_KEY}
    onChange={(token) => setValue('captchaToken', token)}
    error={errors.captchaToken?.message}
  />
)}
// Pokazuj po 3 nieudanych próbach (attemptCount >= 3)
```

**VerificationSuccessMessage - Conditional rendering**:
```typescript
{verified && (
  <VerificationSuccessMessage onClose={() => setVerified(false)} />
)}
// Pokazuj tylko gdy query param verified=true
```

**ErrorMessage - Conditional rendering**:
```typescript
{globalError && (
  <ErrorMessage
    message={globalError.message}
    type="error"
  />
)}
// Pokazuj tylko gdy jest global error (z API response)
```

**Field errors - Conditional rendering**:
```typescript
{errors.email && (
  <FieldError message={errors.email.message} />
)}
// Pokazuj pod polem email tylko gdy jest validation error
```

### 9.4 Warunki biznesowe

**Rate Limiting**:
- Po 5 nieudanych próbach → lockout na 5 minut
- Lockout zapisany w localStorage (persist między reloadami)
- Countdown live update co 1s
- Auto-unlock po 5 minutach

**CAPTCHA**:
- Pokazuj po 3 nieudanych próbach
- CAPTCHA token required do submitu (jeśli widoczny)
- Backend weryfikuje token z Google API

**Email Verification Check**:
- Backend zwraca 403 jeśli email nie zweryfikowany
- Frontend pokazuje error z instrukcją sprawdzenia skrzynki
- Opcjonalnie: link do resend verification email

**Remember Me**:
- Jeśli zaznaczony: może wpływać na token TTL (backend decision)
- Frontend zapisuje preference w localStorage
- Tooltip ostrzega przed używaniem na urządzeniach publicznych

## 10. Obsługa błędów

### 10.1 Scenariusze błędów i obsługa

#### 1. Invalid Credentials (401)

**Scenariusz**: Użytkownik wpisał nieprawidłowy email lub hasło.

**Obsługa**:
- Catch error z status 401
- Map do `LoginError` type `INVALID_CREDENTIALS`
- Wyświetl global error: "Nieprawidłowy email lub hasło"
- Increment `attemptCount` (useRateLimit hook)
- Jeśli attemptCount >= 3 → show CAPTCHA
- Jeśli attemptCount >= 5 → lockout (disable form, show countdown)
- Focus na pierwszym polu formularza

**Implementacja**:
```typescript
if (error.response?.status === 401) {
  setGlobalError({
    type: 'INVALID_CREDENTIALS',
    message: 'Nieprawidłowy email lub hasło',
  });
  incrementAttempt();
}
```

#### 2. Email Not Verified (403)

**Scenariusz**: Użytkownik próbuje się zalogować, ale nie zweryfikował adresu email.

**Obsługa**:
- Catch error z status 403
- Map do `LoginError` type `EMAIL_NOT_VERIFIED`
- Wyświetl error: "Email nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową."
- Increment `attemptCount` (to dalej błąd logowania)
- Opcjonalnie: dodaj link "Wyślij email ponownie" (ResendVerificationButton)

**Implementacja**:
```typescript
if (error.response?.status === 403) {
  setGlobalError({
    type: 'EMAIL_NOT_VERIFIED',
    message: 'Email nie został zweryfikowany. Sprawdź swoją skrzynkę.',
  });
  incrementAttempt();
}

// W ErrorMessage component:
{globalError.type === 'EMAIL_NOT_VERIFIED' && (
  <div>
    <p>{globalError.message}</p>
    <button onClick={handleResendVerification}>
      Wyślij email ponownie
    </button>
  </div>
)}
```

#### 3. Rate Limit Exceeded (429)

**Scenariusz**: Użytkownik przekroczył limit prób (backend też trackuje).

**Obsługa**:
- Catch error z status 429
- Extract `Retry-After` header (seconds)
- Map do `LoginError` type `TOO_MANY_ATTEMPTS`
- Message: "Zbyt wiele nieudanych prób. Spróbuj ponownie za X minut."
- Set lockout state w useRateLimit (lockedUntil = Date.now() + retryAfter * 1000)
- Disable formularz
- Show RateLimitNotice z countdown

**Implementacja**:
```typescript
if (error.response?.status === 429) {
  const retryAfter = parseInt(error.response.headers['retry-after'] || '300');
  setGlobalError({
    type: 'TOO_MANY_ATTEMPTS',
    message: `Zbyt wiele prób. Spróbuj ponownie za ${formatRetryAfter(retryAfter)}.`,
    retryAfter,
  });
  // useRateLimit już ustawił lockout na froncie, backend potwierdza
}
```

#### 4. Network Error (brak połączenia)

**Scenariusz**: Brak internetu, API niedostępne, timeout.

**Obsługa**:
- Catch error bez `error.response` (network error)
- Map do `LoginError` type `NETWORK_ERROR`
- Message: "Problem z połączeniem. Sprawdź swoje połączenie internetowe."
- NIE increment attemptCount (to nie auth error)
- Pokazać retry button lub auto-retry (opcjonalnie)

**Implementacja**:
```typescript
if (!error.response) {
  setGlobalError({
    type: 'NETWORK_ERROR',
    message: 'Problem z połączeniem. Sprawdź internet.',
  });
  // NO incrementAttempt() - not auth error
}
```

#### 5. Server Error (500, 502, 503)

**Scenariusz**: Błąd po stronie backendu (database down, exception).

**Obsługa**:
- Catch error z status 500/502/503
- Map do `LoginError` type `SERVER_ERROR`
- Message: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- NIE increment attemptCount
- Log error do Sentry (opcjonalnie)

**Implementacja**:
```typescript
if ([500, 502, 503].includes(error.response?.status)) {
  setGlobalError({
    type: 'SERVER_ERROR',
    message: 'Wystąpił błąd serwera. Spróbuj ponownie później.',
  });
  // Sentry.captureException(error);
}
```

#### 6. Validation Error (Frontend)

**Scenariusz**: User submit formularza z invalid data (empty fields, invalid email format).

**Obsługa**:
- React Hook Form + Zod schema automatycznie handleuje
- Show field errors pod odpowiednimi polami
- Focus na pierwszym polu z błędem
- NIE wywołuj API (validation prevents submit)

**Implementacja**:
```typescript
// React Hook Form automatycznie pokazuje errors z Zod
{errors.email && <FieldError message={errors.email.message} />}
{errors.password && <FieldError message={errors.password.message} />}
```

#### 7. CAPTCHA Not Solved

**Scenariusz**: CAPTCHA jest pokazana, ale user nie rozwiązał przed submitem.

**Obsługa**:
- Dodatkowa walidacja w `onSubmit` (przed API call)
- Jeśli `showCaptcha && !captchaToken`:
  - setError('captchaToken', { message: 'Potwierdź, że nie jesteś robotem' })
  - Show error pod CAPTCHA widget
  - Return early (nie call API)

**Implementacja**:
```typescript
if (showCaptcha && !data.captchaToken) {
  setError('captchaToken', {
    type: 'required',
    message: 'Potwierdź, że nie jesteś robotem',
  });
  return; // Prevent API call
}
```

#### 8. Token Storage Error

**Scenariusz**: Nie udało się zapisać tokenu w localStorage (disabled, quota exceeded).

**Obsługa**:
- Catch error z localStorage.setItem
- Fallback: try sessionStorage
- Jeśli też fails: show warning, ale pozwól na login (token tylko w memory/Redux)
- Toast warning: "Nie udało się zapisać sesji. Zostaniesz wylogowany po zamknięciu przeglądarki."

**Implementacja**:
```typescript
try {
  localStorage.setItem('accessToken', accessToken);
} catch (error) {
  console.warn('localStorage unavailable:', error);
  try {
    sessionStorage.setItem('accessToken', accessToken);
  } catch {
    // Fallback: token only in Redux (memory), show warning
    toast.warning('Sesja nie zostanie zachowana po zamknięciu przeglądarki.');
  }
}
```

#### 9. Already Logged In

**Scenariusz**: User jest już zalogowany (token w localStorage/Redux) i próbuje otworzyć `/login`.

**Obsługa**:
- Middleware Astro sprawdza auth state
- Jeśli authenticated → redirect do `/dashboard`
- User nie widzi login page

**Implementacja** (Astro middleware):
```typescript
// src/middleware/auth.ts
export async function onRequest({ request, redirect, locals }) {
  const url = new URL(request.url);

  // Check if user is authenticated (token in cookie/header)
  const isAuthenticated = locals.user; // or check JWT

  if (url.pathname === '/login' && isAuthenticated) {
    return redirect('/dashboard');
  }

  return; // Continue
}
```

#### 10. Redirect Loop Prevention

**Scenariusz**: `redirect` query param prowadzi do `/login`, powodując loop.

**Obsługa**:
- Sanitize `redirect` param
- Jeśli `redirect === '/login'` → ignore, użyj default `/dashboard`
- Whitelist dozwolonych ścieżek (internal paths only, no external URLs)

**Implementacja**:
```typescript
function sanitizeRedirectUrl(url: string | null): string {
  if (!url || url === '/login' || url.startsWith('http')) {
    return '/dashboard'; // Default
  }
  // Ensure internal path
  if (url.startsWith('/')) {
    return url;
  }
  return '/dashboard';
}
```

### 10.2 Error Boundaries (React)

Dla LoginForm (React island), użyj ErrorBoundary:

```typescript
// W LoginPage.astro lub wrapper component
<ErrorBoundary fallback={<ErrorFallback />}>
  <LoginForm redirectUrl={redirectUrl} />
</ErrorBoundary>
```

ErrorBoundary catch nieoczekiwane errory (crashes) i pokazuje fallback UI.

### 10.3 Accessibility dla błędów

**ARIA live regions**:
```tsx
<div role="alert" aria-live="assertive">
  {globalError && <p>{globalError.message}</p>}
</div>
```

**Focus management**:
- Po błędzie submitu → focus na pierwszy field z błędem (React Hook Form automatic)
- Lub focus na global error message (dla screen readers)

**Error messages powiązane z fields**:
```tsx
<input
  id="email"
  aria-describedby={errors.email ? 'email-error' : undefined}
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### 10.4 Logging i monitoring

**Development**:
- console.error dla debugging
- NO passwords w logach (NIGDY)

**Production**:
- Sentry integration dla critical errors (500, network failures)
- Log attempt counts (aggregate metrics, not individual users)
- Monitor rate limit triggers

```typescript
// src/lib/utils/errorReporting.ts
export function reportError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    // Sentry.captureException(error, { contexts: { custom: context } });
  } else {
    console.error('Error:', error, context);
  }

  // NEVER log passwords or tokens
  if (context?.password) delete context.password;
  if (context?.accessToken) delete context.accessToken;
}
```

## 11. Kroki implementacji

### Faza 1: Setup i typy (1 dzień)

#### Krok 1: Struktura katalogów

```bash
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RateLimitNotice.tsx
│   │   ├── Captcha.tsx
│   │   └── VerificationSuccessMessage.tsx
│   ├── forms/
│   │   ├── EmailInput.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── RememberMeCheckbox.tsx
│   │   ├── SubmitButton.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── FieldError.tsx
│   └── common/
│       └── ErrorBoundary.tsx
├── types/
│   └── auth.ts
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints/
│   │       └── auth.ts
│   ├── hooks/
│   │   ├── useLoginForm.ts
│   │   └── useRateLimit.ts
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │       └── authSlice.ts
│   └── utils/
│       └── errorReporting.ts
├── middleware/
│   └── auth.ts
├── layouts/
│   └── AuthLayout.astro
└── pages/
    └── login.astro
```

#### Krok 2: Definiowanie typów

Utwórz `src/types/auth.ts` z wszystkimi typami (patrz sekcja 5):
- LoginRequest, LoginResponse, User, UserRole
- ErrorResponse, ValidationError
- LoginFormData, LoginFormState, LoginError
- RateLimitInfo, RATE_LIMIT_CONFIG
- AuthState (Redux)
- Wszystkie component props types
- Helper functions (mapApiErrorToLoginError, formatRetryAfter)

#### Krok 3: API client setup

Utwórz `src/lib/api/client.ts` z Axios instance (patrz sekcja 7.6).

#### Krok 4: API endpoint function

Utwórz `src/lib/api/endpoints/auth.ts`:
```typescript
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}
```

#### Krok 5: Redux setup

Utwórz Redux store i authSlice (patrz sekcja 6.3):
- `src/lib/store/index.ts` - configure store
- `src/lib/store/slices/authSlice.ts` - auth slice z actions (login, logout)

### Faza 2: Hooks i utilities (1 dzień)

#### Krok 6: useRateLimit hook

Utwórz `src/lib/hooks/useRateLimit.ts` (patrz sekcja 6.2):
- Track attemptCount w localStorage
- Manage lockout state
- Countdown timer logic
- incrementAttempt, resetAttempts, checkLockStatus methods

Test localStorage:
- Manually set attemptCount = 5 → verify lockout works
- Wait 5 minutes (or mock Date.now) → verify auto-unlock

#### Krok 7: useLoginForm hook

Utwórz `src/lib/hooks/useLoginForm.ts` (patrz sekcja 6.2):
- Integrate React Hook Form
- Zod resolver dla validation
- onSubmit handler (API call, error handling, rate limit)
- Integration z useRateLimit hook
- Redux dispatch dla login action

Test form submission:
- Valid data → success
- Invalid email → validation error
- Wrong password → 401 error, attemptCount++

#### Krok 8: Error reporting utility

Utwórz `src/lib/utils/errorReporting.ts`:
- reportError function
- Sentry integration (opcjonalnie)
- Never log passwords/tokens

### Faza 3: Komponenty form fields (1-2 dni)

#### Krok 9: FieldError component

Utwórz `src/components/forms/FieldError.tsx`:
- Simple component wyświetlający error message
- Props: `message: string`
- Styling: red text, small font, icon
- Accessibility: `role="alert"`

#### Krok 10: EmailInput component

Utwórz `src/components/forms/EmailInput.tsx`:
- Label + input (type="email")
- React Hook Form integration (`register` from useForm)
- FieldError (conditional)
- Props: error, disabled
- Accessibility: htmlFor, aria-describedby

#### Krok 11: PasswordInput component

Utwórz `src/components/forms/PasswordInput.tsx`:
- Label + input (type="password" | "text")
- Toggle visibility button (eye icon)
- useState dla showPassword
- React Hook Form integration
- FieldError (conditional)

#### Krok 12: RememberMeCheckbox component

Utwórz `src/components/forms/RememberMeCheckbox.tsx`:
- Checkbox + label
- Tooltip z warning (TooltipIcon component)
- Props: checked, onChange, disabled

#### Krok 13: SubmitButton component

Utwórz `src/components/forms/SubmitButton.tsx`:
- Button (type="submit")
- Loading spinner (conditional)
- Text: "Zaloguj się" | "Logowanie..."
- Props: loading, disabled
- Styling: primary button variant

### Faza 4: Komponenty auth-specific (1 dzień)

#### Krok 14: ErrorMessage component

Utwórz `src/components/forms/ErrorMessage.tsx`:
- Alert container (role="alert", aria-live="assertive")
- Error icon + message text
- Props: message, type (error/warning/info)
- Styling variants (red for error, orange for warning)

#### Krok 15: RateLimitNotice component

Utwórz `src/components/auth/RateLimitNotice.tsx`:
- Alert container (warning styling)
- Alert icon + message
- Countdown timer (MM:SS format)
- useEffect z setInterval (update co 1s)
- Props: lockedUntil, onUnlock
- Clear interval on unmount

Test countdown:
- Set lockedUntil = Date.now() + 10000 (10s)
- Verify countdown updates every second
- Verify onUnlock called po 10s

#### Krok 16: Captcha component

Utwórz `src/components/auth/Captcha.tsx`:
- Wrap react-google-recaptcha lub hCaptcha library
- Pass siteKey z env (RECAPTCHA_SITE_KEY)
- onChange callback z token
- onExpired callback (reset token)
- FieldError (conditional)
- Props: siteKey, onChange, error

Setup reCAPTCHA:
- Register na Google reCAPTCHA
- Get site key i secret key
- Add site key do .env

#### Krok 17: VerificationSuccessMessage component

Utwórz `src/components/auth/VerificationSuccessMessage.tsx`:
- Success banner (green background)
- Success icon + message
- Close button (X)
- Props: onClose
- Auto-dismiss po 10s (opcjonalnie)

### Faza 5: LoginForm główny komponent (2 dni)

#### Krok 18: LoginForm component

Utwórz `src/components/auth/LoginForm.tsx`:
- Import wszystkich sub-components
- Use useLoginForm hook
- Form element z onSubmit={handleSubmit}
- Conditional rendering:
  - ErrorMessage (if globalError)
  - RateLimitNotice (if isLocked)
  - Captcha (if showCaptcha)
- EmailInput, PasswordInput, RememberMeCheckbox
- SubmitButton
- Props: redirectUrl, onSuccess

Struktura:
```tsx
export function LoginForm({ redirectUrl, onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    globalError,
    isLocked,
    lockedUntil,
    showCaptcha,
  } = useLoginForm(redirectUrl);

  return (
    <form onSubmit={handleSubmit}>
      {globalError && <ErrorMessage message={globalError.message} />}
      {isLocked && <RateLimitNotice lockedUntil={lockedUntil} />}

      <EmailInput
        {...register('email')}
        error={errors.email?.message}
        disabled={isSubmitting || isLocked}
      />

      <PasswordInput
        {...register('password')}
        error={errors.password?.message}
        disabled={isSubmitting || isLocked}
      />

      <RememberMeCheckbox
        {...register('rememberMe')}
        disabled={isSubmitting || isLocked}
      />

      {showCaptcha && (
        <Captcha
          siteKey={RECAPTCHA_SITE_KEY}
          onChange={(token) => setValue('captchaToken', token)}
          error={errors.captchaToken?.message}
        />
      )}

      <SubmitButton
        loading={isSubmitting}
        disabled={isSubmitting || isLocked}
      />
    </form>
  );
}
```

#### Krok 19: Test LoginForm integration

Test scenarios:
1. Valid login → success → redirect
2. Invalid credentials → 401 → error message, attemptCount++
3. Email not verified → 403 → error message
4. 3 failed attempts → CAPTCHA shows
5. 5 failed attempts → lockout → RateLimitNotice shows
6. Countdown → auto-unlock
7. Network error → error message (no attemptCount++)

### Faza 6: Astro page i layouts (1 dzień)

#### Krok 20: AuthLayout

Utwórz `src/layouts/AuthLayout.astro`:
- Minimal layout dla auth pages
- Navbar z logo + link do home
- Centered container dla formularza
- Footer (opcjonalnie)
- SEO component

#### Krok 21: Middleware auth check

Utwórz `src/middleware/auth.ts`:
- Check if user authenticated (JWT token w cookie/localStorage)
- Jeśli `/login` i authenticated → redirect do `/dashboard`
- Jeśli protected route i nie authenticated → redirect do `/login?redirect={path}`

#### Krok 22: login.astro page

Utwórz `src/pages/login.astro`:

```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import SEO from '@/components/SEO.astro';
import LoginForm from '@/components/auth/LoginForm';
import VerificationSuccessMessage from '@/components/auth/VerificationSuccessMessage';

// Parse query params
const verified = Astro.url.searchParams.get('verified') === 'true';
const redirectUrl = Astro.url.searchParams.get('redirect') || '/dashboard';

// Sanitize redirect URL (prevent open redirect)
const safeRedirectUrl = sanitizeRedirectUrl(redirectUrl);

// SSR render type
export const prerender = false; // SSR

function sanitizeRedirectUrl(url: string): string {
  if (!url || url === '/login' || url.startsWith('http')) {
    return '/dashboard';
  }
  if (url.startsWith('/')) return url;
  return '/dashboard';
}
---

<AuthLayout>
  <SEO
    slot="head"
    title="Zaloguj się | mkrew"
    description="Zaloguj się do platformy mkrew i zarządzaj swoimi donacjami krwi."
    noindex={true}
  />

  <main class="container mx-auto px-4 py-8 max-w-md">
    {verified && (
      <VerificationSuccessMessage client:load />
    )}

    <div class="bg-white shadow-md rounded-lg p-8">
      <header class="mb-6 text-center">
        <h1 class="text-3xl font-bold mb-2">Zaloguj się</h1>
        <p class="text-gray-600">Wprowadź swoje dane, aby kontynuować</p>
      </header>

      <LoginForm client:load redirectUrl={safeRedirectUrl} />

      <div class="mt-6 text-center text-sm">
        <a href="/reset-password" class="text-blue-600 hover:underline">
          Nie pamiętasz hasła?
        </a>
      </div>

      <div class="mt-4 text-center text-sm text-gray-600">
        Nie masz konta?{' '}
        <a href="/register" class="text-blue-600 hover:underline font-semibold">
          Zarejestruj się
        </a>
      </div>

      <div class="mt-6 text-xs text-gray-500 text-center">
        Logując się, akceptujesz nasze{' '}
        <a href="/regulamin" class="underline">Regulamin</a> i{' '}
        <a href="/polityka-prywatnosci" class="underline">Politykę prywatności</a>.
      </div>
    </div>
  </main>
</AuthLayout>
```

### Faza 7: Stylowanie i responsywność (1 dzień)

#### Krok 23: Tailwind CSS styling

Style dla wszystkich komponentów:
- LoginForm: card z shadow, padding, border-radius
- Inputs: border, focus states (ring), disabled state (opacity)
- Buttons: primary variant (blue bg, white text, hover darker)
- Error messages: red text, red border dla inputs z błędem
- RateLimitNotice: warning styling (orange/yellow bg, dark text)
- VerificationSuccessMessage: success styling (green bg)

#### Krok 24: Responsive design

- Mobile (<768px):
  - LoginForm: full width minus padding
  - Font sizes adjusted
  - Spacing reduced

- Desktop (>768px):
  - LoginForm: max-w-md centered
  - Larger padding, font sizes

#### Krok 25: Focus states i accessibility

- Visible focus indicators (ring)
- Keyboard navigation (Tab order)
- Skip link (opcjonalnie)
- Screen reader labels

### Faza 8: Accessibility i security (1 dzień)

#### Krok 26: Accessibility audit

- **Semantic HTML**: form, label, input, button
- **ARIA**:
  - aria-describedby dla inputs z errors
  - aria-invalid dla invalid fields
  - aria-live dla error messages
  - role="alert" dla critical messages
- **Keyboard navigation**: Tab order, Enter submit
- **Screen reader testing**: NVDA/JAWS
- **Color contrast**: min 4.5:1
- Test z axe DevTools

#### Krok 27: Security measures

- **No passwords w logach**: Remove z console.log, Sentry
- **HTTPS enforcement** (production): middleware redirect
- **Rate limiting**: localStorage tracking
- **CAPTCHA**: after 3 attempts
- **Token storage**: preferuj httpOnly cookies (backend sets)
- **Sanitize redirectUrl**: prevent open redirect attacks
- **CSP headers**: Content-Security-Policy

### Faza 9: Testowanie (2 dni)

#### Krok 28: Unit tests

Vitest + React Testing Library.

Tests dla komponentów:
- `EmailInput.test.tsx`: rendering, onChange, error display
- `PasswordInput.test.tsx`: toggle visibility, onChange
- `RateLimitNotice.test.tsx`: countdown timer
- `useRateLimit.test.ts`: localStorage tracking, lockout logic

```typescript
// Example: useRateLimit.test.ts
import { renderHook, act } from '@testing-library/react';
import { useRateLimit } from './useRateLimit';

describe('useRateLimit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tracks failed attempts', () => {
    const { result } = renderHook(() => useRateLimit());

    expect(result.current.attemptCount).toBe(0);

    act(() => {
      result.current.incrementAttempt();
    });

    expect(result.current.attemptCount).toBe(1);
  });

  it('locks after 5 attempts', () => {
    const { result } = renderHook(() => useRateLimit());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.incrementAttempt();
      }
    });

    expect(result.current.isLocked).toBe(true);
    expect(result.current.lockedUntil).toBeGreaterThan(Date.now());
  });
});
```

#### Krok 29: Integration tests

MSW dla mock API.

Test flows:
- Valid login → success response → redirect
- Invalid credentials → 401 → error message
- Email not verified → 403 → error message
- Rate limit → 429 → lockout

```typescript
// Example: LoginForm.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { LoginForm } from './LoginForm';

const server = setupServer(
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    const { email, password } = req.body;
    if (email === 'test@example.com' && password === 'correct') {
      return res(ctx.json({
        accessToken: 'token123',
        user: { id: 1, email: 'test@example.com', /* ... */ }
      }));
    }
    return res(ctx.status(401), ctx.json({ error: 'INVALID_CREDENTIALS' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('successful login redirects to dashboard', async () => {
  const mockRouter = { push: jest.fn() };
  render(<LoginForm redirectUrl="/dashboard" />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Hasło'), 'correct');
  await userEvent.click(screen.getByRole('button', { name: /zaloguj/i }));

  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});

test('invalid credentials show error', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Hasło'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /zaloguj/i }));

  await waitFor(() => {
    expect(screen.getByText(/nieprawidłowy email lub hasło/i)).toBeInTheDocument();
  });
});
```

#### Krok 30: E2E tests

Playwright.

Test scenarios:
- User navigates to `/login`
- User fills email + password
- User submits → redirects to `/dashboard`
- User with wrong password → error message, attemptCount++
- 5 wrong attempts → lockout, countdown visible

```typescript
// Example: login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in successfully', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});

test('invalid credentials show error', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');

  await expect(page.locator('role=alert')).toContainText('Nieprawidłowy email lub hasło');
  await expect(page).toHaveURL('/login'); // Still on login page
});

test('rate limit locks after 5 attempts', async ({ page }) => {
  await page.goto('/login');

  for (let i = 0; i < 5; i++) {
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
  }

  await expect(page.locator('text=/tymczasowo zablokowane/i')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
});
```

#### Krok 31: Accessibility tests

Automated axe tests:

```typescript
import { axe } from 'jest-axe';

test('LoginForm has no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Manual testing:
- Keyboard navigation (Tab przez wszystkie elementy)
- Screen reader (NVDA: czyta labels, errors, button states)
- Zoom 200%

### Faza 10: Dokumentacja i deployment (0.5 dnia)

#### Krok 32: Dokumentacja

Dodaj JSDoc komentarze:

```typescript
/**
 * Hook do zarządzania formularzem logowania.
 * Obsługuje walidację, rate limiting, CAPTCHA, i API integration.
 *
 * @param redirectUrl - URL przekierowania po pomyślnym logowaniu (default: /dashboard)
 * @returns Form handlers, state, errors
 *
 * @example
 * const { register, handleSubmit, errors, isSubmitting } = useLoginForm('/favorites');
 */
export function useLoginForm(redirectUrl: string = '/dashboard') {
  // ...
}
```

#### Krok 33: Environment variables

Utwórz `.env.example`:

```
PUBLIC_API_URL=http://localhost:8080/api/v1
RECAPTCHA_SITE_KEY=your_site_key_here
```

Dokumentuj wymagane env vars w README.

#### Krok 34: Code review

Checklist:
- TypeScript: brak `any`, wszystkie typy
- Security: no passwords w logach
- Accessibility: ARIA, keyboard nav
- Error handling: wszystkie API errors obsłużone
- Tests: coverage >80%
- Linting: ESLint passed

#### Krok 35: Deploy to staging

- Build: `npm run build`
- Deploy na staging
- Smoke test:
  - Login flow end-to-end
  - Rate limit test
  - Error scenarios
- Check Lighthouse audit

#### Krok 36: Deploy to production

- Merge do main
- CI/CD auto-deploy
- Monitor Sentry dla errors
- Check login success rate metrics

---

## Podsumowanie timeline

- **Faza 1**: Setup i typy (1 dzień)
- **Faza 2**: Hooks i utilities (1 dzień)
- **Faza 3**: Form fields (1-2 dni)
- **Faza 4**: Auth components (1 dzień)
- **Faza 5**: LoginForm główny (2 dni)
- **Faza 6**: Astro page (1 dzień)
- **Faza 7**: Stylowanie (1 dzień)
- **Faza 8**: Accessibility + Security (1 dzień)
- **Faza 9**: Testowanie (2 dni)
- **Faza 10**: Dokumentacja + Deployment (0.5 dnia)

**Całkowity szacowany czas: 11-12 dni roboczych** (2-2.5 tygodnie dla jednego dewelopera)

---

## Dodatkowe uwagi

### Security Best Practices

1. **Token Storage**:
   - **Preferred**: httpOnly cookies (backend sets)
   - **Alternative**: localStorage (vulnerable to XSS)
   - **Never**: Store plain passwords

2. **Rate Limiting**:
   - Frontend: localStorage tracking (5 attempts → 5 min lockout)
   - Backend: Server-side rate limit (IP-based, per-email)
   - Both needed dla layered security

3. **CAPTCHA**:
   - Show after 3 failed attempts (frontend)
   - Backend verifies token z Google API
   - Nie polega tylko na frontend validation

4. **HTTPS**:
   - Enforce w production (middleware redirect)
   - TLS 1.2+
   - HSTS header

5. **Input Sanitization**:
   - Zod validation
   - Backend validation (double-check)
   - No SQL injection (backend uses parameterized queries)

### Accessibility Best Practices

1. **Keyboard Navigation**:
   - Tab order: email → password → remember me → submit
   - Enter na input → submit form
   - Focus visible (ring)

2. **Screen Readers**:
   - Wszystkie labels z htmlFor
   - aria-describedby dla errors
   - aria-live dla dynamic content
   - role="alert" dla critical messages

3. **Error Messages**:
   - Powiązane z fields (aria-describedby)
   - Visible i accessible
   - Clear, actionable language

### Future Enhancements (post-MVP)

1. **Social Login**: Google, Facebook OAuth
2. **Biometric Auth**: Face ID, Touch ID (WebAuthn)
3. **2FA**: SMS/TOTP codes
4. **Magic Links**: Passwordless login via email
5. **Session Management**: View active sessions, remote logout
6. **Login History**: Log wszystkich login attempts
7. **Device Recognition**: Trust this device (skip CAPTCHA)
8. **Progressive Web App**: Offline mode, install prompt
