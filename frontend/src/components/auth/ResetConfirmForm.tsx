import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordRequirementsChecklist } from '@/components/auth/register/PasswordRequirementsChecklist';
import { FieldError } from '@/components/forms/FieldError';
import { ErrorMessage } from '@/components/forms/ErrorMessage';
import { confirmPasswordReset } from '@/lib/api/endpoints/auth';
import { resetConfirmSchema } from '@/types/auth';
import type { ResetConfirmFormData, ResetConfirmFormProps } from '@/types/auth';

/**
 * ResetConfirmForm component
 * Formularz potwierdzania resetu hasła - React island (client:only)
 * Zarządza stanem formularza, walidacją, submitem do API
 *
 * Features:
 * - Token extraction from URL query params
 * - Password strength validation with real-time feedback
 * - Password confirmation matching
 * - Password visibility toggle
 * - Token validation errors handling
 * - Success state with auto-redirect to login
 *
 * @param className - Optional CSS classes
 *
 * @example
 * <ResetConfirmForm client:only="react" />
 */
export function ResetConfirmForm({ className = '' }: ResetConfirmFormProps) {
  const [token, setToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRequestNewLink, setShowRequestNewLink] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetConfirmFormData>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Watch password for real-time requirements check
  const newPassword = watch('newPassword', '');

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (!tokenParam) {
      // Redirect to request page if no token
      window.location.href = '/reset-password';
      return;
    }

    setToken(tokenParam);
  }, []);

  const onSubmit = async (data: ResetConfirmFormData) => {
    if (!token) {
      setError('Nieprawidłowy link resetujący. Poproś o nowy link.');
      setShowRequestNewLink(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setShowRequestNewLink(false);

    try {
      await confirmPasswordReset(token, data.newPassword);

      // Show success message
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login?reset=success';
      }, 3000);
    } catch (err: any) {
      // Handle different error types
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        const errorCode = errorData.error;

        if (status === 400) {
          if (errorCode === 'INVALID_TOKEN') {
            setError('Link resetujący wygasł lub jest nieprawidłowy.');
            setShowRequestNewLink(true);
          } else if (errorCode === 'TOKEN_ALREADY_USED') {
            setError('Ten link został już użyty.');
            setShowRequestNewLink(true);
          } else {
            // Password validation error
            const fieldError = errorData.details?.[0]?.message;
            setError(fieldError || 'Hasło nie spełnia wymagań');
          }
        } else if (status === 404) {
          setError('Link resetujący nie został znaleziony.');
          setShowRequestNewLink(true);
        } else {
          setError('Wystąpił błąd. Spróbuj ponownie później.');
        }
      } else if (err.request) {
        // Network error
        setError('Błąd połączenia. Sprawdź swoje połączenie internetowe.');
      } else {
        setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - show confirmation and redirect
  if (success) {
    return (
      <div className={className}>
        <div
          role="alert"
          aria-live="polite"
          data-test-id="reset-confirm-success-message"
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Hasło zostało zresetowane!
              </h3>
              <p className="text-sm text-green-800 mb-2">
                Możesz teraz zalogować się używając nowego hasła.
              </p>
              <p className="text-xs text-green-700">
                Przekierowanie do logowania za 3 sekundy...
              </p>
            </div>
          </div>
        </div>

        {/* Manual redirect link */}
        <div className="mt-4 text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            Przejdź do logowania →
          </a>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={`space-y-4 ${className}`} data-test-id="reset-confirm-form">
      {/* Global error message */}
      {error && (
        <div data-test-id="reset-confirm-error">
          <ErrorMessage message={error} type="error" />
          {showRequestNewLink && (
            <div className="mt-3 text-center">
              <a
                href="/reset-password"
                className="inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Poproś o nowy link →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Hidden token field */}
      <input type="hidden" {...register('token')} value={token} />

      {/* New password field */}
      <div className="mb-4">
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Nowe hasło
        </label>
        <div className="relative">
          <input
            {...register('newPassword')}
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            data-test-id="reset-confirm-new-password-input"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
            className={`
              w-full px-3 py-2 pr-10 border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="••••••••"
          />
          {/* Toggle visibility button */}
          <button
            type="button"
            data-test-id="reset-confirm-new-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.newPassword && <FieldError message={errors.newPassword.message || ''} />}
      </div>

      {/* Password requirements checklist */}
      <PasswordRequirementsChecklist password={newPassword} />

      {/* Confirm password field */}
      <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Potwierdź nowe hasło
        </label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            data-test-id="reset-confirm-confirm-password-input"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            className={`
              w-full px-3 py-2 pr-10 border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="••••••••"
          />
          {/* Toggle visibility button */}
          <button
            type="button"
            data-test-id="reset-confirm-confirm-password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSubmitting}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showConfirmPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && <FieldError message={errors.confirmPassword.message || ''} />}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        data-test-id="reset-confirm-submit-button"
        disabled={isSubmitting || !token}
        className={`
          w-full flex justify-center items-center gap-2 py-3 px-4
          border border-transparent rounded-lg shadow-sm text-sm font-medium
          text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
      >
        {isSubmitting && (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{isSubmitting ? 'Resetowanie...' : 'Zresetuj hasło'}</span>
      </button>
    </form>
  );
}
