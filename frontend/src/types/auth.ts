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

// ===== Register View Types =====

/**
 * Request body dla POST /api/v1/auth/register
 * Backend: RegisterRequest.java
 */
export interface RegisterRequest {
  email: string; // Required, valid email, max 255, unique
  password: string; // Required, min 8, must match regex pattern
  firstName: string; // Required, max 100
  lastName: string; // Required, max 100
  bloodGroup: BloodGroup | null; // Optional, must be one of 8 values
  favoriteRckikIds: number[]; // Optional, IDs must exist
  consentVersion: string; // Required, max 20 (current version: "1.0")
  consentAccepted: boolean; // Required, must be true
}

/**
 * Response body z POST /api/v1/auth/register
 * Backend: RegisterResponse.java
 */
export interface RegisterResponse {
  userId: number;
  email: string;
  emailVerified: boolean;
  message: string;
}

/**
 * Blood group type
 */
export type BloodGroup = '0+' | '0-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

/**
 * Valid blood groups array (for dropdown options)
 */
export const BLOOD_GROUPS: BloodGroup[] = [
  '0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'
];

/**
 * Full register form data (all steps combined)
 */
export interface RegisterFormData {
  // Step 1
  email: string;
  password: string;
  confirmPassword: string;
  consentAccepted: boolean;
  marketingConsent: boolean;
  // Step 2
  firstName: string;
  lastName: string;
  bloodGroup: BloodGroup | null;
  // Step 3
  favoriteRckikIds: number[];
}

/**
 * Step 1 form data
 */
export interface Step1FormData {
  email: string;
  password: string;
  confirmPassword: string;
  consentAccepted: boolean;
  marketingConsent: boolean;
}

/**
 * Step 2 form data
 */
export interface Step2FormData {
  firstName: string;
  lastName: string;
  bloodGroup: BloodGroup | null;
}

/**
 * Step 3 form data
 */
export interface Step3FormData {
  favoriteRckikIds: number[];
}

/**
 * Password regex pattern (same as backend)
 * Must contain: uppercase, lowercase, digit, special char
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

/**
 * Name regex pattern (only letters, hyphens, apostrophes, Polish characters)
 */
const NAME_REGEX = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]+$/;

/**
 * Step 1 validation schema
 */
export const step1Schema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Wprowadź prawidłowy adres email')
    .max(255, 'Email jest zbyt długi'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(PASSWORD_REGEX, 'Hasło nie spełnia wymagań złożoności'),
  confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  consentAccepted: z
    .boolean()
    .refine((val) => val === true, 'Musisz zaakceptować politykę prywatności'),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą się zgadzać',
  path: ['confirmPassword'],
});

export type Step1FormSchema = z.infer<typeof step1Schema>;

/**
 * Step 2 validation schema
 */
export const step2Schema = z.object({
  firstName: z
    .string()
    .min(1, 'Imię jest wymagane')
    .max(100, 'Imię jest zbyt długie')
    .regex(NAME_REGEX, 'Imię może zawierać tylko litery'),
  lastName: z
    .string()
    .min(1, 'Nazwisko jest wymagane')
    .max(100, 'Nazwisko jest zbyt długie')
    .regex(NAME_REGEX, 'Nazwisko może zawierać tylko litery'),
  bloodGroup: z
    .enum(['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
    .nullable()
    .optional(),
});

export type Step2FormSchema = z.infer<typeof step2Schema>;

/**
 * Step 3 validation schema (no validation, optional)
 */
export const step3Schema = z.object({
  favoriteRckikIds: z.array(z.number()).optional().default([]),
});

export type Step3FormSchema = z.infer<typeof step3Schema>;

/**
 * State hooka useRegisterForm
 */
export interface RegisterFormState {
  currentStep: number; // 1, 2, or 3
  formData: RegisterFormData;
  errors: Record<string, string>; // field errors
  isSubmitting: boolean;
  globalError: string | null; // API error message
  emailCheckStatus: EmailCheckStatus;
  isEmailUnique: boolean | null; // null = not checked yet
}

/**
 * Email uniqueness check status
 */
export type EmailCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Password requirements check result
 */
export interface PasswordRequirements {
  minLength: boolean; // >= 8 chars
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
}

/**
 * Props dla RegisterForm
 */
export interface RegisterFormProps {
  onSuccess?: (response: RegisterResponse) => void;
}

/**
 * Props dla ProgressBar
 */
export interface ProgressBarProps {
  currentStep: number;
  completedSteps: number[];
}

/**
 * Props dla Step1Form
 */
export interface Step1FormProps {
  formData: Step1FormData;
  errors: Record<string, string>;
  emailCheckStatus: EmailCheckStatus;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
}

/**
 * Props dla Step2Form
 */
export interface Step2FormProps {
  formData: Step2FormData;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Props dla Step3Form
 */
export interface Step3FormProps {
  formData: Step3FormData;
  onChange: (field: string, value: any) => void;
  onPrevious: () => void;
  onSkip: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';

  let score = 0;

  // Length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[@$!%*?&#]/.test(password)) score += 15;

  // Penalty for common patterns
  if (/^password/i.test(password)) score -= 20;
  if (/123/.test(password)) score -= 10;
  if (/^(.)\1+$/.test(password)) score -= 20; // all same character

  if (score < 40) return 'weak';
  if (score < 70) return 'medium';
  return 'strong';
}

/**
 * Check password requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&#]/.test(password),
  };
}

/**
 * Get session storage key for draft
 */
export const REGISTER_DRAFT_KEY = 'register_draft';

/**
 * Save registration draft to sessionStorage (bez hasła!)
 */
export function saveRegistrationDraft(formData: RegisterFormData): void {
  try {
    const draftData = {
      ...formData,
      password: '', // NEVER store password
      confirmPassword: '', // NEVER store password
    };
    sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draftData));
  } catch (error) {
    console.warn('Failed to save registration draft:', error);
  }
}

/**
 * Load registration draft from sessionStorage
 */
export function loadRegistrationDraft(): Partial<RegisterFormData> | null {
  try {
    const stored = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load registration draft:', error);
    return null;
  }
}

/**
 * Clear registration draft from sessionStorage
 */
export function clearRegistrationDraft(): void {
  try {
    sessionStorage.removeItem(REGISTER_DRAFT_KEY);
  } catch (error) {
    console.warn('Failed to clear registration draft:', error);
  }
}

// ===== RCKiK Types (for FavoritesPicker in Step3) =====

/**
 * Basic RCKiK data for favorites picker
 * Lightweight type używany w Step3Form
 */
export interface RckikBasic {
  id: number;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

// ===== Email Verification Types =====

/**
 * Response body z GET /api/v1/auth/verify-email
 * Backend: VerifyEmailResponse.java
 */
export interface VerifyEmailResponse {
  message: string; // "Email verified successfully. You can now log in."
  email: string; // "user@example.com"
}

/**
 * Stan weryfikacji email
 */
export type VerificationState =
  | 'loading'           // Weryfikacja w toku
  | 'success'           // Weryfikacja udana
  | 'error'             // Ogólny błąd
  | 'expired'           // Token wygasł (24h TTL)
  | 'already_verified'  // Już zweryfikowany (idempotency)
  | 'invalid'           // Token nieprawidłowy/nieistniejący
  | 'missing_token';    // Brak tokenu w URL

/**
 * ViewModel dla VerificationStatus component
 */
export interface VerificationViewModel {
  state: VerificationState;
  message: string;
  email: string | null;
  canResend: boolean;
  redirectUrl: string | null;
  error: ErrorResponse | null;
}

/**
 * Props dla ResendButton component
 */
export interface ResendButtonProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Props dla LoadingState component
 */
export interface LoadingStateProps {}

/**
 * Props dla SuccessState component
 */
export interface SuccessStateProps {
  email: string;
  onRedirect: () => void;
}

/**
 * Props dla ErrorState component
 */
export interface ErrorStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  showRetry?: boolean;
}

/**
 * Props dla ExpiredState component
 */
export interface ExpiredStateProps {
  email?: string;
}

/**
 * Props dla AlreadyVerifiedState component
 */
export interface AlreadyVerifiedStateProps {
  onRedirect: () => void;
}

/**
 * Hook useEmailVerification return type
 */
export interface UseEmailVerificationReturn {
  state: VerificationState;
  data: VerifyEmailResponse | null;
  error: ErrorResponse | null;
  isLoading: boolean;
  retry: () => void;
}

/**
 * Hook useResendVerification return type
 */
export interface UseResendVerificationReturn {
  resend: (email: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  canResend: boolean;
  nextAllowedTime: number | null;
}

/**
 * Resend attempts data structure (sessionStorage)
 */
export interface ResendAttempts {
  timestamps: number[];
  lastAttempt: number;
}

/**
 * Email verification sessionStorage data
 */
export interface EmailVerifiedSession {
  email: string;
  timestamp: number;
}

/**
 * Constants for email verification
 */
export const EMAIL_VERIFICATION_CONFIG = {
  MAX_RESEND_ATTEMPTS: 3,
  RESEND_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  SESSION_KEY: 'email_verified',
  RESEND_KEY: 'resend_attempts',
  VERIFIED_SESSION_TTL_MS: 5 * 60 * 1000, // 5 minutes
} as const;
