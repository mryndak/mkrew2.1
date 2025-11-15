import React, { forwardRef, useState } from 'react';
import { FieldError } from './FieldError';
import type { PasswordInputProps } from '@/types/auth';

/**
 * PasswordInput component
 * Pole hasła z toggle visibility (show/hide) i komunikatem błędu
 * Używa forwardRef dla React Hook Form integration
 *
 * @param error - Komunikat błędu walidacji
 * @param disabled - Czy pole jest disabled
 *
 * @example
 * <PasswordInput
 *   {...register('password')}
 *   error={errors.password?.message}
 *   disabled={isSubmitting}
 * />
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Hasło
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            id="password"
            data-test-id="password-input"
            autoComplete="current-password"
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'password-error' : undefined}
            className={`
              w-full px-3 py-2 pr-10 border rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors duration-200
              ${error ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="••••••••"
            {...props}
          />
          <button
            type="button"
            data-test-id="password-toggle-visibility"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
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
        {error && <FieldError message={error} data-test-id="password-input-error" />}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
