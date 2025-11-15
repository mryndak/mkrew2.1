import { describe, it, expect } from 'vitest';

/**
 * Example utility function to format dates
 * This is a placeholder - replace with your actual utility
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

describe('formatDate', () => {
  it('should format Date object to Polish locale', () => {
    const date = new Date('2025-11-15');
    const result = formatDate(date);

    expect(result).toBe('15.11.2025');
  });

  it('should format string date to Polish locale', () => {
    const dateString = '2025-11-15';
    const result = formatDate(dateString);

    expect(result).toBe('15.11.2025');
  });

  it('should handle different date formats', () => {
    const date = new Date('2025-01-01');
    const result = formatDate(date);

    expect(result).toBe('01.01.2025');
  });
});
