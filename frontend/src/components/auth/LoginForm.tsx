import React from 'react';
import { useLoginForm } from '@/lib/hooks/useLoginForm';
import { EmailInput } from '@/components/forms/EmailInput';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { RememberMeCheckbox } from '@/components/forms/RememberMeCheckbox';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { ErrorMessage } from '@/components/forms/ErrorMessage';
import { RateLimitNotice } from './RateLimitNotice';
import { ReCaptchaInput } from '@/components/forms/ReCaptchaInput';
import type { LoginFormProps } from '@/types/auth';

/**
 * LoginForm component
 * Główny formularz logowania - React island (client:load)
 * Zarządza stanem formularza, walidacją, submitem do API, rate limitingiem
 *
 * Features:
 * - Email + password validation (Zod schema)
 * - Rate limiting (5 attempts → 5 min lockout)
 * - CAPTCHA after 3 failed attempts (Google reCAPTCHA v2)
 * - Redux integration (saves auth state)
 * - Error handling (API errors, network errors)
 * - Redirect after successful login
 *
 * @param redirectUrl - URL przekierowania po logowaniu (default: /dashboard)
 * @param onSuccess - Callback po pomyślnym logowaniu (opcjonalny)
 *
 * @example
 * <LoginForm client:load redirectUrl="/dashboard" />
 */
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
    setValue,
  } = useLoginForm(redirectUrl, onSuccess);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" data-test-id="login-form">
      {/* Global error message (API errors) */}
      {globalError && (
        <div data-test-id="login-error-message">
          <ErrorMessage message={globalError.message} type="error" />
        </div>
      )}

      {/* Rate limit notice (lockout) */}
      {isLocked && lockedUntil && (
        <div data-test-id="login-rate-limit-notice">
          <RateLimitNotice
            lockedUntil={lockedUntil}
            onUnlock={() => {
              // Auto-unlock handled by useRateLimit hook
            }}
          />
        </div>
      )}

      {/* Email field */}
      <div data-test-id="login-email-input">
        <EmailInput
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting || isLocked}
        />
      </div>

      {/* Password field */}
      <div data-test-id="login-password-input">
        <PasswordInput
          {...register('password')}
          error={errors.password?.message}
          disabled={isSubmitting || isLocked}
        />
      </div>

      {/* Remember me checkbox */}
      <div data-test-id="login-remember-me-checkbox">
        <RememberMeCheckbox
          {...register('rememberMe')}
          disabled={isSubmitting || isLocked}
        />
      </div>

      {/* CAPTCHA (pokazywany po 3 nieudanych próbach) */}
      {showCaptcha && (
        <div data-test-id="login-captcha-input">
          <ReCaptchaInput
            onChange={(token) => setValue('captchaToken', token)}
            error={errors.captchaToken?.message}
            disabled={isSubmitting || isLocked}
          />
        </div>
      )}

      {/* Submit button */}
      <div data-test-id="login-submit-button">
        <SubmitButton
          loading={isSubmitting}
          disabled={isSubmitting || isLocked}
        />
      </div>
    </form>
  );
}
