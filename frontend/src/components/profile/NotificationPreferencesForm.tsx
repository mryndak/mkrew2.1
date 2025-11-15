import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { NotificationPreferencesFormProps } from '@/types/profile';
import {
  notificationPreferencesSchema,
  NotificationFrequency,
  NOTIFICATION_FREQUENCY_LABELS,
} from '@/types/profile';
import type { NotificationPreferencesFormData } from '@/types/profile';

/**
 * NotificationPreferencesForm component
 *
 * Formularz zarządzania preferencjami powiadomień (email + in-app)
 *
 * Features:
 * - Email notifications: checkbox + frequency select
 * - In-app notifications: checkbox + frequency select
 * - Conditional disable: select disabled gdy checkbox unchecked
 * - Submit button z loading state
 * - Toast notifications po sukcesie/błędzie
 *
 * @param initialData - Początkowe preferencje użytkownika
 * @param onSave - Callback do zapisu (async)
 * @param onSuccess - Callback po sukcesie (dla toast)
 * @param onError - Callback po błędzie (dla toast)
 */
export const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  initialData,
  onSave,
  onSuccess,
  onError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form z Zod validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    setError,
  } = useForm<NotificationPreferencesFormData>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailEnabled: initialData.email.enabled,
      emailFrequency: initialData.email.frequency,
      inAppEnabled: initialData.inApp.enabled,
      inAppFrequency: initialData.inApp.frequency,
    },
  });

  // Watch checkbox values dla conditional disable
  const emailEnabled = watch('emailEnabled');
  const inAppEnabled = watch('inAppEnabled');

  /**
   * Submit handler
   */
  const onSubmit = async (data: NotificationPreferencesFormData) => {
    setIsSubmitting(true);

    try {
      await onSave(data);
      onSuccess('Preferencje powiadomień zostały zaktualizowane');
    } catch (error: any) {
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
        onError(error.message || 'Nie udało się zapisać preferencji');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Frequency options dla Select
   */
  const frequencyOptions = Object.entries(NOTIFICATION_FREQUENCY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-test-id="notification-preferences-container">
      {/* Card header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Preferencje powiadomień</h2>
        <p className="mt-1 text-sm text-gray-600">
          Zarządzaj sposobem, w jaki otrzymujesz powiadomienia
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-test-id="notification-preferences-form">
        {/* Email Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">Powiadomienia e-mail</h3>

          {/* Email Enabled Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="emailEnabled"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                data-test-id="email-notifications-checkbox"
                {...register('emailEnabled')}
              />
            </div>
            <div className="ml-3">
              <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">
                Włącz powiadomienia e-mail
              </label>
              <p className="text-sm text-gray-500">
                Otrzymuj powiadomienia na adres {initialData.userId ? 'e-mail' : 'e-mail'}
              </p>
            </div>
          </div>

          {/* Email Frequency Select */}
          <Select
            label="Częstotliwość powiadomień e-mail"
            options={frequencyOptions}
            disabled={!emailEnabled}
            error={errors.emailFrequency?.message}
            data-test-id="email-frequency-select"
            {...register('emailFrequency')}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* In-App Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">Powiadomienia w aplikacji</h3>

          {/* In-App Enabled Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="inAppEnabled"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                data-test-id="in-app-notifications-checkbox"
                {...register('inAppEnabled')}
              />
            </div>
            <div className="ml-3">
              <label htmlFor="inAppEnabled" className="text-sm font-medium text-gray-700">
                Włącz powiadomienia w aplikacji
              </label>
              <p className="text-sm text-gray-500">
                Wyświetlaj powiadomienia bezpośrednio w interfejsie aplikacji
              </p>
            </div>
          </div>

          {/* In-App Frequency Select */}
          <Select
            label="Częstotliwość powiadomień w aplikacji"
            options={frequencyOptions}
            disabled={!inAppEnabled}
            error={errors.inAppFrequency?.message}
            data-test-id="in-app-frequency-select"
            {...register('inAppFrequency')}
          />
        </div>

        {/* Info box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informacje o częstotliwości:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Wyłączone:</strong> Nie otrzymujesz żadnych powiadomień</li>
                <li><strong>Tylko krytyczne:</strong> Tylko najważniejsze powiadomienia (np. niski poziom krwi)</li>
                <li><strong>Codziennie:</strong> Podsumowanie dzienne o określonej porze</li>
                <li><strong>Natychmiast:</strong> Wszystkie powiadomienia w czasie rzeczywistym</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isDirty || isSubmitting}
            data-test-id="save-notification-preferences-button"
          >
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz preferencje'}
          </Button>
        </div>
      </form>
    </div>
  );
};
