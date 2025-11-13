import { useState, useEffect, useCallback } from 'react';
import type { RateLimitInfo } from '@/types/auth';
import { RATE_LIMIT_CONFIG } from '@/types/auth';

const STORAGE_KEY = RATE_LIMIT_CONFIG.STORAGE_KEY;

/**
 * Hook do zarządzania rate limitingiem logowania
 * Trackuje failed attempts w localStorage i zarządza lockout state
 *
 * @returns {object} Rate limit state and control functions
 * - attemptCount: number of failed login attempts
 * - isLocked: whether user is currently locked out
 * - lockedUntil: timestamp when lockout ends (null if not locked)
 * - incrementAttempt: function to increment attempt count
 * - resetAttempts: function to reset attempts (after successful login)
 * - checkLockStatus: function to check and update lock status
 *
 * @example
 * const { attemptCount, isLocked, incrementAttempt, resetAttempts } = useRateLimit();
 *
 * // After failed login
 * incrementAttempt();
 *
 * // After successful login
 * resetAttempts();
 */
export function useRateLimit() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>(() => {
    // Load from localStorage on mount
    if (typeof window === 'undefined') {
      return { attemptCount: 0, lockedUntil: null, lastAttemptTimestamp: 0 };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { attemptCount: 0, lockedUntil: null, lastAttemptTimestamp: 0 };
      }
    }
    return { attemptCount: 0, lockedUntil: null, lastAttemptTimestamp: 0 };
  });

  // Derived state
  const isLocked = rateLimitInfo.lockedUntil && rateLimitInfo.lockedUntil > Date.now();
  const lockedUntil = rateLimitInfo.lockedUntil;
  const attemptCount = rateLimitInfo.attemptCount;

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rateLimitInfo));
    }
  }, [rateLimitInfo]);

  /**
   * Increment attempt count
   * If max attempts reached, lock the account for configured duration
   */
  const incrementAttempt = useCallback(() => {
    setRateLimitInfo((prev) => {
      const newCount = prev.attemptCount + 1;
      const newInfo: RateLimitInfo = {
        attemptCount: newCount,
        lockedUntil: prev.lockedUntil,
        lastAttemptTimestamp: Date.now(),
      };

      // Lock if reached max attempts
      if (newCount >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
        newInfo.lockedUntil = Date.now() + RATE_LIMIT_CONFIG.LOCKOUT_DURATION_MS;
      }

      return newInfo;
    });
  }, []);

  /**
   * Reset attempts
   * Called after successful login
   */
  const resetAttempts = useCallback(() => {
    setRateLimitInfo({
      attemptCount: 0,
      lockedUntil: null,
      lastAttemptTimestamp: 0,
    });
  }, []);

  /**
   * Check lock status
   * Call periodically to update isLocked state
   * Automatically unlocks when lockout duration expires
   */
  const checkLockStatus = useCallback(() => {
    setRateLimitInfo((prev) => {
      // If locked but time expired, unlock
      if (prev.lockedUntil && prev.lockedUntil <= Date.now()) {
        return {
          attemptCount: 0,
          lockedUntil: null,
          lastAttemptTimestamp: 0,
        };
      }
      return prev;
    });
  }, []);

  return {
    attemptCount,
    isLocked: !!isLocked,
    lockedUntil,
    incrementAttempt,
    resetAttempts,
    checkLockStatus,
  };
}
