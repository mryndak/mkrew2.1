import React, { useState, useEffect } from 'react';
import type { RateLimitNoticeProps } from '@/types/auth';

/**
 * RateLimitNotice component
 * Alert wyświetlany gdy użytkownik przekroczył limit prób logowania
 * Pokazuje countdown do momentu odblokowania (5 minut)
 *
 * @param lockedUntil - Timestamp gdy lockout się kończy
 * @param onUnlock - Callback wywoływany gdy countdown się kończy
 *
 * @example
 * <RateLimitNotice
 *   lockedUntil={Date.now() + 300000}
 *   onUnlock={() => checkLockStatus()}
 * />
 */
export function RateLimitNotice({ lockedUntil, onUnlock }: RateLimitNoticeProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Update countdown every second
    const updateCountdown = () => {
      const remaining = Math.max(0, lockedUntil - Date.now());
      setTimeRemaining(remaining);

      // Call onUnlock when countdown ends
      if (remaining === 0) {
        onUnlock();
      }
    };

    // Initial update
    updateCountdown();

    // Set interval
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [lockedUntil, onUnlock]);

  // Format time as MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      role="alert"
      className="rounded-lg border border-orange-400 bg-orange-50 p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 flex-shrink-0 text-orange-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-800 mb-1">
            Konto tymczasowo zablokowane
          </h3>
          <p className="text-sm text-orange-700">
            Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za{' '}
            <span className="font-mono font-semibold" aria-live="polite">
              {formatTime(timeRemaining)}
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
