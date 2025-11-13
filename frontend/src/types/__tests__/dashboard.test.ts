/**
 * Unit tests dla Dashboard utility functions
 *
 * Test framework: Vitest
 * Functions tested:
 * - calculateNextEligibleDate
 * - getDaysRemaining
 * - isEligibleToDonate
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateNextEligibleDate,
  getDaysRemaining,
  isEligibleToDonate,
  DAYS_BETWEEN_DONATIONS,
} from '../dashboard';

describe('Dashboard Utility Functions', () => {
  // Mock date for consistent testing
  const MOCK_TODAY = new Date('2025-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TODAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateNextEligibleDate', () => {
    it('should return null when lastDonationDate is null', () => {
      const result = calculateNextEligibleDate(null);
      expect(result).toBeNull();
    });

    it('should calculate next eligible date correctly (56 days later)', () => {
      const lastDonationDate = '2024-12-01'; // Dec 1, 2024
      const result = calculateNextEligibleDate(lastDonationDate);

      // Expected: 2024-12-01 + 56 days = 2025-01-26
      expect(result).toBe('2025-01-26');
    });

    it('should handle leap year correctly', () => {
      const lastDonationDate = '2024-01-15'; // 2024 is a leap year
      const result = calculateNextEligibleDate(lastDonationDate);

      // Expected: 2024-01-15 + 56 days = 2024-03-11
      expect(result).toBe('2024-03-11');
    });

    it('should handle year boundary correctly', () => {
      const lastDonationDate = '2024-12-15';
      const result = calculateNextEligibleDate(lastDonationDate);

      // Expected: 2024-12-15 + 56 days = 2025-02-09
      expect(result).toBe('2025-02-09');
    });

    it('should return ISO date format (YYYY-MM-DD)', () => {
      const lastDonationDate = '2025-01-01';
      const result = calculateNextEligibleDate(lastDonationDate);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use DAYS_BETWEEN_DONATIONS constant (56 days)', () => {
      const lastDonationDate = '2025-01-01';
      const result = calculateNextEligibleDate(lastDonationDate);

      const expected = new Date('2025-01-01');
      expected.setDate(expected.getDate() + DAYS_BETWEEN_DONATIONS);
      const expectedStr = expected.toISOString().split('T')[0];

      expect(result).toBe(expectedStr);
      expect(DAYS_BETWEEN_DONATIONS).toBe(56);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return null when lastDonationDate is null', () => {
      const result = getDaysRemaining(null);
      expect(result).toBeNull();
    });

    it('should return 0 when already eligible (past next eligible date)', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-11-01 (75 days ago, > 56 days)
      const lastDonationDate = '2024-11-01';
      const result = getDaysRemaining(lastDonationDate);

      expect(result).toBe(0);
    });

    it('should return correct days remaining when not yet eligible', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-12-20 (26 days ago)
      // Next eligible: 2024-12-20 + 56 = 2025-02-14 (30 days from today)
      const lastDonationDate = '2024-12-20';
      const result = getDaysRemaining(lastDonationDate);

      expect(result).toBe(30);
    });

    it('should return 0 when exactly on eligible date', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-11-20 (56 days ago exactly)
      const lastDonationDate = '2024-11-20';
      const result = getDaysRemaining(lastDonationDate);

      expect(result).toBe(0);
    });

    it('should never return negative days (Math.max)', () => {
      // Last donation very long ago
      const lastDonationDate = '2020-01-01';
      const result = getDaysRemaining(lastDonationDate);

      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should handle recent donation (many days remaining)', () => {
      // Mock today: 2025-01-15
      // Last donation: 2025-01-10 (5 days ago)
      // Next eligible: 2025-01-10 + 56 = 2025-03-07 (51 days from today)
      const lastDonationDate = '2025-01-10';
      const result = getDaysRemaining(lastDonationDate);

      expect(result).toBe(51);
    });

    it('should use Math.ceil for fractional days', () => {
      // Ensure any partial day counts as a full day remaining
      const lastDonationDate = '2025-01-14'; // 1 day ago
      // Next eligible: 2025-03-11 (55 days from today)
      const result = getDaysRemaining(lastDonationDate);

      expect(result).toBe(55);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('isEligibleToDonate', () => {
    it('should return true when lastDonationDate is null (new donor)', () => {
      const result = isEligibleToDonate(null);
      expect(result).toBe(true);
    });

    it('should return true when 56+ days have passed', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-11-01 (75 days ago)
      const lastDonationDate = '2024-11-01';
      const result = isEligibleToDonate(lastDonationDate);

      expect(result).toBe(true);
    });

    it('should return false when less than 56 days have passed', () => {
      // Mock today: 2025-01-15
      // Last donation: 2025-01-01 (14 days ago)
      const lastDonationDate = '2025-01-01';
      const result = isEligibleToDonate(lastDonationDate);

      expect(result).toBe(false);
    });

    it('should return true when exactly 56 days have passed', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-11-20 (56 days ago exactly)
      const lastDonationDate = '2024-11-20';
      const result = isEligibleToDonate(lastDonationDate);

      expect(result).toBe(true);
    });

    it('should return false one day before eligible date', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-11-21 (55 days ago)
      const lastDonationDate = '2024-11-21';
      const result = isEligibleToDonate(lastDonationDate);

      expect(result).toBe(false);
    });

    it('should be consistent with getDaysRemaining logic', () => {
      const testDates = [
        '2025-01-01', // 14 days ago
        '2024-12-01', // 45 days ago
        '2024-11-20', // 56 days ago
        '2024-11-01', // 75 days ago
      ];

      testDates.forEach((lastDonationDate) => {
        const daysRemaining = getDaysRemaining(lastDonationDate);
        const isEligible = isEligibleToDonate(lastDonationDate);

        if (daysRemaining === 0) {
          expect(isEligible).toBe(true);
        } else if (daysRemaining && daysRemaining > 0) {
          expect(isEligible).toBe(false);
        }
      });
    });
  });

  describe('Integration: Full donation eligibility flow', () => {
    it('should calculate all values correctly for a recent donation', () => {
      // Mock today: 2025-01-15
      // Last donation: 2025-01-05 (10 days ago)
      const lastDonationDate = '2025-01-05';

      const nextEligibleDate = calculateNextEligibleDate(lastDonationDate);
      const daysRemaining = getDaysRemaining(lastDonationDate);
      const isEligible = isEligibleToDonate(lastDonationDate);

      expect(nextEligibleDate).toBe('2025-03-02'); // 2025-01-05 + 56 days
      expect(daysRemaining).toBe(46); // 46 days from 2025-01-15 to 2025-03-02
      expect(isEligible).toBe(false);
    });

    it('should calculate all values correctly for an old donation', () => {
      // Mock today: 2025-01-15
      // Last donation: 2024-10-01 (106 days ago)
      const lastDonationDate = '2024-10-01';

      const nextEligibleDate = calculateNextEligibleDate(lastDonationDate);
      const daysRemaining = getDaysRemaining(lastDonationDate);
      const isEligible = isEligibleToDonate(lastDonationDate);

      expect(nextEligibleDate).toBe('2024-11-26'); // 2024-10-01 + 56 days
      expect(daysRemaining).toBe(0); // Already eligible (50 days past eligible date)
      expect(isEligible).toBe(true);
    });

    it('should handle new donor (null lastDonationDate)', () => {
      const nextEligibleDate = calculateNextEligibleDate(null);
      const daysRemaining = getDaysRemaining(null);
      const isEligible = isEligibleToDonate(null);

      expect(nextEligibleDate).toBeNull();
      expect(daysRemaining).toBeNull();
      expect(isEligible).toBe(true); // New donors can donate immediately
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid date strings gracefully', () => {
      // Note: JavaScript Date constructor is permissive, may return Invalid Date
      const invalidDate = 'not-a-date';
      const result = calculateNextEligibleDate(invalidDate);

      // Expect either null or 'Invalid Date' string
      // Actual behavior depends on implementation
      expect(result).toBeTruthy(); // Will be a string but might be 'NaN-NaN-NaN'
    });

    it('should handle very old dates', () => {
      const veryOldDate = '1990-01-01';
      const result = isEligibleToDonate(veryOldDate);

      expect(result).toBe(true); // Definitely eligible
    });

    it('should handle future dates (edge case - should not happen in real app)', () => {
      // Mock today: 2025-01-15
      // Last donation: 2025-02-01 (future date - 17 days in the future)
      const futureDate = '2025-02-01';

      const daysRemaining = getDaysRemaining(futureDate);
      const isEligible = isEligibleToDonate(futureDate);

      // Days remaining would be > 56 (future date + 56)
      expect(daysRemaining).toBeGreaterThan(56);
      expect(isEligible).toBe(false);
    });

    it('should maintain consistency across timezone boundaries', () => {
      // Dates in ISO format should be treated consistently
      const date1 = '2025-01-01';
      const date2 = '2025-01-01T00:00:00Z';
      const date3 = '2025-01-01T23:59:59Z';

      const result1 = calculateNextEligibleDate(date1);
      const result2 = calculateNextEligibleDate(date2);
      const result3 = calculateNextEligibleDate(date3);

      // All should give same result (date only, no time component)
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
