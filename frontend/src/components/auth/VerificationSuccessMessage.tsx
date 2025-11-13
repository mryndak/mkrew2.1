import React, { useState, useEffect } from 'react';
import type { VerificationSuccessMessageProps } from '@/types/auth';

/**
 * VerificationSuccessMessage component
 * Success banner wyświetlany gdy użytkownik pomyślnie zweryfikował email
 * Pokazywany na górze strony logowania jeśli query param verified=true
 *
 * @param onClose - Callback do zamknięcia bannera (opcjonalny)
 *
 * @example
 * <VerificationSuccessMessage onClose={() => setVerified(false)} />
 */
export function VerificationSuccessMessage({ onClose }: VerificationSuccessMessageProps) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss po 10 sekundach (opcjonalnie)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 10000); // 10 sekund

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="rounded-lg border border-green-400 bg-green-50 p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 flex-shrink-0 text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            Email został pomyślnie zweryfikowany! Możesz się teraz zalogować.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600"
          aria-label="Zamknij powiadomienie"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
