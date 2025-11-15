/**
 * Unit tests for scraperHelpers utilities
 *
 * Test framework: Vitest
 * Coverage: Wszystkie 12 funkcji pomocniczych dla widoku Scraper
 *
 * Tested functions:
 * - formatRelativeTime() - czas względny z polskimi formami
 * - formatAbsoluteDate() - data absolutna w długiej formie
 * - formatShortDate() - data w krótkiej formie (DD.MM.YYYY HH:MM)
 * - formatDuration() - konwersja sekund na "Xh Ym Zs"
 * - calculateSuccessRate() - obliczanie procentu sukcesu
 * - getSuccessRateColor() - CSS classes dla success rate
 * - truncateText() - obcinanie tekstu z wielokropkiem
 * - formatPolishPlural() - polskie formy liczebnika
 * - isStaleData() - sprawdzanie nieaktualnych danych
 * - copyToClipboard() - kopiowanie do schowka
 * - parseStatusFilter() - parsowanie filtrów statusu
 * - isRunning() - sprawdzanie czy status=RUNNING
 * - formatResponseTime() - formatowanie czasu odpowiedzi
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  formatAbsoluteDate,
  formatShortDate,
  formatDuration,
  calculateSuccessRate,
  getSuccessRateColor,
  truncateText,
  formatPolishPlural,
  isStaleData,
  copyToClipboard,
  parseStatusFilter,
  isRunning,
  formatResponseTime,
} from '../scraperHelpers';

describe('scraperHelpers utilities', () => {
  let mockNow: Date;

  beforeEach(() => {
    // Set consistent "now" for relative time tests
    mockNow = new Date('2025-01-15T10:30:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatRelativeTime()', () => {
    describe('Happy path', () => {
      it('should return "przed chwilą" for recent timestamps (< 60s)', () => {
        const input = new Date('2025-01-15T10:29:30Z').toISOString(); // 30s ago
        expect(formatRelativeTime(input)).toBe('przed chwilą');
      });

      it('should format minutes correctly with Polish plural', () => {
        const input1 = new Date('2025-01-15T10:29:00Z').toISOString(); // 1 min
        expect(formatRelativeTime(input1)).toBe('1 minutę temu');

        const input2 = new Date('2025-01-15T10:28:00Z').toISOString(); // 2 min
        expect(formatRelativeTime(input2)).toBe('2 minuty temu');

        const input5 = new Date('2025-01-15T10:25:00Z').toISOString(); // 5 min
        expect(formatRelativeTime(input5)).toBe('5 minut temu');

        const input22 = new Date('2025-01-15T10:08:00Z').toISOString(); // 22 min
        expect(formatRelativeTime(input22)).toBe('22 minuty temu');
      });

      it('should format hours correctly with Polish plural', () => {
        const input1 = new Date('2025-01-15T09:30:00Z').toISOString(); // 1h
        expect(formatRelativeTime(input1)).toBe('1 godzinę temu');

        const input2 = new Date('2025-01-15T08:30:00Z').toISOString(); // 2h
        expect(formatRelativeTime(input2)).toBe('2 godziny temu');

        const input5 = new Date('2025-01-15T05:30:00Z').toISOString(); // 5h
        expect(formatRelativeTime(input5)).toBe('5 godzin temu');

        const input23 = new Date('2025-01-14T11:30:00Z').toISOString(); // 23h
        expect(formatRelativeTime(input23)).toBe('23 godziny temu');
      });

      it('should format days correctly with Polish plural', () => {
        const input1 = new Date('2025-01-14T10:30:00Z').toISOString(); // 1 day
        expect(formatRelativeTime(input1)).toBe('1 dzień temu');

        const input2 = new Date('2025-01-13T10:30:00Z').toISOString(); // 2 days
        expect(formatRelativeTime(input2)).toBe('2 dni temu');

        const input7 = new Date('2025-01-08T10:30:00Z').toISOString(); // 7 days
        expect(formatRelativeTime(input7)).toBe('7 dni temu');

        const input29 = new Date('2024-12-17T10:30:00Z').toISOString(); // 29 days
        expect(formatRelativeTime(input29)).toBe('29 dni temu');
      });

      it('should return absolute date for timestamps > 30 days old', () => {
        const input = new Date('2024-11-15T10:30:00Z').toISOString(); // ~60 days
        const result = formatRelativeTime(input);

        // Should contain month name in Polish
        expect(result).toContain('2024');
        expect(result).not.toContain('temu');
      });
    });

    describe('Edge cases', () => {
      it('should return "Brak" for empty string', () => {
        expect(formatRelativeTime('')).toBe('Brak');
      });

      it('should return "Brak" for whitespace-only string', () => {
        expect(formatRelativeTime('   ')).toBe('Brak');
      });

      it('should return "Brak" for invalid date', () => {
        expect(formatRelativeTime('not-a-date')).toBe('Brak');
      });

      it('should return "Brak" for dates before year 2000 (Unix epoch)', () => {
        const before2000 = new Date('1999-12-31T23:59:59Z').toISOString();
        expect(formatRelativeTime(before2000)).toBe('Brak');
      });

      it('should handle year 2000 timestamp correctly', () => {
        const year2000 = new Date('2000-01-01T00:00:00Z').toISOString();
        const result = formatRelativeTime(year2000);

        // Should NOT return "Brak" (946684800000 is exactly Jan 1, 2000)
        expect(result).not.toBe('Brak');
      });
    });
  });

  describe('formatAbsoluteDate()', () => {
    describe('Happy path', () => {
      it('should format date with Polish month name and time', () => {
        const input = '2025-01-15T14:30:00Z';
        const result = formatAbsoluteDate(input);

        expect(result).toContain('2025');
        expect(result).toContain('stycznia'); // Polish month name
        expect(result).toContain('15');
      });

      it('should format all Polish months correctly', () => {
        const months = [
          { date: '2025-01-15T12:00:00Z', month: 'stycznia' },
          { date: '2025-02-15T12:00:00Z', month: 'lutego' },
          { date: '2025-03-15T12:00:00Z', month: 'marca' },
          { date: '2025-12-15T12:00:00Z', month: 'grudnia' },
        ];

        months.forEach(({ date, month }) => {
          const result = formatAbsoluteDate(date);
          expect(result).toContain(month);
        });
      });
    });

    describe('Edge cases', () => {
      it('should return "Brak" for empty string', () => {
        expect(formatAbsoluteDate('')).toBe('Brak');
      });

      it('should return "Brak" for invalid date', () => {
        expect(formatAbsoluteDate('not-a-date')).toBe('Brak');
      });

      it('should return "Brak" for dates before year 2000', () => {
        expect(formatAbsoluteDate('1999-12-31T23:59:59Z')).toBe('Brak');
      });
    });
  });

  describe('formatShortDate()', () => {
    describe('Happy path', () => {
      it('should format date as "DD.MM.YYYY, HH:MM" (with comma)', () => {
        const input = '2025-01-15T14:30:00Z';
        const result = formatShortDate(input);

        // Format: 15.01.2025, 14:30 (note the comma!)
        expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
        expect(result).toContain('2025');
      });

      it('should handle midnight correctly', () => {
        const input = '2025-01-15T00:00:00Z';
        const result = formatShortDate(input);

        expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
      });
    });

    describe('Edge cases', () => {
      it('should return "Brak" for empty string', () => {
        expect(formatShortDate('')).toBe('Brak');
      });

      it('should return "Brak" for invalid date', () => {
        expect(formatShortDate('not-a-date')).toBe('Brak');
      });

      it('should return "Brak" for dates before year 2000', () => {
        expect(formatShortDate('1999-12-31T23:59:59Z')).toBe('Brak');
      });
    });
  });

  describe('formatDuration()', () => {
    describe('Happy path', () => {
      it('should format 0 seconds as "0s"', () => {
        expect(formatDuration(0)).toBe('0s');
      });

      it('should format seconds only', () => {
        expect(formatDuration(15)).toBe('15s');
        expect(formatDuration(59)).toBe('59s');
      });

      it('should format minutes and seconds', () => {
        expect(formatDuration(90)).toBe('1m 30s'); // 1.5 min
        expect(formatDuration(125)).toBe('2m 5s'); // 2min 5s
      });

      it('should format hours, minutes and seconds', () => {
        expect(formatDuration(3665)).toBe('1h 1m 5s'); // 1h 1m 5s
        expect(formatDuration(7325)).toBe('2h 2m 5s'); // 2h 2m 5s
      });

      it('should omit zero parts (except trailing seconds)', () => {
        expect(formatDuration(3600)).toBe('1h'); // exactly 1 hour
        expect(formatDuration(60)).toBe('1m'); // exactly 1 minute
        expect(formatDuration(3660)).toBe('1h 1m'); // 1h 1m 0s -> omit 0s
      });

      it('should handle very long durations', () => {
        const oneDayInSeconds = 86400;
        const result = formatDuration(oneDayInSeconds);

        expect(result).toContain('24h');
      });
    });

    describe('Edge cases', () => {
      it('should return "0s" for null', () => {
        expect(formatDuration(null)).toBe('0s');
      });

      it('should handle negative durations (edge case)', () => {
        // Negative might not make sense in context, but test behavior
        const result = formatDuration(-60);

        // Math.floor on negative numbers behaves differently
        expect(result).toBeTruthy();
      });
    });
  });

  describe('calculateSuccessRate()', () => {
    describe('Happy path', () => {
      it('should calculate 100% success rate', () => {
        expect(calculateSuccessRate(10, 10)).toBe(100);
      });

      it('should calculate 50% success rate', () => {
        expect(calculateSuccessRate(5, 10)).toBe(50);
      });

      it('should calculate 0% success rate', () => {
        expect(calculateSuccessRate(0, 10)).toBe(0);
      });

      it('should round to nearest integer', () => {
        expect(calculateSuccessRate(3, 10)).toBe(30); // 30%
        expect(calculateSuccessRate(6, 10)).toBe(60); // 60%
        expect(calculateSuccessRate(1, 3)).toBe(33); // 33.33% -> 33%
        expect(calculateSuccessRate(2, 3)).toBe(67); // 66.67% -> 67%
      });

      it('should handle partial successes', () => {
        expect(calculateSuccessRate(7, 10)).toBe(70);
        expect(calculateSuccessRate(95, 100)).toBe(95);
      });
    });

    describe('Edge cases', () => {
      it('should return 0 when total is 0', () => {
        expect(calculateSuccessRate(0, 0)).toBe(0);
        expect(calculateSuccessRate(5, 0)).toBe(0); // Prevents division by zero
      });

      it('should handle very large numbers', () => {
        expect(calculateSuccessRate(9500, 10000)).toBe(95);
      });

      it('should handle successful > total (data inconsistency)', () => {
        // In real world, this shouldn't happen, but test behavior
        const result = calculateSuccessRate(15, 10);

        expect(result).toBe(150); // Will return > 100%
      });
    });
  });

  describe('getSuccessRateColor()', () => {
    describe('Happy path', () => {
      it('should return green for >= 95%', () => {
        const result95 = getSuccessRateColor(95);
        expect(result95.bg).toBe('bg-green-500');
        expect(result95.text).toBe('text-green-700');
        expect(result95.label).toBe('Bardzo dobrze');

        const result100 = getSuccessRateColor(100);
        expect(result100.bg).toBe('bg-green-500');
      });

      it('should return yellow for 80-94%', () => {
        const result80 = getSuccessRateColor(80);
        expect(result80.bg).toBe('bg-yellow-500');
        expect(result80.text).toBe('text-yellow-700');
        expect(result80.label).toBe('Średnio');

        const result94 = getSuccessRateColor(94);
        expect(result94.bg).toBe('bg-yellow-500');
      });

      it('should return red for < 80%', () => {
        const result79 = getSuccessRateColor(79);
        expect(result79.bg).toBe('bg-red-500');
        expect(result79.text).toBe('text-red-700');
        expect(result79.label).toBe('Słabo');

        const result0 = getSuccessRateColor(0);
        expect(result0.bg).toBe('bg-red-500');
      });
    });

    describe('Edge cases', () => {
      it('should handle boundary values correctly', () => {
        // 95 is first green
        expect(getSuccessRateColor(95).bg).toBe('bg-green-500');

        // 94 is still yellow
        expect(getSuccessRateColor(94).bg).toBe('bg-yellow-500');

        // 80 is first yellow
        expect(getSuccessRateColor(80).bg).toBe('bg-yellow-500');

        // 79 is red
        expect(getSuccessRateColor(79).bg).toBe('bg-red-500');
      });

      it('should handle negative rates (data error)', () => {
        const result = getSuccessRateColor(-10);

        // Should return red for negative
        expect(result.bg).toBe('bg-red-500');
      });

      it('should handle rates > 100% (data error)', () => {
        const result = getSuccessRateColor(150);

        // Should return green
        expect(result.bg).toBe('bg-green-500');
      });
    });
  });

  describe('truncateText()', () => {
    describe('Happy path', () => {
      it('should return original text if shorter than maxLength', () => {
        expect(truncateText('Hello', 10)).toBe('Hello');
        expect(truncateText('Hi', 10)).toBe('Hi');
      });

      it('should return original text if equal to maxLength', () => {
        expect(truncateText('HelloWorld', 10)).toBe('HelloWorld');
      });

      it('should truncate text longer than maxLength with "..."', () => {
        expect(truncateText('Hello World Test', 10)).toBe('Hello Worl...');
        expect(truncateText('Very long text here', 10)).toBe('Very long ...');
      });

      it('should handle exact boundary', () => {
        const text = '1234567890';
        expect(truncateText(text, 10)).toBe(text);
        expect(truncateText(text + 'X', 10)).toBe(text + '...');
      });
    });

    describe('Edge cases', () => {
      it('should return empty string for null', () => {
        expect(truncateText(null, 10)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(truncateText(undefined as any, 10)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect(truncateText('', 10)).toBe('');
      });

      it('should handle maxLength = 0', () => {
        expect(truncateText('Hello', 0)).toBe('...');
      });

      it('should handle very short maxLength', () => {
        expect(truncateText('Hello World', 3)).toBe('Hel...');
      });
    });
  });

  describe('formatPolishPlural()', () => {
    describe('Singular form (1)', () => {
      it('should return singular for 1', () => {
        expect(formatPolishPlural(1, 'minuta', 'minuty', 'minut')).toBe('minuta');
        expect(formatPolishPlural(1, 'godzina', 'godziny', 'godzin')).toBe('godzina');
      });
    });

    describe('Plural form 2-4 (2,3,4,22,23,24,32...)', () => {
      it('should return plural2to4 for 2,3,4', () => {
        expect(formatPolishPlural(2, 'minuta', 'minuty', 'minut')).toBe('minuty');
        expect(formatPolishPlural(3, 'minuta', 'minuty', 'minut')).toBe('minuty');
        expect(formatPolishPlural(4, 'minuta', 'minuty', 'minut')).toBe('minuty');
      });

      it('should return plural2to4 for 22,23,24', () => {
        expect(formatPolishPlural(22, 'minuta', 'minuty', 'minut')).toBe('minuty');
        expect(formatPolishPlural(23, 'minuta', 'minuty', 'minut')).toBe('minuty');
        expect(formatPolishPlural(24, 'minuta', 'minuty', 'minut')).toBe('minuty');
      });

      it('should return plural2to4 for 32,33,34', () => {
        expect(formatPolishPlural(32, 'minuta', 'minuty', 'minut')).toBe('minuty');
      });
    });

    describe('Plural form 5+ (0,5-21,25-31...)', () => {
      it('should return plural5plus for 0', () => {
        expect(formatPolishPlural(0, 'minuta', 'minuty', 'minut')).toBe('minut');
      });

      it('should return plural5plus for 5-21', () => {
        expect(formatPolishPlural(5, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(10, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(21, 'minuta', 'minuty', 'minut')).toBe('minut');
      });

      it('should return plural5plus for teen exceptions (11-14)', () => {
        // 11,12,13,14 should use plural5plus (NOT plural2to4)
        expect(formatPolishPlural(11, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(12, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(13, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(14, 'minuta', 'minuty', 'minut')).toBe('minut');
      });

      it('should return plural5plus for 25-31 (except 22-24)', () => {
        expect(formatPolishPlural(25, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(30, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(31, 'minuta', 'minuty', 'minut')).toBe('minut');
      });

      it('should return plural5plus for large numbers (100+)', () => {
        expect(formatPolishPlural(100, 'minuta', 'minuty', 'minut')).toBe('minut');
        expect(formatPolishPlural(112, 'minuta', 'minuty', 'minut')).toBe('minut'); // teen
        expect(formatPolishPlural(122, 'minuta', 'minuty', 'minut')).toBe('minuty'); // ends in 22
      });
    });
  });

  describe('isStaleData()', () => {
    describe('Happy path', () => {
      it('should return false for fresh data (< maxAgeMinutes)', () => {
        const fresh = new Date('2025-01-15T10:26:00Z').toISOString(); // 4 min ago
        expect(isStaleData(fresh, 5)).toBe(false);
      });

      it('should return true for stale data (> maxAgeMinutes)', () => {
        const stale = new Date('2025-01-15T10:20:00Z').toISOString(); // 10 min ago
        expect(isStaleData(stale, 5)).toBe(true);
      });

      it('should use default 5 minutes if not specified', () => {
        const data6minOld = new Date('2025-01-15T10:24:00Z').toISOString();
        expect(isStaleData(data6minOld)).toBe(true);

        const data4minOld = new Date('2025-01-15T10:26:00Z').toISOString();
        expect(isStaleData(data4minOld)).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle exact boundary (5 min default)', () => {
        const exactly5min = new Date('2025-01-15T10:25:00Z').toISOString();
        const result = isStaleData(exactly5min, 5);

        // exactly 5 minutes -> should be false (not GREATER than 5)
        expect(result).toBe(false);
      });

      it('should handle custom maxAgeMinutes', () => {
        const data = new Date('2025-01-15T10:20:00Z').toISOString(); // 10 min

        expect(isStaleData(data, 15)).toBe(false); // < 15 min
        expect(isStaleData(data, 5)).toBe(true); // > 5 min
      });

      it('should handle future timestamps', () => {
        const future = new Date('2025-01-15T10:35:00Z').toISOString();

        // Future data should return false (negative diff)
        expect(isStaleData(future, 5)).toBe(false);
      });
    });
  });

  describe('copyToClipboard()', () => {
    beforeEach(() => {
      // Mock clipboard API using defineProperty (clipboard is read-only)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });

      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: true,
      });
    });

    describe('Happy path', () => {
      it('should copy text to clipboard using Clipboard API', async () => {
        const text = 'Hello World';
        const result = await copyToClipboard(text);

        expect(result).toBe(true);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
      });

      it('should copy empty string', async () => {
        const result = await copyToClipboard('');

        expect(result).toBe(true);
      });

      it('should copy long text', async () => {
        const longText = 'A'.repeat(10000);
        const result = await copyToClipboard(longText);

        expect(result).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should return false when Clipboard API fails', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
          },
          writable: true,
          configurable: true,
        });

        const result = await copyToClipboard('test');

        expect(result).toBe(false);
      });

      it('should use fallback when Clipboard API is not available', async () => {
        // Remove clipboard API
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        // Mock document.execCommand
        document.execCommand = vi.fn().mockReturnValue(true);

        const result = await copyToClipboard('test');

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });

      it('should return false when fallback fails', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        document.execCommand = vi.fn().mockReturnValue(false);

        const result = await copyToClipboard('test');

        expect(result).toBe(false);
      });
    });
  });

  describe('parseStatusFilter()', () => {
    describe('Happy path', () => {
      it('should parse comma-separated status string', () => {
        expect(parseStatusFilter('RUNNING,COMPLETED')).toEqual(['RUNNING', 'COMPLETED']);
      });

      it('should trim whitespace from each status', () => {
        expect(parseStatusFilter('RUNNING, COMPLETED ,  FAILED')).toEqual([
          'RUNNING',
          'COMPLETED',
          'FAILED',
        ]);
      });

      it('should filter out empty strings', () => {
        expect(parseStatusFilter('RUNNING,,COMPLETED')).toEqual(['RUNNING', 'COMPLETED']);
      });

      it('should handle single status', () => {
        expect(parseStatusFilter('RUNNING')).toEqual(['RUNNING']);
      });
    });

    describe('Edge cases', () => {
      it('should return empty array for undefined', () => {
        expect(parseStatusFilter(undefined)).toEqual([]);
      });

      it('should return empty array for empty string', () => {
        expect(parseStatusFilter('')).toEqual([]);
      });

      it('should return empty array for whitespace-only string', () => {
        expect(parseStatusFilter('   ')).toEqual([]);
      });

      it('should return empty array for only commas', () => {
        expect(parseStatusFilter(',,,,')).toEqual([]);
      });
    });
  });

  describe('isRunning()', () => {
    it('should return true for "RUNNING" status', () => {
      expect(isRunning('RUNNING')).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(isRunning('COMPLETED')).toBe(false);
      expect(isRunning('FAILED')).toBe(false);
      expect(isRunning('PARTIAL')).toBe(false);
      expect(isRunning('PENDING')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isRunning('running')).toBe(false);
      expect(isRunning('Running')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isRunning('')).toBe(false);
    });
  });

  describe('formatResponseTime()', () => {
    describe('Happy path', () => {
      it('should format times < 1000ms as milliseconds', () => {
        expect(formatResponseTime(100)).toBe('100 ms');
        expect(formatResponseTime(500)).toBe('500 ms');
        expect(formatResponseTime(999)).toBe('999 ms');
      });

      it('should format times >= 1000ms as seconds with 1 decimal', () => {
        expect(formatResponseTime(1000)).toBe('1.0 s');
        expect(formatResponseTime(1500)).toBe('1.5 s');
        expect(formatResponseTime(2345)).toBe('2.3 s');
        expect(formatResponseTime(10000)).toBe('10.0 s');
      });

      it('should round seconds to 1 decimal place', () => {
        expect(formatResponseTime(1234)).toBe('1.2 s'); // 1.234 -> 1.2
        expect(formatResponseTime(1567)).toBe('1.6 s'); // 1.567 -> 1.6
        expect(formatResponseTime(1999)).toBe('2.0 s'); // 1.999 -> 2.0
      });
    });

    describe('Edge cases', () => {
      it('should handle 0ms', () => {
        expect(formatResponseTime(0)).toBe('0 ms');
      });

      it('should handle boundary (999ms vs 1000ms)', () => {
        expect(formatResponseTime(999)).toBe('999 ms');
        expect(formatResponseTime(1000)).toBe('1.0 s');
      });

      it('should handle very large values', () => {
        expect(formatResponseTime(60000)).toBe('60.0 s'); // 1 minute
        expect(formatResponseTime(3600000)).toBe('3600.0 s'); // 1 hour
      });

      it('should handle negative values (data error)', () => {
        // Negative doesn't make sense, but test behavior
        expect(formatResponseTime(-100)).toBe('-100 ms');
      });
    });
  });

  describe('Integration tests', () => {
    it('should work together in typical scraper UI flow', () => {
      // Simulate scraper UI displaying run info
      const timestamp = new Date('2025-01-15T09:00:00Z').toISOString(); // 1.5h ago
      const duration = 125; // 2m 5s
      const successful = 95;
      const total = 100;

      const relativeTime = formatRelativeTime(timestamp);
      const durationFormatted = formatDuration(duration);
      const successRate = calculateSuccessRate(successful, total);
      const successColor = getSuccessRateColor(successRate);

      expect(relativeTime).toBe('1 godzinę temu');
      expect(durationFormatted).toBe('2m 5s');
      expect(successRate).toBe(95);
      expect(successColor.bg).toBe('bg-green-500');
      expect(successColor.label).toBe('Bardzo dobrze');
    });

    it('should handle stale data warning flow', () => {
      const timestamp = new Date('2025-01-15T10:20:00Z').toISOString(); // 10 min ago
      const isStale = isStaleData(timestamp, 5);
      const warningText = isStale ? 'Dane nieaktualne' : 'OK';

      expect(isStale).toBe(true);
      expect(warningText).toBe('Dane nieaktualne');
    });
  });
});
