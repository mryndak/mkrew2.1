import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ALL_BLOOD_GROUPS } from '@/lib/constants/bloodGroups';
import { RckikSearchSelect } from './RckikSearchSelect';
import {
  createBloodSnapshotSchema,
  updateBloodSnapshotSchema,
  type CreateBloodSnapshotFormData,
  type UpdateBloodSnapshotFormData,
} from '@/lib/validation/bloodSnapshotSchema';
import type {
  BloodSnapshotResponse,
  CreateBloodSnapshotRequest,
  UpdateBloodSnapshotRequest,
  ModalMode,
} from '@/lib/types/bloodSnapshots';

/**
 * Props dla ManualSnapshotForm
 */
interface ManualSnapshotFormProps {
  mode: ModalMode;
  initialData?: BloodSnapshotResponse;
  onSubmit: (data: CreateBloodSnapshotRequest | UpdateBloodSnapshotRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * ManualSnapshotForm - Formularz dodawania/edycji ręcznego snapshotu krwi
 *
 * Pola (create mode):
 * - RCKiK ID (select - TODO: implement typeahead)
 * - Data snapshotu (date picker z ograniczeniami)
 * - Grupa krwi (select)
 * - Poziom procentowy (number input 0-100, 2 miejsca po przecinku)
 * - Notatki (textarea, max 500 znaków)
 *
 * Pola (edit mode):
 * - Poziom procentowy (edytowalny)
 * - Notatki (edytowalne)
 * - RCKiK, data, grupa krwi (read-only)
 *
 * Walidacja: React Hook Form + Zod
 * US-028: Ręczne wprowadzanie stanów krwi
 */
export function ManualSnapshotForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ManualSnapshotFormProps) {
  /**
   * Oblicz min i max daty
   */
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const maxDate = today.toISOString().split('T')[0];
  const minDate = twoYearsAgo.toISOString().split('T')[0];

  /**
   * Setup React Hook Form
   */
  const isEditMode = mode === 'edit';
  const schema = isEditMode ? updateBloodSnapshotSchema : createBloodSnapshotSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateBloodSnapshotFormData | UpdateBloodSnapshotFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          levelPercentage: initialData?.levelPercentage || 0,
          notes: initialData?.auditTrail?.notes || '',
        }
      : {
          rckikId: undefined,
          snapshotDate: new Date(),
          bloodGroup: '',
          levelPercentage: 0,
          notes: '',
        },
  });

  /**
   * Watch notes dla licznika znaków
   */
  const notes = watch('notes');
  const notesLength = notes?.length || 0;

  /**
   * Reset form when mode or initialData changes
   */
  useEffect(() => {
    if (isEditMode && initialData) {
      reset({
        levelPercentage: initialData.levelPercentage,
        notes: initialData.auditTrail?.notes || '',
      });
    } else if (!isEditMode) {
      reset({
        rckikId: undefined,
        snapshotDate: new Date(),
        bloodGroup: '',
        levelPercentage: 0,
        notes: '',
      });
    }
  }, [mode, initialData, reset, isEditMode]);

  /**
   * Handler submitu
   */
  const handleFormSubmit = async (data: any) => {
    try {
      if (isEditMode) {
        // Edit mode - tylko levelPercentage i notes
        await onSubmit({
          levelPercentage: Number(data.levelPercentage),
          notes: data.notes || '',
        });
      } else {
        // Create mode - wszystkie pola
        await onSubmit({
          rckikId: Number(data.rckikId),
          snapshotDate: data.snapshotDate.toISOString().split('T')[0], // Format YYYY-MM-DD
          bloodGroup: data.bloodGroup,
          levelPercentage: Number(data.levelPercentage),
          notes: data.notes || '',
        });
      }
    } catch (error) {
      console.error('Form submit error:', error);
      // Error handling jest w parent komponencie (przez toast)
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* RCKiK Select - tylko w create mode */}
      {!isEditMode && (
        <div>
          <label htmlFor="rckikId" className="block text-sm font-medium text-gray-700 mb-1">
            Centrum RCKiK <span className="text-red-500">*</span>
          </label>
          <Controller
            name="rckikId"
            control={control}
            render={({ field }) => (
              <RckikSearchSelect
                value={field.value || null}
                onChange={(id) => field.onChange(id)}
                error={errors.rckikId?.message}
                disabled={isSubmitting}
                required
              />
            )}
          />
          <p className="mt-1 text-xs text-gray-500">Wyszukaj centrum po nazwie lub kodzie</p>
        </div>
      )}

      {/* Data snapshotu - tylko w create mode, read-only w edit */}
      {!isEditMode && (
        <div>
          <label htmlFor="snapshotDate" className="block text-sm font-medium text-gray-700 mb-1">
            Data snapshotu <span className="text-red-500">*</span>
          </label>
          <Controller
            name="snapshotDate"
            control={control}
            render={({ field }) => (
              <input
                id="snapshotDate"
                type="date"
                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                min={minDate}
                max={maxDate}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
                  errors.snapshotDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            )}
          />
          {errors.snapshotDate && (
            <p className="mt-1 text-sm text-red-600">{errors.snapshotDate.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Data nie może być z przyszłości ani starsza niż 2 lata
          </p>
        </div>
      )}

      {/* Grupa krwi - tylko w create mode */}
      {!isEditMode && (
        <div>
          <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-1">
            Grupa krwi <span className="text-red-500">*</span>
          </label>
          <select
            id="bloodGroup"
            {...register('bloodGroup')}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
              errors.bloodGroup ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Wybierz grupę krwi...</option>
            {ALL_BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          {errors.bloodGroup && (
            <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
          )}
        </div>
      )}

      {/* Read-only fields w edit mode */}
      {isEditMode && initialData && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Dane snapshotu (niezmienne)</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">RCKiK:</span>
              <p className="font-medium text-gray-900">{initialData.rckikName}</p>
            </div>
            <div>
              <span className="text-gray-500">Data:</span>
              <p className="font-medium text-gray-900">
                {new Date(initialData.snapshotDate).toLocaleDateString('pl-PL')}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Grupa krwi:</span>
              <p className="font-medium text-gray-900">{initialData.bloodGroup}</p>
            </div>
          </div>
        </div>
      )}

      {/* Poziom procentowy - edytowalny w obu trybach */}
      <div>
        <label htmlFor="levelPercentage" className="block text-sm font-medium text-gray-700 mb-1">
          Poziom procentowy <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="levelPercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('levelPercentage', { valueAsNumber: true })}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
              errors.levelPercentage ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        </div>
        {errors.levelPercentage && (
          <p className="mt-1 text-sm text-red-600">{errors.levelPercentage.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Wartość od 0.00 do 100.00 (max 2 miejsca po przecinku)
        </p>
      </div>

      {/* Notatki - edytowalne w obu trybach */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notatki (opcjonalnie)
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register('notes')}
          disabled={isSubmitting}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 ${
            errors.notes ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Dodaj notatki dotyczące tego snapshotu..."
        />
        <div className="mt-1 flex items-center justify-between">
          <div>
            {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
          </div>
          <p
            className={`text-xs ${
              notesLength > 450 ? 'text-red-600 font-medium' : 'text-gray-500'
            }`}
          >
            {notesLength} / 500
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isSubmitting ? 'Zapisywanie...' : isEditMode ? 'Zaktualizuj' : 'Dodaj snapshot'}
        </button>
      </div>
    </form>
  );
}
