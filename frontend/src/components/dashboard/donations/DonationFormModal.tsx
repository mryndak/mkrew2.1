import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { Button } from '@/components/ui/Button';
import type { DonationResponse } from '@/types/dashboard';
import type { SelectOption } from '@/components/ui/Select';
import type { AutocompleteOption } from '@/components/ui/Autocomplete';

/**
 * Zod schema dla formularza donacji
 */
const donationFormSchema = z.object({
  rckikId: z.number({
    required_error: 'Centrum RCKiK jest wymagane',
    invalid_type_error: 'Wybierz centrum RCKiK',
  }),
  donationDate: z.string().min(1, 'Data donacji jest wymagana'),
  quantityMl: z
    .number({
      required_error: 'Ilość jest wymagana',
      invalid_type_error: 'Podaj liczbę',
    })
    .min(50, 'Minimalna ilość to 50 ml')
    .max(1000, 'Maksymalna ilość to 1000 ml'),
  donationType: z.enum(['FULL_BLOOD', 'PLASMA', 'PLATELETS', 'OTHER'], {
    required_error: 'Typ donacji jest wymagany',
  }),
  notes: z.string().max(1000, 'Notatki nie mogą przekroczyć 1000 znaków').optional(),
});

type DonationFormData = z.infer<typeof donationFormSchema>;

export interface DonationFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  donation?: DonationResponse | null;
  availableRckiks: Array<{ id: number; name: string; city: string }>;
  lastDonationDate?: string | null;
  onClose: () => void;
  onSubmit: (data: DonationFormData) => Promise<void>;
}

/**
 * DonationFormModal - Modal z formularzem dodawania/edycji donacji
 *
 * Features:
 * - Tryb create/edit (readonly pola w edycji)
 * - React Hook Form + Zod validation
 * - Pola: RCKiK, data, ilość, typ, notatki
 * - Ostrzeżenie "56 dni" dla pełnej krwi
 * - Inline validation errors
 * - Confirmation przy zamykaniu z niezapisanymi zmianami
 * - Loading state podczas submit
 * - Obsługa błędów API
 *
 * @example
 * ```tsx
 * <DonationFormModal
 *   isOpen={isOpen}
 *   mode="create"
 *   availableRckiks={rckiks}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function DonationFormModal({
  isOpen,
  mode,
  donation,
  availableRckiks,
  lastDonationDate,
  onClose,
  onSubmit,
}: DonationFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      rckikId: donation?.rckik.id,
      donationDate: donation?.donationDate || '',
      quantityMl: donation?.quantityMl,
      donationType: donation?.donationType as 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER',
      notes: donation?.notes || '',
    },
  });

  // Watch fields for validation
  const watchDonationType = watch('donationType');
  const watchDonationDate = watch('donationDate');

  /**
   * Reset form when modal opens/closes
   */
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && donation) {
        reset({
          rckikId: donation.rckik.id,
          donationDate: donation.donationDate,
          quantityMl: donation.quantityMl,
          donationType: donation.donationType as 'FULL_BLOOD' | 'PLASMA' | 'PLATELETS' | 'OTHER',
          notes: donation.notes || '',
        });
      } else {
        reset({
          rckikId: undefined,
          donationDate: '',
          quantityMl: undefined,
          donationType: undefined,
          notes: '',
        });
      }
    }
  }, [isOpen, mode, donation, reset]);

  /**
   * Check for "56 days" warning for FULL_BLOOD
   */
  useEffect(() => {
    if (watchDonationType === 'FULL_BLOOD' && watchDonationDate && lastDonationDate) {
      try {
        const selectedDate = new Date(watchDonationDate);
        const lastDate = new Date(lastDonationDate);
        const diffTime = selectedDate.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setShowWarning(diffDays < 56 && diffDays >= 0);
      } catch (error) {
        setShowWarning(false);
      }
    } else {
      setShowWarning(false);
    }
  }, [watchDonationType, watchDonationDate, lastDonationDate]);

  /**
   * Handle form submit
   */
  const handleFormSubmit = async (data: DonationFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Form submit error:', error);
      // Errors are handled in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle close with unsaved changes confirmation
   */
  const handleClose = () => {
    if (isDirty) {
      const confirm = window.confirm(
        'Masz niezapisane zmiany. Czy na pewno chcesz zamknąć formularz?'
      );
      if (!confirm) return;
    }
    reset();
    onClose();
  };

  // RCKiK options for Autocomplete
  const rckikAutocompleteOptions: AutocompleteOption[] = availableRckiks.map((rckik) => ({
    value: rckik.id,
    label: rckik.name,
    subtitle: rckik.city,
  }));

  // Donation type options
  const donationTypeOptions: SelectOption[] = [
    { value: '', label: 'Wybierz typ', disabled: true },
    { value: 'FULL_BLOOD', label: 'Krew pełna' },
    { value: 'PLASMA', label: 'Osocze' },
    { value: 'PLATELETS', label: 'Płytki krwi' },
    { value: 'OTHER', label: 'Inne' },
  ];

  // Today's date for max attribute
  const today = new Date().toISOString().split('T')[0];

  // 5 years ago for min attribute
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const minDate = fiveYearsAgo.toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Dodaj donację' : 'Edytuj donację'}
      size="medium"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {mode === 'create' ? 'Dodaj' : 'Zaktualizuj'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Warning banner for 56 days */}
        {showWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Uwaga: Od ostatniej donacji pełnej krwi minęło mniej niż 56 dni
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Zalecana przerwa między donacjami pełnej krwi to 56 dni. Upewnij się, że data jest
                poprawna.
              </p>
            </div>
          </div>
        )}

        {/* RCKiK Autocomplete */}
        <Autocomplete
          label="Centrum RCKiK *"
          options={rckikAutocompleteOptions}
          value={watch('rckikId')}
          onChange={(value) => {
            setValue('rckikId', typeof value === 'number' ? value : parseInt(value as string, 10), {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
          error={errors.rckikId?.message}
          disabled={mode === 'edit'} // Readonly in edit mode
          placeholder="Szukaj centrum RCKiK..."
          noResultsText="Nie znaleziono centrum"
          minSearchLength={2}
        />

        {/* Donation Date */}
        <Input
          type="date"
          label="Data donacji *"
          error={errors.donationDate?.message}
          min={minDate}
          max={today}
          disabled={mode === 'edit'} // Readonly in edit mode
          {...register('donationDate')}
        />

        {/* Quantity */}
        <Input
          type="number"
          label="Ilość (ml) *"
          error={errors.quantityMl?.message}
          helperText="Zakres: 50-1000 ml"
          min={50}
          max={1000}
          step={50}
          {...register('quantityMl', {
            setValueAs: (v) => (v === '' ? undefined : parseInt(v, 10)),
          })}
        />

        {/* Donation Type */}
        <Select
          label="Typ donacji *"
          options={donationTypeOptions}
          error={errors.donationType?.message}
          {...register('donationType')}
        />

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
            Notatki (opcjonalne)
          </label>
          <textarea
            id="notes"
            rows={4}
            maxLength={1000}
            className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none ${
              errors.notes
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder="Dodatkowe informacje o donacji..."
            {...register('notes')}
          />
          <div className="mt-1.5 flex justify-between">
            {errors.notes && (
              <p className="text-sm text-red-600" role="alert">
                {errors.notes.message}
              </p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {watch('notes')?.length || 0} / 1000 znaków
            </p>
          </div>
        </div>

        {/* Info about required fields */}
        <p className="text-xs text-gray-500">* Pola wymagane</p>
      </form>
    </Modal>
  );
}
