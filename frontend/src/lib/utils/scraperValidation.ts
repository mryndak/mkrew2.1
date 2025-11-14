import { z } from 'zod';

/**
 * Zod schemas dla walidacji formularzy Scraper
 */

/**
 * Schema dla formularza ręcznego triggerowania scrapera
 */
export const manualTriggerSchema = z.object({
  rckikIds: z
    .array(z.number().positive().int())
    .default([])
    .transform(val => {
      // Pusta tablica oznacza "wszystkie centra"
      return val;
    }),

  customUrl: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val || val.trim() === '') return true;
        return /^https?:\/\/.+/.test(val);
      },
      {
        message: 'URL musi zaczynać się od http:// lub https://',
      }
    )
    .transform(val => (val && val.trim() !== '' ? val.trim() : undefined)),

  confirmed: z
    .boolean()
    .refine(val => val === true, {
      message: 'Musisz potwierdzić uruchomienie scrapera',
    }),
});

/**
 * Inferred type z schema
 */
export type ManualTriggerFormData = z.infer<typeof manualTriggerSchema>;

/**
 * Schema dla filtrów listy runów
 */
export const runsFiltersSchema = z.object({
  runType: z.enum(['SCHEDULED', 'MANUAL']).optional().nullable(),

  status: z
    .array(z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL']))
    .optional(),

  fromDate: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      {
        message: 'Nieprawidłowy format daty',
      }
    ),

  toDate: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      {
        message: 'Nieprawidłowy format daty',
      }
    ),
}).refine(
  data => {
    if (data.fromDate && data.toDate) {
      const from = new Date(data.fromDate);
      const to = new Date(data.toDate);
      return from <= to;
    }
    return true;
  },
  {
    message: 'Data początkowa nie może być późniejsza niż data końcowa',
    path: ['fromDate'],
  }
).refine(
  data => {
    if (data.fromDate) {
      const from = new Date(data.fromDate);
      const now = new Date();
      return from <= now;
    }
    return true;
  },
  {
    message: 'Data początkowa nie może być w przyszłości',
    path: ['fromDate'],
  }
).refine(
  data => {
    if (data.toDate) {
      const to = new Date(data.toDate);
      const now = new Date();
      return to <= now;
    }
    return true;
  },
  {
    message: 'Data końcowa nie może być w przyszłości',
    path: ['toDate'],
  }
).refine(
  data => {
    if (data.fromDate && data.toDate) {
      const from = new Date(data.fromDate);
      const to = new Date(data.toDate);
      const diffMs = to.getTime() - from.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 365; // max 1 rok
    }
    return true;
  },
  {
    message: 'Zakres dat nie może przekraczać 1 roku',
    path: ['fromDate'],
  }
);

/**
 * Inferred type z schema
 */
export type RunsFiltersFormData = z.infer<typeof runsFiltersSchema>;
