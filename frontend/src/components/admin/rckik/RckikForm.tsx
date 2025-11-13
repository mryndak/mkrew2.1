import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { RckikFormProps, CreateRckikRequest, UpdateRckikRequest } from '@/lib/types/admin';

/**
 * Validation schema dla formularza RCKiK
 * Zgodnie z walidacją z API Plan i backendu
 */
const rckikFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa jest wymagana')
    .max(255, 'Nazwa nie może przekraczać 255 znaków'),
  code: z
    .string()
    .min(1, 'Kod jest wymagany')
    .max(50, 'Kod nie może przekraczać 50 znaków')
    .regex(/^[A-Z0-9-]+$/, 'Kod może zawierać tylko wielkie litery, cyfry i myślniki'),
  city: z
    .string()
    .min(1, 'Miasto jest wymagane')
    .max(100, 'Miasto nie może przekraczać 100 znaków'),
  address: z
    .string()
    .max(1000, 'Adres nie może przekraczać 1000 znaków')
    .optional()
    .or(z.literal('')),
  latitude: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= -90 && num <= 90;
    }, 'Szerokość geograficzna musi być w zakresie od -90 do 90')
    .or(z.literal('')),
  longitude: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= -180 && num <= 180;
    }, 'Długość geograficzna musi być w zakresie od -180 do 180')
    .or(z.literal('')),
  aliases: z.string().optional(), // Przechowujemy jako string (comma-separated), parsujemy przy submit
  active: z.boolean().optional(),
});

type RckikFormData = z.infer<typeof rckikFormSchema>;

/**
 * RckikForm - Formularz do dodawania/edycji centrum RCKiK
 *
 * Sekcje:
 * 1. Informacje podstawowe (nazwa, kod, miasto)
 * 2. Lokalizacja (adres, współrzędne GPS)
 * 3. Aliasy (dynamiczna lista alternatywnych nazw)
 * 4. Status (checkbox aktywności)
 *
 * Walidacja:
 * - Inline (onBlur)
 * - Submit (przed wysłaniem)
 * - Mapowanie błędów z API na pola
 *
 * US-019: Admin RCKiK Management
 */
export function RckikForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: RckikFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<RckikFormData>({
    resolver: zodResolver(rckikFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      city: initialData?.city || '',
      address: initialData?.address || '',
      latitude: initialData?.latitude || '',
      longitude: initialData?.longitude || '',
      aliases: initialData?.aliases ? initialData.aliases.join(', ') : '',
      active: initialData?.active !== undefined ? initialData.active : true,
    },
  });

  /**
   * Reset form when initialData changes
   */
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        code: initialData.code,
        city: initialData.city,
        address: initialData.address || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        aliases: initialData.aliases ? initialData.aliases.join(', ') : '',
        active: initialData.active,
      });
    }
  }, [initialData, reset]);

  /**
   * Submit handler
   */
  const onSubmitHandler = async (data: RckikFormData) => {
    try {
      // Parsuj aliasy (comma-separated string → array)
      const aliasesArray = data.aliases
        ? data.aliases
            .split(',')
            .map((alias) => alias.trim())
            .filter((alias) => alias !== '')
        : [];

      // Przygotuj payload
      const payload: CreateRckikRequest | UpdateRckikRequest = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        city: data.city.trim(),
        address: data.address && data.address.trim() !== '' ? data.address.trim() : undefined,
        latitude: data.latitude && data.latitude.trim() !== '' ? data.latitude.trim() : undefined,
        longitude: data.longitude && data.longitude.trim() !== '' ? data.longitude.trim() : undefined,
        aliases: aliasesArray.length > 0 ? aliasesArray : undefined,
        active: data.active,
      };

      await onSubmit(payload);
    } catch (error: any) {
      // Mapuj błędy z API na pola formularza
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        error.validationErrors.forEach((err: any) => {
          if (err.field) {
            setError(err.field as keyof RckikFormData, {
              type: 'server',
              message: err.message,
            });
          }
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
      {/* Sekcja 1: Informacje podstawowe */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Informacje podstawowe
        </h4>

        {/* Nazwa */}
        <Input
          label="Nazwa centrum *"
          placeholder="np. RCKiK Warszawa"
          error={errors.name?.message}
          {...register('name')}
          disabled={isSubmitting}
        />

        {/* Kod */}
        <Input
          label="Kod centrum *"
          placeholder="np. RCKIK-WAW"
          error={errors.code?.message}
          helperText="Wielkie litery, cyfry i myślniki. Kod będzie automatycznie skonwertowany na wielkie litery."
          {...register('code')}
          disabled={isSubmitting}
        />

        {/* Miasto */}
        <Input
          label="Miasto *"
          placeholder="np. Warszawa"
          error={errors.city?.message}
          {...register('city')}
          disabled={isSubmitting}
        />
      </div>

      {/* Sekcja 2: Lokalizacja */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Lokalizacja
        </h4>

        {/* Adres */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Adres
          </label>
          <textarea
            id="address"
            rows={3}
            placeholder="np. ul. Kasprzaka 17, 01-211 Warszawa"
            className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.address
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            } ${isSubmitting ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
            {...register('address')}
            disabled={isSubmitting}
          />
          {errors.address && (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {errors.address.message}
            </p>
          )}
        </div>

        {/* Współrzędne GPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Szerokość geograficzna"
            type="text"
            placeholder="np. 52.2319"
            error={errors.latitude?.message}
            helperText="Zakres: -90 do 90"
            {...register('latitude')}
            disabled={isSubmitting}
          />

          <Input
            label="Długość geograficzna"
            type="text"
            placeholder="np. 20.9728"
            error={errors.longitude?.message}
            helperText="Zakres: -180 do 180"
            {...register('longitude')}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Sekcja 3: Aliasy */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Aliasy
        </h4>

        <Input
          label="Alternatywne nazwy"
          placeholder="np. RCKiK Warszawa, RCKIK WAW, Centrum Krwiodawstwa Warszawa"
          error={errors.aliases?.message}
          helperText="Oddziel aliasy przecinkami. Każdy alias nie może przekraczać 255 znaków."
          {...register('aliases')}
          disabled={isSubmitting}
        />
      </div>

      {/* Sekcja 4: Status */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Status
        </h4>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="active"
              className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              {...register('active')}
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3">
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Centrum aktywne
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Nieaktywne centra są ukryte dla użytkowników, ale dane historyczne są zachowane.
            </p>
          </div>
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
              {mode === 'create' ? 'Dodawanie...' : 'Zapisywanie...'}
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {mode === 'create' ? 'Dodaj centrum' : 'Zapisz zmiany'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
