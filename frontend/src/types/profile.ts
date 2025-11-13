import { z } from 'zod';

// ===== API Response Types (from backend DTOs) =====

/**
 * Response z GET /api/v1/users/me
 * Backend: UserProfileResponse.java
 */
export interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: string | null;
  emailVerified: boolean;
  consentTimestamp: string; // ISO 8601
  consentVersion: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Request do PATCH /api/v1/users/me
 * Backend: UpdateProfileRequest.java
 */
export interface UpdateProfileRequest {
  firstName?: string; // max 100 chars
  lastName?: string; // max 100 chars
  bloodGroup?: string | null; // "0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-" or null
}

/**
 * Response z GET /api/v1/users/me/notification-preferences
 * Backend: NotificationPreferencesResponse.java
 */
export interface NotificationPreferencesResponse {
  id: number;
  userId: number;
  emailEnabled: boolean;
  emailFrequency: string; // "DISABLED" | "ONLY_CRITICAL" | "DAILY" | "IMMEDIATE"
  inAppEnabled: boolean;
  inAppFrequency: string; // "DISABLED" | "ONLY_CRITICAL" | "DAILY" | "IMMEDIATE"
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Request do PUT /api/v1/users/me/notification-preferences
 * Backend: UpdateNotificationPreferencesRequest.java
 */
export interface UpdateNotificationPreferencesRequest {
  emailEnabled: boolean; // required
  emailFrequency: NotificationFrequency; // required
  inAppEnabled: boolean; // required
  inAppFrequency: NotificationFrequency; // required
}

/**
 * Response z DELETE /api/v1/users/me
 * Backend: DeleteAccountResponse.java
 */
export interface DeleteAccountResponse {
  message: string;
  deletionScheduledAt: string; // ISO 8601
}

/**
 * Request do POST /api/v1/auth/password-reset/request
 * Backend: PasswordResetRequestDto.java
 */
export interface PasswordResetRequestDto {
  email: string;
}

/**
 * Response z POST /api/v1/auth/password-reset/request
 */
export interface PasswordResetResponse {
  message: string; // "If the email exists, a password reset link has been sent."
}

// ===== ViewModel Types (Frontend representation) =====

/**
 * ViewModel dla profilu użytkownika (frontend reprezentacja)
 */
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bloodGroup: BloodGroup | null;
  emailVerified: boolean;
  consentInfo: {
    timestamp: Date;
    version: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ViewModel dla preferencji powiadomień
 */
export interface NotificationPreferences {
  id: number;
  userId: number;
  email: {
    enabled: boolean;
    frequency: NotificationFrequency;
  };
  inApp: {
    enabled: boolean;
    frequency: NotificationFrequency;
  };
  updatedAt: Date;
}

// ===== Enums =====

/**
 * Enum dla grupy krwi
 */
export enum BloodGroup {
  O_POSITIVE = '0+',
  O_NEGATIVE = '0-',
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
}

/**
 * Valid blood groups array
 */
export const BLOOD_GROUPS: BloodGroup[] = [
  BloodGroup.O_POSITIVE,
  BloodGroup.O_NEGATIVE,
  BloodGroup.A_POSITIVE,
  BloodGroup.A_NEGATIVE,
  BloodGroup.B_POSITIVE,
  BloodGroup.B_NEGATIVE,
  BloodGroup.AB_POSITIVE,
  BloodGroup.AB_NEGATIVE,
];

/**
 * Enum dla częstotliwości powiadomień
 */
export enum NotificationFrequency {
  DISABLED = 'DISABLED',
  ONLY_CRITICAL = 'ONLY_CRITICAL',
  DAILY = 'DAILY',
  IMMEDIATE = 'IMMEDIATE',
}

/**
 * Labels dla częstotliwości powiadomień (UI)
 */
export const NOTIFICATION_FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  [NotificationFrequency.DISABLED]: 'Wyłączone',
  [NotificationFrequency.ONLY_CRITICAL]: 'Tylko krytyczne',
  [NotificationFrequency.DAILY]: 'Codziennie',
  [NotificationFrequency.IMMEDIATE]: 'Natychmiast',
};

// ===== Form State Types =====

/**
 * Typy dla stanu formularza profilu
 */
export interface ProfileFormState {
  data: UpdateProfileRequest;
  isDirty: boolean;
  isSaving: boolean;
  errors: ValidationErrors;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
}

/**
 * Typy dla stanu formularza preferencji
 */
export interface NotificationPreferencesFormState {
  data: UpdateNotificationPreferencesRequest;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: ValidationErrors;
}

/**
 * Typy dla walidacji
 */
export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  bloodGroup?: string;
  emailFrequency?: string;
  inAppFrequency?: string;
  password?: string;
  [key: string]: string | undefined;
}

/**
 * Status zapisu
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Request usunięcia konta (z hasłem)
 */
export interface DeleteAccountRequest {
  password: string;
  confirmation: boolean;
}

// ===== Validation Schemas (Zod) =====

/**
 * Name regex pattern (only letters, hyphens, apostrophes, Polish characters)
 */
const NAME_REGEX = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s'-]*$/;

/**
 * Schema walidacji dla profilu (Zod)
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .max(100, 'Imię nie może być dłuższe niż 100 znaków')
    .regex(NAME_REGEX, 'Imię zawiera niedozwolone znaki')
    .optional()
    .or(z.literal('')),
  lastName: z
    .string()
    .max(100, 'Nazwisko nie może być dłuższe niż 100 znaków')
    .regex(NAME_REGEX, 'Nazwisko zawiera niedozwolone znaki')
    .optional()
    .or(z.literal('')),
  bloodGroup: z
    .enum(['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
    .nullable()
    .optional(),
});

/**
 * Schema walidacji dla preferencji powiadomień
 */
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  emailFrequency: z.enum(['DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE']),
  inAppEnabled: z.boolean(),
  inAppFrequency: z.enum(['DISABLED', 'ONLY_CRITICAL', 'DAILY', 'IMMEDIATE']),
});

/**
 * Schema walidacji dla usunięcia konta
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Hasło jest wymagane'),
  confirmation: z.boolean().refine((val) => val === true, {
    message: 'Musisz potwierdzić usunięcie konta',
  }),
});

// Typy inferred z schematów
export type ProfileFormData = z.infer<typeof profileSchema>;
export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

// ===== Component Props Types =====

/**
 * Props dla ProfileForm
 */
export interface ProfileFormProps {
  initialData: UserProfile;
  onSave: (data: UpdateProfileRequest) => Promise<void>;
  onError: (error: string) => void;
}

/**
 * Props dla NotificationPreferencesForm
 */
export interface NotificationPreferencesFormProps {
  initialData: NotificationPreferences;
  onSave: (data: UpdateNotificationPreferencesRequest) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

/**
 * Props dla PasswordChangeSection
 */
export interface PasswordChangeSectionProps {
  userEmail: string;
  onRequestReset: (email: string) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

/**
 * Props dla GDPRTools
 */
export interface GDPRToolsProps {
  userId: number;
  onExportData: () => Promise<void>;
  onDeleteAccount: (password: string) => Promise<DeleteAccountResponse>;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

/**
 * Props dla SaveIndicator
 */
export interface SaveIndicatorProps {
  status: SaveStatus;
  message?: string;
  lastSavedAt?: Date | null;
}

/**
 * Props dla ConfirmModal
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requirePassword?: boolean;
  requireConfirmation?: boolean;
  onConfirm: (data?: any) => Promise<void>;
  onCancel: () => void;
}
