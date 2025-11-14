import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { FieldError } from './FieldError';

/**
 * ReCaptchaInput component
 * Google reCAPTCHA v2 widget z obsługą React Hook Form
 *
 * @param error - Komunikat błędu walidacji
 * @param disabled - Czy widget jest disabled
 * @param onChange - Callback wywoływany po rozwiązaniu captcha
 *
 * @example
 * <ReCaptchaInput
 *   onChange={(token) => setValue('captchaToken', token)}
 *   error={errors.captchaToken?.message}
 *   disabled={isSubmitting}
 * />
 */

interface ReCaptchaInputProps {
  error?: string;
  disabled?: boolean;
  onChange?: (token: string | null) => void;
}

export const ReCaptchaInput = forwardRef<ReCAPTCHA, ReCaptchaInputProps>(
  ({ error, disabled, onChange }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    // Expose recaptcha methods to parent via ref
    useImperativeHandle(ref, () => recaptchaRef.current as ReCAPTCHA);

    const siteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY;

    // If no site key is configured, show warning
    if (!siteKey) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Konfiguracja reCAPTCHA:</strong> Brak klucza PUBLIC_RECAPTCHA_SITE_KEY w .env
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Uzyskaj klucz na:{' '}
            <a
              href="https://www.google.com/recaptcha/admin/create"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google reCAPTCHA Admin
            </a>
          </p>
        </div>
      );
    }

    const handleChange = (token: string | null) => {
      if (onChange) {
        onChange(token);
      }
    };

    const handleExpired = () => {
      if (onChange) {
        onChange(null);
      }
    };

    return (
      <div className="mb-4">
        <div
          className={`
            inline-block
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
            ${error ? 'ring-2 ring-red-500 rounded' : ''}
          `}
        >
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            onChange={handleChange}
            onExpired={handleExpired}
            theme="light"
            size="normal"
            hl="pl"
          />
        </div>
        {error && <FieldError message={error} />}
      </div>
    );
  }
);

ReCaptchaInput.displayName = 'ReCaptchaInput';