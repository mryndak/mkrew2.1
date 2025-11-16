import { z } from 'zod';

/**
 * Zod schema dla walidacji formularza konfiguracji parserów
 * US-029, US-030: Zarządzanie konfiguracją parserów dla RCKiK
 */

/**
 * Parser Types - enum
 */
export const PARSER_TYPES = ['JSOUP', 'SELENIUM', 'CUSTOM'] as const;

/**
 * Required CSS selector keys
 */
const REQUIRED_CSS_SELECTOR_KEYS = ['bloodGroupRow', 'bloodGroupName', 'levelPercentage'];

/**
 * Regex dla validacji cron expression
 * Wspiera standardowe cron (5 pól) oraz specjalne aliasy (@daily, @hourly, etc.)
 */
const CRON_REGEX =
  /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ){4}((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*))$/;

/**
 * Schema dla CSS Selector Config
 * JSON object z wymaganymi kluczami
 */
export const cssSelectorConfigSchema = z.object({
  container: z.string().optional(),
  bloodGroupRow: z.string().min(1, 'Selektor bloodGroupRow jest wymagany'),
  bloodGroupName: z.string().min(1, 'Selektor bloodGroupName jest wymagany'),
  levelPercentage: z.string().min(1, 'Selektor levelPercentage jest wymagany'),
  dateSelector: z.string().optional(),
  customFields: z.record(z.string()).optional(),
});

/**
 * Helper: walidacja JSON string z CSS selectors
 */
const validateCssSelectorsJson = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    const result = cssSelectorConfigSchema.safeParse(parsed);
    return result.success;
  } catch {
    return false;
  }
};

/**
 * Helper: pobranie błędów walidacji CSS selectors
 */
const getCssSelectorsErrors = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value);
    const result = cssSelectorConfigSchema.safeParse(parsed);
    if (!result.success) {
      return result.error.errors.map((err) => err.message);
    }
    return [];
  } catch {
    return ['Nieprawidłowy format JSON'];
  }
};

/**
 * Schema dla tworzenia nowej konfiguracji parsera
 */
export const createParserConfigSchema = z.object({
  rckikId: z
    .number({
      required_error: 'RCKiK jest wymagany',
      invalid_type_error: 'RCKiK musi być liczbą',
    })
    .positive('Wybierz centrum RCKiK'),

  parserType: z.enum(PARSER_TYPES, {
    required_error: 'Typ parsera jest wymagany',
    invalid_type_error: 'Nieprawidłowy typ parsera',
  }),

  sourceUrl: z
    .string({
      required_error: 'URL źródłowy jest wymagany',
    })
    .url('Nieprawidłowy format URL')
    .startsWith('https://', 'URL musi zaczynać się od https://')
    .max(2000, 'URL nie może przekraczać 2000 znaków'),

  cssSelectors: z
    .string({
      required_error: 'Selektory CSS są wymagane',
    })
    .refine(
      (value) => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      'Nieprawidłowy format JSON'
    )
    .refine(validateCssSelectorsJson, (value) => ({
      message: getCssSelectorsErrors(value).join(', ') || 'Brak wymaganych kluczy CSS selectors',
    })),

  scheduleCron: z
    .string({
      required_error: 'Harmonogram jest wymagany',
    })
    .regex(CRON_REGEX, 'Nieprawidłowe wyrażenie cron')
    .default('0 2 * * *'),

  timeoutSeconds: z
    .number({
      required_error: 'Timeout jest wymagany',
      invalid_type_error: 'Timeout musi być liczbą',
    })
    .int('Timeout musi być liczbą całkowitą')
    .min(10, 'Timeout musi wynosić co najmniej 10 sekund')
    .max(120, 'Timeout nie może przekraczać 120 sekund')
    .default(30),

  active: z.boolean().default(true),

  notes: z
    .string()
    .max(500, 'Notatki nie mogą przekroczyć 500 znaków')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema dla aktualizacji konfiguracji parsera
 * Uwaga: rckikId i parserType są immutable (nie można ich zmienić)
 */
export const updateParserConfigSchema = z.object({
  sourceUrl: z
    .string()
    .url('Nieprawidłowy format URL')
    .startsWith('https://', 'URL musi zaczynać się od https://')
    .max(2000, 'URL nie może przekraczać 2000 znaków')
    .optional(),

  cssSelectors: z
    .string()
    .refine(
      (value) => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      'Nieprawidłowy format JSON'
    )
    .refine(validateCssSelectorsJson, (value) => ({
      message: getCssSelectorsErrors(value).join(', ') || 'Brak wymaganych kluczy CSS selectors',
    }))
    .optional(),

  scheduleCron: z.string().regex(CRON_REGEX, 'Nieprawidłowe wyrażenie cron').optional(),

  timeoutSeconds: z
    .number()
    .int('Timeout musi być liczbą całkowitą')
    .min(10, 'Timeout musi wynosić co najmniej 10 sekund')
    .max(120, 'Timeout nie może przekraczać 120 sekund')
    .optional(),

  active: z.boolean().optional(),

  notes: z
    .string()
    .max(500, 'Notatki nie mogą przekroczyć 500 znaków')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema dla testowania parsera (URL override)
 */
export const testParserSchema = z.object({
  testUrl: z
    .string()
    .url('Nieprawidłowy format URL')
    .startsWith('https://', 'URL musi zaczynać się od https://')
    .max(2000, 'URL nie może przekraczać 2000 znaków')
    .optional()
    .or(z.literal('')),
});

/**
 * TypeScript types derived from schemas
 */
export type CreateParserConfigFormData = z.infer<typeof createParserConfigSchema>;
export type UpdateParserConfigFormData = z.infer<typeof updateParserConfigSchema>;
export type TestParserFormData = z.infer<typeof testParserSchema>;
export type CssSelectorConfig = z.infer<typeof cssSelectorConfigSchema>;

/**
 * Helper functions
 */

/**
 * Parsuje JSON string CSS selectors do obiektu
 */
export function parseCssSelectors(jsonString: string): CssSelectorConfig | null {
  try {
    const parsed = JSON.parse(jsonString);
    const result = cssSelectorConfigSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Konwertuje obiekt CSS selectors do JSON stringa
 */
export function stringifyCssSelectors(config: CssSelectorConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Waliduje cron expression (helper dla UI)
 */
export function isValidCronExpression(cron: string): boolean {
  return CRON_REGEX.test(cron);
}

/**
 * Przykłady cron expressions dla tooltipów
 */
export const CRON_EXAMPLES = [
  { cron: '0 2 * * *', description: 'Codziennie o 2:00' },
  { cron: '0 */6 * * *', description: 'Co 6 godzin' },
  { cron: '0 0 * * 0', description: 'Każdą niedzielę o północy' },
  { cron: '@daily', description: 'Codziennie o północy' },
  { cron: '@hourly', description: 'Co godzinę' },
];
