import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useManualTrigger } from '@/lib/hooks/scraper/useManualTrigger';
import { manualTriggerSchema, type ManualTriggerFormData } from '@/lib/utils/scraperValidation';
import type { RckikBasicDto } from '@/lib/types/scraper';

/**
 * ManualTriggerModal - Modal z formularzem do ręcznego uruchamiania scrapera
 *
 * Features:
 * - Select dla wyboru centrum (opcjonalny)
 * - Input dla custom URL (opcjonalny)
 * - Checkbox potwierdzenia
 * - Walidacja z Zod
 * - Loading state
 * - Error handling
 */

interface ManualTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (runId: number) => void;
  rckikOptions?: RckikBasicDto[];
}

export function ManualTriggerModal({
  isOpen,
  onClose,
  onSuccess,
  rckikOptions = [],
}: ManualTriggerModalProps) {
  const { triggerScraper, isTriggering } = useManualTrigger();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ManualTriggerFormData>({
    resolver: zodResolver(manualTriggerSchema),
    defaultValues: {
      rckikId: null,
      customUrl: '',
      confirmed: false,
    },
  });

  // Reset form gdy modal się otwiera
  useEffect(() => {
    if (isOpen) {
      reset({
        rckikId: null,
        customUrl: '',
        confirmed: false,
      });
    }
  }, [isOpen, reset]);

  // Watch dla walidacji w czasie rzeczywistym
  const confirmed = watch('confirmed');

  const onSubmit = async (data: ManualTriggerFormData) => {
    const result = await triggerScraper({
      rckikId: data.rckikId || undefined,
      url: data.customUrl || undefined,
    });

    if (result) {
      onSuccess?.(result.scraperId);
      onClose();
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isTriggering) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isTriggering, onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={!isTriggering ? onClose : undefined}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3
                    className="text-lg font-medium leading-6 text-gray-900"
                    id="modal-title"
                  >
                    Uruchom scraper ręcznie
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Wybierz opcje i potwierdź uruchomienie
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isTriggering}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                aria-label="Zamknij"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              {/* RCKiK Select */}
              <div className="mb-4">
                <label
                  htmlFor="rckikId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Centrum krwi (opcjonalnie)
                </label>
                <select
                  id="rckikId"
                  {...register('rckikId', {
                    setValueAs: (v) => (v === '' ? null : parseInt(v)),
                  })}
                  disabled={isTriggering}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Wszystkie centra (52)</option>
                  {rckikOptions.map((rckik) => (
                    <option key={rckik.id} value={rckik.id}>
                      {rckik.name} - {rckik.city}
                    </option>
                  ))}
                </select>
                {errors.rckikId && (
                  <p className="mt-1 text-sm text-red-600">{errors.rckikId.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Pozostaw puste aby uruchomić dla wszystkich centrów
                </p>
              </div>

              {/* Custom URL Input */}
              <div className="mb-4">
                <label
                  htmlFor="customUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Custom URL (opcjonalnie)
                </label>
                <input
                  type="text"
                  id="customUrl"
                  {...register('customUrl')}
                  disabled={isTriggering}
                  placeholder="https://rckik.example.pl/stany-krwi"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.customUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.customUrl.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Pozostaw puste aby użyć domyślnych URL z bazy
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="mb-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="confirmed"
                      type="checkbox"
                      {...register('confirmed')}
                      disabled={isTriggering}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded disabled:opacity-50"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="confirmed" className="font-medium text-gray-700">
                      Potwierdzam uruchomienie scrapera
                    </label>
                    <p className="text-gray-500">
                      Rozumiem, że to uruchomi proces scrapingu dla wybranych centrów
                    </p>
                  </div>
                </div>
                {errors.confirmed && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmed.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isTriggering}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isTriggering || !confirmed}
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm"
                >
                  {isTriggering ? (
                    <>
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uruchamianie...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Uruchom
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
