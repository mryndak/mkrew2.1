import React, { useState } from 'react';
import { FieldError } from '@/components/forms/FieldError';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';
import { EmailUniquenessIndicator } from './EmailUniquenessIndicator';
import type { Step1FormProps } from '@/types/auth';

/**
 * Step1Form component
 * Pierwszy krok rejestracji - zbiera email, hasło, i zgody
 * Zawiera asynchroniczną walidację unikalności emaila, password strength indicator, i wymagane checkboxy
 *
 * @param formData - Dane formularza dla kroku 1
 * @param errors - Błędy walidacji
 * @param emailCheckStatus - Status sprawdzania unikalności emaila
 * @param onChange - Handler zmiany pola
 * @param onNext - Handler przejścia do następnego kroku
 *
 * @example
 * <Step1Form
 *   formData={formData}
 *   errors={errors}
 *   emailCheckStatus={emailCheckStatus}
 *   onChange={updateField}
 *   onNext={goToNextStep}
 * />
 */
export function Step1Form({
  formData,
  errors,
  emailCheckStatus,
  onChange,
  onNext,
}: Step1FormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center" data-test-id="register-step1-header">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Utwórz konto
        </h2>
        <p className="text-sm text-gray-600">
          Krok 1 z 3: Dane logowania
        </p>
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Adres email *
        </label>
        <input
          type="email"
          id="email"
          data-test-id="register-email-input"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${errors.email ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="twoj@email.com"
        />
        {errors.email && <FieldError message={errors.email} data-test-id="register-email-error" />}
        <EmailUniquenessIndicator status={emailCheckStatus} email={formData.email} />
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Hasło *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            data-test-id="register-password-input"
            value={formData.password}
            onChange={(e) => onChange('password', e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`
              w-full px-3 py-2 pr-10 border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors duration-200
              ${errors.password ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="••••••••"
          />
          <button
            type="button"
            data-test-id="register-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && <FieldError message={errors.password} data-test-id="register-password-error" />}
        <PasswordStrengthIndicator password={formData.password} />
        <PasswordRequirementsChecklist password={formData.password} />
      </div>

      {/* Confirm password field */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Potwierdź hasło *
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            data-test-id="register-confirm-password-input"
            value={formData.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            className={`
              w-full px-3 py-2 pr-10 border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors duration-200
              ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="••••••••"
          />
          <button
            type="button"
            data-test-id="register-confirm-password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showConfirmPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && <FieldError message={errors.confirmPassword} data-test-id="register-confirm-password-error" />}
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-3">
        {/* Privacy policy consent (required) */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="consentAccepted"
            data-test-id="register-consent-checkbox"
            checked={formData.consentAccepted}
            onChange={(e) => onChange('consentAccepted', e.target.checked)}
            aria-invalid={!!errors.consentAccepted}
            aria-describedby={errors.consentAccepted ? 'consentAccepted-error' : undefined}
            className={`
              h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded
              focus:ring-2 focus:ring-blue-500
              ${errors.consentAccepted ? 'border-red-500' : ''}
            `}
          />
          <label htmlFor="consentAccepted" className="ml-2 text-sm text-gray-700">
            Akceptuję{' '}
            <a
              href="/polityka-prywatnosci"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Politykę prywatności
            </a>{' '}
            i{' '}
            <a
              href="/regulamin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Regulamin
            </a>{' '}
            *
          </label>
        </div>
        {errors.consentAccepted && (
          <FieldError message={errors.consentAccepted} data-test-id="register-consent-error" />
        )}

        {/* Marketing consent (optional) */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="marketingConsent"
            data-test-id="register-marketing-checkbox"
            checked={formData.marketingConsent}
            onChange={(e) => onChange('marketingConsent', e.target.checked)}
            className="h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="marketingConsent" className="ml-2 text-sm text-gray-700">
            Zgadzam się na otrzymywanie informacji marketingowych (opcjonalnie)
          </label>
        </div>
      </div>

      {/* Next button */}
      <button
        type="button"
        data-test-id="register-step1-next-button"
        onClick={onNext}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200"
      >
        Dalej
      </button>

      {/* Required fields notice */}
      <p className="text-xs text-gray-500 text-center">
        * Pole wymagane
      </p>
    </div>
  );
}
