import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SaveIndicator } from './SaveIndicator';
import { useDebouncedSave } from '@/lib/hooks/useDebouncedSave';
import type { ProfileFormProps } from '@/types/profile';
import { profileSchema, BLOOD_GROUPS } from '@/types/profile';
import type { ProfileFormData } from '@/types/profile';

/**
 * ProfileForm component
 *
 * Formularz edycji danych osobowych z automatycznym zapisem
 *
 * Features:
 * - Auto-save z debounce (2s)
 * - Immediate save on blur
 * - Inline validation (React Hook Form + Zod)
 * - Optimistic updates
 * - Rollback przy błędzie API
 * - Email readonly (nie można edytować)
 *
 * @param initialData - Dane początkowe profilu użytkownika
 * @param onSave - Callback do zapisu danych (async)
 * @param onError - Callback do obsługi błędów
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSave,
  onError,
}) => {
  const previousDataRef = useRef<ProfileFormData | null>(null);

  // React Hook Form z Zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
    setError,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange', // Inline validation
    defaultValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      bloodGroup: initialData.bloodGroup || null,
    },
  });

  // Watch all fields for auto-save
  const formData = watch();

  /**
   * Save function dla debounced save
   */
  const saveFn = async (data: ProfileFormData) => {
    try {
      // Store previous data for potential rollback
      previousDataRef.current = {
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        bloodGroup: initialData.bloodGroup || null,
      };

      // Call onSave prop (which calls API)
      await onSave({
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        bloodGroup: data.bloodGroup || undefined,
      });
    } catch (error: any) {
      // Rollback on error
      if (previousDataRef.current) {
        reset(previousDataRef.current);
      }

      // Handle validation errors from API
      if (error.response?.status === 400 && error.response?.data?.details) {
        const details = error.response.data.details;
        details.forEach((detail: { field: string; message: string }) => {
          setError(detail.field as any, {
            type: 'server',
            message: detail.message,
          });
        });
      } else {
        onError(error.message || 'Nie udało się zapisać zmian');
      }

      throw error; // Re-throw for useDebouncedSave to set error status
    }
  };

  // Debounced save hook
  const {
    debouncedSave,
    saveImmediately,
    status,
    lastSavedAt,
    resetError,
  } = useDebouncedSave(saveFn, 2000);

  /**
   * Trigger debounced save when form data changes
   */
  useEffect(() => {
    if (isDirty && !errors.firstName && !errors.lastName && !errors.bloodGroup) {
      debouncedSave(formData);
      resetError(); // Clear error status when user starts typing again
    }
  }, [formData, isDirty, errors, debouncedSave, resetError]);

  /**
   * Handle blur - immediate save if dirty
   */
  const handleBlur = async () => {
    if (isDirty && !errors.firstName && !errors.lastName && !errors.bloodGroup) {
      try {
        await saveImmediately(formData);
      } catch (error) {
        // Error already handled in saveFn
      }
    }
  };

  /**
   * Blood group options for Select
   */
  const bloodGroupOptions = [
    { value: '', label: 'Nie wybrano' },
    ...BLOOD_GROUPS.map((group) => ({
      value: group,
      label: group,
    })),
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Card header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Dane osobowe</h2>
        <SaveIndicator status={status} lastSavedAt={lastSavedAt} />
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit(() => {})}>
        {/* First Name */}
        <Input
          label="Imię"
          type="text"
          error={errors.firstName?.message}
          {...register('firstName')}
          onBlur={handleBlur}
          placeholder="Jan"
        />

        {/* Last Name */}
        <Input
          label="Nazwisko"
          type="text"
          error={errors.lastName?.message}
          {...register('lastName')}
          onBlur={handleBlur}
          placeholder="Kowalski"
        />

        {/* Blood Group */}
        <Select
          label="Grupa krwi"
          options={bloodGroupOptions}
          error={errors.bloodGroup?.message}
          {...register('bloodGroup')}
          onBlur={handleBlur}
        />

        {/* Email (readonly) */}
        <Input
          label="Email"
          type="email"
          value={initialData.email}
          disabled
          readOnly
          helperText="Email nie może być zmieniony"
          trailingIcon={
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="Email jest tylko do odczytu"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          }
        />

        {/* Info box */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-blue-800">
              Twoje zmiany są automatycznie zapisywane. Nie musisz klikać żadnego przycisku.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
