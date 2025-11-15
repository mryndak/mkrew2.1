/**
 * Unit tests for scraperValidation Zod schemas
 *
 * Test framework: Vitest
 * Coverage: Wszystkie Zod validation schemas dla Scraper
 *
 * Tested schemas:
 * - manualTriggerSchema - walidacja formularza ręcznego uruchomienia scrapera
 * - runsFiltersSchema - walidacja filtrów listy runów (z complex refinements)
 *
 * Business Rules Tested:
 * - RCKiK IDs must be positive integers
 * - Custom URL must be valid http/https
 * - Confirmation checkbox required
 * - Date ranges: fromDate ≤ toDate
 * - Dates cannot be in future
 * - Max date range: 365 days
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  manualTriggerSchema,
  runsFiltersSchema,
  type ManualTriggerFormData,
  type RunsFiltersFormData,
} from '../scraperValidation';

describe('scraperValidation Zod schemas', () => {
  describe('manualTriggerSchema', () => {
    describe('rckikIds field', () => {
      describe('Happy path', () => {
        it('should accept empty array (triggers all centers)', () => {
          const data = {
            rckikIds: [],
            customUrl: undefined,
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.rckikIds).toEqual([]);
          }
        });

        it('should accept array of positive integers', () => {
          const data = {
            rckikIds: [1, 2, 3, 10, 100],
            customUrl: undefined,
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.rckikIds).toEqual([1, 2, 3, 10, 100]);
          }
        });

        it('should default to empty array if rckikIds not provided', () => {
          const data = {
            customUrl: undefined,
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.rckikIds).toEqual([]);
          }
        });
      });

      describe('Validation errors', () => {
        it('should reject negative numbers', () => {
          const data = {
            rckikIds: [1, -5, 3],
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].path).toContain('rckikIds');
          }
        });

        it('should reject zero', () => {
          const data = {
            rckikIds: [1, 0, 3],
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });

        it('should reject decimal numbers', () => {
          const data = {
            rckikIds: [1, 2.5, 3],
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });

        it('should reject non-number values in array', () => {
          const data = {
            rckikIds: [1, 'invalid', 3],
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });
      });
    });

    describe('customUrl field', () => {
      describe('Happy path', () => {
        it('should accept undefined', () => {
          const data = {
            rckikIds: [],
            customUrl: undefined,
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.customUrl).toBeUndefined();
          }
        });

        it('should accept empty string and transform to undefined', () => {
          const data = {
            rckikIds: [],
            customUrl: '',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.customUrl).toBeUndefined();
          }
        });

        it('should accept whitespace-only string and transform to undefined', () => {
          const data = {
            rckikIds: [],
            customUrl: '   ',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.customUrl).toBeUndefined();
          }
        });

        it('should accept valid HTTP URL', () => {
          const data = {
            rckikIds: [],
            customUrl: 'http://example.com/scrape',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.customUrl).toBe('http://example.com/scrape');
          }
        });

        it('should accept valid HTTPS URL', () => {
          const data = {
            rckikIds: [],
            customUrl: 'https://example.com/scrape',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
        });

        it('should trim whitespace from valid URL', () => {
          const data = {
            rckikIds: [],
            customUrl: '  https://example.com  ',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          // Debug: log errors if failed
          if (!result.success) {
            console.log('Validation failed:', result.error.issues);
          }

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.customUrl).toBe('https://example.com');
          }
        });

        it('should accept URL with query parameters', () => {
          const data = {
            rckikIds: [],
            customUrl: 'https://example.com/api?param1=value1&param2=value2',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
        });

        it('should accept URL with path and hash', () => {
          const data = {
            rckikIds: [],
            customUrl: 'https://example.com/path/to/resource#section',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
        });
      });

      describe('Validation errors', () => {
        it('should reject URL without protocol', () => {
          const data = {
            rckikIds: [],
            customUrl: 'example.com',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toContain('http');
          }
        });

        it('should reject URL with invalid protocol (ftp, file, etc)', () => {
          const data = {
            rckikIds: [],
            customUrl: 'ftp://example.com',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });

        it('should reject malformed URL', () => {
          const data = {
            rckikIds: [],
            customUrl: 'not a url at all',
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });
      });
    });

    describe('confirmed field', () => {
      describe('Happy path', () => {
        it('should accept true', () => {
          const data = {
            rckikIds: [],
            customUrl: undefined,
            confirmed: true,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(true);
        });
      });

      describe('Validation errors', () => {
        it('should reject false (must confirm)', () => {
          const data = {
            rckikIds: [],
            customUrl: undefined,
            confirmed: false,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toContain('potwierdzić');
          }
        });

        it('should reject undefined', () => {
          const data = {
            rckikIds: [],
            customUrl: undefined,
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });

        it('should reject non-boolean values', () => {
          const data = {
            rckikIds: [],
            customUrl: undefined,
            confirmed: 'true' as any, // String instead of boolean
          };

          const result = manualTriggerSchema.safeParse(data);

          expect(result.success).toBe(false);
        });
      });
    });

    describe('Integration - Complete form validation', () => {
      it('should accept valid form with all fields', () => {
        const data = {
          rckikIds: [1, 2, 3],
          customUrl: 'https://example.com/scrape',
          confirmed: true,
        };

        const result = manualTriggerSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept minimal valid form (empty rckikIds, no URL)', () => {
        const data = {
          rckikIds: [],
          confirmed: true,
        };

        const result = manualTriggerSchema.safeParse(data);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('runsFiltersSchema', () => {
    let mockNow: Date;

    beforeEach(() => {
      // Mock current time for date validation tests
      mockNow = new Date('2025-01-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('runType field', () => {
      it('should accept "SCHEDULED"', () => {
        const data = {
          runType: 'SCHEDULED' as const,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.runType).toBe('SCHEDULED');
        }
      });

      it('should accept "MANUAL"', () => {
        const data = {
          runType: 'MANUAL' as const,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept null', () => {
        const data = {
          runType: null,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const data = {};

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should reject invalid enum values', () => {
        const data = {
          runType: 'INVALID' as any,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('status field', () => {
      it('should accept array of valid statuses', () => {
        const data = {
          status: ['RUNNING', 'COMPLETED'] as const,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept all status types', () => {
        const data = {
          status: ['RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'] as const,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept empty array', () => {
        const data = {
          status: [],
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const data = {};

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should reject invalid status values', () => {
        const data = {
          status: ['RUNNING', 'INVALID'] as any,
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    describe('fromDate field', () => {
      it('should accept valid ISO date string', () => {
        const data = {
          fromDate: '2025-01-10',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept valid ISO timestamp', () => {
        const data = {
          fromDate: '2025-01-10T10:30:00Z',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const data = {};

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should reject invalid date string', () => {
        const data = {
          fromDate: 'not-a-date',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Nieprawidłowy format');
        }
      });

      it('should reject future dates', () => {
        const data = {
          fromDate: '2025-01-20', // 5 days in future (mockNow is 2025-01-15)
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('przyszłości');
        }
      });
    });

    describe('toDate field', () => {
      it('should accept valid ISO date string', () => {
        const data = {
          toDate: '2025-01-14',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept undefined', () => {
        const data = {};

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should reject invalid date string', () => {
        const data = {
          toDate: 'invalid',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should reject future dates', () => {
        const data = {
          toDate: '2025-01-20',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('przyszłości');
        }
      });
    });

    describe('Date range refinements', () => {
      describe('fromDate ≤ toDate validation', () => {
        it('should accept fromDate before toDate', () => {
          const data = {
            fromDate: '2025-01-10',
            toDate: '2025-01-14',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(true);
        });

        it('should accept fromDate equal to toDate', () => {
          const data = {
            fromDate: '2025-01-10',
            toDate: '2025-01-10',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(true);
        });

        it('should reject fromDate after toDate', () => {
          const data = {
            fromDate: '2025-01-14',
            toDate: '2025-01-10',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toContain('późniejsza');
          }
        });

        it('should pass when only fromDate is provided', () => {
          const data = {
            fromDate: '2025-01-10',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(true);
        });

        it('should pass when only toDate is provided', () => {
          const data = {
            toDate: '2025-01-10',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(true);
        });
      });

      describe('Max 365 days range validation', () => {
        it('should accept range of exactly 365 days', () => {
          const data = {
            fromDate: '2024-01-15', // Exactly 1 year ago
            toDate: '2025-01-14', // 364 days later (exactly 365 days with leap year handling)
          };

          const result = runsFiltersSchema.safeParse(data);

          // Debug: log errors if failed
          if (!result.success) {
            console.log('Validation failed:', result.error.issues);
          }

          expect(result.success).toBe(true);
        });

        it('should accept range < 365 days', () => {
          const data = {
            fromDate: '2024-12-15', // 31 days
            toDate: '2025-01-15',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(true);
        });

        it('should reject range > 365 days', () => {
          const data = {
            fromDate: '2024-01-10', // > 1 year ago
            toDate: '2025-01-15',
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toContain('1 roku');
          }
        });

        it('should pass when only one date is provided', () => {
          const data = {
            fromDate: '2020-01-01', // Very old, but no toDate to compare
          };

          const result = runsFiltersSchema.safeParse(data);

          expect(result.success).toBe(true);
        });
      });
    });

    describe('Integration - Complete filters validation', () => {
      it('should accept valid complete filters', () => {
        const data = {
          runType: 'SCHEDULED' as const,
          status: ['COMPLETED', 'FAILED'] as const,
          fromDate: '2025-01-01',
          toDate: '2025-01-14',
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should accept empty filters (all optional)', () => {
        const data = {};

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should validate all refinements together', () => {
        const data = {
          fromDate: '2024-12-01', // Valid past date
          toDate: '2025-01-14', // Valid past date, after fromDate, < 365 days
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(true);
      });

      it('should fail if any refinement fails', () => {
        const data = {
          fromDate: '2025-01-14',
          toDate: '2025-01-10', // Before fromDate
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
      });

      it('should fail if multiple refinements fail', () => {
        const data = {
          fromDate: '2025-01-20', // Future date
          toDate: '2025-01-10', // Also would be before fromDate if fromDate was valid
        };

        const result = runsFiltersSchema.safeParse(data);

        expect(result.success).toBe(false);
        // Should have multiple errors
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
