import { z } from 'zod';
import { ALL_BLOOD_GROUPS } from '@/lib/constants/bloodGroups';

/**
 * Zod schema dla walidacji formularza ręcznego snapshotu
 * US-028: Ręczne wprowadzanie stanów krwi
 */

/**
 * Schema dla tworzenia nowego snapshotu
 */
export const createBloodSnapshotSchema = z.object({
  rckikId: z
    .number({
      required_error: 'RCKiK jest wymagany',
      invalid_type_error: 'RCKiK musi być liczbą',
    })
    .positive('RCKiK jest wymagany'),

  snapshotDate: z
    .date({
      required_error: 'Data jest wymagana',
      invalid_type_error: 'Nieprawidłowa data',
    })
    .max(new Date(), 'Data nie może być z przyszłości')
    .refine(
      (date) => {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return date >= twoYearsAgo;
      },
      'Data nie może być starsza niż 2 lata'
    ),

  bloodGroup: z.enum(ALL_BLOOD_GROUPS as [string, ...string[]], {
    required_error: 'Grupa krwi jest wymagana',
    invalid_type_error: 'Nieprawidłowa grupa krwi',
  }),

  levelPercentage: z
    .number({
      required_error: 'Poziom jest wymagany',
      invalid_type_error: 'Poziom musi być liczbą',
    })
    .min(0, 'Poziom musi być co najmniej 0%')
    .max(100, 'Poziom nie może przekroczyć 100%')
    .refine(
      (val) => {
        // Sprawdź czy ma max 2 miejsca po przecinku
        const str = val.toString();
        const decimalPart = str.split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      'Poziom może mieć maksymalnie 2 miejsca po przecinku'
    ),

  notes: z
    .string()
    .max(500, 'Notatki nie mogą przekroczyć 500 znaków')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema dla aktualizacji snapshotu
 */
export const updateBloodSnapshotSchema = z.object({
  levelPercentage: z
    .number({
      required_error: 'Poziom jest wymagany',
      invalid_type_error: 'Poziom musi być liczbą',
    })
    .min(0, 'Poziom musi być co najmniej 0%')
    .max(100, 'Poziom nie może przekroczyć 100%')
    .refine(
      (val) => {
        const str = val.toString();
        const decimalPart = str.split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      'Poziom może mieć maksymalnie 2 miejsca po przecinku'
    ),

  notes: z
    .string()
    .max(500, 'Notatki nie mogą przekroczyć 500 znaków')
    .optional()
    .or(z.literal('')),
});

/**
 * TypeScript types derived from schemas
 */
export type CreateBloodSnapshotFormData = z.infer<typeof createBloodSnapshotSchema>;
export type UpdateBloodSnapshotFormData = z.infer<typeof updateBloodSnapshotSchema>;
