import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { RckikSearchSelect } from '@/components/admin/blood-snapshots/RckikSearchSelect';
import { UrlInput } from './UrlInput';
import {
  createParserConfigSchema,
  updateParserConfigSchema,
  stringifyCssSelectors,
  parseCssSelectors,
  CRON_EXAMPLES,
  type CreateParserConfigFormData,
  type UpdateParserConfigFormData,
  type ParserType,
} from '@/lib/validation/parserConfigSchema';
import type { ParserConfigFormModalProps } from '@/lib/types/parserConfig';

/**
 * ParserConfigFormModal - Modal z formularzem do tworzenia i edycji konfiguracji parsera
 *
 * Features:
 * - React Hook Form + Zod validation
 * - Tryby: create/edit
 * - Pola immutable w trybie edit: rckikId, parserType
 * - Walidacja HTTPS URL, cron expression, timeout
 * - JSON Editor dla CSS selectors (TODO: Monaco Editor)
 * - Przyciski: Anuluj, Zapisz, Test i zapisz (TODO)
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów
 */
export function ParserConfigFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
}: ParserConfigFormModalProps) {
  const isEditMode = mode === 'edit';

  // Schema zależnie od trybu
  const schema = isEditMode ? updateParserConfigSchema : createParserConfigSchema;

  // React Hook Form
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEditMode && initialData
      ? {
          sourceUrl: initialData.sourceUrl,
          cssSelectors: stringifyCssSelectors(initialData.cssSelectors),
          scheduleCron: initialData.scheduleCron,
          timeoutSeconds: initialData.timeoutSeconds,
          active: initialData.active,
          notes: '',
        }
      : {
          rckikId: 0,
          parserType: 'CUSTOM' as ParserType,
          sourceUrl: '',
          cssSelectors: JSON.stringify(
            {
              bloodGroupRow: '',
              bloodGroupName: '',
              levelPercentage: '',
            },
            null,
            2
          ),
          scheduleCron: '0 2 * * *',
          timeoutSeconds: 30,
          active: true,
          notes: '',
        },
  });

  /**
   * Reset form przy zmianie trybu lub initialData
   */
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        reset({
          sourceUrl: initialData.sourceUrl,
          cssSelectors: stringifyCssSelectors(initialData.cssSelectors),
          scheduleCron: initialData.scheduleCron,
          timeoutSeconds: initialData.timeoutSeconds,
          active: initialData.active,
          notes: '',
        });
      } else {
        reset({
          rckikId: 0,
          parserType: 'CUSTOM' as ParserType,
          sourceUrl: '',
          cssSelectors: JSON.stringify(
            {
              bloodGroupRow: '',
              bloodGroupName: '',
              levelPercentage: '',
            },
            null,
            2
          ),
          scheduleCron: '0 2 * * *',
          timeoutSeconds: 30,
          active: true,
          notes: '',
        });
      }
    }
  }, [isOpen, mode, initialData, reset, isEditMode]);

  /**
   * Submit handler
   */
  const onSubmit = async (data: any) => {
    try {
      await onSave(data);
    } catch (err) {
      console.error('Form submit error:', err);
    }
  };

  /**
   * Modal footer z przyciskami
   */
  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anuluj
      </button>
      <button
        type="submit"
        form="parser-config-form"
        disabled={isSubmitting}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Zapisywanie...' : isEditMode ? 'Zapisz zmiany' : 'Utwórz konfigurację'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edytuj konfigurację parsera' : 'Dodaj konfigurację parsera'}
      size="large"
      footer={footer}
      closeOnOverlayClick={false}
    >
      <form id="parser-config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* RCKiK Select - tylko w trybie create */}
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
                  required
                />
              )}
            />
            {errors.rckikId && (
              <p className="mt-1 text-sm text-red-600">{errors.rckikId.message}</p>
            )}
          </div>
        )}

        {/* Parser Type - tylko w trybie create */}
        {!isEditMode && (
          <div>
            <label htmlFor="parserType" className="block text-sm font-medium text-gray-700 mb-1">
              Typ parsera <span className="text-red-500">*</span>
            </label>
            <select
              {...register('parserType')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="JSOUP">JSOUP (HTML parsing)</option>
              <option value="SELENIUM">Selenium (JavaScript rendering)</option>
              <option value="CUSTOM">Custom (własne selektory)</option>
            </select>
            {errors.parserType && (
              <p className="mt-1 text-sm text-red-600">{errors.parserType.message}</p>
            )}
          </div>
        )}

        {/* Immutable fields info w trybie edit */}
        {isEditMode && initialData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  <strong>RCKiK:</strong> {initialData.rckikName} ({initialData.rckikCode})
                  <br />
                  <strong>Typ parsera:</strong> {initialData.parserType}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Pola RCKiK i typ parsera nie mogą być zmienione po utworzeniu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Source URL */}
        <Controller
          name="sourceUrl"
          control={control}
          render={({ field }) => (
            <UrlInput
              value={field.value}
              onChange={field.onChange}
              error={errors.sourceUrl?.message}
              placeholder="https://rckik.rzeszow.pl/zapasy-krwi"
            />
          )}
        />

        {/* CSS Selectors - TODO: Replace with Monaco Editor */}
        <div>
          <label htmlFor="cssSelectors" className="block text-sm font-medium text-gray-700 mb-1">
            CSS Selectors (JSON) <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('cssSelectors')}
            rows={8}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder='{\n  "bloodGroupRow": "tr.blood-row",\n  "bloodGroupName": "td:nth-child(1)",\n  "levelPercentage": "td:nth-child(2) .percentage"\n}'
          />
          {errors.cssSelectors && (
            <p className="mt-1 text-sm text-red-600">{errors.cssSelectors.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Wymagane klucze: bloodGroupRow, bloodGroupName, levelPercentage
          </p>
        </div>

        {/* Schedule Cron */}
        <div>
          <label htmlFor="scheduleCron" className="block text-sm font-medium text-gray-700 mb-1">
            Harmonogram (cron) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('scheduleCron')}
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="0 2 * * *"
          />
          {errors.scheduleCron && (
            <p className="mt-1 text-sm text-red-600">{errors.scheduleCron.message}</p>
          )}
          <div className="mt-1 text-xs text-gray-500">
            Przykłady:
            {CRON_EXAMPLES.map((ex) => (
              <span key={ex.cron} className="ml-2">
                <code className="bg-gray-100 px-1 rounded">{ex.cron}</code> - {ex.description}
              </span>
            ))}
          </div>
        </div>

        {/* Timeout Seconds */}
        <div>
          <label
            htmlFor="timeoutSeconds"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Timeout (sekundy) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('timeoutSeconds', { valueAsNumber: true })}
            type="number"
            min={10}
            max={120}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.timeoutSeconds && (
            <p className="mt-1 text-sm text-red-600">{errors.timeoutSeconds.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Timeout HTTP request (10-120 sekund)</p>
        </div>

        {/* Active Checkbox */}
        <div className="flex items-center">
          <input
            {...register('active')}
            type="checkbox"
            id="active"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            Parser aktywny (automatyczne uruchamianie według harmonogramu)
          </label>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notatki
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            maxLength={500}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Opcjonalne notatki dotyczące konfiguracji..."
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
          <p className="mt-1 text-xs text-gray-500">Maksymalnie 500 znaków</p>
        </div>
      </form>
    </Modal>
  );
}
