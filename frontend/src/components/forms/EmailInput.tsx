import React, { forwardRef } from 'react';
import { FieldError } from './FieldError';
import type { EmailInputProps } from '@/types/auth';

/**
 * EmailInput component
 * Pole email z labelem, walidacją i komunikatem błędu
 * Używa forwardRef dla React Hook Form integration
 *
 * @param error - Komunikat błędu walidacji
 * @param disabled - Czy pole jest disabled (submit lub lockout)
 *
 * @example
 * <EmailInput
 *   {...register('email')}
 *   error={errors.email?.message}
 *   disabled={isSubmitting}
 * />
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ error, disabled, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Adres email
        </label>
        <input
          ref={ref}
          type="email"
          id="email"
          data-test-id="email-input"
          autoComplete="email"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          placeholder="twoj@email.com"
          {...props}
        />
        {error && <FieldError message={error} data-test-id="email-input-error" />}
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';
