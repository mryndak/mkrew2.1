import { z } from 'zod';

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
