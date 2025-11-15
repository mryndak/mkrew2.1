import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmailInput } from '@/components/forms/EmailInput';
import { ErrorMessage } from '@/components/forms/ErrorMessage';
import { requestPasswordReset } from '@/lib/api/endpoints/auth';
import { resetRequestSchema } from '@/types/auth';
import type { ResetRequestFormData, ResetRequestFormProps } from '@/types/auth';

/**
 * ResetRequestForm component
 * Formularz żądania resetu hasła - React island (client:only)
 * Zarządza stanem formularza, walidacją, submitem do API
 *
 * Features:
 * - Email validation (Zod schema)
 * - Rate limiting handling (3 requests per email per hour)
 * - Security: Doesn't reveal if email exists
 * - Success message with instructions
 * - Error handling (API errors, network errors)
 *
 * @param className - Optional CSS classes
 *
 * @example
 * <ResetRequestForm client:only="react" />
 */
export function ResetRequestForm({ className = '' }: ResetRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
  });

  const onSubmit = async (data: ResetRequestFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset(data.email);

      // Always show success message (security - don't reveal if email exists)
      setSuccess(true);
    } catch (err: any) {
      // Handle different error types
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;

        if (status === 429) {
          // Rate limiting
          const retryAfter = err.response.headers['retry-after'];
          const minutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15;
          setError(
            `Zbyt wiele prób. Możesz wysłać kolejne żądanie za ${minutes} ${
              minutes === 1 ? 'minutę' : 'minut'
            }.`
          );
        } else if (status === 400) {
          // Validation error
          const fieldError = errorData.details?.[0]?.message;
          setError(fieldError || 'Nieprawidłowy format email');
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

  // Success state - show confirmation message
  if (success) {
    return (
      <div className={className}>
        <div
          role="alert"
          aria-live="polite"
          data-test-id="reset-request-success-message"
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
                Sprawdź swoją skrzynkę pocztową
              </h3>
              <p className="text-sm text-green-800 mb-2">
                Jeśli podany adres email istnieje w systemie, wysłaliśmy na niego link
                do resetu hasła.
              </p>
              <p className="text-xs text-green-700">
                Link będzie ważny przez <strong>1 godzinę</strong>. Jeśli nie widzisz emaila,
                sprawdź folder spam.
              </p>
            </div>
          </div>
        </div>

        {/* Option to request again */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setError(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            Wyślij ponownie
          </button>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={`space-y-4 ${className}`} data-test-id="reset-request-form">
      {/* Global error message */}
      {error && <div data-test-id="reset-request-error"><ErrorMessage message={error} type="error" /></div>}

      {/* Email field */}
      <div data-test-id="reset-request-email-input">
        <EmailInput
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        data-test-id="reset-request-submit-button"
        disabled={isSubmitting}
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
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span>{isSubmitting ? 'Wysyłanie...' : 'Wyślij link resetujący'}</span>
      </button>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Limit: maksymalnie 3 żądania na godzinę dla jednego adresu email
      </p>
    </form>
  );
}
